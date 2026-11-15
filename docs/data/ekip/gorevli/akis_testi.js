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

    // ---- doğal (fizik dahil) hızlı yürüyüş: kum olayı → karar penceresi (#125 A.2) → replan → hedefte E ile numune (#125 A.1) → dönüş → karne
    // Not: önceki sürüm R.s ile ışınlanıyordu; sim fiziği (collide.step) ışınlanan oyuncuyu kayada tutuyor, kum karar penceresi de oyunu durduruyordu.
    const nat = await walkNatural(p, { shotName: `T3_kum_olayi_${id}.png` });
    const hasSand = run.sand;
    if (hasSand) step('kum olayı tetiklenir', nat.fired, JSON.stringify({ route_s: nat.sandS })); else step('kum olayı: bu senaryoda kum yok (atlandı)', true, 'selected.sand yok');
    const ev = await p.evaluate(() => window.__sandEv[0] || null);
    if (hasSand) {
      const ok = !!ev && ev.type === 'sand';
      check(t3, `${id}: kum olayı machine'den gelir`, ok, JSON.stringify(ev));
      if (ev) {
        const dist = Math.hypot(ev.px - ev.world[0], ev.pz - ev.world[1]);
        const thr = ev.radius_m + 40, TOL = 8; // doğal hızlı yürüyüşte kare başına ~1,3 m; alt sınır da var (geç tetikleme yakalansın)
        check(t3, `${id}: trigger_m = radius_m + 40`, ev.trigger_m === thr, `radius_m=${ev.radius_m} trigger_m=${ev.trigger_m} beklenen=${thr}`);
        check(t3, `${id}: oyuncu radius_m+40 m'de (−${TOL}…+2 m) tetiklendi, kum dairesine girmeden`, dist <= thr + 2 && dist >= thr - TOL && dist > ev.radius_m, `mesafe=${dist.toFixed(1)} m, eşik=${thr} m`);
      }
      step('kum olayında karar penceresi (route-decision) açılır; "kabul" ile yeniden plan başlar', !!nat.decision, nat.decision ?? 'karar penceresi görülmedi');
      step('rota yeniden planlanır (replan)', nat.replanned, nat.toast);
      await shot(p, `${id}_4_kum_replan.png`);
    }
    step('hedefte numune (E basılı tut) ve üsse dönüş ayağı', nat.hold ? nat.ret === true : true, JSON.stringify({ hold: nat.hold, ret: nat.ret }));
    const rep = nat.rep;
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

// ================================================================ TUR 2: normal oyun girişi (?dev=1 YOK)
// T8 oyun akışı · T9 gerçek klavye · T10 TR/EN metin · T11 yerleşim (taşma/örtüşme)
const GAME_Q = '?fixedres=1' + API_Q;       // dev yok: intro → görev seç → brifing → rota → yürüyüş → karne
const bulgular = [];                         // koşu sırasında görülen ham gözlemler (bulgular.md'ye elle işlenir)

async function loadGame(p, lang) {
  await p.goto(BASE + GAME_Q + (lang ? '&lang=' + lang : ''), { waitUntil: 'load' });
  await p.waitForFunction(() => window.__mm && window.__mm.flow && window.__mm.wire, null, { timeout: 120000 });
}
const scr = (p) => p.evaluate(() => document.getElementById('flow')?.dataset.screen || null);
const waitScreen = (p, name, ms = 30000) => p.waitForFunction((n) => document.getElementById('flow')?.dataset.screen === n, name, { timeout: ms }).then(() => true).catch(() => false);
const tid = (id) => `[data-testid="${id}"]`;

// Sayfa içi: görünen metinde boş anahtar / yer tutucu / boş düğme avı
function pageI18nScan(lang) {
  const leaks = [];
  const vis = (e) => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  // görünen tüm metin (display:none olanlar innerText'e girmez)
  for (const line of (document.body.innerText || '').split(/\n+/)) {
    for (const tok of line.split(/\s+/)) {
      if (/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(tok) && !/^\d/.test(tok) && !/^(www|e\.g|i\.e)\./i.test(tok)) leaks.push('anahtar: ' + tok);
      else if (/\{\w+\}/.test(tok)) leaks.push('yer tutucu: ' + tok);
      else if (/^(undefined|NaN|null|\[object)/.test(tok)) leaks.push('değer: ' + tok);
    }
    if (/signal timed out|Failed to fetch|NetworkError|TypeError|AbortError|HTTP \d{3}|ERR_[A-Z_]+/.test(line)) leaks.push('ham teknik hata metni: "' + line.trim().slice(0, 70) + '"');
    if (lang === 'en' && /[ğüşıöçĞÜŞİÖÇ]/.test(line)) leaks.push('EN modda Türkçe: "' + line.trim().slice(0, 60) + '"');
  }
  for (const b of document.querySelectorAll('button')) if (vis(b) && !(b.textContent || '').trim() && !b.getAttribute('aria-label') && !b.title) leaks.push('boş düğme: ' + (b.className || b.id || 'button'));
  return [...new Set(leaks)].slice(0, 14);
}

// Sayfa içi: taşma ve örtüşme (bounding box)
function pageLayoutScan() {
  const vw = innerWidth, vh = innerHeight, issues = [];
  const vis = (e) => { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity < 0.05) return false; const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const nm = (e) => (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '') || e.tagName.toLowerCase();
  const collect = (sels) => { const out = []; for (const s of sels) for (const e of document.querySelectorAll(s)) if (vis(e) && !out.some((x) => x.e === e)) out.push({ e, r: e.getBoundingClientRect(), n: nm(e) }); return out; };
  // 1) görünür ekran öğeleri viewport dışına taşıyor mu
  for (const x of collect(['.mm-mhud', '.mm-hud', '.mm-tip', '#toast', '#warn', '#scanleg', '#mini', '.mm-alert', '.mm-lang', '.mm-card', '.mm-intro', '.mm-missions', '.mm-routes', '.mm-mcard', '.mm-route'])) {
    const r = x.r, oy = getComputedStyle(x.e).overflowY;
    if (r.left < -1 || r.right > vw + 1) issues.push(`${x.n} yatay taşma (sol ${Math.round(r.left)}, sağ ${Math.round(r.right)} / ${vw})`);
    else if ((r.top < -1 || r.bottom > vh + 1) && !['auto', 'scroll'].includes(oy)) issues.push(`${x.n} dikey taşma (üst ${Math.round(r.top)}, alt ${Math.round(r.bottom)} / ${vh})`);
  }
  if (document.documentElement.scrollWidth > vw + 1) issues.push(`sayfa yatay kaydırma (${document.documentElement.scrollWidth} > ${vw})`);
  // 2) metin kutusundan taşıyor mu (düğme / kart başlığı)
  for (const x of collect(['button', '.mm-mcard-title', '.mm-mhud-title', '.mm-mhud-obj', '.mm-stat'])) if (x.e.scrollWidth > x.e.clientWidth + 2 && getComputedStyle(x.e).overflowX !== 'visible') issues.push(`${x.n} metin kırpılıyor (${x.e.scrollWidth} > ${x.e.clientWidth})`);
  // 3) HUD katmanı öğeleri birbirinin üstüne biniyor mu
  const hud = collect(['.mm-mhud', '.mm-hud', '.mm-tip', '#toast', '#warn', '#scanleg', '#mini', '.mm-alert']);
  for (let i = 0; i < hud.length; i++) for (let j = i + 1; j < hud.length; j++) {
    const a = hud[i], b = hud[j]; if (a.e.contains(b.e) || b.e.contains(a.e)) continue;
    const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left), h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
    if (w > 2 && h > 2) issues.push(`ÖRTÜŞME ${a.n} × ${b.n}: ${Math.round(w)}×${Math.round(h)} px`);
  }
  return issues.slice(0, 14);
}

// #125 A.1/A.2 gerçeği: kum olayı bir KARAR PENCERESİ açar (data-testid=route-decision, zaman aşımı yok, oyun durur);
// hedefte "E ile numune al" (6 sn basılı tut) çubuğu, sonra üsse dönüş ayağı, karne yalnız dönüşte. Ayrıca sim fiziği (collide.step)
// R.s ile ışınlanan oyuncuyu gerçek kayaların içinden geçirmez (oyuncu takılı kalır): bu yüzden ışınlama YOK;
// sim kendi fiziğiyle setTimeScale(ts) hızında yürür. Kum karar penceresi 'kabul' edilir, diğer sebepler 'koru' denir.
async function walkNatural(p, { ts = 40, maxS = 300, shotName = null } = {}) {
  await p.evaluate((k) => __mm.setTimeScale(k), ts);
  await p.evaluate(() => {
    const m = __mm.wire.machine; window.__sandEv = []; window.__evlog = [];
    if (!window.__evlogHooked) { window.__evlogHooked = true; for (const nme of ['mm:route-suggest', 'mm:route-decision']) addEventListener(nme, (e) => (window.__evlog ||= []).push({ n: nme, reason: e.detail?.reason, accept: e.detail?.accept, auto: e.detail?.auto, defaultPrevented: e.defaultPrevented })); }
    if (window.__hookedMachine !== m) { window.__hookedMachine = m; m.on('event', (e) => { const P = __mm.P; window.__sandEv.push({ id: e.id, type: e.type, radius_m: e.radius_m, trigger_m: e.trigger_m, world: e.world, px: P.x, pz: P.z }); }); }
  });
  const sandLabel = await p.evaluate(async () => { const i = await import('./app/i18n.js'); return i.t('decision.reason.sand'); });
  const t0 = Date.now(), out = { fired: false, replanned: false, decision: null, decisions: [], hold: false, ret: false, rep: false, toast: null, sandS: null };
  let heldDone = false;
  while (Date.now() - t0 < maxS * 1000) {
    await p.waitForTimeout(400);
    const st = await p.evaluate(() => ({ ev: (window.__sandEv || []).length, dec: document.querySelector('[data-testid="route-decision"] .mm-kicker')?.innerText ?? null, decTxt: document.querySelector('[data-testid="route-decision"]')?.innerText.replace(/\s+/g, ' ').slice(0, 110) ?? null, hold: !!document.querySelector('.mm-hold'), rep: !!document.querySelector('.mm-grade-letter'), repl: !!__mm.routeRun?.replanned, leg: __mm.routeRun?.leg ?? null, s: Math.round(__mm.routeRun?.s ?? -1) }));
    if (st.ev && !out.fired) { out.fired = true; out.sandS = st.s; }
    if (st.dec !== null) {
      const isSand = st.dec === sandLabel; out.decisions.push(isSand ? 'sand' : st.dec);
      if (isSand && !out.decision) { out.decision = st.decTxt; if (shotName) await shot(p, shotName); }
      await p.click(isSand ? '[data-testid="decision-accept"]' : '[data-testid="decision-keep"]').catch(() => {});
    }
    if (st.repl) out.replanned = true;
    if (st.hold && !heldDone) { out.hold = true; heldDone = true; await p.keyboard.down('KeyE'); await p.waitForFunction(() => !document.querySelector('.mm-hold'), null, { timeout: 40000 }).catch(() => {}); await p.keyboard.up('KeyE'); }
    if (st.leg === 'return') out.ret = true;
    if (st.rep) { out.rep = true; break; }
  }
  out.toast = await p.evaluate(() => document.getElementById('toast')?.textContent?.slice(0, 120) ?? null);
  out.events = await p.evaluate(() => window.__sandEv || []); out.evlog = await p.evaluate(() => window.__evlog || []);
  return out;
}

