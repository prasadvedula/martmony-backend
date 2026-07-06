/**
 * PDF bulk profile parser
 * Expects a PDF with profiles in a structured format.
 *
 * Supported formats:
 * 1. Each profile block starts with "Name:" or a numbered entry
 * 2. Fields separated by newlines in "Label: Value" format
 */

interface ProfileFormData {
  name: string
  gender: 'MALE' | 'FEMALE'
  dateOfBirth: string
  birthTime?: string
  birthPlace: string
  currentCity?: string
  currentState?: string
  caste: string
  subCaste?: string
  sakha?: string
  gotram?: string
  nakshatra: string
  rashi?: string
  mangalDosha?: boolean
  surname?: string
  heightCm?: number
  education?: string
  occupation?: string
  annualIncomeLpa?: number
  fatherName?: string
  motherName?: string
  familyType?: 'JOINT' | 'NUCLEAR' | 'EXTENDED'
  contactEmail?: string
  contactPhone?: string
}

export interface ParsedProfileDraft extends Partial<ProfileFormData> {
  rawText: string
  parseConfidence: 'HIGH' | 'MEDIUM' | 'LOW'
  warnings: string[]
  // Extended fields used by NKT/structured parsers
  surname?: string
  sakha?: string
  prefAgeMin?: number
  prefAgeMax?: number
  prefStates?: string[]
  profileSource?: 'NKT' | 'KNBS' | 'PDF' | 'SELF_REG'
}

type FieldMap = Record<string, keyof ProfileFormData>

const FIELD_ALIASES: FieldMap = {
  'name': 'name',
  'full name': 'name',
  'bride name': 'name',
  'groom name': 'name',
  'gender': 'gender',
  'sex': 'gender',
  'dob': 'dateOfBirth',
  'date of birth': 'dateOfBirth',
  'birth date': 'dateOfBirth',
  'birth time': 'birthTime',
  'time of birth': 'birthTime',
  'place of birth': 'birthPlace',
  'birth place': 'birthPlace',
  'city': 'currentCity',
  'current city': 'currentCity',
  'state': 'currentState',
  'current state': 'currentState',
  'caste': 'caste',
  'community': 'caste',
  'sub caste': 'subCaste',
  'sub-caste': 'subCaste',
  'subcaste': 'subCaste',
  'sakha': 'sakha',
  'shakha': 'sakha',
  'gotram': 'gotram',
  'gotra': 'gotram',
  'nakshatra': 'nakshatra',
  'birth star': 'nakshatra',
  'star': 'nakshatra',
  'rashi': 'rashi',
  'moon sign': 'rashi',
  'raashi': 'rashi',
  'mangal': 'mangalDosha',
  'manglik': 'mangalDosha',
  'mangal dosha': 'mangalDosha',
  'surname': 'surname',
  'last name': 'surname',
  'height': 'heightCm',
  'education': 'education',
  'qualification': 'education',
  'occupation': 'occupation',
  'profession': 'occupation',
  'job': 'occupation',
  'income': 'annualIncomeLpa',
  'annual income': 'annualIncomeLpa',
  'father': 'fatherName',
  "father's name": 'fatherName',
  'mother': 'motherName',
  "mother's name": 'motherName',
  'email': 'contactEmail',
  'contact email': 'contactEmail',
  'phone': 'contactPhone',
  'mobile': 'contactPhone',
  'contact': 'contactPhone',
  'family type': 'familyType',
  'family': 'familyType',
}

function parseGender(val: string): 'MALE' | 'FEMALE' | undefined {
  const v = val.toLowerCase()
  if (v.includes('male') || v === 'm' || v === 'boy' || v === 'groom') return 'MALE'
  if (v.includes('female') || v === 'f' || v === 'girl' || v === 'bride') return 'FEMALE'
  return undefined
}

