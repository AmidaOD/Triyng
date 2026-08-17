/**
 * The pixel portrait.
 *
 * Roy is painted procedurally on a 32×40 pixel grid rather than loaded from
 * sprite sheets, because the whole point is that he is a function of the run:
 * age sets the proportions, the path sets the palette, and every flag the player
 * earned adds a layer — a knee brace, a beard, an apron, a dog, a cane.
 *
 * Nothing here reads the DOM. `paint()` takes a canvas and a run and draws.
 */

const W = 32;
const H = 40;

/*
 * Proportions per life stage. Everyone stands on the same ground line, so
 * `headY` alone decides how tall Roy is — a six-year-old really is shorter than
 * the teenager he becomes, and the leg length falls out of the arithmetic.
 */
const GROUND = 37;

const STAGES = [
  { id: 'baby',  max: 3,   headW: 11, headH: 11, headY: 18, bodyW: 8,  bodyH: 6 },
  { id: 'child', max: 12,  headW: 8,  headH: 8,  headY: 15, bodyW: 8,  bodyH: 8 },
  { id: 'teen',  max: 19,  headW: 8,  headH: 8,  headY: 11, bodyW: 9,  bodyH: 9 },
  { id: 'adult', max: 44,  headW: 8,  headH: 8,  headY: 7,  bodyW: 10, bodyH: 11 },
  { id: 'mid',   max: 62,  headW: 8,  headH: 8,  headY: 7,  bodyW: 11, bodyH: 11 },
  { id: 'elder', max: 999, headW: 8,  headH: 8,  headY: 9,  bodyW: 10, bodyH: 10 },
].map((s) => ({
  ...s,
  legH: GROUND - (s.headY + s.headH + 1 + s.bodyH),
  armH: s.bodyH,
}));

const stageFor = (age) => STAGES.find((s) => age <= s.max);

const C = {
  skin:     '#e0a87e',
  skinPale: '#cfae9a',
  skinDead: '#8d8a92',
  shade:    '#00000033',
  hair:     '#4a2f1d',
  hairGrey: '#9aa1ac',
  hairWhite:'#d8dce3',
  eye:      '#14161c',
  pants:    '#2b3140',
  shoe:     '#15181f',
  brace:    '#c9ced8',
  gold:     '#f5b13d',
  blood:    '#ff5f5f',
};

/** Shirt colour says what he became. */
function shirtOf(run) {
  if (run.flags.has('whale')) return '#243252';          // the suit money buys
  if (run.flags.has('off_grid')) return '#3f4a35';       // field green
  if (run.flags.has('owner') || run.flags.has('carpet_track')) return '#8a4326';
  if (run.flags.has('smuggler')) return '#231f2b';
  if (run.flags.has('broke')) return '#54585f';
  if (run.flags.has('football')) return '#b8443a';
  if (run.res.career >= 60) return '#2f4a5c';
  return run.path === 'rick' ? '#4a3550' : '#3c4655';
}

function hairOf(run, stage) {
  if (run.flags.has('survivor') && run.age < 40) return null;   // treatment took it
  if (!run.alive) return '#4a4d55';                             // readable against grey skin
  if (stage.id === 'elder') return run.age >= 75 ? C.hairWhite : C.hairGrey;
  if (run.age >= 50) return C.hairGrey;
  return C.hair;
}

function skinOf(run) {
  if (!run.alive) return C.skinDead;
  if (run.res.health <= 30 || run.flags.has('sick')) return C.skinPale;
  return C.skin;
}

/* ───────────────────────── painting ───────────────────────── */

export function paint(canvas, run) {
  const dpr = Math.min(3, globalThis.devicePixelRatio || 1);
  const box = canvas.getBoundingClientRect();
  const size = Math.max(1, Math.round((box.width || 64) * dpr));
  const scale = size / W;

  canvas.width = size;
  canvas.height = Math.round(H * scale);

  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const px = (x, y, w, h, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x * scale), Math.round(y * scale),
      Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale)));
  };

  drawRoy(px, run);
}

