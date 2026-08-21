/**
 * AuthLayout – clean centred layout for login / register pages.
 */

import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { Sun, Moon } from 'lucide-react'
import { Logo } from '../components/ui'

export default function AuthLayout({ children }) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      <header className="flex items-center justify-between px-6 py-4">
        <Link to="/">
          <Logo size="sm" />
        </Link>
        <button onClick={toggleTheme} className="btn-ghost p-2" aria-label="Toggle theme">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="text-center pb-6 text-xs text-[var(--color-muted)]">
        © {new Date().getFullYear()} Manji — Write. Ignite.
      </footer>
    </div>
  )
}
