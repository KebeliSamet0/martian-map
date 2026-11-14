# sim/ — Mars yüzey provası (harita → iki nokta → en kısa yol → birinci şahıs yürüyüş)

Gale Krateri / Mount Sharp KB'da **~6,6 × 8,6 km** (≈57 km²) gerçek NASA/USGS verisi üzerinde çalışır:
HiRISE DTM (1 m yükseklik) + HiRISE renkli ortofoto (0,25 m kaynak). Yer tutucu veya sentetik arazi yoktur.

## Çalıştırma
```
# 1) Veri (bir kez; ~10 dk, ağ gerekir; tekrar çalıştırılabilir)
python -I sim/tools/build_tiles.py            # rasterio, numpy, pillow gerekir
# 2) Sunucu (repo kökünden, önbelleksiz)
python sim/tools/devserver.py                 # → http://localhost:8000/sim/
```
Tarayıcı: güncel Chrome/Edge (WebGL2). Three.js ve Leaflet CDN'den yüklenir. Kalite: `?q=low|med|high`.

## Kullanım
1. Haritada sarı çerçevenin içine tıkla → **A**, tekrar tıkla → **B**. Rota hesaplanır (işaretler sürüklenebilir).
2. **Rota ölçütü**: en kısa mesafe veya dengeli (Tobler yürüme hızına göre en kısa süre). **Azami eğim** ayarlanır.
3. **3B yürüyüş**: rota boyunca astronot gözü. `W A S D` yürü, `Shift` koş, fare bak (tıkla), `R` rotaya dön, `[` `]` hız, `F` uçuş,
   `K` sentetik taş, `H` HUD, `M` harita. Sağ altta güneş yüksekliği/yönü ve pozlama.
4. **route.json indir**: `contracts/route.example.json` biçiminde (zemin/kalori/radyasyon alanları `null`).

## Veri sadakati
- **Saf veri modu** (`V` veya panelden): sentetik taş, çakıl/regolit ayrıntısı, dik yamaç (≥35°) prosedürel dokusu ve baş sallaması kapanır; yalnız HiRISE DTM + ortofoto + aydınlatma kalır. HUD'da "SAF VERİ" yazar.
- Normal modda ≥35° yamaçta HUD "doku kısmen PROSEDÜREL" uyarısı verir.
- A/B noktası DTM NoData boşluğundaysa en yakın geçerli hücreye kaydırılır (en çok ~230 m); işaret yeni yere gider, panelde ve `route.json` (`_meta.snapped_to_valid_dtm_m`) kaymanın miktarı yazılır.

## Görüntü kararlılığı (FPS, titreme, sıçrama)
- **Dinamik çözünürlük:** kare süresi ~26 ms üstünde kalırsa çözünürlük (×1.25 → ×0.5) otomatik düşer, boşta geri artar; HUD'da `çözünürlük ×…` ve gerçek FPS görünür. `?fixedres=1` kapatır.
- **Zemin ayrıntısı** her piksel için hesaplanmaz: bir kez üretilen döşenebilir, mipmap'li detay dokusu örneklenir (anti-aliasing kendiliğinden).
- **LOD histerezisi:** bir döşeme bölündükten sonra eşiğin %30 ötesinde birleşir; yakın/uzak sınırında gidip gelme olmaz.
- **Mesh üretimi kare bütçeli** (≈4 ms): yeni döşeme yüklenirken takılma (hitch) azaltılır.
- **Gölge haritası** ışık uzayında texel'e yakalanır (yürürken gölge titremez); yükseklik ve bakış yumuşatılır; baş sallanması varsayılan kapalı (`B`).
- Kalite: `?q=low` (gölgesiz, ×1), `?q=high` (varsayılan, gölge 2048), `?q=ultra` (gölge 4096).
- Ölçüm: yazılım render'ında (GPU'suz) ölçülen kamera yüksekliği sıçraması 0, bakış sıçraması 0. **Gerçek GPU'da FPS ölçülmedi.**

