#!/usr/bin/env node
/**
 * Martian Map — otomatik kabul testi (tek komut).
 *   node akis_testi.js            (bu klasörden; ayrıntı için README.md)
 *
 * Ne yapar: sim'i 127.0.0.1:8010'da (repo kökü = mm-pr/main-wt, ?dev=1 modu) kendisi başlatır, API'yi
 * (127.0.0.1:8000) kontrol eder, headless Chrome (swiftshader) ile 7 test koşar,
 * test_sonucu.json yazar, özet tablo basar. Çıkış kodu: tümü PASS ise 0, değilse 1.
 * Repo dosyalarına YAZMAZ; yalnız bu klasöre (test_sonucu.json, shots/) yazar.
 *
 * Ortam değişkenleri (hepsi isteğe bağlı):
 *   CHROME_PATH   Chrome yolu (vars: işletim sistemine göre; macOS: /Applications/Google Chrome.app/...)   [MM_CHROME de olur]
 *   PW_CORE       playwright-core yolu (vars: require('playwright-core'), yoksa bu repodaki sim/node_modules)  [MM_PW de olur]
 *   REAL_GPU=1    gerçek GPU'lu Chrome: swiftshader bayraklarını kapatır, ekranlı (headed) açılmaz ama GPU kullanır;
 *                 ?perf=1 sonucu (ort FPS, p95 ms) test_sonucu.json -> perf alanına yazılır ve eşik (p95<=22 ms, ort>=45 FPS) assert edilir
 *   HEADED=1      pencereli Chrome
 *   MM_REPO_ROOT  sim'in servis edileceği repo kökü (içinde sim/index.html olmalı)
 *   MM_PORT       sim portu (vars: 8010)        MM_API  API tabanı (vars: http://127.0.0.1:8000)
 *   MM_PERF_MS    perf probu bekleme üst sınırı, ms (vars: 150000)
 *   MM_SCENARIOS  virgüllü liste (vars: S1,S2,S3)   MM_SHOTS=0  ekran görüntüsü alma
 *   MM_RUNS=N     testi üst üste N kez koşar (ayrı süreçlerde) ve kararlılığı test_sonucu.json -> kararlilik alanına yazar
 *   MM_RESULT_FILE  sonuç dosyası adı (vars: test_sonucu.json)
 */
'use strict';
const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn, spawnSync } = require('child_process');

const env = process.env;
const exists = (p) => { try { return fs.existsSync(p); } catch { return false; } };
const WIN_REPO = 'C:/Users/Batu/Desktop/mm-pr/main-wt';
function detectRepo() {            // yukarı doğru sim/index.html olan ilk klasör
  let d = __dirname;
  for (let i = 0; i < 8; i++) { if (exists(path.join(d, 'sim', 'index.html'))) return d; d = path.dirname(d); }
  return null;
}
const REPO = env.MM_REPO_ROOT || (exists(path.join(WIN_REPO, 'sim/index.html')) ? WIN_REPO : detectRepo() || WIN_REPO);
const PORT = Number(env.MM_PORT || 8010);
const API = env.MM_API || 'http://127.0.0.1:8000';
const REAL_GPU = env.REAL_GPU === '1';
const HEADED = env.HEADED === '1';
const CHROME = env.CHROME_PATH || env.MM_CHROME || ({
  win32: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  darwin: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
}[process.platform] || '/usr/bin/google-chrome');
function resolvePW() {
  if (env.PW_CORE || env.MM_PW) return env.PW_CORE || env.MM_PW;
  try { return require.resolve('playwright-core'); } catch { /* sıradaki */ }
  for (const c of [path.join(REPO, 'sim/node_modules/playwright-core'), 'C:/Users/Batu/Desktop/martian-map-main/martian-map-main/sim/node_modules/playwright-core']) if (exists(c)) return c;
  return 'playwright-core';
}
const PW = resolvePW();
const PERF_MS = Number(env.MM_PERF_MS || 150000);
const SCEN = (env.MM_SCENARIOS || 'S1,S2,S3').split(',');
const SHOTS = env.MM_SHOTS !== '0';
const ONLY = env.MM_ONLY ? env.MM_ONLY.split(',').map((x) => x.trim().toUpperCase()) : null;   // ör. MM_ONLY=T7 (hızlı duman testi; yalnız seçilenleri koşar, sonuç 'KISMI' sayılır)
const want = (...ids) => !ONLY || ids.some((i) => ONLY.includes(i));
const RESULT_FILE = env.MM_RESULT_FILE || 'test_sonucu.json';
const OUT = __dirname;
const SHOT_DIR = path.join(OUT, 'shots');
const BASE = `http://127.0.0.1:${PORT}/sim/`;
const API_Q = env.MM_API ? `&api=${encodeURIComponent(env.MM_API)}` : '';   // sim varsayılanı 127.0.0.1:8000; başka API için ?api=
const SAND_XZ = [3210, 4782]; // S1 kum bölgesi merkezi (dünya m) — scan_lines.js / env_row.js ile aynı
const CHROME_ARGS = REAL_GPU
  ? ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--no-sandbox']
  : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'];

