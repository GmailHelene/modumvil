// Question generation and answer checking. No DOM.
import {
  phrase, digital, partOfDay, zoneOf, mod, toDial, addMinutes, durationText, explain, capitalize,
} from './time-no.js';
import { LEVELS, WORLDS } from './levels.js';

export const MAX_REPEATS = 3;

// ---- randomness (injectable for tests and seeded daily challenges) ----

let rand = Math.random;
export function setRandom(fn) {
  rand = fn;
}
export function random() {
  return rand();
}

// Small, fast seeded generator. Same seed -> same sequence on every device.
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
  try {
    return fn();
  } finally {
    rand = before;
  }
}

export function int(n) {
  return Math.floor(rand() * n);
}
export function pick(arr) {
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

export function minutePool(level) {
  const m = level.minutes;
  if (m === 'all') return Array.from({ length: 60 }, (_, i) => i);
  if (m === 'five') return Array.from({ length: 12 }, (_, i) => i * 5);
  if (m && typeof m === 'object' && !Array.isArray(m)) {
    return Array.from({ length: m.to - m.from + 1 }, (_, i) => m.from + i);
  }
  return m;
}

// Weighted pick: weak zones (from stats) and the level's focus minutes come up more often.
export function pickMinute(level, zoneStats = {}) {
  const pool = minutePool(level);
  const weights = pool.map((m) => {
    let w = 1;
    if (level.focus && level.focus.includes(m)) w += 1.5;
    if (level.step === 1 && m % 5 !== 0) w += 0.5;
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

// Three wrong times, built from typical mistakes.
export function wrongTimes(h, m, step = 5, count = 3) {
  const key = (t) => toDial(t.h, t.m);
  const seen = new Set([key({ h, m })]);
  const out = [];
  for (const t of confusions(h, m, step)) {
    const n = { h: mod(t.h, 12), m: t.m };
    if (!seen.has(key(n))) {
      seen.add(key(n));
      out.push(n);
    }
    if (out.length === count) return out;
  }
  while (out.length < count) {
    const n = { h: int(12), m: pick([0, 15, 30, 45, mod(m + 10, 60), mod(m + 20, 60)]) };
    if (!seen.has(key(n))) {
      seen.add(key(n));
      out.push(n);
    }
  }
  return out;
}

export function buildOptions(h, m, format, step = 5) {
  const label = (t) => (format === 'digital' ? digital(t.h, t.m, false) : phrase(t.h, t.m));
  return shuffle([
    { label: label({ h, m }), correct: true },
    ...wrongTimes(h, m, step).map((t) => ({ label: label(t), correct: false })),
  ]);
}

// ---- text variety ----

const NAMES = ['Emma', 'Noah', 'Sara', 'Ali', 'Ingrid', 'Jonas', 'Maja', 'Elias', 'Nora', 'Filip', 'Leah', 'Oskar', 'Amina', 'Theo', 'Ella', 'Lukas'];

const READ_PROMPTS = ['Hva er klokka?', 'Hvor mye er klokka?', 'Les klokka!', 'Hva viser klokka?', 'Klarer du denne?'];
const DIGITAL_PROMPTS = ['Hvilken digital tid viser klokka?', 'Hva står det på en digital klokke?', 'Skriv den digitalt: hvilken passer?'];
const SET_PROMPTS = ['Still klokka til', 'Dra viserne til', 'Vis meg', 'Kan du stille klokka til'];

const LATER = [
  (n, d) => `Hva er klokka om ${d}?`,
  (n, d) => `${n} skal ut om ${d}. Hva er klokka da?`,
  (n, d) => `Om ${d} ringer det inn. Hva er klokka da?`,
  (n, d) => `${n} setter på en timer på ${d}. Hva er klokka når den piper?`,
  (n, d) => `Pausen varer ${d}. Hva er klokka når den er slutt?`,
];

const WAIT = [
  ['Bussen går', 'Hvor lenge må du vente?'],
  ['Fotballtreningen starter', 'Hvor lenge er det til treningen?'],
  ['Middagen er klar', 'Hvor lenge må du vente på middagen?'],
  ['Bursdagsselskapet begynner', 'Hvor lenge er det til selskapet?'],
  ['Filmen på kino starter', 'Hvor lenge er det til filmen?'],
  ['Svømmehallen åpner', 'Hvor lenge må dere vente?'],
  ['Toget går', 'Hvor lenge er det til toget går?'],
  ['Gamingturneringen starter', 'Hvor lenge er det til start?'],
  ['Mormor kommer', 'Hvor lenge er det til hun kommer?'],
  ['Skolen slutter', 'Hvor lenge er det igjen av skoledagen?'],
];

const END = [
  ['Filmen starter', 'og varer', 'Når er filmen ferdig?'],
  ['Du begynner å game', 'og har lov til å spille i', 'Når må du slutte?'],
  ['Pizzaen settes i ovnen', 'og skal steke i', 'Når er pizzaen ferdig?'],
  ['Første skoletime starter', 'og varer', 'Når er timen ferdig?'],
  ['Kampen starter', 'og varer', 'Når er kampen slutt?'],
  ['{n} begynner på leksene', 'og bruker', 'Når er leksene ferdige?'],
  ['Turen starter', 'og tar', 'Når er dere framme?'],
  ['Kaka settes i ovnen', 'og skal steke i', 'Når må den tas ut?'],
  ['Konserten begynner', 'og varer', 'Når er konserten slutt?'],
  ['{n} legger seg for å sove middag', 'og sover i', 'Når våkner {n}?'],
];

const BEFORE = [
  (n, d) => `Hva var klokka for ${d} siden?`,
  (n, d) => `${n} kom hjem for ${d} siden. Når kom ${n} hjem?`,
  (n, d) => `Bussen gikk for ${d} siden. Når gikk den?`,
  (n, d) => `Kaka har stått i ovnen i ${d}. Når ble den satt inn?`,
  (n, d) => `${n} har gamet i ${d}. Når begynte ${n}?`,
  (n, d) => `Friminuttet begynte for ${d} siden. Når begynte det?`,
];

// ---- question factories ----

function randomHour12(level) {
  return level.forceH ?? int(12);
}

function randomHour24(level) {
  if (level.forceH !== undefined) return level.forceH;
  if (Array.isArray(level.hours)) return pick(level.hours);
  if (level.hours === 'all') return int(24);
  return 6 + int(17); // 06-22, the hours a kid is awake
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

function pad2(n) {
  return String(n).padStart(2, '0');
}

function digital12(h, m) {
  return digital(mod(h, 12) || 12, m, false);
}

function durationOptions(correct) {
  const options = new Map([[correct, true]]);
  for (const d of shuffle([correct + 5, correct - 5, correct + 10, correct - 10, 60 - correct, correct + 30, correct + 60])) {
    if (d > 0 && d < 240 && !options.has(d)) options.set(d, false);
    if (options.size === 4) break;
  }
  return shuffle([...options].map(([d, ok]) => ({ label: durationText(d), correct: ok })));
}

const factories = {
  readWords(level, stats) {
    const h = randomHour12(level);
    const m = pickMinute(level, stats);
    return baseQuestion('read', h, m, {
      prompt: pick(READ_PROMPTS),
      options: buildOptions(h, m, 'words', level.step),
      answerText: phrase(h, m),
      answerTime: { h, m },
    });
  },
  readDigital(level, stats) {
    const h = randomHour12(level);
    const m = pickMinute(level, stats);
    return baseQuestion('read', h, m, {
      prompt: pick(DIGITAL_PROMPTS),
      options: buildOptions(h, m, 'digital', level.step),
      answerText: digital12(h, m),
      answerTime: { h, m },
    });
  },
  set(level, stats) {
    const h = randomHour12(level);
    const m = pickMinute(level, stats);
    return baseQuestion('set', h, m, {
      prompt: pick(SET_PROMPTS),
      target: capitalize(phrase(h, m)),
      answerText: phrase(h, m),
    });
  },
  setDigital(level, stats) {
    const h = randomHour12(level);
    const m = pickMinute(level, stats);
    return baseQuestion('set', h, m, {
      prompt: pick(SET_PROMPTS),
      target: digital12(h, m),
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
      answerTime: { h: h24, m },
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
      prompt: pick(SET_PROMPTS),
      target: digital(h24, m, true),
      answerText: `${phrase(h24, m)} ${partOfDay(h24)}`,
      explain: [
        h24 > 12
          ? `${pad2(h24)} er etter tolv på dagen. Trekk fra 12: ${h24} - 12 = ${h24 - 12}.`
          : `${pad2(h24)}: timen på klokka er ${mod(h24, 12) || 12}.`,
        ...explain(h24, m),
      ],
    });
  },
  mathLater(level, stats) {
    const h = 1 + int(11);
    const m = pickMinute(level, stats);
    const delta = pick(level.deltas || [10, 15, 20, 25, 30, 40, 45, 50, 60, 75, 90]);
    const t = addMinutes(h, m, delta);
    return baseQuestion('read', h, m, {
      prompt: pick(LATER)(pick(NAMES), durationText(delta)),
      options: buildOptions(t.h, t.m, 'words', 5),
      answerText: phrase(t.h, t.m),
      answerTime: { h: t.h, m: t.m },
      explain: [
        `Klokka viser ${phrase(h, m)} (${digital12(h, m)}).`,
        `Legg til ${durationText(delta)}: ${digital12(h, m)} + ${delta} min = ${digital12(t.h, t.m)}.`,
        `Svar: ${phrase(t.h, t.m)}.`,
      ],
    });
  },
  mathBefore(level, stats) {
    const h = 1 + int(11);
    const m = pickMinute(level, stats);
    const delta = pick(level.deltas || [5, 10, 15, 20, 30, 45, 60]);
    const t = addMinutes(h, m, -delta);
    return baseQuestion('read', h, m, {
      prompt: pick(BEFORE)(pick(NAMES), durationText(delta)),
      options: buildOptions(t.h, t.m, 'words', 5),
      answerText: phrase(t.h, t.m),
      answerTime: { h: t.h, m: t.m },
      explain: [
        `Klokka viser ${phrase(h, m)} (${digital12(h, m)}).`,
        `Trekk fra ${durationText(delta)}: ${digital12(h, m)} - ${delta} min = ${digital12(t.h, t.m)}.`,
        `Svar: ${phrase(t.h, t.m)}.`,
      ],
    });
  },
  mathWait(level, stats) {
    const [what, ask] = pick(WAIT);
    const h = 1 + int(11);
    const m = pickMinute(level, stats);
    const wait = pick([5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 70, 90]);
    const t = addMinutes(h, m, wait);
    return baseQuestion('read', h, m, {
      prompt: `${what} ${phrase(t.h, t.m)}. Klokka er som vist. ${ask}`,
      options: durationOptions(wait),
      answerText: durationText(wait),
      answerMinutes: wait,
      explain: [
        `Nå: ${phrase(h, m)} (${digital12(h, m)}).`,
        `${what}: ${phrase(t.h, t.m)} (${digital12(t.h, t.m)}).`,
        `Tell fra ${digital12(h, m)} til ${digital12(t.h, t.m)}: ${durationText(wait)}.`,
      ],
    });
  },
  mathEnd(level, stats) {
    const name = pick(NAMES);
    const [start, mid, ask] = pick(END).map((s) => s.replaceAll('{n}', name));
    const h = 1 + int(11);
    const m = pickMinute(level, stats);
    const dur = pick(level.deltas || [15, 20, 30, 45, 50, 60, 75, 90, 105, 120]);
    const t = addMinutes(h, m, dur);
    return baseQuestion('read', h, m, {
      prompt: `${start} som vist på klokka, ${mid} ${durationText(dur)}. ${ask}`,
      options: buildOptions(t.h, t.m, 'words', 5),
      answerText: phrase(t.h, t.m),
      answerTime: { h: t.h, m: t.m },
      explain: [
        `Start: ${phrase(h, m)} (${digital12(h, m)}).`,
        `${capitalize(durationText(dur))} senere: ${digital12(t.h, t.m)}.`,
        `Svar: ${phrase(t.h, t.m)}.`,
      ],
    });
  },
};

export const FACTORY_NAMES = Object.keys(factories);

export function makeQuestion(level, stats = {}, kind = null) {
  const k = kind || pick(level.kinds);
  const q = factories[k](level, stats);
  q.factory = k;
  q.levelId = level.id;
  q.step = level.step;
  q.is24 = k === 'read24' || k === 'set24';
  q.isMath = k.startsWith('math');
  return q;
}

export function questionKey(q) {
  return `${q.factory}:${q.h}:${q.m}:${q.isMath ? q.prompt.length : ''}`;
}

// ---- free-text answers ----

const TYPE_PROMPTS = ['Hva er klokka? Skriv svaret.', 'Skriv hva klokka er.', 'Skriv klokkeslettet selv.', 'Hva viser klokka? Skriv det.'];

// Turn a multiple-choice question into one where the answer is typed.
export function toTyped(q) {
  if (q.kind !== 'read') return q;
  if (q.answerMinutes !== undefined) {
    q.input = { mode: 'duration', minutes: q.answerMinutes };
  } else if (q.factory === 'read24') {
    q.input = { mode: 'time24', h: q.answerTime.h, m: q.answerTime.m };
    q.prompt = q.prompt.replace('Hva står det på en digital klokke?', 'Skriv tiden med 24-timers klokke.');
  } else if (q.answerTime) {
    q.input = { mode: 'time', h: q.answerTime.h, m: q.answerTime.m };
    if (!q.isMath) q.prompt = pick(TYPE_PROMPTS);
    const t = q.answerTime;
    q.answerText = `${phrase(t.h, t.m)} (${digital12(t.h, t.m)})`;
  } else {
    return q;
  }
  q.options = null;
  q.typed = true;
  return q;
}

// Share of reading tasks that are typed instead of multiple choice.
export function typedShare(level) {
  return level.timer ? 0.35 : 0.45;
}

// A round alternates question kinds so every round both reads and sets.
// `recent` holds keys from earlier rounds: we try hard to avoid repeating them.
export function makeRound(level, stats = {}, recent = []) {
  const avoid = new Set(recent);
  const kinds = shuffle(level.kinds);
  const qs = [];
  const used = new Set();
  const length = level.length || 10;
  let guard = 0;
  while (qs.length < length && guard < 400) {
    guard += 1;
    const q = makeQuestion(level, stats, kinds[qs.length % kinds.length]);
    const key = questionKey(q);
    if (used.has(key)) continue;
    // After many tries, allow old questions back (small pools would starve otherwise).
    if (avoid.has(key) && guard < 150) continue;
    used.add(key);
    qs.push(q);
  }
  // A good mix: a fixed share of the reading tasks become free-text, spread at random.
  const reads = shuffle(qs.filter((q) => q.kind === 'read'));
  const typedCount = Math.round(reads.length * typedShare(level));
  reads.slice(0, typedCount).forEach(toTyped);
  return qs;
}

// Repeat a missed time later in the round, as the other kind of task.
export function repeatOf(q, level) {
  if (q.isMath) return null;
  const kind = q.kind === 'read'
    ? (q.is24 ? 'set24' : 'set')
    : (q.is24 ? 'read24' : 'readWords');
  const fixed = { ...level, minutes: [q.m], focus: null, forceH: q.h };
  const r = makeQuestion(fixed, {}, kind);
  r.repeat = true;
  return r;
}

// Set-tasks: compare on the 12-hour dial.
export function checkSet(q, dial) {
  return toDial(q.h, q.m) === mod(dial, 720);
}

// ---- daily challenge ----

export function dailyLevel(dateKey, unlockedIds = []) {
  // Difficulty grows with progress, but the questions are the same for everyone with the same progress.
  const open = LEVELS.filter((l) => unlockedIds.includes(l.id) && !l.kinds.some((k) => k.startsWith('math')));
  const top = open.length ? open[open.length - 1] : LEVELS[0];
  return {
    id: 'daily',
    world: 0,
    title: 'Dagens utfordring',
    intro: 'Ti nye oppgaver hver dag. Første gang du fullfører i dag får du 50 bonus-XP.',
    minutes: top.minutes,
    step: top.step,
    numbers: 'arabic',
    kinds: ['readWords', 'readDigital', 'set', 'setDigital'],
    length: 10,
    seed: seedFrom(`klokkemester-${dateKey}-${top.id}`),
  };
}

export function makeDailyRound(dateKey, unlockedIds) {
  const level = dailyLevel(dateKey, unlockedIds);
  const round = withRandom(() => makeRound(level), mulberry32(level.seed));
  return { level, round };
}

// ---- arcade helpers ----

// Levels the arcade may draw from: everything unlocked, and always world 1.
const hasRead = (l) => l.kinds.some((k) => k.startsWith('read'));
const isMath = (l) => l.kinds.some((k) => k.startsWith('math'));

export function arcadeLevels(unlockedIds) {
  return LEVELS.filter((l) => (unlockedIds.includes(l.id) || l.world === 1) && !isMath(l) && hasRead(l));
}

export function arcadeQuestion(unlockedIds, stats = {}) {
  const level = pick(arcadeLevels(unlockedIds));
  const kind = pick(level.kinds.filter((k) => k.startsWith('read')));
  return makeQuestion(level, stats, kind);
}

// One time from the arcade pool: { h, m, step }.
export function arcadeTime(unlockedIds) {
  const level = pick(arcadeLevels(unlockedIds));
  const h = level.kinds.includes('read24') ? int(12) : randomHour12(level);
  return { h, m: pickMinute(level), step: level.step };
}

// "Sant eller usant": a clock and a statement that is true half the time.
export function trueFalseQuestion(unlockedIds) {
  const { h, m, step } = arcadeTime(unlockedIds);
  const truth = rand() < 0.5;
  const shown = truth ? { h, m } : pick(wrongTimes(h, m, step));
  const digitalForm = rand() < 0.3;
  return {
    h, m, truth,
    statement: digitalForm ? digital12(shown.h, shown.m) : capitalize(phrase(shown.h, shown.m)),
    answerText: phrase(h, m),
  };
}

// "Finn klokka": a phrase and four clocks.
export function pickClockQuestion(unlockedIds) {
  const { h, m, step } = arcadeTime(unlockedIds);
  const clocks = shuffle([{ h, m, correct: true }, ...wrongTimes(h, m, step).map((t) => ({ ...t, correct: false }))]);
  return {
    h, m, clocks,
    target: rand() < 0.3 ? digital12(h, m) : capitalize(phrase(h, m)),
  };
}

// Memory: `pairs` different times, each as a clock card and a text card.
export function memoryCards(unlockedIds, pairs = 6) {
  const times = [];
  const seen = new Set();
  let guard = 0;
  while (times.length < pairs && guard < 500) {
    guard += 1;
    const { h, m } = arcadeTime(unlockedIds);
    const k = toDial(h, m);
    if (!seen.has(k)) {
      seen.add(k);
      times.push({ h, m });
    }
  }
  const cards = [];
  times.forEach((t, i) => {
    cards.push({ pair: i, type: 'clock', h: t.h, m: t.m });
    cards.push({ pair: i, type: 'text', label: rand() < 0.35 ? digital12(t.h, t.m) : capitalize(phrase(t.h, t.m)) });
  });
  return shuffle(cards);
}

// Tidslinja: four times within a few hours, to tap in order.
export function orderSet(unlockedIds, count = 4) {
  const level = pick(arcadeLevels(unlockedIds));
  const baseH = 1 + int(8);
  const pool = level.step === 1 ? 1 : 5;
  const seen = new Set();
  const times = [];
  while (times.length < count) {
    const total = baseH * 60 + int(Math.floor(180 / pool)) * pool;
    if (!seen.has(total)) {
      seen.add(total);
      times.push({ h: Math.floor(total / 60), m: total % 60, total });
    }
  }
  return shuffle(times);
}

// Overlevelse: difficulty follows the score.
export function survivalQuestion(score, stats = {}) {
  const ladder = LEVELS.filter((l) => !isMath(l) && hasRead(l) && !l.boss);
  const idx = Math.min(ladder.length - 1, Math.floor(score / 3));
  const level = ladder[Math.max(0, idx - int(3))];
  const kind = pick(level.kinds.filter((k) => k.startsWith('read')));
  return makeQuestion(level, stats, kind);
}

export { WORLDS };
