// backend/src/routes/auth.routes.js
import express                           from 'express'
import passport                          from '../lib/passport.js'
import { register, login, getMe, googleSignIn, oauthCallback } from '../controllers/auth.controller.js'
import { requireAuth }                   from '../middleware/auth.middleware.js'
import { validateRegister, validateLogin } from '../middleware/validate.middleware.js'
import { authLimiter }                   from '../middleware/rateLimiter.middleware.js'

const router = express.Router()

// Public routes
router.post('/register', authLimiter, validateRegister, register)
router.post('/login',    authLimiter, validateLogin,    login)

// Protected — requires valid JWT
router.get('/me', requireAuth, getMe)

// Called by NextAuth after it completes the Google OAuth exchange
router.post('/google', googleSignIn)

// OAuth routes — uncomment when ready to implement
router.get('/google',          passport.authenticate('google', { scope: ['profile', 'email'], session: false }))
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login?error=oauth_failed' }), oauthCallback)
router.get('/github',          passport.authenticate('github', { scope: ['user:email'] }))
router.get('/github/callback', passport.authenticate('github'), oauthCallback)

export default router