"use strict";
/**
 * Parser for Daily Edition matrimonial PDF format.
 *
 * Format characteristics:
 * - 1 profile per page
 * - Bilingual: labels in English, some values in Telugu
 * - Block header: "DATE: DD-MM-YYYY --- ENROL ID :DAILY-XXXXXX"
 * - Fields: Name, Surname, DOB, Nakshatra, Kuja Dosham, Height, Education, Occupation, Phone, etc.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDailyEditionFormat = isDailyEditionFormat;
exports.parseDailyEditionText = parseDailyEditionText;
function parseDDMMYYYY(val) {
    const m = val.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!m)
        return undefined;
    return `${m[3]}-${m[2]}-${m[1]}`; // ISO YYYY-MM-DD
}
function parseHeight(val) {
    // "[ Height 5'5" ]" or "[ Height 5'2 ]" or "[ Height 5.5" ]"
    const ftIn = val.match(/(\d+)['.'](\d+)/);
    if (ftIn)
        return Math.round(parseInt(ftIn[1]) * 30.48 + parseInt(ftIn[2]) * 2.54);
    const cmMatch = val.match(/(\d{3})\s*cm/i);
    if (cmMatch)
        return parseInt(cmMatch[1]);
    return undefined;
}
function parseSalary(val) {
    if (!val || /student|studying|nil|no|home/i.test(val))
        return undefined;
    const lacPa = val.match(/([\d.]+)\s*Lac/i);
    if (lacPa)
        return parseFloat(lacPa[1]);
    const kPm = val.match(/([\d.]+)\s*K\s*(?:pm|p\.m)/i);
    if (kPm)
        return parseFloat(kPm[1]) * 12 / 100;
    return undefined;
}
function inferState(city) {
    const c = city.toLowerCase();
    if (c.match(/hyd|secunderabad|warangal|karimnagar|khammam|nalgonda|nizamabad|kukatpally|manikonda|ameerpet|dilsukh|alwal|nagole|boduppal|jeedimetla|miyapur|gachibowli|kondapur|madhapur/))
        return 'Telangana';
    if (c.match(/vijayawada|guntur|vizag|visakhapatnam|nellore|tirupati|tirupathi|eluru|nuziveedu|tenali|badvel|kadapa|ongole|kurnool|bhimavaram|rajahmundry|kakinada|anakapalli|srikakulam|chittoor|hindupur|anantapur|chintalapudi|pulivendula|cuddapah/))
        return 'Andhra Pradesh';
    if (c.match(/bangalore|bengaluru|mysore|mangalore/))
        return 'Karnataka';
    if (c.match(/chennai|coimbatore|madurai/))
        return 'Tamil Nadu';
    if (c.match(/mumbai|pune|nagpur/))
        return 'Maharashtra';
    if (c.match(/delhi|noida|gurgaon/))
        return 'Delhi';
    if (c.match(/usa|uk|london|australia|canada|singapore/))
        return 'Abroad';
    return undefined;
}
function extractNakshatra(raw) {
    // "JYESTA" → "Jyeshtha" normalization, "Danista. 4/ Sathabhisham 1" → "Dhanishta"
    // Just take the first word and capitalize properly
    const first = raw.split(/[\s,./\d]+/)[0].trim();
    if (!first)
        return raw.trim();
    // Common English nakshatra name normalizations
    const MAP = {
        JYESTA: 'Jyeshtha', JYESHTHA: 'Jyeshtha',
        SRAVANAM: 'Shravana', SRAVANA: 'Shravana', SHRAVANA: 'Shravana',
        DANISTA: 'Dhanishtha', DHANISTA: 'Dhanishtha', DHANISHTA: 'Dhanishtha',
        SATHABHISHAM: 'Shatabhisha', SATABHISHA: 'Shatabhisha',
        REVATHI: 'Revati', REVATI: 'Revati',
        ASHWINI: 'Ashwini', ASWINI: 'Ashwini',
        BHARANI: 'Bharani',
        KRITTIKA: 'Krittika', KRITHIKA: 'Krittika',
        ROHINI: 'Rohini',
        MRIGASHIRA: 'Mrigashira', MRUGASIRA: 'Mrigashira',
        ARDRA: 'Ardra',
        PUNARVASU: 'Punarvasu',
        PUSHYAMI: 'Pushya', PUSHYA: 'Pushya',
        ASLESHA: 'Ashlesha', ASHLESHA: 'Ashlesha',
        MAGHA: 'Magha', MAKHA: 'Magha',
        PUBBA: 'Purva Phalguni', PURVA: 'Purva Phalguni',
        UTTARA: 'Uttara Phalguni',
        HASTA: 'Hasta',
        CHITRA: 'Chitra', CHITTA: 'Chitra',
        SWATI: 'Swati', SWATHI: 'Swati',
        VISAKHA: 'Vishakha',
        ANURADHA: 'Anuradha',
        MOOLA: 'Mula', MULA: 'Mula',
        POORVASHADA: 'Purva Ashadha', PURVAASHADA: 'Purva Ashadha',
        UTTARASHADA: 'Uttara Ashadha',
        PURVABHADRA: 'Purva Bhadrapada',
        UTTARABHADRA: 'Uttara Bhadrapada',
    };
    const key = first.toUpperCase().replace(/[^A-Z]/g, '');
    return MAP[key] || (first.charAt(0).toUpperCase() + first.slice(1).toLowerCase());
}
function isDailyEditionFormat(text) {
    return /ENROL ID\s*:(?:DAILY|SUNDAY)/i.test(text) && /Nakshatram and Padam/i.test(text);
}
function parseDailyEditionText(text) {
    // Split on block headers
    const blocks = text.split(/(?=DATE:\s*\d{2}-\d{2}-\d{4}\s*---\s*ENROL ID)/i)
        .filter(b => b.trim().length > 80);
    return blocks.map(b => parseBlock(b)).filter((d) => d !== null);
}
function parseBlock(raw) {
    const warnings = [];
    // Gender
    let gender;
    if (/\bBride\b/i.test(raw) && !/\bBridegroom\b/i.test(raw))
        gender = 'FEMALE';
    else if (/\b(?:Bridegroom|Groom)\b/i.test(raw))
        gender = 'MALE';
    else if (/వరుని/.test(raw))
        gender = 'MALE';
    else if (/వధువు|వధ్ువు/.test(raw))
        gender = 'FEMALE';
    // Name (same line: "Name SOME NAME")
    const nameMatch = raw.match(/^Name\s+([A-Z][A-Z .'-]{1,50}?)\s*$/m);
    const name = nameMatch ? nameMatch[1].trim() : undefined;
    // Surname (same line after Telugu parenthetical)
    const surnameMatch = raw.match(/Surname\s*\([^)]*\)\s+([A-Z][A-Z .''-]{0,40}?)\s*$/m);
    const surname = surnameMatch ? surnameMatch[1].trim() : undefined;
    // DOB
    const dobMatch = raw.match(/DOB:\s*(\d{2}\/\d{2}\/\d{4})/i);
    const dateOfBirth = dobMatch ? parseDDMMYYYY(dobMatch[1]) : undefined;
    // Birth time
    const timeMatch = raw.match(/Time of Birth\s+([\d.:]+\s*(?:AM|PM|am|pm)?)/i);
    const birthTime = timeMatch ? timeMatch[1].trim() : undefined;
    // Birth place
    const placeMatch = raw.match(/Place of Birth\s+([A-Z][A-Z ,.\-]{1,50}?)\s*$/m);
    const birthPlace = placeMatch ? placeMatch[1].trim() : undefined;
    // Nakshatra — value on next non-empty line after "Nakshatram and Padam"
    const nakMatch = raw.match(/Nakshatram and Padam\s*\n+\s*([A-Za-z][\w\s./\d-]{0,50}?)\s*$/m);
    const nakshatra = nakMatch ? extractNakshatra(nakMatch[1]) : undefined;
    // Kuja Dosham (Mangal) — value on next line
    let mangalDosha;
    const kujaMatch = raw.match(/Kuja Dosham\s*\n+\s*([^\n]{1,60})/);
    if (kujaMatch) {
        const kv = kujaMatch[1].trim();
        if (/లేదు|no/i.test(kv))
            mangalDosha = false;
        else if (/ఉంది|ఉుంది|yes/i.test(kv))
            mangalDosha = true;
    }
    // Height from brackets
    const htMatch = raw.match(/\[\s*Height\s+([^\]]{2,20})\]/);
    const heightCm = htMatch ? parseHeight(htMatch[1]) : undefined;
    // Gotram — value on next line (Telugu text)
    const gotramMatch = raw.match(/Gothram\s*\n+\s*([^\n]{1,40})/);
    const gotramRaw = gotramMatch ? gotramMatch[1].trim() : undefined;
    // Store as-is (may be Telugu); if it's ASCII, great
    const gotram = gotramRaw && /[A-Za-z]/.test(gotramRaw) ? gotramRaw : gotramRaw;
    // Education — "Educational\nQualifications\n VALUE"
    const eduMatch = raw.match(/Educational\s*\n+\s*Qualifications\s*\n+\s*([^\n]{2,100})/i)
        || raw.match(/Educational Qualifications\s*\n+\s*([^\n]{2,100})/i);
    const education = eduMatch ? eduMatch[1].trim() : undefined;
    // Occupation — same line: "Job / Occupation VALUE"
    const occMatch = raw.match(/Job\s*\/\s*Occupation\s+([^\n]{2,80})/i);
    const occupation = occMatch ? occMatch[1].trim() : undefined;
    // Salary
    const salMatch = raw.match(/Salary\s*\/\s*Income\s+([^\n]{1,60})/i);
    const annualIncomeLpa = salMatch ? parseSalary(salMatch[1]) : undefined;
    // Phone
    const phoneMatch = raw.match(/Mobile\s+No\s*[–\-]\s*1\s*\[\s*(\d{10})\s*\]/);
    const altPhoneMatch = raw.match(/Alternative\s+No\.\s*\[\s*(\d{10})\s*\]/);
    const contactPhone = phoneMatch ? phoneMatch[1] : (altPhoneMatch ? altPhoneMatch[1] : undefined);
    // Area / City
    const cityMatch = raw.match(/Area\s+belongs\s+([A-Z][A-Za-z ,.\-]{1,60}?)\s*$/m);
    const currentCity = cityMatch ? cityMatch[1].trim() : undefined;
    // State — detect from Telugu text or infer from city
    let currentState;
    if (/ఆంధ్ర|ఆుంధ్ర/.test(raw))
        currentState = 'Andhra Pradesh';
    else if (/తెలంగాణ|తేలంగాణ|తెలంగాన/.test(raw))
        currentState = 'Telangana';
    else if (/కర్నాటక/.test(raw))
        currentState = 'Karnataka';
    else if (/తమిళనాడు/.test(raw))
        currentState = 'Tamil Nadu';
    else if (currentCity)
        currentState = inferState(currentCity);
    // Father name (strip age suffix)
    const fatherMatch = raw.match(/Father\s+Name\s*&\s*Age\s+(.+?)(?:,?\s*Age\s*:|$)/im);
    const fatherName = fatherMatch ? fatherMatch[1].trim().replace(/^Late\.?\s*/i, '') : undefined;
    // Mother name
    const motherMatch = raw.match(/Mother\s+Name\s*&\s*Age\s+(.+?)(?:,?\s*Age\s*:|$)/im);
    const motherName = motherMatch ? motherMatch[1].trim().replace(/^Late\.?\s*/i, '') : undefined;
    // Compute final name
    const fullName = name && surname ? `${name} ${surname}` : (name || surname);
    // Confidence
    const required = [fullName, gender, dateOfBirth, nakshatra, 'Brahmin'];
    const present = required.filter(Boolean).length;
    if (!fullName)
        warnings.push('Name not found');
    if (!gender)
        warnings.push('Gender not found');
    if (!dateOfBirth)
        warnings.push('Date of birth not found');
    if (!nakshatra)
        warnings.push('Nakshatra not found');
    const parseConfidence = present === 5 ? 'HIGH' : present >= 3 ? 'MEDIUM' : 'LOW';
    return {
        name: fullName || 'Unknown',
        surname,
        gender,
        dateOfBirth,
        birthTime,
        birthPlace: birthPlace || 'Unknown',
        caste: 'Brahmin',
        gotram,
        nakshatra: nakshatra || 'Unknown',
        mangalDosha,
        heightCm,
        education,
        occupation,
        annualIncomeLpa,
        contactPhone,
        fatherName,
        motherName,
        currentCity,
        currentState,
        rawText: raw,
        parseConfidence,
        warnings,
        profileSource: 'PDF',
    };
}
