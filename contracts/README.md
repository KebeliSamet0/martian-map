# Veri sözleşmeleri

`grid.example.json` disk üzerindeki katman manifestini, `rover_stops.example.json`
rover kanıt girdilerini gösterir. API `/grid` yanıtı manifest yolları yerine
katman adlarını ve durakları içerir. Koordinatlar her yerde `[x,y]` =
`[sütun,satır]`, `(0,0)` sol üst; dizi indekslemesi `[y,x]`.

`route.example.json`, sentetik arazi üzerinde `[110,235]` başlangıcından üretilmiş
**gerçek API yanıt biçimidir**. Kısaltma amacıyla yalnız `balanced` rota tutuldu;
bu kısa yolun tüm segmentleri ve yol noktaları korunmuştur. Normal `/route`
ve `/replan` yanıtlarında üç rota bulunur.

| Alan | Anlam |
|---|---|
| `grid.region` | Bölge etiketi |
| `grid.width`, `grid.height` | Piksel sütun/satır sayısı |
| `grid.res_m` | Piksel kenarı, metre |
| `grid.synthetic` | Sentetik veri kullanılıyor mu? |
| `grid.px_note` | Koordinat düzeni açıklaması |
| `routes` | Rota listesi: shortest, balanced, safest |
| `kind`, `label` | Makine kimliği ve Türkçe ön ayar etiketi |
| `weights.t`, `.k`, `.r` | Metre başına süre (s), enerji (kcal), risk terimlerinin katsayıları |
| `start.px`, `goal.px` | Tam sayı başlangıç/hedef koordinatları |
| `total` | Rota ve EVA özeti (aşağıda) |
| `segments` | Yol sırasındaki açıklamalı segmentler |

`shortest` süreyi optimize eder. `safest` ağırlıklı risk maliyetini azaltır;
mutlak güvenlik garantisi değildir. Ağırlık verilirse yalnız `balanced` değişir.

| `total` alanı | Anlam / birim |
|---|---|
| `km` | Tek yön uzunluk, km (2 ondalık) |
| `min`, `kcal` | Tek yön yürüyüş süresi (dk, 1 ondalık) ve enerji (tam kcal) |
| `eva_min` | Aynı yoldan dönüş dahil yürüyüş + bilim durağı, dk |
| `eva_limit_min` | EVA süre sınırı, dk |
| `eva_kcal` | Gidiş-dönüş yürüyüş enerjisi; durak metabolizması dahil değil |
| `o2_L` | Gidiş-dönüş enerjisinden türetilmiş O₂ tahmini, litre |
| `dose_uGy` | EVA süresi boyunca tahmini doz, µGy |
| `slope_max` | Yol boyunca en yüksek eğim, derece |
| `low_conf_m` | Düşük güvenli sayılan segmentlerin toplam uzunluğu, m |
| `walkback_ok` | Gidiş + dönüş + bilim durağı + yedek süre limite sığıyor mu? |
| `limit_exceeded_at_m` | Bütçenin ilk aşıldığı gidiş mesafesi, m; aşılmıyorsa null |
| `go` | Dönüş bütçesi ve geçilmez eğim kontrolü sonucu |

| Segment alanı | Anlam / birim |
|---|---|
| `id` | Rota içinde 1'den başlayan sıra |
| `path_px` | Segmentin tüm `[x,y]` yol noktaları; komşu segmentler sınır noktasını paylaşır |
| `len_m` | Segment uzunluğu, m (1 ondalık) |
| `slope_max`, `slope_mean` | En yüksek/ortalama eğim, derece |
| `class` | Baskın sınıf: soil, bedrock, sand, bigrock |
| `p_sand`, `p_bigrock` | Ortalama sınıf olasılıkları, 0–1 |
| `rock_cfa` | Kayaların kapladığı ortalama alan oranı, 0–1 |
| `entropy` | Normalize ortalama model belirsizliği, 0–1 |
| `conf` | high / mid / low; entropi sınırları 0.35 ve 0.60 |
| `nearest_evidence_m` | Segment boyunca en yakın rover kanıt mesafesi, m; kanıt yoksa null |
| `kcal`, `min` | Segment enerjisi ve süresi, 1 ondalık |
| `risk` | Metre boyunca toplanan göreli risk; olasılık değil |
| `reason` | Zemin/eğim/enerji/güven açıklaması, Türkçe |
| `rejected_alt` | Alternatif ayrılmasının gerçekten daha kötü terimleri; yoksa null |

Alternatifler 40 m'den fazla ayrıldığında karşılaştırılır. Hem mutlak süre farkı
1 dk'dan küçük hem enerji farkı 5 kcal'den küçükse açıklama yazılmaz. Daha iyi
veya eşit bir terim dezavantaj diye sunulmaz. Açıklama bir güvenlik kanıtı değildir.
Yuvarlama nedeniyle segment toplamıyla `total.km * 1000` arasında en fazla
`5 + 0.05 * segment_sayısı` metre fark beklenir; enerji/süre toplamları da
ayrı yuvarlanır. Dahili NumPy `_path` ve `_prof` alanları API'ye çıkmaz.

