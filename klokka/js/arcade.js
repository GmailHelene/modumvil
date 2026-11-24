// Arcade: seven short games built on the same clock.
import { Clock } from './clock.js';
import {
  phrase, capitalize, toDial, zoneOf,
} from './time-no.js';
import {
  arcadeQuestion, trueFalseQuestion, pickClockQuestion, memoryCards, orderSet, survivalQuestion,
  arcadeTime, checkSet,
} from './game.js';
import {
  state, save, recordAnswer, recordArcade, markPlayedToday, unlockedIds,
} from './store.js';
import { ARCADE, arcadeById } from './arcade-data.js';
import { sound, vibrate, confetti } from './fx.js';
import {
  bind, setText, esc, award, badgeList,
} from './ui.js';

const ROUND_MS = 60000;
const PENALTY_MS = 3000;

let def = null; // current game definition
let game = null; // current game controller
let running = false;
let raf = 0;
let timers = [];

const later = (fn, ms) => {
  const id = setTimeout(() => { if (running) fn(); }, ms);
  timers.push(id);
};

function formatScore(value) {
  if (!def) return '';
  if (def.unit === 'sek') return `${value.toFixed(1).replace('.', ',')} sek`;
  return `${value} ${def.unit}`;
}

function bestText() {
  const best = state.arcade[def.id]?.best;
  return best === null || best === undefined ? 'Ingen rekord ennå' : `Rekord: ${formatScore(best)}`;
}

// ---- menu ----

export function renderArcadeMenu() {
  bind('arcadeList').innerHTML = ARCADE.map((a) => {
    const best = state.arcade[a.id]?.best;
    const bestLabel = best === null || best === undefined ? 'Ikke spilt' : `Rekord: ${a.unit === 'sek' ? `${String(best).replace('.', ',')} sek` : `${best} ${a.unit}`}`;
    return `<li><a class="arcade-card" href="#/arkade/${a.id}">
      <span class="arcade-icon" aria-hidden="true">${a.icon}</span>
      <span class="arcade-info"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span>
      <span class="arcade-best">${esc(bestLabel)}</span></a></li>`;
  }).join('');
}

// ---- lifecycle ----

export function prepare(id) {
  stop();
  def = arcadeById(id);
  if (!def) return false;
  setText('arcTitle', `${def.icon} ${def.name}`);
  setText('arcScore', '');
  setText('arcDesc', def.desc);
  setText('arcRules', def.rules);
  setText('arcBest', bestText());
  bind('arcStart').hidden = false;
  bind('arcBody').hidden = true;
  bind('arcEnd').hidden = true;
  bind('arcTimerWrap').hidden = true;
  return true;
}

export function start() {
  stop();
  running = true;
  bind('arcStart').hidden = true;
  bind('arcEnd').hidden = true;
  const body = bind('arcBody');
  body.hidden = false;
  body.innerHTML = '';
  game = MODES[def.id]();
  game.start(body);
}

export function stop() {
  running = false;
  cancelAnimationFrame(raf);
  timers.forEach(clearTimeout);
  timers = [];
}

export function isRunning() {
  return running;
}

// ---- shared timer helpers ----