// kum olayından hedefe, karne ve (varsa) üsse dönüşe kadar sim kendi hızında yürür; karar pencereleri yönetilir
async function driveToArrival(p) {
  const hasSand = await p.evaluate(() => !!__mm.wire.selected?.sand);
  const nat = await walkNatural(p);
  return { hasSand, events: nat.events, evlog: nat.evlog, decisions: nat.decisions, fired: nat.fired, replanned: nat.replanned, rep: nat.rep, hold: nat.hold, ret: nat.ret, decision: nat.decision, toast: nat.toast };
}

// ---------------------------------------------------------------- T8 + T10 + T11: oyun akışı
async function runGameFlow(browser, cfg, t8, t10, t11) {
  const tag = `${cfg.w}×${cfg.h} ${cfg.lang.toUpperCase()}`;
  const p = await newPage(browser, 'oyun ' + tag, cfg.w, cfg.h);
  const c8 = (n, ok, d) => check(t8, `[${tag}] ${n}`, ok, d);
  const stage = async (name) => {
    await shot(p, `T11_${cfg.w}x${cfg.h}_${name}.png`);
    const leaks = await p.evaluate(pageI18nScan, cfg.lang); check(t10, `[${tag}] ${name}: boş anahtar/yer tutucu yok`, leaks.length === 0, leaks.join(' | '));
    const iss = await p.evaluate(pageLayoutScan); check(t11, `[${tag}] ${name}: taşma/örtüşme yok`, iss.length === 0, iss.join(' | '));
    if (leaks.length) bulgular.push({ tur: 'i18n', yer: `${tag} ${name}`, d: leaks.join(' | ') });
    if (iss.length) bulgular.push({ tur: 'yerlesim', yer: `${tag} ${name}`, d: iss.join(' | ') });
  };
  try {
    await loadGame(p, cfg.lang);
    // --- açılış
    const dev = await p.evaluate(() => ({ body: document.body.classList.contains('dev'), flow: document.getElementById('flow')?.dataset.screen,
      hidden: ['panel', 'mapwrap', 'hud', 'ctl'].map((i) => [i, getComputedStyle(document.getElementById(i)).display]) }));
    c8('açılış ekranı (intro), body.dev yok', dev.flow === 'intro' && !dev.body, JSON.stringify({ screen: dev.flow, dev: dev.body }));
    c8('geliştirici panelleri görünmez (#panel #mapwrap #hud #ctl)', dev.hidden.every(([, d]) => d === 'none'), JSON.stringify(dev.hidden));
    const intro = await p.evaluate(() => ({ title: document.querySelector('.mm-intro-title')?.innerText, sub: document.querySelector('.mm-intro-sub')?.innerText, btn: document.querySelector('[data-testid="intro-start"]')?.innerText }));
    c8('intro: başlık, altyazı ve başlat düğmesi dolu', !!(intro.title && intro.sub && intro.btn), JSON.stringify(intro));
    await p.waitForTimeout(1500); await stage('1_intro');
    // --- görev seçimi
    await p.click(tid('intro-start'));
    c8('"Görev seç" → görev seçimi ekranı', await waitScreen(p, 'select', 15000), 'screen=' + (await scr(p)));
    const cards = await p.evaluate(() => [...document.querySelectorAll('.mm-mcard')].map((c) => c.dataset.mission));
    c8('4 görev kartı (S1,S2,S3 + "Kendi rotanı planla" CUSTOM)', cards.join() === 'S1,S2,S3,CUSTOM', cards.join());
    await p.waitForTimeout(1200); await stage('2_gorev_secimi');
    if (cfg.full) {
      // dil anahtarı: TR ↔ EN çalışıyor mu
      const other = cfg.lang === 'tr' ? 'en' : 'tr';
      await p.click('.mm-lang'); await p.waitForTimeout(800);
      const sw1 = await p.evaluate(async () => { const i = await import('./app/i18n.js'); return { lang: i.getLang(), go: i.t('select.go'), btn: document.querySelector('[data-testid="mission-go-S1"]')?.innerText, htmlLang: document.documentElement.lang }; });
      c8(`dil anahtarı: ${cfg.lang.toUpperCase()} → ${other.toUpperCase()} (görev kartı düğmesi + <html lang> güncellenir)`, sw1.lang === other && sw1.btn === sw1.go && sw1.htmlLang === other, JSON.stringify(sw1));
      const leaks2 = await p.evaluate(pageI18nScan, other); check(t10, `[${tag}] ${other.toUpperCase()}'e geçince görev seçimi: boş anahtar yok`, leaks2.length === 0, leaks2.join(' | '));
      if (leaks2.length) bulgular.push({ tur: 'i18n', yer: `${tag} → ${other} görev seçimi`, d: leaks2.join(' | ') });
      await shot(p, `T10_${other}_gorev_secimi.png`);
      await p.click('.mm-lang'); await p.waitForTimeout(800);
      const sw2 = await p.evaluate(async () => { const i = await import('./app/i18n.js'); return { lang: i.getLang(), go: i.t('select.go'), btn: document.querySelector('[data-testid="mission-go-S1"]')?.innerText }; });
      c8('dil anahtarı geri döner', sw2.lang === cfg.lang && sw2.btn === sw2.go, JSON.stringify(sw2));
      // geri → intro → tekrar seç
      await p.click('.mm-select-head button');
      c8('"Geri" → intro', await waitScreen(p, 'intro', 10000), 'screen=' + (await scr(p)));
      await p.click(tid('intro-start')); await waitScreen(p, 'select', 10000);
    }
    // --- brifing
    await p.click(tid('mission-go-S1'));
    c8('S1 → brifing', await waitScreen(p, 'briefing', 20000), 'screen=' + (await scr(p)));
    await p.waitForSelector(tid('briefing-start'), { timeout: 20000 }).catch(() => {}); await p.waitForTimeout(800); await stage('3_brifing');
    // --- rotalar
    await p.click(tid('briefing-start'), { timeout: 20000 });
    await p.waitForFunction(() => document.querySelectorAll('.mm-route').length === 3, null, { timeout: 60000 }).catch(() => {});
    const rc = await p.evaluate(() => document.querySelectorAll('.mm-route').length);
    c8('rota seçimi: 3 kart', rc === 3, 'kart=' + rc); await p.waitForTimeout(800); await stage('4_rotalar');
    await p.click('.mm-route-safest ' + tid('route-pick'), { timeout: 20000 });
    // --- yürüyüş
    c8('rota seçilince yürüyüş ekranı (walk) kendiliğinden açılır', await waitScreen(p, 'walk', 40000), 'screen=' + (await scr(p)));
    // hedef mesafesi HUD turunda dolar; yazılım GL'de (özellikle 1920x1080) birkaç sn gecikebilir: en çok 40 sn bekle ve süreyi kaydet
    const tD = Date.now();
    await p.waitForFunction(() => (document.querySelector('.mm-mhud-dist')?.innerText || '').length > 0, null, { timeout: 40000 }).catch(() => {});
    const distSn = Math.round((Date.now() - tD) / 100) / 10;
    await p.waitForTimeout(1000);
    const srcInfo = await p.evaluate(() => ({ alt: (__mm.mapView.alternatives || []).map((a) => a.source).join(','), offline: /Çevrimdışı yedek|Offline fallback|offline/i.test(document.body.innerText) }));
    c8('rotalar canlı API\'den (çevrimdışı yedek rozeti yok)', /^api(,api)*$/.test(srcInfo.alt) && !srcInfo.offline, JSON.stringify(srcInfo));
    if (srcInfo.offline || !/^api(,api)*$/.test(srcInfo.alt)) bulgular.push({ tur: 'akis', yer: `${tag} rota`, d: 'Planlayıcı canlı olduğu halde çevrimdışı yedek rota kullanıldı: ' + JSON.stringify(srcInfo) });
    const w = await p.evaluate(() => ({ st: __mm.stats().state, tot: Math.round(__mm.routeRun?.total || 0), hud: !!document.querySelector('.mm-mhud') && getComputedStyle(document.querySelector('.mm-walkhud')).display !== 'none', dist: document.querySelector('.mm-mhud-dist')?.innerText, vit: !!document.querySelector('.mm-hud') && !document.querySelector('.mm-hud').hidden }));
    c8('yürüyüş: durum=auto, rota uzunluğu > 0', w.st === 'auto' && w.tot > 0, JSON.stringify(w));
    c8('yürüyüş HUD: görev paneli + hedef mesafesi dolu + vitals HUD görünür', w.hud && !!w.dist && w.vit, JSON.stringify(w));
    await stage('5_yuruyus');
    if (cfg.full) {
      await p.keyboard.press('KeyL'); await p.waitForTimeout(3500); await stage('5b_yuruyus_tarama');
    }
    // --- kum olayı + varış + karne
    const dr = await driveToArrival(p);
    c8('kum olayı → rota yeniden planlanır', !dr.hasSand || (dr.fired && dr.replanned), JSON.stringify(dr));
    c8('hedefte karne açılır', dr.rep, 'screen=' + (await scr(p)));
    await p.waitForTimeout(1500); await stage('6_karne');
    const rp = await p.evaluate(() => ({ grade: document.querySelector('.mm-grade-letter')?.innerText, rows: document.querySelectorAll('[data-testid="debrief"] tr').length, btns: [...document.querySelectorAll('.mm-card-report .mm-alert-acts button')].map((b) => b.innerText) }));
    c8('karne: harf + 4 satırlık tablo + iki düğme ("Tekrar oyna", "Başka görev")', !!rp.grade && rp.rows === 5 && rp.btns.length === 2, JSON.stringify(rp));
    const vis6 = await p.evaluate(() => { const b = [...document.querySelectorAll('.mm-card-report .mm-alert-acts button')].map((x) => Math.round(x.getBoundingClientRect().bottom)); const c = document.querySelector('.mm-card-report'); return { vh: innerHeight, bottoms: b, kartYuksek: Math.round(c.getBoundingClientRect().height), kaydirilabilir: c.scrollHeight > c.clientHeight + 2 }; });
    c8('karne: "Tekrar oyna"/"Başka görev" düğmeleri kaydırmadan görünür', vis6.bottoms.length === 2 && vis6.bottoms.every((x) => x <= vis6.vh), JSON.stringify(vis6));
    if (!(vis6.bottoms.every((x) => x <= vis6.vh))) bulgular.push({ tur: 'yerlesim', yer: `${tag} karne`, d: 'Karne düğmeleri ilk ekranda görünmüyor, kaydırma gerekir: ' + JSON.stringify(vis6) });
    if (cfg.full) {
      // --- Tekrar oyna
      await p.evaluate(() => [...document.querySelectorAll('.mm-card-report .mm-alert-acts button')][0].click());
      const again = await waitScreen(p, 'walk', 40000); await p.waitForTimeout(3000);
      const a2 = await p.evaluate(() => ({ st: __mm.stats().state, s: Math.round(__mm.routeRun?.s ?? -1), tot: Math.round(__mm.routeRun?.total || 0), ms: __mm.wire.machine?.snapshot().state, report: !!document.querySelector('.mm-grade-letter'), paused: __mm.stats().paused }));
      c8('"Tekrar oyna": yürüyüş yeniden başlar (walk, rota başında, karne kapanır, makine=walking)', again && a2.st === 'auto' && a2.s < 60 && a2.ms === 'walking' && !a2.report && !a2.paused, JSON.stringify(a2));
      await shot(p, 'T8_tekrar_oyna.png');
      // --- Esc → duraklat menüsü
      await p.keyboard.press('Escape'); await p.waitForTimeout(1200);
      const pm = await p.evaluate(() => ({ menu: !!document.querySelector('.mm-pausemenu'), paused: __mm.stats().paused, btns: [...document.querySelectorAll('.mm-pausemenu .mm-menu button')].map((b) => b.innerText) }));
      c8('Esc → duraklat menüsü açılır (oyun durur, 6 düğme)', pm.menu && pm.paused && pm.btns.length === 6, JSON.stringify(pm));
      await stage('7_duraklat');
      await p.evaluate(() => document.querySelector('.mm-pausemenu .mm-menu button').click()); await p.waitForTimeout(1500);
      const pr = await p.evaluate(() => ({ menu: !!document.querySelector('.mm-pausemenu'), paused: __mm.stats().paused }));
      c8('"Devam" → menü kapanır, oyun sürer', !pr.menu && !pr.paused, JSON.stringify(pr));
      // --- ikinci varış → Başka görev
      const dr2 = await driveToArrival(p);
      c8('ikinci tur: varış + karne', dr2.rep && (!dr2.hasSand || (dr2.fired && dr2.replanned)), JSON.stringify(dr2));
      await p.evaluate(() => [...document.querySelectorAll('.mm-card-report .mm-alert-acts button')][1].click());
      const back = await waitScreen(p, 'select', 30000); await p.waitForTimeout(2500);
      const b2 = await p.evaluate(() => ({ st: __mm.stats().state, walkhud: getComputedStyle(document.querySelector('.mm-walkhud')).display, vit: !!document.querySelector('.mm-hud') && !document.querySelector('.mm-hud').hidden, machine: !!__mm.wire.machine, report: !!document.querySelector('.mm-grade-letter'), cards: document.querySelectorAll('.mm-mcard').length }));
      c8('"Başka görev": görev seçimine döner (tur, yürüyüş HUD gizli, makine temiz, 4 kart)', back && b2.st === 'tour' && b2.walkhud === 'none' && !b2.machine && !b2.report && b2.cards === 4, JSON.stringify(b2));
      if (b2.vit) bulgular.push({ tur: 'akis', yer: `${tag} karne sonrası`, d: 'Vitals HUD (.mm-hud) görev seçimi ekranında hâlâ görünür' });
      await shot(p, 'T8_baska_gorev.png');
      // --- ikinci görev (S2) başlatılabiliyor mu
      await p.click(tid('mission-go-S2'));
      const s2 = await waitScreen(p, 'briefing', 20000);
      await p.waitForSelector(tid('briefing-start'), { timeout: 20000 }).catch(() => {});
      c8('karne sonrası ikinci görev (S2) brifingi açılır', s2 && (await p.evaluate(() => !!document.querySelector('[data-testid="briefing-start"]'))), 'screen=' + (await scr(p)));
      await p.evaluate(() => [...document.querySelectorAll('.mm-modal button')].find((b) => b.dataset.testid !== 'briefing-start')?.click());   // "Görevlere dön"
      c8('brifingde "Görevlere dön" → seçime döner', await waitScreen(p, 'select', 15000), 'screen=' + (await scr(p)));
    }
  } catch (e) { check(t8, `[${tag}] İSTİSNA`, false, String(e.message).split('\n')[0]); await shot(p, `T8_istisna_${cfg.w}x${cfg.h}.png`); }
  finally { await p.close(); }
}

