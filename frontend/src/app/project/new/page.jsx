'use client'
// frontend/src/app/project/new/page.jsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { projectsService } from '@/services/projects.service'

const STATUSES = ['in_progress', 'paused', 'completed']

export default function NewProjectPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [form, setForm] = useState({
    title:       '',
    description: '',
    status:      'in_progress',
    tags:        '',
  })
  const [milestones, setMilestones] = useState([
    { title: '', description: '', status: 'upcoming' },
  ])
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function setField(key, value) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function setMilestone(index, key, value) {
    setMilestones(ms => ms.map((m, i) => i === index ? { ...m, [key]: value } : m))
  }

  function addMilestone() {
    setMilestones(ms => [...ms, { title: '', description: '', status: 'upcoming' }])
  }

  function removeMilestone(index) {
    setMilestones(ms => ms.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) { setError('Project title is required'); return }

    // Filter out empty milestones
    const cleanMilestones = milestones.filter(m => m.title.trim())

    // Convert comma-separated tags string → array
    const tags = form.tags
      .split(',')
      .map(t => t.trim().replace(/^#/, '').toLowerCase())
      .filter(Boolean)

    setLoading(true)
    try {
      const data = await projectsService.create({
        title:       form.title.trim(),
        description: form.description.trim(),
        status:      form.status,
        tags,
        milestones:  cleanMilestones,
      })
      router.push(`/project/${data.project._id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page fade-in">
      <div style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--gap) var(--pad)' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <button
            className="pd-back"
            onClick={() => router.back()}
          >
            ← Back
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 800, marginBottom: 6 }}>
            New Project
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            Document your project from day one. Add milestones to track your progress.
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,110,110,0.1)', border: '1px solid rgba(255,110,110,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--accent3)', marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── Project details ── */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
              Project Details
            </div>

            <div className="form-group">
              <label className="form-label">Project Title *</label>
              <input
                className="input"
                placeholder="e.g. CLI Dotfiles Manager"
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="input"
                placeholder="What are you building and why? What problem does it solve?"
                rows={4}
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Status</label>
                <select
                  className="input"
                  value={form.status}
                  onChange={e => setField('status', e.target.value)}
                  style={{ cursor: 'pointer' }}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>
                      {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Tags</label>
                <input
                  className="input"
                  placeholder="cli, opensource, react"
                  value={form.tags}
                  onChange={e => setField('tags', e.target.value)}
                />
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>Comma-separated, max 5</div>
              </div>
            </div>
          </div>

          {/* ── Milestones ── */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
                Milestones
              </div>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>Optional — add later if you prefer</span>
            </div>

            <div className="milestone-timeline">
              {milestones.map((m, i) => (
                <div key={i} className="milestone-item" style={{ marginBottom: 20 }}>
                  {/* Dot */}
                  <div className="milestone-dot" style={{ marginTop: 10 }}>○</div>

                  {/* Fields */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          className="input"
                          placeholder={`Milestone ${i + 1} title`}
                          value={m.title}
                          onChange={e => setMilestone(i, 'title', e.target.value)}
                          style={{ marginBottom: 6 }}
                        />
                        <input
                          className="input"
                          placeholder="Description (optional)"
                          value={m.description}
                          onChange={e => setMilestone(i, 'description', e.target.value)}
                          style={{ fontSize: 13 }}
                        />
                      </div>
                      {milestones.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => removeMilestone(i)}
                          style={{ marginTop: 2, flexShrink: 0 }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={addMilestone}
            >
              + Add Milestone
            </button>
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading || !form.title.trim()}
            >
              {loading ? 'Creating...' : 'Create Project →'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}