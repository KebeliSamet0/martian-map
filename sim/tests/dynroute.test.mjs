import test from 'node:test';
import assert from 'node:assert/strict';
import { distToPolyline, remainingBudget, oneWay, deltaOf, createDynRoute, DEVIATION_M, DEVIATION_HOLD_S, RESERVE_FRAC, RETURN_NEAR, COOLDOWN_S } from '../app/dynroute.js';

const line = [[0, 0], [100, 0], [200, 0]];
const total = (km, kcal, o2, min = 5) => ({ km, consumption: { outbound: { min, kcal, o2_L: o2, dose_uGy: 1 } }, go: true });
const R = (km, kcal, o2) => ({ kind: 'balanced', total: total(km, kcal, o2) });

test('distToPolyline: en yakın nokta ve segment', () => {
  const r = distToPolyline([50, 12], line);
  assert.equal(Math.round(r.dist), 12); assert.equal(r.idx, 0); assert.deepEqual(r.point, [50, 0]);
  assert.equal(distToPolyline([250, 0], line).dist, 50);
});

test('remainingBudget: limit − kullanılan, oranlar; bilinmeyen null', () => {
  const r = remainingBudget({ time_min: 360, o2_L: 420, kcal: 2000, dose_uGy: 60 }, { elapsedSec: 3600, o2UsedL: 120, kcal: 500, doseUGy: 6 });
  assert.equal(r.time_min, 300); assert.equal(r.o2_L, 300); assert.equal(r.kcal, 1500); assert.equal(Math.round(r.fracO2 * 1000), 714);
  assert.equal(remainingBudget({ o2_L: 420 }, {}).o2_L, null);
  assert.equal(remainingBudget({ o2_L: 420 }, { o2RemainingL: 100 }).o2_L, 100);
});

test('oneWay ve deltaOf yalnız API alanlarından', () => {
  const a = oneWay(total(0.5, 80, 17)), b = oneWay(total(0.62, 95, 21));
  assert.deepEqual(deltaOf(b, a), { m: 120, kcal: 15, o2_L: 4, risk: null });
  assert.equal(oneWay({}).kcal, null); assert.equal(deltaOf(oneWay({}), a).kcal, null);
});

function setup(over = {}) {
  const calls = [], proposals = [];
  const c = { route: { dense: line, goalPx: [9, 9], kind: 'balanced' }, pos: [50, 0], px: [25, 0], progressM: 50, limits: { time_min: 360, o2_L: 420 },
    snap: { elapsedSec: 0, o2RemainingL: 420 }, basePx: [1, 1], worldToPx: ([x, z]) => [x / 2, z / 2], ...over };
  const call = async (path, body) => { calls.push({ path, body }); return { routes: [R(0.2, 30, 6)] }; };
  const dyn = createDynRoute({ call, ctx: () => c, propose: async (d) => { proposals.push(d); return { accept: false }; }, apply() {} });
  return { dyn, c, calls, proposals };
}
const tick = async (dyn, secs, step = 1, t0 = 0) => { let n = t0; for (let i = 0; i < secs; i += step) { n += step; dyn.update(step, n); await new Promise((r) => setImmediate(r)); } return n; };

test('sapma: 15 m içinde öneri yok; 15 m dışında 5 sn kalınca bir kez, tek istek grubu', async () => {
  const s = setup(); s.c.pos = [50, DEVIATION_M - 1]; await tick(s.dyn, 20);
  assert.equal(s.calls.length, 0);
  s.c.pos = [50, DEVIATION_M + 5]; const n = await tick(s.dyn, DEVIATION_HOLD_S - 1);
  assert.equal(s.calls.length, 0, 'hold süresi dolmadan istek yok');
  await tick(s.dyn, 3, 1, n); await new Promise((r) => setTimeout(r, 20));
  assert.equal(s.calls.length, 3, 'yeni rota + geri dön + kalan = 3 /route');
  assert.equal(s.proposals.length, 1); assert.equal(s.proposals[0].reason, 'deviation'); assert.equal(s.proposals[0].urgent, false);
  assert.ok(s.calls.every((x) => x.path === '/route'));
});

test('sapma: soğuma süresi içinde ikinci öneri yok; geri dönünce sayaç sıfırlanır', async () => {
  const s = setup(); s.c.pos = [50, 40]; let n = await tick(s.dyn, 8); await new Promise((r) => setTimeout(r, 20));
  assert.equal(s.proposals.length, 1);
  n = await tick(s.dyn, 10, 1, n); assert.equal(s.proposals.length, 1, `soğuma ${COOLDOWN_S} sn`);
  s.c.pos = [50, 2]; n = await tick(s.dyn, 3, 1, n); s.c.pos = [50, 40]; n = await tick(s.dyn, 3, 1, n);
  assert.equal(s.proposals.length, 1, 'sayaç sıfırlandı, hold dolmadı');
});