// ---------------------------------------------------------------- T9: gerçek klavye
async function runKeys(browser, t) {
  const p = await newPage(browser, 'klavye', 1280, 720);
  const pos = () => p.evaluate(() => ({ x: __mm.P.x, z: __mm.P.z, yaw: __mm.P.yaw, st: __mm.stats().state }));
  const hold = async (code, ms = 5000) => { await p.keyboard.down(code); await p.waitForTimeout(ms); await p.keyboard.up(code); await p.waitForTimeout(600); };
  try {
    await loadGame(p, 'tr');
    await p.click(tid('intro-start')); await waitScreen(p, 'select', 15000);
    await p.click(tid('mission-go-S1')); await p.waitForSelector(tid('briefing-start'), { timeout: 20000 }); await p.click(tid('briefing-start'));
    await p.waitForFunction(() => document.querySelectorAll('.mm-route').length === 3, null, { timeout: 60000 });
    await p.click('.mm-route-safest ' + tid('route-pick'), { timeout: 20000 });
    check(t, 'yürüyüş (auto) başladı', await waitScreen(p, 'walk', 40000));
    await p.waitForTimeout(3000);
    const dot = (a, b) => { const f = [Math.sin(b.yaw), -Math.cos(b.yaw)], rt = [Math.cos(b.yaw), Math.sin(b.yaw)], d = [b.x - a.x, b.z - a.z]; return { fwd: +(d[0] * f[0] + d[1] * f[1]).toFixed(2), right: +(d[0] * rt[0] + d[1] * rt[1]).toFixed(2), dist: +Math.hypot(d[0], d[1]).toFixed(2) }; };
    // W: devral + ileri
    let a = await pos(); await hold('KeyW'); let b = await pos(); let m = dot(a, b);
    check(t, 'W: otomatik yürüyüşten devralır (durum=walk) ve ileri gider', b.st === 'walk' && m.fwd > 0.05, `durum ${a.st}→${b.st}, ${JSON.stringify(m)}`);
    a = b; await hold('KeyS'); b = await pos(); m = dot(a, b);
    check(t, 'S: geri gider (ileri bileşen < 0)', m.fwd < -0.05, JSON.stringify(m));
    a = b; await hold('KeyD'); b = await pos(); m = dot(a, b);
    check(t, 'D: sağa kayar (sağ bileşen > 0)', m.right > 0.05, JSON.stringify(m));
    a = b; await hold('KeyA'); b = await pos(); m = dot(a, b);
    check(t, 'A: sola kayar (sağ bileşen < 0)', m.right < -0.05, JSON.stringify(m));
    a = b; await p.keyboard.down('Shift'); await hold('KeyW', 4000); await p.keyboard.up('Shift'); b = await pos(); const run = dot(a, b);
    check(t, 'Shift+W: koşar (ileri gider)', run.fwd > 0.05, JSON.stringify(run));
    await shot(p, 'T9_yurume.png');
    // R: rotaya dön
    await p.keyboard.press('KeyR'); await p.waitForTimeout(2500);
    const r = await p.evaluate(() => ({ st: __mm.stats().state, routeRun: !!__mm.routeRun }));
    check(t, 'R: rotaya dönülür (durum=auto)', r.st === 'auto' && r.routeRun, JSON.stringify(r));
    // T: 3. şahıs / 1. şahıs
    const astro = () => p.evaluate(() => __mm.T.astro.group.visible);
    await p.waitForTimeout(2500); const t0 = await astro(); await p.keyboard.press('KeyT'); await p.waitForTimeout(3500); const t1v = await astro(); await p.keyboard.press('KeyT'); await p.waitForTimeout(3500); const t2v = await astro();
    check(t, 'T: astronot görünürlüğü 3. şahıs ↔ 1. şahıs değişir', t0 === true && t1v === false && t2v === true, `önce=${t0}, T sonrası=${t1v}, 2. T sonrası=${t2v}`);
    await shot(p, 'T9_t_tusu.png');
    // H: HUD aç/kapa
    const hudVis = () => p.evaluate(() => { const e = document.querySelector('.mm-hud'); return !!e && !e.hidden && getComputedStyle(e).display !== 'none'; });
    const h0 = await hudVis(); await p.keyboard.press('KeyH'); await p.waitForTimeout(1500); const h1 = await hudVis(); await p.keyboard.press('KeyH'); await p.waitForTimeout(1500); const h2 = await hudVis();
    check(t, 'H: vitals HUD gizlenir ve geri gelir', h0 && !h1 && h2, `önce=${h0}, H=${h1}, H=${h2}`);
    const mh = await p.evaluate(() => getComputedStyle(document.querySelector('.mm-walkhud')).display);
    if (h1 === false && mh !== 'none') bulgular.push({ tur: 'klavye', yer: 'H tuşu', d: 'H yalnız vitals HUD\'unu gizliyor; görev paneli (.mm-mhud) görünür kalıyor (display=' + mh + ')' });
    // L: tarayıcı lejantı
    await p.keyboard.press('KeyL'); await p.waitForTimeout(3500);
    const lg = await p.evaluate(() => { const e = document.getElementById('scanleg'); return { hidden: e.hidden, text: e.innerText.replace(/\n/g, ' ').slice(0, 80) }; });
    check(t, 'L: tarayıcı lejantı görünür (Dikkat + Geçilmez)', !lg.hidden && /dikkat/i.test(lg.text) && /geçilmez/i.test(lg.text), JSON.stringify(lg));
    await shot(p, 'T9_tarama.png');
    // ? yardım
    await p.keyboard.press('?'); await p.waitForTimeout(1500);
    const hp = await p.evaluate(() => ({ open: !!document.querySelector('.mm-help'), keys: [...document.querySelectorAll('.mm-help .mm-key')].map((k) => k.innerText) }));
    check(t, '?: yardım penceresi açılır ve tuşları listeler', hp.open && hp.keys.length >= 8, JSON.stringify(hp.keys));
    const advertised = ['W A S D', 'Shift', 'R', 'L / Shift+L', 'T', 'H', 'N', 'G', 'Esc', '?'];
    const missing = advertised.filter((k) => !hp.keys.includes(k));
    check(t, 'yardımda vaat edilen tuşlar listede', missing.length === 0, 'eksik: ' + missing.join(','));
    await p.keyboard.press('Escape'); await p.waitForTimeout(1000);
    // M: normal oyunda çalışmaz (dev'e özel); dev'de haritaya döner
    const mn = await p.evaluate(() => __mm.stats().state);
    await p.keyboard.press('KeyM'); await p.waitForTimeout(1500);
    const mafter = await p.evaluate(() => ({ st: __mm.stats().state, map: getComputedStyle(document.getElementById('mapwrap')).display }));
    check(t, 'M (normal oyun): harita açılmaz — tasarım gereği yalnız ?dev=1 (yardım listesinde M yok)', mafter.st !== 'map' && mafter.map === 'none', `önce=${mn}, sonra=${JSON.stringify(mafter)}`);
  } catch (e) { check(t, 'İSTİSNA', false, String(e.message).split('\n')[0]); await shot(p, 'T9_istisna.png'); }
  finally { await p.close(); }
  // M (dev): haritaya döner
  const d = await newPage(browser, 'klavye-dev', 1280, 720);
  try {
    await load(d); await d.evaluate(() => __mm.enter3D('walk')); await d.waitForTimeout(6000);
    await d.keyboard.press('KeyM'); await d.waitForTimeout(2500);
    const dm = await d.evaluate(() => ({ st: __mm.stats?.().state ?? null, map: getComputedStyle(document.getElementById('mapwrap')).display, gl: document.getElementById('gl').hidden }));
    check(t, 'M (?dev=1): 3B → haritaya döner', dm.map !== 'none' && dm.gl === true, JSON.stringify(dm));
    await shot(d, 'T9_m_dev.png');
  } catch (e) { check(t, 'M (dev) İSTİSNA', false, String(e.message).split('\n')[0]); } finally { await d.close(); }
}

