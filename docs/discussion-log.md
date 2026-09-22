# Discussion Log

Chronological record of design discussions. Append new entries at the top.

---

## 2026-09-23 — Initial scoping

**Participants:** Puneet, GitHub Copilot

### Starting point
Existing repo is a **React 19 + Vite + Tailwind v4** web demo, already
deployed from `main`. Identified by: `vite.config.js` with
`@vitejs/plugin-react`, `"dev": "vite"` scripts, root `index.html` +
`src/main.jsx`, and no `next` dependency.

### Requirement introduced
Build an app that runs Python/PyTorch scripts on the **user's local
CPU/GPU**. User supplies an input file; computation is entirely local;
output returned in the UI. **No cloud compute.**

### Key realization
A browser cannot spawn processes or access CUDA → a desktop shell is
mandatory. → **ADR-0001**

### Options weighed
1. Electron — JS throughout, mature
2. Tauri — much smaller, needs Rust
3. Localhost Python server + browser — poor product UX
4. Hybrid shell + bundled FastAPI sidecar

Landed on Electron for Phase 1, reversible later. → **ADR-0002**

### Docker discussion
Asked whether Docker could package the environment. Analyzed and deferred:
- **macOS cannot do GPU passthrough in Docker at all** — decisive
- Docker Desktop is a heavy prereq, needs admin, WSL2 on Windows
- Commercially licensed above 250 employees / $10M revenue
- 6–12 GB images
→ **ADR-0005**. Keep a `Runner` interface so it can return later.

### Agent architecture discussion
Asked how the VS Code coding agent works locally. Clarified the split:
UI + agent loop + tool execution are **local**; only the LLM is remote.
The same skeleton maps directly onto ZeroCloud — swap "cloud LLM" for
"local GPU compute", and `run_in_terminal` for `run_pytorch_script`.

Noted future opportunity: an agent layer could auto-select scripts, probe
hardware to choose device/batch size, and auto-retry on GPU OOM.

### Python distribution decision
Proposal: don't bundle Python; detect it, and download on demand with
user consent — mirroring the agent's confirm-before-acting pattern.

Accepted, with one refinement: **do not use or install system Python.**
Install a private, app-owned runtime in the app data folder via `uv`.
Avoids version conflicts, needs no admin, and has zero blast radius.
→ **ADR-0003**

### Protocol decision
NDJSON over stdout chosen for Python → Node communication. Simple,
streaming, language-agnostic, easy to debug. → **ADR-0004**

### Process
Created branch `feature/desktop-local-compute` to protect the deployed
demo on `main`. Created `docs/` before writing any code.

### Open questions carried forward
1. Electron confirmed, or evaluate Tauri now?
2. Windows-only for Phase 1, or macOS/Linux too?
3. Is Python installed on the dev machine? Which GPU?
4. Demo job — synthetic matmul benchmark, or real input file?
5. Will scripts eventually be user-supplied? (drives sandboxing)
6. Typical job duration?

### Next step
On answers: scaffold Electron main + preload, `probe.py`, `demo_job.py`,
and `DesktopApp.jsx` for an end-to-end feasibility run.
