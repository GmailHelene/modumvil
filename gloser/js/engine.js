// Pure game logic: items, question factories, rounds, answer checking, week parsing.
// No DOM here, so it can be unit tested with node --test.
import { BUILTIN_WEEKS } from './data.js';

// ---------- randomness ----------

let rand = Math.random;
export function setRandom(fn) { rand = fn || Math.random; }
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

// ---------- items and weeks ----------

export function slug(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '') || 'x';
}

// Turn a week (built-in or custom) into a flat list of items with stable ids.
export function itemsOfWeek(week) {
  const items = [];
  const seen = new Set();
  for (const g of week.gloss || []) {
    const id = `${week.id}:g:${slug(g.en)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({
      id, week: week.id, type: 'gloss', text: g.en, en: g.en, no: g.no.slice(),
      sentence: g.sentence || null, misspell: g.misspell || [],
    });
  }
  for (const w of week.words || []) {
    const id = `${week.id}:w:${slug(w.word)}`;
    if (seen.has(id)) continue;
    seen.add(id);
    items.push({
      id, week: week.id, type: 'word', text: w.word, word: w.word,
      parts: w.parts || null, sentence: w.sentence || null, misspell: w.misspell || [],
    });
  }
  return items;
}

export const builtinItems = () => BUILTIN_WEEKS.flatMap(itemsOfWeek);

// ---------- text helpers ----------

export function normalize(s, lang = 'en') {
  let t = String(s || '')
    .toLowerCase()
    .replace(/[‘’´`]/g, "'")
    .replace(/[“”«»"]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.,!?;:\s]+|[.,!?;:\s]+$/g, '');
  if (lang === 'en') t = t.replace(/^to /, '');
  else t = t.replace(/^(å|en|ei|et) /, '');
  return t;
}

export function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (!m) return n;
  if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i += 1) {
    const cur = [i];
    for (let j = 1; j <= n; j += 1) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}

// Check a typed answer.
// { ok: null, hint }   -> not judged (empty, or wrong language); let the player try again
// { ok: true, near? }  -> correct (near: tiny typo forgiven, only in meaning questions)
// { ok: false, near?, split? } -> wrong
export function checkTyped(q, text) {
  const t = normalize(text, q.answerLang);
  if (!t) return { ok: null, hint: 'Skriv et svar først.' };
  const accept = q.accept.map((a) => normalize(a, q.answerLang));
  if (accept.includes(t)) return { ok: true };
  const other = (q.otherLang || []).map((a) => normalize(a, q.answerLang === 'en' ? 'nb' : 'en'));
  if (other.includes(t)) {
    return { ok: null, hint: q.answerLang === 'en' ? 'Det der er norsk. Skriv ordet på engelsk.' : 'Det er det engelske ordet. Skriv hva det betyr på norsk.' };
  }
  const squashed = t.replace(/[\s-]+/g, '');
  if (squashed !== t && accept.includes(squashed)) return { ok: false, split: true };
  const dist = Math.min(...accept.map((a) => levenshtein(a, t)));
  const near = dist === 1 || (dist === 2 && t.length >= 8);
  if (near && q.lenient) return { ok: true, near: true };
  return { ok: false, near };
}

// Letters that are easy to get wrong: double consonants, silent h, the link letter in compounds.
export function trickyIndices(item) {
  const w = item.text;
  const idx = new Set();
  for (let i = 0; i < w.length - 1; i += 1) {
    if (w[i] === w[i + 1] && /[^aeiouyæøå\s]/.test(w[i])) { idx.add(i); idx.add(i + 1); }
  }
  if (/^[hg]j/.test(w)) idx.add(0);
  if (item.parts && item.parts[1]) {
    for (let k = 0; k < item.parts[1].length; k += 1) idx.add(item.parts[0].length + k);
  }
  return [...idx];
}

export function gapPattern(item) {
  const w = item.text;
  const letters = [...w].map((c, i) => ({ c, i })).filter((x) => x.c !== ' ');
  const hide = new Set(trickyIndices(item));
  const target = Math.max(1, Math.round(letters.length * 0.4));
  const rest = shuffle(letters.filter((x) => !hide.has(x.i)));
  while (hide.size < target && rest.length) hide.add(rest.pop().i);
  // Never hide everything.
  if (hide.size >= letters.length) hide.delete(letters[0].i);
  return [...w].map((c, i) => (hide.has(i) ? '_' : c)).join('');
}

