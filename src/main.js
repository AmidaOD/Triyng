/**
 * Controller. Drives one chapter at a time and keeps the decision sheet,
 * the gauges and the history table in sync.
 */

import { chain } from './chain.js';
import { createRun } from './state.js';
import {
  nextEvent, annotate, resolveChoice, autoPick, advance, checkExhausted,
  rollReceipt, eventText, eventEcho,
} from './engine.js';
import { scoreRun, grade } from './scoring.js';
import { evaluate, progress } from './collection.js';
import { makeRng, randomSeed } from './rng.js';
import * as ui from './ui.js';

const { $, $$ } = ui;

const PACE_NOTE = {
  1: 'כל צומת עובר דרכך. <b>ריצה ארוכה, שליטה מלאה.</b>',
  2: 'פרק אחד נפתר בלעדיך בין החלטה להחלטה. <b>חוויה מאוזנת.</b>',
  3: 'שני פרקים נפתרים בלעדיך. <b>ריצה מהירה, פחות שליטה.</b>',
};
const MODE_NOTE = {
  solo: 'אתה מחליט, אתה חי עם זה.',
  hive: '12 שברי תודעה מצביעים איתך. הקול שלך שווה 5 — הרוב קובע.',
};
const TRAIT_HE = { resilience: 'חוסן', charisma: 'כריזמה', luck: 'מזל', madness: 'טירוף' };

const el = {};
let run = null;
let currentEvent = null;
let pendingDigest = [];
let timer = null;
let busy = false;

/* ───────────────────────── boot ───────────────────────── */

function init() {
  [
    'btn-wallet', 'btn-top-back', 'btn-boot', 'btn-goto-legacy', 'btn-goto-about', 'btn-goto-collection',
    'boot-coll', 'inp-seed', 'btn-reseed', 'btn-mint', 'nft-preview', 'mint-note', 'mint-fee',
    'chk-timer', 'pace-note', 'mode-note',
    'id-card', 'gauges', 'history', 'inv-card', 'inv-list', 'txs', 'chain-count',
    'timer-wrap', 'timer-bar', 'sheet', 'sheet-body',
    'end-kicker', 'end-title', 'end-text', 'end-total', 'score-board', 'end-history', 'unlocks',
    'btn-again', 'btn-end-legacy', 'btn-end-collection', 'btn-copy',
    'board', 'graves', 'btn-wipe', 'coll-grid', 'coll-progress',
  ].forEach((id) => { el[id] = document.getElementById(id); });

  chain.subscribe(() => { ui.renderChrome(); ui.renderTxs(el.txs, el['chain-count']); });
  ui.renderChrome();

  el['inp-seed'].value = randomSeed();
  el['mint-fee'].textContent = `${chain.fee} $TICKET`;
  updateNotes();
  updatePreview();
  updateBootCounts();

  el['btn-wallet'].addEventListener('click', () => {
    if (!chain.connected) chain.connect();
    else if (chain.state.ticket < chain.fee) chain.claimFaucet();
  });
  el['btn-top-back'].addEventListener('click', goBack);

  el['btn-boot'].addEventListener('click', () => {
    if (!chain.connected) chain.connect();
    updatePreview();
    go('screen-mint');
  });
  el['btn-goto-legacy'].addEventListener('click', openLegacy);
  el['btn-end-legacy'].addEventListener('click', openLegacy);
  el['btn-goto-collection'].addEventListener('click', openCollection);
  el['btn-end-collection'].addEventListener('click', openCollection);
  el['btn-goto-about'].addEventListener('click', () => go('screen-about'));

  $$('input[name="path"]').forEach((r) => r.addEventListener('change', updatePreview));
  $$('input[name="pace"], input[name="mode"]').forEach((r) => r.addEventListener('change', updateNotes));
  el['inp-seed'].addEventListener('input', updatePreview);
  el['btn-reseed'].addEventListener('click', () => { el['inp-seed'].value = randomSeed(); updatePreview(); });
  el['btn-mint'].addEventListener('click', startRun);

  el['sheet-body'].addEventListener('click', onSheetClick);

  el['btn-again'].addEventListener('click', () => {
    el['inp-seed'].value = randomSeed();
    updatePreview();
    go('screen-mint');
  });
  el['btn-copy'].addEventListener('click', copyResult);
  el['btn-wipe'].addEventListener('click', () => {
    if (confirm('למחוק את כל הריצות, ההישגים והיתרות המקומיות?')) { chain.wipe(); openLegacy(); updateBootCounts(); }
  });

  // The sheet floats over the column, so the column needs to know how tall it is.
  new ResizeObserver(syncSheetHeight).observe(el.sheet);
}

