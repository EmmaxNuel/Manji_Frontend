/**
 * GoogleSignInButton.jsx
 *
 * Uses Google Identity Services (GIS) to sign in with Google.
 * Calls /api/auth/google/ with the ID token.
 */

import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'

export default function GoogleSignInButton({ onSuccess }) {
  const { googleLogin } = useAuth()
  const buttonRef = useRef(null)
  const googleInitialized = useRef(false)

  useEffect(() => {
    if (googleInitialized.current) return
    if (!buttonRef.current) return

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
    if (!clientId) {
      console.warn('VITE_GOOGLE_CLIENT_ID is not set. Google Sign-In will not work.')
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    document.head.appendChild(script)

    script.onload = () => {
      if (!window.google?.accounts?.id || googleInitialized.current) return
      googleInitialized.current = true

      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          const idToken = response.credential
          if (!idToken) return

          try {
            const res = await googleLogin(idToken)
            toast.success('Signed in with Google!')
            if (onSuccess) onSuccess()
          } catch (err) {
            toast.error(err?.response?.data?.error?.message || 'Google sign-in failed.')
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      })

      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
          text: 'signin_with',
        })
      }
    }

    return () => {
      script.onload = null
    }
  }, [googleLogin, onSuccess])

  return (
    <div className="w-full">
      <div ref={buttonRef} className="flex justify-center" />
    </div>
  )
}

