// Backgrounds. Colours live in css/app.css under [data-theme].
export const THEMES = [
  { id: 'natt', name: 'Natthimmel', icon: '🌙', color: '#1b1640', req: 'Åpen fra start', need: () => true },
  { id: 'hav', name: 'Havdypet', icon: '🐠', color: '#062a3d', req: 'Åpen fra start', need: () => true },
  { id: 'skog', name: 'Trolldomsskogen', icon: '🌲', color: '#0d2a1c', req: '10 ord som sitter', need: (s, x) => x.known() >= 10 },
  { id: 'solnedgang', name: 'Solnedgang', icon: '🌅', color: '#3a1530', req: 'Nå rangen Bokstavjeger', need: (s) => s.xp >= 150 },
  { id: 'godteri', name: 'Godteributikken', icon: '🍭', color: '#3b1745', req: 'Ta 8 merker', need: (s, x) => x.badges() >= 8 },
  { id: 'nordlys', name: 'Nordlys', icon: '🌌', color: '#071d2b', req: 'Øv 3 dager på rad', need: (s) => s.days.best >= 3 },
  { id: 'retro', name: 'Retro-arkade', icon: '👾', color: '#120a24', req: '15 poeng i Stavejakt', need: (s) => (s.arcade.jakt?.best || 0) >= 15 },
  { id: 'gull', name: 'Gullkammeret', icon: '👑', color: '#221a05', req: '100 % på Test deg', need: (s) => s.totals.testBest >= 100 },
];

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