export function scramble(text) {
  return text.split(' ').map((word) => {
    if (word.length < 2 || new Set(word).size < 2) return [...word];
    let s;
    let tries = 0;
    do { s = shuffle([...word]); tries += 1; } while (s.join('') === word && tries < 20);
    return s;
  });
}

// Plausible wrong spellings for words without hand-picked ones.
export function misspellings(item, n = 3) {
  const w = item.text;
  const out = new Set(item.misspell || []);
  const rules = [
    (s) => s.replace(/([^aeiouyæøå\s])\1/, '$1'),
    (s) => s.replace(/([aeiouyæøå])([^aeiouyæøå\s])([aeiouyæøå])/, '$1$2$2$3'),
    (s) => s.replace(/^hj/, 'j').replace(/^gj/, 'j'),
    (s) => s.replace(/ck/, 'k').replace(/ph/, 'f').replace(/gh/, 'g'),
    (s) => s.replace(/æ/, 'e').replace(/å/, 'o').replace(/ø/, 'ö'),
    (s) => s.replace(/e([^e]*)$/, 'æ$1'),
    (s) => (s.length > 4 ? s.slice(0, -1) : `${s}e`),
    (s) => {
      const i = 1 + int(Math.max(1, s.length - 3));
      if (s[i] === ' ' || s[i + 1] === ' ' || s[i] === s[i + 1]) return s;
      return s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);
    },
    (s) => s.replace(/([^aeiouyæøå\s])$/, '$1$1'),
    (s) => s.replace(/[iy]/, (c) => (c === 'i' ? 'y' : 'i')),
  ];
  if (item.parts) {
    const [a, link, b] = item.parts;
    out.add(link ? a + b : `${a}e${b}`);
    out.add(`${a}${link} ${b}`);
  }
  for (const r of shuffle(rules)) {
    const s = r(w);
    if (s && s !== w) out.add(s);
  }
  const accepted = new Set([normalize(w), ...(item.no || [])]);
  return [...out].filter((s) => s !== w && !accepted.has(normalize(s)) && /[a-zæøå]/i.test(s)).slice(0, n);
}

function trickyNote(item) {
  const notes = [];
  const w = item.text;
  if (item.parts) {
    const [a, link, b] = item.parts;
    notes.push(link ? `Sammensatt ord: ${a} + ${link} + ${b} = ${w}. Legg merke til «${link}» i skjøten.` : `Sammensatt ord: ${a} + ${b} = ${w}, skrevet i ett ord.`);
  }
  if (/^hj/.test(w)) notes.push(`«${w}» starter med stum h: hj.`);
  if (/^gj/.test(w)) notes.push(`«${w}» starter med gj.`);
  const doubles = [...new Set((w.match(/([^aeiouyæøå\s])\1/g) || []))];
  if (doubles.length) notes.push(`Dobbel konsonant: ${doubles.join(', ')}.`);
  return notes;
}

// ---------- question kinds ----------

// needs: what an item must have. voice: which text-to-speech language it needs.
export const KINDS = {
  g_no_en: { type: 'gloss', mode: 'typed', label: 'Norsk til engelsk' },
  g_en_no: { type: 'gloss', mode: 'typed', label: 'Engelsk til norsk' },
  g_listen: { type: 'gloss', mode: 'typed', label: 'Diktat', voice: 'en' },
  g_flash: { type: 'gloss', mode: 'typed', label: 'Se, dekk, skriv' },
  g_scramble: { type: 'gloss', mode: 'typed', label: 'Bokstavsalat' },
  g_gaps: { type: 'gloss', mode: 'typed', label: 'Manglende bokstaver' },
  g_sentence: { type: 'gloss', mode: 'typed', label: 'Setning', needs: 'sentence' },
  g_meaning: { type: 'gloss', mode: 'mc', label: 'Hva betyr' },
  g_pick_en: { type: 'gloss', mode: 'mc', label: 'Finn engelsk ord' },
  g_spell: { type: 'gloss', mode: 'mc', label: 'Riktig stavet' },
  w_listen: { type: 'word', mode: 'typed', label: 'Diktat', voice: 'nb' },
  w_flash: { type: 'word', mode: 'typed', label: 'Se, dekk, skriv' },
  w_scramble: { type: 'word', mode: 'typed', label: 'Bokstavsalat' },
  w_gaps: { type: 'word', mode: 'typed', label: 'Manglende bokstaver' },
  w_sentence: { type: 'word', mode: 'typed', label: 'Setning', needs: 'sentence' },
  w_compose: { type: 'word', mode: 'typed', label: 'Sett sammen', needs: 'parts' },
  w_spell: { type: 'word', mode: 'mc', label: 'Riktig stavet' },
};

