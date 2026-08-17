/**
 * Controller. Wires the DOM to the engine and drives one chapter at a time.
 */

import { chain } from './chain.js';
import { createRun } from './state.js';
import { nextEvent, annotate, resolveChoice, autoPick, advance, checkExhausted, rollReceipt } from './engine.js';
import { scoreRun, grade } from './scoring.js';
import { evaluate } from './collection.js';
import { makeRng, randomSeed } from './rng.js';
import * as ui from './ui.js';

const { $, $$ } = ui;

const PACE_NOTE = {
  1: 'שליטה מלאה. כל צומת עובר דרכך — <b>ריצה ארוכה</b>.',
  2: 'פרק אחד נפתר על ידי הגורל בין החלטה להחלטה — <b>חוויה מאוזנת</b>.',
  3: 'שני פרקים אוטומטיים בין החלטה להחלטה — <b>ריצה מהירה, פחות שליטה</b>.',
};

const el = {};
let run = null;
let currentEvent = null;
let timer = null;
let busy = false;

/* ───────────────────────── boot ───────────────────────── */

function cacheDom() {
  const ids = [
    'btn-wallet', 'btn-boot', 'btn-goto-legacy', 'btn-goto-about', 'btn-goto-collection',
    'inp-seed', 'btn-reseed', 'btn-mint', 'btn-mint-back', 'nft-preview', 'mint-note', 'mint-fee',
    'chk-timer', 'pace-note',
    'nft-live', 'stats', 'inv-list', 'txs', 'life-log', 'digest',
    'age', 'chapter', 'mult', 'timer-wrap', 'timer-bar',
    'event', 'event-title', 'event-text', 'choices', 'outcome', 'hive', 'btn-next',
    'end-kicker', 'end-title', 'end-text', 'score-board', 'unlocks',
    'btn-again', 'btn-end-legacy', 'btn-end-collection', 'btn-copy',
    'board', 'graves', 'btn-legacy-back', 'btn-wipe',
    'coll-grid', 'coll-progress', 'btn-coll-back', 'btn-coll-legacy',
    'btn-about-back',
  ];
  ids.forEach((id) => { el[id] = document.getElementById(id); });
}

function init() {
  cacheDom();
  chain.subscribe(() => { ui.renderChrome(); if (el.txs) ui.renderTxs(el.txs); });
  ui.renderChrome();

  el['inp-seed'].value = randomSeed();
  updatePaceNote();
  updatePreview();

  /* wallet */
  el['btn-wallet'].addEventListener('click', () => {
    if (!chain.connected) chain.connect();
    else if (chain.state.ticket < chain.fee) chain.claimFaucet();
  });

  /* navigation */
  el['btn-boot'].addEventListener('click', () => {
    if (!chain.connected) chain.connect();
    ui.showScreen('screen-mint');
    updatePreview();
  });
  el['btn-goto-legacy'].addEventListener('click', openLegacy);
  el['btn-goto-collection'].addEventListener('click', openCollection);
  el['btn-goto-about'].addEventListener('click', () => ui.showScreen('screen-about'));
  el['btn-about-back'].addEventListener('click', () => ui.showScreen('screen-boot'));
  el['btn-mint-back'].addEventListener('click', () => ui.showScreen('screen-boot'));
  el['btn-legacy-back'].addEventListener('click', () => ui.showScreen('screen-boot'));
  el['btn-coll-back'].addEventListener('click', () => ui.showScreen('screen-boot'));
  el['btn-coll-legacy'].addEventListener('click', openLegacy);
  el['btn-end-legacy'].addEventListener('click', openLegacy);
  el['btn-end-collection'].addEventListener('click', openCollection);

  /* mint config */
  $$('input[name="path"]').forEach((r) => r.addEventListener('change', updatePreview));
  $$('input[name="pace"]').forEach((r) => r.addEventListener('change', updatePaceNote));
  el['inp-seed'].addEventListener('input', updatePreview);
  el['btn-reseed'].addEventListener('click', () => { el['inp-seed'].value = randomSeed(); updatePreview(); });
  el['btn-mint'].addEventListener('click', startRun);

  /* run */
  el.choices.addEventListener('click', onChoiceClick);
  el['btn-next'].addEventListener('click', onNext);

  /* end */
  el['btn-again'].addEventListener('click', () => { ui.showScreen('screen-mint'); el['inp-seed'].value = randomSeed(); updatePreview(); });
  el['btn-copy'].addEventListener('click', copyResult);
  el['btn-wipe'].addEventListener('click', () => {
    if (confirm('למחוק את כל הריצות, ההישגים והיתרות המקומיות?')) { chain.wipe(); openLegacy(); }
  });

  el['mint-fee'].textContent = `${chain.fee} $TICKET`;
}

/* ───────────────────────── mint ───────────────────────── */

const readConfig = () => ({
  seed: el['inp-seed'].value.trim() || randomSeed(),
  path: $('input[name="path"]:checked').value,
  mode: $('input[name="mode"]:checked').value,
  pace: Number($('input[name="pace"]:checked').value),
  useTimer: el['chk-timer'].checked,
});

