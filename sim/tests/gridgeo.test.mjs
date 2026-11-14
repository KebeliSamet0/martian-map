import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createGridGeo } from '../app/gridgeo.js';
const grid = JSON.parse(await readFile(new URL('../../contracts/grid.json', import.meta.url)));
const manifest = { R: 3396190, origin_proj: { x0: grid.origin_xy_m[0], ytop: grid.origin_xy_m[1] }, lat0: -5, W: 2000, H: 2000, res_x_m: 1, res_z_m: 1, z_min_data: 0, z_max_data: 100 };
test('dört köşe, merkez ve negatif koordinat çift yönlü tutarlı', () => {
  const g = createGridGeo({ grid, manifest });
  for (const p of [[0,0],[1000,0],[0,1000],[1000,1000],[0.5,0.5],[-2,3]]) {
    const w = g.pxToWorld(p), back = g.worldToPx(w);
    assert.ok(Math.abs(back[0]-p[0]) < 1e-8 && Math.abs(back[1]-p[1]) < 1e-8);
    assert.ok(Math.abs(w[0]-p[0]*2*Math.cos(-5*Math.PI/180)) < 1e-8);
    assert.ok(Math.abs(w[1]-p[1]*2) < 1e-8);
  }
  assert.deepEqual(g.worldToCell(g.cellToWorld([42,17])), [42,17]);
  assert.equal(g.inside([1000,0]), false);
});
test('legacy api.js dönüşümüyle aynı sonuç', async () => {
  globalThis.location = { search: '' };
  const old = await import('../app/api.js');
  const { Geo } = await import('../app/geo.js');
  const geo = new Geo(manifest), g = createGridGeo({ grid, geo });
  const a = old.pxToWorld(geo, 20.5, 99.5), b = g.pxToWorld([20.5,99.5]);
  assert.ok(Math.hypot(a[0]-b[0], a[1]-b[1]) < 1e-8);
});
