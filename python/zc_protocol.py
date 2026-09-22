"""
ZeroCloud — NDJSON emit helpers.

stdout is the protocol: one JSON object per line, always flushed.
Diagnostics belong on stderr.
See docs/decisions/0004-ndjson-protocol.md
"""
import json
import sys
import time

_last_progress = 0.0
_PROGRESS_MIN_INTERVAL = 0.1  # throttle to ~10/sec so IPC is not flooded


def emit(event: str, **fields) -> None:
    """Write one NDJSON event to stdout."""
    sys.stdout.write(json.dumps({"event": event, **fields}) + "\n")
    sys.stdout.flush()


def ready(device: str, **fields) -> None:
    emit("ready", device=device, **fields)


def log(line: str, level: str = "info") -> None:
    emit("log", level=level, line=line)


def progress(pct: float, stage: str = "", message: str | None = None, force: bool = False) -> None:
    """Throttled progress update. Always emits at 0 and 100."""
    global _last_progress
    now = time.monotonic()
    if not force and 0 < pct < 100 and (now - _last_progress) < _PROGRESS_MIN_INTERVAL:
        return
    _last_progress = now
    emit("progress", pct=round(float(pct), 2), stage=stage, message=message)


def result(output_path: str | None = None, **metrics) -> None:
    """Terminal success event."""
    emit("result", output_path=output_path, metrics=metrics)


def error(code: str, message: str, detail: str | None = None) -> None:
    """Terminal failure event."""
    emit("error", code=code, message=message, detail=detail)