// ---------------------------------------------------------------- T10 (statik): metin kataloğu eksiksiz mi
function staticI18n(t) {
  const texts = JSON.parse(fs.readFileSync(path.join(REPO, 'sim/data/texts.json'), 'utf8')), ui = texts.ui || {};
  const bad = Object.entries(ui).filter(([, v]) => !(v && typeof v.tr === 'string' && v.tr.trim() && typeof v.en === 'string' && v.en.trim())).map(([k]) => k);
  check(t, `texts.json ui: ${Object.keys(ui).length} anahtarın hepsinde dolu tr + en`, bad.length === 0, 'eksik: ' + bad.slice(0, 8).join(','));
  const same = Object.entries(ui).filter(([, v]) => v && v.tr && v.en && v.tr === v.en && v.tr.length > 12).map(([k]) => k);
  t.checks.push({ n: 'bilgi: tr == en olan uzun metinler (çevrilmemiş olabilir)', ok: true, d: same.slice(0, 10).join(',') || 'yok' });
  const used = new Set(), dir = path.join(REPO, 'sim/app');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of src.matchAll(/\bt\(\s*'([a-z][\w]*(?:\.[\w]+)+)'/g)) used.add(m[1] + '  (' + f + ')');
  }
  const missing = [...used].filter((u) => !ui[u.split('  ')[0]] && !texts[u.split('  ')[0]]);
  check(t, `kodda t('...') ile çağrılan ${used.size} anahtarın hepsi texts.json'da var`, missing.length === 0, 'eksik: ' + missing.slice(0, 8).join(', '));
  if (missing.length) bulgular.push({ tur: 'i18n', yer: 'statik tarama', d: 'texts.json\'da olmayan anahtarlar: ' + missing.join(', ') });
  const missions = JSON.parse(fs.readFileSync(path.join(REPO, 'sim/data/missions.json'), 'utf8')), ms = missions.missions || missions;
  const diffMissing = [...new Set(ms.map((m) => m.difficulty).filter(Boolean))].filter((d) => !ui['diff.' + d]);
  check(t, 'görev zorluk etiketleri (diff.<zorluk>) tanımlı', diffMissing.length === 0, 'eksik: ' + diffMissing.join(','));
  if (diffMissing.length) bulgular.push({ tur: 'i18n', yer: 'select ekranı zorluk rozeti', d: 'diff.* anahtarı yok: ' + diffMissing.join(',') + ' → rozet "—" görünür' });
}

// ================================================================ TUR 3: T12 "Kendi rotanı planla" (#120)
// Köprü sözleşmesi: data-testid mission-custom / mission-go-custom / mappicker / mp-warn / mp-eta / mp-info / mp-compute / mp-share / mp-o2 / mp-back;
// window.__mm.picker = { setA(c,r), setB(c,r), compute(), state(), shareUrl() }; URL ?a=c,r&b=c,r[&o2=80].
// ab_ciftleri.json (çalışan 2) yoksa çiftler gerçek ızgarada (API /layers/slope.bin) üretilir ve ab_ciftleri_gorevli.json'a yazılır.
// NOT (Mars/Dünya kuralı): 'tahmini süre' beklentisi uygulamanın kendi sabitini yineler: 0,67056 m/s (NASA APACHE benchmark; Dünya'da ölçülmüş
// giysili yürüyüş hızı, Mars değeri DEĞİL). Test yalnız uygulamanın metnini bu sabitle tutarlı mı diye sınar, değeri doğrulamaz.
const CUSTOM_SPEED = 0.67056, CUSTOM_RES_M = 2, CUSTOM_W = 1000, IMPASS_DEG = 20, O2_LIM = 80;   // tur 4: Samet 25°→20° (main a5738a4); API /assumptions nogo_slope_deg ile ön koşulda doğrulanır

function getBin(url, ms = 30000) {
  return new Promise((resolve) => {
    const rq = http.get(url, (res) => { const ch = []; res.on('data', (c) => ch.push(c)); res.on('end', () => resolve(res.statusCode === 200 ? Buffer.concat(ch) : null)); });
    rq.setTimeout(ms, () => { rq.destroy(); resolve(null); }); rq.on('error', () => resolve(null));
  });
}
function postJson(url, obj, ms = 60000) {
  return new Promise((resolve) => {
    const u = new URL(url), body = JSON.stringify(obj);
    const rq = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers: { 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } }, (res) => { let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => { try { resolve(JSON.parse(b)); } catch { resolve(null); } }); });
    rq.setTimeout(ms, () => { rq.destroy(); resolve(null); }); rq.on('error', () => resolve(null)); rq.end(body);
  });
}
const mulberry = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
// bağımsız (sim kodundan bağımsız) kum beklentisi: rota polyline'ı ile sand_zones.json merkezleri arası en kısa mesafe (px*2 m)
function sandExpect(pathPx, zones) {
  let best = null;
  for (const z of zones) {
    let min = Infinity;
    for (let i = 0; i < pathPx.length; i++) {
      const p = pathPx[i], q = pathPx[Math.min(i + 1, pathPx.length - 1)], dx = q[0] - p[0], dy = q[1] - p[1], d2 = dx * dx + dy * dy;
      const t = d2 ? Math.max(0, Math.min(1, ((z.px[0] - p[0]) * dx + (z.px[1] - p[1]) * dy) / d2)) : 0;
      min = Math.min(min, Math.hypot(z.px[0] - p[0] - t * dx, z.px[1] - p[1] - t * dy) * CUSTOM_RES_M);
    }
    const thr = z.radius_m + 40;
    if (min <= thr && (!best || min - thr < best.minDistM - best.thresholdM)) best = { id: z.id, minDistM: Math.round(min), thresholdM: thr };
  }
  return best;
}
async function makePairs() {
  const slopeBuf = await getBin(API + '/layers/slope.bin');
  if (!slopeBuf || slopeBuf.length !== CUSTOM_W * CUSTOM_W * 4) throw new Error('slope.bin okunamadı');
  const slope = new Float32Array(slopeBuf.buffer, slopeBuf.byteOffset, CUSTOM_W * CUSTOM_W);
  const zones = JSON.parse(fs.readFileSync(path.join(REPO, 'sim/data/sand_zones.json'), 'utf8'));
  // 20° eşiğinde geçilebilir hücreler küçük adalara bölünür: uygulama (layers.py ile aynı kural) yalnız EN BÜYÜK 8-komşuluklu bileşeni geçilebilir sayar.
  // Beklentiler bağımsız olarak burada aynı kuralla (yeniden yazılmış taşma doldurma) hesaplanır.
  const lab = new Int32Array(CUSTOM_W * CUSTOM_W), stk = new Int32Array(CUSTOM_W * CUSTOM_W); let bestId = 0, bestSz = 0, nid = 0;
  for (let i0 = 0; i0 < lab.length; i0++) { if (lab[i0] || !(slope[i0] < IMPASS_DEG)) continue; const id = ++nid; let sp = 0, sz = 0; stk[sp++] = i0; lab[i0] = id;
    while (sp) { const j = stk[--sp]; sz++; const c0 = j % CUSTOM_W, r0 = (j - c0) / CUSTOM_W; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r0 + dr, cc = c0 + dc; if ((!dr && !dc) || rr < 0 || cc < 0 || rr >= CUSTOM_W || cc >= CUSTOM_W) continue; const k = rr * CUSTOM_W + cc; if (!lab[k] && slope[k] < IMPASS_DEG) { lab[k] = id; stk[sp++] = k; } } }
    if (sz > bestSz) { bestSz = sz; bestId = id; } }
  const ok = (c, r) => c >= 0 && r >= 0 && c < CUSTOM_W && r < CUSTOM_W && slope[r * CUSTOM_W + c] < IMPASS_DEG && lab[r * CUSTOM_W + c] === bestId;
  const rnd = mulberry(120), ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pairs = [], tries = { n: 0 };
  const verify = async (a, b) => {
    tries.n++;
    const j = await postJson(API + '/route', { start: a, goal: b });
    const safest = j?.routes?.find((r) => r.kind === 'safest'); if (!safest) return null;
    const pathPx = safest.segments.flatMap((s) => s.path_px);
    return { pathPx, sand: sandExpect(pathPx, zones), total: safest.total };
  };
  const want = (n, trig) => (async () => {
    for (let k = 0; k < 400 && pairs.filter((p) => p.triggers === trig).length < n; k++) {
      let a, b;
      if (trig) { const z = zones[ri(0, zones.length - 1)], th = rnd() * Math.PI * 2, h = ri(50, 200); a = [Math.round(z.px[0] + h * Math.cos(th)), Math.round(z.px[1] + h * Math.sin(th))]; b = [Math.round(z.px[0] - h * Math.cos(th)), Math.round(z.px[1] - h * Math.sin(th))]; }
      else { a = [ri(120, 880), ri(120, 880)]; const th = rnd() * Math.PI * 2, h = ri(80, 250); b = [Math.round(a[0] + h * Math.cos(th)), Math.round(a[1] + h * Math.sin(th))]; }
      if (!ok(...a) || !ok(...b)) continue;
      const sm = Math.hypot(a[0] - b[0], a[1] - b[1]) * CUSTOM_RES_M; if (sm < 150 || sm > 1000) continue;
      if (!trig && zones.some((z) => { const d = Math.hypot(z.px[0] - (a[0] + b[0]) / 2, z.px[1] - (a[1] + b[1]) / 2) * CUSTOM_RES_M; return d < sm / 2 + z.radius_m + 140; })) continue;   // kuş uçuşu da uzak dursun
      const v = await verify(a, b); if (!v || v.total?.go === undefined) continue;
      if (!!v.sand !== trig) continue;
      pairs.push({ id: `P${pairs.length + 1}`, a, b, straightM: Math.round(sm), triggers: trig, sand: v.sand, routeKm: v.total.km, routeStatus: v.total.status });
    }
  })();
  await want(2, true); await want(3, false);
  // geçilmez noktalar (eğim >= 20°) + bağımsız en yakın geçilebilir mesafe
  const impassable = [];
  for (let k = 0; k < 20000 && impassable.length < 3; k++) {
    const c = ri(20, 980), r = ri(20, 980), s = slope[r * CUSTOM_W + c]; if (!(s >= IMPASS_DEG)) continue;
    let best = Infinity;
    for (let d = 1; d <= 150 && best === Infinity; d++) for (let dc = -d; dc <= d; dc++) for (let dr = -d; dr <= d; dr++) { if (Math.max(Math.abs(dc), Math.abs(dr)) !== d || !ok(c + dc, r + dr)) continue; best = Math.min(best, Math.hypot(dc, dr)); }
    let mm = null; if (best !== Infinity) { for (let d = Math.floor(best); d <= Math.ceil(best) + 1; d++) for (let dc = -d; dc <= d; dc++) for (let dr = -d; dr <= d; dr++) if (ok(c + dc, r + dr)) best = Math.min(best, Math.hypot(dc, dr)); mm = Math.round(best * CUSTOM_RES_M); }
    impassable.push({ px: [c, r], slopeDeg: Math.round(s), nearestPassableM: mm });
  }
  // en yakın geçilebilir hücre (20°) — çalışan 2 dosyasındaki mesafeler 25° eşiğiyle hesaplanmıştı, burada yeniden hesaplanır
  const nearestM = (c, r) => { let best = Infinity; for (let d = 1; d <= 150 && best === Infinity; d++) for (let dc = -d; dc <= d; dc++) for (let dr = -d; dr <= d; dr++) { if (Math.max(Math.abs(dc), Math.abs(dr)) !== d || !ok(c + dc, r + dr)) continue; best = Math.min(best, Math.hypot(dc, dr)); } if (best === Infinity) return null; const b0 = best; for (let d = Math.floor(b0); d <= Math.ceil(b0) + 1; d++) for (let dc = -d; dc <= d; dc++) for (let dr = -d; dr <= d; dr++) if (ok(c + dc, r + dr)) best = Math.min(best, Math.hypot(dc, dr)); return Math.round(best * CUSTOM_RES_M); };
  // Çalışan 2'nin ab_ciftleri.json'u (varsa) ÇAPRAZ DOĞRULAMA için eklenir: onların geçilmez noktaları (slope_deg, nearest_passable_m)
  // ve kumlu/kumsuz çiftlerinden (nearest_sand.triggers) en çok 2'şer tane. Beklentiler onların bağımsız hesabından gelir.
  let ek = null;
  try {
    const x = JSON.parse(fs.readFileSync(path.join(OUT, '..', 'ab_ciftleri.json'), 'utf8'));
    const mine = (pp) => ({ id: pp.id, a: pp.a, b: pp.b, straightM: Math.round(pp.straight_m), triggers: !!pp.nearest_sand?.triggers, sand: pp.nearest_sand ?? null, kaynak: 'calisan2' });
    const okp = x.pairs.filter((pp) => pp.straight_m <= 700 && ok(...pp.a) && ok(...pp.b));   // 20° altında A/B hâlâ geçilebilir olmalı
    ek = { pairs: [...okp.filter((pp) => pp.nearest_sand?.triggers).slice(0, 3), ...okp.filter((pp) => !pp.nearest_sand?.triggers).slice(0, 3)].map(mine),
      impassable: x.impassable.slice(0, 3).map((im) => ({ px: im.px, slopeDeg: Math.round(im.slope_deg), nearestPassableM: nearestM(im.px[0], im.px[1]), calisan2_nearest_m_25derece: im.nearest_passable_m, kaynak: 'calisan2 (konum/eğim) + 20° için yeniden hesaplanan mesafe' })) };
  } catch { /* dosya yok / biçim farklı: yalnız kendi çiftlerim */ }
  const shortB = (a) => { for (let d = 3; d <= 6; d++) for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d]]) if (ok(a[0] + dx, a[1] + dy)) return [a[0] + dx, a[1] + dy]; return null; };
  for (const pp of pairs.concat(ek?.pairs ?? [])) pp.shortB = shortB(pp.a);
  const out = { ana_bilesen_hucre: bestSz, bilesen_sayisi: nid, kaynak: 'gorevli (kendi üretimi: gerçek ızgara slope.bin + API /route + sand_zones.json)' + (ek ? ' + çalışan 2 ab_ciftleri.json çapraz doğrulama (2 kumlu + 2 kumsuz çift, 3 geçilmez nokta)' : '; ab_ciftleri.json bulunamadı'), seed: 120, api: API, route_denemesi: tries.n, pairs: pairs.concat(ek?.pairs ?? []), impassable: impassable.concat(ek?.impassable ?? []), kendi_cift: pairs.length, kendi_gecilmez: impassable.length };
  fs.writeFileSync(path.join(OUT, 'ab_ciftleri_gorevli.json'), JSON.stringify(out, null, 1));
  return out;
}

