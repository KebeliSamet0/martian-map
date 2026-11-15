// API'nin 10 m içinde SNAP ettiği (rota döndüğü) dik A örneği ara; aynı çift için seçici davranışı steep_snap.js ile aynı mantıkta (canCompute=false).
const http = require('http');
const get = (u) => new Promise((res) => http.get(u, (r) => { const c = []; r.on('data', (x) => c.push(x)); r.on('end', () => res(Buffer.concat(c))); }));
const post = (u, o) => new Promise((res) => { const url = new URL(u), body = JSON.stringify(o); const rq = http.request({ hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } }, (r) => { let t = ''; r.on('data', (x) => (t += x)); r.on('end', () => res({ status: r.statusCode, body: t })); }); rq.on('error', (e) => res({ status: 0, body: e.message })); rq.end(body); });
(async () => {
  const b = await get('http://127.0.0.1:8000/layers/slope.bin'), s = new Float32Array(b.buffer, b.byteOffset, 1e6), sl = (c, r) => s[r * 1000 + c];
  const cands = [[116, 20], [167, 20], [173, 20], [409, 724], [393, 704], [437, 702]];   // son üçü çalışan 2'nin ab_ciftleri.json geçilmez noktaları (25–31°, 2 m)
  for (const a of cands) {
    let B = null; for (let d = 60; d < 200 && !B; d++) for (const [dx, dy] of [[d, 20], [-d, 20], [20, d], [20, -d]]) { const x = a[0] + dx, y = a[1] + dy; if (x > 0 && y > 0 && x < 999 && y < 999 && sl(x, y) < 25 && !B) B = [x, y]; }
    const r = await post('http://127.0.0.1:8000/route', { start: a, goal: B });
    let o = r.body.slice(0, 140); try { const j = JSON.parse(r.body); if (j.routes) o = 'rota var: ' + j.routes.map((x) => `${x.kind} ${x.total.km} km`).join(', '); else o = JSON.stringify(j).slice(0, 170); } catch {}
    console.log(JSON.stringify({ A: a, egimA: Math.round(sl(...a)), B, API: { http: r.status, ozet: o } }));
  }
})();
