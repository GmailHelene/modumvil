// Arcade game list and badge thresholds. Kept separate so badges.js does not depend on the UI.
export const ARCADE = [
  {
    id: 'jakt', name: 'Stavejakt', icon: '🎯', unit: 'poeng',
    desc: 'Er ordet riktig stavet? Svar så fort du kan.',
    rules: '60 sekunder. Feil svar koster 3 sekunder.',
  },
  {
    id: 'stafett', name: 'Skrivestafett', icon: '⌨️', unit: 'ord',
    desc: 'Skriv så mange ord du klarer på 90 sekunder.',
    rules: 'Du ser oppgaven, skriver ordet og trykker Enter. Du kan hoppe over et ord, men det koster 5 sekunder.',
  },
];

export const ARCADE_TIERS = [
  { id: 'jakt', name: 'Stavejakt', icons: ['🎯', '🏹', '🦅'], goals: [10, 20, 30], desc: (g) => `${g} poeng i Stavejakt` },
  { id: 'stafett', name: 'Skrivestafett', icons: ['⌨️', '🏃', '⚡'], goals: [5, 10, 15], desc: (g) => `${g} ord i Skrivestafett` },
];

export const arcadeById = (id) => ARCADE.find((a) => a.id === id) || null;
