/**
 * ZeroCloud — desktop release metadata.
 *
 * Single source of truth for download links. Update ONLY this file when
 * a new desktop version ships.
 *
 * `url: null` renders the button in a "coming soon" state instead of
 * linking to a 404 — safe to deploy before the first release exists.
 */

export const DESKTOP_RELEASE = {
  version: '0.1.0',
  releasesPage: 'https://github.com/PuneetShivaay/ZeroCloud/releases/latest',

  builds: {
    win32: {
      label: 'Windows 10/11 · 64-bit',
      // e.g. '.../releases/download/v0.1.0/ZeroCloud-Setup-0.1.0.exe'
      url: null,
      size: '~180 MB',
    },
    darwin: {
      label: 'macOS 12+ · Apple Silicon',
      url: null,
      size: '~190 MB',
    },
    linux: {
      label: 'Linux · AppImage',
      url: null,
      size: '~185 MB',
    },
  },
}

/** Best-effort OS detection for choosing the default download button. */
export function detectPlatform() {
  if (typeof navigator === 'undefined') return 'win32'

  const ua = navigator.userAgent
  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? ''
  const hay = `${ua} ${platform}`.toLowerCase()

  if (hay.includes('win')) return 'win32'
  if (hay.includes('mac') || hay.includes('iphone') || hay.includes('ipad')) return 'darwin'
  if (hay.includes('linux') || hay.includes('android')) return 'linux'
  return 'win32'
}
