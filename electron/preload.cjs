const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  isDesktop: true,
  platform: process.platform,
  apiBaseUrl: process.env.MANJI_API_URL || 'http://127.0.0.1:8000/api',
})
