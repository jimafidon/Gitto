'use client'
// frontend/src/app/project/[id]/page.jsx
import { use, useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { projectsService } from '@/services/projects.service'
import { postsService } from '@/services/posts.service'
import Avatar from '@/components/Avatar'
import MilestoneTimeline from '@/components/MilestoneTimeline'

const VALID_PROJECT_TABS = new Set(['overview', 'milestones', 'updates', 'discussion'])

function normalizeProjectTab(value) {
  const tab = String(value || '').trim().toLowerCase()
  return VALID_PROJECT_TABS.has(tab) ? tab : 'overview'
}

function extractErrorInfo(error, fallback = 'Something went wrong. Please try again.') {
  // Normalize axios/network errors to a shape the UI can reuse across tabs/actions.
  const status = error?.response?.status
  const apiMessage = error?.response?.data?.message

  if (apiMessage) return { status, message: apiMessage }
  if (status === 429) return { status, message: 'Too many attempts. Please wait and try again.' }
  if (status === 401) return { status, message: 'Session expired. Redirecting to login...' }
  if (status === 404) return { status, message: 'Project not found.' }
  if (status === 400) return { status, message: 'Invalid request. Please check the project URL and try again.' }
  if (!error?.response) return { status: 0, message: 'Network error. Check your connection and retry.' }
  return { status, message: fallback }
}

function pageLoadErrorMeta(errorInfo) {
  const status = errorInfo?.status
  if (status === 404) {
    return {
      title: 'Project not found',
      description: "This project doesn't exist or has been removed.",
    }
  }
  if (status === 400) {
    return {
      title: 'Invalid project link',
      description: 'The project id in this URL is invalid. Check the link and try again.',
    }
  }
  if (status === 429) {
    return {
      title: 'Too many requests',
      description: 'You have hit a temporary rate limit. Please wait and retry.',
    }
  }
  return {
    title: 'Unable to load project',
    description: errorInfo?.message || 'Something went wrong while loading this project.',
  }
}

export default function ProjectDetailPage({ params }) {
  const { id } = use(params)
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const requestedTab = normalizeProjectTab(searchParams.get('tab'))
  const targetUpdateId = String(searchParams.get('updateId') || '').trim()
  const editDenied = searchParams.get('editDenied') === '1'
  const editSaved = searchParams.get('editSaved') === '1'
  const [project, setProject] = useState(null)
  const [tab, setTab]         = useState(requestedTab)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [starred, setStarred] = useState(false)
  const [followed, setFollowed] = useState(false)
  const [milestoneDraft, setMilestoneDraft] = useState({ title: '', description: '' })
  const [addingMilestone, setAddingMilestone] = useState(false)
  const [milestonePending, setMilestonePending] = useState({})
  const [shareLabel, setShareLabel] = useState('🔗 Share')
  const [headerActionPending, setHeaderActionPending] = useState({ star: false, follow: false })
  const [headerActionError, setHeaderActionError] = useState('')
  const [milestoneError, setMilestoneError] = useState('')
  const [milestoneActionError, setMilestoneActionError] = useState('')
  const [shareError, setShareError] = useState('')
  const [authNotice, setAuthNotice] = useState('')

  const isOwner = project?.author?._id === user?._id

  const loadProject = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const data = await projectsService.getById(id)
      // Mirror derived action states from backend flags so header buttons render correctly.
      setProject(data.project)
      setStarred(Boolean(data.project.starredByMe))
      setFollowed(Boolean(data.project.followedByMe))
    } catch (error) {
      const info = extractErrorInfo(error, 'Failed to load project.')
      setLoadError(info)
      setProject(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    // Reload when URL id changes or auth context swaps users.
    loadProject()
  }, [loadProject])

  useEffect(() => {
    setTab(requestedTab)
  }, [requestedTab, id])

  useEffect(() => {
    function onAuthExpired(event) {
      const message = event?.detail?.message || 'Session expired. Redirecting to login...'
      setAuthNotice(message)
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('gitto:auth-expired', onAuthExpired)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('gitto:auth-expired', onAuthExpired)
      }
    }
  }, [])

  async function handleStar() {
    setHeaderActionError('')
    setHeaderActionPending((p) => ({ ...p, star: true }))
    try {
      if (starred) {
        const data = await projectsService.unstar(id)
        setProject(p => ({ ...p, starsCount: data.starsCount }))
        setStarred(false)
      } else {
        const data = await projectsService.star(id)
        setProject(p => ({ ...p, starsCount: data.starsCount }))
        setStarred(true)
      }
    } catch (error) {
      const info = extractErrorInfo(error, 'Unable to update star right now.')
      setHeaderActionError(info.message)
    } finally {
      setHeaderActionPending((p) => ({ ...p, star: false }))
    }
  }

  async function handleFollow() {
    if (!user) return
    setHeaderActionError('')
    setHeaderActionPending((p) => ({ ...p, follow: true }))
    try {
      if (followed) {
        const data = await projectsService.unfollow(id)
        setProject(p => ({ ...p, followersCount: data.followersCount }))
        setFollowed(false)
      } else {
        const data = await projectsService.follow(id)
        setProject(p => ({ ...p, followersCount: data.followersCount }))
        setFollowed(true)
      }
    } catch (error) {
      const info = extractErrorInfo(error, 'Unable to update follow status right now.')
      setHeaderActionError(info.message)
    } finally {
      setHeaderActionPending((p) => ({ ...p, follow: false }))
    }
  }

  async function handleShare() {
    setShareError('')
    const url = typeof window !== 'undefined' ? window.location.href : ''
    if (!url) return

    try {
      // Prefer native share sheet on supported devices, then fall back to clipboard copy.
      if (navigator.share) {
        await navigator.share({
          title: project?.title || 'Project',
          text: project?.description || '',
          url,
        })
        setShareLabel('✅ Shared')
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        setShareLabel('✅ Copied')
      } else {
        setShareError('Sharing is not supported in this browser.')
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setShareError('Unable to share this link. Please copy the URL manually.')
      }
    } finally {
      setTimeout(() => setShareLabel('🔗 Share'), 1600)
    }
  }

  async function handleAddMilestone(e) {
    e.preventDefault()
    if (!milestoneDraft.title.trim()) return
    setMilestoneError('')
    setAddingMilestone(true)
    try {
      const data = await projectsService.addMilestone(id, {
        title: milestoneDraft.title,
        description: milestoneDraft.description,
      })
      setProject(p => ({
        ...p,
        milestones: data.milestones || p.milestones,
        progress: data.progress ?? p.progress,
      }))
      setMilestoneDraft({ title: '', description: '' })
    } catch (error) {
      const info = extractErrorInfo(error, 'Unable to add milestone right now.')
      if (info.status === 403) {
        setMilestoneError('Only the project owner can add milestones.')
      } else {
        setMilestoneError(info.message)
      }
    } finally {
      setAddingMilestone(false)
    }
  }

  async function handleCompleteMilestone(milestone) {
    const milestoneId = String(milestone?._id || '')
    if (!milestoneId || milestone?.status === 'completed') return
    setMilestoneActionError('')
    setMilestonePending((map) => ({ ...map, [milestoneId]: true }))
    try {
      const data = await projectsService.completeMilestone(id, milestoneId)
      setProject((current) => ({
        ...current,
        milestones: data.milestones || current.milestones,
        progress: data.progress ?? current.progress,
      }))
    } catch (error) {
      const info = extractErrorInfo(error, 'Unable to complete milestone right now.')
      if (info.status === 403) {
        setMilestoneActionError('Only the project owner can complete milestones.')
      } else {
        setMilestoneActionError(info.message)
      }
    } finally {
      setMilestonePending((map) => ({ ...map, [milestoneId]: false }))
    }
  }

  if (loading) return (
    <div className="page">
      <div style={{ padding: 'var(--pad)' }}>
        <div className="skeleton" style={{ width: 100, height: 14, marginBottom: 24 }} />
        <div className="skeleton" style={{ width: '60%', height: 40, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '40%', height: 14, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 80, borderRadius: 10 }} />
      </div>
    </div>
  )

  if (loadError) {
    const meta = pageLoadErrorMeta(loadError)
    return (
      <div className="page">
        <div className="empty-state" style={{ marginTop: 80 }}>
          <div className="icon">⚠️</div>
          <h3>{meta.title}</h3>
          <p>{meta.description}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={loadProject}>Retry</button>
            <Link href="/feed" className="btn btn-ghost">Back to feed</Link>
          </div>
        </div>
      </div>
    )
  }

  if (!project) return (
    <div className="page">
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="icon">📁</div>
        <h3>Project not found</h3>
        <p>This project doesn&apos;t exist or has been removed.</p>
        <Link href="/feed" className="btn btn-ghost" style={{ marginTop: 16 }}>Back to feed</Link>
      </div>
    </div>
  )

  const statusBadge = project.status === 'completed' ? 'badge-teal' : project.status === 'paused' ? 'badge-gray' : 'badge-green'

  return (
    <div className="page fade-in">
      <div className="project-detail">
        {(authNotice || editDenied || editSaved) && (
          <div className="card" style={{ marginBottom: 12, borderColor: 'var(--warning, #d97706)' }}>
            <div style={{ fontSize: 13, color: 'var(--warning, #d97706)' }}>
              {authNotice || (editDenied ? 'Only the project owner can access the edit page.' : 'Project changes saved successfully.')}
            </div>
          </div>
        )}
        <Link href={`/profile/${project.author?.handle}`} className="pd-back">← Back to Profile</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
          <span className={`badge ${statusBadge}`}>{project.status}</span>
          {project.tags?.map(t => <span key={t} className="tag">#{t}</span>)}
        </div>

        <div className="pd-title">{project.title}</div>

        <div className="pd-meta">
          <Avatar name={project.author?.name} src={project.author?.avatar} size={24} textSize={10} />
          <Link href={`/profile/${project.author?.handle}`} style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            {project.author?.name}
          </Link>
          <span>·</span>
          <span>Started {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
          <span>·</span>
          <span>Updated {timeAgo(project.updatedAt)}</span>
        </div>

        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, maxWidth: 680, marginBottom: 18 }}>
          {project.description}
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <button
            className={`btn ${starred ? 'btn-ghost' : 'btn-primary'}`}
            onClick={handleStar}
            disabled={headerActionPending.star}
          >
            {headerActionPending.star ? 'Saving...' : `${starred ? '★' : '⭐'} ${starred ? 'Starred' : 'Star'} · ${project.starsCount || 0}`}
          </button>
          {!isOwner && user && (
            <button className="btn btn-ghost" onClick={handleFollow} disabled={headerActionPending.follow}>
              {headerActionPending.follow ? 'Saving...' : `${followed ? '🔕 Following' : '🔔 Follow'} · ${project.followersCount || 0}`}
            </button>
          )}
          {isOwner  && <Link href={`/project/${id}/edit`} className="btn btn-ghost">✏️ Edit</Link>}
          <button className="btn btn-ghost" onClick={handleShare}>{shareLabel}</button>
        </div>
        {(headerActionError || shareError) && (
          <div className="card" style={{ marginBottom: 14, borderColor: 'var(--danger, #d33)' }}>
            <div style={{ fontSize: 13, color: 'var(--danger, #d33)' }}>{headerActionError || shareError}</div>
          </div>
        )}

        <div className="pd-stats">
          {[
            [`${project.progress || 0}%`, 'Overall Progress'],
            [`${project.milestones?.filter(m => m.status === 'completed').length || 0} / ${project.milestones?.length || 0}`, 'Milestones Done'],
            [project.starsCount   || 0, 'Stars'],
            [project.followersCount || 0, 'Followers'],
            [project.updatesCount   || 0, 'Updates'],
          ].map(([n, l]) => (
            <div key={l} className="pd-stat"><div className="n">{n}</div><div className="l">{l}</div></div>
          ))}
        </div>

        <div className="profile-tabs" style={{ padding: '12px 0' }}>
          {['overview', 'milestones', 'updates', 'discussion'].map(t => (
            <button key={t} className={`profile-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="profile-content">
          {tab === 'overview' && (
            <div className="pd-body">
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 12 }}>About this project</div>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 20 }}>{project.description}</p>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, marginBottom: 10 }}>Progress</div>
                <div className="progress-wrap progress-lg" style={{ marginBottom: 8 }}>
                  <div className="progress-fill" style={{ width: `${project.progress || 0}%` }} />
                </div>
                <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
                  {project.progress || 0}% complete
                </div>
                <MilestoneTimeline milestones={project.milestones || []} />
              </div>
              <div>
                {project.links?.length > 0 && (
                  <div className="card" style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Links</div>
                    {project.links.map(link => (
                      <a key={link.url} href={link.url} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
                        🔗 {link.label || link.url}
                      </a>
                    ))}
                  </div>
                )}
                {project.contributors?.length > 0 && (
                  <div className="card">
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 14 }}>Contributors</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {project.contributors.map(c => (
                        <Link key={c._id} href={`/profile/${c.handle}`}>
                          <Avatar name={c.name} src={c.avatar} size={32} textSize={11} />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'milestones' && (
            <div style={{ maxWidth: 600 }}>
              <MilestoneTimeline milestones={project.milestones || []} detailed />
              {isOwner && (project.milestones || []).length > 0 && (
                <div className="card" style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
                    Milestone actions
                  </div>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(project.milestones || []).map((milestone, index) => {
                      const milestoneId = String(milestone?._id || '')
                      const isCompleted = milestone?.status === 'completed'
                      const isPending = Boolean(milestonePending[milestoneId])
                      return (
                        <div key={milestoneId || `${milestone?.title || 'milestone'}-${index}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600 }}>{milestone?.title || 'Untitled milestone'}</div>
                            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                              Status: {isCompleted ? 'Completed' : 'In progress'}
                            </div>
                          </div>
                          {isCompleted ? (
                            <span className="badge badge-teal">Completed</span>
                          ) : (
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleCompleteMilestone(milestone)}
                              disabled={!milestoneId || isPending}
                            >
                              {isPending ? 'Saving...' : 'Mark complete'}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  {milestoneActionError && (
                    <div style={{ marginTop: 10, fontSize: 13, color: 'var(--danger, #d33)' }}>
                      {milestoneActionError}
                    </div>
                  )}
                </div>
              )}
              {isOwner && (
                <div className="card" style={{ marginTop: 12 }}>
                  <form onSubmit={handleAddMilestone}>
                    <input
                      className="input"
                      placeholder="Milestone title"
                      value={milestoneDraft.title}
                      onChange={(e) => setMilestoneDraft((m) => ({ ...m, title: e.target.value }))}
                      required
                      style={{ marginBottom: 8 }}
                    />
                    <textarea
                      className="compose-input"
                      rows={3}
                      placeholder="Milestone description"
                      value={milestoneDraft.description}
                      onChange={(e) => setMilestoneDraft((m) => ({ ...m, description: e.target.value }))}
                      style={{ marginBottom: 10 }}
                    />
                    <button className="btn btn-ghost btn-block" type="submit" disabled={addingMilestone || !milestoneDraft.title.trim()}>
                      {addingMilestone ? 'Adding...' : '+ Add Milestone'}
                    </button>
                    {milestoneError && (
                      <div style={{ marginTop: 10, fontSize: 13, color: 'var(--danger, #d33)' }}>
                        {milestoneError}
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          )}

          {tab === 'updates' && <UpdatesTab projectId={id} isOwner={isOwner} targetUpdateId={targetUpdateId} />}
          {tab === 'discussion' && <DiscussionTab projectId={id} />}
        </div>
      </div>
    </div>
  )
}

function UpdatesTab({ projectId, isOwner, targetUpdateId = '' }) {
  const { user } = useAuth()
  const updateRefs = useRef({})
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatesError, setUpdatesError] = useState('')
  const [commentDrafts, setCommentDrafts] = useState({})
  const [updateComments, setUpdateComments] = useState({})
  const [commentsLoading, setCommentsLoading] = useState({})
  const [loadedCommentIds, setLoadedCommentIds] = useState({})
  const [activeCommentId, setActiveCommentId] = useState('')
  const [highlightedUpdateId, setHighlightedUpdateId] = useState('')
  const [updateActionErrors, setUpdateActionErrors] = useState({})
  const [updatePending, setUpdatePending] = useState({})

  const loadUpdates = useCallback(async () => {
    setLoading(true)
    setUpdatesError('')
    setUpdateComments({})
    setLoadedCommentIds({})
    setActiveCommentId('')
    setUpdateActionErrors({})
    try {
      const data = await projectsService.getUpdates(projectId)
      setUpdates(data.updates || [])
    } catch (error) {
      const info = extractErrorInfo(error, 'Unable to load project updates.')
      setUpdatesError(info.message)
      setUpdates([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    // Keep updates scoped to currently viewed project.
    loadUpdates()
  }, [loadUpdates])

  const loadUpdateComments = useCallback(async (updateId) => {
    if (!updateId || loadedCommentIds[updateId]) return
    setCommentsLoading((map) => ({ ...map, [updateId]: true }))
    try {
      const data = await postsService.getComments(updateId)
      setUpdateComments((map) => ({ ...map, [updateId]: data.comments || [] }))
      setLoadedCommentIds((map) => ({ ...map, [updateId]: true }))
    } catch (error) {
      const info = extractErrorInfo(error, 'Unable to load comments for this update.')
      setUpdateActionErrors((map) => ({ ...map, [updateId]: info.message }))
    } finally {
      setCommentsLoading((map) => ({ ...map, [updateId]: false }))
    }
  }, [loadedCommentIds])

  useEffect(() => {
    if (!targetUpdateId || loading || updates.length === 0) return

    const targetExists = updates.some((update) => update._id === targetUpdateId)
    if (!targetExists) return

    setActiveCommentId(targetUpdateId)
    loadUpdateComments(targetUpdateId)
    setHighlightedUpdateId(targetUpdateId)

    const targetNode = updateRefs.current[targetUpdateId]
    if (targetNode) {
      targetNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const timeoutId = setTimeout(() => {
      setHighlightedUpdateId((current) => (current === targetUpdateId ? '' : current))
    }, 2200)

    return () => clearTimeout(timeoutId)
  }, [targetUpdateId, loading, updates, loadUpdateComments])

  function handleToggleComment(updateId) {
    const nextId = activeCommentId === updateId ? '' : updateId
    setActiveCommentId(nextId)
    if (nextId) loadUpdateComments(nextId)
  }

  async function handleLike(update) {
    if (!update?._id) return
    setUpdateActionErrors((map) => ({ ...map, [update._id]: '' }))
    setUpdatePending((map) => ({ ...map, [update._id]: true }))
    try {
      // Toggle like endpoint based on current local state.
      if (update.likedByMe) {
        const data = await postsService.unlike(update._id)
        setUpdates(list => list.map(item => (
          item._id === update._id ? { ...item, likesCount: data.likesCount, likedByMe: false } : item
        )))
        return
      }

      const data = await postsService.like(update._id)
      setUpdates(list => list.map(item => (
        item._id === update._id ? { ...item, likesCount: data.likesCount, likedByMe: true } : item
      )))
    } catch (error) {
      const info = extractErrorInfo(error, 'Unable to update like right now.')
      setUpdateActionErrors((map) => ({ ...map, [update._id]: info.message }))
    } finally {
      setUpdatePending((map) => ({ ...map, [update._id]: false }))
    }
  }

  async function handleSubmitUpdateComment(e, update) {
    e.preventDefault()
    const body = String(commentDrafts[update._id] || '').trim()
    if (!body) return
    setUpdateActionErrors((map) => ({ ...map, [update._id]: '' }))
    setUpdatePending((map) => ({ ...map, [update._id]: true }))
    try {
      const data = await postsService.addComment(update._id, body)
      setUpdates(list => list.map(item => (
        item._id === update._id ? { ...item, commentsCount: data.commentsCount ?? (item.commentsCount || 0) + 1 } : item
      )))
      if (data.comment) {
        setUpdateComments((map) => ({
          ...map,
          [update._id]: [...(map[update._id] || []), data.comment],
        }))
        setLoadedCommentIds((map) => ({ ...map, [update._id]: true }))
      }
      setCommentDrafts((drafts) => ({ ...drafts, [update._id]: '' }))
    } catch (error) {
      const info = extractErrorInfo(error, 'Unable to post update comment right now.')
      setUpdateActionErrors((map) => ({ ...map, [update._id]: info.message }))
    } finally {
      setUpdatePending((map) => ({ ...map, [update._id]: false }))
    }
  }

  if (loading) return <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
  if (updatesError) return (
    <div className="empty-state">
      <div className="icon">⚠️</div>
      <h3>Unable to load updates</h3>
      <p>{updatesError}</p>
      <button className="btn btn-ghost" onClick={loadUpdates}>Retry updates</button>
    </div>
  )
  if (updates.length === 0) return (
    <div className="empty-state">
      <div className="icon">📝</div>
      <h3>No updates yet</h3>
      <p>{isOwner ? 'Share your first progress update.' : 'No updates have been posted yet.'}</p>
      {isOwner && (
        <Link href={`/feed?projectId=${projectId}`} className="btn btn-primary" style={{ marginTop: 12 }}>
          Post the first update
        </Link>
      )}
    </div>
  )

  return (
    <div>
      {updates.map((u, i) => (
        <div
          key={u._id || i}
          className="card update-card"
          ref={(node) => {
            if (node && u._id) updateRefs.current[u._id] = node
          }}
          style={
            highlightedUpdateId === u._id
              ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent)', transition: 'box-shadow 0.25s ease, border-color 0.25s ease' }
              : undefined
          }
        >
          <div className="update-header">
            <Avatar name={u.author?.name} src={u.author?.avatar} size={32} textSize={11} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{u.author?.name}</div>
              {u.milestone?.title && (
                <span className="badge badge-green" style={{ fontSize: 10, padding: '2px 8px' }}>
                  {u.milestone.title}
                </span>
              )}
            </div>
            <div className="update-date">{timeAgo(u.createdAt)}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{u.title}</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{u.body}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <button className="action-btn" onClick={() => handleLike(u)} disabled={Boolean(updatePending[u._id])}>
              {u.likedByMe ? '❤️' : '🤍'} Like ({u.likesCount || 0})
            </button>
            <button className="action-btn" onClick={() => handleToggleComment(u._id)} disabled={Boolean(updatePending[u._id])}>
              💬 Comment ({u.commentsCount || 0})
            </button>
          </div>
          {activeCommentId === u._id && (
            <div style={{ marginTop: 10 }}>
              {commentsLoading[u._id] ? (
                <div className="skeleton" style={{ height: 48, borderRadius: 10, marginBottom: 8 }} />
              ) : (
                <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
                  {(updateComments[u._id] || []).map((comment) => (
                    <div key={comment._id} className="card" style={{ padding: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Avatar name={comment.author?.name} src={comment.author?.avatar} size={24} textSize={9} />
                        {comment.author?.handle ? (
                          <Link href={`/profile/${comment.author.handle}`} style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                            {comment.author?.name || 'Deleted user'}
                          </Link>
                        ) : (
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)' }}>{comment.author?.name || 'Deleted user'}</span>
                        )}
                        <span style={{ fontSize: 12, color: 'var(--text3)' }}>{timeAgo(comment.createdAt)}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{comment.body}</div>
                    </div>
                  ))}
                  {(updateComments[u._id] || []).length === 0 && (
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>No comments yet.</div>
                  )}
                </div>
              )}

              {user && (
                <form onSubmit={(e) => handleSubmitUpdateComment(e, u)}>
                  <textarea
                    className="compose-input"
                    rows={2}
                    placeholder="Comment on this update..."
                    value={commentDrafts[u._id] || ''}
                    onChange={(e) => setCommentDrafts((drafts) => ({ ...drafts, [u._id]: e.target.value }))}
                    style={{ marginBottom: 8 }}
                  />
                  <button className="btn btn-primary btn-sm" type="submit" disabled={Boolean(updatePending[u._id]) || !String(commentDrafts[u._id] || '').trim()}>
                    Post Comment
                  </button>
                </form>
              )}
            </div>
          )}
          {updateActionErrors[u._id] && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--danger, #d33)' }}>
              {updateActionErrors[u._id]}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function DiscussionTab({ projectId }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [body, setBody]         = useState('')
  const [loading, setLoading]   = useState(true)
  const [commentsError, setCommentsError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadComments = useCallback(async () => {
    setLoading(true)
    setCommentsError('')
    try {
      const data = await projectsService.getComments(projectId)
      setComments(data.comments || [])
    } catch (error) {
      const info = extractErrorInfo(error, 'Unable to load discussion comments.')
      setCommentsError(info.message)
      setComments([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    // Reload discussion when navigating between different project detail pages.
    loadComments()
  }, [loadComments])

  async function handleComment(e) {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitError('')
    setSubmitting(true)
    try {
      const data = await projectsService.addComment(projectId, body)
      setComments(c => [...c, data.comment])
      setBody('')
    } catch (error) {
      const info = extractErrorInfo(error, 'Unable to post comment right now.')
      setSubmitError(info.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
  if (commentsError) return (
    <div className="empty-state">
      <div className="icon">⚠️</div>
      <h3>Unable to load discussion</h3>
      <p>{commentsError}</p>
      <button className="btn btn-ghost" onClick={loadComments}>Retry discussion</button>
    </div>
  )

  return (
    <div>
      {comments.length === 0 && (
        <div className="empty-state" style={{ marginBottom: 20 }}>
          <div className="icon">💬</div>
          <h3>No comments yet</h3>
          <p>Be the first to leave a comment.</p>
        </div>
      )}
      {comments.map((c, i) => (
        <div key={i} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <Avatar name={c.author?.name} src={c.author?.avatar} size={32} textSize={11} />
            <div>
              <Link href={`/profile/${c.author?.handle}`} style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--accent)', textDecoration: 'none' }}>
                {c.author?.name}
              </Link>
              <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>{timeAgo(c.createdAt)}</span>
            </div>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{c.body}</div>
        </div>
      ))}
      {user && (
        <div className="card" style={{ marginTop: 16 }}>
          <form onSubmit={handleComment}>
            <textarea className="compose-input" placeholder="Leave a comment..." rows={3} value={body} onChange={e => setBody(e.target.value)} style={{ marginBottom: 10 }} />
            <button className="btn btn-primary btn-sm" type="submit" disabled={submitting || !body.trim()}>
              {submitting ? 'Posting...' : 'Post Comment'}
            </button>
            {submitError && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--danger, #d33)' }}>
                {submitError}
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  )
}

function timeAgo(date) {
  if (!date) return ''
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60)   return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}