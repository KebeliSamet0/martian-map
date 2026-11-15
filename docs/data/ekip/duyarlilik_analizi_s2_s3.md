# S2/S3 balanced duyarl?l?k analizi ? 42f60aa kopyas?, g?ncel main ko?ulmad? (2026-11-15)

**Sonu?:** S2 ve S3, A/B/C varsay?lan b?t?elerinde GO. S3??n O? s?n?r? 80 L yap?ld???nda ?? set de NO-GO; `walkback_ok` ???nde de true. ?lk oksijen b?t?esi a??m? A?da 490,5 m, B?de 460,8 m, C?de 345,4 m. Bu, kod modelinin ?l??m?d?r; insan Mars EVA g?venli?i veya ger?ek skafandr kapasitesi do?rulamas? de?ildir.

## S?r?m, kaynak ve kapsam (2026-11-15)

Commit: `42f60aaf5cbebda49026ebd9ccfaf7818e86c915`. Kaynak checkout: `C:\Users\Batu\Desktop\mm-pr\martian-map`; ?al??ma kopyas?: `C:\Users\Batu\AppData\Local\Temp\mm-s2-s3-study\repo`. api/, layers/, contracts/, docs/ ve sim/data/missions.json yaln?z TEMP?e kopyaland?. Repo kodu, sim/, .borje/, ayarlar veya git durumuna yaz?lmad?; ?al??ma deposunda yaln?z bu yeni Markdown dosyas? ?retildi. ?nceki duyarlilik_analizi.md korunmu?tur; ?ncesi/sonras? SHA-256 `08ca8563f3003aa7a848b77c97b20fbec1a6e3df2d54d13466a06dea47161247`.

**G?ncel main denemesi:** `git clone --depth 1 https://github.com/KebeliSamet0/martian-map.git C:/Users/Batu/AppData/Local/Temp/mm-s2-s3-main` ilk sandbox denemesinde `Failed to connect to github.com port 443 after 82 ms: Could not connect to server` hatas? verdi. ?zinli tekrar yaln?z `Cloning into ...` ??kt?s?n? verdi; haz?rl?k boyunca tamamlanmad?, veri/kod dosyalar? okunabilir h?le gelmedi. Giri?imin ?al???r kopya sa?lamamas? ?zerine Ctrl+C ile sonland?r?ld? (exit 1, ek hata metni yok). Kullan?c?n?n izin verdi?i 42f60aa alternatifiyle ?l??ld?. 6864c6c veya daha yeni main?de sonu?lar **ko?ulmad?**; g?ncel main sonu?lar? **do?rulanmad?**.

?ddia/kod kaynaklar?: [api/planner/params.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/params.py), [api/planner/cost.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/cost.py), [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/route.py), [api/planner/layers.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/layers.py), [api/planner/terrain.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/terrain.py), [layers/demo_scenarios.json](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/layers/demo_scenarios.json), [sim/data/missions.json](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/sim/data/missions.json), [contracts/grid.json](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/contracts/grid.json), [docs/metabolic_model.md](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/docs/metabolic_model.md), [docs/eva_parameters.md](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/docs/eva_parameters.md). Ara?t?rma ba?lam?: [gercek_parametre_arastirmasi.md](gercek_parametre_arastirmasi.md), y?ntem devaml?l???: [duyarlilik_analizi.md](duyarlilik_analizi.md). B parametreleri g?revin deney girdileridir; Mars operasyonuna uygunluklar? bu ?al??mada ba??ms?z **do?rulanmad?**.

## Y?ntem ve parametreler (2026-11-15)

Do?rudan Python `-c` i?inde `api.planner` i?e aktar?ld?; `planner.plan_one(..., kind="balanced", budget=...)` ?a?r?ld?. HTTP sunucusu kurulmad?, ba??ml?l?k kurulmad?. Her A/B/C ayr? Python s?recidir. Parametreler yaln?z bellek d?zeyinde ge?ersiz k?l?nd?; ard?ndan import an?nda hesaplanan kalibrasyonu yenilemek i?in `importlib.reload(cost)` yap?ld?. Ger?ek katmanlar (synthetic=false, provisional_terrain=false), TEMP i?inden import ve d?z zemin kalibrasyonu test edildi. Zemin katsay?lar? belgede tan?mlanan de?erlerle y?klendi; kaya engelleme se?ene?i `MARTIAN_ROCK_BLOCK=0` t?m ko?ullarda sabittir. Kaynak: [api/planner/cost.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/cost.py), [api/planner/layers.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/layers.py), [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/route.py).

| Parametre | A | B | C |
|---|---:|---:|---:|
| BODY_KG | 80.0 | 82.0 | 82.0 |
| SUIT_KG | 120.0 | 104.0 | 104.0 |
| TOOLS_KG | 10.0 | 23.0 | 23.0 |
| BASE_SPEED_MS | 0.8 | 0.75 | 0.75 |
| EVA_MAX_H | 6.0 | 7.0 | 7.0 |
| EVA_MAX_KCAL | 2000.0 | 1800.0 | 1800.0 |
| EVA_MAX_O2_L | 420.0 | 370.0 | 370.0 |
| FLAT_REFERENCE_W | 272.0 | 272.0 | 352.0 |
| STOP_METABOLIC_W | 272.0 | 272.0 | 272.0 |

