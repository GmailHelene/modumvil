import {
  WORLDS, LEVELS, levelById, nextLevel, starsFor, starLimits, itemById, itemsInSets,
  makeRound, repeatOf, checkTyped, questionKey, gapHtml, makeDailyRound, examLevel, mistakesLevel,
} from './engine.js';
import {
  state, save, reset, rankFor, recordAnswer, markPlayedToday, totalStars, worldStars,
  isUnlocked, rememberQuestions, todayKey, progress, openSets, UNLOCK_STARS,
} from './store.js';
import {
  BADGES, CATEGORIES, badgeProgress, checkBadges,
} from './badges.js';
import { THEMES, themeById } from './themes.js';
import { PHRASAL, ADJ, TIPS, SET_NAMES } from './data.js';
import {
  sound, vibrate, confetti, speak, canSpeak,
} from './fx.js';
import * as arcade from './arcade.js';
import {
  $, bind, setText, esc, toast, award, badgeList, starsHtml,
} from './ui.js';

const MAX_REPEATS = 3;
const MAX_STARS = LEVELS.length * 3;

// ---------- look ----------

function applyStyle() {
  const theme = themeById(state.style.theme);
  document.documentElement.dataset.theme = theme.id;
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

const SPECIAL = {
  exam: () => ({ level: examLevel() }),
  daily: () => makeDailyRound(todayKey(), openSets()),
  mistakes: () => ({ level: mistakesLevel(state.itemStats) }),
};

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
    case 'prove': renderSpecialIntro('exam'); show('intro'); break;
    case 'dagens': renderSpecialIntro('daily'); show('intro'); break;
    case 'feil': renderSpecialIntro('mistakes'); show('intro'); break;
    case 'spill': {
      if (SPECIAL[arg]) {
        if (!game.level || game.level.id !== arg || game.done) startSpecial(arg);
        if (!game.level) { location.hash = '#/'; return; }
        show('game');
        break;
      }
      const level = levelById(arg);
      if (!level || !isUnlocked(level)) { location.hash = '#/nivaer'; return; }
      if (!game.level || game.level.id !== level.id || game.done) startRound(level);
      show('game');
      break;
    }
    case 'resultat': if (!game.done) { location.hash = '#/'; return; } show('result'); break;
    case 'arkade':
      if (arg) {
        if (!arcade.prepare(arg)) { location.hash = '#/arkade'; return; }
        show('arcadeplay');
      } else {
        arcade.renderArcadeMenu();
        show('arcade');
      }
      break;
    case 'ordliste': renderWordlist(); show('ordliste'); break;
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
  setText('xptext', rank.next ? `${state.xp} XP. ${rank.next.xp - state.xp} til ${rank.next.title}.` : `${state.xp} XP. Du har nådd toppen!`);
  const done = state.daily[todayKey()];
  setText('dailyStatus', done ? `Klar i dag: ${done.score}/10 ✓` : 'Ny i dag! +50 XP');
  bind('dailyCard').classList.toggle('daily--done', !!done);
  const next = LEVELS.find((l) => isUnlocked(l) && !(state.stars[l.id] >= 2)) || LEVELS[LEVELS.length - 1];
  setText('continueText', `Fortsett: ${next.id} ${next.title}`);
  bind('continueLink').setAttribute('href', `#/niva/${next.id}`);
  setText('examText', state.totals.exams
    ? `Beste resultat: ${state.totals.examBest} %. Prøv igjen!`
    : '20 oppgaver fra side 48-49, som på prøven');
  const m = mistakesLevel(state.itemStats);
  setText('mistakesText', m ? `${m.itemIds.length} uttrykk du bør øve mer på` : 'Ingen feil ennå. Spill litt først!');
}

// ---------- worlds ----------