PNG/BIN biçimleri ve istek örnekleri: [API README](../api/README.md).

## Kapı 2 ekleri (2026-11-14)

Mevcut alanlar korunur. Segmentler sınıf/eğim bandı değişiminde veya 100 m'ye
ulaşan ilk hücrede bölünür (en çok bir adım taşması); kısa parçalar birleştirilmez.
Sınır noktası paylaşılır; her kenarın süre/kcal/risk değeri yalnız bir kez sayılır.

`/route` ve `/replan` isteğinde isteğe bağlı `budget` nesnesi:
`{"time_min":360,"kcal":2000,"o2_L":420,"dose_uGy":60,"reserve_min":30}`.
Eksik anahtarlar varsayılanı kullanır; sonlu, sıfır veya pozitif değer gerekir.
Bu limitler doğrulanmış insan güvenlik eşikleri değil, görev planlama varsayımlarıdır.

| Yeni `total` alanı | Anlam |
|---|---|
| `status` | `GO` veya `NO-GO`; `go` boolean ile aynı karar |
| `limit_exceeded_at_px` | İlk bütçe aşımının `[x,y]` hücresi; yoksa null |
| `limit_exceeded_at_index` | Birleştirilmiş, sınırları tekilleştirilmiş yolun 0 tabanlı indeksi |
| `budget.limits` | Uygulanan dört limit ve `reserve_min` |
| `budget.used` | Dönüş, 30 dk bilim durağı ve yedek dahil süre/kcal/O₂/doz |
| `budget.exceeded` | Hedefte aşılan limitlerin adları |
| `budget.first_exceeded` | İlk aşım noktasında aşılan limitlerin adları |
| `budget.return_min`, `return_kcal` | Aynı yoldan eve dönüş için ayrılan yürüyüş tüketimi |

`limit_exceeded_at_m` artık herhangi bir bütçenin ilk aşım mesafesidir.
Eşitlik geçerlidir; yalnız `>` aşım sayılır. Başlangıçta durak/yedek bile
sığmıyorsa ilk nokta `[start]`, indeks ve mesafe 0 olur. `walkback_ok` eskisi gibi
süre kontrolüdür; `go` ayrıca kcal/O₂/doz kontrolünü içerir. Eski `eva_min`,
`eva_kcal`, `o2_L`, `dose_uGy` alanlarının tüketim kapsamı korunur.
Yeni `budget.used` tüm durak/yedek tüketimini de içerir: bunların metabolizması
`STOP_METABOLIC_W` varsayımıyla hesaplanır. Doz yalnız süre × yüzey doz hızıdır;
hücre maliyetinde/riskte radyasyon terimi yoktur. Doz µGy, eşdeğer doz µSv değildir.

### Gerçek katman paketi

`MARTIAN_LAYERS_DIR` (öncelikli) veya eski `MM_LAYERS_DIR`, içinde `grid.json`
bulunan klasörü gösterir. İkisi de yoksa sentetik veri üretilir. Açıkça seçilmiş
paket hatalı/eksikse başlangıç Türkçe hata ile durur; sentetiğe dönmez.
`grid.example.json` örnek manifesttir; dosya adları manifest klasörüne görelidir.
Sekiz sayısal katmanın tümü mevcut olduğunda doğrudan yüklenir (`elevation`,
`slope`, `rock_cfa` her zaman zorunludur). Zemin model çıktıları (`p_soil`,
`p_bedrock`, `p_sand`, `p_bigrock`, `entropy`) henüz üretilmemişse ve beşinin
tamamı eksikse, yükleyici bunları `slope` + `rock_cfa` üzerinden bellekte
geçici kuralla türetir (`entropy >= 0.75`, düşük güven) ve `/grid` yanıtında
`provisional_terrain: true`, `terrain_note: "geçici zemin katmanı (model çıktısı değil)"`
döndürür; aynı ibare `/assumptions` ve segment `reason` açıklamalarında da yer alır.
Zemin dosyalarının yalnız bir kısmı mevcutsa kısmi paket Türkçe `LayerError` ile
reddedilir; tamamı mevcut olduğunda geçici dolgu devre dışı kalır ve gerçek
dosyalar kullanılır. Şekil `(height,width)`, değerler sonlu,
olasılıkların toplamı hücre başına 1 (tolerans 0.001) olmalıdır.
NaN/Inf ve manifestteki `nodata` değeri reddedilir; önce doldurun veya kırpın.
`res_m` pozitif sonlu metre, `origin_xy_m` iki sonlu sayı, `crs` veya eski
`crs_note` dolu metrik projeksiyon tanımı gerekir; `units` verilirse `m` olmalı.
NPY kendi CRS'sini taşımaz; metadata doğrulaması manifest beyanına dayanır,
yeniden projeksiyon yapılmaz. Katman değeri bir dosya yolu veya
`{"path":"slope.npy","crs":"LOCAL:MARS_METRIC","res_m":2,"nodata":-9999}`
nesnesi olabilir. Katman nesnesinde CRS/çözünürlük/origin verilirse grid ile aynı
olmalıdır. Eski örnekteki çift boşluk sonrası açıklama yazıları da kabul edilir.

