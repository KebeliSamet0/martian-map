import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as W from '../app/walkfeel_core.js';

const py = readFileSync(new URL('../../api/planner/params.py', import.meta.url), 'utf8');
const num = (name) => Number(new RegExp(`^${name}\\s*=\\s*([0-9.]+)`, 'm').exec(py)[1]);
const dict = (name) => Object.fromEntries([...new RegExp(`^${name}\\s*=\\s*\\{([^}]*)\\}`, 'm').exec(py)[1].matchAll(/"(\w+)":\s*([0-9.]+)/g)].map((m) => [m[1], Number(m[2])]));
const S = (o) => ({ soil: 0, bedrock: 0, sand: 0, bigrock: 0, rock_cfa: 0, slope: 0, ...o });

test('sabitler params.py ile aynı', () => {
  for (const k of ['G_MARS', 'BODY_KG', 'SUIT_KG', 'TOOLS_KG', 'BASE_SPEED_MS', 'FLAT_REFERENCE_W', 'SLOPE_RISKY_DEG', 'SLOPE_NOGO_DEG', 'SCAN_CAUTION_ROCK_CFA']) assert.equal(W.PARAMS[k], num(k), k);
  assert.equal(W.PARAMS.G_EARTH, num('G_EARTH'));
  assert.deepEqual(W.PARAMS.TERRAIN_ETA, dict('TERRAIN_ETA'));
  assert.deepEqual(W.PARAMS.TERRAIN_SPEED, dict('TERRAIN_SPEED'));
});

test('hız: kumda yavaş, ana kayada hızlı; yokuş yukarı yavaş', () => {
  const sand = S({ sand: 1 }), rock = S({ bedrock: 1 });
  assert.ok(W.speedMultiplier(sand, 0) < W.speedMultiplier(rock, 0));
  assert.ok(Math.abs(W.speedMultiplier(rock, 0) - 1) < 1e-9);
  assert.ok(W.speedMultiplier(rock, 0.3) < 0.5 * W.speedMultiplier(rock, 0));
  assert.ok(W.speedMultiplier(rock, -0.05) > W.speedMultiplier(rock, 0));   // Tobler: hafif iniş en hızlı
  assert.ok(W.speedMultiplier(rock, -0.5) < W.speedMultiplier(rock, -0.05)); // dik iniş yavaş (dikkatli)
});

test('metabolik: düz ana kayada 272 W, kum ve yokuş daha fazla', () => {
  const flat = W.metabolicW(W.PARAMS.BASE_SPEED_MS, 0, 1.0);
  assert.ok(Math.abs(flat - 272) < 1e-6);
  assert.ok(W.metabolicW(W.PARAMS.BASE_SPEED_MS, 0, 2.1) > flat);
  assert.ok(W.metabolicW(W.PARAMS.BASE_SPEED_MS, 20, 1.0) > flat);
  assert.equal(W.metabolicW(0.5, -20, 1.2), W.metabolicW(0.5, 20, 1.2));   // cost.py: |G|
});

test('efor 0..1 aralığında ve zemine/eğime göre artar', () => {
  const e0 = W.effort01(S({ bedrock: 1 }), 0).effort, e1 = W.effort01(S({ sand: 1 }), 0.3).effort;
  assert.ok(e0 >= 0 && e0 < 0.3 && e1 > e0 && e1 <= 1);
});

test('ayak izi: kum > toprak > ana kaya(yok)', () => {
  const d = (o) => W.printDepth(S(o));
  assert.ok(d({ sand: 1 }) > d({ soil: 1 }));
  assert.ok(d({ soil: 1 }) > 0);
  assert.equal(d({ bedrock: 1 }), 0);
  assert.equal(W.dominantSurface(S({ sand: 0.5, soil: 0.3, bedrock: 0.2 })), 'sand');
});

test('tökezleme: kayalık/dik yerde risk var, düz sıkı zeminde yok', () => {
  assert.equal(W.stumbleRisk(S({ bedrock: 1 }), 5), 0);
  assert.ok(W.stumbleRisk(S({ rock_cfa: 0.2, bigrock: 0.4 }), 5) > 0.05);
  assert.ok(W.stumbleRisk(S({ soil: 1 }), 30) > 0.05);
  assert.ok(W.stumbleRisk(S({ rock_cfa: 1, bigrock: 1 }), 40) <= 0.1 + 1e-9);
});

test('katman örnekleyici: satır-önce indeks, alan dışı null, eksik katman hazır değil', () => {
  const n = 4, mk = (v) => Float32Array.from({ length: n * n }, (_, i) => v(i));
  const layers = { slope: mk((i) => i), p_sand: mk(() => 0.2), p_soil: mk(() => 0.3), p_bedrock: mk(() => 0.4), p_bigrock: mk(() => 0.1), rock_cfa: mk(() => 0) };
  const smp = W.createLayerSampler({ w: n, h: n, layers });
  assert.equal(smp.sample(2.5, 1.5).slope, 1 * n + 2);
  assert.equal(smp.sample(-1, 0), null);
  assert.equal(smp.sample(4, 0), null);
  assert.equal(W.createLayerSampler({ w: n, h: n, layers: { slope: layers.slope } }).ready, false);
});

test('eğim boyunca tanjant: yokuş yönüne yürümek +, yana yürümek 0', () => {
  assert.ok(W.tanAlong(20, 1, 0, 1, 0) > 0.3);
  assert.ok(W.tanAlong(20, 1, 0, -1, 0) < -0.3);
  assert.ok(Math.abs(W.tanAlong(20, 1, 0, 0, 1)) < 1e-9);
});

test('mulberry32 tohumla yinelenebilir', () => {
  const a = W.mulberry32(7), b = W.mulberry32(7);
  assert.equal(a(), b());
});
