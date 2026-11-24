// Badges. Each badge is "value reaches goal", so every badge can show a progress bar.
import { state, progress } from './store.js';
import { WORLDS, LEVELS } from './levels.js';
import { THEMES } from './themes.js';
import { ARCADE_TIERS } from './arcade-data.js';

const B = (cat, id, icon, title, desc, goal, value) => ({ cat, id, icon, title, desc, goal, value });
const tiers = (cat, prefix, icons, titles, goals, descFn, value) => goals.map((g, i) => B(
  cat, `${prefix}${g}`, icons[i], titles[i], descFn(g), g, value,
));

const themesUnlocked = () => THEMES.filter((t) => t.need(state, progress)).length;
const bossesPerfect = () => WORLDS.filter((w) => (state.stars[w.levels[w.levels.length - 1].id] || 0) === 3).length;

export const CATEGORIES = ['Svar', 'Rekker', 'Stjerner', 'Verdener', 'Perfekt', 'Kunnskap', 'Dager', 'Arkade', 'Spesielle'];

export const BADGES = [
  // Svar
  B('Svar', 'forste', '⏱️', 'Første tikk', 'Svar riktig for første gang', 1, () => state.totals.correct),
  ...tiers('Svar', 'svar', ['🔟', '🖐️', '💯', '🎖️', '🏅', '🏆'],
    ['Ti riktige', 'Femti riktige', 'Hundre riktige', 'Kvart tusen', 'Fem hundre', 'Tusen tikk'],
    [10, 50, 100, 250, 500, 1000], (g) => `${g} riktige svar til sammen`, () => state.totals.correct),
  // Rekker
  ...tiers('Rekker', 'rekke', ['🔥', '🚀', '☄️', '🌠', '🐉'],
    ['Fem på rad', 'Ti på rad', 'Tjue på rad', 'Tretti på rad', 'Femti på rad'],
    [5, 10, 20, 30, 50], (g) => `${g} riktige svar på rad`, () => state.bestStreak),
  // Stjerner
  ...tiers('Stjerner', 'stjerne', ['⭐', '🌟', '✨', '💫', '🌌'],
    ['Stjerneskudd', 'Stjernesamler', 'Stjernekikker', 'Stjernebilde', 'Hele himmelen'],
    [10, 25, 50, 75, LEVELS.length * 3], (g) => `${g} stjerner til sammen`, () => progress.stars()),
  // Verdener
  ...WORLDS.map((w) => B('Verdener', `verden${w.id}`, w.icon, w.name, `Slå bossen i ${w.name}`, 1, () => (progress.worldDone(w.id) ? 1 : 0))),
  B('Verdener', 'bossjeger', '⚔️', 'Bossjeger', 'Tre stjerner på alle seks bosser', WORLDS.length, bossesPerfect),
  // Perfekt
  B('Perfekt', 'feilfri', '💎', 'Feilfri', 'Alt riktig på første forsøk i en runde', 1, () => state.totals.perfect),
  B('Perfekt', 'feilfri5', '💍', 'Fem feilfrie', 'Fem feilfrie runder', 5, () => state.totals.perfect),
  B('Perfekt', 'feilfri20', '👑', 'Perfeksjonist', 'Tjue feilfrie runder', 20, () => state.totals.perfect),
  B('Perfekt', 'utenhint', '🧠', 'Uten hjelp', 'Fem feilfrie runder uten å bruke 💡', 5, () => state.totals.perfectNoHint),
  // Kunnskap
  B('Kunnskap', 'halvhelt', '🦸', 'Halv-helt', '25 riktige med halv, på halv eller over halv', 25, () => state.totals.halvCorrect),
  B('Kunnskap', 'halvmester', '🎯', 'Halvmester', '100 riktige med halv, på halv eller over halv', 100, () => state.totals.halvCorrect),
  B('Kunnskap', 'minuttmester', '🔬', 'Minuttjeger', '50 riktige på enkeltminutter', 50, () => state.totals.minuteCorrect),
  B('Kunnskap', 'stille100', '🕹️', 'Viserfører', 'Still klokka riktig 100 ganger', 100, () => state.totals.setCorrect),
  B('Kunnskap', 'stille300', '🎮', 'Visermester', 'Still klokka riktig 300 ganger', 300, () => state.totals.setCorrect),
  B('Kunnskap', 'skriv25', '✏️', 'Skriveflink', 'Skriv 25 riktige svar selv', 25, () => state.totals.typedCorrect),
  B('Kunnskap', 'skriv100', '🖋️', 'Klokkeskriver', 'Skriv 100 riktige svar selv', 100, () => state.totals.typedCorrect),
  B('Kunnskap', 'romer', '🏛️', 'Romer', 'To stjerner på et nivå med romertall', 1, () => (state.flags.roman ? 1 : 0)),
  B('Kunnskap', 'blind', '🙈', 'Blindflyger', 'Tre stjerner på et nivå uten tall', 1, () => (state.flags.blind ? 1 : 0)),
  // Dager
  ...tiers('Dager', 'dager', ['📅', '🗓️', '📆', '🏵️'],
    ['Tre dager', 'En hel uke', 'To uker', 'En hel måned'],
    [3, 7, 14, 30], (g) => `Spill ${g} dager på rad`, () => state.days.best),
  ...tiers('Dager', 'dagens', ['☀️', '🌤️', '🌈'],
    ['Dagens første', 'Ukas utfordrer', 'Månedens utfordrer'],
    [1, 7, 30], (g) => `Fullfør dagens utfordring ${g === 1 ? 'én gang' : `${g} ganger`}`, () => state.totals.dailyDone),
  // Arkade
  ...ARCADE_TIERS.flatMap((a) => a.goals.map((g, i) => B(
    'Arkade', `${a.id}${i + 1}`, a.icons[i], `${a.name} ${['bronse', 'sølv', 'gull'][i]}`,
    a.desc(g), 1,
    () => {
      const best = state.arcade[a.id]?.best;
      if (best === null || best === undefined) return 0;
      return (a.lowerIsBetter ? best <= g : best >= g) ? 1 : 0;
    },
  ))),
  B('Arkade', 'arkade25', '🕹️', 'Arkadefan', 'Spill 25 arkadespill', 25, () => state.totals.arcadePlays),
  B('Arkade', 'arkade100', '👾', 'Arkadehelt', 'Spill 100 arkadespill', 100, () => state.totals.arcadePlays),
  // Spesielle
  B('Spesielle', 'nattugle', '🦉', 'Nattugle', 'Spill etter klokka ni om kvelden', 1, () => (state.flags.nightOwl ? 1 : 0)),
  B('Spesielle', 'morgenfugl', '🐓', 'Morgenfugl', 'Spill mellom fem og åtte om morgenen', 1, () => (state.flags.earlyBird ? 1 : 0)),
  B('Spesielle', 'helg', '🛋️', 'Helgespiller', 'Spill i helgen', 1, () => (state.flags.weekend ? 1 : 0)),
  B('Spesielle', 'stilist', '🎨', 'Stilist', 'Bytt bakgrunn eller klokke', 1, () => (state.flags.styled ? 1 : 0)),
  B('Spesielle', 'samler', '🖼️', 'Samler', 'Lås opp 5 bakgrunner', 5, themesUnlocked),
  B('Spesielle', 'runder50', '🏃', 'Maratonspiller', 'Spill 50 runder', 50, () => state.totals.rounds),
];

const KNOWN = new Set(BADGES.map((b) => b.id));
// Drop badges from older versions that no longer exist, so counts stay honest.
state.badges = state.badges.filter((id) => KNOWN.has(id));

export function badgeProgress(b) {
  const v = Math.min(b.value(), b.goal);
  return { value: v, goal: b.goal, done: state.badges.includes(b.id) };
}

// Award every badge that is reached and not yet owned. Returns the new ones.
export function checkBadges() {
  const earned = [];
  for (const b of BADGES) {
    if (!state.badges.includes(b.id) && b.value() >= b.goal) {
      state.badges.push(b.id);
      earned.push(b);
    }
  }
  return earned;
}