function renderWorlds() {
  setText('stars', `${totalStars()}/${MAX_STARS}`);
  bind('worlds').innerHTML = WORLDS.map((w) => {
    const open = isUnlocked(w.levels[0]);
    const tiles = w.levels.map((l) => {
      const lvOpen = isUnlocked(l);
      const s = state.stars[l.id] || 0;
      const tags = [l.boss ? '👑' : '', l.timer ? '⏱' : ''].filter(Boolean).join(' ');
      const label = `Nivå ${l.id}: ${l.title}. ${lvOpen ? `${s} av 3 stjerner` : 'Låst'}`;
      const inner = `<span class="tile-num">${lvOpen ? l.n : '🔒'}</span>
        <span class="tile-title">${esc(l.title)}</span>
        <span class="tile-tags" aria-hidden="true">${tags}</span>
        <span class="tile-stars" aria-hidden="true">${starsHtml(s)}</span>`;
      return lvOpen
        ? `<li><a class="tile${l.boss ? ' tile--boss' : ''}" href="#/niva/${l.id}" aria-label="${esc(label)}">${inner}</a></li>`
        : `<li><span class="tile tile--locked${l.boss ? ' tile--boss' : ''}" aria-label="${esc(label)}">${inner}</span></li>`;
    }).join('');
    return `<section class="world${open ? '' : ' world--locked'}" aria-label="${esc(w.name)}">
      <header class="world-head">
        <span class="world-icon" aria-hidden="true">${open ? w.icon : '🔒'}</span>
        <div><h2>Verden ${w.id}: ${esc(w.name)}</h2><p>${open ? esc(w.intro) : 'Slå bossen i forrige verden for å komme inn.'}</p></div>
        <span class="chip">⭐ ${worldStars(w.id)}/12</span>
      </header>
      <ol class="tiles">${tiles}</ol></section>`;
  }).join('');
}

// ---------- intro ----------

function levelItems(level) {
  return level.itemIds ? level.itemIds.map(itemById) : itemsInSets(level.sets);
}

function showIntro(level, { title, sub, text, back = '#/nivaer', canStart = true }) {
  setText('introTitle', title);
  setText('introSub', sub);
  setText('introText', text);
  bind('introBack').setAttribute('href', back);
  const items = level ? levelItems(level) : [];
  bind('introWords').innerHTML = items.length && items.length <= 16
    ? items.map((i) => `<li><b lang="en">${esc(i.en)}</b> <span>${esc(i.no)}</span></li>`).join('')
    : '';
  const facts = [];
  if (level) {
    facts.push(`${level.length} oppgaver`);
    if (level.timer) facts.push(`${level.timer} sek per oppgave`);
    if (level.exam) facts.push('ingen hjelp');
    if (!['exam', 'daily', 'mistakes'].includes(level.id)) facts.push(`${starLimits(level.length)[1]} riktige låser opp neste`);
  }
  setText('introHint', facts.join(' · '));
  $('[data-action="start-round"]').hidden = !canStart;
  game.pendingLevel = level;
}

function renderIntro(level) {
  const world = WORLDS.find((w) => w.id === level.world);
  showIntro(level, {
    title: `${level.boss ? '👑 ' : ''}${level.title}`,
    sub: `${world.icon} ${world.name} · nivå ${level.n}`,
    text: level.intro,
  });
}

function renderSpecialIntro(id) {
  const { level } = SPECIAL[id]();
  if (id === 'mistakes' && !level) {
    showIntro(null, {
      title: '🩹 Mine feil', sub: '', back: '#/',
      text: 'Du har ingen feil å øve på ennå. Spill noen runder først, så samler spillet opp det du bommer på her. 🎉',
      canStart: false,
    });
    return;
  }
  const titles = { exam: '📝 Prøveøving', daily: '☀️ Dagens utfordring', mistakes: '🩹 Mine feil' };
  let text = level.intro;
  if (id === 'daily' && state.daily[todayKey()]) text = `Du har allerede klart dagens: ${state.daily[todayKey()].score} av 10. Du kan spille igjen, men bonusen får du bare én gang.`;
  if (id === 'exam' && state.totals.exams) text += ` Ditt beste resultat så langt: ${state.totals.examBest} %.`;
  showIntro(level, {
    title: titles[id],
    sub: id === 'daily' ? new Date().toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Boka side 48-49',
    text,
    back: '#/',
  });
}

// ---------- game ----------

