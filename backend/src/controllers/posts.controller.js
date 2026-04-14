import mongoose from 'mongoose'
import Post from '../models/Post.js'
import Project from '../models/Project.js'
import { serializeFeedPost } from '../lib/feed.serializers.js'

function isOwner(entityUserId, currentUserId) {
  return String(entityUserId || '') === String(currentUserId || '')
}

export async function getFeed(req, res) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1)
  const limit = 20
  const skip = (page - 1) * limit

  const posts = await Post.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('author', 'name handle avatar')
    .populate('project', 'status')

  return res.json({
    posts: posts.map((post) => serializeFeedPost(post, req.user?._id?.toString() || '')),
    page,
    hasMore: posts.length === limit,
  })
}

export async function getSavedPosts(req, res) {
  const posts = await Post.find({ savedBy: req.user._id })
    .sort({ createdAt: -1 })
    .populate('author', 'name handle avatar')
    .populate('project', 'status')

  return res.json({
    posts: posts.map((post) => serializeFeedPost(post, req.user._id.toString())),
  })
}

export async function createPost(req, res) {
  const { title, body, projectId, tags, milestone, attachments } = req.validatedPost || {}
  if (!title || !body || !projectId) {
    return res.status(400).json({ message: 'Invalid post payload' })
  }

  const project = await Project.findById(projectId)
  if (!project) return res.status(404).json({ message: 'Project not found' })
  if (project.author.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only post updates for your own projects' })
  }

  let normalizedMilestone
  if (milestone?.title) {
    const projectMilestone = (project.milestones || []).find((m) => m.title === milestone.title)
    if (!projectMilestone) {
      return res.status(400).json({ message: 'Selected milestone is not part of the project' })
    }
    normalizedMilestone = {
      title: projectMilestone.title,
      progress: Number.isFinite(projectMilestone.progress)
        ? Math.max(0, Math.min(100, projectMilestone.progress))
        : 0,
    }
  }

  const post = await Post.create({
    title: String(title).trim(),
    body: String(body).trim(),
    project: project._id,
    author: req.user._id,
    tags,
    milestone: normalizedMilestone,
    attachments,
  })

  const hydrated = await Post.findById(post._id)
    .populate('author', 'name handle avatar')
    .populate('project', 'status')

  return res.status(201).json({
    post: serializeFeedPost(hydrated, req.user._id.toString()),
  })
}

export async function likePost(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }
  const post = await Post.findById(req.params.id)
  if (!post) return res.status(404).json({ message: 'Post not found' })

  const uid = req.user._id.toString()
  if (!post.likes.some((id) => id.toString() === uid)) {
    post.likes.push(req.user._id)
    await post.save()
  }
  return res.json({ likesCount: post.likes.length, likedByMe: true })
}

export async function unlikePost(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }
  const post = await Post.findById(req.params.id)
  if (!post) return res.status(404).json({ message: 'Post not found' })

  post.likes = post.likes.filter((id) => id.toString() !== req.user._id.toString())
  await post.save()

  return res.json({ likesCount: post.likes.length, likedByMe: false })
}

export async function savePost(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }
  const post = await Post.findById(req.params.id)
  if (!post) return res.status(404).json({ message: 'Post not found' })

  await Post.updateOne({ _id: post._id }, { $addToSet: { savedBy: req.user._id } })
  const refreshed = await Post.findById(post._id).select('savedBy')
  return res.json({
    savedByMe: true,
    savedCount: refreshed.savedBy.length,
  })
}

export async function unsavePost(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }
  const post = await Post.findById(req.params.id)
  if (!post) return res.status(404).json({ message: 'Post not found' })

  await Post.updateOne({ _id: post._id }, { $pull: { savedBy: req.user._id } })
  const refreshed = await Post.findById(post._id).select('savedBy')
  return res.json({
    savedByMe: false,
    savedCount: refreshed.savedBy.length,
  })
}

export async function addPostComment(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }

  const post = await Post.findById(req.params.id).populate('author', 'name handle avatar')
  if (!post) return res.status(404).json({ message: 'Post not found' })

  const payload = req.validatedPostComment || {}
  post.comments.push({
    author: req.user._id,
    body: payload.body,
  })
  await post.save()
  await post.populate('comments.author', 'name handle avatar')

  const comment = post.comments[post.comments.length - 1]
  return res.status(201).json({
    comment: {
      _id: comment._id,
      body: comment.body || '',
      createdAt: comment.createdAt,
      author: comment.author
        ? {
            _id: comment.author._id,
            name: comment.author.name || '',
            handle: comment.author.handle || '',
            avatar: comment.author.avatar || '',
          }
        : null,
    },
    commentsCount: post.comments.length,
  })
}

export async function getPostById(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }

  const post = await Post.findById(req.params.id)
    .populate('author', 'name handle avatar')
    .populate('project', 'status')

  if (!post) return res.status(404).json({ message: 'Post not found' })

  return res.json({
    post: serializeFeedPost(post, req.user?._id?.toString() || ''),
  })
}

export async function updatePost(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }

  const post = await Post.findById(req.params.id)
  if (!post) return res.status(404).json({ message: 'Post not found' })
  if (!isOwner(post.author, req.user._id)) {
    return res.status(403).json({ message: 'Only the post author can update this post' })
  }

  const patch = req.validatedPostUpdate || {}

  if (patch.title !== undefined) post.title = patch.title
  if (patch.body !== undefined) post.body = patch.body
  if (patch.tags !== undefined) post.tags = patch.tags
  if (patch.attachments !== undefined) post.attachments = patch.attachments

  if (patch.milestone !== undefined) {
    if (patch.milestone === null) {
      post.milestone = undefined
    } else {
      const project = await Project.findById(post.project).select('milestones')
      const projectMilestone = (project?.milestones || []).find((m) => m.title === patch.milestone.title)
      if (!projectMilestone) {
        return res.status(400).json({ message: 'Selected milestone is not part of the project' })
      }
      post.milestone = {
        title: projectMilestone.title,
        progress: Number.isFinite(projectMilestone.progress)
          ? Math.max(0, Math.min(100, projectMilestone.progress))
          : 0,
      }
    }
  }

  await post.save()
  const hydrated = await Post.findById(post._id)
    .populate('author', 'name handle avatar')
    .populate('project', 'status')

  return res.json({
    post: serializeFeedPost(hydrated, req.user._id.toString()),
  })
}

export async function removePost(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }

  const post = await Post.findById(req.params.id)
  if (!post) return res.status(404).json({ message: 'Post not found' })
  if (!isOwner(post.author, req.user._id)) {
    return res.status(403).json({ message: 'Only the post author can delete this post' })
  }

  await Post.deleteOne({ _id: post._id })
  return res.json({ ok: true, deletedPostId: post._id.toString() })
}

export async function deletePostComment(req, res) {
  const { id, commentId } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid post id' })
  }
  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    return res.status(400).json({ message: 'Invalid comment id' })
  }

  const post = await Post.findById(id)
  if (!post) return res.status(404).json({ message: 'Post not found' })

  const idx = (post.comments || []).findIndex((comment) => comment._id.toString() === commentId)
  if (idx === -1) return res.status(404).json({ message: 'Comment not found' })

  const comment = post.comments[idx]
  const canDelete = isOwner(comment.author, req.user._id) || isOwner(post.author, req.user._id)
  if (!canDelete) {
    return res.status(403).json({ message: 'You are not allowed to delete this comment' })
  }

  post.comments.splice(idx, 1)
  await post.save()

  return res.json({
    ok: true,
    commentsCount: post.comments.length,
    deletedCommentId: commentId,
  })
}
