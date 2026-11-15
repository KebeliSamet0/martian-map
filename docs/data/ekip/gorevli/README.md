DURUM: TAMAMLANDI (koşullu; "Açık notlar" bölümüne bak: 8000'deki API sentetik ızgara sunuyor, gerçek-GPU ikinci koşusu bellek yüzünden yapılamadı, GPU perf eşiği bu makinede geçmiyor)

# Martian Map — otomatik kabul testi (`akis_testi.js`)

Tek komutla çalışan uçtan uca test paketi. Elle test yerine; Samet'in laptopunda kabul testi için.
Yazan: gorevli · koşu tarihi: 2026-11-15 · sim kökü: `mm-pr/main-wt` (dal `batu/sim-tiles-secici`, 0b53eb3).
Kaynak kaydı: [`../kaynaklar/gorevli.md`](../kaynaklar/gorevli.md)

## Tek komut

```bash
cd martian-map-main/docs/data/ekip/gorevli
node akis_testi.js
```

Betik sim'i kendisi başlatır (`127.0.0.1:8010`, repo kökünü statik servis eder), API'yi (`127.0.0.1:8000`) kontrol eder, headless Chrome ile 7 test grubunu koşar, `test_sonucu.json` yazar ve özet tablo basar. Çıkış kodu: hepsi PASS ise 0.

İki kez üst üste: `MM_RUNS=2 node akis_testi.js` (ayrı süreçlerde; kararlılık `test_sonucu.json → kararlilik` alanına yazılır).

### Önkoşullar
- Node 18+ ve `playwright-core` (betik şu sırayla arar: `PW_CORE`, `require('playwright-core')`, `<repo>/sim/node_modules/playwright-core`).
- Google Chrome (yol: `CHROME_PATH`; vars. Windows `C:/Program Files/Google/Chrome/Application/chrome.exe`, macOS `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`).
- API çalışıyor olmalı ve **gerçek Gale verisiyle** başlatılmış olmalı (aşağıda "API nasıl başlatılır"). Betik bunu ön koşul olarak denetler.
- Repo kökü: `MM_REPO_ROOT` (vars: `C:/Users/Batu/Desktop/mm-pr/main-wt`, yoksa betiğin üstündeki ilk `sim/index.html` olan klasör). Python gerekmez.

### Ortam değişkenleri
| Değişken | Anlamı |
|---|---|
| `CHROME_PATH` | Chrome yolu |
| `PW_CORE` | playwright-core yolu |
| `REAL_GPU=1` | swiftshader bayraklarını kapatır, gerçek GPU kullanır; `?perf=1` sonucu (ort FPS, p95 ms…) `test_sonucu.json → perf` alanına yazılır ve **eşik assert edilir** (p95 ≤ 22 ms, ort ≥ 45 FPS; probun kendi eşikleri) |
| `HEADED=1` | pencereli Chrome |
| `MM_API` | API tabanı (vars. `http://127.0.0.1:8000`; farklıysa sim'e `?api=` ile iletilir) |
| `MM_PORT` | sim portu (8010) |
| `MM_RUNS=N` | N kez koş, kararlılığı raporla |
| `MM_ONLY=T7` | yalnız seçilen grupları koş (hızlı deneme) |
| `MM_SCENARIOS` | `S1,S2,S3` alt kümesi |
| `MM_SHOTS=0` | ekran görüntüsü alma |
| `MM_RESULT_FILE` | sonuç dosya adı |

### macOS (Samet, M5, Chrome) — NOT: macOS'ta denenmedi
```bash
cd martian-map-main/docs/data/ekip/gorevli
npm i --no-save playwright-core            # ya da PW_CORE=/yol/playwright-core
export CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
export MM_REPO_ROOT="$HOME/martian-map"     # içinde sim/index.html olan klasör
MM_API=http://127.0.0.1:8000 REAL_GPU=1 node akis_testi.js
```
`REAL_GPU=1` olmadan yazılım GL kullanılır ve **bir koşu ~14 dk** sürer; gerçek GPU'da ~2 dk.

### API nasıl başlatılır (gerçek veriyle)
```bash
cd <repo kökü>                      # ör. mm-pr/main-wt
MARTIAN_LAYERS_DIR=<repo kökü> python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```
`MARTIAN_LAYERS_DIR` verilmezse API **sessizce sentetik 250×250 / 8 m ızgara** sunar (`api/planner/layers.py: load()` → `synthetic()`); görev piksel koordinatları (ör. S1 433,525 → 491,774) bu ızgaranın dışında kalır ve görev seçimi "B noktası arazi dışında" hatasıyla başarısız olur. Test bunu `[ON]` bölümünde yakalar (`/grid`: `synthetic=false`, 1000×1000, 2 m).

## Test grupları ve sonuç (2026-11-15)

Yazılım GL (swiftshader), API `127.0.0.1:8011` (8000 ile aynı kod, doğru `MARTIAN_LAYERS_DIR`), **iki ardışık tam koşu: ikisi de PASS, sonuç KARARLI** (`MM_RUNS=2`; 870 sn ve 857 sn). Ayrıntı: `test_sonucu.json` (+ `test_sonucu_kosu1.json`, `test_sonucu_kosu2.json`).

| # | Test | Assert'ler | Sonuç (2 koşu) | Ekran görüntüsü |
|---|---|---|---|---|
| ON | Ön koşullar | API `/assumptions` 200; `/grid` gerçek (synthetic=false, 1000×1000, 2 m); `POST /compare` var (404 değil); sim sunucusu | PASS 4/4 | — |
| T1 | S1, S2, S3 tam akış | her senaryoda: brifing açılır · 3 rota kartı · 3 rota `source=api*` · en güvenli seçilir (`kind=safest`) · 3B yürüyüş (total>0, durum=walking) · kum olayı · replan · hedefte durur (`paused`) · karne açılır · karne içeriği boş değil | PASS 30/30 | [S1 brifing](shots/S1_1_brifing.png) · [S1 rotalar](shots/S1_2_rotalar.png) · [S1 yürüyüş](shots/S1_3_yuruyus.png) · [S2 brifing](shots/S2_1_brifing.png) · [S2 rotalar](shots/S2_2_rotalar.png) · [S2 yürüyüş](shots/S2_3_yuruyus.png) · [S3 brifing](shots/S3_1_brifing.png) · [S3 rotalar](shots/S3_2_rotalar.png) · [S3 yürüyüş](shots/S3_3_yuruyus.png) |
| T2 | L taraması | `#scanleg` görünür; metinde "Dikkat" ve "Geçilmez" | PASS 3/3 | [scan_lines](shots/scan_lines.png) |
| T3 | Kum olayı `radius_m+40` m | olay mission machine'den gelir; `trigger_m == radius_m+40`; oyuncu eşikten −8…+2 m içinde, kum dairesine girmeden | PASS 9/9 (S1 58,9 m / eşik 59,4; S2 59,9 / 60; S3 57,9 / 59,4) | [S1](shots/T3_kum_olayi_S1.png) · [S2](shots/T3_kum_olayi_S2.png) · [S3](shots/T3_kum_olayi_S3.png) · [replan S1](shots/S1_4_kum_replan.png) |
| T4 | `mission:arrived` window olayı | her senaryoda olay en az 1 kez gelir (`detail.state="debrief"`) | PASS 3/3 | [S1 karne](shots/S1_5_karne.png) · [S2](shots/S2_5_karne.png) · [S3](shots/S3_5_karne.png) |
| T5 | HUD satırları | `#hud` metninde "Zemin (model)" ve "Gale ortam (REMS)" | PASS 2/2 | [hud](shots/hud.png) |
| T6 | Konsolda hata yok | tüm sayfalarda `error`/`pageerror` = 0. Hariç tutma kuralı vardı (`ERR_FAILED` ve `tiles_fixed` 404), son koşularda **hiçbir kayıt hariç tutulmadı** | PASS 1/1 | [T6 konsol](shots/T6_konsol.png) |
| T7 | `?perf=1` probu | prob açılır; 30 sn senaryo bitip rapor penceresi açılır; `[PerfProbe HATA]` yok; rapor okunur (ort FPS, p95 ms) | PASS 4/4 (yazılım GL: ort 0,82 FPS, p95 ≈ 2000 ms — **GPU performansı değildir**) | [perf](shots/perf.png) |

### Gerçek GPU (`REAL_GPU=1`) — tek koşu, AMD Radeon(TM) Graphics (iGPU, D3D11)
`test_sonucu_real_gpu_tek_kosu.json`: tüm testler PASS, süre **132 sn**; yalnız T7'nin GPU eşiği **FAIL**: ort **41,49 FPS** (hedef ≥ 45), p95 **27,9 ms** (hedef ≤ 22), 1000×600. Bu gerçek bir ölçümdür ve eşik, probun kendi varsayım eşiğidir (`perf_probe.js: THRESHOLDS`). Samet'in M5'inde sonuç farklı olabilir; kendi makinesinde `REAL_GPU=1` ile koşmalı. Bu koşu için ekran görüntüsü alınmadı (`MM_SHOTS=0`).

## Kök neden notları (test hatası / uygulama hatası)
| Bulgu | Tür | Kanıt / çözüm |
|---|---|---|
| Görev düğmeleri yalnız `?dev=1`'de görünür (`body:not(.dev) #mapwrap {display:none}`), eski betikler bunu bilmiyordu | test hatası | test `?dev=1` ile açılır |
| Brifing düğmesi artık "Rotaları hesapla" (`data-testid="briefing-start"`), "Başla" değil | test hatası | seçici `data-testid` oldu |
| `python -m http.server` yazılım GL'de paralel karo isteklerinde `ERR_CONNECTION_REFUSED` verdi | test altyapısı | betik içi Node statik sunucu (backlog 1024); `MM_PYTHON=1` ile python'a dönülür |
| T3 S3 ilk koşuda mesafe 9,2 m (eşik 59,4) | **test hatası** | ölçüm "olayı fark ettiğin an"dı: betik oyuncuyu kare beklemeden 5 m'lik adımlarla atlatıyordu, yazılım GL ~1 FPS olduğu için olay raporlanana kadar 20–50 m ilerlemişti. Çözüm: eşiğe yakınken 3 m adım + her adımda 2 kare bekleme, alt sınır assert'i |
| T6 ilk koşuda `/compare` 404 | **uygulama değil, ortam** | 8000'deki API eski sürümdü (`/compare` yok); güncel `main` API'sinde var |
| Yeniden başlatılan 8000 API'sinde S1–S3 "arazi dışında" | **ortam/konfigürasyon hatası** | API `MARTIAN_LAYERS_DIR` olmadan başlatılmış → `/grid` `synthetic=true, 250×250, 8 m` |

## Açık notlar (dürüst sınırlar)
1. **8000'deki API hâlâ sentetik ızgara sunuyor** (09:08'de yeniden başlatıldığında `MARTIAN_LAYERS_DIR` verilmemiş). Ben o süreci değiştirmedim; testleri aynı kodla, doğru ortamla açtığım `127.0.0.1:8011` API'sine karşı `MM_API` ile koştum. Sunumdan önce 8000 API'si yukarıdaki komutla yeniden başlatılmalı; ardından `node akis_testi.js` (varsayılan API) bir kez daha koşulmalı. Ön koşul kontrolü bunu otomatik yakalar.
2. Gerçek-GPU modu için **ikinci (ardışık) koşu yapılamadı**: sistem belleği kritik düştüğü için arka plan görevi durduruldu; bu yüzden gerçek-GPU kararlılığı ölçülmedi (yalnız tek koşu var). Tekrar başlatmadım.
3. Testler **geliştirici arayüzünü** (`?dev=1`: görev düğmeleri, 2B harita paneli) sürer. Oyun akışının açılış/intro ekranları ve normal (dev olmayan) oyun girişi bu pakette **kapsanmıyor**.
4. macOS ve Samet'in laptopu denenmedi; yalnız Windows 11 + Chrome 157 + yazılım GL ve AMD iGPU üzerinde koşuldu.
5. Yazılım GL koşusunda perf değerleri anlamsızdır (~0,8 FPS); T7 yalnız probun açılıp bitmesini ve hatasız olmasını doğrular. Gerçek perf kararı için `REAL_GPU=1`.
6. 3B yürüyüş rota konumunu doğrudan ilerleterek (`routeRun.s`) sürülür; gerçek klavye/fare yürüyüşü test edilmez. Kum olayı tetik mesafesi bu yüzden "kare başına" ölçümle ±3 m adım hassasiyetindedir.
7. Mars/Dünya değerleri: pakette sol süresi, yerçekimi (g=3,71), doz, hız veya süre BİRİMİ için sayısal beklenti **yoktur**. Betikteki süreler duvar saatidir (bekleme/zaman aşımı). Sim'in gösterdiği süre/enerji değerleri ("18 dk", "87 kcal"…) yalnız log'a düşer, assert edilmez.

## Sorun giderme
- **`[ON] /grid synthetic` FAIL** → API `MARTIAN_LAYERS_DIR` olmadan çalışıyor; yukarıdaki "API nasıl başlatılır".
- **`[ON] /compare` FAIL** → API eski sürüm; güncel `main`'den yeniden başlat.
- **API hiç yok (`/assumptions` 000)** → API'yi başlat; farklı port kullanıyorsan `MM_API=http://127.0.0.1:PORT`.
- **Port 8010 dolu** → betik 8010'da zaten sim varsa onu yeniden kullanır; başka program tutuyorsa `MM_PORT=8020`.
- **Chrome bulunamadı** → `CHROME_PATH=...` ver.
- **`Cannot find module 'playwright-core'`** → `PW_CORE=/yol/playwright-core` ya da `npm i --no-save playwright-core`.
- **T1'de "page.click: Timeout"** → görev düğmeleri görünmüyordur: sim `?dev=1` olmadan açılmıştır ya da API yanlış ızgara sunuyordur (bkz. ilk madde).
- **Yazılım GL yavaş/zaman aşımı** → normal; koşu ~14 dk. `MM_ONLY=T2,T5` ile parça parça koş.
- **Bellek azsa** → aynı anda başka ağır uygulama açma; yazılım GL koşusu birkaç Chrome süreci tutar.

## Dosyalar
| Dosya | İçerik |
|---|---|
| `akis_testi.js` | test paketi |
| `test_sonucu.json` | `MM_RUNS=2` yazılım GL koşusunun nihai sonucu (+ `kararlilik`, `ekran_goruntuleri`, `ortam`, `perf`) |
| `test_sonucu_kosu1.json`, `test_sonucu_kosu2.json` | tek tek koşular |
| `test_sonucu_real_gpu_tek_kosu.json` | `REAL_GPU=1` tek koşu (T7 eşik FAIL, diğerleri PASS) |
| `shots/` | ekran görüntüleri (yukarıdaki tablodan bağlantılı) |
