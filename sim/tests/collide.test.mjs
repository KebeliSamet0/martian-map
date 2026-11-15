import test from 'node:test';
import assert from 'node:assert/strict';
import { createCollider, drawnRadius, PLAYER_R } from '../app/collide.js';

const mk = (items, opt) => createCollider(items.map((o, i) => ({ id: i, kind: 'rock', ...o })), opt);

test('shadow engel değil; rock ve outcrop engel; kind yoksa rock', () => {
  const c = mk([{ x: 0, z: 0, d_m: 4, kind: 'shadow' }, { x: 50, z: 0, d_m: 4 }, { x: 90, z: 0, d_m: 6, kind: 'outcrop' }]);
  assert.equal(c.count, 2);
  const r = c.resolve([-3, 0], [3, 0]);
  assert.ok(Math.abs(r.x - 3) < 1e-9); assert.equal(r.hit, null);   // shadow'dan geçer
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

// ---- batu:tas — görünen büyük sentetik taşlar engel (dinamik) ----
import { blockersFromInstances, BLOCK_MIN_R } from '../app/collide.js';

const inst = (list) => { const a = new Float32Array(list.length * 16); list.forEach(([x, z, sx, sz], i) => { const o = i * 16; a[o] = sx; a[o + 5] = 1; a[o + 10] = sz; a[o + 12] = x; a[o + 14] = z; a[o + 15] = 1; }); return a; };

test('blockersFromInstances: yalnız yarıçapı >= BLOCK_MIN_R olanlar, ölçek × 0,95', () => {
  const a = inst([[10, 20, 1.0, 0.8], [30, 40, 0.1, 0.1], [50, 60, 0.3, 0.2]]);
  const b = blockersFromInstances(a, 3);
  assert.equal(b.length, 2);
  assert.deepEqual([b[0].x, b[0].z], [10, 20]); assert.ok(Math.abs(b[0].r - 0.95) < 1e-6);
  assert.ok(Math.abs(b[1].r - 0.285) < 1e-6);
  assert.ok(0.3 * 0.95 >= BLOCK_MIN_R);
});

test('setDynamic: sentetik taş içinden geçilmez, çevresinden kayılır; gerçek kaya ile birlikte çalışır', () => {
  const c = createCollider([{ id: 1, x: 100, z: 100, d_m: 2, kind: 'rock' }]);
  c.setDynamic([{ x: 0, z: 0, r: 1.0 }]);
  // merkezden geçecek doğrultuda yürü: (−5,0) → (5,0)
  let p = { x: -5, z: 0 };
  for (let i = 0; i < 100; i++) { const r = c.resolve(p, { x: p.x + 0.1, z: p.z }); p = { x: r.x, z: r.z }; }
  assert.ok(Math.hypot(p.x, p.z) >= 1.0 + PLAYER_R - 1e-6, 'taşın içine girdi: ' + JSON.stringify(p));
  // dik açıyla ortadan: kayarak ilerlemeli ama içeri girmemeli
  const r2 = c.resolve({ x: -1.5, z: 0.05 }, { x: 1.5, z: 0.05 });
  assert.ok(Math.hypot(r2.x, r2.z) >= 1.0 + PLAYER_R - 1e-6);
  // gerçek kayalar yine engel
  const r3 = c.resolve({ x: 95, z: 100 }, { x: 105, z: 100 }); assert.ok(Math.hypot(r3.x - 100, r3.z - 100) >= 1 + PLAYER_R - 1e-6);
  // gerçek tarama/yakınlık etiketi sentetik taşı görmez
  assert.equal(c.nearest(0, 0, 5), null); assert.equal(c.inside(0, 0), null); assert.equal(c.dynamicCount, 1);
});

test('setDynamic([]) / null: engeller kalkar (taşlar gizliyken engel yok)', () => {
  const c = createCollider([]); c.setDynamic([{ x: 0, z: 0, r: 1 }]);
  c.setDynamic([]); const r = c.resolve({ x: -2, z: 0 }, { x: 2, z: 0 }); assert.ok(Math.abs(r.x - 2) < 1e-9);
  c.setDynamic([{ x: 0, z: 0, r: 1 }]); c.setDynamic(null); assert.equal(c.dynamicCount, 0);
});

test('setDynamic: 1 m/adım hızlı hareket bile ince taşın içinden tünel açmaz (substep)', () => {
  const c = createCollider([]); c.setDynamic([{ x: 0, z: 0, r: 0.3 }]);
  const r = c.resolve({ x: -3, z: 0 }, { x: 3, z: 0 });
  assert.ok(Math.hypot(r.x, r.z) >= 0.3 + PLAYER_R - 1e-6);
});
