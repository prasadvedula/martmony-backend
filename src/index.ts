import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'

import authRoutes    from './routes/auth'
import profileRoutes from './routes/profiles'
import matchRoutes   from './routes/match'
import uploadRoutes  from './routes/upload'
import consentRoutes from './routes/consent'
import adminRoutes   from './routes/admin'
import astroRoutes   from './routes/astro'

const app  = express()
const PORT = process.env.PORT || 4000

// ── Middleware ────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(s => s.trim())

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// ── Serve uploaded photos ─────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')))

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/profiles', profileRoutes)
app.use('/api/match',    matchRoutes)
app.use('/api/upload',   uploadRoutes)
app.use('/api/consent',  consentRoutes)
app.use('/api/admin',    adminRoutes)
app.use('/api/astro',    astroRoutes)

// ── Health check ──────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

// ── Error handler ─────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.message)
  res.status(500).json({ success: false, error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`🚀 Matrimony API running on port ${PORT}`)
})

export default app
