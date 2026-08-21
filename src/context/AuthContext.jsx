/**
 * AuthContext
 *
 * Provides: user, isAuthenticated, isLoading, login, register, logout,
 *           updateUser (after profile edit).
 *
 * Tokens are stored in localStorage.  On mount we re-hydrate the user by
 * calling /users/me/ using the stored access token.  The Axios interceptor
 * handles transparent refresh so this call succeeds even if the access token
 * has expired (as long as the refresh token is still valid).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { authService } from '../services/authService'
import { userService } from '../services/userService'

const AuthContext = createContext(null)

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // true while bootstrapping
}

function authReducer(state, action) {
  switch (action.type) {
    case 'BOOTSTRAP_COMPLETE':
      return { ...state, isLoading: false }
    case 'LOGIN_SUCCESS':
      return { user: action.payload, isAuthenticated: true, isLoading: false }
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, isLoading: false }
    case 'UPDATE_USER':
      return { ...state, user: action.payload }
    default:
      return state
  }
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // On mount: attempt to load authenticated user from stored tokens
  useEffect(() => {
    async function bootstrap() {
      const accessToken = localStorage.getItem('access_token')
      if (!accessToken) {
        dispatch({ type: 'BOOTSTRAP_COMPLETE' })
        return
      }
      try {
        const res = await userService.getMe()
        dispatch({ type: 'LOGIN_SUCCESS', payload: res.data })
      } catch {
        // Token invalid / expired beyond refresh – clear storage
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        dispatch({ type: 'BOOTSTRAP_COMPLETE' })
      }
    }
    bootstrap()
  }, [])

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------
  const login = useCallback(async (email, password) => {
    const res = await authService.login(email, password)
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    dispatch({ type: 'LOGIN_SUCCESS', payload: res.data.user })
    return res
  }, [])

  const register = useCallback(async (email, username, password, password2) => {
    const res = await authService.register(email, username, password, password2)
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    dispatch({ type: 'LOGIN_SUCCESS', payload: res.data.user })
    return res
  }, [])

  const googleLogin = useCallback(async (idToken) => {
    const res = await authService.googleLogin(idToken)
    localStorage.setItem('access_token', res.data.access)
    localStorage.setItem('refresh_token', res.data.refresh)
    dispatch({ type: 'LOGIN_SUCCESS', payload: res.data.user })
    return res
  }, [])

  const logout = useCallback(async () => {
    const refresh = localStorage.getItem('refresh_token')
    try {
      if (refresh) await authService.logout(refresh)
    } catch {
      // If server-side logout fails, still clear client state
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    dispatch({ type: 'LOGOUT' })
  }, [])

  const updateUser = useCallback((updatedUser) => {
    dispatch({ type: 'UPDATE_USER', payload: updatedUser })
  }, [])

  const value = useMemo(
    () => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      isLoading: state.isLoading,
      login,
      register,
      googleLogin,
      logout,
      updateUser,
    }),
    [state, login, register, googleLogin, logout, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
