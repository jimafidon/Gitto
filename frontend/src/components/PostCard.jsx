'use client'
// frontend/src/components/PostCard.jsx
import { useState } from 'react'
import { useEffect } from 'react'
import Link from 'next/link'
import { postsService } from '@/services/posts.service'
import Avatar from './Avatar'

function timeAgo(date) {
  if (!date) return ''
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function PostCard({ post, currentUserId, onLikeChange, onSaveChange }) {
  const [liked,      setLiked]      = useState(post.likedByMe || false)
  const [likesCount, setLikesCount] = useState(post.likesCount || 0)
  const [bookmarked, setBookmarked] = useState(post.savedByMe || false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    setBookmarked(Boolean(post.savedByMe))
  }, [post.savedByMe])

  async function handleLike() {
    const newLiked = !liked
    const newCount = newLiked ? likesCount + 1 : likesCount - 1
    setLiked(newLiked)
    setLikesCount(newCount)
    try {
      if (newLiked) await postsService.like(post._id)
      else          await postsService.unlike(post._id)
      onLikeChange?.(post._id, newLiked, newCount)
    } catch {
      // Revert on failure
      setLiked(!newLiked)
      setLikesCount(likesCount)
    }
  }

  async function handleSave() {
    if (!post?._id || saving) return
    const nextSaved = !bookmarked
    setSaveError('')
    setSaving(true)
    setBookmarked(nextSaved)
    try {
      if (nextSaved) await postsService.save(post._id)
      else await postsService.unsave(post._id)
      onSaveChange?.(post._id, nextSaved)
    } catch (err) {
      setBookmarked(!nextSaved)
      setSaveError(err.response?.data?.message || 'Unable to update saved state right now.')
    } finally {
      setSaving(false)
    }
  }

  const isOwner = currentUserId === post.author?._id

  return (
    <div className="card post-card">
      <div className="post-header">
        <div className="post-user">
          <Link href={`/profile/${post.author?.handle}`}>
            <Avatar name={post.author?.name} src={post.author?.avatar} size={40} />
          </Link>
          <div className="post-user-info">
            <Link href={`/profile/${post.author?.handle}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h4>{post.author?.name}</h4>
            </Link>
            <span>@{post.author?.handle} · {timeAgo(post.createdAt)}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`badge ${post.project?.status === 'completed' ? 'badge-teal' : 'badge-green'}`}>
            {post.project?.status || 'Update'}
          </span>
          {isOwner && (
            <button className="action-btn" style={{ padding: '4px 8px' }}>⋯</button>
          )}
        </div>
      </div>

      <Link href={`/project/${post.project?._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className="post-title">{post.title}</div>
      </Link>

      <div className="post-body">{post.body}</div>

      {post.milestone && (
        <div className="post-milestone">
          <div className="post-milestone-label">📍 Current Milestone</div>
          <div className="post-milestone-name">{post.milestone.title}</div>
          <div className="progress-wrap">
            <div className="progress-fill" style={{ width: `${post.milestone.progress || 0}%` }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{post.milestone.progress || 0}% complete</div>
        </div>
      )}

      {post.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {post.tags.map(t => <span key={t} className="tag">#{t}</span>)}
        </div>
      )}

      <div className="post-actions">
        <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
          {liked ? '❤️' : '🤍'} {likesCount}
        </button>
        <button className="action-btn">💬 {post.commentsCount || 0}</button>
        <button className="action-btn">🔁 Share</button>
        <button
          className={`action-btn ${bookmarked ? 'bookmarked' : ''}`}
          style={{ marginLeft: 'auto' }}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? '⏳' : '🔖'}
        </button>
      </div>
      {saveError && (
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--danger, #d33)' }}>
          {saveError}
        </div>
      )}
    </div>
  )
}