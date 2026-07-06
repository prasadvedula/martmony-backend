/**
 * Parser for Nitya Kalyanam Patchathoranam (NKT) PDF format from kktvivaha.org
 *
 * Information Sequence (from PDF header):
 * RegCode - Surname - Name - DOB,Time - BirthPlace,District,State - Star - Padam - Rasi -
 * HeightCode - Gotram - Sect - Subsect - MaritalStatus - Education - OrgName - Designation -
 * SalaryPA - SalaryUnit - WorkCity - PhysChallenged - FatherName - FatherDesig -
 * Addr:ADDRESS - email - phone - phone(W) - Req:REQUIREMENTS
 */

import type { ParsedProfileDraft } from './pdf-parser'

// ── Height code ─────────────────────────────────────────────────────────────
// 508 = 5'8" = 172cm, 600 = 6'0" = 183cm
function parseNKTHeight(code: string): number | undefined {
  const n = parseInt(code)
  if (isNaN(n)) return undefined
  if (n >= 500 && n <= 699) {
    const feet = Math.floor(n / 100)
    const inches = n % 100
    if (inches > 11) return undefined
    return Math.round(feet * 30.48 + inches * 2.54)
  }
  return undefined
}

// ── Salary normalisation ─────────────────────────────────────────────────────
function toAnnualLpa(amount: number, unit: string): number | undefined {
  const u = unit.toLowerCase()
  if (u.includes('inr') && u.includes('lakh')) return amount
  if (u.includes('us dollar') || u.includes('usd')) return +(amount * 0.0012).toFixed(2) // rough
  if (u.includes('uk pound') || u.includes('gbp')) return +(amount * 0.0015).toFixed(2)
  if (u.includes('uae dirham') || u.includes('aed')) return +(amount * 0.00033).toFixed(2)
  // If the number itself looks like it's already in lakhs (< 1000)
  if (u.includes('lakh')) return amount
  return undefined
}

// ── Nakshatra normalisation ──────────────────────────────────────────────────
const NAKSHATRA_MAP: Record<string, string> = {
  aswini: 'Ashwini', bharani: 'Bharani', kruthhika: 'Krittika', kruthika: 'Krittika',
  rohini: 'Rohini', mrugasira: 'Mrigashira', arudra: 'Ardra', punarvasu: 'Punarvasu',
  pushyami: 'Pushya', pushya: 'Pushya', ashlesha: 'Ashlesha', makha: 'Magha',
  pubba: 'Purva Phalguni', uttara: 'Uttara Phalguni', 'uttara phalguni': 'Uttara Phalguni',
  hastha: 'Hasta', hasta: 'Hasta', chittha: 'Chitra', chitra: 'Chitra',
  swathi: 'Swati', visakha: 'Vishakha', anuradha: 'Anuradha', jyeshta: 'Jyeshtha',
  moola: 'Moola', poorvashada: 'Purva Ashadha', uttarashada: 'Uttara Ashadha',
  sravanam: 'Shravana', dhanishta: 'Dhanishtha', sathabhisham: 'Shatabhisha',
  poorvabhadra: 'Purva Bhadrapada', uttarabhadra: 'Uttara Bhadrapada', revathi: 'Revati',
}

function normaliseNakshatra(raw: string): string {
  const key = raw.toLowerCase().trim()
  return NAKSHATRA_MAP[key] || raw.trim()
}

// ── Rasi normalisation ───────────────────────────────────────────────────────
const RASI_MAP: Record<string, string> = {
  mesham: 'Aries', vrushabham: 'Taurus', midhunam: 'Gemini', karkatakam: 'Cancer',
  simham: 'Leo', kanya: 'Virgo', tula: 'Libra', vruschikam: 'Scorpio',
  dhanussu: 'Sagittarius', makaram: 'Capricorn', kumbham: 'Aquarius', meenam: 'Pisces',
}

function normaliseRasi(raw: string): string | undefined {
  const key = raw.toLowerCase().trim()
  return RASI_MAP[key] || (raw.trim() || undefined)
}

