/**
 * Reusable UI primitives.
 * Each component is exported individually.
 */

import { useState } from 'react'
import logo from '../../assets/logo.png'

// ---------------------------------------------------------------------------
// Logo – Manji brand mark
// ---------------------------------------------------------------------------
export function Logo({ size = 'md', withText = true, className = '' }) {
  const sizes = { sm: 'h-8 w-8', md: 'h-10 w-10', lg: 'h-12 w-12' }
  const textSizes = { sm: 'text-xl', md: 'text-2xl', lg: 'text-3xl' }
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={logo}
        alt="Manji logo"
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 shadow-lg shadow-orange-500/20 ring-1 ring-orange-500/30`}
      />
      {withText && (
        <span
          className={`${textSizes[size]} font-black bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent`}
        >
          Manji
        </span>
      )}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Spinner
// ---------------------------------------------------------------------------
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }
  return (
    <svg
      className={`animate-spin text-primary-600 ${sizes[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// LoadingScreen – full-page blocking spinner used during bootstrap
// ---------------------------------------------------------------------------
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[var(--color-bg)]">
      <div className="flex flex-col items-center gap-4">
        <Logo size="lg" withText={false} />
        <Spinner size="lg" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Input
// ---------------------------------------------------------------------------
export function Input({ label, error, id, ...props }) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <input id={id} className="input-field" {...props} />
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// PasswordInput – input with show/hide toggle
// ---------------------------------------------------------------------------
export function PasswordInput({ label, error, id, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="label">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className="input-field pr-10"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>
      {error && <p className="error-text">{error}</p>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
export function Button({ variant = 'primary', loading = false, children, className = '', ...props }) {
  const base =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'secondary'
      ? 'btn-secondary'
      : 'btn-ghost'
  return (
    <button className={`${base} ${className}`} disabled={loading || props.disabled} {...props}>
      {loading && <Spinner size="sm" className="text-current" />}
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Avatar
// ---------------------------------------------------------------------------
export function Avatar({ src, username, size = 'md' }) {
  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl',
  }
  const initials = (username || '?')[0].toUpperCase()
  return src ? (
    <img
      src={src}
      alt={username}
      className={`${sizes[size]} rounded-full object-cover bg-primary-100 dark:bg-primary-900 flex-shrink-0`}
    />
  ) : (
    <div
      className={`${sizes[size]} rounded-full bg-primary-600 text-white font-semibold flex items-center justify-center flex-shrink-0`}
    >
      {initials}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Badge
// ---------------------------------------------------------------------------
export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    primary: 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300',
    success: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    warning: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',
    danger: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    accent: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------
export function Divider({ label }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <span className="flex-1 h-px bg-[var(--color-border)]" />
      {label && <span className="text-xs text-[var(--color-muted)]">{label}</span>}
      <span className="flex-1 h-px bg-[var(--color-border)]" />
    </div>
  )
}
