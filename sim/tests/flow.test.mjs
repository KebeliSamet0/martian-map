import test from 'node:test';
import assert from 'node:assert/strict';
import { bearingRel, missionSummary, fmtDist } from '../app/flow-logic.js';
import { t, TEXTS } from '../app/i18n.js';
import { readFileSync } from 'node:fs';

test('hedef önde ise göreli açı 0, sağda ise +90°', () => {
  assert.ok(Math.abs(bearingRel(0, 0, 0, 0, -10)) < 1e-9);          // yaw 0: ileri = −z
  assert.ok(Math.abs(bearingRel(0, 0, 0, 10, 0) - Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(bearingRel(0, 0, Math.PI, 0, -10)) > 3.1);     // arkada
});
test('görev özeti yalnız veri alanlarından gelir', () => {
  const coords = { cellToWorld: ([c, r]) => [c * 2, r * 2] };
  const s = missionSummary({ id: 'S1', difficulty: 'kolay', start_px: [0, 0], goal_px: [3, 4], limits: { time_min: 360, o2_L: 420 } }, coords);
  assert.equal(s.straightM, 10); assert.equal(s.timeMin, 360); assert.equal(s.o2L, 420);
  assert.equal(missionSummary({ id: 'X' }, coords).straightM, null);
  assert.equal(fmtDist(null), '—'); assert.equal(fmtDist(550), '550 m'); assert.equal(fmtDist(1500), '1.50 km');
});
test('texts.json ui anahtarlarının hepsi tr ve en taşır', () => {
  const ui = JSON.parse(readFileSync(new URL('../data/texts.json', import.meta.url))).ui;
  const bad = Object.entries(ui).filter(([, v]) => !v.tr || !v.en).map(([k]) => k);
  assert.deepEqual(bad, []);
  assert.ok(Object.keys(ui).length > 100);
});
test('t() ui bölümünden çözer, yoksa anahtarı döndürür, değişkenleri doldurur', () => {
  Object.assign(TEXTS, JSON.parse(readFileSync(new URL('../data/texts.json', import.meta.url))));
  assert.equal(t('intro.start'), 'Görev seç');
  assert.equal(t('risk.o2', { o2: 80 }), 'Oksijen sınırlı: toplam 80 L.');
  assert.equal(t('yok.anahtar'), 'yok.anahtar');
});
