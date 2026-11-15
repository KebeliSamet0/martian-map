import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { sampleField, footReading, segmentWhy, fogRGBA, loadTerrainField } from '../app/insight.js';
import { summarize, pathPx } from '../app/compare.js';
const texts = JSON.parse(await readFile(new URL('../data/texts.json', import.meta.url)));
const T = texts.insight, C = texts.compare;
// 2×1 ızgara: [toprak .1, ana kaya .1, kum .72, büyük kaya .08, güven .61] ve düşük güvenli hücre
const q = (a) => a.map((v) => Math.round(v * 255));
const field = { w: 2, h: 1, provisional: false, data: new Uint8Array([...q([.1, .1, .72, .08, .61]), ...q([.3, .3, .2, .2, .2])]) };

test('ayak altı: sınıf yüzdeleri, güven ve belirsiz etiketi', () => {
  const a = sampleField(field, [0.4, 0.9]);
  assert.equal(a.dominant, 'sand'); assert.equal(a.uncertain, false);
  const r = footReading(a, T);
  assert.match(r.text, /^ZEMİN: kum 72 % · ana kaya 10 %/); assert.match(r.text, /model güveni 61 %/);
  const b = footReading(sampleField(field, [1.5, 0]), T);
  assert.equal(b.uncertain, true); assert.match(b.text, /belirsiz$/);
  assert.equal(sampleField(field, [2, 0]), null); assert.equal(sampleField(field, [-1, 0]), null);
});

test('geçici zemin katmanı etiketi', () => {
  assert.equal(footReading(sampleField(field, [0, 0]), T, true).note, T.foot_provisional);
});

test('segment cümlesi: sınıf → katsayı → kcal; zayıf etkide sade biçim; düşük güven ve alternatif', () => {
  const seg = { id: 3, class: 'sand', rejected_alt: 'Dengeli rota burada ayrılıyor (60 m): daha yüksek risk.', insight: { p: { sand: 0.7 }, eta_mean: 1.4, extra_kcal: 38.2, confidence: 0.3 } };
  const s = segmentWhy(seg, T);
  assert.match(s, /^Segment 3: kum \(p=0\.7\) → zemin katsayısı ×1\.40 → \+38 kcal/);
  assert.match(s, /model güveni düşük \(30 %\)/); assert.match(s, /alternatif: Dengeli rota/);
  const flat = segmentWhy({ id: 1, class: 'bedrock', insight: { p: { bedrock: 0.97 }, eta_mean: 1.01, extra_kcal: 0.1, confidence: 0.95 } }, T);
  assert.match(flat, /zemin etkisi küçük/);
  assert.equal(segmentWhy({ id: 2, reason: 'eski' }, T), 'eski');
});

test('güven katmanı: yüksek güven saydam, düşük güven soluk', () => {
  const px = fogRGBA(field);
  assert.equal(px[3], 0); assert.ok(px[7] > 100);
});

test('terrain_u8 boyut denetimi', async () => {
  const bad = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(7), headers: { get: () => 'false' } });
  await assert.rejects(loadTerrainField('x', { w: 2, h: 1 }, bad), /boyutu/);
});

const mk = (naive, model, saved, nh, mh, same = false) => ({ kind: 'balanced', label: 'Dengeli', same_path: same, naive_hazard_m: nh, model_hazard_m: mh, saved,
  naive: { metrics: naive, segments: [] }, model: { metrics: model, segments: [] } });
test('özet cümlesi: enerji kazancı varsa tam cümle, yoksa dürüst risk cümlesi', () => {
  const nm = { m: 400, kcal: 100, o2_L: 20.8, risk: 40, sand_m: 120 }, mm = { m: 420, kcal: 80, o2_L: 16.7, risk: 20, sand_m: 0 };
  const full = summarize(mk(nm, mm, { kcal: 20, o2_L: 4.1, sand_m: 120, risk: 20 }, 120, 0), C);
  assert.equal(full.sentenceKey, 'sentence_full'); assert.match(full.sentence, /20 kcal ve 4,1 L O₂ kazandırdı, 120 m kumdan kaçındı/);
  const nm2 = { m: 560, kcal: 88, o2_L: 18.3, risk: 49, sand_m: 0 }, mm2 = { m: 570, kcal: 88, o2_L: 18.3, risk: 42, sand_m: 0 };
  const risk = summarize(mk(nm2, mm2, { kcal: 0, o2_L: 0, sand_m: 0, risk: 7 }, 71, 0), C);
  assert.equal(risk.sentenceKey, 'sentence_risk'); assert.match(risk.sentence, /^Model enerjiden değil güvenlikten kazandırdı: 71 m kumlu\/kayalık zeminden kaçındı, risk % 14 düştü\./);
  assert.equal(summarize(mk(nm2, nm2, { kcal: 0, o2_L: 0, sand_m: 0, risk: 0 }, 0, 0, true), C).sentenceKey, 'sentence_same');
  assert.equal(full.rows.find((r) => r.label === C.row_kcal).good, true);
});

test('pathPx tekrar eden uç noktaları atar', () => {
  assert.deepEqual(pathPx({ segments: [{ path_px: [[0, 0], [1, 1]] }, { path_px: [[1, 1], [2, 2]] }] }), [[0, 0], [1, 1], [2, 2]]);
});
