// backend/src/middleware/rateLimiter.middleware.js
import rateLimit from 'express-rate-limit'

const passthrough = (_req, _res, next) => next()

export const authLimiter = process.env.NODE_ENV === 'test'
  ? passthrough
  : rateLimit({
      windowMs: 15 * 60 * 1000,   // 15 minutes
      max:      5,
      message:  { message: 'Too many attempts — please try again in 15 minutes' },
      standardHeaders: true,
      legacyHeaders:   false,
    })

export const rateLimiter = process.env.NODE_ENV === 'test'
  ? passthrough
  : rateLimit({
      windowMs: 60 * 60 * 1000,   // 1 hour
      max:      15,
      message:  { message: 'Too many requests — please slow down' },
      standardHeaders: true,
      legacyHeaders:   false,
    })