## Mimari
| Parça | Dosya | Ne yapar |
|---|---|---|
| Veri hattı | `tools/build_tiles.py` | DTM ve renkli mozaik COG'larından yalnız gereken bloklarla LOD'lu döşeme piramidi üretir (`data/tiles/`, git dışı) |
| Arazi | `app/terrain.js`, `app/detail.js` | Quadtree LOD; 129×129 köşe + doku/döşeme (L0 512 px); kenar etekleri; detay dokusu gölgelendiricisi |
| Atmosfer | `app/sky.js` | Mars gökyüzü, güneş halosu, toz sisi, güneş ayarı |
| Yol | `app/nav.js` | 4 m ızgarada A* (16 komşu), doğrudan-görüş sadeleştirme, eğim sınırı doğrulaması, segmentleme |
| Harita | `app/mapview.js` | Leaflet (enlem/boylam); Trek HiRISE, CTX, Viking, eğim ve renkli genel bakış katmanları |
| Uygulama | `app/main.js` | Durum, girdi, HUD, mini harita |

Dünya çerçevesi: X doğu, Y yukarı (areoid yükseklik − en düşük), Z güney; başlangıç alanın KB köşesi. Mars küresi R=3396190 m,
doğu-batı ölçeği cos(lat₀) ile düzeltilir.

## Kaynaklar ve atıf (`docs/REFERENCES.md`'ye eklenecek)
- DTM: **DTEEC_019698_1750_019988_1750_U01**, HiRISE / University of Arizona, USGS COG (astrogeo-ard, S3).
- Renk: **MSL_Gale_HiRISE-LRGB_78quads_sharp_cog**, USGS Astrogeology (asc-pds-services, S3).
- Harita katmanları: NASA Mars Trek `curiosity_hirise_mosaic`, `Mars_Viking_MDIM21_ClrMosaic_global_232m`; CTX (NASA/JPL/MSSS/Caltech Murray Lab, USGS OnMars).
- Kredi: NASA/JPL/University of Arizona (HiRISE).

## Sınırlar (dürüst)
- Kapsama yalnız DTM ile renkli mozaiğin kesişimi (yukarıdaki alan); boxwork noktasının içinde olduğu **doğrulanmadı**.
- DTM bir yükseklik alanıdır: sarkıt/mağara/kaya yan yüzü yoktur. 1 m ızgara, 10–50 cm taşları çözemez. Yakın plandaki taşlar ve ince
  ayrıntı **sentetiktir** (arayüzde etiketli, `K` ile kapanır) — NASA verisi değildir.
