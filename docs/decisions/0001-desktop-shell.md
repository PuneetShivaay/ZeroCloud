# ADR-0001 — Use a desktop shell instead of a web app

**Status:** Accepted
**Date:** 2026-09-23

## Context

ZeroCloud must execute Python/PyTorch scripts using the user's local CPU
and GPU. The existing prototype is a React + Vite web app deployed to a
browser.

Browsers cannot:
- Spawn OS processes (`python script.py`)
- Access CUDA / ROCm / Metal compute
- Read arbitrary local file paths (only opaque file blobs)
- Write output to a user-chosen location without repeated prompts

WebGPU exists, but cannot run PyTorch and is not a substitute for a
native CUDA workload.

## Decision

Build ZeroCloud as a **desktop application** with a privileged main
process that spawns Python as a child process.

The existing React UI is retained and reused.

## Consequences

**Positive**
- Full local hardware access — the core product requirement
- Real filesystem paths, no upload/copy step
- ML code stays idiomatic Python
- Existing React/Tailwind UI carries over nearly unchanged

**Negative**
- Requires installer, code signing, and auto-update infrastructure
- Larger distribution footprint
- Per-OS build and test matrix
- Privileged process means security must be designed, not assumed

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| Pure web app + WebGPU | Cannot run PyTorch; no CUDA access |
| Browser + localhost Python server | User must manually install/launch; poor product UX; no real file paths |
| Cloud execution | Directly violates the product's core "zero cloud" premise |
| CLI only | Target users expect a GUI; loses the existing UI investment |

## Notes

The existing web demo on `main` remains deployed and untouched. Desktop
work lives on `feature/desktop-local-compute`, and `src/main.jsx` switches
root components based on `window.zerocloud`, so browser behavior is
unchanged.
