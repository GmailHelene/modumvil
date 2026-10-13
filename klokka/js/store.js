// Progress saved locally on the device. Nothing leaves the phone.
import { LEVELS, WORLDS, UNLOCK_STARS, prevLevel } from './levels.js';

const KEY = 'klokkemester:v1';
const VERSION = 2;
const RECENT_MAX = 120;

const DEFAULTS = {
  v: VERSION,
  xp: 0,
  stars: {},
  zoneStats: {},
  badges: [],
  bestStreak: 0,
  totals: {
    answered: 0, correct: 0, halvCorrect: 0, minuteCorrect: 0, setCorrect: 0,
    perfect: 0, perfectNoHint: 0, rounds: 0, arcadePlays: 0, dailyDone: 0,
  },
  days: { count: 0, last: null, best: 0 },
  arcade: {},
  daily: {},
  recent: [],
  flags: {},
  style: { theme: 'natt', face: 'klassisk' },
  settings: { sound: true, vibrate: true, unlockAll: false },
};

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

// Version 1 had 7 levels with numeric ids. Carry stars over to the matching new levels.
const V1_LEVEL_MAP = { 1: ['1-1', '1-2'], 2: ['1-3', '1-4'], 3: ['2-1', '2-2', '2-3'], 4: ['3-1', '3-2', '3-3'], 5: ['4-1'], 6: ['5-1'], 7: ['6-1'] };

function migrate(data) {
  if (!data.v || data.v < 2) {
    const stars = {};
    for (const [oldId, s] of Object.entries(data.stars || {})) {
      for (const id of V1_LEVEL_MAP[oldId] || []) stars[id] = s;
    }
    data.stars = stars;
    if (data.lightningBest) data.arcade = { lyn: { best: data.lightningBest, plays: 1 } };
    delete data.lightningBest;
    data.v = VERSION;
  }
  return data;
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return clone(DEFAULTS);
    const data = migrate(JSON.parse(raw));
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
    };
  } catch {
    return clone(DEFAULTS);
  }
}

export const state = load();
if (state.days.count > state.days.best) state.days.best = state.days.count;

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private mode or full storage: the game still works, it just forgets.
  }
}

// Starting over keeps settings, look and the list of recently seen questions,
// so a fresh start does not replay the exact same tasks.
export function reset() {
  const fresh = clone(DEFAULTS);
  fresh.settings = { ...state.settings };
  fresh.style = { theme: 'natt', face: 'klassisk' };
  fresh.recent = state.recent.slice();
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, fresh);
  save();
}

export const RANKS = [
  { xp: 0, title: 'Klokkelærling' },
  { xp: 150, title: 'Viser-viking' },
  { xp: 450, title: 'Tidsdetektiv' },
  { xp: 900, title: 'Minuttmagiker' },
  { xp: 1600, title: 'Klokkemester' },
  { xp: 2600, title: 'Tidsherre' },
  { xp: 4000, title: 'Tidsreisende' },
  { xp: 6000, title: 'Evighetens vokter' },
];

export function rankFor(xp) {
  let idx = 0;
  RANKS.forEach((r, i) => {
    if (xp >= r.xp) idx = i;
  });
  const cur = RANKS[idx];
  const next = RANKS[idx + 1] || null;
  const progress = next ? (xp - cur.xp) / (next.xp - cur.xp) : 1;
  return { ...cur, index: idx, next, progress };
}

export function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Call when a round, daily challenge or arcade game is finished.
export function markPlayedToday(now = new Date()) {
  const hour = now.getHours();
  if (hour >= 21 || hour < 4) state.flags.nightOwl = true;
  if (hour >= 5 && hour < 8) state.flags.earlyBird = true;
  if (now.getDay() === 0 || now.getDay() === 6) state.flags.weekend = true;
  const today = todayKey(now);
  if (state.days.last === today) return;
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  state.days.count = state.days.last === todayKey(y) ? state.days.count + 1 : 1;
  state.days.best = Math.max(state.days.best, state.days.count);
  state.days.last = today;
}

export function recordAnswer(q, correct) {
  const zone = q.zone;
  const s = state.zoneStats[zone] || { seen: 0, wrong: 0 };
  s.seen += 1;
  if (!correct) s.wrong += 1;
  // Keep stats recent: old mistakes fade so a learned zone stops coming up so often.
  if (s.seen > 30) {
    s.seen = Math.round(s.seen * 0.8);
    s.wrong = Math.round(s.wrong * 0.8);
  }
  state.zoneStats[zone] = s;
  state.totals.answered += 1;
  if (!correct) return;
  state.totals.correct += 1;
  if (['halv', 'paHalv', 'overHalv'].includes(zone)) state.totals.halvCorrect += 1;
  if (q.m % 5 !== 0) state.totals.minuteCorrect += 1;
  if (q.kind === 'set') state.totals.setCorrect += 1;
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

// ---- progress helpers (shared by levels, badges and themes) ----

export function totalStars() {
  return Object.values(state.stars).reduce((a, b) => a + b, 0);
}

export function worldStars(worldId) {
  return LEVELS.filter((l) => l.world === worldId).reduce((a, l) => a + (state.stars[l.id] || 0), 0);
}

export function worldDone(worldId) {
  const world = WORLDS.find((w) => w.id === worldId);
  const boss = world.levels[world.levels.length - 1];
  return (state.stars[boss.id] || 0) >= 1;
}

export function isUnlocked(level) {
  if (state.settings.unlockAll || (state.stars[level.id] || 0) > 0) return true;
  const prev = prevLevel(level);
  if (!prev) return true;
  // A new world opens when the previous boss is beaten (1 star); inside a world you need 2 stars.
  const need = prev.world !== level.world ? 1 : UNLOCK_STARS;
  return (state.stars[prev.id] || 0) >= need;
}

export function unlockedIds() {
  return LEVELS.filter(isUnlocked).map((l) => l.id);
}

export function badgeCount() {
  return state.badges.length;
}

export const progress = {
  stars: totalStars, worldDone, worldStars, badgeCount,
};
