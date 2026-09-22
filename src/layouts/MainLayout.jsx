/**
 * MainLayout
 *
 * MovieBox-inspired dark entertainment platform layout
 * - Desktop: sleek top navigation with glass morphism
 * - Mobile: bottom navigation bar with blur effects
 */

import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { BookOpen, Compass, FolderOpen, Library, PenSquare, Sun, Moon, LogOut, User, ChevronDown, HelpCircle, Sparkles } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useTour } from '../features/tour/TourContext'
import { Avatar, Logo } from '../components/ui'

const navLinks = [
  { to: '/',          label: 'Home',     Icon: BookOpen   },
  { to: '/official',  label: 'Official', Icon: Sparkles   },
  { to: '/discover',  label: 'Discover', Icon: Compass    },
  { to: '/projects',  label: 'Projects', Icon: FolderOpen },
  { to: '/library',   label: 'Library',  Icon: Library    },
  { to: '/create',    label: 'Create',   Icon: PenSquare  },
]

const themeBtnStyle = {
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.5rem',
  padding: '0.5rem',
  transition: 'all 0.2s',
}
const themeBtnHover = {
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text)',
}

const userBtnStyle = {
  background: 'var(--color-bg-tertiary)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.5rem',
  padding: '0.25rem',
  transition: 'all 0.2s',
}
const userBtnHover = {
  background: 'var(--color-bg-tertiary)',
}

const dropdownStyle = {
  background: 'var(--color-card)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.75rem',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
}
const dropdownLinkStyle = {
  color: 'var(--color-text)',
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  transition: 'all 0.2s',
}
const dropdownLinkHover = {
  background: 'var(--color-bg-tertiary)',
}
const dropdownDividerStyle = {
  borderColor: 'var(--color-border)',
  margin: '0.25rem 0',
}
const dropdownLogoutStyle = {
  color: '#ef4444',
  padding: '0.75rem 1rem',
  fontSize: '0.875rem',
  width: '100%',
  transition: 'all 0.2s',
}
const dropdownLogoutHover = {
  background: 'rgba(239, 68, 68, 0.1)',
}

const mobileNavLinkActiveStyle = {
  color: 'var(--color-primary)',
  background: 'rgba(255, 107, 53, 0.1)',
}
const mobileNavLinkInactiveStyle = {
  color: 'var(--color-text-secondary)',
  transition: 'all 0.2s',
}
const mobileNavLinkHover = {
  color: 'var(--color-text)',
}

const mobileUserLinkStyle = {
  background: 'var(--color-input-bg)',
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.5rem',
  padding: '0.5rem',
  transition: 'all 0.2s',
}
const mobileUserLinkHover = {
  background: 'var(--color-bg-tertiary)',
}
const mobileUserNameStyle = {
  color: 'var(--color-text)',
  fontWeight: '500',
  fontSize: '0.875rem',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}
const mobileUserSubtextStyle = {
  color: 'var(--color-text-muted)',
  fontSize: '0.75rem',
}
const mobileUserIconStyle = {
  color: 'var(--color-text-muted)',
}
const mobileTourBtnStyle = {
  background: 'var(--color-input-bg)',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border)',
  borderRadius: '0.5rem',
  padding: '0.5rem',
  width: '100%',
  transition: 'all 0.2s',
  fontSize: '0.875rem',
}
const mobileTourBtnHover = {
  background: 'var(--color-bg-tertiary)',
  color: 'var(--color-text)',
}

