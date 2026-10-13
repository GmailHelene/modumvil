import { Clock } from './clock.js';
import {
  phrase, digital, explain, partOfDay, capitalize, mod,
} from './time-no.js';
import {
  LEVELS, levelById, makeRound, repeatOf, checkSet, starsFor, makeLightningQuestion,
  ROUND_LENGTH, MAX_REPEATS, UNLOCK_STARS,
} from './game.js';
import {
  state, save, reset, rankFor, recordAnswer, markPlayedToday, totalStars,
} from './store.js';
import { sound, vibrate, confetti } from './fx.js';
import { LESSONS, BADGES } from './content.js';

// ---------- helpers ----------

const $ = (sel, root = document) => root.querySelector(sel);
const binds = (name) => [...document.querySelectorAll(`[data-bind="${name}"]`)];
const bind = (name) => binds(name)[0];
const setText = (name, text) => binds(name).forEach((n) => { n.textContent = text; });

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function isUnlocked(id) {
  return state.settings.unlockAll || id === 1 || (state.stars[id - 1] || 0) >= UNLOCK_STARS;
}

function unlockedIds() {
  return LEVELS.filter((l) => isUnlocked(l.id)).map((l) => l.id);
}

let toastTimer = null;
function toast(html) {
  const t = bind('toast');
  t.innerHTML = html;
  t.hidden = false;
  t.classList.remove('toast--show');
  void t.offsetWidth; // restart animation
  t.classList.add('toast--show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 2800);
}

// ---------- badges ----------

function checkBadges(ctx = {}) {
  const has = (id) => state.badges.includes(id);
  const earned = [];
  const give = (id, cond) => {
    if (cond && !has(id)) {
      state.badges.push(id);
      earned.push(BADGES.find((b) => b.id === id));
    }
  };
  give('forste', state.totals.correct >= 1);
  give('rekke5', (ctx.streak || 0) >= 5);
  give('rekke10', (ctx.streak || 0) >= 10);
  give('feilfri', ctx.perfect);
  give('halvhelt', state.totals.halvCorrect >= 25);
  give('lyn10', (ctx.lyn || 0) >= 10);
  give('lyn20', (ctx.lyn || 0) >= 20);
  give('regnemester', (state.stars[7] || 0) >= 2);
  give('allenivaer', LEVELS.every((l) => (state.stars[l.id] || 0) >= 2));
  give('stjerner', totalStars() >= LEVELS.length * 3);
  give('hundre', state.totals.correct >= 100);
  give('dager3', state.days.count >= 3);
  give('dager7', state.days.count >= 7);
  if (earned.length) {
    save();
    sound.badge();
    toast(earned.map((b) => `<span aria-hidden="true">${b.icon}</span> Nytt merke: <b>${esc(b.title)}</b>`).join('<br>'));
  }
  return earned;
}

function badgeList(list) {
  return list.map((b) => `<li><span aria-hidden="true">${b.icon}</span> <b>${esc(b.title)}</b> <small>${esc(b.desc)}</small></li>`).join('');
}

// ---------- screens / routing ----------

const screens = {};
document.querySelectorAll('[data-screen]').forEach((s) => { screens[s.dataset.screen] = s; });
let current = null;

function show(name) {
  if (current === name) return;
  Object.entries(screens).forEach(([k, s]) => { s.hidden = k !== name; });
  if (current === 'lyn') lyn.stop();
  current = name;
  window.scrollTo(0, 0);
  const h = screens[name].querySelector('h1, h2');
  if (h && document.activeElement !== document.body) {
    h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  }
}

function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [page, arg] = hash.split('/');
  switch (page) {
    case 'nivaer': renderLevels(); show('levels'); break;
    case 'niva': {
      const level = levelById(Number(arg));
      if (!level || !isUnlocked(level.id)) { location.hash = '#/nivaer'; return; }
      renderIntro(level);
      show('intro');
      break;
    }
    case 'spill': {
      const level = levelById(Number(arg));
      if (!level || !isUnlocked(level.id)) { location.hash = '#/nivaer'; return; }
      // Re-entering via back/forward starts a fresh round.
      if (!game.level || game.level.id !== level.id || game.done) startRound(level);
      show('game');
      break;
    }
    case 'resultat': if (!game.done) { location.hash = '#/nivaer'; return; } show('result'); break;
    case 'lyn': lyn.prepare(); show('lyn'); break;
    case 'ov': practice.enter(); show('ov'); break;
    case 'laer': lesson.render(); show('laer'); break;
    case 'merker': renderBadges(); show('merker'); break;
    case 'innstillinger': renderSettings(); show('innstillinger'); break;
    default: renderHome(); show('home');
  }
}

