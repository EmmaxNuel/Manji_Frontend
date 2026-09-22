/**
 * audioService.js
 * Thin wrappers around the Voice Studio API (Phase 9).
 *
 * GET/POST   /projects/:projectId/audio/                list / upload a voice
 * GET        /projects/:projectId/audio/timeline/<scene>/   per-scene timeline
 * GET/PATCH/DELETE /audio/:id/                          detail / edit / delete
 */
import api from '../../services/api'

export const audioKinds = [
  { value: 'dialogue',   label: 'Dialogue' },
  { value: 'voice_over', label: 'Voice-over' },
  { value: 'music',      label: 'Music' },
  { value: 'sfx',        label: 'Sound effect' },
]

export const audioService = {
  // GET / POST /projects/:projectId/audio/
  async list(projectId) {
    const { data } = await api.get(`/projects/${projectId}/audio/`)
    return data.data
  },

  async upload(projectId, payload) {
    const { data } = await api.post(`/projects/${projectId}/audio/`, payload)
    return data.data
  },

  // GET /projects/:projectId/audio/timeline/<sceneId>/
  async timeline(projectId, sceneId) {
    const { data } = await api.get(`/projects/${projectId}/audio/timeline/${sceneId}/`)
    return data.data
  },

  // GET / PATCH / DELETE /audio/:id/
  async get(id) {
    const { data } = await api.get(`/audio/${id}/`)
    return data.data
  },

  async update(id, payload) {
    const { data } = await api.patch(`/audio/${id}/`, payload)
    return data.data
  },

  async remove(id) {
    const { data } = await api.delete(`/audio/${id}/`)
    return data.data
  },
}

export function kindLabel(value) {
  return audioKinds.find((k) => k.value === value)?.label || 'Dialogue'
}

export function formatSeconds(seconds) {
  if (!seconds || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default audioService
