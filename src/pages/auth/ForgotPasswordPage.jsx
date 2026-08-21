/**
 * Forgot Password page – requests a password reset email.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import AuthLayout from '../../layouts/AuthLayout'
import { authService } from '../../services/authService'
import { Button, Input } from '../../components/ui'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await authService.requestPasswordReset(email)
      setSent(true)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <div className="card p-8">
        {sent ? (
          <div className="text-center space-y-4">
            <div className="text-5xl">📧</div>
            <h2 className="text-xl font-bold">Check your email</h2>
            <p className="text-sm text-[var(--color-muted)]">
              If an account with that email exists, we've sent a link to reset your password.
            </p>
            <Link to="/login" className="btn-primary inline-flex mt-4">
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold mb-1">Reset your password</h1>
              <p className="text-sm text-[var(--color-muted)]">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" loading={loading} className="w-full">
                Send reset link
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
              <Link to="/login" className="text-primary-600 hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
