// frontend/src/services/projects.service.js
import api from './api'

export const projectsService = {
  // Project lifecycle
  getById:     (id)      => api.get(`/api/projects/${id}`).then(r => r.data),
  search:      (query)   => api.get(`/api/projects/search?q=${query}`).then(r => r.data),
  create:      (data)    => api.post('/api/projects', data).then(r => r.data),
  update:      (id, data)=> api.patch(`/api/projects/${id}`, data).then(r => r.data),
  remove:      (id)      => api.delete(`/api/projects/${id}`).then(r => r.data),
  // Social actions
  star:        (id)      => api.post(`/api/projects/${id}/star`).then(r => r.data),
  unstar:      (id)      => api.delete(`/api/projects/${id}/star`).then(r => r.data),
  follow:      (id)      => api.post(`/api/projects/${id}/follow`).then(r => r.data),
  unfollow:    (id)      => api.delete(`/api/projects/${id}/follow`).then(r => r.data),
  // Milestones and activity surfaces
  addMilestone:(id, data)=> api.post(`/api/projects/${id}/milestones`, data).then(r => r.data),
  completeMilestone:(id, milestoneId)=> api.patch(`/api/projects/${id}/milestones/${milestoneId}/complete`).then(r => r.data),
  getUpdates:  (id)      => api.get(`/api/projects/${id}/updates`).then(r => r.data),
  getComments: (id)      => api.get(`/api/projects/${id}/comments`).then(r => r.data),
  addComment:  (id, body)=> api.post(`/api/projects/${id}/comments`, { body }).then(r => r.data),
}