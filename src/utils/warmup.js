/**
 * Backend warm-up ping.
 *
 * The free-tier API sleeps after inactivity and takes ~50s to wake on the
 * first request. Firing a fire-and-forget health check at app boot wakes it
 * while the user is still reading the screen, so their first real action
 * (login, register, load feed) hits a warm server.
 *
 * Runs once per page load. Failures are silently ignored — the real
 * requests have their own error handling.
 */

let warmed = false

export function warmupBackend() {
  if (warmed) return
  warmed = true
  try {
    const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
    // Desktop packaged app always has a build-time URL; dev uses the proxy.
    const url = base ? `${base.replace(/\/api$/, '')}/health/live/` : '/health/live/'
    fetch(url, { method: 'GET', cache: 'no-store', keepalive: true }).catch(() => {})
  } catch {
    // never break boot for a warm-up ping
  }
}
