/**
 * ZeroCloud — Electron main process.
 * All privileged operations live here. The renderer has no OS access.
 */
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const { execFile } = require('node:child_process')
const { resolvePython, pythonEnv } = require('./runtime.cjs')
const { startJob, cancelJob, cancelAll, PYTHON_DIR } = require('./jobs.cjs')

const DEV_URL = process.env.VITE_DEV_SERVER_URL
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#0b1020',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,   // renderer cannot reach Node
      nodeIntegration: false,
      sandbox: true,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  if (DEV_URL) {
    mainWindow.loadURL(DEV_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  // Never navigate away or open remote windows inside the app shell.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if (DEV_URL && url.startsWith(DEV_URL)) return
    e.preventDefault()
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

/** Send an event to the renderer, if it still exists. */
function emit(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload)
  }
}

// ---------------------------------------------------------------- IPC

ipcMain.handle('runtime:status', async () => {
  const py = resolvePython()
  return py
    ? { ready: true, pythonPath: py.exe, pythonVersion: py.version, managed: py.managed }
    : { ready: false, error: 'No suitable Python interpreter found (3.10–3.12 required).' }
})

ipcMain.handle('hardware:probe', async () => {
  const py = resolvePython()
  if (!py) throw new Error('Python not found')

  const script = path.join(PYTHON_DIR, 'probe.py')
  return new Promise((resolve, reject) => {
    execFile(
      py.exe,
      [script],
      { env: pythonEnv(), timeout: 30_000, windowsHide: true, maxBuffer: 4 * 1024 * 1024 },
      (err, stdout) => {
        if (err && !stdout) return reject(new Error(err.message))
        try {
          resolve(JSON.parse(stdout))
        } catch {
          reject(new Error('Probe returned invalid JSON'))
        }
      },
    )
  })
})

ipcMain.handle('file:select', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Select input file',
    properties: ['openFile'],
    filters: [
      { name: 'Data files', extensions: ['csv', 'json', 'txt', 'npy'] },
      { name: 'All files', extensions: ['*'] },
    ],
  })
  if (res.canceled || !res.filePaths.length) return null
  const filePath = res.filePaths[0]
  const stat = fs.statSync(filePath)
  return { path: filePath, name: path.basename(filePath), size: stat.size }
})

ipcMain.handle('job:start', async (_e, opts) => startJob(opts, emit))

ipcMain.handle('job:cancel', async (_e, jobId) => cancelJob(jobId))

ipcMain.handle('shell:showItem', async (_e, targetPath) => {
  if (typeof targetPath === 'string' && fs.existsSync(targetPath)) {
    shell.showItemInFolder(targetPath)
  }
})

// ------------------------------------------------------------ lifecycle

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', cancelAll)

app.on('window-all-closed', () => {
  cancelAll()
  if (process.platform !== 'darwin') app.quit()
})
