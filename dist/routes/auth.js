"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = require("bcryptjs");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../lib/jwt");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { name, email, password, adminSecret } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    const existing = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        return res.status(409).json({ success: false, error: 'Email already registered' });
    }
    const passwordHash = await (0, bcryptjs_1.hash)(password, 12);
    const role = adminSecret === process.env.ADMIN_SECRET ? 'ADMIN' : 'USER';
    const user = await prisma_1.prisma.user.create({ data: { name, email, passwordHash, role } });
    const token = (0, jwt_1.signToken)({ id: user.id, email: user.email, role: user.role, name: user.name ?? '' });
    return res.status(201).json({
        success: true,
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
});
// POST /api/auth/login
// Accepts email or phone (6-digit ID for KNBS batch users) in the `email` field
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'Email and password required' });
    }
    let user = await prisma_1.prisma.user.findUnique({ where: { email } });
    if (!user) {
        user = await prisma_1.prisma.user.findUnique({ where: { phone: email } });
    }
    if (!user?.passwordHash || !(await (0, bcryptjs_1.compare)(password, user.passwordHash))) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }
    const token = (0, jwt_1.signToken)({ id: user.id, email: user.email ?? user.phone, role: user.role, name: user.name ?? '' });
    return res.json({
        success: true,
        token,
        user: { id: user.id, email: user.email, phone: user.phone, name: user.name, role: user.role },
    });
});
// GET /api/auth/me
router.get('/me', auth_1.authMiddleware, (req, res) => {
    return res.json({ success: true, user: req.user });
});
exports.default = router;