window.addEventListener('hashchange', route);

// ---------- home ----------

function renderHome() {
  const rank = rankFor(state.xp);
  setText('rank', rank.title);
  setText('stars', `${totalStars()}/${LEVELS.length * 3}`);
  setText('days', String(state.days.count));
  const pct = Math.round(rank.progress * 100);
  const bar = bind('xpbar');
  bar.setAttribute('aria-valuenow', String(pct));
  bar.querySelector('.xpbar-fill').style.width = `${pct}%`;
  setText('xptext', rank.next
    ? `${state.xp} XP. ${rank.next.xp - state.xp} til ${rank.next.title}.`
    : `${state.xp} XP. Du har nådd toppen!`);
}

// ---------- levels ----------

function renderLevels() {
  setText('stars', `${totalStars()}/${LEVELS.length * 3}`);
  bind('levels').innerHTML = LEVELS.map((l) => {
    const open = isUnlocked(l.id);
    const s = state.stars[l.id] || 0;
    const starsHtml = [1, 2, 3].map((i) => `<span class="${i <= s ? 'on' : ''}">★</span>`).join('');
    const label = `Nivå ${l.id}: ${l.title}. ${open ? `${s} av 3 stjerner` : 'Låst'}`;
    const inner = `
      <span class="level-icon" aria-hidden="true">${open ? l.icon : '🔒'}</span>
      <span class="level-info"><small>Nivå ${l.id}</small><b>${esc(l.title)}</b></span>
      <span class="level-stars" aria-hidden="true">${starsHtml}</span>`;
    return open
      ? `<li><a class="level" href="#/niva/${l.id}" aria-label="${esc(label)}">${inner}</a></li>`
      : `<li><span class="level level--locked" aria-label="${esc(label)}. Få ${UNLOCK_STARS} stjerner på nivå ${l.id - 1} først.">${inner}</span></li>`;
  }).join('');
}

let introClock = null;
let introTimer = null;
function renderIntro(level) {
  setText('introTitle', `${level.icon} ${level.title}`);
  setText('introText', level.intro);
  if (!introClock) introClock = new Clock(bind('introClock'));
  introClock.setOptions({ helper: level.id >= 3 && level.id <= 5, zones: level.id === 4 });
  const demo = makeRound(level).slice(0, 4);
  let i = 0;
  const tick = () => {
    const q = demo[i % demo.length];
    introClock.set(q.h, q.m);
    i += 1;
  };
  clearInterval(introTimer);
  tick();
  introTimer = setInterval(() => {
    if (current !== 'intro') { clearInterval(introTimer); return; }
    tick();
  }, 2200);
  game.pendingLevel = level;
}

// ---------- game round ----------

const game = {
  level: null, queue: [], index: 0, firstTry: 0, scored: 0, repeats: 0,
  combo: 0, bestCombo: 0, xp: 0, earned: [], answered: false, done: false, q: null,
};

let displayClock = null;
let setClock = null;

function ensureGameClocks() {
  if (displayClock) return;
  displayClock = new Clock(bind('displayClock'));
  setClock = new Clock(bind('setClock'), {
    interactive: true,
    onTick: (m) => { if (m % 5 === 0) sound.tick(); },
    onChange: (h, m) => updateLiveReadout(h, m),
  });
}

