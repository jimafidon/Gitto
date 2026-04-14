import mongoose from 'mongoose'

function idOf(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value instanceof mongoose.Types.ObjectId) return value.toString()
  if (value._id) return idOf(value._id)
  return String(value)
}

export function serializeFeedPost(post, currentUserId = '') {
  const likes = post.likes || []
  const savedBy = post.savedBy || []
  const comments = post.comments || []
  const attachments = post.attachments || []

  return {
    _id: idOf(post._id),
    title: post.title || '',
    body: post.body || '',
    createdAt: post.createdAt,
    author: post.author
      ? {
          _id: idOf(post.author._id || post.author),
          name: post.author.name || '',
          handle: post.author.handle || '',
          avatar: post.author.avatar || '',
        }
      : null,
    project: post.project
      ? {
          _id: idOf(post.project._id || post.project),
          status: post.project.status || 'in_progress',
        }
      : null,
    milestone: post.milestone?.title
      ? {
          title: post.milestone.title,
          progress: post.milestone.progress ?? 0,
        }
      : null,
    tags: (post.tags || []).map((t) => String(t).replace(/^#/, '').trim()).filter(Boolean),
    attachments: attachments
      .map((item) => ({
        label: item.label || '',
        url: item.url || '',
      }))
      .filter((item) => item.url),
    likesCount: likes.length,
    likedByMe: currentUserId ? likes.some((likeId) => idOf(likeId) === currentUserId) : false,
    savedByMe: currentUserId ? savedBy.some((savedUserId) => idOf(savedUserId) === currentUserId) : false,
    commentsCount: comments.length,
  }
}

export function serializeSuggestedUser(user, projectsCount = 0) {
  return {
    _id: idOf(user._id),
    name: user.name || '',
    handle: user.handle || '',
    avatar: user.avatar || '',
    projectsCount,
  }
}