const game = {
  level: null, queue: [], index: 0, firstTry: 0, scored: 0, repeats: 0, hints: 0,
  combo: 0, bestCombo: 0, xp: 0, earned: [], missed: [], answered: false, done: false, q: null,
};

function beginRound(level, queue) {
  stopQuestionTimer();
  Object.assign(game, {
    level, queue, index: 0, firstTry: 0, scored: 0, repeats: 0, hints: 0,
    combo: 0, bestCombo: 0, xp: 0, earned: [], missed: [], answered: false, done: false, q: null, results: [],
  });
  if (level.id !== 'daily') rememberQuestions(queue.map(questionKey));
  save();
  const special = ['exam', 'daily', 'mistakes'].includes(level.id);
  bind('quitLink').setAttribute('href', special ? '#/' : '#/nivaer');
  showQuestion();
}

function startRound(level) {
  beginRound(level, makeRound(level, state.itemStats, state.recent));
}

function startSpecial(id) {
  const res = SPECIAL[id]();
  if (!res.level) { game.level = null; return; }
  const round = res.round || makeRound(res.level, state.itemStats, state.recent);
  beginRound(res.level, round);
}

function renderDots() {
  const len = game.level.length;
  const dots = [];
  for (let i = 0; i < len; i += 1) {
    const r = game.results[i];
    dots.push(`<span class="dot ${r === true ? 'dot--ok' : r === false ? 'dot--bad' : ''} ${i === game.scored && !game.q?.repeat ? 'dot--now' : ''}"></span>`);
  }
  bind('dots').innerHTML = dots.join('') + (game.q?.repeat ? '<span class="repeat-tag">Ekstra øving</span>' : '');
  setText('progressText', game.q?.repeat ? 'Ekstra øving på en du bommet på.' : `Oppgave ${game.scored + 1} av ${len}.`);
}

let qTimerRaf = 0;
function stopQuestionTimer() { cancelAnimationFrame(qTimerRaf); }

