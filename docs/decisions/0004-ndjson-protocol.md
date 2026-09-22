# ADR-0004 — NDJSON over stdout as the Python bridge

**Status:** Proposed
**Date:** 2026-09-23

## Context

The Electron main process must receive progress, logs, results, and errors
from a long-running Python child process. Jobs may run for minutes or
hours, so a single request/response at exit is not viable.

## Decision

Python emits **newline-delimited JSON (NDJSON) on stdout** — one JSON
object per line, always flushed immediately.

```python
def emit(event, **kw):
    print(json.dumps({"event": event, **kw}), flush=True)
```

Event types: `ready`, `progress`, `log`, `result`, `error`.

stdout is reserved for the protocol. Tracebacks and debug output go to
**stderr**.

## Consequences

**Positive**
- Trivial to implement on both sides; no extra dependencies
- Naturally streaming — line-by-line as work progresses
- Language-agnostic; the Python side could be swapped for anything
- Easy to debug — run the script in a terminal and read the output
- Unparseable lines degrade gracefully into raw log entries

**Negative**
- Must remember `flush=True` everywhere — Python block-buffers when piped
- A chatty training loop can flood IPC; progress must be throttled
- Not suited to large binary payloads (write those to disk, send the path)
- Any stray `print()` in a library can corrupt the stream

## Mitigations

- Spawn with `PYTHONUNBUFFERED=1` as a second line of defense
- Throttle `progress` events to ~10/sec in the Python helper
- Parser treats non-JSON lines as `{event: "log", level: "raw"}` — never throws
- Results go to disk; only `output_path` crosses the boundary
- Enforce exactly one terminal event (`result` or `error`) per job

## Alternatives considered

| Alternative | Why rejected |
|---|---|
| Local HTTP/WebSocket server in Python | Port management, startup race, firewall prompts — heavier for no gain at this stage |
| Named pipes / Unix sockets | Platform-specific code; harder to debug |
| Poll a status file on disk | Latency, partial-write races, disk churn |
| gRPC / protobuf | Schema tooling overhead unjustified at this scale |
| Parse plain stdout text | Fragile; no structure; ambiguous progress vs log |

## Future consideration

If we later adopt the FastAPI sidecar model (for richer bidirectional
control or to share code with a possible server deployment), the NDJSON
contract can sit unchanged **inside** that server's job runner. The event
schema is the durable part, not the transport.
