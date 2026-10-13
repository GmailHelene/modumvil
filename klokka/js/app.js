import { Clock } from './clock.js';
import {
  phrase, digital, explain, partOfDay, capitalize, mod,
} from './time-no.js';
import {
  WORLDS, LEVELS, levelById, nextLevel, starsFor, starLimits, UNLOCK_STARS,
} from './levels.js';
import {
  makeRound, repeatOf, checkSet, questionKey, makeDailyRound, MAX_REPEATS,
} from './game.js';
import {
  state, save, reset, rankFor, recordAnswer, markPlayedToday, totalStars, worldStars,
  isUnlocked, unlockedIds, rememberQuestions, todayKey, progress,
} from './store.js';
import {
  BADGES, CATEGORIES, badgeProgress, checkBadges,
} from './badges.js';
import { THEMES, FACES, themeById } from './themes.js';
import { sound, vibrate, confetti } from './fx.js';
import { LESSONS } from './content.js';
import * as arcade from './arcade.js';
import {
  $, bind, setText, esc, toast, award, badgeList, starsHtml,
} from './ui.js';

const MAX_STARS = LEVELS.length * 3;

// ---------- look ----------

function applyStyle() {
  const theme = themeById(state.style.theme);
  document.documentElement.dataset.theme = theme.id;
  document.documentElement.dataset.face = state.style.face;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme.color);
}
applyStyle();

// ---------- screens / routing ----------

const screens = {};
document.querySelectorAll('[data-screen]').forEach((s) => { screens[s.dataset.screen] = s; });
let current = null;

function show(name) {
  if (current !== name && current === 'arcadeplay') arcade.stop();
  if (current !== name && current === 'game') stopQuestionTimer();
  if (current === name) return;
  Object.entries(screens).forEach(([k, s]) => { s.hidden = k !== name; });
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
    case 'nivaer': renderWorlds(); show('levels'); break;
    case 'niva': {
      const level = levelById(arg);
      if (!level || !isUnlocked(level)) { location.hash = '#/nivaer'; return; }
      renderIntro(level);
      show('intro');
      break;
    }
    case 'dagens': renderDailyIntro(); show('intro'); break;
    case 'spill': {
      if (arg === 'daily') {
        if (!game.level || game.level.id !== 'daily' || game.done) startDaily();
        show('game');
        break;
      }
      const level = levelById(arg);
      if (!level || !isUnlocked(level)) { location.hash = '#/nivaer'; return; }
      // Re-entering via back/forward starts a fresh round.
      if (!game.level || game.level.id !== level.id || game.done) startRound(level);
      show('game');
      break;
    }
    case 'resultat': if (!game.done) { location.hash = '#/nivaer'; return; } show('result'); break;
    case 'arkade':
      if (arg) {
        if (!arcade.prepare(arg)) { location.hash = '#/arkade'; return; }
        show('arcadeplay');
      } else {
        arcade.renderArcadeMenu();
        show('arcade');
      }
      break;
    case 'lyn': location.replace('#/arkade/lyn'); break; // old link
    case 'ov': practice.enter(); show('ov'); break;
    case 'laer': lesson.render(); show('laer'); break;
    case 'merker': renderBadges(); show('merker'); break;
    case 'stil': renderStyle(); show('stil'); break;
    case 'innstillinger': renderSettings(); show('innstillinger'); break;
    default: renderHome(); show('home');
  }
}

window.addEventListener('hashchange', route);

// ---------- home ----------

