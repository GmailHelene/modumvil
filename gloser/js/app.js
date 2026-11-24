import {
  makeRound, makeTest, repeatOf, checkTyped, questionKey, mistakeItems, starsFor, KINDS,
  parseWeek, weekToText, KNOWN_BOX, levenshtein, normalize,
} from './engine.js';
import {
  state, save, reset, rankFor, recordAnswer, markPlayedToday, rememberQuestions,
  allWeeks, weekById, activeWeek, itemsFor, allItems, saveWeek, deleteWeek, knownCount, totalKnown,
} from './store.js';
import {
  BADGES, CATEGORIES, badgeProgress, checkBadges, themeCtx,
} from './badges.js';
import { THEMES, themeById } from './themes.js';
import { TIPS } from './data.js';
import {
  sound, vibrate, confetti, speak, canSpeak, voiceSupport, whenVoicesChange,
} from './fx.js';
import * as arcade from './arcade.js';
import {
  $, bind, setText, esc, toast, award, badgeList, starsHtml,
} from './ui.js';

const ROUND_LENGTH = 12;
const MAX_REPEATS = 3;

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
  if (current !== name && current === 'game') stopFlash();
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

const MODES = { ov: 'practice', test: 'test', feil: 'mistakes' };

function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [page, arg] = hash.split('/');
  switch (page) {
    case 'uker': renderWeeks(); show('uker'); break;
    case 'ny': renderEditor(null); show('editor'); break;
    case 'rediger': {
      const w = weekById(arg);
      if (!w || !w.custom) { location.hash = '#/uker'; return; }
      renderEditor(w);
      show('editor');
      break;
    }
    case 'ov':
    case 'test':
    case 'feil': renderIntro(MODES[page]); show('intro'); break;
    case 'spill':
      if (!game.queue.length || game.done) { location.hash = '#/'; return; }
      show('game');
      focusQuestion();
      break;
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
  setText('knownChip', String(totalKnown()));
  setText('days', String(state.days.count));
  setText('badgeChip', `${state.badges.length}/${BADGES.length}`);
  const pct = Math.round(rank.progress * 100);
  const bar = bind('xpbar');
  bar.setAttribute('aria-valuenow', String(pct));
  bar.querySelector('.xpbar-fill').style.width = `${pct}%`;
  setText('xptext', rank.next ? `${state.xp} XP. ${rank.next.xp - state.xp} til ${rank.next.title}.` : `${state.xp} XP. Du har nådd toppen!`);

  const week = activeWeek();
  const items = itemsFor();
  const known = knownCount(items);
  setText('weekTitle', week.title);
  setText('weekKnown', `${known} av ${items.length} ord sitter`);
  bind('weekBar').style.width = `${items.length ? Math.round((known / items.length) * 100) : 0}%`;
  setText('testText', state.totals.tests ? `Beste resultat: ${state.totals.testBest} %. Prøv igjen!` : 'Som en gloseprøve, uten hjelp');
  const m = mistakeItems(items, state.itemStats);
  setText('mistakesText', m.length ? `${m.length} ord du bør øve mer på` : 'Ingen feil ennå. Øv litt først!');
}

// ---------- weeks ----------

function renderWeeks() {
  const all = [{ id: 'alle', title: 'Alle ord', sub: 'Bland alle listene' }, ...allWeeks()];
  bind('weekList').innerHTML = all.map((w) => {
    const items = itemsFor(w.id);
    const known = knownCount(items);
    const on = state.active === w.id || (w.id === 'alle' && !weekById(state.active));
    const counts = w.id === 'alle' ? `${items.length} ord` : [
      w.gloss?.length ? `${w.gloss.length} gloser` : '',
      w.words?.length ? `${w.words.length} ukas ord` : '',
    ].filter(Boolean).join(' og ');
    return `<li class="week-item${on ? ' week-item--on' : ''}">
      <button class="week-pick" type="button" data-week="${esc(w.id)}" aria-pressed="${on}">
        <span class="week-radio" aria-hidden="true">${on ? '✔' : ''}</span>
        <span class="week-text"><b>${esc(w.title)}</b><small>${esc(w.sub || '')}</small><small>${esc(counts)} · ${known} sitter</small></span>
      </button>
      ${w.custom ? `<a class="tool-btn" href="#/rediger/${esc(w.id)}" aria-label="Endre ${esc(w.title)}">✎ Endre</a>` : ''}
    </li>`;
  }).join('');
}

