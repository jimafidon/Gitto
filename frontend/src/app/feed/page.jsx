'use client'
// frontend/src/app/feed/page.jsx
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { postsService } from '@/services/posts.service'
import { usersService } from '@/services/users.service'
import PostCard from '@/components/PostCard'
import Avatar from '@/components/Avatar'

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth()
  const [posts, setPosts]           = useState([])
  const [suggested, setSuggested]   = useState([])
  const [myProjects, setMyProjects] = useState([])
  const [loading, setLoading]       = useState(true)
  const [compose, setCompose]       = useState('')
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedMilestoneTitle, setSelectedMilestoneTitle] = useState('')
  const [tagDraft, setTagDraft] = useState('')
  const [tags, setTags] = useState([])
  const [attachmentDraft, setAttachmentDraft] = useState('')
  const [attachments, setAttachments] = useState([])
  const [showAttachTools, setShowAttachTools] = useState(false)
  const [showMilestoneTools, setShowMilestoneTools] = useState(false)
  const [showTagTools, setShowTagTools] = useState(false)
  const [followingIds, setFollowingIds] = useState([])
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return

    if (!user?._id) {
      setLoading(false)
      setError('Sign in to load your feed.')
      return
    }

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [feedData, suggestedData, projectsData] = await Promise.all([
          postsService.getFeed(),
          usersService.getSuggested(),
          usersService.getProjects(user._id),
        ])
        setPosts(feedData.posts || [])
        setSuggested((suggestedData.users || []).filter((u) => u._id !== user._id))
        setMyProjects(projectsData.projects || [])
        setSelectedProjectId((projectsData.projects || [])[0]?._id || '')
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load feed right now.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authLoading, user?._id])

  useEffect(() => {
    const selectedProject = myProjects.find((p) => p._id === selectedProjectId)
    const hasMilestone = (selectedProject?.milestones || []).some((m) => m.title === selectedMilestoneTitle)
    if (!hasMilestone) setSelectedMilestoneTitle('')
  }, [myProjects, selectedProjectId, selectedMilestoneTitle])

  function handleLike(postId, liked, newCount) {
    setPosts(prev => prev.map(p =>
      p._id === postId ? { ...p, likesCount: newCount, likedByMe: liked } : p
    ))
  }

  async function handleCreatePost() {
    if (!user?._id) {
      setError('Sign in to post updates.')
      return
    }
    if (!compose.trim()) return
    if (!selectedProjectId) {
      setError('Create a project first so your update has a project context.')
      return
    }

    const body = compose.trim()
    const firstSentence = body.split(/[.!?]/)[0]?.trim() || ''
    const title = firstSentence ? firstSentence.slice(0, 90) : 'Project update'
    const selectedProject = myProjects.find((p) => p._id === selectedProjectId)
    const selectedMilestone = (selectedProject?.milestones || []).find((m) => m.title === selectedMilestoneTitle)

    setPosting(true)
    setError('')
    try {
      const data = await postsService.create({
        title,
        body,
        projectId: selectedProjectId,
        tags,
        attachments,
        milestone: selectedMilestone
          ? { title: selectedMilestone.title, progress: selectedMilestone.progress ?? 0 }
          : undefined,
      })
      if (data.post) {
        setPosts(prev => [data.post, ...prev])
      } else {
        const refreshed = await postsService.getFeed()
        setPosts(refreshed.posts || [])
      }
      setCompose('')
      setSelectedMilestoneTitle('')
      setTags([])
      setTagDraft('')
      setAttachments([])
      setAttachmentDraft('')
      setShowAttachTools(false)
      setShowMilestoneTools(false)
      setShowTagTools(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish update.')
    } finally {
      setPosting(false)
    }
  }

  function normalizeTag(value = '') {
    return value.trim().replace(/^#/, '').toLowerCase()
  }

  function addTag() {
    const normalized = normalizeTag(tagDraft)
    if (!normalized) return
    if (tags.includes(normalized)) {
      setTagDraft('')
      return
    }
    if (tags.length >= 8) {
      setError('You can add up to 8 tags per update.')
      return
    }
    setTags((prev) => [...prev, normalized])
    setTagDraft('')
    setError('')
  }

  function removeTag(tag) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  function isValidLink(url = '') {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'http:' || parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  function addAttachment() {
    const url = attachmentDraft.trim()
    if (!url) return
    if (!isValidLink(url)) {
      setError('Attachment must be a valid http(s) URL.')
      return
    }
    if (attachments.length >= 5) {
      setError('You can attach up to 5 links per update.')
      return
    }
    if (attachments.some((item) => item.url === url)) {
      setAttachmentDraft('')
      return
    }
    setAttachments((prev) => [...prev, { url }])
    setAttachmentDraft('')
    setError('')
  }

  function removeAttachment(url) {
    setAttachments((prev) => prev.filter((item) => item.url !== url))
  }

  async function handleFollow(userId) {
    if (!user?._id) {
      setError('Sign in to follow users.')
      return
    }
    if (!userId || followingIds.includes(userId)) return

    setFollowingIds(prev => [...prev, userId])
    setError('')
    try {
      await usersService.follow(userId)
      setSuggested(prev => prev.filter(u => u._id !== userId))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to follow user.')
    } finally {
      setFollowingIds(prev => prev.filter(id => id !== userId))
    }
  }

  const selectedProject = myProjects.find((p) => p._id === selectedProjectId)
  const availableMilestones = selectedProject?.milestones || []

  return (
    <div className="page fade-in">
      <div className="feed-layout">

        {/* ── Left sidebar ── */}
        <div className="feed-left-col sidebar-sticky">
          {[
            ['🏠', 'Feed',          '/feed'],
            ['🔍', 'Search',        '/search'],
            ['🔔', 'Notifications', '/notifications'],
            ['🔖', 'Saved',         '/saved'],
            ['⚙️', 'Settings',      '/settings'],
          ].map(([icon, label, href]) => (
            <Link key={label} href={href} className="sidebar-item">
              <span className="sidebar-icon">{icon}</span>{label}
            </Link>
          ))}

          <div className="divider" />

          <div style={{ padding: '0 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 10 }}>
              My Projects
            </div>
            {myProjects.length === 0 && (
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>No projects yet</div>
            )}
            {myProjects.map(p => (
              <Link key={p._id} href={`/project/${p._id}`} style={{ padding: '6px 0', fontSize: 13, color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                {p.title}
              </Link>
            ))}
            <Link href="/project/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
              + New Project
            </Link>
          </div>
        </div>

        {/* ── Main feed ── */}
        <div style={{ minWidth: 0 }}>
          {error && (
            <div style={{ background: 'rgba(255,110,110,0.1)', border: '1px solid rgba(255,110,110,0.3)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: 'var(--accent3)', marginBottom: 14 }}>
              {error}
            </div>
          )}

          {/* Compose box */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <Avatar name={user?.name} size={36} />
              <textarea
                className="compose-input"
                placeholder="Share an update on your project..."
                rows={2}
                value={compose}
                onChange={e => setCompose(e.target.value)}
              />
            </div>
            <div style={{ marginTop: 10 }}>
              <select
                className="input"
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                disabled={myProjects.length === 0}
                style={{ maxWidth: 280 }}
              >
                {myProjects.length === 0 && <option value="">No project selected</option>}
                {myProjects.map(p => (
                  <option key={p._id} value={p._id}>{p.title}</option>
                ))}
              </select>
            </div>
            {showAttachTools && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    className="input"
                    placeholder="https://example.com/resource"
                    value={attachmentDraft}
                    onChange={(e) => setAttachmentDraft(e.target.value)}
                    style={{ flex: 1, minWidth: 220 }}
                  />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addAttachment}>
                    Add Link
                  </button>
                </div>
                {attachments.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {attachments.map((item) => (
                      <span key={item.url} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        🔗 Link
                        <button type="button" onClick={() => removeAttachment(item.url)} style={{ border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {showMilestoneTools && (
              <div style={{ marginTop: 10 }}>
                <select
                  className="input"
                  value={selectedMilestoneTitle}
                  onChange={(e) => setSelectedMilestoneTitle(e.target.value)}
                  disabled={!selectedProjectId || availableMilestones.length === 0}
                  style={{ maxWidth: 320 }}
                >
                  <option value="">No milestone</option>
                  {availableMilestones.map((m) => (
                    <option key={m.title} value={m.title}>
                      {m.title} ({m.progress ?? 0}%)
                    </option>
                  ))}
                </select>
              </div>
            )}
            {showTagTools && (
              <div style={{ marginTop: 10 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    className="input"
                    placeholder="Add tag"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                    style={{ flex: 1, minWidth: 180 }}
                  />
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addTag}>
                    Add Tag
                  </button>
                </div>
                {tags.length > 0 && (
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {tags.map((tag) => (
                      <span key={tag} className="tag" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)} style={{ border: 0, background: 'transparent', color: 'inherit', cursor: 'pointer' }}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowAttachTools((v) => !v)}
                >
                  📎 Attach
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowMilestoneTools((v) => !v)}
                >
                  🎯 Milestone
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowTagTools((v) => !v)}
                >
                  #️⃣ Tag
                </button>
              </div>
              <button className="btn btn-primary btn-sm" disabled={!compose.trim() || posting || !selectedProjectId} onClick={handleCreatePost}>
                {posting ? 'Posting...' : 'Post Update'}
              </button>
            </div>
          </div>

          {/* Posts */}
          {loading && (
            [...Array(3)].map((_, i) => (
              <div key={i} className="card" style={{ marginBottom: 14 }}>
                <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 20, width: '70%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 14, width: '90%' }} />
              </div>
            ))
          )}

          {!loading && posts.length === 0 && (
            <div className="card empty-state">
              <div className="icon">📭</div>
              <h3>Your feed is empty</h3>
              <p>Follow other users or start your first project to see posts here.</p>
            </div>
          )}

          {!loading && posts.map(post => (
            <PostCard key={post._id} post={post} currentUserId={user?._id} onLikeChange={handleLike} />
          ))}
        </div>

        {/* ── Right sidebar ── */}
        <div className="feed-right-col right-sticky" style={{ minWidth: 0 }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="right-title">Trending Tags</div>
            {['#buildinpublic', '#100daysofcode', '#habits', '#ux', '#opensource', '#robotics'].map(t => (
              <div className="trending-tag" key={t}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{t}</span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="right-title">Who to Follow</div>
            {suggested.map(u => (
              <div className="suggested-user" key={u._id}>
                <Avatar name={u.name} src={u.avatar} size={34} />
                <div className="suggested-user-info">
                  <Link href={`/profile/${u.handle}`} style={{ textDecoration: 'none' }}>
                    <h4 style={{ color: 'var(--text)' }}>{u.name}</h4>
                  </Link>
                  <span>{u.projectsCount || 0} projects</span>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={followingIds.includes(u._id)}
                  onClick={() => handleFollow(u._id)}
                >
                  {followingIds.includes(u._id) ? 'Following...' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}