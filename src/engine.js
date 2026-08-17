/**
 * Simulation engine.
 *
 * A run is a sequence of chapters. Each chapter draws an event, resolves one
 * choice, ages the character and checks for an ending. The player only *sees*
 * every Nth chapter — the pace setting decides how many chapters the RNG engine
 * resolves on its own between decisions ("ותן לגורל לעשות את השאר").
 */

import { EVENTS, ENDINGS, CRISIS_AGES, MAX_AGE } from './events.js';
import { applyEffects, giveItem, takeItem, checkNeeds, hasItem, ITEMS } from './state.js';
import { makeRng, digest } from './rng.js';

/** Fresh RNG stream for one specific roll, derived from seed + chapter + salt. */
function streamFor(run, salt) {
  return makeRng(`${run.seed}:${run.chapter}:${salt}`);
}

export function rollReceipt(run, salt) {
  return '0x' + digest(run.seed, run.chapter, salt).slice(0, 16);
}

/* ───────────────────────── event selection ───────────────────────── */

function eligible(run, ev) {
  if (run.usedEvents?.has(ev.id)) return false;
  if (ev.forced) return false;                                  // crises are scheduled, not drawn
  if (run.age < ev.stage[0] || run.age > ev.stage[1]) return false;
  if (ev.paths && !ev.paths.includes(run.path)) return false;
  if (ev.requires?.some((f) => !run.flags.has(f))) return false;
  if (ev.excludes?.some((f) => run.flags.has(f))) return false;
  return true;
}

/** Is a scheduled crisis due this chapter? */
function dueCrisis(run) {
  const fired = run.firedCrises;
  if (!fired.has('cancer') && run.age >= CRISIS_AGES.cancer) return 'cancer';
  if (!fired.has('crash') && run.age >= CRISIS_AGES.crash && run.path === 'morty') return 'crash';
  if (!fired.has('crash') && run.age >= CRISIS_AGES.crash - 6 && run.path === 'rick') return 'crash';
  if (!fired.has('debt') && run.capital < -40000) return 'debt';
  if (!fired.has('hunted') && run.flags.has('hunted')) return 'hunted';
  return null;
}

export function nextEvent(run, depth = 0) {
  const crisis = dueCrisis(run);
  if (crisis) {
    const ev = EVENTS.find((e) => e.forced === crisis);
    if (ev && (!ev.requires || ev.requires.every((f) => run.flags.has(f)))) {
      run.firedCrises.add(crisis);
      return ev;
    }
    run.firedCrises.add(crisis); // requirements unmet — never fires
  }

  const pool = EVENTS.filter((ev) => eligible(run, ev));
  if (pool.length) return streamFor(run, 'draw').weighted(pool, (ev) => ev.weight ?? 1);
  if (depth > 0) return null;

  // Nothing fits this exact age — let the quiet years pass and look again.
  const future = EVENTS.filter((ev) => !ev.forced && !run.usedEvents.has(ev.id)
    && ev.stage[0] > run.age
    && (!ev.paths || ev.paths.includes(run.path))
    && !ev.requires?.some((f) => !run.flags.has(f))
    && !ev.excludes?.some((f) => run.flags.has(f)));
  if (!future.length) return null;

  const jump = Math.min(...future.map((ev) => ev.stage[0]));
  const years = jump - run.age;
  run.age = jump;
  ageDecay(run, years);
  if (run.res.health <= 0 || run.res.sanity <= 0 || run.age >= MAX_AGE) return null;
  return nextEvent(run, depth + 1);
}

/** Choices annotated with availability, for rendering. */
export function annotate(run, event) {
  return event.choices.map((c, i) => ({ ...c, index: i, blocked: checkNeeds(run, c.needs) }));
}

/* ───────────────────────── resolution ───────────────────────── */

function pickOutcome(run, choice, salt) {
  const rng = streamFor(run, salt);
  const luck = run.traits.luck;
  // Outcomes are ordered best → worst; luck bends the roll toward the front.
  const r = Math.pow(rng.next(), 1 + (luck - 5) * 0.09);
  const total = choice.outcomes.reduce((s, o) => s + (o.p ?? 1), 0);
  let acc = 0;
  for (const o of choice.outcomes) {
    acc += (o.p ?? 1) / total;
    if (r <= acc) return o;
  }
  return choice.outcomes[choice.outcomes.length - 1];
}