function updatePaceNote() {
  el['pace-note'].innerHTML = PACE_NOTE[readConfig().pace];
}

function updatePreview() {
  const cfg = readConfig();
  const preview = createRun({ ...cfg, legacy: chain.legacy });
  ui.paintCard(el['nft-preview'], preview);
  el['mint-note'].textContent = chain.legacy
    ? `הדור הקודם (${chain.legacy.id}) מוריש +1 ל${{ resilience: 'חוסן', charisma: 'כריזמה', luck: 'מזל', madness: 'טירוף' }[chain.legacy.passdown]}.`
    : '';
  el['mint-note'].classList.remove('err');
}

function startRun() {
  if (!chain.connected) chain.connect();
  const paid = chain.payEntry();
  if (!paid.ok) {
    el['mint-note'].textContent = `${paid.reason} — לחץ על יתרת הארנק למעלה כדי לקבל $TICKET מהברז.`;
    el['mint-note'].classList.add('err');
    return;
  }

  const cfg = readConfig();
  run = createRun({ ...cfg, legacy: chain.legacy });
  run.pace = cfg.pace;
  chain.mintRoy(run);

  currentEvent = null;
  ui.showScreen('screen-run');
  el['timer-wrap'].classList.toggle('off', !run.useTimer);
  paintRun();
  beginChapter();
}

/* ───────────────────────── chapter loop ───────────────────────── */

function paintRun() {
  ui.paintCard(el['nft-live'], run, { live: true });
  ui.renderStats(el.stats, run);
  ui.renderInventory(el['inv-list'], run);
  ui.renderTxs(el.txs);
  ui.renderLifeLog(el['life-log'], run);
  el.age.textContent = run.age;
  el.chapter.textContent = `פרק ${run.chapter + 1}`;
  el.mult.textContent = `×${run.multiplier.toFixed(2)}`;
}

/** Resolve `count` chapters with no player input. Returns digest entries. */
function fastForward(count) {
  const entries = [];
  for (let i = 0; i < count && !run.ended; i++) {
    const ev = nextEvent(run);
    if (!ev) { checkExhausted(run); break; }
    const idx = autoPick(run, ev);
    const report = resolveChoice(run, ev, idx, { auto: true });
    entries.push({ age: run.age, title: ev.title, text: report.outcome.text });
    advance(run, ev);
  }
  if (entries.length) chain.autoCommit(run, entries.length);
  return entries;
}

function beginChapter() {
  busy = false;
  el['btn-next'].hidden = true;
  el.hive.hidden = true;

  const skipped = fastForward((run.pace ?? 1) - 1);
  ui.renderDigest(el.digest, skipped);
  paintRun();

  if (run.ended) return showEndingCard();

  currentEvent = nextEvent(run);
  if (!currentEvent) { checkExhausted(run); return showEndingCard(); }

  const choices = annotate(run, currentEvent);
  ui.renderEvent({
    event: el.event, title: el['event-title'], text: el['event-text'],
    choices: el.choices, outcome: el.outcome, hive: el.hive,
  }, currentEvent, choices);

  startTimer(currentEvent.crisis ? 12000 : 15000);
}

/** The run ended — pause on a card before the score screen. */
function showEndingCard() {
  stopTimer();
  el.choices.innerHTML = '';
  el['event-title'].textContent = run.ending?.title ?? 'סוף';
  el['event-text'].textContent = (run.ending?.text ?? '').replace('{age}', run.age);
  el.event.className = 'event crisis';
  el.outcome.hidden = true;
  ui.flash();
  el['btn-next'].hidden = false;
  el['btn-next'].textContent = 'סיכום הריצה';
  el['btn-next'].dataset.mode = 'end';
}

/* ───────────────────────── timer ───────────────────────── */

function startTimer(ms) {
  stopTimer();
  if (!run.useTimer) { el['timer-bar'].style.transform = 'scaleX(1)'; return; }
  const started = performance.now();
  el['timer-bar'].classList.remove('warn');
  const step = (now) => {
    const left = 1 - (now - started) / ms;
    if (left <= 0) { el['timer-bar'].style.transform = 'scaleX(0)'; onTimeout(); return; }
    el['timer-bar'].style.transform = `scaleX(${left})`;
    el['timer-bar'].classList.toggle('warn', left < 0.35);
    timer = requestAnimationFrame(step);
  };
  timer = requestAnimationFrame(step);
}

function stopTimer() {
  if (timer) cancelAnimationFrame(timer);
  timer = null;
}

function onTimeout() {
  if (busy || !currentEvent) return;
  run.indecisions += 1;
  run.res.sanity = Math.max(0, run.res.sanity - 6);
  commitChoice(autoPick(run, currentEvent), { timedOut: true });
}

/* ───────────────────────── decisions ───────────────────────── */

function onChoiceClick(e) {
  const btn = e.target.closest('.choice');
  if (!btn || btn.disabled || busy) return;
  const index = Number(btn.dataset.index);
  btn.classList.add('picked');

  if (run.mode === 'hive') runHiveVote(index);
  else commitChoice(index);
}

