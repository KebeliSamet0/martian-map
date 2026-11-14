# Veri analizi: Curiosity (MSL) konum/rota + Navcam ham görüntüler

Analizi yapan: Veysel · Tarih: Cmt 14 Kasım 2026 · Refs #20

## 1. Ne
- Ürün adı ve sürümü: MSL Raw Images (Navcam, NAV_LEFT_A/B), mars.nasa.gov ham görüntü API'si; bölge seçimi için NASA Curiosity Mission Blog
- Kaynak linki:
  - Galeri: https://mars.nasa.gov/msl/multimedia/raw-images/
  - API: `https://mars.nasa.gov/api/v1/raw_image_items`
  - Blog: https://science.nasa.gov (Curiosity Blog, Sols 4614–4844 boxwork yazıları)
- Lisans / kullanım şartı: NASA/JPL-Caltech görüntü kredisi (`image_credit` alanı). Ham, kalibre edilmemiş JPEG.

## 2. Erişim
- Nasıl indirildi: `pipeline/msl/fetch_navcam.py` (yalnız Python standart kütüphanesi). API JSON döndürüyor, sayfalı (`per_page`, `page`, `more`, `total`).
  - Kamera filtresi: `search=NAV_LEFT_A|NAV_LEFT_B`
  - Sol filtresi sunucu tarafında çalışıyor: `condition_2=<max>:sol:lte`, `condition_3=<min>:sol:gte`
  - Küçük resimleri dışlama: `extended=thumbnail::sample_type::noteq`
  - Komut: `python pipeline/msl/fetch_navcam.py --sol-min 4580 --sol-max 4850 --max-per-stop 4`
- Boyut: tam kare JPEG ortalama ~0,58 MB. Boxwork kesitimizde (durak başına en fazla 4 kare): **226,7 MB / 391 dosya** (bazı duraklarda 4'ten az tam kare var)
- Format: JPEG (görüntü) + JSON meta (API) → bizim çıktımız `index.csv` ve `rover_stops.json`
- Projeksiyon / koordinat sistemi: Her kayıtta `site`, `drive`, `xyz`. `xyz` rover'ın o **site'ın yerel çerçevesindeki** konumu (metre; MSL site çerçevesi genelde x=kuzey, y=doğu, z=aşağı). Küresel (lat/lon) konum API'de **yok**.
- Çözünürlük: Navcam tam kare 1024×1024 piksel, tek kanal (siyah-beyaz)

## 3. Kapsama
- Bölgemizi kapsıyor mu? **Evet**
- Boxwork sol aralığı: **~4600–4844** (blog: Sols 4614–4615 "Driving Along the Boxwork" Tem 2025 → Sols 4838–4844 "Wrapping Up the Boxwork Terrain" Mar 2026). İndirmede güvenlik payıyla 4580–4850 kullanıldı.
- Kapsanan site'lar: **117, 118, 119, 120, 121**
- Zaman aralığı: Tem 2025 – Mar 2026

## 4. İçerik
- Görüntü tipleri (`extended.sample_type`):
  - `full` 1024×1024 → **kullanacağımız tip**
  - `subframe` 1024×512 (ufuk civarı)
  - `downsampled` 256×256, `TRAV` adlı, sürüş sırasında ~1 m arayla; düşük çözünürlüklü ama yoğun kanıt (ileride kullanılabilir)
- Temel istatistik (4580–4848, yalnız sol kamera):
  - Toplam görüntü: 4.379 · tam kare: 1.415 (**%32**) · sol başına ortalama ~16 görüntü, ~5 tam kare
  - Durak (site+drive): **128**
  - Karşılaştırma, güncel soller 5020–5073: 565 görüntü, 144 tam kare (%25), 12 durak
- Durak sonu panoramaları `mast_el` ≈ −47°, −20°, −5° açılarından oluşuyor; en negatif açılar zemine bakıyor (segmentasyon için en verimli). Script bunları önce seçiyor.
- Örnek 3 durak (`rover_stops.json`'dan):

| stop_id | sol | site / drive | xyz (site, m) | örnek görüntü |
|---|---|---|---|---|
| msl_s117_d0384 | 4580 | 117 / 384 | (-22.16, -47.11, 0.52) | `navcam/sol_04580/NLB_804091074EDR_F1170384NCAM00385M_.JPG` |
| msl_s117_d0420 | 4580 | 117 / 420 | (-25.18, -51.09, 0.35) | `navcam/sol_04580/NLB_804091782EDR_F1170420NCAM00353M_.JPG` |
| msl_s117_d0456 | 4582 | 117 / 456 | (-24.76, -50.00, 0.35) | `navcam/sol_04582/NLB_804266058EDR_F1170456NCAM00485M_.JPG` |

Not: Örnekler aynı site içinde art arda üç durak; drive'lar arası mesafe 1–5 m. Site çerçevesindeki xyz farkından doğrudan hesaplanabiliyor.

- Örnek görseller: `docs/data/img/navcam_ornek_1.png`

## 5. Kalite ve sorunlar
- Tam kare oranı düşük (%25–32); kalan kareler alt kare veya küçültülmüş.
- Stereo çiftler (NLB/NRB) aynı anda çekiliyor; tek göz yeterli, sağ kamera atlandı.
- Sol ~4752–4805 arası veri çok seyrek (muhtemelen Ocak 2026 güneş kavuşumu; doğrulanmadı).
- Ham JPEG, radyometrik kalibrasyon yok. Segmentasyon için yeterli; AI4Mars karelerine benzerlik Emre ile kontrol edilecek.
- **Konum: çözüldü.** Küresel konum MMGIS waypoint dosyasından alındı (https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json; 1.389 kayıt, alanlar: site, drive, lat, lon, easting, northing, elev_geoid; yalnız günlük sürüş bitiş noktaları). `pipeline/msl/add_latlon.py` ile 128 durağın 63'ü doğrudan (site, drive) eşleşmesiyle, 65'i site orijini (drive 0) + xyz ile konumlandı; konumsuz durak yok. Çapraz kontrol: iki yöntem arasındaki fark <0,5 m (x=kuzey, y=doğu varsayımı doğrulandı). easting/northing projeksiyonunun DTM ile aynı olup olmadığı Elif Rana ile kontrol edilecek. (Kaynağı bulan: Elif Rana)

## 6. Bizim için kullanımı
- Besler: `ml/rover_terrain` (AI4Mars modeli girdisi, Emre) → `rover_stops.json` → zemin sınıfı + güven katmanı; arayüzde bilim durağı fotoğrafları (Veysel).
- İşleme: tam kare filtrele → durak (site+drive) bazında grupla → zemine bakan kareleri seç → site çerçevesi → grid dönüşümü (Elif Rana'nın DTM projeksiyonu belli olunca).
- `rover_stops.json`'a sözleşmede olmayan alanlar eklendi: `site`, `drive`, `sols`, `xyz_site_m`, `n_full_frames` (issue açılacak).
- 128 durak 2×2 km kutu için fazla; kutu seçilince ~20–30 duraka inmesi bekleniyor.
- Tahmini işleme süresi: listeleme ~3 dk, indirme (391 kare, 226,7 MB) etkinlik ağında birkaç dakika.

## 7. Karar
**KULLAN** — Görüntü erişimi programla çözüldü, boxwork bölgesinde 128 durak var ve hepsi enlem/boylamla konumlandı. Kalan iş: konumları Elif Rana'nın DTM grid'ine (px) çevirmek.

