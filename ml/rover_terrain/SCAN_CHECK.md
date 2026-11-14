# Tarayıcı kanıtı: 6 durak (2026-11-14)

Issue #45, 2. madde. Her görselde soldan sağa:
1. Navcam karesi
2. Modelin segmentasyonu (gri = rover gövdesi ve 30 m ötesi, maskeli)
3. MC Dropout belirsizliği
4. Haritada durağın ±150 m çevresi; artı işareti durak, griye kayan hücre = belirsiz

Model: 12 epoch, sınıf ağırlıklı (`METRICS.md`). Katmanlar: PR #80 (128 durak).

"Göz" sütunu Emre'nin kareleri elle incelemesinden. Bu kesin bir yer gerçeği değil, ama bu bölge için uzman etiketi olmadığından elimizdeki tek bağımsız kontrol. Durak değeri, durağın tüm karelerinin ortalaması; görseldeki tek kare bundan farklı olabilir.

Üretim: `python ml/rover_terrain/scan_check.py <img_dir> --model models/rover_terrain/full/best.pt`

## Kumlu duraklar

### s120_d2366 (sol 4827): kısmen tuttu
![s120_d2366](../../docs/figures/scan_msl_s120_d2366.jpg)
- **Göz:** Rover izi kum ve çakıl. Bu karede ana kaya, kum ve toprak bir arada.
- **Model, bu kare:** toprak %81, ana kaya %18, kum %1.
- **Durak (4 kare):** toprak 0,54, kum 0,37. Kum rover izinin olduğu karelerden geliyor.
- **Harita hücresi:** toprak (entropy 0,41).
- **Sonuç:** Kumu durak düzeyinde yakaladı. Ama bu karedeki kumlu yüzeye "toprak" dedi; ana kaya şeridini doğru ayırdı.

### s120_d3056 (sol 4834): tutmadı
![s120_d3056](../../docs/figures/scan_msl_s120_d3056.jpg)
- **Göz:** Kum yoğun, büyük kaya var, ana kaya az.
- **Model, bu kare:** ana kaya %81, toprak %16, kum %1.
- **Durak:** ana kaya 0,63, kum 0,21.
- **Harita hücresi:** ana kaya (entropy 0,24).
- **Sonuç:** Kaya plakalarının arasındaki koyu, düz kumu ana kaya saydı. Hem baskın sınıf hem kum payı yanlış, üstelik model düşük belirsizlikle "emin". **Model nerede yanılıyor slaytı için en iyi örnek.**

## Ana kaya durakları

### s118_d0726 (sol 4625): tuttu
![s118_d0726](../../docs/figures/scan_msl_s118_d0726.jpg)
- **Göz:** Ana kaya çoğunlukta.
- **Model:** bu kare ana kaya %88. Durak ana kaya 0,92, entropy 0,12.
- **Harita hücresi:** ana kaya.
- **Sonuç:** Tuttu ve emin. 1 epoch'luk model burada toprak 0,57 demişti; tam eğitim düzeltti.

### s118_d2406 (sol 4653): tuttu
![s118_d2406](../../docs/figures/scan_msl_s118_d2406.jpg)
- **Göz:** Ana kaya yoğunluklu.
- **Model:** bu kare ana kaya %88. Durak ana kaya 0,86, entropy 0,18.
- **Harita hücresi:** ana kaya.
- **Sonuç:** Tuttu. Belirsizlik yalnız uzak ve ufka yakın şeritte yüksek. 1 epoch'luk model burada toprak 0,75 demişti.

## Modelin kararsız olduğu duraklar

### s118_d1608 (sol 4634): tutmadı (büyük kaya yanlış alarmı)
![s118_d1608](../../docs/figures/scan_msl_s118_d1608.jpg)
- **Göz:** Ana kaya yoğun, kum var.
- **Model, bu kare:** büyük kaya %58, ana kaya %36.
- **Durak:** ana kaya 0,49, büyük kaya 0,33, entropy 0,36.
- **Harita hücresi:** ana kaya.
- **Sonuç:** Koyu, dalgalı kaya çıkıntılarını büyük kaya saydı. Sınıf ağırlığının yan etkisi bu (test kümesindeki yanlış alarm bulgusu, `METRICS.md`). Kum da kaçtı. Belirsizlik ana kaya/büyük kaya sınırında yüksek; model burada kararsızlığını doğru gösteriyor.

### s120_d2690 (sol 4830): tuttu (kararsız)
![s120_d2690](../../docs/figures/scan_msl_s120_d2690.jpg)
- **Göz:** Ana kaya yoğun, uzakta toprak.
- **Model, bu kare:** ana kaya %70, toprak %30 (kenarlarda).
- **Durak:** ana kaya 0,56, toprak 0,44, entropy 0,42.
- **Harita hücresi:** ana kaya.
- **Sonuç:** Tuttu. Pürüzlü, açık tonlu yüzeyde belirsizlik geniş bir alanda orta düzeyde; "emin değilim" demesi yerinde.

## Özet
| Durak | Grup | Sonuç |
|---|---|---|
| s120_d2366 | kumlu | kısmen |
| s120_d3056 | kumlu | **tutmadı** |
| s118_d0726 | ana kaya | tuttu |
| s118_d2406 | ana kaya | tuttu |
| s118_d1608 | kararsız | **tutmadı** |
| s120_d2690 | kararsız | tuttu |

**Model nerede yanılıyor:**
1. **Kum, ana kaya ya da toprak sanılıyor.** Hem bu altı durakta hem 18 durağın elle kontrolünde (görülen 7 kumlu duraktan 2'si yakalandı; `LAYERS.md`).
2. **Dokulu kaya çıkıntıları büyük kaya sanılıyor.** Bu, sınıf ağırlığının bedeli.

Ana kayayı ise güvenilir biçimde tanıyor. Belirsizlik çoğunlukla gerçekten zor yerlerde yükseliyor. Tek istisna s120_d3056: orada model yanılırken de emin.

**Harita notu:** Harita hücresi en yakın durağın değerini alıyor (Voronoi). Kırpmalardaki keskin çokgen sınırlar bu yöntemden geliyor, arazinin gerçek sınırları değil.
