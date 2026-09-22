/**
 * projectsService.js
 * Thin wrappers around the project API endpoints (/api/projects/).
 */
import api from '../../services/api'

export const projectsService = {
  // ---------------------------------------------------------------------------
  // List / create
  // ---------------------------------------------------------------------------
  async getProjects(params = {}) {
    const { data } = await api.get('/projects/', { params })
    return data
  },

  async createProject(formData) {
    const { data } = await api.post('/projects/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  // ---------------------------------------------------------------------------
  // Detail / update / delete
  // ---------------------------------------------------------------------------
  async getProject(projectId) {
    const { data } = await api.get(`/projects/${projectId}/`)
    return data
  },

  async updateProject(projectId, formData) {
    const { data } = await api.patch(`/projects/${projectId}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async deleteProject(projectId) {
    const { data } = await api.delete(`/projects/${projectId}/`)
    return data
  },

  // ---------------------------------------------------------------------------
  // Linked story (writing inside the studio)
  // ---------------------------------------------------------------------------
  async getProjectStory(projectId) {
    const { data } = await api.get(`/projects/${projectId}/story/`)
    return data
  },

  async createStory(projectId, payload) {
    const { data } = await api.post(`/projects/${projectId}/story/`, payload)
    return data
  },

  async linkStory(projectId, storyId) {
    const { data } = await api.post(`/projects/${projectId}/story/link/`, { story_id: storyId })
    return data
  },

  async unlinkStory(projectId) {
    const { data } = await api.post(`/projects/${projectId}/story/unlink/`)
    return data
  },

  // ---------------------------------------------------------------------------
  // Story picker for linking existing stories
  // ---------------------------------------------------------------------------
  async getStoriesForLinking(projectId, search = '') {
    const { data } = await api.get(`/projects/${projectId}/story/picker/`, {
      params: search ? { search } : {},
    })
    return data
  },
}

// ---------------------------------------------------------------------------
// Shared constants (mirrors the backend Project model choices)
// ---------------------------------------------------------------------------
export const PROJECT_TYPES = [
  { value: 'story',     label: 'Story',     description: 'Novels, short stories & web novels', Icon: 'BookOpen' },
  { value: 'comic',     label: 'Comic',     description: 'Western-style comics',               Icon: 'PenTool' },
  { value: 'manga',     label: 'Manga',     description: 'Japanese-style manga',               Icon: 'Brush' },
  { value: 'manhua',    label: 'Manhua',    description: 'Chinese & Korean manhua/manhwa',     Icon: 'Palette' },
  { value: 'animation', label: 'Animation', description: 'Anime & motion animation',           Icon: 'Clapperboard' },
]

export const ART_STYLES = [
  { value: 'anime',            label: 'Anime',                         description: 'Colorful anime art' },
  { value: 'manga_bw',         label: 'Manga (B&W)',                   description: 'Black & white with screentone' },
  { value: 'manhua',           label: 'Manhua / Manhwa',               description: 'Manhua & manhwa style' },
  { value: 'western_cartoon',  label: 'Western cartoon',               description: 'Classic cartoon look' },
  { value: 'semi_realistic',   label: 'Semi-realistic',                description: 'Stylized realism' },
  { value: 'custom',           label: 'Custom',                        description: 'Your own style description' },
]

export function projectTypeLabel(value) {
  return PROJECT_TYPES.find((t) => t.value === value)?.label || value
}

export function artStyleLabel(value) {
  return ART_STYLES.find((s) => s.value === value)?.label || value
}