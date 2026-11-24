// Arcade game list and badge thresholds. Kept separate so badges.js does not depend on the UI.

export const ARCADE = [
  {
    id: 'lyn', name: 'Lynrunde', icon: '⚡', unit: 'poeng',
    desc: 'Les så mange klokker du klarer på 60 sekunder.',
    rules: 'Feil svar koster 3 sekunder, så ikke gjett i blinde.',
  },
  {
    id: 'santusant', name: 'Sant eller usant', icon: '✅', unit: 'poeng',
    desc: 'Stemmer teksten med klokka? Svar så fort du kan.',
    rules: '60 sekunder. Feil svar koster 3 sekunder.',
  },
  {
    id: 'finnklokka', name: 'Finn klokka', icon: '🔍', unit: 'poeng',
    desc: 'Fire klokker, én er riktig. Finn den!',
    rules: '60 sekunder. Feil svar koster 3 sekunder.',
  },
  {
    id: 'memory', name: 'Klokke-memory', icon: '🃏', unit: 'sek', lowerIsBetter: true,
    desc: 'Finn parene: en klokke og teksten som passer.',
    rules: 'Snu to kort om gangen. Jo raskere, jo bedre.',
  },
  {
    id: 'stillraskt', name: 'Still på tid', icon: '⏩', unit: 'sek', lowerIsBetter: true,
    desc: 'Still fem klokker så raskt du kan.',
    rules: 'Feil stilt gir 5 sekunders straff.',
  },
  {
    id: 'tidslinja', name: 'Tidslinja', icon: '📏', unit: 'rekker',
    desc: 'Trykk på klokkene i riktig rekkefølge, tidligst først.',
    rules: '60 sekunder. Feil trykk koster 3 sekunder og starter rekka på nytt.',
  },
  {
    id: 'overlevelse', name: 'Overlevelse', icon: '❤️', unit: 'poeng',
    desc: 'Tre liv. Oppgavene blir vanskeligere jo lenger du kommer.',
    rules: 'Ingen tidsgrense. Tre feil, og det er slutt.',
  },
];

export const ARCADE_TIERS = [
  { id: 'lyn', name: 'Lynrunde', icons: ['⚡', '🌩️', '🌪️'], goals: [10, 20, 30], desc: (g) => `${g} poeng i Lynrunde` },
  { id: 'santusant', name: 'Sant/usant', icons: ['✅', '☑️', '✔️'], goals: [15, 25, 35], desc: (g) => `${g} poeng i Sant eller usant` },
  { id: 'finnklokka', name: 'Finn klokka', icons: ['🔍', '🔎', '🕵️'], goals: [10, 18, 26], desc: (g) => `${g} poeng i Finn klokka` },
  { id: 'memory', name: 'Memory', icons: ['🃏', '🎴', '🀄'], goals: [90, 60, 40], lowerIsBetter: true, desc: (g) => `Klar Klokke-memory på ${g} sekunder eller mindre` },
  { id: 'stillraskt', name: 'Still på tid', icons: ['⏩', '⏭️', '🏎️'], goals: [60, 40, 25], lowerIsBetter: true, desc: (g) => `Still fem klokker på ${g} sekunder eller mindre` },
  { id: 'tidslinja', name: 'Tidslinja', icons: ['📏', '📐', '🧭'], goals: [3, 6, 9], desc: (g) => `${g} riktige rekker i Tidslinja` },
  { id: 'overlevelse', name: 'Overlevelse', icons: ['❤️', '💖', '💗'], goals: [10, 25, 40], desc: (g) => `${g} poeng i Overlevelse` },
];

export function arcadeById(id) {
  return ARCADE.find((a) => a.id === id) || null;
}