async function runCustom(browser, t) {
  const c = (n, ok, d) => check(t, n, ok, d);
  let data; try { data = await makePairs(); } catch (e) { c('A–B çiftleri üretilebildi', false, e.message); return; }
  c(`A–B çiftleri hazır: ${data.pairs.length} çift (${data.pairs.filter((p) => p.triggers).length} kumlu, ${data.pairs.filter((p) => !p.triggers).length} kumsuz), ${data.impassable.length} geçilmez nokta`, data.kendi_cift === 5 && data.kendi_gecilmez === 3, `ab_ciftleri_gorevli.json; ${data.route_denemesi} /route denemesi`);
  const tpl = JSON.parse(fs.readFileSync(path.join(REPO, 'sim/data/texts.json'), 'utf8')).ui;
  const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k]);
  const p = await newPage(browser, 'ozel', 1280, 720);
  const bad422 = []; p.on('response', (r) => { if (r.status() === 422) bad422.push(r.request().method() + ' ' + r.url().replace(/^https?:\/\/[^/]+/, '')); });
  let dialogUrl = null; p.on('dialog', async (d) => { dialogUrl = d.defaultValue() || d.message(); await d.dismiss().catch(() => {}); });
  const openPicker = async () => {
    await p.click(tid('intro-start'), { timeout: 20000 }).catch(() => {});
    await waitScreen(p, 'select', 20000);
    await p.click(tid('mission-go-custom'), { timeout: 20000 });
    await p.waitForSelector(tid('mappicker'), { timeout: 60000 });
    await p.waitForFunction(() => window.__mm?.picker && typeof window.__mm.picker.setA === 'function', null, { timeout: 15000 });
  };
  try {
    await loadGame(p, 'tr');
    // ---- sözleşme: kart + kanca
    await p.click(tid('intro-start')); await waitScreen(p, 'select', 20000);
    const card = await p.evaluate(() => ({ card: !!document.querySelector('[data-testid="mission-custom"]'), go: !!document.querySelector('[data-testid="mission-go-custom"]') }));
    c('seçim ekranında özel görev kartı (mission-custom) ve düğmesi (mission-go-custom) var', card.card && card.go, JSON.stringify(card));
    if (!card.go) return;
    await p.click(tid('mission-go-custom'));
    const mp = await p.waitForSelector(tid('mappicker'), { timeout: 60000 }).then(() => true).catch(() => false);
    c('"Haritayı aç" → harita ekranı (mappicker)', mp, 'screen=' + (await scr(p)));
    const hook = await p.waitForFunction(() => window.__mm?.picker && ['setA', 'setB', 'compute', 'state', 'shareUrl'].every((k) => typeof window.__mm.picker[k] === 'function'), null, { timeout: 15000 }).then(() => true).catch(() => false);
    c('test kancası window.__mm.picker { setA, setB, compute, state, shareUrl } var', hook, hook ? 'ok' : 'beklenen kanca yok');
    if (!mp || !hook) return;
    for (const id of ['mp-warn', 'mp-eta', 'mp-info', 'mp-compute', 'mp-share', 'mp-o2', 'mp-back']) { /* tek tek aşağıda */ void id; }
    const ids = await p.evaluate(() => ['mp-warn', 'mp-eta', 'mp-info', 'mp-compute', 'mp-share', 'mp-o2', 'mp-back'].filter((i) => !document.querySelector(`[data-testid="${i}"]`)));
    c('harita ekranı öğeleri (mp-warn, mp-eta, mp-info, mp-compute, mp-share, mp-o2, mp-back) var', ids.length === 0, 'eksik: ' + ids.join(','));
    await p.waitForTimeout(2500); await shot(p, 'T12_harita.png');

    // ---- T12b: geçilmez nokta uyarısı
    const good = data.pairs.at(-1);   // tur 4: çalışan 2'nin yeni çifti (T12b B ucu, T12d URL, T12e 80 L)
    for (const im of data.impassable) {
      const exp = (im.nearestPassableM == null ? fill(tpl['custom.warn.steep.none'].tr, { slope: im.slopeDeg }) : fill(tpl['custom.warn.steep'].tr, { slope: im.slopeDeg, m: im.nearestPassableM }));
      await p.evaluate(([a, b]) => { __mm.picker.setA(...a); __mm.picker.setB(...b); }, [im.px, good.b]);
      const s = await p.evaluate(() => ({ st: __mm.picker.state(), dom: document.querySelector('[data-testid="mp-warn"]')?.innerText || '', dis: document.querySelector('[data-testid="mp-compute"]')?.disabled }));
      c(`T12b: geçilmez A=${im.px} (${im.slopeDeg}°): uyarı metni "${im.nearestPassableM} m" ve eğim doğru`, s.dom.includes('A: ' + exp) && s.st.warn === s.dom.trim(), `beklenen "A: ${exp.slice(0, 70)}…" | görülen "${s.dom.slice(0, 110)}"`);
      c(`T12b: geçilmez A=${im.px}: hesapla düğmesi kapalı, canCompute=false`, s.dis === true && s.st.canCompute === false, JSON.stringify({ dis: s.dis, can: s.st.canCompute }));
      await p.evaluate(([a, b]) => { __mm.picker.setB(...a); __mm.picker.setA(...b); }, [im.px, good.b]);
      const s2 = await p.evaluate(() => document.querySelector('[data-testid="mp-warn"]')?.innerText || '');
      c(`T12b: geçilmez nokta B olarak seçilince uyarı "B:" ile başlar`, s2.includes('B: ' + exp), s2.slice(0, 100));
    }
    await p.evaluate((g) => { __mm.picker.setA(...g.a); __mm.picker.setB(...g.b); }, good);
    const okS = await p.evaluate(() => ({ warn: document.querySelector('[data-testid="mp-warn"]')?.innerText || '', st: __mm.picker.state() }));
    c('T12b: geçilebilir çiftte uyarı boş, hesaplanabilir', okS.warn === '' && okS.st.canCompute === true, JSON.stringify({ warn: okS.warn, can: okS.st.canCompute }));
    await p.evaluate(([a, b]) => { __mm.picker.setA(...a); __mm.picker.setB(...b); }, [good.a, good.shortB]);   // 20° altında a[0]+4 hücresi geçilmez olabiliyor: geçilebilir ve < 15 m uzak B
    const sh = await p.evaluate(() => document.querySelector('[data-testid="mp-warn"]')?.innerText || '');
    c('T12b: A–B 15 m\'den yakınsa "çok kısa" uyarısı', !!good.shortB && sh === tpl['custom.warn.short'].tr, `B=${good.shortB} ` + sh.slice(0, 90));
    await shot(p, 'T12_uyari.png');

    // ---- T12a-0: gerçek harita tıklaması + canlı süre
    await p.evaluate(() => { __mm.picker.setA(1, 1); });   // sıfırla
    const rect = await p.evaluate(() => { const r = document.querySelector('.mm-picker canvas').getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; });
    const at = ([cc, rr]) => [rect.l + ((cc + 0.5) / CUSTOM_W) * rect.w, rect.t + ((rr + 0.5) / CUSTOM_W) * rect.h];
    await p.evaluate(() => { __mm.picker.setB(500, 500); });   // st.next=b → sıra: önce A tıklaması için yeniden başla
    await p.mouse.click(...at(good.a)); await p.mouse.click(...at(good.b));
    const rs = await p.evaluate(() => __mm.picker.state());
    const near = (x, y) => Math.abs(x[0] - y[0]) <= 2 && Math.abs(x[1] - y[1]) <= 2;
    c('T12a: gerçek harita tıklamasıyla A ve B seçilir (±2 px)', !!rs.a && !!rs.b && (near(rs.a, good.a) && near(rs.b, good.b) || (near(rs.a, good.b) && near(rs.b, good.a))), `A=${rs.a} B=${rs.b} beklenen ${good.a}→${good.b} (tıklama sırası A/B ya da B/A: sıra durumuna bağlı)`);
    await p.evaluate((g) => { __mm.picker.setA(...g.a); __mm.picker.setB(...g.b); }, good);
    const etaDom = await p.evaluate(() => document.querySelector('[data-testid="mp-eta"]')?.innerText || '');
    const sm = Math.hypot(good.a[0] - good.b[0], good.a[1] - good.b[1]) * CUSTOM_RES_M, expEta = fill(tpl['custom.eta'].tr, { m: Math.round(sm), min: (sm / CUSTOM_SPEED / 60).toFixed(0) });
    c('T12a: canlı mesafe/süre (mp-eta) kuş uçuşu ve 0,67056 m/s referansıyla tutarlı', etaDom === expEta, `beklenen "${expEta}" | görülen "${etaDom}"`);
    const info = await p.evaluate(() => document.querySelector('[data-testid="mp-info"]')?.innerText ?? null);
    t.checks.push({ n: 'bilgi: mp-info (hedefe yakın durak notu)', ok: true, d: String(info).slice(0, 120) });
    await shot(p, 'T12_secim_eta.png');

    // ---- T12d: paylaşım düğmesi + URL ile açılış (aynı görev)
    const want = `${new URL(BASE).origin}${new URL(BASE).pathname}?a=${good.a.join(',')}&b=${good.b.join(',')}`;
    const su = await p.evaluate(() => __mm.picker.shareUrl());
    const dec = (x) => { try { return decodeURIComponent(String(x)); } catch { return String(x); } };
    c('T12d: shareUrl() aynı A/B\'yi taşır (virgül kodu çözülünce ?a=c,r&b=c,r)', dec(su) === want, `beklenen ${want} | görülen ${su}`);
    c('T12d (kozmetik): bağlantı okunaklı biçimde: virgül %2C ile kodlanmamış', su === want, `beklenen ${want} | görülen ${su} (URLSearchParams virgülü %2C yapıyor; işlev etkilenmez, ?a=540%2C595 de açılır)`);
    dialogUrl = null; await p.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
    await p.click(tid('mp-share')); await p.waitForTimeout(1200);
    const clip = await p.evaluate(() => navigator.clipboard.readText().catch(() => null));
    c('T12d: paylaşım düğmesi (mp-share) aynı URL\'yi üretir (panoya ya da prompt\'a)', dec(clip) === want || dec(dialogUrl) === want, `pano=${clip} prompt=${dialogUrl}`);

    // ---- T12e: kısıtlı O2 bütçesi (80 L)
    await p.click(tid('mp-o2'));
    const o2s = await p.evaluate(() => __mm.picker.state());
    c('T12e: "Kısıtlı O₂ bütçesi (80 L)" işaretlenince state.o2 = 80', o2s.o2 === O2_LIM, 'o2=' + o2s.o2);
    const su2 = await p.evaluate(() => __mm.picker.shareUrl());
    c('T12e: paylaşım URL\'si &o2=80 içerir', dec(su2) === want + '&o2=80', su2);
    await p.click(tid('mp-compute'));
    c('T12e: hesapla → brifing', await waitScreen(p, 'briefing', 30000), 'screen=' + (await scr(p)));
    await p.waitForSelector(tid('briefing-start'), { timeout: 20000 }).catch(() => {});
    const bo = await p.evaluate(() => ({ id: __mm.wire.selected?.id, o2: __mm.wire.selected?.limits?.o2_L, txt: document.querySelector('.mm-modal')?.innerText.replace(/\n/g, ' ').slice(0, 300) }));
    c('T12e: görev limitleri O₂ = 80 L ve brifingde 80 görünür', bo.id === 'CUSTOM' && bo.o2 === O2_LIM && /\b80\b/.test(bo.txt), JSON.stringify(bo).slice(0, 220));
    await shot(p, 'T12_o2_brifing.png');
    await p.click(tid('briefing-start'), { timeout: 20000 });
    await p.waitForFunction(() => document.querySelectorAll('.mm-route').length === 3, null, { timeout: 90000 }).catch(() => {});
    const cards = await p.evaluate(() => [...document.querySelectorAll('.mm-route')].map((x) => ({ k: x.className.match(/mm-route-(\w+)/)?.[1], why: __mm.mapView.alternatives?.[0]?.fallbackWhy ?? null, s: x.querySelector('.mm-badge, [class*=badge]')?.innerText })));
    c('T12e: 3 rota kartı geldi (80 L bütçede durum rozetleri kaydedildi; NO-GO beklenebilir)', cards.length === 3, JSON.stringify(cards));
    await shot(p, 'T12_o2_rotalar.png');
    await p.evaluate(() => [...document.querySelectorAll('.mm-modal .mm-alert-acts button')].pop()?.click());   // Görevlere dön
    await waitScreen(p, 'select', 20000);

    // ---- T12a / T12c: 5 çift uçtan uca
    for (const pr of data.pairs.filter((x) => !process.env.MM_PAIRS || process.env.MM_PAIRS.split(",").includes(x.id))) {
      const tag = `${pr.id} ${pr.a}→${pr.b} (${pr.straightM} m, kum ${pr.triggers ? 'VAR' : 'YOK'})`;
      try {
        const tW = Date.now(); await postJson(API + "/route", { start: pr.a, goal: pr.b }, 120000); t.checks.push({ n: `bilgi: ${pr.id} API /route ön ısıtma süresi`, ok: true, d: `${Date.now() - tW} ms (sim zaman aşımı 8000 ms; sunucu önceki isteklerle meşgulse aşılabilir)` });
        await p.click(tid("mission-go-custom"), { timeout: 20000 });
        await p.waitForSelector(tid('mappicker'), { timeout: 60000 });
        await p.waitForFunction(() => window.__mm?.picker, null, { timeout: 15000 });
        await p.evaluate((g) => { __mm.picker.setA(...g.a); __mm.picker.setB(...g.b); }, pr);
        const st0 = await p.evaluate(() => __mm.picker.state());
        const apiRes = await postJson(API + '/route', { start: pr.a, goal: pr.b }, 120000), apiOk = !!apiRes?.routes;
        c(`T12a ${tag}: harita seçici ile API /route aynı kararı verir (seçici=${st0.canCompute ? 'kabul' : 'red'}, API=${apiOk ? '200' : '422'})`, st0.canCompute === apiOk, JSON.stringify({ can: st0.canCompute, warn: String(st0.warn).slice(0, 140), apiRoutes: apiOk }));
        if (!st0.canCompute || !apiOk) { await loadGame(p, 'tr'); await p.click(tid('intro-start')); await waitScreen(p, 'select', 20000); continue; }   // çelişkili çift: akışı sürdürme, bulgu olarak kaydedildi
        c(`T12a ${tag}: seçim kabul edildi (uyarı yok, hesaplanabilir)`, st0.canCompute && st0.warn === '', JSON.stringify({ can: st0.canCompute, warn: st0.warn }));
        await p.click(tid('mp-compute'));
        c(`T12a ${tag}: hesapla → brifing (görev CUSTOM, A/B doğru, O₂ 420)`, (await waitScreen(p, 'briefing', 30000)) && await p.evaluate((g) => { const s = __mm.wire.selected; return s?.id === 'CUSTOM' && s.start_px.join() === g.a.join() && s.goal_px.join() === g.b.join() && s.limits.o2_L === 420; }, pr), 'screen=' + (await scr(p)));
        await p.waitForSelector(tid('briefing-start'), { timeout: 20000 }).catch(() => {});
        await p.click(tid('briefing-start'), { timeout: 20000 });
        await p.waitForFunction(() => document.querySelectorAll('.mm-route').length === 3, null, { timeout: 90000 }).catch(() => {});
        const rt = await p.evaluate(() => ({ n: document.querySelectorAll('.mm-route').length, src: (__mm.mapView.alternatives || []).map((a) => a.source).join(','), why: (__mm.mapView.alternatives || []).map((a) => a.fallbackWhy).filter(Boolean)[0] ?? null }));
        c(`T12a ${tag}: 3 rota kartı, kaynak api`, rt.n === 3 && /^api(,api)*$/.test(rt.src), JSON.stringify(rt));
        await p.click('.mm-route-safest ' + tid('route-pick'), { timeout: 20000 });
        c(`T12a ${tag}: yürüyüş başlar (walk, durum=auto)`, (await waitScreen(p, 'walk', 40000)) && (await p.evaluate(() => __mm.stats().state === 'auto' && __mm.routeRun?.total > 0)), 'screen=' + (await scr(p)));
        await p.waitForTimeout(1500);
        const sand = await p.evaluate(() => { const s = __mm.wire.selected?.sand; return s ? { id: s.id, min: s.min_dist_m, thr: s.threshold_m } : null; });
        c(`T12c ${tag}: kum olayı ${pr.triggers ? 'tanımlı (rota kum adayının radius_m+40 m yakınından geçiyor)' : 'YOK (selected.sand=null)'}`, pr.triggers ? !!sand : sand === null, `beklenen ${pr.triggers ? JSON.stringify(pr.sand) : 'null'} | görülen ${JSON.stringify(sand)}`);
        let res;
        if (pr.triggers) {
          res = await driveToArrival(p);
          if (!res.rep) fs.writeFileSync(path.join(OUT, `tani_${pr.id}_varis_yok.json`), JSON.stringify(res, null, 1));   // varış görülmediyse tam tanı kaydı
          const n422 = bad422.length;
          c(`T12c ${tag}: kum olayı tetiklendi ve rota yeniden planlandı (routeRun.replanned=true)`, !!res.fired && !!res.replanned, JSON.stringify(res));
          c(`T12c ${tag}: replan BAŞARILI: toast'ta "başarısız"/"failed" yok`, !/başarısız|failed/i.test(res.toast || ''), `toast=${JSON.stringify(res.toast)}`);
          c(`T12c ${tag}: bu çiftte /replan, /step vb. 422 yok`, n422 === 0, bad422.length ? bad422.join(' ') : 'yok');
        } else {
          res = await walkNatural(p);   // sim fiziğiyle hızlı yürüyüş: kum olayı/karar penceresi ÇIKMAMALI
          c(`T12c ${tag}: rota boyunca kum olayı TETİKLENMEDİ ve karar penceresi açılmadı`, !res.fired && res.decisions.length === 0, JSON.stringify({ fired: res.fired, decisions: res.decisions }));
        }
        c(`T12a ${tag}: hedefte karne açılır`, !!res.rep, 'screen=' + (await scr(p)));
        if (pr.id === 'P1') await shot(p, 'T12_karne.png');
        await p.evaluate(() => [...document.querySelectorAll('.mm-card-report .mm-alert-acts button')][1]?.click());
        c(`T12a ${tag}: "Başka görev" → seçime döner (özel kart yine var)`, (await waitScreen(p, 'select', 30000)) && (await p.evaluate(() => !!document.querySelector('[data-testid="mission-custom"]'))), 'screen=' + (await scr(p)));
      } catch (e) { c(`T12a ${tag}: İSTİSNA`, false, String(e.message).split('\n')[0]); await shot(p, `T12_istisna_${pr.id}.png`); try { await loadGame(p, "tr"); await p.click(tid("intro-start")); await waitScreen(p, "select", 20000); } catch { break; } }
    }
  } catch (e) { c('İSTİSNA', false, String(e.message).split('\n')[0]); await shot(p, 'T12_istisna.png'); } finally { await p.close(); }

  // ---- T12d: URL ile açılış: ?a=&b= (ve &o2=80) doğrudan brifing
  const q = await newPage(browser, 'ozel-url', 1280, 720);
  try {
    const g = data.pairs.at(-1);
    for (const o2 of [false, true]) {
      await q.goto(BASE + `?a=${g.a.join(',')}&b=${g.b.join(',')}${o2 ? '&o2=80' : ''}&fixedres=1${API_Q}`, { waitUntil: 'load' });
      await q.waitForFunction(() => window.__mm?.flow && window.__mm?.wire, null, { timeout: 120000 });
      const ok = await waitScreen(q, 'briefing', 40000);
      const s = await q.evaluate(() => ({ id: __mm.wire.selected?.id, a: __mm.wire.selected?.start_px, b: __mm.wire.selected?.goal_px, o2: __mm.wire.selected?.limits?.o2_L, intro: !!document.querySelector('[data-testid="intro-start"]'), brief: !!document.querySelector('[data-testid="briefing-start"]') }));
      c(`T12d: ?a=&b=${o2 ? '&o2=80' : ''} doğrudan brifinge açar (aynı A/B, O₂ ${o2 ? 80 : 420} L)`, ok && s.id === 'CUSTOM' && String(s.a) === String(g.a) && String(s.b) === String(g.b) && s.o2 === (o2 ? 80 : 420) && s.brief, JSON.stringify(s));
      if (!o2) await shot(q, 'T12_url_brifing.png');
    }
    await q.goto(BASE + '?a=5000,5&b=3,3&fixedres=1' + API_Q, { waitUntil: 'load' });
    await q.waitForFunction(() => window.__mm?.flow, null, { timeout: 120000 }); await q.waitForTimeout(2500);
    const bad = await q.evaluate(() => ({ screen: document.getElementById('flow')?.dataset.screen, sel: __mm.wire.selected?.id ?? null }));
    c('T12d: geçersiz ?a=5000,5&b=3,3 → özel görev açılmaz, normal intro', bad.screen === 'intro' && bad.sel === null, JSON.stringify(bad));
  } catch (e) { c('T12d URL İSTİSNA', false, String(e.message).split('\n')[0]); } finally { await q.close(); }
}

