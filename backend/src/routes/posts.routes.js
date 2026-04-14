import express from 'express'
import { optionalAuth, requireAuth } from '../middleware/auth.middleware.js'
import {
  addPostComment,
  createPost,
  deletePostComment,
  getFeed,
  getPostById,
  getSavedPosts,
  likePost,
  removePost,
  savePost,
  unsavePost,
  unlikePost,
  updatePost,
} from '../controllers/posts.controller.js'
import { validateCreatePost, validatePostComment, validateUpdatePost } from '../middleware/validate.middleware.js'

const router = express.Router()

router.get('/', optionalAuth, getFeed)
router.get('/saved', requireAuth, getSavedPosts)
router.post('/', requireAuth, validateCreatePost, createPost)
router.get('/:id', optionalAuth, getPostById)
router.patch('/:id', requireAuth, validateUpdatePost, updatePost)
router.delete('/:id', requireAuth, removePost)
router.post('/:id/like', requireAuth, likePost)
router.delete('/:id/like', requireAuth, unlikePost)
router.post('/:id/save', requireAuth, savePost)
router.delete('/:id/save', requireAuth, unsavePost)
router.post('/:id/comments', requireAuth, validatePostComment, addPostComment)
router.delete('/:id/comments/:commentId', requireAuth, deletePostComment)

export default router
