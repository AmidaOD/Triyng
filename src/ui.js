/**
 * Rendering. Pure functions from state → markup, plus tiny DOM helpers.
 * No framework: the whole UI is five or six render calls driven by main.js.
 */

import { TRAITS, ITEMS } from './state.js';
import { shortHex } from './rng.js';
import { ACHIEVEMENTS, RARITY, unlocked, progress } from './collection.js';
import { chain } from './chain.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function esc(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const money = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(Math.round(n)).toLocaleString('en-US');

export function showScreen(id) {
  $$('.screen').forEach((s) => s.classList.toggle('is-active', s.id === id));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

/* ───────────────────────── NFT card ───────────────────────── */

const AVATAR = { morty: '🧒', rick: '🧪' };

export function nftCard(run, { live = false } = {}) {
  const traits = Object.entries(run.traits).map(([key, val]) => `
    <div class="trait">
      <span>${TRAITS[key].he}</span>
      <div class="bar"><i style="width:${val * 10}%"></i></div>
      <b>${val}</b>
    </div>`).join('');

  const status = live
    ? `גיל ${run.age} · פרק ${run.chapter + 1}`
    : run.legacy ? `יורש של ${esc(run.legacy.id)}` : 'דור ראשון';

  return `
    <div class="nft-top">
      <span class="nft-id">ROY ID #${run.tokenId}</span>
      <span class="nft-badge">${run.path === 'rick' ? 'DEGEN' : 'SAFE YIELD'}</span>
    </div>
    <div class="nft-avatar">${AVATAR[run.path]}</div>
    <div class="nft-name">${run.path === 'rick' ? 'ROY // OFF-GRID' : 'ROY'}</div>
    <div class="nft-status">${esc(status)}</div>
    <div class="nft-traits">${traits}</div>
    <div class="nft-seed">seed ${esc(shortHex(run.seed, 10, 8))}</div>`;
}

export function paintCard(el, run, opts) {
  el.className = `nft-card${opts?.live ? ' nft-live' : ''} path-${run.path}`;
  el.innerHTML = nftCard(run, opts);
}

/* ───────────────────────── run panels ───────────────────────── */

const RES_LABEL = { health: 'בריאות', sanity: 'שפיות', career: 'קריירה' };

export function renderStats(el, run) {
  const gauges = ['health', 'sanity', 'career'].map((key) => {
    const v = run.res[key];
    return `
      <div class="stat-row stat-${key}${v <= 25 ? ' low' : ''}">
        <div class="stat-top"><span>${RES_LABEL[key]}</span><b>${v}</b></div>
        <div class="stat-bar"><i style="width:${v}%"></i></div>
      </div>`;
  }).join('');

  el.innerHTML = `${gauges}
    <div class="stat-capital">
      <span>הון</span><b class="${run.capital < 0 ? 'neg' : ''}">${money(run.capital)}</b>
    </div>`;
}

export function renderInventory(el, run) {
  if (!run.items.length) { el.innerHTML = '<li class="empty">ריק</li>'; return; }
  el.innerHTML = run.items
    .map((id) => `<li>${ITEMS[id]?.icon ?? '•'} ${esc(ITEMS[id]?.he ?? id)}</li>`)
    .join('');
}

export function renderTxs(el) {
  if (!chain.txs.length) { el.innerHTML = '<li>אין טרנזקציות עדיין</li>'; return; }
  el.innerHTML = chain.txs.slice(0, 18).map((tx) => {
    const args = Object.entries(tx.args).map(([k, v]) => `${k}=${esc(String(v))}`).join(' ');
    return `<li>
      <span class="tx-fn">${esc(tx.fn)}</span>
      <span class="tx-hash">${esc(shortHex(tx.hash))}</span>
      <span class="tx-meta">${args}</span>
      <span class="tx-meta">block ${tx.block.toLocaleString('en-US')} · ${tx.gas.toFixed(7)} ETH</span>
    </li>`;
  }).join('');
}

export function renderLifeLog(el, run) {
  el.innerHTML = run.lifeLog.slice().reverse().slice(0, 14).map((e) => `
    <li><b>${e.age}</b> — ${esc(e.title)}${e.auto ? ' <i style="opacity:.6">(אוטומטי)</i>' : ''}</li>
  `).join('');
}

/* ───────────────────────── event & choices ───────────────────────── */

const TAG_LABEL = { safe: 'בטוח', risk: 'סיכון', degen: 'degen' };

export function renderEvent(els, event, choices) {
  els.event.className = `event${event.crisis ? ' crisis' : ''}`;
  els.title.textContent = event.title;
  els.text.textContent = event.text;
  els.outcome.hidden = true;
  els.outcome.innerHTML = '';
  els.hive.hidden = true;
  els.hive.innerHTML = '';

  els.choices.hidden = false;
  els.choices.innerHTML = choices.map((c) => `
    <button class="choice" data-index="${c.index}" ${c.blocked ? 'disabled' : ''}>
      <span class="choice-label">${esc(c.label)}</span>
      <span class="choice-meta">
        <span class="tag tag-${c.tag}">${TAG_LABEL[c.tag]}</span>
        ${c.needs?.item ? `<span>דורש ${esc(ITEMS[c.needs.item]?.he ?? c.needs.item)}</span>` : ''}
        ${c.blocked ? `<span style="color:var(--red)">${esc(c.blocked)}</span>` : ''}
      </span>
    </button>`).join('');
}

const DELTA_LABEL = { health: 'בריאות', sanity: 'שפיות', career: 'קריירה', capital: 'הון', mult: 'מכפיל' };

export function deltaChips(deltas, gained) {
  const chips = Object.entries(deltas).map(([key, val]) => {
    if (!val) return '';
    const sign = val > 0 ? '+' : '';
    const shown = key === 'capital' ? money(val) : key === 'mult' ? `${sign}${val.toFixed(2)}` : `${sign}${val}`;
    return `<span class="delta ${val > 0 ? 'up' : 'down'}">${DELTA_LABEL[key]} <span class="num">${shown}</span></span>`;
  }).join('');
  const pts = gained ? `<span class="delta up"><span class="num">+${gained}</span> נק׳</span>` : '';
  return `<div class="deltas">${chips}${pts}</div>`;
}

export function renderOutcome(el, report) {
  el.hidden = false;
  el.className = `outcome ${report.quality === 'good' ? '' : report.quality}`;
  el.innerHTML = `<p class="outcome-text">${esc(report.outcome.text)}</p>${deltaChips(report.deltas, report.gained)}`;
}

export function renderDigest(el, entries) {
  if (!entries.length) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `
    <div class="digest-head"><span class="num">FAST-FORWARD</span> · ${entries.length} ${entries.length === 1 ? 'פרק נפתר' : 'פרקים נפתרו'} אוטומטית</div>
    <ul>${entries.map((e) => `<li><b>גיל ${e.age}</b> — ${esc(e.title)}: ${esc(e.text)}</li>`).join('')}</ul>`;
}

/* ───────────────────────── hive vote ───────────────────────── */

export function renderHive(el, { shards, tally, choices, winner }) {
  el.hidden = false;
  const max = Math.max(1, ...tally);
  el.innerHTML = `
    <div class="hive-head">תודעת הנחיל מצביעה · ${shards.length} שברים</div>
    <div class="shards">
      ${shards.map((s, i) => `<div class="shard${s.you ? ' you' : ''}" style="animation-delay:${i * 28}ms" title="${esc(s.name)}">${s.pick + 1}</div>`).join('')}
    </div>
    <div class="hive-tally">
      ${choices.map((c, i) => `
        <div class="tally-row${i === winner ? ' win' : ''}">
          <div>
            <div style="font-size:.78rem">${esc(c.label)}</div>
            <div class="tally-bar"><i style="width:${(tally[i] / max) * 100}%"></i></div>
          </div>
          <div class="tally-num">${tally[i]} קולות</div>
        </div>`).join('')}
    </div>`;
}

/* ───────────────────────── end screen ───────────────────────── */

export function renderScore(el, score) {
  el.innerHTML = `
    ${score.lines.map((l) => `
      <div class="score-line"><span>${l.label}${l.note ? ` <i class="num" style="opacity:.55">${esc(l.note)}</i>` : ''}</span><b>${l.value > 0 ? '+' : ''}${l.value.toLocaleString('en-US')}</b></div>`).join('')}
    <div class="score-line"><span>בסיס</span><b>${score.base.toLocaleString('en-US')}</b></div>
    <div class="score-line mult"><span>מכפיל סיכון</span><b>×${score.multiplier.toFixed(2)}</b></div>
    <div class="score-line total"><span>LIFE WELL LIVED</span><b>${score.total.toLocaleString('en-US')}</b></div>`;
}

export function renderUnlocks(el, fresh) {
  if (!fresh.length) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = fresh.map((a, i) => `
    <span class="unlock-chip" style="animation-delay:${i * 90}ms">${a.icon} נפתח: ${esc(a.name)}</span>`).join('');
}

/* ───────────────────────── legacy & collection ───────────────────────── */

const PATH_HE = { morty: 'Safe Yield', rick: 'Degen' };

export function renderBoard(el) {
  const rows = chain.state.leaderboard.slice(0, 10);
  if (!rows.length) { el.innerHTML = '<li class="empty-note">אין ריצות עדיין. תכניס מטבע.</li>'; return; }
  el.innerHTML = rows.map((r, i) => `
    <li>
      <span class="rank">${i + 1}</span>
      <span class="who"><b>${esc(r.id)}</b><span><span class="num">${PATH_HE[r.path]}</span> · גיל ${r.age} · <span class="num">×${r.mult.toFixed(2)}</span> · ${esc(r.end)}</span></span>
      <span class="pts">${r.score.toLocaleString('en-US')}</span>
    </li>`).join('');
}

export function renderGraves(el) {
  const graves = chain.state.graves;
  if (!graves.length) { el.innerHTML = '<p class="empty-note">בית הקברות ריק.</p>'; return; }
  el.innerHTML = graves.slice(0, 12).map((g) => `
    <div class="grave">
      <b>ROY #${g.tokenId}</b>
      <span>גיל ${g.age} · ${esc(g.endTitle)}</span>
      <span class="grave-score"><span class="num">${g.score.toLocaleString('en-US')}</span> נק׳ · <span class="num">×${g.multiplier.toFixed(2)}</span></span>
      <span class="sbt">SOULBOUND · ${TRAITS[g.passdown]?.he ?? g.passdown} +1</span>
    </div>`).join('');
}

export function renderCollection(gridEl, progEl) {
  const have = unlocked();
  const p = progress();
  progEl.textContent = `${p.have}/${p.total}`;
  gridEl.innerHTML = ACHIEVEMENTS.map((a) => {
    const got = have.has(a.id);
    const r = RARITY[a.rarity];
    return `
      <div class="ach ${got ? 'unlocked' : 'locked'}">
        <div class="ach-icon">${got ? a.icon : '🔒'}</div>
        <div>
          <b>${esc(a.name)}</b>
          <span>${esc(a.desc)}</span>
          <span class="ach-rarity" style="color:${r.color}">${r.he}</span>
        </div>
      </div>`;
  }).join('');
}

/* ───────────────────────── chrome ───────────────────────── */

export function renderChrome() {
  $('#chip-ticket').innerHTML = `<b>${chain.state.ticket}</b>&nbsp;$TICKET`;
  $('#chip-pool').innerHTML = `POOL <b>${chain.state.pool}</b> $TICKET`;
  const btn = $('#btn-wallet');
  if (chain.connected) {
    btn.textContent = shortHex(chain.state.address);
    btn.classList.add('is-connected');
  } else {
    btn.textContent = 'חבר ארנק';
    btn.classList.remove('is-connected');
  }
}

export function flash() {
  const el = document.createElement('div');
  el.className = 'flash';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 600);
}
