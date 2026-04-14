import express from 'express'
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js'
import {
  addProjectComment,
  addProjectMilestone,
  createProject,
  followProject,
  getProjectById,
  getProjectComments,
  getProjectUpdates,
  removeProject,
  searchProjects,
  starProject,
  unfollowProject,
  updateProject,
  unstarProject,
} from '../controllers/projects.controller.js'
import {
  validateAddProjectMilestone,
  validateCreateProject,
  validateProjectComment,
  validateUpdateProject,
} from '../middleware/validate.middleware.js'

// Dedicated router for project operations.
const router = express.Router()

// Create a project for the authenticated user.
router.post('/', requireAuth, validateCreateProject, createProject)
router.get('/search', optionalAuth, searchProjects)
router.get('/:id', optionalAuth, getProjectById)
router.patch('/:id', requireAuth, validateUpdateProject, updateProject)
router.delete('/:id', requireAuth, removeProject)
router.post('/:id/star', requireAuth, starProject)
router.delete('/:id/star', requireAuth, unstarProject)
router.post('/:id/follow', requireAuth, followProject)
router.delete('/:id/follow', requireAuth, unfollowProject)
router.post('/:id/milestones', requireAuth, validateAddProjectMilestone, addProjectMilestone)
router.get('/:id/updates', optionalAuth, getProjectUpdates)
router.get('/:id/comments', optionalAuth, getProjectComments)
router.post('/:id/comments', requireAuth, validateProjectComment, addProjectComment)

export default router
