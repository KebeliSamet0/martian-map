# Tam duyarlılık analizi — HEAD 0b53eb30a6662a0fe4874734ea7b6dfdec66c07b (2026-11-15)

**Ölçülen HEAD SHA: `0b53eb30a6662a0fe4874734ea7b6dfdec66c07b`.** Kaynak: `C:\Users\Batu\Desktop\mm-pr\main-wt`; yalnız okunarak `C:\Users\Batu\AppData\Local\Temp\mm-full-sensitivity\repo` altına kopyalandı. Uzak ağa erişilmedi. HEAD etiketi yanında gerçek çalışma dosyalarının SHA-256 izleri verildi; çalışma dosyalarının Git nesneleriyle birebir eşitliği ayrıca test edilmedi.

**Sonuç:** 52 farklı rota/bütçe koşusu tamamlandı. A tekrarındaki 13 koşul birebir aynı JSON verdi. İstenen A/B üç ön ayar (18 koşul) ve B tabanlı D±%20 balanced (6 koşul) tamamdır. Tek değişken enerji duyarlılığı sırası **352 W > hız > η > kütle seti**. S1/S3 eski A çıktılarıyla aynı; S2 uç noktaları değiştiği için sonuç/yol değişti. Eski S2 uçları güncel kodda eski sonucu/yolu birebir verir. İnsan Mars EVA güvenliği **doğrulanmadı**.

## Kaynaklar ve yöntem (2026-11-15)

[api/planner/params.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/params.py), [api/planner/cost.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/cost.py), [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/route.py), [api/planner/layers.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/layers.py), [api/planner/terrain.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/terrain.py), [layers/demo_scenarios.json](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/layers/demo_scenarios.json), [sim/data/missions.json](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/sim/data/missions.json), [contracts/grid.json](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/contracts/grid.json), [docs/metabolic_model.md](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/docs/metabolic_model.md)

Geçmiş raporlar: [S1](duyarlilik_analizi.md), [S2/S3](duyarlilik_analizi_s2_s3.md). Kaynak kayıtları: [calisan2.md](kaynaklar/calisan2.md). Öncekiler değiştirilmedi. Yalnız bu rapor ve kullanıcının sonradan istediği eklemeli kaynak defteri yazıldı.

api/, layers/, contracts/, sim/data/missions.json TEMP’e kopyalandı. `params.py` gerçek zemin tablosunu belgede aradığı için ayrıca yalnız `docs/metabolic_model.md` alındı. Her set ayrı `python -B -c` sürecinde, yalnız bellekte parametre geçersiz kılma ve `importlib.reload(cost)` ile koşuldu; böylece import anındaki kalibrasyon yenilendi. `planner.plan_one` çağrıldı; sunucu/paket kurulmadı. Gerçek grid ve TEMP içinden import test edildi. `MARTIAN_ROCK_BLOCK=0`, max_slope_deg=None, ek numune yükü=0, gözlem/replan yok. mission sample_kg ile TOOLS_KG ayrı kavramlardır; sample_kg ayrıca uygulanmadı. Kaynak: yukarıdaki planner kodu.

## Parametre setleri (2026-11-15)

| Set | Vücut/skafandr/ekipman kg | Hız m/s | EVA sa | kcal limiti | O₂ limiti L | Düz W | η çarpanı |
| --- | --- | --- | --- | --- | --- | --- | --- |
| A | 80.0/120.0/10.0 | 0.8 | 6.0 | 2000.0 | 420.0 | 272.0 | 1 |
| B | 82.0/104.0/23.0 | 0.75 | 7.0 | 1800.0 | 370.0 | 272.0 | 1 |
| C | 82.0/104.0/23.0 | 0.75 | 7.0 | 1800.0 | 370.0 | 352.0 | 1 |
| Dminus | 82.0/104.0/23.0 | 0.75 | 7.0 | 1800.0 | 370.0 | 272.0 | 0.8 |
| Dplus | 82.0/104.0/23.0 | 0.75 | 7.0 | 1800.0 | 370.0 | 272.0 | 1.2 |

Tüm setlerde STOP_METABOLIC_W=272 W; bilim=30 dk, rezerv=30 dk, doz=8.75 µGy/fiziksel saat, doz limiti=60 µGy. C/Power yalnız FLAT_REFERENCE_W’yi 352 W yapar; durak gücünü değiştirmez. Önceki raporlarla aynı açık varsayımdır. D tüm sınıfların η değerini birlikte çarpar; hız katsayıları sabittir. Kaynak: [api/planner/params.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/params.py) ve [api/planner/terrain.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/terrain.py).

| Sınıf | A/B η | Dminus η | Dplus η |
| --- | --- | --- | --- |
| bedrock | 1.0 | 0.8 | 1.2 |
| soil | 1.2 | 0.96 | 1.44 |
| sand | 2.1 | 1.6800000000000002 | 2.52 |
| bigrock | 1.5 | 1.2000000000000002 | 1.7999999999999998 |

**Alan kapsamları:** km/dk/kcal tek yön yürüyüş; O₂ iki yön yürüyüş; dose iki yön yürüyüş+bilim. Karar bütçesi iki yön yürüyüş+bilim+rezervi içerir. `walkback_ok` yalnız zaman kontrolüdür. Kaynak: [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/route.py) `_budget`.

## A/B — üç ön ayar (2026-11-15)

| Senaryo | Set | Ön ayar | km | dk | kcal | O₂ L | doz µGy | durum | walkback_ok | Rota hücre SHA-256 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | A | shortest | 0.55 | 18.4 | 87.0 | 36.0 | 9.7 | GO | True | `fc8f9adf2931b73de1a77ad088d573a9601aa9d2f9fae1da81e334178006a785` |
| S1 | A | balanced | 0.57 | 18.7 | 88.0 | 37.0 | 9.8 | GO | True | `3568cbe78d807ac9b8ad824fd7519790be68b68a02b8a68cc1d774318c3c46e7` |
| S1 | A | safest | 0.61 | 19.4 | 91.0 | 38.0 | 10.0 | GO | True | `35ba8d7cabe28b707b3c43ce9ab5ebd8e949eab85fdba9a2ca40be93ee05c315` |
| S1 | B | shortest | 0.55 | 19.6 | 93.0 | 39.0 | 10.1 | GO | True | `fc8f9adf2931b73de1a77ad088d573a9601aa9d2f9fae1da81e334178006a785` |
| S1 | B | balanced | 0.57 | 19.9 | 94.0 | 39.0 | 10.2 | GO | True | `3568cbe78d807ac9b8ad824fd7519790be68b68a02b8a68cc1d774318c3c46e7` |
| S1 | B | safest | 0.61 | 20.7 | 97.0 | 41.0 | 10.4 | GO | True | `35ba8d7cabe28b707b3c43ce9ab5ebd8e949eab85fdba9a2ca40be93ee05c315` |
| S2 | A | shortest | 0.55 | 18.5 | 88.0 | 37.0 | 9.8 | GO | True | `e70df2bd04722d4912bb69192bb7ba89c8ca7fa66f621041b8aa30dd92c6c1ae` |
| S2 | A | balanced | 0.58 | 19.0 | 90.0 | 37.0 | 9.9 | GO | True | `27211c5fe007a4ab149e152dff2424ffff92240a4da43124109543f17e5d9e8e` |
| S2 | A | safest | 0.64 | 20.1 | 94.0 | 39.0 | 10.2 | GO | True | `65f59a838ae1f41c17a0d65a84cad75a3c2e3fdd4937987cfbad8f2569bfbb2a` |
| S2 | B | shortest | 0.55 | 19.8 | 94.0 | 39.0 | 10.1 | GO | True | `e70df2bd04722d4912bb69192bb7ba89c8ca7fa66f621041b8aa30dd92c6c1ae` |
| S2 | B | balanced | 0.58 | 20.2 | 96.0 | 40.0 | 10.3 | GO | True | `27211c5fe007a4ab149e152dff2424ffff92240a4da43124109543f17e5d9e8e` |
| S2 | B | safest | 0.64 | 21.4 | 101.0 | 42.0 | 10.6 | GO | True | `65f59a838ae1f41c17a0d65a84cad75a3c2e3fdd4937987cfbad8f2569bfbb2a` |
| S3 | A | shortest | 0.53 | 17.6 | 84.0 | 35.0 | 9.5 | GO | True | `8534bfaa6de24b5c16a1fceeb611ec3d97684483e81d5d2f48721b56e81657ae` |
| S3 | A | balanced | 0.55 | 18.0 | 85.0 | 35.0 | 9.6 | GO | True | `f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4` |
| S3 | A | safest | 0.58 | 18.5 | 87.0 | 36.0 | 9.8 | GO | True | `768f58627e2d13990ce08a9aed8bbd573c4a8112759f0902a46432c3a2bb2b3e` |
| S3 | B | shortest | 0.53 | 18.8 | 90.0 | 37.0 | 9.9 | GO | True | `8534bfaa6de24b5c16a1fceeb611ec3d97684483e81d5d2f48721b56e81657ae` |
| S3 | B | balanced | 0.55 | 19.2 | 91.0 | 38.0 | 10.0 | GO | True | `f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4` |
| S3 | B | safest | 0.58 | 19.7 | 93.0 | 39.0 | 10.1 | GO | True | `768f58627e2d13990ce08a9aed8bbd573c4a8112759f0902a46432c3a2bb2b3e` |

Tablo varsayılan set limitlerini kullanır; S3/80 L aşağıda ayrıca vardır. `shortest` kodda t=1/k=0/r=0 ile **süre maliyetini** minimize eder, saf mesafe minimizasyonu değildir. Gerçek balanced=(1,12,22), safest=(0.2,1.5,140). Kaynak: [api/planner/params.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/params.py), [api/planner/cost.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/cost.py).

### B’nin A’ya göre farkı (2026-11-15)

Yüzde=100×(B/A−1). Tek yön km/dk/kcal ham profilden; taahhüt O₂/doz budget.used üzerinden.

| Senaryo | Ön ayar | km Δ% | dk Δ% | kcal Δ% | Taahhüt O₂ Δ% | Taahhüt doz Δ% |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | shortest | +0.0000 | +6.6667 | +7.2315 | +3.0795 | +2.5372 |
| S1 | balanced | +0.0000 | +6.6667 | +7.2220 | +3.0989 | +2.5574 |
| S1 | safest | +0.0000 | +6.6667 | +7.2025 | +3.1461 | +2.6179 |
| S2 | shortest | +0.0000 | +6.6667 | +7.2451 | +3.1100 | +2.5507 |
| S2 | balanced | +0.0000 | +6.6667 | +7.2332 | +3.1401 | +2.5835 |
| S2 | safest | +0.0000 | +6.6667 | +7.2051 | +3.2141 | +2.6761 |
| S3 | shortest | +0.0000 | +6.6667 | +7.2429 | +3.0187 | +2.4692 |
| S3 | balanced | +0.0000 | +6.6667 | +7.2288 | +3.0431 | +2.5002 |
| S3 | safest | +0.0000 | +6.6667 | +7.2132 | +3.0730 | +2.5402 |

## D — B + η±%20, balanced (2026-11-15)

| Senaryo | Set | km | dk | kcal | O₂ L | doz µGy | durum | walkback_ok | Rota SHA-256 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | Dminus | 0.57 | 19.9 | 91.0 | 38.0 | 10.2 | GO | True | `1bc1d5accd81a9c49d0f3f86def24b2163d97f9cf1175821df69c16c81295fc4` |
| S1 | Dplus | 0.57 | 19.9 | 97.0 | 40.0 | 10.2 | GO | True | `3568cbe78d807ac9b8ad824fd7519790be68b68a02b8a68cc1d774318c3c46e7` |
| S2 | Dminus | 0.58 | 20.2 | 93.0 | 39.0 | 10.3 | GO | True | `27211c5fe007a4ab149e152dff2424ffff92240a4da43124109543f17e5d9e8e` |
| S2 | Dplus | 0.58 | 20.2 | 99.0 | 41.0 | 10.3 | GO | True | `27211c5fe007a4ab149e152dff2424ffff92240a4da43124109543f17e5d9e8e` |
| S3 | Dminus | 0.55 | 19.1 | 88.0 | 37.0 | 10.0 | GO | True | `3d114783b82e066aa35e8fdb3803ba0bdf305bc1af780d595b9225cee33a343f` |
| S3 | Dplus | 0.55 | 19.2 | 94.0 | 39.0 | 10.0 | GO | True | `f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4` |

