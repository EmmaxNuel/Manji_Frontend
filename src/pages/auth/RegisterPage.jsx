/**
 * Register page
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../../layouts/AuthLayout'
import { useAuth } from '../../context/AuthContext'
import { useTour } from '../../features/tour/TourContext'
import { Button, Input, PasswordInput } from '../../components/ui'

export default function RegisterPage() {
  const { register } = useAuth()
  const { openPostRegistration } = useTour()
  const navigate = useNavigate()

  const [form, setForm] = useState({ email: '', username: '', password: '', password2: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      await register(form.email, form.username, form.password, form.password2)
      toast.success('Welcome to Manji! 🎉')
      openPostRegistration()
      navigate('/')
    } catch (err) {
      const data = err?.response?.data
      if (data?.error?.details && typeof data.error.details === 'object') {
        // Field-level errors from DRF
        const fieldErrors = {}
        Object.entries(data.error.details).forEach(([key, val]) => {
          fieldErrors[key] = Array.isArray(val) ? val[0] : val
        })
        setErrors(fieldErrors)
      } else {
        toast.error(data?.error?.message || 'Registration failed. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="card p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-1">Create an account</h1>
          <p className="text-sm text-[var(--color-muted)]">Join Manji and start your story</p>
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
            error={errors.email}
            required
            autoComplete="email"
          />
          <Input
            id="username"
            name="username"
            type="text"
            label="Username"
            placeholder="yourname"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
            required
            autoComplete="username"
          />
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            placeholder="8+ characters"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            required
            autoComplete="new-password"
          />
          <PasswordInput
            id="password2"
            name="password2"
            label="Confirm password"
            placeholder="Repeat your password"
            value={form.password2}
            onChange={handleChange}
            error={errors.password2}
            required
            autoComplete="new-password"
          />

          <Button type="submit" loading={loading} className="w-full mt-2">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
