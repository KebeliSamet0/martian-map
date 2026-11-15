/**
 * Martian Map - Uçtan Uca Otomatik Regresyon Testi (e2e_regression.js)
 * 
 * Amaç:
 * Simülasyonun kritik işlevlerini otomatik olarak test eden regresyon betiği.
 * Referans: C:/Users/Batu/Desktop/mm-audit/e2e/flow4.js
 * 
 * Doğrulanan Kriterler:
 * 1. Önkoşul: API (http://127.0.0.1:8000) ve Sim (http://127.0.0.1:8001/sim/) çalışır durumda olmalı
 * 2. API rota kaynağı: route.source === 'api'
 * 3. Rota mesafesi: 0.4 km <= km <= 0.7 km
 * 4. Tarama göstergesi: #scanleg görünür olmalı
 * 5. Astronot modeli: Görünür ve ayak seviyesi zemin ±0.05 m içinde
 * 6. Yeniden planlama: Replan tetiklenmeli ve #toast mesajı içermeli
 * 7. Rotadan sapma: Rotadan 30m çıkıldığında #warn uyarısı tetiklenmeli
 * 8. Konsol / sayfa hataları: Dış ağ kaynaklı olmayan JS çalışma zamanı hatası olmamalı
 * 
 * Başarısızlık durumunda Exit Code 1 ve açıklayıcı hata mesajı üretir.
 */

const http = require('http');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Playwright-core yükleme (önce yerel repo node_modules, sonra global)
function resolvePlaywright() {
  const localCandidates = [
    path.resolve(__dirname, '../../../../sim/node_modules/playwright-core'),
    'C:/Users/Batu/Desktop/martian-map-main/martian-map-main/sim/node_modules/playwright-core',
    'playwright-core'
  ];
  for (const candidate of localCandidates) {
    try {
      return require(candidate);
    } catch (e) {
      // devam et
    }
  }
  throw new Error('playwright-core modülü bulunamadı! Lütfen sim/ altında npm install yapıldığından emin olun.');
}

// Chrome çalıştırılabilir dosya yolu tespiti
function resolveChromePath() {
  const candidates = [
    process.env.CHROME_BIN,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Users/Batu/AppData/Local/ms-playwright/chromium-1248/chrome-win64/chrome.exe'
  ];
  for (const c of candidates) {
    if (c && fs.existsSync(c)) return c;
  }
  return undefined; // Playwright varsayılanını dener
}

// HTTP ping kontrolü (Önkoşul doğrulama)
function checkHttpEndpoint(url, name) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(url);
      const req = http.request({
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname || '/',
        method: 'GET',
        timeout: 3000
      }, (res) => {
        // Herhangi bir HTTP yanıtı (200, 404 vs.) sunucunun ayakta olduğunu gösterir
        resolve({ ok: true, status: res.statusCode });
      });

      req.on('error', (err) => {
        resolve({ ok: false, error: err.message });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ ok: false, error: 'Zaman aşımı (timeout)' });
      });

      req.end();
    } catch (err) {
      resolve({ ok: false, error: err.message });
    }
  });
}

