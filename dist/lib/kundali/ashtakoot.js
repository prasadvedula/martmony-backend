"use strict";
/**
 * Ashtakoot (8-factor) Kundali matching system
 * Maximum score: 36 points
 * Recommended minimum: 18 points for a compatible match
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkMangalDosha = checkMangalDosha;
exports.calculateAshtakoot = calculateAshtakoot;
const nakshatras_1 = require("./nakshatras");
// ─── 1. Varna (max 1) ────────────────────────────────────────────────────────
const VARNA_RANK = {
    BRAHMIN: 4,
    KSHATRIYA: 3,
    VAISHYA: 2,
    SHUDRA: 1,
};
function calcVarna(groom, bride) {
    const g = VARNA_RANK[groom.varna];
    const b = VARNA_RANK[bride.varna];
    const scored = g >= b ? 1 : 0;
    return {
        name: 'Varna',
        nameHindi: 'वर्ण',
        maxPoints: 1,
        scored,
        description: scored === 1
            ? `Groom's varna (${groom.varna}) is compatible with bride's varna (${bride.varna}).`
            : `Groom's varna (${groom.varna}) is lower than bride's varna (${bride.varna}) — inauspicious.`,
    };
}
// ─── 2. Vasya (max 2) ────────────────────────────────────────────────────────
function calcVasya(groom, bride) {
    const scored = (0, nakshatras_1.getVasyaScore)(groom.vasya, bride.vasya);
    return {
        name: 'Vasya',
        nameHindi: 'वश्य',
        maxPoints: 2,
        scored,
        description: `Groom vasya: ${groom.vasya}, Bride vasya: ${bride.vasya}. Score: ${scored}/2.`,
    };
}
// ─── 3. Tara (max 3) ─────────────────────────────────────────────────────────
// Counts stars from bride's to groom's nakshatra. If remainder/9 is 2,4,6,8 → inauspicious
const GOOD_REMAINDERS = new Set([1, 3, 5, 7]); // odd remainders are auspicious
function taraRemainder(from, to) {
    const diff = ((to - from + 27) % 27) + 1;
    return diff % 9 === 0 ? 9 : diff % 9;
}
function calcTara(groom, bride) {
    const r1 = taraRemainder(bride.index, groom.index);
    const r2 = taraRemainder(groom.index, bride.index);
    const ok1 = GOOD_REMAINDERS.has(r1);
    const ok2 = GOOD_REMAINDERS.has(r2);
    let scored = 0;
    if (ok1 && ok2)
        scored = 3;
    else if (ok1 || ok2)
        scored = 1.5;
    else
        scored = 0;
    return {
        name: 'Tara',
        nameHindi: 'तारा',
        maxPoints: 3,
        scored,
        description: `Birth star compatibility (health & longevity). Bride→Groom remainder: ${r1} (${ok1 ? 'auspicious' : 'inauspicious'}), Groom→Bride: ${r2} (${ok2 ? 'auspicious' : 'inauspicious'}).`,
    };
}
// ─── 4. Yoni (max 4) ─────────────────────────────────────────────────────────
const YONI_POINTS = {
    SAME: 4,
    FRIENDLY: 3,
    NEUTRAL: 2,
    ENEMY: 0,
};
function calcYoni(groom, bride) {
    const relation = (0, nakshatras_1.getYoniRelation)(groom.yoni, bride.yoni);
    const scored = YONI_POINTS[relation] ?? 2;
    return {
        name: 'Yoni',
        nameHindi: 'योनि',
        maxPoints: 4,
        scored,
        description: `Physical/sexual compatibility. Groom yoni: ${groom.yoni}, Bride yoni: ${bride.yoni} — ${relation.toLowerCase()}.`,
    };
}
// ─── 5. Graha Maitri (max 5) ─────────────────────────────────────────────────
const GRAHA_POINTS = {
    FRIEND_FRIEND: 5,
    FRIEND_NEUTRAL: 4,
    NEUTRAL_FRIEND: 4,
    NEUTRAL_NEUTRAL: 3,
    FRIEND_ENEMY: 1,
    ENEMY_FRIEND: 1,
    NEUTRAL_ENEMY: 0.5,
    ENEMY_NEUTRAL: 0.5,
    ENEMY_ENEMY: 0,
};
function calcGrahaMaitri(groom, bride) {
    const r1 = (0, nakshatras_1.getPlanetRelation)(groom.lord, bride.lord);
    const r2 = (0, nakshatras_1.getPlanetRelation)(bride.lord, groom.lord);
    const key = `${r1}_${r2}`;
    const scored = GRAHA_POINTS[key] ?? 2.5;
    return {
        name: 'Graha Maitri',
        nameHindi: 'ग्रह मैत्री',
        maxPoints: 5,
        scored,
        description: `Mental compatibility. Groom lord: ${groom.lord} (${r1} to bride's lord), Bride lord: ${bride.lord} (${r2} to groom's lord).`,
    };
}
// ─── 6. Gana (max 6) ─────────────────────────────────────────────────────────
const GANA_POINTS = {
    DEVA: { DEVA: 6, MANUSHYA: 5, RAKSHASA: 1 },
    MANUSHYA: { DEVA: 5, MANUSHYA: 6, RAKSHASA: 0 },
    RAKSHASA: { DEVA: 1, MANUSHYA: 0, RAKSHASA: 6 },
};
function calcGana(groom, bride) {
    const scored = GANA_POINTS[groom.gana][bride.gana];
    return {
        name: 'Gana',
        nameHindi: 'गण',
        maxPoints: 6,
        scored,
        description: `Nature/temperament. Groom gana: ${groom.gana}, Bride gana: ${bride.gana}.`,
    };
}
// ─── 7. Bhakoot (max 7) ──────────────────────────────────────────────────────
// Based on rashi (moon sign) count from one to the other
const RASHI_ORDER = [
    'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
    'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];
// Inauspicious bhakoot positions (2-12, 12-2, 6-8, 8-6, 5-9, 9-5)
const INAUSPICIOUS = new Set(['2-12', '12-2', '6-8', '8-6', '5-9', '9-5']);
function rashiCount(from, to) {
    const fi = RASHI_ORDER.indexOf(from);
    const ti = RASHI_ORDER.indexOf(to);
    if (fi === -1 || ti === -1)
        return 0;
    return ((ti - fi + 12) % 12) + 1;
}
function calcBhakoot(groom, bride) {
    const g2b = rashiCount(groom.rashi, bride.rashi);
    const b2g = rashiCount(bride.rashi, groom.rashi);
    const key = `${g2b}-${b2g}`;
    const inauspicious = INAUSPICIOUS.has(key);
    const scored = inauspicious ? 0 : 7;
    return {
        name: 'Bhakoot',
        nameHindi: 'भकूट',
        maxPoints: 7,
        scored,
        description: `Financial & relationship compatibility. Groom rashi: ${groom.rashi} (${g2b} from bride's rashi), Bride rashi: ${bride.rashi}. ${inauspicious ? 'Bhakoot dosha present — inauspicious.' : 'Auspicious placement.'}`,
    };
}
// ─── 8. Nadi (max 8) ─────────────────────────────────────────────────────────
function calcNadi(groom, bride) {
    const same = groom.nadi === bride.nadi;
    const scored = same ? 0 : 8;
    return {
        name: 'Nadi',
        nameHindi: 'नाड़ी',
        maxPoints: 8,
        scored,
        description: same
            ? `⚠ Nadi Dosha: Both have ${groom.nadi} nadi — health issues for progeny are possible.`
            : `No Nadi Dosha. Groom nadi: ${groom.nadi}, Bride nadi: ${bride.nadi}.`,
    };
}
// ─── Mangal Dosha ─────────────────────────────────────────────────────────────
function checkMangalDosha(groomHasMangal, brideHasMangal) {
    if (groomHasMangal === null || brideHasMangal === null) {
        return {
            groomHasMangal,
            brideHasMangal,
            doshaPresent: false,
            doshaText: 'Mangal Dosha status not provided for one or both partners. Please verify birth charts.',
        };
    }
    if (!groomHasMangal && !brideHasMangal) {
        return { groomHasMangal, brideHasMangal, doshaPresent: false, doshaText: 'Neither partner has Mangal Dosha. Auspicious.' };
    }
    if (groomHasMangal && brideHasMangal) {
        return { groomHasMangal, brideHasMangal, doshaPresent: false, doshaText: 'Both partners have Mangal Dosha — doshas cancel each other. Auspicious.' };
    }
    const affected = groomHasMangal ? 'Groom' : 'Bride';
    return {
        groomHasMangal,
        brideHasMangal,
        doshaPresent: true,
        doshaText: `⚠ ${affected} has Mangal Dosha while the other does not. Consult a qualified astrologer. Remedies may be required.`,
    };
}
// ─── Main matching function ───────────────────────────────────────────────────
function calculateAshtakoot(groomNakshatraName, brideNakshatraName, groomMangal = null, brideMangal = null) {
    const groom = (0, nakshatras_1.getNakshatraByName)(groomNakshatraName);
    const bride = (0, nakshatras_1.getNakshatraByName)(brideNakshatraName);
    if (!groom || !bride) {
        throw new Error(`Nakshatra not found: ${!groom ? groomNakshatraName : brideNakshatraName}`);
    }
    const scores = [
        calcVarna(groom, bride),
        calcVasya(groom, bride),
        calcTara(groom, bride),
        calcYoni(groom, bride),
        calcGrahaMaitri(groom, bride),
        calcGana(groom, bride),
        calcBhakoot(groom, bride),
        calcNadi(groom, bride),
    ];
    const totalScore = scores.reduce((sum, s) => sum + s.scored, 0);
    const maxScore = 36;
    const percentage = Math.round((totalScore / maxScore) * 100);
    let recommendation;
    let recommendationText;
    if (totalScore >= 32) {
        recommendation = 'EXCELLENT';
        recommendationText = 'Excellent match! Highly compatible in all aspects.';
    }
    else if (totalScore >= 27) {
        recommendation = 'GOOD';
        recommendationText = 'Good match. Compatible on most factors.';
    }
    else if (totalScore >= 18) {
        recommendation = 'AVERAGE';
        recommendationText = 'Average match. Compatible but with some challenges. Consult an astrologer.';
    }
    else if (totalScore >= 12) {
        recommendation = 'BELOW_AVERAGE';
        recommendationText = 'Below average compatibility. Major challenges expected. Expert advice recommended.';
    }
    else {
        recommendation = 'POOR';
        recommendationText = 'Poor compatibility. Not recommended without expert astrological consultation.';
    }
    return {
        groomNakshatra: groom.name,
        brideNakshatra: bride.name,
        scores,
        totalScore,
        maxScore,
        percentage,
        recommendation,
        recommendationText,
        mangalDosha: checkMangalDosha(groomMangal, brideMangal),
    };
}
