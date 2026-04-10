import express from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  followUser,
  getSuggestedUsers,
  getUserProjects,
  unfollowUser,
} from '../controllers/users.controller.js'

const router = express.Router()

router.get('/suggested', requireAuth, getSuggestedUsers)
router.get('/:userId/projects', getUserProjects)
router.post('/:userId/follow', requireAuth, followUser)
router.delete('/:userId/follow', requireAuth, unfollowUser)

export default router
