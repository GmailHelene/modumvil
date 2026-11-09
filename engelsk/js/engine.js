// Questions, answer checking and levels. No DOM - covered by tests/engine.test.mjs.
import {
  PHRASAL, ADJ, PARTICLES, PREPOSITIONS, SET_NAMES, CORE_SETS,
} from './data.js';

// ---- randomness (injectable, seeded for the daily challenge) ----

let rand = Math.random;
export function setRandom(fn) { rand = fn; }
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function seedFrom(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export function withRandom(fn, gen) {
  const before = rand;
  rand = gen;
  try { return fn(); } finally { rand = before; }
}
export const int = (n) => Math.floor(rand() * n);
export const pick = (arr) => arr[int(arr.length)];
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = int(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- items ----

export const ALL_ITEMS = [
  ...PHRASAL.map((p) => ({ ...p, type: 'p' })),
  ...ADJ.map((a) => ({ ...a, type: 'a', en: `${a.adj} ${a.preps[0]}` })),
];
export const itemById = (id) => ALL_ITEMS.find((i) => i.id === id) || null;
export const itemsInSets = (sets) => ALL_ITEMS.filter((i) => sets.includes(i.set));

// ---- text helpers ----

export function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.!?,;:"«»()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(to|å) /, '');
}

export function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j += 1) d[0][j] = j;
  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return d[m][n];
}

// Check typed text against the accepted answers.
// { ok: true } | { ok: false, near: bool } | { ok: null, hint } (empty input)
export function checkTyped(q, text) {
  const t = normalize(text);
  if (!t) return { ok: null, hint: 'Skriv et svar først.' };
  const accepted = q.accept.map(normalize);
  if (accepted.includes(t)) return { ok: true };
  const near = accepted.some((a) => a.length >= 4 && levenshtein(a, t) === 1);
  return { ok: false, near };
}

function ingForm(verb) {
  const special = { sit: 'sitting', put: 'putting', get: 'getting', run: 'running', lie: 'lying' };
  if (special[verb]) return special[verb];
  if (verb.endsWith('e') && !verb.endsWith('ee')) return `${verb.slice(0, -1)}ing`;
  return `${verb}ing`;
}

// The gap sentence with the blank styled; text is ours, but escape anyway.
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const gapHtml = (sentence) => esc(sentence).replace('___', '<span class="gap">___</span>');
const fill = (sentence, word) => sentence.replace('___', word);
const gapOf = (item) => pick(item.gaps);

function optionsFrom(correct, wrong, n = 4) {
  const seen = new Set([correct]);
  const list = [];
  for (const w of wrong) {
    if (w && !seen.has(w)) {
      seen.add(w);
      list.push(w);
    }
    if (list.length === n - 1) break;
  }
  return shuffle([{ label: correct, correct: true }, ...list.map((l) => ({ label: l, correct: false }))]);
}

// Wrong particles: those the same verb uses in other phrasal verbs first (most instructive), then others.
function particleDistractors(item, gapPart) {
  const sameVerb = PHRASAL.filter((p) => p.verb === item.verb && p.id !== item.id).map((p) => (p.gapPart || p.part).split(' ')[0]);
  // Particles from the item's alternative answers with the same verb are also correct ("throw out").
  const alsoRight = (item.alt || []).filter((a) => a.startsWith(`${item.verb} `)).map((a) => a.split(' ')[1]);
  return [...shuffle(sameVerb), ...shuffle(PARTICLES)].filter((p) => p !== gapPart && !alsoRight.includes(p));
}

function prepDistractors(item) {
  const notWrong = item.notWrong || [];
  return [item.trap, ...shuffle(PREPOSITIONS)].filter((p) => p && !item.preps.includes(p) && !notWrong.includes(p));
}

// Norwegian meanings to choose from: same verb first, then same set.
function meaningDistractors(item) {
  const pool = item.type === 'p' ? PHRASAL : ADJ;
  const same = pool.filter((p) => p.id !== item.id && (item.type === 'p' ? p.verb === item.verb : p.preps[0] === item.preps[0]));
  const rest = pool.filter((p) => p.id !== item.id && p.no !== item.no);
  return [...shuffle(same), ...shuffle(rest)].map((p) => p.no).filter((no) => no !== item.no);
}

