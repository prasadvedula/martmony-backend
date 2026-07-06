"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// GET /api/admin/stats
router.get('/stats', auth_1.adminMiddleware, async (_req, res) => {
    const [total, active, pendingConsent, rejected, male, female] = await Promise.all([
        prisma_1.prisma.profile.count(),
        prisma_1.prisma.profile.count({ where: { status: 'ACTIVE' } }),
        prisma_1.prisma.profile.count({ where: { status: 'PENDING_CONSENT' } }),
        prisma_1.prisma.profile.count({ where: { status: 'REJECTED' } }),
        prisma_1.prisma.profile.count({ where: { gender: 'MALE' } }),
        prisma_1.prisma.profile.count({ where: { gender: 'FEMALE' } }),
    ]);
    return res.json({ success: true, data: { total, active, pendingConsent, rejected, male, female } });
});
// GET /api/admin/pending?page=1&limit=20
router.get('/pending', auth_1.adminMiddleware, async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const where = { status: 'PENDING_CONSENT' };
    const [total, profiles] = await Promise.all([
        prisma_1.prisma.profile.count({ where }),
        prisma_1.prisma.profile.findMany({
            where, orderBy: { createdAt: 'desc' }, skip, take: limit,
            select: {
                id: true, name: true, gender: true, dateOfBirth: true,
                caste: true, nakshatra: true, contactEmail: true, contactPhone: true,
                consentToken: true, createdAt: true, uploadedByAdmin: true, profileSource: true,
            },
        }),
    ]);
    return res.json({
        success: true, data: profiles,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
});
// PATCH /api/admin/pending/activate-all
router.patch('/pending/activate-all', auth_1.adminMiddleware, async (_req, res) => {
    const result = await prisma_1.prisma.profile.updateMany({
        where: { status: 'PENDING_CONSENT' },
        data: { status: 'ACTIVE', consentGiven: true, consentGivenAt: new Date() },
    });
    return res.json({ success: true, activated: result.count });
});
// PATCH /api/admin/profiles/:id/activate
router.patch('/profiles/:id/activate', auth_1.adminMiddleware, async (req, res) => {
    try {
        const profile = await prisma_1.prisma.profile.update({
            where: { id: req.params.id },
            data: { status: 'ACTIVE', consentGiven: true, consentGivenAt: new Date() },
        });
        return res.json({ success: true, data: profile });
    }
    catch {
        return res.status(404).json({ success: false, error: 'Profile not found' });
    }
});
exports.default = router;
