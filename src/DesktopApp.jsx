import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Cpu, HardDrive, Zap, FileInput, Play, Square, CheckCircle2,
  AlertTriangle, FolderOpen, Terminal, ShieldCheck, Loader2,
} from 'lucide-react'

const zc = window.zerocloud

const LEVEL_STYLES = {
  info: 'text-slate-300',
  warn: 'text-amber-300',
  stderr: 'text-rose-300',
  raw: 'text-slate-500',
  debug: 'text-slate-500',
  success: 'text-emerald-300',
}

function Stat({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wide">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="mt-2 font-medium text-slate-100 break-words">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
    </div>
  )
}

export default function DesktopApp() {
  const [runtime, setRuntime] = useState(null)
  const [hw, setHw] = useState(null)
  const [probing, setProbing] = useState(true)
  const [file, setFile] = useState(null)

  const [jobId, setJobId] = useState(null)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ pct: 0, stage: '' })
  const [logs, setLogs] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [device, setDevice] = useState(null)

  const [size, setSize] = useState(256)
  const [iterations, setIterations] = useState(20)

  const logEndRef = useRef(null)
  const jobIdRef = useRef(null)

  const addLog = useCallback((level, line) => {
    setLogs((prev) => [...prev.slice(-400), { level, line, id: Math.random() }])
  }, [])

  // --- initial probe ---
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const status = await zc.getRuntimeStatus()
        if (!alive) return
        setRuntime(status)
        if (status.ready) {
          const info = await zc.probeHardware()
          if (alive) setHw(info)
        }
      } catch (e) {
        if (alive) setError({ code: 'PROBE_FAILED', message: e.message })
      } finally {
        if (alive) setProbing(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // --- job event subscriptions ---
  useEffect(() => {
    const match = (p) => p.jobId === jobIdRef.current

    const offs = [
      zc.onJobReady((p) => match(p) && setDevice(p.device)),
      zc.onJobProgress((p) => match(p) && setProgress({ pct: p.pct, stage: p.stage, message: p.message })),
      zc.onJobLog((p) => match(p) && addLog(p.level, p.line)),
      zc.onJobResult((p) => {
        if (!match(p)) return
        setResult({ outputPath: p.outputPath, metrics: p.metrics })
        addLog('success', `Result written to ${p.outputPath}`)
      }),
      zc.onJobError((p) => {
        if (!match(p)) return
        setError({ code: p.code, message: p.message })
        addLog('stderr', `[${p.code}] ${p.message}`)
      }),
      zc.onJobDone((p) => {
        if (!match(p)) return
        setRunning(false)
        addLog('info', p.cancelled
          ? `Cancelled after ${(p.durationMs / 1000).toFixed(1)}s`
          : `Finished in ${(p.durationMs / 1000).toFixed(1)}s (exit ${p.exitCode})`)
      }),
    ]
    return () => offs.forEach((off) => off())
  }, [addLog])

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])

  const pickFile = async () => {
    const picked = await zc.selectInputFile()
    if (picked) {
      setFile(picked)
      addLog('info', `Selected ${picked.name} (${(picked.size / 1024).toFixed(1)} KB)`)
    }
  }

  const run = async () => {
    setLogs([]); setResult(null); setError(null)
    setProgress({ pct: 0, stage: 'starting' }); setDevice(null)
    setRunning(true)
    try {
      const res = await zc.startJob({
        jobType: 'demo',
        inputPath: file?.path,
        params: { size, iterations, device: 'auto' },
      })
      jobIdRef.current = res.jobId
      setJobId(res.jobId)
    } catch (e) {
      setRunning(false)
      setError({ code: 'START_FAILED', message: e.message })
    }
  }

  const cancel = async () => {
    if (jobIdRef.current) await zc.cancelJob(jobIdRef.current)
  }

  // ---------------------------------------------------------------- render

  if (probing) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-300">
        <Loader2 className="h-5 w-5 animate-spin mr-3" />
        Probing local hardware…
      </div>
    )
  }

  if (runtime && !runtime.ready) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-8">
        <div className="max-w-md rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-100">Python runtime not found</h2>
          <p className="text-sm text-slate-400 mt-2">{runtime.error}</p>
          <p className="text-xs text-slate-500 mt-4">
            Phase 2 will download a managed runtime automatically.
          </p>
        </div>
      </div>
    )
  }

  const gpu = hw?.gpus?.[0]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="border-b border-white/10 px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">ZeroCloud</h1>
          <p className="text-xs text-slate-500">Local compute · nothing leaves this machine</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-300 border border-emerald-500/30 bg-emerald-500/10 rounded-full px-3 py-1.5">
          <ShieldCheck className="h-3.5 w-3.5" />
          Offline execution
        </div>
      </header>

      <main className="p-8 max-w-6xl mx-auto space-y-6">
        {/* Hardware */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Stat icon={Cpu} label="CPU" value={hw?.cpu?.model?.split(',')[0] ?? '—'}
                sub={`${hw?.cpu?.threads ?? '?'} threads`} />
          <Stat icon={Zap} label="GPU" value={gpu?.name ?? 'None detected'}
                sub={gpu?.vramGB ? `${gpu.vramGB} GB` : gpu?.vendor} />
          <Stat icon={HardDrive} label="Memory" value={`${hw?.ram?.totalGB ?? '?'} GB`} />
          <Stat icon={Terminal} label="Compute device"
                value={(hw?.recommendedDevice ?? 'cpu').toUpperCase()}
                sub={hw?.torch?.installed ? `torch ${hw.torch.version}` : 'torch not installed'} />
        </section>

        {!hw?.torch?.installed && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">
            PyTorch is not installed yet — the demo job runs a pure-Python fallback.
            The execution pipeline is identical; only the backend differs.
          </div>
        )}

        {/* Controls */}
        <section className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={pickFile} disabled={running}
              className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-40">
              <FileInput className="h-4 w-4" />
              {file ? 'Change input file' : 'Select input file'}
            </button>
            <span className="text-sm text-slate-400">
              {file ? `${file.name} · ${(file.size / 1024).toFixed(1)} KB` : 'Optional — synthetic data will be used'}
            </span>
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="text-sm">
              <span className="block text-slate-400 mb-1">Matrix size</span>
              <input type="number" min={32} max={4096} step={32} value={size} disabled={running}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-28 rounded-lg bg-slate-900 border border-white/15 px-3 py-1.5 disabled:opacity-40" />
            </label>
            <label className="text-sm">
              <span className="block text-slate-400 mb-1">Iterations</span>
              <input type="number" min={1} max={500} value={iterations} disabled={running}
                onChange={(e) => setIterations(Number(e.target.value))}
                className="w-28 rounded-lg bg-slate-900 border border-white/15 px-3 py-1.5 disabled:opacity-40" />
            </label>
          </div>

          <div className="flex items-center gap-3">
            {!running ? (
              <button onClick={run}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-medium text-slate-950 hover:bg-emerald-400">
                <Play className="h-4 w-4" /> Run locally
              </button>
            ) : (
              <button onClick={cancel}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-500/90 px-5 py-2.5 text-sm font-medium text-white hover:bg-rose-500">
                <Square className="h-4 w-4" /> Cancel
              </button>
            )}
            {device && (
              <span className="text-xs rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-300">
                running on {device}
              </span>
            )}
          </div>

          {(running || progress.pct > 0) && (
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>{progress.message || progress.stage || 'working'}</span>
                <span>{progress.pct.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-150"
                     style={{ width: `${progress.pct}%` }} />
              </div>
            </div>
          )}
        </section>

        {/* Result */}
        {result && (
          <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
            <div className="flex items-center gap-2 text-emerald-300 mb-4">
              <CheckCircle2 className="h-5 w-5" />
              <h2 className="font-semibold">Computation complete</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {Object.entries(result.metrics).map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-900/60 px-3 py-2">
                  <div className="text-xs text-slate-500">{k}</div>
                  <div className="text-slate-100 font-medium break-words">{String(v)}</div>
                </div>
              ))}
            </div>
            <button onClick={() => zc.showInFolder(result.outputPath)}
              className="mt-4 inline-flex items-center gap-2 text-sm text-emerald-300 hover:underline">
              <FolderOpen className="h-4 w-4" /> {result.outputPath}
            </button>
          </section>
        )}

        {error && (
          <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">{error.code}</span>
            </div>
            <p className="text-sm text-slate-300 mt-2">{error.message}</p>
          </section>
        )}

        {/* Logs */}
        <section className="rounded-2xl border border-white/10 bg-black/40 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 text-xs text-slate-400">
            <Terminal className="h-3.5 w-3.5" /> Live output
            <span className="ml-auto">{logs.length} lines</span>
          </div>
          <div className="h-64 overflow-y-auto p-4 font-mono text-xs space-y-1">
            {logs.length === 0 && <div className="text-slate-600">No output yet — run a job to stream logs.</div>}
            {logs.map((l) => (
              <div key={l.id} className={LEVEL_STYLES[l.level] ?? 'text-slate-300'}>{l.line}</div>
            ))}
            <div ref={logEndRef} />
          </div>
        </section>
      </main>
    </div>
  )
}
