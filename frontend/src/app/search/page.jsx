'use client'
// frontend/src/app/search/page.jsx
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usersService } from '@/services/users.service'
import { projectsService } from '@/services/projects.service'
import Avatar from '@/components/Avatar'

export default function SearchPage() {
  const [query, setQuery]     = useState('')
  const [filter, setFilter]   = useState('all')
  const [users, setUsers]     = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async () => {
    // Empty query resets result panes and avoids unnecessary backend requests.
    if (!query.trim()) { setUsers([]); setProjects([]); return }
    setLoading(true)
    try {
      // Fetch only the result types relevant to active filter for lower request volume.
      const [u, p] = await Promise.all([
        filter !== 'projects' ? usersService.search(query)    : Promise.resolve({ users: [] }),
        filter !== 'people'   ? projectsService.search(query) : Promise.resolve({ projects: [] }),
      ])
      setUsers(u.users || [])
      setProjects(p.projects || [])
    } finally {
      setLoading(false)
    }
  }, [query, filter])

  useEffect(() => {
    // Debounce keyboard input so search runs after user pauses typing.
    const t = setTimeout(search, 400)
    return () => clearTimeout(t)
  }, [search])

  return (
    <div className="page fade-in">
      <div className="search-page">
        <div className="search-hero">
          <h1>Discover Projects & People</h1>
          <div className="search-bar-wrap">
            <span className="search-icon">🔍</span>
            <input
              className="search-bar"
              placeholder="Search projects, users, tags..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {loading && <div className="spin" style={{ width: 18, height: 18, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', flexShrink: 0 }} />}
          </div>
          <div className="search-filters">
            {['all', 'people', 'projects', 'tags'].map(f => (
              <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* People */}
        {(filter === 'all' || filter === 'people') && users.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div className="search-section-title">👥 People</div>
            <div className="search-results-grid">
              {users.map(u => (
                <Link key={u._id} href={`/profile/${u.handle}`} style={{ textDecoration: 'none' }}>
                  <div className="card user-result-card">
                    <Avatar name={u.name} src={u.avatar} size={40} />
                    <div className="user-result-info">
                      <h4>{u.name}</h4>
                      <span>@{u.handle} · {u.projectsCount || 0} projects</span>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={e => e.preventDefault()}>Follow</button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {(filter === 'all' || filter === 'projects') && projects.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div className="search-section-title">📁 Projects</div>
            <div className="search-results-grid">
              {projects.map(p => (
                <Link key={p._id} href={`/project/${p._id}`} style={{ textDecoration: 'none' }}>
                  <div className="card">
                    <div className="prj-title">{p.title}</div>
                    <div className="prj-meta">by @{p.author?.handle}</div>
                    <div className="prj-desc" style={{ marginBottom: 12 }}>{p.description}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {p.tags?.map(t => <span key={t} className="tag">#{t}</span>)}
                    </div>
                    <div className="progress-wrap">
                      <div className="progress-fill" style={{ width: `${p.progress || 0}%` }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{p.progress || 0}% complete</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && query && users.length === 0 && projects.length === 0 && (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <h3>No results for &quot;{query}&quot;</h3>
            <p>Try a different search term or filter.</p>
          </div>
        )}

        {/* Default — no query yet */}
        {!query && (
          <div>
            <div className="search-section-title">#️⃣ Popular Tags</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {['#buildinpublic', '#100daysofcode', '#habits', '#ux', '#opensource', '#robotics', '#design', '#nodejs', '#mindfulness', '#iot', '#3dprinting', '#webdev'].map(tag => (
                <div key={tag} onClick={() => setQuery(tag.replace('#', ''))} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{tag}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}