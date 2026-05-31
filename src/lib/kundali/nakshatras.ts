// 27 Nakshatras with their complete astrological properties
// Source: BPHS (Brihat Parashara Hora Shastra) — standard South/North Indian system

export type NadiType = 'ADI' | 'MADHYA' | 'ANTYA'
export type GanaType = 'DEVA' | 'MANUSHYA' | 'RAKSHASA'
export type VarnaType = 'BRAHMIN' | 'KSHATRIYA' | 'VAISHYA' | 'SHUDRA'
export type YoniAnimal =
  | 'ASHWA'    // Horse
  | 'GAJA'     // Elephant
  | 'MESHA'    // Ram/Sheep
  | 'SARPA'    // Snake
  | 'SHWANA'   // Dog
  | 'MARJARA'  // Cat
  | 'MUSHAKA'  // Rat/Mouse
  | 'GAU'      // Cow
  | 'MAHISHA'  // Buffalo
  | 'VYAGHRA'  // Tiger
  | 'MRIGA'    // Deer
  | 'VANARA'   // Monkey
  | 'NAKULA'   // Mongoose
  | 'SIMHA'    // Lion

export type GrahaLord =
  | 'KETU' | 'SHUKRA' | 'RAVI' | 'CHANDRA' | 'MANGAL'
  | 'RAHU' | 'GURU' | 'SHANI' | 'BUDHA'

export interface Nakshatra {
  index: number       // 1-27
  name: string        // English name
  nameDevanagari: string
  lord: GrahaLord
  gana: GanaType
  nadi: NadiType
  yoni: YoniAnimal
  rashi: string       // Zodiac sign
  varna: VarnaType
  vasya: VasyaType
}

export type VasyaType = 'MANUSHYA' | 'CHATUSHPAD' | 'JALACHARA' | 'VANCHAR' | 'KEET'