`STOP_METABOLIC_W` ?? sette 272 W korundu; C yaln?z g?revde belirtilen `FLAT_REFERENCE_W=352` de?i?ikli?idir. ?nceki raporla ayn? varsay?m kullan?ld?. Durak g?c?n? de 352 W yapmak ayr? deneydir, **ko?ulmad?**. Bilim dura?? 30 dk, rezerv 30 dk, doz h?z? 8.75 ?Gy/sa; balanced a??rl?klar? t=1, k=12, r=22. Kaynak: [api/planner/params.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/params.py) ve [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/route.py).

| Senaryo | Ba?lang?? px | Hedef px |
|---|---|---|
| S2 | [470, 589] | [491, 774] |
| S3 | [421, 545] | [491, 774] |

px=[s?tun,sat?r]; 1000?1000, 2 m/h?cre. Kaynak: [layers/demo_scenarios.json](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/layers/demo_scenarios.json) ve [contracts/grid.json](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/contracts/grid.json).

**S3 b?t?e tan?m?:** missions.json S3.limits = {'time_min': 360.0, 'o2_L': 80, 'kcal': 2000.0, 'dose_uGy': 60.0}. `default` ko?ullar? A/B/C mod?l b?t?elerini kullan?r. `80L` ko?ullar? yaln?z `budget={"o2_L":80}` g?nderir: A 360 dk/2000 kcal, B/C 420 dk/1800 kcal olarak kal?r. B?ylece B/C deney setlerini missions.json??n eski di?er limitleriyle geri de?i?tirmeden yar?m t?p etkisi izole edilir. T?m S3 g?rev limitlerini aynen birlikte ge?iren ek ko?u **ko?ulmad?**. Kaynak: [sim/data/missions.json](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/sim/data/missions.json) ve [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/route.py).

## API total alanlar? ? ayn? kapsaml? tablolar (2026-11-15)

**Alanlar?n kapsam? farkl?:** km/dk/kcal tek y?n y?r?y??t?r. O? L, iki y?n y?r?y???n metabolik oksijenidir. dose ?Gy, iki y?n y?r?y?? + bilim s?residir. Bunlar rezervi kapsamaz; `status` ise alttaki taahh?t b?t?esine dayan?r. Kaynak: [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/route.py) `_budget`.

| Senaryo / b?t?e | Set | km | dk | kcal | O? L | dose ?Gy | durum | walkback_ok |
|---|---|---:|---:|---:|---:|---:|---|---|
| S2 / default | A | 0.41 | 13.0 | 61.0 | 26.0 | 8.2 | GO | True |
| S2 / default | B | 0.41 | 13.9 | 66.0 | 27.0 | 8.4 | GO | True |
| S2 / default | C | 0.41 | 13.9 | 85.0 | 35.0 | 8.4 | GO | True |
| S3 / default | A | 0.55 | 18.0 | 85.0 | 35.0 | 9.6 | GO | True |
| S3 / default | B | 0.55 | 19.2 | 91.0 | 38.0 | 10.0 | GO | True |
| S3 / default | C | 0.55 | 19.1 | 118.0 | 49.0 | 10.0 | GO | True |
| S3 / o2_80 | A | 0.55 | 18.0 | 85.0 | 35.0 | 9.6 | NO-GO | True |
| S3 / o2_80 | B | 0.55 | 19.2 | 91.0 | 38.0 | 10.0 | NO-GO | True |
| S3 / o2_80 | C | 0.55 | 19.1 | 118.0 | 49.0 | 10.0 | NO-GO | True |

## A?ya g?re y?zde fark ? total alanlar? (2026-11-15)

Form?l: 100?(set/A?1); A ayn? senaryo ve ayn? b?t?e modu i?indir. API?nin yuvarlad??? total alanlar?ndan hesapland???ndan k???k mesafe farklar? s?f?r g?r?nebilir; a?a??da ham profilden daha hassas kar??la?t?rma da vard?r.

| Senaryo / b?t?e | Set | km ?% | dk ?% | kcal ?% | O? ?% | doz ?% | A?ya g?re durum de?i?imi |
|---|---|---:|---:|---:|---:|---:|---|
| S2 / default | A | +0.000 | +0.000 | +0.000 | +0.000 | +0.000 | yok |
| S2 / default | B | +0.000 | +6.923 | +8.197 | +3.846 | +2.439 | yok |
| S2 / default | C | +0.000 | +6.923 | +39.344 | +34.615 | +2.439 | yok |
| S3 / default | A | +0.000 | +0.000 | +0.000 | +0.000 | +0.000 | yok |
| S3 / default | B | +0.000 | +6.667 | +7.059 | +8.571 | +4.167 | yok |
| S3 / default | C | +0.000 | +6.111 | +38.824 | +40.000 | +4.167 | yok |
| S3 / o2_80 | A | +0.000 | +0.000 | +0.000 | +0.000 | +0.000 | yok |
| S3 / o2_80 | B | +0.000 | +6.667 | +7.059 | +8.571 | +4.167 | yok |
| S3 / o2_80 | C | +0.000 | +6.111 | +38.824 | +40.000 | +4.167 | yok |