// ── State inference ──────────────────────────────────────────────────────────
function inferState(text: string): string | undefined {
  const t = text.toLowerCase()
  if (/andhra|ap\b/.test(t)) return 'Andhra Pradesh'
  if (/telangana/.test(t)) return 'Telangana'
  if (/karnataka|bangalore|bengaluru/.test(t)) return 'Karnataka'
  if (/tamil|chennai/.test(t)) return 'Tamil Nadu'
  if (/maharashtra|mumbai|pune/.test(t)) return 'Maharashtra'
  if (/delhi|noida|gurgaon/.test(t)) return 'Delhi'
  if (/usa|united states/.test(t)) return 'USA'
  if (/uk|united kingdom/.test(t)) return 'UK'
  if (/uae|dubai/.test(t)) return 'UAE'
  if (/gujarat|ahmedabad/.test(t)) return 'Gujarat'
  if (/rajasthan/.test(t)) return 'Rajasthan'
  return undefined
}

// ── Gender from registration code ────────────────────────────────────────────
// NKT5xxx = Bride (FEMALE), NKT1xxx = Groom (MALE)
function genderFromCode(code: string): 'MALE' | 'FEMALE' {
  const m = code.match(/NKT(\d+)/)
  if (!m) return 'MALE'
  return m[1].startsWith('5') ? 'FEMALE' : 'MALE'
}

// ── Requirements parser ───────────────────────────────────────────────────────
function parseRequirements(req: string) {
  // e.g. "31 to 36,508 to 600,Divorcee without issues,Any Well Qlf.,Hyderabad, Vijayawada"
  let prefAgeMin: number | undefined
  let prefAgeMax: number | undefined
  const prefStates: string[] = []

  const ageMatch = req.match(/(\d{2})\s+to\s+(\d{2})/)
  if (ageMatch) {
    prefAgeMin = parseInt(ageMatch[1])
    prefAgeMax = parseInt(ageMatch[2])
  }

  // Cities / states from last part
  const parts = req.split(',')
  for (const p of parts) {
    const st = inferState(p)
    if (st && !prefStates.includes(st)) prefStates.push(st)
  }

  return { prefAgeMin, prefAgeMax, prefStates }
}