export const NAKSHATRAS: Nakshatra[] = [
  { index: 1,  name: 'Ashwini',           nameDevanagari: 'अश्विनी',        lord: 'KETU',    gana: 'DEVA',      nadi: 'ADI',    yoni: 'ASHWA',   rashi: 'Mesha',     varna: 'VAISHYA',    vasya: 'CHATUSHPAD' },
  { index: 2,  name: 'Bharani',           nameDevanagari: 'भरणी',           lord: 'SHUKRA',  gana: 'MANUSHYA',  nadi: 'MADHYA', yoni: 'GAJA',    rashi: 'Mesha',     varna: 'KSHATRIYA',  vasya: 'CHATUSHPAD' },
  { index: 3,  name: 'Krittika',          nameDevanagari: 'कृत्तिका',       lord: 'RAVI',    gana: 'RAKSHASA',  nadi: 'ANTYA',  yoni: 'MESHA',   rashi: 'Mesha',     varna: 'BRAHMIN',    vasya: 'CHATUSHPAD' },
  { index: 4,  name: 'Rohini',            nameDevanagari: 'रोहिणी',         lord: 'CHANDRA', gana: 'MANUSHYA',  nadi: 'ANTYA',  yoni: 'SARPA',   rashi: 'Vrishabha', varna: 'SHUDRA',     vasya: 'CHATUSHPAD' },
  { index: 5,  name: 'Mrigashira',        nameDevanagari: 'मृगशिरा',        lord: 'MANGAL',  gana: 'DEVA',      nadi: 'MADHYA', yoni: 'SARPA',   rashi: 'Vrishabha', varna: 'VAISHYA',    vasya: 'CHATUSHPAD' },
  { index: 6,  name: 'Ardra',             nameDevanagari: 'आर्द्रा',         lord: 'RAHU',    gana: 'MANUSHYA',  nadi: 'ADI',    yoni: 'SHWANA',  rashi: 'Mithuna',   varna: 'KSHATRIYA',  vasya: 'MANUSHYA'   },
  { index: 7,  name: 'Punarvasu',         nameDevanagari: 'पुनर्वसु',        lord: 'GURU',    gana: 'DEVA',      nadi: 'ADI',    yoni: 'MARJARA', rashi: 'Mithuna',   varna: 'VAISHYA',    vasya: 'MANUSHYA'   },
  { index: 8,  name: 'Pushya',            nameDevanagari: 'पुष्य',           lord: 'SHANI',   gana: 'DEVA',      nadi: 'MADHYA', yoni: 'MESHA',   rashi: 'Karka',     varna: 'KSHATRIYA',  vasya: 'JALACHARA'  },
  { index: 9,  name: 'Ashlesha',          nameDevanagari: 'आश्लेषा',         lord: 'BUDHA',   gana: 'RAKSHASA',  nadi: 'ANTYA',  yoni: 'MARJARA', rashi: 'Karka',     varna: 'KSHATRIYA',  vasya: 'JALACHARA'  },
  { index: 10, name: 'Magha',             nameDevanagari: 'मघा',             lord: 'KETU',    gana: 'RAKSHASA',  nadi: 'ANTYA',  yoni: 'MUSHAKA', rashi: 'Simha',     varna: 'SHUDRA',     vasya: 'VANCHAR'    },
  { index: 11, name: 'Purva Phalguni',    nameDevanagari: 'पूर्व फाल्गुनी', lord: 'SHUKRA',  gana: 'MANUSHYA',  nadi: 'MADHYA', yoni: 'MUSHAKA', rashi: 'Simha',     varna: 'BRAHMIN',    vasya: 'VANCHAR'    },
  { index: 12, name: 'Uttara Phalguni',   nameDevanagari: 'उत्तर फाल्गुनी', lord: 'RAVI',    gana: 'MANUSHYA',  nadi: 'ADI',    yoni: 'GAU',     rashi: 'Simha',     varna: 'KSHATRIYA',  vasya: 'VANCHAR'    },
  { index: 13, name: 'Hasta',             nameDevanagari: 'हस्त',            lord: 'CHANDRA', gana: 'DEVA',      nadi: 'MADHYA', yoni: 'MAHISHA', rashi: 'Kanya',     varna: 'VAISHYA',    vasya: 'MANUSHYA'   },
  { index: 14, name: 'Chitra',            nameDevanagari: 'चित्रा',          lord: 'MANGAL',  gana: 'RAKSHASA',  nadi: 'MADHYA', yoni: 'VYAGHRA', rashi: 'Kanya',     varna: 'KSHATRIYA',  vasya: 'MANUSHYA'   },
  { index: 15, name: 'Swati',             nameDevanagari: 'स्वाति',          lord: 'RAHU',    gana: 'DEVA',      nadi: 'ANTYA',  yoni: 'MAHISHA', rashi: 'Tula',      varna: 'KSHATRIYA',  vasya: 'MANUSHYA'   },
  { index: 16, name: 'Vishakha',          nameDevanagari: 'विशाखा',          lord: 'GURU',    gana: 'RAKSHASA',  nadi: 'ANTYA',  yoni: 'VYAGHRA', rashi: 'Tula',      varna: 'KSHATRIYA',  vasya: 'MANUSHYA'   },
  { index: 17, name: 'Anuradha',          nameDevanagari: 'अनुराधा',         lord: 'SHANI',   gana: 'DEVA',      nadi: 'MADHYA', yoni: 'MRIGA',   rashi: 'Vrishchika',varna: 'SHUDRA',     vasya: 'KEET'       },
  { index: 18, name: 'Jyeshtha',          nameDevanagari: 'ज्येष्ठा',        lord: 'BUDHA',   gana: 'RAKSHASA',  nadi: 'ADI',    yoni: 'MRIGA',   rashi: 'Vrishchika',varna: 'KSHATRIYA',  vasya: 'KEET'       },
  { index: 19, name: 'Mula',              nameDevanagari: 'मूल',             lord: 'KETU',    gana: 'RAKSHASA',  nadi: 'ANTYA',  yoni: 'SHWANA',  rashi: 'Dhanu',     varna: 'KSHATRIYA',  vasya: 'CHATUSHPAD' },
  { index: 20, name: 'Purva Ashadha',     nameDevanagari: 'पूर्वाषाढ़ा',     lord: 'SHUKRA',  gana: 'MANUSHYA',  nadi: 'MADHYA', yoni: 'VANARA',  rashi: 'Dhanu',     varna: 'BRAHMIN',    vasya: 'CHATUSHPAD' },
  { index: 21, name: 'Uttara Ashadha',    nameDevanagari: 'उत्तराषाढ़ा',     lord: 'RAVI',    gana: 'MANUSHYA',  nadi: 'ANTYA',  yoni: 'NAKULA',  rashi: 'Dhanu',     varna: 'KSHATRIYA',  vasya: 'CHATUSHPAD' },
  { index: 22, name: 'Shravana',          nameDevanagari: 'श्रवण',           lord: 'CHANDRA', gana: 'DEVA',      nadi: 'ANTYA',  yoni: 'VANARA',  rashi: 'Makara',    varna: 'KSHATRIYA',  vasya: 'CHATUSHPAD' },
  { index: 23, name: 'Dhanishta',         nameDevanagari: 'धनिष्ठा',         lord: 'MANGAL',  gana: 'RAKSHASA',  nadi: 'MADHYA', yoni: 'SIMHA',   rashi: 'Makara',    varna: 'SHUDRA',     vasya: 'CHATUSHPAD' },
  { index: 24, name: 'Shatabhisha',       nameDevanagari: 'शतभिषा',          lord: 'RAHU',    gana: 'RAKSHASA',  nadi: 'ADI',    yoni: 'ASHWA',   rashi: 'Kumbha',    varna: 'KSHATRIYA',  vasya: 'JALACHARA'  },
  { index: 25, name: 'Purva Bhadrapada',  nameDevanagari: 'पूर्व भाद्रपदा',  lord: 'GURU',    gana: 'MANUSHYA',  nadi: 'ADI',    yoni: 'SIMHA',   rashi: 'Kumbha',    varna: 'BRAHMIN',    vasya: 'MANUSHYA'   },
  { index: 26, name: 'Uttara Bhadrapada', nameDevanagari: 'उत्तर भाद्रपदा',  lord: 'SHANI',   gana: 'MANUSHYA',  nadi: 'MADHYA', yoni: 'GAU',     rashi: 'Meena',     varna: 'KSHATRIYA',  vasya: 'JALACHARA'  },
  { index: 27, name: 'Revati',            nameDevanagari: 'रेवती',           lord: 'BUDHA',   gana: 'DEVA',      nadi: 'ANTYA',  yoni: 'GAJA',    rashi: 'Meena',     varna: 'SHUDRA',     vasya: 'JALACHARA'  },
]

