/**
 * Deterministic, verifiable randomness.
 *
 * Every roll in a run is derived from `seed ‖ chapter ‖ salt`, so a given seed
 * always replays the exact same life. The derived hex digest is surfaced in the
 * on-chain log, which is what makes the run auditable ("provably fair").
 *
 * On a real deployment the digest would come from keccak256 + a VRF/blockhash
 * commitment; here we use a fast local equivalent with the same shape.
 */

/** FNV-1a style string hash, 32-bit, four decorrelated outputs. */
export function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/** sfc32 — small, fast, good distribution. Returns floats in [0,1). */
export function sfc32(a, b, c, d) {
  return function rand() {
    a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

/** Build a seeded RNG with helpers. */
export function makeRng(seedStr) {
  const s = xmur3(String(seedStr));
  const rand = sfc32(s(), s(), s(), s());
  return {
    next: rand,
    /** integer in [min, max] inclusive */
    int(min, max) { return min + Math.floor(rand() * (max - min + 1)); },
    /** true with probability p */
    chance(p) { return rand() < p; },
    pick(arr) { return arr[Math.floor(rand() * arr.length)]; },
    /** weighted pick — items need a numeric `weight` (default 1) */
    weighted(items, weightOf = (x) => x.weight ?? 1) {
      const total = items.reduce((sum, it) => sum + Math.max(0, weightOf(it)), 0);
      if (total <= 0) return items[0];
      let r = rand() * total;
      for (const it of items) {
        r -= Math.max(0, weightOf(it));
        if (r <= 0) return it;
      }
      return items[items.length - 1];
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

/** 64-bit-ish hex digest, used for display (tx hashes, roll receipts). */
export function digest(...parts) {
  const s = xmur3(parts.join('|'));
  let out = '';
  for (let i = 0; i < 8; i++) out += s().toString(16).padStart(8, '0');
  return out;
}

export function hash32(...parts) {
  return '0x' + digest(...parts).slice(0, 32);
}

/** A plausible-looking EVM address derived from a seed. */
export function addressFrom(seedStr) {
  return '0x' + digest('addr', seedStr).slice(0, 40);
}

export function txHashFrom(...parts) {
  return '0x' + digest('tx', ...parts).slice(0, 64).padEnd(64, '0');
}

export function shortHex(hex, head = 6, tail = 4) {
  if (!hex || hex.length <= head + tail + 2) return hex || '';
  return `${hex.slice(0, head)}…${hex.slice(-tail)}`;
}

/** Random 32-byte-ish seed for a fresh run. */
export function randomSeed() {
  const bytes = new Uint8Array(16);
  (globalThis.crypto ?? { getRandomValues: (b) => b.forEach((_, i) => (b[i] = (Math.random() * 256) | 0)) })
    .getRandomValues(bytes);
  return '0x' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
