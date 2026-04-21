import express from 'express'
import { requireAuth } from '../middleware/auth.middleware.js'
import {
  followUser,
  getUserByHandle,
  getSuggestedUsers,
  getUserProjects,
  searchUsers,
  unfollowUser,
} from '../controllers/users.controller.js'

const router = express.Router()

router.get('/search', searchUsers)
router.get('/suggested', requireAuth, getSuggestedUsers)
router.get('/:userId/projects', getUserProjects)
router.post('/:userId/follow', requireAuth, followUser)
router.delete('/:userId/follow', requireAuth, unfollowUser)
router.get('/:handle', getUserByHandle)

export default router
