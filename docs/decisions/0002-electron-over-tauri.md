# ADR-0002 — Electron over Tauri for Phase 1

**Status:** Proposed
**Date:** 2026-09-23

## Context

Having decided on a desktop shell (ADR-0001), the two realistic options
are Electron and Tauri.

| | Electron | Tauri |
|---|---|---|
| Installer size | ~150–250 MB | ~10–20 MB |
| RAM baseline | Higher | Lower |
| Backend language | Node.js (JS) | Rust |
| Spawning sidecars | `child_process`, trivial | Sidecar API, more setup |
| Webview | Bundled Chromium (consistent) | OS webview (varies) |
| Ecosystem maturity | Very high | Growing |
| Team skill fit | Matches current JS/React stack | Requires learning Rust |

## Decision

Use **Electron** for Phase 1.

Revisit Tauri before v1 distribution if installer size proves to matter.

## Consequences

**Positive**
- No new language in the toolchain; team ships faster
- `child_process.spawn` + IPC is well-documented and battle-tested
- Consistent Chromium rendering — no OS webview quirks
- Mature electron-builder tooling for signing and auto-update

**Negative**
- Large installer — though negligible next to a ~2.4 GB PyTorch runtime
- Higher memory baseline
- Weaker default security posture; must explicitly harden
  (`contextIsolation`, `sandbox`, no `nodeIntegration`)

## Alternatives considered

**Tauri** — genuinely better on size and security. Rejected for Phase 1
only because adding Rust slows down a feasibility prototype. The React UI
is portable between the two, so this is a reversible decision.

**Wails / Neutralino** — smaller ecosystems, weaker tooling for signing
and auto-update.

## Reversibility

**High.** The React UI talks to a narrow `window.zerocloud` API. Porting
to Tauri means reimplementing that bridge in Rust; UI code is untouched.

This is a key reason for keeping the contextBridge surface small
(see [`04-ipc-contract.md`](../04-ipc-contract.md)).
