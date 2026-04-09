// backend/src/routes/auth.routes.js
import express                           from 'express'
import { register, login, getMe }        from '../controllers/auth.controller.js'
import { requireAuth }                   from '../middleware/auth.middleware.js'
import { validateRegister, validateLogin } from '../middleware/validate.middleware.js'
import { authLimiter }                   from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Public routes
router.post('/register', authLimiter, validateRegister, register)
router.post('/login',    authLimiter, validateLogin,    login)

// Protected — requires valid JWT
router.get('/me', requireAuth, getMe)

// OAuth routes — uncomment when ready to implement
// router.get('/google',          passport.authenticate('google', { scope: ['profile', 'email'] }))
// router.get('/google/callback', passport.authenticate('google'), oauthCallback)
// router.get('/github',          passport.authenticate('github', { scope: ['user:email'] }))
// router.get('/github/callback', passport.authenticate('github'), oauthCallback)

export default router