// ================================================================ TUR 3: T13 dinamik rota (#122, sim/app/dynroute.js)
// Sözleşme: window 'mm:route-suggest' {reason, route, current, delta:{m,kcal,o2_L,risk}, urgent}, 'mm:route-decision' {accept, reason};
// yerleşik bant data-testid=dyn-banner, düğmeler dyn-accept / dyn-dismiss; kanca window.__mm.dynState() → {devT, busy, cooldown, reserveDone}.
// Eşikler (uygulamadan): rotadan > 15 m ve 5 sn → sapma önerisi; aynı sebep için 45 sn soğuma. Süreler DUVAR saatidir (Dünya saati, sol değil).
async function runDyn(browser, t) {
  const c = (n, ok, d) => check(t, n, ok, d);
  const p = await newPage(browser, 'dinamik', 1280, 720);
  const nowS = () => p.evaluate(() => performance.now() / 1000);
  const deviate = () => p.evaluate(async () => {
    const { distToPolyline } = await import('./app/dynroute.js');
    const dense = __mm.routeRun.r.dense, P = __mm.P, p0 = [P.x, P.z];
    for (const [dx, dz] of [[45, 0], [-45, 0], [0, 45], [0, -45]]) {
      const d = distToPolyline([p0[0] + dx, p0[1] + dz], dense).dist;
      if (d >= 30) { P.x += dx; P.z += dz; return { dx, dz, distM: Math.round(d), home: p0 }; }
    }
    return null;
  });
  try {
    await loadGame(p, 'tr');
    await p.click(tid('intro-start')); await waitScreen(p, 'select', 20000);
    await p.click(tid('mission-go-S1')); await p.waitForSelector(tid('briefing-start'), { timeout: 30000 }); await p.click(tid('briefing-start'));
    await p.waitForFunction(() => document.querySelectorAll('.mm-route').length === 3, null, { timeout: 90000 }).catch(() => {});
    await p.click('.mm-route-safest ' + tid('route-pick'), { timeout: 20000 });
    c('S1 yürüyüşü (auto) başladı', (await waitScreen(p, 'walk', 40000)) && (await p.evaluate(() => __mm.stats().state === 'auto')), 'screen=' + (await scr(p)));
    await p.waitForTimeout(2500);
    const hook = await p.evaluate(() => { const s = typeof __mm.dynState === 'function' ? __mm.dynState() : null; return s ? Object.keys(s) : null; });
    c('test kancası window.__mm.dynState() { devT, busy, cooldown, reserveDone } var', !!hook && ['devT', 'busy', 'cooldown', 'reserveDone'].every((k) => hook.includes(k)), hook ? hook.join(',') : 'beklenen kanca yok');
    if (!hook) return;
    await p.evaluate(() => {
      window.__sug = []; window.__dec = [];
      addEventListener('mm:route-suggest', (e) => window.__sug.push({ t: performance.now() / 1000, reason: e.detail.reason, urgent: e.detail.urgent, delta: e.detail.delta, hasRoute: !!e.detail.route }));
      addEventListener('mm:route-decision', (e) => window.__dec.push({ ...e.detail }));
    });
    await p.keyboard.down('KeyW'); await p.waitForTimeout(400); await p.keyboard.up('KeyW'); await p.waitForTimeout(1200);
    const w = await p.evaluate(() => ({ st: __mm.stats().state, run: !!__mm.routeRun, total: Math.round(__mm.routeRun?.total || 0), dev: __mm.dynState().devT }));
    c('W: durum walk, routeRun korunur', w.st === 'walk' && w.run && w.total > 0, JSON.stringify(w));

    // ---- 1) sapma → öneri (≤ 40 sn)
    const d1 = await deviate(); c('rotadan ≥ 30 m uzaklaşıldı (P += 45 m yönlerinden uygun olan)', !!d1 && d1.distM >= 30, JSON.stringify(d1));
    const t0 = Date.now();
    const got1 = await p.waitForFunction(() => window.__sug.length >= 1, null, { timeout: 70000 }).then(() => true).catch(() => false);
    const el1 = Math.round((Date.now() - t0) / 100) / 10;
    c('sapma önerisi (mm:route-suggest) ≤ 40 sn içinde geldi', got1 && el1 <= 40, `süre ${el1} sn (API yüklüyse 3 /route isteği ~20 sn sürebilir)`);
    if (!got1) { await shot(p, 'T13_oneri_yok.png'); return; }
    const s1 = await p.evaluate(() => ({ ...window.__sug[0], banner: !!document.querySelector('[data-testid="dyn-banner"], [data-testid="route-decision"]'), acc: !!document.querySelector('[data-testid="dyn-accept"], [data-testid="decision-accept"]'), dis: !!document.querySelector('[data-testid="dyn-dismiss"], [data-testid="decision-keep"]'), txt: document.querySelector('[data-testid="dyn-banner"], [data-testid="route-decision"]')?.innerText.replace(/\n/g, ' ').slice(0, 160) }));
    c('öneri sebebi "deviation", delta.m ve delta.kcal sayı, rota var', s1.reason === 'deviation' && Number.isFinite(s1.delta?.m) && Number.isFinite(s1.delta?.kcal) && s1.hasRoute, JSON.stringify({ reason: s1.reason, delta: s1.delta, urgent: s1.urgent }));
    c('yerleşik bant (dyn-banner) ya da karar kartı (route-decision, wire.js varsa) + kabul + vazgeç düğmeleri görünür; metin boş anahtar içermez', s1.banner && s1.acc && s1.dis && !/\bdyn\.[a-z]/.test(s1.txt || ''), s1.txt);
    await shot(p, 'T13_oneri_bant.png');
    await p.click('[data-testid="dyn-dismiss"], [data-testid="dyn-dismiss"], [data-testid="decision-keep"]');
    await p.waitForFunction(() => window.__dec.length >= 1, null, { timeout: 10000 }).catch(() => {});
    const dd = await p.evaluate(() => ({ dec: window.__dec[0], banner: !!document.querySelector('[data-testid="dyn-banner"], [data-testid="route-decision"]') }));
    c('"Vazgeç": mm:route-decision {accept:false, reason:deviation}, bant kapanır', dd.dec?.accept === false && dd.dec?.reason === 'deviation' && !dd.banner, JSON.stringify(dd));

    // ---- 2) rotaya dön → 45 sn soğuma içinde ikinci öneri YOK
    const tSug1 = s1.t;
    await p.evaluate((h) => { __mm.P.x = h[0]; __mm.P.z = h[1]; }, d1.home);
    await p.waitForTimeout(8000);
    const onRoute = await p.evaluate(() => ({ n: window.__sug.length, devT: __mm.dynState().devT }));
    c('rotaya dönülünce (P geri) yeni öneri yok, devT sıfırlanır', onRoute.n === 1 && onRoute.devT === 0, JSON.stringify(onRoute));
    const d2 = await deviate();
    const left = Math.max(0, tSug1 + 43 - (await nowS()));        // soğuma bitmeden 2 sn önceye kadar izle
    await p.waitForTimeout(Math.round(left * 1000));
    const inCool = await p.evaluate(() => ({ n: window.__sug.length, cd: JSON.stringify(__mm.dynState().cooldown) }));
    c(`soğuma (45 sn) içinde ikinci sapma önerisi YOK (yeniden sapıldı, ${Math.round(43)} sn'ye kadar izlendi)`, inCool.n === 1 && !!d2, JSON.stringify(inCool));
    // pozitif kontrol: soğuma bitince sapma sürüyorsa ikinci öneri gelmeli
    const got2 = await p.waitForFunction(() => window.__sug.length >= 2, null, { timeout: 70000 }).then(() => true).catch(() => false);
    const gap = got2 ? Math.round((await p.evaluate(() => window.__sug[1].t - window.__sug[0].t)) * 10) / 10 : null;
    c('soğuma bitince (sapma sürüyor) ikinci öneri gelir; iki öneri arası ≥ 40 sn (uygulama soğumayı öneri anından değil hesaplamanın başladığı andan sayar; 3 /route süresi kadar kayabilir)', got2 && gap >= 40, `aralık ${gap} sn`);
    if (!got2) { await shot(p, 'T13_ikinci_yok.png'); return; }
    await shot(p, 'T13_ikinci_oneri.png');

    // ---- 3) kabul → yeni rota uygulanır
    const before = await p.evaluate(() => { window.__rr = __mm.routeRun; return { total: Math.round(__mm.routeRun.total), rep: !!__mm.routeRun.replanned }; });
    await p.click('[data-testid="dyn-accept"], [data-testid="dyn-accept"], [data-testid="decision-accept"]');
    const rp = await p.waitForFunction(() => __mm.routeRun !== window.__rr && __mm.routeRun?.replanned === true && __mm.routeRun.total > 0, null, { timeout: 30000 }).then(() => true).catch(() => false);
    const after = await p.evaluate(() => ({ rep: __mm.routeRun?.replanned, total: Math.round(__mm.routeRun?.total || 0), dec: window.__dec.at(-1), busy: __mm.dynState().busy, banner: !!document.querySelector('[data-testid="dyn-banner"], [data-testid="route-decision"]') }));
    c('"Kabul": routeRun.replanned=true ve rota uzunluğu > 0', rp && after.rep === true && after.total > 0, JSON.stringify({ before, after: { rep: after.rep, total: after.total } }));
    c('"Kabul": mm:route-decision {accept:true, reason:deviation}, bant kapanır, makine meşgul değil', after.dec?.accept === true && after.dec?.reason === 'deviation' && !after.banner && after.busy === false, JSON.stringify(after.dec));
    await shot(p, 'T13_kabul.png');

    // ---- 4) kask kamerası gözlemi (mm:camera-insight) → reason 'observation'
    const waitReason = (reason, ms) => p.waitForFunction((r) => window.__sug.some((s) => s.reason === r), reason, { timeout: ms }).then(() => true).catch(() => false);
    const acceptReason = async (reason, label) => {
      const b = await p.evaluate((r) => { const e = document.querySelector('[data-testid="dyn-banner"], [data-testid="route-decision"]'); return e ? { reason: e.dataset.reason ?? window.__sug.at(-1)?.reason, txt: e.innerText.replace(/\n/g, ' ').slice(0, 140) } : null; }, reason);
      c(`${label}: bant/karar kartı (reason=${reason}) görünür`, !!b && b.reason === reason, JSON.stringify(b));
      await p.evaluate(() => { window.__rr = __mm.routeRun; });
      await p.click('[data-testid="dyn-accept"], [data-testid="dyn-accept"], [data-testid="decision-accept"]');
      const ok = await p.waitForFunction(() => __mm.routeRun !== window.__rr && __mm.routeRun?.replanned === true && __mm.routeRun.total > 0, null, { timeout: 30000 }).then(() => true).catch(() => false);
      const dec = await p.evaluate(() => window.__dec.at(-1));
      c(`${label}: "Kabul" → yeni routeRun (replanned=true, uzunluk > 0), karar {accept:true, reason:${reason}}`, ok && dec?.accept === true && dec?.reason === reason, JSON.stringify(dec));
    };
    const stop = await p.evaluate(async () => {
      const { distToPolyline } = await import('./app/dynroute.js');
      const dense = __mm.routeRun.r.dense, stops = __mm.wire.grid?.rover_stops ?? []; let best = null;
      for (const s of stops) { const d = distToPolyline(__mm.wire.coords.pxToWorld(s.px), dense).dist; if (!best || d < best.d) best = { id: s.stop_id, d: Math.round(d), px: s.px }; }
      return best;
    });
    c('rotaya en yakın rover durağı bulundu (wire.grid.rover_stops)', !!stop?.id, JSON.stringify(stop));
    if (stop?.id) {
      const nSug = await p.evaluate(() => window.__sug.length), t1 = Date.now();
      await p.evaluate((id) => window.dispatchEvent(new CustomEvent('mm:camera-insight', { detail: { stopId: id, warn: true, kinds: ['sand'] } })), stop.id);
      const gotO = await waitReason('observation', 60000), elO = Math.round((Date.now() - t1) / 100) / 10;
      const so = await p.evaluate(() => window.__sug.find((s) => s.reason === 'observation') ?? null);
      c('mm:camera-insight → mm:route-suggest reason=observation ≤ 40 sn, delta.m ve delta.kcal sayı', gotO && elO <= 40 && Number.isFinite(so?.delta?.m) && Number.isFinite(so?.delta?.kcal), `süre ${elO} sn, delta ${JSON.stringify(so?.delta)}, önceki öneri sayısı ${nSug}`);
      if (gotO) { await shot(p, 'T13_gozlem.png'); await acceptReason('observation', 'gözlem'); }
    }

    // ---- 5) yük değişimi (vitals.addLoad(8)) → reason 'load'
    const ld0 = await p.evaluate(() => __mm.wire.vitals?.snapshot?.().loadKg ?? null), t2 = Date.now();
    await p.evaluate(() => __mm.wire.vitals.addLoad(8));
    const gotL = await waitReason('load', 60000), elL = Math.round((Date.now() - t2) / 100) / 10;
    const sl = await p.evaluate(() => window.__sug.find((s) => s.reason === 'load') ?? null);
    c('wire.vitals.addLoad(8) → mm:route-suggest reason=load ≤ 40 sn, delta sayı', gotL && elL <= 40 && Number.isFinite(sl?.delta?.m) && Number.isFinite(sl?.delta?.kcal), `yük önce ${ld0} kg, süre ${elL} sn, delta ${JSON.stringify(sl?.delta)}`);
    if (gotL) { await shot(p, 'T13_yuk.png'); await acceptReason('load', 'yük'); }
  } catch (e) { c('İSTİSNA', false, String(e.message).split('\n')[0]); await shot(p, 'T13_istisna.png'); } finally { await p.close(); }
}

