import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { nearestStop, stopAt, modelReading, aheadSimilar, cameraInsightDetail, imageCandidates, localFallback, certaintyOf, loadManifest, loadDirs, hasDir, cardinal, fanPoints, alignView } from '../app/helmetcam-core.js';

const texts = JSON.parse(await readFile(new URL('../data/texts.json', import.meta.url)));
const tr = (g) => Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.tr]));
const en = (g) => Object.fromEntries(Object.entries(g).map(([k, v]) => [k, v.en]));
const T = tr(texts.helmetcam), E = en(texts.helmetcam);
const man = JSON.parse(await readFile(new URL('../data/navcam_manifest.json', import.meta.url)));
const S = (cf, entropy, px = [10, 10]) => ({ stop_id: 'x', sol: 1, px, class_frac: cf, entropy, files: [{ name: 'a.jpg', sol: 1 }] });

test('manifest: 128 durak, her karenin NASA adresi ve model alanları var', () => {
  assert.equal(man.stops.length, 128);
  assert.ok(man.stops.every((s) => s.class_frac && typeof s.entropy === 'number' && s.files.length > 0));
  assert.ok(man.stops.flatMap((s) => s.files).every((f) => /^https:\/\/mars\.nasa\.gov\/msl-raw-images\/.*\/sol\/\d{5}\/opgs\/edr\/ncam\/.+\.JPG$/.test(f.url)));
  assert.equal(man.stops.reduce((n, s) => n + s.files.length, 0), 391);
});

test('model yorumu: şablon örneği, kum yok → uyarı yok, kesinlik yüksek', () => {
  const r = modelReading(S({ soil: 0.36, bedrock: 0.61, sand: 0.0, bigrock: 0.03 }, 0.28), T);
  assert.equal(r.text, 'Önünde %61 ana kaya, %36 toprak; kum yok denecek kadar az. Model bu durakta emin.');
  assert.equal(r.warn, false); assert.equal(r.low, false); assert.ok(r.sandNote);
});

test('düşük kesinlik: "Model emin değil; kanıt az." ve uyarı eşikleri (kum > %15, büyük kaya > %10)', () => {
  const lo = modelReading(S({ soil: 0.5, bedrock: 0.3, sand: 0.1, bigrock: 0.1 }, 0.7), T);
  assert.match(lo.text, /Model emin değil; kanıt az\.$/); assert.equal(lo.low, true); assert.equal(lo.warn, false);   // tam eşikte (0,10) uyarı yok
  const w = modelReading(S({ soil: 0.4, bedrock: 0.3, sand: 0.18, bigrock: 0.12 }, 0.3), T);
  assert.deepEqual(w.kinds, ['sand', 'bigrock']); assert.equal(w.warn, true); assert.match(w.warnText, /kum %18, büyük kaya %12/); assert.equal(w.sandNote, null);
});

test('İngilizce şablon aynı anahtarlarla çalışır', () => {
  assert.deepEqual(Object.keys(E).sort(), Object.keys(T).sort());
  assert.match(modelReading(S({ soil: 0.36, bedrock: 0.61, sand: 0, bigrock: 0.03 }, 0.28), E).text, /^Ahead of you: 61% bedrock, 36% soil; almost no sand\./);
});

test('yakınlık: durak yarıçapı 30 m, ızgara 2 m/px', () => {
  const stops = [S({}, 0, [100, 100]), { ...S({}, 0, [200, 200]), stop_id: 'y' }];
  assert.equal(stopAt(stops, [114, 100], 2).stop.stop_id, 'x');   // 28 m
  assert.equal(stopAt(stops, [116, 100], 2), null);                // 32 m
  assert.ok(Math.abs(nearestStop(stops, [200, 210], 2).distM - 20) < 1e-9);
});

test('ileri uyarı: rota üzerinde benzer zeminin ilk uzaklığı; yoksa null', () => {
  const dense = [[0, 0], [100, 0]], cum = [0, 100], id = (w) => w;
  const sample = (px) => ({ p: { sand: px[0] >= 40 ? 0.3 : 0, bigrock: 0 }, conf: 1 });
  const r = aheadSimilar({ dense, cum, s: 10 }, ['sand'], sample, id, { step: 2 });
  assert.equal(r.kind, 'sand'); assert.ok(r.aheadM >= 30 && r.aheadM <= 32);
  assert.equal(aheadSimilar({ dense, cum, s: 10 }, ['sand'], () => ({ p: { sand: 1 }, conf: 1 }), id).aheadM, 15);   // durağın hemen çevresi (<15 m) sayılmaz
  assert.equal(aheadSimilar({ dense, cum, s: 10 }, ['bigrock'], sample, id), null);
});

