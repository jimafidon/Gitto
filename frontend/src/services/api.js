// frontend/src/services/api.js
//
// Base axios instance. Every service file imports from here.
// This means the base URL and auth header are configured in one place.

import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach the JWT token to every outgoing request
api.interceptors.request.use((config) => {
  // In Next.js, localStorage is only available in the browser
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('gitto_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle expired sessions globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — notify UI, clear storage, then redirect to login.
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('gitto:auth-expired', {
          detail: { message: 'Session expired. Redirecting to login...' },
        }))
        sessionStorage.setItem('gitto_auth_notice', 'Session expired. Please log in again.')
        localStorage.removeItem('gitto_token')
        setTimeout(() => {
          window.location.href = '/login'
        }, 600)
      }
    }
    return Promise.reject(error)
  }
)

export default api