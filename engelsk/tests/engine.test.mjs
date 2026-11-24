import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PHRASAL, ADJ, CORE_SETS } from '../js/data.js';
import {
  ALL_ITEMS, LEVELS, WORLDS, FACTORY_NAMES, makeQuestion, makeRound, checkTyped, normalize, fits,
  setRandom, mulberry32, makeDailyRound, examLevel, mistakesLevel, questionKey, itemById,
  quickQuestion, trueFalse, memoryCards, starsFor, repeatOf,
} from '../js/engine.js';

const seeded = (n) => setRandom(mulberry32(n));

test('pensum fra boka side 48-49 er med', () => {
  const book = ['believe in', 'look after', 'try on', 'hurry up', 'break up', 'sleep over', 'put off', 'give up',
    'throw away', 'calm down', 'cheer up', 'keep on', 'get along', 'get on', 'find out'];
  const core = PHRASAL.filter((p) => CORE_SETS.includes(p.set)).map((p) => p.en);
  assert.deepEqual([...core].sort(), [...book].sort());
  const adj = ['famous for', 'interested in', 'afraid of', 'keen on', 'bad at', 'pleased with', 'excited about',
    'angry with', 'good at', 'worried about', 'proud of', 'good for', 'bad for'];
  const coreAdj = ADJ.filter((a) => CORE_SETS.includes(a.set)).map((a) => `${a.adj} ${a.preps[0]}`);
  assert.deepEqual([...coreAdj].sort(), [...adj].sort());
  for (const p of PHRASAL.filter((x) => CORE_SETS.includes(x.set))) assert.ok(p.def, `${p.en} mangler bokas forklaring`);
});

test('dataene er gyldige', () => {
  assert.equal(new Set(ALL_ITEMS.map((i) => i.id)).size, ALL_ITEMS.length);
  for (const i of ALL_ITEMS) {
    assert.ok(i.no && i.en, i.id);
    assert.ok(i.gaps.length >= 1, i.id);
    for (const g of i.gaps) assert.equal(g.split('___').length, 2, `${i.id}: «${g}»`);
    if (i.type === 'p') {
      assert.ok(i.past && i.pastQ, i.id);
      assert.equal(i.pastQ.split('___').length, 2, i.id);
      assert.ok(i.en === `${i.verb} ${i.part}`, i.id);
    }
  }
});

test('alle 24 nivåer lager gyldige runder', () => {
  seeded(1);
  assert.equal(WORLDS.length, 6);
  assert.equal(LEVELS.length, 24);
  for (const level of LEVELS) {
    for (const k of level.kinds) assert.ok(FACTORY_NAMES.includes(k), `${level.id} ${k}`);
    for (let n = 0; n < 20; n += 1) {
      const round = makeRound(level);
      assert.equal(round.length, level.length, level.id);
      for (const q of round) {
        assert.ok(q.prompt && q.answerText && q.say && q.explain.length, `${level.id} ${q.factory}`);
        assert.doesNotMatch(JSON.stringify(q), /undefined|NaN/, `${level.id} ${q.factory}`);
        const r = repeatOf(q, level);
        assert.equal(r.item, q.item);
      }
    }
  }
  setRandom(Math.random);
});

test('flervalg: fire unike alternativer, nøyaktig ett riktig, ingen «feil» som egentlig er riktig', () => {
  seeded(2);
  for (const item of ALL_ITEMS) {
    for (const f of FACTORY_NAMES.filter((k) => fits(k, item))) {
      for (let n = 0; n < 6; n += 1) {
        const q = makeQuestion(item, f);
        if (q.mode !== 'mc') continue;
        const labels = q.options.map((o) => o.label);
        assert.equal(q.options.length, 4, `${item.id} ${f}`);
        assert.equal(new Set(labels).size, 4, `${item.id} ${f}: ${labels}`);
        assert.equal(q.options.filter((o) => o.correct).length, 1);
        // No wrong option may be an accepted answer for the same item.
        const ok = new Set();
        if (f === 'pPast') {
          ok.add(item.past);
        } else if (item.type === 'p') {
          [item.en, ...(item.alt || [])].forEach((x) => ok.add(x));
          for (const alt of item.alt || []) {
            if (alt.startsWith(`${item.verb} `)) ok.add(alt.split(' ')[1]);
          }
        } else {
          item.preps.forEach((p) => { ok.add(p); ok.add(`${item.adj} ${p}`); });
          (item.notWrong || []).forEach((p) => ok.add(p));
        }
        for (const o of q.options.filter((x) => !x.correct)) {
          assert.ok(!ok.has(o.label), `${item.id} ${f}: «${o.label}» er også riktig`);
          for (const g of item.gaps) {
            for (const p of item.type === 'a' ? [...item.preps, ...(item.notWrong || [])] : []) {
              assert.notEqual(o.label, g.replace('___', p), `${item.id}: riktig setning vist som feil`);
            }
          }
        }
      }
    }
  }
  setRandom(Math.random);
});