const { chromium } = require(PW);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- sonuç defteri
const tests = {};        // id -> { id, title, checks:[{n,ok,d}], status }
const T = (id, title) => (tests[id] = tests[id] || { id, title, checks: [], status: 'PASS' });
function check(t, n, ok, d = '') {
  t.checks.push({ n, ok: !!ok, d: String(d).slice(0, 300) });
  if (!ok) t.status = 'FAIL';
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  [${t.id}] ${n}${d ? '  — ' + String(d).slice(0, 160) : ''}`);
  return !!ok;
}
let perfResult = null;
const consoleAll = [];   // { page, type, text, url }
const ignored = [];

// ---------------------------------------------------------------- sunucu / API
function get(url, ms = 4000) {
  return new Promise((resolve) => {
    const rq = http.get(url, (res) => { let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => resolve({ status: res.statusCode, body: b })); });
    rq.setTimeout(ms, () => { rq.destroy(); resolve({ status: 0, body: '' }); });
    rq.on('error', () => resolve({ status: 0, body: '' }));
  });
}
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.txt': 'text/plain; charset=utf-8' };
// python -m http.server (listen backlog=5) swiftshader altında paralel karo isteklerinde ERR_CONNECTION_REFUSED verdi;
// aynı işi yapan (repo kökünü statik servis eder) Node sunucusu backlog=1024 ile kullanılır. MM_PYTHON=1 ile python'a dönülebilir.
function post(url, body = '{}', ms = 5000) {
  return new Promise((resolve) => {
    const u = new URL(url);
    const rq = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } }, (res) => { res.resume(); res.on('end', () => resolve({ status: res.statusCode })); });
    rq.setTimeout(ms, () => { rq.destroy(); resolve({ status: 0 }); }); rq.on('error', () => resolve({ status: 0 })); rq.end(body);
  });
}
async function startServer() {
  const probe = await get(BASE);
  if (probe.status === 200) { console.log(`sunucu zaten ${PORT}'da cevap veriyor; yeniden kullanılıyor`); return { kill() {} }; }
  if (process.env.MM_PYTHON === '1') {
    const child = spawn('python', ['-m', 'http.server', String(PORT), '--bind', '127.0.0.1'], { cwd: REPO, stdio: 'ignore', windowsHide: true });
    for (let i = 0; i < 40; i++) { await sleep(250); if ((await get(BASE)).status === 200) return child; }
    child.kill(); throw new Error('python sunucusu açılmadı');
  }
  const root = path.resolve(REPO);
  const srv = http.createServer((req, res) => {
    let rel; try { rel = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400).end(); return; }
    let f = path.resolve(root, '.' + rel);
    if (f !== root && !f.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.stat(f, (e, st) => {
      if (!e && st.isDirectory()) f = path.join(f, 'index.html');
      fs.stat(f, (e2, st2) => {
        if (e2 || !st2.isFile()) { res.writeHead(404, { 'content-type': 'text/plain' }).end('404'); return; }
        res.writeHead(200, { 'content-type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'content-length': st2.size, 'cache-control': 'no-store' });
        fs.createReadStream(f).on('error', () => res.destroy()).pipe(res);
      });
    });
  });
  await new Promise((ok, bad) => { srv.once('error', bad); srv.listen({ port: PORT, host: '127.0.0.1', backlog: 1024 }, ok); });
  return { kill() { srv.close(); srv.closeAllConnections?.(); } };
}

// ---------------------------------------------------------------- sayfa yardımcıları
async function newPage(browser, label, w = 1200, h = 700) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleAll.push({ page: label, type: m.type(), text: m.text().slice(0, 300), url: m.location()?.url || '' }); });
  p.on('pageerror', (e) => consoleAll.push({ page: label, type: 'pageerror', text: String(e.message).slice(0, 300), url: '' }));
  return p;
}
const shot = async (p, name) => { if (SHOTS) { try { fs.mkdirSync(SHOT_DIR, { recursive: true }); await p.screenshot({ path: path.join(SHOT_DIR, name) }); } catch { /* önemsiz */ } } };
const load = async (p, q = '?fixedres=1&dev=1' + API_Q) => {
  await p.goto(BASE + q, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__mm && window.__mm.mapView && window.__mm.wire, null, { timeout: 120000 });
};

