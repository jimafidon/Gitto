import mongoose from 'mongoose'
import Post from '../models/Post.js'
import Project from '../models/Project.js'
import { serializeFeedPost } from '../lib/feed.serializers.js'

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