function updateLiveReadout(h, m) {
  const q = game.q;
  if (!q || q.kind !== 'set' || !q.hinted) return;
  const el = bind('liveReadout');
  el.hidden = false;
  el.textContent = `Du har stilt: ${phrase(h, m)}`;
}

function startRound(level) {
  ensureGameClocks();
  Object.assign(game, {
    level, queue: makeRound(level, state.zoneStats), index: 0, firstTry: 0, scored: 0,
    repeats: 0, combo: 0, bestCombo: 0, xp: 0, earned: [], answered: false, done: false, q: null,
  });
  setClock.setOptions({ step: level.step });
  showQuestion();
}

function renderDots() {
  const dots = [];
  for (let i = 0; i < ROUND_LENGTH; i += 1) {
    const r = game.results ? game.results[i] : undefined;
    dots.push(`<span class="dot ${r === true ? 'dot--ok' : r === false ? 'dot--bad' : ''} ${i === game.scored && !game.q?.repeat ? 'dot--now' : ''}"></span>`);
  }
  bind('dots').innerHTML = dots.join('') + (game.q?.repeat ? '<span class="repeat-tag">Ekstra øving</span>' : '');
  setText('progressText', game.q?.repeat
    ? 'Ekstra øving på en du bommet på.'
    : `Oppgave ${game.scored + 1} av ${ROUND_LENGTH}.`);
}

function showQuestion() {
  const q = game.queue[game.index];
  game.q = q;
  game.answered = false;
  if (game.index === 0) game.results = [];
  bind('feedback').hidden = true;
  bind('liveReadout').hidden = true;
  setText('combo', game.combo >= 2 ? `🔥 ${game.combo}` : '');
  renderDots();

  const easyHelp = game.level.id <= 2;
  displayClock.setOptions({ helper: false, zones: false });
  setClock.setOptions({ helper: easyHelp, zones: false });
  $('[data-action="hint"]').disabled = false;

  bind('prompt').textContent = q.prompt;
  const target = bind('target');
  const opts = bind('options');

  if (q.kind === 'read') {
    bind('displayClock').hidden = false;
    bind('setClock').hidden = true;
    displayClock.set(q.h, q.m);
    target.hidden = true;
    bind('checkBtn').hidden = true;
    opts.hidden = false;
    opts.classList.toggle('options--long', q.options.some((o) => o.label.length > 18));
    opts.innerHTML = q.options.map((o, i) => `<button class="option" type="button" data-opt="${i}">${esc(capitalize(o.label))}</button>`).join('');
  } else {
    bind('displayClock').hidden = true;
    bind('setClock').hidden = false;
    // Start somewhere else than the answer so it has to be set.
    let start;
    do {
      start = Math.floor(Math.random() * 12) * 60 + (game.level.step === 1 ? Math.floor(Math.random() * 60) : 0);
    } while (Math.abs(start - (mod(q.h, 12) * 60 + q.m)) < 60);
    setClock.set(Math.floor(start / 60), start % 60, false);
    target.hidden = false;
    target.textContent = q.target;
    opts.hidden = true;
    opts.innerHTML = '';
    bind('checkBtn').hidden = false;
  }
  bind('prompt').focus({ preventScroll: true });
}