| Senaryo | Set / B | km Δ% | dk Δ% | kcal Δ% | Taahhüt O₂ Δ% | Taahhüt doz Δ% |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | Dminus | -0.5790 | -0.2321 | -3.3359 | -1.4881 | -0.0893 |
| S1 | Dplus | +0.0000 | +0.0000 | +3.0375 | +1.3552 | +0.0000 |
| S2 | Dminus | +0.0000 | +0.0000 | -3.2601 | -1.4716 | +0.0000 |
| S2 | Dplus | +0.0000 | +0.0000 | +3.1107 | +1.4041 | +0.0000 |
| S3 | Dminus | -0.6018 | -0.2408 | -3.4057 | -1.4922 | -0.0976 |
| S3 | Dplus | +0.0000 | +0.0000 | +3.0993 | +1.3585 | +0.0000 |

η yalnız hareket terimine girer; bazal/yük terimleri sabittir. Bedrock η da değiştiğinden düz referans kalibrasyonu yeniden hesaplanır. Bu yüzden η±%20, toplam kcal±%20 değildir. Kalibrasyonu sabit tutan varyant **koşulmadı**. Kaynak: [api/planner/cost.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/cost.py).

## Güncel A — 42f60aa karşılaştırması (2026-11-15)

| Senaryo | Eski uçlar | Güncel uçlar | km | dk | kcal | Yol SHA aynı | total bütünü aynı |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S1 | [433, 525] → [491, 774] | [433, 525] → [491, 774] | 0.57 → 0.57 | 18.7 → 18.7 | 88.0 → 88.0 | True | True |
| S2 | [470, 589] → [491, 774] | [487, 542] → [487, 802] | 0.41 → 0.58 | 13.0 → 19.0 | 61.0 → 90.0 | False | False |
| S3 | [421, 545] → [491, 774] | [421, 545] → [491, 774] | 0.55 → 0.55 | 18.0 → 18.0 | 85.0 → 85.0 | True | True |

| Senaryo | km Δ% | dk Δ% | kcal Δ% | O₂ Δ% | doz Δ% |
| --- | --- | --- | --- | --- | --- |
| S1 | +0.000 | +0.000 | +0.000 | +0.000 | +0.000 |
| S2 | +41.463 | +46.154 | +47.541 | +42.308 | +20.732 |
| S3 | +0.000 | +0.000 | +0.000 | +0.000 | +0.000 |

**Kontrol:** Eski S2 uçları güncel kodda total bütünlüğü ve yol SHA bakımından eski raporla birebir aynı: True. Yol SHA=`1c871fb13998a8c4c23b76b742aee2b37bfaa307b6a40b2e20a31e0d2b8e3f70`. Ölçülen fark uç nokta/görev değişimiyle açıklanır; tüm repo değişmemiştir sonucu çıkarılmaz.

Güncel S2 [487,542]→[487,802], eski S2 [470,589]→[491,774]. İncelenen eski/yeni missions.json’da kum merkezi **aynı [487,672]**, yarıçap 20 m; başka kum cebi konumu değişimi bu dosya çiftinde **doğrulanmadı**. Güncel A/balanced ile eski/yeni uçların ikisinde de kum merkezine en yakın rota hücresi 0 m, 20 m içindeki hücre sayısı 19; toplam hücre eski=186/yeni=263. Yalnız olay geometrisi çakışmasıdır, gerçek kum doğrulaması değildir. Gözlem/replan koşulmadı. Kaynak: [sim/data/missions.json](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/sim/data/missions.json), [layers/demo_scenarios.json](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/layers/demo_scenarios.json); [eski missions](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/sim/data/missions.json).

## Tornado — A tabanında tek değişken (2026-11-15)

Mass yalnız kütle seti 80/120/10→82/104/23 kg; Speed yalnız 0.8→0.75 m/s; Power yalnız 272→352 W; EtaMinus/EtaPlus yalnız η×0.8/1.2. A’nın limitleri korunur. B birleşik pakettir, tornado girdisi sayılmaz. Her rota yeniden optimize edilir; sabit yolda deney değildir.

| Senaryo | Değişken | kcal Δ% | dk Δ% | km Δ% | Taahhüt O₂ Δ% | Taahhüt doz Δ% |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | Mass | +1.0303 | +0.0000 | +0.0000 | +0.4427 | +0.0000 |
| S1 | Speed | +5.9802 | +6.4190 | -0.5790 | +2.5660 | +2.4658 |
| S1 | Power | +29.1508 | -0.2647 | -0.6990 | +12.5057 | -0.0986 |
| S1 | EtaMinus | -3.0867 | +0.0000 | +0.0000 | -1.3234 | +0.0000 |
| S1 | EtaPlus | +2.9375 | +0.0000 | +0.0000 | +1.2602 | +0.0000 |
| S2 | Mass | +1.0553 | +0.0000 | +0.0000 | +0.4572 | +0.0000 |
| S2 | Speed | +6.1224 | +6.6667 | +0.0000 | +2.6574 | +2.5835 |
| S2 | Power | +29.1362 | -0.2325 | -0.4902 | +12.6510 | -0.0910 |
| S2 | EtaMinus | -3.1327 | +0.0212 | +0.0000 | -1.3612 | +0.0140 |
| S2 | EtaPlus | +3.0090 | +0.0000 | +0.0000 | +1.3055 | +0.0000 |
| S3 | Mass | +1.0516 | +0.0000 | +0.0000 | +0.4429 | +0.0000 |
| S3 | Speed | +5.9597 | +6.4098 | -0.6018 | +2.5088 | +2.4002 |
| S3 | Power | +29.1422 | -0.2745 | -0.7265 | +12.2708 | -0.1072 |
| S3 | EtaMinus | -3.1505 | +0.0000 | +0.0000 | -1.3274 | +0.0000 |
| S3 | EtaPlus | +2.9982 | +0.0000 | +0.0000 | +1.2621 | +0.0000 |

| Sıra | Grup | Maksimum mutlak kcal Δ% | İşaretli Δ% | Koşul |
| --- | --- | --- | --- | --- |
| 1 | 352 W | 29.1508 | +29.1508 | S1/Power |
| 2 | Hız | 6.1224 | +6.1224 | S2/Speed |
| 3 | η ±%20 | 3.1505 | -3.1505 | S3/EtaMinus |
| 4 | Kütle seti | 1.0553 | +1.0553 | S2/Mass |

Sıralama üç senaryodaki en büyük mutlak tek yön kcal etkisine göre; η için iki uçtan büyüğü. Adımlar eşit olmadığından normalize elastisite değildir. Zaman etkisinde hız baskındır. Mars insan biyofiziğinin doğrulanmış duyarlılık sırası **değildir**.

## S3 — 80 L görev sınırı (2026-11-15)

Yalnız budget={o2_L:80}; A/B/C/D’nin diğer limitleri korunur. Varsayılan limitteki GO kararları burada NO-GO olur. walkback_ok yalnız zamandır. İlk aşım tüpün fiziksel tükenişi değil gidiş+dönüş+bilim+rezerv taahhüdüdür. Kaynak: [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/route.py) ve [sim/data/missions.json](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/sim/data/missions.json).

| Set | Ön ayar | Taahhüt O₂ L | durum | walkback_ok | İlk aşım m | İlk aşım px |
| --- | --- | --- | --- | --- | --- | --- |
| A | shortest | 83.613 | NO-GO | True | 475.4 | [488, 750] |
| A | balanced | 84.224 | NO-GO | True | 490.5 | [488, 746] |
| A | safest | 84.934 | NO-GO | True | 503.2 | [478, 744] |
| B | shortest | 86.137 | NO-GO | True | 447.4 | [488, 736] |
| B | balanced | 86.787 | NO-GO | True | 460.8 | [488, 732] |
| B | safest | 87.544 | NO-GO | True | 465.4 | [481, 728] |
| C | balanced | 97.871 | NO-GO | True | 345.4 | [485, 680] |
| Dminus | balanced | 85.492 | NO-GO | True | 472.3 | [487, 739] |
| Dplus | balanced | 87.966 | NO-GO | True | 445.2 | [486, 725] |

## Mars birimleri / Dünya varsayımı denetimi (2026-11-15)