function drawRoy(px, run) {
  const st = stageFor(run.age);
  const cx = 16;
  const skin = skinOf(run);
  const shirt = shirtOf(run);
  const hair = hairOf(run, st);

  const headX = cx - Math.floor(st.headW / 2);
  const headY = st.headY;
  const bodyY = headY + st.headH + 1;
  const bodyX = cx - Math.floor(st.bodyW / 2);
  const legY = bodyY + st.bodyH;
  const shoeY = legY + st.legH;

  // ground shadow keeps him from floating
  px(cx - 7, shoeY + 2, 14, 1, C.shade);

  /* legs */
  const legW = Math.max(2, Math.floor(st.bodyW / 3));
  if (st.legH > 0) {
  px(bodyX + 1, legY, legW, st.legH, C.pants);
  px(bodyX + st.bodyW - legW - 1, legY, legW, st.legH, C.pants);
  px(bodyX + 1, shoeY, legW, 2, C.shoe);
  px(bodyX + st.bodyW - legW - 1, shoeY, legW, 2, C.shoe);
  }

  // the knee that never healed
  if (run.flags.has('bad_knee') && st.legH >= 7) {
    px(bodyX + 1, legY + Math.floor(st.legH / 2), legW, 2, C.brace);
  }

  /* torso */
  px(bodyX, bodyY, st.bodyW, st.bodyH, shirt);
  if (run.flags.has('fit')) {                       // shoulders you earned
    px(bodyX - 1, bodyY, 1, 3, shirt);
    px(bodyX + st.bodyW, bodyY, 1, 3, shirt);
  }
  if (st.id === 'mid' && !run.flags.has('fit')) {   // the years settle in
    px(bodyX, bodyY + st.bodyH - 3, st.bodyW, 3, shirt);
    px(bodyX - 1, bodyY + st.bodyH - 3, 1, 3, shirt);
    px(bodyX + st.bodyW, bodyY + st.bodyH - 3, 1, 3, shirt);
  }
  if (run.flags.has('owner') || run.flags.has('carpet_track')) {
    px(bodyX + 2, bodyY + 3, st.bodyW - 4, st.bodyH - 3, '#e6dccb');   // shop apron
  }
  if (run.flags.has('broke')) {
    px(bodyX + 1, bodyY + 4, 2, 2, '#7d838c');                          // patch
  }
  if (run.flags.has('whale')) {
    px(cx - 2, bodyY + 1, 1, 1, C.gold);                                // chain
    px(cx + 1, bodyY + 1, 1, 1, C.gold);
    px(cx - 1, bodyY + 2, 2, 1, C.gold);
    px(cx, bodyY + 3, 1, 1, C.gold);
  }
  if (run.flags.has('record')) {
    px(bodyX - 1, bodyY + 2, 1, 3, '#4a5a6d');                          // sleeve ink
  }

  /* arms */
  const armY = bodyY + 1;
  px(bodyX - 2, armY, 2, st.armH - 2, skin);
  px(bodyX + st.bodyW, armY, 2, st.armH - 2, skin);
  if (run.flags.has('married')) {
    px(bodyX + st.bodyW + 1, armY + st.armH - 3, 1, 1, C.gold);         // ring
  }

  /* neck + head */
  px(cx - 1, headY + st.headH, 2, 1, skin);
  px(headX, headY, st.headW, st.headH, skin);

  /* hair, or what replaced it */
  if (hair) {
    px(headX, headY, st.headW, 2, hair);
    px(headX, headY, 1, 3, hair);
    px(headX + st.headW - 1, headY, 1, 3, hair);
    if (run.path === 'rick' && run.age >= 20) {                          // it got away from him
      px(headX - 1, headY - 1, st.headW + 2, 2, hair);
    }
  }
  if (run.flags.has('survivor') && run.age < 40) {
    px(headX, headY, st.headW, 2, '#c94f6d');                            // bandana
  }
  if (run.flags.has('off_grid')) {
    px(headX - 1, headY - 1, st.headW + 2, 3, '#5d4a2f');                // beanie
  }
  if (run.flags.has('bike')) {
    px(headX - 1, headY - 1, st.headW + 2, 3, '#b03a3a');               // helmet
  }
  if (run.flags.has('football') && run.age >= 14 && run.age <= 22) {
    px(headX - 1, headY - 1, st.headW + 2, 2, '#b8443a');               // team cap
    px(headX + st.headW, headY + 1, 2, 1, '#b8443a');
  }

  /* face — the gauges show up here */
  const eyeY = headY + 3;
  const tired = run.res.sanity < 40 || run.flags.has('addiction');
  const eyeX1 = headX + 2;
  const eyeX2 = headX + st.headW - 3;
  if (run.alive) {
    px(eyeX1, eyeY, 1, tired ? 2 : 1, C.eye);
    px(eyeX2, eyeY, 1, tired ? 2 : 1, C.eye);
  } else {
    px(eyeX1, eyeY, 1, 1, C.eye); px(eyeX1 - 1, eyeY - 1, 1, 1, C.eye);
    px(eyeX2, eyeY, 1, 1, C.eye); px(eyeX2 + 1, eyeY - 1, 1, 1, C.eye);
  }
  if ((run.flags.has('degree') || run.age >= 50) && st.id !== 'baby' && run.alive) {                        // reading glasses
    px(eyeX1 - 1, eyeY, 3, 1, '#2c3440');
    px(eyeX2 - 1, eyeY, 3, 1, '#2c3440');
    px(eyeX1 + 2, eyeY, eyeX2 - eyeX1 - 2, 1, '#2c3440');
  }

  const mouthY = headY + st.headH - 2;
  const happy = run.res.sanity >= 65;
  const sad = run.res.sanity < 35;
  if (run.alive) {
    px(cx - 1, mouthY, 2, 1, '#8a4b46');
    if (happy) { px(cx - 2, mouthY - 1, 1, 1, '#8a4b46'); px(cx + 1, mouthY - 1, 1, 1, '#8a4b46'); }
    if (sad)   { px(cx - 2, mouthY + 1, 1, 1, '#8a4b46'); px(cx + 1, mouthY + 1, 1, 1, '#8a4b46'); }
  }
  if (run.res.health < 25 && run.alive) px(headX + 1, mouthY, 1, 1, C.blood);

  /* beard: off-grid or old enough */
  if (run.flags.has('off_grid') && run.age >= 25) {
    px(headX, mouthY - 1, st.headW, 3, '#3b2a1a');
    px(cx - 1, mouthY, 2, 1, '#20150c');
  } else if (st.id === 'elder') {
    px(headX + 1, mouthY + 1, st.headW - 2, 1, C.hairGrey);
  }

  /* the cane, when the body asks for one */
  if (st.id === 'elder' || (run.flags.has('bad_knee') && run.age >= 55)) {
    px(bodyX + st.bodyW + 2, bodyY + 3, 1, shoeY - bodyY - 1, '#6b4a2c');
  }

  /* company he kept */
  if (run.flags.has('dog') && run.age <= 17) drawDog(px, shoeY);
  if (run.flags.has('kids') && run.age >= 30 && run.age <= 60) drawKid(px, shoeY, skin);
}

