/**
 * Login page
 */

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../../layouts/AuthLayout'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, PasswordInput } from '../../components/ui'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(form.email, form.password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Login failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="card p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-sm text-[var(--color-muted)]">Log in to your Manji account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <Input
            id="email"
            name="email"
            type="email"
            label="Email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
            autoComplete="email"
          />
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            placeholder="Your password"
            value={form.password}
            onChange={handleChange}
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="text-sm text-red-500 text-center bg-red-50 dark:bg-red-950/30 rounded-lg px-4 py-2">
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Log in
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-sm text-[var(--color-muted)] hover:text-primary-600">
            Forgot your password?
          </Link>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