export function kindsFor(item, voices = { en: false, nb: false }, mode = null) {
  return Object.entries(KINDS)
    .filter(([, k]) => k.type === item.type)
    .filter(([, k]) => !mode || k.mode === mode)
    .filter(([, k]) => !k.needs || item[k.needs])
    .filter(([, k]) => !k.voice || voices[k.voice])
    .map(([id]) => id);
}

function optionsFrom(correct, wrong) {
  const opts = shuffle([{ label: correct, correct: true }, ...wrong.slice(0, 3).map((label) => ({ label, correct: false }))]);
  return opts;
}

function otherGloss(item, pool, field) {
  const vals = pool.filter((p) => p.type === 'gloss' && p.id !== item.id).map(field);
  const banned = new Set(field(item) === item.en ? [normalize(item.en)] : item.no.map((x) => normalize(x, 'nb')));
  return shuffle([...new Set(vals)].filter((v) => !banned.has(normalize(v, 'nb')) && !banned.has(normalize(v))));
}

export function questionKey(q) { return `${q.kind}:${q.item}`; }

export function makeQuestion(kind, item, pool = []) {
  const g = item.type === 'gloss';
  const mean = g ? item.no[0] : null;
  const q = {
    kind,
    item: item.id,
    itemType: item.type,
    mode: KINDS[kind].mode,
    prompt: '',
    big: null,
    sentence: null,
    note: null,
    letters: null,
    flash: false,
    listen: null,
    accept: [item.text],
    otherLang: g ? item.no : [],
    answerLang: g ? 'en' : 'nb',
    lenient: false,
    answerText: item.text,
    options: null,
    explain: [],
    say: { text: item.text, lang: g ? 'en' : 'nb' },
  };
  const meaningNote = g ? `Betyr: ${mean}` : null;
  switch (kind) {
    case 'g_no_en':
      q.prompt = 'Skriv på engelsk:';
      q.big = item.no[0];
      q.bigLang = 'nb';
      break;
    case 'g_en_no':
      q.prompt = 'Hva betyr dette på norsk?';
      q.big = item.en;
      q.bigLang = 'en';
      q.accept = item.no;
      q.otherLang = [item.en];
      q.answerLang = 'nb';
      q.lenient = true;
      q.answerText = item.no.slice(0, 3).join(' / ');
      break;
    case 'g_listen':
    case 'w_listen':
      q.prompt = g ? 'Hør og skriv ordet på engelsk' : 'Hør og skriv ordet';
      q.listen = q.say;
      q.big = '🎧';
      q.note = g ? meaningNote : null;
      break;
    case 'g_flash':
    case 'w_flash':
      q.prompt = 'Se på ordet. Når det forsvinner, skriver du det.';
      q.big = item.text;
      q.bigLang = g ? 'en' : 'nb';
      q.flash = true;
      q.note = meaningNote;
      break;
    case 'g_scramble':
    case 'w_scramble':
      q.prompt = 'Stokk om bokstavene og skriv ordet:';
      q.letters = scramble(item.text);
      q.note = meaningNote;
      break;
    case 'g_gaps':
    case 'w_gaps':
      q.prompt = 'Hvilke bokstaver mangler? Skriv hele ordet.';
      q.big = gapPattern(item);
      q.bigLang = g ? 'en' : 'nb';
      q.gaps = true;
      q.note = meaningNote;
      break;
    case 'g_sentence':
    case 'w_sentence':
      q.prompt = 'Skriv ordet som mangler:';
      q.sentence = item.sentence;
      q.sentenceLang = g ? 'en' : 'nb';
      q.note = g ? `(${mean})` : null;
      q.say = { text: item.sentence.replace('___', item.text), lang: g ? 'en' : 'nb' };
      break;
    case 'w_compose': {
      const [a, , b] = item.parts;
      q.prompt = 'Sett sammen til ett ord:';
      q.big = `${a} + ${b}`;
      q.bigLang = 'nb';
      q.note = 'Tenk på om det trengs en ekstra bokstav i skjøten.';
      break;
    }
    case 'g_meaning':
      q.prompt = 'Hva betyr dette på norsk?';
      q.big = item.en;
      q.bigLang = 'en';
      q.options = optionsFrom(mean, otherGloss(item, pool, (p) => p.no[0]));
      q.optionLang = 'nb';
      q.answerText = mean;
      break;
    case 'g_pick_en':
      q.prompt = 'Hva heter dette på engelsk?';
      q.big = mean;
      q.bigLang = 'nb';
      q.options = optionsFrom(item.en, otherGloss(item, pool, (p) => p.en));
      q.optionLang = 'en';
      break;
    case 'g_spell':
    case 'w_spell':
      q.prompt = 'Hvilket ord er riktig stavet?';
      q.note = meaningNote;
      q.options = optionsFrom(item.text, misspellings(item, 3));
      q.optionLang = g ? 'en' : 'nb';
      break;
    default:
      throw new Error(`Unknown kind ${kind}`);
  }
  if (g) {
    q.explain.push(`«${item.en}» betyr «${item.no.slice(0, 2).join(' / ')}».`);
    if (kind === 'g_en_no' && item.no.length > 1) q.explain.push(`Alle disse er riktige: ${item.no.join(', ')}.`);
  } else {
    q.explain.push(...trickyNote(item));
    q.explain.push(`Stav det høyt: ${[...item.word].join('-')}.`);
  }
  return q;
}

