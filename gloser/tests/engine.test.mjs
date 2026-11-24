import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  builtinItems, itemsOfWeek, checkTyped, makeQuestion, makeRound, makeTest, kindsFor, KINDS,
  misspellings, gapPattern, scramble, parseWeek, weekToText, normalize, setRandom, mulberry32, canBuild,
  mistakeItems, starsFor,
} from '../js/engine.js';
import { BUILTIN_WEEKS } from '../js/data.js';

const ALL = builtinItems();
const byText = (t) => ALL.find((i) => i.text === t);
const VOICES = { en: true, nb: true };

test('alle ord fra arkene er med', () => {
  const texts = ALL.map((i) => i.text);
  for (const w of ['swallowed', 'catch', 'wiggled', 'magic', 'wicked', 'curious', 'earth', 'through', 'be careful', 'ugly',
    'hjemme', 'akkurat', 'alltid', 'aldri', 'vindusrute', 'kattemat', 'skogskatt', 'fuglebur', 'hundehus', 'lastebil', 'musefelle', 'søndagstur']) {
    assert.ok(texts.includes(w), w);
  }
  assert.equal(new Set(ALL.map((i) => i.id)).size, ALL.length);
});

test('sammensatte ord: delene stemmer med ordet', () => {
  for (const w of BUILTIN_WEEKS.flatMap((x) => x.words).filter((x) => x.parts)) {
    assert.equal(w.parts.join(''), w.word);
  }
});

test('eksempelsetninger har nøyaktig ett hull', () => {
  for (const i of ALL) if (i.sentence) assert.equal(i.sentence.split('___').length, 2, i.text);
});

test('skrevne svar: engelsk er streng på staving', () => {
  const q = makeQuestion('g_no_en', byText('curious'), ALL);
  assert.equal(checkTyped(q, 'Curious').ok, true);
  assert.equal(checkTyped(q, '  curious. ').ok, true);
  const near = checkTyped(q, 'curius');
  assert.equal(near.ok, false);
  assert.equal(near.near, true);
  assert.equal(checkTyped(q, '').ok, null);
  assert.equal(checkTyped(q, 'nysgjerrig').ok, null, 'norsk svar på engelsk oppgave gir nytt forsøk');
  assert.equal(checkTyped(makeQuestion('g_no_en', byText('catch'), ALL), 'to catch').ok, true);
  assert.equal(checkTyped(makeQuestion('g_no_en', byText('be careful'), ALL), 'be  careful!').ok, true);
});

test('skrevne svar: norsk betydning godtar alternativer og små skrivefeil', () => {
  const q = makeQuestion('g_en_no', byText('wicked'), ALL);
  assert.equal(checkTyped(q, 'ond').ok, true);
  assert.equal(checkTyped(q, 'slem').ok, true);
  assert.equal(checkTyped(q, 'wicked').ok, null);
  const c = makeQuestion('g_en_no', byText('curious'), ALL);
  assert.deepEqual(checkTyped(c, 'nysgjerig'), { ok: true, near: true });
  assert.equal(checkTyped(makeQuestion('g_en_no', byText('catch'), ALL), 'å fange').ok, true);
});

test('norske staveord er strenge, og særskriving forklares', () => {
  const item = byText('vindusrute');
  const q = makeQuestion('w_compose', item, ALL);
  assert.equal(checkTyped(q, 'vindusrute').ok, true);
  assert.equal(checkTyped(q, 'vindurute').ok, false);
  assert.deepEqual(checkTyped(q, 'vindus rute'), { ok: false, split: true });
  assert.equal(checkTyped(makeQuestion('w_flash', byText('hjemme'), ALL), 'jemme').ok, false);
});

test('alle oppgavetyper kan lages for alle ord', () => {
  setRandom(mulberry32(7));
  for (const item of ALL) {
    for (const kind of kindsFor(item, VOICES)) {
      assert.ok(canBuild(kind, item, ALL), `${kind} ${item.text}`);
      const q = makeQuestion(kind, item, ALL);
      assert.ok(q.prompt.length > 0);
      assert.ok(q.explain.length > 0);
      if (q.options) {
        assert.equal(q.options.length, 4, `${kind} ${item.text}`);
        assert.equal(q.options.filter((o) => o.correct).length, 1);
        assert.equal(new Set(q.options.map((o) => o.label)).size, 4, `${kind} ${item.text}`);
      } else {
        assert.ok(checkTyped(q, q.accept[0]).ok, `${kind} ${item.text}`);
      }
      // The answer must not be shown in the question (except see-cover-write, which hides it).
      if (q.mode === 'typed' && !q.flash && q.kind !== 'g_en_no') {
        assert.ok(!String(q.big || '').toLowerCase().includes(item.text), `${kind} ${item.text}`);
        assert.ok(!String(q.sentence || '').toLowerCase().includes(item.text), `${kind} ${item.text}`);
      }
    }
  }
  setRandom();
});

