/**
 * ZeroCloud — preload bridge.
 *
 * The ONLY surface the renderer can reach. Deliberately narrow:
 * named operations only, never a generic exec/eval/path API.
 * See docs/04-ipc-contract.md
 */
const { contextBridge, ipcRenderer } = require('electron')

/** Subscribe helper that returns an unsubscribe function. */
function on(channel, callback) {
  const listener = (_event, payload) => callback(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

contextBridge.exposeInMainWorld('zerocloud', {
  isDesktop: true,
  platform: process.platform,

  // --- request / response ---
  getRuntimeStatus: () => ipcRenderer.invoke('runtime:status'),
  probeHardware: () => ipcRenderer.invoke('hardware:probe'),
  selectInputFile: () => ipcRenderer.invoke('file:select'),
  startJob: (opts) => ipcRenderer.invoke('job:start', opts),
  cancelJob: (jobId) => ipcRenderer.invoke('job:cancel', jobId),
  showInFolder: (p) => ipcRenderer.invoke('shell:showItem', p),

  // --- streaming events ---
  onJobReady: (cb) => on('job:ready', cb),
  onJobProgress: (cb) => on('job:progress', cb),
  onJobLog: (cb) => on('job:log', cb),
  onJobResult: (cb) => on('job:result', cb),
  onJobError: (cb) => on('job:error', cb),
  onJobDone: (cb) => on('job:done', cb),
})
