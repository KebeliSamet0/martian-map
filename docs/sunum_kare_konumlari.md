# Ekran karelerinin oyun içi konumu

Sunumda / videoda kullanılan karelerin nerede çekildiği. Her kare için kanıt ve
yeniden üretme adımları var, böylece jüri "bu neresi?" diye sorduğunda cevap hazır.

---

## Kare: kask kamerası karşılaştırması, S1 (sol 4816)

Ekranda: solda simülasyon, ortada gerçek Navcam karesi, sürgüyle karşılaştırma.
Üstte "Off route (83 m) · R: return to route", sağda yaşam destek kutusu.

### Konum

| | |
|---|---|
| Görev | **S1** — Boxwork'ten Atacama sondajına |
| Curiosity durağı | **`msl_s120_d1546`** |
| Sol | **4816** |
| Izgara pikseli | **[498,2 · 574,9]** (2 m ızgara, px = [sütun, satır], sol üst köşe başlangıç) |
| Yaklaşık koordinat | **137,3819° D · −4,8075°** |
| Projeksiyon metresi | x ≈ 8 143 273 · y ≈ −284 965 (eqc, R = 3 396 190 m) |

### Bunun o durak olduğunun kanıtı

Aynı sol'u (4816) üç durak paylaşıyor. Ekrandaki **ZEMİN satırı** hangisi olduğunu tek başına belirliyor:

| Durak | kum | ana kaya | toprak | büyük kaya | model kesinliği |
|---|---|---|---|---|---|
| `msl_s120_d1450` | 4 % | 88 % | 7 % | 0 % | 88 % |
| `msl_s120_d1492` | 3 % | 77 % | 20 % | 0 % | 79 % |
| **`msl_s120_d1546`** | **8 %** | **57 %** | **35 %** | **0 %** | **72 %** |

Ekran görüntüsündeki satır: *"ZEMİN: kum 8 % · ana kaya 57 % · toprak 35 % · büyük kaya 0 % · model kesinliği 72 %"* — üçüncü satırla birebir aynı.

İkinci doğrulama: kesinlik = 1 − entropi. `msl_s120_d1546` entropisi **0,2792** → **%72**. Diğer iki durak %88 ve %79 veriyor, tutmuyor.

Kaynak: `sim/data/navcam_manifest.json` (128 durak; `class_frac` ve `entropy` Emre'nin zemin modelinden).

### Karedeki Navcam görüntüsü
Sol 4816, Curiosity Navcam. Ham görüntüler NASA/JPL-Caltech; durağın dosya listesi aynı manifestte (`files[]`, her birinde `mars.nasa.gov` ham görüntü adresi).

### Oyun durumu (kareden okunuyor)
- Hedefe kalan: **553 m**; oyuncu rotadan **83 m** sapmış (üstteki kırmızı bant).
- Yaşam destek: süre 00:04, oksijen **407 L** kaldı, enerji 64 kcal, doz 0,6 µGy, yük 10,0 kg, dönüş payı 319 dk. Durum **GO**.
- Görev listesinde hiçbir madde işaretli değil — kare yürüyüşün başında çekilmiş.
- RAD şeridi: 0,59 µGy (%1).

### Yeniden üretmek için
1. Açılış → **Görev seç** → **S1** → brifing → **Rotaları hesapla** → bir rota seç.
2. Rotadan ayrıl (W/A/S/D) ve `msl_s120_d1546` durağına yaklaş; bant "rotadan saptın" uyarısı verince doğru yöndesin.
3. Durağa yaklaşınca **C** ile kask kamerasını aç; karşılaştırma sürgüsü gelir (**V** geri döner, **◀ ▶** sürgüyü kaydırır, **▲▼** kare değiştirir).

---

## Not: koordinatın kesinliği

Enlem/boylam, `contracts/grid.json` içindeki `corners_latlon` köşelerinden doğrusal
ara değerle hesaplandı. Aynı dosyadaki `origin_xy_m` + projeksiyondan hesaplayınca
aynı **genişlik** çıkıyor (0,0337°) ama boylam **0,01° kayık** geliyor. Hangisinin
doğru olduğunu doğrulamadım; bu yüzden tabloda koordinat "yaklaşık" diye duruyor.

**Kesin olan ızgara pikselidir** (`[498,2 · 574,9]`) — oyun, planlayıcı ve katmanların
hepsi bu uzayda çalışıyor. Sunumda koordinat verilecekse ızgara pikseli ya da
"Gale Krateri, Mount Sharp kuzeybatısı, boxwork sırtları" gibi bölge adı daha güvenli.
