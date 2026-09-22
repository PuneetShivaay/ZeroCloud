# ADR-0005 — Defer Docker as the execution environment

**Status:** Proposed
**Date:** 2026-09-23

## Context

Docker was considered for packaging the Python/PyTorch/CUDA environment.
It offers excellent reproducibility and strong isolation, which is
attractive for a compute application.

## Decision

**Do not use Docker for Phase 1.** Use an app-owned Python runtime
(ADR-0003) instead.

Keep a `Runner` interface so a `DockerRunner` can be added later without
changes to the UI layer.

## Rationale

### GPU passthrough is platform-limited

| Platform | GPU in Docker? |
|---|---|
| Linux + NVIDIA | Yes — Container Toolkit, near-native |
| Windows + NVIDIA + WSL2 | Yes, but requires WSL2 backend |
| Windows native containers | No CUDA |
| **macOS (Apple Silicon / MPS)** | **No — not possible** |
| AMD ROCm | Linux only, fiddly |

macOS GPU support is impossible under Docker. That alone disqualifies it
as the sole strategy for a cross-platform desktop product.

### Heavy prerequisite

Docker Desktop requires installation, admin rights, and WSL2 on Windows.
It is also **commercially licensed** for organizations above 250 employees
or $10M revenue — a real procurement blocker for enterprise users.

### Size

`pytorch/pytorch:*-cuda*` base images are 6–12 GB uncompressed, versus
3–6 GB for a targeted runtime.

### File I/O friction

Bind mounts require Windows path translation (`C:\Users\...` →
`/mnt/c/...`), and UID/permission mismatches on Linux are a recurring
source of bugs.

## Consequences

**Positive**
- No third-party prerequisite for users
- Works on macOS with MPS
- Smaller footprint, no licensing exposure
- Direct filesystem access — no mount translation

**Negative**
- Weaker isolation — scripts run with the user's privileges
- Reproducibility depends on our lockfile discipline rather than an image digest
- Cannot use `--memory` / `--cpus` resource caps

## Revisit if

- Scripts become **user-supplied** — executing untrusted code makes
  Docker's sandboxing genuinely valuable
- Targets narrow to Linux or IT-managed Windows fleets where Docker is
  already deployed
- Environment complexity grows beyond what `uv`/`micromamba` handle
  (exotic system libs, multiple simultaneous CUDA versions)

## Middle path (recorded for later)

Abstract execution behind a `Runner` interface with two implementations —
`LocalEnvRunner` and `DockerRunner` — selected at runtime based on
availability and trust level of the script. Costs roughly a day of design
work and preserves both options.
