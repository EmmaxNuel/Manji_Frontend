const { app, BrowserWindow, shell } = require('electron')
const http = require('http')
const fs = require('fs')
const path = require('path')

const isDev = !app.isPackaged
const devUrl = process.env.MANJI_DEV_URL || 'http://127.0.0.1:5173'
const distPath = path.join(__dirname, '..', 'dist')
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

let splashWindow = null
let mainWindow = null
let transitioned = false
// Minimum brand moment: long enough to read the logo + tagline,
// short enough to stay inside the 1-3s startup budget.
const MIN_SPLASH_MS = 1200
let splashShownAt = 0

function sendFile(response, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      response.writeHead(500)
      response.end('Unable to load Manji.')
      return
    }
    const extension = path.extname(filePath).toLowerCase()
    response.writeHead(200, {
      'Content-Type': mimeTypes[extension] || 'application/octet-stream',
      'Cache-Control': extension === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
    })
    response.end(data)
  })
}

function startDesktopServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const requestPath = decodeURIComponent((request.url || '/').split('?')[0])
      let filePath = path.join(distPath, requestPath === '/' ? 'index.html' : requestPath)
      const safeDistPath = `${distPath}${path.sep}`
      if (!filePath.startsWith(safeDistPath) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distPath, 'index.html')
      }
      sendFile(response, filePath)
    })

    const ports = [5174, 5175, 5176]
    const startNext = (index = 0) => {
      if (index >= ports.length) {
        reject(new Error('Unable to start the Manji desktop server.'))
        return
      }
      server.once('error', (error) => {
        if (error.code === 'EADDRINUSE') {
          startNext(index + 1)
        } else {
          reject(error)
        }
      })
      server.listen(ports[index], '127.0.0.1', () => {
        const address = server.address()
        resolve(`http://127.0.0.1:${address.port}`)
      })
    }
    startNext()
  })
}

function setSplashStatus(text) {
  try {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.executeJavaScript(
        `window.__manjiSplash && window.__manjiSplash.setStatus(${JSON.stringify(text)})`,
      ).catch(() => {})
    }
  } catch {
    // Splash already gone — transition happened. Nothing to do.
  }
}

function setSplashError(text) {
  try {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.webContents.executeJavaScript(
        `window.__manjiSplash && window.__manjiSplash.setError(${JSON.stringify(text)})`,
      ).catch(() => {})
    }
  } catch {
    // ignore
  }
}

function transitionToMain() {
  if (transitioned) return
  // Let the splash breathe: if the app was ready faster than the
  // minimum brand moment, wait out the remainder (errors bypass this).
  const elapsed = splashShownAt > 0 ? Date.now() - splashShownAt : MIN_SPLASH_MS
  const remaining = MIN_SPLASH_MS - elapsed
  if (remaining > 0) {
    setTimeout(transitionToMain, remaining)
    return
  }
  transitioned = true
  try {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.isVisible()) {
      mainWindow.show()
      mainWindow.focus()
    }
  } finally {
    try {
      if (splashWindow && !splashWindow.isDestroyed()) splashWindow.destroy()
    } catch {
      // ignore
    }
    splashWindow = null
  }
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 440,
    height: 560,
    resizable: false,
    minimizable: false,
    maximizable: false,
    frame: false,
    transparent: false,
    backgroundColor: '#0a0a0a',
    alwaysOnTop: true,
    skipTaskbar: true,
    title: 'Manji Studio',
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })
  splashWindow.loadFile(path.join(__dirname, 'splash.html'))
  splashWindow.once('ready-to-show', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.show()
      splashShownAt = Date.now()
    }
  })
  splashWindow.on('closed', () => {
    splashWindow = null
  })
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0a0a0a',
    title: 'Manji Studio',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  mainWindow.once('ready-to-show', () => {
    // App rendered its first frame — transition immediately.
    // No artificial delay: fast loads go straight in.
    transitionToMain()
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl, isMainFrame) => {
    if (!isMainFrame || transitioned) return
    setSplashError(`Could not load MANJI (${errorDescription || errorCode}). Check your connection and restart the app. Tried: ${validatedUrl}`)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

async function initialize() {
  // 1. Splash is already visible (created first in whenReady).
  // 2. Build the hidden main window in parallel with URL resolution.
  setSplashStatus('Starting services…')
  createMainWindow()

  let appUrl
  try {
    if (isDev) {
      appUrl = devUrl
    } else {
      appUrl = await startDesktopServer()
    }
  } catch (error) {
    setSplashError(error.message || 'Startup failed. Please restart MANJI Studio.')
    return
  }

  // 3. Load the app behind the splash. ready-to-show triggers the transition.
  //    Auth, config, backend checks and assets all initialize inside the
  //    renderer as usual — the splash never blocks them.
  setSplashStatus('Loading MANJI…')
  try {
    await mainWindow.loadURL(appUrl)
  } catch (error) {
    if (!transitioned) {
      setSplashError('Could not load MANJI. Check your connection and restart the app.')
    }
    return
  }

  // 4. Failsafe: if the renderer never signals ready, say so instead of
  //    leaving the user on a silent splash.
  setTimeout(() => {
    if (!transitioned && mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.webContents.isLoading()) {
        setSplashStatus('Still loading — almost there…')
      } else {
        transitionToMain()
      }
    }
  }, 30000)
}

app.whenReady().then(async () => {
  // Splash FIRST — synchronously the first window created on launch.
  createSplashWindow()
  await initialize()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      transitioned = false
      createSplashWindow()
      initialize()
    }
  })
})

app.on('before-quit', () => {
  BrowserWindow.getAllWindows().forEach((window) => window.destroy())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
