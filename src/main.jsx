import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { warmupBackend } from './utils/warmup.js'

// Wake the (possibly sleeping) API while the user reads the first screen.
warmupBackend()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
