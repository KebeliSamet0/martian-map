# Veri analizi: Gale DTM + ortofoto (USGS MSL Gale Merged), Mars Trek katmanları

Analizi yapan: Elif Rana · Tarih: Cmt 14 Kasım 2026, sabah

## 1. Ne
- Ürün adı ve sürümü:
  - **MSL Gale Merged DEM 1m**, sürüm 3 (`MSL_Gale_DEM_Mosaic_1m_v3`), USGS Astrogeology, 2016-10-20
  - **MSL Gale Merged Orthophoto Mosaic 25cm**, sürüm 3 (`MSL_Gale_Orthophoto_Mosaic_25cm_v3`), USGS Astrogeology, 2016-10-20
- Kaynak linki:
  - DEM: https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_dem_1m
  - Ortofoto: https://astrogeology.usgs.gov/search/map/mars_msl_gale_merged_orthophoto_mosaic_25cm
- Lisans / kullanım şartı: Kullanım kısıtı yok, yazarlara atıf isteniyor (Calef III, F.J. ve Parker, T., 2016)

## 2. Erişim
- Nasıl indirildi: **İndirilmedi.** GDAL `/vsicurl/` ile yalnız 2×2 km'lik pencere S3'ten okundu (Colab, rasterio):
  - `https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/MSL_Gale_DEM_Mosaic_1m_v3.tif`
  - `https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/MSL_Gale_Orthophoto_Mosaic_25cm_v3.tif`
- Boyut (tamamı / kesitimiz):
  - DEM: S3'te 7,6 GB (katalog sayfası 3,6 GB diyor) / kesit 2000×2000 float32 ≈ 16 MB
  - Ortofoto: S3'te 50,4 GB (katalog sayfası 23 GB diyor) / kesit 8000×8000 uint8 ≈ 64 MB
- Format: GeoTIFF, sıkıştırmasız, satır şeritli (blok 1×genişlik), overview yok. Pencere okurken kesitin geçtiği satırların tamamı çekiliyor; yine de makul sürede bitiyor (bkz. bölüm 6).
- Projeksiyon: Equirectangular, `+proj=eqc +lat_ts=0 +lon_0=0 +R=3396190` (küre), planetosentrik, doğu pozitif. İki ürün **aynı CRS'te**, piksel ızgaraları hizalı.
- Çözünürlük: DEM 1 m/piksel (57440×32980), ortofoto 0,25 m/piksel (280000×180000), 1 bant 8 bit.

## 3. Kapsama
- Bölgemizi (Gale / Mount Sharp, boxwork bölgesi) kapsıyor mu? **Evet**
- Kapsanan koordinat aralığı: DEM enlem −5,0987…−4,1296, boylam 137,1242…137,6806; ortofoto enlem −5,2495…−4,0686, boylam 137,0947…137,8539
- Zaman aralığı: Kaynak HiRISE/CTX/HRSC görüntüleri 2006–2011; ürün 2016

