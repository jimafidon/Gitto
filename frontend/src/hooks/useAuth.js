// frontend/src/hooks/useAuth.js
//
// Custom hook that gives any component access to the current user
// and auth actions (login, logout, register).
//
// Usage:
//   const { user, login, logout, loading } = useAuth()

'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { authService } from '@/services/auth.service'

const AuthContext = createContext(null)

// Backend login/register returns `id`, but getMe returns `_id`.
// Normalize so every consumer always sees `_id`.
function normalizeUser(u) {
  if (!u) return null
  if (!u._id && u.id) return { ...u, _id: u.id }
  return u
}

// Wrap your root layout with this provider
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(() => {
    if (typeof window === 'undefined') return true
    return Boolean(localStorage.getItem('gitto_token'))
  })

  // On mount, check if there's a stored token and fetch the current user
  useEffect(() => {
    const token = localStorage.getItem('gitto_token')
    if (token) {
      authService.getMe()
        .then(u => setUser(normalizeUser(u)))
        .catch(() => localStorage.removeItem('gitto_token'))
        .finally(() => setLoading(false))
    }
  }, [])

  async function login(credentials) {
    const data = await authService.login(credentials)
    setUser(normalizeUser(data.user))
    return data
  }

  async function register(credentials) {
    const data = await authService.register(credentials)
    setUser(normalizeUser(data.user))
    return data
  }

  function logout() {
    setUser(null)
    authService.logout()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// The actual hook — import this in your components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}