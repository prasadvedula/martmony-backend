"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const kundali_1 = require("../lib/kundali");
const router = (0, express_1.Router)();
// POST /api/match
router.post('/', async (req, res) => {
    const body = req.body;
    let groomNakshatra, brideNakshatra;
    let groomMangal = null, brideMangal = null;
    let groomName, brideName;
    if (body.groomProfileId && body.brideProfileId) {
        const [groom, bride] = await Promise.all([
            prisma_1.prisma.profile.findUnique({ where: { id: body.groomProfileId } }),
            prisma_1.prisma.profile.findUnique({ where: { id: body.brideProfileId } }),
        ]);
        if (!groom || !bride) {
            return res.status(404).json({ success: false, error: 'Profile not found' });
        }
        if (groom.gender !== 'MALE' || bride.gender !== 'FEMALE') {
            return res.status(400).json({ success: false, error: 'groomProfileId must be MALE and brideProfileId must be FEMALE' });
        }
        groomNakshatra = groom.nakshatra;
        brideNakshatra = bride.nakshatra;
        groomMangal = groom.mangalDosha;
        brideMangal = bride.mangalDosha;
        groomName = groom.name;
        brideName = bride.name;
    }
    else if (body.groomNakshatra && body.brideNakshatra) {
        groomNakshatra = body.groomNakshatra;
        brideNakshatra = body.brideNakshatra;
        groomMangal = body.groomMangal ?? null;
        brideMangal = body.brideMangal ?? null;
    }
    else {
        return res.status(400).json({ success: false, error: 'Provide groomProfileId+brideProfileId or groomNakshatra+brideNakshatra' });
    }
    try {
        const result = (0, kundali_1.calculateAshtakoot)(groomNakshatra, brideNakshatra, groomMangal, brideMangal);
        if (body.groomProfileId && body.brideProfileId) {
            await prisma_1.prisma.matchRecord.upsert({
                where: { groomProfileId_brideProfileId: { groomProfileId: body.groomProfileId, brideProfileId: body.brideProfileId } },
                create: {
                    groomProfileId: body.groomProfileId,
                    brideProfileId: body.brideProfileId,
                    totalScore: Math.round(result.totalScore),
                    scoreBreakdown: result.scores,
                    mangalStatus: result.mangalDosha.doshaPresent ? 'DOSHA_PRESENT' : 'NO_DOSHA',
                    recommendation: result.recommendation,
                },
                update: {
                    totalScore: Math.round(result.totalScore),
                    scoreBreakdown: result.scores,
                    recommendation: result.recommendation,
                },
            });
        }
        return res.json({ success: true, data: { ...result, groomName, brideName } });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Match calculation failed';
        return res.status(400).json({ success: false, error: message });
    }
});
// GET /api/match?groomNakshatra=X&brideNakshatra=Y
router.get('/', (req, res) => {
    const { groomNakshatra, brideNakshatra } = req.query;
    if (!groomNakshatra || !brideNakshatra) {
        return res.status(400).json({ success: false, error: 'groomNakshatra and brideNakshatra are required' });
    }
    try {
        const result = (0, kundali_1.calculateAshtakoot)(groomNakshatra, brideNakshatra);
        return res.json({ success: true, data: result });
    }
    catch (err) {
        return res.status(400).json({ success: false, error: String(err) });
    }
});
exports.default = router;
