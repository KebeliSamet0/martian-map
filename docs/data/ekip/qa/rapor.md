# Martian Map - QA ve Performans Raporu

**Tarih:** 14 Kasım 2026  
**Hedef:** Sprint 2 Demo (20:30) Öncesi Otomatik Regresyon & GPU Performans Ölçümü  
**Kapsam:** `docs/data/ekip/qa/perf_probe.js` ve `docs/data/ekip/qa/e2e_regression.js`  
**Ortam:** Windows, Node.js + Playwright-core, Headless Chrome (SwiftShader Yazılım GL)

---

## 1. Samet'in Demo Laptopu İçin 5 Satırlık Hızlı Kullanım Talimatı

1. **Sunucuları başlatın:** API (`uvicorn api.main:app --port 8000`) ve Simülasyonu (`python sim/tools/devserver.py 8001`) çalıştırın.
2. **Simülasyonu açın:** Chrome/Edge tarayıcısında `http://127.0.0.1:8001/sim/` adresine gidin.
3. **Konsolu açın:** `F12` tuşuna basıp **Console** (Konsol) sekmesine geçin.
4. **Probu yapıştırıp çalıştırın:** `docs/data/ekip/qa/perf_probe.js` dosyasının tüm içeriğini konsola yapıştırıp `Enter`'a basın.
5. **Sonucu inceleyin & indirin:** 30 saniyelik otomatik rota/tarama testi bitince ekrandaki sonuç tablosundan GPU/FPS değerlerini görün ve **"JSON İndir"** düğmesiyle raporu kaydedin.

---

## 2. Otomatik Regresyon Testi (`e2e_regression.js`) Çıktısı

Betiği çalıştırma komutu:
```bash
node docs/data/ekip/qa/e2e_regression.js
```

### Koşulan Gerçek Terminal Çıktısı (Exit Code 0):
```text
===============================================================
🚀 MARTIAN MAP E2E REGRESYON TESTİ (e2e_regression.js)
===============================================================

🔍 [1/8] Önkoşul kontrolü yapılıyor...
  ✓ API (127.0.0.1:8000) hazır (HTTP yanıtı: 404)
  ✓ Simülasyon (127.0.0.1:8001) hazır (HTTP yanıtı: 200)

🌐 [2/8] Headless tarayıcı başlatılıyor (SwiftShader yazılım GL)...
🧭 [3/8] http://127.0.0.1:8001/sim/?fixedres=1 yükleniyor...
  ✓ Simülasyon harita görünümü (mapView) başarıyla yüklendi.

📍 [4/8] Rota planlaması test ediliyor ([433,525] -> [491,774])...
  Bulunan Rota Özeti: {"source":"api","km":0.55,"min":21.4,"status":"GO","segs":8,"pts":251}
  ✓ ASSERT GEÇTİ: Rota kaynağı API ("api")
  ✓ ASSERT GEÇTİ: Rota mesafesi aralıkta (0.550 km)

🚶 [5/8] 3B Yürüyüş moduna geçiliyor ve arazi taraması yapılıyor...
  ✓ ASSERT GEÇTİ: Tarama göstergesi (#scanleg) aktif ve görünür

👨‍🚀 [6/8] Astronot modeli ve zemin hizalaması (y=zemin ±0.05m) kontrol ediliyor...
  Astronot Durumu: {"found":true,"visible":true,"astroY":666.13,"groundY":666.13,"diff":0,"absDiff":0}
  ✓ ASSERT GEÇTİ: Astronot modeli sahnede ve görünür
  ✓ ASSERT GEÇTİ: Ayak zemin hizası tolerans içinde (fark: 0 m <= 0.05 m)

🔄 [7/8] Kum algılama noktasına ilerleniyor ve replan/toast kontrol ediliyor...
  Replan Durumu: {"replanned":true,"source":"api","km":0.34,"toastText":"Yeni rota (876 ms): 0.34 km · 13.1 dk · GO — eski kalan 0.34 km (gri). Kum bölgesi kaçınıldı."}
  ✓ ASSERT GEÇTİ: Replan başarıyla gerçekleşti
  ✓ ASSERT GEÇTİ: Replan toast bildirimi mevcut ("Yeni rota (876 ms): 0.34 km · 13.1 dk · GO — eski kalan 0.34...")

⚠️ [8/8] Rotadan 30 metre sapma simüle ediliyor ve sapma uyarısı kontrol ediliyor...
  Sapma Uyarısı Durumu: {"found":true,"hidden":false,"text":"Rotadan saptın (24 m) — R: rotaya dön"}
  ✓ ASSERT GEÇTİ: Rotadan sapma uyarısı başarıyla görüntülendi ("Rotadan saptın (24 m) — R: rotaya dön...")

🛡️ Konsol ve sayfa çalışma zamanı hataları denetleniyor...
  ✓ ASSERT GEÇTİ: Dış ağ kaynaklı olmayan hiçbir JS sayfa hatası yok.

===============================================================
🎉 TEBRİKLER: TÜM E2E REGRESYON TESTLERİ VE ASSERTIONLAR GEÇTİ!
===============================================================
```