## 4. İçerik
- Değişkenler: DEM = yükseklik (m, MOLA datumu); ortofoto = gri ton yansıma (HiRISE)
- **Seçilen kesit (öneri, Kapı 1'de kesinleşecek):** merkez 4,805°G 137,382°D, 2×2 km. Merkez, Curiosity'nin MSL waypoint verisinden seçildi: rover yaklaşık sol 4459–4983 arasında bu kutuda (144 durak; ~sol 4669–4805 arası aynı noktada uzun duraklama). Bunun boxwork kampanyası olduğu sol aralığından çıkarım, NASA kaynağıyla ayrıca doğrulanmadı.

  | Köşe | Enlem | Boylam |
  |---|---|---|
  | KB | −4,78813 | 137,36513 |
  | KD | −4,78813 | 137,39887 |
  | GB | −4,82187 | 137,36513 |
  | GD | −4,82187 | 137,39887 |

  Projeksiyonlu sınırlar (m): x 8142276,5 … 8144276,5 · y −285814,9 … −283814,9
- Temel istatistik (DEM kesiti, 1 m, 2000×2000):
  - Yükseklik: min −3884,5 m, maks −3389,4 m, ortalama −3609,9 m, **aralık 495,1 m**
  - **Nodata: %0,00** (ortofoto önizlemesinde de boş/0 piksel %0,0)
- Eğim (2 m'ye ortalanmış ızgara, 1000×1000, `grid.json` sözleşmesiyle aynı boyut):
  - ortalama 16,0°, medyan 13,3°, %95'lik 36,9°, maks 76,8°

  | Eğim | 0–5° | 5–10° | 10–15° | 15–20° | 20–25° | 25–30° | >30° |
  |---|---|---|---|---|---|---|---|
  | Oran | %9,9 | %25,2 | %21,2 | %14,7 | %10,3 | %7,2 | %11,5 |
- Örnek görsel: `docs/data/img/gale_dtm_ortho_preview.png` (ortofoto önizleme + Curiosity yolu, eğim haritası, eğim histogramı)

## 5. Kalite ve sorunlar
- Mutlak konum doğruluğu MOLA'ya bağlı: ~100 m yatay, ~1 m düşey. Göreli (kesit içi) geometri HiRISE kalitesinde; rota planlama için sorun değil, ama başka kaynaklı katmanları (CRISM vb.) üst üste koyarken 100 m'ye kadar kayma olabilir.
- DEM'in her yerinde HiRISE stereo yok; boşluklar CTX → HRSC → MOLA ile dolduruluyor. Kesitimizin hangi kaynaktan geldiği metadata'da yazmıyor: **bilinmiyor**. Eğim haritasındaki ince detay ve 76,8°'lik maksimum HiRISE çözünürlüğünü düşündürüyor, ama dik yamaçlarda stereo artefaktı da olabilir.
- Eğimin %11,5'i 30° üstünde: Mount Sharp'ın eteğinde zor bir arazi. Rota için iyi (karar verecek çok şey var), ama yürünebilir koridor dar olabilir.
- Katalogda yazan dosya boyutları S3'tekiyle uyuşmuyor (DEM 3,6 → 7,6 GB, ortofoto 23 → 50 GB); muhtemelen sıkıştırmasız yeniden yayın.

## Diğer kaynaklar (sorulan)
- **Mars Trek** (https://trek.nasa.gov/mars/): Gale için `MRO HiRISE, Gale Crater DEM` (`Gale_DEM_SMG_1m`), `MRO HiRISE, Curiosity Roving Site Mosaic`, `MRO CTX, Gale Crater Mosaic` ve `MRO CTX, Curiosity Roving Site Mosaic` katmanları var. HiRISE DEM/mozaiğin kapsamı (enlem −4,925…−4,249, boylam 137,122…137,730) bizim kesiti içeriyor; USGS ürünüyle aynı kaynak gibi görünüyor. Trek arayüzünden indirme denenmedi; USGS dosyası zaten doğrudan okunabildiği için gerek görülmedi.
- **HiRISE DTM arşivi** (https://www.uahirise.org/dtm/): Site araması Mount Sharp / boxwork için ayrı bir DTM sayfası döndürmedi. Ayrı yayımlanmış bir DTM olup olmadığı **bilinmiyor**. USGS birleşik DEM'i zaten 12 HiRISE stereo çiftinden (ör. `Traverse`, `T1`–`T3`) üretilmiş.

## 6. Bizim için kullanımı
- Hangi katmanı besler: `layers/elevation.npy`, `layers/slope.npy` (DEM); Bora'nın kaya tespiti ve 3D sahnenin dokusu (ortofoto)
- Nasıl işlenmeli: Yukarıdaki sınırlarla pencere oku → DEM'i 2×2 blok ortalamasıyla 2 m'ye indir (1000×1000) → gradyanla eğim. Ortofoto aynı sınırlarla, gerekirse 0,25 m tam çözünürlükte (8000×8000) Bora'ya.
- İşleme süresi (Colab'da ölçüldü): DEM kesiti, eğim, waypoint'ler ve 2 m'lik ortofoto önizlemesi toplam **~3 dk**. Ortofotonun tam çözünürlüklü kesiti (8000×8000) aynı satırları okuyacağı için benzer sürede çıkmalı (ölçülmedi). Bir kez çıkarılıp paylaşılmalı.

## 7. Karar
**KULLAN (Gale ile devam)**: DEM ve ortofoto boxwork bölgesini kapsıyor, kesitte nodata yok, iki ürün aynı projeksiyonda ve tam indirme gerekmeden pencereyle okunabiliyor. Jezero B planına gerek görünmüyor.

Neden Jezero değil (B planı yedekte kalıyor, kötü olduğu için değil; geçiş koşulu oluşmadı):

| | Gale | Jezero (B planı) |
|---|---|---|
| Veri erişimi | Büyük dosyalar (DEM 7,6 GB, ortofoto 50 GB), pencereyle okunarak çözüldü | Hazır ~1,8 GB USGS paketi, daha kolay |
| Zemin modeli (AI4Mars) | Etiketlerin çoğu Curiosity'den, model kendi alanında | Perseverance etiketi yok, model alan dışı → belirsizlik katmanı zayıflar |
| Radyasyon (RAD) | Doğrudan bu bölgede ölçülmüş | Perseverance'ta RAD yok, Gale'den varsayım gerekir |
| NASA kaynak listesi | Challenge metnindeki örnek bölge; rover görüntüleri listede yok | Perseverance ham görüntüleri listede var |
| Bilim durakları | Kil/sülfat katmanları, boxwork | Delta, karbonat, kil; güçlü |
| Rekabet | Az ekip | Rakiplerin çoğu burada |
| Arazi | Dik (%11,5'i >30°), koridorlar dar olabilir | Krater tabanı, muhtemelen daha düz (ölçülmedi) |

Özet: Jezero veride daha kolay ama projeyi ayıran iki şeyi (zemin modeli güveni, ölçülmüş radyasyon) zayıflatıyor. Gale çalıştığı sürece Gale.
