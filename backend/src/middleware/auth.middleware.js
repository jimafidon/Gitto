// // backend/src/middleware/auth.middleware.js
import jwt  from 'jsonwebtoken'
import User from '../models/User.js'

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided — please log in' })
    }

    const token   = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const userId  = decoded.id || decoded.sub
    const user    = await User.findById(userId).select('-password')

    if (!user) return res.status(401).json({ message: 'User no longer exists' })

    req.user = user
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired — please log in again' })
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' })
    }
    next(err)
  }
}

// Use on public routes where extra data is shown to logged-in users
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      const token   = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      const userId  = decoded.id || decoded.sub
      const user    = await User.findById(userId).select('-password')
      if (user) req.user = user
    }
  } catch { /* silently ignore */ }
  next()
}
