// Uçtan uca akış testi: görev seçimi → brifing → 3 rota → seçim → 3B yürüyüş → tarama (L) → kum/replan → varış/karne.
// Kullanım: node sim/tools/qa/e2e.mjs [--url http://127.0.0.1:8017/sim/] [--missions S1,S2,S3] [--tag ad] [--out dizin] [--json dosya]
// Seçiciler önce [data-testid=...], yoksa mevcut sınıf/id yedeğine düşer (akış desk'i testid ekledikçe yedek kullanılmaz).
// Yürüyüş: sim'in test kancaları (window.__mm.setProgress / setTimeScale); gerçek zamanlı değil, bu yüzden gerçekleşen süre/doz anlamsızdır.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';

const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const URL_ = arg('url', 'http://127.0.0.1:8017/sim/');
const MISSIONS = arg('missions', 'S1,S2,S3').split(',');
const TAG = arg('tag', 'local');
const OUT = arg('out', '/Users/samet/Desktop/Spaceapp/qa-shared/out');
const JSON_OUT = arg('json', null);
const API = arg('api', null);
mkdirSync(OUT, { recursive: true });

const req = createRequire(import.meta.url);
function loadPW() {
  for (const p of ['playwright-core', '/Users/samet/Desktop/Spaceapp/qa-shared/node_modules/playwright-core']) {
    try { return req(p); } catch { /* sıradaki */ }
  }
  throw new Error('playwright-core bulunamadı (qa-shared/node_modules)');
}
const { chromium } = loadPW();
function chromePath() {
  if (process.env.CHROME_BIN) return process.env.CHROME_BIN;
  const base = `${homedir()}/Library/Caches/ms-playwright`;
  for (const v of ['chromium-1243', 'chromium-1140']) {
    const p = `${base}/${v}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
    if (existsSync(p)) return p;
  }
  throw new Error('Chrome yolu bulunamadı; CHROME_BIN verin');
}

// Gürültü: dış sunucular (NASA TREK vb.) başsız ortamda engelli.
const IGNORE = /net::ERR_FAILED|ERR_BLOCKED_BY_CLIENT|trek\.nasa\.gov|astro\.arcgis\.com|favicon/;
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Kararlı seçici: testid → yedek CSS
const SEL = {
  introStart: ['[data-testid="intro-start"]', '.mm-intro button'],
  missionBtn: id => [`[data-testid="mission-${id}"]`, `.mm-mcard:has(.mm-mcard-id:text-is("${id}")) button`],
  briefingStart: ['[data-testid="briefing-start"]', '.mm-modal button.mm-btn-primary', '.mm-modal button'],
  routeCard: ['[data-testid="route-card"]', '.mm-route'],
  routePick: ['[data-testid="route-pick"]', '.mm-route button'],
  walk: ['[data-testid="walk-3d"]'],   // yeni akışta yürüyüş rota seçince kendiliğinden başlar
  alert: ['[data-testid="event-alert"]', '.mm-alert'],
  debrief: ['[data-testid="debrief"]', '.mm-table'],
  grade: ['[data-testid="debrief-grade"]', '.mm-grade-letter'],
};
const first = async (p, list) => { for (const s of list) { if (await p.$(s)) return s; } return null; };
const waitAny = async (p, list, timeout = 20000) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) { const s = await first(p, list); if (s) return s; await sleep(150); }
  throw new Error('Seçici bulunamadı: ' + list.join(' | '));
};

const results = [];
function fps(p, ms = 2000) {
  return p.evaluate(m => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < m) requestAnimationFrame(f); else r(+(n / (m / 1000)).toFixed(1)); }; requestAnimationFrame(f); }), ms);
}

async function runMission(browser, id) {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 240)));
  p.on('console', m => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text().slice(0, 240)); });
  p.on('requestfailed', r => { if (!IGNORE.test(r.url()) && !IGNORE.test(r.failure()?.errorText ?? '')) errors.push('requestfailed: ' + r.url().slice(0, 120)); });
  await p.route(/trek\.nasa\.gov|astro\.arcgis\.com/, r => r.abort());

  const steps = [];
  const shot = async name => { const f = `${OUT}/${TAG}_${id}_${name}.png`; await p.screenshot({ path: f }); return f; };
  async function step(name, fn) {
    const t0 = Date.now(), e0 = errors.length; let ok = true, note = '', frame = null;
    try { note = (await fn()) ?? ''; } catch (e) { ok = false; note = String(e.message ?? e).slice(0, 300); }
    try { frame = await shot(name); } catch { /* sayfa kapanmış olabilir */ }
    let f = null; try { f = await fps(p, 1000); } catch { /* yok */ }
    steps.push({ name, ok, ms: Date.now() - t0, fps: f, errors: errors.slice(e0), note, frame });
    return ok;
  }

  const q = API ? `?q=low&fixedres=1&api=${encodeURIComponent(API)}` : '?q=low&fixedres=1';
  await step('load', async () => {
    await p.goto(URL_ + q);
    await p.waitForFunction(() => window.__mm && window.__mm.wire, null, { timeout: 60000 });
    await sleep(1500);
  });
  let alive = steps.at(-1).ok;

  alive = alive && await step('intro', async () => {
    await p.waitForFunction(() => window.__mm.flow?.screen === 'intro', null, { timeout: 30000 });
    await sleep(1500);
    await p.click(await waitAny(p, SEL.introStart));
    await p.waitForFunction(() => window.__mm.flow.screen === 'select', null, { timeout: 10000 });
    await sleep(1200);
  });
  alive = alive && await step('mission-select', async () => {
    // Arazi/nav hazır olmadan seçilirse sim "B noktası arazi dışında" ile seçime döner (akış yarışı, rapora yazıldı): hazır olana dek yeniden dene.
    let tries = 0;
    for (;;) {
      const s = await waitAny(p, SEL.missionBtn(id)); await p.click(s); tries++;
      const ok = await p.waitForFunction(() => window.__mm.flow.screen === 'briefing', null, { timeout: 5000 }).then(() => true, () => false);
      if (ok) break;
      if (tries >= 6) throw new Error('brifing açılmadı (6 deneme; arazi hazır değil?)');
      await sleep(3000);
    }
    await waitAny(p, SEL.briefingStart);
    return tries > 1 ? `${tries}. denemede (arazi geç hazır oldu)` : '';
  });
  alive = alive && await step('briefing', async () => {
    const txt = await p.evaluate(() => document.querySelector('.mm-modal')?.innerText?.slice(0, 160) ?? '');
    if (!txt) throw new Error('brifing metni boş');
    await p.click(await first(p, SEL.briefingStart));
    return txt.replace(/\s+/g, ' ');
  });
  let routes = [];
  alive = alive && await step('routes', async () => {
    await waitAny(p, SEL.routeCard, 40000);
    await sleep(500);
    routes = await p.evaluate(() => (window.__mm.mapView?.alternatives ?? []).map(r => ({ kind: r.kind, source: r.source })));
    const n = (await p.$$(SEL.routeCard[0])).length || (await p.$$(SEL.routeCard[1])).length;
    if (n < 3) throw new Error(`rota kartı ${n} (beklenen 3)`);
    if (routes.some(r => r.source && r.source !== 'api' && !/api/i.test(r.source))) throw new Error('rota API dışı: ' + JSON.stringify(routes));
    return JSON.stringify(routes);
  });
  alive = alive && await step('route-pick', async () => {
    const s = await first(p, SEL.routePick); const cards = await p.$$(s);
    await cards[Math.min(2, cards.length - 1)].click();   // "en güvenli" son kart
    await sleep(800);
    if (SEL.walk.length && await first(p, SEL.walk)) await p.click(await first(p, SEL.walk));   // testid varsa tıkla; yoksa otomatik başlar
  });
  alive = alive && await step('walk-start', async () => {
    await p.waitForFunction(() => window.__mm.flow?.screen === 'walk' && window.__mm.routeRun && window.__mm.wire.machine, null, { timeout: 40000 });
    await sleep(2500);
    return await p.evaluate(() => `toplam ${Math.round(window.__mm.routeRun.total)} m`);
  });
  alive = alive && await step('scan-L', async () => {
    await p.keyboard.press('KeyL'); await sleep(2500);
    const src = await p.evaluate(() => window.__mm.stats().scannerSource);
    return 'tarayıcı kaynağı: ' + src;
  });
  alive = alive && await step('sand-replan', async () => {
    // Kum olayına kadar adım adım ilerlet; replan'ı bekle.
    const ev = await p.evaluate(() => window.__mm.wire.machine.snapshot());
    let triggered = false;
    for (let f = 0.1; f <= 0.9 && !triggered; f += 0.05) {
      await p.evaluate(v => window.__mm.setProgress(v), f); await sleep(900);
      triggered = await p.evaluate(() => window.__mm.wire.machine.snapshot().triggered.length > 0);
    }
    if (!triggered) throw new Error('olay tetiklenmedi (triggered boş): ' + JSON.stringify(ev));
    await p.waitForFunction(() => window.__mm.routeRun?.replanned || window.__mm.wire.machine.snapshot().state !== 'walking', null, { timeout: 20000 }).catch(() => {});
    const snap = await p.evaluate(() => ({ s: window.__mm.wire.machine.snapshot().triggered, replanned: !!window.__mm.routeRun?.replanned }));
    await sleep(1200);
    if (!snap.replanned) throw new Error('replan olmadı: ' + JSON.stringify(snap));
    return JSON.stringify(snap);
  });
  alive = alive && await step('arrive-debrief', async () => {
    for (let i = 0; i < 40; i++) {
      const st = await p.evaluate(() => window.__mm.wire.machine?.snapshot().state);
      if (st === 'debrief') break;
      // olay uyarısı duraklatıyorsa devam et
      const alert = await first(p, SEL.alert);
      if (alert) { const b = await p.$(alert + ' button'); if (b) await b.click().catch(() => {}); }
      await p.evaluate(() => { try { window.__mm.setProgress(0.99); window.__mm.setTimeScale(1600); } catch { /* */ } });
      await sleep(1000);
    }
    await waitAny(p, SEL.debrief, 20000);
    await p.evaluate(() => window.__mm.setTimeScale(1));
    const g = await p.evaluate(s => document.querySelector(s)?.textContent, await first(p, SEL.grade));
    return 'karne derecesi: ' + g;
  });

  const unique = [...new Set(errors)];
  await ctx.close();
  return { mission: id, steps, errors: unique };
}

const browser = await chromium.launch({ executablePath: chromePath(), headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
for (const id of MISSIONS) {
  console.log(`== ${id}`);
  const r = await runMission(browser, id);
  results.push(r);
  for (const s of r.steps) console.log(`${s.ok ? 'OK  ' : 'FAIL'} ${id} ${s.name.padEnd(15)} ${String(s.ms).padStart(6)} ms  fps=${s.fps ?? '—'}  ${s.note.slice(0, 100)}`);
  if (r.errors.length) console.log('  konsol hataları:', r.errors.slice(0, 5));
}
await browser.close();
const summary = { tag: TAG, url: URL_, date: new Date().toISOString(), results };
if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(summary, null, 1));
const failed = results.flatMap(r => r.steps.filter(s => !s.ok).map(s => `${r.mission}/${s.name}`));
console.log(failed.length ? `BAŞARISIZ: ${failed.join(', ')}` : 'TÜMÜ GEÇTİ');
process.exit(failed.length ? 1 : 0);