// ---------------------------------------------------------------- T1 + T3 + T4: S1..S3 akışı
async function runScenario(browser, id, t1, t3, t4) {
  const p = await newPage(browser, id);
  const step = (n, ok, d) => check(t1, `${id}: ${n}`, ok, d);
  try {
    await load(p);
    await p.click(`#missions button[data-mission="${id}"]`);
    await p.waitForFunction(() => /başla|Limit|hesapla/i.test(document.querySelector('#mission-ui')?.innerText || ''), null, { timeout: 30000 }).catch(() => {});
    const brief = await p.evaluate(() => document.querySelector('#mission-ui')?.innerText || '');
    step('brifing açılır', /başla|Limit/i.test(brief), brief.replace(/\n/g, ' ').slice(0, 90));
    await shot(p, `${id}_1_brifing.png`);

    // brifing düğmesi: data-testid="briefing-start" (metni "Rotaları hesapla"); rota kartları API /route dönünce açılır
    await p.click('[data-testid="briefing-start"]', { timeout: 15000 });
    await p.waitForFunction(() => document.querySelectorAll('.mm-route').length > 0, null, { timeout: 30000 }).catch(() => {});
    const cards = await p.evaluate(() => [...document.querySelectorAll('.mm-route')].map((c) => c.innerText.replace(/\n+/g, ' ').slice(0, 60)));
    step('3 rota kartı', cards.length === 3, JSON.stringify(cards.map((c) => c.slice(0, 30))));
    await shot(p, `${id}_2_rotalar.png`);

    const alts = await p.evaluate(() => __mm.mapView.alternatives.map((a) => a.kind + ':' + a.source));
    step("3 rota API'den (source=api*)", alts.length === 3 && alts.every((l) => /api/.test(l)), alts.join(','));

    await p.evaluate(() => document.querySelector('.mm-route-safest [data-testid="route-pick"]')?.click()); await p.waitForTimeout(800);
    const kind = await p.evaluate(() => __mm.mapView.route?.kind);
    step('en güvenli seçilir (kind=safest)', kind === 'safest', 'kind=' + kind);

    // oyun akışında seçim yürüyüşü kendiliğinden başlatır (autoWalk); başlamadıysa elle başlat
    if (!(await p.evaluate(() => !!__mm.routeRun))) await p.evaluate(() => __mm.enter3D('auto'));
    await p.waitForTimeout(8000);
    const run = await p.evaluate(() => ({ total: Math.round(__mm.routeRun?.total || 0), ms: __mm.wire.machine?.snapshot().state, sand: !!__mm.wire.selected?.sand }));
    step('3B yürüyüş başlar (total>0, durum=walking)', run.total > 0 && run.ms === 'walking', JSON.stringify(run));
    await shot(p, `${id}_3_yuruyus.png`);

    // ---- T4 dinleyici + T3 dinleyici (olaylar tetiklenmeden önce)
    await p.evaluate(() => {
      window.__arr = []; window.__sandEv = [];
      addEventListener('mission:arrived', (e) => window.__arr.push(e.detail?.state ?? true));
      __mm.wire.machine.on('event', (e) => { const P = __mm.P; window.__sandEv.push({ id: e.id, type: e.type, radius_m: e.radius_m, trigger_m: e.trigger_m, world: e.world, px: P.x, pz: P.z }); });
    });

    // ---- kum olayı: rotayı 5 m adımlarla ilerlet
    // Kum merkezine uzakken 12 m, eşiğe yaklaşınca 3 m adım; her adımdan sonra 2 kare beklenir ki mission machine
    // konumu kare kare görsün (60 ms bekleyip 5 m atlayınca oyuncu olay raporlanmadan 20-50 m öteye geçiyordu;
    // yazılım GL ~1 FPS'te sabit 3 m adım ise bir senaryoyu ~3 dk uzatıyordu).
    const sand = await p.evaluate(async () => {
      const R = __mm.routeRun, c = __mm.wire.machine, sel = __mm.wire.selected;
      const sw = sel?.sand ? __mm.wire.coords.cellToWorld(sel.sand.px) : null, thr = sel?.sand ? sel.sand.radius_m + 40 : 0;
      const frames = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      let s = 0;
      while (s < R.total) {
        R.s = s; await frames();
        if (window.__sandEv.length || c.snapshot().state === 'event') return { s, tot: Math.round(R.total) };
        const d = sw ? Math.hypot(__mm.P.x - sw[0], __mm.P.z - sw[1]) : 1e9;
        s += d > thr + 40 ? 12 : 3;
      }
      return null;
    });
    const hasSand = run.sand;
    if (hasSand) await shot(p, `T3_kum_olayi_${id}.png`);
    if (hasSand) step('kum olayı tetiklenir', !!sand, JSON.stringify(sand)); else step('kum olayı: bu senaryoda kum yok (atlandı)', true, 'selected.sand yok');
    const ev = await p.evaluate(() => window.__sandEv[0] || null);
    if (hasSand) {
      const ok = !!ev && ev.type === 'sand';
      check(t3, `${id}: kum olayı machine'den gelir`, ok, JSON.stringify(ev));
      if (ev) {
        const dist = Math.hypot(ev.px - ev.world[0], ev.pz - ev.world[1]);
        const thr = ev.radius_m + 40, TOL = 8; // 3 m adım + kare gecikmesi payı; alt sınır da var (geç tetikleme yakalansın)
        check(t3, `${id}: trigger_m = radius_m + 40`, ev.trigger_m === thr, `radius_m=${ev.radius_m} trigger_m=${ev.trigger_m} beklenen=${thr}`);
        check(t3, `${id}: oyuncu radius_m+40 m'de (−${TOL}…+2 m) tetiklendi, kum dairesine girmeden`, dist <= thr + 2 && dist >= thr - TOL && dist > ev.radius_m, `mesafe=${dist.toFixed(1)} m, eşik=${thr} m`);
      }
    }
    if (sand) {
      await p.waitForTimeout(9000);
      const rp = await p.evaluate(() => ({ replanned: !!__mm.routeRun?.replanned, toast: document.getElementById('toast')?.textContent.slice(0, 80) }));
      step('rota yeniden planlanır (replan)', rp.replanned, rp.toast);
      await shot(p, `${id}_4_kum_replan.png`);
    }

    // ---- hedefe varış
    const tot = await p.evaluate(() => __mm.routeRun.total); await p.evaluate((t) => __mm.setProgress((t - 8) / t), tot);
    let rep = false;
    for (let i = 0; i < 12; i++) { await p.waitForTimeout(2000); rep = await p.evaluate(() => !!document.querySelector('.mm-grade-letter')); if (rep) break; }
    const paused = await p.evaluate(() => __mm.stats().paused);
    step('hedefte durur (paused=true)', paused === true, 'paused=' + paused);
    step('karne açılır (.mm-grade-letter)', rep);
    const karne = await p.evaluate(() => document.querySelector('.mm-grade')?.innerText.replace(/\n/g, ' ').slice(0, 80) || '');
    step('karne içeriği boş değil', karne.length > 0, karne);
    await shot(p, `${id}_5_karne.png`);
    const arr = await p.evaluate(() => window.__arr);
    check(t4, `${id}: 'mission:arrived' window olayı geldi`, arr.length >= 1, 'olay sayısı=' + arr.length + ' detail.state=' + JSON.stringify(arr[0]));
  } catch (e) {
    step('İSTİSNA: ' + String(e.message).split('\n')[0].slice(0, 140), false);
    if (!t4.checks.some((c) => c.n.startsWith(id))) check(t4, `${id}: 'mission:arrived' (akış kesildi)`, false, 'akış istisna ile bitti');
  } finally { await p.close(); }
}