---

## 3. Performans Probu (`perf_probe.js`) Kendi Koştuğumuz Çıktı (Yazılım GL / SwiftShader)

Headless Chrome SwiftShader üzerinde çalıştırılan 30 saniyelik tam test senaryosunun (`perf_probe.js`) ürettiği ham JSON raporu:

```json
{
  "meta": {
    "timestamp": "2026-11-14T15:46:21.921Z",
    "durationMs": 31800.9,
    "totalFrames": 27,
    "gridA": [433, 525],
    "gridB": [491, 774]
  },
  "fps": {
    "avg": 0.85,
    "min": 0.33,
    "p50": 0.89,
    "p95": 11.99,
    "p99": 71.94
  },
  "frameTimeMs": {
    "avg": 1165.11,
    "p50": 1118.0,
    "p95": 1937.4,
    "p99": 3006.8,
    "min": 13.9,
    "max": 3006.8
  },
  "render": {
    "callsAvg": 64,
    "callsMax": 72,
    "trianglesAvg": 433369,
    "trianglesMax": 714856
  },
  "terrainStats": {
    "ready": 69,
    "active": 28,
    "loading": 19
  },
  "hardware": {
    "gpuRenderer": "ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero) (0x0000C0DE)), SwiftShader driver)",
    "gpuVendor": "Google Inc. (Google)",
    "canvasResolution": "1280x720",
    "viewportSize": "1280x720",
    "devicePixelRatio": 1,
    "resolutionRatio": 1,
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/157.0.0.0 Safari/537.36",
    "jsHeapUsedMB": 79.9,
    "jsHeapTotalMB": 85.57,
    "jsHeapLimitMB": 4192
  },
  "criteria": {
    "p95TargetMs": 22.0,
    "p95ActualMs": 1937.4,
    "p95Passed": false,
    "avgFpsTarget": 45.0,
    "avgFpsActual": 0.85,
    "avgFpsPassed": false,
    "overallPassed": false
  }
}
```

Modal ekran görüntüsü: `docs/data/ekip/qa/perf_modal.png` dosyasına kaydedilmiştir.

---

## 4. Eşik Değerleri ve Varsayımlar

Brifingde belirtilen hedefler doğrultusunda şu eşikler varsayılmıştır:
1. **Hedef Ortalama FPS >= 45.0 FPS:** 3B simülasyonun akıcı yürüyüş hissi ve görsel takılma yaşanmaması için gereken asgari interaktif FPS kabul edilmiştir.
2. **Hedef Kare Süresi p95 <= 22.0 ms:** 45 FPS bütçesi yaklaşık 22.2 ms'dir (60 FPS için 16.6 ms). Karelerin %95'inin 22 ms altında kalması, mikro takılmaların (stuttering) kabul edilebilir sınırda olduğunu gösterir.

---

## 5. Dürüst Sınırlar ve Bilinen Kısıtlar

1. **Yazılım GL (SwiftShader) Kısıtı:**
   - Bizim geliştirme makinemizde donanımsal harici GPU bulunmadığı için testler CPU tabanlı SwiftShader emülatörüyle koşulmuştur.
   - Bu nedenle ölçülen ortalama FPS 0.85, p95 kare süresi 1937 ms çıkmıştır ve kriter "KALDI" olarak işaretlenmiştir. Bu durum yazılım emülasyonu için tamamen normaldir.
   - Asıl performans doğrulaması, Samet'in harici GPU'ya sahip demo laptopunda `perf_probe.js` konsola yapıştırılarak yapılacaktır.
2. **JS Heap Bellek Desteği:**
   - `performance.memory` standardı Chromium tabanlı motorlara (Chrome, Edge) özgüdür. Firefox veya Safari'de çalıştırıldığında bellek alanı güvenli bir şekilde `null`/atlanır.
3. **Replan Tetikleme Mesafesi:**
   - S1 demo senaryosunda sürpriz kum noktası rotanın 267.87. metresindedir. Algılama sınırı 80 metre geriden (`s >= sand.s - 80`) başladığı için tetikleme 187.87 metredir (~%34 ilerleme). Test betiğinde `setProgress(Math.max(0.35, (R.sand.s - 60) / R.total))` kullanılarak eşik tam olarak tetiklenmiştir.
4. **Çevrimdışı Çalışma & Ağ İzolasyonu:**
   - Test sırasında yerel olmayan tüm dış ağ istekleri (`127.0.0.1` dışı) abort edilmiştir; bu sayede CDN kesintilerinden bağımsız tam çevrimdışı doğrulanabilirlik sağlanmıştır.
