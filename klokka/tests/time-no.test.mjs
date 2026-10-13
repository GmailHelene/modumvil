import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  phrase, digital, partOfDay, zoneOf, durationText, addMinutes, fromDial, toDial, explain,
} from '../js/time-no.js';
import {
  LEVELS, buildOptions, makeRound, makeQuestion, repeatOf, checkSet, starsFor, setRandom,
  makeLightningQuestion, ROUND_LENGTH,
} from '../js/game.js';

test('hele og halve', () => {
  assert.equal(phrase(3, 0), 'tre');
  assert.equal(phrase(1, 0), 'ett');
  assert.equal(phrase(0, 0), 'tolv');
  assert.equal(phrase(2, 30), 'halv tre');
  assert.equal(phrase(11, 30), 'halv tolv');
  assert.equal(phrase(0, 30), 'halv ett');
  assert.equal(phrase(12, 30), 'halv ett');
});

test('kvart', () => {
  assert.equal(phrase(2, 15), 'kvart over to');
  assert.equal(phrase(2, 45), 'kvart på tre');
  assert.equal(phrase(11, 45), 'kvart på tolv');
  assert.equal(phrase(12, 45), 'kvart på ett');
});

test('fem-minutter følger skolekonvensjonen', () => {
  const expected = {
    5: 'fem over to',
    10: 'ti over to',
    20: 'ti på halv tre',
    25: 'fem på halv tre',
    35: 'fem over halv tre',
    40: 'ti over halv tre',
    50: 'ti på tre',
    55: 'fem på tre',
  };
  for (const [m, text] of Object.entries(expected)) {
    assert.equal(phrase(2, Number(m)), text, `2:${m}`);
  }
});

test('enkeltminutter', () => {
  assert.equal(phrase(2, 1), 'ett minutt over to');
  assert.equal(phrase(2, 17), 'sytten minutter over to');
  assert.equal(phrase(2, 19), 'nitten minutter over to');
  assert.equal(phrase(2, 23), 'sju minutter på halv tre');
  assert.equal(phrase(2, 29), 'ett minutt på halv tre');
  assert.equal(phrase(2, 31), 'ett minutt over halv tre');
  assert.equal(phrase(2, 38), 'åtte minutter over halv tre');
  assert.equal(phrase(2, 41), 'nitten minutter på tre');
  assert.equal(phrase(2, 59), 'ett minutt på tre');
});

test('every minute of the dial produces a phrase', () => {
  for (let t = 0; t < 720; t += 1) {
    const { h, m } = fromDial(t);
    const p = phrase(h, m);
    assert.ok(p.length > 0);
    assert.doesNotMatch(p, /undefined|null|tjue/);
    assert.equal(toDial(h, m), t);
    assert.ok(explain(h, m).length >= 2);
  }
});

test('digital og døgn', () => {
  assert.equal(digital(14, 5), '14:05');
  assert.equal(digital(0, 0, false), '12:00');
  assert.equal(digital(14, 5, false), '2:05');
  assert.equal(partOfDay(7), 'om morgenen');
  assert.equal(partOfDay(15), 'om ettermiddagen');
  assert.equal(partOfDay(20), 'om kvelden');
  assert.equal(partOfDay(2), 'om natta');
});

test('soner', () => {
  assert.equal(zoneOf(0), 'hel');
  assert.equal(zoneOf(30), 'halv');
  assert.equal(zoneOf(45), 'kvart');
  assert.equal(zoneOf(12), 'over');
  assert.equal(zoneOf(20), 'paHalv');
  assert.equal(zoneOf(40), 'overHalv');
  assert.equal(zoneOf(41), 'pa');
});

test('varighet og tidsregning', () => {
  assert.equal(durationText(75), '1 time og 15 minutter');
  assert.equal(durationText(120), '2 timer');
  assert.equal(durationText(1), '1 minutt');
  assert.deepEqual(addMinutes(11, 50, 20), { h: 12, m: 10 });
  assert.deepEqual(addMinutes(23, 50, 20), { h: 0, m: 10 });
});

test('svaralternativer: fire unike, nøyaktig ett riktig', () => {
  for (let t = 0; t < 720; t += 1) {
    const { h, m } = fromDial(t);
    for (const format of ['words', 'digital']) {
      const opts = buildOptions(h, m, format, 1);
      assert.equal(opts.length, 4);
      assert.equal(new Set(opts.map((o) => o.label)).size, 4, `${h}:${m} ${format}`);
      assert.equal(opts.filter((o) => o.correct).length, 1);
    }
  }
});

test('halv-fella er alltid med som feilsvar', () => {
  // 2:30 -> «halv tre» riktig, «halv fire» (lest som 3:30) skal være et alternativ.
  const labels = buildOptions(2, 30, 'words').map((o) => o.label);
  assert.ok(labels.includes('halv tre'));
  assert.ok(labels.includes('halv fire'));
});

test('runder og spørsmål for alle nivåer', () => {
  let seed = 42;
  setRandom(() => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  });
  for (const level of LEVELS) {
    for (let i = 0; i < 30; i += 1) {
      const round = makeRound(level);
      assert.equal(round.length, ROUND_LENGTH, `nivå ${level.id}`);
      for (const q of round) {
        assert.ok(q.prompt, 'prompt');
        assert.ok(q.explain.length > 0, 'explain');
        if (q.kind === 'read') {
          assert.equal(q.options.length, 4, `nivå ${level.id} ${q.factory}`);
          assert.equal(new Set(q.options.map((o) => o.label)).size, 4, `${q.factory} ${q.h}:${q.m}`);
          assert.equal(q.options.filter((o) => o.correct).length, 1);
        } else {
          assert.ok(q.target);
          assert.ok(checkSet(q, toDial(q.h, q.m)));
          assert.ok(!checkSet(q, toDial(q.h, q.m) + 5));
        }
        const r = repeatOf(q, level);
        if (r) {
          assert.equal(r.m, q.m);
          assert.equal(r.h, q.h);
          assert.notEqual(r.kind, q.kind);
        }
      }
    }
  }
  for (let i = 0; i < 200; i += 1) {
    const q = makeLightningQuestion([1, 2, 3, 4, 5, 6, 7]);
    assert.equal(q.kind, 'read');
    assert.equal(q.options.length, 4);
  }
  setRandom(Math.random);
});

test('stjerner', () => {
  assert.equal(starsFor(4), 0);
  assert.equal(starsFor(5), 1);
  assert.equal(starsFor(8), 2);
  assert.equal(starsFor(10), 3);
});

test('24-timers spørsmål gir riktig digitaltid', () => {
  const q = makeQuestion({ ...LEVELS[5], forceH: 15, minutes: [45] }, {}, 'read24');
  assert.equal(q.options.find((o) => o.correct).label, '15:45');
});
