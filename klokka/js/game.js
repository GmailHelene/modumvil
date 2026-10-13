// Levels, question generation and answer checking. No DOM.
import {
  phrase, digital, partOfDay, zoneOf, mod, toDial, addMinutes, durationText, explain, capitalize,
} from './time-no.js';

export const ROUND_LENGTH = 10;
export const MAX_REPEATS = 3;

export const LEVELS = [
  {
    id: 1, title: 'Hele og halve', icon: '🕐',
    intro: 'Klokka er hel når den lange viseren peker rett opp. Halv betyr halvveis til neste time: halv tre er 2:30.',
    minutes: [0, 30], step: 5, kinds: ['readWords', 'set'],
  },
  {
    id: 2, title: 'Kvart over og kvart på', icon: '🍕',
    intro: 'En kvart er 15 minutter. Kvart over to er 2:15. Kvart på tre er 2:45, altså 15 minutter før tre.',
    minutes: [0, 15, 30, 45], step: 5, kinds: ['readWords', 'readDigital', 'set'],
  },
  {
    id: 3, title: 'Fem og ti over og på', icon: '🖐️',
    intro: 'Hvert tall på klokka er 5 minutter for den lange viseren. Peker den på 2, er det ti over. Peker den på 10, er det ti på.',
    minutes: [0, 5, 10, 15, 30, 45, 50, 55], step: 5, kinds: ['readWords', 'readDigital', 'set', 'setDigital'],
  },
  {
    id: 4, title: 'På halv og over halv', icon: '🎯',
    intro: 'Den vanskelige midten: 2:25 er «fem på halv tre», og 2:35 er «fem over halv tre». Vi teller fra halv.',
    minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55], focus: [20, 25, 35, 40], step: 5,
    kinds: ['readWords', 'readDigital', 'set', 'setDigital'],
  },
  {
    id: 5, title: 'Hvert eneste minutt', icon: '🔬',
    intro: 'Nå teller vi de små strekene. Hver strek er ett minutt. 2:17 er «sytten minutter over to».',
    minutes: 'all', step: 1, kinds: ['readWords', 'readDigital', 'set', 'setDigital'],
  },
  {
    id: 6, title: '24-timers klokka', icon: '🌙',
    intro: 'Den analoge klokka går rundt to ganger i døgnet. Etter tolv på dagen legger vi til 12: kvart over tre om ettermiddagen er 15:15.',
    minutes: 'five', step: 5, kinds: ['read24', 'set24'],
  },
  {
    id: 7, title: 'Tidsregning', icon: '🧮',
    intro: 'Hvor lenge til bussen går? Når er filmen ferdig? Her bruker du klokka til ekte ting.',
    minutes: 'five', step: 5, kinds: ['mathLater', 'mathWait', 'mathEnd'],
  },
];

export const STAR_LIMITS = [5, 7, 9]; // correct first tries for 1, 2, 3 stars
export const UNLOCK_STARS = 2;

export function starsFor(correct) {
  return STAR_LIMITS.filter((limit) => correct >= limit).length;
}

export function levelById(id) {
  return LEVELS.find((l) => l.id === id);
}

// ---- randomness (injectable for tests) ----

