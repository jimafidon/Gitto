// frontend/src/hooks/useAuth.js
//
// Custom hook that gives any component access to the current user
// and auth actions (login, logout, register).
//
// Usage:
//   const { user, login, logout, loading } = useAuth()

'use client'

import { useState, useEffect, createContext, useContext } from 'react'
import { useSession } from 'next-auth/react'
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
  const { data: session }     = useSession()
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // Runs once on mount — resolves any existing email/password session from localStorage
  useEffect(() => {
    const token = localStorage.getItem('gitto_token')
    if (token) {
      authService.getMe()
        .then(u => setUser(normalizeUser(u)))
        .catch(() => localStorage.removeItem('gitto_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // Watches for a NextAuth Google session arriving after the page loads
  useEffect(() => {
    if (!session?.backendToken) return
    localStorage.setItem('gitto_token', session.backendToken)
    authService.getMe()
      .then(u => setUser(normalizeUser(u)))
      .finally(() => setLoading(false))
  }, [session])

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