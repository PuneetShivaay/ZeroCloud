# 05 — Roadmap & Status

**Last updated:** 2026-09-23

## Current phase

> **Phase 1 — Feasibility Prototype**
> Goal: prove end-to-end that a React UI can run a Python/PyTorch job on
> local hardware with live progress. **Not** production-ready.

---

## Phase 1 — Feasibility prototype

**Goal:** demonstrate the concept works.

| # | Task | Status |
|---|---|---|
| 1.1 | Create `docs/` and record decisions | ✅ Done |
| 1.2 | Electron main process + secure preload | ⬜ Not started |
| 1.3 | `python/probe.py` — hardware detection | ⬜ Not started |
| 1.4 | `python/jobs/demo_job.py` — NDJSON emitter | ⬜ Not started |
| 1.5 | `DesktopApp.jsx` — pick file, run, live logs | ⬜ Not started |
| 1.6 | Wire `package.json` + Vite for Electron | ⬜ Not started |
| 1.7 | Verify end-to-end on a real machine | ⬜ Not started |

**Simplifying assumption:** developer has Python installed. No runtime
installer yet.

**Exit criteria:** select a file → job runs on GPU → progress streams →
output displays → cancel works.

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

## Decisions pending

- [ ] Electron confirmed, or evaluate Tauri now?
- [ ] Windows-only for Phase 1?
- [ ] Is Python installed on the dev machine? GPU vendor?
- [ ] Demo job: synthetic matmul benchmark, or real input file (CSV/image)?
