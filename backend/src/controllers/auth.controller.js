// // backend/src/controllers/auth.controller.js
import jwt  from 'jsonwebtoken'
import User from '../models/User.js'

// Helper: generate a signed JWT for a user
function generateToken(userId) {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
export async function register(req, res, next) {
  try {
    const { name, handle, email, password } = req.body

    // Check for existing email or handle before attempting to create
    const existing = await User.findOne({ $or: [{ email }, { handle }] })
    if (existing) {
      const field = existing.email === email ? 'email' : 'handle'
      return res.status(400).json({ message: `That ${field} is already taken` })
    }

    // Password is hashed automatically by the pre-save hook in User.js
    const user  = await User.create({ name, handle, email, password })
    const token = generateToken(user._id)

    res.status(201).json({
      token,
      user: {
        id:     user._id,
        name:   user.name,
        handle: user.handle,
        email:  user.email,
        avatar: user.avatar,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────────────────
export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    // .select('+password') overrides the select: false on the password field
    const user = await User.findOne({ email }).select('+password')

    // Use a vague error message — don't reveal whether the email exists
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const token = generateToken(user._id)

    res.status(200).json({
      token,
      user: {
        id:     user._id,
        name:   user.name,
        handle: user.handle,
        email:  user.email,
        avatar: user.avatar,
      },
    })
  } catch (err) {
    next(err)
  }
}

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
// Returns the currently logged-in user's profile.
// Protected by requireAuth middleware — req.user is already populated.
export async function getMe(req, res) {
  res.status(200).json({ user: req.user })
}