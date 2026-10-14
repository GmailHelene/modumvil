// Worlds and levels. Plain data: edit freely, tests check every level generates.
//
// Level fields:
//   minutes  array | 'five' | 'all' | {from,to}  which minutes can come up
//   focus    minutes that come up more often
//   step     snap step when setting the clock (1 or 5)
//   kinds    question factories (see game.js)
//   numbers  'arabic' | 'roman' | 'quarters' | 'none'  numbers on the clock face
//   timer    seconds per question, or undefined for no timer
//   hours    hours (0-23) for 24-hour tasks
//   deltas   minutes to add/subtract in time-math tasks
//   boss     last level of a world: longer, and needed to open the next world

const FIVE = 'five';
const ALL = 'all';

const W = (id, name, icon, intro, levels) => ({
  id, name, icon, intro,
  levels: levels.map((l, i) => ({
    id: `${id}-${i + 1}`,
    world: id,
    n: i + 1,
    step: 5,
    numbers: 'arabic',
    length: l.boss ? 12 : 10,
    ...l,
  })),
});

const BASIC = ['readWords', 'readDigital', 'set', 'setDigital'];

export const WORLDS = [
  W(1, 'Klokkeskogen', '🌲', 'Hele, halve og kvarte timer. Her lærer du hva de to viserne gjør.', [
    {
      title: 'Hele timer', minutes: [0], kinds: ['readWords', 'set'],
      intro: 'Den lange viseren peker rett opp på 12. Da er klokka hel, og du leser bare tallet den korte viseren peker på.',
    },
    {
      title: 'Halve timer', minutes: [0, 30], focus: [30], kinds: ['readWords', 'set'],
      intro: 'Halv tre betyr en halv time IGJEN til tre, altså 2:30. Den lange viseren peker rett ned.',
    },
    {
      title: 'Kvart over', minutes: [0, 15, 30], focus: [15], kinds: ['readWords', 'set'],
      intro: 'En kvart er 15 minutter. Peker den lange viseren på 3, er det kvart over.',
    },
    {
      title: 'Kvart på', minutes: [0, 15, 30, 45], focus: [45], kinds: ['readWords', 'set'],
      intro: 'Peker den lange viseren på 9, mangler det 15 minutter til neste time: kvart på.',
    },
    {
      title: 'Digitalt også', minutes: [0, 15, 30, 45], kinds: BASIC,
      intro: 'Nå skal du også lese og stille digital tid. Kvart på fire er 3:45.',
    },
    {
      title: 'BOSS: Skogtrollet', boss: true, minutes: [0, 15, 30, 45], kinds: BASIC, numbers: 'quarters',
      intro: 'Skogtrollet har stjålet de fleste tallene! Bare 12, 3, 6 og 9 er igjen. 12 oppgaver.',
    },
  ]),
  W(2, 'Femminuttsfjellet', '⛰️', 'Hvert tall er fem minutter. Fem over, ti over, ti på og fem på.', [
    {
      title: 'Fem og ti over', minutes: [0, 5, 10, 15], focus: [5, 10], kinds: ['readWords', 'set'],
      intro: 'For den lange viseren betyr 1 fem minutter og 2 ti minutter. Peker den på 2, er det ti over.',
    },
    {
      title: 'Fem og ti på', minutes: [0, 45, 50, 55], focus: [50, 55], kinds: ['readWords', 'set'],
      intro: 'Peker den lange viseren på 10, mangler det ti minutter: ti på. På 11 er det fem på.',
    },
    {
      title: 'Over og på', minutes: [0, 5, 10, 15, 45, 50, 55], kinds: ['readWords', 'set', 'readDigital'],
      intro: 'Høyre side av klokka er «over», venstre side er «på». Finn siden først.',
    },
    {
      title: 'Femgangen', minutes: [0, 5, 10, 15, 30, 45, 50, 55], kinds: BASIC,
      intro: 'Gang tallet med 5. Peker den lange viseren på 11, er det 55 minutter.',
    },
    {
      title: 'Romertall', minutes: [0, 5, 10, 15, 30, 45, 50, 55], kinds: BASIC, numbers: 'roman',
      intro: 'Gamle klokker har romertall: I, II, III, IV, V ... XII. Viserne virker helt likt.',
    },
    {
      title: 'BOSS: Fjellkongen', boss: true, minutes: [0, 5, 10, 15, 30, 45, 50, 55], kinds: BASIC,
      numbers: 'quarters', timer: 25,
      intro: 'Fjellkongen er utålmodig: 25 sekunder per oppgave, og bare fire tall på klokka.',
    },
  ]),
  W(3, 'Halvveisbyen', '🏙️', 'Den vanskelige midten: på halv og over halv.', [
    {
      title: 'På halv', minutes: [20, 25, 30], focus: [20, 25], kinds: ['readWords', 'set'],
      intro: '2:25 er fem minutter FØR halv tre: «fem på halv tre». 2:20 er «ti på halv tre».',
    },
    {
      title: 'Over halv', minutes: [30, 35, 40], focus: [35, 40], kinds: ['readWords', 'set'],
      intro: '2:35 er fem minutter ETTER halv tre: «fem over halv tre». 2:40 er «ti over halv tre».',
    },
    {
      title: 'Hele midten', minutes: [20, 25, 30, 35, 40], kinds: BASIC,
      intro: 'Fra 20 til 40 minutter teller vi fra halv. Husk: halv peker alltid mot NESTE time.',
    },
    {
      title: 'Alle femminutter', minutes: FIVE, focus: [20, 25, 35, 40], kinds: BASIC,
      intro: 'Alle tolv tallene, fra hel til fem på. Finn sonen: over, på halv, over halv eller på.',
    },
    {
      title: 'Uten tall', minutes: FIVE, kinds: BASIC, numbers: 'none',
      intro: 'Mange klokker har bare streker. De tykke strekene er der tallene skulle vært. 12 er rett opp.',
    },
    {
      title: 'BOSS: Halvveisheksa', boss: true, minutes: FIVE, focus: [20, 25, 35, 40], kinds: BASIC,
      numbers: 'quarters', timer: 20,
      intro: 'Heksa elsker «på halv» og «over halv». 20 sekunder per oppgave!',
    },
  ]),
  W(4, 'Minuttmyra', '🐸', 'Hver lille strek er ett minutt. Nå teller vi nøyaktig.', [
    {
      title: 'Minutter over', minutes: { from: 1, to: 19 }, step: 1, kinds: BASIC,
      intro: 'Tell strekene fra nærmeste tall. 2:17 er 15 + 2: «sytten minutter over to».',
    },
    {
      title: 'Minutter på', minutes: { from: 41, to: 59 }, step: 1, kinds: BASIC,
      intro: 'Over 40 minutter teller vi hvor mange som mangler. 2:52 er «åtte minutter på tre».',
    },
    {
      title: 'Rundt halv', minutes: { from: 21, to: 39 }, step: 1, kinds: BASIC,
      intro: '2:27 er tre minutter på halv tre. 2:33 er tre minutter over halv tre.',
    },
    {
      title: 'Alle minutter', minutes: ALL, step: 1, kinds: BASIC,
      intro: 'Hele klokka, minutt for minutt.',
    },
    {
      title: 'Romerske minutter', minutes: ALL, step: 1, kinds: BASIC, numbers: 'roman',
      intro: 'Romertall og enkeltminutter. Nå er du på ekspertnivå.',
    },
    {
      title: 'BOSS: Myrmonsteret', boss: true, minutes: ALL, step: 1, kinds: BASIC, numbers: 'none', timer: 30,
      intro: 'Ingen tall, bare streker, og 30 sekunder per oppgave. Myrmonsteret gir seg ikke lett.',
    },
  ]),
  W(5, 'Døgnøya', '🌗', 'Den analoge klokka går rundt to ganger i døgnet. Nå bruker vi 24-timers tid.', [
    {
      title: 'Morgen og formiddag', minutes: FIVE, kinds: ['read24', 'set24'], hours: [6, 7, 8, 9, 10, 11],
      intro: 'Før tolv er timetallet det samme som på klokka: åtte om morgenen er 08:00.',
    },
    {
      title: 'Ettermiddag', minutes: FIVE, kinds: ['read24', 'set24'], hours: [12, 13, 14, 15, 16, 17],
      intro: 'Etter tolv legger du til 12. Tre om ettermiddagen er 3 + 12 = 15:00.',
    },
    {
      title: 'Kveld og natt', minutes: FIVE, kinds: ['read24', 'set24'], hours: [18, 19, 20, 21, 22, 23, 0, 1],
      intro: 'Ni om kvelden er 21:00. Midnatt er 00:00, og ett om natta er 01:00.',
    },
    {
      title: 'Still etter 24-timer', minutes: FIVE, kinds: ['set24'], hours: [7, 9, 12, 13, 15, 16, 18, 19, 20, 22],
      intro: 'Du får digital tid som 17:45. Trekk fra 12 hvis tallet er over 12, og still klokka.',
    },
    {
      title: 'Hele døgnet', minutes: FIVE, kinds: ['read24', 'set24'], hours: 'all',
      intro: 'Alle timer i døgnet. Se etter om det står morgen, formiddag, ettermiddag, kveld eller natt.',
    },
    {
      title: 'BOSS: Nattravnen', boss: true, minutes: FIVE, kinds: ['read24', 'set24'], hours: 'all', timer: 25,
      numbers: 'roman',
      intro: 'Nattravnen flyr bare i mørket. Romertall, 24-timers tid og 25 sekunder per oppgave.',
    },
  ]),
  W(6, 'Tidsmaskinen', '🚀', 'Bruk klokka til ekte ting: hvor lenge, når er det ferdig, hva var klokka?', [
    {
      title: 'Om litt', minutes: FIVE, kinds: ['mathLater'], deltas: [5, 10, 15, 20, 30],
      intro: 'Hva er klokka om 15 minutter? Flytt den lange viseren tre tall fram i hodet.',
    },
    {
      title: 'Hvor lenge til?', minutes: FIVE, kinds: ['mathWait'],
      intro: 'Bussen går om litt. Tell minuttene fra nå og fram dit.',
    },
    {
      title: 'Når er det ferdig?', minutes: FIVE, kinds: ['mathEnd'], deltas: [15, 20, 30, 45, 60, 75, 90],
      intro: 'Filmen varer 1 time og 30 minutter. Legg til timen først, så minuttene.',
    },
    {
      title: 'For en stund siden', minutes: FIVE, kinds: ['mathBefore'], deltas: [5, 10, 15, 20, 30, 45, 60],
      intro: 'Hva var klokka for 20 minutter siden? Nå teller du baklengs.',
    },
    {
      title: 'Store sprang', minutes: FIVE, kinds: ['mathLater', 'mathEnd', 'mathBefore'],
      deltas: [40, 45, 50, 75, 90, 105, 120, 150],
      intro: 'Lengre tid, flere timer. Del opp: hele timer først, så resten.',
    },
    {
      title: 'BOSS: Tidsherren', boss: true, minutes: FIVE, kinds: ['mathLater', 'mathWait', 'mathEnd', 'mathBefore'],
      deltas: [10, 15, 25, 35, 45, 60, 90], timer: 40,
      intro: 'Den siste bossen. Alle typer tidsregning, 40 sekunder per oppgave. Klarer du denne, er du Tidsherre.',
    },
  ]),
];

export const LEVELS = WORLDS.flatMap((w) => w.levels);

export function levelById(id) {
  return LEVELS.find((l) => l.id === id) || null;
}

export function nextLevel(level) {
  const i = LEVELS.indexOf(level);
  return i >= 0 ? LEVELS[i + 1] || null : null;
}

export function prevLevel(level) {
  const i = LEVELS.indexOf(level);
  return i > 0 ? LEVELS[i - 1] : null;
}

export function worldById(id) {
  return WORLDS.find((w) => w.id === id) || null;
}

// Stars: share of first-try correct answers.
export function starLimits(length) {
  return [0.5, 0.7, 0.9].map((p) => Math.ceil(p * length));
}

export function starsFor(correct, length = 10) {
  return starLimits(length).filter((limit) => correct >= limit).length;
}

export const UNLOCK_STARS = 2;
