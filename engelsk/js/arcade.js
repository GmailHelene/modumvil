// Arcade: three short games on the same words.
import { quickQuestion, trueFalse, memoryCards } from './engine.js';
import {
  state, save, recordAnswer, recordArcade, markPlayedToday, openSets,
} from './store.js';
import { ARCADE, arcadeById } from './arcade-data.js';
import { sound, vibrate, confetti } from './fx.js';
import {
  bind, setText, esc, award, badgeList,
} from './ui.js';

const ROUND_MS = 60000;
const PENALTY_MS = 3000;

let def = null;
let game = null;
let running = false;
let raf = 0;
let timers = [];

const later = (fn, ms) => {
  const id = setTimeout(() => { if (running) fn(); }, ms);
  timers.push(id);
};

const formatScore = (v) => (def.unit === 'sek' ? `${v.toFixed(1).replace('.', ',')} sek` : `${v} ${def.unit}`);

function bestText() {
  const best = state.arcade[def.id]?.best;
  return best === null || best === undefined ? 'Ingen rekord ennå' : `Rekord: ${formatScore(best)}`;
}

export function renderArcadeMenu() {
  bind('arcadeList').innerHTML = ARCADE.map((a) => {
    const best = state.arcade[a.id]?.best;
    const label = best === null || best === undefined ? 'Ikke spilt' : `Rekord: ${a.unit === 'sek' ? `${String(best).replace('.', ',')} sek` : `${best} ${a.unit}`}`;
    return `<li><a class="arcade-card" href="#/arkade/${a.id}">
      <span class="arcade-icon" aria-hidden="true">${a.icon}</span>
      <span class="arcade-info"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span>
      <span class="arcade-best">${esc(label)}</span></a></li>`;
  }).join('');
}

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

