import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollider, drawnRadius, PLAYER_R } from '../app/collide.js';

const mk = (items, opt) => createCollider(items.map((o, i) => ({ id: i, kind: 'rock', ...o })), opt);

test('shadow engel değil; rock ve outcrop engel; kind yoksa rock', () => {
  const c = mk([{ x: 0, z: 0, d_m: 4, kind: 'shadow' }, { x: 50, z: 0, d_m: 4 }, { x: 90, z: 0, d_m: 6, kind: 'outcrop' }]);
  assert.equal(c.count, 2);
  const r = c.resolve([-3, 0], [3, 0]);
  assert.equal(r.x, 3); assert.equal(r.hit, null);   // shadow'dan geçer
});

test('kayaya girmez: iç hareket yüzeyde durur', () => {
  const c = mk([{ x: 10, z: 0, d_m: 4 }]);
  const r = c.resolve([6, 0], [10, 0]);              // tam merkeze doğru
  const d = Math.hypot(r.x - 10, r.z);
  assert.ok(d >= 2 + PLAYER_R - 1e-6, `d=${d}`);
  assert.ok(r.hit);
});

test('yüzey boyunca kayar (teğet bileşen korunur)', () => {
  const c = mk([{ x: 10, z: 0, d_m: 4 }]);
  let p = [7.5, -0.4];
  for (let i = 0; i < 40; i++) { const n = c.resolve(p, [p[0] + 0.05, p[1] + 0.05]); p = [n.x, n.z]; }
  assert.ok(p[1] > 0.5, `z ilerlemedi: ${p}`);        // z yönünde kaydı
  assert.ok(Math.hypot(p[0] - 10, p[1]) >= 2 + PLAYER_R - 1e-6);
});

test('büyük adımda tünelleme yok', () => {
  const c = mk([{ x: 10, z: 0, d_m: 3 }]);
  const r = c.resolve([0, 0], [20, 0]);
  assert.ok(r.x < 10, `kayanın ötesine geçti: ${r.x}`);
});

test('kayanın içinde doğan oyuncu dışarı itilir', () => {
  const c = mk([{ x: 5, z: 5, d_m: 4 }]);
  const r = c.resolve([5.2, 5], [5.2, 5]);
  assert.ok(Math.hypot(r.x - 5, r.z - 5) >= 2 + PLAYER_R - 1e-6);
});

test('temas olayı: kaya başına soğuma', () => {
  let t = 0; const ev = [];
  const c = mk([{ x: 10, z: 0, d_m: 4, kind: 'outcrop' }], { now: () => t, emit: (n, d) => ev.push([n, d]) });
  c.step([7, 0], [10, 0]); c.step([7, 0], [10, 0]);
  assert.equal(ev.length, 1);
  assert.deepEqual(ev[0], ['mm:rock-contact', { id: 0, d_m: 4, kind: 'outcrop' }]);
  t = 2500; c.step([7, 0], [10, 0]);
  assert.equal(ev.length, 2);
  c.step([0, 0], [1, 0]);                              // uzak: olay yok
  assert.equal(ev.length, 2);
});

test('çizilen yarıçap: rock d/2, outcrop daha dar', () => {
  assert.equal(drawnRadius({ d_m: 4 }), 2);
  assert.ok(drawnRadius({ d_m: 4, kind: 'outcrop' }) < 2);
});

test('nearest: yakın kaya ve yüzey uzaklığı', () => {
  const c = mk([{ x: 10, z: 0, d_m: 4 }]);
  const n = c.nearest(15, 0); assert.ok(Math.abs(n.dist - 3) < 1e-9);
  assert.equal(c.nearest(100, 100), null);
});
