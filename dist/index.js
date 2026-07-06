"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const auth_1 = __importDefault(require("./routes/auth"));
const profiles_1 = __importDefault(require("./routes/profiles"));
const match_1 = __importDefault(require("./routes/match"));
const upload_1 = __importDefault(require("./routes/upload"));
const consent_1 = __importDefault(require("./routes/consent"));
const admin_1 = __importDefault(require("./routes/admin"));
const astro_1 = __importDefault(require("./routes/astro"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// ── Middleware ────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(s => s.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin))
            return callback(null, true);
        callback(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, cookie_parser_1.default)());
// ── Serve uploaded photos ─────────────────────────────────────────
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'public', 'uploads')));
// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/profiles', profiles_1.default);
app.use('/api/match', match_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/consent', consent_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/astro', astro_1.default);
// ── Health check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
// ── Error handler ─────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error(err.message);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
});
app.listen(PORT, () => {
    console.log(`🚀 Matrimony API running on port ${PORT}`);
});
exports.default = app;
