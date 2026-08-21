/**
 * storyService.js
 * Thin wrappers around all story & chapter API endpoints.
 */
import api from './api'

export const storyService = {
  // ---------------------------------------------------------------------------
  // Genres & Tags
  // ---------------------------------------------------------------------------
  async getGenres() {
    const { data } = await api.get('/stories/genres/')
    return data // { success, data: Genre[] }
  },

  async getTags(query = '') {
    const params = query ? { q: query } : {}
    const { data } = await api.get('/stories/tags/', { params })
    return data
  },

  // ---------------------------------------------------------------------------
  // Stories – list / create
  // ---------------------------------------------------------------------------
  async getStories(params = {}) {
    const { data } = await api.get('/stories/', { params })
    return data // paginated: { count, next, previous, results }
  },

  async createStory(formData) {
    const { data } = await api.post('/stories/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  // ---------------------------------------------------------------------------
  // Stories – detail / update / delete
  // ---------------------------------------------------------------------------
  async getStory(slug) {
    const { data } = await api.get(`/stories/${slug}/`)
    return data
  },

  async updateStory(slug, formData) {
    const { data } = await api.patch(`/stories/${slug}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  async deleteStory(slug) {
    const { data } = await api.delete(`/stories/${slug}/`)
    return data
  },

  // ---------------------------------------------------------------------------
  // Story actions
  // ---------------------------------------------------------------------------
  async likeStory(slug) {
    const { data } = await api.post(`/stories/${slug}/like/`)
    return data
  },

  async bookmarkStory(slug) {
    const { data } = await api.post(`/stories/${slug}/bookmark/`)
    return data
  },

  async followStory(slug) {
    const { data } = await api.post(`/stories/${slug}/follow/`)
    return data
  },

  // ---------------------------------------------------------------------------
  // Publish / unpublish
  // ---------------------------------------------------------------------------
  async publishStory(slug) {
    const { data } = await api.post(`/stories/${slug}/publish/`)
    return data
  },

  async unpublishStory(slug) {
    const { data } = await api.post(`/stories/${slug}/unpublish/`)
    return data
  },

  // ---------------------------------------------------------------------------
  // My stories (creator dashboard)
  // ---------------------------------------------------------------------------
  async getMyStories(params = {}) {
    const { data } = await api.get('/stories/mine/', { params })
    return data
  },

  async getMyStats() {
    const { data } = await api.get('/stories/mine/stats/')
    return data.data
  },

  async getMyAnalytics() {
    const { data } = await api.get('/stories/mine/analytics/')
    return data.data
  },

  // ---------------------------------------------------------------------------
  // Discovery – recommendations & creator spotlights
  // ---------------------------------------------------------------------------
  async getRecommended() {
    const { data } = await api.get('/stories/recommended/')
    return data.data
  },

  async getCreators() {
    const { data } = await api.get('/users/creators/')
    return data.data
  },

  // ---------------------------------------------------------------------------
  // Chapters – list / create (nested under story)
  // ---------------------------------------------------------------------------
  async getChapters(storySlug) {
    const { data } = await api.get(`/stories/${storySlug}/chapters/`)
    return data
  },

  async createChapter(storySlug, payload) {
    const { data } = await api.post(`/stories/${storySlug}/chapters/`, payload)
    return data
  },

  // ---------------------------------------------------------------------------
  // Chapters – detail / update / delete (standalone by UUID)
  // ---------------------------------------------------------------------------
  async getChapter(chapterId) {
    const { data } = await api.get(`/chapters/${chapterId}/`)
    return data
  },

  async updateChapter(chapterId, payload) {
    const { data } = await api.patch(`/chapters/${chapterId}/`, payload)
    return data
  },

  async deleteChapter(chapterId) {
    const { data } = await api.delete(`/chapters/${chapterId}/`)
    return data
  },

  // ---------------------------------------------------------------------------
  // Chapter image upload (comics / manga)
  // ---------------------------------------------------------------------------
  async uploadChapterImage(chapterId, formData, onProgress) {
    const { data } = await api.post(`/chapters/${chapterId}/images/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    })
    return data
  },

  async deleteChapterImage(chapterId, imageId) {
    const { data } = await api.delete(`/chapters/${chapterId}/images/${imageId}/`)
    return data
  },

  // ---------------------------------------------------------------------------
  // Library
  // ---------------------------------------------------------------------------
  async getLibraryReading(params = {}) {
    const { data } = await api.get('/library/reading/', { params })
    return data
  },

  async getLibraryBookmarks(params = {}) {
    const { data } = await api.get('/library/bookmarks/', { params })
    return data
  },

  async getLibraryFollowing(params = {}) {
    const { data } = await api.get('/library/following/', { params })
    return data
  },

  async getLibraryCompleted(params = {}) {
    const { data } = await api.get('/library/completed/', { params })
    return data
  },

  async getLibraryHistory(params = {}) {
    const { data } = await api.get('/library/history/', { params })
    return data
  },

  // ---------------------------------------------------------------------------
  // Reading progress
  // ---------------------------------------------------------------------------
  async saveReadingProgress(payload) {
    const { data } = await api.post('/chapters/reading/progress/', payload)
    return data
  },

  async getReadingProgress(storyId) {
    const { data } = await api.get('/chapters/reading/progress/', {
      params: { story_id: storyId },
    })
    return data.data
  },
}