test('olay gövdesi ve görüntü adayları', () => {
  const st = S({ soil: 0.4, bedrock: 0.3, sand: 0.18, bigrock: 0.1 }, 0.3), rd = modelReading(st, T);
  assert.deepEqual(Object.keys(cameraInsightDetail(st, rd)).sort(), ['classFrac', 'entropy', 'stopId', 'warn']);
  const c = imageCandidates(st, '/d/');
  assert.equal(c[0].url, '/d/navcam_all/x/a.jpg'); assert.equal(c[0].mask, '/d/navcam_masks/x/a.png'); assert.equal(c.length, 1);
  assert.deepEqual(localFallback(st, '/d/'), []); assert.equal(localFallback({ ...st, local: true }, '/d/')[0].url, '/d/navcam/x.jpg');
  assert.ok(Math.abs(certaintyOf(st) - 0.7) < 1e-9);
});

test('loadManifest in_grid dışını eler', async () => {
  const f = async () => ({ ok: true, json: async () => ({ stops: [{ in_grid: true, stop_id: 'a' }, { in_grid: false, stop_id: 'b' }] }) });
  assert.deepEqual((await loadManifest('u', f)).map((s) => s.stop_id), ['a']);
});

const dirs = JSON.parse(await readFile(new URL('../data/navcam_dirs.json', import.meta.url))).frames;

test('yönler: her kare için az/el/fov; az kuzeyden saat yönü, fov Navcam ~45°, null uydurulmaz', () => {
  const names = man.stops.flatMap((s) => s.files.map((f) => f.name));
  assert.equal(Object.keys(dirs).length, names.length);
  for (const n of names) {
    const d = dirs[n]; assert.ok(d, n);
    if (d.az_deg === null) { assert.equal(d.el_deg, null); assert.equal(d.fov_deg, null); assert.equal(d.kaynak, null); continue; }
    assert.ok(d.az_deg >= 0 && d.az_deg < 360 && d.el_deg > -90 && d.el_deg < 30 && d.fov_deg > 40 && d.fov_deg < 50, n);
    assert.ok(hasDir(d));
  }
  assert.equal(hasDir({ az_deg: null, el_deg: null, fov_deg: null }), false);
});

test('yön doğrulaması: kuaterniyonlu azimut = rover azimutu + rover yaw; seviye pan çerçevelerinde site yüksekliği sabit', () => {
  const wrap = (a) => ((a % 360) + 360) % 360, diff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
  const st = man.stops.find((s) => s.stop_id === 'msl_s120_d0934');
  const els = st.files.map((f) => dirs[f.name]);
  for (const d of els) assert.ok(diff(d.az_deg, wrap(d.az_rover_deg + d.rover_yaw_deg)) < 12);   // yaw'ın eğim etkisiyle fark küçük
  assert.ok(Math.max(...els.map((d) => d.el_deg)) - Math.min(...els.map((d) => d.el_deg)) < 0.5);   // aynı pan: dünya yüksekliği sabit
});

test('koni, pusula adı ve hizalama', () => {
  assert.equal(cardinal(0), 'K'); assert.equal(cardinal(350), 'K'); assert.equal(cardinal(95), 'D'); assert.equal(cardinal(95, true), 'E'); assert.equal(cardinal(225), 'GB');
  const f = fanPoints(100, 200, 90, 40, 50, 4);   // doğu (+x) yönünde 40° yelpaze
  assert.deepEqual(f[0], [100, 200]); assert.equal(f.length, 6);
  const mid = f[3]; assert.ok(Math.abs(mid[1] - 200) < 1e-9 && Math.abs(mid[0] - 150) < 1e-9);   // merkez ışın tam doğu
  const n = fanPoints(0, 0, 0, 0, 10, 1)[1]; assert.ok(Math.abs(n[0]) < 1e-9 && Math.abs(n[1] + 10) < 1e-9);   // kuzey = −z
  const v = alignView({ az_deg: 90, el_deg: -20, fov_deg: 45.4 }); assert.ok(Math.abs(v.yaw - Math.PI / 2) < 1e-9 && Math.abs(v.pitch + (20 * Math.PI) / 180) < 1e-9 && v.fov === 45.4);
});

test('loadDirs', async () => {
  const f = async () => ({ ok: true, json: async () => ({ frames: { a: { az_deg: 1 } } }) });
  assert.deepEqual(await loadDirs('u', f), { a: { az_deg: 1 } });
});
