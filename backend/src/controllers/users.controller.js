import mongoose from 'mongoose'
import User from '../models/User.js'
import Project from '../models/Project.js'
import { serializeSuggestedUser } from '../lib/feed.serializers.js'

function toId(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (value instanceof mongoose.Types.ObjectId) return value.toString()
  if (value._id) return toId(value._id)
  return String(value)
}

export async function getSuggestedUsers(req, res) {
  const excluded = [req.user._id, ...(req.user.following || [])]

  const users = await User.find({ _id: { $nin: excluded } })
    .sort({ createdAt: -1 })
    .limit(8)

  const ids = users.map((u) => u._id)
  const counts = await Project.aggregate([
    { $match: { author: { $in: ids } } },
    { $group: { _id: '$author', count: { $sum: 1 } } },
  ])
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]))

  return res.json({
    users: users.map((u) => serializeSuggestedUser(u, countMap.get(String(u._id)) || 0)),
  })
}

export async function searchUsers(req, res) {
  const query = String(req.query.q || '').trim()
  if (!query) return res.json({ users: [] })

  const users = await User.find({
    $or: [
      { handle: { $regex: query, $options: 'i' } },
      { name: { $regex: query, $options: 'i' } },
    ],
  })
    .select('name handle avatar followers following')
    .sort({ createdAt: -1 })
    .limit(20)

  const ids = users.map((u) => u._id)
  const counts = await Project.aggregate([
    { $match: { author: { $in: ids } } },
    { $group: { _id: '$author', count: { $sum: 1 } } },
  ])
  const countMap = new Map(counts.map((c) => [String(c._id), c.count]))

  return res.json({
    users: users.map((u) => ({
      _id: toId(u._id),
      name: u.name || '',
      handle: u.handle || '',
      avatar: u.avatar || '',
      projectsCount: countMap.get(String(u._id)) || 0,
      followersCount: (u.followers || []).length,
      followingCount: (u.following || []).length,
    })),
  })
}

export async function getUserByHandle(req, res) {
  const handle = String(req.params.handle || '').trim().toLowerCase()
  if (!handle) return res.status(400).json({ message: 'Handle is required' })

  const user = await User.findOne({ handle }).select(
    'name handle email avatar bio location followers following createdAt updatedAt',
  )
  if (!user) return res.status(404).json({ message: 'User not found' })

  const projectsCount = await Project.countDocuments({ author: user._id })

  return res.json({
    user: {
      _id: toId(user._id),
      name: user.name || '',
      handle: user.handle || '',
      email: user.email || '',
      avatar: user.avatar || '',
      bio: user.bio || '',
      location: user.location || '',
      followers: (user.followers || []).map((id) => toId(id)),
      following: (user.following || []).map((id) => toId(id)),
      followersCount: (user.followers || []).length,
      followingCount: (user.following || []).length,
      projectsCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  })
}

export async function getUserProjects(req, res) {
  if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
    return res.status(400).json({ message: 'Invalid user id' })
  }

  const projects = await Project.find({ author: req.params.userId })
    .sort({ updatedAt: -1 })
    .select('title status progress tags milestones')

  return res.json({
    projects: projects.map((project) => ({
      _id: project._id,
      title: project.title,
      status: project.status,
      progress: project.progress || 0,
      tags: project.tags || [],
      milestones: (project.milestones || []).map((m) => ({
        title: m.title || '',
        progress: m.progress ?? 0,
        status: m.status || 'upcoming',
      })),
    })),
  })
}

export async function followUser(req, res) {
  const { userId } = req.params
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user id' })
  }
  if (userId === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot follow yourself' })
  }

  const target = await User.findById(userId)
  if (!target) return res.status(404).json({ message: 'User not found' })

  await User.updateOne({ _id: req.user._id }, { $addToSet: { following: target._id } })
  await User.updateOne({ _id: target._id }, { $addToSet: { followers: req.user._id } })

  return res.json({ ok: true })
}

export async function unfollowUser(req, res) {
  const { userId } = req.params
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: 'Invalid user id' })
  }

  const target = await User.findById(userId)
  if (!target) return res.status(404).json({ message: 'User not found' })

  await User.updateOne({ _id: req.user._id }, { $pull: { following: target._id } })
  await User.updateOne({ _id: target._id }, { $pull: { followers: req.user._id } })

  return res.json({ ok: true })
}
