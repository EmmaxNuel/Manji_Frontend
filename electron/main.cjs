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

async function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 640,
    backgroundColor: '#0a0a0a',
    title: 'Manji Studio',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) {
      shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  if (isDev) {
    await window.loadURL(devUrl)
    return
  }

  const appUrl = await startDesktopServer()
  await window.loadURL(appUrl)
}

app.whenReady().then(async () => {
  await createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('before-quit', () => {
  BrowserWindow.getAllWindows().forEach((window) => window.destroy())
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