function gitHead() {   // salt okunur: test edilen sim kodunun hangi commit olduğu (çalışma ağacı değişmişse 'kirli' notu)
  try {
    const g = (a) => spawnSync('git', ['-C', REPO, ...a], { encoding: 'utf8' }).stdout.trim();
    return `${g(['rev-parse', 'HEAD'])} (${g(['branch', '--show-current']) || 'detached'})${g(['status', '--short', '--', 'sim']) ? ' + yerel değişiklik (sim/)' : ''}`;
  } catch { return 'bilinmiyor'; }
}
function shotMap() {
  let f = []; try { f = fs.readdirSync(SHOT_DIR); } catch { /* yok */ }
  const pick = (re) => f.filter((x) => re.test(x)).map((x) => 'shots/' + x);
  return { T1: pick(/^S\d_[1-3]_/), T2: pick(/^scan_lines/), T3: pick(/^T3_|_4_kum_replan/), T4: pick(/_5_karne/), T5: pick(/^hud/), T6: pick(/^T6_/), T7: pick(/^perf/), T8: pick(/^T8_|^T11_\d+x\d+_[1-6]_/), T9: pick(/^T9_/), T10: pick(/^T10_/), T11: pick(/^T11_/), T12: pick(/^T12_/), T13: pick(/^T13_/) };
}

