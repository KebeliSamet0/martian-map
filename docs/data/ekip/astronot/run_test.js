// run_test.js — Headless Chrome ile 3. Şahıs Astronot ve Takip Kamerası Testi
const http = require('http');
const fs = require('fs');
const path = require('path');

// Proje yolları
const THIS_DIR = __dirname;
const SIM_DIR = path.resolve(THIS_DIR, '../../../../sim');
const VENDOR_THREE = path.join(SIM_DIR, 'vendor', 'three.module.js');
const PLAYWRIGHT_PATH = path.join(SIM_DIR, 'node_modules', 'playwright-core');

console.log('[TEST] Başlatılıyor...');
console.log('[TEST] Çalışma dizini:', THIS_DIR);
console.log('[TEST] Three.js vendor yolu:', VENDOR_THREE);

if (!fs.existsSync(VENDOR_THREE)) {
  console.error('[HATA] Three.js vendor dosyası bulunamadı:', VENDOR_THREE);
  process.exit(1);
}

// 1. STATİK HTTP SUNUCUSU BAŞLAT
const PORT = 8092;
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/test.html';

  let filePath;
  if (reqPath.startsWith('/vendor/')) {
    filePath = path.join(SIM_DIR, reqPath);
  } else {
    filePath = path.join(THIS_DIR, reqPath);
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found: ' + reqPath);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, async () => {
  console.log(`[TEST] HTTP sunucusu dinlemede: http://localhost:${PORT}`);

  try {
    const { chromium } = require(PLAYWRIGHT_PATH);

    const chromePath = 'C:\\Users\\Batu\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe';
    console.log('[TEST] Chromium başlatılıyor:', chromePath);

    const browser = await chromium.launch({
      executablePath: chromePath,
      headless: true,
      args: [
        '--headless',
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-webgl',
        '--no-sandbox',
        '--disable-gpu-sandbox',
        '--window-size=1024,768'
      ]
    });

    const context = await browser.newContext({
      viewport: { width: 1024, height: 768 },
      deviceScaleFactor: 1
    });

    const page = await context.newPage();

    page.on('console', msg => console.log('  [BROWSER]', msg.text()));
    page.on('pageerror', err => console.error('  [PAGE ERROR]', err.message));

    console.log('[TEST] Sayfa açılıyor: http://localhost:' + PORT + '/test.html');
    await page.goto(`http://localhost:${PORT}/test.html`, { waitUntil: 'domcontentloaded' });

    // WebGL ve testController hazır olana kadar bekle
    await page.waitForFunction(() => window.testController && window.testController.isReady, { timeout: 15000 });
    console.log('[TEST] WebGL ve TestController hazır!');

    // -------------------------------------------------------------
    // KARE 1: Dururken (Idle)
    // -------------------------------------------------------------
    console.log('[TEST] 1. Kare: Dururken (Idle)...');
    await page.evaluate(() => window.testController.setScenario('idle'));
    await page.waitForTimeout(600);
    const idlePath = path.join(THIS_DIR, 'idle.png');
    await page.screenshot({ path: idlePath });
    const idleStats = fs.statSync(idlePath);
    console.log(`[TEST] -> idle.png kaydedildi (${(idleStats.size / 1024).toFixed(1)} KB)`);

    // -------------------------------------------------------------
    // KARE 2: Düz Zeminde Yürürken (Walk)
    // -------------------------------------------------------------
    console.log('[TEST] 2. Kare: Yürürken (Walk, 0.67 m/s)...');
    await page.evaluate(() => window.testController.setScenario('walk'));
    await page.waitForTimeout(600);
    const walkPath = path.join(THIS_DIR, 'walk.png');
    await page.screenshot({ path: walkPath });
    const walkStats = fs.statSync(walkPath);
    console.log(`[TEST] -> walk.png kaydedildi (${(walkStats.size / 1024).toFixed(1)} KB)`);

    // -------------------------------------------------------------
    // KARE 3: Kamera Arazi Tepesinde (Terrain)
    // -------------------------------------------------------------
    console.log('[TEST] 3. Kare: Kamera arazi tepesinde (Terrain)...');
    await page.evaluate(() => window.testController.setScenario('terrain'));
    await page.waitForTimeout(600);
    const terrainPath = path.join(THIS_DIR, 'terrain.png');
    await page.screenshot({ path: terrainPath });
    const terrainStats = fs.statSync(terrainPath);
    console.log(`[TEST] -> terrain.png kaydedildi (${(terrainStats.size / 1024).toFixed(1)} KB)`);

    // Bilgileri al
    const finalStats = await page.evaluate(() => window.testController.getStats());
    console.log('[TEST] Son durum istatistikleri:', JSON.stringify(finalStats, null, 2));

    await browser.close();
    server.close();
    console.log('[TEST] BÜTÜN TESTLER BAŞARIYLA TAMAMLANDI!');
    process.exit(0);
  } catch (err) {
    console.error('[TEST HATA]', err);
    server.close();
    process.exit(1);
  }
});