// ---------------------------------------------------------------- T2: L taraması
async function runScan(browser, t) {
  const p = await newPage(browser, 'scan');
  try {
    await load(p);
    await p.evaluate(([x, z]) => __mm.teleport(x - 30, z + 10, -0.6, -0.35, 'walk', 6), SAND_XZ);
    await p.waitForTimeout(9000);
    await p.evaluate(() => { __mm.scan(false); __mm.scanAt?.(2.2); }); await p.waitForTimeout(6000);
    const leg = await p.evaluate(() => { const e = document.getElementById('scanleg'); return { text: e?.innerText || '', hidden: !e || e.hidden }; });
    check(t, 'lejant görünür (#scanleg)', !leg.hidden, 'hidden=' + leg.hidden);
    check(t, "lejantta 'Dikkat' etiketi", /dikkat/i.test(leg.text), leg.text.replace(/\n/g, ' '));
    check(t, "lejantta 'Geçilmez' etiketi", /geçilmez/i.test(leg.text), leg.text.replace(/\n/g, ' '));
    await shot(p, 'scan_lines.png');
  } catch (e) { check(t, 'İSTİSNA', false, e.message.split('\n')[0]); } finally { await p.close(); }
}

// ---------------------------------------------------------------- T5: HUD satırları
async function runHud(browser, t) {
  const p = await newPage(browser, 'hud', 1100, 650);
  try {
    await load(p);
    await p.evaluate(() => __mm.enter3D('walk')); await p.waitForTimeout(7000);
    await p.evaluate(([x, z]) => __mm.teleport(x, z, 0, -0.1, 'walk'), SAND_XZ); await p.waitForTimeout(4000);
    // zemin katmanı API'den geç yüklenebilir (yazılım GL ~1 FPS): satırlar görünene dek en çok 40 sn bekle
    await p.waitForFunction(() => /Zemin \(model\)/.test(document.getElementById('hud')?.innerText || '') && /Gale ortam \(REMS\)/.test(document.getElementById('hud')?.innerText || ''), null, { timeout: 40000 }).catch(() => {});
    const hud = await p.evaluate(() => document.getElementById('hud')?.innerText || '');
    check(t, "HUD'da 'Zemin (model)' satırı", /Zemin \(model\)/.test(hud), (hud.match(/Zemin \(model\)[^\n]*\n?[^\n]*/) || [''])[0]);
    check(t, "HUD'da 'Gale ortam (REMS)' satırı", /Gale ortam \(REMS\)/.test(hud), (hud.match(/Gale ortam \(REMS\)[^\n]*\n?[^\n]*/) || [''])[0]);
    await shot(p, 'hud.png');
  } catch (e) { check(t, 'İSTİSNA', false, e.message.split('\n')[0]); } finally { await p.close(); }
}

