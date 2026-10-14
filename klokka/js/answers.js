// Free-text answers: understand what a kid types and compare it to the right time.
// Pure functions, no DOM - covered by tests/answers.test.mjs.
//
// Accepted, for example (all mean 9:05):
//   9:05  09:05  9.05  9,05  9 05  905  0905  kl 9:05
//   fem over ni   5 over 9   klokka er fem over ni   fem minutter over ni
// Any correct Norwegian phrasing works, also ones the game does not use itself
// ("tjue over ni" for 9:20, "syv" for "sju").

import { mod } from './time-no.js';

const fold = (s) => s
  .toLowerCase()
  .replace(/å/g, 'a')
  .replace(/[øö]/g, 'o')
  .replace(/[æä]/g, 'ae')
  .replace(/é/g, 'e');

const UNITS = {
  null: 0, en: 1, ett: 1, et: 1, ei: 1, to: 2, tre: 3, fire: 4, fem: 5, seks: 6, sju: 7, syv: 7,
  atte: 8, ni: 9, ti: 10, elleve: 11, tolv: 12, tretten: 13, fjorten: 14, femten: 15,
  seksten: 16, sytten: 17, atten: 18, nitten: 19,
};
const TENS = {
  tjue: 20, tyve: 20, tretti: 30, tredve: 30, forti: 40, forr: 40, femti: 50, seksti: 60,
};

// "tjuefem" -> 25, "fem" -> 5, "12" -> 12, "kvart" -> 15. Returns null if not a number.
export function wordNumber(token) {
  if (/^\d+$/.test(token)) return Number(token);
  if (token === 'kvart') return 15;
  if (token in UNITS) return UNITS[token];
  for (const [w, n] of Object.entries(TENS)) {
    if (token === w) return n;
    if (token.startsWith(w)) {
      const rest = token.slice(w.length);
      if (rest in UNITS && UNITS[rest] > 0 && UNITS[rest] < 10) return n + UNITS[rest];
    }
  }
  return null;
}

const FILLER = new Set(['klokka', 'klokken', 'kl', 'er', 'den', 'det', 'ca', 'cirka', 'presis', 'akkurat', 'noyaktig',
  'minutt', 'minutter', 'min', 'og']);

