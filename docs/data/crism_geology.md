# Veri analizi: MRO CRISM Mineral Haritaları ve Gale Krateri / Mount Sharp Jeoloji Haritaları

Analizi yapan: Elif Nisa Gökdoğan · Tarih: 14 Kasım 2026, 11:18

## 1. Ne
- **Ürün adı ve sürümü:**
  1. **MRO CRISM MTRDR (Map-Projected Targeted Reduced Data Records) & Summary Parameter Ürünleri** (Sürüm 3 — kil, sülfat ve hematit spektral indeks haritaları; örnek gözlemler: `FRT0000B6F1`, `FRT000095FE`, `FRT00018E1D`).
  2. **Gale Krateri / Mount Sharp Yerel Jeoloji ve Stratigrafi Haritaları** (MSL Bilim Ekibi & orbital jeolojik haritalar: Grotzinger et al., 2015; Siebach & Grotzinger, 2014; Le Deit et al., 2013) ve karşılaştırma için **USGS Küresel Mars Jeoloji Haritası** (SIM 3292, Tanaka et al., 2014).
- **Kaynak linki:**
  - NASA PDS Geosciences Node (CRISM Arşivi): https://pds-geosciences.wustl.edu/missions/mro/crism.htm
  - NASA PDS Orbital Data Explorer (ODE — Mars): https://ode.rsl.wustl.edu/mars/
  - USGS Küresel Jeoloji Haritası (SIM 3292): https://pubs.usgs.gov/sim/3292/
- **Lisans / kullanım şartı:** Kamu Malı (Public Domain — NASA / USGS açık bilimsel veri politikası; kaynak gösterimi zorunlu).

## 2. Erişim
- **Nasıl indirildi (URL, komut, API çağrısı):** NASA PDS ODE web arayüzü / REST API üzerinden Gale Krateri koordinat sorgusu (`5.4°S, 137.8°E`) ile MTRDR özet parametre ürünleri ve browse PNG'leri incelendi; yerel makinede henüz toplu ham veri indirilmedi.
- **Boyut (tamamı / bizim kesitimiz):** Tam tek bir CRISM FRT MTRDR küpü ~500 MB – 1.5 GB; özet parametre GeoTIFF/PNG kesiti ~5–25 MB; repo içindeki `Resources` küresel USGS dosyasının tam bayt boyutu: `bilinmiyor`.
- **Format (GeoTIFF, IMG, PNG, JSON, CSV…):** PDS `.IMG` + `.LBL`, GeoTIFF (`.tif`), önizleme için `.PNG`; jeoloji haritaları için Shapefile / GeoPackage / GeoTIFF.
- **Projeksiyon / koordinat sistemi:** Mars 2000 IAU Sphere — Equirectangular (Planetocentric Enlem, Doğu Boylamı `0°–360°`).
- **Çözünürlük (m/piksel ya da görüntü boyutu):**
  - CRISM FRT MTRDR: **~18 m/piksel** (HRL modunda ~36 m/piksel).
  - USGS Küresel Jeoloji Haritası (`Resources`): **1:20.000.000 ölçek** (~5–10 km/piksel etkin haritalama çözünürlüğü).