test('feilstavinger er aldri det riktige ordet', () => {
  for (let s = 1; s < 30; s += 1) {
    setRandom(mulberry32(s));
    for (const item of ALL) {
      const m = misspellings(item, 3);
      assert.equal(m.length, 3);
      assert.ok(!m.includes(item.text));
      const gp = gapPattern(item);
      assert.ok(gp.includes('_'));
      assert.notEqual(gp.replace(/[^_]/g, '').length, item.text.replace(/ /g, '').length);
      assert.equal(gp.length, item.text.length);
      const sc = scramble(item.text);
      assert.equal(sc.map((w) => w.join('')).join(' ').length, item.text.length);
    }
  }
  setRandom();
});

test('runde: 12 oppgaver, minst to tredjedeler skal skrives', () => {
  for (let s = 1; s < 40; s += 1) {
    setRandom(mulberry32(s));
    const round = makeRound({ items: ALL, length: 12, voices: VOICES });
    assert.equal(round.length, 12);
    const typed = round.filter((q) => q.mode === 'typed').length;
    assert.ok(typed >= 8, `typed ${typed}`);
    for (let i = 1; i < round.length; i += 1) assert.notEqual(round[i].item, round[i - 1].item);
  }
  setRandom();
});

test('runde uten stemme har ingen diktat', () => {
  const round = makeRound({ items: ALL, length: 30, voices: {} });
  assert.ok(round.every((q) => !q.listen));
});

test('liten egen uke med ett ord fungerer', () => {
  const { week } = parseWeek({ id: 'c1', title: 'Test', wordText: 'aldri' });
  const items = itemsOfWeek(week);
  const round = makeRound({ items, pool: [...ALL, ...items], length: 12, voices: VOICES });
  assert.equal(round.length, 12);
  assert.ok(round.every((q) => q.item === items[0].id));
});

test('Test deg: alle ord en gang, alt skrives', () => {
  const t = makeTest({ items: ALL, voices: { nb: true } });
  assert.equal(t.length, ALL.length);
  assert.ok(t.every((q) => q.mode === 'typed'));
  assert.ok(t.filter((q) => q.itemType === 'word').every((q) => q.kind === 'w_listen'));
  const t2 = makeTest({ items: ALL, voices: {} });
  assert.ok(t2.filter((q) => q.itemType === 'word').every((q) => q.kind === 'w_flash'));
});

test('redigering: tolker gloser og sammensatte ord', () => {
  const { week, errors } = parseWeek({
    id: 'c2', title: 'Uke 49',
    glossText: 'brave = modig / tapper\nscared - redd\nbe careful: vær forsiktig',
    wordText: 'hjemme, borte\nfotballbane = fotball + bane\nsolskinn = sol + skinn\nskolesekk = skole + sekk',
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(week.gloss[0], { en: 'brave', no: ['modig', 'tapper'] });
  assert.equal(week.gloss[2].en, 'be careful');
  assert.equal(week.words.length, 5);
  assert.deepEqual(week.words[4].parts, ['skole', '', 'sekk']);
  const back = parseWeek({ id: 'c2', ...weekToText(week) });
  assert.deepEqual(back.week, week);
});

test('redigering: feil gir forståelige meldinger', () => {
  assert.ok(parseWeek({ id: 'x', title: '', wordText: 'a' }).errors.length);
  assert.ok(parseWeek({ id: 'x', title: 'T', glossText: 'brave' }).errors[0].includes('engelsk = norsk'));
  assert.ok(parseWeek({ id: 'x', title: 'T', wordText: 'vindusrute = dør + rute' }).errors.length);
  assert.ok(parseWeek({ id: 'x', title: 'T', wordText: '<script>' }).errors.length);
  assert.ok(parseWeek({ id: 'x', title: 'T' }).errors.length);
});

test('feil-lista og stjerner', () => {
  const a = byText('aldri');
  const b = byText('ugly');
  const stats = { [a.id]: { seen: 4, wrong: 3, box: 0 }, [b.id]: { seen: 4, wrong: 1, box: 4 } };
  assert.deepEqual(mistakeItems(ALL, stats).map((i) => i.text), ['aldri']);
  assert.equal(starsFor(11, 12), 3);
  assert.equal(starsFor(9, 12), 2);
  assert.equal(starsFor(6, 12), 1);
  assert.equal(starsFor(5, 12), 0);
  assert.equal(normalize('Å fange', 'nb'), 'fange');
  assert.ok(Object.keys(KINDS).length >= 15);
});
