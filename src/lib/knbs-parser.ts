/**
 * Parser for Kukatpally Nagara Brahmana Samakya (KNBS) Parichaya Vedika PDF format.
 *
 * Expected line format (Boys):
 *   {num} {DD-MM-YYYY}, {NAME IN CAPS}, S/o {Father}, {subCaste}, {gotram}, [TOB: {t},] Ht: {h}", {Nakshatra[-pada]}, Education: {edu} {occ}, {city}. [Sal: {sal},] Phone: {ph}
 *
 * Expected line format (Girls):
 *   {num} {DD-MM-YYYY}, {NAME IN CAPS}, D/o {Father}, {gotram}, {subCaste}, Star: {Nakshatra[-pada] padam}, [Ht. {h}"] [TOB: {t}] Education: {edu}, {occ}, {city}. Ph: {ph}
 */

export interface KNBSProfileDraft {
  serialNo: number
  name: string
  gender: 'MALE' | 'FEMALE'
  dateOfBirth: Date
  birthTime?: string
  fatherName?: string
  caste: string
  subCaste?: string
  gotram?: string
  nakshatra?: string
  heightCm?: number
  education?: string
  occupation?: string
  annualIncomeLpa?: number
  currentCity?: string
  currentState?: string
  contactPhone?: string
  requirements?: string
  rawText: string
}