## 3. Kapsama
- **Bölgemizi (Gale / Mount Sharp, boxwork bölgesi) kapsıyor mu?** **Evet** (CRISM MTRDR hedefli gözlemleri ve MSL yerel stratigrafi haritaları hem alt Mount Sharp'ı hem de boxwork bölgesini doğrudan kapsar; küresel USGS haritası ise yalnızca makro krater ölçeğinde kapsar).
- **Kapsanan koordinat aralığı:** `4.5°S – 6.0°S` enlem, `137.0°E – 138.5°E` boylam (Odak ROI — Alt Mount Sharp & Boxwork: `5.30°S – 5.45°S`, `137.75°E – 137.90°E`).
- **Zaman aralığı (varsa):** MRO CRISM gözlemleri 2006–2022 arası çoklu yörünge geçişleri; MSL Curiosity yüzey doğrulaması 2012–günümüz.

## 4. İçerik
- **Değişkenler / sınıflar / bantlar:**
  - **CRISM Özet Parametreleri (Viviano et al., 2014):**
    - *Kil (Phyllosilicates — Fe/Mg-smektit):* `D2300`, `BD2210_2`, `BD1900_2`
    - *Sülfat (Hydrated Sulfates — mono/polihidratlı):* `SINDEX2`, `BD2100_2`, `BD1900R2`
    - *Hematit (Crystalline Ferric Oxide):* `BD860_2`, `BD530_2`, `R770`
  - **Jeoloji Birimleri & Boxwork Konumu:**
    - Gale Krateri tabanı ve alt Mount Sharp; **Bradbury Grubu**, **Mount Sharp Grubu** (*Murray formasyonu*, *Carolyn Shoemaker formasyonu*) ve **Siccar Point Grubu** (*Stimson formasyonu*) birimlerine ayrılır.
    - **Boxwork bölgesi hangi birimde?** Kırık ağları boyunca mineral dolgulu poligonal sırtlar olan **boxwork yapıları**, alt Mount Sharp'taki **sülfat taşıyan birimin (Sulfate-Bearing Unit / Carolyn Shoemaker formasyonu — Mirador–Canaima seviyeleri)** içerisinde, kil taşıyan Glen Torridon ve hematitli Vera Rubin Ridge birimlerinin stratigrafik olarak hemen üzerinde yer alır (Siebach & Grotzinger, 2014; Bennett et al., 2023).
  - **2–3 Bilim Durağı Adayı (Rota ve Segment Skorlaması İçin):**
    1. **Vera Rubin Ridge (Hematit Sırtı) — `~5.38°S, 137.82°E`:** Güçlü CRISM kristal hematit (`BD860_2`) imzası gösterir; yeraltı suyunun redoks koşullarını ve diyajenetik akışkan dolaşımını belgelediği için bilimsel olarak kritik öneme sahiptir (Fraeman et al., 2013, 2016).
    2. **Glen Torridon (Kil Taşıyan Birim) — `~5.40°S, 137.84°E`:** Gale Krateri'ndeki en belirgin CRISM Fe/Mg-smektit kil (`D2300`, `BD2210_2`) soğurma bantlarını barındırır; nötr pH'lı uzun ömürlü göl/akarsu ortamının doğrudan kanıtıdır (Milliken et al., 2010; Fox et al., 2021).
    3. **Boxwork Sırtları / Sülfat Geçiş Bölgesi — `~5.35°S, 137.85°E`:** Kil-sülfat geçişi üzerindeki poligonal mineral damar ağlarını (boxwork) içerir; Mars'ın nemli iklimden kurak iklime geçişindeki geç dönem yeraltı suyu dolaşımını ve olası biyolojik iz korunumunu temsil eder (Siebach & Grotzinger, 2014; Sheppard et al., 2021).
- **Temel istatistik (min, maks, ortalama, sınıf dağılımı, nodata oranı):** `bilinmiyor` (ham MTRDR raster kesiti henüz yerel ortamda istatistiksel olarak örneklenmedi).
- **Örnek görsel(ler):** `docs/data/img/crism_gale_mineral_preview.png`

## 5. Kalite ve sorunlar
- **Boşluklar, gürültü, hatalı etiketler, hizalama sorunları:**
  - **Küresel USGS Haritası Yetersizliği:** `Resources` altındaki küresel USGS haritası (`1:20.000.000`) Gale Krateri içi stratigrafik birimleri, Vera Rubin Ridge'i veya 10–30 m ölçekli boxwork sırtlarını ayırt edemez; Gale ölçeği için **yetersizdir**.
  - **CRISM Gürültü & Hizalama:** Ham CRISM sahnelerinde sütun çizgilenmesi (striping) ve atmosferik toz/gaz soğurmaları bulunur; bu nedenle ham TRDR yerine atmosferik ve geometrik düzeltmesi yapılmış **MTRDR** ürünleri kullanılmalıdır. HiRISE/CTX altlıklarıyla piksel altı hizalama için 1–2 piksellik (~18–36 m) kayma payı dikkate alınmalıdır.

## 6. Bizim için kullanımı
- **Hangi katmanı / modeli besler:** Bilimsel değer / mineral ilgi skoru katmanını (Science Interest Layer) ve EVA rota planlayıcıdaki bilim durağı (waypoint) ödül fonksiyonunu besler.
- **Nasıl işlenmeli (kesme, yeniden örnekleme, normalize):**
  1. Gale ROI (`5.30°S–5.45°S, 137.75°E–137.90°E`) sınırlarına göre kırp (clip).
  2. `D2300` (kil), `SINDEX2` (sülfat) ve `BD860_2` (hematit) bantlarını `[0, 1]` aralığında min-maks normalize et ve bileşik mineral skoru üret.
  3. Rover/EVA analiz gridi çözünürlüğüne (CTX ~6 m veya DEM gridi) bilinear/nearest-neighbor ile yeniden örnekle (resample).
- **Tahmini işleme süresi:** Tek bir kırpılmış MTRDR sahnesi için Python (`rasterio` / `numpy`) ile ~5–15 saniye.

## 7. Karar
**KULLAN (CRISM MTRDR + Yerel MSL Jeoloji Birimleri) / KULLANMA (Küresel USGS Haritası)** — CRISM MTRDR mineral haritaları (~18 m/piksel) ve yerel MSL stratigrafi tanımları boxwork, kil ve sülfat katmanlarını doğrudan çözdüğü için bilimsel skorlama katmanında kullanılmalıdır; `Resources` içindeki 1:20M ölçekli küresel USGS haritası ise Gale Krateri içi analiz için çözünürlük açısından yetersiz olduğundan yalnızca arka plan bağlamı olarak tutulmalı, model girdisi olarak kullanılmamalıdır.
