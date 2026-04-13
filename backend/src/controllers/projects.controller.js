import Project from '../models/Project.js'

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
    project: {
      _id: project._id,
      title: project.title,
      status: project.status,
      progress: project.progress ?? 0,
      tags: project.tags || [],
      milestones: (project.milestones || []).map((m) => ({
        title: m.title || '',
        progress: m.progress ?? 0,
        status: m.status || 'upcoming',
      })),
    },
  })
}
