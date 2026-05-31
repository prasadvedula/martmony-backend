import { Router, Request, Response } from 'express'

const router = Router()

const VEDASTRO = 'https://api.vedastro.org'

// ── Nominatim geocoding ───────────────────────────────────────────
async function geocodePlace(place: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MartmonyApp/1.0 (admin@martmony.com)' },
    signal: AbortSignal.timeout(8000),
  })
  const data = await res.json() as any[]
  if (!data?.length) return null
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
}

// ── VedAstro API call ─────────────────────────────────────────────
// URL format: /api/Calculate/{Calc1}+{Calc2}/Location/{lat}/{lon}/Time/{hh}/{mm}/{dd}/{mo}/{yyyy}/{tz}
async function vedastroCalc(
  calcs: string[],
  lat: number, lon: number,
  hh: number, mm: number,
  dd: number, mo: number, yyyy: number,
  tz = '+05:30'
): Promise<Record<string, any>> {
  const calcStr = calcs.join('+')
  const tzEnc   = encodeURIComponent(tz)
  const url = `${VEDASTRO}/api/Calculate/${calcStr}/Location/${lat}/${lon}/Time/${hh}/${mm}/${dd}/${mo}/${yyyy}/${tzEnc}`

  const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`VedAstro returned ${res.status}`)
  const json = await res.json() as any
  if (json?.Status !== 'Pass') throw new Error(json?.Message ?? 'VedAstro error')
  return json.Payload ?? {}
}

// ── Parse rasi name from VedAstro response ────────────────────────
// VedAstro returns sign as e.g. "Taurus" or nested object with Name key
function parseSign(val: any): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object') return val?.Name ?? val?.ZodiacName ?? ''
  return ''
}

// Convert western zodiac name → Sanskrit rasi name for our UI
const SIGN_TO_RASI: Record<string, string> = {
  Aries: 'Mesha (Aries)', Taurus: 'Vrishabha (Taurus)', Gemini: 'Mithuna (Gemini)',
  Cancer: 'Karka (Cancer)', Leo: 'Simha (Leo)', Virgo: 'Kanya (Virgo)',
  Libra: 'Tula (Libra)', Scorpio: 'Vrishchika (Scorpio)', Sagittarius: 'Dhanu (Sagittarius)',
  Capricorn: 'Makara (Capricorn)', Aquarius: 'Kumbha (Aquarius)', Pisces: 'Meena (Pisces)',
}

function toRasi(sign: string): string {
  return SIGN_TO_RASI[sign] ?? sign
}

// ── POST /api/astro/calculate ─────────────────────────────────────
router.post('/calculate', async (req: Request, res: Response) => {
  const { dateOfBirth, birthTime, birthPlace } = req.body as {
    dateOfBirth?: string; birthTime?: string; birthPlace?: string
  }

  if (!dateOfBirth || !birthPlace) {
    return res.status(400).json({ success: false, error: 'dateOfBirth and birthPlace are required' })
  }

  try {
    // Parse date
    const dob = new Date(dateOfBirth)
    const dd = dob.getUTCDate(), mo = dob.getUTCMonth() + 1, yyyy = dob.getUTCFullYear()

    // Parse time (defaults to 12:00 noon if unknown)
    let hh = 12, mm = 0
    if (birthTime) {
      const [h, m] = birthTime.split(':').map(Number)
      hh = h ?? 12; mm = m ?? 0
    }

    // Geocode birthPlace
    const coords = await geocodePlace(birthPlace)
    if (!coords) {
      return res.status(400).json({ success: false, error: `Cannot locate "${birthPlace}" — try a city name or "City, State"` })
    }

    // Call VedAstro for all needed calculations in one request
    const payload = await vedastroCalc(
      [
        'MoonNakshatra',
        'MoonSign',
        'SunSign',
        'MarsSign',
        'MercurySign',
        'JupiterSign',
        'VenusSign',
        'SaturnSign',
        'RahuSign',
        'KetuSign',
        'LagnaSign',
        'IsManglik',
      ],
      coords.lat, coords.lon,
      hh, mm, dd, mo, yyyy
    )

    // Extract nakshatra
    const nakshatra: string = (() => {
      const v = payload.MoonNakshatra
      if (!v) return ''
      if (typeof v === 'string') return v
      return v?.Name ?? v?.NakshatraName ?? ''
    })()

    // Extract rasi (moon sign)
    const moonSignRaw = parseSign(payload.MoonSign)
    const rasi = toRasi(moonSignRaw)

    // Mangal dosha
    const mangalDosha: boolean = (() => {
      const v = payload.IsManglik
      if (typeof v === 'boolean') return v
      if (typeof v === 'string') return v.toLowerCase() === 'true' || v === 'Yes'
      if (typeof v === 'object') return v?.IsManglik === true || v?.Value === true
      return false
    })()

    // All planetary positions (sign number 1-12)
    const planetSign = (key: string): string => toRasi(parseSign(payload[key]))

    return res.json({
      success: true,
      data: {
        nakshatra,
        rasi,
        mangalDosha,
        coordinates: coords,
        planets: {
          sun:     planetSign('SunSign'),
          moon:    planetSign('MoonSign'),
          mars:    planetSign('MarsSign'),
          mercury: planetSign('MercurySign'),
          jupiter: planetSign('JupiterSign'),
          venus:   planetSign('VenusSign'),
          saturn:  planetSign('SaturnSign'),
          rahu:    planetSign('RahuSign'),
          ketu:    planetSign('KetuSign'),
          lagna:   planetSign('LagnaSign'),
        },
      },
    })
  } catch (err: any) {
    console.error('Astro calculate error:', err?.message)
    return res.status(500).json({ success: false, error: err?.message ?? 'Astrology calculation failed' })
  }
})

export default router