export function getNakshatraByName(name: string): Nakshatra | undefined {
  const normalized = name.trim().toLowerCase()
  return NAKSHATRAS.find(
    (n) =>
      n.name.toLowerCase() === normalized ||
      n.nameDevanagari === name.trim()
  )
}

export function getNakshatraByIndex(index: number): Nakshatra | undefined {
  return NAKSHATRAS.find((n) => n.index === index)
}

export const NAKSHATRA_NAMES = NAKSHATRAS.map((n) => n.name)

// Planet friendship table: lord1 → lord2 → relationship
type PlanetRelation = 'FRIEND' | 'NEUTRAL' | 'ENEMY'
const PLANET_FRIENDSHIPS: Record<GrahaLord, Record<GrahaLord, PlanetRelation>> = {
  RAVI:    { RAVI: 'NEUTRAL', CHANDRA: 'FRIEND',  MANGAL: 'FRIEND',  BUDHA: 'NEUTRAL', GURU: 'FRIEND',  SHUKRA: 'ENEMY',  SHANI: 'ENEMY',  RAHU: 'ENEMY',  KETU: 'ENEMY'  },
  CHANDRA: { RAVI: 'FRIEND',  CHANDRA: 'NEUTRAL', MANGAL: 'NEUTRAL', BUDHA: 'FRIEND',  GURU: 'FRIEND',  SHUKRA: 'NEUTRAL',SHANI: 'NEUTRAL',RAHU: 'ENEMY',  KETU: 'ENEMY'  },
  MANGAL:  { RAVI: 'FRIEND',  CHANDRA: 'NEUTRAL', MANGAL: 'NEUTRAL', BUDHA: 'ENEMY',   GURU: 'FRIEND',  SHUKRA: 'NEUTRAL',SHANI: 'NEUTRAL',RAHU: 'NEUTRAL',KETU: 'NEUTRAL'},
  BUDHA:   { RAVI: 'FRIEND',  CHANDRA: 'NEUTRAL', MANGAL: 'NEUTRAL', BUDHA: 'NEUTRAL', GURU: 'NEUTRAL', SHUKRA: 'FRIEND', SHANI: 'NEUTRAL',RAHU: 'NEUTRAL',KETU: 'NEUTRAL'},
  GURU:    { RAVI: 'FRIEND',  CHANDRA: 'FRIEND',  MANGAL: 'FRIEND',  BUDHA: 'ENEMY',   GURU: 'NEUTRAL', SHUKRA: 'ENEMY',  SHANI: 'NEUTRAL',RAHU: 'ENEMY',  KETU: 'NEUTRAL'},
  SHUKRA:  { RAVI: 'ENEMY',   CHANDRA: 'NEUTRAL', MANGAL: 'NEUTRAL', BUDHA: 'FRIEND',  GURU: 'NEUTRAL', SHUKRA: 'NEUTRAL',SHANI: 'FRIEND', RAHU: 'FRIEND', KETU: 'NEUTRAL'},
  SHANI:   { RAVI: 'ENEMY',   CHANDRA: 'ENEMY',   MANGAL: 'ENEMY',   BUDHA: 'FRIEND',  GURU: 'NEUTRAL', SHUKRA: 'FRIEND', SHANI: 'NEUTRAL',RAHU: 'FRIEND', KETU: 'NEUTRAL'},
  RAHU:    { RAVI: 'ENEMY',   CHANDRA: 'ENEMY',   MANGAL: 'NEUTRAL', BUDHA: 'FRIEND',  GURU: 'ENEMY',   SHUKRA: 'FRIEND', SHANI: 'FRIEND', RAHU: 'NEUTRAL',KETU: 'NEUTRAL'},
  KETU:    { RAVI: 'NEUTRAL', CHANDRA: 'NEUTRAL', MANGAL: 'FRIEND',  BUDHA: 'NEUTRAL', GURU: 'FRIEND',  SHUKRA: 'NEUTRAL',SHANI: 'NEUTRAL',RAHU: 'NEUTRAL',KETU: 'NEUTRAL'},
}

