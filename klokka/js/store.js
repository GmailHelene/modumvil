// Progress saved locally on the device. Nothing leaves the phone.
const KEY = 'klokkemester:v1';

const DEFAULTS = {
  v: 1,
  xp: 0,
  stars: {},
  zoneStats: {},
  badges: [],
  lightningBest: 0,
  bestStreak: 0,
  totals: { answered: 0, correct: 0, halvCorrect: 0 },
  days: { count: 0, last: null },
  settings: { sound: true, vibrate: true, unlockAll: false },
};

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

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
      settings: { ...DEFAULTS.settings, ...data.settings },
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

export function reset() {
  const fresh = clone(DEFAULTS);
  fresh.settings = { ...state.settings };
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

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Call when a round or lightning game is finished.
export function markPlayedToday() {
  const today = todayKey();
  if (state.days.last === today) return;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  state.days.count = state.days.last === todayKey(y) ? state.days.count + 1 : 1;
  state.days.last = today;
}

export function recordAnswer(zone, correct) {
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
  if (correct) {
    state.totals.correct += 1;
    if (['halv', 'paHalv', 'overHalv'].includes(zone)) state.totals.halvCorrect += 1;
  }
}

export function totalStars() {
  return Object.values(state.stars).reduce((a, b) => a + b, 0);
}
