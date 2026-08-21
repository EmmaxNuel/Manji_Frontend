/**
 * MainLayout
 *
 * MovieBox-inspired dark entertainment platform layout
 * - Desktop: sleek top navigation with glass morphism
 * - Mobile: bottom navigation bar with blur effects
 */

import { Link, NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, Compass, FolderOpen, Library, PenSquare, Sun, Moon, LogOut, User, ChevronDown, HelpCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useTour } from '../features/tour/TourContext'
import { Avatar, Logo } from '../components/ui'

const navLinks = [
  { to: '/',          label: 'Home',     Icon: BookOpen   },
  { to: '/discover',  label: 'Discover', Icon: Compass    },
  { to: '/projects',  label: 'Projects', Icon: FolderOpen },
  { to: '/library',   label: 'Library',  Icon: Library    },
  { to: '/create',    label: 'Create',   Icon: PenSquare  },
]

export default function MainLayout({ children }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { startTour } = useTour()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleLogout() {
    try {
      await logout()
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[var(--color-bg)]/80 border-b border-[var(--color-border)]">
        <div className="page-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <Logo size="md" />
            </Link>

            {/* Center Navigation */}
            <div className="flex items-center gap-2">
              {navLinks.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <Icon size={18} />
                  <span className="font-medium">{label}</span>
                </NavLink>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Take a tour (signed-in users) */}
              {user && (
                <button
                  onClick={() => startTour('welcome')}
                  title="Take the tour"
                  aria-label="Take the tour"
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-200"
                >
                  <HelpCircle size={18} />
                </button>
              )}

              {/* User menu or auth buttons */}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200"
                  >
                    <Avatar src={user.profile?.avatar} username={user.username} size="sm" />
                    <span className="text-white font-medium text-sm px-2">{user.username}</span>
                    <ChevronDown size={16} className={`text-white/70 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 glass rounded-xl py-2 shadow-2xl">
                      <Link
                        to={`/profile/${user.username}`}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User size={16} />
                        My Profile
                      </Link>
                      <hr className="my-1 border-white/10" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut size={16} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link to="/login" className="btn-ghost text-sm px-4 py-2">
                    Sign In
                  </Link>
                  <Link to="/register" className="btn-primary text-sm px-6 py-2">
                    Join Now
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="md:pt-16">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl bg-[var(--color-bg)]/90 border-t border-[var(--color-border)]">
        <div className="grid grid-cols-5 h-16">
          {navLinks.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 py-2 text-xs transition-all duration-200 ${
                  isActive 
                    ? 'text-orange-500 bg-orange-500/10' 
                    : 'text-white/60 hover:text-white'
                }`
              }
            >
              <Icon size={20} />
              <span className="font-medium">{label}</span>
            </NavLink>
          ))}
        </div>

        {/* Mobile user section */}
        <div className="px-4 pb-4 pt-2 border-t border-white/5">
          {user ? (
            <>
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Avatar src={user.profile?.avatar} username={user.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm truncate">{user.username}</div>
                  <div className="text-white/50 text-xs">View Profile</div>
                </div>
                <User size={16} className="text-white/40" />
              </Link>
              <button
                onClick={() => startTour('welcome')}
                className="flex items-center gap-2 w-full mt-1 px-2 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm transition-colors"
              >
                <HelpCircle size={16} />
                <span>Take the tour</span>
              </button>
            </>
          ) : (
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 py-3 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-sm"
            >
              <User size={18} />
              <span>Join Manji</span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  )
}