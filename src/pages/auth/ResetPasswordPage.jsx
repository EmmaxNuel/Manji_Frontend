/**
 * Reset Password Confirm page – sets a new password using uid + token from URL.
 */

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../../layouts/AuthLayout'
import { authService } from '../../services/authService'
import { Button, Input, PasswordInput } from '../../components/ui'

export default function ResetPasswordPage() {
  const { uid, token } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ new_password: '', new_password2: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setErrors((prev) => ({ ...prev, [e.target.name]: '' }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.new_password !== form.new_password2) {
      setErrors({ new_password2: 'Passwords do not match.' })
      return
    }
    setLoading(true)
    try {
      await authService.confirmPasswordReset(uid, token, form.new_password, form.new_password2)
      toast.success('Password reset! You can now log in.')
      navigate('/login')
    } catch (err) {
      const msg = err?.response?.data?.error?.message || 'Invalid or expired link.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="card p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold mb-1">Set new password</h1>
          <p className="text-sm text-[var(--color-muted)]">Choose a strong password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <PasswordInput
            id="new_password"
            name="new_password"
            label="New password"
            placeholder="8+ characters"
            value={form.new_password}
            onChange={handleChange}
            error={errors.new_password}
            required
          />
          <PasswordInput
            id="new_password2"
            name="new_password2"
            label="Confirm new password"
            placeholder="Repeat new password"
            value={form.new_password2}
            onChange={handleChange}
            error={errors.new_password2}
            required
          />
          <Button type="submit" loading={loading} className="w-full">
            Reset password
          </Button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-[var(--color-muted)] hover:text-primary-600">
            Back to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
