# Zemin olasılık katmanları — nasıl üretildi (2026-11-14, 128 durak)

Issue #45. Çıktı: `layers/p_soil.npy`, `p_bedrock.npy`, `p_sand.npy`, `p_bigrock.npy`, `entropy.npy`
(float32, 1000×1000, `contracts/grid.json` ile hizalı, hücre başına toplam 1, NaN yok).
Kaynak duraklar: `layers/rover_stops.json` (128 durak, Veysel), yalnız `class_frac` ve `entropy` alanları dolduruldu.

## Yöntem (2026-11-14)
1. **Model yalnız rover Navcam karelerine uygulandı, yörünge görüntüsüne değil.** AI4MARS yer seviyesinden Navcam ile
   eğitildi; HiRISE'a uygulamak alan dışı olurdu.
2. **128 durak · 391 NLB Navcam karesi** · sol 4580–4848. 1 kare NASA sunucusundan indirilemedi (403), atlandı.
3. **Maske:** `train_mask.py`. AI4MARS'ın kendi `rover_mask` + `range_mask` (>30 m) etiketleriyle eğitilmiş küçük U-Net
   (ResNet18, 256 px, 6 000 görüntü, 3 epoch). Val IoU: rover **0,93**, >30 m **0,80**. Zemin modeli eğitimde bu
   bölgeleri hiç görmedi; maskelenmezse rover gövdesine ve ufka sınıf uyduruyor. Duraklarda karelerin %67–99'u geçerli.
4. **Zemin modeli:** DeepLabv3+ ResNet34, 12 epoch, sınıf ağırlıklı (`full/best.pt`; model kartı `METRICS.md`).
   MC Dropout, 20 geçiş.
   - `class_frac` = geçerli piksellerde ortalama sınıf olasılığı (kareler piksel sayısıyla ağırlıklı)
   - `entropy` = tahmin entropisi / log 4, geçerli piksellerde ortalama (0 emin · 1 hiç emin değil)
5. **Haritaya yayma:** `pipeline/spread_terrain.py` (Elif Rana). En yakın durak; 200 m'ye kadar tam güven, 800 m'de
   eşit dağılıma kayar.

```
python ml/rover_terrain/infer_stops.py layers/rover_stops.json <img_dir> --model models/rover_terrain/full/best.pt --csv ml/rover_terrain/stops_128.csv
python pipeline/spread_terrain.py . layers/rover_stops.json
MARTIAN_LAYERS_DIR=. python ml/rover_terrain/layer_report.py      # aşağıdaki tablo
```
Durak başına sonuçlar: `ml/rover_terrain/stops_128.csv`.

## Önce / sonra (2026-11-14)
| | Önce (18 durak, 1 epoch) | Sonra (128 durak, 12 epoch) |
|---|---|---|
| "Bilinmiyor" hücre (entropy ≥ 0,6) | %67,6 | %64,6 |
| Ortalama entropy | 0,72 | 0,70 |
| Baskın sınıf: toprak / ana kaya / kum / büyük kaya | %16 / %84 / %0 / %0 | %24 / %76 / %0 / %0 |
| En yüksek `p_sand` | 0,23 | 0,41 |
| Kum payı ≥ 0,2 olan durak | 0 / 18 | 7 / 128 |
| S1 en kısa: km / dk / kcal | 0,55 / 18,1 / 85 | 0,55 / 18,4 / 87 |
| S1 dengeli | 0,57 / 18,3 / 86 | 0,57 / 18,7 / 88 |
| S1 en güvenli | 0,61 / 19,2 / 90 | 0,61 / 19,4 / 91 |

**Neden "bilinmiyor" çok az düştü:** 128 durak, 18 durakla **aynı rover güzergâhı boyunca** (px x 414–525, y 419–694).
Yeni duraklar kapsamı genişletmiyor, koridoru sıklaştırıyor: 200 m içindeki hücre oranı %10,4 → %10,6,
800 m içindeki %72,5 → %72,9. Düşüşün çoğu daha iyi modelin daha düşük durak entropisinden geliyor.
Kutunun güzergâhtan uzak kısmı için Navcam kanıtı yok; orada "bilinmiyor" dürüst cevap.

## Elle kontrol: 18 durak (2026-11-14, Emre)
Kareler gözle incelendi (rover gövdesi ve 30 m ötesi hariç), sonra modelin çıktısıyla karşılaştırıldı.
T = toprak, AK = ana kaya, K = kum, BK = büyük kaya.

