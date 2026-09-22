/**
 * Official Content Service
 * Uses the new /api/official/ endpoints for official MANJI content
 */

import api from './api'

const officialService = {
  // Series
  getSeries: () => api.get('/official/series/'),
  getSeriesDetail: (slug) => api.get(`/official/series/${slug}/`),

  // Seasons
  getSeasons: (seriesSlug) => api.get(`/official/series/${seriesSlug}/seasons/`),
  getSeasonDetail: (seriesSlug, seasonId) => api.get(`/official/seasons/${seasonId}/`),

  // Arcs
  getArcs: (seasonId) => api.get(`/official/seasons/${seasonId}/arcs/`),
  getArcDetail: (arcId) => api.get(`/official/arcs/${arcId}/`),

  // Stories
  getStories: (arcId) => api.get(`/official/arcs/${arcId}/stories/`),
  getStoryDetail: (storyId) => api.get(`/official/stories/${storyId}/`),

  // Chapters
  getChapters: (storyId) => api.get(`/official/stories/${storyId}/chapters/`),
  getChapterDetail: (chapterId) => api.get(`/official/chapters/${chapterId}/`),

  // Animations
  getAnimations: () => api.get('/official/animations/'),
  getAnimationDetail: (slug) => api.get(`/official/animations/${slug}/`),

  // Episodes
  getEpisodes: (animationId) => api.get(`/official/animations/${animationId}/episodes/`),
  getEpisodeDetail: (episodeId) => api.get(`/official/episodes/${episodeId}/`),

  // Progress
  getProgress: () => api.get('/official/progress/'),
  updateProgress: (contentType, contentId, progress) =>
    api.post('/official/progress/', { content_type: contentType, content_id: contentId, ...progress }),

  // Bookmarks
  getBookmarks: () => api.get('/official/bookmarks/'),
  addBookmark: (contentType, contentId) =>
    api.post('/official/bookmarks/', { content_type: contentType, content_id: contentId }),
  removeBookmark: (contentType, contentId) =>
    api.delete('/official/bookmarks/', { data: { content_type: contentType, content_id: contentId } }),

  // Views (analytics)
  recordView: (contentType, contentId, timeSpent) =>
    api.post('/official/views/', { content_type: contentType, content_id: contentId, time_spent: timeSpent }),
}

export default officialService