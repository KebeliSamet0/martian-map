# Martian Map: Türkçe jüri sunumu planı (5 dk + 2 dk soru-cevap)

Durum: 2026-11-15, Drive'a yükleme son tarihi 16:00. Bu dosya `docs/submission/` altındaki İngilizce teslim paketinden (SLIDES.md, 7 slayt) ayrıdır; yerel jüri içindir.

## Biçim kuralları (Samet'in kararı)
- Sunum teknik bir akış: simülatörü tanıt, sonra özellikleri hızlıca geç. Hikâye yok.
- **Sayfa = bir özellik.** Üstte kısa kaynak linki, altında 1–3 kelimelik başlık, altında o özelliğin **uygulama içi GIF'i**. Maddeli yazı yok.
- Samet doğaçlama konuşur: her sayfada tek cümle, hemen sonraki sayfa. GIF 2 tur döner, cümle bitince geçilir.
- Sayfa sayısı sınırsız ama her sayfa tek şey söyler. Başlık uzarsa akış bozulur.
- Sağ altta küçük etiket: `ÖLÇÜM` (NASA verisi), `MODEL` (tahmin), `VARSAYIM` (planlama değeri).
- Uydurma sayı yok. NASA logosu yok. NASA görseli için atıf "NASA/JPL-Caltech" (HiRISE: "NASA/JPL/University of Arizona").
- Söylenmeyecek: "model rotayı değiştirdi / riski düşürdü" (#127), "60 µGy NASA limiti", "güvenli rota garantisi", "NASA onayladı".

## Sayfa planı (25 sayfa, sayfa başına ~10 sn ≈ 4:10, ~50 sn doğaçlama payı)

Kaynak sütunu sayfanın **üstünde** küçük yazıyla görünür. GIF sütunu çekimde yapılacak eylemdir (Mac ekran kaydı, uygulama `?lang=tr`).

| # | Başlık | Kaynak (üst satır) | Etiket | GIF: uygulamada ne yapılır |
|---|---|---|---|---|
| 1 | MARTIAN MAP | NASA Space Apps 2026 · Konya | – | açılış ekranı, yavaş yaklaşma |
| 2 | Simülatör | – | – | görev seçimi → S1 brifingi |
| | **Arazi ve veri** | | | |
| 3 | Arazi | USGS Gale DEM 1 m · astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m | ÖLÇÜM | 3B arazide birkaç saniye yürüyüş |
| 4 | Curiosity izi | NASA/JPL MMGIS · science.nasa.gov/mission/msl-curiosity/location-map | ÖLÇÜM | Curiosity izi ve durak işaretçileri |
| 5 | Eğim | NASA EVA-EXP-0075 (20°) · nasa.gov/…/topic_1-_eva_lunar_surface_concept_of_operations.pdf; Acta Astronautica 2023 (15°) · sciencedirect.com/science/article/pii/S0094576523005179 | VARSAYIM | eğim rengi, dik bölgeye yaklaşma |
| 6 | Kayalar | HiRISE 25 cm · astrogeology.usgs.gov/search/map/mars_msl_gale_merged_orthophoto_mosaic_25cm | MODEL | kaya haritası, kayaya çarpmadan yürüme |
| 7 | Zemin | AI4Mars · zenodo.org/records/15995036 | MODEL | ayak altı zemin satırı değişir |
| 8 | Bilim durakları | MRO CRISM · pds-geosciences.wustl.edu/mro/mro-m-crism-5-rdr-mptargeted-v1 | BAĞLAM | bilim durağına varış |
| | **Göstergeler** | | | |
| 9 | Enerji | Pandolf 1977 · doi.org/10.1152/jappl.1977.43.4.577 | VARSAYIM | enerji göstergesi akar |
| 10 | Oksijen | NASA SP-368 · ntrs.nasa.gov/citations/19760005584 | VARSAYIM | O₂ göstergesi akar |
| 11 | Radyasyon | Hassler 2014 · doi.org/10.1126/science.1244797 | ÖLÇÜM | doz sayacı akar |
| 12 | Süre ve yük | Ogilvie 2026 · ntrs.nasa.gov/api/citations/20260003038/downloads/Final_ICES2026_Mars_Mass_1.pdf | VARSAYIM | süre göstergesi, +8 kg yük etkisi |
| | **Algı** | | | |
| 13 | Kask kamerası | NASA/JPL-Caltech Navcam · mars.nasa.gov/msl/multimedia/raw-images | ÖLÇÜM + MODEL | durakta gerçek Navcam + model maskesi, sürgü |
| 14 | Tarayıcı | `ml/rover_terrain/SCAN_CHECK.md` | MODEL | tarayıcı uyarısı, düşük kanıt işareti |
| | **Rota** | | | |
| 15 | 3 rota | `docs/metabolic_model.md` | MODEL | rota kartları, segment nedeni |
| 16 | Kendi rotan | – | – | haritada başlangıç ve hedef seçimi |
| 17 | Canlı rota | planlayıcı, yeniden hesap ~3 m / 4 sn | MODEL | kum yamasına yaklaş, çizgi yön değiştirir |
| | **Görev döngüsü** | | | |
| 18 | Numune | – | – | E basılı: numune, +8 kg |
| 19 | Dönüş | – | – | ağır yükle üsse yürüyüş |
| 20 | Karne | – | – | karne ekranı (derece hatası düzeldiyse) |
| | **Kanıt** | | | |
| 21 | Curiosity kıyası | NASA/JPL MMGIS | ÖLÇÜM + MODEL | `docs/figures/msl_compare.png` |
| 22 | Navcam = simülatör | NASA/JPL-Caltech | ÖLÇÜM | `docs/figures/sim_06_navcam_vs_sim.png` |
| 23 | Zemin modeli | `ml/rover_terrain/METRICS.md` | MODEL | metrik kartı (mIoU 0,798) |
| 24 | Sınır: kum | `ml/rover_terrain/SCAN_CHECK.md` | MODEL | `docs/figures/navcam_vs_model.png` |
| 25 | Teşekkürler | repo · QR | – | – |

## Her sayfa için tek cümle (anahtar; doğaçlama yapılacak)
Sayılar yalnızca şu kaynaklardandır; başka sayı söyleme.

| # | Söylenecek | Sayı ve kaynak |
|---|---|---|
| 3 | Arazi gerçek HiRISE yükseklik verisi. | 1 m DTM [USGS] |
| 5 | 15° dikkat, 20° geçilmez; Mars için doğrulanmış değil, planlama varsayımı. | `docs/eva_parameters.md` |
| 6 | Kayaları ortofotodan kendi dedektörümüzle bulduk. | 123 büyük tespitten 120'si çıkıntı/gölge (yedek soru) [`VALIDATION.md` §6] |
| 7 | Zemin sınıfını Navcam'den modelle tahmin ediyoruz. | `MODEL_CARD.md` |
| 9 | Pandolf denklemi, Apollo ortalamasına kalibre. | 272 W [SP-368] |
| 10 | Oksijen enerjiden türetildi. | 1800 kcal ÷ 4,8 kcal/L ≈ 375 L [`eva_parameters.md`] |
| 11 | Sabit Curiosity yüzey doz hızıyla akıyor, rota boyunca ölçüm değil. | 0,210 ± 0,040 mGy/gün; 8,75 µGy/sa [Hassler 2014] |
| 12 | Süre 7 saat, yürüme hızı 0,75 m/s. | [SP-368; Ogilvie 2026] |
| 15 | Üç rota, her segmentin nedeni yazılı. | S1: 19,9 / 20,1 / 20,9 dk; 95 / 96 / 99 kcal [`sim/data/routes/S1.json`, doğrulandı] |
| 17 | Kum çıkınca çizgi bulunduğun yerden yeniden hesaplanıyor. | ~3 m / 4 sn, ~0,8 sn hesap |
| 21 | Aynı iki noktada Curiosity 3,89 km, bizim rotalar 2,3 km. | 2,26–2,40 km; ~130 m; yalnız geometri |
| 23 | Uzman etiketli testte model iyi ve kalibre. | mIoU 0,798, ECE 0,004 [`METRICS.md`] |
| 24 | Kumu kaçırıyoruz; bunu da gösteriyoruz. | Navcam eşleşmesi 3/6, kum 2/7 [`SCAN_CHECK.md`] |

## Yedek sayfalar (soru-cevap, gizli)
Y1 kum kaçırma · Y2 kaya dedektörü (123 büyük tespitten 120'si çıkıntı/gölge, 3 kaya) · Y3 enerji muhtemelen az tahmin (Dünya katsayıları, Mars için doğrulanmamış) · Y4 20° eşiği Ay kaynaklı · Y5 güven hatayı yakalamıyor (0,21 vs 0,18) · Y6 AI kullanımı ve açık kaynak (CC0 astronot, three.js MIT) · Y7 20° eşiğinde model rotayı değiştirmedi (#127).

## Mac'te GIF / video çekimi (kalite öncelikli)
Test edilmedi; Mac'te `ffmpeg` var (`/opt/homebrew/bin/ffmpeg`), `gifski` yok. Sunum cihazı PowerPoint 2016: aşağıdaki formatlar buna göre seçildi.

1. **Kayıt:** `Shift+Cmd+5` → "Seçili Bölümü Kaydet", tarayıcı penceresini 1920×1080'e sabitle (Chrome, gerçek GPU, `?lang=tr`). Gölgeli imleç kapalı, uygulama tam ekran değil, pencere sabit. Her özellik için ayrı kayıt, 4,5 sn (tek cümle) ya da 7,5 sn (iki cümle) kullanılacak kısım.
2. **Hız:** yürüyüşü hızlandırmak için `]` / `[` ile zaman ölçeği (2 s ekrandaki zaman ölçeği göstergesi görünür). Demo sayaçları gerçek hesaptan gelir, düzenleme yapma.
3. **Format: MP4, GIF değil.** Sunum cihazı **PowerPoint 2016**. 2016 GIF'i sonsuz döndürür ("2 tur" ayarı yok), 1920 px GIF 256 renkle bozuk renk verir ve eski cihazda takılır. H.264 MP4'ü 2016 oynatır. "2 tur"u videonun içine pişir (klip iki kez art arda):
   `ffmpeg -stream_loop 1 -i kayit.mov -ss 0 -t 4.5 -an -c:v libx264 -profile:v high -level 4.1 -crf 14 -preset slow -pix_fmt yuv420p -r 30 -movflags +faststart out.mp4`
   (`-ss` ve `-t` giriş klibi seçer; `-stream_loop 1` klibi iki kez oynatır. Çıkan dosya 9 sn (4,5 × 2) ya da 15 sn (7,5 × 2) olmalı; `ffprobe out.mp4` ile süreyi kontrol et.)
4. **Yedek GIF** (yalnız MP4 oynamazsa): 1280 px, 15 fps, 256 renk. 1920 px GIF'ten daha az bozulur:
   `ffmpeg -i kayit.mov -ss 0 -t 4.5 -vf "fps=15,scale=1280:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a" out.gif`
   Bu GIF PowerPoint'te sonsuz döner; "2 tur" garantisi yok.
5. **Slayta koyma:** Ekle → Video → Bilgisayardaki Video. Oynat sekmesinde **Başlat: Otomatik**, **Bitince başa sar: kapalı**, **Döngü: kapalı**, ses yok. Slayt açılınca video kendiliğinden başlar, 2 turdan sonra son karede durur.
6. **Şablon:** Bora'nın "Mars Surface" şablonu (#141).
7. **Drive öncesi:** dosyayı Drive'dan bir kez açıp dene. Drive önizlemesi videoyu ve fontu güvenilir göstermeyebilir; sunumda `.pptx` dosyasını cihazda PowerPoint'te açın, Drive'ı yalnız taşıma yolu olarak kullanın.

## PowerPoint 2016 uyumluluk kontrol listesi (Samet'in isteği)
Bu ortamda PowerPoint 2016 yok; aşağıdakiler 2016 özellik sınırından geliyor, **sunum cihazında bir kez tam deneme yapılmadıkça doğrulanmış sayılmaz**.

- **Yasak (2016'da yok):** Morph geçişi, Zoom (özet/bölüm/slayt), Tasarım Fikirleri, SVG simge ekleme ve düzenleme, 3B model. Bunlardan biri varsa slaytta bozulur ya da görünmez.
- **Geçiş:** yalnız Silinme (Fade) ya da hiç. Karmaşık animasyon yok.
- **Boyut:** 16:9 (13,333 × 7,5 in), `.pptx` olarak kaydet (Strict Open XML ve `.pptm` değil).
- **Fontlar (en büyük risk):** Şablon Barlow / Barlow Condensed ya da Poppins / Orbitron kullanıyor; sunum cihazında kurulu değilse PowerPoint başka fonta düşer ve düzen kayar. İki yol:
  1. Fontları sunum cihazına kur (Google Fonts, TTF, ücretsiz) ve **sunumdan önce** pptx'i o cihazda aç, taşma var mı bak.
  2. Kuramıyorsak: Dosya → Seçenekler → Kaydet → "Yazı tiplerini dosyaya göm" (Windows PowerPoint'te yalnız TrueType gömülür; Barlow TTF olarak çalışır). Mac PowerPoint 2016 gömmeyi desteklemez; cihaz Mac ise yol 1 şart.
  3. Yedek: şablon yerine **Calibri / Arial** ile yeniden kur (her cihazda var, düzen kaymaz).
- **Türkçe karakter:** Orbitron'da `İ Ş Ğ ş ğ` yok. Başlıklarda kullanılacak font Türkçe karakter desteklemeli (Barlow ve Poppins destekler).
- **Video:** H.264 (yuv420p), AAC ya da sessiz, ≤ 1920×1080, 30 fps. HEVC/H.265, VP9, 4K ve 60 fps kullanma. Çalışma klasörüyle birlikte taşıma: PowerPoint'te "Medyayı Sıkıştır" **Tam HD** seçilmemeli, aksi halde kalite düşer (Dosya → Bilgi → Medyayı Sıkıştır'a basma).
- **Dosya boyutu:** 25 video × ~10–25 MB olabilir. Sunumdan önce `.pptx`'i USB'ye de al (Drive yedek).
- **Görseller:** PNG/JPEG. Şablondaki yüksek çözünürlüklü PNG arka planlar 2016'da sorun çıkarmaz ama dosyayı şişirir.
- **Yedek:** Sunum PDF'ini de al (videosuz); cihaz bozulursa kareler gösterilir.
- **Deneme:** Sunum cihazında F5 ile baştan sona bir kez oynat: fontlar, videonun otomatik başlaması, ilk slayttan son slayta geçişin takılmaması.

## Çekimden önce kontrol (kısa)
- Yeni `main`'den çek (075ee14 ve sonrası): canlı rota ve yeni bütçe bunun içinde.
- Karne: #158 birleşti (karne dönüş düzeltmesi); derece ekranı çekmeden önce tekrar doğrula.
- #126'daki S1 başlangıcındaki havada asılı arazi parçası düzeldi mi bak; düzelmediyse o açıdan çekme.
- GIF'ler `?lang=tr` ile, sentetik ayrıntı etiketleri açık (saf veri modu `V` yalnız arazi sayfası için istenirse).

## Kaynak notları
- Bütün URL'ler `docs/REFERENCES.md` ve `docs/eva_parameters.md` içinde yazılı olanlardır; yeni link uydurulmadı.
- Sayfa 12 için Ogilvie 2026 URL'si uzun; slaytta "ntrs.nasa.gov · Ogilvie 2026" kısa yazılabilir.
- Resmî Space Apps jüri kılavuzunun tam metnine ulaşılamadı (sertifika hatası); beş kriter (Impact, Creativity, Validity, Relevance, Presentation) arama özetlerinden. Kılavuz metni gelirse sayfa–kriter eşlemesi yeniden yapılacak.
