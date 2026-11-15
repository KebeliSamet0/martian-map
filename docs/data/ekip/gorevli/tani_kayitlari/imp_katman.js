// Salt okuma + tarayıcı (20° tur): harita seçicideki "Geçilmez alan" katmanı (kırmızı) gerçekten slope >= 20° hücreleri mi boyuyor?
// Katman açık/kapalı iki kareyi karşılaştırır; kırmızı artışı, API slope.bin'den hesaplanan >=20° ve >=25° oranlarıyla kıyaslanır.
const http = require('http');
const { chromium } = require('C:/Users/Batu/Desktop/martian-map-main/martian-map-main/sim/node_modules/playwright-core');
const get = (u) => new Promise((res) => http.get(u, (r) => { const c = []; r.on('data', (x) => c.push(x)); r.on('end', () => res(Buffer.concat(c))); }));
(async () => {
  const b = await get('http://127.0.0.1:8000/layers/slope.bin'), s = new Float32Array(b.buffer, b.byteOffset, 1e6);
  let n20 = 0, n25 = 0, n15 = 0; for (const v of s) { if (v >= 20) n20++; if (v >= 25) n25++; if (v >= 15) n15++; }
  const br = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--no-sandbox'] });
  const p = await br.newPage({ viewport: { width: 1280, height: 720 } });
  await p.goto((process.env.SIM || 'http://127.0.0.1:8012/sim/') + '?fixedres=1', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__mm?.flow && window.__mm?.wire, null, { timeout: 120000 });
  await p.click('[data-testid="intro-start"]'); await p.waitForTimeout(1500);
  await p.click('[data-testid="mission-go-custom"]'); await p.waitForFunction(() => window.__mm?.picker, null, { timeout: 60000 });
  await p.waitForTimeout(3000);
  const read = () => p.evaluate(() => {
    const cv = [...document.querySelectorAll('[data-testid="mappicker"] canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const g = cv.getContext('2d'), d = g.getImageData(0, 0, cv.width, cv.height).data; let red = 0, tot = 0;
    for (let i = 0; i < d.length; i += 4 * 7) { tot++; if (d[i] > 150 && d[i] > d[i + 1] * 1.6 && d[i] > d[i + 2] * 1.6) red++; }
    return { w: cv.width, h: cv.height, red, tot };
  });
  const tog = await p.evaluate(() => [...document.querySelectorAll('[data-testid="mappicker"] label, [data-testid="mappicker"] button, [data-testid="mappicker"] input')].map((e) => (e.innerText || e.title || e.type || '').slice(0, 40)));
  const labels = await p.$$('[data-testid="mappicker"] input[type=checkbox]');
  const out = { cizelge: { slope_ge15_pct: +(n15 / 1e4).toFixed(2), slope_ge20_pct: +(n20 / 1e4).toFixed(2), slope_ge25_pct: +(n25 / 1e4).toFixed(2) }, kontroller: tog, onay_kutulari: labels.length };
  const before = await read();
  for (const l of labels) { const txt = await l.evaluate((e) => e.parentElement?.innerText || ''); if (/Geçilmez/.test(txt)) { if (!(await l.isChecked())) await l.check(); out.secilen = txt; } }
  await p.waitForTimeout(800);
  const on = await read();
  for (const l of labels) { const txt = await l.evaluate((e) => e.parentElement?.innerText || ''); if (/Geçilmez/.test(txt)) await l.uncheck(); }
  await p.waitForTimeout(800);
  const off = await read();
  out.kirmizi_oran = { baslangic: +(100 * before.red / before.tot).toFixed(2), acik: +(100 * on.red / on.tot).toFixed(2), kapali: +(100 * off.red / off.tot).toFixed(2) };
  await p.screenshot({ path: 'imp_katman_20deg.png' });
  await br.close();
  console.log(JSON.stringify(out, null, 1));
})();