function startQuestionTimer(seconds) {
  stopQuestionTimer();
  bind('qTimerWrap').hidden = false;
  const fill = bind('qTimer');
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

// Which part of the question is English and can be read aloud.
function speakable(q) {
  if (q.sentence) return q.sentence;
  if (['pMeaning', 'aMeaning', 'pDef', 'pDefTyped'].includes(q.factory)) return q.big.replace(/[«»]/g, '');
  return null;
}

function showQuestion() {
  const q = game.queue[game.index];
  game.q = q;
  game.answered = false;
  bind('feedback').hidden = true;
  setText('combo', game.combo >= 2 ? `🔥 ${game.combo}` : '');
  renderDots();

  bind('prompt').textContent = q.prompt;
  const big = bind('big');
  big.hidden = !q.big;
  big.textContent = q.big || '';
  big.lang = ['pEnglish', 'pTranslate', 'aTranslate'].includes(q.factory) ? 'nb' : 'en';
  const sentence = bind('sentence');
  sentence.hidden = !q.sentence;
  sentence.innerHTML = q.sentence ? gapHtml(q.sentence) : '';
  const note = bind('note');
  note.hidden = !q.note;
  note.textContent = q.note || '';

  const hintBtn = $('[data-action="hint"]');
  hintBtn.hidden = !!game.level.exam;
  hintBtn.disabled = false;
  bind('speakBtn').hidden = !canSpeak() || !state.settings.speak || !speakable(q);

  const opts = bind('options');
  const form = bind('typedForm');
  if (q.mode === 'typed') {
    opts.hidden = true;
    opts.innerHTML = '';
    form.hidden = false;
    const input = bind('typedInput');
    input.value = '';
    input.disabled = false;
    input.placeholder = q.placeholder || '';
    bind('typedBtn').disabled = false;
    const hint = bind('typedHint');
    hint.textContent = 'Skriv svaret på engelsk. Store og små bokstaver spiller ingen rolle.';
    hint.classList.remove('typed-hint--warn');
  } else {
    form.hidden = true;
    opts.hidden = false;
    opts.classList.toggle('options--long', !!q.long || q.options.some((o) => o.label.length > 18));
    opts.innerHTML = q.options.map((o, i) => `<button class="option" type="button" data-opt="${i}" lang="${q.factory === 'pMeaning' || q.factory === 'aMeaning' ? 'nb' : 'en'}">${esc(o.label)}</button>`).join('');
  }
  if (game.level.timer && !q.repeat) startQuestionTimer(game.level.timer);
  else bind('qTimerWrap').hidden = true;
  if (q.mode === 'typed') bind('typedInput').focus({ preventScroll: true });
  else bind('prompt').focus({ preventScroll: true });
}

function submitTyped() {
  const q = game.q;
  if (!q || q.mode !== 'typed' || game.answered) return;
  const text = bind('typedInput').value;
  const res = checkTyped(q, text);
  if (res.ok === null) {
    const hint = bind('typedHint');
    hint.textContent = res.hint;
    hint.classList.add('typed-hint--warn');
    bind('typedInput').focus();
    return;
  }
  game.typedText = text.trim();
  game.near = res.near;
  onAnswer(res.ok, null);
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
    gained = q.repeat ? 3 : (q.hinted ? 5 : 10 + Math.min(game.combo, 5) * 2 + (game.level.boss ? 5 : 0) + (q.mode === 'typed' ? 3 : 0));
    sound.correct(game.combo);
    vibrate(20);
    if (game.combo % 5 === 0) confetti(60);
  } else {
    game.combo = 0;
    sound.wrong();
    vibrate([40, 40, 60]);
    if (!q.repeat && !game.missed.includes(q.answerText)) game.missed.push(q.answerText);
    if (!game.level.exam && game.repeats < MAX_REPEATS && !q.repeat) {
      const r = repeatOf(q, game.level);
      game.queue.splice(Math.min(game.index + 3, game.queue.length), 0, r);
      game.repeats += 1;
    }
  }
  game.xp += gained;
  state.xp += gained;
  save();
  game.earned.push(...award());

  if (q.mode === 'typed') {
    bind('typedInput').disabled = true;
    bind('typedBtn').disabled = true;
  } else {
    bind('options').querySelectorAll('.option').forEach((b, i) => {
      b.disabled = true;
      if (q.options[i].correct) b.classList.add('option--right');
    });
    if (chosenBtn && !correct) chosenBtn.classList.add('option--wrong');
  }
  renderDots();
  setText('combo', game.combo >= 2 ? `🔥 ${game.combo}` : '');

  const fb = bind('feedback');
  fb.classList.toggle('feedback--ok', correct);
  fb.classList.toggle('feedback--bad', !correct);
  if (correct) {
    const praise = ['Correct!', 'Well done!', 'Brilliant!', 'Awesome!', 'Great job!', 'Nailed it!', 'Perfect!'];
    setText('fbTitle', `${praise[Math.floor(Math.random() * praise.length)]} +${gained} XP`);
    bind('fbExplain').innerHTML = '';
  } else {
    let title = 'Ikke helt.';
    if (timedOut) title = '⏱ Tiden gikk ut!';
    else if (q.mode === 'typed') title = game.near ? `Nesten! Sjekk stavingen. Du skrev «${game.typedText}».` : `Ikke helt. Du skrev «${game.typedText}».`;
    setText('fbTitle', title);
    bind('fbExplain').innerHTML = q.explain.map((l) => `<li>${esc(l)}</li>`).join('');
  }
  bind('fbAnswer').innerHTML = `Riktig: <b lang="en">${esc(q.answerText)}</b>`;
  bind('speakAnswerBtn').hidden = !canSpeak() || !state.settings.speak;
  fb.hidden = false;
  fb.querySelector('[data-action="next"]').focus({ preventScroll: true });
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
  const pct = Math.round((game.firstTry / len) * 100);
  state.totals.rounds += 1;
  if (perfect) state.totals.perfect += 1;
  if (perfect && game.hints === 0) state.totals.perfectNoHint += 1;

  let bonus = stars * 10;
  let title = ['Øv litt til!', 'Bra jobba!', 'Kjempebra!', 'Engelskmester!'][stars];
  let back = '#/nivaer';
  let backText = 'Til kartet';
  if (level.id === 'exam') {
    state.totals.exams += 1;
    state.totals.examBest = Math.max(state.totals.examBest, pct);
    bonus = Math.round(pct / 2);
    if (pct >= 90) title = 'Strålende! Du er klar for prøven 🎉';
    else if (pct >= 75) title = 'Godt jobbet! Nesten i mål';
    else if (pct >= 50) title = 'På god vei!';
    else title = 'Øv litt mer, du klarer det!';
    back = '#/';
    backText = 'Til start';
  } else if (level.id === 'daily') {
    const key = todayKey();
    if (!state.daily[key]) {
      bonus += 50;
      state.totals.dailyDone += 1;
      state.daily[key] = { score: game.firstTry };
    } else if (game.firstTry > state.daily[key].score) {
      state.daily[key].score = game.firstTry;
    }
    title = 'Dagens utfordring klart!';
    back = '#/';
    backText = 'Til start';
  } else if (level.id === 'mistakes') {
    state.totals.mistakeRounds += 1;
    title = game.firstTry >= 7 ? 'Feilene sitter bedre nå! 💪' : 'Fortsett å øve på disse';
    back = '#/';
    backText = 'Til start';
  } else {
    const prev = state.stars[level.id] || 0;
    if (stars > prev) state.stars[level.id] = stars;
    if (level.boss && stars >= 1 && prev === 0) title = `${level.title.replace('BOSS: ', '')} er beseiret! 👑`;
  }
  game.xp += bonus;
  state.xp += bonus;
  markPlayedToday();
  save();
  game.earned.push(...award());

  setText('resultTitle', title);
  const special = ['exam', 'daily', 'mistakes'].includes(level.id);
  bind('resultStars').innerHTML = level.id === 'exam'
    ? `<span class="result-pct">${pct} %</span>`
    : (special ? '' : starsHtml(stars)) + `<span class="sr">${stars} av 3 stjerner</span>`;
  setText('resultScore', `${game.firstTry} av ${len} riktige på første forsøk`);
  setText('resultXp', `+${game.xp} XP${game.bestCombo >= 3 ? `  ·  Lengste rekke: ${game.bestCombo}` : ''}`);
  bind('resultBadges').innerHTML = badgeList(game.earned);
  const mistakes = bind('resultMistakes');
  mistakes.hidden = !game.missed.length;
  mistakes.innerHTML = game.missed.length
    ? `<h2>Øv mer på disse</h2><ul>${game.missed.map((m) => `<li lang="en">${esc(m)}</li>`).join('')}</ul>`
    : '';
  bind('resultBack').setAttribute('href', back);
  bind('resultBack').textContent = backText;

  const next = special ? null : nextLevel(level);
  const nextBtn = bind('nextLevelBtn');
  nextBtn.hidden = !next || !isUnlocked(next);
  nextBtn.textContent = next && next.world !== level.world ? `Ny verden: ${WORLDS.find((w) => w.id === next.world).name} →` : 'Neste nivå →';
  const need = bind('resultNeed');
  need.hidden = special || !next || isUnlocked(next);
  if (!need.hidden) {
    const n = next.world !== level.world ? 1 : UNLOCK_STARS;
    need.textContent = `Du trenger ${n} ${n === 1 ? 'stjerne' : 'stjerner'} for å låse opp neste nivå. Prøv igjen, du får nye oppgaver!`;
  }
  if (stars >= 2 || pct >= 80) { sound.fanfare(); confetti(); }
  location.hash = '#/resultat';
}

