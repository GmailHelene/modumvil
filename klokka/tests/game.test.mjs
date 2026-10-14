import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toDial } from '../js/time-no.js';
import {
  WORLDS, LEVELS, levelById, nextLevel, starsFor, starLimits,
} from '../js/levels.js';
import {
  makeRound, makeQuestion, repeatOf, checkSet, setRandom, questionKey, makeDailyRound,
  trueFalseQuestion, pickClockQuestion, memoryCards, orderSet, survivalQuestion, arcadeQuestion,
  FACTORY_NAMES, mulberry32,
} from '../js/game.js';
import {
  state, isUnlocked, unlockedIds, rememberQuestions, recordArcade, markPlayedToday, reset,
} from '../js/store.js';
import { BADGES, checkBadges, CATEGORIES } from '../js/badges.js';
import { THEMES, FACES } from '../js/themes.js';
import { ARCADE, ARCADE_TIERS } from '../js/arcade-data.js';
import { LESSONS } from '../js/content.js';

const seeded = (seed) => setRandom(mulberry32(seed));
const ALL_IDS = LEVELS.map((l) => l.id);

test('6 verdener med 6 nivåer, unike id-er, boss sist', () => {
  assert.equal(WORLDS.length, 6);
  assert.equal(LEVELS.length, 36);
  assert.equal(new Set(ALL_IDS).size, 36);
  for (const w of WORLDS) {
    assert.equal(w.levels.length, 6);
    assert.ok(w.levels[5].boss, `${w.name} mangler boss`);
    assert.equal(w.levels.filter((l) => l.boss).length, 1);
  }
  for (const l of LEVELS) {
    for (const k of l.kinds) assert.ok(FACTORY_NAMES.includes(k), `${l.id}: ukjent type ${k}`);
    assert.ok(['arabic', 'roman', 'quarters', 'none'].includes(l.numbers));
    assert.ok(l.intro.length > 20);
  }
  assert.equal(levelById('3-4').title, 'Alle femminutter');
  assert.equal(nextLevel(levelById('1-6')).id, '2-1');
  assert.equal(nextLevel(levelById('6-6')), null);
});

test('stjernegrenser', () => {
  assert.deepEqual(starLimits(10), [5, 7, 9]);
  assert.deepEqual(starLimits(12), [6, 9, 11]);
  assert.equal(starsFor(4, 10), 0);
  assert.equal(starsFor(7, 10), 2);
  assert.equal(starsFor(12, 12), 3);
});

test('alle nivåer lager gyldige runder', () => {
  seeded(7);
  for (const level of LEVELS) {
    for (let i = 0; i < 25; i += 1) {
      const round = makeRound(level);
      assert.equal(round.length, level.length, `nivå ${level.id}`);
      for (const q of round) {
        assert.ok(q.prompt, 'prompt');
        assert.ok(q.explain.length > 0, 'explain');
        assert.doesNotMatch(q.prompt + q.explain.join(' '), /undefined|NaN|\{n\}/);
        if (q.kind === 'read' && q.typed) {
          assert.ok(q.input, `${level.id} ${q.factory} mangler input`);
        } else if (q.kind === 'read') {
          assert.equal(q.options.length, 4, `${level.id} ${q.factory}`);
          assert.equal(new Set(q.options.map((o) => o.label)).size, 4, `${level.id} ${q.factory} ${q.h}:${q.m}`);
          assert.equal(q.options.filter((o) => o.correct).length, 1);
        } else {
          assert.ok(checkSet(q, toDial(q.h, q.m)));
          assert.ok(!checkSet(q, toDial(q.h, q.m) + 1));
        }
        if (level.hours && Array.isArray(level.hours)) assert.ok(level.hours.includes(q.h), `${level.id} time ${q.h}`);
        const r = repeatOf(q, level);
        if (r) {
          assert.equal(r.m, q.m);
          assert.equal(r.h, q.h);
          assert.notEqual(r.kind, q.kind);
        }
      }
    }
  }
  setRandom(Math.random);
});

test('minuttene holder seg innenfor nivået', () => {
  seeded(11);
  const over = levelById('4-1');
  for (let i = 0; i < 200; i += 1) {
    const q = makeQuestion(over);
    assert.ok(q.m >= 1 && q.m <= 19, `4-1 ga ${q.m}`);
  }
  setRandom(Math.random);
});

test('variasjon: ny runde unngår nylig brukte oppgaver', () => {
  seeded(3);
  const level = levelById('3-4'); // 12 minutter x 12 timer x 4 typer
  const first = makeRound(level);
  const recent = first.map(questionKey);
  const second = makeRound(level, {}, recent);
  const overlap = second.filter((q) => recent.includes(questionKey(q))).length;
  assert.equal(overlap, 0);
  setRandom(Math.random);
});

