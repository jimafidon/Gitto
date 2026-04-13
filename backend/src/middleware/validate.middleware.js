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
