
import express  from 'express'
import cors     from 'cors'
import dotenv   from 'dotenv'
import { connectDB } from './lib/db.js'

import authRouter    from './routes/auth.routes.js'
import postsRouter   from './routes/posts.routes.js'
import usersRouter   from './routes/users.routes.js'
import projectRouter from './routes/projects.routes.js'

import { notFound, errorHandler } from './middleware/error.middleware.js'

dotenv.config()

export const app = express()
const PORT = process.env.PORT || 3001

const configuredOrigins = String(process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const allowedOrigins = new Set([
  'http://localhost:3000',
  ...configuredOrigins,
])

app.use(cors({
  origin(origin, callback) {
    // Allow non-browser requests (curl/Postman) and localhost dev ports.
    if (!origin) return callback(null, true)
    if (allowedOrigins.has(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true)
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`))
  },
}))
app.use(express.json())

app.use('/api/auth',     authRouter)
app.use('/api/posts',    postsRouter)
app.use('/api/users',    usersRouter)
app.use('/api/projects', projectRouter)

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

app.use(notFound)
app.use(errorHandler)

export function startServer() {
  return connectDB().then(() =>
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
  )
}

const isTestEnv =
  process.env.NODE_ENV === 'test' ||
  process.env.VITEST === 'true' ||
  process.env.VITEST === '1'

if (!isTestEnv) {
  startServer()
}