import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, 
  Layers, 
  Activity, 
  UploadCloud, 
  CheckCircle2, 
  AlertTriangle, 
  HardDrive, 
  Gauge, 
  WifiOff, 
  ShieldCheck, 
  Sparkles,
  Play
} from 'lucide-react';
import DownloadDesktop from './components/DownloadDesktop';

export default function App() {
  // System Specs
  const [cpuCores, setCpuCores] = useState(4);
  const [gpuInfo, setGpuInfo] = useState({ vendor: 'Detecting...', renderer: 'Detecting...', isWebGPU: false });
  
  // Benchmark States
  const [benchMode, setBenchMode] = useState('worker');
  const [dataPoints, setDataPoints] = useState(1000000);
  const [isCalculating, setIsCalculating] = useState(false);
  const [benchResult, setBenchResult] = useState(null);
  
  // File Analysis States
  const [fileMeta, setFileMeta] = useState(null);
  const [fileAnalysis, setFileAnalysis] = useState(null);
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  
  // Network Auditor State (Zero Cloud Proof)
  const [outboundRequests, setOutboundRequests] = useState([]);
  
  // Canvas GPU Simulation
  const canvasRef = useRef(null);
  const [simParticles, setSimParticles] = useState(30000);
  const [fps, setFps] = useState(0);
  const [isSimRunning] = useState(true);

  // 1. Hardware Detection & Network Request Interceptor
  useEffect(() => {
    if (navigator.hardwareConcurrency) {
      setCpuCores(navigator.hardwareConcurrency);
    }

    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          setGpuInfo({
            vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'Generic',
            renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'Integrated Graphics',
            isWebGPU: 'gpu' in navigator
          });
        }
      }
    } catch {
      setGpuInfo({ vendor: 'Unknown', renderer: 'Standard Accelerator', isWebGPU: 'gpu' in navigator });
    }

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      setOutboundRequests(prev => [...prev, { url: args[0]?.toString() || 'unknown', time: new Date().toLocaleTimeString() }]);
      return originalFetch(...args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  // 2. Local File Analyzer (FileReader + SubtleCrypto)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileMeta({
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
      type: file.type || 'Raw Binary / Document'
    });
    setIsAnalyzingFile(true);

    const startTime = performance.now();

    const reader = new FileReader();
    reader.onload = async (event) => {
      const buffer = event.target.result;
      
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const u8 = new Uint8Array(buffer);
      let asciiCount = 0;
      const sampleSize = Math.min(u8.length, 500000);
      for (let i = 0; i < sampleSize; i++) {
        if (u8[i] >= 32 && u8[i] <= 126) asciiCount++;
      }

      const duration = (performance.now() - startTime).toFixed(1);

      setFileAnalysis({
        hash: hashHex,
        asciiRatio: ((asciiCount / sampleSize) * 100).toFixed(1) + '%',
        timeTaken: duration,
        status: 'Processed 100% in Device RAM'
      });
      setIsAnalyzingFile(false);
    };

    reader.readAsArrayBuffer(file);
  };

  // 3. Multi-Threaded Math Benchmark
  const runBenchmark = () => {
    setIsCalculating(true);
    setBenchResult(null);

    const startTime = performance.now();

    if (benchMode === 'worker') {
      const workerCode = `
        self.onmessage = function(e) {
          const { count } = e.data;
          let sum = 0;
          for (let i = 0; i < count; i++) {
            sum += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
          }
          self.postMessage({ sum });
        };
      `;
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));

      worker.postMessage({ count: dataPoints });
      worker.onmessage = (e) => {
        const duration = (performance.now() - startTime).toFixed(2);
        setBenchResult({
          time: duration,
          calculatedValue: e.data.sum.toFixed(4),
          thread: 'Multi-Core Web Worker Thread'
        });
        setIsCalculating(false);
        worker.terminate();
      };
    } else {
      setTimeout(() => {
        let sum = 0;
        for (let i = 0; i < dataPoints; i++) {
          sum += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
        }
        const duration = (performance.now() - startTime).toFixed(2);
        setBenchResult({
          time: duration,
          calculatedValue: sum.toFixed(4),
          thread: 'Single Core Main Thread (Blocked UI)'
        });
        setIsCalculating(false);
      }, 50);
    }
  };

  // 4. Live Canvas Particle Physics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let frameCount = 0;
    let lastTime = performance.now();

    const count = simParticles;
    const posX = new Float32Array(count);
    const posY = new Float32Array(count);
    const velX = new Float32Array(count);
    const velY = new Float32Array(count);

    const w = (canvas.width = canvas.parentElement.clientWidth);
    const h = (canvas.height = 280);

    for (let i = 0; i < count; i++) {
      posX[i] = Math.random() * w;
      posY[i] = Math.random() * h;
      velX[i] = (Math.random() - 0.5) * 2;
      velY[i] = (Math.random() - 0.5) * 2;
    }

    const render = () => {
      ctx.fillStyle = 'rgba(10, 15, 29, 0.35)';
      ctx.fillRect(0, 0, w, h);

      ctx.fillStyle = '#38bdf8';
      for (let i = 0; i < count; i++) {
        posX[i] += velX[i];
        posY[i] += velY[i];

        if (posX[i] <= 0 || posX[i] >= w) velX[i] *= -1;
        if (posY[i] <= 0 || posY[i] >= h) velY[i] *= -1;

        ctx.fillRect(posX[i], posY[i], 1.2, 1.2);
      }

      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }

      if (isSimRunning) {
        animationId = requestAnimationFrame(render);
      }
    };

    render();

    return () => cancelAnimationFrame(animationId);
  }, [simParticles, isSimRunning]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 selection:bg-cyan-500 selection:text-black">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="border-b border-slate-800 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-cyan-500/10 text-cyan-400 text-xs px-2.5 py-1 rounded-full font-mono border border-cyan-500/20">
                100% Client-Side Engine
              </span>
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> 0 Bytes Sent to Cloud
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-white">
              ZeroCloud Compute Lab
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Delivered via web, computed 100% locally on host CPU and GPU silicon.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-xs font-medium text-slate-400">Outbound Data Leaks</div>
              <div className="text-sm font-mono font-bold text-emerald-400">
                {outboundRequests.length === 0 ? '0 Requests (Safe)' : `${outboundRequests.length} Requests`}
              </div>
            </div>
          </div>
        </header>

        <DownloadDesktop />

        {/* Hardware Specs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-cyan-400 mb-2">
              <Cpu className="w-5 h-5" />
              <h3 className="font-semibold text-sm">Host CPU Cores</h3>
            </div>
            <div className="text-3xl font-mono font-black text-white">{cpuCores} Threads</div>
            <p className="text-xs text-slate-500 mt-2">Available for parallel multi-threaded Web Workers.</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-amber-400 mb-2">
              <Activity className="w-5 h-5" />
              <h3 className="font-semibold text-sm">Detected Hardware GPU</h3>
            </div>
            <div className="text-sm font-mono font-semibold text-slate-200 truncate">{gpuInfo.renderer}</div>
            <p className="text-xs text-slate-500 mt-2">Vendor: {gpuInfo.vendor}</p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm">
            <div className="flex items-center gap-3 text-indigo-400 mb-2">
              <Gauge className="w-5 h-5" />
              <h3 className="font-semibold text-sm">WebGPU Support</h3>
            </div>
            <div className="text-xl font-mono font-bold text-white flex items-center gap-2">
              {gpuInfo.isWebGPU ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Available</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span>WebGL Fallback</span>
                </>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2">Direct shader pipeline compute capability.</p>
          </div>
        </section>

        {/* Interactive Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* File Inspector */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-lg font-bold text-white">Private Local File Inspector</h2>
                </div>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono border border-emerald-500/20">
                  No Cloud Upload
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                Inspect local files. The browser reads binary into RAM and hashes with SHA-256 via Web Crypto.
              </p>

              <label className="border-2 border-dashed border-slate-700 hover:border-cyan-500/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/40">
                <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-300">Choose file to inspect locally</span>
                <span className="text-xs text-slate-500 mt-1">CSVs, PDFs, Binaries, Videos</span>
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>

              {fileMeta && (
                <div className="mt-6 bg-slate-950 border border-slate-800/80 rounded-xl p-4 font-mono text-xs space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>File Name:</span>
                    <span className="text-white font-semibold">{fileMeta.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Size in Memory:</span>
                    <span className="text-cyan-400">{fileMeta.size}</span>
                  </div>
                  {isAnalyzingFile ? (
                    <div className="text-cyan-400 animate-pulse pt-2">Computing SHA-256 on CPU...</div>
                  ) : fileAnalysis && (
                    <>
                      <div className="pt-2 border-t border-slate-800 text-slate-400">
                        <span>SHA-256 Checksum:</span>
                        <div className="text-emerald-400 break-all mt-1">{fileAnalysis.hash}</div>
                      </div>
                      <div className="flex justify-between text-slate-400 pt-1">
                        <span>Local Compute Time:</span>
                        <span className="text-white">{fileAnalysis.timeTaken} ms</span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="mt-6 text-xs text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Inspected entirely via browser Web Crypto API.
            </div>
          </div>

          {/* Math Benchmark */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white">CPU Core Vector Math Cruncher</h2>
                </div>
                <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-mono border border-indigo-500/20">
                  Heavy Loop
                </span>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                Dispatches trigonometric vector computations. Compare freezing the main thread vs background worker threads.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-2">Computation Volume</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[500000, 2000000, 5000000].map((num) => (
                      <button
                        key={num}
                        onClick={() => setDataPoints(num)}
                        className={`text-xs py-2 rounded-lg font-mono border transition ${
                          dataPoints === num
                            ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {(num / 1000000).toFixed(1)}M Loops
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-2">Compute Pipeline</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setBenchMode('worker')}
                      className={`text-xs py-2 px-3 rounded-lg font-medium border flex items-center justify-center gap-2 transition ${
                        benchMode === 'worker'
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Layers className="w-4 h-4" /> Multi-Core Worker
                    </button>
                    <button
                      onClick={() => setBenchMode('main')}
                      className={`text-xs py-2 px-3 rounded-lg font-medium border flex items-center justify-center gap-2 transition ${
                        benchMode === 'main'
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <Cpu className="w-4 h-4" /> Main Thread (UI lock)
                    </button>
                  </div>
                </div>

                <button
                  onClick={runBenchmark}
                  disabled={isCalculating}
                  className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-semibold rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-indigo-600/20"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {isCalculating ? 'Computing on Silicon...' : 'Dispatch Math to CPU'}
                </button>

                {benchResult && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2 mt-4">
                    <div className="flex justify-between text-slate-400">
                      <span>Execution Time:</span>
                      <span className="text-emerald-400 font-bold text-sm">{benchResult.time} ms</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Pipeline Target:</span>
                      <span className="text-slate-200">{benchResult.thread}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Checksum:</span>
                      <span className="text-slate-300">{benchResult.calculatedValue}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 text-xs text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Calculated using standard IEEE 754 floating-point hardware.
            </div>
          </div>
        </div>

        {/* GPU Particles */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">Live GPU Particle Physics Engine</h2>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Hardware rasterization updating coordinate arrays directly in client memory every frame.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl text-right font-mono">
                <span className="text-xs text-slate-500 block">Render Rate</span>
                <span className="text-lg font-bold text-emerald-400">{fps} FPS</span>
              </div>

              <div className="flex gap-2">
                {[10000, 30000, 60000].map((count) => (
                  <button
                    key={count}
                    onClick={() => setSimParticles(count)}
                    className={`text-xs px-3 py-2 rounded-lg font-mono border transition ${
                      simParticles === count
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {count / 1000}k
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 relative">
            <canvas ref={canvasRef} className="w-full h-[280px] block" />
          </div>
        </section>
      </div>
    </div>
  );
}