let editing = null;
let deleteArmed = false;

function renderEditor(week) {
  editing = week;
  deleteArmed = false;
  const form = bind('editor');
  const text = week ? weekToText(week) : { title: '', glossText: '', wordText: '' };
  form.elements.title.value = text.title;
  form.elements.glossText.value = text.glossText;
  form.elements.wordText.value = text.wordText;
  setText('edTitle', week ? 'Endre liste' : 'Nye ord');
  bind('edErrors').hidden = true;
  const del = bind('edDelete');
  del.hidden = !week;
  del.textContent = 'Slett lista';
}

function submitEditor() {
  const form = bind('editor');
  const id = editing ? editing.id : `c${Date.now().toString(36)}`;
  const { week, errors } = parseWeek({
    id,
    title: form.elements.title.value,
    glossText: form.elements.glossText.value,
    wordText: form.elements.wordText.value,
  });
  const box = bind('edErrors');
  if (errors.length) {
    box.innerHTML = errors.map((e) => `<li>${esc(e)}</li>`).join('');
    box.hidden = false;
    box.scrollIntoView({ block: 'center' });
    return;
  }
  // Keep stats for words that are still in the list; drop the rest.
  if (editing) {
    const keep = new Set(itemsFor(id).map((i) => i.id));
    saveWeek(week);
    const now = new Set(itemsFor(id).map((i) => i.id));
    keep.forEach((k) => { if (!now.has(k)) delete state.itemStats[k]; });
  } else {
    saveWeek(week);
  }
  save();
  award();
  toast(`Lagret «${esc(week.title)}». Nå øver du på den lista.`);
  location.hash = '#/';
}

// ---------- intro ----------

let pendingMode = null;

function roundItems(mode) {
  const items = itemsFor();
  if (mode === 'mistakes') return mistakeItems(items, state.itemStats);
  return items;
}

function renderIntro(mode) {
  pendingMode = mode;
  const week = activeWeek();
  const items = roundItems(mode);
  const voices = voiceSupport();
  const hasWords = items.some((i) => i.type === 'word');
  let title;
  let text;
  const facts = [];
  if (mode === 'practice') {
    title = '✏️ Øv';
    text = 'Diktat, se-dekk-skriv, bokstavsalat, ord med hull og sammensatte ord. Det meste skal du skrive selv. Bommer du, kommer ordet igjen senere i runden.';
    facts.push(`${ROUND_LENGTH} oppgaver`, 'du kan bruke 💡 Hjelp');
  } else if (mode === 'test') {
    title = '📝 Test deg';
    text = `Som en gloseprøve. Gloser: du ser det norske ordet og skriver det engelske. ${hasWords ? (voices.nb ? 'Ukas ord: du hører ordet og skriver det.' : 'Ukas ord: du ser ordet et øyeblikk, så skriver du det.') : ''} Ingen hjelp. Du får se hva som var feil til slutt.`;
    facts.push(`${items.length} ord`, 'alt skrives');
    if (state.totals.tests) facts.push(`beste: ${state.totals.testBest} %`);
  } else {
    title = '🩹 Mine feil';
    text = items.length
      ? 'Ordene du har bommet på og som ikke sitter ennå. Øv til de sitter!'
      : 'Du har ingen feil å øve på i denne lista. Spill noen runder først, så samler appen opp det du bommer på her. 🎉';
    if (items.length) facts.push(`${Math.max(6, Math.min(ROUND_LENGTH, items.length * 2))} oppgaver`);
  }
  setText('introTitle', title);
  setText('introSub', week.title);
  setText('introText', text);
  bind('introWords').innerHTML = mode !== 'test' && items.length && items.length <= 30
    ? items.map((i) => `<li><b lang="${i.type === 'gloss' ? 'en' : 'nb'}">${esc(i.text)}</b> <span>${esc(i.type === 'gloss' ? i.no[0] : (i.parts ? `${i.parts[0]} + ${i.parts[2]}` : 'ukas ord'))}</span></li>`).join('')
    : '';
  if (!voices.en && !voices.nb && canSpeak() && state.settings.speak) facts.push('fant ingen stemme for opplesning, så diktat er slått av');
  setText('introHint', facts.join(' · '));
  bind('startBtn').hidden = !items.length;
}

