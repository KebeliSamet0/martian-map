# Zemin olasılık katmanları — nasıl üretildi (2026-11-14, kaba sürüm)

Issue #45. Çıktı: `layers/p_soil.npy`, `p_bedrock.npy`, `p_sand.npy`, `p_bigrock.npy`, `entropy.npy`
(float32, 1000×1000, `contracts/grid.json` ile hizalı, hücre başına toplam 1, NaN yok).

## Yöntem
1. **Model yalnız rover Navcam karelerine uygulandı, yörünge görüntüsüne değil.** AI4MARS yer seviyesinden
   Navcam ile eğitildi; HiRISE'a uygulamak alan dışı olurdu.
2. **18 durak** (`layers/rover_stops_selected.json`, Elif Rana) · 45 NLB Navcam karesi · sol 4580–4848.
3. **Maske:** `train_mask.py`, AI4MARS'ın kendi `rover_mask` + `range_mask` (>30 m) etiketleriyle eğitilmiş
   küçük U-Net (ResNet18, 256 px, 6 000 görüntü, 3 epoch). Val IoU: rover **0,93**, >30 m **0,80**.
   Zemin modeli eğitimde bu bölgeleri hiç görmedi; maskelenmezse rover gövdesine ve ufka sınıf uyduruyor.
   Duraklarda karelerin %68–99'u geçerli zemin kaldı.
4. **Zemin modeli:** DeepLabv3+ ResNet34, **Kapı 1'in 1 epoch modeli** (val mIoU 0,761). MC Dropout, 20 geçiş.
   - `class_frac` = geçerli piksellerde ortalama sınıf olasılığı (kareler piksel sayısıyla ağırlıklı)
   - `entropy` = tahmin entropisi / log 4, geçerli piksellerde ortalama (0 emin · 1 hiç emin değil)
   - Komut: `python ml/rover_terrain/infer_stops.py layers/rover_stops_selected.json <img_dir> --model <ckpt> --fig docs/figures/rover_terrain_stops.png`
5. **Haritaya yayma:** `pipeline/spread_terrain.py` (Elif Rana, PR #53). En yakın durak; 200 m'ye kadar tam güven,
   800 m'de eşit dağılıma kayar. `python pipeline/spread_terrain.py . layers/rover_stops_selected.json`

## Durak sonuçları (1 epoch model)
| Durak | toprak | ana kaya | kum | büyük kaya | entropy |
|---|---|---|---|---|---|
| s117_d0384 | 0,41 | 0,56 | 0,00 | 0,02 | 0,37 |
| s117_d1434 | 0,05 | 0,95 | 0,00 | 0,00 | 0,12 |
| s117_d1890 | 0,01 | 0,98 | 0,01 | 0,00 | 0,05 |
| s117_d2490 | 0,69 | 0,25 | 0,03 | 0,03 | 0,42 |
| s117_d3024 | 0,90 | 0,06 | 0,03 | 0,01 | 0,23 |
| s118_d0726 | 0,57 | 0,43 | 0,00 | 0,00 | 0,31 |
| s118_d1314 | 0,05 | 0,95 | 0,00 | 0,00 | 0,13 |
| s118_d1608 | 0,01 | 0,76 | 0,03 | 0,19 | 0,36 |
| s118_d2406 | 0,75 | 0,24 | 0,00 | 0,01 | 0,37 |
| s118_d3156 | 0,10 | 0,88 | 0,01 | 0,00 | 0,22 |
| s119_d0426 | 0,07 | 0,93 | 0,00 | 0,00 | 0,14 |
| s120_d1492 | 0,27 | 0,70 | 0,01 | 0,02 | 0,26 |
| s120_d2366 | 0,79 | 0,13 | 0,08 | 0,01 | 0,36 |
| s120_d2690 | 0,74 | 0,25 | 0,00 | 0,01 | 0,35 |
| s120_d3056 | 0,21 | 0,59 | 0,16 | 0,04 | 0,38 |
| s121_d0360 | 0,15 | 0,84 | 0,00 | 0,01 | 0,30 |
| s121_d0948 | 0,04 | 0,95 | 0,01 | 0,01 | 0,11 |
| s121_d1446 | 0,01 | 0,96 | 0,01 | 0,02 | 0,12 |

Harita: baskın sınıf ana kaya %84, toprak %16 hücre; ortalama entropy 0,72. Görsel: `docs/figures/rover_terrain_stops.png`.

## Sınırlar
- **Seyrek kanıt:** 18 nokta, 1 km² kutu. Hücrelerin en yakın durağa medyan uzaklığı 617 m (maks 1 336 m);
  kutunun çoğunda belirsizlik bu yüzden yüksek. Bu beklenen, dürüst sonuç.
- **Kum neredeyse hiç çıkmıyor** (en çok %16, s120_d3056). Boxwork bölgesi gerçekten kayalık olabilir, ama 1 epoch
  model kumu az da tahmin ediyor olabilir. Yerel kum için Bora'nın kum noktaları (#46) ve `/replan` gözlemleri esas.
- **Alan kayması:** Eğitim verisi 2012–2019; 2025 boxwork bölgesi eğitimde yok. Bu bölge için yer gerçeği etiketi yok,
  doğruluk ölçülemiyor; kareler elle gözden geçirilecek.
- Durak başına tek oran: durağın 30 m çevresindeki karışım, haritada 200 m'ye kadar tek değer olarak yayılır.
- Maske 30 m ötesini atar; uzak tepeler sayılmaz.

## Sonraki sürüm (yarın 11:00)
12 epoch sınıf ağırlıklı tam eğitim (büyük kaya ×2,56, kum ×0,70 göreli), test_min3 metrikleri ve ECE,
aynı komutlarla yeniden çıkarım.