/**
 * Resolve one choice. Mutates the run and returns a report for the UI.
 */
export function resolveChoice(run, event, choiceIndex, { auto = false } = {}) {
  const choice = event.choices[choiceIndex];
  const outcome = pickOutcome(run, choice, `outcome:${choice.label}`);

  if (choice.consumes) takeItem(run, choice.consumes);

  const deltas = applyEffects(run, outcome.eff, { tag: choice.tag });
  if (outcome.item) giveItem(run, outcome.item);
  outcome.flags?.forEach((f) => run.flags.add(f));
  if (outcome.milestone) run.milestones.push({ age: run.age, name: outcome.milestone });

  const gained = Math.round((outcome.score ?? 0) * (run.path === 'rick' ? 1.1 : 1));
  run.rawScore += gained;

  run.usedEvents.add(event.id);
  run.lifeLog.push({ age: run.age, title: event.title, choice: choice.label, text: outcome.text, auto });
  run.rolls.push({ chapter: run.chapter, receipt: rollReceipt(run, `outcome:${choice.label}`) });

  const quality = outcome.death ? 'bad'
    : (outcome.p ?? 1) >= 1 ? 'good'
    : choice.outcomes.indexOf(outcome) === 0 ? 'good'
    : choice.outcomes.indexOf(outcome) === choice.outcomes.length - 1 ? 'bad' : 'mixed';

  if (outcome.death) endRun(run, outcome.death);

  return { choice, outcome, deltas, gained, quality, auto };
}

/** Auto-pick for skipped chapters — path-flavoured, never picks a blocked choice. */
export function autoPick(run, event) {
  const opts = annotate(run, event).filter((c) => !c.blocked);
  if (!opts.length) return 0;
  // In a crisis even a degen plays it closer to the chest — otherwise
  // fast-forwarded chapters would kill most runs at the first hard beat.
  const bias = event.crisis
    ? { safe: 4, risk: 2, degen: run.path === 'rick' ? 1.5 : 0.5 }
    : run.path === 'rick'
      ? { safe: 1, risk: 3, degen: 5 }
      : { safe: 5, risk: 2, degen: 0.6 };
  const rng = streamFor(run, 'autopick');
  const chosen = rng.weighted(opts, (c) => bias[c.tag] ?? 1);
  return chosen.index;
}

/* ───────────────────────── aging & endings ───────────────────────── */

function ageDecay(run, years) {
  if (run.age < 45) return;
  const rate = run.age >= 75 ? 3.2 : run.age >= 62 ? 2.0 : 1.0;
  const fit = run.flags.has('fit') ? 0.6 : 1;
  const lungs = run.flags.has('lungs') ? 1.4 : 1;
  applyEffects(run, { health: -Math.round(rate * years * fit * lungs) });
  if (run.flags.has('loner') || run.flags.has('divorced')) applyEffects(run, { sanity: -Math.round(years * 0.8) });
}

export function advance(run, event) {
  if (run.ended) return;
  const years = event?.years ?? 3;
  run.age += years;
  run.chapter += 1;
  ageDecay(run, years);

  if (run.res.health <= 0) return endRun(run, 'health');
  if (run.res.sanity <= 0) return endRun(run, 'sanity');
  if (run.age >= MAX_AGE) return endRun(run, 'oldage');
}

export function endRun(run, reasonKey) {
  if (run.ended) return;
  run.ended = true;
  run.alive = false;
  run.endReason = reasonKey;
  run.ending = ENDINGS[reasonKey] ?? ENDINGS.oldage;
}

/** No events left for this age band and still alive → retire gracefully. */
export function checkExhausted(run) {
  if (run.ended) return;
  if (run.res.health <= 0) return endRun(run, 'health');
  if (run.res.sanity <= 0) return endRun(run, 'sanity');
  if (run.age >= MAX_AGE) return endRun(run, 'oldage');
  endRun(run, 'retire');
}

export const ITEM_LABEL = (id) => ITEMS[id]?.he ?? id;
export const hasItemIn = hasItem;
