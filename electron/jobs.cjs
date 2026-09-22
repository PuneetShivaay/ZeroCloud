/**
 * ZeroCloud — job execution.
 *
 * Spawns a Python script and parses newline-delimited JSON from stdout.
 * See docs/04-ipc-contract.md and docs/decisions/0004-ndjson-protocol.md
 */
const { spawn, execFile } = require('node:child_process')
const path = require('node:path')
const crypto = require('node:crypto')
const { resolvePython, pythonEnv } = require('./runtime.cjs')

/** @type {Map<string, {child: import('child_process').ChildProcess, cancelled: boolean}>} */
const registry = new Map()

const PYTHON_DIR = path.join(__dirname, '..', 'python')

/** Only these jobs may be launched. Never accept an arbitrary path from the UI. */
const JOB_SCRIPTS = {
  demo: path.join(PYTHON_DIR, 'jobs', 'demo_job.py'),
}

/**
 * Consume a stream line-by-line, tolerating chunk boundaries mid-line.
 */
function lineReader(stream, onLine) {
  let buffer = ''
  stream.setEncoding('utf8')
  stream.on('data', (chunk) => {
    buffer += chunk
    let idx
    while ((idx = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, idx).replace(/\r$/, '')
      buffer = buffer.slice(idx + 1)
      if (line.length) onLine(line)
    }
  })
  stream.on('end', () => {
    if (buffer.trim().length) onLine(buffer.trim())
  })
}

/**
 * Start a job.
 * @param {object} opts
 * @param {string} opts.jobType   key of JOB_SCRIPTS
 * @param {string} [opts.inputPath]
 * @param {object} [opts.params]
 * @param {(channel: string, payload: object) => void} emit
 */
function startJob({ jobType, inputPath, params = {} }, emit) {
  const script = JOB_SCRIPTS[jobType]
  if (!script) throw new Error(`Unknown job type: ${jobType}`)

  const py = resolvePython()
  if (!py) throw new Error('No suitable Python interpreter found (3.10–3.12 required).')

  const jobId = crypto.randomUUID()
  const startedAt = Date.now()

  // argv array only — never shell: true. No injection surface.
  const args = [script]
  if (inputPath) args.push('--input', inputPath)
  if (params.size) args.push('--size', String(params.size))
  if (params.iterations) args.push('--iterations', String(params.iterations))
  if (params.device) args.push('--device', String(params.device))

  const child = spawn(py.exe, args, {
    env: pythonEnv(),
    windowsHide: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  registry.set(jobId, { child, cancelled: false })

  // --- stdout is the protocol ---
  lineReader(child.stdout, (line) => {
    let msg
    try {
      msg = JSON.parse(line)
    } catch {
      // Unparseable output degrades to a log line; never throws.
      emit('job:log', { jobId, level: 'raw', line, ts: Date.now() })
      return
    }

    switch (msg.event) {
      case 'ready':
        emit('job:ready', { jobId, ...msg })
        break
      case 'progress':
        emit('job:progress', { jobId, pct: msg.pct, stage: msg.stage, message: msg.message })
        break
      case 'log':
        emit('job:log', { jobId, level: msg.level || 'info', line: msg.line, ts: Date.now() })
        break
      case 'result':
        emit('job:result', { jobId, outputPath: msg.output_path, metrics: msg.metrics || {} })
        break
      case 'error':
        emit('job:error', { jobId, code: msg.code || 'INTERNAL', message: msg.message, detail: msg.detail })
        break
      default:
        emit('job:log', { jobId, level: 'debug', line, ts: Date.now() })
    }
  })

  // --- stderr is diagnostics only ---
  lineReader(child.stderr, (line) => {
    emit('job:log', { jobId, level: 'stderr', line, ts: Date.now() })
  })

  child.on('error', (err) => {
    emit('job:error', { jobId, code: 'SPAWN_FAILED', message: err.message })
  })

  child.on('close', (exitCode) => {
    const entry = registry.get(jobId)
    const cancelled = Boolean(entry?.cancelled)
    registry.delete(jobId)
    emit('job:done', {
      jobId,
      exitCode: cancelled ? null : exitCode,
      cancelled,
      durationMs: Date.now() - startedAt,
    })
  })

  return { jobId, python: py.exe, pythonVersion: py.version }
}

/**
 * Cancel a job, killing the whole process tree.
 * PyTorch DataLoader workers are separate processes — killing only the
 * parent leaves orphans holding memory/VRAM.
 */
function cancelJob(jobId) {
  const entry = registry.get(jobId)
  if (!entry) return { cancelled: false }

  entry.cancelled = true
  const pid = entry.child.pid

  if (process.platform === 'win32') {
    execFile('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true }, () => {})
  } else {
    try {
      process.kill(-pid, 'SIGTERM')
      setTimeout(() => {
        try { process.kill(-pid, 'SIGKILL') } catch { /* already gone */ }
      }, 3000)
    } catch { /* already gone */ }
  }

  return { cancelled: true }
}

function cancelAll() {
  for (const jobId of registry.keys()) cancelJob(jobId)
}

module.exports = { startJob, cancelJob, cancelAll, PYTHON_DIR }
