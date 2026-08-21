/**
 * tourService.js
 * Thin wrappers around the tour state API (/api/tour/).
 */
import api from '../../services/api'

export const tourService = {
  async getState() {
    const { data } = await api.get('/tour/')
    return data.data
  },

  async record(event, tour) {
    const payload = tour ? { event, tour } : { event }
    const { data } = await api.post('/tour/record/', payload)
    return data.data
  },
}