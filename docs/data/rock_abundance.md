# Veri analizi: HiRISE kaya tespiti / kaya yoğunluğu kaynakları

Analizi yapan: Bora · Tarih: 14 Kasım 2026 (Aşama 0)

## 1. Ne
- Ürün adı ve sürümü: USGS MSL Gale 25 cm ortofoto mozaiği (v3) — kaya tespiti için girdi. Karşılaştırılan hazır araçlar: MBARS (Hood et al. 2022), BoulderNet (Prieur et al. 2023).
- Kaynak linki:
  - Ortofoto: `https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/MSL_Gale_Orthophoto_Mosaic_25cm_v3.tif`
  - MBARS: https://github.com/dhood14/MBARS · makale DOI 10.1029/2022EA002410
  - BoulderNet: arXiv 2401.07528 · DOI 10.1029/2023JE008013
  - Golombek et al. (MSL iniş alanı seçimi, kaya yoğunluğu): Space Sci. Rev. 2012, DOI 10.1007/s11214-012-9892-2
- Lisans / kullanım şartı: Ortofoto NASA/USGS verisi (kamu malı). MBARS kodu **MIT**. BoulderNet için kod deposu **doğrulanamadı** (aşağıya bak).

## 2. Erişim
- Nasıl indirildi: `ml/orbital/fetch_crop.py` ile GDAL `/vsicurl/` üzerinden 23 GB'lık mozaiğin yalnız 1500×1500 px'lik kesiti okundu. Örnek: `python ml/orbital/fetch_crop.py --lat -4.80 --lon 137.38 --size 1500 --out data/raw/gale_test.tif`
- Boyut: mozaik ~23 GB; bizim kesit 1,6 MB (375 × 375 m).
- Format: GeoTIFF, 8 bit, tek bant (nodata = 0).
- Projeksiyon: Mars equirectangular (küre, R = 3396190 m, merkez meridyen 0).
- Çözünürlük: 0,25 m/piksel.

## 3. Kapsama
- Gale / Mount Sharp kapsıyor mu: **Evet** (MSL iniş alanı ve Mount Sharp alt yamaçları; mozaiğin tam sınırlarını kontrol etmedik, test kesiti bölge içinde).
- Test koordinatı: 4,80°G, 137,38°D çevresi.
- Zaman aralığı: bilinmiyor (mozaik birden fazla HiRISE görüntüsünden oluşuyor).

## 4. İçerik
- Bant: tek bant gri tonlama parlaklık (8 bit).
- Gölge tabanlı tespit sonucu (test kesiti, 140.623 m²): **360 kaya adayı; ≥1 m: 132; ≥1,5 m: 87**. Medyan çap 0,78 m, maksimum 9,44 m (büyük olanlar çoğunlukla kaya değil, tepecik/yamaç gölgesi olabilir). **CFA ≈ %0,65**.
- Örnek görsel: `docs/data/img/rock_abundance_detection.png` (kırmızı daireler = ≥1 m adaylar). Tam liste: `docs/data/img/rock_abundance_rocks.csv`.

## 5. Kalite ve sorunlar
- **Çözünürlük sınırı:** HiRISE 25 cm/px ile ancak ~1–1,5 m ve üstü kayalar güvenle görülür. Daha küçük kayalar (rover'a asıl engel olanlar) bu yöntemle görünmez; Golombek yaklaşımı küçükleri üstel dağılım modeliyle tahmin eder, biz bunu yapmıyoruz → CFA **alt sınırdır**.
- **Yanlış pozitifler:** Kum dalgası, tepecik ve yamaç gölgeleri de koyu blob olarak yakalanıyor. Basit eni/boyu filtresi var ama kusursuz değil.
- **Mozaik:** Birden fazla görüntüden birleştiği için güneş yönü her yerde aynı olmayabilir. Kesit başına ayrı tahmin gerekir.
- **Güneş azimutu:** Mozaik GeoTIFF'inde metadata etiketi yok (`tags()` boş), ayrıca `.xml` etiketi aynı adresten 404 döndü. Doğru değer kaynak HiRISE görüntülerinin etiketindeki `SUB_SOLAR_AZIMUTH` / `INCIDENCE_ANGLE` alanlarından okunmalı. Şimdilik **görüntüden tahmin** ediyoruz: gölge yönü ≈ 45° (sağdan saat yönü). Geliş açısı varsayılan 40° (**doğrulanmadı**).
- **Elle doğrulama yapılmadı:** 20–30 kayanın elle sayımı Kapı 2'de `ml/orbital/VALIDATION.md` içinde yapılacak.

## 6. Bizim için kullanımı
- Besler: `layers/rock_cfa.npy` (hücre başına kaya alan oranı) → maliyet haritası.
- İşleme: Elif Rana'nın ızgarasına göre kesit al → `shadow_rocks.py` ile tespit → hücre başına Σ(π·r²)/hücre alanı.
- Süre: 1500×1500 px kesit birkaç saniye (CPU). 2×2 km (8000×8000 px) için blok blok çalıştırmak gerekir, tahmin birkaç dakika.

### Araç karşılaştırması
| Seçenek | Durum | Not |
|---|---|---|
| Hazır Gale kaya haritası (Golombek) | **Bulunamadı** | İniş alanı çalışmalarında HiRISE'den büyük kayalar sayılmış ve modelle ekstrapole edilmiş; indirilebilir raster/link bulamadık → **bilinmiyor** |
| MBARS | Erişilebilir | MIT lisanslı, Python; gölge tabanlı, HiRISE için tasarlanmış; son commit Mayıs 2023. Kurulum/denemesini yapmadık |
| BoulderNet | Belirsiz | Mask R-CNN, 33.000+ kaya ile eğitilmiş (Dünya/Ay/Mars); **kod/ağırlık linkini doğrulayamadık**. Arama sonucunda çıkan GitHub depoları makaleyle ilişkili görünmüyor |
| Kendi klasik yöntemimiz | **Çalışıyor** | `ml/orbital/shadow_rocks.py`, ek bağımlılık yok |

## 7. Karar
**KULLAN (kendi klasik yöntemimiz) / B PLANI: MBARS.** Gölge tabanlı yöntem kesitte makul sonuç veriyor ve hemen çalışıyor; hazır harita bulunamadı. Zaman kalırsa MBARS ile karşılaştırılacak (aynı yöntem ailesi, MIT lisans). BoulderNet erişimi doğrulanana kadar plana girmiyor. CFA'yı "≥1 m kayalar için alt sınır" diye belgeleyeceğiz.
