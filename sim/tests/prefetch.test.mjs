import test from 'node:test';
import assert from 'node:assert/strict';
import { tilesNear, planPrefetch, tileView } from '../app/prefetch.js';

const geo = { resX: 1, resZ: 1 };
const man = { levels: 3, level_meta: [
  { chunks: [[0, 0], [1, 0], [0, 1], [1, 1], [2, 0]] },   // k0: 128 m karolar
  { chunks: [[0, 0], [1, 0]] },                              // k1: 256 m
  { chunks: [[0, 0]] },                                      // k2: 512 m
] };

test('tileView manifestten boyut ve varlık verir', () => {
  const v = tileView(man, geo);
  assert.equal(v.K, 2); assert.deepEqual(v.size(1), [256, 256]);
  assert.ok(v.has(0, 2, 0)); assert.ok(!v.has(0, 3, 0));
});

test('tilesNear yalnız var olan karoları ve yarıçap içindekileri döndürür', () => {
  const v = tileView(man, geo);
  const near = tilesNear(v, 0, 100, 60, 40);   // x 60..140 -> cx 0..1, z 20..100 -> cy 0
  assert.deepEqual(near.map((t) => t.join('/')).sort(), ['0/0/0', '0/1/0']);
  assert.deepEqual(tilesNear(v, 0, 9999, 9999, 50), []);
});

test('planPrefetch kabadan inceye sıralar, tekrar yok, merkezler birleşir', () => {
  const v = tileView(man, geo);
  const plan = planPrefetch(v, [[100, 60], [110, 70]], { radiusM: 40 });
  const keys = plan.map((t) => t.join('/')); assert.equal(new Set(keys).size, keys.length);
  const ks = plan.map((t) => t[0]); assert.deepEqual(ks, [...ks].sort((a, b) => b - a));
  assert.ok(keys.includes('2/0/0') && keys.includes('0/0/0'));
});
