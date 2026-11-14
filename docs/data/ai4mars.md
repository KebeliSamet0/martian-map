# Veri analizi: AI4Mars (Hugging Face alt kümesi)

Analizi yapan: Emre · Tarih: 2026-11-14 11:45 · Makine: RTX 4070 Laptop (8 GB VRAM), 31 GB RAM

> Sayılar `ml/rover_terrain/data_analysis/ai4mars_stats.py` ile 16 parquet dosyasının tamamı taranarak hesaplandı (örnekleme yok, 18 130 train + 3×322 test).

## 1. Ne
- Ürün adı ve sürümü: AI4Mars — HF `hassanjbara/AI4MARS` (Kaggle aynası, kaynak sürüm "merged-0.1", yalnız MSL/Curiosity)
- Kaynak linki: https://huggingface.co/datasets/hassanjbara/AI4MARS · Orijinal: https://zenodo.org/records/15995036
- Lisans / kullanım şartı: Orijinal Zenodo CC BY 4.0 (atıf zorunlu). HF kartı CC0 yazıyor ama ayna olduğu için **CC BY 4.0'a göre davranıp Swan et al. 2021'e atıf veriyoruz.**

**HF ↔ Zenodo farkı**

| | HF (`hassanjbara/AI4MARS`) | Zenodo (v0.6, 2022-10-22) |
|---|---|---|
| Boyut | 6,5 GB (16 parquet) | 17,8 GB (merged 16,2 GB + unmerged etiketler 1,6 GB, zip) |
| Rover | Yalnız MSL / Curiosity | Curiosity + Opportunity + Spirit (MER) |
| Görüntü | 18 130 train + 3×322 test | ~50K |
| Etiket | Birleştirilmiş (merged) maskeler | Merged + etiketleyici bazında unmerged |
| Format | Parquet içinde JPG + PNG, `datasets` ile direkt yüklenir | Ham klasör yapısı (zip) |
| Lisans | Kartta CC0 | CC BY 4.0 |

Bizim ihtiyacımız Curiosity (Gale) olduğu için **HF alt kümesi yeterli**, Zenodo'yu indirmeye gerek yok.

## 2. Erişim
- Nasıl indirildi: `huggingface_hub.snapshot_download("hassanjbara/AI4MARS", repo_type="dataset", local_dir=...)` — login gerekmez (gated değil).
- Boyut: 6,47 GB (train 13 parça ≈ 6,2 GB, her test kümesi ≈ 108 MB). Tümünü kullanıyoruz.
- Format: Parquet; her satırda `image` (JPG), `label_mask`, `rover_mask`, `range_mask` (PNG, tek kanal), `has_labels`, `has_masks`. Dosya adı (`image.path`) korunuyor → kamera/sclk/sequence buradan okunabilir.
- Projeksiyon / koordinat sistemi: Yok — rover kamera görüntüsü (perspektif), harita değil.
- Çözünürlük: Tüm görüntüler **1024×1024, gri tonlama (L)**.

## 3. Kapsama
- Bölgemizi (Gale / Mount Sharp, boxwork) kapsıyor mu? **Kısmen** — hepsi Gale krateri içinde Curiosity görüntüleri, ama son görüntü 2019-11'de; boxwork bölgesi (2024+) bu sürümde **yok**, model oraya transfer edilecek.
- Kapsanan koordinat aralığı: Bilinmiyor (görüntü başına konum metadata'sı yok; PDS'den sclk ile eşlenebilir).
- Zaman aralığı: **2012-08-07 → 2019-11-07 (≈ sol 1 → 2579)**, medyan 2016-05 (≈ sol 1330). Dosya adındaki sclk'dan hesaplandı (18 127 görüntü).

## 4. İçerik

**Kamera:** Yalnız **Navcam** (çoğunlukla sol göz). Mastcam **yok**.

| Küme | Görüntü | NLB (sol, B) | NLA (sol, A) | NRB (sağ, B) | NRA (sağ, A) |
|---|---|---|---|---|---|
| train | 18 130 | 16 049 | 1 606 | 365 | 107 |
| test_min1/2/3 | 322 (her biri, aynı görüntüler) | 304 | 18 | 0 | 0 |