export function getPlanetRelation(lord1: GrahaLord, lord2: GrahaLord): PlanetRelation {
  return PLANET_FRIENDSHIPS[lord1][lord2]
}

// Yoni compatibility matrix
type YoniRelation = 'SAME' | 'FRIENDLY' | 'NEUTRAL' | 'ENEMY'
const YONI_FRIENDSHIPS: Partial<Record<YoniAnimal, Record<YoniAnimal, YoniRelation>>> = {
  ASHWA:   { ASHWA: 'SAME', GAJA: 'NEUTRAL', MESHA: 'NEUTRAL', SARPA: 'NEUTRAL', SHWANA: 'NEUTRAL', MARJARA: 'NEUTRAL', MUSHAKA: 'NEUTRAL', GAU: 'NEUTRAL',  MAHISHA: 'ENEMY',   VYAGHRA: 'NEUTRAL', MRIGA: 'NEUTRAL', VANARA: 'NEUTRAL', NAKULA: 'NEUTRAL', SIMHA: 'NEUTRAL' },
  GAJA:    { ASHWA: 'NEUTRAL', GAJA: 'SAME', MESHA: 'NEUTRAL', SARPA: 'NEUTRAL', SHWANA: 'NEUTRAL', MARJARA: 'NEUTRAL', MUSHAKA: 'NEUTRAL', GAU: 'FRIENDLY', MAHISHA: 'NEUTRAL', VYAGHRA: 'NEUTRAL', MRIGA: 'NEUTRAL', VANARA: 'NEUTRAL', NAKULA: 'NEUTRAL', SIMHA: 'ENEMY'   },
  MESHA:   { ASHWA: 'NEUTRAL', GAJA: 'NEUTRAL', MESHA: 'SAME', SARPA: 'NEUTRAL', SHWANA: 'NEUTRAL', MARJARA: 'NEUTRAL', MUSHAKA: 'NEUTRAL', GAU: 'NEUTRAL',  MAHISHA: 'NEUTRAL', VYAGHRA: 'NEUTRAL', MRIGA: 'NEUTRAL', VANARA: 'FRIENDLY',NAKULA: 'NEUTRAL', SIMHA: 'NEUTRAL' },
  SARPA:   { ASHWA: 'NEUTRAL', GAJA: 'NEUTRAL', MESHA: 'NEUTRAL', SARPA: 'SAME', SHWANA: 'NEUTRAL', MARJARA: 'NEUTRAL', MUSHAKA: 'NEUTRAL', GAU: 'NEUTRAL',  MAHISHA: 'NEUTRAL', VYAGHRA: 'NEUTRAL', MRIGA: 'FRIENDLY',VANARA: 'NEUTRAL', NAKULA: 'ENEMY',   SIMHA: 'NEUTRAL' },
  SHWANA:  { ASHWA: 'NEUTRAL', GAJA: 'NEUTRAL', MESHA: 'NEUTRAL', SARPA: 'NEUTRAL', SHWANA: 'SAME', MARJARA: 'NEUTRAL', MUSHAKA: 'NEUTRAL', GAU: 'NEUTRAL',  MAHISHA: 'NEUTRAL', VYAGHRA: 'NEUTRAL', MRIGA: 'ENEMY',   VANARA: 'NEUTRAL', NAKULA: 'FRIENDLY', SIMHA: 'NEUTRAL' },
  MARJARA: { ASHWA: 'NEUTRAL', GAJA: 'NEUTRAL', MESHA: 'NEUTRAL', SARPA: 'NEUTRAL', SHWANA: 'NEUTRAL', MARJARA: 'SAME', MUSHAKA: 'ENEMY',   GAU: 'NEUTRAL',  MAHISHA: 'NEUTRAL', VYAGHRA: 'NEUTRAL', MRIGA: 'NEUTRAL', VANARA: 'NEUTRAL', NAKULA: 'NEUTRAL', SIMHA: 'NEUTRAL' },
  MUSHAKA: { ASHWA: 'NEUTRAL', GAJA: 'NEUTRAL', MESHA: 'NEUTRAL', SARPA: 'NEUTRAL', SHWANA: 'NEUTRAL', MARJARA: 'ENEMY', MUSHAKA: 'SAME',   GAU: 'NEUTRAL',  MAHISHA: 'NEUTRAL', VYAGHRA: 'NEUTRAL', MRIGA: 'NEUTRAL', VANARA: 'NEUTRAL', NAKULA: 'ENEMY',   SIMHA: 'NEUTRAL' },
  GAU:     { ASHWA: 'NEUTRAL', GAJA: 'FRIENDLY',MESHA: 'NEUTRAL', SARPA: 'NEUTRAL', SHWANA: 'NEUTRAL', MARJARA: 'NEUTRAL',MUSHAKA: 'NEUTRAL', GAU: 'SAME',   MAHISHA: 'NEUTRAL', VYAGHRA: 'ENEMY',   MRIGA: 'NEUTRAL', VANARA: 'NEUTRAL', NAKULA: 'NEUTRAL', SIMHA: 'ENEMY'   },
  MAHISHA: { ASHWA: 'ENEMY',   GAJA: 'NEUTRAL', MESHA: 'NEUTRAL', SARPA: 'NEUTRAL', SHWANA: 'NEUTRAL', MARJARA: 'NEUTRAL',MUSHAKA: 'NEUTRAL', GAU: 'NEUTRAL', MAHISHA: 'SAME',   VYAGHRA: 'ENEMY',   MRIGA: 'NEUTRAL', VANARA: 'NEUTRAL', NAKULA: 'NEUTRAL', SIMHA: 'NEUTRAL' },
  VYAGHRA: { ASHWA: 'NEUTRAL', GAJA: 'NEUTRAL', MESHA: 'NEUTRAL', SARPA: 'NEUTRAL', SHWANA: 'NEUTRAL', MARJARA: 'NEUTRAL',MUSHAKA: 'NEUTRAL', GAU: 'ENEMY',   MAHISHA: 'ENEMY',  VYAGHRA: 'SAME',    MRIGA: 'ENEMY',   VANARA: 'NEUTRAL', NAKULA: 'NEUTRAL', SIMHA: 'NEUTRAL' },
  MRIGA:   { ASHWA: 'NEUTRAL', GAJA: 'NEUTRAL', MESHA: 'NEUTRAL', SARPA: 'FRIENDLY',SHWANA: 'ENEMY',   MARJARA: 'NEUTRAL',MUSHAKA: 'NEUTRAL', GAU: 'NEUTRAL', MAHISHA: 'NEUTRAL', VYAGHRA: 'ENEMY',   MRIGA: 'SAME',    VANARA: 'NEUTRAL', NAKULA: 'NEUTRAL', SIMHA: 'NEUTRAL' },
  VANARA:  { ASHWA: 'NEUTRAL', GAJA: 'NEUTRAL', MESHA: 'FRIENDLY',SARPA: 'NEUTRAL', SHWANA: 'NEUTRAL', MARJARA: 'NEUTRAL',MUSHAKA: 'NEUTRAL', GAU: 'NEUTRAL', MAHISHA: 'NEUTRAL', VYAGHRA: 'NEUTRAL', MRIGA: 'NEUTRAL', VANARA: 'SAME',    NAKULA: 'NEUTRAL', SIMHA: 'NEUTRAL' },
  NAKULA:  { ASHWA: 'NEUTRAL', GAJA: 'NEUTRAL', MESHA: 'NEUTRAL', SARPA: 'ENEMY',   SHWANA: 'FRIENDLY',MARJARA: 'NEUTRAL',MUSHAKA: 'ENEMY',   GAU: 'NEUTRAL', MAHISHA: 'NEUTRAL', VYAGHRA: 'NEUTRAL', MRIGA: 'NEUTRAL', VANARA: 'NEUTRAL', NAKULA: 'SAME',    SIMHA: 'NEUTRAL' },
  SIMHA:   { ASHWA: 'NEUTRAL', GAJA: 'ENEMY',   MESHA: 'NEUTRAL', SARPA: 'NEUTRAL', SHWANA: 'NEUTRAL', MARJARA: 'NEUTRAL',MUSHAKA: 'NEUTRAL', GAU: 'ENEMY',   MAHISHA: 'NEUTRAL', VYAGHRA: 'NEUTRAL', MRIGA: 'NEUTRAL', VANARA: 'NEUTRAL', NAKULA: 'NEUTRAL', SIMHA: 'SAME'   },
}

