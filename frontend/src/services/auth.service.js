// frontend/src/services/auth.service.js
import api from './api'

export const authService = {
  async register({ name, handle, email, password }) {
    const { data } = await api.post('/api/auth/register', { name, handle, email, password })
    localStorage.setItem('gitto_token', data.token)
    return data
  },

  async login({ email, password }) {
    const { data } = await api.post('/api/auth/login', { email, password })
    localStorage.setItem('gitto_token', data.token)
    return data
  },

  async getMe() {
    const { data } = await api.get('/api/auth/me')
    return data.user
  },

  logout() {
    localStorage.removeItem('gitto_token')
    window.location.href = '/login'
  },
}