// Too few distractors -> a multiple choice question can't be built.
export function canBuild(kind, item, pool) {
  if (kind === 'g_meaning' || kind === 'g_pick_en') {
    return pool.filter((p) => p.type === 'gloss' && p.id !== item.id).length >= 3;
  }
  if (kind === 'g_spell' || kind === 'w_spell') return misspellings(item, 3).length >= 3;
  return true;
}

// ---------- learning state ----------

// box 0-5 (Leitner style). An item "sits" from box 3.
export const KNOWN_BOX = 3;
export function weightFor(stat) {
  if (!stat) return 6;
  return 1 + (5 - (stat.box || 0)) * 1.5 + Math.min(stat.wrong || 0, 6) * 0.5;
}

function weightedOrder(items, stats) {
  // Efraimidis-Spirakis: random order biased by weight.
  return items
    .map((it) => ({ it, k: rand() ** (1 / weightFor(stats[it.id])) }))
    .sort((a, b) => b.k - a.k)
    .map((x) => x.it);
}

// A practice round. About three of four questions are typed.
export function makeRound({
  items, pool = items, length = 12, stats = {}, recent = [], voices = {}, typedEvery = 4,
}) {
  if (!items.length) return [];
  const picks = [];
  while (picks.length < length) {
    const order = weightedOrder(items, stats);
    for (const it of order) {
      if (picks.length >= length) break;
      if (picks.length && picks[picks.length - 1].id === it.id && items.length > 1) continue;
      picks.push(it);
    }
  }
  const usedKinds = {};
  const kindCount = {};
  const recentSet = new Set(recent);
  return picks.map((item, i) => {
    const wantMc = i % typedEvery === typedEvery - 1;
    let kinds = kindsFor(item, voices, wantMc ? 'mc' : 'typed').filter((k) => canBuild(k, item, pool));
    if (!kinds.length) kinds = kindsFor(item, voices, 'typed');
    const used = usedKinds[item.id] || [];
    const fresh = kinds.filter((k) => !used.includes(k));
    let cands = fresh.length ? fresh : kinds;
    const notRecent = cands.filter((k) => !recentSet.has(`${k}:${item.id}`));
    if (notRecent.length) cands = notRecent;
    const min = Math.min(...cands.map((k) => kindCount[k] || 0));
    const kind = pick(cands.filter((k) => (kindCount[k] || 0) === min));
    usedKinds[item.id] = [...used, kind];
    kindCount[kind] = (kindCount[kind] || 0) + 1;
    return makeQuestion(kind, item, pool);
  });
}

// The test ("Test deg"): every item once, all typed, like a real gloseprøve.
// Glosses: Norwegian -> English. Words: dictation if a Norwegian voice exists, otherwise see-cover-write.
export function makeTest({ items, pool = items, voices = {} }) {
  return shuffle(items).map((item) => {
    if (item.type === 'gloss') return makeQuestion('g_no_en', item, pool);
    return makeQuestion(voices.nb ? 'w_listen' : 'w_flash', item, pool);
  });
}

