# 07 — Requirements Discovery

**Status:** Open — awaiting answers
**Purpose:** Everything that must be decided before ZeroCloud can be
designed to production standard and released.

> **How to use this:** answer inline under each question. Anything left
> blank is an open risk. Questions marked 🔴 **block architecture** — they
> must be answered before serious build work continues.

---

## 1. Product & Users

| # | Question | Why it matters |
|---|---|---|
| 1.1 🔴 | **What does ZeroCloud actually do for a user?** One sentence, in their words. | Everything downstream depends on this |
| 1.2 🔴 | Who is the user? Consumer / researcher / enterprise employee / developer? | Decides install friction tolerance |
| 1.3 | What do they use today instead? What's the pain? | Defines the value proposition |
| 1.4 | How technical are they? Can they run an installer? Approve a firewall prompt? | Drives setup UX complexity |
| 1.5 | Are machines **personally owned** or **IT-managed**? | IT-managed = install approval, MDM packaging, no admin rights |
| 1.6 | Expected users at launch? Year one? | Affects update infra and support load |
| 1.7 | Is this a product, an internal tool, or a demo for stakeholders? | Determines how much hardening is justified |

---

## 2. Tasks & Compute 🔴

| # | Question | Why it matters |
|---|---|---|
| 2.1 🔴 | **List the actual tasks.** What scripts will users run? | The core of the catalogue |
| 2.2 🔴 | Inference only, or training/fine-tuning too? | Inference-only may allow ONNX in-browser — far simpler |
| 2.3 🔴 | Typical job duration — seconds, minutes, hours? | Decides progress/cancel/resume design |
| 2.4 | Longest acceptable job? | Do jobs survive app restart / sleep? |
| 2.5 | Are there model weights? How large? Who hosts them? | Another multi-GB download channel |
| 2.6 | Can tasks run concurrently, or strictly one at a time? | Queue design, GPU contention |
| 2.7 | Do tasks have user-tunable parameters? Which? | Form generation, validation, presets |
| 2.8 | Who authors new tasks, and how often? | Ship-with-release vs download-on-demand |
| 2.9 🔴 | Will users ever supply **their own scripts**? | Yes → arbitrary code execution → sandboxing/Docker becomes mandatory |
| 2.10 | Python-only, or other runtimes (R, Julia, native binaries)? | Runtime packaging scope |

---

## 3. Data & Files

| # | Question | Why it matters |
|---|---|---|
| 3.1 🔴 | Input file types and formats? | Validation, parsing, picker filters |
| 3.2 🔴 | Typical and maximum input size? MB or GB? | >100 MB rules out browser-memory approaches |
| 3.3 | Single file, multiple files, or a folder? | Picker and API design |
| 3.4 | Output format(s)? Files, reports, images, charts? | Result rendering |
| 3.5 | Where should output go? User-chosen, or an app folder? | Consent + permissions |
| 3.6 | Must outputs be retained? For how long? | Job history, disk management |
| 3.7 | Is input data sensitive/regulated (PII, PHI, trade secrets)? | May force audit logs, encryption at rest |
| 3.8 | Should intermediate files be securely wiped after a job? | Privacy positioning |

---

## 4. Hardware & Environment

| # | Question | Why it matters |
|---|---|---|
| 4.1 🔴 | **Minimum supported hardware?** | Do we support CPU-only users at all? |
| 4.2 🔴 | Which GPUs must work — NVIDIA / AMD / Apple / Intel? | Each is a separate build + test matrix |
| 4.3 | Minimum VRAM / RAM / free disk? | Preflight checks, clear rejection messages |
| 4.4 | 🔴 Which OS? Windows only, or macOS/Linux? | macOS rules out Docker-for-GPU |
| 4.5 | Minimum OS versions? | Electron/Tauri and driver support floors |
| 4.6 | Do users have **admin rights**? | Decides install location and service options |
| 4.7 | Do we have NVIDIA test hardware? AMD? Apple Silicon? | Currently **no NVIDIA machine** — CUDA path unverified |
| 4.8 | Behaviour if hardware is inadequate — refuse, or run slowly with a warning? | Product decision, not technical |

---

## 5. Architecture 🔴

| # | Question | Why it matters |
|---|---|---|
| 5.1 🔴 | **Confirm the model:** website UI + local helper (Option B)? | Everything else follows |
| 5.2 🔴 | Helper implemented in **Python/FastAPI** or **Electron/Node**? | Python = one language with the compute; Electron = reuse existing `jobs.cjs` |
| 5.3 | Does a **standalone desktop app** remain a deliverable, or is the helper the only artifact? | Two products vs one |
| 5.4 | Does the helper **auto-start on login**? Tray icon? | The "not running" failure mode is the worst UX |
| 5.5 | Fixed port or dynamic with discovery? | Port conflicts are common |
| 5.6 | Should a browser-only WASM fallback exist for users who won't install? | Nice-to-have or requirement? |
| 5.7 | How are helper API versions negotiated with the site? | Site updates instantly; helpers lag |

---

## 6. Setup & Runtime Distribution

| # | Question | Why it matters |
|---|---|---|
| 6.1 🔴 | Acceptable **first-run download size**? (~2.4 GB for CUDA torch) | May force CPU-first, GPU-on-demand |
| 6.2 | Acceptable **setup time**? | Sets download/progress UX expectations |
| 6.3 | Must an **offline/air-gapped installer** exist? | Enterprise requirement, separate build |
| 6.4 | Do users sit behind **proxies / TLS inspection**? (dev machine already does) | Downloader must support custom CAs |
| 6.5 | How are runtime updates delivered — with app updates or separately? | Three update channels: app, runtime, tasks |
| 6.6 | Is there a "repair/reset" path when the runtime corrupts? | You will need this |
| 6.7 | Disk budget on the user's machine? | 5–6 GB is realistic |

