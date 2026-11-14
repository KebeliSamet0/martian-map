# Planlayıcı API

Python 3.12; komutlar repo kökünden çalıştırılır:

```sh
.venv/bin/python -m pip install -r api/requirements.txt
source .venv/bin/activate
uvicorn api.main:app --reload --port 8000
```

Katmanlar uygulama başlangıcında `planner.load()` ile bir kez yüklenir. Ortam değişkeni yoksa deterministik 250×250 sentetik arazi kullanılır.
Gerçek katman dizini `MARTIAN_LAYERS_DIR=/tam/yol` ile seçilir; eski
`MM_LAYERS_DIR` de desteklenir. Klasörün `grid.json` manifesti ve katmanları
doğrulanır; hatalı veya kısmi zemin paketinde Türkçe hata verilir. Zemin olasılık
(`p_soil`, `p_bedrock`, `p_sand`, `p_bigrock`) ve `entropy` dosyalarının tamamı
henüz yoksa yükleyici bunları eğim ve `rock_cfa`'dan bellekte geçici kuralla
üretir (`entropy >= 0.75`) ve `/grid`, `/assumptions` ile segment `reason`
alanlarında `"geçici zemin katmanı (model çıktısı değil)"` olarak işaretler;
gerçek dosyalar geldiğinde kod değişikliği olmadan otomatik kullanılır.
Ayrıntılar contracts/README.md içinde. Her worker kendi
katmanını yükler; reload yeni yaşam döngüsü başlatır. CORS tüm origin'lere açıktır.
OpenAPI ve deneme arayüzü: `http://localhost:8000/docs`.

```sh
curl http://localhost:8000/health
curl http://localhost:8000/grid
curl http://localhost:8000/assumptions
curl -X POST http://localhost:8000/route -H 'Content-Type: application/json' \
  -d '{"start":[110,235],"goal":[150,30]}'
curl -X POST http://localhost:8000/route -H 'Content-Type: application/json' \
  -d '{"start":[110,235],"goal":[150,30],"weights":{"t":1,"k":10,"r":4}}'
curl -X POST http://localhost:8000/replan -H 'Content-Type: application/json' \
  -d '{"start":[110,235],"goal":[150,30],"observations":[{"px":[110,235],"radius_m":600,"cls":"sand"}]}'
curl http://localhost:8000/layers/slope.png -o /tmp/slope.png
curl http://localhost:8000/layers/elevation.bin -o /tmp/elevation.bin
curl http://localhost:8000/layers/speed_mps.bin -o /tmp/speed_mps.bin
curl http://localhost:8000/layers/scan_class.png -o /tmp/scan_class.png
curl -X POST http://localhost:8000/step -H 'Content-Type: application/json' \
  -d '{"path":[[110,235],[111,235],[112,234]],"load_kg":5}'
```

`/route` ve `/replan`, `{grid, routes}` döndürür. Üç ön ayar: `shortest`,
`balanced`, `safest`. `shortest` süreyi en aza indirir; geometrik mesafeyi değil.
İsteğe bağlı `weights` yalnız `balanced` rotayı değiştirir; t, k, r birlikte,
sonlu ve negatif olmayan sayılar olmalı; en az biri pozitif olmalı.
Koordinatlar tam sayı `[x,y]` (sütun, satır), başlangıç sol üst köşedir.
Geçilmez/ızgara dışı noktalar ve bulunamayan yollar Türkçe `detail` ile 422 döner.
Şema doğrulama hataları standart FastAPI 422 biçimindedir.

Gözlem sınıfları: `soil`, `bedrock`, `sand`, `bigrock`. Yarıçap metre cinsinden,
sonlu ve sıfır veya pozitif olmalıdır. Gözlemler sırayla katman kopyalarına
uygulanır; çakışan alanda son gözlem geçerlidir. Kalıcı kayıt yapılmaz; sonraki
istekler ve katman uçları başlangıç katmanını kullanır. Gözlem geçmişini korumak
isteyen istemci tüm gözlemleri her `/replan` isteğinde göndermelidir.

Katman adları: `slope`, `rock_cfa`, `p_sand`, `p_bedrock`, `p_soil`,
`p_bigrock`, `entropy`, `elevation`. Bilinmeyen adlar 404 döner.
PNG: grid boyutunda RGBA; düşük değer koyu mavi, yüksek değer turuncu.
Eğim 0–25°, oran/olasılık/entropi 0–1, yükseklik katmanın min–max aralığına
ölçeklenir. Sonlu olmayan değerler saydamdır. Görselden ölçüm türetilmemelidir.
BIN: başlıksız, satır öncelikli (C order), little-endian float32; uzunluğu
`width * height * 4` bayt. Değer `[y,x]` konumundadır, satırlar çevrilmez.
Örneğin `np.frombuffer(raw, dtype='<f4').reshape(height, width)`.

Sözleşme: [alanlar](../contracts/README.md), [örnek](../contracts/route.example.json).
Model varsayımları `/assumptions` üzerinden okunmalıdır; gerçek operasyon için
metabolik/risk modeli doğrulanmış değildir.

```sh
.venv/bin/python -m pytest api/tests -q
```

Kapı 2: isteğe bağlı `budget` her iki rota ucunda da desteklenir. Yanıttaki
`total.budget`, dönüş/durak/yedek dahil tüketimi ve limitleri; `total.status`,
`limit_exceeded_at_px` ve `limit_exceeded_at_index` karar ve ilk aşımı verir.

Zemin katsayıları yalnız `params` → `terrain.load_terrain()` üzerinden yüklenir.
`docs/metabolic_model.md` yoksa params varsayılanları kullanılır. Belge geldiğinde
`| class | eta | speed |` başlıklı Markdown tablosunda `soil`, `bedrock`, `sand`,
`bigrock` satırları ve pozitif sonlu sayılar beklenir. Eksik/bozuk tablo sessizce
yok sayılmaz. `eta` Pandolf katsayısı, `speed` temel hız çarpanıdır.

Performans ölçümünü tekrarlamak için (başlangıç yüklemesi ayrı ölçülür):
```sh
.venv/bin/python -m api.benchmarks.route_perf 2000
.venv/bin/python -m api.benchmarks.route_perf 4000
```
