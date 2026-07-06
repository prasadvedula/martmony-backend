import { Router, Response } from 'express'
import { adminMiddleware, AuthRequest } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/admin/stats
router.get('/stats', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  const [total, active, pendingConsent, rejected, male, female] = await Promise.all([
    prisma.profile.count(),
    prisma.profile.count({ where: { status: 'ACTIVE' } }),
    prisma.profile.count({ where: { status: 'PENDING_CONSENT' } }),
    prisma.profile.count({ where: { status: 'REJECTED' } }),
    prisma.profile.count({ where: { gender: 'MALE' } }),
    prisma.profile.count({ where: { gender: 'FEMALE' } }),
  ])
  return res.json({ success: true, data: { total, active, pendingConsent, rejected, male, female } })
})

// GET /api/admin/pending
router.get('/pending', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const page   = Math.max(1, parseInt(req.query.page  as string) || 1)
  const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20))
  const skip   = (page - 1) * limit
  const { gender, source, name, caste, mangalDosha } = req.query as Record<string, string>

  const where: any = { status: 'PENDING_CONSENT' }
  if (gender)  where.gender = gender
  if (source)  where.profileSource = source
  if (caste)   where.caste = { contains: caste, mode: 'insensitive' }
  if (name)    where.name  = { contains: name,  mode: 'insensitive' }
  if (mangalDosha === 'true')  where.mangalDosha = true
  if (mangalDosha === 'false') where.mangalDosha = false

  const [total, profiles] = await Promise.all([
    prisma.profile.count({ where }),
    prisma.profile.findMany({
      where, orderBy: { createdAt: 'desc' }, skip, take: limit,
      select: {
        id: true, name: true, gender: true, dateOfBirth: true,
        caste: true, nakshatra: true, contactEmail: true, contactPhone: true,
        consentToken: true, createdAt: true, uploadedByAdmin: true, profileSource: true,
      },
    }),
  ])

  return res.json({
    success: true, data: profiles,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  })
})

// PATCH /api/admin/pending/activate-all
router.patch('/pending/activate-all', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  const result = await prisma.profile.updateMany({
    where: { status: 'PENDING_CONSENT' },
    data: { status: 'ACTIVE', consentGiven: true, consentGivenAt: new Date() },
  })
  return res.json({ success: true, activated: result.count })
})

// PATCH /api/admin/profiles/:id/activate
router.patch('/profiles/:id/activate', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const profile = await prisma.profile.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE', consentGiven: true, consentGivenAt: new Date() },
    })
    return res.json({ success: true, data: profile })
  } catch {
    return res.status(404).json({ success: false, error: 'Profile not found' })
  }
})

export default router