## Taahh?t b?t?esi ve S3??n 80 L karar? (2026-11-15)

Taahh?t s?re=2?tek y?n y?r?y?? + 30 dk bilim + 30 dk rezerv. Taahh?t kcal=2?y?r?y?? kcal + 60 dk?STOP_METABOLIC_W/4184; O?=taahh?t kcal/4.8. Taahh?t doz=taahh?t saat?8.75. GO bu b?t?e a??mlar?n? dikkate al?r. `walkback_ok` **yaln?z zaman limitini** kontrol eder: NO-GO ile true olmas? beklenen yaz?l?m davran???d?r; oksijenle d?n?? g?vencesi say?lmaz. Kaynak: [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/route.py).

| Senaryo / b?t?e | Set | Taahh?t dk | kcal | O? L | dose ?Gy | O? limiti L | A??lan kaynak |
|---|---|---:|---:|---:|---:|---:|---|
| S2 / default | A | 86.006 | 356.488 | 74.268 | 12.543 | 420.0 | yok |
| S2 / default | B | 87.74 | 365.324 | 76.109 | 12.795 | 370.0 | yok |
| S2 / default | C | 87.74 | 403.938 | 84.154 | 12.795 | 370.0 | yok |
| S3 / default | A | 95.992 | 404.273 | 84.224 | 13.999 | 420.0 | yok |
| S3 / default | B | 98.392 | 416.58 | 86.787 | 14.349 | 370.0 | yok |
| S3 / default | C | 98.286 | 469.783 | 97.871 | 14.333 | 370.0 | yok |
| S3 / o2_80 | A | 95.992 | 404.273 | 84.224 | 13.999 | 80 | o2_L |
| S3 / o2_80 | B | 98.392 | 416.58 | 86.787 | 14.349 | 80 | o2_L |
| S3 / o2_80 | C | 98.286 | 469.783 | 97.871 | 14.333 | 80 | o2_L |

| Senaryo | Set | Taahh?t dk ?% | kcal ?% | O? ?% | dose ?% |
|---|---|---:|---:|---:|---:|
| S2 | A | +0.000 | +0.000 | +0.000 | +0.000 |
| S2 | B | +2.016 | +2.479 | +2.479 | +2.009 |
| S2 | C | +2.016 | +13.310 | +13.311 | +2.009 |
| S3 | A | +0.000 | +0.000 | +0.000 | +0.000 |
| S3 | B | +2.500 | +3.044 | +3.043 | +2.500 |
| S3 | C | +2.390 | +16.204 | +16.203 | +2.386 |

80 L de?i?tirilince taahh?t t?ketimi ve yol ayn? kald??? i?in bu y?zde farklar S3/80L i?in de ayn?d?r; yaln?z limit/karar de?i?mi?tir.

| S3 / 80 L | ?lk a??m m | A?ya g?re mesafe fark? m | ?lk a??m px | ?ndeks (0 tabanl?) | ?nceki h?cre O? L | A??m h?cresi O? L | durum | walkback_ok |
|---|---:|---:|---|---:|---:|---:|---|---|
| A | 490.5 | +0.0 | [488, 746] | 215 | 79.872765 | 80.074089 | NO-GO | True |
| B | 460.8 | -29.7 | [488, 732] | 201 | 79.971227 | 80.067898 | NO-GO | True |
| C | 345.4 | -145.1 | [485, 680] | 147 | 79.891174 | 80.001430 | NO-GO | True |

Her ?? sette ilk ve son a??lan kaynak yaln?z O??dir; A/B/C varsay?lan b?t?esi GO ? ayn? setin 80 L b?t?esi NO-GO olur. Bu noktalar **oksijenin fiziksel olarak s?f?rland??? konum de?ildir**: o konuma kadar gidip geri d?nme + bilim + rezerv taahh?d?n?n ilk kez 80 L?yi a?t??? rota h?creleridir. 2 m ?zgarada ayr?k ilk a??m test edildi; h?creler aras? s?rekli interpolasyon **?l??lmedi**. ?stteki ?zet O? de?erleri 35/38/49 L iken karar O??sinin 84.224/86.787/97.871 L olmas? bu kapsam fark?ndan gelir. Kaynak: [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/42f60aaf5cbebda49026ebd9ccfaf7818e86c915/api/planner/route.py).

## Daha hassas tek y?n farklar? ve rota de?i?imi (2026-11-15)

| Senaryo | Set | km (profil) | dk (profil) | kcal (profil) | km ?% | dk ?% | kcal ?% | Yol h?cresi |
|---|---|---:|---:|---:|---:|---:|---:|---:|
| S2 | A | 0.405622 | 13.002997 | 61.226685 | +0.0000 | +0.0000 | +0.0000 | 186 |
| S2 | B | 0.405622 | 13.869864 | 65.644734 | +0.0000 | +6.6667 | +7.2159 | 186 |
| S2 | C | 0.405622 | 13.869864 | 84.952009 | +0.0000 | +6.6667 | +38.7500 | 186 |
| S3 | A | 0.550617 | 17.996071 | 85.119497 | +0.0000 | +0.0000 | +0.0000 | 244 |
| S3 | B | 0.550617 | 19.195810 | 91.272632 | +0.0000 | +6.6667 | +7.2288 | 244 |
| S3 | C | 0.546617 | 19.143117 | 117.874252 | -0.7265 | +6.3739 | +38.4809 | 242 |