function runHiveVote(playerIndex) {
  busy = true;
  stopTimer();
  const options = annotate(run, currentEvent).filter((c) => !c.blocked);
  const rng = makeRng(`hive:${run.seed}:${run.chapter}`);
  const bias = run.path === 'rick' ? { safe: 1, risk: 3, degen: 4 } : { safe: 4, risk: 2, degen: 1 };

  const shards = [];
  const tally = new Array(currentEvent.choices.length).fill(0);
  for (let i = 0; i < 12; i++) {
    const pick = rng.weighted(options, (c) => bias[c.tag] ?? 1);
    tally[pick.index] += 1;
    shards.push({ name: `DAVE-${String(i + 1).padStart(2, '0')}`, pick: pick.index });
  }
  const YOUR_WEIGHT = 5;
  tally[playerIndex] += YOUR_WEIGHT;
  shards.push({ name: 'YOU ×5', pick: playerIndex, you: true });

  let winner = playerIndex;
  tally.forEach((v, i) => { if (v > tally[winner]) winner = i; });
  if (annotate(run, currentEvent)[winner].blocked) winner = playerIndex;

  ui.renderHive(el.hive, { shards, tally, choices: currentEvent.choices, winner });
  $$('.choice', el.choices).forEach((b) => { b.disabled = true; });
  setTimeout(() => { busy = false; commitChoice(winner, { fromHive: true }); }, 1400);
}

function commitChoice(index, opts = {}) {
  if (busy && !opts.fromHive) return;
  busy = true;
  stopTimer();

  const label = currentEvent.choices[index].label;
  const receipt = rollReceipt(run, `outcome:${label}`);
  const report = resolveChoice(run, currentEvent, index, {});
  chain.commit(run, label, receipt);

  $$('.choice', el.choices).forEach((b) => {
    b.disabled = true;
    b.classList.toggle('picked', Number(b.dataset.index) === index);
  });

  if (opts.timedOut) {
    report.outcome = { ...report.outcome, text: `לא החלטת בזמן. ${report.outcome.text}` };
  }
  ui.renderOutcome(el.outcome, report);
  if (report.quality === 'bad') ui.flash();

  advance(run, currentEvent);
  paintRun();

  el['btn-next'].hidden = false;
  el['btn-next'].dataset.mode = run.ended ? 'ending' : 'next';
  el['btn-next'].textContent = run.ended ? 'המשך' : 'המשך';
  el['btn-next'].focus({ preventScroll: true });
}

function onNext() {
  const mode = el['btn-next'].dataset.mode;
  if (mode === 'end') return finishRun();
  if (run.ended) return showEndingCard();
  el.digest.hidden = true;
  beginChapter();
}

/* ───────────────────────── finish ───────────────────────── */

function finishRun() {
  const score = scoreRun(run);
  const { sbt, payout } = chain.finalize(run, score);
  const fresh = evaluate(run, score);
  const g = grade(score.total);

  el['end-kicker'].innerHTML = `<span class="num">RUN FINALIZED · ${ui.esc(sbt.id)}</span> · דירוג <span class="num">${g.tag}</span>`;
  el['end-title'].textContent = run.ending?.title ?? 'סוף הריצה';
  el['end-title'].className = `end-title ${run.endReason === 'retire' ? 'retire' : 'death'}`;

  const passdownHe = { resilience: 'חוסן', charisma: 'כריזמה', luck: 'מזל', madness: 'טירוף' }[sbt.passdown];
  el['end-text'].innerHTML = `${ui.esc((run.ending?.text ?? '').replace('{age}', run.age))}<br>${ui.esc(g.text)}
    <br><small style="color:var(--muted)"><span class="num">Soulbound</span> נצרב · הדור הבא יורש <span class="num">+1</span> ל${passdownHe}${payout ? ` · תגמול עונה: <span class="num">${payout} $TICKET</span>` : ''}</small>`;

  ui.renderScore(el['score-board'], score);
  ui.renderUnlocks(el.unlocks, fresh);
  ui.showScreen('screen-end');
  ui.renderChrome();
}

function copyResult() {
  const score = chain.state.leaderboard[0];
  const last = chain.state.graves[0];
  if (!last) return;
  const text = `PROJECT ROY — ${last.id}
מסלול: ${last.path === 'rick' ? 'Degen' : 'Safe Yield'} · גיל ${last.age} · ${last.endTitle}
Life Well Lived: ${last.score.toLocaleString('en-US')} (×${last.multiplier.toFixed(2)})
seed: ${last.seed}`;
  navigator.clipboard?.writeText(text).then(
    () => { el['btn-copy'].textContent = 'הועתק ✓'; setTimeout(() => { el['btn-copy'].textContent = 'העתק תוצאה'; }, 1600); },
    () => { el['btn-copy'].textContent = 'ההעתקה נחסמה'; },
  );
  void score;
}

/* ───────────────────────── screens ───────────────────────── */

function openLegacy() {
  ui.renderBoard(el.board);
  ui.renderGraves(el.graves);
  ui.showScreen('screen-legacy');
}

function openCollection() {
  ui.renderCollection(el['coll-grid'], el['coll-progress']);
  ui.showScreen('screen-collection');
}

init();
