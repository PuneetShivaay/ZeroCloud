# 06 — Distribution Model

**Status:** Accepted
**Last updated:** 2026-09-23

## The key constraint

**A web page cannot launch a desktop application.** There is no mechanism
— by design — for a URL to start a native process. Deploying the site does
not deploy the desktop app.

This means ZeroCloud ships as **two products from one repository**.

## Two products, one codebase

| | Web demo | Desktop app |
|---|---|---|
| Delivered as | URL | `.exe` installer |
| User action | Click a link | Download + install |
| Renders | `App.jsx` | `DesktopApp.jsx` |
| Compute | Browser JS / WebGPU | Local Python + native GPU |
| Ships | `dist/` only | `dist/` + Electron + `python/` |
| Size | ~260 KB JS | ~180 MB, plus ~2.4 GB runtime |
| Updates | Instant on refresh | Auto-updater |

## How the split works

`src/main.jsx` selects the root component at runtime:

```js
const Root = window.zerocloud ? DesktopApp : App
```

`window.zerocloud` is injected **only** by the Electron preload script.
In a browser it is `undefined`, so the original web demo renders unchanged.

Consequences:
- `DesktopApp.jsx` ships inside the web bundle but never executes there
- `electron/` and `python/` are never bundled by Vite — they are packaged
  by electron-builder instead
- One UI codebase, two runtime contexts, no fork

## Distribution flow

```
  npm run dist  (electron-builder)
        ↓
  ZeroCloud-Setup-x.y.z.exe
        ↓
  Upload to GitHub Releases
        ↓
  Web demo shows "Download for Windows"
        ↓
  User installs → launches → DesktopApp.jsx runs
```

The web demo is the **top of the funnel**: a visitor sees local compute
working in the browser, hits its ceiling (no CUDA, no PyTorch), and
downloads the desktop app for real capability.

This mirrors Ollama, LM Studio, VS Code, and Docker Desktop.

## Download CTA

Implemented in `src/components/DownloadDesktop.jsx`, driven by
`src/config/release.js`.

- **Single source of truth** — shipping a release means editing one file
- **Safe before first release** — `url: null` renders a disabled
  "coming soon" button rather than linking to a 404
- **OS auto-detection** picks the default build, with a manual override
- **Comparison table** converts the web demo's limitations into the
  reason to download

To publish a build, set the URL:

```js
win32: {
  url: 'https://github.com/PuneetShivaay/ZeroCloud/releases/download/v0.1.0/ZeroCloud-Setup-0.1.0.exe',
}
```

## Packaging (Phase 4, not yet built)

What ends up inside the installer:

```
ZeroCloud.exe
├─ Chromium + Node       (Electron runtime, ~150 MB)
├─ electron/*.cjs        main process
├─ dist/                 built React app
└─ python/*.py           job scripts
```

Electron loads `dist/index.html` from disk over `file://`, which is why
`vite.config.js` sets `base: './'`. Absolute asset paths would 404.

### Required before publishing a download link

| Item | Why |
|---|---|
| **Code signing certificate** | Unsigned `.exe` triggers SmartScreen "Windows protected your PC" — most users abandon. OV/EV cert, ~$200–500/yr |
| electron-builder config | Produces the NSIS installer |
| Auto-update channel | `electron-updater` against GitHub Releases |
| Offline installer variant | Air-gapped and heavily-proxied enterprise machines |

## Branch strategy

| Branch | Contents |
|---|---|
| `main` | Deployed web demo |
| `feature/desktop-local-compute` | Desktop app + docs (current) |

The download CTA is the **first change that affects the deployed site**.
Consider merging that commit to `main` independently, keeping the
Electron work on the feature branch until Phase 2 is stable.
