/**
 * Martian Map - Performans & FPS Ölçüm Probu (perf_probe.js)
 * 
 * Bu dosya ES modülü DEĞİLDİR. Doğrudan tarayıcı geliştirici konsoluna (DevTools Console)
 * yapıştırılarak veya <script src="..."></script> ile sayfaya eklenerek çalıştırılabilir.
 * 
 * Amaç: 
 * Samet'in demo laptopunda (gerçek GPU) veya test ortamında simülasyonun
 * 30 saniyelik standart senaryo boyunca kare hızını (FPS), gecikmeleri (frame time percentiles),
 * çizim çağrılarını (draw calls), üçgen sayısını ve bellek tüketimini ölçmek.
 * 
 * Senaryo:
 * 1. Harita A/B seçimi: Grid px [433, 525] -> [491, 774]
 * 2. 3B Otomatik yürüyüşe geçiş (__mm.enter3D('auto'))
 * 3. 30 sn boyunca her karenin süresini toplayarak analiz etme
 *    - 10. sn: Standart arazi taraması (__mm.scan())
 *    - 20. sn: Geniş arazi taraması (__mm.scan(true))
 * 4. İstatistiklerin hesaplanması:
 *    - FPS ort / min / p50 / p95 / p99
 *    - Kare süresi ort / p95 / p99 / min / max (ms)
 *    - Draw calls & Triangles (ort / maks)
 *    - Terrain stats, JS heap, GPU & çözünürlük oranı
 * 5. Ekranda sonuç tablosu ve JSON indirme düğmesi
 * 
 * Geçti/Kaldı Kriterleri (Varsayım Eşikleri):
 * - Kare süresi p95 <= 22.0 ms
 * - Ortalama FPS >= 45.0 FPS
 */

