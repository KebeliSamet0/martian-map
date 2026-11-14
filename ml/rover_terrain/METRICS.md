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

## Kapı 2 — (yapılacak)
- Tam eğitim, test_min3 (asıl) + test_min1 sonuçları, sınıf bazlı IoU, kalibrasyon (ECE), MC Dropout belirsizliği.
