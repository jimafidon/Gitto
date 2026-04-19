import mongoose from 'mongoose'
import Project from '../models/Project.js'
import Post from '../models/Post.js'
import { serializeFeedPost } from '../lib/feed.serializers.js'

function toId(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value instanceof mongoose.Types.ObjectId) return value.toString()
  if (value._id) return toId(value._id)
  return String(value)
}

function serializeProjectMilestone(milestone) {
  return {
    _id: toId(milestone?._id),
    title: milestone?.title || '',
    description: milestone?.description || '',
    progress: milestone?.progress ?? 0,
    status: milestone?.status || 'upcoming',
  }
}

function recalculateProjectProgressFromMilestones(project) {
  const milestones = project?.milestones || []
  if (milestones.length === 0) {
    project.progress = 0
    return project.progress
  }

  const completedCount = milestones.filter((milestone) => milestone?.status === 'completed').length
  project.progress = Math.round((completedCount / milestones.length) * 100)
  return project.progress
}

function serializeProject(project, currentUserId = '', updatesCount = 0) {
  const author = project.author || null
  const stars = project.stars || []
  const followers = project.followers || []
  const comments = project.comments || []

  return {
    _id: toId(project._id),
    title: project.title || '',
    description: project.description || '',
    status: project.status || 'in_progress',
    progress: project.progress ?? 0,
    tags: project.tags || [],
    milestones: (project.milestones || []).map((m) => serializeProjectMilestone(m)),
    links: project.links || [],
    contributors: [],
    author: author
      ? {
          _id: toId(author._id || author),
          name: author.name || '',
          handle: author.handle || '',
          avatar: author.avatar || '',
        }
      : null,
    stars: stars.map((id) => toId(id)),
    followers: followers.map((id) => toId(id)),
    starsCount: stars.length,
    followersCount: followers.length,
    updatesCount,
    commentsCount: comments.length,
    starredByMe: currentUserId ? stars.some((id) => toId(id) === currentUserId) : false,
    followedByMe: currentUserId ? followers.some((id) => toId(id) === currentUserId) : false,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  }
}

async function findProjectOr404(res, projectId) {
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    res.status(400).json({ message: 'Invalid project id' })
    return null
  }

  const project = await Project.findById(projectId).populate('author', 'name handle avatar')
  if (!project) {
    res.status(404).json({ message: 'Project not found' })
    return null
  }

  return project
}

function canManageProject(project, userId = '') {
  return toId(project?.author) === String(userId || '')
}

// POST /api/projects
// Creates a new project owned by the authenticated user.
export async function createProject(req, res) {
  const payload = req.validatedProject || {}

  // Defensive fallback in case validation middleware is not wired.
  if (!payload.title) {
    return res.status(400).json({ message: 'Invalid project payload' })
  }

  const project = await Project.create({
    title: payload.title,
    description: payload.description,
    status: payload.status,
    progress: payload.progress,
    tags: payload.tags,
    milestones: payload.milestones,
    author: req.user._id,
  })

  // Return a compact shape consistent with feed-side project usage.
  return res.status(201).json({
    project: serializeProject(project, req.user._id.toString(), 0),
  })
}

// GET /api/projects/:id
export async function getProjectById(req, res) {
  const project = await findProjectOr404(res, req.params.id)
  if (!project) return

  const updatesCount = await Post.countDocuments({ project: project._id })
  const currentUserId = req.user?._id?.toString() || ''
  return res.json({ project: serializeProject(project, currentUserId, updatesCount) })
}

// POST /api/projects/:id/star
export async function starProject(req, res) {
  const project = await findProjectOr404(res, req.params.id)
  if (!project) return

  await Project.updateOne({ _id: project._id }, { $addToSet: { stars: req.user._id } })
  const refreshed = await Project.findById(project._id).select('stars')
  return res.json({
    starsCount: refreshed.stars.length,
    starredByMe: true,
  })
}

// DELETE /api/projects/:id/star
export async function unstarProject(req, res) {
  const project = await findProjectOr404(res, req.params.id)
  if (!project) return

  await Project.updateOne({ _id: project._id }, { $pull: { stars: req.user._id } })
  const refreshed = await Project.findById(project._id).select('stars')
  return res.json({
    starsCount: refreshed.stars.length,
    starredByMe: false,
  })
}

// POST /api/projects/:id/follow
export async function followProject(req, res) {
  const project = await findProjectOr404(res, req.params.id)
  if (!project) return

  await Project.updateOne({ _id: project._id }, { $addToSet: { followers: req.user._id } })
  const refreshed = await Project.findById(project._id).select('followers')
  return res.json({
    followersCount: refreshed.followers.length,
    followedByMe: true,
  })
}

// DELETE /api/projects/:id/follow
export async function unfollowProject(req, res) {
  const project = await findProjectOr404(res, req.params.id)
  if (!project) return

  await Project.updateOne({ _id: project._id }, { $pull: { followers: req.user._id } })
  const refreshed = await Project.findById(project._id).select('followers')
  return res.json({
    followersCount: refreshed.followers.length,
    followedByMe: false,
  })
}

