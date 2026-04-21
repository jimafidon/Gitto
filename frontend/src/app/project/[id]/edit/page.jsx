'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { projectsService } from '@/services/projects.service'

function toMilestoneDrafts(projectMilestones = []) {
  if (!Array.isArray(projectMilestones) || projectMilestones.length === 0) {
    return [{ key: `new-${Date.now()}`, title: '' }]
  }

  return projectMilestones.map((milestone, index) => ({
    key: milestone?._id || `existing-${index}`,
    title: milestone?.title || '',
  }))
}

export default function EditProjectPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [projectOwnerId, setProjectOwnerId] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
  })
  const [milestones, setMilestones] = useState([])

  useEffect(() => {
    let cancelled = false

    async function loadProject() {
      setLoading(true)
      setPageError('')
      try {
        const data = await projectsService.getById(id)
        if (cancelled) return
        const project = data?.project || {}

        setProjectOwnerId(String(project?.author?._id || ''))
        setForm({
          title: project?.title || '',
          description: project?.description || '',
        })
        setMilestones(toMilestoneDrafts(project?.milestones || []))
      } catch (error) {
        if (cancelled) return
        setPageError(error?.response?.data?.message || 'Unable to load project edit template.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadProject()
    return () => {
      cancelled = true
    }
  }, [id])

  useEffect(() => {
    if (loading || authLoading || !projectOwnerId) return
    if (!user?._id || user._id !== projectOwnerId) {
      router.replace(`/project/${id}?editDenied=1`)
    }
  }, [loading, authLoading, projectOwnerId, user?._id, router, id])

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  function setMilestoneTitle(index, value) {
    setMilestones((current) => current.map((entry, i) => (i === index ? { ...entry, title: value } : entry)))
  }

  function addMilestone() {
    setMilestones((current) => [
      ...current,
      { key: `new-${Date.now()}-${current.length}`, title: '' },
    ])
  }

  function removeMilestone(index) {
    setMilestones((current) => current.filter((_, i) => i !== index))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSaveError('')

    const title = String(form.title || '').trim()
    const description = String(form.description || '').trim()
    if (!title) {
      setSaveError('Project name is required.')
      return
    }

    const normalizedMilestones = milestones
      .map((entry) => ({
        title: String(entry?.title || '').trim(),
        description: '',
        status: 'upcoming',
        progress: 0,
      }))
      .filter((entry) => entry.title)

    setSaving(true)
    try {
      await projectsService.update(id, {
        title,
        description,
        milestones: normalizedMilestones,
      })
      router.push(`/project/${id}?editSaved=1`)
    } catch (error) {
      setSaveError(error?.response?.data?.message || 'Unable to save project changes right now.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="page">
        <div style={{ maxWidth: 760, margin: '0 auto', padding: 'var(--pad)' }}>
          <div className="skeleton" style={{ width: 120, height: 16, marginBottom: 18 }} />
          <div className="skeleton" style={{ width: '55%', height: 32, marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 90, borderRadius: 10 }} />
        </div>
      </div>
    )
  }

  if (pageError) {
    return (
      <div className="page">
        <div className="empty-state" style={{ marginTop: 80 }}>
          <div className="icon">⚠️</div>
          <h3>Unable to open edit page</h3>
          <p>{pageError}</p>
          <button className="btn btn-ghost" onClick={() => router.push(`/project/${id}`)}>
            Back to project
          </button>
        </div>
      </div>
    )
  }

  if (!user?._id || user._id !== projectOwnerId) return null

  return (
    <div className="page fade-in">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: 'var(--gap) var(--pad)' }}>
        <button className="pd-back" onClick={() => router.push(`/project/${id}`)}>
          ← Back to Project
        </button>

        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 800, marginBottom: 6 }}>
          Edit Project
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 20 }}>
          Update your project details and milestone names.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
              Project Details
            </div>

            <div className="form-group">
              <label className="form-label">Project Name</label>
              <input
                className="input"
                value={form.title}
                onChange={(event) => setField('title', event.target.value)}
                placeholder="Project name"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Project Description</label>
              <textarea
                className="input"
                rows={5}
                value={form.description}
                onChange={(event) => setField('description', event.target.value)}
                placeholder="Project description"
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          <div className="card" style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
                Milestones
              </div>
              <span style={{ fontSize: 12, color: 'var(--text3)' }}>Template fields (name only)</span>
            </div>

            <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
              {milestones.map((milestone, index) => (
                <div key={milestone.key} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    className="input"
                    value={milestone.title}
                    onChange={(event) => setMilestoneTitle(index, event.target.value)}
                    placeholder={`Milestone ${index + 1} name`}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeMilestone(index)}
                    disabled={milestones.length <= 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button type="button" className="btn btn-ghost btn-sm" onClick={addMilestone}>
              + Add Milestone
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => router.push(`/project/${id}`)} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving || !String(form.title || '').trim()}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          {saveError && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--danger, #d33)', textAlign: 'right' }}>
              {saveError}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