// ── Main entry parser ─────────────────────────────────────────────────────────
export function parseNKTEntry(
  regCode: string,
  bodyText: string,
  sectionGender?: 'MALE' | 'FEMALE'
): ParsedProfileDraft {
  const warnings: string[] = []
  const text = bodyText.replace(/\s+/g, ' ').trim()

  const gender = sectionGender ?? genderFromCode(regCode)

  // Split at Addr:
  const addrStart = text.indexOf('Addr:')
  const preAddr = addrStart >= 0 ? text.slice(0, addrStart).trim() : text

  // Everything after Addr:
  const afterAddr = addrStart >= 0 ? text.slice(addrStart + 5) : ''

  // Extract requirements
  let requirements = ''
  const reqStart = afterAddr.indexOf(' Req:')
  const contactSection = reqStart >= 0 ? afterAddr.slice(0, reqStart) : afterAddr
  if (reqStart >= 0) {
    requirements = afterAddr.slice(reqStart + 5).replace(/\s*-\s*$/, '').trim()
  }

  // Email
  const emailMatch = contactSection.match(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/i)
  const contactEmail = emailMatch?.[0]

  // Phones (10-digit)
  const phoneMatches = contactSection.match(/\b\d{10}\b/g) || []
  const contactPhone = phoneMatches[0]

  // Address text (before email/phone)
  const addrText = emailMatch
    ? contactSection.slice(0, contactSection.indexOf(emailMatch[0])).replace(/\s*-\s*$/, '').trim()
    : contactSection.trim()

  // Split pre-addr by ' - '
  const parts = preAddr.replace(/\s*-\s*$/, '').split(' - ')

  // Fixed fields 0-10
  const surname   = parts[0]?.trim() ?? ''
  const fullName  = parts[1]?.trim() ?? ''
  const dobTime   = parts[2]?.trim() ?? ''
  const birthPlaceRaw = parts[3]?.trim() ?? ''
  const starRaw   = parts[4]?.trim() ?? ''
  const _padam    = parts[5]?.trim() ?? ''
  const rasiRaw   = parts[6]?.trim() ?? ''
  const heightCode = parts[7]?.trim() ?? ''
  const gotram    = parts[8]?.trim() ?? ''
  const sect      = parts[9]?.trim() ?? ''
  const subsect   = parts[10]?.trim() ?? ''

  // Parse DOB + time
  const dobMatch = dobTime.match(/(\d{2})\.(\d{2})\.(\d{4})(?:,\s*(\d{1,2}:\d{2}))?/)
  const dateOfBirth = dobMatch
    ? new Date(`${dobMatch[3]}-${dobMatch[2]}-${dobMatch[1]}`)
    : new Date('1990-01-01')
  const birthTime = dobMatch?.[4]

  if (!dobMatch) warnings.push('Could not parse date of birth')

  // Birth place
  const bpParts = birthPlaceRaw.split(',').map(s => s.trim()).filter(Boolean)
  const birthPlace = bpParts[0] || birthPlaceRaw
  const birthStateRaw = bpParts[bpParts.length - 1] || ''

  // Remaining fields after index 10
  const rest = parts.slice(11)

  // Find salary amount (first decimal/integer that looks like a salary)
  const salaryIdx = rest.findIndex(p => /^\d{1,7}(\.\d{1,2})?$/.test(p.trim()) && parseFloat(p) > 0)

  let maritalStatus = ''
  let education     = ''
  let orgName       = ''
  let designation   = ''
  let annualIncomeLpa: number | undefined
  let workCity      = ''
  let fatherName: string | undefined
  let fatherOccupation: string | undefined

  if (salaryIdx >= 0) {
    const salaryAmount = parseFloat(rest[salaryIdx])
    const salaryUnit   = rest[salaryIdx + 1]?.trim() ?? ''
    workCity           = rest[salaryIdx + 2]?.trim() ?? ''
    annualIncomeLpa    = toAnnualLpa(salaryAmount, salaryUnit)

    // Before salary: [maritalStatus?] education orgName designation
    const before = rest.slice(0, salaryIdx).map(p => p.trim()).filter(Boolean)

    const firstLower = before[0]?.toLowerCase() ?? ''
    const isMarital  = /divorcee|widow|issues|second marriage/.test(firstLower)
    const payload    = isMarital ? before.slice(1) : before
    if (isMarital) maritalStatus = before[0]

    designation = payload[payload.length - 1] ?? ''
    orgName     = payload[payload.length - 2] ?? ''
    education   = payload.slice(0, -2).join(', ')

    // After work city: phys-challenged?, fatherName, fatherDesig
    const afterWork = rest.slice(salaryIdx + 3).map(p => p.trim()).filter(Boolean)
    // last item = father designation, second-last = father name
    fatherOccupation = afterWork[afterWork.length - 1]
    fatherName       = afterWork[afterWork.length - 2]
  } else {
    // No salary — pull what we can
    const nonEmpty = rest.map(p => p.trim()).filter(Boolean)
    const firstLower = nonEmpty[0]?.toLowerCase() ?? ''
    if (/divorcee|widow/.test(firstLower)) {
      maritalStatus = nonEmpty[0]
      education     = nonEmpty.slice(1).join(', ')
    } else {
      education = nonEmpty.join(', ')
    }
    warnings.push('Salary not found')
  }

  const nakshatra = normaliseNakshatra(starRaw)
  const rashi     = normaliseRasi(rasiRaw)
  const heightCm  = parseNKTHeight(heightCode)

  const { prefAgeMin, prefAgeMax, prefStates } = parseRequirements(requirements)

  if (!nakshatra) warnings.push('Nakshatra not found')
  if (!fullName && !surname) warnings.push('Name not found')

  const required = [fullName || surname, gender, dateOfBirth, nakshatra, 'Brahmin']
  const presentCount = required.filter(Boolean).length
  const parseConfidence: ParsedProfileDraft['parseConfidence'] =
    presentCount === 5 ? 'HIGH' : presentCount >= 3 ? 'MEDIUM' : 'LOW'

  return {
    name:            fullName || surname || 'Unknown',
    surname:         surname || undefined,
    gender,
    dateOfBirth:     dateOfBirth.toISOString(),
    birthTime:       birthTime ?? undefined,
    birthPlace:      birthPlace || 'Unknown',
    currentCity:     workCity || bpParts[0] || undefined,
    currentState:    inferState(workCity) ?? inferState(birthStateRaw) ?? undefined,
    caste:           'Brahmin',
    subCaste:        sect || undefined,
    sakha:           subsect || undefined,
    gotram:          gotram || undefined,
    nakshatra:       nakshatra || 'Unknown',
    rashi:           rashi ?? undefined,
    heightCm:        heightCm ?? undefined,
    education:       education || undefined,
    occupation:      designation || undefined,
    annualIncomeLpa: annualIncomeLpa ?? undefined,
    fatherName:      fatherName ?? undefined,
    contactEmail:    contactEmail ?? undefined,
    contactPhone:    contactPhone ?? undefined,
    prefAgeMin:      prefAgeMin ?? undefined,
    prefAgeMax:      prefAgeMax ?? undefined,
    prefStates:      prefStates.length ? prefStates : undefined,
    rawText:         bodyText,
    parseConfidence,
    warnings,
    profileSource:   'NKT' as const,
  }
}

