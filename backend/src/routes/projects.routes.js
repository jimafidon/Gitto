import express from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { createProject } from '../controllers/projects.controller.js'
import { validateCreateProject } from '../middleware/validate.middleware.js'

// Dedicated router for project operations.
const router = express.Router()

// Create a project for the authenticated user.
router.post('/', requireAuth, validateCreateProject, createProject)

export default router