| Senaryo | Set | Yol SHA-256 (s?ra dahil h?cre dizisi) |
|---|---|---|
| S2 | A | `1c871fb13998a8c4c23b76b742aee2b37bfaa307b6a40b2e20a31e0d2b8e3f70` |
| S3 | A | `f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4` |
| S2 | B | `1c871fb13998a8c4c23b76b742aee2b37bfaa307b6a40b2e20a31e0d2b8e3f70` |
| S3 | B | `f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4` |
| S2 | C | `1c871fb13998a8c4c23b76b742aee2b37bfaa307b6a40b2e20a31e0d2b8e3f70` |
| S3 | C | `5b92e8d943bb595786e27f72765a591a9b395375e2b37d942d84d9316447a10c` |

Yol hashleri hangi setlerin ayn? h?cre yolunu se?ti?ini g?sterir. S3??n default ve 80L ko?ullar?nda her set i?in yol hashleri birebir ayn?d?r: b?t?e de?i?ikli?i bu planlay?c?da yolu yeniden optimize etmez, uygunluk karar?n? de?i?tirir. K?tle/h?z/b?t?e B?de birlikte de?i?ti?inden tek bir k?tlenin izole duyarl?l??? ??kar?lamaz; C?B referans g?? ve yeniden se?ilen yol etkisini birlikte i?erir. Tek parametre tornado s?ralamas? **ko?ulmad?**, g?rev kapsam? d???d?r.

## Testler, komutlar ve s?r?mler (2026-11-15)

S?r?mler: {"python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]", "numpy": "2.5.4", "scipy": "1.18.1", "skimage": "0.26.0"}. ?al??t?r?c?: `C:/Users/Batu/Desktop/mm-pr/.venv-api/Scripts/python.exe`; mevcut ortam salt okunur kullan?ld?.

```powershell
# Orkestrat?r TEMP dosyas?n? okur; ?ocuk s?re?ler do?rudan -c ile planner i?e aktar?r.
python -B -c "import os; from pathlib import Path; p=Path(os.environ['TEMP'])/'mm-s2-s3-study/run_study.py'; exec(compile(p.read_text(encoding='utf-8-sig'),str(p),'exec'))"
# ?ocuk komutunun ?emas?:
# .venv-api/Scripts/python.exe -B -c <a?a??daki ?ocuk kodu> <TEMP_repo> <A|B|C> <??kt?_json>
```

```text
A exit=0, 3 ?l??m: S2/default, S3/default, S3/80L
B exit=0, 3 ?l??m: S2/default, S3/default, S3/80L
C exit=0, 3 ?l??m: S2/default, S3/default, S3/80L
PASS: real layers; TEMP imports; flat calibration; walkback; status; 80L crossing; identical path for budget change
PASS: source and TEMP hashes unchanged; SHA=42f60aaf5cbebda49026ebd9ccfaf7818e86c915
PASS: A repeat identical JSON (3 rows), 80 L crossing checks passed
```

Tam A ko?usu ikinci kez ?al??t?r?ld? ve t?m JSON ??kt?s? (?? sat?r + parametre + g?rev limiti + versiyonlar) birebir e?it bulundu. ?lk a??m h?cresinde O?>80 ve bir ?nceki h?crede O??80 assert ile do?ruland?. Ba?ka bir do?rulama sistemi/fiziksel saha testi **yap?lmad?**. Toplam 101 TEMP ve kaynak dosyan?n hash kontrol? de?i?iklik bulmad?. Temel girdilerin SHA-256 de?erleri:

- `contracts/grid.json`: `0d8d8351c687157c6bcfb361a11bdd2d4637c20121926abf1ebc1a98f9157993`
- `docs/metabolic_model.md`: `b5961199cc7e68b6a05938d764253a4fd7dc2df1921188a3a44ece1f6f5dee94`
- `layers/demo_scenarios.json`: `fdb83a0aa3b39f3068aa01f84bebdb9d526eb92c75538c6cd9df5a7c0c0faf27`
- `layers/elevation.npy`: `fc8b8bebd41bf4847a7a3323e9b4a5cae289cfb152ec1a0193f0d1e9633de048`
- `layers/entropy.npy`: `cad1579f723deba8b0175981377f26a4319a4dc492e2b1fa9d8e20a7153bdb05`
- `layers/p_bedrock.npy`: `70e30fae6f8f92bb0afab724f3085609a97dab6d6280069f16b7daa5a90e22c5`
- `layers/p_bigrock.npy`: `e5163cd0794c16035c99e7a6c97bc571c4e0cbb9aa18d59cc1b5ac4827b1bf2e`
- `layers/p_sand.npy`: `6a85435a6a79c8cabc9e76e55208cd53a5a5b3b6e0fdbc02c5d800a3ffb7ee08`
- `layers/p_soil.npy`: `44abb46c8efa30a6ed7ec1de35dae3380423e899fffa13307e3e37468583db90`
- `layers/rock_cfa.npy`: `7f98358f2a326f640d19dbcad8065b0804efb012950e28e95fce3c34cd30431f`
- `layers/slope.npy`: `19de036a5f008c9de0f04c77e84b02a85b17d7193c0c500ffc946edfca195779`
- `sim/data/missions.json`: `239da75791c56836e5a202e353d649a3aaff89c95959d0024ea9a91702a46ec1`
- `api/planner/comparison.py`: `cd0d683650622ab81ab9242230dfa35d6856e89a694d229c6d364e877cb3eed6`
- `api/planner/cost.py`: `e13ee05e8e3fccf61bc028f23a077b436d868268bd4cdba6522a5fbf708e2459`
- `api/planner/layers.py`: `27714668c260bd27cbb9d8794e7422dda8fcabb6351d43981232b800c0772c03`
- `api/planner/params.py`: `8da695bd9e2daef18335423a11812691e5f95e01e051d54c98f1f2882c808913`
- `api/planner/route.py`: `fed331ba02c14defb765f319a6caf2a05d7bd8000faff5d06edc641c10a6d179`
- `api/planner/terrain.py`: `d2bf98bff60c6266c0e0b3d2151b95f2fc1f08327a986bf9006d3ee6160c346b`
- `api/planner/__init__.py`: `f3477b27e6f0db6f85974b565ba81ea21d04211e63dd653505430eea8510c027`

## Ko?ulmayanlar ve s?n?rlamalar (2026-11-15)

G?ncel main **ko?ulmad?**: klonlama tamamlanmad?; izinli 42f60aa alternatifi kullan?ld?. S1 **ko?ulmad?**: ?nceki teslimde var. D/? taramas?, shortest/safest, t?m S3 mission limitlerini birlikte dayatan ek ko?u, fiziksel oksijen/ger?ek insan modeli validasyonu **ko?ulmad?**: bu g?rev kapsam? d???nda. Bu rapor ?ncekine ek yeni dosyad?r; ?nceki dosya de?i?tirilmedi.

## Ger?ek ?al??t?rma kodu (2026-11-15)

TEMP orkestrat?r?; CHILD de?i?kenindeki kod her set i?in `python -c` ile ?al??t?r?lm??t?r.

