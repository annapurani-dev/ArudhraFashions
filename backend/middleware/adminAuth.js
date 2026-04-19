import jwt from 'jsonwebtoken'
import Admin from '../models/Admin.js'

export const adminProtect = async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Verify admin exists and is active
      const admin = await Admin.findByPk(decoded.id)
      
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: 'Admin not found or inactive' })
      }

      const adminData = admin.toJSON()
      req.admin = {
        id: adminData.id,
        email: adminData.email,
        name: adminData.name,
        role: adminData.role
      }
      
      next()
    } catch (error) {
      console.error(error)
      return res.status(401).json({ message: 'Not authorized, token failed' })
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' })
  }
}