function parseHeightKNBS(val: string): number | undefined {
  // "5.7"" or "5'7"" → feet.inches notation
  const dotFmt = val.match(/(\d+)\.(\d+)/)
  if (dotFmt) {
    const ft = parseInt(dotFmt[1])
    const inch = parseInt(dotFmt[2])
    return Math.round(ft * 30.48 + inch * 2.54)
  }
  const apostrophe = val.match(/(\d+)'(\d+)/)
  if (apostrophe) {
    return Math.round(parseInt(apostrophe[1]) * 30.48 + parseInt(apostrophe[2]) * 2.54)
  }
  const cm = val.match(/(\d+)\s*cm/i)
  if (cm) return parseInt(cm[1])
  return undefined
}

function parseSalaryLpa(val: string): number | undefined {
  // "18 lakhs pa" → 18, "90K pm" → 10.8, "1 lakhs pm" → 12, "40-50K pm" → 5.4
  const lakhsPa = val.match(/([\d.]+)\s*lakhs?\s*pa/i)
  if (lakhsPa) return parseFloat(lakhsPa[1])
  const lakhsPm = val.match(/([\d.]+)\s*lakhs?\s*pm/i)
  if (lakhsPm) return parseFloat(lakhsPm[1]) * 12
  const rangePm = val.match(/(\d+)-(\d+)K\s*pm/i)
  if (rangePm) return Math.round((parseInt(rangePm[1]) + parseInt(rangePm[2])) / 2) * 12 / 100
  const kPm = val.match(/([\d.]+)K\s*pm/i)
  if (kPm) return parseFloat(kPm[1]) * 12 / 100
  const kPa = val.match(/([\d.]+)K\s*pa/i)
  if (kPa) return parseFloat(kPa[1]) / 100
  const rangeLpa = val.match(/([\d.]+)-([\d.]+)\s*lakhs/i)
  if (rangeLpa) return (parseFloat(rangeLpa[1]) + parseFloat(rangeLpa[2])) / 2
  return undefined
}

function extractNakshatra(val: string): string {
  // "Revathi-2" → "Revathi", "Uttarashada-3" → "Uttarashada"
  return val.split('-')[0].replace(/\s*\d+\s*padam?/i, '').trim()
}

function parseDDMMYYYY(val: string): Date | null {
  const m = val.match(/(\d{2})-(\d{2})-(\d{4})/)
  if (!m) return null
  return new Date(`${m[3]}-${m[2]}-${m[1]}`)
}

function inferState(city: string): string | undefined {
  const c = city.toLowerCase()
  if (c.includes('hyd') || c.includes('secunderabad') || c.includes('warangal') ||
      c.includes('hanumakonda') || c.includes('karimnagar') || c.includes('khammam') ||
      c.includes('mahabubnagar') || c.includes('nalgonda') || c.includes('nizamabad') ||
      c.includes('kukatpally') || c.includes('miyapur') || c.includes('manikonda') ||
      c.includes('malkajgiri') || c.includes('jeedimetla') || c.includes('dilsukh') ||
      c.includes('alwal') || c.includes('nagole') || c.includes('boduppal')) return 'Telangana'
  if (c.includes('vijayawada') || c.includes('guntur') || c.includes('vizag') ||
      c.includes('visakhapatnam') || c.includes('nellore') || c.includes('tirupati') ||
      c.includes('tirupathi') || c.includes('eluru') || c.includes('nuziveedu') ||
      c.includes('tenali') || c.includes('badvel') || c.includes('kadapa') ||
      c.includes('yellamanchili') || c.includes('ongole') || c.includes('kurnool')) return 'Andhra Pradesh'
  if (c.includes('chennai') || c.includes('bangalore') || c.includes('bengaluru')) return c.includes('chennai') ? 'Tamil Nadu' : 'Karnataka'
  if (c.includes('mumbai') || c.includes('pune') || c.includes('nagpur')) return 'Maharashtra'
  if (c.includes('delhi') || c.includes('noida') || c.includes('gurgaon')) return 'Delhi'
  if (c.includes('usa') || c.includes('texas') || c.includes('new york') || c.includes('austin')) return 'USA'
  if (c.includes('raipur')) return 'Chhattisgarh'
  if (c.includes('roorkela') || c.includes('bhubaneswar')) return 'Odisha'
  return undefined
}

export function parseKNBSBlock(raw: string, gender: 'MALE' | 'FEMALE'): KNBSProfileDraft | null {
  const text = raw.replace(/\s+/g, ' ').trim()

  // Serial number + date
  const headerMatch = text.match(/^(\d+)\s+(\d{2}-\d{2}-\d{4}),\s*([A-Z][A-Z\s.()]+?),\s*(S\/o|D\/o)\s+(.+?)(?=,\s*(?:Vaidiki|6000|Konaseema|Dravida|Madwas|Srivaishnavas|Niyogi|GVP|Gowthamasa|Kousik|Bharadwaj|Koundiny|Harithasa|Lohithasa|Kashyapasa|Srivatsasa|Vardhulasa|Atreyasa|Vadhulasa|Parasara|Kuthsasa|Sandilyasa|Srivastasa|Pradamasakha))/i)

  const dateMatch = text.match(/^(\d+)\s+(\d{2}-\d{2}-\d{4})/)
  if (!dateMatch) return null

  const serialNo = parseInt(dateMatch[1])
  const dob = parseDDMMYYYY(dateMatch[2])
  if (!dob) return null

  // Extract name (all caps after date)
  const nameMatch = text.match(/\d{2}-\d{2}-\d{4},\s*([A-Z][A-Z\s.()]+?),\s*(?:S\/o|D\/o)/)
  const name = nameMatch ? nameMatch[1].trim() : ''

  // Father name
  const fatherMatch = text.match(/(?:S\/o|D\/o)\s+(?:Late\.?\s+)?(.+?)(?=,\s*(?:Vaidiki|6000|Konaseema|Dravida|Madwas|Srivaishnavas|Niyogi|GVP|Gowthamasa|Kousik|Bharadwaj|Koundiny|Harithasa|Lohithasa|Kashyapasa|Srivatsasa|Vardhulasa|Atreyasa|Vadhulasa|Parasara|Kuthsasa|Sandilyasa|Srivastasa|Pradamasakha|[A-Z][a-z]+asa\b))/i)
  const fatherName = fatherMatch ? fatherMatch[1].replace(/^Late\.?\s+/i, '').trim() : undefined

  // Gotram — words ending in "asa" or known gotram patterns
  const gotramMatch = text.match(/\b([A-Z][a-z]+(?:asa|usa|isa|asa))\b/)
  const gotram = gotramMatch ? gotramMatch[1] : undefined

  // SubCaste — "6000 Niyogi", "Vaidiki Velanadu", etc.
  const subCasteMatch = text.match(/\b((?:6000\s+)?Niyogi(?:\s+\w+)?|Vaidiki\s+\w+(?:\s+\w+)?|Konaseema\s+Dravida|Srivaishnavas?\s+\w+|Dravida|Madwas|Golconda\s+\w+|GVP|Niyogi\s+\w+|Pradamasakha\s+Niyogi)\b/i)
  const subCaste = subCasteMatch ? subCasteMatch[1].trim() : undefined

  // Time of birth
  const tobMatch = text.match(/TOB\s*:\s*([\d.]+\s*(?:am|pm))/i)
  const birthTime = tobMatch ? tobMatch[1] : undefined

  // Height
  const htMatch = text.match(/Ht\.?\s*:?\s*([56]\.[0-9]+"|[56]'[0-9]+"|172\s*cm|[56]\s*ft)/i)
  const heightCm = htMatch ? parseHeightKNBS(htMatch[1]) : undefined

  // Nakshatra — word before or after known nakshatra names
  const nakshatraNames = 'Ashwini|Bharani|Kruthika|Krittika|Rohini|Mrigashira|Ardra|Punarvasu|Pushyami|Aslesha|Ashlesha|Makha|Pubba|Uttara|Hasta|Chitta|Swathi|Visakha|Anuradha|Jyesta|Moola|Purvaashada|Poorvashada|Uttarashada|Sravanam|Dhanista|Sathabhisham|Satabhisham|Purvabhadra|Poorvabhadra|Uttarabhadra|Revathi|Aswini|Krithika|Jyeshtha|Mula|Uttarabhada|Punarvasu|Pushya|Magha|Purva|Uttaraphalguni|Purva Bhadra|Purva Phalguni|Dhanishta|Shravana|Sravana'
  const nakRe = new RegExp(`\\b(${nakshatraNames})(?:-\\d)?\\b`, 'i')
  const nakMatch = text.match(nakRe)
  const nakshatra = nakMatch ? extractNakshatra(nakMatch[1]) : undefined

  // Education
  const eduMatch = text.match(/Education\s*:\s*([^,;]+)/i)
  const education = eduMatch ? eduMatch[1].trim() : undefined

  // Salary
  const salMatch = text.match(/Sal\s*:\s*([^;,\n]+?)(?:\s*(?:Phone|Ph\s*:|$))/i)
  const annualIncomeLpa = salMatch ? parseSalaryLpa(salMatch[1]) : undefined

  // Phone
  const phoneMatch = text.match(/(?:Phone|Ph)\s*:\s*(\d[\d\s/]+)/i)
  const contactPhone = phoneMatch ? phoneMatch[1].split('/')[0].replace(/\s/g, '').trim() : undefined

  // City (last location before Phone)
  const cityMatch = text.match(/(?:Hyd(?:erabad)?|Secunderabad|Vizag|Visakhapatnam|Vijayawada|Nellore|Guntur|Chennai|Mumbai|Pune|Delhi|USA|Tirupati|Tirupathi|Warangal|Bangalore|Raipur|Badvel|Kadapa|Tenali|Nuziveedu|Hanumakonda|Karimnagar|Khammam)\b/i)
  const currentCity = cityMatch ? cityMatch[0].replace(/Hyd$/i, 'Hyderabad') : undefined
  const currentState = currentCity ? inferState(currentCity) : undefined

  // Requirements
  const reqMatch = text.match(/Req\s*:?\s*(.+?)(?:Phone|Ph\s*:|$)/i)
  const requirements = reqMatch ? reqMatch[1].trim().replace(/,$/, '') : undefined

  return {
    serialNo,
    name: name || `Profile ${serialNo}`,
    gender,
    dateOfBirth: dob,
    birthTime,
    fatherName,
    caste: 'Brahmin',
    subCaste,
    gotram,
    nakshatra,
    heightCm,
    education,
    occupation: undefined,
    annualIncomeLpa,
    currentCity,
    currentState,
    contactPhone,
    requirements,
    rawText: raw,
  }
}

export function parseKNBSText(text: string): KNBSProfileDraft[] {
  const results: KNBSProfileDraft[] = []
  let currentGender: 'MALE' | 'FEMALE' = 'MALE'

  // Detect section headers
  const lines = text.split('\n')
  const blocks: { text: string; gender: 'MALE' | 'FEMALE' }[] = []
  let currentBlock = ''

  for (const line of lines) {
    const upper = line.toUpperCase()
    if (upper.includes('BOYS')) { currentGender = 'MALE'; continue }
    if (upper.includes('GIRLS')) { currentGender = 'FEMALE'; continue }

    if (/^\d+\s+\d{2}-\d{2}-\d{4}/.test(line.trim()) && currentBlock.trim()) {
      blocks.push({ text: currentBlock.trim(), gender: currentGender })
      currentBlock = line
    } else {
      currentBlock += ' ' + line
    }
  }
  if (currentBlock.trim()) blocks.push({ text: currentBlock.trim(), gender: currentGender })

  for (const block of blocks) {
    const parsed = parseKNBSBlock(block.text, block.gender)
    if (parsed) results.push(parsed)
  }

  return results
}

export async function parseKNBSBuffer(buffer: Buffer): Promise<KNBSProfileDraft[]> {
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)
  return parseKNBSText(data.text)
}
