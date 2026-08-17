/**
 * Run state: resources, traits, items, flags.
 *
 * Four resources define a life. Three are 0–100 gauges; capital is unbounded and
 * may go negative (debt). Hitting zero on health or sanity ends the run.
 */

import { makeRng, addressFrom, digest } from './rng.js';

export const RES_KEYS = ['health', 'sanity', 'career'];

export const TRAITS = {
  resilience: { he: 'חוסן', desc: 'מרכך נזק לבריאות' },
  charisma:   { he: 'כריזמה', desc: 'מגביר עלייה בקריירה' },
  luck:       { he: 'מזל', desc: 'מטה הגרלות לטובתך' },
  madness:    { he: 'טירוף', desc: 'עמידות לשפיות + בונוס degen' },
};

export const ITEMS = {
  insurance:   { he: 'פוליסת ביטוח', icon: '🧾' },
  carpet_shop: { he: 'חנות השטיחים', icon: '🏪' },
  burner_id:   { he: 'זהות בדויה', icon: '🪪' },
  bunker:      { he: 'בונקר', icon: '🕳️' },
  meds:        { he: 'תרופות מרשם', icon: '💊' },
  rifle:       { he: 'רובה ציד', icon: '🔫' },
  degree:      { he: 'תואר', icon: '🎓' },
  bike:        { he: 'אופנוע', icon: '🏍️' },
  ledger:      { he: 'ארנק קר', icon: '🔐' },
  dog:         { he: 'כלב', icon: '🐕' },
};

/** Derive the mint traits from the seed. Legacy adds a small inherited bonus. */
export function rollTraits(seed, legacy = null) {
  const rng = makeRng(`traits:${seed}`);
  const traits = {};
  for (const key of Object.keys(TRAITS)) traits[key] = rng.int(2, 9);
  if (legacy?.passdown && traits[legacy.passdown] != null) {
    traits[legacy.passdown] = Math.min(10, traits[legacy.passdown] + 1);
  }
  return traits;
}

export function createRun({ seed, path, mode, useTimer, legacy }) {
  const traits = rollTraits(seed, legacy);
  return {
    seed,
    path,                       // 'morty' | 'rick'
    mode,                       // 'solo' | 'hive'
    useTimer,
    tokenId: parseInt(digest('token', seed).slice(0, 6), 16) % 9000 + 1000,
    address: addressFrom(seed),
    traits,
    legacy,                     // inherited soulbound record, or null

    age: 0,
    chapter: 0,
    res: { health: 100, sanity: 100, career: 0 },
    capital: 0,
    multiplier: path === 'rick' ? 1.6 : 1.0,

    items: [],
    flags: new Set(),
    milestones: [],
    lifeLog: [],
    rolls: [],
    usedEvents: new Set(),
    firedCrises: new Set(),

    peakCareer: 0,
    peakCapital: 0,
    indecisions: 0,
    rawScore: 0,

    alive: true,
    ended: false,
    endReason: null,            // key into ENDINGS
    ending: null,
  };
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * Apply an effect bundle to the run, scaled by traits.
 * Returns the deltas that were actually applied (for the UI readout).
 */
export function applyEffects(run, eff = {}, opts = {}) {
  const t = run.traits;
  const applied = {};

  for (const key of RES_KEYS) {
    let d = eff[key] ?? 0;
    if (!d) continue;

    if (d < 0 && key === 'health') d *= 1 - (t.resilience - 5) * 0.05;
    if (d < 0 && key === 'sanity') d *= 1 - (t.madness - 5) * 0.05;
    if (d > 0 && key === 'career') d *= 1 + (t.charisma - 5) * 0.06;

    d = Math.round(d);
    if (!d) continue;
    const before = run.res[key];
    run.res[key] = clamp(before + d, 0, 100);
    applied[key] = run.res[key] - before;
  }

  if (eff.capital) {
    let d = eff.capital;
    if (d > 0) d *= 1 + (t.charisma - 5) * 0.04;
    d = Math.round(d);
    run.capital += d;
    applied.capital = d;
  }

  if (eff.mult) {
    const bonus = opts.tag === 'degen' ? 1 + (t.madness - 5) * 0.06 : 1;
    run.multiplier = Math.round((run.multiplier + eff.mult * bonus) * 100) / 100;
    applied.mult = eff.mult;
  }

  run.peakCareer = Math.max(run.peakCareer, run.res.career);
  run.peakCapital = Math.max(run.peakCapital, run.capital);
  return applied;
}

export function giveItem(run, id) {
  if (id && !run.items.includes(id)) run.items.push(id);
}

export function takeItem(run, id) {
  const i = run.items.indexOf(id);
  if (i >= 0) run.items.splice(i, 1);
}

export function hasItem(run, id) {
  return run.items.includes(id);
}

/** Are the requirements of a choice met? Returns null if fine, else a reason. */
export function checkNeeds(run, needs) {
  if (!needs) return null;
  if (needs.item && !hasItem(run, needs.item)) return `דורש ${ITEMS[needs.item]?.he ?? needs.item}`;
  if (needs.capital != null && run.capital < needs.capital) return `דורש $${needs.capital.toLocaleString('en-US')}`;
  if (needs.career != null && run.res.career < needs.career) return `דורש קריירה ${needs.career}`;
  if (needs.flag && !run.flags.has(needs.flag)) return 'לא זמין בריצה הזאת';
  return null;
}
