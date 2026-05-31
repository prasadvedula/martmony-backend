import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../lib/jwt'

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; name: string }
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' })
  }
  try {
    req.user = verifyToken(header.split(' ')[1])
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid token' })
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, () => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ success: false, error: 'Admin access required' })
    }
    next()
  })
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try { req.user = verifyToken(header.split(' ')[1]) } catch { /* ignore */ }
  }
  next()
}
