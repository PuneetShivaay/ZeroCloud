# ADR-0003 — App-owned Python runtime, not system Python

**Status:** Proposed
**Date:** 2026-09-23

## Context

The app must run PyTorch on the user's machine. Options:

1. Require the user to install Python + PyTorch themselves
2. Detect and use whatever Python is on the system
3. Install system Python on their behalf
4. Ship a private, app-owned runtime

Users have internet available, so a one-time download is acceptable.

## Decision

Install a **private, app-owned Python runtime** into the app's data
directory, downloaded on first run **after explicit user consent**.

We do not install system Python and do not depend on an existing one.
Managed via the **`uv`** binary shipped inside the app.

Location:
```
Windows   %LOCALAPPDATA%\ZeroCloud\runtime\
macOS     ~/Library/Application Support/ZeroCloud/runtime/
Linux     ~/.local/share/ZeroCloud/runtime/
```

## Consequences

**Positive**
- Exact, pinned, reproducible environment for every user
- Zero blast radius — cannot break the user's other Python projects
- No admin rights, no PATH modification
- Small base installer (~50–100 MB); only the needed CUDA variant downloads
- Clean uninstall: delete one folder
- Fully offline after setup — reinforces the product promise

**Negative**
- 2–3 GB first-run download for CUDA builds
- Must build download infrastructure: resume, checksums, proxy support
- Disk usage duplicated if the user already has PyTorch
- Antivirus may flag downloading and executing binaries

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| Require manual user install | Support nightmare; version drift; bad UX for non-technical users |
| Use existing system Python | Unpredictable versions; dependency conflicts; risk of breaking user projects |
| Install system Python for them | Needs admin; pollutes PATH; can break existing setups |
| Bundle everything in installer | 3–6 GB download even for users who never run a job |
| PyInstaller frozen binary | Painful with PyTorch — hidden imports, CUDA DLLs, slow startup |

## Tooling: `uv` vs `micromamba`

**Chosen: `uv`** — ~15 MB static binary, installs standalone CPython,
very fast, hash-pinned lockfiles.

**`micromamba`** remains the fallback if non-Python system libraries
(ffmpeg, OpenCV natives) become a requirement — conda-forge handles those
better than PyPI.

## Notes

PyTorch CUDA wheels bundle the CUDA runtime. Users need only a recent
**NVIDIA driver**, not the CUDA Toolkit. This significantly lowers the
prerequisite bar and must be communicated clearly in setup UI.
