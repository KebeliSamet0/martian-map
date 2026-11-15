// Salt okuma + tarayıcı: 10 m'den uzak/yakın dik (>=25°) A noktasında canlı API /route ile harita seçicinin (mappicker) davranışını karşılaştırır.
const http = require('http');
const { chromium } = require('C:/Users/Batu/Desktop/martian-map-main/martian-map-main/sim/node_modules/playwright-core');
const get = (u) => new Promise((res) => http.get(u, (r) => { const c = []; r.on('data', (x) => c.push(x)); r.on('end', () => res(Buffer.concat(c))); }));
const post = (u, o) => new Promise((res) => { const url = new URL(u), body = JSON.stringify(o); const rq = http.request({ hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } }, (r) => { let t = ''; r.on('data', (x) => (t += x)); r.on('end', () => res({ status: r.statusCode, body: t })); }); rq.on('error', (e) => res({ status: 0, body: e.message })); rq.end(body); });
(async () => {
  const b = await get('http://127.0.0.1:8000/layers/slope.bin'), s = new Float32Array(b.buffer, b.byteOffset, 1e6);
  const sl = (c, r) => s[r * 1000 + c];
  const passableNear = (c, r) => { for (let d = 0; d < 60; d++) for (let dc = -d; dc <= d; dc++) for (let dr = -d; dr <= d; dr++) { const x = c + dc, y = r + dr; if (Math.max(Math.abs(dc), Math.abs(dr)) === d && x > 0 && y > 0 && x < 999 && y < 999 && sl(x, y) < 25) return [x, y]; } };
  const cases = [{ ad: 'yakın (≤10 m: API snap eder)', a: [653, 501] }, { ad: 'uzak A (>10 m, 18 m)', a: [197, 47] }, { ad: 'uzak B (>10 m, 18 m)', a: [866, 236] }];
  const out = [];
  const br = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--no-sandbox'] });
  const p = await br.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto('http://127.0.0.1:8010/sim/?fixedres=1', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__mm?.flow && window.__mm?.wire, null, { timeout: 120000 });
  await p.click('[data-testid="intro-start"]'); await p.waitForTimeout(1500);
  await p.click('[data-testid="mission-go-custom"]'); await p.waitForFunction(() => window.__mm?.picker, null, { timeout: 60000 });
  for (const k of cases) {
    const bb = passableNear(Math.min(980, k.a[0] + 90), Math.min(980, k.a[1] + 70));
    const asB = k.ad.startsWith('uzak B');
    const A = asB ? bb : k.a, B = asB ? k.a : bb;
    const api = await post('http://127.0.0.1:8000/route', { start: A, goal: B });
    let apiTxt = api.body.slice(0, 160); try { const j = JSON.parse(api.body); apiTxt = j.routes ? `rota var: ${j.routes.map((r) => r.kind + ' ' + r.total.km + ' km').join(', ')}` : JSON.stringify(j).slice(0, 200); } catch {}
    await p.evaluate(([a, b2]) => { __mm.picker.setA(...a); __mm.picker.setB(...b2); }, [A, B]);
    const pk = await p.evaluate(() => ({ st: __mm.picker.state(), warn: document.querySelector('[data-testid="mp-warn"]')?.innerText, dis: document.querySelector('[data-testid="mp-compute"]')?.disabled }));
    out.push({ durum: k.ad, A, B, egimA: Math.round(sl(...A)), egimB: Math.round(sl(...B)), api: { http: api.status, ozet: apiTxt }, secici: { warn: pk.warn, hesaplaKapali: pk.dis, canCompute: pk.st.canCompute, nearA: pk.st.nearA, nearB: pk.st.nearB } });
  }
  await p.screenshot({ path: 'steep_snap_secici.png' });
  await br.close();
  console.log(JSON.stringify(out, null, 1));
})();