// ---------- game ----------

const game = {
  mode: null, queue: [], index: 0, total: 0, firstTry: 0, scored: 0, repeats: 0, hints: 0,
  combo: 0, bestCombo: 0, xp: 0, earned: [], missed: [], answers: [], results: [],
  answered: false, done: false, q: null, hinted: false, copyDone: false,
};

function startGame(mode) {
  const items = roundItems(mode);
  if (!items.length) return false;
  const voices = voiceSupport();
  const pool = allItems();
  let queue;
  if (mode === 'test') queue = makeTest({ items, pool, voices });
  else {
    const length = mode === 'mistakes' ? Math.max(6, Math.min(ROUND_LENGTH, items.length * 2)) : ROUND_LENGTH;
    queue = makeRound({ items, pool, length, stats: state.itemStats, recent: state.recent, voices });
  }
  Object.assign(game, {
    mode, queue, index: 0, total: queue.length, firstTry: 0, scored: 0, repeats: 0, hints: 0,
    combo: 0, bestCombo: 0, xp: 0, earned: [], missed: [], answers: [], results: [],
    answered: false, done: false, q: null, items, pool, voices,
  });
  rememberQuestions(queue.map(questionKey));
  save();
  return true;
}

const itemOf = (q) => game.pool.find((i) => i.id === q.item);

function renderDots() {
  const len = game.total;
  const dots = [];
  for (let i = 0; i < len; i += 1) {
    const r = game.results[i];
    const cls = game.mode === 'test' ? (r !== undefined ? 'dot--done' : '') : (r === true ? 'dot--ok' : r === false ? 'dot--bad' : '');
    dots.push(`<span class="dot ${cls} ${i === game.scored && !game.q?.repeat ? 'dot--now' : ''}"></span>`);
  }
  bind('dots').innerHTML = dots.join('') + (game.q?.repeat ? '<span class="repeat-tag">Ekstra øving</span>' : '');
  setText('progressText', game.q?.repeat ? 'Ekstra øving på et ord du bommet på.' : `Oppgave ${game.scored + 1} av ${len}.`);
}

let flashTimer = 0;
let flashRaf = 0;
function stopFlash() {
  clearTimeout(flashTimer);
  cancelAnimationFrame(flashRaf);
}

// See, cover, write: show the word for a moment, then hide it and ask for it.
function runFlash(ms) {
  stopFlash();
  const wrap = bind('flashWrap');
  const fill = bind('flashBar');
  wrap.hidden = false;
  bind('coverBtn').hidden = false;
  bind('typedForm').hidden = true;
  const ends = performance.now() + ms;
  const loop = (now) => {
    const left = Math.max(0, ends - now);
    fill.style.width = `${(left / ms) * 100}%`;
    if (left > 0) flashRaf = requestAnimationFrame(loop);
  };
  flashRaf = requestAnimationFrame(loop);
  flashTimer = setTimeout(cover, ms);
}

function cover() {
  stopFlash();
  if (!game.q || !game.q.flash || game.answered) return;
  bind('flashWrap').hidden = true;
  bind('coverBtn').hidden = true;
  const big = bind('big');
  big.textContent = '🙈';
  big.classList.add('big-word--covered');
  bind('typedForm').hidden = false;
  bind('typedInput').focus({ preventScroll: true });
  bind('hintBtn').hidden = game.mode === 'test';
}

const flashMs = (q) => Math.min(4500, 1800 + itemOf(q).text.length * 150);