(async () => {
  console.log('===============================================================');
  console.log('🚀 MARTIAN MAP E2E REGRESYON TESTİ (e2e_regression.js)');
  console.log('===============================================================\n');

  // 1. ÖNKOŞUL KONTROLÜ
  console.log('🔍 [1/8] Önkoşul kontrolü yapılıyor...');
  const apiCheck = await checkHttpEndpoint('http://127.0.0.1:8000/', 'API');
  const simCheck = await checkHttpEndpoint('http://127.0.0.1:8001/sim/', 'Simülasyon');

  if (!apiCheck.ok || !simCheck.ok) {
    console.error('\n❌ HATA: Önkoşullar sağlanamadı!');
    if (!apiCheck.ok) {
      console.error(`  - API (http://127.0.0.1:8000) erişilemez durumda: ${apiCheck.error}`);
    }
    if (!simCheck.ok) {
      console.error(`  - Simülasyon (http://127.0.0.1:8001/sim/) erişilemez durumda: ${simCheck.error}`);
    }
    console.error('\nÖnkoşul: API (port 8000) ve Sim (port 8001) önceden çalıştırılmış olmalıdır.');
    console.error('Bu betik sunucuları kendisi başlatmaz. Lütfen servisleri başlatıp tekrar deneyin.\n');
    process.exit(1);
  }

  console.log(`  ✓ API (127.0.0.1:8000) hazır (HTTP yanıtı: ${apiCheck.status})`);
  console.log(`  ✓ Simülasyon (127.0.0.1:8001) hazır (HTTP yanıtı: ${simCheck.status})\n`);

  // 2. PLAYWRIGHT VE TARAYICI BAŞLATMA
  console.log('🌐 [2/8] Headless tarayıcı başlatılıyor (SwiftShader yazılım GL)...');
  const { chromium } = resolvePlaywright();
  const chromePath = resolveChromePath();

  const launchOptions = {
    headless: true,
    args: [
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--no-sandbox'
    ]
  };
  if (chromePath) launchOptions.executablePath = chromePath;

  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } });

  // Konsol ve sayfa hatalarını toplama
  const pageErrors = [];
  const consoleErrors = [];

  page.on('pageerror', (err) => {
    pageErrors.push(err.message || String(err));
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Harici ağ abort loglarını filtrele
      if (!txt.includes('net::ERR_FAILED') && !txt.includes('Failed to load resource')) {
        consoleErrors.push(txt);
      }
    }
  });

  // Harici ağ çağrılarını engelle (çevrimdışı ve yerel kararlılık için)
  await page.route((url) => !/127.0.0.1/.test(url.toString()), (route) => route.abort());

  try {
    // 3. SİMÜLASYON SAYFASINA GİT VE HARİTAYI BEKLE
    console.log('🧭 [3/8] http://127.0.0.1:8001/sim/?fixedres=1 yükleniyor...');
    await page.goto('http://127.0.0.1:8001/sim/?fixedres=1', { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => window.__mm && window.__mm.mapView, null, { timeout: 120000 });
    console.log('  ✓ Simülasyon harita görünümü (mapView) başarıyla yüklendi.');

    // 4. A VE B NOKTALARINI SEÇ & ROTA DOĞRULAMASI
    console.log('\n📍 [4/8] Rota planlaması test ediliyor ([433,525] -> [491,774])...');
    const routeResult = await page.evaluate(async () => {
      const api = await import('./app/api.js');
      const g = window.__mm.geo;
      const mv = window.__mm.mapView;
      const ll = (c, r) => {
        const w = api.pxToWorld(g, c + 0.5, r + 0.5);
        const l = g.worldToLonlat(w[0], w[1]);
        return { lat: l[1], lng: l[0] };
      };

      mv._click(ll(433, 525));
      mv._click(ll(491, 774));

      for (let i = 0; i < 40 && !(mv.route && mv.route.source); i++) {
        await new Promise((r) => setTimeout(r, 250));
      }

      const r = mv.route;
      return r ? {
        source: r.source,
        why: r.fallbackWhy,
        km: r.total?.km,
        min: r.total?.min,
        status: r.total?.status,
        segs: r.segments?.length,
        pts: r.dense?.length
      } : null;
    });

    console.log('  Bulunan Rota Özeti:', JSON.stringify(routeResult));

    // ASSERT: Rota var mı
    assert(routeResult, '[ASSERT FAIL] Rota 10 saniye içinde hesaplanamadı!');
    
    // ASSERT: API rota kaynağı=api
    assert.strictEqual(
      routeResult.source, 
      'api', 
      `[ASSERT FAIL] Rota kaynağı 'api' olmalıdır (yerel yedek değil)! Bulunan: '${routeResult.source}' (Neden: ${routeResult.why})`
    );
    console.log('  ✓ ASSERT GEÇTİ: Rota kaynağı API ("api")');

    // ASSERT: Rota mesafesi 0.4–0.7 km
    assert(
      typeof routeResult.km === 'number' && routeResult.km >= 0.4 && routeResult.km <= 0.7,
      `[ASSERT FAIL] Rota mesafesi 0.4 - 0.7 km aralığında olmalıdır! Ölçülen: ${routeResult.km} km`
    );
    console.log(`  ✓ ASSERT GEÇTİ: Rota mesafesi aralıkta (${routeResult.km.toFixed(3)} km)`);

    // 5. 3B MODUNA GEÇİŞ VE TARAMA GÖSTERGESİ TESTİ
    console.log('\n🚶 [5/8] 3B Yürüyüş moduna geçiliyor ve arazi taraması yapılıyor...');
    await page.evaluate(() => window.__mm.enter3D('auto'));
    await page.waitForTimeout(9000);

    // Tarama başlat (__mm.scan())
    await page.evaluate(() => window.__mm.scan());
    await page.waitForTimeout(1800);

    const scanLegStatus = await page.evaluate(() => {
      const el = document.getElementById('scanleg');
      return el ? !el.hidden : false;
    });

    // ASSERT: Tarama legend görünür
    assert(
      scanLegStatus === true,
      '[ASSERT FAIL] Tarama sonrası #scanleg arazi göstergesi görünür olmalıdır (hidden: false)!'
    );
    console.log('  ✓ ASSERT GEÇTİ: Tarama göstergesi (#scanleg) aktif ve görünür');

    // 6. ASTRONOT MODELİ VE ZEMİN HİZALAMASI TESTİ
    console.log('\n👨‍🚀 [6/8] Astronot modeli ve zemin hizalaması (y=zemin ±0.05m) kontrol ediliyor...');
    const astroCheck = await page.evaluate(() => {
      const g = window.__mm.T?.astro?.group;
      if (!g) return { found: false };
      const astroY = +g.position.y.toFixed(3);
      const groundY = +(window.__mm.P.y - 1.75).toFixed(3);
      const diff = +(astroY - groundY).toFixed(3);
      return {
        found: true,
        visible: g.visible,
        astroY,
        groundY,
        diff,
        absDiff: Math.abs(diff)
      };
    });

    console.log('  Astronot Durumu:', JSON.stringify(astroCheck));
    assert(astroCheck.found, '[ASSERT FAIL] __mm.T.astro.group Three.js sahnesinde bulunamadı!');
    assert(astroCheck.visible, '[ASSERT FAIL] Astronot modeli görünür (visible: true) olmalıdır!');
    console.log('  ✓ ASSERT GEÇTİ: Astronot modeli sahnede ve görünür');

    // ASSERT: Ayak y=zemin ±0.05
    assert(
      astroCheck.absDiff <= 0.05,
      `[ASSERT FAIL] Astronot ayak seviyesi zemin ±0.05 m olmalıdır! astroY=${astroCheck.astroY}, zemin=${astroCheck.groundY}, fark=${astroCheck.diff} m`
    );
    console.log(`  ✓ ASSERT GEÇTİ: Ayak zemin hizası tolerans içinde (fark: ${astroCheck.diff} m <= 0.05 m)`);

    // 7. YENİDEN PLANLAMA (REPLAN) VE TOAST BİLDİRİMİ TESTİ
    console.log('\n🔄 [7/8] Kum algılama noktasına ilerleniyor ve replan/toast kontrol ediliyor...');
    await page.evaluate(() => {
      const R = window.__mm.routeRun;
      if (R && R.sand) {
        // Kum noktası tespit mesafesi (sand.s - 60m): detection eşiği 80m içinde tetikler
        const targetProgress = Math.max(0.35, (R.sand.s - 60) / R.total);
        window.__mm.setProgress(targetProgress);
      } else {
        window.__mm.setProgress(0.37);
      }
    });

    // Replan API çağrısının tamamlanmasını bekle
    let replanCheck = { replanned: false, toastText: '' };
    for (let waitIdx = 0; waitIdx < 20; waitIdx++) {
      await page.waitForTimeout(1000);
      replanCheck = await page.evaluate(() => {
        const rr = window.__mm.routeRun;
        const toastEl = document.getElementById('toast');
        return {
          replanned: !!rr?.replanned,
          source: rr?.r?.source,
          km: rr?.r?.total?.km,
          toastText: toastEl ? (toastEl.textContent || '').trim() : ''
        };
      });
      if (replanCheck.replanned) break;
    }

    console.log('  Replan Durumu:', JSON.stringify(replanCheck));
    // ASSERT: replan olur
    assert(
      replanCheck.replanned === true,
      '[ASSERT FAIL] Engelle karşılaşma sonrası rota replanned: true olmalıdır!'
    );
    console.log('  ✓ ASSERT GEÇTİ: Replan başarıyla gerçekleşti');

    // ASSERT: toast içerir
    assert(
      replanCheck.toastText.length > 0,
      `[ASSERT FAIL] Replan sonrasında toast bildirimi gösterilmeli! toast='${replanCheck.toastText}'`
    );
    console.log(`  ✓ ASSERT GEÇTİ: Replan toast bildirimi mevcut ("${replanCheck.toastText.slice(0, 60)}...")`);

    // 8. ROTADAN SAPMA UYARISI (#warn) TESTİ
    console.log('\n⚠️ [8/8] Rotadan 30 metre sapma simüle ediliyor ve sapma uyarısı kontrol ediliyor...');
    await page.keyboard.down('KeyW');
    await page.waitForTimeout(400);
    await page.evaluate(() => { window.__mm.P.x += 30; });
    await page.keyboard.up('KeyW');
    await page.waitForTimeout(5000);

    const warnCheck = await page.evaluate(() => {
      const w = document.getElementById('warn');
      return {
        found: !!w,
        hidden: w ? w.hidden : true,
        text: w ? (w.textContent || '').trim() : ''
      };
    });

    console.log('  Sapma Uyarısı Durumu:', JSON.stringify(warnCheck));
    // ASSERT: rotadan sapma uyarısı çıkar
    assert(
      warnCheck.found && !warnCheck.hidden,
      '[ASSERT FAIL] Rotadan 30 metre sapıldığında #warn sapma uyarısı görünür (hidden: false) olmalıdır!'
    );
    assert(
      warnCheck.text.length > 0,
      '[ASSERT FAIL] Sapma uyarısı metin içermelidir!'
    );
    console.log(`  ✓ ASSERT GEÇTİ: Rotadan sapma uyarısı başarıyla görüntülendi ("${warnCheck.text.slice(0, 60)}...")`);

    // 9. KONSOL VE SAYFA HATALARI DOĞRULAMASI
    console.log('\n🛡️ Konsol ve sayfa çalışma zamanı hataları denetleniyor...');
    const criticalErrors = [...pageErrors, ...consoleErrors];
    if (criticalErrors.length > 0) {
      console.warn('  ⚠️ Yakalanan Konsol/Sayfa Hataları:', criticalErrors);
    }
    assert.strictEqual(
      pageErrors.length,
      0,
      `[ASSERT FAIL] Sayfada işlenmemiş JS hatası (pageerror) tespit edildi: ${JSON.stringify(pageErrors)}`
    );
    console.log('  ✓ ASSERT GEÇTİ: Dış ağ kaynaklı olmayan hiçbir JS sayfa hatası yok.');

    // TÜM TESTLER BAŞARILI
    console.log('\n===============================================================');
    console.log('🎉 TEBRİKLER: TÜM E2E REGRESYON TESTLERİ VE ASSERTIONLAR GEÇTİ!');
    console.log('===============================================================');

    await browser.close();
    process.exit(0);

  } catch (testError) {
    console.error('\n❌ ===============================================================');
    console.error('❌ REGRESYON TESTİ BAŞARISIZ OLDU!');
    console.error('❌ ===============================================================');
    console.error(`Hata Mesajı: ${testError.message}`);
    if (testError.stack) {
      console.error(`Detay:\n${testError.stack}`);
    }

    try {
      await browser.close();
    } catch (_) {}

    process.exit(1);
  }
})();
