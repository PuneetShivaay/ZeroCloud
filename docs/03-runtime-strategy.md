# 03 — Python Runtime Strategy

**Status:** Proposed
**Last updated:** 2026-09-23

## Decision

Ship a **small installer**. On first run, detect hardware, ask the user
for consent, then download a **private, app-owned Python runtime**.

We do **not** install system Python and do **not** use the user's existing
Python installation.

## Why a private runtime

| Using system Python | Private managed runtime |
|---|---|
| Version roulette (3.9? 3.13?) | We pin the exact version |
| Their packages conflict with ours | Fully isolated |
| We can break their other projects | Zero blast radius |
| Needs admin rights, PATH edits | No admin, no PATH pollution |
| Endless support tickets | Reproducible for every user |
| Uninstall leaves junk behind | Delete one folder, gone |

System Python may still be **detected** — only to inform the user that
ZeroCloud uses its own isolated runtime. We never depend on it.

## Install location

```
Windows   %LOCALAPPDATA%\ZeroCloud\runtime\
macOS     ~/Library/Application Support/ZeroCloud/runtime/
Linux     ~/.local/share/ZeroCloud/runtime/
```

## Tooling: `uv`

- Single ~15 MB static binary, shipped inside the app
- `uv python install 3.12` → standalone CPython, no admin
- `uv pip install -r requirements.lock` → extremely fast, hash-pinned
- Handles CUDA wheel variants via index URLs

**Alternative considered:** `micromamba` (~5 MB). Better when non-Python
system libraries are needed (ffmpeg, OpenCV natives). Switch if that
becomes a requirement.

**Rejected:** PyInstaller/Nuitka — painful with PyTorch (hidden imports,
CUDA DLLs, huge binaries, slow startup).

## Setup sequence

```
1. Probe hardware
   └─ OS, arch, GPU vendor, driver version, CUDA capability, VRAM, free disk

2. Resolve runtime plan
   ├─ NVIDIA + recent driver → torch cu124   (~2.4 GB)
   ├─ Apple Silicon          → torch MPS     (~0.9 GB)
   ├─ AMD on Linux           → torch ROCm    (~2.8 GB)
   └─ otherwise              → torch CPU     (~0.2 GB)

3. Consent screen  ← user approves download size + install location

4. Download + verify
   └─ SHA-256 per artifact, resumable, progress bar, cancellable

5. Create isolated env, install from lockfile

6. Self-test
   └─ import torch; torch.cuda.is_available(); tiny matmul on device

7. Persist manifest (versions + hashes), mark ready
```

## Consent screen (reference)

```
┌──────────────────────────────────────────────┐
│  ZeroCloud — First-time setup                │
│                                              │
│  ✓ Detected: Windows 11, RTX 4080 (CUDA 12)  │
│  ✗ Python runtime not found                  │
│                                              │
│  ZeroCloud needs a Python environment to run │
│  computations on your machine.               │
│                                              │
│  Download size:  ~2.4 GB                     │
│  Disk required:  ~5.1 GB                     │
│  Location: %LOCALAPPDATA%\ZeroCloud\runtime  │
│                                              │
│  One-time download. ZeroCloud then works     │
│  fully offline.                              │
│                                              │
│         [ Cancel ]     [ Install ]           │
└──────────────────────────────────────────────┘
```

## Known hazards

| Hazard | Mitigation |
|---|---|
| Disk full / no write permission | Preflight check **before** downloading |
| Dropped connection mid-download | HTTP range requests, resumable, checksummed |
| Corporate proxy / TLS inspection | Honor `HTTP_PROXY`/`HTTPS_PROXY`, custom CA support || Antivirus / SmartScreen flags | Code-sign the app; document known false positives |
| Air-gapped machines | Optional offline "full" installer, same codepath |
| Corrupted runtime | "Repair runtime" action — verify manifest, re-fetch |
| Old NVIDIA driver | Detect and show exact required version + link |
| Dependency drift | Pin exact versions; full transitive lockfile with hashes |

**Note:** PyTorch CUDA wheels bundle the CUDA runtime. Users need only a
recent **NVIDIA driver** — not the CUDA Toolkit.

## Docker — considered and deferred

**Pros:** perfect reproducibility, strong sandboxing, resource caps.

**Cons that ruled it out for v1:**
- **No GPU access on macOS** — Docker Desktop cannot expose the GPU
- Requires Docker Desktop (heavy prereq, admin rights, WSL2 on Windows)
- Docker Desktop is commercially licensed above 250 employees / $10M revenue
- 6–12 GB images
- Bind-mount path/permission friction on Windows

**Revisit if:** scripts become user-supplied (sandboxing becomes critical),
or targets narrow to Linux / IT-managed machines.

The `Runner` interface keeps `DockerRunner` a viable drop-in later.
