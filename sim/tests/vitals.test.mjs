import test from 'node:test';
import assert from 'node:assert/strict';
import { createVitals } from '../app/vitals.js';
const assumptions = { BODY_KG: 80, SUIT_KG: 120, TOOLS_KG: 10, FLAT_REFERENCE_W: 272, KCAL_PER_L_O2: 4.8, DOSE_UGY_PER_H: 9 };
const route = { dense: [[0, 0], [100, 0]], total: { budget: { limits: { time_min: 360, kcal: 2000, o2_L: 420, dose_uGy: 60, reserve_min: 30 } } }, segments: [{ len_m: 100, min: 2, kcal: 20, path_px: [[0, 0], [50, 0]] }] };
function make(extra = {}) { const v = createVitals({ assumptions, route, ...extra }); v.update(0, [0, 0], [0, 0]); return v; }
test('iz birikimi, durak, yük ve yeniden planlama', () => {
  const v = make(); v.update(10, [10, 0], [5, 0]);
  assert.equal(v.snapshot().kcal, 2); assert.equal(v.snapshot().distanceM, 10);
  assert.equal(v.snapshot().source, 'segments'); assert.equal(v.snapshot().status, 'GO');
  v.addLoad(21); v.setRoute(route); v.update(10, [20, 0], [10, 0]);
  assert.equal(v.snapshot().kcal, 4.2); assert.equal(v.snapshot().loadKg, 31);
  v.update(10, [20, 0]); assert.ok(v.snapshot().kcal > 4.2);
  assert.equal(v.snapshot().elapsedSec, 30);
});
test('eşitlik aşım değildir, ilk limit tek kez gönderilir', () => {
  const r = structuredClone(route); r.total.budget.limits.kcal = 2;
  const v = make({ route: r }); let events = 0; v.on('limit', () => events++);
  v.update(10, [10, 0]); assert.equal(events, 0);
  v.update(10, [20, 0]); v.update(10, [30, 0]);
  assert.equal(events, 1); assert.equal(v.snapshot().firstLimit.resource, 'kcal');
  assert.equal(v.snapshot().status, 'NO-GO');
});
test('API artışı yerel tahmini değiştirir, sonraki kare korunur', async () => {
  let resolve; const v = make({ api: { step: () => new Promise(r => { resolve = r; }) } });
  v.update(3, [10, 0], [5, 0]); v.update(1, [20, 0], [10, 0]);
  resolve({ delta: { kcal: 3, o2_L: 0.5, dose_uGy: 0.01 } });
  await new Promise(r => setImmediate(r));
  assert.equal(v.snapshot().kcal, 5); assert.equal(v.snapshot().source, 'api-step');
});
test('API yokluğu ve bilinmeyen değerler güvenli yedeğe düşer', async () => {
  const v = make({ api: { step: async () => { throw new Error('404'); } } });
  v.update(3, [10, 0], [5, 0]); await v.flush(); assert.equal(v.snapshot().kcal, 2);
  assert.equal(v.snapshot().source, 'segments');
  const unknown = createVitals(); unknown.update(2, [0, 0]);
  assert.equal(unknown.snapshot().kcal, null); assert.equal(unknown.snapshot().status, 'DİKKAT');
});
test('API eksik yerel parametrelerin tüketimini tamamlar', async () => {
  const v = createVitals({ api: { step: async () => ({ delta: { kcal: 1, o2_L: 2, dose_uGy: 3 } }) } });
  v.update(3, [0, 0], [0, 0]); await v.flush(); assert.equal(v.snapshot().kcal, 1);
});
test('varış bir kez, snapshot dışarıdan değiştirilemez', () => {
  const v = make(); let n = 0; v.on('arrived', () => n++);
  v.update(100, [100, 0]); v.update(1, [100, 0]); assert.equal(n, 1);
  assert.throws(() => v.addLoad(-1)); assert.throws(() => v.update(NaN, [0, 0]));
});
