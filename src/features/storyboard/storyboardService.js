/**
 * storyboardService.js
 * Thin wrappers around the Storyboard API (Phase 6).
 */
import api from '../../services/api'
import { CAMERA_TYPES, cameraTypeLabel } from '../../utils/cameraTypes'

export const shotTypes = CAMERA_TYPES

export const cameraMovements = [
  { value: 'static', label: 'Static' },
  { value: 'pan', label: 'Pan' },
  { value: 'tilt', label: 'Tilt' },
  { value: 'tracking', label: 'Tracking' },
  { value: 'zoom', label: 'Zoom' },
  { value: 'dolly', label: 'Dolly' },
  { value: 'handheld', label: 'Handheld' },
]

export const aspectRatios = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '16:9', label: 'Standard (16:9)' },
  { value: '9:16', label: 'Tall (9:16)' },
  { value: 'portrait', label: 'Manga page (portrait)' },
  { value: '21:9', label: 'Ultrawide (21:9)' },
]

export const storyboardService = {
  // GET/POST /projects/:id/storyboard/
  async list(projectId, params = {}) {
    const { data } = await api.get(`/projects/${projectId}/storyboard/`, { params })
    return data.data
  },

  async create(projectId, payload) {
    const { data } = await api.post(`/projects/${projectId}/storyboard/`, payload)
    return data.data
  },

  // GET/PATCH/DELETE /storyboard/:panelId/
  async get(panelId) {
    const { data } = await api.get(`/storyboard/${panelId}/`)
    return data.data
  },

  async update(panelId, payload) {
    const { data } = await api.patch(`/storyboard/${panelId}/`, payload)
    return data.data
  },

  async remove(panelId) {
    const { data } = await api.delete(`/storyboard/${panelId}/`)
    return data.data
  },

  // POST /projects/:id/storyboard/reorder/
  async reorder(projectId, sceneId, orderedIds) {
    const { data } = await api.post(`/projects/${projectId}/storyboard/reorder/`, {
      scene_id: sceneId,
      ordered_ids: orderedIds,
    })
    return data.data
  },
}

export function shotLabel(value) {
  return cameraTypeLabel(value)
}

export function movementLabel(value) {
  return cameraMovements.find((m) => m.value === value)?.label || value || '—'
}