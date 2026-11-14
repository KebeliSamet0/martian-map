# Veri analizi: CRISM mineraloji + Gale / Mount Sharp jeoloji haritaları

Analizi yapan: Elif Nisa · Tarih: Cmt 2026-11-14, 13:00 (12:00 hedefinden ~1 sa geç)

> **Kısa sonuç:** CRISM bölgemizi kapsıyor. İndirilebilir **hazır mineral parametre ürünleri** de var
> (MTRDR browse). Ama bunlar ham ve gürültülü; maliyet haritasına katman olarak girmeye uygun değiller.
> Bilim duraklarını **yayınlanmış birim haritalarına** (Fraeman 2016) ve rover sonuçlarına dayanarak
> elle yerleştirmeyi öneriyorum. Küresel USGS haritası Gale ölçeğinde işe yaramıyor.

## 1. Ne
- Ürün adı ve sürümü: **MRO CRISM MTRDR** (Map-projected Targeted Reduced Data Record), PDS3
  `MRO-M-CRISM-5-RDR-MPTARGETED-V1.0`, cilt `mrocr_4001`, sürüm eki `_MTR3`. Spektral parametreler
  Viviano-Beck vd. (2014) tanımlarına göre hesaplanmış.
- Kaynak linki: https://pds-geosciences.wustl.edu/mro/mro-m-crism-5-rdr-mptargeted-v1/ ·
  arama: https://ode.rsl.wustl.edu/mars/ (ODE)
- Yanında kullanılan jeoloji kaynakları: Fraeman vd. (2016) alt Mount Sharp birim haritası, Fraeman vd. (2013)
  hematit sırtı, Milliken vd. (2010) kil→sülfat stratigrafisi, USGS SIM 3292 küresel harita (Tanaka vd. 2014).
- Lisans / kullanım şartı: NASA PDS verisi; ABD hükümeti eseri, kullanım serbest (kaynak gösterilerek).
  Makale şekilleri yayıncı telifine tabi: **kopyalamıyoruz**, yalnız atıf veriyoruz.

## 2. Erişim
- Nasıl indirildi: ODE REST API ile Gale kutusunda (lat −5.2…−4.6, lon 137.2…137.6) arama yapıldı.
  Sorgu **20 MTRDR ürünü** döndürdü:
  ```
  https://oderest.rsl.wustl.edu/live2/?query=product&results=m&target=mars&ihid=MRO&iid=CRISM&pt=MTRDR&westlon=137.2&eastlon=137.6&minlat=-5.2&maxlat=-4.6&output=JSON
  ```
  Örnek gözlem **FRT0000B6F1** (2008-07-09) için browse dosyaları (`browse/2008/2008_191/frt0000b6f1/`)
  indirildi. Bu, Fraeman 2016'nın kullandığı gözlemlerden biri.
- Boyut (FRT0000B6F1 için):
  - IF küpü (tam spektrum) **~1.08 GB**
  - SR/SU (60 parametre bandı) ~133 MB'ar
  - Browse IMG 1.6 MB, browse PNG 0.3–0.8 MB
  - 20 gözlemin tamamı birkaç on GB eder; **indirmiyoruz**.
- Format: PDS3 `.IMG` + ENVI `.HDR` + `.LBL`; browse ayrıca `.PNG` olarak var. Kapsama alanı KML ve shapefile olarak da indirilebiliyor.
- Projeksiyon: **Equirectangular**, Mars küresi R = 3 396 190 m, merkez meridyen 0°. Değer metre cinsinden
  (ENVI `map info` alanında hazır). Bizim HiRISE DTM ızgarasına geçmek için yeniden projeksiyon gerekir.
- Çözünürlük: FRT ürünlerinde **18 m/piksel**, HRL/HRS ürünlerinde 36 m/piksel. Ham FRT0000B6F1 görüntüsü 775 × 714 piksel.

## 3. Kapsama
- Bölgemizi kapsıyor mu? **Kısmen.** Alt Mount Sharp'ın kuzey ve kuzeybatı eteği (Curiosity'nin geçtiği
  bant) iyi kapsanıyor. Boxwork bölgesinin tam koordinatını bulamadım; kapsanıp kapsanmadığı **bilinmiyor**
  (kontrol için PIA26306 ve HiRISE sayfası kullanılabilir).
- Kapsanan koordinat aralığı (20 ürünün birleşimi): lat **−5.30 … −4.22**, lon **137.00 … 137.87** (doğu).
- Zaman aralığı: 2007-04 … 2011-12. CRISM'in kızılötesi kanalı 2017'de kapandı; Gale için yeni gözlem yok.

