// frontend/src/services/users.service.js
import api from './api'
 
export const usersService = {
  getByHandle:   (handle) => api.get(`/api/users/${handle}`).then(r => r.data),
  search:        (query)  => api.get(`/api/users/search?q=${query}`).then(r => r.data),
  getSuggested:  ()       => api.get('/api/users/suggested').then(r => r.data),
  getProjects:   (userId) => api.get(`/api/users/${userId}/projects`).then(r => r.data),
  follow:        (userId) => api.post(`/api/users/${userId}/follow`).then(r => r.data),
  unfollow:      (userId) => api.delete(`/api/users/${userId}/follow`).then(r => r.data),
  updateProfile: (data)   => api.patch('/api/users/me', data).then(r => r.data),
}
 