function englishDistractors(item) {
  const right = new Set(englishFor(item).map(normalize));
  let list;
  if (item.type === 'p') {
    const sameVerb = PHRASAL.filter((p) => p.verb === item.verb && p.id !== item.id).map((p) => p.en);
    const sameSet = PHRASAL.filter((p) => p.set === item.set && p.id !== item.id).map((p) => p.en);
    const madeUp = shuffle(PARTICLES).filter((x) => x !== item.part).map((x) => `${item.verb} ${x}`);
    list = [...shuffle(sameVerb), ...shuffle(sameSet).slice(0, 2), ...madeUp];
  } else {
    list = prepDistractors(item).map((p) => `${item.adj} ${p}`);
  }
  return list.filter((x) => !right.has(normalize(x)));
}

// Every English answer that fits a Norwegian meaning (two items can share one, e.g. "redd for").
function englishFor(item) {
  const same = ALL_ITEMS.filter((i) => i.type === item.type && normalize(i.no) === normalize(item.no));
  const out = new Set();
  for (const i of same) {
    if (i.type === 'p') {
      out.add(i.en);
      (i.alt || []).forEach((a) => out.add(a));
    } else {
      i.preps.forEach((p) => out.add(`${i.adj} ${p}`));
    }
  }
  return [...out];
}

function explainItem(item) {
  if (item.type === 'p') {
    const lines = [`${item.en} = ${item.no}${item.def ? ` (${item.def})` : ''}`];
    const others = PHRASAL.filter((p) => p.verb === item.verb && p.id !== item.id);
    if (others.length) lines.push(`Ikke bland med: ${others.map((p) => `${p.en} (${p.no})`).join(', ')}.`);
    lines.push(`Fortid: ${item.past}.`);
    return lines;
  }
  const lines = [`${item.adj} ${item.preps.join(' / ')} = ${item.no}`];
  if (item.trap) lines.push(`Norsk felle: på norsk sier vi «${item.no}», men på engelsk heter det ${item.adj} ${item.preps[0].toUpperCase()}, ikke «${item.adj} ${item.trap}».`);
  if (item.preps.length > 1) lines.push(`Både ${item.preps.map((p) => `«${item.adj} ${p}»`).join(' og ')} er riktig.`);
  return lines;
}

// ---- question factories ----