| # | Durak | Göz (Emre) | Model (T / AK / K / BK, entropy) | Sonuç |
|---|---|---|---|---|
| 1 | s117_d0384 | AK yoğun, az BK, az T | 0,36 / 0,61 / 0,00 / 0,03 · 0,28 | Tuttu |
| 2 | s117_d1434 | AK çoğu, biraz T | 0,23 / 0,77 / 0,00 / 0,00 · 0,20 | Tuttu |
| 3 | s117_d1890 | AK baskın | 0,03 / 0,94 / 0,03 / 0,00 · 0,08 | Tuttu |
| 4 | s117_d2490 | T + AK | 0,71 / 0,25 / 0,03 / 0,00 · 0,38 | Tuttu |
| 5 | s117_d3024 | AK var, üstte kum, altta T | 0,98 / 0,01 / 0,01 / 0,00 · 0,06 | **Tutmadı** (AK ve kum kaçtı; üstteki kum 30 m ötesinde maskelenmiş olabilir) |
| 6 | s118_d0726 | AK çoğunluk | 0,08 / 0,92 / 0,00 / 0,00 · 0,12 | Tuttu (1 epoch model T demişti) |
| 7 | s118_d1314 | AK çoğunluk, arada T | 0,05 / 0,95 / 0,00 / 0,00 · 0,12 | Tuttu |
| 8 | s118_d1608 | AK yoğun + kum | 0,15 / 0,49 / 0,02 / 0,33 · 0,36 | Kısmen (AK doğru; kum kaçtı; BK 0,33 büyük olasılıkla yanlış alarm) |
| 9 | s118_d2406 | AK yoğun | 0,12 / 0,86 / 0,01 / 0,00 · 0,18 | Tuttu (1 epoch model T demişti) |
| 10 | s118_d3156 | AK | 0,03 / 0,97 / 0,00 / 0,00 · 0,07 | Tuttu |
| 11 | s119_d0426 | AK ağırlıklı + kum | 0,10 / 0,90 / 0,01 / 0,00 · 0,16 | Kısmen (kum kaçtı) |
| 12 | s120_d1492 | yakında kaya, uzakta T ve kum | 0,20 / 0,77 / 0,03 / 0,00 · 0,21 | Kısmen (kum kaçtı; uzak kısım maskelenmiş olabilir) |
| 13 | s120_d2366 | rover izi kum + çakıl; 3. karede AK, K, T | 0,54 / 0,09 / 0,37 / 0,00 · 0,41 | Tuttu (kum yakalandı) |
| 14 | s120_d2690 | AK yoğun, uzakta T | 0,44 / 0,56 / 0,00 / 0,00 · 0,42 | Tuttu (ama kararsız) |
| 15 | s120_d3056 | kum yoğun, BK var, az AK | 0,12 / 0,63 / 0,21 / 0,05 · 0,24 | **Tutmadı** (baskın sınıf yanlış; kum az tahmin) |
| 16 | s121_d0360 | yükselen kayalar + T | 0,10 / 0,89 / 0,00 / 0,00 · 0,22 | Tuttu |
| 17 | s121_d0948 | AK yoğun, ufak yükseltiler | 0,04 / 0,94 / 0,02 / 0,00 · 0,08 | Tuttu |
| 18 | s121_d1446 | AK, ara ara kum | 0,00 / 0,98 / 0,01 / 0,02 · 0,05 | Kısmen (kum kaçtı) |

**Özet:** Baskın sınıf 18 duraktan 16'sında tuttu. **Kum, görülen 7 duraktan yalnız 2'sinde yakalandı** (13, 15).
Model ana kayayı iyi tanıyor, kumu bu bölgede az tahmin ediyor. Planlayıcıda kum tüketimi bu yüzden olduğundan
düşük görünebilir; yerel kum için Bora'nın kum noktaları ve `/replan` gözlemleri esas. Değerlendirme küçük
paftalardan yapıldı, kesin yer gerçeği değil.

## Sınırlar
- Kanıt yalnız rover güzergâhında; kutunun çoğu en yakın durağa uzak (medyan 615 m, maks 1 336 m).
- Kum az tahmin ediliyor (yukarıda); büyük kayada yanlış alarm eğilimi var (`METRICS.md`).
- Alan kayması: eğitim 2012–2019; 2025 boxwork bölgesi için uzman etiketi yok.
- Durak başına tek oran: durağın 30 m çevresindeki karışım haritada 200 m'ye kadar tek değer olarak yayılır.
- `contracts/grid.json` içindeki `rover_stops` kaydı hâlâ 18 durağı (`rover_stops_selected.json`) gösteriyor; planlayıcının
  "kanıta uzaklık" hesabı onu kullanıyor. 128 durağa çevirmek grid.json sahibinin kararı.

## Kask kamerası maskeleri (`export_masks.py`)
- Ağırlık gelince tek komut: `python ml/rover_terrain/export_masks.py --model <best.pt> --mask-model <mask.pt>` (CUDA/MPS/CPU otomatik; model kurulumu `infer_stops.py` ile aynı).
- Girdi `sim/data/navcam_all/<durak>/<kare>.jpg`; çıktı `sim/data/navcam_masks/<durak>/<kare>.png` (RGBA sınıf haritası, gövde ve >30 m şeffaf, `helmetcam.js` bu yolu arar) ve `<kare>_unc.png` (MC Dropout belirsizliği, gri).
- Renkler: toprak `#b07a4a`, ana kaya `#8a8a8a`, kum `#e8c35a`, büyük kaya `#d0443a`.
- Kare başına sınıf oranları `navcam_masks/frame_fracs.csv`'ye yazılır; durak toplamı `stops_128.csv` ile karşılaştırılıp en büyük fark basılır (`--mask-model` verilmezse oranlar sapar).
- Deneme: `--random-init --limit-stops 1 --limit-frames 2 --out <geçici dizin>` (ağırlıksız biçim testi; çıktıyı commit'leme).