```python
import sys,os,json,hashlib,subprocess,shutil,time,ast
from pathlib import Path
sys.dont_write_bytecode=True
W=Path(os.environ['TEMP'])/'mm-s2-s3-study';W.mkdir(exist_ok=True)
NEW=Path(os.environ['TEMP'])/'mm-s2-s3-main'
OLD=Path('C:/Users/Batu/Desktop/mm-pr/martian-map')
SRC=NEW if (NEW/'api/planner/route.py').exists() else OLD
ROOT=W/'repo';ROOT.mkdir(exist_ok=True)
for name in ['api','layers','contracts','docs']:
 shutil.copytree(SRC/name,ROOT/name,dirs_exist_ok=True,ignore=shutil.ignore_patterns('__pycache__'))
(ROOT/'sim/data').mkdir(parents=True,exist_ok=True)
shutil.copy2(SRC/'sim/data/missions.json',ROOT/'sim/data/missions.json')
def hashfile(p):return hashlib.sha256(p.read_bytes()).hexdigest()
hashes={p.relative_to(ROOT).as_posix():hashfile(p) for p in ROOT.rglob('*') if p.is_file()}
sha=subprocess.check_output(['git','-C',str(SRC),'rev-parse','HEAD'],text=True).strip()
CHILD=r'''
import sys,os,json,hashlib,importlib,time
from pathlib import Path
sys.dont_write_bytecode=True
root=Path(sys.argv[1]);case=sys.argv[2];dest=Path(sys.argv[3])
sys.path.insert(0,str(root));os.environ['MM_LAYERS_DIR']=str(root);os.environ['MARTIAN_ROCK_BLOCK']='0'
import numpy as np,scipy,skimage
from api import planner
from api.planner import params as P,cost
if case!='A':
 for k,v in dict(BODY_KG=82.,SUIT_KG=104.,TOOLS_KG=23.,BASE_SPEED_MS=.75,EVA_MAX_H=7.,EVA_MAX_KCAL=1800.,EVA_MAX_O2_L=370.).items():setattr(P,k,v)
if case=='C':P.FLAT_REFERENCE_W=352.
importlib.reload(cost)
L=planner.load(root)
assert not L.synthetic and not L.provisional_terrain
assert Path(P.__file__).resolve().is_relative_to(root.resolve())
assert abs(float(cost.metabolic_w(np.array(P.BASE_SPEED_MS),np.array(0.),np.array(P.TERRAIN_ETA['bedrock'])))-P.FLAT_REFERENCE_W)<1e-8
scenarios=json.loads((root/'layers/demo_scenarios.json').read_text(encoding='utf-8'))['scenarios']
missions=json.loads((root/'sim/data/missions.json').read_text(encoding='utf-8'))['missions']
m3=next(m for m in missions if m['id']=='S3');assert m3['limits']['o2_L']==80
rows=[]
for scenario in [s for s in scenarios if s['id'] in ['S2','S3']]:
 for mode in (['default','o2_80'] if scenario['id']=='S3' else ['default']):
  b={'o2_L':m3['limits']['o2_L']} if mode=='o2_80' else None
  r=planner.plan_one(L,scenario['start']['px'],scenario['goal']['px'],kind='balanced',budget=b)
  t=r['total'];prof=r['_prof'];path=r['_path'];bud=t['budget']
  assert t['walkback_ok']==(bud['used']['time_min']<=bud['limits']['time_min'])
  assert t['status']==('NO-GO' if t['limit_exceeded_at_index'] is not None else 'GO')
  if mode=='o2_80':assert bud['limits']['o2_L']==80
  exact={'km':float(prof['cum_m'][-1])/1000,'min':float(prof['sec'].sum())/60,'kcal':float(prof['kcal'].sum())}
  idx=t['limit_exceeded_at_index']
  crossing=None
  if idx is not None:
   committed_kcal=2*np.cumsum(prof['kcal'])+(P.SCIENCE_STOP_MIN+bud['limits']['reserve_min'])*60*P.STOP_METABOLIC_W/4184
   oxygen=committed_kcal/P.KCAL_PER_L_O2
   crossing={'index':idx,'o2_L_at_index':float(oxygen[idx]),'o2_L_previous':float(oxygen[idx-1]) if idx>0 else None,'distance_m_at_index':float(prof['cum_m'][idx])}
   if bud['first_exceeded']==['o2_L']:
    assert oxygen[idx]>bud['limits']['o2_L']
    assert idx==0 or oxygen[idx-1]<=bud['limits']['o2_L']
  rows.append(dict(scenario=scenario['id'],case=case,mode=mode,start=scenario['start']['px'],goal=scenario['goal']['px'],total=t,exact_oneway=exact,weights=r['weights'],path_cells=len(path),path_sha256=hashlib.sha256(path.tobytes()).hexdigest(),crossing=crossing))
for a in rows:
 if a['scenario']=='S3' and a['mode']=='default':
  b=next(x for x in rows if x['scenario']=='S3' and x['mode']=='o2_80')
  assert a['path_sha256']==b['path_sha256'],'budget should not change path'
keys=['BODY_KG','SUIT_KG','TOOLS_KG','BASE_SPEED_MS','EVA_MAX_H','EVA_MAX_KCAL','EVA_MAX_O2_L','FLAT_REFERENCE_W','STOP_METABOLIC_W','SCIENCE_STOP_MIN','RESERVE_MIN','DOSE_UGY_PER_H','TERRAIN_ETA','TERRAIN_SPEED']
output=dict(case=case,params={k:getattr(P,k) for k in keys},calibration=cost.CALIBRATION,versions={'python':sys.version,'numpy':np.__version__,'scipy':scipy.__version__,'skimage':skimage.__version__},mission_S3=m3,rows=rows,tests='PASS: real layers; TEMP imports; flat calibration; walkback; status; 80L crossing; identical path for budget change')
dest.write_text(json.dumps(output,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(output,ensure_ascii=True))
'''
(W/'child_code.txt').write_text(CHILD,encoding='utf-8')
meta={'source':str(SRC),'root':str(ROOT),'sha':sha,'hashes':hashes,'child_code':CHILD,'command':'C:/Users/Batu/Desktop/mm-pr/.venv-api/Scripts/python.exe -B -c <child_code> <TEMP_repo> <A|B|C> <output_json>'}
(W/'metadata.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
for c in 'ABC':
 p=subprocess.run(['C:/Users/Batu/Desktop/mm-pr/.venv-api/Scripts/python.exe','-B','-c',CHILD,str(ROOT),c,str(W/(c+'.json'))],capture_output=True,text=True,timeout=120,env={**os.environ,'PYTHONDONTWRITEBYTECODE':'1'})
 (W/(c+'.log')).write_text(p.stdout+'\n'+p.stderr,encoding='utf-8')
 print(c,p.returncode,p.stderr[-2000:],flush=True)
 if p.returncode:continue
 data=json.loads((W/(c+'.json')).read_text(encoding='utf-8'))
 for row in data['rows']:print(row['scenario'],row['mode'],row['total'],flush=True)
assert all(hashfile(ROOT/k)==v for k,v in hashes.items())
assert all(hashfile(SRC/k)==v for k,v in hashes.items())
print('PASS: source and TEMP hashes unchanged; SHA='+sha,flush=True)

```

## Ham sonu?lar (2026-11-15)

