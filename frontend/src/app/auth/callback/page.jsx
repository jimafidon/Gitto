'use client'
// frontend/src/app/auth/callback/page.jsx
//
// The backend redirects here after a successful Google OAuth login:
//   GET /auth/callback?token=eyJhbGci...
//
// This page:
//   1. Reads the token from the URL
//   2. Stores it in localStorage (same place email/password login stores it)
//   3. Removes the token from the URL (so it's not visible or bookmarkable)
//   4. Redirects to /feed

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token  = params.get('token')
    const error  = params.get('error')

    if (error || !token) {
      // Something went wrong on the backend — send to login with an error flag
      router.replace('/login?error=oauth_failed')
      return
    }

    // Store the JWT — the api.js interceptor will attach it to every request
    localStorage.setItem('gitto_token', token)

    // Replace the current history entry so the user can't navigate back
    // to this page (which would have a now-invalid token in the URL)
    router.replace('/feed')
  }, [router])

  // Show a spinner while the redirect is happening
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      minHeight:      '100vh',
      gap:            16,
    }}>
      <div
        className="spin"
        style={{
          width:          32,
          height:         32,
          border:         '3px solid var(--border)',
          borderTopColor: 'var(--accent)',
          borderRadius:   '50%',
        }}
      />
      <div style={{ fontSize: 14, color: 'var(--text2)' }}>
        Signing you in...
      </div>
    </div>
  )
}