// MM_RUNS=N: testi N kez ayrı süreçte koş, kararlılığı raporla
if (Number(env.MM_RUNS || 1) > 1 && !env.MM_CHILD) {
  const N = Number(env.MM_RUNS), runs = [];
  for (let i = 1; i <= N; i++) {
    const rf = RESULT_FILE.replace(/\.json$/, '') + `_kosu${i}.json`;
    console.log(`
######## KOŞU ${i}/${N} ########`);
    spawnSync(process.execPath, [__filename], { stdio: 'inherit', env: { ...env, MM_CHILD: '1', MM_RESULT_FILE: rf } });
    try { runs.push({ dosya: rf, ...JSON.parse(fs.readFileSync(path.join(OUT, rf), 'utf8')) }); } catch { runs.push({ dosya: rf, genel: 'SONUC_YOK', ozet: [] }); }
  }
  const ids = ['ON', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13'];
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
    t5 = T('T5', 'HUD: Zemin (model) + Gale ortam (REMS)'), t6 = T('T6', 'Konsolda hata yok'), t7 = T('T7', '?perf=1 probu'),
    t8 = T('T8', 'Normal oyun girişi (dev yok): akış, karne, Tekrar oyna / Başka görev'), t9 = T('T9', 'Gerçek klavye: WASD R L H T ? M'),
    t10 = T('T10', 'TR/EN: boş anahtar / yer tutucu yok'), t11 = T('T11', 'Yerleşim 1280x720 + 1920x1080: taşma / örtüşme'), t12 = T('T12', 'Kendi rotanı planla (#120): 5 A–B, uyarı, kum, URL, 80 L'),
    t13 = T('T13', 'Dinamik rota (#122): sapma önerisi, soğuma, kabul');
  const pre = T('ON', 'Ön koşul: API + sim sunucusu');
  let server = null, browser = null, apiOk = false;
  try {
    const a = await get(API + '/assumptions');
    apiOk = a.status === 200 && a.body.length > 2;
    check(pre, `API ${API}/assumptions çalışıyor`, apiOk, 'HTTP ' + a.status);
    let grid = null; try { grid = JSON.parse((await get(API + '/grid')).body); } catch { /* yok */ }
    let asm = []; try { asm = JSON.parse(a.body); } catch { /* yok */ }
    const nogo = asm.find((x) => /Geçilmez eğim/i.test(x.name));
    check(pre, `API geçilmez eğim eşiği ${IMPASS_DEG}° (/assumptions "Geçilmez eğim")`, !!nogo && Number(nogo.value) === IMPASS_DEG, nogo ? `${nogo.name}=${nogo.value} ${nogo.unit}` : '/assumptions içinde kayıt yok');
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
    if (want('T8', 'T10', 'T11')) {
      console.log('\n== oyun akışı 1280x720 TR (tam)'); await runGameFlow(browser, { w: 1280, h: 720, lang: 'tr', full: true }, t8, t10, t11);
      console.log('\n== oyun akışı 1920x1080 EN'); await runGameFlow(browser, { w: 1920, h: 1080, lang: 'en', full: false }, t8, t10, t11);
    }
    if (want('T9')) { console.log('\n== klavye'); await runKeys(browser, t9); }
    if (want('T12')) { console.log('\n== T12 özel görev'); await runCustom(browser, t12); }
    if (want('T13')) { console.log('\n== T13 dinamik rota'); await runDyn(browser, t13); }
    if (want('T10')) staticI18n(t10);
    evalConsole(t6); await consoleShot(browser);
  } catch (e) { check(pre, 'beklenmeyen hata', false, e.stack || e.message); }
  finally { try { await browser?.close(); } catch {} try { server?.kill(); } catch {} }

  const order = ['ON', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12', 'T13'];
  const list = order.map((k) => tests[k]);
  // hiç check üretmeyen test (ör. önkoşul çöktü) PASS sayılmaz
  for (const x of list) if (!x.checks.length) x.status = ONLY && x.id !== 'ON' && !ONLY.includes(x.id) && !(x.id === 'T6') ? 'ATLANDI' : 'NOT_RUN';
  const result = {
    zaman: new Date().toISOString(), sure_sn: Math.round((Date.now() - t0) / 1000), base: BASE, api: API, api_ok: apiOk,
    genel: list.every((x) => x.status === 'PASS' || (ONLY && x.status === 'ATLANDI')) ? (ONLY ? 'PASS (KISMI: MM_ONLY=' + env.MM_ONLY + ')' : 'PASS') : 'FAIL',
    ozet: list.map((x) => ({ id: x.id, baslik: x.title, durum: x.status, gecen: x.checks.filter((c) => c.ok).length, toplam: x.checks.length })),
    ortam: { repo_head: gitHead(), platform: process.platform, node: process.version, chrome: CHROME, real_gpu: REAL_GPU, repo: REPO, headless: !HEADED, senaryolar: SCEN },
    perf: perfResult,
    ekran_goruntuleri: shotMap(),
    gozlemler: bulgular,
    testler: list, konsol_hariclenen: ignored.slice(0, 40), konsol_kalan_hatalar: tests.T6.keep || [],
  };
  fs.writeFileSync(path.join(OUT, RESULT_FILE), JSON.stringify(result, null, 1));
  console.log('\n┌──────┬────────────────────────────────────────────┬─────────┬───────┐');
  for (const o of result.ozet) console.log(`│ ${o.id.padEnd(4)} │ ${o.baslik.padEnd(42)} │ ${o.durum.padEnd(7)} │ ${String(o.gecen + '/' + o.toplam).padStart(5)} │`);
  console.log('└──────┴────────────────────────────────────────────┴─────────┴───────┘');
  console.log(`GENEL: ${result.genel}  (${result.sure_sn} sn)  → ${path.join(OUT, RESULT_FILE)}`);
  process.exit(result.genel.startsWith('PASS') ? 0 : 1);
})();