- Eğim 4 m ızgarada/6 m tabanda ölçülür; gerçek ayak basışı eğimi değildir.
- **Zemin sınıfı (AI4Mars), model güveni, kalori (Pandolf), radyasyon, GO/NO-GO planlayıcıdan gelecek**; burada üretilmez, `route.json`'da `null`.
- Süre Tobler yürüme fonksiyonundan (Dünya'da yürüyüş için); Mars'ta skafandrlı yürüme için doğrulanmış model değildir.
- Güneş yönü/yüksekliği ve gökyüzü rengi görsel yaklaşımdır; ortofotodaki gölgeler çekim anının güneşidir ve ışıkla çelişebilir.
- Gerçek rover panoramaları (Curiosity Mastcam/Navcam) henüz bağlı değil.

## Planlayıcı API ile çalıştırma (Sprint 2, issue #49)
Rotanın tek kaynağı planlayıcı API'sidir (`POST /route`, `POST /replan`); `sim/app/api.js` bunu kullanır. API yoksa ya da A/B API bölgesi (`contracts/grid.json`, 2×2 km, haritada cyan kutu) dışındaysa yerel A* yedeği çalışır ve arayüzde **"YEDEK"** diye etiketlenir (`?api=off` ile zorla yedek).
```sh
# API (repo kökünden):  MARTIAN_LAYERS_DIR=$PWD uvicorn api.main:app --port 8000
# sim (devserver 8001):  python sim/tools/devserver.py 8001      →  http://127.0.0.1:8001/sim/
# başka API adresi:      http://127.0.0.1:8001/sim/?api=http://HOST:8000
```
Akış: haritada A ve B (cyan kutunun içi) → rota API'den gelir → **3B yürüyüş** → rotanın ~%45'ine 80 m kala "kum algılandı" → `POST /replan` → yeni rota çizilir (eski rota gri), kırmızı disk kum bölgesidir. Üç.js ve Leaflet `sim/lib/` altında yereldir (internetsiz çalışır; yalnız Trek/CTX taban haritaları çevrimiçidir, yerel renkli HiRISE katmanı çevrimdışı da görünür).
Koordinat: ızgara px = [sütun, satır], hücre merkezi = idx+0.5; x = ox + px·2, y = oy − px·2 (eqc, R=3396190) → enlem/boylam → sim dünya (`Geo`). Sabitler `contracts/grid.json`'dan kopyadır (`api.js`).

## Karoların demo cihazına getirilmesi (sim/data/tiles; git dışı)
Üç yol (en hızlısı USB):
1. **USB/zip (önerilen, internetsiz):** `sim-tiles.zip` (277 MB, 7271 dosya, içinde `tiles/` klasörü) → `sim/data/` altına aç; sonuç `sim/data/tiles/manifest.json`. Doğrulama: `python -c "import json;print(json.load(open('sim/data/tiles/manifest.json'))['W'])"` → 6574.
2. **Yeniden üret (internet + rasterio/numpy/pillow gerekir):** `python -I sim/tools/build_tiles.py` — girdiler USGS'de COG olarak (yalnız gereken bloklar HTTP aralık okumasıyla alınır, tam dosya inmez): HiRISE DTM `DTEEC_019698_1750_019988_1750_U01` ve `MSL_Gale_HiRISE-LRGB_78quads_sharp_cog` (URL'ler `manifest.json > sources`). Çıktı ≈356 MB (yükseklik 129 MB, doku 221 MB, nav 7 MB). Süre: bu makinede ölçülü bir kayıt tutulmadı (ağ hızına bağlı; var olan dosyalar atlandığı için yarıda kesilirse devam eder).
3. Karo yokken sim açılır ama 3B arazi görünmez; harita ve rota (API) yine çalışır.

Bölge uyumu: API ızgarası (`contracts/grid.json`, 2×2 km) sim alanının (6,6×8,7 km) tam içinde; ızgaranın 4 köşesi ve 4 bilim durağı sim yükseklik verisinde geçerli (NoData yok). **Bilinen fark:** planlayıcı DEM'i (USGS merged DEM v3, 2×2 ortalama) ile sim DTM'i (HiRISE T3) aynı px'te eşdeğer değil: ort. +7,2 m, RMSE 9,7 m; ampirik eşleme ≈ +30,7 m doğu / +33,5 m güney kayma ve −15,1 m düşey (RMSE 1,2 m). Sim rotanın X/Z'sini sözleşmeden, Y'sini kendi yüzeyinden alır; kayma **uygulanmadı** (bkz. #49 yorumu).

## Performans ölçümü ve regresyon testi (QA)
- **Gerçek GPU'da FPS (demo laptopu):** `http://127.0.0.1:8001/sim/?perf=1` aç → 30 sn senaryo otomatik koşar (A/B seç, 3B yürüyüş, 10. sn tarama, 20. sn geniş tarama), sonuç tablosu + "JSON indir". Hedef (varsayım): p95 ≤ 22 ms, ort ≥ 45 FPS. Yazılım GL'de (~1 FPS) "kaldı" çıkması beklenir.
- **Regresyon:** `node sim/tools/qa/e2e_regression.js` (API :8000 ve sim :8001 çalışırken; `playwright-core` gerekir). 8 assert: rota kaynağı=api, replan, astronot zeminde, sapma uyarısı, tarama, sayfa hatası yok.
- **Gerçekçi zemin (isteğe bağlı):** `?terrain=pbr` veya panelden "Gerçekçi zemin" (CC0 Poly Haven; Dünya malzemesi). Varsayılan kapalı.
