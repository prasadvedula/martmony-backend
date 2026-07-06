"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
// GET /api/consent/:token
router.get('/:token', async (req, res) => {
    const request = await prisma_1.prisma.consentRequest.findUnique({ where: { token: req.params.token } });
    if (!request)
        return res.status(404).json({ success: false, error: 'Invalid consent link' });
    const profile = await prisma_1.prisma.profile.findUnique({
        where: { id: request.profileId },
        select: { id: true, name: true, gender: true, status: true, consentGiven: true },
    });
    return res.json({ success: true, data: { request, profile } });
});
// POST /api/consent/:token
router.post('/:token', async (req, res) => {
    const action = req.body.action;
    if (action !== 'ACCEPT' && action !== 'REJECT') {
        return res.status(400).json({ success: false, error: 'action must be ACCEPT or REJECT' });
    }
    const request = await prisma_1.prisma.consentRequest.findUnique({ where: { token: req.params.token } });
    if (!request)
        return res.status(404).json({ success: false, error: 'Invalid consent link' });
    if (request.status !== 'PENDING') {
        return res.status(409).json({ success: false, error: 'Consent already responded to' });
    }
    await prisma_1.prisma.consentRequest.update({
        where: { token: req.params.token },
        data: { status: action, respondedAt: new Date() },
    });
    if (action === 'ACCEPT') {
        await prisma_1.prisma.profile.update({
            where: { id: request.profileId },
            data: { consentGiven: true, consentGivenAt: new Date(), status: 'ACTIVE' },
        });
    }
    else {
        await prisma_1.prisma.profile.update({
            where: { id: request.profileId },
            data: { status: 'REJECTED' },
        });
    }
    return res.json({
        success: true,
        message: action === 'ACCEPT'
            ? 'Consent accepted. Your profile is now visible.'
            : 'Consent rejected. Your profile has been removed.',
    });
});
exports.default = router;
