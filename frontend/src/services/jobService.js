import api from './api'

export const jobService = {
  async createJob(jobData) {
    const response = await api.post('/jobs', jobData)
    return response.data
  },

  async getJobs(filters = {}) {
    const params = { ...filters }
    if (params.status) {
      params.status_filter = params.status
      delete params.status
    }

    const response = await api.get('/jobs', { params })
    return response.data
  },

  async getJob(jobId) {
    const response = await api.get(`/jobs/${jobId}`)
    return response.data
  },

  async acceptJob(jobId) {
    const response = await api.put(`/jobs/${jobId}/accept`)
    return response.data
  },

  async updateChecklist(jobId, itemId, completed) {
    const response = await api.put(`/jobs/${jobId}/checklist`, {
      item_id: itemId,
      completed,
    })
    return response.data
  },

  async completeJob(jobId) {
    const response = await api.post(`/jobs/${jobId}/complete`)
    return response.data
  },

  async getMyJobs() {
    const response = await api.get('/jobs/my-jobs')
    return response.data
  },

  async updateJob(jobId, updates) {
    const response = await api.put(`/jobs/${jobId}`, updates)
    return response.data
  },

  async deleteJob(jobId) {
    await api.delete(`/jobs/${jobId}`)
  },
}
