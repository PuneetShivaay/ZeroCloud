# 05 — Roadmap & Status

**Last updated:** 2026-09-23

## Current phase

> **Phase 1 — Feasibility Prototype**
> Goal: prove end-to-end that a React UI can run a Python/PyTorch job on
> local hardware with live progress. **Not** production-ready.
>
> **Status: substantially complete.** The desktop app launches, detects
> real hardware, and is wired to execute local Python. Remaining: confirm
> a full job run and cancellation on the dev machine.

---

## Phase 1 — Feasibility prototype

**Goal:** demonstrate the concept works.

| # | Task | Status |
|---|---|---|
| 1.1 | Create `docs/` and record decisions | ✅ Done |
| 1.2 | Electron main process + secure preload | ✅ Done |
| 1.3 | `python/probe.py` — hardware detection | ✅ Done — verified |
| 1.4 | `python/jobs/demo_job.py` — NDJSON emitter | ✅ Done — verified via CLI |
| 1.5 | `DesktopApp.jsx` — pick file, run, live logs | ✅ Done |
| 1.6 | Wire `package.json` + Vite for Electron | ✅ Done |
| 1.7 | Verify end-to-end in the app | 🟡 App launches + probe confirmed; job run/cancel pending |
| 1.8 | Download CTA on the web demo | ✅ Done |

**Simplifying assumption:** developer has Python installed. No runtime
installer yet.

**Exit criteria:** select a file → job runs → progress streams →
output displays → cancel works.

### What has been proven

| Layer | Evidence |
|---|---|
| Electron shell | Native window launches via `npm run electron:only` |
| Renderer switch | `DesktopApp` renders in Electron, `App` in the browser |
| preload → IPC | UI successfully invoked main-process handlers |
| Main → Python | `probe.py` spawned; JSON parsed and rendered |
| Hardware detection | i5-1245U / 12 threads, Intel UHD 2 GB, 15.6 GB RAM — all correct |
| Device fallback | Correctly resolved to `cpu`; torch absence surfaced in UI |
| NDJSON protocol | `demo_job.py` streamed progress and wrote a result file |

### Files delivered

```
electron/
  main.cjs        window lifecycle, IPC handlers, navigation lockdown
  preload.cjs     contextBridge — 11 whitelisted methods
  runtime.cjs     Python discovery (3.12 → 3.11 → 3.10)
  jobs.cjs        spawn, NDJSON line parser, registry, tree-kill cancel
python/
  probe.py        hardware capabilities → JSON (never throws)
  zc_protocol.py  emit helpers with progress throttling
  jobs/demo_job.py  CSV/JSON loader, torch + pure-Python backends
src/
  DesktopApp.jsx             desktop UI — probe, file pick, run, logs
  components/DownloadDesktop.jsx   web-demo download CTA
  config/release.js          release URLs (single source of truth)
  main.jsx                   runtime switch on `window.zerocloud`
```

### Notable implementation details

- **Security:** `contextIsolation: true`, `sandbox: true`,
  `nodeIntegration: false`, `will-navigate` blocked, external links
  forced to the system browser
- **No shell interpolation:** jobs spawn with argv arrays only
- **Job allowlist:** `JOB_SCRIPTS` map — the UI cannot supply arbitrary paths
- **Graceful degradation:** demo job runs a pure-Python fallback when
  PyTorch is absent, so the pipeline is demonstrable before Phase 2
- **Web demo preserved:** browser build renders the original `App.jsx`
  unchanged; only 2 lines were added to that file

---

## Phase 2 — Managed runtime

| # | Task | Status |
|---|---|---|
| 2.1 | Ship `uv` binary with the app | ⬜ |
| 2.2 | First-run consent screen | ⬜ |
| 2.3 | Download runtime w/ progress + resume + checksum | ⬜ |
| 2.4 | Hardware-matched torch variant (cu124 / MPS / CPU) | ⬜ |
| 2.5 | Post-install self-test | ⬜ |
| 2.6 | "Repair runtime" action | ⬜ |

**Exit criteria:** clean machine with no Python → working app, no admin rights.

---

## Phase 3 — Production hardening

| # | Task | Status |
|---|---|---|
| 3.1 | GPU OOM detection + auto-retry w/ smaller batch | ⬜ |
| 3.2 | Robust cancel (tree kill, orphan cleanup) | ⬜ |
| 3.3 | Structured error surfacing (plain language) | ⬜ |
| 3.4 | Job history + persisted logs | ⬜ |
| 3.5 | Consent gates for all file writes | ⬜ |
| 3.6 | Network auditor ("nothing left your machine" proof) | ⬜ |

---

## Phase 4 — Distribution

| # | Task | Status |
|---|---|---|
| 4.1 | electron-builder NSIS installer | ⬜ |
| 4.2 | Windows code signing | ⬜ |
| 4.3 | Auto-update channel | ⬜ |
| 4.4 | Offline/air-gapped installer variant | ⬜ |
| 4.5 | macOS build + notarization | ⬜ |

---

## Deferred / revisit later

| Item | Trigger to revisit |
|---|---|
| Tauri instead of Electron | Before v1 ship, if installer size matters |
| Docker runner | If scripts become user-supplied |
| `micromamba` instead of `uv` | If non-Python system libs are needed |
| Local LLM agent layer | After core compute path is solid |
| ONNX Runtime path | If models can be exported — much smaller footprint |

---

## Decisions resolved

| Question | Answer | Date |
|---|---|---|
| Electron or Tauri? | **Electron** for Phase 1 (ADR-0002) — reversible | 2026-09-23 |
| Target platform | **Windows-only** for Phase 1 | 2026-09-23 |
| Python on dev machine? | Yes — 3.14.0 and **3.12.4**; we pin 3.12 | 2026-09-23 |
| GPU on dev machine? | **No NVIDIA.** Intel UHD only → CPU path | 2026-09-23 |
| Demo job design | Reads a real file **and** runs a matmul workload | 2026-09-23 |
| Web/desktop relationship | Web demo becomes the **download page** | 2026-09-23 |

## Decisions pending

- [ ] Will scripts eventually be user-supplied? (drives sandboxing / Docker)
- [ ] Typical job duration — seconds, minutes, or hours?
- [ ] Must jobs survive an app restart?
- [ ] macOS / Linux timeline?
- [ ] Code-signing certificate — budget and vendor?
- [ ] Merge the download CTA to `main` now, or hold until a build exists?

---

## Known constraints discovered

| Constraint | Impact |
|---|---|
| Dev machine has **no NVIDIA GPU** | CUDA path cannot be verified locally — needs a test machine |
| Network performs **TLS interception** | Breaks Node `fetch` binary downloads; Phase 2 downloader must handle custom CAs. See [`known-issues.md`](./known-issues.md) |
| PyTorch lags new CPython | Must pin 3.12; never trust a bare `python` |
| Unsigned `.exe` triggers SmartScreen | Code signing is required before publishing a download link |
