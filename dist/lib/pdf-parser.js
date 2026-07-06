"use strict";
/**
 * PDF bulk profile parser
 * Expects a PDF with profiles in a structured format.
 *
 * Supported formats:
 * 1. Each profile block starts with "Name:" or a numbered entry
 * 2. Fields separated by newlines in "Label: Value" format
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePdfBuffer = parsePdfBuffer;
const FIELD_ALIASES = {
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
};
function parseGender(val) {
    const v = val.toLowerCase();
    if (v.includes('male') || v === 'm' || v === 'boy' || v === 'groom')
        return 'MALE';
    if (v.includes('female') || v === 'f' || v === 'girl' || v === 'bride')
        return 'FEMALE';
    return undefined;
}
function parseHeightCm(val) {
    // Accept "5'6", "5 feet 6 inches", "168 cm", "168"
    const cmMatch = val.match(/(\d+)\s*cm/i);
    if (cmMatch)
        return parseInt(cmMatch[1]);
    const ftIn = val.match(/(\d+)['\s](\d+)/);
    if (ftIn)
        return Math.round(parseInt(ftIn[1]) * 30.48 + parseInt(ftIn[2]) * 2.54);
    const feet = val.match(/(\d+)\s*(?:ft|feet)/);
    if (feet)
        return Math.round(parseInt(feet[1]) * 30.48);
    const num = parseInt(val);
    if (!isNaN(num) && num > 100 && num < 250)
        return num;
    return undefined;
}
function parseMangal(val) {
    const v = val.toLowerCase();
    if (v.includes('yes') || v.includes('manglik') || v === 'true')
        return true;
    if (v.includes('no') || v === 'false')
        return false;
    return undefined;
}
function parseFamilyType(val) {
    const v = val.toLowerCase();
    if (v.includes('joint'))
        return 'JOINT';
    if (v.includes('nuclear'))
        return 'NUCLEAR';
    if (v.includes('extended'))
        return 'EXTENDED';
    return undefined;
}
/**
 * Split PDF text into individual profile blocks.
 * Profiles are delimited by blank lines or "Profile N:" headers.
 */
function splitIntoBlocks(text) {
    // Try splitting by "Profile N:" headers
    const headerSplit = text.split(/\n(?=Profile\s+\d+\s*:|\d+\.\s+Name\s*:)/i);
    if (headerSplit.length > 1)
        return headerSplit.filter((b) => b.trim().length > 20);
    // Fall back to splitting by double blank lines
    return text.split(/\n{3,}/).filter((b) => b.trim().length > 20);
}
function parseBlock(raw) {
    const warnings = [];
    const draft = {};
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
        const colonIdx = line.indexOf(':');
        if (colonIdx === -1)
            continue;
        const label = line.slice(0, colonIdx).trim().toLowerCase();
        const value = line.slice(colonIdx + 1).trim();
        if (!value)
            continue;
        const field = FIELD_ALIASES[label];
        if (!field)
            continue;
        switch (field) {
            case 'gender':
                draft.gender = parseGender(value);
                break;
            case 'heightCm':
                draft.heightCm = parseHeightCm(value);
                break;
            case 'mangalDosha':
                draft.mangalDosha = parseMangal(value);
                break;
            case 'familyType':
                draft.familyType = parseFamilyType(value);
                break;
            case 'annualIncomeLpa':
                draft.annualIncomeLpa = parseFloat(value.replace(/[^0-9.]/g, '')) || undefined;
                break;
            default:
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ;
                draft[field] = value;
        }
    }
    // Compute confidence
    const required = ['name', 'gender', 'dateOfBirth', 'nakshatra', 'caste'];
    const present = required.filter((k) => Boolean(draft[k])).length;
    const parseConfidence = present === 5 ? 'HIGH' : present >= 3 ? 'MEDIUM' : 'LOW';
    if (!draft.name)
        warnings.push('Name not found');
    if (!draft.gender)
        warnings.push('Gender not found');
    if (!draft.dateOfBirth)
        warnings.push('Date of birth not found');
    if (!draft.nakshatra)
        warnings.push('Nakshatra (birth star) not found');
    if (!draft.caste)
        warnings.push('Caste not found');
    return { ...draft, rawText: raw, parseConfidence, warnings };
}
async function parsePdfBuffer(buffer) {
    const pdfParse = (await Promise.resolve().then(() => __importStar(require('pdf-parse')))).default;
    const data = await pdfParse(buffer);
    const { isNKTFormat, parseNKTText } = await Promise.resolve().then(() => __importStar(require('./nkt-parser')));
    if (isNKTFormat(data.text))
        return parseNKTText(data.text);
    const { parseKNBSText } = await Promise.resolve().then(() => __importStar(require('./knbs-parser')));
    // KNBS format has numbered entries like "1 12-05-1990"
    if (/^\d+\s+\d{2}-\d{2}-\d{4}/m.test(data.text)) {
        const knbsDrafts = parseKNBSText(data.text);
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
            rawText: d.rawText, parseConfidence: 'MEDIUM', warnings: [],
            profileSource: 'KNBS',
        }));
    }
    const blocks = splitIntoBlocks(data.text);
    return blocks.map(b => ({ ...parseBlock(b), profileSource: 'PDF' }));
}
