"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.adminMiddleware = adminMiddleware;
exports.optionalAuth = optionalAuth;
const jwt_1 = require("../lib/jwt");
function authMiddleware(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }
    try {
        req.user = (0, jwt_1.verifyToken)(header.split(' ')[1]);
        next();
    }
    catch {
        return res.status(401).json({ success: false, error: 'Invalid token' });
    }
}
function adminMiddleware(req, res, next) {
    authMiddleware(req, res, () => {
        if (req.user?.role !== 'ADMIN') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }
        next();
    });
}
function optionalAuth(req, _res, next) {
    const header = req.headers.authorization;
    if (header?.startsWith('Bearer ')) {
        try {
            req.user = (0, jwt_1.verifyToken)(header.split(' ')[1]);
        }
        catch { /* ignore */ }
    }
    next();
}