function showQuestion() {
  const q = game.queue[game.index];
  game.q = q;
  game.answered = false;
  game.hinted = false;
  stopFlash();
  bind('feedback').hidden = true;
  setText('combo', game.combo >= 2 ? `🔥 ${game.combo}` : '');
  renderDots();

  setText('kindTag', KINDS[q.kind].label);
  bind('prompt').textContent = q.prompt;
  const big = bind('big');
  big.hidden = !q.big;
  big.textContent = q.big || '';
  big.lang = q.bigLang || 'nb';
  big.classList.toggle('big-word--gaps', !!q.gaps);
  big.classList.remove('big-word--covered');
  const letters = bind('letters');
  letters.hidden = !q.letters;
  letters.innerHTML = q.letters
    ? q.letters.map((w) => `<span class="letters-word">${w.map((c) => `<span class="tile-letter">${esc(c)}</span>`).join('')}</span>`).join('')
    : '';
  letters.setAttribute('aria-label', q.letters ? `Bokstavene: ${q.letters.map((w) => w.join(' ')).join(', ')}` : '');
  const sentence = bind('sentence');
  sentence.hidden = !q.sentence;
  sentence.lang = q.sentenceLang || 'nb';
  sentence.innerHTML = q.sentence ? esc(q.sentence).replace('___', '<span class="gap">___</span>') : '';
  const note = bind('note');
  note.hidden = !q.note;
  note.textContent = q.note || '';

  const exam = game.mode === 'test';
  bind('hintBtn').hidden = exam || q.flash;
  bind('hintBtn').disabled = false;
  bind('listenBtn').hidden = !q.listen;
  bind('slowBtn').hidden = !q.listen;
  bind('coverBtn').hidden = true;
  bind('flashWrap').hidden = true;

  const opts = bind('options');
  const form = bind('typedForm');
  if (q.mode === 'typed') {
    opts.hidden = true;
    opts.innerHTML = '';
    form.hidden = false;
    const input = bind('typedInput');
    input.value = '';
    input.disabled = false;
    input.lang = q.answerLang;
    input.placeholder = q.answerLang === 'en' ? 'Skriv på engelsk' : 'Skriv på norsk';
    bind('typedBtn').disabled = false;
    const hint = bind('typedHint');
    hint.textContent = q.answerLang === 'en' ? 'Svar på engelsk. Store og små bokstaver spiller ingen rolle.' : 'Svar på norsk. Pass på stavingen.';
    hint.classList.remove('typed-hint--warn');
  } else {
    form.hidden = true;
    opts.hidden = false;
    opts.classList.toggle('options--long', q.options.some((o) => o.label.length > 16));
    opts.innerHTML = q.options.map((o, i) => `<button class="option" type="button" data-opt="${i}" lang="${q.optionLang || 'nb'}">${esc(o.label)}</button>`).join('');
  }
  if (q.flash) runFlash(flashMs(q));
  if (q.listen) setTimeout(() => { if (game.q === q && !game.answered) speak(q.listen.text, q.listen.lang); }, 350);
  focusQuestion();
}

function focusQuestion() {
  const q = game.q;
  if (!q || game.answered) return;
  if (q.mode === 'typed' && !bind('typedForm').hidden) bind('typedInput').focus({ preventScroll: true });
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
  onAnswer(res.ok, null, { typed: text.trim(), ...res });
}

