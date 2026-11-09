// Backgrounds. Colours live in css/app.css under [data-theme].
export const THEMES = [
  { id: 'natt', name: 'Natthimmel', icon: '🌙', color: '#1b1640', req: 'Åpen fra start', need: () => true },
  { id: 'hav', name: 'Havdypet', icon: '🐠', color: '#062a3d', req: 'Åpen fra start', need: () => true },
  { id: 'skog', name: 'Jungel', icon: '🌴', color: '#0d2a1c', req: 'Fullfør Verbbyen', need: (s, x) => x.worldDone(1) },
  { id: 'solnedgang', name: 'London-solnedgang', icon: '🌅', color: '#3a1530', req: 'Nå rangen Word Rookie', need: (s) => s.xp >= 150 },
  { id: 'godteri', name: 'Godteributikken', icon: '🍭', color: '#3b1745', req: 'Ta 8 merker', need: (s, x) => x.badgeCount() >= 8 },
  { id: 'nordlys', name: 'Nordlys', icon: '🌌', color: '#071d2b', req: 'Spill 3 dager på rad', need: (s) => s.days.best >= 3 },
  { id: 'retro', name: 'Retro-arkade', icon: '👾', color: '#120a24', req: '15 poeng i Lynrunde', need: (s) => (s.arcade.lyn?.best || 0) >= 15 },
  { id: 'gull', name: 'Gullkammeret', icon: '👑', color: '#221a05', req: 'Slå Prøvegeneralen', need: (s, x) => x.worldDone(5) },
];

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
