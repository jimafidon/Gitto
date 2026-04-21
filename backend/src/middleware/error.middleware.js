export function notFound(req, res) {
  res.status(404).json({ message: `Route ${req.method} ${req.path} not found` })
}

export function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ${err.stack}`)

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message)
    return res.status(400).json({ message: 'Validation error', errors })
  }
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(404).json({ message: 'Resource not found — invalid ID' })
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0]
    return res.status(400).json({ message: `${field} is already taken` })
  }

  const statusCode = err.statusCode || 500
  const message    = process.env.NODE_ENV === 'production'
    ? 'Something went wrong on our end'
    : err.message

  res.status(statusCode).json({ message })
}