let rand = Math.random;
export function setRandom(fn) {
  rand = fn;
}
function int(n) {
  return Math.floor(rand() * n);
}
function pick(arr) {
  return arr[int(arr.length)];
}
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = int(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function minutePool(level) {
  if (level.minutes === 'all') return Array.from({ length: 60 }, (_, i) => i);
  if (level.minutes === 'five') return Array.from({ length: 12 }, (_, i) => i * 5);
  return level.minutes;
}

// Weighted pick: weak zones (from stats) and the level's focus minutes come up more often.
export function pickMinute(level, zoneStats = {}) {
  const pool = minutePool(level);
  const weights = pool.map((m) => {
    let w = 1;
    if (level.focus && level.focus.includes(m)) w += 1.5;
    if (level.minutes === 'all' && m % 5 !== 0) w += 0.5;
    const s = zoneStats[zoneOf(m)];
    if (s && s.seen >= 3) w += 2 * (s.wrong / s.seen);
    return w;
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < pool.length; i += 1) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// ---- distractors ----

// Typical mistakes, in order of how instructive they are.
function confusions(h, m, step) {
  const out = [];
  // "halv tre" read as 3:30 - pointing at the current hour instead of the next.
  if (m >= 20 && m <= 40) out.push({ h: h + 1, m });
  // over <-> på mirrored (kvart over vs kvart på, ti på halv vs ti over halv).
  if (m !== 0 && m !== 30) out.push({ h, m: 60 - m });
  // hands swapped: long hand read as hours, short as minutes.
  const swappedH = Math.round(m / 5) || 12;
  const swappedM = mod(h, 12) * 5;
  if (swappedH !== mod(h, 12) || swappedM !== m) out.push({ h: swappedH, m: swappedM });
  // hour hand almost at the next number.
  out.push({ h: h + 1, m });
  out.push({ h: h - 1, m });
  // close minute.
  const d = Math.max(step, 5);
  out.push({ h, m: mod(m + d, 60) });
  out.push({ h, m: mod(m - d, 60) });
  if (m >= 20 && m <= 40) out.push({ h, m: m === 30 ? 0 : 30 });
  return out;
}

export function buildOptions(h, m, format, step = 5) {
  const label = (t) => (format === 'digital' ? digital(t.h, t.m, false) : phrase(t.h, t.m));
  const correctLabel = label({ h, m });
  const seen = new Set([correctLabel]);
  const wrong = [];
  for (const t of [...confusions(h, m, step)]) {
    const l = label({ h: mod(t.h, 12), m: t.m });
    if (!seen.has(l)) {
      seen.add(l);
      wrong.push(l);
    }
    if (wrong.length === 3) break;
  }
  while (wrong.length < 3) {
    const l = label({ h: int(12), m: pick([0, 15, 30, 45, mod(m + 10, 60)]) });
    if (!seen.has(l)) {
      seen.add(l);
      wrong.push(l);
    }
  }
  return shuffle([
    { label: correctLabel, correct: true },
    ...wrong.map((l) => ({ label: l, correct: false })),
  ]);
}

// ---- question factories ----

function randomHour12(level) {
  return level.forceH ?? int(12);
}

function randomHour24(level) {
  return level.forceH ?? 6 + int(17); // 06-22, the hours a kid is awake
}

function baseQuestion(kind, h, m, extra = {}) {
  return {
    kind,
    h,
    m,
    zone: zoneOf(m),
    explain: explain(h, m),
    ...extra,
  };
}

const READ_PROMPTS = ['Hva er klokka?', 'Hvor mye er klokka?', 'Les klokka!'];

const factories = {
  readWords(level, stats) {
    const h = randomHour12(level);
    const m = pickMinute(level, stats);
    return baseQuestion('read', h, m, {
      prompt: pick(READ_PROMPTS),
      options: buildOptions(h, m, 'words', level.step),
      answerText: phrase(h, m),
    });
  },
  readDigital(level, stats) {
    const h = randomHour12(level);
    const m = pickMinute(level, stats);
    return baseQuestion('read', h, m, {
      prompt: 'Hvilken digital tid viser klokka?',
      options: buildOptions(h, m, 'digital', level.step),
      answerText: digital(h, m, false),
    });
  },
  set(level, stats) {
    const h = randomHour12(level);
    const m = pickMinute(level, stats);
    return baseQuestion('set', h, m, {
      prompt: 'Still klokka til',
      target: capitalize(phrase(h, m)),
      answerText: phrase(h, m),
    });
  },
  setDigital(level, stats) {
    const h = randomHour12(level);
    const m = pickMinute(level, stats);
    const hDisp = h === 0 ? 12 : h;
    return baseQuestion('set', h, m, {
      prompt: 'Still klokka til',
      target: digital(hDisp, m, false),
      answerText: phrase(h, m),
    });
  },
  read24(level, stats) {
    const h24 = randomHour24(level);
    const m = pickMinute(level, stats);
    const correct = digital(h24, m, true);
    const alts = new Set([correct]);
    const wrong = [];
    for (const t of [h24 - 12, h24 + 12, h24 + 1, h24 - 1, h24 + 11, h24 - 11]) {
      const l = digital(mod(t, 24), m, true);
      if (!alts.has(l)) {
        alts.add(l);
        wrong.push(l);
      }
    }
    const halfWrong = digital(h24, mod(60 - m, 60), true);
    if (m !== 0 && m !== 30 && !alts.has(halfWrong)) wrong.unshift(halfWrong);
    const options = shuffle([
      { label: correct, correct: true },
      ...shuffle(wrong).slice(0, 3).map((l) => ({ label: l, correct: false })),
    ]);
    return baseQuestion('read', h24, m, {
      prompt: `Klokka er dette ${partOfDay(h24)}. Hva står det på en digital klokke?`,
      options,
      answerText: `${correct} (${phrase(h24, m)} ${partOfDay(h24)})`,
      explain: [
        ...explain(h24, m).slice(0, -1),
        h24 >= 12
          ? `Etter tolv på dagen legger vi til 12 timer: ${mod(h24, 12) || 12} + 12 = ${h24}.`
          : `Før tolv på dagen er timetallet det samme som på klokka: ${pad2(h24)}.`,
        `Svar: ${correct}.`,
      ],
    });
  },
  set24(level, stats) {
    const h24 = randomHour24(level);
    const m = pickMinute(level, stats);
    return baseQuestion('set', h24, m, {
      prompt: 'Still klokka til',
      target: digital(h24, m, true),
      answerText: `${phrase(h24, m)} ${partOfDay(h24)}`,
      explain: [
        h24 >= 12
          ? `${pad2(h24)} er etter tolv på dagen. Trekk fra 12: ${h24} - 12 = ${mod(h24, 12) || 12}.`
          : `${pad2(h24)} er før tolv, så timen er ${h24}.`,
        ...explain(h24, m),
      ],
    });
  },
  mathLater(level, stats) {
    const h = 1 + int(11);
    const m = pickMinute(level, stats);
    const delta = pick([10, 15, 20, 25, 30, 40, 45, 50, 60, 75, 90]);
    const t = addMinutes(h, m, delta);
    return baseQuestion('read', h, m, {
      prompt: `Hva er klokka om ${durationText(delta)}?`,
      options: buildOptions(t.h, t.m, 'words', 5),
      answerText: phrase(t.h, t.m),
      explain: [
        `Klokka viser ${phrase(h, m)} (${digital(h, m, false)}).`,
        `Legg til ${durationText(delta)}: ${digital(h, m, false)} + ${delta} min = ${digital(mod(t.h, 12) || 12, t.m, false)}.`,
        `Svar: ${phrase(t.h, t.m)}.`,
      ],
    });
  },
  mathWait(level, stats) {
    const scenes = [
      ['Bussen går', 'Hvor mange minutter må du vente?'],
      ['Fotballtreningen starter', 'Hvor lenge er det til treningen starter?'],
      ['Middagen er klar', 'Hvor lenge må du vente på middagen?'],
      ['Bursdagsselskapet begynner', 'Hvor lenge er det til selskapet begynner?'],
    ];
    const [what, ask] = pick(scenes);
    const h = 1 + int(11);
    const m = pickMinute(level, stats);
    const wait = pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50]);
    const t = addMinutes(h, m, wait);
    const options = new Map([[wait, true]]);
    for (const d of shuffle([wait + 5, wait - 5, wait + 10, wait - 10, 60 - wait, wait + 30])) {
      if (d > 0 && d < 120 && !options.has(d)) options.set(d, false);
      if (options.size === 4) break;
    }
    return baseQuestion('read', h, m, {
      prompt: `${what} ${phrase(t.h, t.m)}. Klokka er som vist. ${ask}`,
      options: shuffle([...options].map(([d, correct]) => ({ label: durationText(d), correct }))),
      answerText: durationText(wait),
      explain: [
        `Nå: ${phrase(h, m)} (${digital(h, m, false)}).`,
        `${what}: ${phrase(t.h, t.m)} (${digital(mod(t.h, 12) || 12, t.m, false)}).`,
        `Tell minuttene fra ${digital(h, m, false)} til ${digital(mod(t.h, 12) || 12, t.m, false)}: ${wait} minutter.`,
      ],
    });
  },
  mathEnd(level, stats) {
    const scenes = [
      ['Filmen starter', 'og varer', 'Når er filmen ferdig?'],
      ['Du begynner å game', 'og har lov til å spille i', 'Når må du slutte?'],
      ['Pizzaen settes i ovnen', 'og skal steke i', 'Når er pizzaen ferdig?'],
      ['Skoledagen starter', 'og første økt varer', 'Når er første økt ferdig?'],
    ];
    const [start, mid, ask] = pick(scenes);
    const h = 1 + int(11);
    const m = pickMinute(level, stats);
    const dur = pick([15, 20, 30, 45, 50, 60, 75, 90, 105, 120]);
    const t = addMinutes(h, m, dur);
    return baseQuestion('read', h, m, {
      prompt: `${start} som vist på klokka, ${mid} ${durationText(dur)}. ${ask}`,
      options: buildOptions(t.h, t.m, 'words', 5),
      answerText: phrase(t.h, t.m),
      explain: [
        `Start: ${phrase(h, m)} (${digital(h, m, false)}).`,
        `${durationText(dur)} senere: ${digital(mod(t.h, 12) || 12, t.m, false)}.`,
        `Svar: ${phrase(t.h, t.m)}.`,
      ],
    });
  },
};

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function makeQuestion(level, stats = {}, kind = null) {
  const k = kind || pick(level.kinds);
  const q = factories[k](level, stats);
  q.factory = k;
  q.levelId = level.id;
  q.step = level.step;
  q.is24 = k === 'read24' || k === 'set24';
  return q;
}

// A round alternates question kinds so every round both reads and sets.
export function makeRound(level, stats = {}) {
  const kinds = shuffle(level.kinds);
  const qs = [];
  const used = new Set();
  let guard = 0;
  while (qs.length < ROUND_LENGTH && guard < 200) {
    guard += 1;
    const q = makeQuestion(level, stats, kinds[qs.length % kinds.length]);
    const key = `${q.factory}-${q.h}-${q.m}`;
    if (!used.has(key)) {
      used.add(key);
      qs.push(q);
    }
  }
  return qs;
}

// Repeat a missed time later in the round, as the other kind of task.
export function repeatOf(q, level) {
  const kind = q.kind === 'read'
    ? (level.kinds.includes('set24') && q.is24 ? 'set24' : 'set')
    : (q.is24 ? 'read24' : 'readWords');
  if (!factories[kind] || q.factory.startsWith('math')) return null;
  const fixed = { ...level, minutes: [q.m], focus: null, forceH: q.h };
  const r = makeQuestion(fixed, {}, kind);
  r.repeat = true;
  return r;
}

// Set-tasks: compare on the 12-hour dial.
export function checkSet(q, dial) {
  return toDial(q.h, q.m) === mod(dial, 720);
}

// Lightning round: random read questions from unlocked levels 1-6.
export function makeLightningQuestion(unlockedIds, stats = {}) {
  const levels = LEVELS.filter((l) => unlockedIds.includes(l.id) && l.id <= 6);
  const level = levels.length ? pick(levels) : LEVELS[0];
  const kind = pick(level.kinds.filter((k) => k.startsWith('read')));
  return makeQuestion(level, stats, kind);
}
