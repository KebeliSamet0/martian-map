import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
globalThis.location ??= { search: '' };  // api.js tarayıcıda location okur
const { createStopWatcher, toWorld, NEAR_M } = await import('../app/corridor.js');
const { GRID } = await import('../app/api.js');

// Basit Geo: eqc metre → dünya (x doğu, z güney), ızgaranın KB köşesi orijin
const geo = { lonlatToWorld: (lon, lat) => { const d = Math.PI / 180; return [GRID.R * lon * d - GRID.ox, GRID.oy - GRID.R * lat * d]; } };

test('yaklaşınca bir kez tetiklenir, uzaklaşınca yeniden kurulur', () => {
  const w = createStopWatcher([{ id: 'a', world: [0, 0] }, { id: 'b', world: [100, 0] }]);
  assert.deepEqual(w.check([20, 0]).map(s => s.id), []);
  assert.deepEqual(w.check([NEAR_M, 0]).map(s => s.id), ['a']);   // sınır dahil
  assert.deepEqual(w.check({ x: 5, z: 0 }).map(s => s.id), []);   // içeride kalınca tekrar yok
  assert.deepEqual(w.check([20, 0]).map(s => s.id), []);           // 15-25 m arası: hâlâ kurulu değil
  assert.deepEqual(w.check([0, 0]).map(s => s.id), []);
  w.check([60, 0]);                                                 // > 25 m: yeniden kurulur
  assert.deepEqual(w.check([3, 0]).map(s => s.id), ['a']);
});

test('curiosity.json: yol ve duraklar ızgarada, fotoğraflar var, dönüşüm px*res', async () => {
  const url = new URL('../data/curiosity.json', import.meta.url);
  const data = JSON.parse(await readFile(url, 'utf8'));
  assert.ok(data.path_px.length > 100 && data.stops.length >= 15);
  for (const p of [...data.path_px, ...data.stops.map(s => s.px)]) assert.ok(p[0] >= 0 && p[1] >= 0 && p[0] < GRID.w && p[1] < GRID.h);
  const { trail, stops } = toWorld(data, geo, { dataBase: new URL('.', url) });
  assert.ok(Math.abs(trail[0][0] - data.path_px[0][0] * GRID.res) < 1e-6 && Math.abs(trail[0][1] - data.path_px[0][1] * GRID.res) < 1e-6);
  let total = 0;
  for (const s of stops) { assert.ok(s.photo_url.startsWith('file:')); total += (await stat(new URL(s.photo_url))).size; }
  assert.ok(total < 15e6, `fotoğraflar ${total} bayt`);
  const along = stops.map(s => s.along_m); assert.deepEqual(along, [...along].sort((a, b) => a - b));
});