function onAnswer(correct, chosenBtn) {
  if (game.answered) return;
  game.answered = true;
  const q = game.q;
  $('[data-action="hint"]').disabled = true;
  recordAnswer(q.zone, correct);

  if (!q.repeat) {
    game.results[game.scored] = correct;
    game.scored += 1;
    if (correct) game.firstTry += 1;
  }

  let gained = 0;
  if (correct) {
    game.combo += 1;
    game.bestCombo = Math.max(game.bestCombo, game.combo);
    state.bestStreak = Math.max(state.bestStreak, game.combo);
    gained = q.repeat ? 3 : (q.hinted ? 5 : 10 + Math.min(game.combo, 5) * 2);
    sound.correct(game.combo);
    vibrate(20);
    if (game.combo % 5 === 0) confetti(60);
  } else {
    game.combo = 0;
    sound.wrong();
    vibrate([40, 40, 60]);
    if (game.repeats < MAX_REPEATS && !q.repeat) {
      const r = repeatOf(q, game.level);
      if (r) {
        // Put it 2-3 questions later, so it is fresh but not immediate.
        const at = Math.min(game.index + 3, game.queue.length);
        game.queue.splice(at, 0, r);
        game.repeats += 1;
      }
    }
  }
  game.xp += gained;
  state.xp += gained;
  save();
  game.earned.push(...checkBadges({ streak: game.combo }));

  // Visual feedback on the options.
  if (q.kind === 'read') {
    bind('options').querySelectorAll('.option').forEach((b, i) => {
      b.disabled = true;
      if (q.options[i].correct) b.classList.add('option--right');
    });
    if (chosenBtn && !correct) chosenBtn.classList.add('option--wrong');
  } else {
    bind('checkBtn').hidden = true;
  }
  renderDots();
  setText('combo', game.combo >= 2 ? `🔥 ${game.combo}` : '');

  const fb = bind('feedback');
  fb.classList.toggle('feedback--ok', correct);
  fb.classList.toggle('feedback--bad', !correct);
  if (correct) {
    const praise = ['Riktig!', 'Helt rett!', 'Sånn ja!', 'Knallbra!', 'Perfekt!'];
    bind('fbTitle').textContent = `${praise[Math.floor(Math.random() * praise.length)]} +${gained} XP`;
    bind('fbExplain').innerHTML = `<li>${esc(capitalize(q.answerText))}</li>`;
  } else {
    bind('fbTitle').textContent = q.kind === 'set'
      ? `Ikke helt. Du stilte ${phrase(setClock.get().h, setClock.get().m)}.`
      : 'Ikke helt. Slik tenker du:';
    bind('fbExplain').innerHTML = q.explain.map((l) => `<li>${esc(l)}</li>`).join('');
    if (q.kind === 'set') {
      setClock.setOptions({ helper: true });
      setTimeout(() => setClock.set(q.h, q.m), 450);
    }
  }
  fb.hidden = false;
  const nextBtn = fb.querySelector('[data-action="next"]');
  nextBtn.focus({ preventScroll: true });
  fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function nextQuestion() {
  game.index += 1;
  if (game.index >= game.queue.length) {
    finishRound();
    return;
  }
  showQuestion();
}

function finishRound() {
  game.done = true;
  const stars = starsFor(game.firstTry);
  const prev = state.stars[game.level.id] || 0;
  const bonus = stars * 10;
  game.xp += bonus;
  state.xp += bonus;
  if (stars > prev) state.stars[game.level.id] = stars;
  markPlayedToday();
  save();
  game.earned.push(...checkBadges({ perfect: game.firstTry === ROUND_LENGTH }));

  const titles = ['Øv litt til!', 'Bra jobba!', 'Kjempebra!', 'Klokkemester!'];
  setText('resultTitle', titles[stars]);
  bind('resultStars').innerHTML = [1, 2, 3].map((i) => `<span class="${i <= stars ? 'on' : ''}">★</span>`).join('')
    + `<span class="sr">${stars} av 3 stjerner</span>`;
  setText('resultScore', `${game.firstTry} av ${ROUND_LENGTH} riktige på første forsøk`);
  setText('resultXp', `+${game.xp} XP${game.bestCombo >= 3 ? `  ·  Lengste rekke: ${game.bestCombo}` : ''}`);
  bind('resultBadges').innerHTML = badgeList(game.earned);

  const next = levelById(game.level.id + 1);
  const nextBtn = bind('nextLevelBtn');
  nextBtn.hidden = !next || !isUnlocked(next.id);
  if (stars >= 2) { sound.fanfare(); confetti(); }
  location.hash = '#/resultat';
}

function useHint() {
  const q = game.q;
  if (!q || game.answered) return;
  q.hinted = true;
  const clock = q.kind === 'read' ? displayClock : setClock;
  clock.setOptions({ helper: true, zones: true });
  $('[data-action="hint"]').disabled = true;
  if (q.kind === 'set') updateLiveReadout(setClock.get().h, setClock.get().m);
  toast('💡 Fargesonene og minutt-tallene er på. Riktig svar gir 5 XP nå.');
}

// ---------- lightning ----------

const lyn = {
  clock: null, score: 0, combo: 0, ends: 0, raf: 0, q: null, locked: false, running: false,
  prepare() {
    if (!this.clock) this.clock = new Clock(bind('lynClock'));
    this.stop();
    setText('lynBest', String(state.lightningBest));
    setText('lynScore', '0');
    setText('lynCombo', '');
    bind('lynStart').hidden = false;
    bind('lynBody').hidden = true;
    bind('lynEnd').hidden = true;
    bind('lynTimer').style.width = '100%';
  },
  start() {
    this.score = 0;
    this.combo = 0;
    this.running = true;
    this.ends = performance.now() + 60000;
    setText('lynScore', '0');
    bind('lynStart').hidden = true;
    bind('lynEnd').hidden = true;
    bind('lynBody').hidden = false;
    this.next();
    const loop = (now) => {
      if (!this.running) return;
      const left = Math.max(0, this.ends - now);
      const el = bind('lynTimer');
      el.style.width = `${(left / 60000) * 100}%`;
      el.classList.toggle('timer-fill--low', left < 10000);
      if (left <= 0) { this.finish(); return; }
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  },
  next() {
    this.q = makeLightningQuestion(unlockedIds(), state.zoneStats);
    this.locked = false;
    this.clock.set(this.q.h, this.q.m, true);
    setText('lynPrompt', this.q.prompt);
    const opts = bind('lynOptions');
    opts.classList.toggle('options--long', this.q.options.some((o) => o.label.length > 18));
    opts.innerHTML = this.q.options.map((o, i) => `<button class="option" type="button" data-lyn="${i}">${esc(capitalize(o.label))}</button>`).join('');
  },
  answer(i, btn) {
    if (this.locked || !this.running) return;
    this.locked = true;
    const correct = this.q.options[i].correct;
    recordAnswer(this.q.zone, correct);
    const buttons = bind('lynOptions').querySelectorAll('.option');
    buttons.forEach((b, j) => { if (this.q.options[j].correct) b.classList.add('option--right'); });
    if (correct) {
      this.score += 1;
      this.combo += 1;
      state.xp += 4 + Math.min(this.combo, 6);
      sound.correct(this.combo);
      vibrate(15);
      setTimeout(() => this.next(), 260);
    } else {
      this.combo = 0;
      this.ends -= 3000;
      btn.classList.add('option--wrong');
      sound.wrong();
      vibrate([40, 40, 60]);
      setTimeout(() => this.next(), 1100);
    }
    setText('lynScore', String(this.score));
    setText('lynCombo', this.combo >= 2 ? `🔥 ${this.combo}` : '');
  },
  finish() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    const record = this.score > state.lightningBest;
    if (record) state.lightningBest = this.score;
    markPlayedToday();
    save();
    const earned = checkBadges({ lyn: this.score });
    bind('lynBody').hidden = true;
    bind('lynEnd').hidden = false;
    setText('lynEndTitle', record && this.score > 0 ? 'Ny rekord! 🎉' : 'Tiden er ute!');
    setText('lynEndScore', `${this.score} riktige. Rekord: ${state.lightningBest}.`);
    bind('lynBadges').innerHTML = badgeList(earned);
    if (record && this.score > 0) { sound.fanfare(); confetti(); }
    const again = bind('lynEnd').querySelector('[data-action="lyn-go"]');
    again.focus({ preventScroll: true });
  },
  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  },
};

