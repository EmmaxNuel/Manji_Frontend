/**
 * assetsService.js
 * Thin wrappers around the Asset API (Phase 5).
 */
import api from '../../services/api'

export const assetKinds = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'document', label: 'Document' },
  { value: 'other', label: 'Other' },
]

export const assetsService = {
  // GET/POST /projects/:id/assets/
  async list(projectId, params = {}) {
    const { data } = await api.get(`/projects/${projectId}/assets/`, { params })
    return data.data
  },

  async upload(projectId, payload) {
    const { data } = await api.post(`/projects/${projectId}/assets/`, payload)
    return data.data
  },

  // GET/PATCH/DELETE /assets/:id/
  async get(id) {
    const { data } = await api.get(`/assets/${id}/`)
    return data.data
  },

  async update(id, payload) {
    const { data } = await api.patch(`/assets/${id}/`, payload)
    return data.data
  },

  async remove(id) {
    const { data } = await api.delete(`/assets/${id}/`)
    return data.data
  },

  // GET/POST /projects/:id/assets/tags/
  async listTags(projectId) {
    const { data } = await api.get(`/projects/${projectId}/assets/tags/`)
    return data.data
  },

  async createTag(projectId, name) {
    const { data } = await api.post(`/projects/${projectId}/assets/tags/`, { name })
    return data.data
  },

  // DELETE /assets/:id/tags/:name/
  async removeTag(assetId, name) {
    const { data } = await api.delete(`/assets/${assetId}/tags/${encodeURIComponent(name)}/`)
    return data.data
  },
}

export function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit += 1
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

export function isImageAsset(kind, mime) {
  return kind === 'image' || (mime || '').startsWith('image/')
}

export function isAudioAsset(kind, mime) {
  return kind === 'audio' || (mime || '').startsWith('audio/')
}

export function isVideoAsset(kind, mime) {
  return kind === 'video' || (mime || '').startsWith('video/')
}