## 4. İçerik
- Bantlar: MTRDR `SR` dosyasında 60 spektral parametre var. Browse ürünleri bunlardan 3 bantlı RGB kompozitleri oluşturuyor
  (bant adları HDR'den okundu):
  - `PHY` (kil / fillosilikat): D2300, D2200, BD1900R2
  - `HYD` (hidratlı mineral, sülfat): SINDEX2 (polihidratlı sülfat), BD2100_2 (monohidratlı sülfat), BD1900_2
  - `FEM` (demir mineralleri, hematit): BD530_2, SH600_2, BDI1000VIS
  - diğerleri: MAF, FAL, PFM, PAL, HYS, ICE, IC2, CAR, CHL, CR2, TAN, TRU, VNA, IRA, FM2
- Temel istatistik (FRT0000B6F1 browse, 8-bit, gözlem bazında germeli; **mutlak değil göreli**):
  - nodata (kenar dışı) **%29.5**
  - PHY: D2300 ort. 2.6/255, piksellerin %0'ı ≥128 → **güçlü kil sinyali yok**
  - HYD: SINDEX2 ort. 40.4 (%2.4 ≥128), BD2100_2 ort. 40.1 (%5.8 ≥128) → **sülfat sinyali tutarlı bir bantta**
  - FEM: BD530_2 her yerde yüksek (%100 ≥128; tozlu, ferrik yüzey için beklenen sonuç)
- Örnek görseller: `docs/data/img/crism_b6f1_hyd.png` (sülfat; kırmızı-mor diyagonal bant) ve
  `docs/data/img/crism_b6f1_phy.png` (kil; sağ kenardaki yeşil çizgiler dedektör kenar artefaktı, gerçek sinyal değil). Kuzey yukarıda.

## 5. Kalite ve sorunlar
- Standart browse ürünleri **gürültülü**: dikey çizgilenme ve kenar artefaktları var. Bilinen kil biriminin
  (PhU) sinyali standart PHY ürününde görünmüyor. Fraeman 2016 bu sinyali özel işleme ve ATO (12 m/px) gözlemleriyle çıkarmış.
- 18 m/piksel, bizim HiRISE (~1 m) ızgaramızdan ~18 kat kaba. Bir CRISM pikseli, astronotun birkaç adımlık
  rota segmentinden büyük.
- **Yörünge ile zemin uyuşmazlığı:** Curiosity, Vera Rubin sırtının altındaki katmanlarda da hematit buldu.
  Bu katmanlarda CRISM hematit sinyali zayıf (Fraeman vd. 2020). Yani CRISM'de sinyal olmaması mineral
  olmadığı anlamına gelmiyor.
- Toz örtüsü ve aydınlatma gözlemden gözleme değişiyor (geliş açısı 35°–60°). Gözlemler arasında mozaik
  dikişi olur.
- **Hazır, birleştirilmiş, indirilebilir bir Gale mineral haritası (GeoTIFF/shapefile) bulamadım.**
  Fraeman 2016 haritaları yalnız makale şekli olarak var; GIS ekinde yayınlanmamış.

## 6. Bizim için kullanımı
- Hangi katmanı besler: **Bilim durakları** (`rover_stops` / segment açıklaması). Maliyet haritasını
  **beslemez**: mineraloji yürünebilirliği belirlemez, çözünürlük de yetersiz.
- Nasıl işlenmeli:
  1. 2–3 bilim durağı aşağıdaki tablodan elle yerleştirilir. Her durağa kaynak ve "neden değerli" cümlesi
     eklenir (lat/lon ızgara pikseline çevrilir).
  2. *(Opsiyonel, ekstra)* Arayüzde bağlam için `HYD` browse PNG'si yarı saydam overlay olarak gösterilebilir.
     ENVI `map info` ile köşe koordinatları hesaplanır, Leaflet `imageOverlay` kullanılır. IF/SR küpü
     **işlenmez**.
- Tahmini işleme süresi: duraklar 30 dk. Overlay ~1–2 sa (Kapı 2 sonrasına bırakılmalı).

### Cevaplanan sorular
**1. Hazır CRISM mineral haritaları nerede?**
- Veri olarak: PDS Geosciences MTRDR browse ürünleri (yukarıda). Gözlem başına PHY/HYD/FEM PNG'leri hazır,
  ama gürültülü.
- Yayın olarak:
  - Fraeman vd. 2013 (hematit sırtı haritası)
  - Milliken vd. 2010 (kil → sülfat geçişi)
  - Fraeman vd. 2016 (7 birimli alt Mount Sharp haritası; kullanılan gözlemler: FRT0000B6F1, FRT0001BBA1,
    HRL0000BABA ve ATO00021C92 / ATO0002EC79 / ATO00038AA7)
  - Sheppard vd. 2021 (kil/sülfat ara katmanları)
- İndirilebilir GIS katmanı: **bilinmiyor / bulunamadı.**

**2. Gale / Mount Sharp jeoloji birim haritası; boxwork hangi birimde?**
- Birim haritası: Fraeman vd. 2016 alt Mount Sharp'ı şöyle ayırıyor:
  - Mount Sharp grubu: Murray (MF1–3), fillosilikat birimi (PhU), hematit sırtı (HR), spektral eğimli birim
    (SS), katmanlı sülfat birimi (LS)
  - Üstte uyumsuz Siccar Point grubu (Stimson)
- Diğer haritalar:
  - Anderson & Bell 2010 (Gale geneli)
  - Fedo vd. 2022 (Glen Torridon)
  - Thomson vd. 1:60K batı Aeolis Mons haritası: 2023'te tamamlandı, USGS SIM incelemesine gönderilecekti;
    yayın durumu **bilinmiyor**
- Boxwork: **Katmanlı Sülfat biriminin (LSu) içinde** yer alıyor. Curiosity LSu'dan boxwork aralığına
  sol 4534'te (7 Mayıs 2025) geçti. Boxwork kayası ince taneli, kolay ufalanan bir çamurtaşı; çevresindeki
  sülfatlı kayaya göre Si ve Al'ce zengin, Mg ve S'ce fakir (GSA 2025 özeti). Sırtlar 10–20 km boyunca uzanıyor
  ve yeraltı suyunun çatlaklarda bıraktığı minerallerle sertleştiği düşünülüyor (NASA/JPL 2025).

**3. Küresel USGS jeoloji haritası Gale ölçeği için yeterli mi?**
- **Hayır.** SIM 3292 (Tanaka vd. 2014) 1:20 000 000 ölçekli ve MOLA'ya bağlı.
  - Bu ölçekte en küçük haritalanabilir birim on km'ler mertebesinde (kartografik tahmin).
  - Gale kraterinin çapı ~154 km; Mount Sharp tek ya da birkaç poligon olarak görünür.
  - Bizim birkaç km'lik rotamızda birim değişimi göremeyiz.
- Yalnız slaytta bölgesel bağlam için kullanılabilir. Gale'deki birim sembolü **kontrol edilmedi**.

**4. Bilim durakları** (güncelleme, Elif Rana ile; bkz. #19 ve PR #34)

Ekibin ızgarası boxwork bölgesinde 2×2 km'lik bir kutu: NW −4.788132, 137.365129 · SE −4.821873, 137.398871
(`contracts/grid.json`). İlk önerdiğim üç adaydan **yalnız boxwork bu kutunun içinde**. Hematit sırtı ve kil–sülfat
geçişi kutunun kuzeyinde kalıyor; Curiosity bu yerlerden daha önce geçti.

**Haritadaki duraklar** (`layers/science_stops.json`, PR #34). Konumlar veriden çıkarıldı: Curiosity'nin MAHLI ve
ChemCam ile en yoğun yakın inceleme yaptığı yerler.

| id | Sol | Neden değerli | Kaynak |
|---|---|---|---|
| `sci_1`–`sci_3` | 4617–4803 | **Boxwork.** Yeraltı suyunun çatlaklarda mineral bırakarak sertleştirdiği düşünülen sırt ağı. Katmanlı sülfat birimi içinde, kuru sülfat döneminde daha ıslak bir ara evreye işaret ediyor. | NASA/JPL 2025; GSA 2025 |
| `sci_4` | 4869–4914 | **Boxwork'ten sonraki ilk sülfat sondajı.** Atacama sondaj kampanyası (sol 4873'ten itibaren), boxwork bölgesinden ayrıldıktan sonra katmanlı sülfat birimindeki ilk ana kayayı inceliyor. Sonuç, ~160 m aşağıdaki Mineral King örneğiyle karşılaştırılarak sülfat biriminin yükseklikle nasıl değiştiği anlaşılacak. Yakındaki açık ve koyu kaya türlerinin (Toro / Inca de Oro) dokanağı oluşum koşullarında bir değişime ya da zaman boşluğuna işaret edebilir. Aynı sol aralığında 10 m'lik, keskin kenarlı Antofagasta kraterinin kenarı da incelendi (sol 4867–4872). | NASA Curiosity blogları, Nisan–Mayıs 2026 |

Not: sci_4 bağlamı **sol aralığına göre** eşlendi; blogların anlattığı noktaların sci_4 konumuna tam denk geldiği
haritada ayrıca doğrulanmadı.

**Kutu dışında, slaytta bağlam olarak kullanılacak adaylar:**

| Aday | Neden değerli | Kaynak |
|---|---|---|
| Hematit sırtı (Vera Rubin) | Kristalin hematit oksitleyici sıvı ve yeraltı suyu ile redoks sınırına işaret ediyor. Yörüngeden haritalanıp zeminde test edilmiş ender bir hedef. | Fraeman vd. 2013, 2016, 2020 |
| Kil–sülfat geçişi (Glen Torridon → sülfat birimi) | Fe/Mg smektitten (sulu, nötr ortam) Mg-sülfata (kuruyan iklim) geçiş, Mars ikliminin değişimini tek kesitte gösteriyor. | Milliken vd. 2010; Fraeman vd. 2016; Sheppard vd. 2021 |

## 7. Karar
**KULLAN (sınırlı)**: CRISM ve yayınlanmış birim haritaları **yalnız bilim durakları ve açıklama metni**
için kullanılsın. Maliyet haritasına katman olarak girmesin, IF/SR küpleri işlenmesin. 18 m/px çözünürlük
ve gürültü buna izin vermiyor; hazır GIS katmanı da yok. Küresel USGS haritası: **KULLANMA** (yalnız slayt bağlamı).
