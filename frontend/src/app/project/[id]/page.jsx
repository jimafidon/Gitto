'use client'
// frontend/src/app/project/[id]/page.jsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { projectsService } from '@/services/projects.service'
import Avatar from '@/components/Avatar'
import MilestoneTimeline from '@/components/MilestoneTimeline'

export default function ProjectDetailPage({ params }) {
  const { id } = params
  const { user } = useAuth()
  const [project, setProject] = useState(null)
  const [tab, setTab]         = useState('overview')
  const [loading, setLoading] = useState(true)
  const [starred, setStarred] = useState(false)

  const isOwner = project?.author?._id === user?._id

  useEffect(() => {
    projectsService.getById(id)
      .then(data => {
        setProject(data.project)
        setStarred(data.project.stars?.includes(user?._id))
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleStar() {
    if (starred) {
      await projectsService.unstar(id)
      setProject(p => ({ ...p, starsCount: p.starsCount - 1 }))
    } else {
      await projectsService.star(id)
      setProject(p => ({ ...p, starsCount: p.starsCount + 1 }))
    }
    setStarred(s => !s)
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

  if (!project) return (
    <div className="page">
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="icon">📁</div>
        <h3>Project not found</h3>
        <p>This project doesn't exist or has been removed.</p>
        <Link href="/feed" className="btn btn-ghost" style={{ marginTop: 16 }}>Back to feed</Link>
      </div>
    </div>
  )

  const statusBadge = project.status === 'completed' ? 'badge-teal' : project.status === 'paused' ? 'badge-gray' : 'badge-green'

  return (
    <div className="page fade-in">
      <div className="project-detail">
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
          <button className={`btn ${starred ? 'btn-ghost' : 'btn-primary'}`} onClick={handleStar}>
            {starred ? '★' : '⭐'} {starred ? 'Starred' : 'Star'} · {project.starsCount || 0}
          </button>
          {!isOwner && <button className="btn btn-ghost">🔔 Follow</button>}
          {isOwner  && <Link href={`/project/${id}/edit`} className="btn btn-ghost">✏️ Edit</Link>}
          <button className="btn btn-ghost">🔗 Share</button>
        </div>

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
              {isOwner && (
                <button className="btn btn-ghost btn-block" style={{ marginTop: 8 }}>+ Add Milestone</button>
              )}
            </div>
          )}

          {tab === 'updates' && <UpdatesTab projectId={id} isOwner={isOwner} />}
          {tab === 'discussion' && <DiscussionTab projectId={id} />}
        </div>
      </div>
    </div>
  )
}

function UpdatesTab({ projectId, isOwner }) {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    projectsService.getUpdates(projectId)
      .then(data => setUpdates(data.updates || []))
      .finally(() => setLoading(false))
  }, [projectId])

  if (loading) return <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
  if (updates.length === 0) return (
    <div className="empty-state">
      <div className="icon">📝</div>
      <h3>No updates yet</h3>
      <p>{isOwner ? 'Share your first progress update.' : 'No updates have been posted yet.'}</p>
    </div>
  )

  return (
    <div>
      {updates.map((u, i) => (
        <div key={i} className="card update-card">
          <div className="update-header">
            <Avatar name={u.author?.name} src={u.author?.avatar} size={32} textSize={11} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{u.author?.name}</div>
              {u.milestone && <span className="badge badge-green" style={{ fontSize: 10, padding: '2px 8px' }}>{u.milestone}</span>}
            </div>
            <div className="update-date">{timeAgo(u.createdAt)}</div>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{u.title}</div>
          <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{u.body}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <button className="action-btn">🤍 Like</button>
            <button className="action-btn">💬 Comment</button>
          </div>
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

  useEffect(() => {
    projectsService.getComments(projectId)
      .then(data => setComments(data.comments || []))
      .finally(() => setLoading(false))
  }, [projectId])

  async function handleComment(e) {
    e.preventDefault()
    if (!body.trim()) return
    const data = await projectsService.addComment(projectId, body)
    setComments(c => [...c, data.comment])
    setBody('')
  }

  if (loading) return <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />

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
            <button className="btn btn-primary btn-sm" type="submit" disabled={!body.trim()}>Post Comment</button>
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