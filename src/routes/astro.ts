import { Router, Request, Response } from 'express'

const router = Router()
const VEDASTRO = 'https://api.vedastro.org'

// ── Sign name mappings ────────────────────────────────────────────
const ENG_TO_RASI: Record<string, string> = {
  Aries: 'Mesha (Aries)', Taurus: 'Vrishabha (Taurus)', Gemini: 'Mithuna (Gemini)',
  Cancer: 'Karka (Cancer)', Leo: 'Simha (Leo)', Virgo: 'Kanya (Virgo)',
  Libra: 'Tula (Libra)', Scorpio: 'Vrishchika (Scorpio)', Sagittarius: 'Dhanu (Sagittarius)',
  Capricorn: 'Makara (Capricorn)', Aquarius: 'Kumbha (Aquarius)', Pisces: 'Meena (Pisces)',
}

const ENG_TO_NUM: Record<string, number> = {
  Aries: 1, Taurus: 2, Gemini: 3, Cancer: 4, Leo: 5, Virgo: 6,
  Libra: 7, Scorpio: 8, Sagittarius: 9, Capricorn: 10, Aquarius: 11, Pisces: 12,
}

// ── Nakshatra → Rasi (Sanskrit-English form) ──────────────────────
const NAK_TO_RASI: Record<string, string> = {
  Ashwini: 'Mesha (Aries)',          Bharani: 'Mesha (Aries)',         Krittika: 'Mesha (Aries)',
  Rohini: 'Vrishabha (Taurus)',      Mrigashira: 'Vrishabha (Taurus)', Mrigasira: 'Vrishabha (Taurus)',
  Ardra: 'Mithuna (Gemini)',         Aridra: 'Mithuna (Gemini)',       Punarvasu: 'Mithuna (Gemini)',
  Pushya: 'Karka (Cancer)',          Pushyami: 'Karka (Cancer)',        Ashlesha: 'Karka (Cancer)',  Aslesha: 'Karka (Cancer)',
  Magha: 'Simha (Leo)',
  'Purva Phalguni': 'Simha (Leo)',   Poorvaphalguni: 'Simha (Leo)',     PurvaPhalguni: 'Simha (Leo)',
  'Uttara Phalguni': 'Simha (Leo)',  Uttaraphalguni: 'Simha (Leo)',     UttaraPhalguni: 'Simha (Leo)',
  Hasta: 'Kanya (Virgo)',            Chitra: 'Kanya (Virgo)',
  Swati: 'Tula (Libra)',             Swathi: 'Tula (Libra)',
  Vishakha: 'Tula (Libra)',          Anuradha: 'Vrishchika (Scorpio)', Jyeshtha: 'Vrishchika (Scorpio)',
  Moola: 'Dhanu (Sagittarius)',      Mula: 'Dhanu (Sagittarius)',
  'Purva Ashadha': 'Dhanu (Sagittarius)',  Poorvashadha: 'Dhanu (Sagittarius)',  PurvaAshadha: 'Dhanu (Sagittarius)',
  'Uttara Ashadha': 'Dhanu (Sagittarius)', Uttarashadha: 'Dhanu (Sagittarius)', UttaraAshadha: 'Dhanu (Sagittarius)',
  Shravana: 'Makara (Capricorn)',    Sravana: 'Makara (Capricorn)',
  Dhanishtha: 'Makara (Capricorn)',  Dhanistha: 'Makara (Capricorn)',
  Shatabhisha: 'Kumbha (Aquarius)', Satabhisha: 'Kumbha (Aquarius)',  Shatataraka: 'Kumbha (Aquarius)',
  'Purva Bhadrapada': 'Kumbha (Aquarius)',  Poorvabhadra: 'Kumbha (Aquarius)',  PurvaBhadrapada: 'Kumbha (Aquarius)',
  'Uttara Bhadrapada': 'Meena (Pisces)',    Uttarabhadra: 'Meena (Pisces)',     UttaraBhadrapada: 'Meena (Pisces)',
  Revati: 'Meena (Pisces)',
}

function nakToRasi(constellation: string): string {
  // Input: "Hasta - 2" or "Hasta"
  const name = constellation.split('-')[0].trim()
  return NAK_TO_RASI[name] ?? ''
}

function nakToName(constellation: string): string {
  return constellation.split('-')[0].trim()
}

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

