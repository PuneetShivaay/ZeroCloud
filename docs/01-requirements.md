# 01 — Requirements

**Status:** Confirmed
**Last updated:** 2026-09-23

## Product statement

ZeroCloud is a **desktop application** that runs computational workloads
(PyTorch / scientific Python) entirely on the **user's own hardware**.
No data and no computation ever leaves the machine.

## Core user flow

1. User launches ZeroCloud
2. App detects local hardware (CPU, GPU, VRAM, driver)
3. User selects an **input file** from their machine
4. User picks a script/job and starts it
5. Script executes locally using **CPU / GPU**
6. Live progress and logs stream into the UI
7. Output is written locally and displayed

## Functional requirements

| ID | Requirement |
|---|---|
| FR-1 | Detect local hardware capabilities (CPU cores, GPU vendor/model, VRAM, CUDA/MPS availability) |
| FR-2 | Select an input file via native OS file dialog |
| FR-3 | Execute a Python script as a local child process |
| FR-4 | Stream real-time progress and logs to the UI |
| FR-5 | Cancel a running job cleanly (kill full process tree) |
| FR-6 | Write output locally and surface the path to the user |
| FR-7 | Gracefully fall back CUDA → MPS → CPU |
| FR-8 | Ask for explicit user confirmation before downloads, installs, or file writes |

## Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | **Zero cloud compute.** Only network use is the one-time runtime download |
| NFR-2 | Fully functional offline after first-run setup |
| NFR-3 | No admin rights required |
| NFR-4 | Must not modify or depend on the user's existing Python installation |
| NFR-5 | UI must stay responsive during long jobs |
| NFR-6 | GPU OOM and crashes must surface as readable errors, not dead app |

## Assumptions

- Users have **high-performance CPUs/GPUs**; heavy local workloads are acceptable
- Users have internet available for the **one-time** runtime download
- Initial target: **Windows** (macOS/Linux later)
- Scripts are **shipped by us** initially (not user-supplied)

## Out of scope (v1)

- Cloud/remote execution of any kind
- User-supplied arbitrary scripts (changes the security model — would need sandboxing)
- Multi-machine / cluster distribution
- Multi-job concurrent queue

## Open questions

- [ ] macOS/Linux target timeline?
- [ ] Will scripts eventually be user-supplied? (drives sandboxing decision)
- [ ] Expected typical job duration — seconds, minutes, or hours?
- [ ] Do jobs need to survive an app restart?