function drawDog(px, shoeY) {
  const y = shoeY - 3;
  px(3, y, 6, 3, '#8a6a44');      // body
  px(8, y - 2, 3, 3, '#8a6a44');  // head
  px(10, y - 1, 1, 1, C.eye);
  px(9, y - 3, 1, 1, '#6b4f31');  // ear
  px(3, y + 3, 1, 2, '#8a6a44');
  px(7, y + 3, 1, 2, '#8a6a44');
  px(2, y - 1, 1, 2, '#8a6a44');  // tail
}

function drawKid(px, shoeY, skin) {
  const y = shoeY - 8;
  px(25, y, 4, 4, skin);          // head
  px(26, y + 2, 1, 1, C.eye);
  px(28, y + 2, 1, 1, C.eye);
  px(25, y - 1, 4, 1, '#4a2f1d'); // hair
  px(25, y + 5, 4, 5, '#5a7a8a'); // body
  px(25, y + 10, 1, 3, '#2b3140');
  px(28, y + 10, 1, 3, '#2b3140');
}

/* ───────────────────────── caption ───────────────────────── */

/**
 * What is visible on him right now, and why. Rendered under the portrait so the
 * link between a choice made twenty years ago and the sprite is never implicit.
 */
const MARKS = [
  { flag: 'survivor',    when: (r) => r.age < 40, label: 'בנדנה' },
  { flag: 'off_grid',    label: 'זקן וכובע גרב' },
  { flag: 'bad_knee',    label: 'סד ברך' },
  { flag: 'owner',       label: 'סינר החנות' },
  { flag: 'carpet_track', label: 'סינר החנות', skipIf: 'owner' },
  { flag: 'married',     label: 'טבעת' },
  { flag: 'kids',        when: (r) => r.age >= 30 && r.age <= 60, label: 'ילדה לצידו' },
  { flag: 'dog',         when: (r) => r.age <= 17, label: 'באדי' },
  { flag: 'whale',       label: 'שרשרת זהב' },
  { flag: 'broke',       label: 'טלאי' },
  { flag: 'record',      label: 'קעקוע' },
  { flag: 'football',    when: (r) => r.age >= 14 && r.age <= 22, label: 'כובע הנבחרת' },
  { flag: 'bike',        label: 'קסדה' },
  { flag: 'fit',         label: 'כתפיים' },
  { flag: 'degree',      label: 'משקפיים' },
  { flag: 'addiction',   label: 'עיניים שקועות' },
];

export function marksOf(run) {
  const out = [];
  for (const m of MARKS) {
    if (!run.flags.has(m.flag)) continue;
    if (m.skipIf && run.flags.has(m.skipIf)) continue;
    if (m.when && !m.when(run)) continue;
    if (!out.includes(m.label)) out.push(m.label);
  }
  if (run.age >= 63) out.push('מקל הליכה');
  return out;
}

export const stageName = (age) => ({
  baby: 'תינוק', child: 'ילד', teen: 'נער', adult: 'בוגר', mid: 'אמצע החיים', elder: 'זקן',
}[stageFor(age).id]);