// Hint: multiple choice loses two wrong options; typed shows the first letters.
function useHint() {
  const q = game.q;
  if (!q || game.answered || game.level.exam) return;
  q.hinted = true;
  game.hints += 1;
  $('[data-action="hint"]').disabled = true;
  if (q.mode === 'typed') {
    const ans = q.accept[0];
    const pattern = ans.split(' ').map((w) => w[0] + '_'.repeat(Math.max(0, w.length - 1))).join(' ');
    const hint = bind('typedHint');
    hint.textContent = `💡 Svaret ser slik ut: ${pattern}`;
    hint.classList.remove('typed-hint--warn');
  } else {
    let removed = 0;
    bind('options').querySelectorAll('.option').forEach((b, i) => {
      if (!q.options[i].correct && removed < 2) {
        b.disabled = true;
        b.classList.add('option--gone');
        removed += 1;
      }
    });
  }
  toast('💡 Hjelp brukt. Riktig svar gir 5 XP nå.');
}

// ---------- word list ----------

let wordTab = 'verbs';
function wordRows(items) {
  return items.map((i) => {
    const sentence = i.gaps[0].replace('___', i.type === 'p' ? (i.gapPart || i.part) : i.preps[0]);
    const extra = i.type === 'p'
      ? `${i.def ? `<small lang="en">${esc(i.def)}</small>` : ''}<small>Fortid: <b lang="en">${esc(i.past)}</b></small>`
      : `${i.preps.length > 1 ? `<small>Også riktig: <b lang="en">${esc(i.preps.slice(1).map((p) => `${i.adj} ${p}`).join(', '))}</b></small>` : ''}${i.trap ? `<small class="trap">Felle: ikke «${esc(i.adj)} ${esc(i.trap)}»</small>` : ''}`;
    return `<li class="word">
      <div class="word-main"><b lang="en">${esc(i.en)}</b><span>${esc(i.no)}</span>${extra}
      <em lang="en">${esc(sentence)}</em></div>
      ${canSpeak() ? `<button class="tool-btn" type="button" data-say="${esc(`${i.en}. ${sentence}`)}" aria-label="Les opp ${esc(i.en)}">🔊</button>` : ''}
    </li>`;
  }).join('');
}