// ---------------------------------------------------------------- T7: perf probu
async function runPerf(browser, t) {
  const p = await newPage(browser, 'perf', 1000, 600);
  const pl = []; p.on('console', (m) => { if (/PerfProbe/.test(m.text())) pl.push(m.text().slice(0, 220)); });
  try {
    await p.goto(BASE + '?fixedres=1&dev=1&perf=1' + API_Q, { waitUntil: 'load' });
    await p.waitForFunction(() => window.__mm, null, { timeout: 120000 });
    await p.waitForFunction(() => document.getElementById('perf-probe-live-hud') || document.getElementById('perf-probe-overlay'), null, { timeout: 60000 }).catch(() => {});
    check(t, 'prob açıldı (konsolda "[PerfProbe] ... başlatılıyor" + canlı HUD)', pl.some((l) => /başlatılıyor/.test(l)) && (await p.evaluate(() => !!(document.getElementById('perf-probe-live-hud') || document.getElementById('perf-probe-overlay')))), pl[0] || 'log yok');
    // Prob 30 sn senaryo koşar; bitişte rapor penceresi (#perf-probe-overlay) açılır.
    const done = await p.waitForFunction(() => document.getElementById('perf-probe-overlay'), null, { timeout: PERF_MS }).then(() => true).catch(() => false);
    check(t, 'prob 30 sn senaryoyu bitirip rapor açar (#perf-probe-overlay)', done, done ? 'rapor açıldı' : `${PERF_MS / 1000} sn içinde rapor yok`);
    const bad = pl.filter((l) => /PerfProbe HATA/.test(l));
    check(t, "'[PerfProbe HATA]' yok", bad.length === 0 && !consoleAll.some((c) => c.page === 'perf' && /PerfProbe HATA/.test(c.text)), bad[0] || '');
    const rep = await p.evaluate(() => window.__perfReport || null).catch(() => null);
    if (rep) {
      perfResult = { mod: REAL_GPU ? 'REAL_GPU' : 'swiftshader (yazılım GL; FPS değerleri GPU performansı DEĞİLDİR)', fps_ort: rep.fps?.avg, fps_p50: rep.fps?.p50, fps_min: rep.fps?.min, kare_ms_ort: rep.frameTimeMs?.avg, kare_ms_p95: rep.frameTimeMs?.p95, kare_ms_p99: rep.frameTimeMs?.p99, cizim_cagrisi_ort: rep.render?.callsAvg, ucgen_ort: rep.render?.trianglesAvg, kare_sayisi: rep.meta?.totalFrames, kriter: rep.criteria, donanim: { gpu: rep.hardware?.gpuRenderer, cozunurluk: rep.hardware?.canvasResolution, userAgent: rep.hardware?.userAgent } };
      check(t, 'perf raporu okundu (ort FPS, p95 ms)', rep.fps?.avg > 0 && rep.frameTimeMs?.p95 > 0, `ort ${rep.fps?.avg} FPS, p95 ${rep.frameTimeMs?.p95} ms (${perfResult.mod})`);
      if (REAL_GPU) check(t, 'GERÇEK GPU eşiği: p95 <= 22 ms ve ort >= 45 FPS', !!rep.criteria?.overallPassed, `p95 ${rep.criteria?.p95ActualMs} ms, ort ${rep.criteria?.avgFpsActual} FPS, GPU: ${rep.hardware?.gpuRenderer}`);
    } else if (done) check(t, 'perf raporu okundu', false, 'window.__perfReport yok');
    await shot(p, 'perf.png');
  } catch (e) { check(t, 'İSTİSNA', false, e.message.split('\n')[0]); } finally { await p.close(); }
}

