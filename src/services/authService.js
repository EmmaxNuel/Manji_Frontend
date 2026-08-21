/**
 * Auth service – thin wrappers around auth API endpoints.
 */

import api from './api'

export const authService = {
  async register(email, username, password, password2) {
    const { data } = await api.post('/auth/register/', { email, username, password, password2 })
    return data
  },

  async login(email, password) {
    const { data } = await api.post('/auth/login/', { email, password })
    return data
  },

  async logout(refreshToken) {
    const { data } = await api.post('/auth/logout/', { refresh: refreshToken })
    return data
  },

  async refreshToken(refresh) {
    const { data } = await api.post('/auth/refresh/', { refresh })
    return data
  },

  async changePassword(oldPassword, newPassword, newPassword2) {
    const { data } = await api.post('/auth/password/change/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password2: newPassword2,
    })
    return data
  },

  async requestPasswordReset(email) {
    const { data } = await api.post('/auth/password/reset/', { email })
    return data
  },

  async confirmPasswordReset(uid, token, newPassword, newPassword2) {
    const { data } = await api.post('/auth/password/reset/confirm/', {
      uid,
      token,
      new_password: newPassword,
      new_password2: newPassword2,
    })
    return data
  },

  async googleLogin(idToken) {
    const { data } = await api.post('/auth/google/', { id_token: idToken })
    return data
  },
}
