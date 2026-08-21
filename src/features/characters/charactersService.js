/**
 * charactersService.js
 * Thin wrappers around the character API
 * (/api/projects/:projectId/characters/ and /api/characters/:id/).
 */
import api from '../../services/api'

const ROLES = [
  { value: 'protagonist', label: 'Protagonist' },
  { value: 'antagonist',  label: 'Antagonist' },
  { value: 'supporting',  label: 'Supporting' },
  { value: 'mentor',      label: 'Mentor' },
  { value: 'villain',     label: 'Villain' },
  { value: 'minor',       label: 'Minor' },
  { value: 'other',       label: 'Other' },
]

const RELATIONSHIP_TYPES = [
  { value: 'family',  label: 'Family' },
  { value: 'friend',  label: 'Friend' },
  { value: 'enemy',   label: 'Enemy' },
  { value: 'love',    label: 'Love interest' },
  { value: 'rival',   label: 'Rival' },
  { value: 'ally',    label: 'Ally' },
  { value: 'mentor',  label: 'Mentor' },
  { value: 'mentee',  label: 'Mentee' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'custom',  label: 'Custom' },
]

function toFormData(payload) {
  const fd = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return
    if (key === 'relationships') {
      fd.append('relationships', JSON.stringify(value))
      return
    }
    fd.append(key, value)
  })
  return fd
}

function hasFile(payload) {
  return typeof payload.avatar === 'object' && payload.avatar !== null
}

function body(payload) {
  // Avatar uploads must use multipart; everything else goes as JSON so nested
  // structures (relationships) keep their natural shape.
  return hasFile(payload)
    ? { data: toFormData(payload), headers: { 'Content-Type': 'multipart/form-data' } }
    : { data: payload }
}

export const charactersService = {
  ROLES,
  RELATIONSHIP_TYPES,

  // Project-scoped list / create
  async getCharacters(projectId, params = {}) {
    const { data } = await api.get(`/projects/${projectId}/characters/`, { params })
    return data
  },

  async createCharacter(projectId, payload) {
    const { data } = await api.post(`/projects/${projectId}/characters/`, body(payload).data, body(payload).headers)
    return data
  },

  // Standalone detail / update / delete
  async getCharacter(characterId) {
    const { data } = await api.get(`/characters/${characterId}/`)
    return data
  },

  async updateCharacter(characterId, payload) {
    const { data } = await api.patch(`/characters/${characterId}/`, body(payload).data, body(payload).headers)
    return data
  },

  async deleteCharacter(characterId) {
    const { data } = await api.delete(`/characters/${characterId}/`)
    return data
  },
}

export function roleLabel(value) {
  return ROLES.find((r) => r.value === value)?.label || value
}

export default charactersService