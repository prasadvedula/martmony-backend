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
router.get('/pending', adminMiddleware, async (_req: AuthRequest, res: Response) => {
  const profiles = await prisma.profile.findMany({
    where: { status: 'PENDING_CONSENT' },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true, name: true, gender: true, dateOfBirth: true,
      caste: true, nakshatra: true, contactEmail: true, contactPhone: true,
      consentToken: true, createdAt: true, uploadedByAdmin: true,
    },
  })
  return res.json({ success: true, data: profiles })
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
