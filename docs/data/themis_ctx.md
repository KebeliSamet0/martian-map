# Veri analizi: THEMIS termal atalet + CTX/MOLA bağlam

Analizi yapan: Batu · Tarih: 2026-11-14 (Cmt) · Durum: **GÜNCELLENDİ (2026-11-14) — THEMIS TI tile'ı HTTP aralık okumasıyla açıldı ve ölçüldü (§8). Kalan "doğrulanmadı" satırlar yalnız literatür/çıkarım.**

## 1. Ne
- Ürün adı ve sürümü: THEMIS termal atalet mozaiği, 100 m/piksel (USGS Astrogeology: "THEMIS Thermal Inertia Mosaic Qualitative/Quantitative … 100 mpp"; gece IR görüntülerinden üretilmiş). Bağlam: CTX global mozaik (Murray Lab V01, 5 m/px) ve MOLA.
- Kaynak linki:
  - USGS THEMIS TI (qualitative, 30N300E örneği): https://astrogeology.usgs.gov/search/map/themis_thermal_inertia_mosaic_qualitative_30n300e_100_mpp
  - USGS THEMIS TI (quantitative, 30S060E örneği): https://astrogeology.usgs.gov/search/map/themis_thermal_inertia_mosaic_quantitative_30s060e_100mpp
  - ASU Mars global veri: https://www.mars.asu.edu/data
  - CTX: https://murray-lab.caltech.edu/CTX/ (tile'lar: https://murray-lab.caltech.edu/CTX/V01/tiles/) · USGS kaydı: https://astrogeology.usgs.gov/search/map/mars-mro-ctx-global-mosaic-murray-lab-v1
