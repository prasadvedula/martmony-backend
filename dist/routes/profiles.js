"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const promises_1 = require("fs/promises");
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        cb(null, file.mimetype.startsWith('image/'));
    },
});
// GET /api/profiles
router.get('/', auth_1.optionalAuth, async (req, res) => {
    const { gender, ageMin, ageMax, caste, subCaste, mangalDosha, education, occupation, heightMin, heightMax, page = '1', limit = '20', } = req.query;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;
    const isAdmin = req.user?.role === 'ADMIN';
    const where = isAdmin ? {} : { status: 'ACTIVE' };
    if (gender)
        where.gender = gender;
    if (caste)
        where.caste = { contains: caste, mode: 'insensitive' };
    if (subCaste)
        where.subCaste = { contains: subCaste, mode: 'insensitive' };
    if (education)
        where.education = { contains: education, mode: 'insensitive' };
    if (occupation)
        where.occupation = { contains: occupation, mode: 'insensitive' };
    if (mangalDosha === 'true')
        where.mangalDosha = true;
    if (mangalDosha === 'false')
        where.mangalDosha = false;
    if (ageMin || ageMax) {
        const now = new Date();
        where.dateOfBirth = {};
        if (ageMax) {
            const d = new Date(now);
            d.setFullYear(now.getFullYear() - parseInt(ageMax));
            where.dateOfBirth.gte = d;
        }
        if (ageMin) {
            const d = new Date(now);
            d.setFullYear(now.getFullYear() - parseInt(ageMin));
            where.dateOfBirth.lte = d;
        }
    }
    if (heightMin || heightMax) {
        where.heightCm = {};
        if (heightMin)
            where.heightCm.gte = parseInt(heightMin);
        if (heightMax)
            where.heightCm.lte = parseInt(heightMax);
    }
    const [profiles, total] = await Promise.all([
        prisma_1.prisma.profile.findMany({
            where, skip, take: limitNum,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true, name: true, gender: true, dateOfBirth: true,
                caste: true, subCaste: true, nakshatra: true, rashi: true,
                currentCity: true, currentState: true, photoUrl: true,
                education: true, occupation: true, heightCm: true,
                mangalDosha: true, gotram: true, birthPlace: true,
                profileSource: true, uploadedByAdmin: true, status: true,
            },
        }),
        prisma_1.prisma.profile.count({ where }),
    ]);
    return res.json({
        success: true,
        data: profiles,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
});
// GET /api/profiles/:id
router.get('/:id', auth_1.optionalAuth, async (req, res) => {
    const profile = await prisma_1.prisma.profile.findUnique({ where: { id: req.params.id } });
    const isAdmin = req.user?.role === 'ADMIN';
    if (!profile || (!isAdmin && profile.status !== 'ACTIVE')) {
        return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    return res.json({ success: true, data: profile });
});
// POST /api/profiles — create profile
router.post('/', auth_1.authMiddleware, upload.single('photo'), async (req, res) => {
    try {
        const body = req.body;
        let photoUrl;
        // Save photo if provided
        if (req.file) {
            const uploadsDir = path_1.default.join(process.cwd(), 'public', 'uploads');
            await (0, promises_1.mkdir)(uploadsDir, { recursive: true });
            const filename = `${Date.now()}-${req.file.originalname.replace(/[^a-z0-9.]/gi, '_')}`;
            await (0, promises_1.writeFile)(path_1.default.join(uploadsDir, filename), req.file.buffer);
            photoUrl = `/uploads/${filename}`;
        }
        const profile = await prisma_1.prisma.profile.create({
            data: {
                userId: req.user.id,
                name: body.name,
                gender: body.gender,
                dateOfBirth: new Date(body.dateOfBirth),
                birthTime: body.birthTime || null,
                birthPlace: body.birthPlace,
                currentCity: body.currentCity || null,
                currentState: body.currentState || null,
                caste: body.caste,
                subCaste: body.subCaste || null,
                sakha: body.sakha || null,
                gotram: body.gotram || null,
                nakshatra: body.nakshatra,
                rashi: body.rashi || null,
                mangalDosha: body.mangalDosha === 'true' || body.mangalDosha === true,
                kuladeviTemple: body.kuladeviTemple || null,
                surname: body.surname || null,
                heightCm: body.heightCm ? parseInt(body.heightCm) : null,
                complexion: body.complexion || null,
                bodyType: body.bodyType || null,
                education: body.education || null,
                educationDetail: body.educationDetail || null,
                occupation: body.occupation || null,
                occupationDetail: body.occupationDetail || null,
                annualIncomeLpa: body.annualIncomeLpa ? parseFloat(body.annualIncomeLpa) : null,
                fatherName: body.fatherName || null,
                fatherOccupation: body.fatherOccupation || null,
                motherName: body.motherName || null,
                motherOccupation: body.motherOccupation || null,
                siblings: body.siblings || null,
                familyType: body.familyType || null,
                familyValues: body.familyValues || null,
                contactEmail: body.contactEmail || null,
                contactPhone: body.contactPhone || null,
                photoUrl,
                prefAgeMin: body.prefAgeMin ? parseInt(body.prefAgeMin) : null,
                prefAgeMax: body.prefAgeMax ? parseInt(body.prefAgeMax) : null,
                prefCastes: body.prefCastes ? JSON.parse(body.prefCastes) : [],
                prefStates: body.prefStates ? JSON.parse(body.prefStates) : [],
                status: 'ACTIVE',
                consentGiven: true,
                consentGivenAt: new Date(),
            },
        });
        return res.status(201).json({ success: true, data: profile });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'Failed to create profile' });
    }
});
exports.default = router;
