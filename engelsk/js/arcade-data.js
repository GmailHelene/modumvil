// Arcade game list and badge thresholds.
export const ARCADE = [
  { id: 'lyn', name: 'Lynrunde', icon: '⚡', unit: 'poeng', desc: 'Svar på så mange du klarer på 60 sekunder.', rules: 'Feil svar koster 3 sekunder, så ikke gjett i blinde.' },
  { id: 'santusant', name: 'Right or wrong?', icon: '✅', unit: 'poeng', desc: 'Er setningen riktig engelsk? Svar så fort du kan.', rules: '60 sekunder. Feil svar koster 3 sekunder.' },
  { id: 'memory', name: 'Ord-memory', icon: '🃏', unit: 'sek', lowerIsBetter: true, desc: 'Finn parene: det engelske uttrykket og det norske.', rules: 'Snu to kort om gangen. Jo raskere, jo bedre.' },
];

export const ARCADE_TIERS = [
  { id: 'lyn', name: 'Lynrunde', icons: ['⚡', '🌩️', '🌪️'], goals: [10, 18, 26], desc: (g) => `${g} poeng i Lynrunde` },
  { id: 'santusant', name: 'Right or wrong', icons: ['✅', '☑️', '✔️'], goals: [12, 20, 28], desc: (g) => `${g} poeng i Right or wrong?` },
  { id: 'memory', name: 'Memory', icons: ['🃏', '🎴', '🀄'], goals: [90, 60, 40], lowerIsBetter: true, desc: (g) => `Klar Ord-memory på ${g} sekunder eller mindre` },
];

export const arcadeById = (id) => ARCADE.find((a) => a.id === id) || null;
