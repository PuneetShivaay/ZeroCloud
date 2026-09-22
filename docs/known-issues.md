# Known Environment Issues

Real problems hit during development, with working fixes.

---

## TLS interception breaks npm binary downloads

**Observed:** 2026-09-23, Phase 1 setup.

### Symptom

`npm install electron` completes, but the ~150 MB Electron binary is
missing. `node_modules/electron/dist/electron.exe` does not exist.
Postinstall fails with a bare:

```
RequestError: fetch failed
```

### Cause

The network performs **TLS inspection** (a middlebox re-signs HTTPS
traffic with a corporate CA).

- **PowerShell / `Invoke-WebRequest` works** — uses the Windows certificate
  store, which trusts the corporate CA
- **Node.js `fetch` fails** — Node ships its own bundled CA list and does
  not consult the Windows store

Confirmed: the same URL returned HTTP 200 and `Content-Length: 158149795`
via PowerShell while Node's fetch rejected it.

### Fix used (manual)

```powershell
$v = "44.4.4"
$u = "https://github.com/electron/electron/releases/download/v$v/electron-v$v-win32-x64.zip"
$o = "$env:TEMP\electron-v$v-win32-x64.zip"
$ProgressPreference = 'SilentlyContinue'
Invoke-WebRequest -Uri $u -OutFile $o -UseBasicParsing -TimeoutSec 900

Expand-Archive -Path $o -DestinationPath "node_modules\electron\dist" -Force
"electron.exe" | Out-File "node_modules\electron\path.txt" -Encoding ascii -NoNewline
```

### Better long-term fixes

| Approach | Command |
|---|---|
| Point Node at the Windows CA store | `$env:NODE_OPTIONS = "--use-system-ca"` (Node 22+) |
| Supply the corporate CA explicitly | `$env:NODE_EXTRA_CA_CERTS = "C:\path\to\corp-ca.pem"` |
| Configure npm proxy | `npm config set proxy http://proxy:port` |

**Do not** use `npm config set strict-ssl false` — it disables verification
globally rather than trusting the specific CA.

### Impact on the product

This is not just a dev annoyance. **Phase 2 downloads a ~2.4 GB Python
runtime**, and enterprise users will sit behind the same kind of middlebox.

The downloader must therefore:
- Respect `HTTP_PROXY` / `HTTPS_PROXY` / `NO_PROXY`
- Accept a custom CA bundle via settings
- Report TLS failures as a clear, actionable message — never a bare
  "fetch failed"
- Offer an **offline installer** fallback

Validates the "Corporate proxy / TLS inspection" hazard in
[`03-runtime-strategy.md`](./03-runtime-strategy.md).

---

## Vite port conflicts with Electron launch

**Symptom:** `npm run desktop` starts Vite, but Vite reports
`Port 5173 is in use, trying another one...` and binds 5174. Electron then
loads the hardcoded 5173 and shows a blank window.

**Fix:** pin the port with `--strictPort` so a conflict fails loudly
instead of silently drifting:

```json
"desktop": "concurrently -k \"vite --port 5173 --strictPort\" \"wait-on http://localhost:5173 && cross-env VITE_DEV_SERVER_URL=http://localhost:5173 electron .\""
```

Also added `electron:only` for attaching to an already-running dev server —
useful when debugging the main process without restarting Vite.

---

## Python version selection

**Observed:** dev machine had Python 3.14.0 first on PATH, plus 3.12.4.

**Problem:** PyTorch wheels lag new CPython releases. Installing against
3.14 would fail or silently fall back to CPU-only builds.

**Fix:** `electron/runtime.cjs` probes for **3.12 → 3.11 → 3.10** in order
via the Windows `py` launcher, and never trusts a bare `python`.

Concrete justification for
[ADR-0003](./decisions/0003-managed-python-runtime.md) — "whatever `python`
resolves to" is not an acceptable dependency.