function onAnswer(correct, chosenBtn, res = {}) {
  if (game.answered) return;
  game.answered = true;
  stopFlash();
  const q = game.q;
  const exam = game.mode === 'test';
  bind('hintBtn').disabled = true;
  recordAnswer(q, correct, { hinted: game.hinted });
  const item = itemOf(q);

  if (!q.repeat) {
    game.results[game.scored] = correct;
    game.scored += 1;
    if (correct) game.firstTry += 1;
    game.answers.push({ q, correct, typed: res.typed ?? (chosenBtn ? chosenBtn.textContent : ''), near: res.near });
  }

  let gained = 0;
  if (correct) {
    game.combo += 1;
    game.bestCombo = Math.max(game.bestCombo, game.combo);
    state.bestStreak = Math.max(state.bestStreak, game.combo);
    if (q.repeat) gained = 3;
    else if (game.hinted) gained = 4;
    else gained = (q.mode === 'typed' ? 12 : 8) + Math.min(game.combo, 5) * 2;
    if (!exam) {
      sound.correct(game.combo);
      vibrate(20);
      if (game.combo % 5 === 0) confetti(60);
    }
  } else {
    game.combo = 0;
    if (!exam) { sound.wrong(); vibrate([40, 40, 60]); }
    if (!q.repeat && !game.missed.includes(item.id)) game.missed.push(item.id);
    if (!exam && game.repeats < MAX_REPEATS && !q.repeat) {
      game.queue.splice(Math.min(game.index + 3, game.queue.length), 0, repeatOf(q, item, game.pool, game.voices));
      game.repeats += 1;
    }
  }
  game.xp += gained;
  state.xp += gained;
  save();
  game.earned.push(...award());

  // In the test there is no feedback per question, like a real test.
  if (exam) {
    sound.tick();
    nextQuestion();
    return;
  }

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
  if (q.flash) {
    const big = bind('big');
    big.textContent = item.text;
    big.classList.remove('big-word--covered');
  }
  renderDots();
  setText('combo', game.combo >= 2 ? `🔥 ${game.combo}` : '');

  const fb = bind('feedback');
  fb.classList.toggle('feedback--ok', correct);
  fb.classList.toggle('feedback--bad', !correct);
  const copy = bind('copyForm');
  copy.hidden = true;
  if (correct) {
    const praise = ['Riktig!', 'Bra!', 'Supert!', 'Sånn ja!', 'Knallbra!', 'Helt rett!', 'Perfekt!'];
    let title = `${praise[Math.floor(Math.random() * praise.length)]} +${gained} XP`;
    if (res.near) title = `Riktig, men sjekk stavingen! +${gained} XP`;
    setText('fbTitle', title);
    const closest = res.near ? q.accept.slice().sort((a, b) => levenshtein(normalize(a, q.answerLang), normalize(res.typed, q.answerLang)) - levenshtein(normalize(b, q.answerLang), normalize(res.typed, q.answerLang)))[0] : '';
    bind('fbExplain').innerHTML = res.near ? `<li>Det staves «${esc(closest)}». Du skrev «${esc(res.typed)}».</li>` : '';
  } else {
    let title = 'Ikke helt.';
    if (q.mode === 'typed') {
      if (res.split) title = 'Nesten! Sammensatte ord skrives i ett ord, uten mellomrom.';
      else if (res.near) title = `Nesten! Sjekk stavingen. Du skrev «${res.typed}».`;
      else title = `Ikke helt. Du skrev «${res.typed}».`;
    }
    setText('fbTitle', title);
    bind('fbExplain').innerHTML = q.explain.map((l) => `<li>${esc(l)}</li>`).join('');
    // Copy the right answer once: a classic spelling trick.
    if (q.answerLang !== 'nb' || q.itemType === 'word') {
      copy.hidden = false;
      game.copyDone = false;
      const input = bind('copyInput');
      input.value = '';
      bind('copyLabel').innerHTML = `Skriv <b lang="${q.itemType === 'gloss' ? 'en' : 'nb'}">${esc(item.text)}</b> én gang, så husker du det bedre:`;
      input.lang = q.itemType === 'gloss' ? 'en' : 'nb';
      setText('copyHint', '');
    }
  }
  bind('fbAnswer').innerHTML = `Riktig: <b lang="${q.answerLang}">${esc(q.answerText)}</b>`;
  bind('speakAnswerBtn').hidden = !canSpeak() || !state.settings.speak;
  fb.hidden = false;
  if (!copy.hidden) bind('copyInput').focus({ preventScroll: true });
  else fb.querySelector('[data-action="next"]').focus({ preventScroll: true });
  if (q.listen || q.flash) speak(item.text, q.say.lang);
}

let copyTimer = 0;
function submitCopy() {
  if (game.copyDone) { nextQuestion(); return; }
  const q = game.q;
  const item = itemOf(q);
  const typed = bind('copyInput').value.trim().toLowerCase();
  if (typed === item.text.toLowerCase()) {
    game.copyDone = true;
    game.xp += 2;
    state.xp += 2;
    save();
    setText('copyHint', '✔ Flott! +2 XP');
    sound.correct(1);
    clearTimeout(copyTimer);
    copyTimer = setTimeout(nextQuestion, 700);
  } else {
    setText('copyHint', `Ikke helt likt. Se nøye: ${item.text}`);
  }
}

function nextQuestion() {
  clearTimeout(copyTimer);
  // Guards against a double tap or Enter + click moving two steps.
  if (!game.answered || game.done) return;
  game.index += 1;
  if (game.index >= game.queue.length) {
    finishRound();
    return;
  }
  showQuestion();
}