function countdown(onEnd) {
  const t = { ends: performance.now() + ROUND_MS };
  const fill = bind('arcTimer');
  bind('arcTimerWrap').hidden = false;
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

function stopwatch() {
  const t = { start: performance.now() };
  t.elapsed = () => (performance.now() - t.start) / 1000;
  const loop = () => {
    if (!running) return;
    setText('arcScore', `⏱ ${t.elapsed().toFixed(1).replace('.', ',')}`);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return t;
}

const scoreLabel = (n) => setText('arcScore', `${def.icon} ${n}`);
const hit = (combo) => { sound.correct(combo); vibrate(15); };
const miss = () => { sound.wrong(); vibrate([40, 40, 60]); };

function finish(score, extraXp) {
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
  const good = lower || score > 0;
  setText('arcEndTitle', record && good ? 'Ny rekord! 🎉' : 'Ferdig!');
  setText('arcEndScore', `${formatScore(rounded)}. ${bestText()}. +${xp} XP`);
  bind('arcBadges').innerHTML = badgeList(earned);
  if (record && good) { sound.fanfare(); confetti(); }
  bind('arcEnd').querySelector('[data-action="arc-go"]').focus({ preventScroll: true });
}

const MODES = {
  lyn: () => {
    let score = 0;
    let combo = 0;
    let q = null;
    let locked = false;
    let timer = null;
    const next = () => {
      q = quickQuestion(openSets());
      locked = false;
      bind('arcQ').innerHTML = `<p class="prompt">${esc(q.prompt)}</p>
        ${q.big ? `<p class="big-word">${esc(q.big)}</p>` : ''}
        ${q.sentence ? `<p class="sentence">${esc(q.sentence).replace('___', '<span class="gap">___</span>')}</p>` : ''}
        ${q.note ? `<p class="note">${esc(q.note)}</p>` : ''}
        <div class="options">${q.options.map((o, i) => `<button class="option" type="button" data-arc-opt="${i}">${esc(o.label)}</button>`).join('')}</div>`;
    };
    return {
      start(body) {
        body.innerHTML = '<div class="question" data-bind="arcQ"></div>';
        scoreLabel(0);
        timer = countdown(() => finish(score, score * 6));
        next();
      },
      click(el) {
        if (el.dataset.arcOpt === undefined || locked) return;
        locked = true;
        const correct = q.options[Number(el.dataset.arcOpt)].correct;
        recordAnswer(q, correct);
        bind('arcQ').querySelectorAll('.option').forEach((b, j) => {
          b.disabled = true;
          if (q.options[j].correct) b.classList.add('option--right');
        });
        if (correct) {
          score += 1;
          combo += 1;
          state.bestStreak = Math.max(state.bestStreak, combo);
          hit(combo);
          scoreLabel(score);
          later(next, 300);
        } else {
          combo = 0;
          el.classList.add('option--wrong');
          miss();
          timer.ends -= PENALTY_MS;
          later(next, 1300);
        }
      },
    };
  },

  santusant: () => {
    let score = 0;
    let combo = 0;
    let q = null;
    let locked = false;
    let timer = null;
    const next = () => {
      q = trueFalse(openSets());
      locked = false;
      const st = bind('tfStatement');
      st.className = 'tf-statement';
      st.textContent = q.sentence;
      setText('tfNote', `(${q.note})`);
    };
    return {
      start(body) {
        body.innerHTML = `<div class="question"><p class="prompt">Er setningen riktig engelsk?</p>
          <p class="tf-statement" data-bind="tfStatement"></p><p class="note" data-bind="tfNote"></p>
          <div class="tf-buttons"><button class="btn tf-btn tf-btn--yes" type="button" data-tf="1">✔ Right</button>
          <button class="btn tf-btn tf-btn--no" type="button" data-tf="0">✘ Wrong</button></div></div>`;
        scoreLabel(0);
        timer = countdown(() => finish(score, score * 4));
        next();
      },
      click(el) {
        if (el.dataset.tf === undefined || locked) return;
        locked = true;
        const correct = (el.dataset.tf === '1') === q.truth;
        recordAnswer({ item: q.item, mode: 'mc' }, correct);
        const st = bind('tfStatement');
        if (correct) {
          score += 1;
          combo += 1;
          hit(combo);
          st.classList.add('tf-statement--ok');
          scoreLabel(score);
          later(next, 350);
        } else {
          combo = 0;
          miss();
          timer.ends -= PENALTY_MS;
          st.classList.add('tf-statement--bad');
          st.textContent = `Riktig: ${q.correct}`;
          later(next, 1800);
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
        cards = memoryCards(openSets(), 6);
        body.innerHTML = `<p class="prompt">Finn parene: engelsk og norsk</p><p class="memory-moves" data-bind="memMoves">0 forsøk</p>
          <div class="memory-grid">${cards.map((c, i) => `<button class="mem-card" type="button" data-mem="${i}" aria-label="Kort ${i + 1}, skjult">
            <span class="mem-back" aria-hidden="true">?</span>
            <span class="mem-front mem-front--${c.lang}"><span class="mem-text">${esc(c.label)}</span></span></button>`).join('')}</div>`;
        watch = stopwatch();
      },
      click(el) {
        if (el.dataset.mem === undefined || busy) return;
        if (el.classList.contains('mem-card--open') || el.classList.contains('mem-card--done')) return;
        const i = Number(el.dataset.mem);
        el.classList.add('mem-card--open');
        el.setAttribute('aria-label', cards[i].label);
        sound.tick();
        open.push({ i, el });
        if (open.length < 2) return;
        moves += 1;
        bind('memMoves').textContent = `${moves} forsøk`;
        const [a, b] = open;
        open = [];
        if (cards[a.i].pair === cards[b.i].pair && cards[a.i].lang !== cards[b.i].lang) {
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
          }, 1000);
        }
      },
    };
  },
};

export function handleClick(el) {
  if (game && running && game.click) game.click(el);
}

export function handleKey(n) {
  if (!running) return;
  const btn = bind('arcBody').querySelectorAll('.option, .tf-btn')[n - 1];
  if (btn && !btn.disabled) btn.click();
}
