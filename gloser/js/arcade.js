// Arcade: two short games on the chosen word list.
import {
  pick, shuffle, misspellings, makeQuestion, kindsFor, checkTyped,
} from './engine.js';
import {
  state, save, recordAnswer, recordArcade, markPlayedToday, itemsFor, allItems,
} from './store.js';
import { ARCADE, arcadeById } from './arcade-data.js';
import {
  sound, vibrate, confetti, speak, voiceSupport,
} from './fx.js';
import {
  bind, setText, esc, award, badgeList,
} from './ui.js';

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

const bestText = () => {
  const best = state.arcade[def.id]?.best;
  return best ? `Rekord: ${best} ${def.unit}` : 'Ingen rekord ennå';
};

export function renderArcadeMenu() {
  bind('arcadeList').innerHTML = ARCADE.map((a) => {
    const best = state.arcade[a.id]?.best;
    return `<li><a class="arcade-card" href="#/arkade/${a.id}">
      <span class="arcade-icon" aria-hidden="true">${a.icon}</span>
      <span class="arcade-info"><b>${esc(a.name)}</b><small>${esc(a.desc)}</small></span>
      <span class="arcade-best">${esc(best ? `Rekord: ${best} ${a.unit}` : 'Ikke spilt')}</span></a></li>`;
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

export const isRunning = () => running;

function countdown(ms, onEnd) {
  const t = { ends: performance.now() + ms };
  const fill = bind('arcTimer');
  bind('arcTimerWrap').hidden = false;
  const loop = (now) => {
    if (!running) return;
    const left = Math.max(0, t.ends - now);
    fill.style.width = `${(left / ms) * 100}%`;
    fill.classList.toggle('timer-fill--low', left < 10000);
    if (left <= 0) { onEnd(); return; }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return t;
}

const scoreLabel = (n) => setText('arcScore', `${def.icon} ${n}`);
const hit = (combo) => { sound.correct(combo); vibrate(15); };
const miss = () => { sound.wrong(); vibrate([40, 40, 60]); };

function finish(score, xp) {
  if (!running) return;
  stop();
  const record = recordArcade(def.id, score);
  state.xp += Math.max(0, Math.round(xp));
  markPlayedToday();
  save();
  const earned = award();
  bind('arcBody').hidden = true;
  bind('arcTimerWrap').hidden = true;
  bind('arcEnd').hidden = false;
  setText('arcEndTitle', record && score > 0 ? 'Ny rekord! 🎉' : 'Ferdig!');
  setText('arcEndScore', `${score} ${def.unit}. ${bestText()}. +${Math.round(xp)} XP`);
  bind('arcBadges').innerHTML = badgeList(earned);
  if (record && score > 0) { sound.fanfare(); confetti(); }
  bind('arcEnd').querySelector('[data-action="arc-go"]').focus({ preventScroll: true });
}

const MODES = {
  // Is the word spelled right? Half the time it is.
  jakt: () => {
    const items = itemsFor();
    let score = 0;
    let combo = 0;
    let cur = null;
    let locked = false;
    let timer = null;
    let last = null;
    const next = () => {
      let item = pick(items);
      if (items.length > 1) while (item.id === last) item = pick(items);
      last = item.id;
      const right = Math.random() < 0.5;
      cur = { item, shown: right ? item.text : pick(misspellings(item, 3)), right };
      locked = false;
      const st = bind('tfStatement');
      st.className = 'tf-statement';
      st.textContent = cur.shown;
      st.lang = item.type === 'gloss' ? 'en' : 'nb';
      setText('tfNote', item.type === 'gloss' ? `(${item.no[0]})` : '');
    };
    return {
      start(body) {
        if (!items.length) { finish(0, 0); return; }
        body.innerHTML = `<div class="question"><p class="prompt">Er ordet riktig stavet?</p>
          <p class="tf-statement" data-bind="tfStatement"></p><p class="note" data-bind="tfNote"></p>
          <div class="tf-buttons"><button class="btn tf-btn tf-btn--yes" type="button" data-tf="1">✔ Riktig</button>
          <button class="btn tf-btn tf-btn--no" type="button" data-tf="0">✘ Feil</button></div></div>`;
        scoreLabel(0);
        timer = countdown(60000, () => finish(score, score * 4));
        next();
      },
      click(el) {
        if (el.dataset.tf === undefined || locked) return;
        locked = true;
        const correct = (el.dataset.tf === '1') === cur.right;
        recordAnswer({ item: cur.item.id, mode: 'mc', itemType: cur.item.type }, correct);
        const st = bind('tfStatement');
        if (correct) {
          score += 1;
          combo += 1;
          state.bestStreak = Math.max(state.bestStreak, combo);
          hit(combo);
          st.classList.add('tf-statement--ok');
          scoreLabel(score);
          later(next, 350);
        } else {
          combo = 0;
          miss();
          timer.ends -= PENALTY_MS;
          st.classList.add('tf-statement--bad');
          st.textContent = `Riktig: ${cur.item.text}`;
          later(next, 1600);
        }
      },
    };
  },

  // Typing race: as many words as you can in 90 seconds.
  stafett: () => {
    const items = itemsFor();
    const pool = allItems();
    const voices = voiceSupport();
    let score = 0;
    let q = null;
    let timer = null;
    let locked = false;
    let bag = [];
    const next = () => {
      if (!bag.length) bag = shuffle(items);
      const item = bag.pop();
      const kinds = kindsFor(item, voices, 'typed').filter((k) => !k.endsWith('_flash'));
      q = makeQuestion(pick(kinds), item, pool);
      locked = false;
      const box = bind('stQ');
      box.innerHTML = `<p class="prompt">${esc(q.prompt)}</p>
        ${q.big ? `<p class="big-word${q.gaps ? ' big-word--gaps' : ''}">${esc(q.big)}</p>` : ''}
        ${q.letters ? `<p class="letters">${q.letters.map((w) => `<span class="letters-word">${w.map((c) => `<span class="tile-letter">${esc(c)}</span>`).join('')}</span>`).join('')}</p>` : ''}
        ${q.sentence ? `<p class="sentence">${esc(q.sentence).replace('___', '<span class="gap">___</span>')}</p>` : ''}
        ${q.note ? `<p class="note">${esc(q.note)}</p>` : ''}
        ${q.listen ? '<button class="tool-btn" type="button" data-st="hear">🔊 Hør igjen</button>' : ''}`;
      const input = bind('stInput');
      input.value = '';
      input.lang = q.answerLang;
      input.focus({ preventScroll: true });
      setText('stHint', '');
      if (q.listen) speak(q.listen.text, q.listen.lang);
    };
    return {
      start(body) {
        if (!items.length) { finish(0, 0); return; }
        body.innerHTML = `<div class="qcard qcard--small" data-bind="stQ"></div>
          <form class="typed" data-bind="stForm" autocomplete="off">
            <label class="sr" for="st-input">Ditt svar</label>
            <input id="st-input" class="typed-input" data-bind="stInput" type="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go">
            <div class="row row--2"><button class="btn" type="button" data-st="skip">Hopp over</button><button class="btn btn--big" type="submit">Svar</button></div>
            <p class="typed-hint" data-bind="stHint" aria-live="polite"></p>
          </form>`;
        bind('stForm').addEventListener('submit', (ev) => {
          ev.preventDefault();
          if (!running || locked) return;
          const res = checkTyped(q, bind('stInput').value);
          if (res.ok === null) { setText('stHint', res.hint); return; }
          recordAnswer(q, res.ok);
          if (res.ok) {
            score += 1;
            hit(score);
            scoreLabel(score);
            next();
          } else {
            locked = true;
            miss();
            setText('stHint', `${res.near ? 'Nesten! ' : ''}Riktig: ${q.answerText}`);
            later(next, 1500);
          }
        });
        scoreLabel(0);
        timer = countdown(90000, () => finish(score, score * 8));
        next();
      },
      click(el) {
        if (el.dataset.st === 'hear' && q?.listen) { speak(q.listen.text, q.listen.lang); bind('stInput').focus(); }
        if (el.dataset.st === 'skip' && !locked) {
          timer.ends -= 5000;
          miss();
          next();
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
  const btn = bind('arcBody').querySelectorAll('.tf-btn')[n - 1];
  if (btn && !btn.disabled) btn.click();
}
