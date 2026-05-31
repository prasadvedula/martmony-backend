import { Router, Request, Response } from 'express'

const router = Router()
const VEDASTRO = 'https://api.vedastro.org'

// ── Sign mappings ─────────────────────────────────────────────────
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

const NUM_TO_ENG: Record<number, string> = {}
Object.entries(ENG_TO_NUM).forEach(([k, v]) => { NUM_TO_ENG[v] = k })

// ── Nakshatra → Rasi ──────────────────────────────────────────────
const NAK_TO_RASI: Record<string, string> = {
  Ashwini: 'Mesha (Aries)',           Bharani: 'Mesha (Aries)',
  Krittika: 'Vrishabha (Taurus)',     // pada 2-4; pada 1 → Aries (handled by PADA_SPLIT)
  Rohini: 'Vrishabha (Taurus)',       Mrigashira: 'Mithuna (Gemini)', Mrigasira: 'Mithuna (Gemini)',
  Ardra: 'Mithuna (Gemini)',          Aridra: 'Mithuna (Gemini)',
  Punarvasu: 'Mithuna (Gemini)',      // pada 4 → Cancer (PADA_SPLIT)
  Pushya: 'Karka (Cancer)',           Pushyami: 'Karka (Cancer)',
  Ashlesha: 'Karka (Cancer)',         Aslesha: 'Karka (Cancer)',
  Magha: 'Simha (Leo)',
  'Purva Phalguni': 'Simha (Leo)',    PurvaPhalguni: 'Simha (Leo)',   Poorvaphalguni: 'Simha (Leo)',
  'Uttara Phalguni': 'Kanya (Virgo)', UttaraPhalguni: 'Kanya (Virgo)', Uttaraphalguni: 'Kanya (Virgo)',
  Hasta: 'Kanya (Virgo)',             Chitra: 'Tula (Libra)',         // pada 1-2 Virgo, 3-4 Libra → use Libra as majority
  Swati: 'Tula (Libra)',              Swathi: 'Tula (Libra)',
  Vishakha: 'Tula (Libra)',           Visakha: 'Tula (Libra)',
  Anuradha: 'Vrishchika (Scorpio)',   Jyeshtha: 'Vrishchika (Scorpio)', Jyesta: 'Vrishchika (Scorpio)',
  Moola: 'Dhanu (Sagittarius)',       Mula: 'Dhanu (Sagittarius)',
  'Purva Ashadha': 'Dhanu (Sagittarius)', PurvaAshadha: 'Dhanu (Sagittarius)', Poorvashada: 'Dhanu (Sagittarius)',
  'Uttara Ashadha': 'Makara (Capricorn)', UttaraAshadha: 'Makara (Capricorn)', Uttarashada: 'Makara (Capricorn)',
  Shravana: 'Makara (Capricorn)',     Sravana: 'Makara (Capricorn)',
  Dhanishtha: 'Makara (Capricorn)',   Dhanistha: 'Makara (Capricorn)',    Dhanishta: 'Makara (Capricorn)',
  Shatabhisha: 'Kumbha (Aquarius)',   Satabhisha: 'Kumbha (Aquarius)', Shataraka: 'Kumbha (Aquarius)',
  'Purva Bhadrapada': 'Kumbha (Aquarius)', PurvaBhadrapada: 'Kumbha (Aquarius)',
  'Uttara Bhadrapada': 'Meena (Pisces)', UttaraBhadrapada: 'Meena (Pisces)',
  Revati: 'Meena (Pisces)',
  // Alternate spellings used by VedAstro
  Aswini: 'Mesha (Aries)', Krittka: 'Vrishabha (Taurus)',
}

