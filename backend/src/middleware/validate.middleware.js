export function validateRegister(req, res, next) {
  const errors = []
  const { name, handle, email, password } = req.body
 
  if (!name    || name.trim().length < 2)            errors.push('Name must be at least 2 characters')
  if (!handle  || !/^[a-z0-9_]{3,20}$/i.test(handle)) errors.push('Handle must be 3–20 characters (letters, numbers, underscores)')
  if (!email   || !/^\S+@\S+\.\S+$/.test(email))    errors.push('Valid email is required')
  if (!password || password.length < 8)              errors.push('Password must be at least 8 characters')
 
  if (errors.length) return res.status(400).json({ message: 'Validation failed', errors })
  next()
}
 
export function validateLogin(req, res, next) {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' })
  }
  next()
}