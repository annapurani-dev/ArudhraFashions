import jwt from 'jsonwebtoken'

export const generateToken = (id) => {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret || jwtSecret.trim() === '') {
    const error = new Error(
      'JWT_SECRET is not configured. Set JWT_SECRET in your environment variables before starting the server.'
    )
    error.name = 'ConfigurationError'
    throw error
  }

  return jwt.sign({ id }, jwtSecret, {
    expiresIn: '30d'
  })
}