// ── VedAstro single calculation ───────────────────────────────────
async function vedaCalc(
  method: string, lat: number, lon: number,
  hh: number, mm: number, dd: number, mo: number, yyyy: number,
  tz = '+05:30'
): Promise<any> {
  const url = `${VEDASTRO}/api/Calculate/${method}/Location/${lat}/${lon}/Time/${hh}/${mm}/${dd}/${mo}/${yyyy}/${encodeURIComponent(tz)}`
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) })
  if (!res.ok) throw new Error(`VedAstro HTTP ${res.status}`)
  const json = await res.json() as any
  if (json?.Status !== 'Pass') throw new Error(`VedAstro: ${json?.Payload ?? 'error'}`)
  return json.Payload
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
    const dob = new Date(dateOfBirth)
    const dd = dob.getUTCDate(), mo = dob.getUTCMonth() + 1, yyyy = dob.getUTCFullYear()

    let hh = 12, mm = 0
    if (birthTime) {
      const [h, m] = birthTime.split(':').map(Number)
      hh = isNaN(h) ? 12 : h
      mm = isNaN(m) ? 0 : m
    }

    const coords = await geocodePlace(birthPlace)
    if (!coords) {
      return res.status(400).json({
        success: false,
        error: `Cannot find "${birthPlace}" — try "City, State" format`,
      })
    }

    // Three parallel VedAstro calls
    const [allConst, moonSignPayload, lagnaSignPayload] = await Promise.all([
      vedaCalc('AllPlanetConstellation', coords.lat, coords.lon, hh, mm, dd, mo, yyyy),
      vedaCalc('MoonSignName',           coords.lat, coords.lon, hh, mm, dd, mo, yyyy),
      vedaCalc('LagnaSignName',          coords.lat, coords.lon, hh, mm, dd, mo, yyyy),
    ])

    // Build constellation map: planet → "Nakshatra - Pada"
    const constellations: Record<string, string> = {}
    for (const row of (allConst?.AllPlanetConstellation ?? [])) {
      constellations[(row.Planet as string).toLowerCase()] = row.AllPlanetConstellation ?? ''
    }

    // Nakshatra
    const moonConst   = constellations['moon'] ?? ''
    const nakshatra   = nakToName(moonConst)           // e.g. "Hasta"
    const nakshatraPada = moonConst                    // e.g. "Hasta - 2"

    // Rasi — prefer VedAstro's MoonSignName (English) → convert to Sanskrit+English form
    const moonSignEng: string = moonSignPayload?.MoonSignName ?? ''
    const rasi = moonSignEng ? (ENG_TO_RASI[moonSignEng] ?? moonSignEng) : nakToRasi(moonConst)

    // Lagna
    const lagnaEng: string = lagnaSignPayload?.LagnaSignName ?? ''
    const lagna = ENG_TO_RASI[lagnaEng] ?? lagnaEng

    // Mangal Dosha: Mars in houses 1,2,4,7,8,12 from Lagna
    const lagnaNum = ENG_TO_NUM[lagnaEng] ?? 0
    const marsRasi = nakToRasi(constellations['mars'] ?? '')
    const marsEng  = marsRasi.match(/\(([^)]+)\)/)?.[1] ?? ''
    const marsNum  = ENG_TO_NUM[marsEng] ?? 0
    const marsHouse = lagnaNum && marsNum ? ((marsNum - lagnaNum + 12) % 12) + 1 : 0
    const mangalDosha = [1, 2, 4, 7, 8, 12].includes(marsHouse)

    return res.json({
      success: true,
      data: {
        nakshatra,
        nakshatraPada,
        rasi,
        mangalDosha,
        marsHouse: marsHouse || null,
        lagnaSign: lagna,
        coordinates: coords,
        planets: {
          sun:     nakToRasi(constellations['sun']     ?? ''),
          moon:    rasi,
          mars:    nakToRasi(constellations['mars']    ?? ''),
          mercury: nakToRasi(constellations['mercury'] ?? ''),
          jupiter: nakToRasi(constellations['jupiter'] ?? ''),
          venus:   nakToRasi(constellations['venus']   ?? ''),
          saturn:  nakToRasi(constellations['saturn']  ?? ''),
          rahu:    nakToRasi(constellations['rahu']    ?? ''),
          ketu:    nakToRasi(constellations['ketu']    ?? ''),
          lagna:   lagna,
        },
        constellations,
      },
    })
  } catch (err: any) {
    console.error('Astro error:', err?.message)
    return res.status(500).json({ success: false, error: err?.message ?? 'Calculation failed' })
  }
})

export default router
