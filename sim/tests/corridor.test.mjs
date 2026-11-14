import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
globalThis.location ??= { search: '' };  // api.js tarayıcıda location okur
import { register } from 'node:module';
// 'three' tarayıcıda importmap ile çözülür; testte sim/lib kopyasına yönlendir
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s, c, next) {
  return s === 'three' ? { url: ${JSON.stringify(new URL('../lib/three.module.js', import.meta.url).href)}, shortCircuit: true } : next(s, c); }`));
const { createStopWatcher, createStopCard, toWorld, markerEmphasis, initCorridor, NEAR_M, REARM_M, NOTICE_M, MARKER_GROW } = await import('../app/corridor.js');
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

test('işaretçi vurgusu: 40 m ötesi 0, 15 m içi sabit 1, arada artar', () => {
  assert.equal(markerEmphasis(NOTICE_M + 10), 0);
  assert.equal(markerEmphasis(NOTICE_M), 0);
  assert.equal(markerEmphasis(NEAR_M), 1);
  assert.equal(markerEmphasis(3), 1);
  const seq = [38, 32, 26, 20, 16].map(d => markerEmphasis(d));
  assert.ok(seq.every((v, i) => i === 0 || v > seq[i - 1]) && seq.every(v => v > 0 && v < 1));
});

test('3B: yaklaşırken yalnız o durağın işaretçisi büyür ve parlar, uzaklaşınca söner', async () => {
  const THREE = await import('three');
  const data = JSON.parse(await readFile(new URL('../data/curiosity.json', import.meta.url), 'utf8'));
  const scene = new THREE.Scene();
  const c = await initCorridor(scene, { heightAt: () => 0, version: 1 }, geo, { data });
  const marks = scene.getObjectByName('curiosity-corridor').children.slice(1);
  assert.equal(marks.length, c.stops.length);
  const s = c.stops[5], m = marks[5], other = marks[15], col0 = m.userData.mat.color.getHex();
  const at = d => c.update({ x: s.world[0] + d, z: s.world[1] });
  at(80); assert.equal(m.scale.x, 1);
  at(30); assert.ok(m.scale.x > 1 && m.scale.x < 1 + MARKER_GROW);
  at(10); assert.ok(Math.abs(m.scale.x - (1 + MARKER_GROW)) < 1e-9); assert.notEqual(m.userData.mat.color.getHex(), col0);
  at(2); assert.ok(Math.abs(m.scale.x - (1 + MARKER_GROW)) < 1e-9);       // içeride sabit
  assert.equal(other.scale.x, 1); assert.notEqual(m.userData.mat, other.userData.mat);
  at(80); assert.equal(m.scale.x, 1); assert.equal(m.userData.mat.color.getHex(), col0);
  c.dispose();
});
