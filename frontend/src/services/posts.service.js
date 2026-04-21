// frontend/src/services/posts.service.js
import api from './api'

export const postsService = {
  // Feed and CRUD
  getFeed:      (page = 1)       => api.get(`/api/posts?page=${page}`).then(r => r.data),
  getSaved:     ()               => api.get('/api/posts/saved').then(r => r.data),
  getById:      (id)             => api.get(`/api/posts/${id}`).then(r => r.data),
  create:       (payload)        => api.post('/api/posts', payload).then(r => r.data),
  update:       (id, payload)    => api.patch(`/api/posts/${id}`, payload).then(r => r.data),
  remove:       (id)             => api.delete(`/api/posts/${id}`).then(r => r.data),
  // Engagement actions
  like:         (id)             => api.post(`/api/posts/${id}/like`).then(r => r.data),
  unlike:       (id)             => api.delete(`/api/posts/${id}/like`).then(r => r.data),
  save:         (id)             => api.post(`/api/posts/${id}/save`).then(r => r.data),
  unsave:       (id)             => api.delete(`/api/posts/${id}/save`).then(r => r.data),
  // Comment operations
  getComments:  (id)             => api.get(`/api/posts/${id}/comments`).then(r => r.data),
  addComment:   (id, body)       => api.post(`/api/posts/${id}/comments`, { body }).then(r => r.data),
  deleteComment:(id, commentId)  => api.delete(`/api/posts/${id}/comments/${commentId}`).then(r => r.data),
}