const factories = {
  // Phrasal verbs
  pMeaning(item) {
    return {
      mode: 'mc', prompt: 'Hva betyr dette på norsk?', big: item.en,
      options: optionsFrom(item.no, meaningDistractors(item)), answerText: `${item.en} = ${item.no}`,
    };
  },
  pEnglish(item) {
    return {
      mode: 'mc', prompt: 'Hva heter dette på engelsk?', big: item.no,
      options: optionsFrom(item.en, englishDistractors(item)), answerText: `${item.no} = ${item.en}`,
    };
  },
  pGap(item) {
    const gap = gapOf(item);
    const part = item.gapPart || item.part;
    return {
      mode: 'mc', prompt: 'Hvilket ord mangler?', sentence: gap, note: `(${item.no})`,
      options: optionsFrom(part, particleDistractors(item, part)), answerText: fill(gap, part),
    };
  },
  pGapTyped(item) {
    const gap = gapOf(item);
    const part = item.gapPart || item.part;
    return {
      mode: 'typed', prompt: 'Skriv ordet som mangler.', sentence: gap, note: `(${item.no})`,
      accept: [part], answerText: fill(gap, part), placeholder: 'f.eks. up',
    };
  },
  pTranslate(item) {
    return {
      mode: 'typed', prompt: 'Skriv på engelsk:', big: item.no,
      accept: englishFor(item), answerText: `${item.no} = ${item.en}`, placeholder: 'f.eks. give up',
    };
  },
  pDef(item) {
    return {
      mode: 'mc', prompt: 'Which compound verb means ...', big: `«${item.def}»`,
      options: optionsFrom(item.en, englishDistractors(item)), answerText: `${item.en} = ${item.def}`,
    };
  },
  pDefTyped(item) {
    return {
      mode: 'typed', prompt: 'Write the compound verb that means ...', big: `«${item.def}»`,
      accept: [item.en, ...(item.alt || [])], answerText: `${item.en} = ${item.def}`, placeholder: 'f.eks. give up',
    };
  },
  pSentence(item) {
    const gap = gapOf(item);
    const part = item.gapPart || item.part;
    const wrong = particleDistractors(item, part).map((p) => fill(gap, p));
    return {
      mode: 'mc', prompt: 'Hvilken setning er riktig?', note: `(${item.no})`, long: true,
      options: optionsFrom(fill(gap, part), wrong), answerText: fill(gap, part),
    };
  },
  pPast(item) {
    const words = item.en.split(' ');
    const base = item.en;
    const ing = [ingForm(words[0]), ...words.slice(1)].join(' ');
    const regular = item.past.split(' ')[0].endsWith('ed');
    const wrong = [regular ? null : item.wrongPast, base, ing, `${words[0]}s ${words.slice(1).join(' ')}`];
    return {
      mode: 'mc', prompt: `Sett inn «${item.en}» i fortid.`, sentence: item.pastQ,
      options: optionsFrom(item.past, wrong), answerText: fill(item.pastQ, item.past),
    };
  },
  pPastTyped(item) {
    return {
      mode: 'typed', prompt: `Skriv «${item.en}» i fortid.`, sentence: item.pastQ,
      accept: [item.past], answerText: fill(item.pastQ, item.past), placeholder: 'f.eks. gave up',
    };
  },

  // Adjectives + prepositions
  aMeaning(item) {
    return {
      mode: 'mc', prompt: 'Hva betyr dette på norsk?', big: item.en,
      options: optionsFrom(item.no, meaningDistractors(item)), answerText: `${item.en} = ${item.no}`,
    };
  },
  aGap(item) {
    const gap = gapOf(item);
    return {
      mode: 'mc', prompt: 'Hvilken preposisjon er riktig?', sentence: gap, note: `(${item.no})`,
      options: optionsFrom(item.preps[0], prepDistractors(item)), answerText: fill(gap, item.preps[0]),
    };
  },
  aGapTyped(item) {
    const gap = gapOf(item);
    return {
      mode: 'typed', prompt: 'Skriv preposisjonen som mangler.', sentence: gap, note: `(${item.no})`,
      accept: [...item.preps, ...item.preps.map((p) => `${item.adj} ${p}`)],
      answerText: fill(gap, item.preps[0]), placeholder: 'f.eks. of',
    };
  },
  aTranslate(item) {
    return {
      mode: 'typed', prompt: 'Skriv på engelsk:', big: item.no,
      accept: englishFor(item), answerText: `${item.no} = ${item.en}`, placeholder: 'f.eks. afraid of',
    };
  },
  aSentence(item) {
    const gap = gapOf(item);
    const wrong = prepDistractors(item).map((p) => fill(gap, p));
    return {
      mode: 'mc', prompt: 'Hvilken setning er riktig?', note: `(${item.no})`, long: true,
      options: optionsFrom(fill(gap, item.preps[0]), wrong), answerText: fill(gap, item.preps[0]),
    };
  },
};

export const FACTORY_NAMES = Object.keys(factories);
export const TYPED_FACTORIES = FACTORY_NAMES.filter((k) => /Typed$|Translate$/.test(k));

export function makeQuestion(item, factory) {
  const q = factories[factory](item);
  q.factory = factory;
  q.item = item.id;
  q.itemType = item.type;
  q.trap = item.type === 'a' && !!item.trap;
  q.explain = explainItem(item);
  // English text to read aloud after answering.
  q.say = q.answerText.includes(' = ') ? item.en : q.answerText;
  return q;
}