Kod kaynakları: [api/planner/params.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/params.py), [api/planner/cost.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/cost.py), [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/api/planner/route.py), [contracts/grid.json](https://github.com/KebeliSamet0/martian-map/blob/0b53eb30a6662a0fe4874734ea7b6dfdec66c07b/contracts/grid.json).

| Konu | Kodda durum | Değerlendirme / kaynak |
| --- | --- | --- |
| Yerçekimi | G_MARS=3.71, G_EARTH=9.81 m/s²; oran yük/hareket terimine girer | Mars g mevcut, Dünya g yalnız karşılaştırma referansı. Pandolf modelinin bu ölçekle Mars’a aktarımı doğrulanmadı. [NASA/JPL](https://ssd.jpl.nasa.gov/planets/phys_par.html). |
| Fiziksel süre | /60, ×60, /3600; m/s ve W=J/s | 1 fiziksel dk=60 SI s, 1 fiziksel saat=3600 SI s Mars’ta da korunur; bunları sol/24 ile değiştirmek enerji hesabını bozar. [BIPM SI Brochure, Tablo 8](https://www.bipm.org/en/publications/si-brochure). |
| Sol / LMST | Planner’da sol/LMST/LTST yok | Sol=88775.244 SI s=24.65979 fiziksel saat; 86400 s güneş gününden %2.749125 uzun. Ortalama güneş açısal hızı yaklaşık %2.675570 yavaş. Mars saati=sol/24=3698.9685 SI s, EVA saatiyle ayrı tutulmalı. [NASA GISS](https://www.giss.nasa.gov/tools/mars24/help/notes.html). |
| Yıl / Ls / eksen | Yıl, mevsim ve güneş geometrisi hesabı yok | ≈668.6 sol/yıl; tropikal=668.5921, yıldızıl=668.5991 sol. Kuzey mevsimleri Ls=0/90/180/270°; Gale güneyde olduğundan yerel mevsim karşıttır. Eksen=25.19°. [NASA GISS](https://www.giss.nasa.gov/tools/mars24/help/notes.html), [NASA fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html?level=1). |
| Yarıçap / areoid | EQC R=3396190 m, DEM metre | 3396.19 km ekvator yarıçapı yatay projeksiyon içindir; dikey areoid datumu değildir. Grid sözleşmesinde areoid model/versiyonu açık değil; dikey datum doğrulanmadı. [NASA/JPL](https://ssd.jpl.nasa.gov/planets/phys_par.html). |
| Basınç / sıcaklık | Maliyet/GO hesabına P/T girmez | Global özet P≈636 Pa (mevsimsel 400–870 Pa), T≈214 K; Gale görev anı ölçümü değildir. Yerel sol/LMST ve P/T bağlanmadan termal yaşam destek etkisi ölçülmedi. [NASA fact sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html?level=1). |
| Toz / güneş | tau, güneş/batarya/termal bütçe yok | ≈590 W/m² atmosfer üstü referans; yüzeyde sabit 590 değildir. Ls, mesafe, güneş yüksekliği, yüzey yönü, toz gerekir. Tek sabit tau uydurulmadı. [Appelbaum & Landis 1992, NASA TM-105827](https://ntrs.nasa.gov/api/citations/19920024655/downloads/19920024655.pdf). |
| Radyasyon / gün | 0.21 mGy/day×1000/24=8.75 µGy/fiziksel saat | Tarihsel GCR; güncel SPE, atmosfer sütunu, kalkan modeli yok. day ile sol aynı sayılmamalı. Kaynak day/sol terimlerini ayrı kullanır; SI day=86400 s okumasında /24 tutarlı. Ürün normalizasyonunda day=86400 s olduğu bağımsız doğrulanmadı; /24 kesin hata ilan edilmedi. [Hassler et al. 2014, DOI 10.1126/science.1244797](https://www.scienceintheclassroom.org/sites/default/files/research-papers/1244797.full_.pdf), [NASA RAD](https://science.nasa.gov/resource/radiation-measurements-on-mars/). |

**Koşullu birim hesabı:** 210 µGy/sol varsayılsaydı 210/(88775.244/3600)=8.515888 µGy/saat, mevcut 8.75’ten %2.675570 düşük olurdu. Bu kaynak birimi doğrulaması değildir, A/B/C/D’ye uygulanmadı. Fiziksel dakika/saat kullanımı tek başına Dünya günü varsayımı sayılmaz. Planner’da açık günlük dönüşüm `SURFACE_DOSE_MGY_PER_DAY/24` satırıdır; sol takvimi yok. Kod değiştirilmedi. [BIPM](https://www.bipm.org/en/publications/si-brochure).

### Kurum ve tanım farkları (2026-11-15)

| Kaynak | Değer / bağlam | Karar |
| --- | --- | --- |
| [NASA/JPL](https://ssd.jpl.nasa.gov/planets/phys_par.html) | g=3.71; ekvator/ortalama R=3396.19/3389.50 km | Kodun g ve EQC ekvator R seçimi ayrı tanımlardır. |
| [NASA/NSSDC](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html?level=1) | Ortalama gravity=3.73; ekvator acceleration=3.69; R=3396.2 km; solar irradiance=586.2 W/m² | Tanım/yuvarlatma farkları; kör ortalama alınmadı. |
| [ESA Meet Mars](https://www.esa.int/articles/meet-mars) | g=3.711; yıl=669 sol; P=6.35 mbar; T=−55°C | NASA 6.36 mbar/214 K özetinden farklı; Gale anlık girdisi yerine geçmez. |
| [ESA Meet Mars](https://www.esa.int/articles/meet-mars) / [NASA GISS](https://www.giss.nasa.gov/tools/mars24/help/notes.html) | ESA sol=24 sa 37 dk; GISS güneş solü=24 sa 39 dk 35.244 s, yıldızıl gün=24 sa 37 dk 22.663 s | ESA sol etiketi yıldızıl süreyle karışıyor görünür (yorum); LMST için bu ESA satırı reddedildi, GISS seçildi. |
| [NASA TM-105827](https://ntrs.nasa.gov/api/citations/19920024655/downloads/19920024655.pdf) | 590 W/m² atmosfer üstü mevsimsel akı referansı | Yüzey sabiti değildir. |

## Testler, komutlar ve kapsam dışı (2026-11-15)

Sürümler: {"python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]", "numpy": "2.5.4", "scipy": "1.18.1", "skimage": "0.26.0"}. Mevcut C:/Users/Batu/Desktop/mm-pr/.venv-api/Scripts/python.exe kullanıldı; kurulum yok.

```powershell
git -C C:/Users/Batu/Desktop/mm-pr/main-wt rev-parse HEAD
python -B -c "import os; from pathlib import Path; p=Path(os.environ['TEMP'])/'mm-full-sensitivity/run_full.py'; exec(compile(p.read_text(encoding='utf-8-sig'),str(p),'exec'))"
```

```text
A 13 PASS
B 12 PASS
C 4 PASS
Dminus 4 PASS
Dplus 4 PASS
Mass 3 PASS
Speed 3 PASS
Power 3 PASS
EtaMinus 3 PASS
EtaPlus 3 PASS
PASS source/TEMP/previous reports hashes
PASS: A repeated identical JSON
```

52 farklı +13 A tekrarı=65 plan_one çağrısı; kum kontrolü ayrıca 2 çağrı. İlk O₂ aşımında önceki hücre ≤80, aşım hücresi >80 test edildi. Bütün kaynak/TEMP hashleri ve önceki rapor hashleri korundu.

İlk keşif konsolunda η karakteri cp1254 UnicodeEncodeError verdi; ölçümler UTF-8 JSON ile etkilendirilmedi. İlk rapor aktarımında Türkçe karakterler ? oldu; son kontrolde bulundu ve bu yeni rapor UTF-8 aktarımıyla yeniden üretildi. Kaynak defterindeki ilk kayıtlar silinmeden düzeltilmiş ek bölüm eklendi.

**Koşulmadı:** gerçek Mars insan validasyonu, termal/P/T/toz/solar güç, LMST/sol zamanlı ışınım, SPE, replan, kaya engelleme açık varyant, ek numune yükü, STOP=352 W, normalize elastisite. Uzak main eşitliği ayrıca kontrol edilmedi; istenen disk HEAD/kaynak hashleri kullanıldı. Kaynaklı olmayan biyofiziksel uygunluk iddiaları doğrulanmadı.

### Hash izi (2026-11-15)

Toplam 53 kaynak/TEMP dosyası eşit. Temel girdiler:

- `contracts/grid.json`: `0d8d8351c687157c6bcfb361a11bdd2d4637c20121926abf1ebc1a98f9157993`
- `docs/metabolic_model.md`: `d3fe067e2f8ccd388ce57f1b0025dd731e520f398c8e8ae24b955acc43ad57f9`
- `layers/demo_scenarios.json`: `66ceaf7c7bd36d37688c9f38e98a823f0e5ca6318063b12197926e8f5688ab86`
- `layers/elevation.npy`: `fc8b8bebd41bf4847a7a3323e9b4a5cae289cfb152ec1a0193f0d1e9633de048`
- `layers/entropy.npy`: `cad1579f723deba8b0175981377f26a4319a4dc492e2b1fa9d8e20a7153bdb05`
- `layers/p_bedrock.npy`: `70e30fae6f8f92bb0afab724f3085609a97dab6d6280069f16b7daa5a90e22c5`
- `layers/p_bigrock.npy`: `e5163cd0794c16035c99e7a6c97bc571c4e0cbb9aa18d59cc1b5ac4827b1bf2e`
- `layers/p_sand.npy`: `6a85435a6a79c8cabc9e76e55208cd53a5a5b3b6e0fdbc02c5d800a3ffb7ee08`
- `layers/p_soil.npy`: `44abb46c8efa30a6ed7ec1de35dae3380423e899fffa13307e3e37468583db90`
- `layers/rock_cfa.npy`: `7f98358f2a326f640d19dbcad8065b0804efb012950e28e95fce3c34cd30431f`
- `layers/slope.npy`: `19de036a5f008c9de0f04c77e84b02a85b17d7193c0c500ffc946edfca195779`
- `sim/data/missions.json`: `4b95a2622c8c873c0e949a8eab829f5c430f807c10e19f78d3415d9aa1f2663f`
- `api/planner/comparison.py`: `cd0d683650622ab81ab9242230dfa35d6856e89a694d229c6d364e877cb3eed6`
- `api/planner/cost.py`: `e77e7b76554e5d56e9bfabf720d84b29ba2e2e3514ee82cb4a02cbbd40e32b3c`
- `api/planner/insight.py`: `e3d91280624157fb1ca701fff8d921dfedc2faac3d3b805279165c112c591113`
- `api/planner/layers.py`: `27714668c260bd27cbb9d8794e7422dda8fcabb6351d43981232b800c0772c03`
- `api/planner/params.py`: `8da695bd9e2daef18335423a11812691e5f95e01e051d54c98f1f2882c808913`
- `api/planner/route.py`: `a49a1507a8c60bf5b9ced961267c755020a534fb1e3cf1ce4fb6a8758d7f2961`
- `api/planner/terrain.py`: `d2bf98bff60c6266c0e0b3d2151b95f2fc1f08327a986bf9006d3ee6160c346b`
- `api/planner/__init__.py`: `8f38d6df745fd5fda831a4bac1b30e714abfd501cdd1b43232ec3a264394b94f`
- Önceki `duyarlilik_analizi.md`: `08ca8563f3003aa7a848b77c97b20fbec1a6e3df2d54d13466a06dea47161247` (korundu).
- Önceki `duyarlilik_analizi_s2_s3.md`: `f065344b8e71b8a74bdfa6ebc6cbc186c56b373cc2d275372ee268d1bd56799b` (korundu).

## Gerçek çalıştırma kodu (2026-11-15)

```python
import os,sys,json,shutil,hashlib,subprocess,re
from pathlib import Path
sys.dont_write_bytecode=True
SRC=Path('C:/Users/Batu/Desktop/mm-pr/main-wt');W=Path(os.environ['TEMP'])/'mm-full-sensitivity';W.mkdir(exist_ok=True);ROOT=W/'repo'
for name in ['api','layers','contracts']:shutil.copytree(SRC/name,ROOT/name,dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__'))
for name in ['sim/data/missions.json','docs/metabolic_model.md']:
 p=ROOT/name;p.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(SRC/name,p)
hashf=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
hashes={p.relative_to(ROOT).as_posix():hashf(p) for p in ROOT.rglob('*') if p.is_file()}
sha=subprocess.check_output(['git','-C',str(SRC),'rev-parse','HEAD'],text=True).strip()
REPORTS=Path('C:/Users/Batu/Desktop/martian-map-main/martian-map-main/docs/data/ekip')
oldhashes={n:hashf(REPORTS/n) for n in ['duyarlilik_analizi.md','duyarlilik_analizi_s2_s3.md']}
old=[]
for name in oldhashes:
 text=(REPORTS/name).read_text(encoding='utf-8')
 blocks=re.findall(r'```json\s*\n(.*?)\n```',text,re.S)
 payload=json.loads(blocks[-1])
 if name=='duyarlilik_analizi.md':
  for d in payload:
   if d['case']=='A':old.append(dict(scenario='S1',start=d['start'],goal=d['goal'],total=d['total'],path_sha256=d['path_sha256']))
 else:
  for d in payload:
   if d['case']=='A':
    old.extend(r for r in d['rows'] if r['mode']=='default')
(W/'old_baselines.json').write_text(json.dumps(old,ensure_ascii=False,indent=2),encoding='utf-8')
CHILD=r'''
import sys,os,json,hashlib,importlib
from pathlib import Path
sys.dont_write_bytecode=True
root=Path(sys.argv[1]);case=sys.argv[2];dest=Path(sys.argv[3]);sys.path.insert(0,str(root))
os.environ['MM_LAYERS_DIR']=str(root);os.environ['MARTIAN_ROCK_BLOCK']='0'
import numpy as np,scipy,skimage
from api import planner
from api.planner import params as P,cost
base_eta=dict(P.TERRAIN_ETA)
if case in ['B','C','Dminus','Dplus']:
 for k,v in dict(BODY_KG=82.,SUIT_KG=104.,TOOLS_KG=23.,BASE_SPEED_MS=.75,EVA_MAX_H=7.,EVA_MAX_KCAL=1800.,EVA_MAX_O2_L=370.).items():setattr(P,k,v)
if case=='Mass':P.BODY_KG=82.;P.SUIT_KG=104.;P.TOOLS_KG=23.
if case=='Speed':P.BASE_SPEED_MS=.75
if case in ['C','Power']:P.FLAT_REFERENCE_W=352.
if case in ['Dminus','EtaMinus']:P.TERRAIN_ETA={k:v*.8 for k,v in base_eta.items()}
if case in ['Dplus','EtaPlus']:P.TERRAIN_ETA={k:v*1.2 for k,v in base_eta.items()}
importlib.reload(cost)
L=planner.load(root);assert not L.synthetic and not L.provisional_terrain
flat=float(cost.metabolic_w(np.array(P.BASE_SPEED_MS),np.array(0.),np.array(P.TERRAIN_ETA['bedrock'])))
assert abs(flat-P.FLAT_REFERENCE_W)<1e-8
assert Path(P.__file__).resolve().is_relative_to(root.resolve())
scenarios=json.loads((root/'layers/demo_scenarios.json').read_text(encoding='utf-8'))['scenarios']
missions=json.loads((root/'sim/data/missions.json').read_text(encoding='utf-8'))['missions']
old=json.loads((dest.parent/'old_baselines.json').read_text(encoding='utf-8'))
rows=[]
def run(sid,start,goal,kind,mode,budget=None):
 r=planner.plan_one(L,start,goal,kind=kind,budget=budget);t=r['total'];prof=r['_prof'];path=r['_path'];bud=t['budget']
 assert t['walkback_ok']==(bud['used']['time_min']<=bud['limits']['time_min'])
 assert t['status']==('NO-GO' if t['limit_exceeded_at_index'] is not None else 'GO')
 crossing=None;i=t['limit_exceeded_at_index']
 if i is not None:
  oxy=(2*np.cumsum(prof['kcal'])+(P.SCIENCE_STOP_MIN+bud['limits']['reserve_min'])*60*P.STOP_METABOLIC_W/4184)/P.KCAL_PER_L_O2
  crossing={'o2_previous':float(oxy[i-1]) if i else None,'o2_current':float(oxy[i])}
  if bud['first_exceeded']==['o2_L']:assert oxy[i]>bud['limits']['o2_L'] and (i==0 or oxy[i-1]<=bud['limits']['o2_L'])
 rows.append(dict(case=case,scenario=sid,kind=kind,mode=mode,start=start,goal=goal,weights=r['weights'],total=t,exact={'km':float(prof['cum_m'][-1])/1000,'min':float(prof['sec'].sum())/60,'kcal':float(prof['kcal'].sum())},path_cells=len(path),path_sha256=hashlib.sha256(path.tobytes()).hexdigest(),crossing=crossing))
for s in scenarios:
 if s['id'] not in ['S1','S2','S3']:continue
 kinds=['shortest','balanced','safest'] if case in ['A','B'] else ['balanced']
 for kind in kinds:
  run(s['id'],s['start']['px'],s['goal']['px'],kind,'default')
  if s['id']=='S3' and case in ['A','B','C','Dminus','Dplus']:run(s['id'],s['start']['px'],s['goal']['px'],kind,'o2_80',{'o2_L':80})
 if case=='A':
  o=next(x for x in old if x['scenario']==s['id'])
  if o['start']!=s['start']['px'] or o['goal']!=s['goal']['px']:run(s['id'],o['start'],o['goal'],'balanced','old_endpoints')
keys=['BODY_KG','SUIT_KG','TOOLS_KG','BASE_SPEED_MS','FLAT_REFERENCE_W','STOP_METABOLIC_W','EVA_MAX_H','EVA_MAX_KCAL','EVA_MAX_O2_L','TERRAIN_ETA','TERRAIN_SPEED','SCIENCE_STOP_MIN','RESERVE_MIN','DOSE_UGY_PER_H']
out=dict(case=case,params={k:getattr(P,k) for k in keys},base_eta=base_eta,flat_check_W=flat,calibration=cost.CALIBRATION,versions={'python':sys.version,'numpy':np.__version__,'scipy':scipy.__version__,'skimage':skimage.__version__},rows=rows,tests='PASS: real layers, TEMP imports, flat calibration, budget status, walkback, O2 crossing')
dest.write_text(json.dumps(out,ensure_ascii=False,indent=2),encoding='utf-8');print(case,len(rows),'PASS')
'''
meta=dict(sha=sha,source=str(SRC),root=str(ROOT),hashes=hashes,old_report_hashes=oldhashes,child_code=CHILD)
(W/'metadata.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
for case in ['A','B','C','Dminus','Dplus','Mass','Speed','Power','EtaMinus','EtaPlus']:
 p=subprocess.run(['C:/Users/Batu/Desktop/mm-pr/.venv-api/Scripts/python.exe','-B','-c',CHILD,str(ROOT),case,str(W/(case+'.json'))],capture_output=True,text=True,timeout=120,env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'})
 (W/(case+'.log')).write_text(p.stdout+'\n'+p.stderr,encoding='utf-8');print(p.stdout,p.stderr[-1800:],flush=True)
assert all(hashf(ROOT/k)==v and hashf(SRC/k)==v for k,v in hashes.items())
assert all(hashf(REPORTS/k)==v for k,v in oldhashes.items())
print('PASS source/TEMP/previous reports hashes; '+sha,flush=True)

```

## Ham ölçümler — 52 koşul (2026-11-15)

```json
{
  "A": {
    "case": "A",
    "params": {
      "BODY_KG": 80.0,
      "SUIT_KG": 120.0,
      "TOOLS_KG": 10.0,
      "BASE_SPEED_MS": 0.8,
      "FLAT_REFERENCE_W": 272.0,
      "STOP_METABOLIC_W": 272.0,
      "EVA_MAX_H": 6.0,
      "EVA_MAX_KCAL": 2000.0,
      "EVA_MAX_O2_L": 420.0,
      "TERRAIN_ETA": {
        "bedrock": 1.0,
        "soil": 1.2,
        "sand": 2.1,
        "bigrock": 1.5
      },
      "TERRAIN_SPEED": {
        "bedrock": 1.0,
        "soil": 0.95,
        "sand": 0.6,
        "bigrock": 0.5
      },
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0,
      "DOSE_UGY_PER_H": 8.75
    },
    "base_eta": {
      "bedrock": 1.0,
      "soil": 1.2,
      "sand": 2.1,
      "bigrock": 1.5
    },
    "flat_check_W": 272.0,
    "calibration": 0.44179254453970973,
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "rows": [
      {
        "case": "A",
        "scenario": "S1",
        "kind": "shortest",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 0.0,
          "r": 0.0
        },
        "total": {
          "km": 0.55,
          "min": 18.4,
          "eva_min": 66.8,
          "eva_limit_min": 360.0,
          "kcal": 87.0,
          "eva_kcal": 174.0,
          "o2_L": 36.0,
          "dose_uGy": 9.7,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 96.757,
              "kcal": 407.598,
              "o2_L": 84.916,
              "dose_uGy": 14.11
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.379,
            "return_kcal": 86.782
          }
        },
        "exact": {
          "km": 0.5543330444827413,
          "min": 18.37863157329376,
          "kcal": 86.78182457270731
        },
        "path_cells": 250,
        "path_sha256": "fc8f9adf2931b73de1a77ad088d573a9601aa9d2f9fae1da81e334178006a785",
        "crossing": null
      },
      {
        "case": "A",
        "scenario": "S1",
        "kind": "balanced",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.57,
          "min": 18.7,
          "eva_min": 67.3,
          "eva_limit_min": 360.0,
          "kcal": 88.0,
          "eva_kcal": 176.0,
          "o2_L": 37.0,
          "dose_uGy": 9.8,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 97.331,
              "kcal": 409.85,
              "o2_L": 85.385,
              "dose_uGy": 14.194
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.666,
            "return_kcal": 87.908
          }
        },
        "exact": {
          "km": 0.5722741699796959,
          "min": 18.665571954198942,
          "kcal": 87.90773137901016
        },
        "path_cells": 254,
        "path_sha256": "3568cbe78d807ac9b8ad824fd7519790be68b68a02b8a68cc1d774318c3c46e7",
        "crossing": null
      },
      {
        "case": "A",
        "scenario": "S1",
        "kind": "safest",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 0.2,
          "k": 1.5,
          "r": 140.0
        },
        "total": {
          "km": 0.61,
          "min": 19.4,
          "eva_min": 68.8,
          "eva_limit_min": 360.0,
          "kcal": 91.0,
          "eva_kcal": 181.0,
          "o2_L": 38.0,
          "dose_uGy": 10.0,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 98.753,
              "kcal": 415.447,
              "o2_L": 86.551,
              "dose_uGy": 14.401
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.376,
            "return_kcal": 90.706
          }
        },
        "exact": {
          "km": 0.6109848480983512,
          "min": 19.37640786768112,
          "kcal": 90.70638578534343
        },
        "path_cells": 263,
        "path_sha256": "35ba8d7cabe28b707b3c43ce9ab5ebd8e949eab85fdba9a2ca40be93ee05c315",
        "crossing": null
      },
      {
        "case": "A",
        "scenario": "S2",
        "kind": "shortest",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 1.0,
          "k": 0.0,
          "r": 0.0
        },
        "total": {
          "km": 0.55,
          "min": 18.5,
          "eva_min": 67.1,
          "eva_limit_min": 360.0,
          "kcal": 88.0,
          "eva_kcal": 176.0,
          "o2_L": 37.0,
          "dose_uGy": 9.8,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 97.052,
              "kcal": 410.079,
              "o2_L": 85.433,
              "dose_uGy": 14.153
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.526,
            "return_kcal": 88.022
          }
        },
        "exact": {
          "km": 0.553823376490863,
          "min": 18.525977220555113,
          "kcal": 88.02234634452975
        },
        "path_cells": 263,
        "path_sha256": "e70df2bd04722d4912bb69192bb7ba89c8ca7fa66f621041b8aa30dd92c6c1ae",
        "crossing": null
      },
      {
        "case": "A",
        "scenario": "S2",
        "kind": "balanced",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.58,
          "min": 19.0,
          "eva_min": 67.9,
          "eva_limit_min": 360.0,
          "kcal": 90.0,
          "eva_kcal": 180.0,
          "o2_L": 37.0,
          "dose_uGy": 9.9,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 97.943,
              "kcal": 413.638,
              "o2_L": 86.175,
              "dose_uGy": 14.283
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.971,
            "return_kcal": 89.802
          }
        },
        "exact": {
          "km": 0.5770193359837565,
          "min": 18.97148772283145,
          "kcal": 89.8018044483019
        },
        "path_cells": 263,
        "path_sha256": "27211c5fe007a4ab149e152dff2424ffff92240a4da43124109543f17e5d9e8e",
        "crossing": null
      },
      {
        "case": "A",
        "scenario": "S2",
        "kind": "safest",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 0.2,
          "k": 1.5,
          "r": 140.0
        },
        "total": {
          "km": 0.64,
          "min": 20.1,
          "eva_min": 70.2,
          "eva_limit_min": 360.0,
          "kcal": 94.0,
          "eva_kcal": 188.0,
          "o2_L": 39.0,
          "dose_uGy": 10.2,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 100.189,
              "kcal": 422.487,
              "o2_L": 88.018,
              "dose_uGy": 14.611
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 20.095,
            "return_kcal": 94.226
          }
        },
        "exact": {
          "km": 0.6351269837220822,
          "min": 20.094721010559855,
          "kcal": 94.2263866293548
        },
        "path_cells": 273,
        "path_sha256": "65f59a838ae1f41c17a0d65a84cad75a3c2e3fdd4937987cfbad8f2569bfbb2a",
        "crossing": null
      },
      {
        "case": "A",
        "scenario": "S2",
        "kind": "balanced",
        "mode": "old_endpoints",
        "start": [
          470,
          589
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.41,
          "min": 13.0,
          "eva_min": 56.0,
          "eva_limit_min": 360.0,
          "kcal": 61.0,
          "eva_kcal": 122.0,
          "o2_L": 26.0,
          "dose_uGy": 8.2,
          "slope_max": 15.2,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 86.006,
              "kcal": 356.488,
              "o2_L": 74.268,
              "dose_uGy": 12.543
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 13.003,
            "return_kcal": 61.227
          }
        },
        "exact": {
          "km": 0.4056223663640863,
          "min": 13.002997236817775,
          "kcal": 61.22668497373333
        },
        "path_cells": 186,
        "path_sha256": "1c871fb13998a8c4c23b76b742aee2b37bfaa307b6a40b2e20a31e0d2b8e3f70",
        "crossing": null
      },
      {
        "case": "A",
        "scenario": "S3",
        "kind": "shortest",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 0.0,
          "r": 0.0
        },
        "total": {
          "km": 0.53,
          "min": 17.6,
          "eva_min": 65.3,
          "eva_limit_min": 360.0,
          "kcal": 84.0,
          "eva_kcal": 167.0,
          "o2_L": 35.0,
          "dose_uGy": 9.5,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 95.252,
              "kcal": 401.342,
              "o2_L": 83.613,
              "dose_uGy": 13.891
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 17.626,
            "return_kcal": 83.654
          }
        },
        "exact": {
          "km": 0.5258477631085026,
          "min": 17.625766812577876,
          "kcal": 83.65375936977716
        },
        "path_cells": 237,
        "path_sha256": "8534bfaa6de24b5c16a1fceeb611ec3d97684483e81d5d2f48721b56e81657ae",
        "crossing": null
      },
      {
        "case": "A",
        "scenario": "S3",
        "kind": "shortest",
        "mode": "o2_80",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 0.0,
          "r": 0.0
        },
        "total": {
          "km": 0.53,
          "min": 17.6,
          "eva_min": 65.3,
          "eva_limit_min": 360.0,
          "kcal": 84.0,
          "eva_kcal": 167.0,
          "o2_L": 35.0,
          "dose_uGy": 9.5,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": 475.4,
          "go": false,
          "status": "NO-GO",
          "limit_exceeded_at_px": [
            488,
            750
          ],
          "limit_exceeded_at_index": 212,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 80,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 95.252,
              "kcal": 401.342,
              "o2_L": 83.613,
              "dose_uGy": 13.891
            },
            "exceeded": [
              "o2_L"
            ],
            "first_exceeded": [
              "o2_L"
            ],
            "return_min": 17.626,
            "return_kcal": 83.654
          }
        },
        "exact": {
          "km": 0.5258477631085026,
          "min": 17.625766812577876,
          "kcal": 83.65375936977716
        },
        "path_cells": 237,
        "path_sha256": "8534bfaa6de24b5c16a1fceeb611ec3d97684483e81d5d2f48721b56e81657ae",
        "crossing": {
          "o2_previous": 79.93267988404988,
          "o2_current": 80.09743088098635
        }
      },
      {
        "case": "A",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 18.0,
          "eva_min": 66.0,
          "eva_limit_min": 360.0,
          "kcal": 85.0,
          "eva_kcal": 170.0,
          "o2_L": 35.0,
          "dose_uGy": 9.6,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 95.992,
              "kcal": 404.273,
              "o2_L": 84.224,
              "dose_uGy": 13.999
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 17.996,
            "return_kcal": 85.119
          }
        },
        "exact": {
          "km": 0.5506173157302034,
          "min": 17.996071320953273,
          "kcal": 85.11949653421411
        },
        "path_cells": 244,
        "path_sha256": "f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4",
        "crossing": null
      },
      {
        "case": "A",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "o2_80",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 18.0,
          "eva_min": 66.0,
          "eva_limit_min": 360.0,
          "kcal": 85.0,
          "eva_kcal": 170.0,
          "o2_L": 35.0,
          "dose_uGy": 9.6,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": 490.5,
          "go": false,
          "status": "NO-GO",
          "limit_exceeded_at_px": [
            488,
            746
          ],
          "limit_exceeded_at_index": 215,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 80,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 95.992,
              "kcal": 404.273,
              "o2_L": 84.224,
              "dose_uGy": 13.999
            },
            "exceeded": [
              "o2_L"
            ],
            "first_exceeded": [
              "o2_L"
            ],
            "return_min": 17.996,
            "return_kcal": 85.119
          }
        },
        "exact": {
          "km": 0.5506173157302034,
          "min": 17.996071320953273,
          "kcal": 85.11949653421411
        },
        "path_cells": 244,
        "path_sha256": "f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4",
        "crossing": {
          "o2_previous": 79.87276527965012,
          "o2_current": 80.07408920508203
        }
      },
      {
        "case": "A",
        "scenario": "S3",
        "kind": "safest",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 0.2,
          "k": 1.5,
          "r": 140.0
        },
        "total": {
          "km": 0.58,
          "min": 18.5,
          "eva_min": 66.9,
          "eva_limit_min": 360.0,
          "kcal": 87.0,
          "eva_kcal": 174.0,
          "o2_L": 36.0,
          "dose_uGy": 9.8,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 96.914,
              "kcal": 407.683,
              "o2_L": 84.934,
              "dose_uGy": 14.133
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.457,
            "return_kcal": 86.824
          }
        },
        "exact": {
          "km": 0.57684271247462,
          "min": 18.457193316150747,
          "kcal": 86.82447641437098
        },
        "path_cells": 248,
        "path_sha256": "768f58627e2d13990ce08a9aed8bbd573c4a8112759f0902a46432c3a2bb2b3e",
        "crossing": null
      },
      {
        "case": "A",
        "scenario": "S3",
        "kind": "safest",
        "mode": "o2_80",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 0.2,
          "k": 1.5,
          "r": 140.0
        },
        "total": {
          "km": 0.58,
          "min": 18.5,
          "eva_min": 66.9,
          "eva_limit_min": 360.0,
          "kcal": 87.0,
          "eva_kcal": 174.0,
          "o2_L": 36.0,
          "dose_uGy": 9.8,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": 503.2,
          "go": false,
          "status": "NO-GO",
          "limit_exceeded_at_px": [
            478,
            744
          ],
          "limit_exceeded_at_index": 216,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 80,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 96.914,
              "kcal": 407.683,
              "o2_L": 84.934,
              "dose_uGy": 14.133
            },
            "exceeded": [
              "o2_L"
            ],
            "first_exceeded": [
              "o2_L"
            ],
            "return_min": 18.457,
            "return_kcal": 86.824
          }
        },
        "exact": {
          "km": 0.57684271247462,
          "min": 18.457193316150747,
          "kcal": 86.82447641437098
        },
        "path_cells": 248,
        "path_sha256": "768f58627e2d13990ce08a9aed8bbd573c4a8112759f0902a46432c3a2bb2b3e",
        "crossing": {
          "o2_previous": 79.90331555798376,
          "o2_current": 80.08064651095071
        }
      }
    ],
    "tests": "PASS: real layers, TEMP imports, flat calibration, budget status, walkback, O2 crossing"
  },
  "B": {
    "case": "B",
    "params": {
      "BODY_KG": 82.0,
      "SUIT_KG": 104.0,
      "TOOLS_KG": 23.0,
      "BASE_SPEED_MS": 0.75,
      "FLAT_REFERENCE_W": 272.0,
      "STOP_METABOLIC_W": 272.0,
      "EVA_MAX_H": 7.0,
      "EVA_MAX_KCAL": 1800.0,
      "EVA_MAX_O2_L": 370.0,
      "TERRAIN_ETA": {
        "bedrock": 1.0,
        "soil": 1.2,
        "sand": 2.1,
        "bigrock": 1.5
      },
      "TERRAIN_SPEED": {
        "bedrock": 1.0,
        "soil": 0.95,
        "sand": 0.6,
        "bigrock": 0.5
      },
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0,
      "DOSE_UGY_PER_H": 8.75
    },
    "base_eta": {
      "bedrock": 1.0,
      "soil": 1.2,
      "sand": 2.1,
      "bigrock": 1.5
    },
    "flat_check_W": 272.0,
    "calibration": 0.4781289526551205,
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "rows": [
      {
        "case": "B",
        "scenario": "S1",
        "kind": "shortest",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 0.0,
          "r": 0.0
        },
        "total": {
          "km": 0.55,
          "min": 19.6,
          "eva_min": 69.2,
          "eva_limit_min": 420.0,
          "kcal": 93.0,
          "eva_kcal": 186.0,
          "o2_L": 39.0,
          "dose_uGy": 10.1,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 99.208,
              "kcal": 420.149,
              "o2_L": 87.531,
              "dose_uGy": 14.468
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.604,
            "return_kcal": 93.057
          }
        },
        "exact": {
          "km": 0.5543330444827413,
          "min": 19.603874184818462,
          "kcal": 93.05748166272826
        },
        "path_cells": 250,
        "path_sha256": "fc8f9adf2931b73de1a77ad088d573a9601aa9d2f9fae1da81e334178006a785",
        "crossing": null
      },
      {
        "case": "B",
        "scenario": "S1",
        "kind": "balanced",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.57,
          "min": 19.9,
          "eva_min": 69.8,
          "eva_limit_min": 420.0,
          "kcal": 94.0,
          "eva_kcal": 189.0,
          "o2_L": 39.0,
          "dose_uGy": 10.2,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 99.82,
              "kcal": 422.547,
              "o2_L": 88.031,
              "dose_uGy": 14.557
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.91,
            "return_kcal": 94.256
          }
        },
        "exact": {
          "km": 0.5722741699796959,
          "min": 19.909943924819366,
          "kcal": 94.25647008734796
        },
        "path_cells": 254,
        "path_sha256": "3568cbe78d807ac9b8ad824fd7519790be68b68a02b8a68cc1d774318c3c46e7",
        "crossing": null
      },
      {
        "case": "B",
        "scenario": "S1",
        "kind": "safest",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 0.2,
          "k": 1.5,
          "r": 140.0
        },
        "total": {
          "km": 0.61,
          "min": 20.7,
          "eva_min": 71.3,
          "eva_limit_min": 420.0,
          "kcal": 97.0,
          "eva_kcal": 194.0,
          "o2_L": 41.0,
          "dose_uGy": 10.4,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 101.336,
              "kcal": 428.514,
              "o2_L": 89.274,
              "dose_uGy": 14.778
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 20.668,
            "return_kcal": 97.24
          }
        },
        "exact": {
          "km": 0.6109848480983512,
          "min": 20.668168924449887,
          "kcal": 97.23954740956927
        },
        "path_cells": 263,
        "path_sha256": "35ba8d7cabe28b707b3c43ce9ab5ebd8e949eab85fdba9a2ca40be93ee05c315",
        "crossing": null
      },
      {
        "case": "B",
        "scenario": "S2",
        "kind": "shortest",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 1.0,
          "k": 0.0,
          "r": 0.0
        },
        "total": {
          "km": 0.55,
          "min": 19.8,
          "eva_min": 69.5,
          "eva_limit_min": 420.0,
          "kcal": 94.0,
          "eva_kcal": 189.0,
          "o2_L": 39.0,
          "dose_uGy": 10.1,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 99.522,
              "kcal": 422.834,
              "o2_L": 88.09,
              "dose_uGy": 14.514
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.761,
            "return_kcal": 94.4
          }
        },
        "exact": {
          "km": 0.553823376490863,
          "min": 19.761043107246497,
          "kcal": 94.39961440897392
        },
        "path_cells": 263,
        "path_sha256": "e70df2bd04722d4912bb69192bb7ba89c8ca7fa66f621041b8aa30dd92c6c1ae",
        "crossing": null
      },
      {
        "case": "B",
        "scenario": "S2",
        "kind": "balanced",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.58,
          "min": 20.2,
          "eva_min": 70.5,
          "eva_limit_min": 420.0,
          "kcal": 96.0,
          "eva_kcal": 193.0,
          "o2_L": 40.0,
          "dose_uGy": 10.3,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 100.473,
              "kcal": 426.629,
              "o2_L": 88.881,
              "dose_uGy": 14.652
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 20.236,
            "return_kcal": 96.297
          }
        },
        "exact": {
          "km": 0.5770193359837565,
          "min": 20.236254239292066,
          "kcal": 96.29730703136264
        },
        "path_cells": 263,
        "path_sha256": "27211c5fe007a4ab149e152dff2424ffff92240a4da43124109543f17e5d9e8e",
        "crossing": null
      },
      {
        "case": "B",
        "scenario": "S2",
        "kind": "safest",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 0.2,
          "k": 1.5,
          "r": 140.0
        },
        "total": {
          "km": 0.64,
          "min": 21.4,
          "eva_min": 72.9,
          "eva_limit_min": 420.0,
          "kcal": 101.0,
          "eva_kcal": 202.0,
          "o2_L": 42.0,
          "dose_uGy": 10.6,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 102.869,
              "kcal": 436.065,
              "o2_L": 90.847,
              "dose_uGy": 15.002
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 21.434,
            "return_kcal": 101.015
          }
        },
        "exact": {
          "km": 0.6351269837220822,
          "min": 21.43436981295219,
          "kcal": 101.01544824781396
        },
        "path_cells": 273,
        "path_sha256": "65f59a838ae1f41c17a0d65a84cad75a3c2e3fdd4937987cfbad8f2569bfbb2a",
        "crossing": null
      },
      {
        "case": "B",
        "scenario": "S3",
        "kind": "shortest",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 0.0,
          "r": 0.0
        },
        "total": {
          "km": 0.53,
          "min": 18.8,
          "eva_min": 67.6,
          "eva_limit_min": 420.0,
          "kcal": 90.0,
          "eva_kcal": 179.0,
          "o2_L": 37.0,
          "dose_uGy": 9.9,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 97.602,
              "kcal": 413.46,
              "o2_L": 86.137,
              "dose_uGy": 14.234
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.801,
            "return_kcal": 89.713
          }
        },
        "exact": {
          "km": 0.5258477631085026,
          "min": 18.800818434803215,
          "kcal": 89.71273164686227
        },
        "path_cells": 237,
        "path_sha256": "8534bfaa6de24b5c16a1fceeb611ec3d97684483e81d5d2f48721b56e81657ae",
        "crossing": null
      },
      {
        "case": "B",
        "scenario": "S3",
        "kind": "shortest",
        "mode": "o2_80",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 0.0,
          "r": 0.0
        },
        "total": {
          "km": 0.53,
          "min": 18.8,
          "eva_min": 67.6,
          "eva_limit_min": 420.0,
          "kcal": 90.0,
          "eva_kcal": 179.0,
          "o2_L": 37.0,
          "dose_uGy": 9.9,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": 447.4,
          "go": false,
          "status": "NO-GO",
          "limit_exceeded_at_px": [
            488,
            736
          ],
          "limit_exceeded_at_index": 198,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 80,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 97.602,
              "kcal": 413.46,
              "o2_L": 86.137,
              "dose_uGy": 14.234
            },
            "exceeded": [
              "o2_L"
            ],
            "first_exceeded": [
              "o2_L"
            ],
            "return_min": 18.801,
            "return_kcal": 89.713
          }
        },
        "exact": {
          "km": 0.5258477631085026,
          "min": 18.800818434803215,
          "kcal": 89.71273164686227
        },
        "path_cells": 237,
        "path_sha256": "8534bfaa6de24b5c16a1fceeb611ec3d97684483e81d5d2f48721b56e81657ae",
        "crossing": {
          "o2_previous": 79.98408186578551,
          "o2_current": 80.16506190444585
        }
      },
      {
        "case": "B",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 19.2,
          "eva_min": 68.4,
          "eva_limit_min": 420.0,
          "kcal": 91.0,
          "eva_kcal": 183.0,
          "o2_L": 38.0,
          "dose_uGy": 10.0,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 98.392,
              "kcal": 416.58,
              "o2_L": 86.787,
              "dose_uGy": 14.349
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.196,
            "return_kcal": 91.273
          }
        },
        "exact": {
          "km": 0.5506173157302034,
          "min": 19.195809921322773,
          "kcal": 91.27263247300141
        },
        "path_cells": 244,
        "path_sha256": "f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4",
        "crossing": null
      },
      {
        "case": "B",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "o2_80",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 19.2,
          "eva_min": 68.4,
          "eva_limit_min": 420.0,
          "kcal": 91.0,
          "eva_kcal": 183.0,
          "o2_L": 38.0,
          "dose_uGy": 10.0,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": 460.8,
          "go": false,
          "status": "NO-GO",
          "limit_exceeded_at_px": [
            488,
            732
          ],
          "limit_exceeded_at_index": 201,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 80,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 98.392,
              "kcal": 416.58,
              "o2_L": 86.787,
              "dose_uGy": 14.349
            },
            "exceeded": [
              "o2_L"
            ],
            "first_exceeded": [
              "o2_L"
            ],
            "return_min": 19.196,
            "return_kcal": 91.273
          }
        },
        "exact": {
          "km": 0.5506173157302034,
          "min": 19.195809921322773,
          "kcal": 91.27263247300141
        },
        "path_cells": 244,
        "path_sha256": "f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4",
        "crossing": {
          "o2_previous": 79.97122702585045,
          "o2_current": 80.0678977468194
        }
      },
      {
        "case": "B",
        "scenario": "S3",
        "kind": "safest",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 0.2,
          "k": 1.5,
          "r": 140.0
        },
        "total": {
          "km": 0.58,
          "min": 19.7,
          "eva_min": 69.4,
          "eva_limit_min": 420.0,
          "kcal": 93.0,
          "eva_kcal": 186.0,
          "o2_L": 39.0,
          "dose_uGy": 10.1,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 99.375,
              "kcal": 420.209,
              "o2_L": 87.544,
              "dose_uGy": 14.492
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.688,
            "return_kcal": 93.087
          }
        },
        "exact": {
          "km": 0.57684271247462,
          "min": 19.68767339573117,
          "kcal": 93.08727618687215
        },
        "path_cells": 248,
        "path_sha256": "768f58627e2d13990ce08a9aed8bbd573c4a8112759f0902a46432c3a2bb2b3e",
        "crossing": null
      },
      {
        "case": "B",
        "scenario": "S3",
        "kind": "safest",
        "mode": "o2_80",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 0.2,
          "k": 1.5,
          "r": 140.0
        },
        "total": {
          "km": 0.58,
          "min": 19.7,
          "eva_min": 69.4,
          "eva_limit_min": 420.0,
          "kcal": 93.0,
          "eva_kcal": 186.0,
          "o2_L": 39.0,
          "dose_uGy": 10.1,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": 465.4,
          "go": false,
          "status": "NO-GO",
          "limit_exceeded_at_px": [
            481,
            728
          ],
          "limit_exceeded_at_index": 200,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 80,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 99.375,
              "kcal": 420.209,
              "o2_L": 87.544,
              "dose_uGy": 14.492
            },
            "exceeded": [
              "o2_L"
            ],
            "first_exceeded": [
              "o2_L"
            ],
            "return_min": 19.688,
            "return_kcal": 93.087
          }
        },
        "exact": {
          "km": 0.57684271247462,
          "min": 19.68767339573117,
          "kcal": 93.08727618687215
        },
        "path_cells": 248,
        "path_sha256": "768f58627e2d13990ce08a9aed8bbd573c4a8112759f0902a46432c3a2bb2b3e",
        "crossing": {
          "o2_previous": 79.86555427854313,
          "o2_current": 80.05136279304722
        }
      }
    ],
    "tests": "PASS: real layers, TEMP imports, flat calibration, budget status, walkback, O2 crossing"
  },
  "C": {
    "case": "C",
    "params": {
      "BODY_KG": 82.0,
      "SUIT_KG": 104.0,
      "TOOLS_KG": 23.0,
      "BASE_SPEED_MS": 0.75,
      "FLAT_REFERENCE_W": 352.0,
      "STOP_METABOLIC_W": 272.0,
      "EVA_MAX_H": 7.0,
      "EVA_MAX_KCAL": 1800.0,
      "EVA_MAX_O2_L": 370.0,
      "TERRAIN_ETA": {
        "bedrock": 1.0,
        "soil": 1.2,
        "sand": 2.1,
        "bigrock": 1.5
      },
      "TERRAIN_SPEED": {
        "bedrock": 1.0,
        "soil": 0.95,
        "sand": 0.6,
        "bigrock": 0.5
      },
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0,
      "DOSE_UGY_PER_H": 8.75
    },
    "base_eta": {
      "bedrock": 1.0,
      "soil": 1.2,
      "sand": 2.1,
      "bigrock": 1.5
    },
    "flat_check_W": 351.99999999999994,
    "calibration": 0.6187551152007441,
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "rows": [
      {
        "case": "C",
        "scenario": "S1",
        "kind": "balanced",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.57,
          "min": 19.9,
          "eva_min": 69.7,
          "eva_limit_min": 420.0,
          "kcal": 122.0,
          "eva_kcal": 243.0,
          "o2_L": 51.0,
          "dose_uGy": 10.2,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 99.715,
              "kcal": 477.506,
              "o2_L": 99.48,
              "dose_uGy": 14.542
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.857,
            "return_kcal": 121.736
          }
        },
        "exact": {
          "km": 0.5682741699796959,
          "min": 19.857250745441323,
          "kcal": 121.73568933565653
        },
        "path_cells": 252,
        "path_sha256": "a8d4db9a25f53e97d9a4d5e4713d5ae942136c1c1792d9d4013115777f3799d4",
        "crossing": null
      },
      {
        "case": "C",
        "scenario": "S2",
        "kind": "balanced",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.57,
          "min": 20.2,
          "eva_min": 70.4,
          "eva_limit_min": 420.0,
          "kcal": 124.0,
          "eva_kcal": 249.0,
          "o2_L": 52.0,
          "dose_uGy": 10.3,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 100.378,
              "kcal": 482.747,
              "o2_L": 100.572,
              "dose_uGy": 14.639
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 20.189,
            "return_kcal": 124.356
          }
        },
        "exact": {
          "km": 0.5741909088590103,
          "min": 20.189195981072558,
          "kcal": 124.35610435346626
        },
        "path_cells": 262,
        "path_sha256": "4a40554b7c8b742fe3e52518ac14ce6fd7fa8f1f9a8368872b9dd6f5420616b2",
        "crossing": null
      },
      {
        "case": "C",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 19.1,
          "eva_min": 68.3,
          "eva_limit_min": 420.0,
          "kcal": 118.0,
          "eva_kcal": 236.0,
          "o2_L": 49.0,
          "dose_uGy": 10.0,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 98.286,
              "kcal": 469.783,
              "o2_L": 97.871,
              "dose_uGy": 14.333
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.143,
            "return_kcal": 117.874
          }
        },
        "exact": {
          "km": 0.5466173157302033,
          "min": 19.143116741944723,
          "kcal": 117.87425242297273
        },
        "path_cells": 242,
        "path_sha256": "5b92e8d943bb595786e27f72765a591a9b395375e2b37d942d84d9316447a10c",
        "crossing": null
      },
      {
        "case": "C",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "o2_80",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 19.1,
          "eva_min": 68.3,
          "eva_limit_min": 420.0,
          "kcal": 118.0,
          "eva_kcal": 236.0,
          "o2_L": 49.0,
          "dose_uGy": 10.0,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": 345.4,
          "go": false,
          "status": "NO-GO",
          "limit_exceeded_at_px": [
            485,
            680
          ],
          "limit_exceeded_at_index": 147,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 80,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 98.286,
              "kcal": 469.783,
              "o2_L": 97.871,
              "dose_uGy": 14.333
            },
            "exceeded": [
              "o2_L"
            ],
            "first_exceeded": [
              "o2_L"
            ],
            "return_min": 19.143,
            "return_kcal": 117.874
          }
        },
        "exact": {
          "km": 0.5466173157302033,
          "min": 19.143116741944723,
          "kcal": 117.87425242297273
        },
        "path_cells": 242,
        "path_sha256": "5b92e8d943bb595786e27f72765a591a9b395375e2b37d942d84d9316447a10c",
        "crossing": {
          "o2_previous": 79.89117428460143,
          "o2_current": 80.00143018654953
        }
      }
    ],
    "tests": "PASS: real layers, TEMP imports, flat calibration, budget status, walkback, O2 crossing"
  },
  "Dminus": {
    "case": "Dminus",
    "params": {
      "BODY_KG": 82.0,
      "SUIT_KG": 104.0,
      "TOOLS_KG": 23.0,
      "BASE_SPEED_MS": 0.75,
      "FLAT_REFERENCE_W": 272.0,
      "STOP_METABOLIC_W": 272.0,
      "EVA_MAX_H": 7.0,
      "EVA_MAX_KCAL": 1800.0,
      "EVA_MAX_O2_L": 370.0,
      "TERRAIN_ETA": {
        "bedrock": 0.8,
        "soil": 0.96,
        "sand": 1.6800000000000002,
        "bigrock": 1.2000000000000002
      },
      "TERRAIN_SPEED": {
        "bedrock": 1.0,
        "soil": 0.95,
        "sand": 0.6,
        "bigrock": 0.5
      },
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0,
      "DOSE_UGY_PER_H": 8.75
    },
    "base_eta": {
      "bedrock": 1.0,
      "soil": 1.2,
      "sand": 2.1,
      "bigrock": 1.5
    },
    "flat_check_W": 272.0,
    "calibration": 0.4896083726214203,
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "rows": [
      {
        "case": "Dminus",
        "scenario": "S1",
        "kind": "balanced",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.57,
          "min": 19.9,
          "eva_min": 69.7,
          "eva_limit_min": 420.0,
          "kcal": 91.0,
          "eva_kcal": 182.0,
          "o2_L": 38.0,
          "dose_uGy": 10.2,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 99.727,
              "kcal": 416.259,
              "o2_L": 86.721,
              "dose_uGy": 14.544
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.864,
            "return_kcal": 91.112
          }
        },
        "exact": {
          "km": 0.568960461480711,
          "min": 19.86372347195459,
          "kcal": 91.11213034734618
        },
        "path_cells": 254,
        "path_sha256": "1bc1d5accd81a9c49d0f3f86def24b2163d97f9cf1175821df69c16c81295fc4",
        "crossing": null
      },
      {
        "case": "Dminus",
        "scenario": "S2",
        "kind": "balanced",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.58,
          "min": 20.2,
          "eva_min": 70.5,
          "eva_limit_min": 420.0,
          "kcal": 93.0,
          "eva_kcal": 186.0,
          "o2_L": 39.0,
          "dose_uGy": 10.3,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 100.473,
              "kcal": 420.35,
              "o2_L": 87.573,
              "dose_uGy": 14.652
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 20.236,
            "return_kcal": 93.158
          }
        },
        "exact": {
          "km": 0.5770193359837565,
          "min": 20.236254239292066,
          "kcal": 93.15796569932519
        },
        "path_cells": 263,
        "path_sha256": "27211c5fe007a4ab149e152dff2424ffff92240a4da43124109543f17e5d9e8e",
        "crossing": null
      },
      {
        "case": "Dminus",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 19.1,
          "eva_min": 68.3,
          "eva_limit_min": 420.0,
          "kcal": 88.0,
          "eva_kcal": 176.0,
          "o2_L": 37.0,
          "dose_uGy": 10.0,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 98.299,
              "kcal": 410.363,
              "o2_L": 85.492,
              "dose_uGy": 14.335
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.15,
            "return_kcal": 88.164
          }
        },
        "exact": {
          "km": 0.5473036072312186,
          "min": 19.149589468457993,
          "kcal": 88.16414473309123
        },
        "path_cells": 244,
        "path_sha256": "3d114783b82e066aa35e8fdb3803ba0bdf305bc1af780d595b9225cee33a343f",
        "crossing": null
      },
      {
        "case": "Dminus",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "o2_80",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 19.1,
          "eva_min": 68.3,
          "eva_limit_min": 420.0,
          "kcal": 88.0,
          "eva_kcal": 176.0,
          "o2_L": 37.0,
          "dose_uGy": 10.0,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": 472.3,
          "go": false,
          "status": "NO-GO",
          "limit_exceeded_at_px": [
            487,
            739
          ],
          "limit_exceeded_at_index": 208,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 80,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 98.299,
              "kcal": 410.363,
              "o2_L": 85.492,
              "dose_uGy": 14.335
            },
            "exceeded": [
              "o2_L"
            ],
            "first_exceeded": [
              "o2_L"
            ],
            "return_min": 19.15,
            "return_kcal": 88.164
          }
        },
        "exact": {
          "km": 0.5473036072312186,
          "min": 19.149589468457993,
          "kcal": 88.16414473309123
        },
        "path_cells": 244,
        "path_sha256": "3d114783b82e066aa35e8fdb3803ba0bdf305bc1af780d595b9225cee33a343f",
        "crossing": {
          "o2_previous": 79.97975485321238,
          "o2_current": 80.14657186406025
        }
      }
    ],
    "tests": "PASS: real layers, TEMP imports, flat calibration, budget status, walkback, O2 crossing"
  },
  "Dplus": {
    "case": "Dplus",
    "params": {
      "BODY_KG": 82.0,
      "SUIT_KG": 104.0,
      "TOOLS_KG": 23.0,
      "BASE_SPEED_MS": 0.75,
      "FLAT_REFERENCE_W": 272.0,
      "STOP_METABOLIC_W": 272.0,
      "EVA_MAX_H": 7.0,
      "EVA_MAX_KCAL": 1800.0,
      "EVA_MAX_O2_L": 370.0,
      "TERRAIN_ETA": {
        "bedrock": 1.2,
        "soil": 1.44,
        "sand": 2.52,
        "bigrock": 1.7999999999999998
      },
      "TERRAIN_SPEED": {
        "bedrock": 1.0,
        "soil": 0.95,
        "sand": 0.6,
        "bigrock": 0.5
      },
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0,
      "DOSE_UGY_PER_H": 8.75
    },
    "base_eta": {
      "bedrock": 1.0,
      "soil": 1.2,
      "sand": 2.1,
      "bigrock": 1.5
    },
    "flat_check_W": 272.0,
    "calibration": 0.46717549674027825,
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "rows": [
      {
        "case": "Dplus",
        "scenario": "S1",
        "kind": "balanced",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.57,
          "min": 19.9,
          "eva_min": 69.8,
          "eva_limit_min": 420.0,
          "kcal": 97.0,
          "eva_kcal": 194.0,
          "o2_L": 40.0,
          "dose_uGy": 10.2,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 99.82,
              "kcal": 428.273,
              "o2_L": 89.224,
              "dose_uGy": 14.557
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.91,
            "return_kcal": 97.119
          }
        },
        "exact": {
          "km": 0.5722741699796959,
          "min": 19.909943924819366,
          "kcal": 97.11947870946838
        },
        "path_cells": 254,
        "path_sha256": "3568cbe78d807ac9b8ad824fd7519790be68b68a02b8a68cc1d774318c3c46e7",
        "crossing": null
      },
      {
        "case": "Dplus",
        "scenario": "S2",
        "kind": "balanced",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.58,
          "min": 20.2,
          "eva_min": 70.5,
          "eva_limit_min": 420.0,
          "kcal": 99.0,
          "eva_kcal": 199.0,
          "o2_L": 41.0,
          "dose_uGy": 10.3,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 100.473,
              "kcal": 432.62,
              "o2_L": 90.129,
              "dose_uGy": 14.652
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 20.236,
            "return_kcal": 99.293
          }
        },
        "exact": {
          "km": 0.5770193359837565,
          "min": 20.236254239292066,
          "kcal": 99.29280950975786
        },
        "path_cells": 263,
        "path_sha256": "27211c5fe007a4ab149e152dff2424ffff92240a4da43124109543f17e5d9e8e",
        "crossing": null
      },
      {
        "case": "Dplus",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 19.2,
          "eva_min": 68.4,
          "eva_limit_min": 420.0,
          "kcal": 94.0,
          "eva_kcal": 188.0,
          "o2_L": 39.0,
          "dose_uGy": 10.0,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 98.392,
              "kcal": 422.237,
              "o2_L": 87.966,
              "dose_uGy": 14.349
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.196,
            "return_kcal": 94.101
          }
        },
        "exact": {
          "km": 0.5506173157302034,
          "min": 19.195809921322773,
          "kcal": 94.10143166087093
        },
        "path_cells": 244,
        "path_sha256": "f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4",
        "crossing": null
      },
      {
        "case": "Dplus",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "o2_80",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 19.2,
          "eva_min": 68.4,
          "eva_limit_min": 420.0,
          "kcal": 94.0,
          "eva_kcal": 188.0,
          "o2_L": 39.0,
          "dose_uGy": 10.0,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": 445.2,
          "go": false,
          "status": "NO-GO",
          "limit_exceeded_at_px": [
            486,
            725
          ],
          "limit_exceeded_at_index": 194,
          "budget": {
            "limits": {
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 80,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 98.392,
              "kcal": 422.237,
              "o2_L": 87.966,
              "dose_uGy": 14.349
            },
            "exceeded": [
              "o2_L"
            ],
            "first_exceeded": [
              "o2_L"
            ],
            "return_min": 19.196,
            "return_kcal": 94.101
          }
        },
        "exact": {
          "km": 0.5506173157302034,
          "min": 19.195809921322773,
          "kcal": 94.10143166087093
        },
        "path_cells": 244,
        "path_sha256": "f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4",
        "crossing": {
          "o2_previous": 79.92458504964884,
          "o2_current": 80.07311771825576
        }
      }
    ],
    "tests": "PASS: real layers, TEMP imports, flat calibration, budget status, walkback, O2 crossing"
  },
  "Mass": {
    "case": "Mass",
    "params": {
      "BODY_KG": 82.0,
      "SUIT_KG": 104.0,
      "TOOLS_KG": 23.0,
      "BASE_SPEED_MS": 0.8,
      "FLAT_REFERENCE_W": 272.0,
      "STOP_METABOLIC_W": 272.0,
      "EVA_MAX_H": 6.0,
      "EVA_MAX_KCAL": 2000.0,
      "EVA_MAX_O2_L": 420.0,
      "TERRAIN_ETA": {
        "bedrock": 1.0,
        "soil": 1.2,
        "sand": 2.1,
        "bigrock": 1.5
      },
      "TERRAIN_SPEED": {
        "bedrock": 1.0,
        "soil": 0.95,
        "sand": 0.6,
        "bigrock": 0.5
      },
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0,
      "DOSE_UGY_PER_H": 8.75
    },
    "base_eta": {
      "bedrock": 1.0,
      "soil": 1.2,
      "sand": 2.1,
      "bigrock": 1.5
    },
    "flat_check_W": 272.0,
    "calibration": 0.4705290723772559,
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "rows": [
      {
        "case": "Mass",
        "scenario": "S1",
        "kind": "balanced",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.57,
          "min": 18.7,
          "eva_min": 67.3,
          "eva_limit_min": 360.0,
          "kcal": 89.0,
          "eva_kcal": 178.0,
          "o2_L": 37.0,
          "dose_uGy": 9.8,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 97.331,
              "kcal": 411.661,
              "o2_L": 85.763,
              "dose_uGy": 14.194
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.666,
            "return_kcal": 88.813
          }
        },
        "exact": {
          "km": 0.5722741699796959,
          "min": 18.665571954198942,
          "kcal": 88.81341146648951
        },
        "path_cells": 254,
        "path_sha256": "3568cbe78d807ac9b8ad824fd7519790be68b68a02b8a68cc1d774318c3c46e7",
        "crossing": null
      },
      {
        "case": "Mass",
        "scenario": "S2",
        "kind": "balanced",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.58,
          "min": 19.0,
          "eva_min": 67.9,
          "eva_limit_min": 360.0,
          "kcal": 91.0,
          "eva_kcal": 181.0,
          "o2_L": 38.0,
          "dose_uGy": 9.9,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 97.943,
              "kcal": 415.533,
              "o2_L": 86.569,
              "dose_uGy": 14.283
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.971,
            "return_kcal": 90.75
          }
        },
        "exact": {
          "km": 0.5770193359837565,
          "min": 18.97148772283145,
          "kcal": 90.74951545891432
        },
        "path_cells": 263,
        "path_sha256": "27211c5fe007a4ab149e152dff2424ffff92240a4da43124109543f17e5d9e8e",
        "crossing": null
      },
      {
        "case": "Mass",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 18.0,
          "eva_min": 66.0,
          "eva_limit_min": 360.0,
          "kcal": 86.0,
          "eva_kcal": 172.0,
          "o2_L": 36.0,
          "dose_uGy": 9.6,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 95.992,
              "kcal": 406.064,
              "o2_L": 84.597,
              "dose_uGy": 13.999
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 17.996,
            "return_kcal": 86.015
          }
        },
        "exact": {
          "km": 0.5506173157302034,
          "min": 17.996071320953273,
          "kcal": 86.01457336712335
        },
        "path_cells": 244,
        "path_sha256": "f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4",
        "crossing": null
      }
    ],
    "tests": "PASS: real layers, TEMP imports, flat calibration, budget status, walkback, O2 crossing"
  },
  "Speed": {
    "case": "Speed",
    "params": {
      "BODY_KG": 80.0,
      "SUIT_KG": 120.0,
      "TOOLS_KG": 10.0,
      "BASE_SPEED_MS": 0.75,
      "FLAT_REFERENCE_W": 272.0,
      "STOP_METABOLIC_W": 272.0,
      "EVA_MAX_H": 6.0,
      "EVA_MAX_KCAL": 2000.0,
      "EVA_MAX_O2_L": 420.0,
      "TERRAIN_ETA": {
        "bedrock": 1.0,
        "soil": 1.2,
        "sand": 2.1,
        "bigrock": 1.5
      },
      "TERRAIN_SPEED": {
        "bedrock": 1.0,
        "soil": 0.95,
        "sand": 0.6,
        "bigrock": 0.5
      },
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0,
      "DOSE_UGY_PER_H": 8.75
    },
    "base_eta": {
      "bedrock": 1.0,
      "soil": 1.2,
      "sand": 2.1,
      "bigrock": 1.5
    },
    "flat_check_W": 272.0,
    "calibration": 0.4485183901162974,
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "rows": [
      {
        "case": "Speed",
        "scenario": "S1",
        "kind": "balanced",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.57,
          "min": 19.9,
          "eva_min": 69.7,
          "eva_limit_min": 360.0,
          "kcal": 93.0,
          "eva_kcal": 186.0,
          "o2_L": 39.0,
          "dose_uGy": 10.2,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 99.727,
              "kcal": 420.364,
              "o2_L": 87.576,
              "dose_uGy": 14.544
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.864,
            "return_kcal": 93.165
          }
        },
        "exact": {
          "km": 0.568960461480711,
          "min": 19.86372347195459,
          "kcal": 93.16478308507777
        },
        "path_cells": 254,
        "path_sha256": "1bc1d5accd81a9c49d0f3f86def24b2163d97f9cf1175821df69c16c81295fc4",
        "crossing": null
      },
      {
        "case": "Speed",
        "scenario": "S2",
        "kind": "balanced",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.58,
          "min": 20.2,
          "eva_min": 70.5,
          "eva_limit_min": 360.0,
          "kcal": 95.0,
          "eva_kcal": 191.0,
          "o2_L": 40.0,
          "dose_uGy": 10.3,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 100.473,
              "kcal": 424.634,
              "o2_L": 88.465,
              "dose_uGy": 14.652
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 20.236,
            "return_kcal": 95.3
          }
        },
        "exact": {
          "km": 0.5770193359837565,
          "min": 20.236254239292066,
          "kcal": 95.29987149171961
        },
        "path_cells": 263,
        "path_sha256": "27211c5fe007a4ab149e152dff2424ffff92240a4da43124109543f17e5d9e8e",
        "crossing": null
      },
      {
        "case": "Speed",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 19.1,
          "eva_min": 68.3,
          "eva_limit_min": 360.0,
          "kcal": 90.0,
          "eva_kcal": 180.0,
          "o2_L": 38.0,
          "dose_uGy": 10.0,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 98.299,
              "kcal": 414.419,
              "o2_L": 86.337,
              "dose_uGy": 14.335
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 19.15,
            "return_kcal": 90.192
          }
        },
        "exact": {
          "km": 0.5473036072312186,
          "min": 19.149589468457993,
          "kcal": 90.19233648006207
        },
        "path_cells": 244,
        "path_sha256": "3d114783b82e066aa35e8fdb3803ba0bdf305bc1af780d595b9225cee33a343f",
        "crossing": null
      }
    ],
    "tests": "PASS: real layers, TEMP imports, flat calibration, budget status, walkback, O2 crossing"
  },
  "Power": {
    "case": "Power",
    "params": {
      "BODY_KG": 80.0,
      "SUIT_KG": 120.0,
      "TOOLS_KG": 10.0,
      "BASE_SPEED_MS": 0.8,
      "FLAT_REFERENCE_W": 352.0,
      "STOP_METABOLIC_W": 272.0,
      "EVA_MAX_H": 6.0,
      "EVA_MAX_KCAL": 2000.0,
      "EVA_MAX_O2_L": 420.0,
      "TERRAIN_ETA": {
        "bedrock": 1.0,
        "soil": 1.2,
        "sand": 2.1,
        "bigrock": 1.5
      },
      "TERRAIN_SPEED": {
        "bedrock": 1.0,
        "soil": 0.95,
        "sand": 0.6,
        "bigrock": 0.5
      },
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0,
      "DOSE_UGY_PER_H": 8.75
    },
    "base_eta": {
      "bedrock": 1.0,
      "soil": 1.2,
      "sand": 2.1,
      "bigrock": 1.5
    },
    "flat_check_W": 352.0,
    "calibration": 0.5717315282278597,
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "rows": [
      {
        "case": "Power",
        "scenario": "S1",
        "kind": "balanced",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.57,
          "min": 18.6,
          "eva_min": 67.2,
          "eva_limit_min": 360.0,
          "kcal": 114.0,
          "eva_kcal": 227.0,
          "o2_L": 47.0,
          "dose_uGy": 9.8,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 97.232,
              "kcal": 461.101,
              "o2_L": 96.063,
              "dose_uGy": 14.18
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.616,
            "return_kcal": 113.534
          }
        },
        "exact": {
          "km": 0.5682741699796959,
          "min": 18.616172053438945,
          "kcal": 113.53352599282867
        },
        "path_cells": 252,
        "path_sha256": "a8d4db9a25f53e97d9a4d5e4713d5ae942136c1c1792d9d4013115777f3799d4",
        "crossing": null
      },
      {
        "case": "Power",
        "scenario": "S2",
        "kind": "balanced",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.57,
          "min": 18.9,
          "eva_min": 67.9,
          "eva_limit_min": 360.0,
          "kcal": 116.0,
          "eva_kcal": 232.0,
          "o2_L": 48.0,
          "dose_uGy": 9.9,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 97.855,
              "kcal": 465.968,
              "o2_L": 97.077,
              "dose_uGy": 14.27
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.927,
            "return_kcal": 115.967
          }
        },
        "exact": {
          "km": 0.5741909088590103,
          "min": 18.927370608901846,
          "kcal": 115.96663238966224
        },
        "path_cells": 262,
        "path_sha256": "4a40554b7c8b742fe3e52518ac14ce6fd7fa8f1f9a8368872b9dd6f5420616b2",
        "crossing": null
      },
      {
        "case": "Power",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 17.9,
          "eva_min": 65.9,
          "eva_limit_min": 360.0,
          "kcal": 110.0,
          "eva_kcal": 220.0,
          "o2_L": 46.0,
          "dose_uGy": 9.6,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 95.893,
              "kcal": 453.885,
              "o2_L": 94.559,
              "dose_uGy": 13.984
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 17.947,
            "return_kcal": 109.925
          }
        },
        "exact": {
          "km": 0.5466173157302033,
          "min": 17.94667142019328,
          "kcal": 109.92522207603378
        },
        "path_cells": 242,
        "path_sha256": "5b92e8d943bb595786e27f72765a591a9b395375e2b37d942d84d9316447a10c",
        "crossing": null
      }
    ],
    "tests": "PASS: real layers, TEMP imports, flat calibration, budget status, walkback, O2 crossing"
  },
  "EtaMinus": {
    "case": "EtaMinus",
    "params": {
      "BODY_KG": 80.0,
      "SUIT_KG": 120.0,
      "TOOLS_KG": 10.0,
      "BASE_SPEED_MS": 0.8,
      "FLAT_REFERENCE_W": 272.0,
      "STOP_METABOLIC_W": 272.0,
      "EVA_MAX_H": 6.0,
      "EVA_MAX_KCAL": 2000.0,
      "EVA_MAX_O2_L": 420.0,
      "TERRAIN_ETA": {
        "bedrock": 0.8,
        "soil": 0.96,
        "sand": 1.6800000000000002,
        "bigrock": 1.2000000000000002
      },
      "TERRAIN_SPEED": {
        "bedrock": 1.0,
        "soil": 0.95,
        "sand": 0.6,
        "bigrock": 0.5
      },
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0,
      "DOSE_UGY_PER_H": 8.75
    },
    "base_eta": {
      "bedrock": 1.0,
      "soil": 1.2,
      "sand": 2.1,
      "bigrock": 1.5
    },
    "flat_check_W": 272.0,
    "calibration": 0.4530123399183165,
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "rows": [
      {
        "case": "EtaMinus",
        "scenario": "S1",
        "kind": "balanced",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.57,
          "min": 18.7,
          "eva_min": 67.3,
          "eva_limit_min": 360.0,
          "kcal": 85.0,
          "eva_kcal": 170.0,
          "o2_L": 35.0,
          "dose_uGy": 9.8,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 97.331,
              "kcal": 404.423,
              "o2_L": 84.255,
              "dose_uGy": 14.194
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.666,
            "return_kcal": 85.194
          }
        },
        "exact": {
          "km": 0.5722741699796959,
          "min": 18.665571954198942,
          "kcal": 85.19428357335288
        },
        "path_cells": 254,
        "path_sha256": "3568cbe78d807ac9b8ad824fd7519790be68b68a02b8a68cc1d774318c3c46e7",
        "crossing": null
      },
      {
        "case": "EtaMinus",
        "scenario": "S2",
        "kind": "balanced",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.58,
          "min": 19.0,
          "eva_min": 68.0,
          "eva_limit_min": 360.0,
          "kcal": 87.0,
          "eva_kcal": 174.0,
          "o2_L": 36.0,
          "dose_uGy": 9.9,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 97.951,
              "kcal": 408.012,
              "o2_L": 85.002,
              "dose_uGy": 14.285
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.976,
            "return_kcal": 86.989
          }
        },
        "exact": {
          "km": 0.5770193359837565,
          "min": 18.975515355586943,
          "kcal": 86.98858383035977
        },
        "path_cells": 263,
        "path_sha256": "e8e68600e88e62adf908e0e1c2e8fd6cae6c2387c63ff42e8ad1ca01545b7ca2",
        "crossing": null
      },
      {
        "case": "EtaMinus",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 18.0,
          "eva_min": 66.0,
          "eva_limit_min": 360.0,
          "kcal": 82.0,
          "eva_kcal": 165.0,
          "o2_L": 34.0,
          "dose_uGy": 9.6,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 95.992,
              "kcal": 398.91,
              "o2_L": 83.106,
              "dose_uGy": 13.999
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 17.996,
            "return_kcal": 82.438
          }
        },
        "exact": {
          "km": 0.5506173157302034,
          "min": 17.996071320953273,
          "kcal": 82.43781623027843
        },
        "path_cells": 244,
        "path_sha256": "f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4",
        "crossing": null
      }
    ],
    "tests": "PASS: real layers, TEMP imports, flat calibration, budget status, walkback, O2 crossing"
  },
  "EtaPlus": {
    "case": "EtaPlus",
    "params": {
      "BODY_KG": 80.0,
      "SUIT_KG": 120.0,
      "TOOLS_KG": 10.0,
      "BASE_SPEED_MS": 0.8,
      "FLAT_REFERENCE_W": 272.0,
      "STOP_METABOLIC_W": 272.0,
      "EVA_MAX_H": 6.0,
      "EVA_MAX_KCAL": 2000.0,
      "EVA_MAX_O2_L": 420.0,
      "TERRAIN_ETA": {
        "bedrock": 1.2,
        "soil": 1.44,
        "sand": 2.52,
        "bigrock": 1.7999999999999998
      },
      "TERRAIN_SPEED": {
        "bedrock": 1.0,
        "soil": 0.95,
        "sand": 0.6,
        "bigrock": 0.5
      },
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0,
      "DOSE_UGY_PER_H": 8.75
    },
    "base_eta": {
      "bedrock": 1.0,
      "soil": 1.2,
      "sand": 2.1,
      "bigrock": 1.5
    },
    "flat_check_W": 272.0,
    "calibration": 0.431115080459462,
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "rows": [
      {
        "case": "EtaPlus",
        "scenario": "S1",
        "kind": "balanced",
        "mode": "default",
        "start": [
          433,
          525
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.57,
          "min": 18.7,
          "eva_min": 67.3,
          "eva_limit_min": 360.0,
          "kcal": 90.0,
          "eva_kcal": 181.0,
          "o2_L": 38.0,
          "dose_uGy": 9.8,
          "slope_max": 22.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 97.331,
              "kcal": 415.014,
              "o2_L": 86.461,
              "dose_uGy": 14.194
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.666,
            "return_kcal": 90.49
          }
        },
        "exact": {
          "km": 0.5722741699796959,
          "min": 18.665571954198942,
          "kcal": 90.49001948928907
        },
        "path_cells": 254,
        "path_sha256": "3568cbe78d807ac9b8ad824fd7519790be68b68a02b8a68cc1d774318c3c46e7",
        "crossing": null
      },
      {
        "case": "EtaPlus",
        "scenario": "S2",
        "kind": "balanced",
        "mode": "default",
        "start": [
          487,
          542
        ],
        "goal": [
          487,
          802
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.58,
          "min": 19.0,
          "eva_min": 67.9,
          "eva_limit_min": 360.0,
          "kcal": 93.0,
          "eva_kcal": 185.0,
          "o2_L": 39.0,
          "dose_uGy": 9.9,
          "slope_max": 24.1,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 97.943,
              "kcal": 419.042,
              "o2_L": 87.3,
              "dose_uGy": 14.283
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 18.971,
            "return_kcal": 92.504
          }
        },
        "exact": {
          "km": 0.5770193359837565,
          "min": 18.97148772283145,
          "kcal": 92.50393239049461
        },
        "path_cells": 263,
        "path_sha256": "27211c5fe007a4ab149e152dff2424ffff92240a4da43124109543f17e5d9e8e",
        "crossing": null
      },
      {
        "case": "EtaPlus",
        "scenario": "S3",
        "kind": "balanced",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "total": {
          "km": 0.55,
          "min": 18.0,
          "eva_min": 66.0,
          "eva_limit_min": 360.0,
          "kcal": 88.0,
          "eva_kcal": 175.0,
          "o2_L": 37.0,
          "dose_uGy": 9.6,
          "slope_max": 19.9,
          "low_conf_m": 0,
          "walkback_ok": true,
          "limit_exceeded_at_m": null,
          "go": true,
          "status": "GO",
          "limit_exceeded_at_px": null,
          "limit_exceeded_at_index": null,
          "budget": {
            "limits": {
              "time_min": 360.0,
              "kcal": 2000.0,
              "o2_L": 420.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 95.992,
              "kcal": 409.378,
              "o2_L": 85.287,
              "dose_uGy": 13.999
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 17.996,
            "return_kcal": 87.672
          }
        },
        "exact": {
          "km": 0.5506173157302034,
          "min": 17.996071320953273,
          "kcal": 87.67155246419503
        },
        "path_cells": 244,
        "path_sha256": "f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4",
        "crossing": null
      }
    ],
    "tests": "PASS: real layers, TEMP imports, flat calibration, budget status, walkback, O2 crossing"
  }
}
```
