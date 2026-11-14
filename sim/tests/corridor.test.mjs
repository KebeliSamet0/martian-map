import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
globalThis.location ??= { search: '' };  // api.js tarayıcıda location okur
const { createStopWatcher, createStopCard, toWorld, NEAR_M, REARM_M } = await import('../app/corridor.js');
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

test('step: çıkış yalnız REARM_M ötesinde ve bir kez bildirilir', () => {
  const w = createStopWatcher([{ id: 'a', world: [0, 0] }]);
  assert.deepEqual(w.step([5, 0]).entered.map(s => s.id), ['a']);
  assert.deepEqual(w.step([REARM_M - 1, 0]).exited, []);               // ara bantta kapanmaz
  assert.deepEqual(w.step([REARM_M + 1, 0]).exited.map(s => s.id), ['a']);
  assert.deepEqual(w.step([REARM_M + 5, 0]).exited, []);               // tekrar bildirilmez
});

test('Navcam kartı: küçük açılır, uzaklaşınca kapanır, aynı durakta tekrar açılmaz', () => {
  const log = [];
  const card = createStopCard({ show: s => log.push(`show:${s.id}`), expand: b => log.push(`big:${b}`), hide: () => log.push('hide') });
  const w = createStopWatcher([{ id: 'a', world: [0, 0] }, { id: 'b', world: [200, 0] }]);
  const walk = (x) => card.update(w.step([x, 0]));
  walk(40); assert.equal(card.current, null);
  walk(10); assert.equal(card.current.id, 'a'); assert.equal(card.big, false);   // küçük açıldı
  card.toggle(); assert.equal(card.big, true);                                       // G / tıkla: büyür
  for (const x of [12, 8, 14, 20]) walk(x);                                          // durakta dolaşma: tekrar açılmaz
  assert.equal(log.filter(l => l.startsWith('show')).length, 1);
  walk(30); assert.equal(card.current, null); assert.equal(log.at(-1), 'hide');      // > 25 m: kendiliğinden kapandı
  walk(5); card.close(); walk(10); walk(3);                                          // elle kapatıldı: içerideyken yeniden açılmaz
  assert.equal(card.current, null); assert.equal(log.filter(l => l === 'show:a').length, 2);
  walk(190); assert.equal(card.current.id, 'b');                                     // başka durak açılır
  card.toggle(); card.escape(); assert.equal(card.big, false); assert.equal(card.current.id, 'b'); // Esc önce küçültür
  card.escape(); assert.equal(card.current, null);                                   // sonra kapatır
});

test('modal açıkken kart açılmaz', () => {
  const card = createStopCard({ show() { throw new Error('açılmamalı'); }, expand() {}, hide() {} });
  card.update({ entered: [{ id: 'a' }], exited: [] }, { blocked: true });
  assert.equal(card.current, null);
});
