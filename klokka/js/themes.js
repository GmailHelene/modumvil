// Backgrounds and clock faces. Colours live in css/app.css under [data-theme] / [data-face].
// `need` is a requirement checked against the player's state; `req` is the text shown while locked.

export const THEMES = [
  { id: 'natt', name: 'Natthimmel', icon: '🌙', color: '#1b1640', req: 'Åpen fra start', need: () => true },
  { id: 'hav', name: 'Havdypet', icon: '🐠', color: '#062a3d', req: 'Åpen fra start', need: () => true },
  { id: 'skog', name: 'Jungel', icon: '🌴', color: '#0d2a1c', req: 'Fullfør Klokkeskogen', need: (s, x) => x.worldDone(1) },
  { id: 'solnedgang', name: 'Solnedgang', icon: '🌅', color: '#3a1530', req: 'Nå rangen Viser-viking', need: (s) => s.xp >= 150 },
  { id: 'godteri', name: 'Godteributikken', icon: '🍭', color: '#3b1745', req: 'Ta 10 merker', need: (s, x) => x.badgeCount() >= 10 },
  { id: 'vulkan', name: 'Vulkanen', icon: '🌋', color: '#2c0f0a', req: 'Fullfør Halvveisbyen', need: (s, x) => x.worldDone(3) },
  { id: 'nordlys', name: 'Nordlys', icon: '🌌', color: '#071d2b', req: 'Spill 7 dager på rad', need: (s) => s.days.best >= 7 },
  { id: 'retro', name: 'Retro-arkade', icon: '👾', color: '#120a24', req: '20 poeng i Lynrunde', need: (s) => (s.arcade.lyn?.best || 0) >= 20 },
  { id: 'verdensrom', name: 'Verdensrommet', icon: '🪐', color: '#05060f', req: 'Nå rangen Klokkemester', need: (s) => s.xp >= 1600 },
  { id: 'gull', name: 'Gullkammeret', icon: '👑', color: '#221a05', req: 'Fullfør Tidsmaskinen', need: (s, x) => x.worldDone(6) },
];

export const FACES = [
  { id: 'klassisk', name: 'Klassisk', req: 'Åpen fra start', need: () => true },
  { id: 'minimal', name: 'Minimal', req: 'Åpen fra start', need: () => true },
  { id: 'natt', name: 'Nattklokke', req: '5 stjerner', need: (s, x) => x.stars() >= 5 },
  { id: 'sjo', name: 'Sjømann', req: 'Fullfør Femminuttsfjellet', need: (s, x) => x.worldDone(2) },
  { id: 'tre', name: 'Treklokke', req: '100 riktige svar', need: (s) => s.totals.correct >= 100 },
  { id: 'neon', name: 'Neon', req: 'Fullfør Minuttmyra', need: (s, x) => x.worldDone(4) },
  { id: 'godteri', name: 'Sukkertøy', req: 'Ta 25 merker', need: (s, x) => x.badgeCount() >= 25 },
  { id: 'gull', name: 'Gullur', req: 'Alle 108 stjerner', need: (s, x) => x.stars() >= 108 },
];

export function themeById(id) {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}

export function faceById(id) {
  return FACES.find((f) => f.id === id) || FACES[0];
}
