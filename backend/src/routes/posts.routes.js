import express from 'express'
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js'
import { createPost, getFeed, likePost, unlikePost } from '../controllers/posts.controller.js'
import { validateCreatePost } from '../middleware/validate.middleware.js'

const router = express.Router()

router.get('/', optionalAuth, getFeed)
router.post('/', requireAuth, validateCreatePost, createPost)
router.post('/:id/like', requireAuth, likePost)
router.delete('/:id/like', requireAuth, unlikePost)

export default router
