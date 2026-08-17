/**
 * "Life Well Lived" score.
 *
 * The season prize pool is split by this number, so it has to reward both
 * survival (Morty's case) and audacity (Rick's). Longevity and milestones carry
 * the base; the risk multiplier decides who actually tops the board.
 */

/** Wrap a Latin/numeric run so RTL bidi cannot reorder it. */
const ltr = (s) => `\u2066${s}\u2069`;

export function scoreRun(run) {
  const lines = [];
  const add = (label, value, note) => { if (value) lines.push({ label, value: Math.round(value), note }); };

  add('שנות חיים', run.age * 6, `${run.age} שנים`);
  add('שיא קריירה', run.peakCareer * 4.5, `${run.peakCareer}/100`);
  add('הון שנותר', Math.max(0, run.capital) / 800, ltr(`$${Math.round(run.capital).toLocaleString('en-US')}`));
  add('שפיות בסיום', run.res.sanity * 2.2, `${run.res.sanity}/100`);
  add('בריאות בסיום', run.res.health * 1.1, `${run.res.health}/100`);
  add('אבני דרך', run.milestones.length * 26, `${run.milestones.length}`);
  add('החלטות', run.rawScore * 0.55, `${run.lifeLog.length} פרקים`);

  if (run.indecisions) add('אי־החלטה', -run.indecisions * 30, `×${run.indecisions}`);
  if (run.capital < 0) add('חובות', Math.max(-260, run.capital / 1400), ltr(`$${Math.round(run.capital).toLocaleString('en-US')}`));
  if (run.endReason === 'retire') add('בונוס פרישה', 180);
  if (run.endReason === 'sanity') add('קריסה קיומית', -180);
  if (run.flags.has('survivor')) add('בונוס ניצול', 130);

  const base = lines.reduce((sum, l) => sum + l.value, 0);
  const total = Math.max(0, Math.round(base * run.multiplier));

  return { lines, base: Math.round(base), multiplier: run.multiplier, total };
}

/** Grade band, used for flavour on the end screen. */
export function grade(total) {
  if (total >= 4000) return { tag: 'S', text: 'חיים שנחיו היטב. הלוח שלך.' };
  if (total >= 2800) return { tag: 'A', text: 'ריצה חזקה. תישאר בטופ 10 זמן־מה.' };
  if (total >= 1800) return { tag: 'B', text: 'חיים סבירים לחלוטין. רוי הממוצע.' };
  if (total >= 1000) return { tag: 'C', text: 'היה יכול להיות גרוע יותר. גם טוב יותר.' };
  return { tag: 'D', text: 'הארקייד ראה דברים יפים יותר.' };
}
