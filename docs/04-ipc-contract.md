# 04 — IPC & Message Contract

**Status:** Proposed
**Last updated:** 2026-09-23

Two boundaries must be defined:

1. **Renderer ↔ Main** — Electron IPC via `contextBridge`
2. **Main ↔ Python** — NDJSON over stdout

---

## 1. Renderer ↔ Main

Exposed on `window.zerocloud` by `preload.cjs`. Deliberately narrow —
no generic `exec`, no arbitrary path access.

### Request/response (`ipcRenderer.invoke`)

| Method | Args | Returns |
|---|---|---|
| `probeHardware()` | — | `HardwareInfo` |
| `selectInputFile()` | — | `{ path, name, size } \| null` |
| `startJob(opts)` | `{ jobType, inputPath, params }` | `{ jobId }` |
| `cancelJob(jobId)` | `string` | `{ cancelled: boolean }` |
| `getRuntimeStatus()` | — | `{ ready, pythonVersion, torchVersion, device }` |
| `openOutputFolder(path)` | `string` | `void` |

### Events (main → renderer)

| Channel | Payload |
|---|---|
| `job:progress` | `{ jobId, pct, stage, message? }` |
| `job:log` | `{ jobId, level, line, ts }` |
| `job:result` | `{ jobId, outputPath, metrics }` |
| `job:error` | `{ jobId, code, message, detail? }` |
| `job:done` | `{ jobId, exitCode, durationMs }` |

Subscription returns an unsubscribe function:

```js
const off = window.zerocloud.onJobLog(({ jobId, line }) => { ... })
// later
off()
```

### Type sketches

```ts
type HardwareInfo = {
  os: 'win32' | 'darwin' | 'linux'
  arch: string
  cpu: { model: string; cores: number; threads: number }
  ram: { totalGB: number; freeGB: number }
  gpus: Array<{
    vendor: 'nvidia' | 'amd' | 'apple' | 'intel' | 'unknown'
    name: string
    vramGB: number | null
    driver: string | null
  }>
  accel: { cuda: boolean; mps: boolean; rocm: boolean }
  recommendedDevice: 'cuda' | 'mps' | 'cpu'
}
```

---

## 2. Main ↔ Python (NDJSON)

Python writes **one JSON object per line** to stdout, always flushed.
Anything unparseable is treated as a raw log line (never crashes the parser).

```python
import json, sys

def emit(event, **kw):
    print(json.dumps({"event": event, **kw}), flush=True)

emit("progress", pct=42, stage="inference")
emit("log", level="info", line="Loaded model in 1.2s")
emit("result", output_path="C:/.../out.json", metrics={"rmse": 0.031})
emit("error", code="CUDA_OOM", message="Out of memory on device 0")
```

### Event schema

| `event` | Fields | Meaning |
|---|---|---|
| `ready` | `device`, `torch_version` | Script started, device selected |
| `progress` | `pct` (0–100), `stage`, `message?` | Progress update |
| `log` | `level`, `line` | Human-readable log |
| `result` | `output_path`, `metrics` | Terminal success |
| `error` | `code`, `message`, `detail?` | Terminal failure |

### Rules

- **stdout is the protocol.** Debug/tracebacks go to **stderr** only.
- Always `flush=True` — Python buffers aggressively when piped.
- Spawn with `PYTHONUNBUFFERED=1` as a belt-and-braces measure.
- Throttle `progress` to ~10/sec max; a tight training loop will flood IPC.
- Exactly one terminal event (`result` **or** `error`) per job.

### Error codes

| Code | Meaning |
|---|---|
| `CUDA_OOM` | GPU out of memory — suggest smaller batch |
| `INVALID_INPUT` | Input file unreadable or wrong format |
| `DEVICE_UNAVAILABLE` | Requested device not present |
| `CANCELLED` | Killed by user |
| `INTERNAL` | Unhandled exception (detail carries traceback) |

---

## Cancellation

1. Renderer calls `cancelJob(jobId)`
2. Main looks up the job in the registry
3. Windows: `taskkill /pid <pid> /T /F` — **`/T` kills the tree**
   POSIX: `process.kill(-pgid, 'SIGTERM')`, then `SIGKILL` after grace period
4. Main emits `job:done` with `exitCode: null, cancelled: true`

PyTorch DataLoader workers are separate processes — killing only the parent
leaves orphans holding VRAM. Tree kill is mandatory, not optional.
