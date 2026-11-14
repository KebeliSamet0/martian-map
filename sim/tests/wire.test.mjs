import test from 'node:test';
import assert from 'node:assert/strict';
import { hudSnapshot, missionDefinition, walkPlan, uiTexts } from '../app/wire-adapters.js';
test('HUD tüketimi ve limitleri birimleriyle eşlenir', () => {
  const h = hudSnapshot({ elapsedSec: 120, o2UsedL: 5, kcal: 24, doseUGy: 1, loadKg: 18, returnMargin: { time_min: 99 }, status: 'GO' }, { time_min: 360, o2_L: 80 });
  assert.equal(h.elapsed_min, 2); assert.equal(h.o2_L, 5); assert.equal(h.o2_limit_L, 80); assert.equal(h.load_kg, 18);
});
test('karne gidiş-dönüş toplamını tek yön gerçekleşen ile karıştırmaz', () => {
  const p = walkPlan({ min: 10, eva_min: 50, kcal: 100, eva_kcal: 200, o2_L: 40, dose_uGy: 5 });
  assert.equal(p.eva_min, 10); assert.equal(p.eva_kcal, 100); assert.equal(p.o2_L, 20); assert.equal(p.dose_uGy, 1);
  assert.equal(walkPlan({ min: 3 }).o2_L, null);
});
test('görev kumu ve 10 m varış yarıçapı veri kaynağından bağlanır', () => {
  const def = missionDefinition({ id: 'S1', sand: { px: [4,5], radius_m: 19.4 } }, { dense: [[0,0],[100,100]] });
  assert.equal(def.goal.radius_m, 10); assert.deepEqual(def.events[0].grid_px, [4,5]); assert.equal(def.events[0].radius_m, 19.4);
  assert.equal(uiTexts({ alerts: { sand: 'kum' } })['alert.sand.body'], 'kum');
});
