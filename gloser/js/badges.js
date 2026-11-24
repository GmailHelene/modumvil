// Badges. Each badge is "value reaches goal", so every badge can show a progress bar.
import { state, totalKnown } from './store.js';
import { THEMES } from './themes.js';
import { ARCADE_TIERS } from './arcade-data.js';

const B = (cat, id, icon, title, desc, goal, value) => ({ cat, id, icon, title, desc, goal, value });
const tiers = (cat, prefix, icons, titles, goals, descFn, value) => goals.map((g, i) => B(cat, `${prefix}${g}`, icons[i], titles[i], descFn(g), g, value));

export const CATEGORIES = ['Svar', 'Skriving', 'Ord som sitter', 'Rekker', 'Test deg', 'Dager', 'Arkade', 'Spesielle'];

export const BADGES = [
  B('Svar', 'forste', '🌱', 'Første ord', 'Svar riktig for første gang', 1, () => state.totals.correct),
  ...tiers('Svar', 'svar', ['🔟', '🖐️', '💯', '🎖️', '🏆'], ['Ti riktige', 'Femti riktige', 'Hundre riktige', 'Kvart tusen', 'Fem hundre'],
    [10, 50, 100, 250, 500], (g) => `${g} riktige svar til sammen`, () => state.totals.correct),
  ...tiers('Skriving', 'skriv', ['✏️', '🖋️', '📜'], ['Skriveflink', 'Ordsmed', 'Forfatter'], [20, 75, 200],
    (g) => `Skriv ${g} riktige svar selv`, () => state.totals.typedCorrect),
  ...tiers('Skriving', 'diktat', ['🎧', '👂', '🦻'], ['Lytteøre', 'Diktatmester', 'Superøre'], [10, 40, 100],
    (g) => `${g} riktige diktater`, () => state.totals.listenCorrect),
  B('Skriving', 'dekk20', '🙈', 'Fotografisk', '20 riktige på Se, dekk, skriv', 20, () => state.totals.flashCorrect),
  B('Skriving', 'sammen10', '🧩', 'Ordbygger', 'Sett sammen 10 sammensatte ord riktig', 10, () => state.totals.composeCorrect),
  B('Skriving', 'engelsk50', '🇬🇧', 'Glosegeni', '50 riktige engelske gloser', 50, () => state.totals.glossCorrect),
  B('Skriving', 'norsk50', '🇳🇴', 'Staveekspert', '50 riktige norske staveord', 50, () => state.totals.wordCorrect),
  ...tiers('Ord som sitter', 'sitter', ['🌟', '⭐', '✨', '🌌'], ['Fem sitter', 'Ti sitter', 'Tjue sitter', 'Alle sammen'], [5, 10, 20, 22],
    (g) => `${g} ord som sitter (riktig skrevet flere ganger på rad)`, () => totalKnown()),
  ...tiers('Rekker', 'rekke', ['🔥', '🚀', '☄️', '🐉'], ['Fem på rad', 'Ti på rad', 'Tjue på rad', 'Tretti på rad'],
    [5, 10, 20, 30], (g) => `${g} riktige svar på rad`, () => state.bestStreak),
  B('Rekker', 'feilfri', '💎', 'Feilfri', 'Alt riktig på første forsøk i en øverunde', 1, () => state.totals.perfect),
  B('Rekker', 'feilfri5', '👑', 'Perfeksjonist', 'Fem feilfrie øverunder', 5, () => state.totals.perfect),
  B('Test deg', 'test1', '📝', 'Prøvekanin', 'Ta Test deg', 1, () => state.totals.tests),
  B('Test deg', 'test5', '📚', 'Godt forberedt', 'Ta Test deg fem ganger', 5, () => state.totals.tests),
  B('Test deg', 'test80', '🥈', 'Klar for prøven', 'Minst 80 % på Test deg', 80, () => state.totals.testBest),
  B('Test deg', 'test100', '🥇', 'Alt riktig', '100 % på Test deg', 100, () => state.totals.testBest),
  B('Test deg', 'feil3', '🩹', 'Lærer av feil', 'Øv på «Mine feil» 3 ganger', 3, () => state.totals.mistakeRounds),
  ...tiers('Dager', 'dager', ['📅', '🗓️', '🏵️'], ['To dager', 'Tre dager', 'Fem dager'], [2, 3, 5], (g) => `Øv ${g} dager på rad`, () => state.days.best),
  ...ARCADE_TIERS.flatMap((a) => a.goals.map((g, i) => B('Arkade', `${a.id}${i + 1}`, a.icons[i], `${a.name} ${['bronse', 'sølv', 'gull'][i]}`, a.desc(g), g, () => state.arcade[a.id]?.best || 0))),
  B('Spesielle', 'egenuke', '🛠️', 'Egen liste', 'Legg inn en egen ordliste', 1, () => state.totals.weeksMade),
  B('Spesielle', 'nattugle', '🦉', 'Nattugle', 'Øv etter klokka ni om kvelden', 1, () => (state.flags.nightOwl ? 1 : 0)),
  B('Spesielle', 'morgenfugl', '🐓', 'Morgenfugl', 'Øv mellom fem og åtte om morgenen', 1, () => (state.flags.earlyBird ? 1 : 0)),
  B('Spesielle', 'lytter', '🔊', 'Hør her', 'Lytt til uttalen 15 ganger', 15, () => state.flags.spoken || 0),
  B('Spesielle', 'stilist', '🎨', 'Stilist', 'Bytt bakgrunn', 1, () => (state.flags.styled ? 1 : 0)),
  B('Spesielle', 'samler', '🖼️', 'Samler', 'Lås opp 5 bakgrunner', 5, () => THEMES.filter((t) => t.need(state, themeCtx)).length),
];

export const themeCtx = { known: totalKnown, badges: () => state.badges.length };

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
