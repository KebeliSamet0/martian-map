// Görsel desk: kalite seviyesi başına FPS ve saf veri (V) karesi. node gorsel_fps.js <etiket> [outDir]
const { chromium } = require('/Users/samet/Desktop/Spaceapp/qa-shared/node_modules/playwright-core');
const exe = `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`;
const out = process.argv[3] || 'out';
(async () => {
  const b = await chromium.launch({ executablePath: exe, headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  const res = {};
  for (const q of ['low', 'med', 'high']) {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(`http://127.0.0.1:8015/sim/?mod=3d&q=${q}&fixedres=1&api=http://127.0.0.1:8000`);
    await p.waitForFunction(() => window.__mm && window.__mm.geo, null, { timeout: 40000 });
    await p.evaluate(async () => { const { pxToWorld } = await import('/sim/app/api.js'); const m = window.__mm; const [x, z] = pxToWorld(m.geo, 472, 635); m.teleport(x, z, 1.2, -0.1, 'walk'); });
    await p.waitForTimeout(8000);
    res[q] = await p.evaluate(() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 4000) requestAnimationFrame(f); else r(+(n / 4).toFixed(1)); }; requestAnimationFrame(f); }));
    if (q === 'high') { await p.keyboard.press('KeyH'); await p.screenshot({ path: `${out}/q_high.png` }); await p.keyboard.press('KeyV'); await p.waitForTimeout(1500); await p.screenshot({ path: `${out}/saf_veri.png` }); }
    if (q === 'low') { await p.keyboard.press('KeyH'); await p.screenshot({ path: `${out}/q_low.png` }); }
    await p.close();
  }
  console.log(JSON.stringify(res)); await b.close();
})();
