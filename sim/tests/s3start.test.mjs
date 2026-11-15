import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
// #52 madde 5: S3 başlangıcı geçilmez hücrede olmamalı; önbellek güncel görev dosyasıyla üretilmiş olmalı.
test('S3 başlangıcı geçilebilir: snap ve uyarı yok, eğim < 25°; ders (NO-GO) korunur', () => {
  const m = read('../data/missions.json').missions.find((x) => x.id === 'S3');
  const cache = read('../data/routes/S3.json');
  assert.deepEqual(cache.request.start, m.start_px);
  for (const r of cache.response.routes) {
    assert.equal(r.total.endpoints.start.snap_m, 0);
    assert.deepEqual(r.total.warnings, []);
    assert.ok(r.total.slope_max < 25, `slope_max ${r.total.slope_max}`);
    assert.equal(r.total.status, 'NO-GO');
  }
});
