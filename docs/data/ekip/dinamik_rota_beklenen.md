# Dinamik rota bağımsız beklenen değerler (#122) — UTF-8 (2026-11-15)

Kaynak HEAD `cc81ac3220677d4a59342542de1ab7be6f2c7b2c`; gerçek 1000×1000, 2 m grid, sentetik değil. `dynroute.js` eşikleri: sapma >15 m/5 s; dönüş önerisi kalan O₂ veya sürenin <%40 olması; dönüşü olmayan nokta dönüş O₂ ≥ kalan O₂’nin %80’i.

## S1/S2/S3 gerçek balanced rotaları

| Senaryo | O₂ limiti L | süre limiti dk | rota km | gidiş O₂ L | gidiş dk | O₂ <%40 ilk m | süre <%40 ilk m | dönüş ≥%80 ilk m |
|---|---:|---:|---:|---:|---:|---|---|---|
| S1 | 420 | 360 | 0.57 | 18.426 | 18.753 | tetiklenmedi | tetiklenmedi | tetiklenmedi |
| S2 | 420 | 360 | 0.58 | 18.755 | 19.014 | tetiklenmedi | tetiklenmedi | tetiklenmedi |
| S3 | 80 | 360 | 0.55 | 18.117 | 18.327 | tetiklenmedi | tetiklenmedi | tetiklenmedi |

S1/S2 varsayılan 420 L/360 dk; S3 80 L/360 dk. Gerçekleşen gidiş O₂ harcaması sırasıyla 18.426/18.755/18.117 L. Üç kısa rotada olayların hiçbiri tetiklenmedi.

## Sentetik sapma: S3 dengeli rota

Yaklaşık 199.62 m ilerideki rota hücresinden 19.70 m yana kayılmış sentetik oyuncu konumu üretildi; 5 saniye bekleme varsayıldı. Planlayıcıdan yeni rota ve eski rotaya katılma maliyeti hesaplandı.

| Ölçüm | metre | kcal | O₂ L | dakika |
|---|---:|---:|---:|---:|
| Yeni plan: sapmış px [461,619] → hedef | 350.0 | 51.240 | 10.675 | 10.967 |
| Eski rotaya katılma: sapmış px → rejoin → hedef | 370.0 | 55.339 | 11.529 | 11.792 |
| Delta: yeni − eski üzerinden | −20.0 | −4.099 | −0.854 | −0.825 |

Bu sentetik oyuncu girdisidir, gerçek telemetri değildir. Koordinat geçilebilir bir ızgara hücresine snap edildi. Sapma öneri delta’sı, dynroute içindeki yeni rota ile mevcut konumdan rejoin ve kalan eski rota toplamının farkıdır.

## Uzun S3 / 80 L rotası

Başlangıç [404,812], hedef [880,830], balanced rota uzunluğu 2220.1 m (yaklaşık 2.22 km). Gidiş tüketimi 97.490 L O₂ ve 94.884 dk.

| Olay | İlk metre (yaklaşık) |
|---|---:|
| Kalan O₂ <%40 (32 L) | 1349.6 |
| Kalan süre <%40 (216 dk) | tetiklenmedi |
| Dönüş O₂ ≥ kalan O₂ × %80 | 1064.5 |

Dönüş safest planı her 100 m checkpoint’te yeniden hesaplandı. İlk geçiş, iki checkpoint arasında interpolasyonla tahmin edildi. Uzun rotada gidiş tüketimi 80 L’yi aşıyor; bu rota tamamlanabilirlik veya GO garantisi değildir. Checkpoint’lerin tümü JSON’da yer alır.

## Ölçüm yöntemi ve kapsam

`budget.used` iki yön + bilim + rezerv taahhüdüdür; dinamik eşiklerde gerçekleşen gidiş tüketimi kullanıldı. Gerçek outbound harcaması dense profilin adım kcal ve saniyelerinin kümülatif toplamıdır; O₂ = kcal/4.8, süre = saniye/60. O₂ ve süre eşikleri her 25 m’de; dönüş karşılaştırması her 100 m’de `plan_one(kind="safest", budget=remaining)` ile örneklendi. Eşik metreleri bu çözünürlükte yaklaşık değerlerdir.

Sapma koşulu >15 m ve 5 saniyedir. Oyuncu konumu sentetik olarak bu koşulu karşıladı. Bu rapordaki hesaplar doğrudan Python `api.planner.plan_one` çağrılarıyla yapıldı; çok sayıda API isteği gönderilmedi.

Mars/Dünya kontrolü: Mars yerçekimi 3.71 m/s²; Dünya 9.81 m/s² yalnız referans/oran paydasıdır. Dakika ve saniye SI fiziksel zamandır, Mars solu/LMST değildir.

Kaynaklar: `sim/app/dynroute.js`, `api/planner/route.py`, `api/planner/cost.py`, `api/planner/params.py`, `layers/demo_scenarios.json`, `sim/data/missions.json`, `contracts/grid.json`.