- Lisans / kullanım şartı: NASA verisi, serbest. CTX için atıf istenir: "NASA/JPL/MSSS/The Murray Lab" + Dickson vd. makalesi. (`docs/REFERENCES.md`'ye eklenecek.)

## 2. Erişim
- Nasıl indirildi: **İndirilmedi.** Plan: USGS Astrogeology sayfasından Gale'i içeren tile. Gale ≈ 5°S, 137°E olduğundan **30S–0, 120E–180E** tile'ı beklenir; USGS'de bu bölge için tile adı **doğrulanmadı** (kuzey/güney tile kodlaması sayfada kontrol edilmeli).
- Boyut: tile boyutu bilinmiyor; bizim kesit çok küçük (birkaç km² ≈ onlarca piksel genişlik).
- Format: ISIS3, GeoTIFF ve PNG olarak sunuluyor (arama sonucu). Quantitative sürüm gerçek TI değeri taşır; qualitative sürüm yalnız görsel kontrast için, **ölçüm için kullanılmaz** (doğrulanmadı, adından çıkarım).
- Projeksiyon: bilinmiyor (tile 30°×60°; büyük olasılıkla equirectangular, indirince `gdalinfo` ile bak).
- Çözünürlük: 100 m/piksel. TI birimi **TIU = J m⁻² K⁻¹ s⁻½**.

## 3. Kapsama
- Bölgemizi kapsıyor mu? **Muhtemelen Evet** (THEMIS ±60° enlem; Gale 5°S) — indirilmeden doğrulanmadı.
- Koordinat aralığı: tile 30S–0 / 120E–180E varsayımı (doğrulanmadı).
- Zaman aralığı: bilinmiyor (gece IR'den türetilmiş çok görüntülü mozaik).

## 4. İçerik
- Değişkenler: termal atalet (quantitative) veya kontrast görüntü (qualitative).
- İstatistik: **bilinmiyor** (indirme sonrası). Mutlak doğruluk ~%20 (kaynak: arama özeti).
- Gale için literatür aralıkları (yalnız yön göstermek için, bizim ölçümümüz değil):
  - Slezak/Fergason çizgisi: iniş bölgesinde çoğunluk orta TI, **250–410 TIU**, muhtemelen sertleşmiş yüzey.
  - Curiosity yer ölçümü (REMS): ana kaya baskın yüzeyler 350–550 TIU; izole ana kaya 700 (kumtaşı) – 1000–1900 (çamurtaşı). Hummocky Plains'te kumla örtülü zeminde ~370 (sol ~500'e kadar en düşük).
  - Yani ham THEMIS TI'da kum ile kaya ayrımı **keskin değil**; 100 m piksel karışım verir.
- Boxwork bölgesinde değer aralığı: **bilinmiyor.** Boxwork'ün tam konumu bu raporda doğrulanmadı; yükseltideki kaya/kum karışımı için 100 m'de kesin ayrım beklenmemeli.
- Örnek görsel: henüz yok (`docs/data/img/` boş). İndirince TI tile'ından Gale kesiti PNG olarak eklenecek.

## 5. Kalite ve sorunlar
- 100 m piksel, rota segmenti (~300 m) için kaba. Tek piksel birkaç metrelik kum/kaya yamasını ayırt edemez.
- TI yüzeyin üst ~onlarca cm'sini yansıtır (kum için skin depth ~70 cm, toz ~20 cm); ince kum örtüsü altındaki kayayı gizleyebilir.
- Mutlak hata ~%20; modelde mutlak değer yerine **göreli sınıf** (düşük/orta/yüksek) kullanmak daha güvenli.
- CTX: mozaik dikişleri/ışık farkı olabilir; yalnız bağlam için.

## 6. Bizim için kullanımı
- Termal katmanı besler (`layers/` termal, `rock`/`sand` olasılığına zayıf ön bilgi). AI4Mars/Navcam zemin sınıfının yerine değil, **yörünge ölçeğinde destek** olarak.
- CTX/MOLA bağlam haritası:
  - **CTX (5 m): evet, uygun.** Bölge dışını gösteren arka plan için pratik; yalnız ilgili tile indirilir, tam mozaik indirilmez (yavaş/ağır). Tiff'ler sıkıştırılmamış, büyük olabilir → PNG'ye küçült.
  - **MOLA: bilinmiyor.** Bu taramada MOLA ürün adı/çözünürlüğü doğrulanmadı (PDS Geosciences / Mars Trek'ten bakılmalı). Yaklaşık ~463 m/px (bilgi, doğrulanmadı) — HiRISE DTM'nin dış bağlamı için yeterli.
- 3D için (**hesaplama, ölçüm değil**): 2×2 km, DTM 1 m/px → 2000×2000 Float32 = 16 MB ham; 512×512'ye indirgenirse ~1 MB. Ortofoto 0,25 m/px olsaydı 8000×8000 olur (ham ≥64 MB gri); doku için 2048×2048 PNG/JPEG (birkaç MB) yeterli. Three.js'te Float32 binary (`fetch` → `Float32Array`) + doku **pratik**. 50 MB üstü commit kuralı: yalnız küçültülmüş çıktılar repoya girer.
- Tahmini işleme süresi: tile indirme + kesme + PNG: ~30–60 dk (bilinmiyor, Colab/yerel).

## 7. Karar
**B PLANI** (geçici) — THEMIS TI 100 m kaba ve ana kaya/kum ayrımı zayıf olduğu için tek başına rota kararı vermemeli; yalnız zayıf termal ön bilgi katmanı olarak kullan. CTX bağlam için **KULLAN**. Tile'ı indirip Gale ve boxwork kesitinde gerçek değerleri görene kadar nihai karar verilemez; Cmt 12:00 öncesi kalan iş: tile indirme, `gdalinfo`, istatistik, 1–2 PNG.

## Açık kalanlar
- [x] Doğru THEMIS TI tile'ı ve projeksiyon (§8)
- [x] Boxwork konumunda TI min/maks/ortalama (§8, 3×3 piksel)
- [ ] MOLA ürünü ve çözünürlüğü
- [x] themis_ti_gale_30km.png; [ ] ctx PNG yok

## 8. ÖLÇÜM (2026-11-14, `rasterio` + `/vsicurl`, tam dosya indirilmedi)
- Tile: `THEMIS_TI_Mosaic_Quant_30S120E_100mpp.cub` (USGS Astropedia, S3 `asc-astropedia`), ISIS3, 35565×17782 px, **float32**, NoData −3.4028e38, ~2,5 GB. Projeksiyon: Simple Cylindrical (Equirectangular) Mars, R=3396190 m, piksel 100 m. Kapsam x 7 112 900…10 669 400 m, y −1 778 200…0 (yani 30°S–0°, 120–180°D); Gale bu tile'da. (Sayfa doğrulaması: HEAD + `rasterio` meta; "Quantitative" = gerçek TIU.)
- Birim: TIU (J m⁻² K⁻¹ s⁻½) — USGS sayfası ve literatür; dosya içi birim alanı ayrıca okunmadı.
- Boxwork waypoint'i (MMGIS: sol 4534 −4.7976°, 137.3864°; sol 4671 −4.8083°, 137.3813°), 3×3 piksel (300 m): **388.6–442.8 TIU (ort. 415.4)** ve **387.0–420.3 (ort. 399.9)**. Tek piksel; boxwork ~5 m çıkıntı/10–20 m poligon ölçeği 100 m pikselin çok altında.
- Sim alanı (137.327–137.439°D, −4.875…−4.729°; 87×66 piksel, 5742 geçerli): min 244.8, maks 681.6, ort. 383.9, std 69.3; yüzdelikler p5/25/50/75/95 = 289/331/379/421/507 TIU.
- Gale çevresi 30×30 km (300×300): min 126, maks 789, ort. 359, p5/p50/p95 = 214/355/539 TIU. Görsel: `docs/data/img/themis_ti_gale_30km.png`.
- **Yorum (çıkarım, ölçüm değil):** boxwork'te ~400 TIU, literatürdeki "ana kaya baskın yüzey 350–550" aralığında; düşük (<~250, ince kum/toz) ve yüksek (>~600, çıplak ana kaya) uçlar sim alanında var ama çok az piksel. Kum/kaya ayrımı 100 m'de görünür bir kontrast veriyor ama piksel karışımı, kesin sınıflama için YETMEZ. Mutlak doğruluk ~%20 (literatür).
- Tekrar üretme: `sim/data/_work/themis_stats.py` (yerel, git dışı).

### MOLA ve CTX (ölçüldü, 2026-11-14)
- **MOLA:** `Mars_MGS_MOLA_DEM_mosaic_global_463m.tif` (USGS, planetarymaps.usgs.gov, 2,1 GB, indirildi; git dışı). GeoTIFF int16, 46080×23040, 463,09 m/px, NoData −32768, Equirectangular Mars R=3396190. Gale 30×30 km pencere (65×65 px): −4600…−599 m, ort. −3453 (Mount Sharp yamacı dahil). Sim alanı yalnız 19×14 piksel: −4342…−2885 m, ort. −3703; boxwork pikseli −3660 m. HiRISE DTM aynı alanda −4271…−2794 m (manifest). Yani MOLA genel yüksekliği veriyor ama sim alanı ~14×19 piksele iner: **yalnız bölge dışı bağlam** için uygun, arazi/rota için değil (463 m vs ~1 m).
- **CTX:** Kullandığımız servis `astro.arcgis.com/.../OnMars/CTX` — açıklamasına göre Murray Lab **beta01** (ön, kontrolsüz mozaik), "V01" DEĞİL (önceki satır düzeltildi). Kaynak: NASA/JPL/MSSS/Caltech Murray Lab/Esri. Ölçek: z11 = 10,18 m/px, z12 = 5,09 m/px (yerli çözünürlük ~5 m; z13+ yeniden örnekleme olabilir, doğrulanmadı). Örnek: `docs/data/img/ctx_gale_z11.png` (2×2 döşeme, ~10,4 km). Bağlam haritası için uygun, doğrulandı.
- **Float32 + ortofoto doku (ölçüm):** tam alan 6574×8583 Float32 ≈ 226 MB, uint16 ≈ 113 MB. Kullandığımız döşemeli çıktı: yükseklik 129 MB + doku 221 MB + `nav.u16` 7 MB (8 LOD seviyesi, git dışı). Düz Float32+tek doku 2×2 km için pratikti; tüm alan için döşemeli uint16 daha iyi.
- Not: Windows'ta `planetarymaps`/`astro.arcgis.com` için SSL iptal denetimi çevrimdışıydı; `curl --ssl-no-revoke` (yalnız iptal denetimi atlanır, zincir doğrulanır) kullanıldı.
