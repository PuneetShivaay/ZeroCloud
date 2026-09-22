# Architecture Decision Records

Short, immutable records of significant decisions.

## Rules

- **Never edit an accepted ADR.** To change a decision, write a new ADR
  that supersedes it and update the old one's status line only.
- One decision per file.
- Naming: `NNNN-short-title.md`

## Template

```markdown
# ADR-NNNN — Title

**Status:** Proposed | Accepted | Superseded by ADR-XXXX
**Date:** YYYY-MM-DD

## Context
What problem forced a decision?

## Decision
What we chose.

## Consequences
Good and bad results of this choice.

## Alternatives considered
What else, and why not.
```

## Index

| ADR | Title | Status |
|---|---|---|
| [0001](./0001-desktop-shell.md) | Use a desktop shell instead of a web app | Accepted |
| [0002](./0002-electron-over-tauri.md) | Electron over Tauri for Phase 1 | Proposed |
| [0003](./0003-managed-python-runtime.md) | App-owned Python runtime, not system Python | Proposed |
| [0004](./0004-ndjson-protocol.md) | NDJSON over stdout as the Python bridge | Proposed |
| [0005](./0005-defer-docker.md) | Defer Docker as the execution environment | Proposed |