(function () {
  'use strict';

  // Eski ölçüm UI varsa temizle
  const oldUi = document.getElementById('perf-probe-overlay');
  if (oldUi) oldUi.remove();
  const oldHud = document.getElementById('perf-probe-live-hud');
  if (oldHud) oldHud.remove();

  console.log('%c[PerfProbe] Martian Map Performans Probu başlatılıyor...', 'color: #00e5ff; font-weight: bold;');

  // Sim ortamını doğrula
  if (typeof window.__mm === 'undefined') {
    const msg = '[PerfProbe HATA] window.__mm bulunamadı! Lütfen http://127.0.0.1:8001/sim/ sayfasında olduğunuzdan emin olun.';
    console.error(msg);
    alert(msg);
    return;
  }

  // Eşik değerleri (Varsayımlar)
  const THRESHOLDS = {
    p95MaxMs: 22.0,      // Hedef p95 <= 22 ms
    avgMinFps: 45.0      // Hedef ortalama FPS >= 45 FPS
  };

  // Canlı HUD göstergesi oluştur
  const liveHud = document.createElement('div');
  liveHud.id = 'perf-probe-live-hud';
  liveHud.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 100000;
    background: rgba(15, 23, 42, 0.92);
    border: 1px solid #00e5ff;
    border-radius: 8px;
    padding: 12px 18px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
    font-size: 13px;
    color: #f8fafc;
    box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    backdrop-filter: blur(8px);
    pointer-events: none;
    min-width: 260px;
  `;
  liveHud.innerHTML = `
    <div style="font-weight: bold; color: #00e5ff; margin-bottom: 6px; display: flex; align-items: center; gap: 8px;">
      <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#00e5ff; animation: pulse 1s infinite alternate;"></span>
      <span>PERF PROBE: BAŞLATILIYOR</span>
    </div>
    <div id="perf-live-status" style="color: #cbd5e1; font-size: 12px;">Harita koordinatları yükleniyor...</div>
    <div id="perf-live-progress" style="margin-top: 6px; font-weight: 600; color: #38bdf8;"></div>
  `;
  document.body.appendChild(liveHud);

  // Pulse animasyonu
  if (!document.getElementById('perf-probe-keyframes')) {
    const style = document.createElement('style');
    style.id = 'perf-probe-keyframes';
    style.textContent = `
      @keyframes pulse { from { opacity: 0.3; } to { opacity: 1; } }
      .perf-table td, .perf-table th { padding: 6px 10px; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: left; }
      .perf-table th { color: #94a3b8; font-weight: 500; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
      .perf-badge-pass { background: #065f46; color: #34d399; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
      .perf-badge-fail { background: #881337; color: #f43f5e; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; }
      .perf-btn { background: #0284c7; color: #fff; border: none; border-radius: 6px; padding: 8px 14px; font-weight: 600; cursor: pointer; transition: background 0.2s; }
      .perf-btn:hover { background: #0369a1; }
    `;
    document.head.appendChild(style);
  }

  const updateHud = (statusText, progressText = '') => {
    const s = document.getElementById('perf-live-status');
    const p = document.getElementById('perf-live-progress');
    if (s) s.textContent = statusText;
    if (p) p.textContent = progressText;
  };

  // İstatistik Yardımcı Fonksiyonları
  function percentile(sortedArr, p) {
    if (!sortedArr || sortedArr.length === 0) return 0;
    const idx = Math.min(sortedArr.length - 1, Math.max(0, Math.floor(p * sortedArr.length)));
    return sortedArr[idx];
  }

  function average(arr) {
    if (!arr || arr.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i];
    return sum / arr.length;
  }

  function maxVal(arr) {
    if (!arr || arr.length === 0) return 0;
    let m = arr[0];
    for (let i = 1; i < arr.length; i++) if (arr[i] > m) m = arr[i];
    return m;
  }

  function minVal(arr) {
    if (!arr || arr.length === 0) return 0;
    let m = arr[0];
    for (let i = 1; i < arr.length; i++) if (arr[i] < m) m = arr[i];
    return m;
  }

  // Ana akış
  (async function runProbe() {
    try {
      updateHud('Koordinatlar dönüştürülüyor ([433,525] -> [491,774])...');

      // 1. Koordinatları haritada seç
      const api = await import('../../app/api.js');
      const g = window.__mm.geo;
      const mv = window.__mm.mapView;

      if (mv && typeof mv._click === 'function') {
        const ll = (c, r) => {
          const w = api.pxToWorld(g, c + 0.5, r + 0.5);
          const l = g.worldToLonlat(w[0], w[1]);
          return { lat: l[1], lng: l[0] };
        };

        const ptA = ll(433, 525);
        const ptB = ll(491, 774);

        updateHud('A ve B noktaları seçiliyor...');
        mv._click(ptA);
        mv._click(ptB);

        // Rotanın hesaplanmasını bekle
        updateHud('Rota hesaplanıyor (API / Nav)...');
        for (let i = 0; i < 40 && !(mv.route && mv.route.source); i++) {
          await new Promise((r) => setTimeout(r, 250));
        }
      }

      // 2. 3B yürüyüş moduna geçiş
      updateHud('3B moduna geçiliyor (__mm.enter3D("auto"))...');
      if (typeof window.__mm.enter3D === 'function') {
        window.__mm.enter3D('auto');
      }

      // 3B ortamın oturması için 1.5 sn bekle
      await new Promise((r) => setTimeout(r, 1500));

      // 3. 30 Saniyelik Ölçüm Senaryosu
      updateHud('30 saniyelik performans ölçümü başladı', '0.0s / 30.0s');

      const BENCHMARK_DURATION_MS = 30000;
      const frameDeltas = [];      // ms cinsinden kare süreleri
      const instantFpsArr = [];    // anlık FPS değerleri
      const drawCallsArr = [];     // her karedeki draw call sayısı
      const trianglesArr = [];     // her karedeki üçgen sayısı

      let scanTriggered10 = false;
      let scanTriggered20 = false;

      const startTime = performance.now();
      let lastTime = startTime;
      let frameCount = 0;

      await new Promise((resolve) => {
        function sampleFrame(now) {
          const dt = now - lastTime;
          lastTime = now;
          frameCount++;

          // İlk kare sıçramasını atla
          if (frameCount > 1) {
            frameDeltas.push(dt);
            if (dt > 0) {
              instantFpsArr.push(1000 / dt);
            }

            // Three.js renderer info
            const rendInfo = window.__mm.T && window.__mm.T.renderer ? window.__mm.T.renderer.info.render : null;
            if (rendInfo) {
              drawCallsArr.push(rendInfo.calls);
              trianglesArr.push(rendInfo.triangles);
            }
          }

          const elapsed = now - startTime;

          // 10. sn'de normal tarama
          if (elapsed >= 10000 && !scanTriggered10) {
            scanTriggered10 = true;
            console.log('[PerfProbe] 10. sn: Standart tarama başlatıldı (__mm.scan()).');
            if (typeof window.__mm.scan === 'function') window.__mm.scan();
          }

          // 20. sn'de geniş tarama
          if (elapsed >= 20000 && !scanTriggered20) {
            scanTriggered20 = true;
            console.log('[PerfProbe] 20. sn: Geniş tarama başlatıldı (__mm.scan(true)).');
            if (typeof window.__mm.scan === 'function') window.__mm.scan(true);
          }

          // Canlı HUD güncelleme (her ~10 karede bir)
          if (frameCount % 10 === 0) {
            const currentFps = dt > 0 ? (1000 / dt).toFixed(1) : '--';
            const progressSec = (Math.min(elapsed, BENCHMARK_DURATION_MS) / 1000).toFixed(1);
            let stateNote = 'Normal yürüyüş';
            if (elapsed >= 20000 && elapsed < 27000) stateNote = 'Geniş tarama aktif';
            else if (elapsed >= 10000 && elapsed < 17000) stateNote = 'Standart tarama aktif';

            updateHud(
              `Ölçüm sürüyor (${stateNote})`,
              `${progressSec}s / 30.0s | Anlık: ${currentFps} FPS`
            );
          }

          if (elapsed < BENCHMARK_DURATION_MS) {
            requestAnimationFrame(sampleFrame);
          } else {
            resolve();
          }
        }

        requestAnimationFrame(sampleFrame);
      });

      const totalBenchmarkMs = performance.now() - startTime;
      updateHud('Ölçüm tamamlandı, rapor hazırlanıyor...', `${(totalBenchmarkMs / 1000).toFixed(1)}s`);

      // 4. İstatistiklerin Hesaplanması
      const sortedDeltas = [...frameDeltas].sort((a, b) => a - b);
      const sortedFps = [...instantFpsArr].sort((a, b) => a - b);

      const totalValidFrames = frameDeltas.length;
      const trueAvgFps = totalValidFrames / (totalBenchmarkMs / 1000);

      const stats = {
        meta: {
          timestamp: new Date().toISOString(),
          durationMs: +totalBenchmarkMs.toFixed(1),
          totalFrames: totalValidFrames,
          gridA: [433, 525],
          gridB: [491, 774]
        },
        fps: {
          avg: +trueAvgFps.toFixed(2),
          min: +minVal(sortedFps).toFixed(2),
          p50: +percentile(sortedFps, 0.50).toFixed(2),
          p95: +percentile(sortedFps, 0.95).toFixed(2),
          p99: +percentile(sortedFps, 0.99).toFixed(2)
        },
        frameTimeMs: {
          avg: +average(sortedDeltas).toFixed(2),
          p50: +percentile(sortedDeltas, 0.50).toFixed(2),
          p95: +percentile(sortedDeltas, 0.95).toFixed(2),
          p99: +percentile(sortedDeltas, 0.99).toFixed(2),
          min: +minVal(sortedDeltas).toFixed(2),
          max: +maxVal(sortedDeltas).toFixed(2)
        },
        render: {
          callsAvg: Math.round(average(drawCallsArr)),
          callsMax: maxVal(drawCallsArr),
          trianglesAvg: Math.round(average(trianglesArr)),
          trianglesMax: maxVal(trianglesArr)
        },
        terrainStats: (window.__mm.T && window.__mm.T.terrain && window.__mm.T.terrain.stats) 
          ? { ...window.__mm.T.terrain.stats } 
          : (window.__mm.stats ? window.__mm.stats() : {}),
        hardware: {},
        criteria: {
          p95TargetMs: THRESHOLDS.p95MaxMs,
          p95ActualMs: +percentile(sortedDeltas, 0.95).toFixed(2),
          p95Passed: percentile(sortedDeltas, 0.95) <= THRESHOLDS.p95MaxMs,
          avgFpsTarget: THRESHOLDS.avgMinFps,
          avgFpsActual: +trueAvgFps.toFixed(2),
          avgFpsPassed: trueAvgFps >= THRESHOLDS.avgMinFps,
          overallPassed: (percentile(sortedDeltas, 0.95) <= THRESHOLDS.p95MaxMs) && (trueAvgFps >= THRESHOLDS.avgMinFps)
        }
      };

      // Donanım & Tarayıcı & WebGL bilgisi
      try {
        const gl = window.__mm.T && window.__mm.T.renderer ? window.__mm.T.renderer.getContext() : null;
        let gpuRenderer = 'N/A';
        let gpuVendor = 'N/A';
        if (gl) {
          const dbg = gl.getExtension('WEBGL_debug_renderer_info');
          if (dbg) {
            gpuRenderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
            gpuVendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
          }
        }

        const rendDom = window.__mm.T && window.__mm.T.renderer ? window.__mm.T.renderer.domElement : null;
        const canvasW = rendDom ? rendDom.width : window.innerWidth;
        const canvasH = rendDom ? rendDom.height : window.innerHeight;
        const dpr = window.devicePixelRatio || 1;
        const resRatio = rendDom ? +(rendDom.width / window.innerWidth).toFixed(2) : 1;

        stats.hardware = {
          gpuRenderer,
          gpuVendor,
          canvasResolution: `${canvasW}x${canvasH}`,
          viewportSize: `${window.innerWidth}x${window.innerHeight}`,
          devicePixelRatio: dpr,
          resolutionRatio: resRatio,
          userAgent: navigator.userAgent
        };

        // Bellek (Chrome/Edge performance.memory varsa)
        if (performance.memory) {
          stats.hardware.jsHeapUsedMB = +(performance.memory.usedJSHeapSize / (1024 * 1024)).toFixed(2);
          stats.hardware.jsHeapTotalMB = +(performance.memory.totalJSHeapSize / (1024 * 1024)).toFixed(2);
          stats.hardware.jsHeapLimitMB = +(performance.memory.jsHeapSizeLimit / (1024 * 1024)).toFixed(2);
        }
      } catch (hwErr) {
        console.warn('[PerfProbe] Donanım bilgisi toplanırken hata:', hwErr);
      }

      // Raporu global erişime aç
      window.__perfReport = stats;
      console.log('%c[PerfProbe] ÖLÇÜM RAPORU HAZIRLANDI:', 'color: #38bdf8; font-weight: bold;', stats);

      // HUD'ı gizle
      if (liveHud) liveHud.remove();

      // 5. Ekranda Sonuç Tablosu ve İndirme Düğmesi Oluştur
      showResultModal(stats);

    } catch (err) {
      console.error('[PerfProbe HATA]', err);
      updateHud('HATA OLUŞTU: ' + err.message);
    }
  })();

  // Sonuç Modalı
  function showResultModal(stats) {
    const modal = document.createElement('div');
    modal.id = 'perf-probe-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 680px;
      max-width: 95vw;
      max-height: 90vh;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.75);
      z-index: 100000;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      overflow-y: auto;
      padding: 24px;
      box-sizing: border-box;
    `;

    const passBadge = `<span class="perf-badge-pass">GEÇTİ (PASS)</span>`;
    const failBadge = `<span class="perf-badge-fail">KALDI (FAIL)</span>`;

    modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid #1e293b; padding-bottom: 12px;">
        <div>
          <h2 style="margin: 0 0 4px 0; font-size: 18px; color: #38bdf8; display: flex; align-items: center; gap: 10px;">
            Martian Map Performans Raporu (30 sn)
          </h2>
          <div style="font-size: 12px; color: #94a3b8;">
            Tarih: ${stats.meta.timestamp} | Senaryo: [433,525] &rarr; [491,774] | Süre: ${(stats.meta.durationMs/1000).toFixed(1)} sn (${stats.meta.totalFrames} kare)
          </div>
        </div>
        <div>
          ${stats.criteria.overallPassed ? passBadge : failBadge}
        </div>
      </div>

      <!-- Donanım ve GPU -->
      <div style="background: #1e293b; border-radius: 8px; padding: 10px 14px; margin-bottom: 16px; font-size: 12px;">
        <div style="color: #38bdf8; font-weight: 600; margin-bottom: 4px;">Donanım & GPU Bilgisi:</div>
        <div><strong>GPU:</strong> ${stats.hardware.gpuRenderer || 'Bilinmiyor'}</div>
        <div><strong>Çözünürlük:</strong> ${stats.hardware.canvasResolution || 'N/A'} (Oran: ${stats.hardware.resolutionRatio || '1.0'}, DPR: ${stats.hardware.devicePixelRatio || 1})</div>
        ${stats.hardware.jsHeapUsedMB ? `<div><strong>JS Bellek:</strong> ${stats.hardware.jsHeapUsedMB} MB / ${stats.hardware.jsHeapTotalMB} MB (Limit: ${stats.hardware.jsHeapLimitMB} MB)</div>` : ''}
      </div>

      <!-- Kriter Karşılaştırma -->
      <table class="perf-table" style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 13px;">
        <thead>
          <tr>
            <th>Kriter</th>
            <th>Hedef / Eşik</th>
            <th>Ölçülen Değer</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Kare Süresi (p95)</strong></td>
            <td>&le; ${stats.criteria.p95TargetMs} ms</td>
            <td><strong style="color: ${stats.criteria.p95Passed ? '#34d399' : '#f43f5e'}">${stats.criteria.p95ActualMs} ms</strong></td>
            <td>${stats.criteria.p95Passed ? passBadge : failBadge}</td>
          </tr>
          <tr>
            <td><strong>Ortalama FPS</strong></td>
            <td>&ge; ${stats.criteria.avgFpsTarget} FPS</td>
            <td><strong style="color: ${stats.criteria.avgFpsPassed ? '#34d399' : '#f43f5e'}">${stats.criteria.avgFpsActual} FPS</strong></td>
            <td>${stats.criteria.avgFpsPassed ? passBadge : failBadge}</td>
          </tr>
        </tbody>
      </table>

      <!-- Detaylı Metrikler Tablosu -->
      <table class="perf-table" style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 12px;">
        <thead>
          <tr>
            <th colspan="2">FPS İstatistikleri</th>
            <th colspan="2">Kare Süresi (Frame Time)</th>
            <th colspan="2">Render & Arazi</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ortalama FPS:</td><td><strong>${stats.fps.avg}</strong></td>
            <td>Ortalama ms:</td><td><strong>${stats.frameTimeMs.avg} ms</strong></td>
            <td>Draw Calls (Ort/Maks):</td><td>${stats.render.callsAvg} / ${stats.render.callsMax}</td>
          </tr>
          <tr>
            <td>Medyan (p50):</td><td>${stats.fps.p50}</td>
            <td>Medyan (p50):</td><td>${stats.frameTimeMs.p50} ms</td>
            <td>Triangles (Ort/Maks):</td><td>${stats.render.trianglesAvg.toLocaleString()} / ${stats.render.trianglesMax.toLocaleString()}</td>
          </tr>
          <tr>
            <td>p95 FPS:</td><td>${stats.fps.p95}</td>
            <td>p95 ms:</td><td><strong>${stats.frameTimeMs.p95} ms</strong></td>
            <td>Arazi Karoları (Tiles):</td><td>${stats.terrainStats.tiles || stats.terrainStats.loading || 'N/A'}</td>
          </tr>
          <tr>
            <td>p99 FPS:</td><td>${stats.fps.p99}</td>
            <td>p99 ms:</td><td><strong>${stats.frameTimeMs.p99} ms</strong></td>
            <td>Arazi Yükleme:</td><td>${stats.terrainStats.loading ?? 0} aktif</td>
          </tr>
          <tr>
            <td>Min FPS:</td><td>${stats.fps.min}</td>
            <td>Min / Max ms:</td><td>${stats.frameTimeMs.min} / ${stats.frameTimeMs.max} ms</td>
            <td>10s & 20s Tarama:</td><td>Tamamlandı (90m + 220m)</td>
          </tr>
        </tbody>
      </table>

      <!-- Eylemler -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 18px; border-top: 1px solid #1e293b; padding-top: 14px;">
        <div style="font-size: 11px; color: #64748b;">
          * Eşik varsayımları: Hedef 45+ FPS ve p95 &le; 22 ms (60 Hz ekran bütçesi ~16.6ms, 45 FPS bütçesi ~22.2ms).
        </div>
        <div style="display: flex; gap: 10px;">
          <button id="perf-download-btn" class="perf-btn" style="background: #0284c7;">
            📥 JSON İndir (perf_report.json)
          </button>
          <button id="perf-close-btn" class="perf-btn" style="background: #475569;">
            Kapat
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Düğme Olayları
    document.getElementById('perf-download-btn').addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stats, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `perf_report_${new Date().toISOString().slice(0,19).replace(/[:T]/g, '_')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });

    document.getElementById('perf-close-btn').addEventListener('click', () => {
      modal.remove();
    });
  }
})();
