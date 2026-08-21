/**
 * aiService.js
 * Thin wrappers around the Manji AI endpoints (image + idea generation).
 */
import api from './api'

export const aiService = {
  // ---------------------------------------------------------------------------
  // Image generation
  // ---------------------------------------------------------------------------
  // POST /stories/ai/images/generate/ – starts an async job, returns 202 + job
  async generateImage(payload) {
    const { data } = await api.post('/stories/ai/images/generate/', payload)
    return data
  },

  // Poll a generation job until completed/failed
  async getGeneration(id) {
    const { data } = await api.get(`/stories/ai/generations/${id}/`)
    return data
  },

  async listGenerations(params = {}) {
    const { data } = await api.get('/stories/ai/generations/', { params })
    return data
  },

  async deleteGeneration(id) {
    const { data } = await api.delete(`/stories/ai/generations/${id}/`)
    return data
  },

  // Gallery of finished AI images for the user's stories
  async listImages(params = {}) {
    const { data } = await api.get('/stories/ai/images/', { params })
    return data
  },

  async getImage(id) {
    const { data } = await api.get(`/stories/ai/images/${id}/`)
    return data
  },

  async deleteImage(id) {
    const { data } = await api.delete(`/stories/ai/images/${id}/`)
    return data
  },

  // Apply an image as a story cover or chapter page
  async applyImage(id, payload) {
    const { data } = await api.post(`/stories/ai/images/${id}/apply/`, payload)
    return data
  },

  // ---------------------------------------------------------------------------
  // Idea generation
  // ---------------------------------------------------------------------------
  async generateIdeas(payload) {
    const { data } = await api.post('/stories/ai/ideas/', payload)
    return data
  },

  async generateTitles(payload) {
    const { data } = await api.post('/stories/ai/titles/', payload)
    return data
  },

  async generateOutline(payload) {
    const { data } = await api.post('/stories/ai/outline/', payload)
    return data
  },

  // ---------------------------------------------------------------------------
  // Usage / quota
  // ---------------------------------------------------------------------------
  async getUsage() {
    const { data } = await api.get('/stories/ai/usage/')
    return data.data
  },

  // ---------------------------------------------------------------------------
  // Manji AI chat (Phase 1)
  // ---------------------------------------------------------------------------
  // POST /ai/chat/ – one chat turn within a story conversation
  async chat(payload) {
    const { data } = await api.post('/ai/chat/', payload)
    return data
  },

  // GET /stories/:id/ai/context/ – relevant story context snapshot
  async getStoryContext(storyId) {
    const { data } = await api.get(`/stories/${storyId}/ai/context/`)
    return data.data
  },

  // GET /stories/:id/ai/conversations/ – the creator's conversations
  async getConversations(storyId) {
    const { data } = await api.get(`/stories/${storyId}/ai/conversations/`)
    return data.data
  },

  // GET /ai/conversations/:id/ – a conversation with its messages
  async getConversation(id) {
    const { data } = await api.get(`/ai/conversations/${id}/`)
    return data.data
  },

  // DELETE /ai/conversations/:id/
  async deleteConversation(id) {
    const { data } = await api.delete(`/ai/conversations/${id}/`)
    return data
  },

  // ---------------------------------------------------------------------------
  // Project-scoped Manji AI co-author (MANJI STUDIO workspace)
  // ---------------------------------------------------------------------------
  // POST /projects/:id/ai/chat/ – one co-author turn within a project
  async projectChat(projectId, payload) {
    const { data } = await api.post(`/projects/${projectId}/ai/chat/`, payload)
    return data
  },

  // GET /projects/:id/ai/context/ – project snapshot (cast + scene board)
  async getProjectContext(projectId) {
    const { data } = await api.get(`/projects/${projectId}/ai/context/`)
    return data.data
  },

  // GET /projects/:id/ai/conversations/ – the creator's project conversations
  async getProjectConversations(projectId) {
    const { data } = await api.get(`/projects/${projectId}/ai/conversations/`)
    return data.data
  },
}

export default aiService