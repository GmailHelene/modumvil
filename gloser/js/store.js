// Progress saved locally on the device. Nothing leaves the phone.
import { BUILTIN_WEEKS } from './data.js';
import { itemsOfWeek, KNOWN_BOX } from './engine.js';

const KEY = 'glosemester:v1';
const RECENT_MAX = 120;

const DEFAULTS = {
  v: 1,
  xp: 0,
  itemStats: {},
  badges: [],
  bestStreak: 0,
  totals: {
    answered: 0, correct: 0, typedCorrect: 0, listenCorrect: 0, flashCorrect: 0, composeCorrect: 0,
    glossCorrect: 0, wordCorrect: 0, perfect: 0, rounds: 0, tests: 0, testBest: 0, testPerfect: 0,
    mistakeRounds: 0, arcadePlays: 0, weeksMade: 0,
  },
  days: { count: 0, last: null, best: 0 },
  arcade: {},
  recent: [],
  flags: {},
  weeks: [],
  active: 'alle',
  style: { theme: 'natt' },
  settings: { sound: true, vibrate: true, speak: true },
};

const clone = (o) => JSON.parse(JSON.stringify(o));

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return clone(DEFAULTS);
    const data = JSON.parse(raw);
    return {
      ...clone(DEFAULTS),
      ...data,
      totals: { ...DEFAULTS.totals, ...data.totals },
      days: { ...DEFAULTS.days, ...data.days },
      style: { ...DEFAULTS.style, ...data.style },
      settings: { ...DEFAULTS.settings, ...data.settings },
      flags: { ...data.flags },
      arcade: { ...data.arcade },
      itemStats: { ...data.itemStats },
      weeks: Array.isArray(data.weeks) ? data.weeks : [],
    };
  } catch {
    return clone(DEFAULTS);
  }
}

export const state = load();

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode or full storage: the game still works, it just forgets.
  }
}

// Starting over keeps settings, own word lists and the recently seen questions.
export function reset() {
  const fresh = clone(DEFAULTS);
  fresh.settings = { ...state.settings };
  fresh.weeks = state.weeks.slice();
  fresh.active = state.active;
  fresh.recent = state.recent.slice();
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, fresh);
  save();
}

// ---------- weeks ----------

export const allWeeks = () => [...state.weeks.slice().reverse(), ...BUILTIN_WEEKS];
export const weekById = (id) => allWeeks().find((w) => w.id === id) || null;

export function activeWeek() {
  if (state.active !== 'alle' && weekById(state.active)) return weekById(state.active);
  return { id: 'alle', title: 'Alle ord', sub: 'Bland alle listene' };
}

export function itemsFor(weekId = state.active) {
  if (weekId === 'alle' || !weekById(weekId)) return allWeeks().flatMap(itemsOfWeek);
  return itemsOfWeek(weekById(weekId));
}

// Everything, used as a pool for wrong answer options.
export const allItems = () => allWeeks().flatMap(itemsOfWeek);

export function saveWeek(week) {
  const i = state.weeks.findIndex((w) => w.id === week.id);
  if (i >= 0) state.weeks[i] = week;
  else {
    state.weeks.push(week);
    state.totals.weeksMade += 1;
  }
  state.active = week.id;
  save();
}

export function deleteWeek(id) {
  state.weeks = state.weeks.filter((w) => w.id !== id);
  Object.keys(state.itemStats).forEach((k) => { if (k.startsWith(`${id}:`)) delete state.itemStats[k]; });
  if (state.active === id) state.active = 'alle';
  save();
}

export function knownCount(items) {
  return items.filter((it) => (state.itemStats[it.id]?.box || 0) >= KNOWN_BOX).length;
}

// ---------- ranks and days ----------

export const RANKS = [
  { xp: 0, title: 'Ordspire' },
  { xp: 150, title: 'Bokstavjeger' },
  { xp: 450, title: 'Stavesmed' },
  { xp: 900, title: 'Ordtrollmann' },
  { xp: 1600, title: 'Glosegeneral' },
  { xp: 2600, title: 'Glosemester' },
  { xp: 4000, title: 'Legende' },
];

export function rankFor(xp) {
  let idx = 0;
  RANKS.forEach((r, i) => { if (xp >= r.xp) idx = i; });
  const cur = RANKS[idx];
  const next = RANKS[idx + 1] || null;
  return { ...cur, index: idx, next, progress: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1 };
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function markPlayedToday(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 21 || hour < 4) state.flags.nightOwl = true;
  if (hour >= 5 && hour < 8) state.flags.earlyBird = true;
  const today = todayKey(now);
  if (state.days.last === today) return;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  state.days.count = state.days.last === todayKey(y) ? state.days.count + 1 : 1;
  state.days.best = Math.max(state.days.best, state.days.count);
  state.days.last = today;
}

// ---------- answers ----------

export function recordAnswer(q, correct, { hinted = false } = {}) {
  const s = state.itemStats[q.item] || { seen: 0, wrong: 0, box: 0 };
  s.seen += 1;
  if (correct) {
    // Typed without help moves a word up; multiple choice only helps early on.
    if (q.mode === 'typed' && !hinted) s.box = Math.min(5, (s.box || 0) + 1);
    else if ((s.box || 0) < 2 && !hinted) s.box = (s.box || 0) + 1;
  } else {
    s.wrong += 1;
    s.box = Math.max(0, (s.box || 0) - 2);
  }
  state.itemStats[q.item] = s;
  state.totals.answered += 1;
  if (!correct) return;
  state.totals.correct += 1;
  if (q.mode === 'typed') state.totals.typedCorrect += 1;
  if (q.listen) state.totals.listenCorrect += 1;
  if (q.flash) state.totals.flashCorrect += 1;
  if (q.kind === 'w_compose') state.totals.composeCorrect += 1;
  if (q.itemType === 'gloss') state.totals.glossCorrect += 1;
  else state.totals.wordCorrect += 1;
}

export function rememberQuestions(keys) {
  state.recent = [...state.recent.filter((k) => !keys.includes(k)), ...keys].slice(-RECENT_MAX);
}

export function recordArcade(id, score) {
  const a = state.arcade[id] || { best: 0, plays: 0 };
  a.plays += 1;
  const record = score > a.best;
  if (record) a.best = score;
  state.arcade[id] = a;
  state.totals.arcadePlays += 1;
  return record;
}

export const badgeCount = () => state.badges.length;
export const totalKnown = () => knownCount(allItems());