test('fritekst: store bokstaver, «to», punktum og alternative svar godtas', () => {
  const q = makeQuestion(itemById('put-off'), 'pTranslate');
  for (const s of ['put off', 'Put off', 'PUT OFF', ' put  off ', 'to put off', 'put off.', 'å put off']) {
    assert.equal(checkTyped(q, s).ok, true, s);
  }
  assert.equal(checkTyped(q, 'put on').ok, false);
  assert.equal(checkTyped(q, 'put of').near, true, 'skrivefeil gir «nesten»');
  assert.equal(checkTyped(q, '').ok, null);

  const care = makeQuestion(itemById('look-after'), 'pTranslate');
  assert.equal(checkTyped(care, 'take care of').ok, true);
  const along = makeQuestion(itemById('get-along'), 'pTranslate');
  assert.equal(checkTyped(along, 'get on').ok, true, 'get on og get along betyr det samme');
  const afraid = makeQuestion(itemById('angry-with'), 'aGapTyped');
  assert.equal(checkTyped(afraid, 'at').ok, true, 'angry at godtas også');
  assert.equal(checkTyped(afraid, 'angry with').ok, true, 'hele uttrykket godtas');
  assert.equal(checkTyped(afraid, 'on').ok, false);
  const past = makeQuestion(itemById('sleep-over'), 'pPastTyped');
  assert.equal(checkTyped(past, 'slept over').ok, true);
  assert.equal(checkTyped(past, 'sleeped over').ok, false);
});

test('hvert fritekst-spørsmål godtar sitt eget fasitsvar', () => {
  seeded(3);
  for (const item of ALL_ITEMS) {
    for (const f of FACTORY_NAMES.filter((k) => fits(k, item))) {
      const q = makeQuestion(item, f);
      if (q.mode !== 'typed') continue;
      for (const a of q.accept) assert.equal(checkTyped(q, a).ok, true, `${item.id} ${f} «${a}»`);
    }
  }
  setRandom(Math.random);
});

test('rundene blander flervalg og fritekst', () => {
  seeded(4);
  let typed = 0;
  let total = 0;
  for (const level of LEVELS) {
    const r = makeRound(level);
    typed += r.filter((q) => q.mode === 'typed').length;
    total += r.length;
  }
  const share = typed / total;
  assert.ok(share > 0.3 && share < 0.6, `andel fritekst ${share}`);
  setRandom(Math.random);
});

test('prøveøving bruker bare pensum og ingen hjelp', () => {
  seeded(5);
  const level = examLevel();
  assert.ok(level.exam);
  for (let n = 0; n < 10; n += 1) {
    for (const q of makeRound(level)) assert.ok(CORE_SETS.includes(itemById(q.item).set), q.item);
  }
  setRandom(Math.random);
});

test('dagens utfordring er fast per dag', () => {
  const a = makeDailyRound('2026-11-09', [1, 2]).round.map(questionKey);
  const b = makeDailyRound('2026-11-09', [1, 2]).round.map(questionKey);
  const c = makeDailyRound('2026-11-10', [1, 2]).round.map(questionKey);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
});

test('mine feil og arkade', () => {
  assert.equal(mistakesLevel({}), null);
  const m = mistakesLevel({ 'put-off': { seen: 4, wrong: 3 }, 'afraid-of': { seen: 5, wrong: 1 } });
  assert.deepEqual(m.itemIds, ['put-off', 'afraid-of']);
  assert.equal(makeRound(m).length, 10);
  for (let n = 0; n < 100; n += 1) {
    assert.equal(quickQuestion([1, 3]).options.length, 4);
    const tf = trueFalse([1, 2, 3, 4]);
    assert.ok(tf.sentence && tf.correct && tf.note);
    if (tf.truth) assert.equal(tf.sentence, tf.correct);
    else assert.notEqual(tf.sentence, tf.correct);
  }
  const cards = memoryCards([1, 2], 6);
  assert.equal(cards.length, 12);
  assert.equal(new Set(cards.filter((c) => c.lang === 'no').map((c) => c.label)).size, 6, 'ingen like norske kort');
});

test('stjerner og normalisering', () => {
  assert.equal(starsFor(7, 10), 2);
  assert.equal(starsFor(14, 15), 3);
  assert.equal(normalize('  To LOOK   after! '), 'look after');
});
