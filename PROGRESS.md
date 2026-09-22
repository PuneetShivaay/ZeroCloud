# ZeroCloud — Current Status

> **Quick snapshot.** For long-term planning see [`docs/05-roadmap.md`](./docs/05-roadmap.md).
> For *why* decisions were made see [`docs/decisions/`](./docs/decisions/).

**Updated:** 2026-09-23
**Branch:** `feature/desktop-local-compute`
**Phase:** 1 — Feasibility Prototype

---

## 🟢 Where we are

**Feasibility is proven.** The desktop app launches, reads real hardware,
and is wired to execute local Python. The architecture works.

```
Electron window
  └─ React UI (existing stack, unchanged)
       └─ preload bridge (sandboxed, 11 methods)
            └─ Node main process
                 └─ Python 3.12 child process
                      └─ real hardware
```

---

## ✅ Working now

| Capability | Verified how |
|---|---|
| Desktop window launches | `npm run electron:only` |
| Desktop vs web UI switch | `window.zerocloud` detection |
| Hardware detection | Correct CPU / GPU / RAM shown in app |
| Device fallback logic | Resolved to `cpu`, torch absence surfaced |
| Python job execution | `demo_job.py` verified via CLI |
| NDJSON streaming | Progress + logs + result events parsed |
| Output file writing | `~\ZeroCloud\output\result-*.json` |
| Web demo preserved | Browser still renders original `App.jsx` |
| Download CTA | Builds clean; disabled until a release exists |

---

## 🟡 In progress

| Item | Blocker |
|---|---|
| Full job run **inside the app** | Needs a manual click-through: Run → logs → result |
| Cancel button verification | Set iterations high, then cancel mid-run |
| Input file → Python path | Pick a CSV and confirm it reaches the script |

---

## 🔜 Next up

1. **Install CPU PyTorch** — flips backend from `python-fallback` to real tensors, no code changes
   ```
   py -3.12 -m pip install torch --index-url https://download.pytorch.org/whl/cpu
   ```
2. **electron-builder** — produce an actual `ZeroCloud-Setup-0.1.0.exe`
3. **Phase 2** — managed runtime with consent screen and download

---

## ⚠️ Known blockers

| Issue | Impact | Status |
|---|---|---|
| **No NVIDIA GPU on dev machine** | CUDA path unverifiable locally | Needs a test machine |
| **Network TLS interception** | Breaks Node binary downloads | Worked around manually; Phase 2 downloader must handle custom CAs |
| **No code-signing certificate** | SmartScreen will scare users off | Required before publishing any download link |
| **PyTorch lags CPython** | 3.14 unusable | Pinned to 3.12 in `runtime.cjs` |

Details in [`docs/known-issues.md`](./docs/known-issues.md).

---

## 🧭 Open questions

- Will scripts eventually be **user-supplied**? (decides Docker/sandboxing)
- Typical job duration — seconds, minutes, hours?
- macOS / Linux timeline?
- Merge the download CTA to `main` now, or wait for a real build?

---

## 📍 Commits on this branch

```
0b34fb8  feat: add desktop app download section to web demo
6cce7f8  docs: record Phase 1 progress and environment issues
36f9d97  feat: Electron desktop shell with local Python execution
2121c15  docs: add project documentation
```

`main` remains untouched — the deployed demo is unaffected.

---

## How to run

```powershell
# Web demo (browser)
npm run dev

# Desktop app — both together
npm run desktop

# Desktop app — attach to a running dev server
npm run electron:only
```

---

### Maintenance rule

| File | Purpose | Update frequency |
|---|---|---|
| `PROGRESS.md` (this) | Current snapshot | Every work session |
| `docs/05-roadmap.md` | Phase planning | When scope changes |
| `docs/discussion-log.md` | Historical record | Append-only |
| `docs/decisions/` | Why we chose things | Immutable once accepted |

Keep this file **short**. If an entry needs more than two lines of
explanation, it belongs in `docs/`.
