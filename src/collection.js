/**
 * האוסף שלי — the collection.
 *
 * Rogue-lites live or die on the reason to start a second run. Achievements are
 * permanent (they survive permadeath, the character doesn't) and are what makes
 * the two paths worth replaying against each other.
 */

import { chain } from './chain.js';

export const ACHIEVEMENTS = [
  { id: 'first_run',  icon: '🕹️', name: 'הכנסת מטבע',        desc: 'סיים ריצה אחת.',                       rarity: 'common',
    test: () => true },
  { id: 'survivor',   icon: '🎗️', name: 'ניצול',              desc: 'שרוד את האבחנה בגיל 30.',              rarity: 'uncommon',
    test: (r) => r.flags.has('survivor') },
  { id: 'miracle',    icon: '✨', name: 'הנס',                desc: 'ותר על טיפול — וחיה.',                 rarity: 'legendary',
    test: (r) => r.flags.has('miracle') },
  { id: 'offgrid',    icon: '🛰️', name: 'מחוץ לרשת',          desc: 'שרוף את ה־SSN או קנה את הקרקע.',        rarity: 'rare',
    test: (r) => r.flags.has('off_grid') },
  { id: 'carpet',     icon: '🏪', name: 'בעל חנות השטיחים',    desc: 'קנה את החנות והפוך לבעלים.',            rarity: 'uncommon',
    test: (r) => r.flags.has('owner') },
  { id: 'family',     icon: '👨‍👧', name: 'משפחה',              desc: 'התחתן וגם הבאת ילדים.',                 rarity: 'common',
    test: (r) => r.flags.has('married') && r.flags.has('kids') },
  { id: 'grandpa',    icon: '👴', name: 'סבא',                desc: 'הגע לנכד הראשון והיה נוכח.',            rarity: 'uncommon',
    test: (r) => r.milestones.some((m) => m.name === 'סבא') },
  { id: 'whale',      icon: '🐋', name: 'לווייתן',            desc: 'עבור מיליון דולר בהון.',                rarity: 'rare',
    test: (r) => r.peakCapital >= 1_000_000 },
  { id: 'broke',      icon: '📉', name: 'אפס מוחלט',           desc: 'סיים ריצה במינוס.',                     rarity: 'common',
    test: (r) => r.capital < 0 },
  { id: 'hero',       icon: '🚒', name: 'גיבור',              desc: 'הצל חיים של מישהו אחר.',                rarity: 'uncommon',
    test: (r) => r.milestones.some((m) => m.name === 'גיבור') },
  { id: 'old',        icon: '🕰️', name: 'זקנה מופלגת',        desc: 'הגע לגיל 90.',                          rarity: 'rare',
    test: (r) => r.age >= 90 },
  { id: 'young',      icon: '💀', name: 'קצר מדי',            desc: 'מות לפני גיל 35.',                      rarity: 'common',
    test: (r) => r.age < 35 && r.endReason !== 'retire' },
  { id: 'awake',      icon: '🎮', name: 'ההתעוררות',          desc: 'איבד שפיות עד האפס.',                   rarity: 'rare',
    test: (r) => r.endReason === 'sanity' },
  { id: 'retire',     icon: '🌅', name: 'פרישה בכבוד',        desc: 'סיים ריצה בפרישה מרצון.',               rarity: 'uncommon',
    test: (r) => r.endReason === 'retire' },
  { id: 'mult3',      icon: '🔥', name: 'מכפיל ×3',           desc: 'הגע למכפיל 3.0 ומעלה.',                 rarity: 'rare',
    test: (r) => r.multiplier >= 3 },
  { id: 'score4k',    icon: '🏆', name: 'דירוג S',            desc: 'סיים עם 4,000 נקודות ומעלה.',           rarity: 'legendary',
    test: (r, s) => s.total >= 4000 },
  { id: 'hive',       icon: '🧠', name: 'Roy 2: Dave',        desc: 'סיים ריצה במצב תודעת נחיל.',            rarity: 'uncommon',
    test: (r) => r.mode === 'hive' },
  { id: 'rick_run',   icon: '🧪', name: 'מסלול ריק',           desc: 'סיים ריצה במסלול Degen.',               rarity: 'common',
    test: (r) => r.path === 'rick' },
  { id: 'morty_run',  icon: '🧥', name: 'מסלול מורטי',         desc: 'סיים ריצה במסלול Safe Yield.',          rarity: 'common',
    test: (r) => r.path === 'morty' },
  { id: 'clean',      icon: '🧘', name: 'ראש שקט',            desc: 'סיים עם שפיות 80 ומעלה.',               rarity: 'rare',
    test: (r) => r.res.sanity >= 80 },
  { id: 'stone',      icon: '🪨', name: 'ידיים יציבות',       desc: 'שרוד את הקריסה בלי למכור.',             rarity: 'uncommon',
    test: (r) => r.milestones.some((m) => m.name === 'ידיים יציבות') },
  { id: 'nodecide',   icon: '⏳', name: 'מי שלא מחליט',        desc: 'תן לשעון לרוץ שלוש פעמים בריצה אחת.',    rarity: 'common',
    test: (r) => r.indecisions >= 3 },
];

export const RARITY = {
  common:    { he: 'נפוץ',    color: '#7c8b9d' },
  uncommon:  { he: 'לא נפוץ', color: '#35d6ff' },
  rare:      { he: 'נדיר',    color: '#a97bff' },
  legendary: { he: 'אגדי',    color: '#ffb443' },
};

export function unlocked() {
  return new Set(chain.state.collection);
}

/** Evaluate a finished run and persist anything new. Returns the newly earned list. */
export function evaluate(run, score) {
  const have = unlocked();
  const fresh = ACHIEVEMENTS.filter((a) => !have.has(a.id) && safeTest(a, run, score));
  if (fresh.length) {
    chain.state.collection = [...have, ...fresh.map((a) => a.id)];
    chain.save();
    chain.emit();
  }
  return fresh;
}

function safeTest(a, run, score) {
  try { return Boolean(a.test(run, score)); } catch { return false; }
}

export function progress() {
  return { have: unlocked().size, total: ACHIEVEMENTS.length };
}