function renderHome() {
  const rank = rankFor(state.xp);
  setText('rank', rank.title);
  setText('stars', `${totalStars()}/${MAX_STARS}`);
  setText('days', String(state.days.count));
  setText('badgeChip', `${state.badges.length}/${BADGES.length}`);
  const pct = Math.round(rank.progress * 100);
  const bar = bind('xpbar');
  bar.setAttribute('aria-valuenow', String(pct));
  bar.querySelector('.xpbar-fill').style.width = `${pct}%`;
  setText('xptext', rank.next
    ? `${state.xp} XP. ${rank.next.xp - state.xp} til ${rank.next.title}.`
    : `${state.xp} XP. Du har nådd toppen!`);
  const done = state.daily[todayKey()];
  setText('dailyStatus', done ? `Klar i dag: ${done.score}/10 ✓` : 'Ny i dag! +50 XP');
  bind('dailyCard').classList.toggle('daily--done', !!done);
  const next = LEVELS.find((l) => isUnlocked(l) && !(state.stars[l.id] >= 2)) || LEVELS[LEVELS.length - 1];
  setText('continueText', `Fortsett: ${next.id} ${next.title}`);
  bind('continueLink').setAttribute('href', `#/niva/${next.id}`);
}

// ---------- worlds ----------

function renderWorlds() {
  setText('stars', `${totalStars()}/${MAX_STARS}`);
  bind('worlds').innerHTML = WORLDS.map((w) => {
    const first = w.levels[0];
    const open = isUnlocked(first);
    const tiles = w.levels.map((l) => {
      const lvOpen = isUnlocked(l);
      const s = state.stars[l.id] || 0;
      const tags = [l.boss ? '👑' : '', l.timer ? '⏱' : '', l.numbers === 'roman' ? 'XII' : '', l.numbers === 'none' ? '∅' : '', l.numbers === 'quarters' ? '◷' : '']
        .filter(Boolean).join(' ');
      const label = `Nivå ${l.id}: ${l.title}. ${lvOpen ? `${s} av 3 stjerner` : 'Låst'}`;
      const inner = `<span class="tile-num">${lvOpen ? l.n : '🔒'}</span>
        <span class="tile-title">${esc(l.title)}</span>
        <span class="tile-tags" aria-hidden="true">${tags}</span>
        <span class="tile-stars" aria-hidden="true">${starsHtml(s)}</span>`;
      return lvOpen
        ? `<li><a class="tile${l.boss ? ' tile--boss' : ''}" href="#/niva/${l.id}" aria-label="${esc(label)}">${inner}</a></li>`
        : `<li><span class="tile tile--locked${l.boss ? ' tile--boss' : ''}" aria-label="${esc(label)}">${inner}</span></li>`;
    }).join('');
    return `<section class="world world--${w.id}${open ? '' : ' world--locked'}" aria-label="${esc(w.name)}">
      <header class="world-head">
        <span class="world-icon" aria-hidden="true">${open ? w.icon : '🔒'}</span>
        <div><h2>Verden ${w.id}: ${esc(w.name)}</h2><p>${open ? esc(w.intro) : 'Slå bossen i forrige verden for å komme inn.'}</p></div>
        <span class="chip">⭐ ${worldStars(w.id)}/18</span>
      </header>
      <ol class="tiles">${tiles}</ol></section>`;
  }).join('');
}

