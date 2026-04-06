'use client'
// frontend/src/app/(auth)/login/page.jsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form)
      router.push('/feed')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      {/* Left panel */}
      <div className="login-left">
        <div className="login-logo">Gitto</div>
        <div className="login-tagline">Track your journey.<br />Share your progress.</div>
        {[
          { icon: '🎯', title: 'Goal-first thinking',      desc: 'Break any project into clear milestones and track them over time.' },
          { icon: '🌱', title: 'Build in public',           desc: 'Share updates with a community that cheers you on.'                },
          { icon: '📈', title: 'Progress over perfection',  desc: 'Log wins, learnings, and setbacks — all part of the journey.'     },
        ].map(f => (
          <div className="login-feature" key={f.title}>
            <div className="login-feature-icon">{f.icon}</div>
            <div className="login-feature-text">
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Right panel — form */}
      <div className="login-right">
        <div className="login-form">
          <h2>Welcome back</h2>
          <p>Sign in to continue your journey.</p>

          <button className="social-btn">G &nbsp; Continue with Google</button>
          <button className="social-btn">⌘ &nbsp; Continue with GitHub</button>
          <div className="login-divider"><span>or with email</span></div>

          {error && (
            <div style={{ background: 'rgba(255,110,110,0.1)', border: '1px solid rgba(255,110,110,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--accent3)', marginBottom: 14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            </div>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <a style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>Forgot password?</a>
            </div>
            <button className="btn btn-primary btn-block btn-lg" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="login-switch">
            New to Gitto? <Link href="/signup">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  )
}