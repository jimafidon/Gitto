'use client'
// frontend/src/app/saved/page.jsx
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { postsService } from '@/services/posts.service'
import PostCard from '@/components/PostCard'

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadSavedPosts() {
    setLoading(true)
    setError('')
    try {
      const data = await postsService.getSaved()
      setPosts(data.posts || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load saved posts right now.')
      setPosts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    if (!user?._id) {
      setLoading(false)
      setError('Sign in to view your saved posts.')
      setPosts([])
      return
    }
    loadSavedPosts()
  }, [authLoading, user?._id])

  function handleSaveChange(postId, isSaved) {
    if (isSaved) return
    setPosts((prev) => prev.filter((post) => post._id !== postId))
  }

  return (
    <div className="page fade-in">
      <div style={{ maxWidth: 760, margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: 18 }}>
          <h1 style={{ margin: 0, fontSize: 28, fontFamily: 'var(--font-display)' }}>Saved</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text3)', fontSize: 14 }}>
            Posts you bookmarked for later.
          </p>
        </div>

        {error && (
          <div className="card" style={{ marginBottom: 14, borderColor: 'var(--danger, #d33)' }}>
            <div style={{ fontSize: 13, color: 'var(--danger, #d33)', marginBottom: 8 }}>{error}</div>
            {!user?._id ? (
              <Link href="/login" className="btn btn-ghost btn-sm">Go to login</Link>
            ) : (
              <button className="btn btn-ghost btn-sm" onClick={loadSavedPosts}>Retry</button>
            )}
          </div>
        )}

        {loading && (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card" style={{ marginBottom: 14 }}>
              <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 20, width: '70%', marginBottom: 10 }} />
              <div className="skeleton" style={{ height: 14, width: '90%' }} />
            </div>
          ))
        )}

        {!loading && !error && posts.length === 0 && (
          <div className="card empty-state">
            <div className="icon">🔖</div>
            <h3>No saved posts yet</h3>
            <p>Bookmark posts from your feed to see them here.</p>
            <Link href="/feed" className="btn btn-ghost" style={{ marginTop: 10 }}>Back to feed</Link>
          </div>
        )}

        {!loading && posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            currentUserId={user?._id}
            onSaveChange={handleSaveChange}
          />
        ))}
      </div>
    </div>
  )
}
