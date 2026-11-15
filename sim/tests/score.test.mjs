import test from 'node:test';
import assert from 'node:assert/strict';
import { missionScore, reserves, decisionQuality, readBest, writeBest } from '../app/score.js';

const limits = { o2_L: 420, reserve_min: 30 };

test('rezerv: O₂ bütçeden, süre dönüş payının yedeğe oranından', () => {
  const r = reserves({ actual: { o2_L: 105, return_margin_min: 45 }, limits });
  assert.equal(Math.round(r.o2 * 100), 75);
  assert.equal(r.time, 1.5);
  assert.deepEqual(reserves({ actual: {}, limits: {} }), { o2: null, time: null });
});

test('karar kalitesi: riski düşüren öneriyi reddetmek kötü, gereksiz riski almamak iyi', () => {
  const q = decisionQuality([
    { accept: true, delta: { risk: -8 } },    // iyi
    { accept: false, delta: { risk: -5 } },   // kötü
    { accept: false, delta: { risk: 3 } },    // iyi
    { accept: true },                          // veri yok
  ]);
  assert.deepEqual(q, { good: 2, bad: 1, unknown: 1, counted: 3 });
});

test('yıldız: her sağlanan ölçüt bir puan, taban 1 yıldız', () => {
  const full = missionScore({ actual: { o2_L: 105, return_margin_min: 45 }, limits, hazardM: 10,
    decisions: [{ accept: true, delta: { risk: -4 } }] });
  assert.equal(full.stars, 3);
  assert.deepEqual(full.counted, ['reserve', 'hazard', 'decision']);

  const poor = missionScore({ actual: { o2_L: 400, return_margin_min: 5 }, limits, hazardM: 180,
    decisions: [{ accept: false, delta: { risk: -9 } }] });
  assert.equal(poor.stars, 1);
  assert.equal(poor.points, 0);
});

test('verisi olmayan ölçüt sayılmaz, ödüle de cezaya da çevrilmez', () => {
  const s = missionScore({ actual: { o2_L: 105, return_margin_min: 45 }, limits });   // hazard ve karar yok
  assert.deepEqual(s.counted, ['reserve']);
  assert.equal(s.stars, 2);
  assert.equal(s.criteria.find((c) => c.key === 'hazard').ok, null);
});

test('mini hedef bonusu: üçü birden tamamlanınca bir yıldız, üçü zaten varsa etkisiz', () => {
  const base = { actual: { o2_L: 400, return_margin_min: 8 }, limits, hazardM: 180, decisions: [{ accept: false, delta: { risk: -9 } }] };
  assert.equal(missionScore(base).stars, 1);
  assert.equal(missionScore({ ...base, bonus: 2 }).stars, 1);
  const bonused = missionScore({ ...base, bonus: 4 });
  assert.equal(bonused.stars, 2);
  assert.equal(bonused.bonusUsed, true);
  const full = missionScore({ actual: { o2_L: 105, return_margin_min: 45 }, limits, hazardM: 10,
    decisions: [{ accept: true, delta: { risk: -4 } }], bonus: 4 });
  assert.equal(full.stars, 3);
  assert.equal(full.bonusUsed, false);   // zaten 3 yıldız: bonus eklenmez
});

test('tamamlanmamış görev 0 yıldız', () => {
  assert.equal(missionScore({ actual: { o2_L: 1, return_margin_min: 99 }, limits, completed: false }).stars, 0);
});

test('kişisel en iyi: daha çok yıldız, eşitlikte daha çok kalan O₂', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  assert.equal(readBest('S1', storage), null);
  writeBest('S1', { stars: 2, o2Left: 100 }, storage);
  writeBest('S1', { stars: 1, o2Left: 400 }, storage);            // daha az yıldız: yazılmaz
  assert.equal(readBest('S1', storage).stars, 2);
  writeBest('S1', { stars: 2, o2Left: 200 }, storage);            // eşit yıldız, daha çok O₂
  assert.equal(readBest('S1', storage).o2Left, 200);
  writeBest('S1', { stars: 3, o2Left: 10 }, storage);
  assert.equal(readBest('S1', storage).stars, 3);
});

test('depolama kapalıysa oyun etkilenmez', () => {
  const dead = { getItem() { throw new Error('kapalı'); }, setItem() { throw new Error('kapalı'); } };
  assert.equal(readBest('S1', dead), null);
  assert.equal(writeBest('S1', { stars: 3 }, dead), null);
});