/* ───────────────────────── navigation ───────────────────────── */

const ROOT_SCREENS = new Set(['screen-boot', 'screen-run']);
let screen = 'screen-boot';

function go(id) {
  screen = id;
  ui.showScreen(id);
  el['btn-top-back'].hidden = ROOT_SCREENS.has(id);
}

function goBack() {
  go(run && !run.ended ? 'screen-run' : 'screen-boot');
}

function syncSheetHeight() {
  document.documentElement.style.setProperty('--sheet-h', `${el.sheet.offsetHeight}px`);
}

function updateBootCounts() {
  const p = progress();
  el['boot-coll'].textContent = `${p.have}/${p.total}`;
}

/* ───────────────────────── mint ───────────────────────── */

const readConfig = () => ({
  seed: el['inp-seed'].value.trim() || randomSeed(),
  path: $('input[name="path"]:checked').value,
  mode: $('input[name="mode"]:checked').value,
  pace: Number($('input[name="pace"]:checked').value),
  useTimer: el['chk-timer'].checked,
});

function updateNotes() {
  const cfg = readConfig();
  el['pace-note'].innerHTML = PACE_NOTE[cfg.pace];
  el['mode-note'].textContent = MODE_NOTE[cfg.mode];
}

function updatePreview() {
  const preview = createRun({ ...readConfig(), legacy: chain.legacy });
  ui.renderPreview(el['nft-preview'], preview);
  el['mint-note'].textContent = chain.legacy
    ? `${chain.legacy.id} הוריש +1 ל${TRAIT_HE[chain.legacy.passdown]}.`
    : '';
  el['mint-note'].classList.remove('err');
}

function startRun() {
  if (!chain.connected) chain.connect();
  const paid = chain.payEntry();
  if (!paid.ok) {
    el['mint-note'].textContent = `${paid.reason} — הקש על היתרה למעלה כדי לקבל $TICKET מהברז.`;
    el['mint-note'].classList.add('err');
    return;
  }

  const cfg = readConfig();
  run = createRun({ ...cfg, legacy: chain.legacy });
  run.pace = cfg.pace;
  chain.mintRoy(run);

  currentEvent = null;
  pendingDigest = [];
  el['timer-wrap'].classList.toggle('off', !run.useTimer);
  go('screen-run');
  paintRun();
  beginChapter();
}

/* ───────────────────────── chapter loop ───────────────────────── */

function paintRun() {
  ui.renderId(el['id-card'], run, scoreRun(run).total);
  ui.renderGauges(el.gauges, run);
  ui.renderHistory(el.history, run);
  ui.renderInventory(el['inv-card'], el['inv-list'], run);
  ui.renderTxs(el.txs, el['chain-count']);
}

/** Resolve `count` chapters with no player input. Returns digest entries. */
function fastForward(count) {
  const entries = [];
  for (let i = 0; i < count && !run.ended; i++) {
    const ev = nextEvent(run);
    if (!ev) { checkExhausted(run); break; }
    const report = resolveChoice(run, ev, autoPick(run, ev), { auto: true });
    entries.push({ age: run.age, title: ev.title, text: report.outcome.text });
    advance(run, ev);
  }
  if (entries.length) chain.autoCommit(run, entries.length);
  return entries;
}

function beginChapter() {
  busy = false;
  pendingDigest = fastForward((run.pace ?? 1) - 1);
  paintRun();

  if (run.ended) return showEnding();

  currentEvent = nextEvent(run);
  if (!currentEvent) { checkExhausted(run); return showEnding(); }

  ui.renderDecision(el['sheet-body'], {
    event: currentEvent,
    text: eventText(run, currentEvent),
    echo: eventEcho(run, currentEvent),
    choices: annotate(run, currentEvent),
    digest: pendingDigest,
  });
  syncSheetHeight();
  startTimer(currentEvent.crisis ? 12000 : 15000);
}

function showEnding() {
  stopTimer();
  ui.renderEnding(el['sheet-body'], run);
  syncSheetHeight();
}

/* ───────────────────────── timer ───────────────────────── */

function startTimer(ms) {
  stopTimer();
  el['timer-wrap'].classList.toggle('off', !run.useTimer);
  if (!run.useTimer) return;

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
  el['timer-bar'].style.transform = 'scaleX(1)';
}

function onTimeout() {
  if (busy || !currentEvent) return;
  run.indecisions += 1;
  run.res.sanity = Math.max(0, run.res.sanity - 6);
  commit(autoPick(run, currentEvent), { timedOut: true });
}

/* ───────────────────────── decisions ───────────────────────── */

