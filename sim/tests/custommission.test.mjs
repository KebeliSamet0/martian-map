import test from 'node:test';
import assert from 'node:assert/strict';
import { parseAB, shareQuery, straightMeters, etaMinutes, cellInfo, nearestPassable, mainComponentMask, buildCustomMission, sandForRoute, GRID_W, GRID_H, O2_LIMITED_L } from '../app/custommission.js';
import { createMission } from '../app/mission.js';

const flat = (deg = 5) => new Float32Array(GRID_W * GRID_H).fill(deg);

test('parseAB geçerli/geçersiz URL', () => {
  assert.deepEqual(parseAB('?a=433,525&b=491,774'), { a: [433, 525], b: [491, 774], o2: null });
  assert.equal(parseAB('?a=433,525&b=491,774&o2=80').o2, 80);
  for (const bad of ['', '?a=1,2', '?a=x,2&b=3,4', '?a=1000,2&b=3,4', '?a=-1,2&b=3,4', '?a=1.5,2&b=3,4']) assert.equal(parseAB(bad), null, bad);
});

test('shareQuery parseAB ile gidiş-dönüş', () => {
  const m = { a: [10, 20], b: [300, 400], o2: O2_LIMITED_L };
  assert.deepEqual(parseAB('?' + shareQuery(m)), m);
});

test('mesafe ve tahmini süre: 1 hücre = 2 m, 0.67056 m/s', () => {
  assert.equal(straightMeters([0, 0], [3, 4]), 10);
  assert.ok(Math.abs(etaMinutes(40.2336) - 1) < 1e-6);
});

test('cellInfo: 20° ve üstü geçilmez, ızgara dışı', () => {
  const s = flat(); s[5 * GRID_W + 7] = 20; s[6 * GRID_W + 7] = 19.9;
  assert.equal(cellInfo(s, [7, 5]).ok, false); assert.equal(cellInfo(s, [7, 6]).ok, true);
  assert.equal(cellInfo(s, [1000, 0]).outside, true);
});

test('nearestPassable: en yakın geçilebilir hücre ve metre', () => {
  const s = flat(40);                     // her yer dik
  s[10 * GRID_W + 13] = 5;                // (13,10) geçilebilir
  const r = nearestPassable(s, [10, 10]);
  assert.deepEqual(r.px, [13, 10]); assert.equal(r.m, 6);    // 3 hücre × 2 m
  assert.equal(nearestPassable(flat(40), [10, 10], 20), null);
  assert.equal(nearestPassable(flat(5), [10, 10]).m, 0);
});

test('buildCustomMission: S1 biçimi, bütçe, 80 L, çok yakın A-B reddedilir', () => {
  const m = buildCustomMission({ a: [433, 525], b: [491, 774] });
  assert.equal(m.id, 'CUSTOM'); assert.deepEqual(m.start_px, [433, 525]); assert.equal(m.limits.o2_L, 375); assert.equal(m.goal.grid_px[1], 774);
  assert.equal(buildCustomMission({ a: [1, 1], b: [200, 200], o2: 80 }).limits.o2_L, 80);
  assert.throws(() => buildCustomMission({ a: [1, 1], b: [2, 2] }), /yakın/);
  assert.throws(() => buildCustomMission({ a: [1, 1], b: [2000, 2] }), /ızgara/);
});

const toWorld = ([c, r]) => [c * 2, r * 2];   // 1 hücre = 2 m, basit düzlem
const zones = [{ id: 'z1', px: [100.6, 100.4], radius_m: 20 }, { id: 'z2', px: [400, 400], radius_m: 10 }];

test('sandForRoute: yalnız radius_m+40 içinden geçen rota için olay', () => {
  const near = [[0, 200], [100, 200], [200, 200], [300, 200]];          // z1 merkezi (200,200) rotanın üzerinde
  const r = sandForRoute(near, zones, toWorld);
  assert.equal(r.id, 'z1'); assert.deepEqual(r.px, [100, 100], 'API için tam sayı hücre'); assert.equal(r.threshold_m, 60); assert.ok(r.min_dist_m <= 60);
  const far = [[0, 0], [100, 0], [200, 0]];                              // z1'e 200 m
  assert.equal(sandForRoute(far, zones, toWorld), null);
  const edge = [[0, 200 + 61], [400, 200 + 61]];                         // 61 m: eşiğin dışında
  assert.equal(sandForRoute(edge, zones, toWorld), null);
  assert.equal(sandForRoute([], zones, toWorld), null); assert.equal(sandForRoute(near, [], toWorld), null);
});

test('kum olayı mission.js ile uyumlu: yalnız sand tanımlıysa tetiklenir (uydurma olay yok)', () => {
  const coords = { cellToWorld: ([c, r]) => [c * 2, r * 2] };
  const route = { total: {} };
  const base = buildCustomMission({ a: [0, 100], b: [150, 100] });
  const noSand = createMission({ definition: { ...base, goal: { world: [300, 200], radius_m: 5 }, events: [] }, coords });
  noSand.plan(); noSand.start(route);
  assert.equal(noSand.update([0, 200]).state, 'walking'); assert.equal(noSand.update([150, 200]).state, 'walking');
  const withSand = createMission({ definition: { ...base, goal: { world: [300, 200], radius_m: 5 },
    events: [{ id: 'CUSTOM-sand', type: 'sand', world: [200, 200], radius_m: 20, trigger_m: 60 }] }, coords });
  withSand.plan(); withSand.start(route);
  assert.equal(withSand.update([0, 200]).state, 'walking'); assert.equal(withSand.update([150, 200]).state, 'event');
});

test('mainComponentMask: ayrik ada ana bolge degil; nearestPassable maskeyle adayi atlar, 8 komsuluk (capraz) baglar', () => {
  const s = flat(40);
  for (let c = 100; c < 200; c++) for (let r = 100; r < 200; r++) s[r * GRID_W + c] = 5;      // ana bölge 100×100
  for (let c = 10; c < 13; c++) for (let r = 10; r < 13; r++) s[r * GRID_W + c] = 5;          // 3×3 ada
  s[300 * GRID_W + 300] = 5; s[301 * GRID_W + 301] = 5;                                      // yalnız çapraz bağlı 2 hücre (ada)
  const m = mainComponentMask(s);
  assert.equal(m[150 * GRID_W + 150], 1); assert.equal(m[11 * GRID_W + 11], 0); assert.equal(m[300 * GRID_W + 300], 0);
  const ci = cellInfo(s, [11, 11], m); assert.equal(ci.ok, false); assert.equal(ci.island, true);
  assert.equal(cellInfo(s, [150, 150], m).ok, true);
  assert.equal(nearestPassable(s, [11, 11], 150, null).px.join(), '11,11');                  // maskesiz: ada hücresi
  const np = nearestPassable(s, [11, 11], 150, m); assert.equal(np.px.join(), '100,100');      // maskeli: ana bölge
  const diag = flat(40); diag[50 * GRID_W + 50] = 5; diag[51 * GRID_W + 51] = 5;
  assert.equal(mainComponentMask(diag)[51 * GRID_W + 51], 1);                                 // çapraz komşu aynı bileşen (API ile aynı kural)
});
