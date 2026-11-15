import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const calls = [];
let apiMode = 'down';
globalThis.window = globalThis;
globalThis.document = { body: { append() {} }, createElement: () => ({ style: {}, setAttribute() {} }) };
globalThis.fetch = async (input, init) => {
  const url = String(input?.url ?? input);
  calls.push(url);
  if (url.startsWith('file:')) return new Response(readFileSync(fileURLToPath(url)), { status: 200 });
  if (apiMode === 'down') throw new TypeError('fetch failed');
  if (apiMode === '500') return new Response('{}', { status: 500 });
  return new Response('{"live":true}', { status: 200 });
};
await import('../app/offline.js');
const m = JSON.parse(readFileSync(new URL('../data/missions.json', import.meta.url))).missions[0];
const post = (body) => globalThis.fetch('http://x/route', { method: 'POST', body: JSON.stringify(body) });
const req = { start: m.start_px, goal: m.goal_px, budget: m.limits };

test('API yoksa görev çifti için önceden hesaplanmış rota döner', async () => {
  const r = await post(req);
  assert.equal(r.status, 200); assert.equal(r.headers.get('X-MM-Offline'), '1');
  assert.equal((await r.json()).routes.length, 3);
});
test('5xx de yedeğe düşer', async () => {
  apiMode = '500'; const r = await post(req); assert.equal(r.headers.get('X-MM-Offline'), '1');
});
test('bilinmeyen çift için yedek yok: hata fırlatır', async () => {
  apiMode = 'down'; await assert.rejects(post({ ...req, goal: [1, 1] }), /yedek yok/);
});
test('API sağlamsa canlı yanıt geçer, /replan\'e dokunulmaz', async () => {
  apiMode = 'up';
  assert.deepEqual(await (await post(req)).json(), { live: true });
  apiMode = 'down';
  await assert.rejects(globalThis.fetch('http://x/replan', { method: 'POST', body: '{}' }), /fetch failed/);
});
