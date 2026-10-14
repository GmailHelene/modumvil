import { test } from 'node:test';
import assert from 'node:assert/strict';
import { phrase, fromDial, pad, digital, durationText } from '../js/time-no.js';
import {
  parseDigital, parseWords, parseTime, parseDuration, checkTyped, wordNumber,
} from '../js/answers.js';
import { LEVELS } from '../js/levels.js';
import { makeRound, setRandom, mulberry32, typedShare } from '../js/game.js';

const q = (input) => ({ input });

test('digitale skrivemåter: 9 og 09 er like godt', () => {
  for (const s of ['9', '09', '9:00', '09:00', '9.00', '900', '0900', '9 00', 'kl 9', 'kl. 09:00']) {
    assert.deepEqual(parseDigital(s), { h: 9, m: 0 }, s);
  }
  for (const s of ['9:05', '09:05', '9.05', '9,05', '905', '0905', '9 05', '9-05']) {
    assert.deepEqual(parseDigital(s), { h: 9, m: 5 }, s);
  }
  assert.deepEqual(parseDigital('21:45'), { h: 21, m: 45 });
  assert.deepEqual(parseDigital('00:30'), { h: 0, m: 30 });
  assert.equal(parseDigital('9:75'), null);
  assert.equal(parseDigital('25:00'), null);
  assert.equal(parseDigital('fem'), null);
});

test('ord: alle riktige norske formuleringer forstås', () => {
  const cases = {
    'fem over ni': [9, 5],
    '5 over 9': [9, 5],
    'Klokka er fem minutter over ni!': [9, 5],
    'halv tre': [2, 30],
    'Halv 3': [2, 30],
    'kvart over to': [2, 15],
    'kvart på tre': [2, 45],
    'kvart pa tre': [2, 45],
    'ti på halv tre': [2, 20],
    'fem over halv tre': [2, 35],
    'tjue over ni': [9, 20],
    'tjue på ti': [9, 40],
    'sytten minutter over to': [2, 17],
    'ett minutt på tre': [2, 59],
    'en på tre': [2, 59],
    syv: [7, 0],
    tolv: [0, 0],
    'halv ett': [0, 30],
    'åtte': [8, 0],
    'atte': [8, 0],
    'tjuefem over fire': [4, 25],
    'tretti over ni': [9, 30],
  };
  for (const [s, [h, m]] of Object.entries(cases)) {
    assert.deepEqual(parseWords(s), { h, m }, s);
  }
  for (const s of ['tre over', 'hei', 'halv', 'over halv tre', 'tretti over halv ni']) {
    assert.equal(parseWords(s), null, s);
  }
});

test('hver eneste klokketid kan skrives både digitalt og med ord', () => {
  for (let t = 0; t < 720; t += 1) {
    const { h, m } = fromDial(t);
    const input = { mode: 'time', h, m };
    const hDisp = h === 0 ? 12 : h;
    for (const ans of [phrase(h, m), `klokka er ${phrase(h, m)}`, `${hDisp}:${pad(m)}`, `${pad(hDisp)}:${pad(m)}`,
      `${pad(hDisp)}${pad(m)}`, `${hDisp}.${pad(m)}`, `${h + 12}:${pad(m)}`]) {
      assert.equal(checkTyped(q(input), ans).ok, true, `${h}:${m} <- «${ans}»`);
    }
    // A close miss is wrong, not "not understood".
    const wrong = fromDial(t + 5);
    assert.equal(checkTyped(q(input), phrase(wrong.h, wrong.m)).ok, false);
  }
});

test('halv-fella blir vurdert riktig', () => {
  const input = { mode: 'time', h: 2, m: 30 };
  assert.equal(checkTyped(q(input), 'halv tre').ok, true);
  assert.equal(checkTyped(q(input), 'halv to').ok, false);
  assert.equal(checkTyped(q(input), '2:30').ok, true);
  assert.equal(checkTyped(q(input), '3:30').ok, false);
});

test('24-timers svar må ha riktig del av døgnet, men 09 = 9', () => {
  const morning = { mode: 'time24', h: 9, m: 45 };
  assert.equal(checkTyped(q(morning), '9:45').ok, true);
  assert.equal(checkTyped(q(morning), '09:45').ok, true);
  assert.equal(checkTyped(q(morning), '0945').ok, true);
  assert.equal(checkTyped(q(morning), '21:45').ok, false);
  const evening = { mode: 'time24', h: 21, m: 45 };
  assert.equal(checkTyped(q(evening), '21.45').ok, true);
  assert.equal(checkTyped(q(evening), '9:45').ok, false);
  assert.equal(checkTyped(q(evening), 'kvart på ti').ok, null, 'ord gir hint, ikke feil');
});

test('varighet i mange former', () => {
  const cases = {
    25: 25, '25 min': 25, '25 minutter': 25, tjuefem: 25, '1 time og 10 minutter': 70, '1t 10m': 70,
    '1:10': 70, 70: 70, 'et kvarter': 15, 'tre kvarter': 45, 'en halv time': 30, 'halvannen time': 90,
    'en time': 60, 'to timer': 120, '2 timer': 120,
  };
  for (const [s, v] of Object.entries(cases)) assert.equal(parseDuration(String(s)), v, s);
  assert.equal(parseDuration('masse'), null);
  for (let d = 5; d <= 180; d += 5) {
    assert.equal(checkTyped(q({ mode: 'duration', minutes: d }), durationText(d)).ok, true, durationText(d));
    assert.equal(checkTyped(q({ mode: 'duration', minutes: d }), String(d)).ok, true);
  }
});

test('tomt eller uforståelig svar gir hint, ikke feil', () => {
  assert.equal(checkTyped(q({ mode: 'time', h: 3, m: 0 }), '').ok, null);
  assert.equal(checkTyped(q({ mode: 'time', h: 3, m: 0 }), 'vet ikke').ok, null);
  assert.ok(checkTyped(q({ mode: 'time', h: 3, m: 0 }), 'vet ikke').hint);
});

test('tallord', () => {
  assert.equal(wordNumber('tjuefem'), 25);
  assert.equal(wordNumber('nitten'), 19);
  assert.equal(wordNumber('kvart'), 15);
  assert.equal(wordNumber('07'), 7);
  assert.equal(wordNumber('hund'), null);
});

test('rundene blander flervalg og fritekst, og riktig svar godtas', () => {
  setRandom(mulberry32(99));
  let typed = 0;
  let choice = 0;
  for (const level of LEVELS) {
    for (let i = 0; i < 15; i += 1) {
      const round = makeRound(level);
      const reads = round.filter((x) => x.kind === 'read');
      const t = reads.filter((x) => x.typed);
      assert.equal(t.length, Math.round(reads.length * typedShare(level)), level.id);
      typed += t.length;
      choice += reads.length - t.length;
      for (const x of t) {
        assert.equal(x.options, null);
        assert.ok(x.input);
        let ans;
        if (x.input.mode === 'duration') ans = String(x.input.minutes);
        else if (x.input.mode === 'time24') ans = digital(x.input.h, x.input.m, true);
        else ans = phrase(x.input.h, x.input.m);
        assert.equal(checkTyped(x, ans).ok, true, `${level.id} ${x.factory} «${ans}»`);
      }
    }
  }
  assert.ok(typed > 0 && choice > 0);
  const share = typed / (typed + choice);
  assert.ok(share > 0.35 && share < 0.5, `andel fritekst ${share}`);
  setRandom(Math.random);
});

void parseTime;
