import { Router, Response } from 'express'
import { adminMiddleware, AuthRequest } from '../middleware/auth'
import { parsePdfBuffer } from '../lib/pdf-parser'
import { extractImagesFromPdf } from '../lib/pdf-image-extractor'
import { prisma } from '../lib/prisma'
import { v4 as uuid } from 'uuid'
import multer from 'multer'
import path from 'path'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 60 * 1024 * 1024 } })

// POST /api/upload — admin bulk PDF upload
router.post('/', adminMiddleware, upload.single('file'), async (req: AuthRequest, res: Response) => {
  if (!req.file || req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ success: false, error: 'Please upload a PDF file' })
  }

  const drafts = await parsePdfBuffer(req.file.buffer)
  if (drafts.length === 0) {
    return res.status(400).json({ success: false, error: 'No profile data found in PDF' })
  }

  // Extract photos from PDF pages (best-effort — continues without photos if this fails)
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  let pageImages: (import('../lib/pdf-image-extractor').ExtractedPageImage | null)[] = []
  try {
    pageImages = await extractImagesFromPdf(req.file.buffer, uploadsDir)
    console.log(`[upload] extracted ${pageImages.filter(Boolean).length}/${pageImages.length} images`)
  } catch (err) {
    console.error('[upload] image extraction failed:', (err as Error).message)
  }

  const batchId = uuid()
  const results = []

  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i]
    if (!draft.name || !draft.gender || !draft.nakshatra || !draft.caste) {
      results.push({ status: 'SKIPPED', warnings: draft.warnings })
      continue
    }

    // Match extracted photo by profile index (1 profile per page in Daily Edition)
    const photoUrl = pageImages[i]?.urlPath ?? null

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
          photoUrl,
          status: 'PENDING_CONSENT', consentGiven: false, consentToken,
          uploadedByAdmin: true, pdfUploadBatch: batchId,
          profileSource: draft.profileSource ?? 'PDF',
        },
      })
      await prisma.consentRequest.create({
        data: { token: consentToken, profileId: profile.id, email: draft.contactEmail ?? null, phone: draft.contactPhone ?? null },
      })
      results.push({
        status: 'CREATED', profileId: profile.id, name: draft.name,
        confidence: draft.parseConfidence, hasPhoto: !!photoUrl,
        consentLink: `/consent/${consentToken}`,
      })
    } catch (err) {
      results.push({ status: 'ERROR', name: draft.name, error: String(err) })
    }
  }

  const created = results.filter(r => r.status === 'CREATED').length
  const skipped = results.filter(r => r.status === 'SKIPPED').length
  const errored = results.filter(r => r.status === 'ERROR').length
  const withPhotos = results.filter((r: any) => r.hasPhoto).length

  return res.json({
    success: true, batchId,
    summary: { total: drafts.length, created, skipped, errored, withPhotos },
    results,
  })
})

export default router
