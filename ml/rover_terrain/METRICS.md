# Rover zemin modeli — metrikler (2026-11-14)

Model: DeepLabv3+ (ResNet34, ImageNet ön eğitimli), decoder çıkışında Dropout2d(0.1) · Veri: AI4MARS (HF, yalnız Curiosity Navcam) · Ağırlıklar yalnız eğitim makinesinde (`models/rover_terrain/`, git'e girmez).

## Ortam
- GPU: NVIDIA GeForce RTX 4070 **Laptop** (8 GB) · Python 3.11.18 · PyTorch 2.11.0+cu128 · smp 0.6.0 · albumentations 2.0.8
- Kurulum: `ml/rover_terrain/requirements.txt`

## Veri hazırlığı
`python ml/rover_terrain/prepare_data.py <parquet_dir> <prep_dir>` → 512×512 PNG + `index.json`
- Yalnız `has_labels=True` ve çözülebilen satırlar (3 bozuk + etiketsizler atıldı).
- **Train 14 453 · Val 1 611** (train'den %10, rover konumuna göre gruplu: 1 501 konumdan 133'ü val) · Test min1/min2/min3: 322'şer.

## Kapı 1 — 1 epoch duman testi (2026-11-14)
`python ml/rover_terrain/train.py <prep_dir> --epochs 1` · 512², batch 8, AdamW 3e-4 (OneCycle), AMP fp16, CE `ignore_index=255`, sınıf ağırlığı yok

| | Değer |
|---|---|
| Eğitim süresi (1 epoch, 1 806 adım) | **10,3 dk** (23,5 görüntü/s) |
| Val değerlendirme | 45 sn |
| Maks. GPU belleği | 2,2 GB |
| Train loss | 0,311 |

**Val (1 611 görüntü) — duman testi, nihai sonuç değil:**

| mIoU | Toprak | Ana kaya | Kum | Büyük kaya | Piksel doğruluğu |
|---|---|---|---|---|---|
| **0,761** | 0,923 | 0,922 | 0,833 | **0,368** | 0,951 |

Not: Test kümesine henüz dokunulmadı. Büyük kaya beklendiği gibi zayıf (etiketli piksellerin %0,9'u) → Kapı 2'de sınıf ağırlıklı loss.

## Kapı 2 — tam eğitim ve model kartı (2026-11-14)
`python ml/rover_terrain/train.py <prep_dir> --epochs 12 --class-weights --out models/rover_terrain/full`
- Sınıf ağırlıkları (etiketli piksel frekansının ters karekökü, ortalama 1): toprak 0,40 · ana kaya 0,34 · kum 0,70 · büyük kaya 2,56
- 12 epoch, ~10 dk/epoch (toplam ~2 sa), en iyi = son epoch (`full/best.pt`). **Katmanlarda kullanılan ağırlık bu.**

**Val (gönüllü etiketleri, 1 611 görüntü):**

| Model | mIoU | Toprak | Ana kaya | Kum | Büyük kaya |
|---|---|---|---|---|---|
| Kapı 1 (1 epoch, ağırlıksız) | 0,761 | 0,923 | 0,922 | 0,833 | 0,368 |
| **Kapı 2 (12 epoch, ağırlıklı)** | **0,832** | 0,939 | 0,933 | 0,870 | **0,588** |

**Test (uzman etiketleri, 322 görüntü; `eval_test.py`, ham sonuç `metrics_test.json`):**

| Model | Küme | mIoU | Toprak | Ana kaya | Kum | Büyük kaya IoU | Büyük kaya recall | Piksel doğr. | ECE |
|---|---|---|---|---|---|---|---|---|---|
| Kapı 1 | test_min3 | **0,824** | 0,974 | 0,945 | 0,957 | **0,421** | 0,750 | 0,981 | 0,014 |
| Kapı 2 | test_min3 | 0,798 | **0,984** | 0,942 | **0,974** | 0,294 | **0,973** | **0,985** | **0,004** |
| Kapı 1 | test_min1 | 0,664 | 0,905 | 0,809 | 0,849 | 0,094 | 0,294 | 0,923 | 0,021 |
| Kapı 2 | test_min1 | 0,669 | 0,914 | 0,802 | 0,868 | 0,092 | 0,590 | 0,923 | 0,049 |

min3 = üç uzmanın hemfikir olduğu pikseller (asıl ölçü); min1 = tek uzmanın etiketlediği pikseller de dahil (daha zor).

**Okuma:**
- Toprak, ana kaya ve kum Kapı 2'de biraz daha iyi; test_min3'te kalibrasyon da daha iyi (ECE 0,004).
- **Büyük kaya ödünleşimi:** Sınıf ağırlığı büyük kayayı **kaçırmayı** neredeyse bitirdi (test_min3 recall 0,75 → 0,97; ana kaya sanılan büyük kaya %15 → %0). Bedeli **yanlış alarm**: model büyük kaya olmayan yere de büyük kaya diyor, IoU 0,42 → 0,29 düştü. Bu yüzden test_min3 mIoU 0,824 → 0,798.
- Astronot için kaçırılan kaya, gereksiz bir sapmadan daha tehlikeli; bu yüzden katmanlarda Kapı 2 modeli kullanıldı. Kararı sunumda açıkça söyleyelim.
- Test kümesinde büyük kaya piksellerin yalnız %0,07'si; IoU bu az piksel yüzünden oynak.

**Bilinen zayıflıklar:**
- Büyük kaya: yanlış alarm (yukarıda). Ana kaya ↔ büyük kaya sınırı etiketçiler arasında da belirsiz.
- **Yeni bölgede kum kaçıyor:** 18 durağın elle kontrolünde kum görülen 7 duraktan yalnız 2'sinde model kum payını ≥ 0,2 verdi (`LAYERS.md`).
- Alan kayması: eğitim 2012–2019; 2025 boxwork bölgesi için uzman etiketi yok.

## Güven (entropy) doğrulaması (2026-11-15)
Piksel düzeyinde olasılıklar kalibre (test_min3 ECE 0,004). Ama **durak düzeyindeki entropy, elle kontrol edilen duraklarda tutan ve
tutmayan tahmini ayırt etmiyor**: 18 durakta tutanların ort. entropy'si 0,21, tutmayanlarınki 0,18; kum kaçıran 5 durak kumu yakalayan
2 duraktan daha emin (0,17 / 0,33). Ayrıntı: `SCAN_CHECK.md` son bölüm, betik `confidence_check.py`. Kum zayıflığının analizi: `SAND_ANALYSIS.md`.
