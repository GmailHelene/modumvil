// Lessons. Plain data so it is easy to edit the texts.

export const LESSONS = [
  {
    title: 'To visere, to jobber',
    text: 'Den <b class="c-hour">korte viseren</b> viser timene. Den <b class="c-min">lange viseren</b> viser minuttene. Se alltid på den korte først: hvilken time er vi i?',
    examples: [{ h: 3, m: 0 }, { h: 9, m: 0 }],
    helper: false, zones: false,
  },
  {
    title: 'Hele timer',
    text: 'Når den <b class="c-min">lange viseren</b> peker rett opp på 12, er klokka hel. Da leser du bare tallet den <b class="c-hour">korte viseren</b> peker på.',
    examples: [{ h: 7, m: 0 }, { h: 12, m: 0 }, { h: 4, m: 0 }],
    helper: false, zones: false,
  },
  {
    title: 'Halv: den store fella',
    text: 'På norsk betyr «halv tre» at det er en halv time <b>igjen</b> til tre. Altså 2:30, ikke 3:30. Den <b class="c-hour">korte viseren</b> står midt mellom 2 og 3, og den <b class="c-min">lange</b> peker rett ned på 6.',
    examples: [{ h: 2, m: 30 }, { h: 7, m: 30 }, { h: 11, m: 30 }],
    helper: false, zones: false,
  },
  {
    title: 'Kvart over og kvart på',
    text: 'En kvart er 15 minutter, en fjerdedel av runden. Peker den <b class="c-min">lange viseren</b> på 3, er det kvart over. Peker den på 9, er det kvart på neste time.',
    examples: [{ h: 4, m: 15 }, { h: 4, m: 45 }, { h: 10, m: 15 }],
    helper: true, zones: false,
  },
  {
    title: 'Hvert tall er fem minutter',
    text: 'For den <b class="c-min">lange viseren</b> betyr tallene noe annet: gang tallet med 5. Peker den på 2, er det 10 minutter. Peker den på 8, er det 40.',
    examples: [{ h: 8, m: 10 }, { h: 8, m: 40 }, { h: 1, m: 5 }],
    helper: true, zones: false,
  },
  {
    title: 'Fire soner på klokka',
    text: 'Del klokka i fire: <b class="c-over">0-19 min: over</b> timen. <b class="c-pahalv">20-29: på halv</b>. <b class="c-overhalv">31-40: over halv</b>. <b class="c-pa">41-59: på</b> neste time. Finn sonen først, så tell minuttene.',
    examples: [{ h: 2, m: 10 }, { h: 2, m: 20 }, { h: 2, m: 35 }, { h: 2, m: 50 }],
    helper: true, zones: true,
  },
  {
    title: 'Hvert eneste minutt',
    text: 'Hver lille strek er ett minutt. Tell fra nærmeste tall: 2:17 er tre streker etter 3-tallet (15 + 2), altså «sytten minutter over to».',
    examples: [{ h: 2, m: 17 }, { h: 5, m: 23 }, { h: 9, m: 43 }],
    helper: true, zones: true, step: 1,
  },
  {
    title: '24-timers klokka',
    text: 'Den analoge klokka går rundt to ganger hvert døgn. Digitale klokker teller videre etter tolv: 13, 14, 15 ... Kvart over tre om ettermiddagen er 15:15. Trikset: legg til 12 etter tolv på dagen.',
    examples: [{ h: 15, m: 15 }, { h: 18, m: 30 }, { h: 21, m: 45 }],
    helper: false, zones: false, show24: true,
  },
  {
    title: 'Romertall',
    text: 'Gamle klokker og kirketårn bruker romertall: I = 1, V = 5 og X = 10. IV er 5 minus 1 = 4, og IX er 10 minus 1 = 9. Viserne virker helt likt, du må bare kjenne igjen tallene.',
    examples: [{ h: 4, m: 0 }, { h: 9, m: 30 }, { h: 11, m: 45 }],
    helper: false, zones: false, numbers: 'roman',
  },
  {
    title: 'Klokker uten tall',
    text: 'Mange klokker har bare streker. 12 er alltid rett opp, 3 rett til høyre, 6 rett ned og 9 rett til venstre. Tell de tykke strekene fra 12 for å finne de andre tallene.',
    examples: [{ h: 3, m: 0 }, { h: 7, m: 15 }, { h: 10, m: 40 }],
    helper: false, zones: false, numbers: 'none',
  },
];
