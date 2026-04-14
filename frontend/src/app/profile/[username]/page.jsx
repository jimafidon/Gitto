'use client'
// frontend/src/app/profile/[username]/page.jsx
import { useState, useEffect } from 'react'
import { use } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { usersService } from '@/services/users.service'
import Avatar from '@/components/Avatar'

export default function ProfilePage({ params }) {
  const { username } = use(params)
  const { user: currentUser } = useAuth()
  const [profile, setProfile]     = useState(null)
  const [tab, setTab]             = useState('projects')
  const [loading, setLoading]     = useState(true)
  const [following, setFollowing] = useState(false)

  const isOwnProfile = currentUser?.handle === username

  useEffect(() => {
    usersService.getByHandle(username)
      .then(data => {
        setProfile(data.user)
        setFollowing(data.user.followers?.includes(currentUser?._id))
      })
      .finally(() => setLoading(false))
  }, [username])

  async function handleFollow() {
    if (following) {
      await usersService.unfollow(profile._id)
      setProfile(p => ({ ...p, followersCount: p.followersCount - 1 }))
    } else {
      await usersService.follow(profile._id)
      setProfile(p => ({ ...p, followersCount: p.followersCount + 1 }))
    }
    setFollowing(f => !f)
  }

  if (loading) return (
    <div className="page">
      <div style={{ height: 200, background: 'var(--surface2)' }} />
      <div style={{ padding: 'var(--pad)' }}>
        <div className="skeleton" style={{ width: 96, height: 96, borderRadius: '50%', marginBottom: 16 }} />
        <div className="skeleton" style={{ width: 200, height: 24, marginBottom: 10 }} />
        <div className="skeleton" style={{ width: 300, height: 14 }} />
      </div>
    </div>
  )

  if (!profile) return (
    <div className="page">
      <div className="empty-state" style={{ marginTop: 80 }}>
        <div className="icon">👤</div>
        <h3>User not found</h3>
        <p>This profile doesn't exist or has been removed.</p>
      </div>
    </div>
  )

  return (
    <div className="page fade-in">
      <div className="profile-banner" />
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-wrap">
            <Avatar name={profile.name} src={profile.avatar} size={92} textSize={32} />
          </div>
          <div className="profile-info">
            <h1>{profile.name}</h1>
            <div className="handle">@{profile.handle}</div>
            {profile.bio && <div className="profile-bio">{profile.bio}</div>}
            {profile.location && (
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>📌 {profile.location}</div>
            )}
            <div className="profile-stats">
              {[
                [profile.projectsCount || 0, 'Projects'],
                [profile.followersCount  || 0, 'Followers'],
                [profile.followingCount  || 0, 'Following'],
              ].map(([n, l]) => (
                <div key={l} className="profile-stat">
                  <div className="num">{n}</div>
                  <div className="label">{l}</div>
                </div>
              ))}
            </div>
            <div className="profile-actions">
              {isOwnProfile ? (
                <button className="btn btn-ghost">Edit Profile</button>
              ) : (
                <>
                  <button className={`btn ${following ? 'btn-ghost' : 'btn-primary'}`} onClick={handleFollow}>
                    {following ? 'Following' : 'Follow'}
                  </button>
                  <button className="btn btn-ghost">Message</button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          {['projects', 'activity', 'milestones'].map(t => (
            <button key={t} className={`profile-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="profile-content">
          {tab === 'projects' && <ProjectsTab userId={profile._id} />}
          {tab === 'activity' && <ActivityTab userId={profile._id} />}
          {tab === 'milestones' && <MilestonesTab userId={profile._id} />}
        </div>
      </div>
    </div>
  )
}

function ProjectsTab({ userId }) {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    usersService.getProjects(userId)
      .then(data => setProjects(data.projects))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />

  if (projects.length === 0) return (
    <div className="empty-state">
      <div className="icon">📁</div>
      <h3>No projects yet</h3>
      <p>Projects will appear here once created.</p>
    </div>
  )

  return (
    <div className="project-grid">
      {projects.map(p => (
        <Link key={p._id} href={`/project/${p._id}`} style={{ textDecoration: 'none' }}>
          <div className="card project-card-mini">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
              <div className="pcm-title">{p.title}</div>
              <span className={`badge ${p.status === 'completed' ? 'badge-teal' : p.status === 'paused' ? 'badge-gray' : 'badge-green'}`}>
                {p.status}
              </span>
            </div>
            <div className="pcm-desc">{p.description}</div>
            <div className="pcm-tags">{p.tags?.map(t => <span key={t} className="tag">#{t}</span>)}</div>
            <div className="progress-wrap" style={{ marginBottom: 8 }}>
              <div className="progress-fill" style={{ width: `${p.progress || 0}%` }} />
            </div>
            <div className="pcm-footer">
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>{p.progress || 0}% complete</span>
              <span style={{ fontSize: 12, color: 'var(--text2)' }}>⭐ {p.starsCount || 0}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

function ActivityTab({ userId }) {
  return (
    <div className="empty-state">
      <div className="icon">📋</div>
      <h3>Activity coming soon</h3>
      <p>Recent activity will be shown here.</p>
    </div>
  )
}

function MilestonesTab({ userId }) {
  return (
    <div className="empty-state">
      <div className="icon">🎯</div>
      <h3>Milestones coming soon</h3>
      <p>Milestones across all projects will appear here.</p>
    </div>
  )
}