function tokens(text) {
  return fold(text)
    .replace(/[!?«»"'()]/g, ' ')
    .replace(/(\d)([a-z])/g, '$1 $2')
    .replace(/([a-z])(\d)/g, '$1 $2')
    .split(/[\s,.;:-]+/)
    .filter(Boolean);
}

// Digital forms: "9", "09", "9:05", "09.05", "9 05", "905", "0905", "21:45". Returns {h, m} (h 0-23) or null.
export function parseDigital(text) {
  const t = fold(text).trim().replace(/^kl\.?\s*/, '').replace(/\s*(om \w+|pa \w+)$/, '');
  let m = t.match(/^(\d{1,2})\s*[:.,\s-]\s*(\d{2})$/);
  if (m) return valid(Number(m[1]), Number(m[2]));
  m = t.match(/^(\d{1,4})$/);
  if (!m) return null;
  const d = m[1];
  if (d.length <= 2) return valid(Number(d), 0);
  if (d.length === 3) return valid(Number(d[0]), Number(d.slice(1)));
  return valid(Number(d.slice(0, 2)), Number(d.slice(2)));
}

function valid(h, m) {
  if (h > 24 || m > 59) return null;
  if (h === 24) return m === 0 ? { h: 0, m: 0 } : null;
  return { h, m };
}

// Norwegian words: "fem over ni", "halv tre", "kvart på fire", "ti på halv tre", "tre".
// Returns {h (0-11), m} or null.
export function parseWords(text) {
  // Filler words never change the meaning: "klokka er fem minutter over ni".
  const raw = tokens(text).filter((w) => !FILLER.has(w));
  if (!raw.length) return null;
  const n = (w) => wordNumber(w);
  const hourOf = (w) => {
    const v = n(w);
    return v !== null && v >= 1 && v <= 12 ? v : (v === 0 ? 12 : null);
  };
  const s = raw.join(' ');

  // "<H>" alone.
  if (raw.length === 1) {
    const h = hourOf(raw[0]);
    return h === null ? null : { h: mod(h, 12), m: 0 };
  }
  // "halv <H>"
  let r = s.match(/^halv (\S+)$/);
  if (r) {
    const h = hourOf(r[1]);
    return h === null ? null : { h: mod(h - 1, 12), m: 30 };
  }
  // "<N> over halv <H>" / "<N> pa halv <H>"
  r = s.match(/^(\S+) (over|pa) halv (\S+)$/);
  if (r) {
    const k = n(r[1]);
    const h = hourOf(r[3]);
    if (k === null || h === null || k < 1 || k > 29) return null;
    const m = r[2] === 'over' ? 30 + k : 30 - k;
    return { h: mod(h - 1, 12), m };
  }
  // "<N> over <H>" / "<N> pa <H>"
  r = s.match(/^(\S+) (over|pa) (\S+)$/);
  if (r) {
    const k = n(r[1]);
    const h = hourOf(r[3]);
    if (k === null || h === null || k < 1 || k > 59) return null;
    return r[2] === 'over' ? { h: mod(h, 12), m: k } : { h: mod(h - 1, 12), m: 60 - k };
  }
  return null;
}

// Any clock time, digital or words. Returns {h, m, digital: bool} or null.
export function parseTime(text) {
  const d = parseDigital(text);
  if (d) return { ...d, digital: true };
  const w = parseWords(text);
  return w ? { ...w, digital: false } : null;
}

// Durations: "25", "25 min", "1 time og 10 minutter", "1t 10m", "1:10", "et kvarter", "halvannen time".
export function parseDuration(text) {
  let t = fold(text).trim();
  if (!t) return null;
  const special = {
    'et kvarter': 15, 'ett kvarter': 15, kvarter: 15, 'en kvarter': 15,
    'tre kvarter': 45, 'en halv time': 30, 'halv time': 30, 'halvtime': 30, 'en halvtime': 30,
    'halvannen time': 90, halvannen: 90, 'en time': 60, 'ei time': 60, time: 60,
    'en og en halv time': 90, 'to timer': 120,
  };
  t = t.replace(/[!?.]$/g, '').replace(/\s+/g, ' ');
  if (t in special) return special[t];
  let r = t.match(/^(\d{1,2})\s*:\s*(\d{2})$/);
  if (r) return Number(r[1]) * 60 + Number(r[2]);
  const words = tokens(t).filter((w) => w !== 'og');
  let total = 0;
  let pending = null;
  let any = false;
  for (const w of words) {
    if (['time', 'timer', 't', 'h', 'tim'].includes(w)) {
      total += (pending ?? 1) * 60;
      pending = null;
      any = true;
    } else if (['min', 'minutt', 'minutter', 'm', 'mins'].includes(w)) {
      if (pending === null) return null;
      total += pending;
      pending = null;
      any = true;
    } else if (w === 'kvarter') {
      total += (pending ?? 1) * 15;
      pending = null;
      any = true;
    } else if (w === 'halv' || w === 'en' || w === 'et' || w === 'ett') {
      // "en time", "en halv time" handled through pending
      if (w === 'halv') { total += 30; any = true; } else pending = 1;
    } else {
      const v = wordNumber(w);
      if (v === null) return null;
      if (pending !== null) total += pending;
      pending = v;
    }
  }
  if (pending !== null) { total += pending; any = true; }
  return any ? total : null;
}

// Check a typed answer against a question.
// Returns { ok: true|false } or { ok: null, hint } when the text could not be understood.
export function checkTyped(q, text) {
  const input = q.input;
  const clean = (text || '').trim();
  if (!clean) return { ok: null, hint: 'Skriv et svar først.' };

  if (input.mode === 'duration') {
    const mins = parseDuration(clean);
    if (mins === null) return { ok: null, hint: 'Skriv antall minutter, for eksempel 25 eller «1 time og 10 minutter».' };
    return { ok: mins === input.minutes, parsed: mins };
  }

  if (input.mode === 'time24') {
    const d = parseDigital(clean);
    if (!d) return { ok: null, hint: 'Skriv tiden med tall, for eksempel 21:45 eller 0945.' };
    return { ok: d.h === mod(input.h, 24) && d.m === input.m, parsed: d };
  }

  const t = parseTime(clean);
  if (!t) return { ok: null, hint: 'Jeg forsto ikke helt. Skriv for eksempel 9:05 eller «fem over ni».' };
  // The analog clock does not show morning or evening, so 9:05 and 21:05 are both right.
  return { ok: mod(t.h, 12) === mod(input.h, 12) && t.m === input.m, parsed: t };
}