```json
[
  {
    "case": "A",
    "params": {
      "BODY_KG": 80.0,
      "SUIT_KG": 120.0,
      "TOOLS_KG": 10.0,
      "BASE_SPEED_MS": 0.8,
      "EVA_MAX_H": 6.0,
      "EVA_MAX_KCAL": 2000.0,
      "EVA_MAX_O2_L": 420.0,
      "FLAT_REFERENCE_W": 272.0,
      "STOP_METABOLIC_W": 272.0,
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0,
      "DOSE_UGY_PER_H": 8.75,
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
      }
    },
    "calibration": 0.44179254453970973,
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "mission_S3": {
      "id": "S3",
      "title": "Yarım O₂ tüpü",
      "start_px": [
        421,
        545
      ],
      "goal_px": [
        491,
        774
      ],
      "start_stop": "sci_2_sol4635",
      "goal_stop": "sci_4_sol4869",
      "limits": {
        "time_min": 360.0,
        "o2_L": 80,
        "kcal": 2000.0,
        "dose_uGy": 60.0
      },
      "sand": {
        "px": [
          472,
          641
        ],
        "radius_m": 19.4
      },
      "sample_kg": 8,
      "difficulty": "zor",
      "goal": {
        "grid_px": [
          491,
          774
        ],
        "radius_m": 5.0
      },
      "events": [
        {
          "id": "S3-sand",
          "type": "sand",
          "grid_px": [
            472,
            641
          ],
          "radius_m": 19.4
        }
      ]
    },
    "rows": [
      {
        "scenario": "S2",
        "case": "A",
        "mode": "default",
        "start": [
          470,
          589
        ],
        "goal": [
          491,
          774
        ],
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
        "exact_oneway": {
          "km": 0.4056223663640863,
          "min": 13.002997236817775,
          "kcal": 61.22668497373333
        },
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "path_cells": 186,
        "path_sha256": "1c871fb13998a8c4c23b76b742aee2b37bfaa307b6a40b2e20a31e0d2b8e3f70",
        "crossing": null
      },
      {
        "scenario": "S3",
        "case": "A",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
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
        "exact_oneway": {
          "km": 0.5506173157302034,
          "min": 17.996071320953273,
          "kcal": 85.11949653421411
        },
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "path_cells": 244,
        "path_sha256": "f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4",
        "crossing": null
      },
      {
        "scenario": "S3",
        "case": "A",
        "mode": "o2_80",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
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
        "exact_oneway": {
          "km": 0.5506173157302034,
          "min": 17.996071320953273,
          "kcal": 85.11949653421411
        },
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "path_cells": 244,
        "path_sha256": "f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4",
        "crossing": {
          "index": 215,
          "o2_L_at_index": 80.07408920508203,
          "o2_L_previous": 79.87276527965012,
          "distance_m_at_index": 490.4751801064724
        }
      }
    ],
    "tests": "PASS: real layers; TEMP imports; flat calibration; walkback; status; 80L crossing; identical path for budget change"
  },
  {
    "case": "B",
    "params": {
      "BODY_KG": 82.0,
      "SUIT_KG": 104.0,
      "TOOLS_KG": 23.0,
      "BASE_SPEED_MS": 0.75,
      "EVA_MAX_H": 7.0,
      "EVA_MAX_KCAL": 1800.0,
      "EVA_MAX_O2_L": 370.0,
      "FLAT_REFERENCE_W": 272.0,
      "STOP_METABOLIC_W": 272.0,
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0,
      "DOSE_UGY_PER_H": 8.75,
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
      }
    },
    "calibration": 0.4781289526551205,
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "mission_S3": {
      "id": "S3",
      "title": "Yarım O₂ tüpü",
      "start_px": [
        421,
        545
      ],
      "goal_px": [
        491,
        774
      ],
      "start_stop": "sci_2_sol4635",
      "goal_stop": "sci_4_sol4869",
      "limits": {
        "time_min": 360.0,
        "o2_L": 80,
        "kcal": 2000.0,
        "dose_uGy": 60.0
      },
      "sand": {
        "px": [
          472,
          641
        ],
        "radius_m": 19.4
      },
      "sample_kg": 8,
      "difficulty": "zor",
      "goal": {
        "grid_px": [
          491,
          774
        ],
        "radius_m": 5.0
      },
      "events": [
        {
          "id": "S3-sand",
          "type": "sand",
          "grid_px": [
            472,
            641
          ],
          "radius_m": 19.4
        }
      ]
    },
    "rows": [
      {
        "scenario": "S2",
        "case": "B",
        "mode": "default",
        "start": [
          470,
          589
        ],
        "goal": [
          491,
          774
        ],
        "total": {
          "km": 0.41,
          "min": 13.9,
          "eva_min": 57.7,
          "eva_limit_min": 420.0,
          "kcal": 66.0,
          "eva_kcal": 131.0,
          "o2_L": 27.0,
          "dose_uGy": 8.4,
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
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 87.74,
              "kcal": 365.324,
              "o2_L": 76.109,
              "dose_uGy": 12.795
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 13.87,
            "return_kcal": 65.645
          }
        },
        "exact_oneway": {
          "km": 0.4056223663640863,
          "min": 13.869864076939969,
          "kcal": 65.64473393677235
        },
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "path_cells": 186,
        "path_sha256": "1c871fb13998a8c4c23b76b742aee2b37bfaa307b6a40b2e20a31e0d2b8e3f70",
        "crossing": null
      },
      {
        "scenario": "S3",
        "case": "B",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
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
        "exact_oneway": {
          "km": 0.5506173157302034,
          "min": 19.195809921322773,
          "kcal": 91.27263247300141
        },
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "path_cells": 244,
        "path_sha256": "f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4",
        "crossing": null
      },
      {
        "scenario": "S3",
        "case": "B",
        "mode": "o2_80",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
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
        "exact_oneway": {
          "km": 0.5506173157302034,
          "min": 19.195809921322773,
          "kcal": 91.27263247300141
        },
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "path_cells": 244,
        "path_sha256": "f1d9949ae48105f0b5f7fde886abedf45fd18ea8c8ba47e89e856a8356a986c4",
        "crossing": {
          "index": 201,
          "o2_L_at_index": 80.0678977468194,
          "o2_L_previous": 79.97122702585045,
          "distance_m_at_index": 460.81832585698
        }
      }
    ],
    "tests": "PASS: real layers; TEMP imports; flat calibration; walkback; status; 80L crossing; identical path for budget change"
  },
  {
    "case": "C",
    "params": {
      "BODY_KG": 82.0,
      "SUIT_KG": 104.0,
      "TOOLS_KG": 23.0,
      "BASE_SPEED_MS": 0.75,
      "EVA_MAX_H": 7.0,
      "EVA_MAX_KCAL": 1800.0,
      "EVA_MAX_O2_L": 370.0,
      "FLAT_REFERENCE_W": 352.0,
      "STOP_METABOLIC_W": 272.0,
      "SCIENCE_STOP_MIN": 30.0,
      "RESERVE_MIN": 30.0,
      "DOSE_UGY_PER_H": 8.75,
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
      }
    },
    "calibration": 0.6187551152007441,
    "versions": {
      "python": "3.13.12 | packaged by Anaconda, Inc. | (main, Feb 24 2026, 16:05:56) [MSC v.1942 64 bit (AMD64)]",
      "numpy": "2.5.4",
      "scipy": "1.18.1",
      "skimage": "0.26.0"
    },
    "mission_S3": {
      "id": "S3",
      "title": "Yarım O₂ tüpü",
      "start_px": [
        421,
        545
      ],
      "goal_px": [
        491,
        774
      ],
      "start_stop": "sci_2_sol4635",
      "goal_stop": "sci_4_sol4869",
      "limits": {
        "time_min": 360.0,
        "o2_L": 80,
        "kcal": 2000.0,
        "dose_uGy": 60.0
      },
      "sand": {
        "px": [
          472,
          641
        ],
        "radius_m": 19.4
      },
      "sample_kg": 8,
      "difficulty": "zor",
      "goal": {
        "grid_px": [
          491,
          774
        ],
        "radius_m": 5.0
      },
      "events": [
        {
          "id": "S3-sand",
          "type": "sand",
          "grid_px": [
            472,
            641
          ],
          "radius_m": 19.4
        }
      ]
    },
    "rows": [
      {
        "scenario": "S2",
        "case": "C",
        "mode": "default",
        "start": [
          470,
          589
        ],
        "goal": [
          491,
          774
        ],
        "total": {
          "km": 0.41,
          "min": 13.9,
          "eva_min": 57.7,
          "eva_limit_min": 420.0,
          "kcal": 85.0,
          "eva_kcal": 170.0,
          "o2_L": 35.0,
          "dose_uGy": 8.4,
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
              "time_min": 420.0,
              "kcal": 1800.0,
              "o2_L": 370.0,
              "dose_uGy": 60.0,
              "reserve_min": 30.0
            },
            "used": {
              "time_min": 87.74,
              "kcal": 403.938,
              "o2_L": 84.154,
              "dose_uGy": 12.795
            },
            "exceeded": [],
            "first_exceeded": [],
            "return_min": 13.87,
            "return_kcal": 84.952
          }
        },
        "exact_oneway": {
          "km": 0.4056223663640863,
          "min": 13.869864076939969,
          "kcal": 84.95200862405832
        },
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "path_cells": 186,
        "path_sha256": "1c871fb13998a8c4c23b76b742aee2b37bfaa307b6a40b2e20a31e0d2b8e3f70",
        "crossing": null
      },
      {
        "scenario": "S3",
        "case": "C",
        "mode": "default",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
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
        "exact_oneway": {
          "km": 0.5466173157302033,
          "min": 19.143116741944723,
          "kcal": 117.87425242297273
        },
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "path_cells": 242,
        "path_sha256": "5b92e8d943bb595786e27f72765a591a9b395375e2b37d942d84d9316447a10c",
        "crossing": null
      },
      {
        "scenario": "S3",
        "case": "C",
        "mode": "o2_80",
        "start": [
          421,
          545
        ],
        "goal": [
          491,
          774
        ],
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
        "exact_oneway": {
          "km": 0.5466173157302033,
          "min": 19.143116741944723,
          "kcal": 117.87425242297273
        },
        "weights": {
          "t": 1.0,
          "k": 12.0,
          "r": 22.0
        },
        "path_cells": 242,
        "path_sha256": "5b92e8d943bb595786e27f72765a591a9b395375e2b37d942d84d9316447a10c",
        "crossing": {
          "index": 147,
          "o2_L_at_index": 80.00143018654953,
          "o2_L_previous": 79.89117428460143,
          "distance_m_at_index": 345.36248173426395
        }
      }
    ],
    "tests": "PASS: real layers; TEMP imports; flat calibration; walkback; status; 80L crossing; identical path for budget change"
  }
]
```