function onSheetClick(e) {
  const next = e.target.closest('#btn-next');
  if (next) return onNext(next.dataset.mode);

  const btn = e.target.closest('.choice');
  if (!btn || btn.disabled || busy) return;

  const index = Number(btn.dataset.index);
  $$('.choice', el['sheet-body']).forEach((b) => {
    b.disabled = true;
    b.classList.toggle('picked', b === btn);
    b.classList.toggle('dim', b !== btn);
  });

  if (run.mode === 'hive') hiveVote(index);
  else commit(index);
}

function hiveVote(playerIndex) {
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
    shards.push({ pick: pick.index });
  }
  tally[playerIndex] += 5;
  shards.push({ pick: playerIndex, you: true });

  let winner = playerIndex;
  tally.forEach((v, i) => { if (v > tally[winner]) winner = i; });
  if (annotate(run, currentEvent)[winner].blocked) winner = playerIndex;

  ui.renderHive(el['sheet-body'], { shards, tally, choices: currentEvent.choices, winner });
  syncSheetHeight();
  setTimeout(() => { busy = false; commit(winner, { fromHive: true }); }, 1500);
}

function commit(index, opts = {}) {
  if (busy && !opts.fromHive) return;
  busy = true;
  stopTimer();

  const choice = currentEvent.choices[index];
  // Capture the odds before resolving — the roll itself changes the flags they depend on.
  const odds = annotate(run, currentEvent)[index].odds;
  const receipt = rollReceipt(run, `outcome:${choice.label}`);

  const report = resolveChoice(run, currentEvent, index, {});
  chain.commit(run, choice.label, receipt);

  if (opts.timedOut) {
    report.outcome = { ...report.outcome, text: `לא החלטת בזמן. ${report.outcome.text}` };
  }

  const branch = Math.round(odds[choice.outcomes.indexOf(report.outcome)] * 100);
  ui.renderOutcome(el['sheet-body'], report, {
    rolled: opts.timedOut ? 'נגמר הזמן — הגורל בחר' : `התגלגל ${branch}%`,
  });

  advance(run, currentEvent);
  paintRun();
  syncSheetHeight();
}

function onNext(mode) {
  if (mode === 'end') return finishRun();
  if (run.ended) return showEnding();
  beginChapter();
}

/* ───────────────────────── finish ───────────────────────── */

function finishRun() {
  const score = scoreRun(run);
  const { sbt, payout } = chain.finalize(run, score);
  const fresh = evaluate(run, score);
  const g = grade(score.total);

  el['end-kicker'].innerHTML = `<span class="num">${ui.esc(sbt.id)}</span> · דירוג <span class="num">${g.tag}</span>`;
  el['end-title'].textContent = run.ending?.title ?? 'סוף הריצה';
  el['end-title'].className = `end-title ${run.endReason === 'retire' ? 'retire' : 'death'}`;
  el['end-text'].innerHTML = `${ui.esc((run.ending?.text ?? '').replace('{age}', run.age))}<br>${ui.esc(g.text)}
    <br><small>הדור הבא יורש <span class="num">+1</span> ל${TRAIT_HE[sbt.passdown]}${
      payout ? ` · תגמול עונה <span class="num">${payout} $TICKET</span>` : ''}</small>`;
  el['end-total'].textContent = score.total.toLocaleString('en-US');

  ui.renderScore(el['score-board'], score);
  ui.renderHistory(el['end-history'], run, { full: true });
  ui.renderUnlocks(el.unlocks, fresh);
  updateBootCounts();
  go('screen-end');
}

function copyResult() {
  const last = chain.state.graves[0];
  if (!last) return;
  const text = `PROJECT ROY — ${last.id}
${last.path === 'rick' ? 'Degen' : 'Safe Yield'} · גיל ${last.age} · ${last.endTitle}
Life Well Lived: ${last.score.toLocaleString('en-US')} (×${last.multiplier.toFixed(2)})
seed: ${last.seed}`;
  navigator.clipboard?.writeText(text).then(
    () => { el['btn-copy'].textContent = 'הועתק ✓'; setTimeout(() => { el['btn-copy'].textContent = 'העתק תוצאה'; }, 1600); },
    () => { el['btn-copy'].textContent = 'ההעתקה נחסמה'; },
  );
}

/* ───────────────────────── other screens ───────────────────────── */

function openLegacy() {
  ui.renderBoard(el.board);
  ui.renderGraves(el.graves);
  go('screen-legacy');
}

function openCollection() {
  ui.renderCollection(el['coll-grid'], el['coll-progress']);
  go('screen-collection');
}

init();