---

## 7. Security & Trust 🔴

| # | Question | Why it matters |
|---|---|---|
| 7.1 🔴 | How does the helper authenticate the website? | Open local port = RCE risk if unauthenticated |
| 7.2 🔴 | Which origins may talk to the helper? Production only, or also localhost dev? | CORS allowlist |
| 7.3 | Can the site request **arbitrary file paths**, or only user-picked files? | Must be user-picked only |
| 7.4 | Are task scripts **signed / integrity-checked** before execution? | Especially if downloaded on demand |
| 7.5 | What does the helper do if an unknown origin calls it? | Silent reject + log |
| 7.6 | Is telemetry collected at all? Opt-in or opt-out? | "Zero cloud" branding makes any telemetry sensitive |
| 7.7 | Is there licensing / activation? Does that require network? | Conflicts with the offline promise |
| 7.8 | Any compliance obligations — GDPR, HIPAA, SOC2, export control? | Can dominate the roadmap |
| 7.9 | Will you publish a "what touches the network" audit page? | Strong differentiator for a privacy product |

---

## 8. User Experience

| # | Question | Why it matters |
|---|---|---|
| 8.1 | What happens on first visit with no helper? | The single most important screen |
| 8.2 | What does "ready to compute" look like? | Hardware badge, device shown? |
| 8.3 | How is progress shown for a 2-hour job? Can the user close the tab? | Background jobs + notifications |
| 8.4 | Are raw logs shown to users, or only a summary? | Users can execute but not code — raw tracebacks may confuse |
| 8.5 | How are errors phrased? (e.g. GPU OOM) | Plain language + suggested fix |
| 8.6 | Is there job history? Re-run with same settings? | Session-only or persisted |
| 8.7 | Must the UI be accessible (WCAG) or localised? | Enterprise procurement often requires it |
| 8.8 | Any offline capability for the **website** itself (PWA)? | Full-offline story |

---

## 9. Distribution & Release

| # | Question | Why it matters |
|---|---|---|
| 9.1 🔴 | Budget for **code signing certificates**? (~$200–500/yr Windows; Apple Developer $99/yr) | Unsigned installers are effectively unshippable |
| 9.2 | Where are installers hosted — GitHub Releases, own CDN, enterprise portal? | Bandwidth and access control |
| 9.3 | Auto-update: silent, prompted, or manual? | Enterprise often forbids silent updates |
| 9.4 | Release cadence? | Support burden |
| 9.5 | Do you need MSI/MDM packaging for enterprise deployment? | Different build target than NSIS |
| 9.6 | Beta/insider channel? | Risk management |
| 9.7 | What's the **uninstall** story? Does it remove the multi-GB runtime? | Leaving 5 GB behind creates complaints |

---

## 10. Operations & Support

| # | Question | Why it matters |
|---|---|---|
| 10.1 | How do users report problems? | Support channel |
| 10.2 | Can users export a diagnostic bundle (logs, hardware, versions)? | Without it, remote debugging is guesswork |
| 10.3 | Is there crash reporting? Does that violate the privacy promise? | Needs explicit consent |
| 10.4 | Who provides support, and what SLA? | Team capacity |
| 10.5 | What documentation ships — install guide, task docs, troubleshooting? | Reduces support volume |

---

## 11. Project Constraints

| # | Question | Why it matters |
|---|---|---|
| 11.1 🔴 | **Target launch date?** Hard or soft? | Determines scope cuts |
| 11.2 🔴 | Team size and skills? Who maintains Python vs frontend vs packaging? | Solo vs team changes everything |
| 11.3 | Budget for certs, CDN, test hardware? | Several hard costs are unavoidable |
| 11.4 | Is there a pilot group for testing? | Real-world validation before launch |
| 11.5 | What defines "v1 success"? | Scope anchor |
| 11.6 | What is explicitly **out of scope** for v1? | Equally important |

---

## Minimum set to unblock design

If you answer nothing else, answer these **twelve**:

1. What do users actually do with ZeroCloud? (1.1)
2. List the tasks/scripts. (2.1)
3. Inference or training? (2.2)
4. Job duration? (2.3)
5. Will users supply their own scripts? (2.9)
6. Input file sizes? (3.2)
7. Which OS and GPUs must be supported? (4.2, 4.4)
8. Confirm website + local helper model? (5.1)
9. Helper in Python or Electron? (5.2)
10. Acceptable first-run download size? (6.1)
11. Code-signing budget? (9.1)
12. Launch date and team size? (11.1, 11.2)

---

## Already answered

| Question | Answer | Date |
|---|---|---|
| Electron or Tauri (desktop prototype) | Electron — reversible | 2026-09-23 |
| Phase 1 platform | Windows | 2026-09-23 |
| Python version | Pin 3.12 (not 3.14) | 2026-09-23 |
| Dev machine GPU | None — Intel UHD only | 2026-09-23 |
| Users write scripts? | **No** — they execute, we author | 2026-09-23 |
| Web/desktop relationship | Website is the UI; local does compute | 2026-09-23 |

---

## Known constraints already discovered

| Constraint | Consequence |
|---|---|
| No NVIDIA GPU on the dev machine | CUDA path cannot be verified locally |
| Network performs TLS interception | Breaks Node binary downloads; affects the Phase 2 runtime downloader |
| PyTorch lags new CPython releases | Must pin Python 3.12 |
| Browsers cannot spawn processes | A local helper is mandatory — not optional |
| Unsigned installers trigger SmartScreen | Code signing is a launch blocker |