let introClock = null;
let introTimer = null;
function showIntro(level, { title, sub, text, demo }) {
  setText('introTitle', title);
  setText('introSub', sub);
  setText('introText', text);
  const facts = [`${level.length} oppgaver`];
  if (level.timer) facts.push(`${level.timer} sek per oppgave`);
  if (level.numbers === 'roman') facts.push('romertall');
  if (level.numbers === 'none') facts.push('ingen tall');
  if (level.numbers === 'quarters') facts.push('bare 12, 3, 6 og 9');
  if (level.id !== 'daily') facts.push(`${starLimits(level.length)[1]} riktige låser opp neste`);
  setText('introHint', facts.join(' · '));
  if (!introClock) introClock = new Clock(bind('introClock'));
  introClock.setOptions({ helper: false, zones: false, numbers: level.numbers || 'arabic' });
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

function renderIntro(level) {
  const world = WORLDS.find((w) => w.id === level.world);
  showIntro(level, {
    title: `${level.boss ? '👑 ' : ''}${level.title}`,
    sub: `${world.icon} ${world.name} · nivå ${level.n}`,
    text: level.intro,
    demo: makeRound(level).slice(0, 4),
  });
}

function renderDailyIntro() {
  const { level, round } = makeDailyRound(todayKey(), unlockedIds());
  const done = state.daily[todayKey()];
  showIntro(level, {
    title: '☀️ Dagens utfordring',
    sub: new Date().toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' }),
    text: done
      ? `Du har allerede klart dagens: ${done.score} av 10. Du kan spille igjen for moro skyld, men bonusen får du bare én gang.`
      : level.intro,
    demo: round.slice(0, 4),
  });
}

// ---------- game round ----------

const game = {
  level: null, queue: [], index: 0, firstTry: 0, scored: 0, repeats: 0, hints: 0,
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

function beginRound(level, queue) {
  ensureGameClocks();
  stopQuestionTimer();
  Object.assign(game, {
    level, queue, index: 0, firstTry: 0, scored: 0, repeats: 0, hints: 0,
    combo: 0, bestCombo: 0, xp: 0, earned: [], answered: false, done: false, q: null,
  });
  setClock.setOptions({ step: level.step });
  // Remember these at once, so even an abandoned round is not served again right away.
  if (level.id !== 'daily') rememberQuestions(queue.map(questionKey));
  save();
  showQuestion();
}

function startRound(level) {
  beginRound(level, makeRound(level, state.zoneStats, state.recent));
}

function startDaily() {
  const { level, round } = makeDailyRound(todayKey(), unlockedIds());
  beginRound(level, round);
}

function renderDots() {
  const len = game.level.length;
  const dots = [];
  for (let i = 0; i < len; i += 1) {
    const r = game.results ? game.results[i] : undefined;
    dots.push(`<span class="dot ${r === true ? 'dot--ok' : r === false ? 'dot--bad' : ''} ${i === game.scored && !game.q?.repeat ? 'dot--now' : ''}"></span>`);
  }
  bind('dots').innerHTML = dots.join('') + (game.q?.repeat ? '<span class="repeat-tag">Ekstra øving</span>' : '');
  setText('progressText', game.q?.repeat
    ? 'Ekstra øving på en du bommet på.'
    : `Oppgave ${game.scored + 1} av ${len}.`);
}

// ---- per-question timer (boss levels) ----

let qTimerRaf = 0;
function stopQuestionTimer() {
  cancelAnimationFrame(qTimerRaf);
}

function startQuestionTimer(seconds) {
  stopQuestionTimer();
  const wrap = bind('qTimerWrap');
  const fill = bind('qTimer');
  wrap.hidden = false;
  const ends = performance.now() + seconds * 1000;
  const loop = (now) => {
    if (game.answered) return;
    const left = Math.max(0, ends - now);
    fill.style.width = `${(left / (seconds * 1000)) * 100}%`;
    fill.classList.toggle('timer-fill--low', left < 5000);
    if (left <= 0) { onAnswer(false, null, true); return; }
    qTimerRaf = requestAnimationFrame(loop);
  };
  qTimerRaf = requestAnimationFrame(loop);
}

function showQuestion() {
  const q = game.queue[game.index];
  const level = game.level;
  game.q = q;
  game.answered = false;
  if (game.index === 0) game.results = [];
  bind('feedback').hidden = true;
  bind('liveReadout').hidden = true;
  setText('combo', game.combo >= 2 ? `🔥 ${game.combo}` : '');
  renderDots();

  const easyHelp = level.world === 1 && level.n <= 3;
  displayClock.setOptions({ helper: false, zones: false, numbers: level.numbers });
  setClock.setOptions({ helper: easyHelp, zones: false, numbers: level.numbers });
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
      start = Math.floor(Math.random() * 12) * 60 + (level.step === 1 ? Math.floor(Math.random() * 60) : 0);
    } while (Math.abs(start - (mod(q.h, 12) * 60 + q.m)) < 60);
    setClock.set(Math.floor(start / 60), start % 60, false);
    target.hidden = false;
    target.textContent = q.target;
    opts.hidden = true;
    opts.innerHTML = '';
    bind('checkBtn').hidden = false;
  }
  if (level.timer && !q.repeat) startQuestionTimer(level.timer);
  else bind('qTimerWrap').hidden = true;
  bind('prompt').focus({ preventScroll: true });
}

