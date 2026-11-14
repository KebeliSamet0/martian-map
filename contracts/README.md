# Veri sözleşmeleri

`grid.example.json` disk üzerindeki katman manifestini, `rover_stops.example.json`
rover kanıt girdilerini gösterir. API `/grid` yanıtı manifest yolları yerine
katman adlarını ve durakları içerir. Koordinatlar her yerde `[x,y]` =
`[sütun,satır]`, `(0,0)` sol üst; dizi indekslemesi `[y,x]`.

`route.example.json`, sentetik arazi üzerinde `[110,235]` başlangıcından üretilmiş
**gerçek API yanıt biçimidir**. Kısaltma amacıyla yalnız `balanced` rota tutuldu;
bu kısa yolun iki segmenti ve tüm yol noktaları korunmuştur. Normal `/route`
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