function finishRound() {
  game.done = true;
  stopFlash();
  const len = game.total;
  const stars = starsFor(game.firstTry, len);
  const perfect = game.firstTry === len;
  const pct = Math.round((game.firstTry / len) * 100);
  state.totals.rounds += 1;
  let bonus = stars * 10;
  let title = ['Øv litt til!', 'Bra jobba!', 'Kjempebra!', 'Glosemester!'][stars];
  if (game.mode === 'test') {
    state.totals.tests += 1;
    state.totals.testBest = Math.max(state.totals.testBest, pct);
    if (pct === 100) state.totals.testPerfect += 1;
    bonus = Math.round(pct / 2);
    if (pct === 100) title = 'Alt riktig! Du er klar for prøven 🎉';
    else if (pct >= 80) title = 'Godt jobbet! Nesten i mål';
    else if (pct >= 50) title = 'På god vei!';
    else title = 'Øv litt mer, så klarer du det!';
  } else if (game.mode === 'mistakes') {
    state.totals.mistakeRounds += 1;
    title = pct >= 70 ? 'Feilene sitter bedre nå! 💪' : 'Fortsett å øve på disse';
  } else if (perfect && game.hints === 0) {
    state.totals.perfect += 1;
  }
  game.xp += bonus;
  state.xp += bonus;
  markPlayedToday();
  save();
  game.earned.push(...award());

  setText('resultTitle', title);
  bind('resultStars').innerHTML = game.mode === 'test'
    ? `<span class="result-pct">${pct} %</span>`
    : `${starsHtml(stars)}<span class="sr">${stars} av 3 stjerner</span>`;
  setText('resultScore', `${game.firstTry} av ${len} riktige${game.mode === 'test' ? '' : ' på første forsøk'}`);
  setText('resultXp', `+${game.xp} XP${game.bestCombo >= 3 ? `  ·  Lengste rekke: ${game.bestCombo}` : ''}`);
  const items = itemsFor();
  const onTheWay = items.filter((i) => { const b = state.itemStats[i.id]?.box || 0; return b > 0 && b < KNOWN_BOX; }).length;
  setText('resultKnown', `🧠 ${knownCount(items)} av ${items.length} ord sitter i «${activeWeek().title}»${onTheWay ? `, ${onTheWay} er på vei` : ''}. Et ord sitter når du har skrevet det riktig ${KNOWN_BOX} ganger.`);
  bind('resultBadges').innerHTML = badgeList(game.earned);

  const box = bind('resultMistakes');
  const wrong = game.answers.filter((a) => !a.correct);
  box.hidden = !wrong.length;
  if (wrong.length) {
    box.innerHTML = `<h2>${game.mode === 'test' ? 'Dette ble feil' : 'Øv mer på disse'}</h2><ul class="mistake-list">${wrong.map((a) => {
      const item = itemOf(a.q);
      const asked = a.q.itemType === 'gloss' && a.q.kind === 'g_no_en' ? `${esc(item.no[0])}: ` : '';
      return `<li>${asked}<b lang="${a.q.answerLang}">${esc(a.q.answerText)}</b>${a.typed ? ` <span class="muted">(du skrev «${esc(a.typed)}»)</span>` : ''}</li>`;
    }).join('')}</ul>`;
  } else box.innerHTML = '';
  bind('resultMistakesLink').hidden = !wrong.length || game.mode === 'mistakes';
  if (stars >= 2 || pct >= 80) { sound.fanfare(); confetti(); }
  location.hash = '#/resultat';
}

