// backend/src/middleware/rateLimiter.middleware.js
import rateLimit from 'express-rate-limit'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max:      5,
  message:  { message: 'Too many attempts — please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders:   false,
})

export const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max:      15,
  message:  { message: 'Too many requests — please slow down' },
  standardHeaders: true,
  legacyHeaders:   false,
})