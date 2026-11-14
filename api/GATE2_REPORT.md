# Kapı 2 raporu (2026-11-14)

PR: https://github.com/KebeliSamet0/martian-map/pull/25
Dal: `samet/planner-gate2`; hedef `main`; gövdede `Refs #16`; birleştirilmedi.

## Yapılanlar
- Var olan süre/kcal/risk segment dökümleri ve EVA hesabı genişletildi.
- Sınıf/eğim bandı değişiminde veya ~100 m'de bölme; kısa parçalar korunur.
- Süre, kcal, O₂, doz bütçeleri; dönüş, bilim durağı ve yedek tüketimi.
- GO/NO-GO, ilk aşım mesafesi, hücresi, indeksi ve aşım nedenleri.
- Radyasyon hücre maliyeti değildir; EVA süresi × tek params doz hızı.
- Varsayılan 0.21 mGy/gün: Hassler 2014, doi:10.1126/science.1244797.
- MARTIAN_LAYERS_DIR ve eski MM_LAYERS_DIR; değişken yoksa sentetik veri.
- Manifest dosya yolları, şekil, NaN/Inf/no-data, değer aralıkları ve
  olasılık toplamı; CRS/çözünürlük/origin metadata tutarlılığı doğrulanır.
- Zemin katsayıları tek yükleyicide; metabolic_model.md yoksa params.
- Mount Sharp referans hücre/polyline karşılaştırması: simetrik ortalama/maks
  sapma, tek yön süre/kcal farkı (bizim rota eksi referans) ve testleri.

## Test çıktısı
```text
.venv/bin/python -m pytest -q
49 passed, 1 warning in 0.54s
 git diff --check: temiz
```
Uyarı: Starlette TestClient/httpx kullanımının gelecekte kaldırılması.
Testler bütçe eşitliği/ilk aşım/sıfır mesafe, her iki API ucu, gerçek paket,
bozuk metadata/no-data, segment toplamları ve referans geometrisini kapsar.

## Performans
Python 3.12.15, macOS arm64, 24 GiB RAM; seed=7, res=8 m; tek ölçüm.
TestClient POST /route, üç ön ayar, cProfile ve JSON dahil; ağ hariç.
| Izgara | Başlangıç → hedef | Katman üretimi | /route |
|---|---|---:|---:|
| 2000² | [880,1880] → [1200,240] | 1.107 s | 1.859 s |
| 4000² | [1760,3760] → [2400,480] | 4.842 s | 7.958 s |
4000²: üç grafik araması ~6.339 s; maliyet yüzeyleri 0.636 s,
alternatif açıklamaları 0.462 s. Hücre sayısı 4 kat olunca süre ~4.3 kat.
Basit iyileştirme: baskın sınıf tüm grid yerine yalnız rota hücrelerinde.
Tekrar: `.venv/bin/python -m api.benchmarks.route_perf 2000` (veya 4000).

## Sözleşme değişiklikleri
Mevcut alanlar silinmedi/yeniden adlandırılmadı; eski tüketim kapsamı korundu.
Her iki isteğe isteğe bağlı budget; total'a status, budget ve aşım px/index.
limit_exceeded_at_m artık dört bütçeden herhangi birinin ilk aşımını gösterir.
contracts/README.md, grid.example.json ve gerçek route.example.json güncel.

## Bilinen eksikler
- Gerçek Mars katmanı ve Mount Sharp referansı gelmedi; test paketleri sentetik.
- NPY kendi CRS'sini taşımaz; doğrulama manifest beyanına dayanır.
- No-data paketleri reddedilir; otomatik doldurma/yeniden projeksiyon yok.
- Metabolizma, kaynak limitleri ve sabit doz operasyonel olarak doğrulanmadı.
- Dönüş aynı yoldan simetrik; eski hedef-hücre integrali ile arama kenar
  ortalaması arasında fark olabilir. Polyline metriği hücre örneklemesine bağlı.
- Alternatif açıklamasının mesafe matrisi uzun yollarda karesel bellek kullanır.
- Borje çalışıyor; build_context çalışma alanı açık değil hatası verdi.
- Dockerfile, scripts/ ve web/ değiştirilmedi; yerel ajan dosyaları eklenmedi.
