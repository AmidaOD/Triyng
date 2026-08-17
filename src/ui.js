/**
 * Rendering. Pure functions from state → markup, plus small DOM helpers.
 * No framework: the run screen is four render calls and a decision sheet.
 */

import { TRAITS, ITEMS } from './state.js';
import { shortHex } from './rng.js';
import { ACHIEVEMENTS, RARITY, unlocked, progress } from './collection.js';
import { chain } from './chain.js';
import { marksOf, stageName, paint as paintAvatar } from './avatar.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const money = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');
const pct = (p) => `${Math.round(p * 100)}%`;
const num = (s) => `<span class="num">${s}</span>`;

export function showScreen(id) {
  $$('.screen').forEach((s) => s.classList.toggle('is-active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ───────────────────────── identity ───────────────────────── */

const PATH_NAME = { morty: 'SAFE YIELD', rick: 'DEGEN' };

export function renderId(els, run, score) {
  // Toggle, never reassign — the card also carries its layout classes.
  els.card.classList.toggle('rick', run.path === 'rick');
  els.card.classList.toggle('morty', run.path === 'morty');
  els.main.innerHTML = `
    <div class="id-name">רוי <span class="pill pill-path">${PATH_NAME[run.path]}</span></div>
    <div class="id-meta">
      <span>${esc(stageName(run.age))} · גיל <b>${run.age}</b></span>
      <span>פרק <b>${run.chapter + 1}</b></span>
      <span class="num">×${run.multiplier.toFixed(2)}</span>
    </div>`;
  els.score.innerHTML = `
    <span>SCORE</span>
    <b class="${score >= 10000 ? 'long' : ''}">${score.toLocaleString('en-US')}</b>`;
}

/** The chips under the portrait name every mark a past choice left on him. */
export function renderMarks(el, run, freshSet) {
  el.innerHTML = marksOf(run)
    .map((m) => `<span class="mark${freshSet?.has(m) ? ' fresh' : ''}">${esc(m)}</span>`).join('');
}

/** Traits only matter at mint time, so the preview card carries them. */
export function renderPreview(el, run) {
  const traits = Object.entries(run.traits).map(([k, v]) => `
    <div class="g-row">
      <span>${TRAITS[k].he}</span>
      <div class="g-bar"><i style="width:${v * 10}%;background:var(--cool)"></i></div>
      <b>${v}</b>
    </div>`).join('');

  el.innerHTML = `
    <div class="id-badges" style="margin-block-end:.5rem">
      <span class="pill pill-path">${PATH_NAME[run.path]}</span>
      <span class="pill pill-nat">ROY #${run.tokenId}</span>
      ${run.legacy ? `<span class="pill" style="color:#a97bff">יורש ${esc(run.legacy.id)}</span>` : ''}
    </div>
    <div class="gauges">${traits}</div>`;
}

const RES = { health: 'בריאות', sanity: 'שפיות', career: 'קריירה' };

/** The HUD gauges: three bars and the balance on one line, so the status card
 *  stays short enough that the decision sheet can never cover it. */
export function renderGauges(el, run) {
  const cells = ['health', 'sanity', 'career'].map((k) => `
    <div class="g g-${k}${run.res[k] <= 25 ? ' low' : ''}">
      <span>${RES[k]} <b>${run.res[k]}</b></span>
      <div class="g-bar"><i style="width:${run.res[k]}%"></i></div>
    </div>`).join('');

  el.innerHTML = `${cells}
    <div class="g g-cash">
      <span>הון</span>
      <b class="${run.capital < 0 ? 'neg' : ''}">${money(run.capital)}</b>
    </div>`;
}

/* ───────────────────────── history ───────────────────────── */

export function renderHistory(el, run, { full = false } = {}) {
  if (!run.lifeLog.length) {
    el.innerHTML = '<tr><td colspan="3" class="empty">החיים עוד לא התחילו</td></tr>';
    return;
  }
  const rows = full ? run.lifeLog : run.lifeLog.slice().reverse();
  el.innerHTML = rows.map((e) => `
    <tr class="q-${e.quality}${e.auto ? ' is-auto' : ''}">
      <td class="c-age"><i class="h-age">${e.age}</i></td>
      <td class="h-what"><b>${esc(e.choice)}</b><span>${esc(e.title)}${e.auto ? ' · אוטומטי' : ''}</span></td>
      <td class="c-delta"><span class="h-delta">${e.gained ? `+${e.gained}` : '—'}</span></td>
    </tr>`).join('');
}

export function renderInventory(card, list, run) {
  card.hidden = !run.items.length;
  if (!run.items.length) return;
  list.innerHTML = run.items
    .map((id) => `<li>${ITEMS[id]?.icon ?? '•'} ${esc(ITEMS[id]?.he ?? id)}</li>`).join('');
}

export function renderTxs(el, countEl) {
  if (countEl) countEl.textContent = `${chain.txs.length} tx`;
  if (!el) return;
  el.innerHTML = chain.txs.slice(0, 16).map((tx) => {
    const args = Object.entries(tx.args).map(([k, v]) => `${k}=${esc(String(v))}`).join(' ');
    return `<li><span class="fn">${esc(tx.fn)}</span> ${esc(shortHex(tx.hash))}
      <span class="meta">${args}</span>
      <span class="meta">block ${tx.block.toLocaleString('en-US')} · ${tx.gas.toFixed(7)} ETH</span></li>`;
  }).join('');
}

/* ───────────────────────── the decision sheet ───────────────────────── */

const TAG = { safe: 'בטוח', risk: 'סיכון', degen: 'degen' };
const EFF = { health: 'בריאות', sanity: 'שפיות', career: 'קריירה' };

/**
 * What a branch does, in the fewest words that stay honest — this is what makes
 * a choice a decision instead of a coin flip.
 */
export function outcomeSummary(o) {
  if (o.death) return '☠ סוף הריצה';

  // Money is the headline when there is money; after that the biggest swings win.
  const parts = [];
  if (o.eff?.capital) parts.push(money(o.eff.capital));
  parts.push(...['health', 'sanity', 'career']
    .filter((k) => o.eff?.[k])
    .sort((a, b) => Math.abs(o.eff[b]) - Math.abs(o.eff[a]))
    .map((k) => `${o.eff[k] > 0 ? '+' : ''}${o.eff[k]} ${EFF[k]}`));
  if (o.milestone) parts.push(`★ ${o.milestone}`);
  if (o.item) parts.push(`+${ITEMS[o.item]?.he ?? o.item}`);
  if (o.eff?.mult) parts.push(`מכפיל +${o.eff.mult.toFixed(2)}`);
  return parts.slice(0, 3).join(' · ') || 'בלי שינוי';
}

const oddTone = (i, len) => (len === 1 ? 'o-good' : i === 0 ? 'o-good' : i === len - 1 ? 'o-bad' : 'o-mid');

function choiceButton(c) {
  const odds = c.outcomes.map((o, i) => `
    <div class="odd ${o.death ? 'o-bad' : oddTone(i, c.outcomes.length)}">
      <span class="pct">${pct(c.odds[i])}</span>
      <span class="what">${esc(outcomeSummary(o))}</span>
    </div>`).join('');

  return `
    <button class="choice" data-index="${c.index}" ${c.blocked ? 'disabled' : ''}>
      <span class="choice-head"><b>${esc(c.label)}</b><span class="tag tag-${c.tag}">${TAG[c.tag]}</span></span>
      ${c.blocked ? `<span class="choice-need">${esc(c.blocked)}</span>` : `<span class="odds">${odds}</span>`}
    </button>`;
}

export function renderDecision(el, { event, text, echo, choices, digest }) {
  el.innerHTML = `
    ${digestBlock(digest)}
    ${echo ? `<span class="echo">↩ ${esc(echo)}</span>` : ''}
    <h3 class="sheet-title${event.crisis ? ' crisis' : ''}">${esc(event.title)}</h3>
    <p class="sheet-text">${esc(text)}</p>
    <div class="choices">${choices.map(choiceButton).join('')}</div>`;
}

function digestBlock(entries) {
  if (!entries?.length) return '';
  return `
    <div class="digest-head">${entries.length === 1 ? 'חלף פרק אחד בלעדיך' : `חלפו ${entries.length} פרקים בלעדיך`}</div>
    <ul class="digest">
      ${entries.map((e) => `<li><b>גיל ${e.age}</b> — ${esc(e.text)}</li>`).join('')}
    </ul>`;
}

export function deltaChips(deltas, gained) {
  const chips = Object.entries(deltas).map(([k, v]) => {
    if (!v) return '';
    const shown = k === 'capital' ? money(v) : k === 'mult' ? `+${v.toFixed(2)}` : `${v > 0 ? '+' : ''}${v}`;
    const label = k === 'capital' ? 'הון' : k === 'mult' ? 'מכפיל' : EFF[k];
    return `<span class="delta ${v > 0 ? 'up' : 'down'}">${label} ${shown}</span>`;
  }).join('');
  return `<div class="deltas">${chips}${gained ? `<span class="delta up">+${gained} נק׳</span>` : ''}</div>`;
}

export function renderOutcome(el, report, { rolled }) {
  el.innerHTML = `
    <div class="outcome">
      <span class="outcome-rolled">${esc(rolled)}</span>
      <p class="outcome-text">${esc(report.outcome.text)}</p>
      ${deltaChips(report.deltas, report.gained)}
      <button class="btn btn-primary btn-block" id="btn-next">המשך</button>
    </div>`;
}

export function renderEnding(el, run) {
  el.innerHTML = `
    <div class="outcome">
      <h3 class="sheet-title crisis">${esc(run.ending?.title ?? 'סוף')}</h3>
      <p class="sheet-text">${esc((run.ending?.text ?? '').replace('{age}', run.age))}</p>
      <button class="btn btn-primary btn-block" id="btn-next" data-mode="end">סיכום הריצה</button>
    </div>`;
}

export function renderHive(el, { shards, tally, choices, winner }) {
  const max = Math.max(1, ...tally);
  el.innerHTML = `
    <div class="hive">
      <span class="outcome-rolled">תודעת הנחיל מצביעה · ${shards.length} שברים</span>
      <div class="shards">
        ${shards.map((s, i) => `<div class="shard${s.you ? ' you' : ''}" style="animation-delay:${i * 26}ms">${s.pick + 1}</div>`).join('')}
      </div>
      <div class="tally">
        ${choices.map((c, i) => `
          <div class="tally-row${i === winner ? ' win' : ''}">
            <div><div>${esc(c.label)}</div><div class="tally-bar"><i style="width:${(tally[i] / max) * 100}%"></i></div></div>
            <div class="tally-n">${tally[i]} קולות</div>
          </div>`).join('')}
      </div>
    </div>`;
}

/* ───────────────────────── end / legacy / collection ───────────────────────── */

export function renderScore(el, score) {
  el.innerHTML = `
    ${score.lines.map((l) => `
      <div class="score-line"><span>${l.label}${l.note ? ` <i class="num">${esc(l.note)}</i>` : ''}</span>
      <b>${l.value > 0 ? '+' : ''}${l.value.toLocaleString('en-US')}</b></div>`).join('')}
    <div class="score-line"><span>מכפיל סיכון</span><b>×${score.multiplier.toFixed(2)}</b></div>
    <div class="score-line tot"><span>סה״כ</span><b>${score.total.toLocaleString('en-US')}</b></div>`;
}

export function renderUnlocks(el, fresh) {
  el.hidden = !fresh.length;
  el.innerHTML = fresh.map((a, i) => `
    <span class="unlock" style="animation-delay:${i * 80}ms">${a.icon} ${esc(a.name)}</span>`).join('');
}

const PATH_HE = { morty: 'Safe Yield', rick: 'Degen' };

export function renderBoard(el) {
  const rows = chain.state.leaderboard.slice(0, 10);
  if (!rows.length) { el.innerHTML = '<li class="empty-note">אין ריצות עדיין.</li>'; return; }
  el.innerHTML = rows.map((r, i) => `
    <li>
      <span class="rank">${i + 1}</span>
      <span class="who"><b>${esc(r.id)}</b>
        <span>${num(PATH_HE[r.path])} · גיל ${r.age} · ${num(`×${r.mult.toFixed(2)}`)} · ${esc(r.end)}</span></span>
      <span class="pts">${r.score.toLocaleString('en-US')}</span>
    </li>`).join('');
}

export function renderGraves(el) {
  const graves = chain.state.graves;
  if (!graves.length) { el.innerHTML = '<p class="empty-note">בית הקברות ריק.</p>'; return; }

  const shown = graves.slice(0, 12);
  el.innerHTML = shown.map((x) => `
    <div class="grave">
      <div class="avatar-wrap grave-av"><canvas class="avatar"></canvas></div>
      <b>ROY #${x.tokenId}</b>
      <span>גיל ${x.age} · ${esc(x.endTitle)}</span>
      <span class="grave-score">${num(x.score.toLocaleString('en-US'))} נק׳</span>
      <span class="sbt">SOULBOUND · ${TRAITS[x.passdown]?.he ?? x.passdown} +1</span>
    </div>`).join('');

  // Repaint each headstone portrait from the state the soulbound token kept.
  $$('.grave canvas', el).forEach((canvas, i) => paintAvatar(canvas, graveRun(shown[i])));
}

/** The minimum a portrait needs, rebuilt from a soulbound record. */
function graveRun(g) {
  return {
    age: g.age,
    path: g.path,
    alive: false,
    flags: new Set(g.flags ?? []),
    res: g.res ?? { health: 0, sanity: 0, career: 0 },
  };
}

export function renderCollection(grid, prog) {
  const have = unlocked();
  const p = progress();
  if (prog) prog.textContent = `${p.have}/${p.total}`;
  grid.innerHTML = ACHIEVEMENTS.map((a) => {
    const got = have.has(a.id);
    return `
      <div class="ach ${got ? '' : 'locked'}">
        <div class="ic">${got ? a.icon : '🔒'}</div>
        <b>${esc(a.name)}</b>
        <span>${esc(a.desc)}</span>
        <span class="rar" style="color:${RARITY[a.rarity].color}">${RARITY[a.rarity].he}</span>
      </div>`;
  }).join('');
}

export function renderChrome() {
  const btn = $('#btn-wallet');
  if (chain.connected) {
    btn.innerHTML = `${chain.state.ticket} $TICKET`;
    btn.classList.add('is-connected');
  } else {
    btn.textContent = 'חבר ארנק';
    btn.classList.remove('is-connected');
  }
}
