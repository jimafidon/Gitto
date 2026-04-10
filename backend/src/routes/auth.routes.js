import express from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import { getMe } from '../controllers/auth.controller.js'

// Intentionally minimal in this branch: auth is handled in dedicated auth work.
// Kept as a valid router so backend can boot for feed work.
const router = express.Router()

router.get('/me', requireAuth, getMe)

export default router