// Nakshatras that span two signs — function returns correct rasi for each pada
// Rules: Krittika p1→Aries, p2-4→Taurus | Punarvasu p1-3→Gemini, p4→Cancer
//        Uttara Phalguni p1→Leo, p2-4→Virgo | Chitra p1-2→Virgo, p3-4→Libra
//        Vishakha p1-3→Libra, p4→Scorpio | Uttara Ashadha p1→Sagittarius, p2-4→Capricorn
//        Dhanishtha p1-2→Capricorn, p3-4→Aquarius | Purva Bhadrapada p1-3→Aquarius, p4→Pisces
type PadaFn = (pada: number) => string
const PADA_SPLIT: Record<string, PadaFn> = {
  Krittika:           (p) => p === 1 ? 'Mesha (Aries)'         : 'Vrishabha (Taurus)',
  Punarvasu:          (p) => p <= 3  ? 'Mithuna (Gemini)'      : 'Karka (Cancer)',
  Chitra:             (p) => p <= 2  ? 'Kanya (Virgo)'         : 'Tula (Libra)',
  Vishakha:           (p) => p <= 3  ? 'Tula (Libra)'          : 'Vrishchika (Scorpio)',
  Visakha:            (p) => p <= 3  ? 'Tula (Libra)'          : 'Vrishchika (Scorpio)',
  'Uttara Phalguni':  (p) => p === 1 ? 'Simha (Leo)'           : 'Kanya (Virgo)',
  UttaraPhalguni:     (p) => p === 1 ? 'Simha (Leo)'           : 'Kanya (Virgo)',
  Uttaraphalguni:     (p) => p === 1 ? 'Simha (Leo)'           : 'Kanya (Virgo)',
  'Uttara Ashadha':   (p) => p === 1 ? 'Dhanu (Sagittarius)'   : 'Makara (Capricorn)',
  UttaraAshadha:      (p) => p === 1 ? 'Dhanu (Sagittarius)'   : 'Makara (Capricorn)',
  Uttarashada:        (p) => p === 1 ? 'Dhanu (Sagittarius)'   : 'Makara (Capricorn)',
  Dhanishtha:         (p) => p <= 2  ? 'Makara (Capricorn)'    : 'Kumbha (Aquarius)',
  Dhanistha:          (p) => p <= 2  ? 'Makara (Capricorn)'    : 'Kumbha (Aquarius)',
  Dhanishta:          (p) => p <= 2  ? 'Makara (Capricorn)'    : 'Kumbha (Aquarius)',
  'Purva Bhadrapada': (p) => p <= 3  ? 'Kumbha (Aquarius)'    : 'Meena (Pisces)',
  PurvaBhadrapada:    (p) => p <= 3  ? 'Kumbha (Aquarius)'    : 'Meena (Pisces)',
}

function nakToRasi(constellation: string): string {
  const parts = constellation.split('-')
  const name  = parts[0].trim()
  const pada  = parts[1] ? parseInt(parts[1].trim()) : 1
  const splitFn = PADA_SPLIT[name]
  if (splitFn) return splitFn(pada)
  return NAK_TO_RASI[name] ?? ''
}

function nakToName(constellation: string): string {
  return constellation.split('-')[0].trim()
}

function rasiToEng(rasi: string): string {
  return rasi.match(/\(([^)]+)\)/)?.[1] ?? rasi
}

