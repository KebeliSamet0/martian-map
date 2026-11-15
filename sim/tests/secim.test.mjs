// tur5:secim — seçim ekranı yardımcıları: düz hat geçilmezliği (erişilebilirliği Batu'nun mainComponentMask'i sağlar)
import test from 'node:test';
import assert from 'node:assert/strict';
import { lineImpassable, GRID_W, GRID_H } from '../app/custommission.js';

const flat = (deg = 5) => new Float32Array(GRID_W * GRID_H).fill(deg);
const wall = (s, col) => { for (let r = 0; r < GRID_H; r++) s[r * GRID_W + col] = 30; };

test('lineImpassable: düz zeminde oran 0, duvar kesince > 0', () => {
  assert.equal(lineImpassable(flat(), [10, 10], [100, 10]).fraction, 0);
  const s = flat(); wall(s, 50);
  const li = lineImpassable(s, [10, 10], [100, 10]);
  assert.ok(li.fraction > 0 && li.fraction < 0.1);
  assert.equal(lineImpassable(null, [0, 0], [1, 1]), null);
});
