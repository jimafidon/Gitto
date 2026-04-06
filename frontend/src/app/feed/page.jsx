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
  const { user } = useAuth()
  const [posts, setPosts]           = useState([])
  const [suggested, setSuggested]   = useState([])
  const [myProjects, setMyProjects] = useState([])
  const [loading, setLoading]       = useState(true)
  const [compose, setCompose]       = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [feedData, suggestedData] = await Promise.all([
          postsService.getFeed(),
          usersService.getSuggested(),
        ])
        setPosts(feedData.posts)
        setSuggested(suggestedData.users)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  function handleLike(postId, liked, newCount) {
    setPosts(prev => prev.map(p =>
      p._id === postId ? { ...p, likesCount: newCount, likedByMe: liked } : p
    ))
  }

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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['📎 Attach', '🎯 Milestone', '#️⃣ Tag'].map(a => (
                  <button key={a} className="btn btn-ghost btn-sm" style={{ fontSize: 12 }}>{a}</button>
                ))}
              </div>
              <button className="btn btn-primary btn-sm" disabled={!compose.trim()}>Post Update</button>
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
                <button className="btn btn-ghost btn-sm">Follow</button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}