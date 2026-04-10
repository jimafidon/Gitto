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
