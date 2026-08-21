/**
 * animationService.js
 * Thin wrappers around the animation API
 * (/api/projects/:projectId/animation/ and /api/animation/:id/...).
 */
import api from '../../services/api'

const LAYER_KINDS = [
  { value: 'background', label: 'Background' },
  { value: 'character',  label: 'Character' },
  { value: 'effects',    label: 'Effects' },
  { value: 'scene',      label: 'Scene' },
  { value: 'camera',     label: 'Camera' },
]

export const animationService = {
  LAYER_KINDS,

  // Project-scoped list / create
  async list(projectId, params = {}) {
    const { data } = await api.get(`/projects/${projectId}/animation/`, { params })
    return data
  },

  async create(projectId, payload) {
    const { data } = await api.post(`/projects/${projectId}/animation/`, payload)
    return data
  },

  // Standalone detail / update / delete
  async get(animationId) {
    const { data } = await api.get(`/animation/${animationId}/`)
    return data
  },

  async update(animationId, payload) {
    const { data } = await api.patch(`/animation/${animationId}/`, payload)
    return data
  },

  async remove(animationId) {
    const { data } = await api.delete(`/animation/${animationId}/`)
    return data
  },

  // Layers
  async listLayers(animationId) {
    const { data } = await api.get(`/animation/${animationId}/layers/`)
    return data
  },

  async createLayer(animationId, payload) {
    const { data } = await api.post(`/animation/${animationId}/layers/`, payload)
    return data
  },

  async updateLayer(layerId, payload) {
    const { data } = await api.patch(`/animation/layers/${layerId}/`, payload)
    return data
  },

  async removeLayer(layerId) {
    const { data } = await api.delete(`/animation/layers/${layerId}/`)
    return data
  },

  async reorderLayers(animationId, orderedIds) {
    const { data } = await api.post(`/animation/${animationId}/layers/reorder/`, { ordered_ids: orderedIds })
    return data
  },

  // Frames
  async listFrames(animationId) {
    const { data } = await api.get(`/animation/${animationId}/frames/`)
    return data
  },

  async createFrame(animationId, payload) {
    const { data } = await api.post(`/animation/${animationId}/frames/`, payload)
    return data
  },

  async updateFrame(frameId, payload) {
    const { data } = await api.patch(`/animation/frames/${frameId}/`, payload)
    return data
  },

  async removeFrame(frameId) {
    const { data } = await api.delete(`/animation/frames/${frameId}/`)
    return data
  },
}

export default animationService