export function getYoniRelation(y1: YoniAnimal, y2: YoniAnimal): YoniRelation {
  return (YONI_FRIENDSHIPS[y1]?.[y2] ?? YONI_FRIENDSHIPS[y2]?.[y1]) || 'NEUTRAL'
}

// Vasya compatibility
const VASYA_MATRIX: Record<VasyaType, Record<VasyaType, number>> = {
  MANUSHYA:   { MANUSHYA: 2, CHATUSHPAD: 1, JALACHARA: 0, VANCHAR: 1, KEET: 1 },
  CHATUSHPAD: { MANUSHYA: 1, CHATUSHPAD: 2, JALACHARA: 1, VANCHAR: 1, KEET: 0 },
  JALACHARA:  { MANUSHYA: 1, CHATUSHPAD: 1, JALACHARA: 2, VANCHAR: 1, KEET: 1 },
  VANCHAR:    { MANUSHYA: 0, CHATUSHPAD: 0, JALACHARA: 1, VANCHAR: 2, KEET: 1 },
  KEET:       { MANUSHYA: 0, CHATUSHPAD: 0, JALACHARA: 0, VANCHAR: 0, KEET: 2 },
}

export function getVasyaScore(v1: VasyaType, v2: VasyaType): number {
  return VASYA_MATRIX[v1][v2]
}
