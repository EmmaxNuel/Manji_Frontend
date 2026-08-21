/**
 * scenesService.js
 * Thin wrappers around the scene API (/api/projects/:projectId/scenes/ and /api/scenes/).
 */
import api from '../../services/api'

export const scenesService = {
  // Project-scoped list / create
  async getScenes(projectId, params = {}) {
    const { data } = await api.get(`/projects/${projectId}/scenes/`, { params })
    return data
  },

  async createScene(projectId, payload) {
    const { data } = await api.post(`/projects/${projectId}/scenes/`, payload)
    return data
  },

  async reorderScenes(projectId, orderedIds) {
    const { data } = await api.post(`/projects/${projectId}/scenes/reorder/`, { ordered_ids: orderedIds })
    return data
  },

  // Standalone detail / update / delete
  async getScene(sceneId) {
    const { data } = await api.get(`/scenes/${sceneId}/`)
    return data
  },

  async updateScene(sceneId, payload) {
    const { data } = await api.patch(`/scenes/${sceneId}/`, payload)
    return data
  },

  async deleteScene(sceneId) {
    const { data } = await api.delete(`/scenes/${sceneId}/`)
    return data
  },
}

export default scenesService