import React, { useState } from 'react'
import {
  Download, Monitor, Cpu, FileCode2, Zap, Check, X, ChevronDown, Clock,
} from 'lucide-react'
import { DESKTOP_RELEASE, detectPlatform } from '../config/release'

const PLATFORM_ORDER = ['win32', 'darwin', 'linux']
const PLATFORM_NAMES = { win32: 'Windows', darwin: 'macOS', linux: 'Linux' }

/** What the browser genuinely cannot do — the reason to download. */
const COMPARISON = [
  { feature: 'Runs in your browser', web: true, desktop: false },
  { feature: 'CPU multi-threading (Web Workers)', web: true, desktop: true },
  { feature: 'GPU visualisation (WebGL/WebGPU)', web: true, desktop: true },
  { feature: 'Native CUDA / Metal acceleration', web: false, desktop: true },
  { feature: 'Run PyTorch models locally', web: false, desktop: true },
  { feature: 'Direct filesystem access, no upload', web: false, desktop: true },
  { feature: 'Multi-GB datasets', web: false, desktop: true },
  { feature: 'Fully offline after setup', web: false, desktop: true },
]

function Tick({ on }) {
  return on
    ? <Check className="w-4 h-4 text-emerald-400 mx-auto" />
    : <X className="w-4 h-4 text-slate-600 mx-auto" />
}

export default function DownloadDesktop() {
  const detected = detectPlatform()
  const [selected, setSelected] = useState(detected)
  const [showAll, setShowAll] = useState(false)

  const build = DESKTOP_RELEASE.builds[selected]
  const available = Boolean(build?.url)

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.07] to-slate-900/40 p-6 md:p-8">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* ---- Pitch + CTA ---- */}
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-mono text-cyan-300">
            <Monitor className="w-3.5 h-3.5" />
            Desktop Edition
          </div>

          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-white">
            Need real GPU compute?
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            This page proves local computation works — but browsers cannot reach
            CUDA or run PyTorch. The desktop app removes that ceiling and executes
            native Python on your own silicon. Same privacy guarantee:
            <span className="text-slate-300"> nothing leaves your machine.</span>
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {available ? (
              <a
                href={build.url}
                download
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                <Download className="w-4 h-4" />
                Download for {PLATFORM_NAMES[selected]}
              </a>
            ) : (
              <button
                disabled
                title="Desktop builds are not published yet"
                className="inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/60 px-5 py-3 text-sm font-semibold text-slate-400"
              >
                <Clock className="w-4 h-4" />
                Desktop build coming soon
              </button>
            )}

            <button
              onClick={() => setShowAll((v) => !v)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 transition hover:text-slate-200"
            >
              Other platforms
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <p className="mt-2.5 font-mono text-xs text-slate-500">
            v{DESKTOP_RELEASE.version} · {build?.label} · {build?.size}
          </p>

          {showAll && (
            <div className="mt-3 flex flex-wrap gap-2">
              {PLATFORM_ORDER.map((key) => {
                const b = DESKTOP_RELEASE.builds[key]
                const isSel = key === selected
                return (
                  <button
                    key={key}
                    onClick={() => setSelected(key)}
                    className={`rounded-lg border px-3 py-1.5 text-xs transition ${
                      isSel
                        ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300'
                        : 'border-slate-700 bg-slate-800/40 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {PLATFORM_NAMES[key]}
                    {!b.url && <span className="ml-1.5 text-slate-600">soon</span>}
                  </button>
                )
              })}
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              { icon: Zap, title: 'Native GPU', body: 'CUDA, ROCm and Apple Metal' },
              { icon: FileCode2, title: 'Real Python', body: 'PyTorch, NumPy, SciPy' },
              { icon: Cpu, title: 'No limits', body: 'Full RAM and disk access' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5">
                <Icon className="mb-1.5 h-4 w-4 text-cyan-400" />
                <div className="text-sm font-semibold text-slate-200">{title}</div>
                <div className="text-xs text-slate-500">{body}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ---- Comparison ---- */}
        <div className="w-full lg:w-[22rem] shrink-0">
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
            <div className="grid grid-cols-[1fr_4rem_4rem] gap-2 border-b border-slate-800 px-4 py-2.5 text-xs font-medium text-slate-400">
              <span>Capability</span>
              <span className="text-center">Web</span>
              <span className="text-center text-cyan-400">App</span>
            </div>
            {COMPARISON.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-[1fr_4rem_4rem] items-center gap-2 border-b border-slate-800/50 px-4 py-2 text-xs text-slate-300 last:border-0"
              >
                <span>{row.feature}</span>
                <Tick on={row.web} />
                <Tick on={row.desktop} />
              </div>
            ))}
          </div>
          <p className="mt-2.5 px-1 text-[11px] leading-relaxed text-slate-500">
            Both editions compute entirely on your hardware. The desktop app
            additionally downloads a Python runtime once, then works offline.
          </p>
        </div>
      </div>
    </section>
  )
}