// A repeat of a missed question later in the round, in a different (typed) form.
export function repeatOf(q, item, pool, voices = {}) {
  const kinds = kindsFor(item, voices, 'typed').filter((k) => k !== q.kind);
  const r = makeQuestion(kinds.length ? pick(kinds) : q.kind, item, pool);
  r.repeat = true;
  return r;
}

export function mistakeItems(items, stats, max = 8) {
  return items
    .filter((it) => stats[it.id] && stats[it.id].wrong > 0 && (stats[it.id].box || 0) < KNOWN_BOX)
    .sort((a, b) => (stats[b.id].wrong - (stats[b.id].box || 0)) - (stats[a.id].wrong - (stats[a.id].box || 0)))
    .slice(0, max);
}

export function starsFor(correct, total) {
  const p = total ? correct / total : 0;
  if (p >= 0.9) return 3;
  if (p >= 0.7) return 2;
  if (p >= 0.5) return 1;
  return 0;
}

// ---------- custom weeks ----------

export const LIMITS = { title: 40, lines: 40, text: 40 };
const WORD_RE = /^[\p{L}][\p{L}' -]*$/u;

// Parse the parent editor. Gloss lines: "english = norsk / alternativ".
// Word lines: "hjemme" (or several separated by comma), or "vindusrute = vindu + rute" for compounds.
export function parseWeek({ id, title, glossText = '', wordText = '' }) {
  const errors = [];
  const cleanTitle = String(title || '').trim().slice(0, LIMITS.title);
  if (!cleanTitle) errors.push('Gi uka et navn, for eksempel «Uke 49».');
  const gloss = [];
  const glossLines = String(glossText).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  glossLines.slice(0, LIMITS.lines).forEach((line, i) => {
    const m = line.split(/\s*(?:=|\t|:|\s[-–]\s)\s*/);
    if (m.length < 2 || !m[0] || !m[1]) {
      errors.push(`Glose linje ${i + 1} («${line.slice(0, 30)}»): skriv engelsk = norsk.`);
      return;
    }
    const en = m[0].trim().toLowerCase();
    const no = m.slice(1).join(' ').split(/\s*[/,;]\s*/).map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!WORD_RE.test(en) || en.length > LIMITS.text || !no.length || no.some((x) => !WORD_RE.test(x) || x.length > LIMITS.text)) {
      errors.push(`Glose linje ${i + 1} («${line.slice(0, 30)}»): bruk bare bokstaver.`);
      return;
    }
    gloss.push({ en, no });
  });
  const words = [];
  const wordLines = String(wordText).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  wordLines.slice(0, LIMITS.lines).forEach((line, i) => {
    if (line.includes('=')) {
      const [w, rest] = line.split('=').map((s) => s.trim().toLowerCase());
      const parts = (rest || '').split('+').map((s) => s.trim()).filter(Boolean);
      if (!WORD_RE.test(w || '') || parts.length !== 2) {
        errors.push(`Ord linje ${i + 1} («${line.slice(0, 30)}»): skriv sammensatte ord som «vindusrute = vindu + rute».`);
        return;
      }
      const [a, b] = parts;
      if (!w.startsWith(a) || !w.endsWith(b) || a.length + b.length > w.length) {
        errors.push(`Ord linje ${i + 1}: «${a}» og «${b}» passer ikke med «${w}».`);
        return;
      }
      words.push({ word: w, parts: [a, w.slice(a.length, w.length - b.length), b] });
      return;
    }
    line.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).forEach((w) => {
      if (!WORD_RE.test(w) || w.length > LIMITS.text) errors.push(`Ord linje ${i + 1}: «${w.slice(0, 30)}» kan bare ha bokstaver.`);
      else words.push({ word: w });
    });
  });
  if (glossLines.length > LIMITS.lines || wordLines.length > LIMITS.lines) errors.push(`Maks ${LIMITS.lines} linjer i hver liste.`);
  if (!gloss.length && !words.length) errors.push('Skriv inn minst én glose eller ett ord.');
  return { week: { id, title: cleanTitle, sub: 'Egen liste', custom: true, gloss, words }, errors };
}

// Back to editor text, for editing a saved week.
export function weekToText(week) {
  return {
    title: week.title,
    glossText: (week.gloss || []).map((g) => `${g.en} = ${g.no.join(' / ')}`).join('\n'),
    wordText: (week.words || []).map((w) => (w.parts ? `${w.word} = ${w.parts[0]} + ${w.parts[2]}` : w.word)).join('\n'),
  };
}