// ---------------------------------------------------------------- T6: konsol
function evalConsole(t) {
  const errs = consoleAll.filter((c) => (c.type === 'error' || c.type === 'pageerror') && !/PerfProbe HATA/.test(c.text));
  const keep = [];
  for (const c of errs) {
    const isRes = /Failed to load resource/i.test(c.text);
    if (isRes && /ERR_FAILED/.test(c.text)) ignored.push({ ...c, why: 'ERR_FAILED (kaynak yüklenemedi; talimat gereği hariç)' });
    else if (isRes && /404/.test(c.text) && /tiles_fixed/.test(c.url)) ignored.push({ ...c, why: 'tiles_fixed 404 (varsayılan karo klasörü yok -> sim yedek tiles/ klasörüne düşer; tiles-base.js)' });
    else keep.push(c);
  }
  const byWhy = {}; for (const i of ignored) byWhy[i.why] = (byWhy[i.why] || 0) + 1;
  t.ignored = byWhy;
  check(t, `konsolda beklenmeyen hata yok (${errs.length} hata, ${ignored.length} tanesi bilinen/hariç)`, keep.length === 0, keep.slice(0, 3).map((k) => `[${k.page}] ${k.text.slice(0, 120)} <${k.url.slice(0, 80)}>`).join(' || '));
  t.keep = keep.slice(0, 10);
}
async function consoleShot(browser) {
  if (!SHOTS) return;
  const esc = (x) => String(x).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const rows = consoleAll.filter((c) => c.type !== 'warning').map((c) => `<tr><td>${esc(c.page)}</td><td>${esc(c.type)}</td><td>${esc(c.text)}</td><td>${esc(c.url)}</td></tr>`).join('') || '<tr><td colspan=4>konsolda error/pageerror yok</td></tr>';
  const p = await browser.newPage({ viewport: { width: 1200, height: 500 } });
  await p.setContent(`<body style="font:12px monospace;background:#111;color:#ddd"><h3>T6 — tüm sayfaların konsol error/pageerror kayıtları (${consoleAll.length} kayıt, warning dahil)</h3><table border=1 cellpadding=3>${rows}</table></body>`);
  fs.mkdirSync(SHOT_DIR, { recursive: true }); await p.screenshot({ path: path.join(SHOT_DIR, 'T6_konsol.png') }); await p.close();
}

