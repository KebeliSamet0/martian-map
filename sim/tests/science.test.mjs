import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gridPxToXY, crismPixelOf, gridPxOfCrism, gridInsideCrism, mergeStops, nearestStop, createStopWatcher } from '../app/science.js';
import { radParams, perDayToUGyH, rateFromAssumptions, doseAt, doseBand, createDoseLog, routeDoseTable } from '../app/radiation.js';
import { buildLayerRows, countMeasuredTypes } from '../app/datalayers.js';

const J = (f) => JSON.parse(readFileSync(new URL(f, import.meta.url)));
const grid = J('../../contracts/grid.json'), science = J('../data/science.json'), crism = J('../data/science_crism.json'), texts = J('../data/texts.json');
const stopsRaw = J('../../layers/science_stops.json');

test('CRISM footprint ızgara kutusunu kapsar; ters dönüşüm tutarlı', () => {
  assert.ok(gridInsideCrism({ width: 1000, height: 1000, ...grid }, crism.map_info));
  const ij = crismPixelOf([433.5, 525.2], grid, crism.map_info);
  const back = gridPxOfCrism(ij, grid, crism.map_info);
  assert.ok(Math.abs(back[0] - 433.5) < 1e-6 && Math.abs(back[1] - 525.2) < 1e-6);
  assert.deepEqual(crism.stops.sci_1_sol4617.crism_px.map(Math.round), ij.map(Math.round));
  assert.equal(gridPxToXY([0, 0], grid)[0], grid.origin_xy_m[0]);
});

test('4 durak birleşir; hepsinde not, birim, kaynak ve geçerli piksel var', () => {
  const stops = mergeStops({ gridStops: stopsRaw, science, crism, texts });
  assert.equal(stops.length, 4);
  for (const s of stops) { assert.ok(s.hasNote, s.id); assert.ok(s.sources.length >= 2); assert.ok(s.pixel.valid); assert.ok(s.note.signature && s.note.why); }
});

test('nearestStop ve izleyici: giriş bir kez, ilk güncellemedeki durak sessiz', () => {
  const stops = mergeStops({ gridStops: stopsRaw, science, crism, texts });
  assert.equal(nearestStop([0, 0], stops, 10), null);
  const ev = [];
  const w = createStopWatcher({ stops, onEnter: (s, o) => ev.push(['in', s.id, o.silent]), onLeave: (s) => ev.push(['out', s.id]) });
  w.update(stops[0].px);              // doğuş noktası: sessiz
  w.update([stops[0].px[0] + 60, stops[0].px[1]]);   // 120 m uzak: çıkış
  w.update(stops[3].px); w.update(stops[3].px);      // Atacama: bir kez
  assert.deepEqual(ev, [['in', stops[0].id, true], ['out', stops[0].id], ['in', stops[3].id, false]]);
});

test('RAD: 0,21 mGy/gün = 8,75 µGy/sa; doz = hız × süre; belirsizlik %19', () => {
  const p = radParams(science.radiation);
  assert.ok(Math.abs(p.rateUGyH - 8.75) < 1e-9 && Math.abs(perDayToUGyH(0.21) - 8.75) < 1e-9);
  assert.ok(Math.abs(p.relUnc - 0.04 / 0.21) < 1e-9);
  assert.equal(doseAt(p.rateUGyH, 3600), 8.75);
  assert.equal(doseAt(8.75, -1), null);
  const [lo, hi] = doseBand(10, p.relUnc); assert.ok(lo < 10 && hi > 10);
  assert.equal(rateFromAssumptions([{ name: 'Yüzey doz hızı', value: 8.75 }]), 8.75);
  assert.equal(rateFromAssumptions([]), null);
});

test('Doz günlüğü ve rota tablosu: uzun rota daha çok doz', () => {
  const log = createDoseLog({ budgetUGy: 60 }); log.add(0, 0); log.add(600, 1.5); log.add(1200, 3);
  assert.equal(log.fraction(), 3 / 60);
  const rows = routeDoseTable([{ kind: 'shortest', label: 'A', total: { min: 60 } }, { kind: 'safest', label: 'B', total: { min: 90 } }, { kind: 'x', total: {} }], { rateUGyH: 8.75, budgetUGy: 60, chosenKind: 'safest' });
  assert.equal(rows[0].doseUGy, 8.75); assert.equal(rows[1].doseUGy, 13.125); assert.ok(rows[1].chosen);
  assert.ok(Math.abs(rows[1].deltaUGy - 4.375) < 1e-9); assert.equal(rows[2].doseUGy, null);
});

test('Veri katmanları: 5 satır, ≥3 ölçüm türü, tüm metinler ve kaynaklar dolu', () => {
  const rows = buildLayerRows({ science, texts, toggles: { crism: {}, rad: {}, overview: {} } });
  assert.equal(rows.length, 5);
  for (const r of rows) { assert.ok(r.type && r.name && r.where && r.kind && r.url && r.doc, r.id); }
  assert.ok(countMeasuredTypes(rows) >= 4);
  assert.equal(rows.find((r) => r.id === 'model').kind, 'model tahmini');
});