// ---------- practice ----------

const practice = {
  clock: null, pm: false,
  enter() {
    if (!this.clock) {
      this.clock = new Clock(bind('ovClock'), {
        interactive: true,
        helper: true,
        onTick: (m) => { if (m % 5 === 0) sound.tick(); },
        onChange: () => this.update(),
      });
      this.now();
    }
    this.update();
  },
  update() {
    const { h, m } = this.clock.get();
    const h24 = h + (this.pm ? 12 : 0);
    setText('ovWords', capitalize(phrase(h, m)));
    setText('ovDigital', digital(h, m, false));
    setText('ovDigital24', `${digital(h24, m, true)} ${partOfDay(h24)}`);
    bind('ovExplain').innerHTML = explain(h, m).slice(0, -1).map((l) => `<li>${esc(l)}</li>`).join('');
  },
  setOpt(name, on) {
    if (name === 'helper') this.clock.setOptions({ helper: on });
    if (name === 'zones') this.clock.setOptions({ zones: on });
    if (name === 'fine') this.clock.setOptions({ step: on ? 1 : 5 });
    if (name === 'pm') this.pm = on;
    this.update();
  },
  now() {
    const d = new Date();
    this.pm = d.getHours() >= 12;
    $('[data-opt="pm"]').checked = this.pm;
    this.clock.set(d.getHours(), d.getMinutes());
    this.update();
  },
  random() {
    const fine = $('[data-opt="fine"]').checked;
    const m = fine ? Math.floor(Math.random() * 60) : Math.floor(Math.random() * 12) * 5;
    this.clock.set(Math.floor(Math.random() * 12), m);
    this.update();
  },
};