function onAnswer(correct, chosenBtn, timedOut = false) {
  if (game.answered) return;
  game.answered = true;
  stopQuestionTimer();
  const q = game.q;
  $('[data-action="hint"]').disabled = true;
  recordAnswer(q, correct);

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
    gained = q.repeat ? 3 : (q.hinted ? 5 : 10 + Math.min(game.combo, 5) * 2 + (game.level.boss ? 5 : 0));
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
  game.earned.push(...award());

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
    const praise = ['Riktig!', 'Helt rett!', 'Sånn ja!', 'Knallbra!', 'Perfekt!', 'Rått!', 'Bang!', 'Du kan dette!'];
    bind('fbTitle').textContent = `${praise[Math.floor(Math.random() * praise.length)]} +${gained} XP`;
    bind('fbExplain').innerHTML = `<li>${esc(capitalize(q.answerText))}</li>`;
  } else {
    let title = 'Ikke helt. Slik tenker du:';
    if (timedOut) title = '⏱ Tiden gikk ut! Slik tenker du:';
    else if (q.kind === 'set') title = `Ikke helt. Du stilte ${phrase(setClock.get().h, setClock.get().m)}.`;
    bind('fbTitle').textContent = title;
    bind('fbExplain').innerHTML = q.explain.map((l) => `<li>${esc(l)}</li>`).join('');
    if (q.kind === 'set') {
      setClock.setOptions({ helper: true });
      setTimeout(() => setClock.set(q.h, q.m), 450);
    } else if (timedOut) {
      bind('options').querySelectorAll('.option').forEach((b) => { b.disabled = true; });
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
  stopQuestionTimer();
  const level = game.level;
  const len = level.length;
  const stars = starsFor(game.firstTry, len);
  const perfect = game.firstTry === len;
  state.totals.rounds += 1;
  if (perfect) state.totals.perfect += 1;
  if (perfect && game.hints === 0) state.totals.perfectNoHint += 1;

  let bonus = stars * 10;
  let resultTitle = ['Øv litt til!', 'Bra jobba!', 'Kjempebra!', 'Klokkemester!'][stars];
  if (level.id === 'daily') {
    const key = todayKey();
    if (!state.daily[key]) {
      bonus += 50;
      state.totals.dailyDone += 1;
      state.daily[key] = { score: game.firstTry };
    } else if (game.firstTry > state.daily[key].score) {
      state.daily[key].score = game.firstTry;
    }
    resultTitle = 'Dagens utfordring klart!';
  } else {
    const prev = state.stars[level.id] || 0;
    if (stars > prev) state.stars[level.id] = stars;
    if (level.numbers === 'roman' && stars >= 2) state.flags.roman = true;
    if (level.numbers === 'none' && stars === 3) state.flags.blind = true;
    if (level.boss && stars >= 1 && prev === 0) resultTitle = `${level.title.replace('BOSS: ', '')} er beseiret! 👑`;
  }
  game.xp += bonus;
  state.xp += bonus;
  markPlayedToday();
  save();
  game.earned.push(...award());

  setText('resultTitle', resultTitle);
  bind('resultStars').innerHTML = (level.id === 'daily' ? '' : starsHtml(stars))
    + `<span class="sr">${stars} av 3 stjerner</span>`;
  setText('resultScore', `${game.firstTry} av ${len} riktige på første forsøk`);
  setText('resultXp', `+${game.xp} XP${game.bestCombo >= 3 ? `  ·  Lengste rekke: ${game.bestCombo}` : ''}`);
  bind('resultBadges').innerHTML = badgeList(game.earned);

  const next = level.id === 'daily' ? null : nextLevel(level);
  const nextBtn = bind('nextLevelBtn');
  nextBtn.hidden = !next || !isUnlocked(next);
  if (next && next.world !== level.world) nextBtn.textContent = `Ny verden: ${WORLDS.find((w) => w.id === next.world).name} →`;
  else nextBtn.textContent = 'Neste nivå →';
  const needText = bind('resultNeed');
  needText.hidden = level.id === 'daily' || !next || isUnlocked(next);
  if (!needText.hidden) {
    const need = next.world !== level.world ? 1 : UNLOCK_STARS;
    needText.textContent = `Du trenger ${need} ${need === 1 ? 'stjerne' : 'stjerner'} for å låse opp neste nivå. Prøv igjen, du får nye oppgaver!`;
  }
  if (stars >= 2) { sound.fanfare(); confetti(); }
  location.hash = '#/resultat';
}

function useHint() {
  const q = game.q;
  if (!q || game.answered) return;
  q.hinted = true;
  game.hints += 1;
  const clock = q.kind === 'read' ? displayClock : setClock;
  clock.setOptions({ helper: true, zones: true });
  $('[data-action="hint"]').disabled = true;
  if (q.kind === 'set') updateLiveReadout(setClock.get().h, setClock.get().m);
  toast('💡 Fargesonene og minutt-tallene er på. Riktig svar gir 5 XP nå.');
}

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
  setOpt(name, value) {
    if (name === 'helper') this.clock.setOptions({ helper: value });
    if (name === 'zones') this.clock.setOptions({ zones: value });
    if (name === 'fine') this.clock.setOptions({ step: value ? 1 : 5 });
    if (name === 'pm') this.pm = value;
    if (name === 'numbers') this.clock.setOptions({ numbers: value });
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
    this.clock.setOptions({
      helper: L.helper, zones: L.zones, step: L.step || 5, numbers: L.numbers || 'arabic',
    });
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

// ---------- badges ----------

function renderBadges() {
  setText('badgeCount', `${state.badges.length}/${BADGES.length}`);
  bind('badges').innerHTML = CATEGORIES.map((cat) => {
    const list = BADGES.filter((b) => b.cat === cat);
    const got = list.filter((b) => state.badges.includes(b.id)).length;
    return `<section class="badge-cat"><h2>${esc(cat)} <span class="muted">${got}/${list.length}</span></h2>
      <ul class="badges">${list.map((b) => {
    const p = badgeProgress(b);
    const pct = Math.round((p.value / p.goal) * 100);
    return `<li class="badge ${p.done ? 'badge--got' : ''}">
          <span class="badge-icon" aria-hidden="true">${p.done ? b.icon : '❔'}</span>
          <b>${esc(b.title)}</b><small>${esc(b.desc)}</small>
          ${p.done ? '<span class="sr">Tatt</span>' : `<span class="badge-bar" role="progressbar" aria-label="Fremgang" aria-valuemin="0" aria-valuemax="${p.goal}" aria-valuenow="${p.value}"><span style="width:${pct}%"></span></span>
          <small class="badge-num">${p.value}/${p.goal}</small>`}
        </li>`;
  }).join('')}</ul></section>`;
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
    <p>${t.correct} riktige av ${t.answered} svar (${pct} %). ${t.rounds} runder og ${t.arcadePlays} arkadespill.</p>
    <p>Lengste rekke: ${state.bestStreak}. Flest dager på rad: ${state.days.best}.</p>
    ${weakest ? `<p>Øv mer på: <b>${zoneNames[weakest]}</b>. Spillet gir deg flere av disse automatisk.</p>` : ''}`;
}

// ---------- style ----------

function renderStyle() {
  const tile = (kind, item) => {
    const open = item.need(state, progress);
    const selected = (kind === 'theme' ? state.style.theme : state.style.face) === item.id;
    const preview = kind === 'theme'
      ? `<span class="swatch swatch--${item.id}" aria-hidden="true">${item.icon}</span>`
      : `<span class="face-preview" data-face-preview="${item.id}" aria-hidden="true"></span>`;
    return `<li><button class="style-tile${selected ? ' style-tile--on' : ''}" type="button"
      data-style="${kind}" data-id="${item.id}" ${open ? '' : 'disabled'} aria-pressed="${selected}">
      ${preview}<b>${esc(item.name)}</b><small>${open ? (selected ? 'Valgt' : 'Trykk for å velge') : `🔒 ${esc(item.req)}`}</small></button></li>`;
  };
  bind('themeList').innerHTML = THEMES.map((t) => tile('theme', t)).join('');
  bind('faceList').innerHTML = FACES.map((f) => tile('face', f)).join('');
  document.querySelectorAll('[data-face-preview]').forEach((host) => {
    const c = new Clock(host, { mini: true });
    c.set(10, 10, false);
  });
  const openThemes = THEMES.filter((t) => t.need(state, progress)).length;
  const openFaces = FACES.filter((f) => f.need(state, progress)).length;
  setText('styleCount', `${openThemes + openFaces}/${THEMES.length + FACES.length}`);
}

function chooseStyle(kind, id) {
  const list = kind === 'theme' ? THEMES : FACES;
  const item = list.find((x) => x.id === id);
  if (!item || !item.need(state, progress)) return;
  if (kind === 'theme') state.style.theme = id;
  else state.style.face = id;
  state.flags.styled = true;
  save();
  applyStyle();
  award();
  renderStyle();
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

  if (current === 'arcadeplay' && t.closest('[data-bind="arcBody"]')) {
    arcade.handleClick(t);
    return;
  }
  if (t.matches('.option[data-opt]')) {
    onAnswer(game.q.options[Number(t.dataset.opt)].correct, t);
    return;
  }
  if (t.dataset.style) {
    chooseStyle(t.dataset.style, t.dataset.id);
    return;
  }

  switch (t.dataset.action) {
    case 'start-round': {
      const level = game.pendingLevel;
      if (level.id === 'daily') {
        startDaily();
        location.hash = '#/spill/daily';
      } else {
        startRound(level);
        location.hash = `#/spill/${level.id}`;
      }
      break;
    }
    case 'check': onAnswer(checkSet(game.q, setClock.dial), null); break;
    case 'next': nextQuestion(); break;
    case 'hint': useHint(); break;
    case 'again':
      if (game.level.id === 'daily') startDaily();
      else startRound(game.level);
      location.hash = `#/spill/${game.level.id}`;
      break;
    case 'next-level': {
      const next = nextLevel(game.level);
      if (next) location.hash = `#/niva/${next.id}`;
      break;
    }
    case 'arc-go': arcade.start(); break;
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
      if (window.confirm('Sikker? Alle stjerner, XP, merker og opplåste stiler blir slettet.')) {
        reset();
        applyStyle();
        toast('Fremgangen er nullstilt. Du får nye oppgaver når du starter på nytt.');
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
  if (t.matches('input[type="checkbox"][data-opt]')) practice.setOpt(t.dataset.opt, t.checked);
  if (t.matches('select[data-opt]')) practice.setOpt(t.dataset.opt, t.value);
});

// Keyboard shortcuts 1-4 for answers.
document.addEventListener('keydown', (ev) => {
  if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
  const n = Number(ev.key);
  if (!(n >= 1 && n <= 4)) return;
  if (current === 'arcadeplay') {
    arcade.handleKey(n);
    return;
  }
  if (current === 'game') {
    const box = bind('options');
    const btn = !box.hidden ? box.querySelectorAll('.option')[n - 1] : null;
    if (btn && !btn.disabled) btn.click();
  }
});

// ---------- boot ----------

// Badges reached in an older version (or by a migrated save) are handed out quietly at start.
if (checkBadges().length) save();
route();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