export default function MainLayout({ children }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { startTour } = useTour()
  const navigate = useNavigate()
  const location = useLocation()
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

  const handleThemeMouseEnter = (e) => {
    e.currentTarget.style.background = 'var(--color-bg-tertiary)'
    e.currentTarget.style.color = 'var(--color-text)'
  }
  const handleThemeMouseLeave = (e) => {
    e.currentTarget.style.background = 'var(--color-bg-tertiary)'
    e.currentTarget.style.color = 'var(--color-text-secondary)'
  }
  const handleUserBtnMouseEnter = (e) => {
    e.currentTarget.style.background = 'var(--color-bg-tertiary)'
  }
  const handleUserBtnMouseLeave = (e) => {
    e.currentTarget.style.background = 'var(--color-bg-tertiary)'
  }
  const handleDropdownLinkMouseEnter = (e) => {
    e.currentTarget.style.background = 'var(--color-bg-tertiary)'
  }
  const handleDropdownLinkMouseLeave = (e) => {
    e.currentTarget.style.background = 'transparent'
  }
  const handleLogoutMouseEnter = (e) => {
    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
  }
  const handleLogoutMouseLeave = (e) => {
    e.currentTarget.style.background = 'transparent'
  }
  const handleMobileNavLinkMouseEnter = (e) => {
    if (!e.currentTarget.dataset.active) {
      e.currentTarget.style.color = 'var(--color-text)'
    }
  }
  const handleMobileNavLinkMouseLeave = (e) => {
    if (!e.currentTarget.dataset.active) {
      e.currentTarget.style.color = 'var(--color-text-secondary)'
    }
  }
  const handleMobileUserLinkMouseEnter = (e) => {
    e.currentTarget.style.background = 'var(--color-bg-tertiary)'
  }
  const handleMobileUserLinkMouseLeave = (e) => {
    e.currentTarget.style.background = 'var(--color-input-bg)'
  }
  const handleMobileTourBtnMouseEnter = (e) => {
    e.currentTarget.style.background = 'var(--color-bg-tertiary)'
    e.currentTarget.style.color = 'var(--color-text)'
  }
  const handleMobileTourBtnMouseLeave = (e) => {
    e.currentTarget.style.background = 'var(--color-input-bg)'
    e.currentTarget.style.color = 'var(--color-text-secondary)'
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
                style={themeBtnStyle}
                onMouseEnter={handleThemeMouseEnter}
                onMouseLeave={handleThemeMouseLeave}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* Take a tour (signed-in users) */}
              {user && (
                <button
                  onClick={() => startTour('welcome')}
                  title="Take the tour"
                  aria-label="Take the tour"
                  style={themeBtnStyle}
                  onMouseEnter={handleThemeMouseEnter}
                  onMouseLeave={handleThemeMouseLeave}
                >
                  <HelpCircle size={18} />
                </button>
              )}

              {/* User menu or auth buttons */}
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    style={userBtnStyle}
                    onMouseEnter={handleUserBtnMouseEnter}
                    onMouseLeave={handleUserBtnMouseLeave}
                  >
                    <Avatar src={user.profile?.avatar} username={user.username} size="sm" />
                    <span style={mobileUserNameStyle}>{user.username}</span>
                    <ChevronDown size={16} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--color-text-muted)' }} />
                  </button>

                  {dropdownOpen && (
                    <div style={dropdownStyle} className="absolute right-0 mt-2 w-56 rounded-xl py-2">
                      <Link
                        to={`/profile/${user.username}`}
                        style={dropdownLinkStyle}
                        onMouseEnter={handleDropdownLinkMouseEnter}
                        onMouseLeave={handleDropdownLinkMouseLeave}
                        onClick={() => setDropdownOpen(false)}
                      >
                        <User size={16} style={{ color: 'var(--color-text)' }} />
                        <span style={{ marginLeft: '0.75rem' }}>My Profile</span>
                      </Link>
                      <hr style={dropdownDividerStyle} />
                      <button
                        onClick={handleLogout}
                        style={dropdownLogoutStyle}
                        onMouseEnter={handleLogoutMouseEnter}
                        onMouseLeave={handleLogoutMouseLeave}
                      >
                        <LogOut size={16} style={{ color: '#ef4444' }} />
                        <span style={{ marginLeft: '0.75rem' }}>Sign Out</span>
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
        <div className="grid grid-cols-6 h-16">
          {navLinks.map(({ to, label, Icon }) => {
            const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to))
            return (
              <NavLink
                key={to}
                to={to}
                className={({ isActive: navActive }) =>
                  `flex flex-col items-center justify-center gap-1 py-2 text-xs transition-all duration-200 font-medium ${
                    navActive ? 'text-orange-500 bg-orange-500/10' : ''
                  }`
                }
                style={isActive ? mobileNavLinkActiveStyle : mobileNavLinkInactiveStyle}
                onMouseEnter={handleMobileNavLinkMouseEnter}
                onMouseLeave={handleMobileNavLinkMouseLeave}
                data-active={isActive}
              >
                <Icon size={20} style={{ color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)' }} />
                <span>{label}</span>
              </NavLink>
            )
          })}
        </div>

        {/* Mobile user section */}
        <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--color-border)' }}>
          {user ? (
            <>
              <Link
                to={`/profile/${user.username}`}
                style={mobileUserLinkStyle}
                onMouseEnter={handleMobileUserLinkMouseEnter}
                onMouseLeave={handleMobileUserLinkMouseLeave}
              >
                <Avatar src={user.profile?.avatar} username={user.username} size="sm" />
                <div className="flex-1 min-w-0">
                  <div style={mobileUserNameStyle}>{user.username}</div>
                  <div style={mobileUserSubtextStyle}>View Profile</div>
                </div>
                <User size={16} style={mobileUserIconStyle} />
              </Link>
              <button
                onClick={() => startTour('welcome')}
                style={mobileTourBtnStyle}
                onMouseEnter={handleMobileTourBtnMouseEnter}
                onMouseLeave={handleMobileTourBtnMouseLeave}
              >
                <HelpCircle size={16} style={{ color: 'var(--color-text-secondary)' }} />
                <span style={{ color: 'var(--color-text-secondary)' }}>Take the tour</span>
              </button>
            </>
          ) : (
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-sm bg-gradient-to-r from-orange-500 to-orange-600 text-white"
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