// Hint: multiple choice loses two wrong options; typed shows the first letter and the length.
function useHint() {
  const q = game.q;
  if (!q || game.answered || game.mode === 'test') return;
  game.hinted = true;
  game.hints += 1;
  bind('hintBtn').disabled = true;
  if (q.mode === 'typed') {
    const ans = q.answerLang === 'en' || q.itemType === 'word' ? itemOf(q).text : q.accept[0];
    const pattern = ans.split(' ').map((w) => w[0] + ' _'.repeat(Math.max(0, w.length - 1))).join('   ');
    const hint = bind('typedHint');
    hint.textContent = `💡 ${pattern}  (${ans.replace(/ /g, '').length} bokstaver)`;
    hint.classList.remove('typed-hint--warn');
    bind('typedInput').focus({ preventScroll: true });
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
  toast('💡 Hjelp brukt. Riktig svar gir 4 XP nå.');
}

// ---------- word list ----------

let wordTab = 'ord';
function renderWordlist() {
  document.querySelectorAll('[data-tab]').forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === wordTab)));
  const el = bind('wordlist');
  if (wordTab === 'tips') {
    el.innerHTML = `<div class="tips">${TIPS.map((t) => `<article class="card tip"><h2>${esc(t.title)}</h2><p>${t.text}</p></article>`).join('')}</div>`;
    return;
  }
  const weeks = state.active === 'alle' || !weekById(state.active) ? allWeeks() : [weekById(state.active)];
  const sp = canSpeak();
  const row = (i) => {
    const s = state.itemStats[i.id];
    const known = (s?.box || 0) >= KNOWN_BOX;
    const lang = i.type === 'gloss' ? 'en' : 'nb';
    const sub = i.type === 'gloss' ? i.no.join(', ') : (i.parts ? `${i.parts.filter(Boolean).join(' + ')}` : '');
    const example = i.sentence ? i.sentence.replace('___', i.text) : '';
    return `<li class="word">
      <div class="word-main"><b lang="${lang}">${esc(i.text)} ${known ? '<span class="known-tag">✔ sitter</span>' : ''}</b>${sub ? `<span>${esc(sub)}</span>` : ''}
      ${example ? `<em lang="${lang}">${esc(example)}</em>` : ''}</div>
      ${sp ? `<button class="tool-btn" type="button" data-say="${esc(i.text)}" data-lang="${lang}" aria-label="Les opp ${esc(i.text)}">🔊</button>` : ''}
    </li>`;
  };
  el.innerHTML = weeks.map((w) => {
    const items = itemsFor(w.id);
    const gloss = items.filter((i) => i.type === 'gloss');
    const words = items.filter((i) => i.type === 'word');
    return `<h2 class="section-title">${esc(w.title)}</h2>
      ${gloss.length ? `<h3 class="sub-title">Gloser</h3><ul class="words">${gloss.map(row).join('')}</ul>` : ''}
      ${words.length ? `<h3 class="sub-title">Ukas ord</h3><ul class="words">${words.map(row).join('')}</ul>` : ''}`;
  }).join('');
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
  const pool = allItems();
  const worst = Object.entries(state.itemStats)
    .filter(([, s]) => s.seen >= 3 && s.wrong / s.seen > 0.3)
    .sort((a, b) => b[1].wrong / b[1].seen - a[1].wrong / a[1].seen)
    .slice(0, 5)
    .map(([id]) => pool.find((i) => i.id === id))
    .filter(Boolean);
  bind('stats').innerHTML = `
    <h2>Statistikk</h2>
    <p>${t.correct} riktige av ${t.answered} svar (${pct} %). ${t.typedCorrect} av dem skrev du selv.</p>
    <p>${t.rounds} runder, ${t.tests} tester. Beste test: ${t.testBest} %. Lengste rekke: ${state.bestStreak}.</p>
    ${worst.length ? `<p>Øv mer på: <b>${worst.map((i) => esc(i.text)).join(', ')}</b>.</p>` : ''}`;
}

function renderStyle() {
  bind('themeList').innerHTML = THEMES.map((item) => {
    const open = item.need(state, themeCtx);
    const selected = state.style.theme === item.id;
    return `<li><button class="style-tile${selected ? ' style-tile--on' : ''}" type="button" data-style="theme" data-id="${item.id}" ${open ? '' : 'disabled'} aria-pressed="${selected}">
      <span class="swatch swatch--${item.id}" aria-hidden="true">${item.icon}</span><b>${esc(item.name)}</b>
      <small>${open ? (selected ? 'Valgt' : 'Trykk for å velge') : `🔒 ${esc(item.req)}`}</small></button></li>`;
  }).join('');
  setText('styleCount', `${THEMES.filter((x) => x.need(state, themeCtx)).length}/${THEMES.length}`);
}

function chooseStyle(id) {
  const item = THEMES.find((x) => x.id === id);
  if (!item || !item.need(state, themeCtx)) return;
  state.style.theme = id;
  state.flags.styled = true;
  save();
  applyStyle();
  award();
  renderStyle();
}

