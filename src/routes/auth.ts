import { Router, Request, Response } from 'express'
import { hash, compare } from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { signToken } from '../lib/jwt'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { name, email, password, adminSecret } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ success: false, error: 'Email already registered' })
  }

  const passwordHash = await hash(password, 12)
  const role = adminSecret === process.env.ADMIN_SECRET ? 'ADMIN' : 'USER'

  const user = await prisma.user.create({ data: { name, email, passwordHash, role } })
  const token = signToken({ id: user.id, email: user.email!, role: user.role, name: user.name ?? '' })

  return res.status(201).json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  })
})

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password required' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user?.passwordHash || !(await compare(password, user.passwordHash))) {
    return res.status(401).json({ success: false, error: 'Invalid email or password' })
  }

  const token = signToken({ id: user.id, email: user.email!, role: user.role, name: user.name ?? '' })

  return res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  })
})

// GET /api/auth/me
router.get('/me', authMiddleware, (req: AuthRequest, res: Response) => {
  return res.json({ success: true, user: req.user })
})

export default router
