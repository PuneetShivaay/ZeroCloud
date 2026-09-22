# ZeroCloud — Documentation

Living documentation for the ZeroCloud desktop local-compute application.

## Index

| Doc | Purpose |
|---|---|
| [`01-requirements.md`](./01-requirements.md) | What we are building and why |
| [`02-architecture.md`](./02-architecture.md) | Tech stack, patterns, folder layout |
| [`03-runtime-strategy.md`](./03-runtime-strategy.md) | Python/PyTorch environment management |
| [`04-ipc-contract.md`](./04-ipc-contract.md) | Renderer ↔ Main ↔ Python message contract |
| [`05-roadmap.md`](./05-roadmap.md) | Phases, scope, current status |
| [`decisions/`](./decisions/) | Architecture Decision Records (ADRs) |
| [`known-issues.md`](./known-issues.md) | Environment problems and fixes |
| [`discussion-log.md`](./discussion-log.md) | Chronological discussion history |

## Conventions

- **ADRs are immutable.** Once accepted, don't edit — supersede with a new ADR.
- **Update docs in the same PR as the code.** Stale docs are worse than none.
- Docs are the source of truth for *decisions*; code is the source of truth for *behavior*.

## Branches

| Branch | Purpose |
|---|---|
| `main` | Deployed web demo — **do not disturb** |
| `feature/desktop-local-compute` | Desktop app work (current) |
