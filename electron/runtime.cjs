/**
 * ZeroCloud — Python runtime resolution.
 *
 * PHASE 1: locate a usable system Python (dev convenience only).
 * PHASE 2 will replace this with an app-owned runtime managed by `uv`.
 * See docs/decisions/0003-managed-python-runtime.md
 */
const { execFileSync } = require('node:child_process')
const fs = require('node:fs')

/**
 * PyTorch wheels lag new CPython releases, so we prefer known-good
 * versions in order and explicitly avoid "whatever `python` resolves to".
 */
const PREFERRED = ['3.12', '3.11', '3.10']

let cached = null

function tryCandidate(file, args) {
  try {
    const out = execFileSync(file, [...args, '-c', 'import sys;print(sys.executable);print("%d.%d"%sys.version_info[:2])'], {
      encoding: 'utf8',
      timeout: 10_000,
      windowsHide: true,
    })
    const [exe, version] = out.trim().split(/\r?\n/)
    if (exe && fs.existsSync(exe)) return { exe, version }
  } catch {
    /* candidate unavailable */
  }
  return null
}

/**
 * @returns {{exe: string, version: string, managed: boolean} | null}
 */
function resolvePython() {
  if (cached) return cached

  const candidates = []

  if (process.platform === 'win32') {
    // The py launcher lets us request an exact version.
    for (const v of PREFERRED) candidates.push(['py', [`-${v}`]])
    candidates.push(['py', ['-3']])
  } else {
    for (const v of PREFERRED) candidates.push([`python${v}`, []])
  }
  candidates.push(['python3', []], ['python', []])

  for (const [file, args] of candidates) {
    const found = tryCandidate(file, args)
    if (!found) continue
    cached = { ...found, managed: false }
    return cached
  }

  return null
}

/** Environment for every spawned Python process. */
function pythonEnv() {
  return {
    ...process.env,
    PYTHONUNBUFFERED: '1', // belt-and-braces: never block-buffer stdout
    PYTHONIOENCODING: 'utf-8',
  }
}

module.exports = { resolvePython, pythonEnv }