function renderWordlist() {
  document.querySelectorAll('[data-tab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === wordTab)));
  const el = bind('wordlist');
  const section = (set, items) => `<h2 class="section-title">${esc(SET_NAMES[set])}</h2><ul class="words">${wordRows(items)}</ul>`;
  const typed = (list) => list.map((i) => ({ ...i, type: i.adj ? 'a' : 'p', en: i.adj ? `${i.adj} ${i.preps[0]}` : i.en }));
  if (wordTab === 'verbs') {
    el.innerHTML = `<p class="screen-intro">Fra boka side 48. Trykk 🔊 for å høre uttalen.</p>${section(1, typed(PHRASAL.filter((p) => p.set === 1)))}${section(2, typed(PHRASAL.filter((p) => p.set === 2)))}`;
  } else if (wordTab === 'adj') {
    el.innerHTML = `<p class="screen-intro">Fra boka side 49. Lær adjektivet og preposisjonen som ett uttrykk.</p>${section(3, typed(ADJ.filter((a) => a.set === 3)))}${section(4, typed(ADJ.filter((a) => a.set === 4)))}`;
  } else if (wordTab === 'tips') {
    el.innerHTML = `<div class="tips">${TIPS.map((t) => `<article class="card tip"><h2>${esc(t.title)}</h2><p>${t.text}</p></article>`).join('')}</div>`;
  } else {
    el.innerHTML = `<p class="screen-intro">Ekstra uttrykk som ikke står på side 48-49. Fint å kunne, men ikke pensum.</p>${section(5, typed(PHRASAL.filter((p) => p.set === 5)))}${section(6, typed(ADJ.filter((a) => a.set === 6)))}`;
  }
}

// ---------- badges, style, settings ----------

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
  const worst = Object.entries(state.itemStats)
    .filter(([, s]) => s.seen >= 3 && s.wrong / s.seen > 0.3)
    .sort((a, b) => b[1].wrong / b[1].seen - a[1].wrong / a[1].seen)
    .slice(0, 5)
    .map(([id]) => itemById(id))
    .filter(Boolean);
  bind('stats').innerHTML = `
    <h2>Statistikk</h2>
    <p>${t.correct} riktige av ${t.answered} svar (${pct} %). ${t.rounds} runder, ${t.exams} prøveøvinger.</p>
    <p>Beste prøveøving: ${t.examBest} %. Lengste rekke: ${state.bestStreak}.</p>
    ${worst.length ? `<p>Øv mer på: <b lang="en">${worst.map((i) => esc(i.en)).join(', ')}</b>. Bruk «Mine feil» på forsiden.</p>` : ''}`;
}

