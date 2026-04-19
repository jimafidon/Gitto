// frontend/src/services/auth.service.js
import api from './api'

export const authService = {
  async register({ name, handle, email, password }) {
    const payload = {
      name: String(name || '').trim(),
      handle: String(handle || '').trim(),
      email: String(email || '').trim().toLowerCase(),
      password,
    }
    const { data } = await api.post('/api/auth/register', payload)
    localStorage.setItem('gitto_token', data.token)
    return data
  },

  async login({ email, password }) {
    const payload = {
      email: String(email || '').trim().toLowerCase(),
      password,
    }
    const { data } = await api.post('/api/auth/login', payload)
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