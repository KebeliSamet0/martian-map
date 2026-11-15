import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldRequest, requestFor, neighbourStarts, createLiveRoute, LIVE_MOVE_M } from '../app/liveroute.js';

test('canlı rota: ilk istek hemen, sonra hareket ya da süreyle', () => {
  const st = { busy: false, lastPos: null, lastAt: -1e9 };
  assert.equal(shouldRequest(st, [0, 0], 0), true);
  st.lastPos = [0, 0]; st.lastAt = 10;
  assert.equal(shouldRequest(st, [1, 0], 10.5), false);              // çok erken
  assert.equal(shouldRequest(st, [LIVE_MOVE_M, 0], 11), true);       // 3 m yürüdü
  assert.equal(shouldRequest(st, [0.2, 0], 20), false);              // duruyor: istek yok
  assert.equal(shouldRequest(st, [0.6, 0], 15), true);               // 4 sn + az hareket
  assert.equal(shouldRequest({ ...st, busy: true }, [9, 9], 99), false);
});

test('canlı rota: gözlem varsa /replan, yoksa /route; base_px hedef üs değilse', () => {
  const a = requestFor({ px: [1, 2], goalPx: [5, 6], budget: { o2_L: 10 }, basePx: [0, 0] });
  assert.equal(a.path, '/route'); assert.deepEqual(a.body.base_px, [0, 0]); assert.equal(a.body.budget.o2_L, 10);
  const b = requestFor({ px: [1, 2], goalPx: [0, 0], basePx: [0, 0] }, [{ px: [3, 3], radius_m: 20, cls: 'sand' }]);
  assert.equal(b.path, '/replan'); assert.equal(b.body.base_px, undefined); assert.equal(b.body.observations[0].cls, 'sand');
});

test('canlı rota: komşu başlangıçlar yakından uzağa', () => {
  const n = neighbourStarts([10, 10]);
  assert.equal(n.length, 8 + 16); assert.deepEqual(n[0], [9, 9]);
});

test('canlı rota: yanıt kurulur, 422 komşuyla yeniden denenir, aşama değişince atılır', async () => {
  let gen = 'out:5,6', installed = [];
  const calls = [];
  const lr = createLiveRoute({
    call: async (path, body) => { calls.push([path, body.start]); if (body.start[0] === 1 && body.start[1] === 2) throw new Error('API 422'); return { routes: [{ kind: 'balanced', total: { km: 0.4, go: true } }] }; },
    ctx: () => ({ pos: [0, 0], px: [1, 2], goalPx: [5, 6], kind: 'balanced', gen }),
    install: (rt, info) => installed.push([rt.total.km, info.startPx]),
  });
  await lr.update(0);
  assert.equal(installed.length, 1); assert.deepEqual(installed[0][1], [0, 1]);   // ilk komşu
  assert.equal(lr.state().n, 1);
  lr.observe({ px: [3, 3], radius_m: 20, cls: 'sand' });
  const p = lr.force(1); gen = 'return:0,0'; await p;
  assert.equal(installed.length, 1, 'aşama değişti: sonuç kurulmaz');
  assert.equal(calls.at(-1)[0], '/replan');
});
