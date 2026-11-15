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
// #52 madde 1: bilim durağı ve yedek, planlayıcının total.consumption.committed mantığıyla aynı olmalı.
function s3Route(o2 = 80) {
  const sc = (min, kcal) => ({ min, kcal, o2_L: kcal / 4.8, dose_uGy: min / 60 * 9 });
  return { dense: [[0, 0], [1000, 0]], total: { consumption: { science: sc(30, 117.1), reserve: sc(30, 117.1), committed: { o2_L: 85 } },
    budget: { limits: { time_min: 360, kcal: 2000, o2_L: o2, dose_uGy: 60, reserve_min: 30 } } },
    segments: [{ len_m: 1000, min: 20, kcal: 86.9, o2_L: 18.1, path_px: [[0, 0], [1000, 0]] }] };
}
test('S3: bilim durağı dönüş payına girer, uygun anda NO-GO', () => {
  const v = createVitals({ assumptions, route: s3Route() });
  v.update(0, [0, 0], [0, 0]);
  assert.equal(v.snapshot().returnMargin.o2_L.toFixed(1), (80 - 48.8).toFixed(1));
  let statusAt = null;
  for (let x = 50; x <= 1000; x += 50) { v.update(60, [x, 0], [x, 0]); if (!statusAt && v.snapshot().status === 'NO-GO') statusAt = x; }
  assert.ok(statusAt && statusAt < 1000, 'varıştan önce NO-GO gelmeli: ' + statusAt);
  assert.equal(v.snapshot().returnPossible, false);
});
test('parametre adı: API /assumptions "Oksijen dönüşümü" sözlüğü okunur', () => {
  const list = [{ name: 'Oksijen dönüşümü', value: { kcal_per_L_o2: 4.8 } }, { name: 'Düz zemin metabolik düzeyi', value: 272 }];
  const v = createVitals({ assumptions: list, route: { dense: [[0, 0]], total: { budget: { limits: { time_min: 360, o2_L: 80, reserve_min: 30 } } } } });
  v.update(60, [0, 0], [0, 0]);
  assert.ok(Math.abs(v.snapshot().o2UsedL - (60 / 4184 * 272) / 4.8) < 1e-9);
});
