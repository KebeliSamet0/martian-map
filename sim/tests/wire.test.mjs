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
  assert.equal(def.goal.radius_m, 10); assert.deepEqual(def.events[0].grid_px, [4,5]); assert.equal(def.events[0].radius_m, 19.4); assert.equal(def.events[0].trigger_m, 59.4);
  assert.equal(uiTexts({ alerts: { sand: 'kum' } })['alert.sand.body'], 'kum');
});

import { createStepAdapter } from '../app/wire-step.js';
import { applyScanClasses } from '../app/wire-scan.js';
test('/step adaptörü ek yükü ayırır, başlangıcı korur, gerçek süre ve durak tüketimini sayar', async () => {
  const calls = [];
  const api = createStepAdapter({ call: async (url, body) => { calls.push({url,body}); return { kcal: 1, o2_L: 0.2, dose_uGy: 99, duration_s: 20 }; },
    coords: { worldToPx: p => p, inside: () => true }, assumptions: [
      {name:'Ekipman',value:10},{name:'Düz zemin metabolik düzeyi',value:418.4},
      {name:'Oksijen dönüşümü',value:{kcal_per_L_o2:5}},{name:'Yüzey doz hızı',value:3.6}],
    observations: () => [{ px:[2,2],radius_m:3,cls:'sand' }] });
  const {delta} = await api.step({trace:[
    {from_world:[1,1],world:[2,2],grid_px:[2,2],dt_sec:3,load_kg:18},
    {from_world:[2,2],world:[2,2],grid_px:[2,2],dt_sec:2,load_kg:18}]});
  assert.equal(calls[0].body.load_kg,8); assert.deepEqual(calls[0].body.path,[[1,1],[2,2],[2,2]]);
  assert.equal(delta.kcal,1.2); assert.ok(Math.abs(delta.o2_L - 0.24) < 1e-12); assert.equal(delta.dose_uGy,0.005);
});
test('scan_class dört kodu dokuya tam sayı olarak aktarır; dışarıda eğim yedeği kalır', () => {
  const data = new Uint8Array(5*4), nav={w:5,h:1,cx:1,cz:1};
  applyScanClasses(data, nav, {worldToPx:p=>p}, {width:4,height:1}, new Uint8Array([0,1,2,3]));
  assert.deepEqual([data[2],data[6],data[10],data[14],data[18]],[1,2,3,4,0]);
  assert.throws(()=>applyScanClasses(data,nav,{worldToPx:p=>p},{width:4,height:1},new Uint8Array([0,5,2,3])));
});
