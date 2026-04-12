
import express  from 'express'
import cors     from 'cors'
import dotenv   from 'dotenv'
import { connectDB } from './lib/db.js'

import router    from './routes/auth.routes.js'
//import postsRouter   from './routes/posts.routes.js'
//import usersRouter   from './routes/users.routes.js'
//import projectRouter from './routes/projects.routes.js'

import { notFound, errorHandler } from './middleware/error.middleware.js'

dotenv.config()

const app  = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }))
app.use(express.json())

app.use('/api/auth',     router)
// app.use('/api/posts',    postsRouter)
// app.use('/api/users',    usersRouter)
// app.use('/api/projects', projectRouter)

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

app.use(notFound)
app.use(errorHandler)

export { app }

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`))
  })
}