test('dagens utfordring er lik for samme dag og ulik neste dag', () => {
  const a = makeDailyRound('2026-10-13', ['1-1']).round.map(questionKey);
  const b = makeDailyRound('2026-10-13', ['1-1']).round.map(questionKey);
  const c = makeDailyRound('2026-10-14', ['1-1']).round.map(questionKey);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.equal(a.length, 10);
});

test('arkade-oppgaver', () => {
  seeded(5);
  for (const ids of [['1-1'], ALL_IDS]) {
    for (let i = 0; i < 150; i += 1) {
      const tf = trueFalseQuestion(ids);
      assert.equal(typeof tf.truth, 'boolean');
      assert.ok(tf.statement.length > 0);
      const pc = pickClockQuestion(ids);
      assert.equal(pc.clocks.length, 4);
      assert.equal(pc.clocks.filter((c) => c.correct).length, 1);
      assert.equal(new Set(pc.clocks.map((c) => toDial(c.h, c.m))).size, 4);
      const q = arcadeQuestion(ids);
      assert.equal(q.options.length, 4);
    }
    const cards = memoryCards(ids, 6);
    assert.equal(cards.length, 12);
    for (let p = 0; p < 6; p += 1) assert.equal(cards.filter((c) => c.pair === p).length, 2);
    const ord = orderSet(ids, 4);
    assert.equal(new Set(ord.map((t) => t.total)).size, 4);
    assert.ok(Math.max(...ord.map((t) => t.total)) - Math.min(...ord.map((t) => t.total)) < 180);
  }
  for (let s = 0; s < 60; s += 1) assert.equal(survivalQuestion(s).options.length, 4);
  assert.equal(ARCADE.length, 7);
  assert.equal(ARCADE_TIERS.length, 7);
  setRandom(Math.random);
});

test('merker: unike id-er, gyldige kategorier, minst 60', () => {
  assert.ok(BADGES.length >= 60, `bare ${BADGES.length}`);
  assert.equal(new Set(BADGES.map((b) => b.id)).size, BADGES.length);
  for (const b of BADGES) {
    assert.ok(CATEGORIES.includes(b.cat), b.id);
    assert.ok(b.goal > 0);
    assert.equal(typeof b.value(), 'number', b.id);
  }
  assert.deepEqual(checkBadges(), []); // fresh state earns nothing
});

test('opplåsing og merker følger fremgangen', () => {
  reset();
  assert.ok(isUnlocked(levelById('1-1')));
  assert.ok(!isUnlocked(levelById('1-2')));
  state.stars['1-1'] = 2;
  assert.ok(isUnlocked(levelById('1-2')));
  state.stars['1-5'] = 3;
  assert.ok(!isUnlocked(levelById('2-1')), 'ny verden krever bossen');
  state.stars['1-6'] = 1;
  assert.ok(isUnlocked(levelById('2-1')));
  assert.ok(unlockedIds().includes('2-1'));

  state.totals.correct = 120;
  state.bestStreak = 12;
  recordArcade('lyn', 21);
  const ids = checkBadges().map((b) => b.id);
  for (const id of ['forste', 'svar10', 'svar50', 'svar100', 'rekke5', 'rekke10', 'verden1', 'lyn1', 'lyn2']) {
    assert.ok(ids.includes(id), `mangler ${id}`);
  }
  assert.ok(!ids.includes('lyn3'));
  assert.ok(recordArcade('memory', 50, true));
  assert.ok(!recordArcade('memory', 70, true), 'høyere tid er ikke rekord');
  assert.equal(state.arcade.memory.best, 50);
});

test('nullstilling beholder nylige oppgaver, så det blir variasjon', () => {
  rememberQuestions(['a', 'b', 'c']);
  state.xp = 500;
  reset();
  assert.equal(state.xp, 0);
  assert.deepEqual(state.recent.slice(-3), ['a', 'b', 'c']);
});

test('dager på rad', () => {
  reset();
  markPlayedToday(new Date(2026, 9, 10, 12));
  markPlayedToday(new Date(2026, 9, 11, 22));
  markPlayedToday(new Date(2026, 9, 12, 6));
  assert.equal(state.days.count, 3);
  assert.equal(state.days.best, 3);
  assert.ok(state.flags.nightOwl);
  assert.ok(state.flags.earlyBird);
  markPlayedToday(new Date(2026, 9, 15, 12));
  assert.equal(state.days.count, 1);
  assert.equal(state.days.best, 3);
});

test('stiler og leksjoner', () => {
  reset();
  assert.equal(THEMES.length, 10);
  assert.equal(FACES.length, 8);
  assert.equal(new Set(THEMES.map((t) => t.id)).size, THEMES.length);
  const x = { worldDone: () => false, stars: () => 0, badgeCount: () => 0 };
  assert.equal(THEMES.filter((t) => t.need(state, x)).length, 2);
  assert.equal(FACES.filter((f) => f.need(state, x)).length, 2);
  assert.ok(LESSONS.length >= 10);
});
