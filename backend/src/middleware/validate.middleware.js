import mongoose from 'mongoose'

function normalizeTags(tags = []) {
  if (!Array.isArray(tags)) return []
  return tags
    .map((tag) => String(tag).replace(/^#/, '').trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8)
}

function isValidHttpUrl(value = '') {
  try {
    const parsed = new URL(String(value))
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

function normalizeAttachments(attachments = []) {
  if (!Array.isArray(attachments)) return []
  return attachments
    .map((item) => ({
      label: String(item?.label || '').trim().slice(0, 80),
      url: String(item?.url || '').trim(),
    }))
    .filter((item) => item.url)
    .slice(0, 5)
}

function normalizeMilestone(milestone) {
  if (!milestone?.title) return undefined
  return {
    title: String(milestone.title).trim(),
    progress: Number.isFinite(milestone.progress)
      ? Math.max(0, Math.min(100, milestone.progress))
      : undefined,
  }
}

export function validateCreatePost(req, res, next) {
  const { title, body, projectId, tags, milestone, attachments } = req.body || {}

  if (!title?.trim() || !body?.trim() || !projectId) {
    return res.status(400).json({ message: 'title, body and projectId are required' })
  }
  if (!mongoose.Types.ObjectId.isValid(projectId)) {
    return res.status(400).json({ message: 'Invalid project id' })
  }

  const normalizedAttachments = normalizeAttachments(attachments)
  const invalidAttachment = normalizedAttachments.find((item) => !isValidHttpUrl(item.url))
  if (invalidAttachment) {
    return res.status(400).json({ message: 'Attachments must be valid http(s) links' })
  }

  req.validatedPost = {
    title: String(title).trim(),
    body: String(body).trim(),
    projectId: String(projectId),
    tags: normalizeTags(tags),
    milestone: normalizeMilestone(milestone),
    attachments: normalizedAttachments,
  }

  return next()
}

// Normalize project status to a schema-supported value.
function normalizeProjectStatus(value = '') {
  const normalized = String(value || '').trim()
  const allowed = ['in_progress', 'paused', 'completed']
  return allowed.includes(normalized) ? normalized : 'in_progress'
}

// Normalize milestone status to a schema-supported value.
function normalizeMilestoneStatus(value = '') {
  const normalized = String(value || '').trim()
  const allowed = ['upcoming', 'in_progress', 'completed']
  return allowed.includes(normalized) ? normalized : 'upcoming'
}

// Clamp numeric progress to an integer between 0 and 100.
function normalizeProgress(value, defaultValue = 0) {
  const num = Number(value)
  if (!Number.isFinite(num)) return defaultValue
  return Math.max(0, Math.min(100, Math.round(num)))
}

// Normalize project milestones and drop empty titles.
function normalizeProjectMilestones(milestones = []) {
  if (!Array.isArray(milestones)) return []
  return milestones
    .map((m) => ({
      title: String(m?.title || '').trim().slice(0, 120),
      description: String(m?.description || '').trim().slice(0, 500),
      status: normalizeMilestoneStatus(m?.status),
      progress: normalizeProgress(m?.progress, 0),
    }))
    .filter((m) => m.title)
    .slice(0, 20)
}

// Validate and normalize project creation payload.
export function validateCreateProject(req, res, next) {
  const { title, description, status, progress, tags, milestones } = req.body || {}

  if (!title?.trim()) {
    return res.status(400).json({ message: 'title is required' })
  }

  if (String(title).trim().length > 120) {
    return res.status(400).json({ message: 'title cannot exceed 120 characters' })
  }

  if (description && String(description).trim().length > 2000) {
    return res.status(400).json({ message: 'description cannot exceed 2000 characters' })
  }

  req.validatedProject = {
    title: String(title).trim(),
    description: String(description || '').trim(),
    status: normalizeProjectStatus(status),
    progress: normalizeProgress(progress, 0),
    tags: normalizeTags(tags),
    milestones: normalizeProjectMilestones(milestones),
  }

  return next()
}

// Validate and normalize project update payload.
export function validateUpdateProject(req, res, next) {
  const { title, description, status, progress, tags, milestones } = req.body || {}
  const patch = {}

  if (title !== undefined) {
    const trimmed = String(title || '').trim()
    if (!trimmed) return res.status(400).json({ message: 'title cannot be empty' })
    if (trimmed.length > 120) {
      return res.status(400).json({ message: 'title cannot exceed 120 characters' })
    }
    patch.title = trimmed
  }

  if (description !== undefined) {
    const trimmed = String(description || '').trim()
    if (trimmed.length > 2000) {
      return res.status(400).json({ message: 'description cannot exceed 2000 characters' })
    }
    patch.description = trimmed
  }

  if (status !== undefined) patch.status = normalizeProjectStatus(status)
  if (progress !== undefined) patch.progress = normalizeProgress(progress, 0)
  if (tags !== undefined) patch.tags = normalizeTags(tags)
  if (milestones !== undefined) patch.milestones = normalizeProjectMilestones(milestones)

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ message: 'No valid project fields provided' })
  }

  req.validatedProjectUpdate = patch
  return next()
}

// Validate milestone payload for adding a single project milestone.
export function validateAddProjectMilestone(req, res, next) {
  const milestone = req.body || {}
  const title = String(milestone.title || '').trim()
  const description = String(milestone.description || '').trim()

  if (!title) {
    return res.status(400).json({ message: 'Milestone title is required' })
  }

  req.validatedMilestone = {
    title: title.slice(0, 120),
    description: description.slice(0, 500),
    status: normalizeMilestoneStatus(milestone.status),
    progress: normalizeProgress(milestone.progress, 0),
  }

  return next()
}

// Validate discussion comment payload for project discussion.
export function validateProjectComment(req, res, next) {
  const body = String(req.body?.body || '').trim()
  if (!body) {
    return res.status(400).json({ message: 'Comment body is required' })
  }
  if (body.length > 1000) {
    return res.status(400).json({ message: 'Comment body cannot exceed 1000 characters' })
  }

  req.validatedProjectComment = { body }
  return next()
}

// Validate post comment payload for update card commenting.
export function validatePostComment(req, res, next) {
  const body = String(req.body?.body || '').trim()
  if (!body) {
    return res.status(400).json({ message: 'Comment body is required' })
  }
  if (body.length > 1000) {
    return res.status(400).json({ message: 'Comment body cannot exceed 1000 characters' })
  }

  req.validatedPostComment = { body }
  return next()
}

// Validate and normalize post update payload.
export function validateUpdatePost(req, res, next) {
  const { title, body, tags, milestone, attachments } = req.body || {}
  const patch = {}

  if (title !== undefined) {
    const trimmed = String(title || '').trim()
    if (!trimmed) return res.status(400).json({ message: 'title cannot be empty' })
    patch.title = trimmed
  }

  if (body !== undefined) {
    const trimmed = String(body || '').trim()
    if (!trimmed) return res.status(400).json({ message: 'body cannot be empty' })
    patch.body = trimmed
  }

  if (tags !== undefined) patch.tags = normalizeTags(tags)

  if (attachments !== undefined) {
    const normalizedAttachments = normalizeAttachments(attachments)
    const invalidAttachment = normalizedAttachments.find((item) => !isValidHttpUrl(item.url))
    if (invalidAttachment) {
      return res.status(400).json({ message: 'Attachments must be valid http(s) links' })
    }
    patch.attachments = normalizedAttachments
  }

  if (milestone !== undefined) {
    if (milestone === null) {
      patch.milestone = null
    } else {
      const normalized = normalizeMilestone(milestone)
      if (!normalized) {
        return res.status(400).json({ message: 'milestone title is required when milestone is provided' })
      }
      patch.milestone = normalized
    }
  }

  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ message: 'No valid post fields provided' })
  }

  req.validatedPostUpdate = patch
  return next()
}

export function validateRegister(req, res, next) {
  const errors = []
  const { name, handle, email, password } = req.body
 
  if (!name    || name.trim().length < 2)            errors.push('Name must be at least 2 characters')
  if (!handle  || !/^[a-z0-9_]{3,20}$/i.test(handle)) errors.push('Handle must be 3–20 characters (letters, numbers, underscores)')
  if (!email   || !/^\S+@\S+\.\S+$/.test(email))    errors.push('Valid email is required')
  if (!password || password.length < 8)              errors.push('Password must be at least 8 characters')
 
  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors })
  next()
}
 
export function validateLogin(req, res, next) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }
  next()
}