// ── Geocoding ─────────────────────────────────────────────────────
async function geocodePlace(place: string): Promise<{ lat: number; lon: number; name: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`
  const res = await fetch(url, {
    headers: { 'User-Agent': 'MartmonyApp/1.0 (admin@martmony.com)' },
    signal: AbortSignal.timeout(8000),
  })
  const data = await res.json() as any[]
  if (!data?.length) return null
  return {
    lat:  parseFloat(data[0].lat),
    lon:  parseFloat(data[0].lon),
    name: data[0].display_name?.split(',')[0] ?? place,
  }
}

// ── VedAstro POST calculation ─────────────────────────────────────
// Correct format: POST /api/Calculate/{method}
// Body: {"Time":{"StdTime":"HH:MM DD/MM/YYYY +05:30","Location":{"Name":"...","Latitude":...,"Longitude":...}}}
async function vedaPost(method: string, stdTime: string, lat: number, lon: number, locName: string): Promise<any> {
  const url  = `${VEDASTRO}/api/Calculate/${method}`
  const body = {
    Time: {
      StdTime: stdTime,
      Location: { Name: locName, Latitude: lat, Longitude: lon },
    },
  }
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
    signal:  AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`VedAstro HTTP ${res.status}`)
  const json = await res.json() as any
  if (json?.Status !== 'Pass') throw new Error(`VedAstro: ${json?.Payload ?? 'error'}`)
  return json.Payload
}

// ── Mangal Dosha analysis ─────────────────────────────────────────
interface MangalDoshaDetail {
  isDosha: boolean
  marsHouseFromLagna: number | null
  marsHouseFromMoon: number | null
  severity: 'None' | 'Mild' | 'Moderate' | 'Strong' | 'Very Strong'
  isCancelled: boolean
  cancellationReasons: string[]
  doshaHouses: { fromLagna: boolean; fromMoon: boolean }
  explanation: string
}

const MANGAL_HOUSES = [1, 2, 4, 7, 8, 12]
const SEVERITY_MAP: Record<number, 'Mild' | 'Moderate' | 'Strong' | 'Very Strong'> = {
  1: 'Strong', 2: 'Moderate', 4: 'Moderate', 7: 'Very Strong', 8: 'Very Strong', 12: 'Mild',
}

function calcHouse(planetSign: number, refSign: number): number {
  if (!planetSign || !refSign) return 0
  return ((planetSign - refSign + 12) % 12) + 1
}

function analyzeMangalDosha(
  marsSignNum: number, lagnaSignNum: number, moonSignNum: number, jupiterSignNum: number
): MangalDoshaDetail {
  const hFromLagna = calcHouse(marsSignNum, lagnaSignNum)
  const hFromMoon  = calcHouse(marsSignNum, moonSignNum)

  const doshaFromLagna = MANGAL_HOUSES.includes(hFromLagna)
  const doshaFromMoon  = MANGAL_HOUSES.includes(hFromMoon)
  const isDosha = doshaFromLagna  // primary check is from Lagna

  // Cancellation rules
  const cancellationReasons: string[] = []
  // Mars in own sign (Aries=1 or Scorpio=8)
  if (marsSignNum === 1 || marsSignNum === 8) {
    cancellationReasons.push('Mars is in its own sign — dosha greatly reduced')
  }
  // Mars exalted in Capricorn
  if (marsSignNum === 10) {
    cancellationReasons.push('Mars is exalted (Capricorn) — dosha mitigated')
  }
  // Jupiter in Lagna cancels (benefic influence)
  if (jupiterSignNum && jupiterSignNum === lagnaSignNum) {
    cancellationReasons.push('Jupiter in Lagna — cancels Mangal Dosha')
  }
  // Aquarius or Cancer Lagna — special cancellation
  if (lagnaSignNum === 11) cancellationReasons.push('Aquarius Lagna — natural cancellation')
  if (lagnaSignNum === 4) cancellationReasons.push('Cancer Lagna — dosha not applicable')

  const isCancelled = cancellationReasons.length > 0

  const severity = !isDosha ? 'None'
    : isCancelled ? 'Mild'
    : SEVERITY_MAP[hFromLagna] ?? 'Moderate'

  const houseNames: Record<number, string> = {
    1: '1st (Lagna/Self)', 2: '2nd (Family/Wealth)', 4: '4th (Home/Happiness)',
    7: '7th (Marriage/Partnership)', 8: '8th (Longevity)', 12: '12th (Expenditure)',
  }

  const explanation = !isDosha
    ? `Mars is in the ${hFromLagna}th house from Lagna — not in a Mangal Dosha position. No dosha present.`
    : isCancelled
    ? `Mars is in the ${houseNames[hFromLagna] ?? `${hFromLagna}th house`} — Mangal Dosha is present but cancelled. ${cancellationReasons[0]}.`
    : `Mars is in the ${houseNames[hFromLagna] ?? `${hFromLagna}th house`} — ${severity} Mangal Dosha. ` +
      `This can affect the marriage house. Matching with another Manglik helps balance.`

  return {
    isDosha,
    marsHouseFromLagna: hFromLagna || null,
    marsHouseFromMoon:  hFromMoon  || null,
    severity,
    isCancelled,
    cancellationReasons,
    doshaHouses: { fromLagna: doshaFromLagna, fromMoon: doshaFromMoon },
    explanation,
  }
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
    const dd   = String(dob.getUTCDate()).padStart(2, '0')
    const mo   = String(dob.getUTCMonth() + 1).padStart(2, '0')
    const yyyy = dob.getUTCFullYear()

    // Parse time — handles both 24-hour ("19:30") and 12-hour ("07:30 PM" / "7:30 pm")
    let hh = '12', mm = '00'
    if (birthTime) {
      const t        = birthTime.trim()
      const isPM     = /pm/i.test(t)
      const isAM     = /am/i.test(t)
      const clean    = t.replace(/[apmAPM\s]/g, '')   // strip am/pm/spaces → "07:30"
      const parts    = clean.split(':')
      let hour       = parseInt(parts[0]) || 0
      const minute   = parseInt(parts[1]) || 0
      // Convert 12-hour → 24-hour
      if (isPM && hour !== 12) hour += 12
      if (isAM && hour === 12) hour  = 0
      hh = String(hour).padStart(2, '0')
      mm = String(minute).padStart(2, '0')
    }

    // VedAstro StdTime format: "HH:MM DD/MM/YYYY +05:30"
    const stdTime = `${hh}:${mm} ${dd}/${mo}/${yyyy} +05:30`

    // Geocode
    const coords = await geocodePlace(birthPlace)
    if (!coords) {
      return res.status(400).json({
        success: false,
        error: `Cannot locate "${birthPlace}" — try "City, State" format`,
      })
    }

    // Three parallel VedAstro POST calls
    const [allConst, moonSignPayload, lagnaSignPayload] = await Promise.all([
      vedaPost('AllPlanetConstellation', stdTime, coords.lat, coords.lon, coords.name),
      vedaPost('MoonSignName',           stdTime, coords.lat, coords.lon, coords.name),
      vedaPost('LagnaSignName',          stdTime, coords.lat, coords.lon, coords.name),
    ])

    // Build constellation map
    const constellations: Record<string, string> = {}
    for (const row of (allConst?.AllPlanetConstellation ?? [])) {
      constellations[(row.Planet as string).toLowerCase()] = row.AllPlanetConstellation ?? ''
    }

    // Nakshatra
    const moonConst     = constellations['moon'] ?? ''
    const nakshatra     = nakToName(moonConst)
    const nakshatraPada = moonConst

    // Rasi
    const moonSignEng: string = moonSignPayload?.MoonSignName ?? ''
    const rasi = moonSignEng ? (ENG_TO_RASI[moonSignEng] ?? moonSignEng) : nakToRasi(moonConst)

    // Lagna
    const lagnaEng: string = lagnaSignPayload?.LagnaSignName ?? ''
    const lagna = ENG_TO_RASI[lagnaEng] ?? lagnaEng

    // Sign numbers for Mangal Dosha calc
    const marsRasiStr  = nakToRasi(constellations['mars']    ?? '')
    const moonRasiStr  = moonSignEng ? (ENG_TO_RASI[moonSignEng] ?? '') : nakToRasi(moonConst)
    const jupiterRasi  = nakToRasi(constellations['jupiter'] ?? '')

    const marsNum    = ENG_TO_NUM[rasiToEng(marsRasiStr)]  ?? 0
    const lagnaNum   = ENG_TO_NUM[lagnaEng]                ?? 0
    const moonNum    = ENG_TO_NUM[moonSignEng]             ?? 0
    const jupiterNum = ENG_TO_NUM[rasiToEng(jupiterRasi)]  ?? 0

    const mangalDetail = analyzeMangalDosha(marsNum, lagnaNum, moonNum, jupiterNum)

    // Build planets map
    const buildRasi = (planet: string): string => nakToRasi(constellations[planet] ?? '')

    return res.json({
      success: true,
      data: {
        nakshatra,
        nakshatraPada,
        rasi,
        lagnaSign: lagna,
        coordinates: { lat: coords.lat, lon: coords.lon, placeName: coords.name },

        mangalDosha: mangalDetail.isDosha && !mangalDetail.isCancelled,
        mangalDoshaDetail: mangalDetail,

        planets: {
          sun:     buildRasi('sun'),
          moon:    rasi,
          mars:    marsRasiStr,
          mercury: buildRasi('mercury'),
          jupiter: jupiterRasi,
          venus:   buildRasi('venus'),
          saturn:  buildRasi('saturn'),
          rahu:    buildRasi('rahu'),
          ketu:    buildRasi('ketu'),
          lagna,
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
