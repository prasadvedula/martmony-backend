"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const pdf_parser_1 = require("../lib/pdf-parser");
const pdf_image_extractor_1 = require("../lib/pdf-image-extractor");
const prisma_1 = require("../lib/prisma");
const uuid_1 = require("uuid");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 60 * 1024 * 1024 } });
// POST /api/upload — admin bulk PDF upload
router.post('/', auth_1.adminMiddleware, upload.single('file'), async (req, res) => {
    if (!req.file || req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ success: false, error: 'Please upload a PDF file' });
    }
    const drafts = await (0, pdf_parser_1.parsePdfBuffer)(req.file.buffer);
    if (drafts.length === 0) {
        return res.status(400).json({ success: false, error: 'No profile data found in PDF' });
    }
    // Extract photos from PDF pages (best-effort — continues without photos if this fails)
    const uploadsDir = path_1.default.join(process.cwd(), 'public', 'uploads');
    let pageImages = [];
    try {
        pageImages = await (0, pdf_image_extractor_1.extractImagesFromPdf)(req.file.buffer, uploadsDir);
        console.log(`[upload] extracted ${pageImages.filter(Boolean).length}/${pageImages.length} images`);
    }
    catch (err) {
        console.error('[upload] image extraction failed:', err.message);
    }
    const batchId = (0, uuid_1.v4)();
    const results = [];
    for (let i = 0; i < drafts.length; i++) {
        const draft = drafts[i];
        if (!draft.name || !draft.gender || !draft.nakshatra || !draft.caste) {
            results.push({ status: 'SKIPPED', warnings: draft.warnings });
            continue;
        }
        // Match extracted photo by profile index (1 profile per page in Daily Edition)
        const photoUrl = pageImages[i]?.urlPath ?? null;
        const consentToken = (0, uuid_1.v4)();
        try {
            const profile = await prisma_1.prisma.profile.create({
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
            });
            await prisma_1.prisma.consentRequest.create({
                data: { token: consentToken, profileId: profile.id, email: draft.contactEmail ?? null, phone: draft.contactPhone ?? null },
            });
            results.push({
                status: 'CREATED', profileId: profile.id, name: draft.name,
                confidence: draft.parseConfidence, hasPhoto: !!photoUrl,
                consentLink: `/consent/${consentToken}`,
            });
        }
        catch (err) {
            results.push({ status: 'ERROR', name: draft.name, error: String(err) });
        }
    }
    const created = results.filter(r => r.status === 'CREATED').length;
    const skipped = results.filter(r => r.status === 'SKIPPED').length;
    const errored = results.filter(r => r.status === 'ERROR').length;
    const withPhotos = results.filter((r) => r.hasPhoto).length;
    return res.json({
        success: true, batchId,
        summary: { total: drafts.length, created, skipped, errored, withPhotos },
        results,
    });
});
exports.default = router;