// ---------- lessons ----------

const lesson = {
  i: 0, ex: 0, clock: null,
  render() {
    if (!this.clock) this.clock = new Clock(bind('lessonClock'));
    const L = LESSONS[this.i];
    setText('lessonCount', `${this.i + 1}/${LESSONS.length}`);
    setText('lessonTitle', L.title);
    bind('lessonText').innerHTML = L.text; // trusted, from content.js
    this.clock.setOptions({ helper: L.helper, zones: L.zones, step: L.step || 5 });
    this.ex = 0;
    this.showExample();
    $('[data-action="lesson-prev"]').disabled = this.i === 0;
    $('[data-action="lesson-next"]').textContent = this.i === LESSONS.length - 1 ? 'Til spillet →' : 'Neste →';
  },
  showExample() {
    const L = LESSONS[this.i];
    const e = L.examples[this.ex % L.examples.length];
    this.clock.set(e.h, e.m);
    const words = capitalize(phrase(e.h, e.m));
    setText('lessonExample', L.show24
      ? `${words} ${partOfDay(e.h)} = ${digital(e.h, e.m, true)}`
      : `${words} (${digital(e.h, e.m, false)})`);
  },
  go(d) {
    if (d > 0 && this.i === LESSONS.length - 1) { location.hash = '#/nivaer'; return; }
    this.i = Math.max(0, Math.min(LESSONS.length - 1, this.i + d));
    this.render();
    bind('lessonTitle').focus({ preventScroll: true });
  },
};

// ---------- badges & settings screens ----------

