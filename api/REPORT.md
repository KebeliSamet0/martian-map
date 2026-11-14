# Planlayıcı API raporu (2026-11-14)

PR: https://github.com/KebeliSamet0/martian-map/pull/24

Dal: `samet/planner`, hedef: `main`. PR gövdesi `Refs #16` ve OpenAI Codex
imzasını içerir; PR birleştirilmedi.

## Tamamlananlar

- Önceden yazılmış params/layers/cost/route çekirdeği sürüm kontrolüne alındı.
- `_contrast` yalnız seçilen kesime göre daha kötü risk, eğim, kum, güven,
  süre ve enerji terimlerini açıklar. Daha düşük enerji olumsuzluk diye yazılmaz.
  Hem |süre farkı| < 1 dk hem |enerji farkı| < 5 kcal ise ayrılma atlanır.
- FastAPI, CORS(*), yaşam döngüsü başına tek `planner.load()` çağrısı;
  `/health`, `/grid`, `/assumptions`, `/route`, `/replan` uçları eklendi.
- PlanError Türkçe 422; tam sayı koordinat, sonlu/negatif olmayan ağırlık ve
  gözlem yarıçapı doğrulaması eklendi.
- Sekiz katman için NumPy + Pillow ile RGBA PNG; başlıksız, satır öncelikli
  little-endian float32 BIN eklendi. Matplotlib kullanılmadı.
- Gereksinimler, çalıştırma ve curl örnekleri, sözleşme alan açıklamaları yazıldı.
  Sözleşme örneği sentetik katmanda `[110,235]` → `[110,227]` için gerçek
  `balanced` çıktısıdır; tam iki segment içerir.

## Test sonucu

Ortam: `.venv/bin/python`, Python 3.12.15.

```text
$ .venv/bin/python -m pytest api/tests -q
..............................                                           [100%]
30 passed, 1 warning in 0.61s
```

Testler: üç ön ayar, segment/rota uzunluk tutarlılığı, shortest süre sırası,
API/çekirdek çıktı eşitliği, CORS, metadata, geçilmez ve bağlantısız noktalar,
geçersiz istekler, kum gözleminin etkisi ve istek izolasyonu, sekiz PNG'nin
boyut/modu, sekiz BIN'in kaynak değerlerle birebir eşitliği, bilinmeyen katman,
kontrast regresyonları, balanced ağırlık değişimi, tek yükleme ve gerçek
sözleşme örneği. `git diff --check` temiz.

Tek uyarı kurulu Starlette sürümünün TestClient için httpx yerine httpx2'ye
geçiş önerisidir; test başarısızlığı yok. Uyarı bastırılmadı.

## Varsayımlar ve bilinen eksikler

- Gözlemler yalnız ilgili `/replan` isteğinde uygulanır. Katman uçları ve sonraki
  istekler başlangıç verisini kullanır; kalıcı gözlem deposu yoktur. İstemci
  gerekirse tüm gözlem geçmişini tekrar gönderir. Son gözlem çakışmada kazanır.
- `weights` verildiğinde t/k/r birlikte beklenir ve yalnız balanced değişir.
  `/replan` da isteğe bağlı aynı ağırlıkları kabul eder.
- `shortest` adı mevcut çekirdekten korunmuştur; optimize edilen büyüklük
  geometrik uzunluk değil süredir. Rotaların birbirinden farklı olması garanti
  değildir. Segment/toplam değerleri farklı hassasiyetle yuvarlanır.
- Gerçek veri entegrasyonu, Pandolf/Mars kalibrasyonu, risk modeli ve EVA
  varsayımları doğrulanmadı. O₂ ve doz tahminleri operasyonel güvenlik kararı
  için doğrulanmış değildir. Mevcut çekirdeğin hücre maliyeti toplama yaklaşımı
  korunmuştur; grafın kenar ortalaması ile raporlanan hedef-hücre integrali
  arasında küçük farklar olabilir.
- PNG renkleri görselleştirme içindir: eğim 0–25°, oranlar 0–1; elevation
  kendi min/max aralığına ölçeklenir. Ölçüm ve 3D için BIN kullanılmalıdır.
- Gerçek katman dosyalarının şekil/NaN/no-data doğrulaması ve büyük haritalarda
  performans testi bu kapsamda yapılmadı. `_contrast` yol çiftleri arasında
  mesafe matrisi kurar; çok uzun yollarda bellek kullanımı artabilir.
- Borje `build_context` çağrısı çalışma alanının uygulamada açık olmadığını
  bildirdi. `borje_status` uygulamanın çalıştığını doğruladı. Hafıza dosyaları
  doğrudan taranmadı; çalışma kullanıcı talimatları ve kaynak dosyalara dayandı.
- `.venv`, `layers/*.npy`, büyük dosyalar ve yerel Borje/ajan yapılandırmaları
  commit'e alınmadı. Yalnız API ve sözleşme dosyaları eklendi.

## Commit düzeni

1. `c94faa9`: planlayıcı çekirdeği ve alternatif açıklama düzeltmesi.
2. `f77c369`: FastAPI uçları, bağımlılıklar ve testler.
3. `0d5c823`: API kullanım dokümanı ve gerçek sözleşme.
4. Bu rapor ayrı bir kapanış commit'i olarak aynı PR'a eklenir.