// Countdown: calls onEnd at 0. Returns an object whose `ends` can be moved for penalties.
function countdown(onEnd) {
  const t = { ends: performance.now() + ROUND_MS };
  const wrap = bind('arcTimerWrap');
  const fill = bind('arcTimer');
  wrap.hidden = false;
  const loop = (now) => {
    if (!running) return;
    const left = Math.max(0, t.ends - now);
    fill.style.width = `${(left / ROUND_MS) * 100}%`;
    fill.classList.toggle('timer-fill--low', left < 10000);
    if (left <= 0) { onEnd(); return; }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return t;
}

// Stopwatch: shows elapsed seconds in the score field.
function stopwatch() {
  const t = { start: performance.now(), extra: 0 };
  t.elapsed = () => (performance.now() - t.start) / 1000 + t.extra;
  const loop = () => {
    if (!running) return;
    setText('arcScore', `⏱ ${t.elapsed().toFixed(1).replace('.', ',')}`);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return t;
}

function scoreLabel(n) {
  setText('arcScore', `${def.icon} ${n}`);
}

function hit(combo) {
  sound.correct(combo);
  vibrate(15);
}

function miss() {
  sound.wrong();
  vibrate([40, 40, 60]);
}

function finish(score, extraXp = 0) {
  if (!running) return;
  stop();
  const lower = !!def.lowerIsBetter;
  const rounded = def.unit === 'sek' ? Math.round(score * 10) / 10 : score;
  const record = recordArcade(def.id, rounded, lower);
  const xp = Math.max(0, Math.round(extraXp));
  state.xp += xp;
  markPlayedToday();
  save();
  const earned = award();
  bind('arcBody').hidden = true;
  bind('arcTimerWrap').hidden = true;
  bind('arcEnd').hidden = false;
  const good = lower ? true : score > 0;
  setText('arcEndTitle', record && good ? 'Ny rekord! 🎉' : (lower ? 'Ferdig!' : 'Slutt!'));
  setText('arcEndScore', `${formatScore(rounded)}. ${bestText()}. +${xp} XP`);
  bind('arcBadges').innerHTML = badgeList(earned);
  if (record && good) { sound.fanfare(); confetti(); }
  bind('arcEnd').querySelector('[data-action="arc-go"]').focus({ preventScroll: true });
}

// ---- building blocks ----

function optionsHtml(options) {
  const long = options.some((o) => o.label.length > 18);
  return `<div class="options${long ? ' options--long' : ''}">${options.map((o, i) => `<button class="option" type="button" data-arc-opt="${i}">${esc(capitalize(o.label))}</button>`).join('')}</div>`;
}

function revealOptions(body, options, chosen, correct) {
  body.querySelectorAll('.option').forEach((b, j) => {
    b.disabled = true;
    if (options[j].correct) b.classList.add('option--right');
  });
  if (!correct && chosen) chosen.classList.add('option--wrong');
}

function miniClock(host, h, m) {
  const c = new Clock(host, { mini: true, numbers: 'arabic' });
  c.set(h, m, false);
  return c;
}

// ---- games ----

// Multiple-choice reader used by Lynrunde and Overlevelse.
function readerGame({ timed, lives, nextQuestion }) {
  let score = 0;
  let combo = 0;
  let left = lives;
  let q = null;
  let locked = false;
  let clock = null;
  let timer = null;
  let body = null;

  const updateScore = () => {
    if (lives) setText('arcScore', `${'❤️'.repeat(left)}${'🤍'.repeat(lives - left)} ${score}`);
    else scoreLabel(score);
  };

  const next = () => {
    q = nextQuestion(score);
    locked = false;
    clock.set(q.h, q.m, true);
    bind('arcPrompt').textContent = q.prompt;
    bind('arcOptions').innerHTML = optionsHtml(q.options);
  };

  return {
    start(b) {
      body = b;
      body.innerHTML = `<div class="game-body"><div class="clock-wrap"><div class="clock-box" data-bind="arcClock"></div></div>
        <div class="question"><h2 class="prompt" data-bind="arcPrompt"></h2><div data-bind="arcOptions"></div></div></div>`;
      clock = new Clock(bind('arcClock'));
      updateScore();
      if (timed) timer = countdown(() => finish(score, score * 6));
      next();
    },
    click(el) {
      const i = el.dataset.arcOpt;
      if (i === undefined || locked) return;
      locked = true;
      const correct = q.options[Number(i)].correct;
      recordAnswer(q, correct);
      revealOptions(body, q.options, el, correct);
      if (correct) {
        score += 1;
        combo += 1;
        state.bestStreak = Math.max(state.bestStreak, combo);
        hit(combo);
        updateScore();
        later(next, 280);
      } else {
        combo = 0;
        miss();
        if (timer) timer.ends -= PENALTY_MS;
        if (lives) {
          left -= 1;
          updateScore();
          if (left <= 0) { later(() => finish(score, score * 8), 1200); return; }
        }
        later(next, 1200);
      }
    },
  };
}

const MODES = {
  lyn: () => readerGame({
    timed: true,
    nextQuestion: () => arcadeQuestion(unlockedIds(), state.zoneStats),
  }),

  overlevelse: () => readerGame({
    lives: 3,
    nextQuestion: (score) => survivalQuestion(score, state.zoneStats),
  }),

  santusant: () => {
    let score = 0;
    let combo = 0;
    let q = null;
    let locked = false;
    let clock = null;
    let timer = null;
    const next = () => {
      q = trueFalseQuestion(unlockedIds());
      locked = false;
      clock.set(q.h, q.m, true);
      bind('tfStatement').textContent = q.statement;
      bind('tfStatement').className = 'tf-statement';
    };
    return {
      start(body) {
        body.innerHTML = `<div class="game-body"><div class="clock-wrap"><div class="clock-box" data-bind="arcClock"></div></div>
          <div class="question"><p class="prompt">Stemmer det?</p><p class="tf-statement" data-bind="tfStatement"></p>
          <div class="tf-buttons"><button class="btn tf-btn tf-btn--yes" type="button" data-tf="1">✔ Sant</button>
          <button class="btn tf-btn tf-btn--no" type="button" data-tf="0">✘ Usant</button></div></div></div>`;
        clock = new Clock(bind('arcClock'));
        scoreLabel(0);
        timer = countdown(() => finish(score, score * 4));
        next();
      },
      click(el) {
        if (el.dataset.tf === undefined || locked) return;
        locked = true;
        const correct = (el.dataset.tf === '1') === q.truth;
        recordAnswer({ zone: zoneOf(q.m), m: q.m, kind: 'read' }, correct);
        const st = bind('tfStatement');
        if (correct) {
          score += 1;
          combo += 1;
          hit(combo);
          st.classList.add('tf-statement--ok');
          scoreLabel(score);
          later(next, 300);
        } else {
          combo = 0;
          miss();
          timer.ends -= PENALTY_MS;
          st.classList.add('tf-statement--bad');
          st.textContent = `Klokka er ${q.answerText}`;
          later(next, 1300);
        }
      },
    };
  },

  finnklokka: () => {
    let score = 0;
    let combo = 0;
    let q = null;
    let locked = false;
    let timer = null;
    const next = () => {
      q = pickClockQuestion(unlockedIds());
      locked = false;
      bind('pcTarget').textContent = q.target;
      const grid = bind('pcGrid');
      grid.innerHTML = q.clocks.map((c, i) => `<button class="clock-pick" type="button" data-pick="${i}" aria-label="Klokke ${i + 1}"><span class="clock-pick-face"></span></button>`).join('');
      grid.querySelectorAll('.clock-pick-face').forEach((host, i) => miniClock(host, q.clocks[i].h, q.clocks[i].m));
    };
    return {
      start(body) {
        body.innerHTML = `<div class="question"><p class="prompt">Finn klokka som viser</p><p class="target" data-bind="pcTarget"></p>
          <div class="clock-grid" data-bind="pcGrid"></div></div>`;
        scoreLabel(0);
        timer = countdown(() => finish(score, score * 6));
        next();
      },
      click(el) {
        if (el.dataset.pick === undefined || locked) return;
        locked = true;
        const i = Number(el.dataset.pick);
        const correct = q.clocks[i].correct;
        recordAnswer({ zone: zoneOf(q.m), kind: 'read', m: q.m }, correct);
        bind('pcGrid').querySelectorAll('.clock-pick').forEach((b, j) => {
          if (q.clocks[j].correct) b.classList.add('clock-pick--right');
        });
        if (correct) {
          score += 1;
          combo += 1;
          hit(combo);
          scoreLabel(score);
          later(next, 350);
        } else {
          combo = 0;
          el.classList.add('clock-pick--wrong');
          miss();
          timer.ends -= PENALTY_MS;
          later(next, 1200);
        }
      },
    };
  },

  memory: () => {
    let cards = [];
    let open = [];
    let matched = 0;
    let moves = 0;
    let watch = null;
    let busy = false;
    return {
      start(body) {
        cards = memoryCards(unlockedIds(), 6);
        body.innerHTML = `<p class="prompt">Finn parene</p><p class="memory-moves" data-bind="memMoves">0 forsøk</p>
          <div class="memory-grid">${cards.map((c, i) => `<button class="mem-card" type="button" data-mem="${i}" aria-label="Kort ${i + 1}, skjult">
            <span class="mem-back" aria-hidden="true">?</span>
            <span class="mem-front">${c.type === 'text' ? `<span class="mem-text">${esc(c.label)}</span>` : '<span class="mem-clock"></span>'}</span></button>`).join('')}</div>`;
        body.querySelectorAll('.mem-card').forEach((btn, i) => {
          if (cards[i].type === 'clock') miniClock(btn.querySelector('.mem-clock'), cards[i].h, cards[i].m);
        });
        watch = stopwatch();
      },
      click(el) {
        if (el.dataset.mem === undefined || busy) return;
        const i = Number(el.dataset.mem);
        if (el.classList.contains('mem-card--open') || el.classList.contains('mem-card--done')) return;
        el.classList.add('mem-card--open');
        const c = cards[i];
        el.setAttribute('aria-label', c.type === 'text' ? c.label : `Klokke som viser ${phrase(c.h, c.m)}`);
        sound.tick();
        open.push({ i, el });
        if (open.length < 2) return;
        moves += 1;
        bind('memMoves').textContent = `${moves} forsøk`;
        const [a, b] = open;
        open = [];
        if (cards[a.i].pair === cards[b.i].pair && cards[a.i].type !== cards[b.i].type) {
          [a.el, b.el].forEach((x) => x.classList.add('mem-card--done'));
          matched += 1;
          hit(matched);
          if (matched === cards.length / 2) {
            const secs = watch.elapsed();
            later(() => finish(secs, Math.max(15, 120 - secs)), 500);
          }
        } else {
          busy = true;
          miss();
          setTimeout(() => {
            [a.el, b.el].forEach((x) => {
              x.classList.remove('mem-card--open');
              x.setAttribute('aria-label', 'Skjult kort');
            });
            busy = false;
          }, 900);
        }
      },
    };
  },

  stillraskt: () => {
    const TOTAL = 5;
    let done = 0;
    let target = null;
    let clock = null;
    let watch = null;
    const next = () => {
      const t = arcadeTime(unlockedIds());
      target = { h: t.h, m: t.m };
      clock.setOptions({ step: t.step });
      bind('srTarget').textContent = capitalize(phrase(t.h, t.m));
      bind('srCount').textContent = `${done + 1} av ${TOTAL}`;
      let start;
      do {
        start = { h: Math.floor(Math.random() * 12), m: 0 };
      } while (Math.abs(toDial(start.h, 0) - toDial(t.h, t.m)) < 60);
      clock.set(start.h, start.m, false);
    };
    return {
      start(body) {
        body.innerHTML = `<div class="game-body"><div class="clock-wrap"><div class="clock-box" data-bind="srClock"></div></div>
          <div class="question"><p class="prompt">Still klokka til <span class="muted" data-bind="srCount"></span></p>
          <p class="target" data-bind="srTarget"></p>
          <button class="btn btn--big" type="button" data-sr="check">Sjekk</button></div></div>`;
        clock = new Clock(bind('srClock'), { interactive: true, onTick: (m) => { if (m % 5 === 0) sound.tick(); } });
        watch = stopwatch();
        next();
      },
      click(el) {
        if (el.dataset.sr !== 'check') return;
        const ok = checkSet(target, clock.dial);
        recordAnswer({ zone: zoneOf(target.m), m: target.m, kind: 'set' }, ok);
        if (ok) {
          done += 1;
          hit(done);
          if (done === TOTAL) {
            const secs = watch.elapsed();
            finish(secs, Math.max(15, 100 - secs));
            return;
          }
          next();
        } else {
          watch.extra += 5;
          miss();
          const box = bind('srClock');
          box.classList.remove('shake');
          void box.offsetWidth;
          box.classList.add('shake');
        }
      },
    };
  },

  tidslinja: () => {
    let score = 0;
    let set = [];
    let order = [];
    let step = 0;
    let timer = null;
    let locked = false;
    const next = () => {
      set = orderSet(unlockedIds(), 4);
      order = set.map((t, i) => ({ i, total: t.total })).sort((a, b) => a.total - b.total).map((x) => x.i);
      step = 0;
      locked = false;
      const grid = bind('tlGrid');
      grid.innerHTML = set.map((t, i) => `<button class="clock-pick" type="button" data-tl="${i}" aria-label="Klokke ${i + 1}"><span class="clock-pick-face"></span><span class="tl-mark" aria-hidden="true"></span></button>`).join('');
      grid.querySelectorAll('.clock-pick-face').forEach((host, i) => miniClock(host, set[i].h, set[i].m));
    };
    const resetMarks = () => {
      step = 0;
      bind('tlGrid').querySelectorAll('.clock-pick').forEach((b) => {
        b.classList.remove('clock-pick--right');
        b.querySelector('.tl-mark').textContent = '';
      });
    };
    return {
      start(body) {
        body.innerHTML = `<div class="question"><p class="prompt">Trykk tidligst først</p>
          <p class="muted tl-hint">Alle klokkene er innenfor de samme tre timene.</p>
          <div class="clock-grid" data-bind="tlGrid"></div></div>`;
        scoreLabel(0);
        timer = countdown(() => finish(score, score * 12));
        next();
      },
      click(el) {
        if (el.dataset.tl === undefined || locked) return;
        const i = Number(el.dataset.tl);
        if (el.classList.contains('clock-pick--right')) return;
        if (order[step] === i) {
          el.classList.add('clock-pick--right');
          el.querySelector('.tl-mark').textContent = String(step + 1);
          step += 1;
          sound.tick();
          if (step === order.length) {
            score += 1;
            locked = true;
            hit(score);
            scoreLabel(score);
            later(next, 500);
          }
        } else {
          miss();
          timer.ends -= PENALTY_MS;
          el.classList.add('clock-pick--wrong');
          later(() => { el.classList.remove('clock-pick--wrong'); resetMarks(); }, 450);
        }
      },
    };
  },
};

export function handleClick(el) {
  if (game && running && game.click) game.click(el);
}

// Keyboard 1-4 picks options / clocks in the arcade.
export function handleKey(n) {
  if (!running) return;
  const body = bind('arcBody');
  const btn = body.querySelectorAll('.option, .clock-pick, .tf-btn')[n - 1];
  if (btn && !btn.disabled) btn.click();
}