function renderBadges() {
  setText('badgeCount', `${state.badges.length}/${BADGES.length}`);
  bind('badges').innerHTML = BADGES.map((b) => {
    const got = state.badges.includes(b.id);
    return `<li class="badge ${got ? 'badge--got' : ''}">
      <span class="badge-icon" aria-hidden="true">${got ? b.icon : '❔'}</span>
      <b>${esc(b.title)}</b><small>${esc(b.desc)}</small>
      <span class="sr">${got ? 'Tatt' : 'Ikke tatt ennå'}</span></li>`;
  }).join('');
  const t = state.totals;
  const pct = t.answered ? Math.round((t.correct / t.answered) * 100) : 0;
  const zones = Object.entries(state.zoneStats)
    .filter(([, s]) => s.seen >= 5)
    .map(([z, s]) => [z, 1 - s.wrong / s.seen])
    .sort((a, b) => a[1] - b[1]);
  const weakest = zones.length && zones[0][1] < 0.8 ? zones[0][0] : null;
  const zoneNames = {
    hel: 'hele timer', halv: 'halv', kvart: 'kvart over og kvart på', over: 'minutter over',
    paHalv: 'på halv', overHalv: 'over halv', pa: 'minutter på',
  };
  bind('stats').innerHTML = `
    <h2>Statistikk</h2>
    <p>${t.correct} riktige av ${t.answered} svar (${pct} %).</p>
    <p>Lengste rekke: ${state.bestStreak}. Rekord i lynrunde: ${state.lightningBest}.</p>
    ${weakest ? `<p>Øv mer på: <b>${zoneNames[weakest]}</b>. Spillet gir deg flere av disse automatisk.</p>` : ''}`;
}

function renderSettings() {
  document.querySelectorAll('[data-setting]').forEach((input) => {
    input.checked = !!state.settings[input.dataset.setting];
  });
}

// ---------- install (PWA) ----------

let installEvent = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installEvent = e;
  document.querySelectorAll('[data-action="install"]').forEach((b) => { b.hidden = false; });
});
window.addEventListener('appinstalled', () => {
  installEvent = null;
  document.querySelectorAll('[data-action="install"]').forEach((b) => { b.hidden = true; });
});

// ---------- events ----------

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button, [data-opt]');
  if (!t) return;

  if (t.matches('.option[data-opt]')) {
    const i = Number(t.dataset.opt);
    onAnswer(game.q.options[i].correct, t);
    return;
  }
  if (t.matches('.option[data-lyn]')) {
    lyn.answer(Number(t.dataset.lyn), t);
    return;
  }

  switch (t.dataset.action) {
    case 'start-round':
      startRound(game.pendingLevel);
      location.hash = `#/spill/${game.pendingLevel.id}`;
      break;
    case 'check': {
      const ok = checkSet(game.q, setClock.dial);
      onAnswer(ok, null);
      break;
    }
    case 'next': nextQuestion(); break;
    case 'hint': useHint(); break;
    case 'again':
      startRound(game.level);
      location.hash = `#/spill/${game.level.id}`;
      break;
    case 'next-level': location.hash = `#/niva/${game.level.id + 1}`; break;
    case 'lyn-go': lyn.start(); break;
    case 'ov-now': practice.now(); break;
    case 'ov-random': practice.random(); break;
    case 'lesson-prev': lesson.go(-1); break;
    case 'lesson-next': lesson.go(1); break;
    case 'lesson-example': lesson.ex += 1; lesson.showExample(); break;
    case 'install':
      if (installEvent) { installEvent.prompt(); installEvent = null; }
      break;
    case 'reset':
      // eslint-disable-next-line no-alert
      if (window.confirm('Sikker? Alle stjerner, XP og merker blir slettet.')) {
        reset();
        toast('Fremgangen er nullstilt.');
      }
      break;
    default:
  }
});

document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.matches('[data-setting]')) {
    state.settings[t.dataset.setting] = t.checked;
    save();
  }
  if (t.matches('input[data-opt]')) practice.setOpt(t.dataset.opt, t.checked);
});

// Keyboard shortcuts 1-4 for answers.
document.addEventListener('keydown', (ev) => {
  if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
  const n = Number(ev.key);
  if (n >= 1 && n <= 4) {
    const box = current === 'game' ? bind('options') : current === 'lyn' ? bind('lynOptions') : null;
    const btn = box && !box.hidden ? box.querySelectorAll('.option')[n - 1] : null;
    if (btn && !btn.disabled) btn.click();
  }
});

// ---------- boot ----------

route();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