**Train satırlarının durumu:** **16 064 etiketli** · 1 741 etiketsiz · **322 satır = test görüntülerinin tamamının etiketsiz kopyası** · 3 bozuk satır (görüntü yerine `current.txt`, `edr_remain.txt`, `get_edr.txt` metin dosyası).
→ Eğitimde `has_labels == True` filtresi şart; bu filtreyle **test sızıntısı yok** (test görüntülerinin train'de etiketi bulunmuyor).

**Sınıf dağılımı (piksel):**

| Sınıf | Train: tüm piksel | Train: etiketli içinde | Test min3: etiketli içinde | Train: sınıfın geçtiği görüntü |
|---|---|---|---|---|
| 0 toprak | %20,7 | %37,2 | %51,4 | 7 929 |
| 1 ana kaya | %27,7 | **%49,8** | %22,4 | 10 354 |
| 2 kum | %6,7 | %12,0 | %26,2 | 5 399 |
| 3 büyük kaya | %0,5 | **%0,9** | %0,07 | 2 226 |
| 255 etiketsiz | %44,4 | — | — | — |

- **Dengesizlik ciddi:** büyük kaya etiketli piksellerin %1'inden az. Train ve test dağılımı da farklı (train'de ana kaya baskın, test'te toprak + kum).
- Etiketsiz pikseller: rover gövdesinin altı (%21,9) ve 30 m ötesi (%10,6) **zaten 255 olarak maskelenmiş** (bu bölgelerde 0–3 etiketi hiç yok).

**Hazır ayrım:** Var. `train` (crowdsourced, en az 3 etiketleyici, piksel başına 2/3 uzlaşı) + 3 test kümesi (aynı 322 görüntü; uzman/rover planlayıcı etiketleri, %100 uzlaşı; `min1/2/3` = en az 1/2/3 uzmanın etiketlediği piksel). Uzlaşı eşiği arttıkça etiketli alan azalıyor: etiketsiz oran min1 %42 → min2 %52 → min3 %65. **Validation kümesi yok** → train'den ayıracağız (rastgele değil, sclk/sequence'e göre gruplu, komşu karelerin sızmaması için).

- Örnek görseller: `docs/data/img/ai4mars_test_samples.png`, `docs/data/img/ai4mars_train_samples.png`

## 5. Kalite ve sorunlar
- **Train etiketleri kaba:** çoğu görüntüde tek sınıf neredeyse tüm kareyi boyuyor; sınırlar poligon ve keskin değil. Bir örnekte ana kaya etiketi rover tekerleğinin üstüne taşıyor (rover_mask tekerleği tam kapsamıyor).
- **Test etiketleri temiz ama seyrek:** küçük, emin olunan bölgeler etiketlenmiş, geri kalanı 255.
- Büyük kaya çok az ve test min3'te yalnız 5 görüntüde var → bu sınıfın IoU'su gürültülü olacak.
- 3 bozuk satır (metin dosyası), %11 etiketsiz satır (test kopyaları dahil) → filtrelenecek.
- 472 sağ Navcam görüntüsü var; sol/sağ stereo çiftleri aynı sahneyi gösterir → val ayrımında aynı sclk'lı kareler aynı tarafta tutulmalı.
- Gri tonlu Navcam; renk bilgisi yok (ImageNet ön eğitimi için kanal 3'e kopyalanacak).

## 6. Bizim için kullanımı
- Besler: **Model 1 — rover zemin sınıfı + belirsizlik** → `layers/rover_stops.json`.
- İşleme: `has_labels` filtresi; loss'ta `ignore_index=255`; 1024 → 512 yeniden boyut (veya 512 rastgele crop); gri → 3 kanal; sınıf ağırlıklı CE (veya CE + Dice) dengesizlik için; değerlendirme `test_min3` (asıl) + `test_min1` (raporda ek).
- Tahmini eğitim süresi (DeepLabv3+ ResNet34, 512², AMP, batch 8, ~16K etiketli görüntü): **~10–15 dk/epoch** (tahmin — 4070 Laptop ~25–30 görüntü/s ileri+geri varsayımı; PNG/JPG çözme darboğaz olabilir). 1024²'de ~4× (~45–60 dk/epoch). **Henüz ölçülmedi** — Kapı 1 duman testinde gerçek sayı `METRICS.md`'ye yazılacak.

## 7. Karar
**KULLAN** — Curiosity Navcam'den 16K+ etiketli, hazır uzman test kümeli, tek komutla inen temiz bir set; sınıflarımızla birebir aynı. Riskler (büyük kaya azlığı, kaba train etiketleri, boxwork bölgesinin olmaması) sunumda belirsizlik haritasıyla açıkça gösterilecek.