let resetArmed = false;
function renderSettings() {
  document.querySelectorAll('[data-setting]').forEach((input) => {
    input.checked = !!state.settings[input.dataset.setting];
  });
  const v = voiceSupport();
  let text;
  if (!canSpeak()) text = 'Denne nettleseren kan ikke lese opp. Diktat er slått av, resten virker.';
  else if (!state.settings.speak) text = 'Opplesning er slått av. Diktat er da ikke med.';
  else {
    text = `Engelsk stemme: ${v.en ? 'funnet ✔' : 'ikke funnet'}. Norsk stemme: ${v.nb ? 'funnet ✔' : 'ikke funnet'}.`;
    if (!v.nb) text += ' Uten norsk stemme blir ukas ord øvd med se-dekk-skriv i stedet for diktat. På Android kan du legge til norsk under Innstillinger, Tekst-til-tale.';
  }
  setText('voiceStatus', text);
  resetArmed = false;
  $('[data-action="reset"]').textContent = 'Start på nytt (nullstill fremgang)';
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

whenVoicesChange(() => {
  if (current === 'innstillinger') renderSettings();
  if (current === 'intro' && pendingMode) renderIntro(pendingMode);
});

// ---------- events ----------

function sayAndCount(text, lang) {
  if (speak(text, lang)) {
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
  if (t.dataset.say) { sayAndCount(t.dataset.say, t.dataset.lang); return; }
  if (t.dataset.sayTest) {
    if (!speak(t.dataset.sayTest === 'en' ? 'Be careful! The wicked witch is curious.' : 'Jeg er alltid hjemme på søndager.', t.dataset.sayTest)) {
      toast('Opplesning er slått av eller virker ikke her.');
    }
    return;
  }
  if (t.dataset.week) {
    state.active = t.dataset.week;
    save();
    location.hash = '#/';
    return;
  }

  switch (t.dataset.action) {
    case 'start-round':
      if (pendingMode && startGame(pendingMode)) {
        showQuestion();
        location.hash = '#/spill';
      }
      break;
    case 'next': nextQuestion(); break;
    case 'hint': useHint(); break;
    case 'cover': cover(); break;
    case 'listen': if (game.q?.listen) sayAndCount(game.q.listen.text, game.q.listen.lang); bind('typedInput').focus({ preventScroll: true }); break;
    case 'listen-slow': if (game.q?.listen) speak(game.q.listen.text, game.q.listen.lang, { rate: 0.55 }); bind('typedInput').focus({ preventScroll: true }); break;
    case 'speak-answer': if (game.q) sayAndCount(game.q.say.text, game.q.say.lang); break;
    case 'again':
      if (startGame(game.mode)) {
        showQuestion();
        location.hash = '#/spill';
      } else location.hash = '#/';
      break;
    case 'arc-go': arcade.start(); break;
    case 'install':
      if (installEvent) { installEvent.prompt(); installEvent = null; }
      break;
    case 'delete-week':
      if (!editing) break;
      if (!deleteArmed) {
        deleteArmed = true;
        t.textContent = 'Sikker? Trykk igjen for å slette';
        break;
      }
      deleteWeek(editing.id);
      toast(`Slettet «${esc(editing.title)}».`);
      editing = null;
      location.hash = '#/uker';
      break;
    case 'reset':
      if (!resetArmed) {
        resetArmed = true;
        t.textContent = 'Sikker? XP, merker og fremgang slettes. Trykk igjen.';
        break;
      }
      reset();
      applyStyle();
      renderSettings();
      toast('Fremgangen er nullstilt. Ordlistene dine er beholdt.');
      break;
    default:
  }
});

bind('typedForm').addEventListener('submit', (ev) => {
  ev.preventDefault();
  submitTyped();
});

bind('copyForm').addEventListener('submit', (ev) => {
  ev.preventDefault();
  submitCopy();
});

bind('editor').addEventListener('submit', (ev) => {
  ev.preventDefault();
  submitEditor();
});

document.addEventListener('change', (ev) => {
  const t = ev.target;
  if (t.matches('[data-setting]')) {
    state.settings[t.dataset.setting] = t.checked;
    save();
    renderSettings();
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