test('rezerv: O₂ payı %40 altına inince üsse dönüş planı bir kez; kalan bütçe /route budget', async () => {
  const s = setup(); s.c.snap = { elapsedSec: 0, o2RemainingL: 420 * RESERVE_FRAC + 1 }; await tick(s.dyn, 3);
  assert.equal(s.calls.length, 0);
  s.c.snap = { elapsedSec: 0, o2RemainingL: 420 * RESERVE_FRAC - 1 }; await tick(s.dyn, 2); await new Promise((r) => setTimeout(r, 20));
  assert.equal(s.calls.length, 1); assert.deepEqual(s.calls[0].body.goal, [1, 1]); assert.ok(s.calls[0].body.budget.o2_L < 420 * RESERVE_FRAC);
  assert.equal(s.proposals[0].reason, 'reserve');
  await tick(s.dyn, 5, 1, 100); assert.equal(s.proposals.length, 1, 'bir kez');
});

test('rezerv: dönüş maliyeti kalan bütçenin %80’ine yaklaşırsa urgent (dönüşü olmayan nokta)', async () => {
  const s = setup(); s.c.snap = { elapsedSec: 0, o2RemainingL: 50 };    // %11.9 kaldı
  const call = async () => ({ routes: [{ kind: 'safest', total: total(1, 100, 50 * RETURN_NEAR + 1) }] });
  const props = []; const dyn = createDynRoute({ call, ctx: () => s.c, propose: async (d) => { props.push(d); return null; }, apply() {} });
  await tick(dyn, 2); await new Promise((r) => setTimeout(r, 20));
  assert.equal(props[0].urgent, true);
  const props2 = []; const dyn2 = createDynRoute({ call: async () => ({ routes: [{ kind: 'safest', total: total(1, 100, 10) }] }), ctx: () => s.c, propose: async (d) => { props2.push(d); return null; }, apply() {} });
  await tick(dyn2, 2); await new Promise((r) => setTimeout(r, 20)); assert.equal(props2[0].urgent, false);
});

test('API hatası: öneri yok, hata yutulur (uydurma yok)', async () => {
  const props = []; const notes = [];
  const dyn = createDynRoute({ call: async () => { throw new Error('API 500'); }, ctx: () => ({ route: { dense: line, goalPx: [9, 9], kind: 'balanced' }, pos: [50, 40], px: [25, 20], limits: {}, snap: {}, worldToPx: (p) => p }),
    propose: async (d) => { props.push(d); }, apply() {}, onNote: (x) => notes.push(x) });
  await tick(dyn, 8); await new Promise((r) => setTimeout(r, 20));
  assert.equal(props.length, 0); assert.ok(notes.some((x) => /API 500/.test(x)));
});

test('ctx yoksa (yürüyüş yok) hiçbir şey yapılmaz', async () => {
  const dyn = createDynRoute({ call: async () => { throw new Error('olmamalı'); }, ctx: () => null, propose: async () => { throw new Error('olmamalı'); }, apply() {} });
  await tick(dyn, 10);
});

import { LOAD_STEP_KG, OBS_RADIUS_M, OBS_NEAR_ROUTE_M } from '../app/dynroute.js';

test('yük değişimi: numune alınınca (yük ≥ 0.5 kg artış) kalan rota + dönüş yeni yükle, load_kg gövdede', async () => {
  const s = setup({ snap: { elapsedSec: 0, o2RemainingL: 400, loadKg: 18 } }); await tick(s.dyn, 3);
  assert.equal(s.calls.length, 0, 'ilk okuma temel yük');
  s.c.snap = { elapsedSec: 0, o2RemainingL: 400, loadKg: 18 + 8 }; await tick(s.dyn, 2, 1, 10); await new Promise((r) => setTimeout(r, 20));
  assert.equal(s.calls.length, 3); assert.ok(s.calls.some((x) => x.body.load_kg === 8) && s.calls.some((x) => x.body.load_kg === 0));
  assert.equal(s.proposals[0].reason, 'load'); assert.equal(s.proposals[0].extraKg, 8);
  await tick(s.dyn, 5, 1, 30); assert.equal(s.proposals.length, 1, 'aynı yük için ikinci öneri yok');
  s.c.snap = { ...s.c.snap, loadKg: 18 + 8 + LOAD_STEP_KG / 10 }; await tick(s.dyn, 3, 1, 40); assert.equal(s.proposals.length, 1, 'küçük artış yok sayılır');
});

test('gözlem: rotaya yakın kum gözlemi /replan (observations) ile; uzak gözlem ve tekrar yok sayılır', async () => {
  const s = setup({ pxToWorld: ([c, r]) => [c * 2, r * 2] });
  assert.equal(s.dyn.observe({ px: [50.7, 5.2], cls: 'sand' }), true);          // dünya (100,10): rotaya 10 m
  assert.equal(s.dyn.observe({ px: [50.7, 5.2], cls: 'sand' }), false, 'aynı gözlem bir kez');
  assert.equal(s.dyn.observe({ px: [50, 400], cls: 'sand' }), false, `rotadan > ${OBS_NEAR_ROUTE_M + OBS_RADIUS_M} m`);
  assert.equal(s.dyn.observe({ px: [50, 5] }), false, 'sınıf yok');
  await tick(s.dyn, 3); await new Promise((r) => setTimeout(r, 20));
  const rp = s.calls.find((x) => x.path === '/replan'); assert.ok(rp); assert.deepEqual(rp.body.observations, [{ px: [50, 5], radius_m: OBS_RADIUS_M, cls: 'sand' }]);
  assert.equal(s.proposals[0].reason, 'observation'); assert.equal(s.proposals[0].observation.cls, 'sand');
});