function renderStyle() {
  bind('themeList').innerHTML = THEMES.map((item) => {
    const open = item.need(state, progress);
    const selected = state.style.theme === item.id;
    return `<li><button class="style-tile${selected ? ' style-tile--on' : ''}" type="button" data-style="theme" data-id="${item.id}" ${open ? '' : 'disabled'} aria-pressed="${selected}">
      <span class="swatch swatch--${item.id}" aria-hidden="true">${item.icon}</span><b>${esc(item.name)}</b>
      <small>${open ? (selected ? 'Valgt' : 'Trykk for å velge') : `🔒 ${esc(item.req)}`}</small></button></li>`;
  }).join('');
  setText('styleCount', `${THEMES.filter((t) => t.need(state, progress)).length}/${THEMES.length}`);
}

function chooseStyle(id) {
  const item = THEMES.find((x) => x.id === id);
  if (!item || !item.need(state, progress)) return;
  state.style.theme = id;
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

// ---------- install ----------

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

function sayAndCount(text) {
  if (speak(text)) {
    save();
    award();
  }
}

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (!t) return;

  if (current === 'arcadeplay' && t.closest('[data-bind="arcBody"]')) {
    arcade.handleClick(t);
    return;
  }
  if (t.matches('.option[data-opt]')) {
    onAnswer(game.q.options[Number(t.dataset.opt)].correct, t);
    return;
  }
  if (t.dataset.style) { chooseStyle(t.dataset.id); return; }
  if (t.dataset.tab) { wordTab = t.dataset.tab; renderWordlist(); return; }
  if (t.dataset.say) { sayAndCount(t.dataset.say); return; }

  switch (t.dataset.action) {
    case 'start-round': {
      const level = game.pendingLevel;
      if (!level) break;
      if (SPECIAL[level.id]) {
        startSpecial(level.id);
        location.hash = `#/spill/${level.id}`;
      } else {
        startRound(level);
        location.hash = `#/spill/${level.id}`;
      }
      break;
    }
    case 'next': nextQuestion(); break;
    case 'hint': useHint(); break;
    case 'speak': if (game.q) sayAndCount(speakable(game.q) || ''); break;
    case 'speak-answer': if (game.q) sayAndCount(game.q.say); break;
    case 'again':
      if (SPECIAL[game.level.id]) startSpecial(game.level.id);
      else startRound(game.level);
      location.hash = `#/spill/${game.level.id}`;
      break;
    case 'next-level': {
      const next = nextLevel(game.level);
      if (next) location.hash = `#/niva/${next.id}`;
      break;
    }
    case 'arc-go': arcade.start(); break;
    case 'install':
      if (installEvent) { installEvent.prompt(); installEvent = null; }
      break;
    case 'reset':
      // eslint-disable-next-line no-alert
      if (window.confirm('Sikker? Alle stjerner, XP og merker blir slettet.')) {
        reset();
        applyStyle();
        toast('Fremgangen er nullstilt. Du får nye oppgaver når du starter på nytt.');
      }
      break;
    default:
  }
});

bind('typedForm').addEventListener('submit', (ev) => {
  ev.preventDefault();
  submitTyped();
});

document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.matches('[data-setting]')) {
    state.settings[t.dataset.setting] = t.checked;
    save();
  }
});

document.addEventListener('keydown', (ev) => {
  if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
  if (ev.target.matches && ev.target.matches('input, select, textarea')) return;
  const n = Number(ev.key);
  if (!(n >= 1 && n <= 4)) return;
  if (current === 'arcadeplay') { arcade.handleKey(n); return; }
  if (current === 'game') {
    const btn = bind('options').querySelectorAll('.option')[n - 1];
    if (btn && !btn.disabled && !bind('options').hidden) btn.click();
  }
});

// ---------- boot ----------

if (checkBadges().length) save();
route();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
