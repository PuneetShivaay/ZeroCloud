# 02 — Architecture

**Status:** Proposed (pending final confirmation)
**Last updated:** 2026-09-23

## Why not a plain web app

A browser cannot spawn `python train.py` or access CUDA. The compute layer
requires OS-level process access, so a desktop shell is mandatory.

## Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Shell | **Electron** | Stay in JS; mature spawn/IPC/auto-update/code-signing |
| UI | **React 19 + Vite + Tailwind v4** | Already in the repo; zero migration cost |
| Bridge | **Electron IPC + `contextBridge`** | Renderer stays sandboxed, no Node in UI |
| Compute | **Python 3.12 + PyTorch** child process | Idiomatic ML code, decoupled from UI |
| Runtime mgmt | **`uv`** (~15 MB static binary, shipped) | Fast, lockfile-exact, own standalone CPython |
| Protocol | **NDJSON over stdout** | One JSON object per line; language-agnostic |
| Packaging | **electron-builder** (later) | NSIS installer, signing, auto-update |

### Electron vs Tauri

Tauri gives a 10–20 MB installer vs Electron's ~150 MB, plus a stricter
security model. Rejected **for now** because it adds Rust to the toolchain
for no prototype-stage benefit. Revisit before v1 ship — the React UI is
portable between them.

## System diagram

```
┌──────────────────── Electron ────────────────────┐
│                                                  │
│  Renderer (sandboxed)                            │
│  React UI — no fs, no Node, no shell             │
│            ▲ IPC events   │ IPC invoke           │
│  ──────────┼──────────────┼───────────────────   │
│  preload.cjs — contextBridge whitelist           │
│  ──────────┼──────────────┼───────────────────   │
│  Main process (Node.js)                          │
│   • RuntimeManager  detect / install env         │
│   • JobRunner       spawn / stream / kill        │
│   • HardwareProbe   CPU, GPU, VRAM, CUDA         │
└─────────────────────┬────────────────────────────┘
                      │ spawn(argv)
                      │ stdout: NDJSON
             ┌────────▼─────────┐
             │ Python + PyTorch │ ──► CUDA / MPS / CPU
             └──────────────────┘
```

## Core patterns

### 1. Process isolation
The UI never touches the OS. All privileged operations live in main.

### 2. Narrow contextBridge API
Expose ~6 named methods. **Never** a generic `exec`.
`contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.

### 3. Streaming over request/response
Jobs run for minutes. Main **pushes** `job:progress` / `job:log` events;
renderer subscribes. `invoke` is only for start / cancel / probe.

### 4. NDJSON contract
Python emits `print(json.dumps({...}), flush=True)`.
Event types: `progress`, `log`, `result`, `error`.
Keeps Python and JS fully decoupled. See [`04-ipc-contract.md`](./04-ipc-contract.md).

### 5. Runner interface
`LocalEnvRunner` now. `DockerRunner` can be added later without
touching the UI layer.

### 6. Consent gate
Every download, install, or file write goes through an explicit
confirmation dialog — mirrors the coding-agent UX pattern and reinforces
the privacy positioning.

### 7. No shell interpolation
Always `spawn(bin, [args])`. **Never** `shell: true`. Eliminates
command-injection surface.

### 8. Job registry + tree kill
Python spawns worker subprocesses. Cancellation must kill the entire
process tree, not just the parent.

## Folder layout

```
electron/
  main.cjs          window lifecycle, IPC handlers
  preload.cjs       contextBridge API surface
  runtime.cjs       python runtime detection / install
  jobs.cjs          spawn + NDJSON parsing + cancel
python/
  probe.py          hardware capabilities → JSON
  jobs/
    demo_job.py     sample compute, emits NDJSON
  requirements.txt
src/
  App.jsx           ← EXISTING web demo, untouched
  DesktopApp.jsx    ← new desktop UI
  main.jsx          switches based on `window.zerocloud`
docs/
```

## Preserving the existing demo

`src/main.jsx` chooses the root component at runtime:

```js
const isDesktop = Boolean(window.zerocloud)
render(isDesktop ? <DesktopApp /> : <App />)
```

`window.zerocloud` only exists when loaded through the Electron preload,
so browser/web-deploy behavior is **byte-for-byte unchanged**.

## Security posture

| Control | Setting |
|---|---|
| `nodeIntegration` | `false` |
| `contextIsolation` | `true` |
| `sandbox` | `true` |
| Remote content | Not loaded in the app window |
| Shell execution | Never (`argv` arrays only) |
| Navigation | `will-navigate` and `setWindowOpenHandler` blocked |
| CSP | Strict, no `unsafe-eval` in production |
