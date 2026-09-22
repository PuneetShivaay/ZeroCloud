"""
ZeroCloud — demo compute job.

Proves the end-to-end path:
  read a local input file -> run a real numeric workload on the best
  available device -> stream progress -> write output locally.

Uses PyTorch when installed; otherwise falls back to a pure-Python
implementation so the prototype runs before the runtime is provisioned.
"""
import argparse
import csv
import json
import os
import sys
import time
import traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from zc_protocol import ready, log, progress, result, error  # noqa: E402


# ----------------------------------------------------------------- input

def load_values(input_path: str | None) -> list[float]:
    """Read numbers from a CSV/TXT/JSON file, or synthesise them."""
    if not input_path:
        log("No input file supplied — generating synthetic data.")
        return [float(i % 97) / 97.0 for i in range(50_000)]

    p = Path(input_path)
    if not p.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")

    log(f"Reading {p.name} ({p.stat().st_size:,} bytes)")
    values: list[float] = []

    if p.suffix.lower() == ".json":
        data = json.loads(p.read_text(encoding="utf-8"))
        stack = [data]
        while stack:
            node = stack.pop()
            if isinstance(node, (int, float)) and not isinstance(node, bool):
                values.append(float(node))
            elif isinstance(node, list):
                stack.extend(node)
            elif isinstance(node, dict):
                stack.extend(node.values())
    else:
        with p.open(newline="", encoding="utf-8", errors="replace") as fh:
            for row in csv.reader(fh):
                for cell in row:
                    try:
                        values.append(float(cell))
                    except ValueError:
                        continue  # header or text column

    if not values:
        raise ValueError("No numeric values found in the input file.")

    log(f"Parsed {len(values):,} numeric values")
    return values


# --------------------------------------------------------------- compute

def pick_device(requested: str | None):
    """Return (torch_module_or_None, device_string)."""
    try:
        import torch
    except ImportError:
        log("PyTorch not installed — using pure-Python fallback.", level="warn")
        return None, "cpu (no-torch)"

    if requested and requested != "auto":
        return torch, requested
    if torch.cuda.is_available():
        return torch, "cuda"
    if getattr(getattr(torch, "backends", None), "mps", None) and torch.backends.mps.is_available():
        return torch, "mps"
    return torch, "cpu"


def run_torch(torch, device: str, values, size: int, iterations: int):
    """Matrix workload with progress reporting."""
    dev = torch.device(device)
    seed = torch.tensor(values[: size * size], dtype=torch.float32)

    needed = size * size
    if seed.numel() < needed:
        reps = (needed // seed.numel()) + 1
        seed = seed.repeat(reps)[:needed]

    a = seed.reshape(size, size).to(dev)
    b = (a.T * 0.5 + 0.1).contiguous()

    log(f"Matrix {size}x{size}, {iterations} iterations on {device}")
    checksum = 0.0
    t0 = time.perf_counter()

    for i in range(iterations):
        c = torch.matmul(a, b)
        c = torch.tanh(c / (size ** 0.5))
        checksum = float(c.sum().item())
        a = c
        progress((i + 1) / iterations * 100, stage="matmul",
                 message=f"iteration {i + 1}/{iterations}")

    if device == "cuda":
        torch.cuda.synchronize()
    elapsed = time.perf_counter() - t0

    flops = 2 * (size ** 3) * iterations
    return {
        "checksum": round(checksum, 6),
        "elapsedSec": round(elapsed, 3),
        "gflops": round(flops / elapsed / 1e9, 2),
        "backend": "pytorch",
    }


def run_fallback(values, size: int, iterations: int):
    """Pure-Python equivalent so the app is demonstrable without torch."""
    n = min(size, 120)  # keep pure-Python runtime sane
    needed = n * n
    data = (values * ((needed // len(values)) + 1))[:needed]
    a = [data[r * n:(r + 1) * n] for r in range(n)]
    b = [[a[c][r] * 0.5 + 0.1 for c in range(n)] for r in range(n)]

    log(f"Matrix {n}x{n}, {iterations} iterations (pure Python)")
    checksum = 0.0
    t0 = time.perf_counter()

    for it in range(iterations):
        out = []
        for r in range(n):
            row_a = a[r]
            out.append([sum(row_a[k] * b[k][c] for k in range(n)) / n for c in range(n)])
            progress(((it + r / n) / iterations) * 100, stage="matmul",
                     message=f"iteration {it + 1}/{iterations}, row {r + 1}/{n}")
        a = out
        checksum = sum(sum(row) for row in a)

    elapsed = time.perf_counter() - t0
    flops = 2 * (n ** 3) * iterations
    return {
        "checksum": round(checksum, 6),
        "elapsedSec": round(elapsed, 3),
        "gflops": round(flops / elapsed / 1e9, 4),
        "backend": "python-fallback",
    }


# ------------------------------------------------------------------ main

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input")
    ap.add_argument("--size", type=int, default=512)
    ap.add_argument("--iterations", type=int, default=40)
    ap.add_argument("--device", default="auto")
    ap.add_argument("--output-dir")
    args = ap.parse_args()

    try:
        torch, device = pick_device(args.device)
        ready(device=device,
              torch_version=getattr(torch, "__version__", None) if torch else None)
        progress(0, stage="loading", force=True)

        values = load_values(args.input)
        progress(5, stage="loaded", force=True)

        if torch is not None:
            metrics = run_torch(torch, device, values, args.size, args.iterations)
        else:
            metrics = run_fallback(values, args.size, args.iterations)

        metrics["device"] = device
        metrics["inputValues"] = len(values)

        out_dir = Path(args.output_dir) if args.output_dir else Path.home() / "ZeroCloud" / "output"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / f"result-{int(time.time())}.json"
        out_path.write_text(json.dumps({
            "input": args.input,
            "device": device,
            "metrics": metrics,
            "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
        }, indent=2), encoding="utf-8")

        progress(100, stage="done", force=True)
        log(f"Wrote {out_path}")
        result(output_path=str(out_path), **metrics)
        return 0

    except FileNotFoundError as exc:
        error("INVALID_INPUT", str(exc))
        return 2
    except ValueError as exc:
        error("INVALID_INPUT", str(exc))
        return 2
    except MemoryError:
        error("OOM", "Ran out of memory. Try a smaller matrix size.")
        return 3
    except KeyboardInterrupt:
        error("CANCELLED", "Job cancelled.")
        return 130
    except Exception as exc:
        msg = str(exc)
        if "out of memory" in msg.lower():
            error("CUDA_OOM", "GPU out of memory. Try a smaller matrix size.", detail=msg)
            return 3
        error("INTERNAL", msg, detail=traceback.format_exc())
        return 1


if __name__ == "__main__":
    sys.exit(main())
