// Badges. Each badge is "value reaches goal", so every badge can show a progress bar.
import { state, progress } from './store.js';
import { WORLDS, LEVELS } from './engine.js';
import { THEMES } from './themes.js';
import { ARCADE_TIERS } from './arcade-data.js';

const B = (cat, id, icon, title, desc, goal, value) => ({ cat, id, icon, title, desc, goal, value });
const tiers = (cat, prefix, icons, titles, goals, descFn, value) => goals.map((g, i) => B(cat, `${prefix}${g}`, icons[i], titles[i], descFn(g), g, value));

export const CATEGORIES = ['Svar', 'Rekker', 'Stjerner', 'Verdener', 'Kunnskap', 'Prøve', 'Dager', 'Arkade', 'Spesielle'];

export const BADGES = [
  B('Svar', 'forste', '🌱', 'First word', 'Svar riktig for første gang', 1, () => state.totals.correct),
  ...tiers('Svar', 'svar', ['🔟', '🖐️', '💯', '🎖️', '🏆'], ['Ti riktige', 'Femti riktige', 'Hundre riktige', 'Kvart tusen', 'Fem hundre'],
    [10, 50, 100, 250, 500], (g) => `${g} riktige svar til sammen`, () => state.totals.correct),
  ...tiers('Rekker', 'rekke', ['🔥', '🚀', '☄️', '🐉'], ['Fem på rad', 'Ti på rad', 'Tjue på rad', 'Tretti på rad'],
    [5, 10, 20, 30], (g) => `${g} riktige svar på rad`, () => state.bestStreak),
  ...tiers('Stjerner', 'stjerne', ['⭐', '🌟', '✨', '🌌'], ['Stjerneskudd', 'Stjernesamler', 'Stjernekikker', 'Hele himmelen'],
    [10, 30, 50, LEVELS.length * 3], (g) => `${g} stjerner til sammen`, () => progress.stars()),
  ...WORLDS.map((w) => B('Verdener', `verden${w.id}`, w.icon, w.name, `Slå bossen i ${w.name}`, 1, () => (progress.worldDone(w.id) ? 1 : 0))),
  B('Kunnskap', 'skriv25', '✏️', 'Skriveflink', 'Skriv 25 riktige svar selv', 25, () => state.totals.typedCorrect),
  B('Kunnskap', 'skriv100', '🖋️', 'Ordsmed', 'Skriv 100 riktige svar selv', 100, () => state.totals.typedCorrect),
  B('Kunnskap', 'felle20', '🪤', 'Fellefanger', 'Unngå den norske fella 20 ganger (afraid of, good at ...)', 20, () => state.totals.trapCorrect),
  B('Kunnskap', 'felle75', '🦊', 'Lur som en rev', 'Unngå den norske fella 75 ganger', 75, () => state.totals.trapCorrect),
  B('Kunnskap', 'fortid25', '⏪', 'Tidsreisende', '25 riktige compound verbs i fortid', 25, () => state.totals.pastCorrect),
  B('Kunnskap', 'def20', '📖', 'Ordboka', '20 riktige på engelske forklaringer', 20, () => state.totals.defCorrect),
  B('Kunnskap', 'feil3', '🩹', 'Lærer av feil', 'Spill «Mine feil» 3 ganger', 3, () => state.totals.mistakeRounds),
  B('Kunnskap', 'feilfri', '💎', 'Feilfri', 'Alt riktig på første forsøk i en runde', 1, () => state.totals.perfect),
  B('Kunnskap', 'feilfri5', '👑', 'Perfeksjonist', 'Fem feilfrie runder', 5, () => state.totals.perfect),
  B('Prøve', 'prove1', '📝', 'Prøvekanin', 'Ta en prøveøving', 1, () => state.totals.exams),
  B('Prøve', 'prove5', '📚', 'Godt forberedt', 'Ta fem prøveøvinger', 5, () => state.totals.exams),
  B('Prøve', 'prove80', '🥈', 'Klar for prøven', 'Minst 80 % på en prøveøving', 80, () => state.totals.examBest),
  B('Prøve', 'prove100', '🥇', 'Toppkarakter', '100 % på en prøveøving', 100, () => state.totals.examBest),
  ...tiers('Dager', 'dager', ['📅', '🗓️', '🏵️'], ['To dager', 'Tre dager', 'Fem dager'], [2, 3, 5], (g) => `Spill ${g} dager på rad`, () => state.days.best),
  ...tiers('Dager', 'dagens', ['☀️', '🌤️', '🌈'], ['Dagens første', 'Tre dagens', 'Sju dagens'], [1, 3, 7],
    (g) => `Fullfør dagens utfordring ${g === 1 ? 'én gang' : `${g} ganger`}`, () => state.totals.dailyDone),
  ...ARCADE_TIERS.flatMap((a) => a.goals.map((g, i) => B('Arkade', `${a.id}${i + 1}`, a.icons[i], `${a.name} ${['bronse', 'sølv', 'gull'][i]}`, a.desc(g), 1, () => {
    const best = state.arcade[a.id]?.best;
    if (best === null || best === undefined) return 0;
    return (a.lowerIsBetter ? best <= g : best >= g) ? 1 : 0;
  }))),
  B('Spesielle', 'nattugle', '🦉', 'Nattugle', 'Øv etter klokka ni om kvelden', 1, () => (state.flags.nightOwl ? 1 : 0)),
  B('Spesielle', 'morgenfugl', '🐓', 'Morgenfugl', 'Øv mellom fem og åtte om morgenen', 1, () => (state.flags.earlyBird ? 1 : 0)),
  B('Spesielle', 'lytter', '🔊', 'Lytteøre', 'Lytt til uttalen 10 ganger', 10, () => state.flags.spoken || 0),
  B('Spesielle', 'stilist', '🎨', 'Stilist', 'Bytt bakgrunn', 1, () => (state.flags.styled ? 1 : 0)),
  B('Spesielle', 'samler', '🖼️', 'Samler', 'Lås opp 5 bakgrunner', 5, () => THEMES.filter((t) => t.need(state, progress)).length),
];

const KNOWN = new Set(BADGES.map((b) => b.id));
state.badges = state.badges.filter((id) => KNOWN.has(id));

export function badgeProgress(b) {
  return { value: Math.min(b.value(), b.goal), goal: b.goal, done: state.badges.includes(b.id) };
}

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
