import jwt from 'jsonwebtoken'
import User from '../models/User.js'

function getToken(header = '') {
  if (!header.startsWith('Bearer ')) return ''
  return header.slice(7)
}

function verify(token) {
  const secret = process.env.JWT_SECRET || 'dev-secret-change-me'
  return jwt.verify(token, secret)
}

export async function requireAuth(req, res, next) {
  try {
    const token = getToken(req.headers.authorization || '')
    if (!token) return res.status(401).json({ message: 'Authentication required' })
    const payload = verify(token)
    const user = await User.findById(payload.sub)
    if (!user) return res.status(401).json({ message: 'Invalid session' })
    req.user = user
    return next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const token = getToken(req.headers.authorization || '')
    if (!token) return next()
    const payload = verify(token)
    const user = await User.findById(payload.sub)
    if (user) req.user = user
    return next()
  } catch {
    return next()
  }
}
