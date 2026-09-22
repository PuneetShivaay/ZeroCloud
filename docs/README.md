# ZeroCloud — Documentation

Living documentation for the ZeroCloud desktop local-compute application.

> **Looking for current status?** See [`../PROGRESS.md`](../PROGRESS.md)
> in the repo root for a quick snapshot of what works today.

## Index

| Doc | Purpose |
|---|---|
| [`01-requirements.md`](./01-requirements.md) | What we are building and why |
| [`02-architecture.md`](./02-architecture.md) | Tech stack, patterns, folder layout |
| [`03-runtime-strategy.md`](./03-runtime-strategy.md) | Python/PyTorch environment management |
| [`04-ipc-contract.md`](./04-ipc-contract.md) | Renderer ↔ Main ↔ Python message contract |
| [`05-roadmap.md`](./05-roadmap.md) | Phases, scope, current status |
| [`06-distribution.md`](./06-distribution.md) | Web demo vs desktop app, packaging |
| [`07-requirements-discovery.md`](./07-requirements-discovery.md) | **Open questions blocking production design** |
| [`decisions/`](./decisions/) | Architecture Decision Records (ADRs) |
| [`known-issues.md`](./known-issues.md) | Environment problems and fixes |
| [`discussion-log.md`](./discussion-log.md) | Chronological discussion history |

## Conventions

- **ADRs are immutable.** Once accepted, don't edit — supersede with a new ADR.
- **Update docs in the same PR as the code.** Stale docs are worse than none.
- Docs are the source of truth for *decisions*; code is the source of truth for *behavior*.

### Which file do I update?

| File | Purpose | Frequency |
|---|---|---|
| `../PROGRESS.md` | Current status snapshot | Every session |
| `05-roadmap.md` | Phase planning | When scope changes |
| `discussion-log.md` | Historical record | Append-only |
| `decisions/` | Why we chose things | Immutable once accepted |
| `known-issues.md` | Environment problems + fixes | When one is hit |

## Branches

| Branch | Purpose |
|---|---|
| `main` | Deployed web demo — **do not disturb** |
| `feature/desktop-local-compute` | Desktop app work (current) |
