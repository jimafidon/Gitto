export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` })
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || err.status || 500
  const message = err.message || 'Internal server error'
  if (statusCode >= 500) console.error(err)
  res.status(statusCode).json({ message })
}
