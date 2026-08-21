/**
 * User / profile service.
 */

import api from './api'

export const userService = {
  async getMe() {
    const { data } = await api.get('/users/me/')
    return data
  },

  async updateMe(formData) {
    // Use multipart for avatar uploads
    const { data } = await api.patch('/users/me/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async getUser(username) {
    const { data } = await api.get(`/users/${username}/`)
    return data
  },

  async follow(username) {
    const { data } = await api.post(`/users/${username}/follow/`)
    return data
  },

  async getFollowers(username, page = 1) {
    const { data } = await api.get(`/users/${username}/followers/?page=${page}`)
    return data
  },

  async getFollowing(username, page = 1) {
    const { data } = await api.get(`/users/${username}/following/?page=${page}`)
    return data
  },

  async becomeCreator() {
    const { data } = await api.post('/users/me/become-creator/')
    return data
  },
}