### Mount Sharp karşılaştırması

`api.planner.comparison.compare_reference(layers, route_px, reference_px)` aynı
ızgarada `[x,y]` hücre listesi veya seyrek polyline alır. Seyrek çizgiler
hücrelere örneklenir. Bizim rota tam sayı olmalı ve geçilmez hücreden geçemez;
referans (gerçekte sürülmüş yol, ör. `layers/msl_proposed_path.json` → `path_px`)
ondalıklı olabilir (hücre = floor) ve DEM'in geçilmez gösterdiği hücreler kabul edilir. `mean_deviation_m`
iki yönlü nokta→polyline mesafelerinin birleşik aritmetik ortalaması,
`max_deviation_m` maksimumudur (sürekli Hausdorff değil, örneklenmiş metrik).
`delta_min`, `delta_kcal` bizim rota eksi referans, aynı modelde tek yön farkıdır;
`route` ve `reference` ham min/kcal toplamları da döner.

## Simülasyon API ekleri (issue #51)

### 1. Türetilmiş maliyet ve tarayıcı sınıfı katmanları (`/layers/{name}.bin|png`)
`/grid` yanıtındaki `aux_layers` listesi şu katmanları içerir:
- `reachable`: erişilebilirlik maskesi (`1.0` ana bileşen, `0.35` izole ada, `0.0` NOGO)
- `speed_mps`: hücrede yürüme hızı (m/s, `cost.speed_ms`)
- `kcal_per_m`: metre başına metabolik enerji (kcal/m, `cost.kcal_per_m`)
- `o2_l_per_m` ve `o2_g_per_m`: metre başına O₂ tüketimi (litre/m ve gram/m; `1 L O₂ = 4.8 kcal`, `1 L O₂ = 1.429 g`)
- `risk`: metre başına birleşik risk (`0–1`, `cost.risk_per_m`)
- `scan_class`: arazi tarayıcı sınıfı (`0`: güvenli, `1`: dikkat, `2`: geçilmez, `3`: bilinmiyor; `.bin` varsayılan `<f4`, isteğe bağlı `?dtype=uint8`; `.png` lejant renklerinde RGBA)

Hücre maliyet katmanlarında yürüyüş yönü bilinmediğinden hücre eğim büyüklüğü (`|slope|`) ile çıkış yönsüz özet olarak kullanılır. `scan_class` öncelik sırası (`params.py` ve `/assumptions`):
1. `2` (geçilmez): `slope >= 25°` veya (`p_sand >= 0.55` ve `slope >= 12°`)
2. `3` (bilinmiyor): `entropy >= 0.60`
3. `1` (dikkat): `slope >= 15°` veya `p_sand >= 0.40` veya `rock_cfa >= 0.15`
4. `0` (güvenli): aksi durum.
`/grid` yanıtındaki `scan_legend` alanı her sınıf için `{code, key, name, color, rgb}` döner.

### 2. Yürüyüş adımı tüketimi (`POST /step` ve `POST /consume`)
İstek:
```json
{"path": [[433, 525], [434, 526], [435, 527]], "load_kg": 5.0, "observations": [{"px": [434, 526], "radius_m": 20.0, "cls": "sand"}]}
```
Yanıt (özet):
```json
{
  "distance_m": 5.66, "km": 0.0057, "duration_s": 10.42, "sec": 10.42, "min": 0.17,
  "kcal": 0.68, "o2_L": 0.142, "o2_g": 0.2, "dose_uGy": 0.025, "risk": 0.74,
  "load_kg": 5.0, "slope_max": 11.2, "slope_mean": 9.8, "ascent_m": 0.4, "descent_m": 0.1,
  "directional": {"duration_s": 9.85, "kcal": 0.64, "o2_L": 0.133, "o2_g": 0.19},
  "dominant_class": "sand",
  "terrain_classes": {"sand": {"cells": 3, "distance_m": 5.66, "pct": 100.0}},
  "scan_classes": {"caution": {"code": 1, "name": "dikkat", "cells": 3, "distance_m": 5.66, "pct": 100.0}},
  "cells": [{"px": [433, 525], "class": "sand", "scan_class": 1, "scan_key": "caution", "scan_name": "dikkat", "slope_deg": 11.2, "step_m": 0.0, "sec": 0.0, "kcal": 0.0}]
}
```
