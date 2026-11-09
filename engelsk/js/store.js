// Progress saved locally on the device. Nothing leaves the phone.
import { LEVELS, WORLDS, prevLevel } from './engine.js';

const KEY = 'engelskmester:v1';
const RECENT_MAX = 150;
export const UNLOCK_STARS = 2;

const DEFAULTS = {
  v: 1,
  xp: 0,
  stars: {},
  itemStats: {},
  badges: [],
  bestStreak: 0,
  totals: {
    answered: 0, correct: 0, typedCorrect: 0, trapCorrect: 0, pastCorrect: 0, defCorrect: 0,
    perfect: 0, perfectNoHint: 0, rounds: 0, arcadePlays: 0, dailyDone: 0,
    exams: 0, examBest: 0, mistakeRounds: 0,
  },
  days: { count: 0, last: null, best: 0 },
  arcade: {},
  daily: {},
  recent: [],
  flags: {},
  style: { theme: 'natt' },
  settings: { sound: true, vibrate: true, speak: true, unlockAll: false },
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
      daily: { ...data.daily },
      itemStats: { ...data.itemStats },
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

// Starting over keeps settings and the recently seen questions, so a fresh start gets new tasks.
export function reset() {
  const fresh = clone(DEFAULTS);
  fresh.settings = { ...state.settings };
  fresh.recent = state.recent.slice();
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, fresh);
  save();
}

export const RANKS = [
  { xp: 0, title: 'Beginner' },
  { xp: 150, title: 'Word Rookie' },
  { xp: 450, title: 'Phrase Finder' },
  { xp: 900, title: 'Preposition Pro' },
  { xp: 1600, title: 'Grammar Ninja' },
  { xp: 2600, title: 'English Master' },
  { xp: 4000, title: 'Legend' },
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

export function recordAnswer(q, correct) {
  const s = state.itemStats[q.item] || { seen: 0, wrong: 0 };
  s.seen += 1;
  if (!correct) s.wrong += 1;
  // Old mistakes fade, so a learned word stops coming up so often.
  if (s.seen > 20) {
    s.seen = Math.round(s.seen * 0.8);
    s.wrong = Math.round(s.wrong * 0.8);
  }
  state.itemStats[q.item] = s;
  state.totals.answered += 1;
  if (!correct) return;
  state.totals.correct += 1;
  if (q.mode === 'typed') state.totals.typedCorrect += 1;
  if (q.trap) state.totals.trapCorrect += 1;
  if (q.factory && q.factory.startsWith('pPast')) state.totals.pastCorrect += 1;
  if (q.factory && q.factory.startsWith('pDef')) state.totals.defCorrect += 1;
}

export function rememberQuestions(keys) {
  state.recent = [...state.recent.filter((k) => !keys.includes(k)), ...keys].slice(-RECENT_MAX);
}

export function recordArcade(id, score, lowerIsBetter = false) {
  const a = state.arcade[id] || { best: null, plays: 0 };
  a.plays += 1;
  const record = a.best === null || (lowerIsBetter ? score < a.best : score > a.best);
  if (record) a.best = score;
  state.arcade[id] = a;
  state.totals.arcadePlays += 1;
  return record;
}

// ---- progress helpers ----

export const totalStars = () => Object.values(state.stars).reduce((a, b) => a + b, 0);

export function worldStars(worldId) {
  return LEVELS.filter((l) => l.world === worldId).reduce((a, l) => a + (state.stars[l.id] || 0), 0);
}

export function worldDone(worldId) {
  const w = WORLDS.find((x) => x.id === worldId);
  return (state.stars[w.levels[w.levels.length - 1].id] || 0) >= 1;
}

export function isUnlocked(level) {
  if (state.settings.unlockAll || (state.stars[level.id] || 0) > 0) return true;
  const prev = prevLevel(level);
  if (!prev) return true;
  const need = prev.world !== level.world ? 1 : UNLOCK_STARS;
  return (state.stars[prev.id] || 0) >= need;
}

export const unlockedIds = () => LEVELS.filter(isUnlocked).map((l) => l.id);

// Word sets the player has reached (used by daily challenge and arcade).
export function openSets() {
  const sets = new Set();
  for (const l of LEVELS.filter(isUnlocked)) {
    (l.sets || []).forEach((s) => sets.add(s));
    if (l.itemIds && l.world <= 4) sets.add(l.world);
  }
  return [...sets].sort();
}

export const badgeCount = () => state.badges.length;
export const progress = { stars: totalStars, worldDone, worldStars, badgeCount };