// POST /api/projects/:id/milestones
export async function addProjectMilestone(req, res) {
  const project = await findProjectOr404(res, req.params.id)
  if (!project) return

  if (toId(project.author) !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the project owner can add milestones' })
  }

  const milestone = req.validatedMilestone || {}
  project.milestones.push({
    title: milestone.title,
    description: milestone.description || '',
    status: milestone.status || 'upcoming',
    progress: milestone.progress ?? 0,
  })
  recalculateProjectProgressFromMilestones(project)
  await project.save()

  const created = project.milestones[project.milestones.length - 1]
  return res.status(201).json({
    milestone: serializeProjectMilestone(created),
    milestones: project.milestones.map((m) => serializeProjectMilestone(m)),
    progress: project.progress ?? 0,
  })
}

// PATCH /api/projects/:id/milestones/:milestoneId/complete
export async function completeProjectMilestone(req, res) {
  const { id, milestoneId } = req.params
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid project id' })
  }
  if (!mongoose.Types.ObjectId.isValid(milestoneId)) {
    return res.status(400).json({ message: 'Invalid milestone id' })
  }

  const project = await Project.findById(id)
  if (!project) return res.status(404).json({ message: 'Project not found' })
  if (!canManageProject(project, req.user._id)) {
    return res.status(403).json({ message: 'Only the project owner can complete milestones' })
  }

  const milestone = (project.milestones || []).find((entry) => toId(entry._id) === milestoneId)
  if (!milestone) {
    return res.status(404).json({ message: 'Milestone not found' })
  }

  milestone.status = 'completed'
  milestone.progress = 100
  recalculateProjectProgressFromMilestones(project)
  await project.save()

  return res.json({
    milestone: serializeProjectMilestone(milestone),
    milestones: (project.milestones || []).map((entry) => serializeProjectMilestone(entry)),
    progress: project.progress ?? 0,
  })
}

// GET /api/projects/:id/updates
export async function getProjectUpdates(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'Invalid project id' })
  }

  const updates = await Post.find({ project: req.params.id })
    .sort({ createdAt: -1 })
    .populate('author', 'name handle avatar')
    .populate('project', 'status')

  const currentUserId = req.user?._id?.toString() || ''
  return res.json({
    updates: updates.map((post) => serializeFeedPost(post, currentUserId)),
  })
}

// GET /api/projects/:id/comments
export async function getProjectComments(req, res) {
  const project = await findProjectOr404(res, req.params.id)
  if (!project) return

  await project.populate('comments.author', 'name handle avatar')
  const comments = (project.comments || []).map((comment) => ({
    _id: toId(comment._id),
    body: comment.body || '',
    createdAt: comment.createdAt,
    author: comment.author
      ? {
          _id: toId(comment.author._id || comment.author),
          name: comment.author.name || '',
          handle: comment.author.handle || '',
          avatar: comment.author.avatar || '',
        }
      : null,
  }))

  return res.json({ comments })
}

// POST /api/projects/:id/comments
export async function addProjectComment(req, res) {
  const project = await findProjectOr404(res, req.params.id)
  if (!project) return

  const payload = req.validatedProjectComment || {}
  project.comments.push({
    author: req.user._id,
    body: payload.body,
  })
  await project.save()
  await project.populate('comments.author', 'name handle avatar')

  const comment = project.comments[project.comments.length - 1]
  return res.status(201).json({
    comment: {
      _id: toId(comment._id),
      body: comment.body || '',
      createdAt: comment.createdAt,
      author: comment.author
        ? {
            _id: toId(comment.author._id || comment.author),
            name: comment.author.name || '',
            handle: comment.author.handle || '',
            avatar: comment.author.avatar || '',
          }
        : null,
    },
  })
}

// GET /api/projects/search?q=
export async function searchProjects(req, res) {
  const raw = String(req.query.q || '').trim()
  const query = raw.replace(/^#/, '')
  if (!query) return res.json({ projects: [] })

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  const projects = await Project.find({
    $or: [
      { title: regex },
      { description: regex },
      { tags: { $in: [regex] } },
    ],
  })
    .sort({ updatedAt: -1 })
    .limit(30)
    .populate('author', 'name handle avatar')

  return res.json({
    projects: projects.map((project) => ({
      _id: toId(project._id),
      title: project.title || '',
      description: project.description || '',
      status: project.status || 'in_progress',
      progress: project.progress ?? 0,
      tags: project.tags || [],
      author: project.author
        ? {
            _id: toId(project.author._id || project.author),
            name: project.author.name || '',
            handle: project.author.handle || '',
            avatar: project.author.avatar || '',
          }
        : null,
      updatedAt: project.updatedAt,
    })),
  })
}

// PATCH /api/projects/:id
export async function updateProject(req, res) {
  const project = await findProjectOr404(res, req.params.id)
  if (!project) return

  if (!canManageProject(project, req.user._id)) {
    return res.status(403).json({ message: 'Only the project owner can update this project' })
  }

  const patch = req.validatedProjectUpdate || {}
  Object.assign(project, patch)
  if (patch.milestones !== undefined) {
    recalculateProjectProgressFromMilestones(project)
  }
  await project.save()
  await project.populate('author', 'name handle avatar')

  const updatesCount = await Post.countDocuments({ project: project._id })
  return res.json({
    project: serializeProject(project, req.user._id.toString(), updatesCount),
  })
}

// DELETE /api/projects/:id
export async function removeProject(req, res) {
  const project = await findProjectOr404(res, req.params.id)
  if (!project) return

  if (!canManageProject(project, req.user._id)) {
    return res.status(403).json({ message: 'Only the project owner can delete this project' })
  }

  await Post.deleteMany({ project: project._id })
  await Project.deleteOne({ _id: project._id })

  return res.json({
    ok: true,
    deletedProjectId: toId(project._id),
  })
}
