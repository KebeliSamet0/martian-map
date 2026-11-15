import test from 'node:test';
import assert from 'node:assert/strict';
import { createMission, loadMissions } from '../app/mission.js';
const definition = { id: 'test', goal: { world: [100,0], radius_m: 2 }, events: [{ id: 'sand', type: 'sand', world: [50,0], radius_m: 5 }], sample_kg: 3 };
const route = { total: { min: 2, km: 0.1, kcal: 10 } };
test('görev geçişleri, atlanan karede kum, tek numune ve yerel özet', async () => {
  let load = 0, calls = 0;
  const m = createMission({ definition, vitals: { setRoute() {}, addLoad: kg => { load += kg; }, flush: async () => {}, snapshot: () => ({ elapsedSec: 180, distanceM: 110, kcal: 12 }) },
    api: { debrief: async () => { calls++; throw new Error('404'); } } });
  assert.throws(() => m.start(route)); m.plan(); m.start(route); m.update([0,0]);
  assert.equal(m.update([90,0]).state, 'event'); assert.equal(m.snapshot().currentEvent.type, 'sand');
  m.resume(); assert.equal(m.update([100,0]).state, 'arrived');
  m.collectSample(); m.collectSample(); assert.equal(load, 3);
  await Promise.all([m.finish(), m.finish()]); assert.equal(calls, 1);
  assert.equal(m.snapshot().state, 'debrief'); assert.deepEqual(m.snapshot().summary.delta, { min: 1, kcal: 2, m: 10 });
  assert.equal(m.snapshot().summary.source, 'local');
});
test('API → dosya → gömülü görev yedekleri', async () => {
  const a = await loadMissions({ api: { missions: async () => [definition] }, fetcher: () => { throw new Error('çağrılmamalı'); } });
  assert.equal(a.source, 'api');
  const b = await loadMissions({ api: { missions: async () => { throw new Error('404'); } }, fetcher: async () => ({ ok: true, json: async () => ({ missions: [definition] }) }) });
  assert.equal(b.source, 'file');
  const c = await loadMissions({ api: { missions: async () => [] }, fetcher: async () => ({ ok: false, status: 404 }) });
  assert.equal(c.source, 'embedded');
});
test('grid hedefi, API özeti ve snapshot izolasyonu', async () => {
  const m = createMission({ definition: { id: 'grid', goal: { grid_px: [2,3] } }, coords: { cellToWorld: p => p.map(v => v*2) }, api: { debrief: async () => ({ score: 42 }) } });
  m.plan(); m.start(route); m.update([4,6]); await m.finish();
  const s = m.snapshot(); assert.equal(s.summary.remote.score, 42); s.summary.remote.score = 0;
  assert.equal(m.snapshot().summary.remote.score, 42);
});

test('olay tetik mesafesi trigger_m: radius_m değişmez, rota uzaksa tetiklenmez', () => {
  const m = createMission({ definition: { id: 't', goal: { world: [200, 0], radius_m: 2 }, events: [{ id: 's', type: 'sand', world: [50, 0], radius_m: 5, trigger_m: 45 }] } });
  m.plan(); m.start({ total: {} });
  assert.equal(m.update([0, 0]).state, 'walking'); assert.equal(m.update([10, 0]).state, 'event');
  assert.equal(m.snapshot().currentEvent.radius_m, 5);
});

// #125 A.1: numune → üsse dönüş ayağı
test('beginReturn ikinci hedefi açar, üsse varışta karne alınabilir', async () => {
  let load = 0;
  const vitals = { setRoute() {}, addLoad(kg) { load += kg; }, snapshot: () => ({ elapsedSec: 60, kcal: 10, distanceM: 20 }), flush: async () => {} };
  const def = { id: 'ret', goal: { world: [100, 0], radius_m: 2 }, sample_kg: 8, events: [] };
  const m = createMission({ definition: def, vitals, fetcher: async () => { throw new Error('api yok'); } });
  m.plan(); m.start({ total: { km: 0.1, min: 1, kcal: 8 } });
  assert.equal(m.snapshot().leg, 'outbound');
  assert.equal(m.update([100, 0]).state, 'arrived');
  m.collectSample();
  assert.equal(load, 8);
  assert.equal(m.beginReturn({ world: [0, 0], radius_m: 5 }).state, 'walking');
  assert.equal(m.snapshot().leg, 'return');
  // gidişteki hedefe tekrar uğramak görevi bitirmez
  assert.equal(m.update([100, 0]).state, 'walking');
  assert.equal(m.update([2, 0]).state, 'arrived');
  await m.finish();
  assert.equal(m.snapshot().state, 'debrief');
  assert.equal(m.snapshot().summary.sampled, true);
  assert.throws(() => m.beginReturn({ world: [0, 0] }), /debrief/);
  const far = createMission({ definition: { id: 'f', goal: { world: [200, 0], radius_m: 2 }, events: [{ id: 's', type: 'sand', world: [50, 100], radius_m: 5, trigger_m: 45 }] } });
  far.plan(); far.start({ total: {} }); far.update([0, 0]); assert.equal(far.update([100, 0]).state, 'walking');
});
