// Görsel desk: sabit 3 açı (ayak dibi, omuz üstü ileri, geniş manzara). Kullanım: node gorsel_shots.js <url> <etiket> [outDir]
// Playwright'ı qa-shared'den alır (Chrome yolu: ~/Library/Caches/ms-playwright/...).
const { chromium } = require('/Users/samet/Desktop/Spaceapp/qa-shared/node_modules/playwright-core');
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const [URL, tag, out = 'out'] = process.argv.slice(2);
const YAW = Number(process.env.YAW ?? 0.6);
const PX = Number(process.env.PX ?? 433), PY = Number(process.env.PY ?? 560);
(async () => {
  require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e).slice(0, 200))); p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await p.goto(URL);
  await p.waitForFunction(() => window.__mm && window.__mm.geo, null, { timeout: 40000 });
  const shots = [
    ['ayak', { yaw: YAW, pitch: -0.95, h: 1.7, view: 'fps', px: PX, py: PY }],
    ['omuz', { yaw: YAW, pitch: -0.12, h: null, view: 'tps', px: PX, py: PY }],
    ['genis', { yaw: YAW, pitch: 0.06, h: 6, view: 'fps', px: PX, py: PY }],
  ];
  const done = {}; let cur = 'tps';
  for (const [name, s] of shots) {
    await p.evaluate(async ({ s }) => {
      const { pxToWorld } = await import('/sim/app/api.js'); const m = window.__mm;
      const [x, z] = pxToWorld(m.geo, s.px, s.py);
      m.teleport(x, z, s.yaw, s.pitch, 'walk', s.h ?? undefined);
    }, { s });
    if (!done.hud) { await p.keyboard.press('KeyH'); done.hud = 1; }
    const v = await p.evaluate(() => document.body.dataset.view || '');
    if (s.view === 'fps' && cur !== 'fps') { await p.keyboard.press('KeyT'); cur = 'fps'; }
    if (s.view === 'tps' && cur !== 'tps') { await p.keyboard.press('KeyT'); cur = 'tps'; }
    await p.waitForTimeout(9000);
    await p.screenshot({ path: `${out}/${tag}_${name}.png` });
  }
  console.log(JSON.stringify({ errs: [...new Set(errs)].slice(0, 6) }));
  await b.close();
})();