// ── Top-level text parser ─────────────────────────────────────────────────────
const NKT_CODE_RE = /(26[A-Za-z]\d+NKT\d+)/g

export function parseNKTText(text: string): ParsedProfileDraft[] {
  // Detect gender section
  let currentGender: 'MALE' | 'FEMALE' = 'FEMALE'
  const results: ParsedProfileDraft[] = []

  // Split by NKT registration codes
  const cleaned = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  // Find all code positions
  const entries: Array<{ code: string; start: number; gender: 'MALE' | 'FEMALE' }> = []
  let m: RegExpExecArray | null

  // Track section headers
  const brideGroomIdx = cleaned.search(/Bride\s+Grooms/i)
  const bridesIdx     = cleaned.search(/\bBrides\b/i)

  NKT_CODE_RE.lastIndex = 0
  while ((m = NKT_CODE_RE.exec(cleaned)) !== null) {
    const pos = m.index
    // Determine gender from section position
    let g: 'MALE' | 'FEMALE'
    if (brideGroomIdx >= 0 && pos > brideGroomIdx) {
      g = 'MALE'
    } else if (bridesIdx >= 0 && pos > bridesIdx) {
      g = 'FEMALE'
    } else {
      g = genderFromCode(m[1])
    }
    entries.push({ code: m[1], start: m.index, gender: g })
  }

  for (let i = 0; i < entries.length; i++) {
    const { code, start, gender } = entries[i]
    const end = i + 1 < entries.length ? entries[i + 1].start : cleaned.length
    const bodyText = cleaned.slice(start + code.length, end)
      .replace(/Divorcee\s*/i, '') // strip standalone "Divorcee" label line
      .trim()

    if (bodyText.length < 20) continue

    const draft = parseNKTEntry(code, bodyText, gender)
    results.push(draft)
  }

  currentGender // suppress unused warning
  return results
}

export async function parseNKTBuffer(buffer: Buffer): Promise<ParsedProfileDraft[]> {
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return parseNKTText(data.text)
}

// Detect if text is NKT format
export function isNKTFormat(text: string): boolean {
  return /NITYA\s+KALYANAM/i.test(text) || /NKT\s+List\s+No/i.test(text) || /26[A-Za-z]\d+NKT\d+/.test(text)
}
