/**
 * Chain layer.
 *
 * `MockChainAdapter` implements the whole surface the game needs against
 * localStorage: a wallet, $TICKET balances, the season prize pool, run
 * commitments and the soulbound legacy tokens. Swapping in a real deployment
 * means writing an adapter with the same methods on top of an EIP-1193 provider
 * — see contracts/RoyRun.sol for the reference contract.
 */

import { addressFrom, txHashFrom, randomSeed, shortHex } from './rng.js';

const KEY = 'roy.v1';
const ENTRY_FEE = 10;
const FAUCET = 100;

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return {
      address: raw.address ?? null,
      ticket: raw.ticket ?? 0,
      pool: raw.pool ?? 0,
      block: raw.block ?? 21_400_000,
      nonce: raw.nonce ?? 0,
      leaderboard: raw.leaderboard ?? [],
      graves: raw.graves ?? [],
      collection: raw.collection ?? [],
      lastLegacy: raw.lastLegacy ?? null,
    };
  } catch {
    return { address: null, ticket: 0, pool: 0, block: 21_400_000, nonce: 0, leaderboard: [], graves: [], collection: [], lastLegacy: null };
  }
}

class MockChainAdapter {
  constructor() {
    this.state = load();
    this.txs = [];
    this.listeners = new Set();
    this.network = { name: 'Base Sepolia', chainId: 84532 };
  }

  /* ── plumbing ── */
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch { /* private mode */ }
  }
  subscribe(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit() { this.listeners.forEach((fn) => fn(this)); }

  get connected() { return Boolean(this.state.address); }
  get fee() { return ENTRY_FEE; }

  /** Record a transaction. Everything that mutates chain state goes through here. */
  tx(fn, args = {}, { value = 0 } = {}) {
    this.state.block += 1 + Math.floor(Math.random() * 3);
    this.state.nonce += 1;
    const receipt = {
      hash: txHashFrom(this.state.address ?? 'anon', fn, this.state.nonce),
      fn,
      args,
      value,
      block: this.state.block,
      gas: (0.0000021 + Math.random() * 0.0000018),
      at: Date.now(),
    };
    this.txs.unshift(receipt);
    if (this.txs.length > 60) this.txs.length = 60;
    this.save();
    this.emit();
    return receipt;
  }

  /* ── wallet ── */
  connect() {
    if (!this.state.address) {
      this.state.address = addressFrom(randomSeed());
      this.state.ticket = FAUCET;
      this.tx('faucet.claim', { amount: `${FAUCET} $TICKET` });
    }
    this.save();
    this.emit();
    return this.state.address;
  }

  disconnect() { this.state.address = null; this.save(); this.emit(); }

  /* ── economy ── */
  payEntry() {
    if (this.state.ticket < ENTRY_FEE) return { ok: false, reason: 'יתרת $TICKET לא מספיקה' };
    this.state.ticket -= ENTRY_FEE;
    this.state.pool += ENTRY_FEE;
    this.tx('arcade.insertCoin', { fee: `${ENTRY_FEE} $TICKET` }, { value: ENTRY_FEE });
    return { ok: true };
  }

  /** Top-up so a session is never hard-blocked — the faucet is part of the testnet fiction. */
  claimFaucet() {
    this.state.ticket += FAUCET;
    this.tx('faucet.claim', { amount: `${FAUCET} $TICKET` });
  }

  /* ── run lifecycle ── */
  mintRoy(run) {
    return this.tx('RoyID.mint', { tokenId: `#${run.tokenId}`, path: run.path.toUpperCase(), seed: shortHex(run.seed, 8, 6) });
  }

  commit(run, label, receipt) {
    return this.tx('RoyRun.commit', { chapter: run.chapter + 1, age: run.age, choice: label.slice(0, 24), roll: shortHex(receipt, 6, 4) });
  }

  autoCommit(run, count) {
    return this.tx('RoyRun.fastForward', { chapters: count, age: run.age });
  }

  burn(run, item) {
    return this.tx('RoyID.burnItem', { item, tokenId: `#${run.tokenId}` });
  }

  /**
   * Finalize: burn the Roy ID, mint the soulbound record, pay out of the pool,
   * and pick the trait that passes down to the next generation.
   */
  finalize(run, score) {
    const payout = this.#payout(score.total);
    const sbt = {
      id: `SBT-${run.tokenId}`,
      tokenId: run.tokenId,
      seed: run.seed,
      path: run.path,
      mode: run.mode,
      age: run.age,
      end: run.endReason,
      endTitle: run.ending?.title ?? '',
      score: score.total,
      multiplier: run.multiplier,
      milestones: run.milestones.map((m) => m.name),
      passdown: this.#bestTrait(run),
      at: Date.now(),
    };

    this.tx('RoyID.burn', { tokenId: `#${run.tokenId}` });
    this.tx('Legacy.mintSoulbound', { id: sbt.id, score: score.total, passdown: sbt.passdown });
    if (payout > 0) {
      this.state.pool = Math.max(0, this.state.pool - payout);
      this.state.ticket += payout;
      this.tx('Season.claimReward', { amount: `${payout} $TICKET` });
    }

    this.state.graves.unshift(sbt);
    if (this.state.graves.length > 40) this.state.graves.length = 40;
    this.state.lastLegacy = sbt;

    this.state.leaderboard.push({
      id: sbt.id, score: sbt.score, path: sbt.path, age: sbt.age,
      end: sbt.endTitle, mult: sbt.multiplier, at: sbt.at,
    });
    this.state.leaderboard.sort((a, b) => b.score - a.score);
    if (this.state.leaderboard.length > 50) this.state.leaderboard.length = 50;

    this.save();
    this.emit();
    return { sbt, payout };
  }

  /** Rough season split: better runs claim a bigger slice of the pool. */
  #payout(total) {
    if (this.state.pool <= 0) return 0;
    const share = total >= 4000 ? 0.5 : total >= 2800 ? 0.3 : total >= 1800 ? 0.15 : total >= 1000 ? 0.05 : 0;
    return Math.floor(this.state.pool * share);
  }

  #bestTrait(run) {
    const entries = Object.entries(run.traits).sort((a, b) => b[1] - a[1]);
    return entries[0][0];
  }

  get legacy() { return this.state.lastLegacy; }

  wipe() {
    localStorage.removeItem(KEY);
    this.state = load();
    this.txs = [];
    this.emit();
  }
}

export const chain = new MockChainAdapter();
export { ENTRY_FEE };