function parseHeightCm(val: string): number | undefined {
  // Accept "5'6", "5 feet 6 inches", "168 cm", "168"
  const cmMatch = val.match(/(\d+)\s*cm/i)
  if (cmMatch) return parseInt(cmMatch[1])
  const ftIn = val.match(/(\d+)['\s](\d+)/)
  if (ftIn) return Math.round(parseInt(ftIn[1]) * 30.48 + parseInt(ftIn[2]) * 2.54)
  const feet = val.match(/(\d+)\s*(?:ft|feet)/)
  if (feet) return Math.round(parseInt(feet[1]) * 30.48)
  const num = parseInt(val)
  if (!isNaN(num) && num > 100 && num < 250) return num
  return undefined
}

function parseMangal(val: string): boolean | undefined {
  const v = val.toLowerCase()
  if (v.includes('yes') || v.includes('manglik') || v === 'true') return true
  if (v.includes('no') || v === 'false') return false
  return undefined
}

function parseFamilyType(val: string): 'JOINT' | 'NUCLEAR' | 'EXTENDED' | undefined {
  const v = val.toLowerCase()
  if (v.includes('joint')) return 'JOINT'
  if (v.includes('nuclear')) return 'NUCLEAR'
  if (v.includes('extended')) return 'EXTENDED'
  return undefined
}

/**
 * Split PDF text into individual profile blocks.
 * Profiles are delimited by blank lines or "Profile N:" headers.
 */
function splitIntoBlocks(text: string): string[] {
  // Try splitting by "Profile N:" headers
  const headerSplit = text.split(/\n(?=Profile\s+\d+\s*:|\d+\.\s+Name\s*:)/i)
  if (headerSplit.length > 1) return headerSplit.filter((b) => b.trim().length > 20)

  // Fall back to splitting by double blank lines
  return text.split(/\n{3,}/).filter((b) => b.trim().length > 20)
}

function parseBlock(raw: string): ParsedProfileDraft {
  const warnings: string[] = []
  const draft: Partial<ProfileFormData> = {}

  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean)

  for (const line of lines) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const label = line.slice(0, colonIdx).trim().toLowerCase()
    const value = line.slice(colonIdx + 1).trim()
    if (!value) continue

    const field = FIELD_ALIASES[label]
    if (!field) continue

    switch (field) {
      case 'gender':
        draft.gender = parseGender(value)
        break
      case 'heightCm':
        draft.heightCm = parseHeightCm(value)
        break
      case 'mangalDosha':
        draft.mangalDosha = parseMangal(value)
        break
      case 'familyType':
        draft.familyType = parseFamilyType(value)
        break
      case 'annualIncomeLpa':
        draft.annualIncomeLpa = parseFloat(value.replace(/[^0-9.]/g, '')) || undefined
        break
      default:
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(draft as any)[field] = value
    }
  }

  // Compute confidence
  const required: (keyof ProfileFormData)[] = ['name', 'gender', 'dateOfBirth', 'nakshatra', 'caste']
  const present = required.filter((k) => Boolean(draft[k])).length
  const parseConfidence: ParsedProfileDraft['parseConfidence'] =
    present === 5 ? 'HIGH' : present >= 3 ? 'MEDIUM' : 'LOW'

  if (!draft.name) warnings.push('Name not found')
  if (!draft.gender) warnings.push('Gender not found')
  if (!draft.dateOfBirth) warnings.push('Date of birth not found')
  if (!draft.nakshatra) warnings.push('Nakshatra (birth star) not found')
  if (!draft.caste) warnings.push('Caste not found')

  return { ...draft, rawText: raw, parseConfidence, warnings }
}

export async function parsePdfBuffer(buffer: Buffer): Promise<ParsedProfileDraft[]> {
  const pdfParse = (await import('pdf-parse')).default
  const data = await pdfParse(buffer)

  const { isNKTFormat, parseNKTText } = await import('./nkt-parser')
  if (isNKTFormat(data.text)) return parseNKTText(data.text)

  const { parseKNBSText } = await import('./knbs-parser')
  // KNBS format has numbered entries like "1 12-05-1990"
  if (/^\d+\s+\d{2}-\d{2}-\d{4}/m.test(data.text)) {
    const knbsDrafts = parseKNBSText(data.text)
    return knbsDrafts.map(d => ({
      name: d.name, gender: d.gender,
      dateOfBirth: d.dateOfBirth.toISOString(),
      birthTime: d.birthTime, birthPlace: 'Unknown',
      currentCity: d.currentCity, currentState: d.currentState,
      caste: d.caste, subCaste: d.subCaste, gotram: d.gotram,
      nakshatra: d.nakshatra,
      heightCm: d.heightCm, education: d.education,
      occupation: d.occupation, annualIncomeLpa: d.annualIncomeLpa,
      fatherName: d.fatherName, contactPhone: d.contactPhone,
      rawText: d.rawText, parseConfidence: 'MEDIUM' as const, warnings: [],
      profileSource: 'KNBS' as const,
    }))
  }

  const blocks = splitIntoBlocks(data.text)
  return blocks.map(b => ({ ...parseBlock(b), profileSource: 'PDF' as const }))
}
