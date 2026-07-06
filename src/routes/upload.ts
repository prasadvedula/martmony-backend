import { Router, Response } from 'express'
import { adminMiddleware, AuthRequest } from '../middleware/auth'
import { parsePdfBuffer } from '../lib/pdf-parser'
import { prisma } from '../lib/prisma'
import { v4 as uuid } from 'uuid'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } })

// POST /api/upload — admin bulk PDF upload
router.post('/', adminMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file || req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ success: false, error: 'Please upload a PDF file' })
  }

  const drafts = await parsePdfBuffer(req.file.buffer)
  if (drafts.length === 0) {
    return res.status(400).json({ success: false, error: 'No profile data found in PDF' })
  }

  const batchId = uuid()
  const results = []

  for (const draft of drafts) {
    if (!draft.name || !draft.gender || !draft.nakshatra || !draft.caste) {
      results.push({ status: 'SKIPPED', warnings: draft.warnings })
      continue
    }
    const consentToken = uuid()
    try {
      const profile = await prisma.profile.create({
        data: {
          name: draft.name, gender: draft.gender,
          dateOfBirth: draft.dateOfBirth ? new Date(draft.dateOfBirth) : new Date('1990-01-01'),
          birthTime: draft.birthTime ?? null, birthPlace: draft.birthPlace ?? 'Unknown',
          currentCity: draft.currentCity ?? null, currentState: draft.currentState ?? null,
          caste: draft.caste, subCaste: draft.subCaste ?? null,
          sakha: draft.sakha ?? null, gotram: draft.gotram ?? null,
          nakshatra: draft.nakshatra, rashi: draft.rashi ?? null,
          mangalDosha: draft.mangalDosha ?? false, surname: draft.surname ?? null,
          heightCm: draft.heightCm ?? null, education: draft.education ?? null,
          occupation: draft.occupation ?? null, annualIncomeLpa: draft.annualIncomeLpa ?? null,
          fatherName: draft.fatherName ?? null, motherName: draft.motherName ?? null,
          familyType: draft.familyType ?? null,
          contactEmail: draft.contactEmail ?? null, contactPhone: draft.contactPhone ?? null,
          prefAgeMin: draft.prefAgeMin ?? null, prefAgeMax: draft.prefAgeMax ?? null,
          prefStates: draft.prefStates ?? [],
          status: 'PENDING_CONSENT', consentGiven: false, consentToken,
          uploadedByAdmin: true, pdfUploadBatch: batchId,
          profileSource: draft.profileSource ?? 'PDF',
        },
      })
      await prisma.consentRequest.create({
        data: { token: consentToken, profileId: profile.id, email: draft.contactEmail ?? null, phone: draft.contactPhone ?? null },
      })
      results.push({ status: 'CREATED', profileId: profile.id, name: draft.name, confidence: draft.parseConfidence, consentLink: `/consent/${consentToken}` })
    } catch (err) {
      results.push({ status: 'ERROR', name: draft.name, error: String(err) })
    }
  }

  const created = results.filter(r => r.status === 'CREATED').length
  const skipped = results.filter(r => r.status === 'SKIPPED').length
  const errored = results.filter(r => r.status === 'ERROR').length

  return res.json({ success: true, batchId, summary: { total: drafts.length, created, skipped, errored }, results })
})

export default router