// Weighted item pick: items you often miss come up more.
function pickItem(items, stats, avoid) {
  const weights = items.map((i) => {
    const s = stats[i.id];
    let w = 1;
    if (s && s.seen >= 2) w += 3 * (s.wrong / s.seen);
    if (avoid.has(i.id)) w *= 0.25;
    return w;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export const questionKey = (q) => `${q.factory}:${q.item}`;

// Can this kind of question be asked about this item?
export function fits(kind, item) {
  if (kind[0] !== item.type) return false;
  if (kind.startsWith('pPast')) return !!item.pastQ;
  if (kind.startsWith('pDef')) return !!item.def;
  return true;
}

// Build a round. Kinds rotate so each round mixes multiple choice and typing.
export function makeRound(level, stats = {}, recent = []) {
  const items = level.itemIds ? level.itemIds.map(itemById) : itemsInSets(level.sets);
  const avoidKeys = new Set(recent);
  const kinds = shuffle(level.kinds);
  const out = [];
  const used = new Set();
  const usedItems = new Set();
  let guard = 0;
  while (out.length < level.length && guard < 500) {
    guard += 1;
    // Spread items: avoid repeating an item until most have been used.
    const fresh = usedItems.size >= items.length - 1 ? new Set() : usedItems;
    const item = pickItem(items, stats, fresh);
    const fitting = kinds.filter((k) => fits(k, item));
    if (!fitting.length) continue;
    // Start with the kind whose turn it is, then try the others, so small word lists still fill a round.
    const start = out.length % fitting.length;
    const order = [...fitting.slice(start), ...fitting.slice(0, start)];
    const kind = order.find((k) => !used.has(`${k}:${item.id}`) && (guard >= 200 || !avoidKeys.has(`${k}:${item.id}`)));
    if (!kind) continue;
    used.add(`${kind}:${item.id}`);
    usedItems.add(item.id);
    out.push(makeQuestion(item, kind));
  }
  // Very small word lists: allow a question type again rather than a short round.
  let extra = 0;
  while (out.length < level.length && items.length && extra < 200) {
    extra += 1;
    const item = pickItem(items, stats, new Set());
    const fitting = kinds.filter((k) => fits(k, item));
    if (fitting.length) out.push(makeQuestion(item, pick(fitting)));
  }
  return out;
}

// Repeat a missed item later in the round with another question type.
export function repeatOf(q, level) {
  const item = itemById(q.item);
  const kinds = level.kinds.filter((k) => fits(k, item) && k !== q.factory && !k.startsWith('pPast'));
  const kind = kinds.length ? pick(kinds) : q.factory;
  const r = makeQuestion(item, kind);
  r.repeat = true;
  return r;
}

// ---- levels ----

const P_EASY = ['pMeaning', 'pEnglish', 'pDef', 'pGap', 'pGapTyped', 'pTranslate'];
const P_ALL = ['pMeaning', 'pEnglish', 'pDef', 'pGap', 'pGapTyped', 'pTranslate', 'pDefTyped', 'pSentence'];
const P_BOSS = ['pEnglish', 'pDef', 'pGap', 'pGapTyped', 'pTranslate', 'pDefTyped', 'pSentence'];
const P_BONUS = ['pMeaning', 'pEnglish', 'pGap', 'pGapTyped', 'pTranslate', 'pSentence'];
const A_EASY = ['aMeaning', 'aGap', 'aGapTyped', 'aSentence', 'aTranslate'];
const A_ALL = ['aMeaning', 'aGap', 'aGapTyped', 'aTranslate', 'aSentence'];
const A_BOSS = ['aGap', 'aGapTyped', 'aTranslate', 'aSentence'];

const ids = (set) => ALL_ITEMS.filter((i) => i.set === set).map((i) => i.id);
const half = (set, n) => {
  const list = ids(set);
  const mid = Math.ceil(list.length / 2);
  return n === 1 ? list.slice(0, mid) : list.slice(mid);
};

function world(id, name, icon, intro, set, easy, all, boss, bossName) {
  const names = (n) => half(set, n).map((i) => itemById(i).en).join(', ');
  return {
    id, name, icon, intro,
    levels: [
      { title: 'Lær de første', itemIds: half(set, 1), kinds: easy, intro: `Nye uttrykk: ${names(1)}. Prøv deg fram. Bommer du, kommer det samme uttrykket tilbake senere i runden.` },
      { title: 'Lær resten', itemIds: half(set, 2), kinds: easy, intro: `Nye uttrykk: ${names(2)}.` },
      { title: 'Bland alt', sets: [set], kinds: all, intro: 'Alle uttrykkene i verdenen, med oversetting og «hvilken setning er riktig».' },
      { title: `BOSS: ${bossName}`, sets: [set], kinds: boss, boss: true, timer: 30, length: 12, intro: `${bossName} gir deg 30 sekunder per oppgave. 12 oppgaver, og mange må skrives.` },
    ],
  };
}

const LEVEL_DEFAULTS = { length: 10 };

export const WORLDS = [
  world(1, 'Verbbyen', '🏙️', `${SET_NAMES[1]}. Fra boka side 48.`, 1, P_EASY, P_ALL, P_BOSS, 'Utsetteren'),
  world(2, 'Vennedalen', '🤝', `${SET_NAMES[2]}. Fra boka side 48.`, 2, P_EASY, P_ALL, P_BOSS, 'Kranglefanten'),
  world(3, 'Preposisjonsøya', '🏝️', `${SET_NAMES[3]}. Fra boka side 49.`, 3, A_EASY, A_ALL, A_BOSS, 'Fellefiskeren'),
  world(4, 'Fotballstadion', '⚽', `${SET_NAMES[4]}. Fra boka side 49.`, 4, A_EASY, A_ALL, A_BOSS, 'Dommeren'),
  {
    id: 5, name: 'Prøvelandet', icon: '🏆', intro: 'Alt fra boka side 48-49, og compound verbs i fortid. Perfekt dagen før prøven.',
    levels: [
      { title: 'Compound verbs i fortid', sets: [1, 2], kinds: ['pPast', 'pPastTyped'], intro: 'I fortid bøyer du bare verbet: give up → gave up, sleep over → slept over. Det lille ordet står stille.' },
      { title: 'Alle adjektivene', sets: [3, 4], kinds: A_BOSS, intro: 'Alle adjektiv + preposisjon fra side 49.' },
      { title: 'Alt fra boka', sets: CORE_SETS, kinds: [...P_BOSS, ...A_BOSS], intro: 'Alt fra side 48-49, hulter til bulter.' },
      { title: 'BOSS: Prøvegeneralen', sets: CORE_SETS, kinds: [...P_BOSS, ...A_BOSS, 'pPastTyped'], boss: true, timer: 35, length: 15, intro: 'Den siste bossen: 15 oppgaver fra side 48-49, 35 sekunder hver. Klarer du denne, er du klar for prøven.' },
    ],
  },
  {
    id: 6, name: 'Bonusøya', icon: '🎁', intro: 'Ekstra uttrykk som ikke står på side 48-49. For deg som vil kunne enda mer.',
    levels: [
      { title: 'Flere compound verbs', sets: [5], kinds: P_BONUS, intro: 'get up, turn off, look for, hand in og mange flere.' },
      { title: 'Flere adjektiv', sets: [6], kinds: A_ALL, intro: 'scared of, married to, different from og flere.' },
      { title: 'Bonus i fortid', sets: [5], kinds: ['pPast', 'pPastTyped'], intro: 'Flere uregelrette verb: woke up, took off, wrote down ...' },
      { title: 'BOSS: Bonusbossen', sets: [5, 6], kinds: [...P_BONUS, ...A_BOSS], boss: true, timer: 30, length: 12, intro: 'Alt fra Bonusøya, 30 sekunder per oppgave.' },
    ],
  },
].map((w) => ({
  ...w,
  levels: w.levels.map((l, i) => ({ ...LEVEL_DEFAULTS, ...l, id: `${w.id}-${i + 1}`, world: w.id, n: i + 1 })),
}));

export const LEVELS = WORLDS.flatMap((w) => w.levels);
export const levelById = (id) => LEVELS.find((l) => l.id === id) || null;
export function nextLevel(level) {
  const i = LEVELS.indexOf(level);
  return i >= 0 ? LEVELS[i + 1] || null : null;
}
export function prevLevel(level) {
  const i = LEVELS.indexOf(level);
  return i > 0 ? LEVELS[i - 1] : null;
}
export function starLimits(length) {
  return [0.5, 0.7, 0.9].map((p) => Math.ceil(p * length));
}
export function starsFor(correct, length) {
  return starLimits(length).filter((l) => correct >= l).length;
}

// ---- special modes ----

// Prøveøving: like a real test - many typed answers, no hints.
export function examLevel() {
  return {
    id: 'exam', world: 0, title: 'Prøveøving', length: 20, exam: true,
    sets: CORE_SETS,
    kinds: ['pGapTyped', 'pTranslate', 'pDefTyped', 'pPastTyped', 'pDef', 'pSentence', 'aGapTyped', 'aTranslate', 'aGap', 'aSentence'],
    intro: '20 oppgaver fra boka side 48-49, omtrent som på prøven. Ingen hjelp. Til slutt får du poengsum og en liste over det du bør øve mer på.',
  };
}

export function dailyLevel(dateKey, openSets) {
  const sets = openSets.filter((x) => CORE_SETS.includes(x));
  if (!sets.length) sets.push(1);
  return {
    id: 'daily', world: 0, title: 'Dagens utfordring', length: 10, sets,
    kinds: [...P_ALL, ...A_ALL],
    seed: seedFrom(`engelsk-${dateKey}-${sets.join(',')}`),
    intro: 'Ti oppgaver som er nye hver dag. Første gang i dag gir 50 bonus-XP.',
  };
}

export function makeDailyRound(dateKey, openSets) {
  const level = dailyLevel(dateKey, openSets);
  return { level, round: withRandom(() => makeRound(level), mulberry32(level.seed)) };
}

// Mine feil: the items you miss most.
export function mistakesLevel(stats) {
  const worst = Object.entries(stats)
    .filter(([id, s]) => s.wrong > 0 && itemById(id))
    .sort((a, b) => (b[1].wrong / b[1].seen) - (a[1].wrong / a[1].seen) || b[1].wrong - a[1].wrong)
    .slice(0, 8)
    .map(([id]) => id);
  if (!worst.length) return null;
  return {
    id: 'mistakes', world: 0, title: 'Mine feil', length: 10, itemIds: worst,
    kinds: [...P_ALL, ...A_ALL],
    intro: `Her øver du på de ${worst.length} uttrykkene du har bommet mest på.`,
  };
}

// ---- arcade helpers ----

export function quickQuestion(openSets) {
  const items = itemsInSets(openSets.length ? openSets : [1]);
  const item = pick(items);
  const kind = item.type === 'p' ? pick(['pMeaning', 'pEnglish', 'pGap', ...(item.def ? ['pDef'] : [])]) : pick(['aMeaning', 'aGap']);
  return makeQuestion(item, kind);
}

export function trueFalse(openSets) {
  const items = itemsInSets(openSets.length ? openSets : [1]);
  const item = pick(items);
  const truth = rand() < 0.5;
  const gap = gapOf(item);
  let shown;
  if (item.type === 'p') {
    const part = item.gapPart || item.part;
    shown = truth ? part : particleDistractors(item, part)[0];
  } else {
    shown = truth ? item.preps[0] : prepDistractors(item)[0];
  }
  return { item: item.id, truth, note: item.no, sentence: fill(gap, shown), correct: item.type === 'p' ? fill(gap, item.gapPart || item.part) : fill(gap, item.preps[0]) };
}

export function memoryCards(openSets, pairs = 6) {
  const items = shuffle(itemsInSets(openSets.length ? openSets : [1]));
  const chosen = [];
  const seenNo = new Set();
  for (const i of items) {
    if (!seenNo.has(i.no)) {
      seenNo.add(i.no);
      chosen.push(i);
    }
    if (chosen.length === pairs) break;
  }
  return shuffle(chosen.flatMap((i, n) => [
    { pair: n, lang: 'en', label: i.en },
    { pair: n, lang: 'no', label: i.no },
  ]));
}