function shotMap() {
  let f = []; try { f = fs.readdirSync(SHOT_DIR); } catch { /* yok */ }
  const pick = (re) => f.filter((x) => re.test(x)).map((x) => 'shots/' + x);
  return { T1: pick(/^S\d_[1-3]_/), T2: pick(/^scan_lines/), T3: pick(/^T3_|_4_kum_replan/), T4: pick(/_5_karne/), T5: pick(/^hud/), T6: pick(/^T6_/), T7: pick(/^perf/) };
}

// MM_RUNS=N: testi N kez ayrı süreçte koş, kararlılığı raporla
if (Number(env.MM_RUNS || 1) > 1 && !env.MM_CHILD) {
  const N = Number(env.MM_RUNS), runs = [];
  for (let i = 1; i <= N; i++) {
    const rf = RESULT_FILE.replace(/.json$/, "") + `_kosu${i}.json`;
    console.log(`
######## KOŞU ${i}/${N} ########`);
    spawnSync(process.execPath, [__filename], { stdio: 'inherit', env: { ...env, MM_CHILD: '1', MM_RESULT_FILE: rf } });
    try { runs.push({ dosya: rf, ...JSON.parse(fs.readFileSync(path.join(OUT, rf), 'utf8')) }); } catch { runs.push({ dosya: rf, genel: 'SONUC_YOK', ozet: [] }); }
  }
  const ids = ['ON', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const tablo = ids.map((id) => ({ id, durumlar: runs.map((r) => r.ozet.find((o) => o.id === id)?.durum || 'YOK') }));
  const stable = tablo.every((x) => new Set(x.durumlar).size === 1);
  const final = { ...runs[runs.length - 1], kararlilik: { kosu_sayisi: N, kararli: stable, genel_durumlar: runs.map((r) => r.genel), test_basina: tablo, sureler_sn: runs.map((r) => r.sure_sn), dosyalar: runs.map((r) => r.dosya) } };
  fs.writeFileSync(path.join(OUT, RESULT_FILE), JSON.stringify(final, null, 1));
  console.log(`
KARARLILIK (${N} koşu): ${stable ? 'KARARLI' : 'KARARSIZ (flaky)'}  genel=${final.kararlilik.genel_durumlar.join(',')}`);
  process.exit(runs.every((r) => r.genel === 'PASS') ? 0 : 1);
}

// ---------------------------------------------------------------- ana
(async () => {
  const t0 = Date.now();
  const t1 = T('T1', 'S1/S2/S3 tam akış'), t2 = T('T2', 'L taraması: lejant Dikkat + Geçilmez'), t3 = T('T3', 'Kum olayı radius_m+40 m'), t4 = T('T4', "'mission:arrived' window olayı"),
    t5 = T('T5', 'HUD: Zemin (model) + Gale ortam (REMS)'), t6 = T('T6', 'Konsolda hata yok'), t7 = T('T7', '?perf=1 probu');
  const pre = T('ON', 'Ön koşul: API + sim sunucusu');
  let server = null, browser = null, apiOk = false;
  try {
    const a = await get(API + '/assumptions');
    apiOk = a.status === 200 && a.body.length > 2;
    check(pre, `API ${API}/assumptions çalışıyor`, apiOk, 'HTTP ' + a.status);
    let grid = null; try { grid = JSON.parse((await get(API + '/grid')).body); } catch { /* yok */ }
    check(pre, `API gerçek Gale ızgarası sunuyor (/grid: synthetic=false, 1000x1000, 2 m)`, !!grid && grid.synthetic === false && grid.width === 1000 && grid.height === 1000 && grid.res_m === 2,
      grid ? `synthetic=${grid.synthetic} ${grid.width}x${grid.height} @ ${grid.res_m} m — "${String(grid.region).slice(0, 40)}"` : '/grid cevap vermedi');
    const cmp = await post(API + '/compare');
    check(pre, 'API güncel: POST /compare mevcut (404 değil; boş gövde 422 beklenir)', cmp.status !== 404 && cmp.status !== 0, 'HTTP ' + cmp.status);
    server = await startServer();
    check(pre, `sim sunucusu ${BASE}`, true, 'betik başlattı / yeniden kullandı');
    browser = await chromium.launch({ executablePath: CHROME, headless: !HEADED, args: CHROME_ARGS });
    if (want('T1', 'T3', 'T4')) for (const id of SCEN) { console.log(`\n== ${id} akışı`); await runScenario(browser, id, t1, t3, t4); }
    if (want('T2')) { console.log('\n== L taraması'); await runScan(browser, t2); }
    if (want('T5')) { console.log('\n== HUD'); await runHud(browser, t5); }
    if (want('T7')) { console.log('\n== perf probu (≈30-60 sn)'); await runPerf(browser, t7); }
    evalConsole(t6); await consoleShot(browser);
  } catch (e) { check(pre, 'beklenmeyen hata', false, e.stack || e.message); }
  finally { try { await browser?.close(); } catch {} try { server?.kill(); } catch {} }

  const order = ['ON', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const list = order.map((k) => tests[k]);
  // hiç check üretmeyen test (ör. önkoşul çöktü) PASS sayılmaz
  for (const x of list) if (!x.checks.length) x.status = ONLY && x.id !== 'ON' && !ONLY.includes(x.id) && !(x.id === 'T6') ? 'ATLANDI' : 'NOT_RUN';
  const result = {
    zaman: new Date().toISOString(), sure_sn: Math.round((Date.now() - t0) / 1000), base: BASE, api: API, api_ok: apiOk,
    genel: list.every((x) => x.status === 'PASS' || (ONLY && x.status === 'ATLANDI')) ? (ONLY ? 'PASS (KISMI: MM_ONLY=' + env.MM_ONLY + ')' : 'PASS') : 'FAIL',
    ozet: list.map((x) => ({ id: x.id, baslik: x.title, durum: x.status, gecen: x.checks.filter((c) => c.ok).length, toplam: x.checks.length })),
    ortam: { platform: process.platform, node: process.version, chrome: CHROME, real_gpu: REAL_GPU, repo: REPO, headless: !HEADED, senaryolar: SCEN },
    perf: perfResult,
    ekran_goruntuleri: shotMap(),
    testler: list, konsol_hariclenen: ignored.slice(0, 40), konsol_kalan_hatalar: tests.T6.keep || [],
  };
  fs.writeFileSync(path.join(OUT, RESULT_FILE), JSON.stringify(result, null, 1));
  console.log('\n┌──────┬────────────────────────────────────────────┬─────────┬───────┐');
  for (const o of result.ozet) console.log(`│ ${o.id.padEnd(4)} │ ${o.baslik.padEnd(42)} │ ${o.durum.padEnd(7)} │ ${String(o.gecen + '/' + o.toplam).padStart(5)} │`);
  console.log('└──────┴────────────────────────────────────────────┴─────────┴───────┘');
  console.log(`GENEL: ${result.genel}  (${result.sure_sn} sn)  → ${path.join(OUT, RESULT_FILE)}`);
  process.exit(result.genel.startsWith('PASS') ? 0 : 1);
})();
