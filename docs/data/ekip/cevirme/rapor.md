# Sprint 2 / issue #49 — px → 3D arazi doğrulama raporu

**Tarih:** 2026-11-14. **Kapsam:** araştırma, bağımsız dönüşüm dosyası ve çalıştırılmış sayısal test. Yazılan bütün teslimatlar bu `docs/data/ekip/cevirme/` dizinindedir. `sim/`, `.borje/`, planlayıcı deposu, ayarlar ve git üzerinde değişiklik yapılmadı. Tarayıcıda çizginin/karakterin görsel yerleşimi **ölçülmedi**; bu rapor sayısal entegrasyon doğrulamasıdır.

## Sonuç ve öncelikli öneri

1. Koordinat dönüşümü belirli ve test edilebilir: **X = 2268.218001363 + 1.992978870124×sütun**, **Z = 3499.496536437 + 2×satır** (sürekli px / δ=0). Tam sayı hücrenin merkezine yerleştirme için X'e **0.996489435062 m**, Z'ye **1 m** eklenir. Kaynaklar: [grid.json](C:/Users/Batu/Desktop/mm-pr/martian-map/contracts/grid.json), [Geo](../../../../sim/app/geo.js), [manifest](../../../../sim/data/tiles/manifest.json). Tam açıklama: [px_to_world.md](px_to_world.md).
2. Dört dış köşe ve dosyada bulunan **dört** bilim durağının hepsi sim sınırları içinde ve L0 bilineer örnekleri geçerli. İstenen beşinci durak dosyada bulunmadı; beşinci durağın kontrolü **ölçülmedi**. Kaynak: [science_stops.json](C:/Users/Batu/Desktop/mm-pr/martian-map/layers/science_stops.json), [test_results.json](test_results.json).
3. Aynı nominal px konumunda iki DEM eşdeğer değil: **1024/1024** geçerli örnek, `sim−planner` ortalama **+7.177935 m**, **RMSE 9.736575 m**. Sadece bu ortalamayı çıkarmak bile **6.578612 m** merkezlenmiş RMSE bırakır. Kaynak: [CSV](height_samples.csv), [JSON](test_results.json).
4. Sabit yatay ve dikey eşleme: **+15.34 px doğu, +16.76 px güney**, ardından sim yüksekliğinden **15.130872 m çıkarma**. 512 bağımsız doğrulama noktasında RMSE **1.226415 m**, kalan ortalama **+0.078980 m**. Bu ampirik DEM-DEM eşlemesidir; koordinat sözleşmesinde kanıtlanmış bir hata veya genel geçer datum dönüşümü değildir. **Otomatik uygulanmadı.** Kaynak: test `fit` alanı ve aşağıdaki yöntem.
5. Bu akşam için araştırma önerisi: rotanın X/Z'sini sözleşmeyle hesaplayın, Y'sini **sim yüzeyinden** alın. Böylece planlayıcının DEM yüksekliğini başka yüzeye zorla yapıştırmak gerekmez. Kalıcı çözüm iki tarafı aynı coğrafi referanslı DEM ve yeniden örnekleme zincirine bağlamak; kaynak ürünler arasındaki ampirik farkı sözleşmeye gizlice gömmemektir. Bu bir öneridir, uygulanmamıştır. Dayanak: yukarıdaki farklar ve [Terrain.heightAt](../../../../sim/app/terrain.js).

## Köşe ve bilim durağı kapsam testi

Kaynaklar: grid/sim manifest başlıkları, science_stops.json, L0 `h/0/*.u16`; tam hassasiyet ve örneklenen yükseklikler [JSON `locations`](test_results.json) içindedir. Tabloda sürekli px, **δ=0**, yükseklikler sim'in mutlak areoid yüksekliğidir.

| Nokta | px `[c,r]` | X m | Z m | Sim H m | Sınır / L0 |
| --- | --- | ---: | ---: | ---: | --- |
| NW dış kenar | [0,0] | 2268.218 | 3499.497 | −3877.380 | İçeride / geçerli |
| NE dış kenar | [1000,0] | 4261.197 | 3499.497 | −3629.365 | İçeride / geçerli |
| SW dış kenar | [0,1000] | 2268.218 | 5499.497 | −3562.360 | İçeride / geçerli |
| SE dış kenar | [1000,1000] | 4261.197 | 5499.497 | −3379.415 | İçeride / geçerli |
| sci_1_sol4617 | [433.5,525.2] | 3132.174 | 4549.897 | −3605.709 | İçeride / geçerli |
| sci_2_sol4635 | [421.2,545.3] | 3107.661 | 4590.097 | −3595.690 | İçeride / geçerli |
| sci_3_sol4668 | [470.5,589.1] | 3205.915 | 4677.697 | −3594.138 | İçeride / geçerli |
| sci_4_sol4869 | [491.3,774.6] | 3247.369 | 5048.697 | −3559.940 | İçeride / geçerli |

World Y = H + 4271.1 m; tablodaki mutlak negatif H değerleri dünya Y olarak kullanılmamalı. Örneğin ilk bilim durağının dünya Y'si **665.391216 m**. Kaynak: manifest `z_min_data`, JSON `locations`.

## Yükseklik karşılaştırma yöntemi

- Planlayıcı girdisi [layers/elevation.npy](C:/Users/Batu/Desktop/mm-pr/martian-map/layers/elevation.npy): 1000×1000 Float32. [Üretici](C:/Users/Batu/Desktop/mm-pr/martian-map/pipeline/gale_grid.py) USGS merged DEM v3'ten 2×2 blok ortalaması oluşturuyor. Sim girdisi manifest'teki **DTEEC_019698_1750_019988_1750_U01**, yaklaşık 1.011746795 m projeksiyon örnek aralığı. Bunlar aynı dosya değildir. Kaynaklar: üretici kodları, manifest. Uzak kaynak COG bu görevde tekrar okunmadı; yerel döşemeler kullanıldı.
- 32×32 düzenli dağılımlı örnek: `axis=np.linspace(40,959,32).astype(int)`; tüm kartezyen çarpım **1024 hücre**. Dış 40 hücre, yatay aramanın sınıra taşmasını önlemek için dışarıda bırakıldı. Grid bütününün her pikseli test edilmedi. Kaynak: [check_coords.py](check_coords.py).
- Referans `elevation[row,column]`; sim L0'da aynı projeksiyon noktasında **bilineer** örneklendi. Dört komşudan herhangi biri `q=0` ise örnek geçersiz sayılır. L0 adresinde 1 örnek kenarlık vardır; format little-endian uint16, `H=-4400+q×0.05`. Kaynak: [build_tiles.py](../../../../sim/tools/build_tiles.py), [Terrain.heightAt](../../../../sim/app/terrain.js).
- **δ=0** ana sonuç mevcut sürekli koordinat sözleşmesiyle; **δ=0.5** ise elevation hücre merkezi alternatifidir. Bu ikinci alternatif tek başına DEM farkını gidermez. Sim'in kaynak raster merkezlerini mesh köşelerine yerleştirme yaklaşımı ayrı yaklaşık yarım kaynak piksel ayrıntısı taşır; COG jeoreferansı ile doğrudan mutlak merkez doğrulaması bu görevde **ölçülmedi**. Buradaki sayılar sim'in mevcut gerçek `heightAt` davranışına karşıdır.
- `d=H_sim−H_planner`; bias=mean(d), RMSE=sqrt(mean(d²)), merkezlenmiş RMSE=std(d). İki ürün arasındaki kesin hata payı ve hangisinin fiziksel olarak doğru olduğu **ölçülmedi**; bağımsız yer kontrol noktası yoktur.

| Ölçüm | N | Bias sim−planner m | Ham RMSE m | Ortalama çıkarılınca RMSE m |
| --- | ---: | ---: | ---: | ---: |
| Sözleşme sürekli px (δ=0) | 1024 | +7.177935 | 9.736575 | 6.578612 |
| Hücre merkezi (δ=0.5) | 1024 | +7.443230 | 9.807194 | 6.385874 |
| Yatay eşleme uygulanmış, dikey fark çıkarılmamış | 1024 | +15.170362 | 15.219246 | 1.218835 |
| Eşleme + eğitimde bulunan dikey fark çıkarılmış, bağımsız test | 512 | +0.078980 | 1.226415 | 1.223869 |

Ana karşılaştırmanın mutlak hatası %95 yüzdelik **16.377091 m**, en büyük **29.909647 m**. Ampirik eşleme ve eğitim dikey farkından sonra bağımsız testte %95 mutlak hata **2.563244 m**, en büyük **5.354264 m**. Kaynak: JSON `baseline_edge`, `fit.holdout_after_train_vertical_correction`.

## Sabit kaymanın sayısı, yönü ve uygulanma sınırı

Arama eğitim kümesindeki **merkezlenmiş RMSE**'yi küçültür: `dx,dy∈[-32,+32] px`, 2 px adım; seçilen noktanın ±2 px çevresinde 0.2 px adım; sonra ±0.2 px çevresinde 0.02 px adım. Rastgele bölme `default_rng(49)`, 512 eğitim / 512 test. Dikey sabit yalnız eğitim artıklarından hesaplandı. Bu yöntem sınırlı taramadır; küresel optimum, istatistiksel güven aralığı ve başka bölgede geçerlilik **ölçülmedi**. Rastgele test noktaları aynı 2×2 km bölgeye aittir; başka coğrafyaya genelleme kanıtı değildir. Kaynak: [test kodu](check_coords.py).

```text
H_sim(c+15.34, r+16.76) − 15.130871724 ≈ H_planner(c,r)
```

Burada pozitif `dx` doğu, pozitif `dy` güneydir; kayma **sim örnekleme konumuna** eklenir. Eşdeğer projeksiyon kayması **+30.68 m doğu / +33.52 m güney**; dünya X kayması `30.68*cos(lat0) ≈ +30.5723 m`, dünya Z kayması **+33.52 m**. Hücre merkezi modu seçilmişse aynı fiziksel örnekleme için ek kaymalar **+14.84 / +16.26 px** olur; yarım hücreyi iki kez eklemeyin.

Bu sonuç “bütün rotayı bu kadar kaydırın” talimatı değildir. Hem coğrafi rota hem doku eşlemesi etkilenir; bağımsız ortofoto/rover kontrolü bu görevde **ölçülmedi**. Hedef yalnız sim yüzeyinde yürümekse **X/Z sözleşme dönüşümünü koruyup Y'yi sim'den almak** önerilir. Hedef iki DEM'deki aynı morfolojik özelliği çakıştırmaksa yukarıdaki sayılar kontrollü karşılaştırma için aday başlangıçtır; son fiziksel doğrulama yapılmadan kalıcı koordinat düzeltmesi sayılmamalı. Planner H'den sim H tahmini istenirse eşlenmiş konumda **+15.130872 m** eklenir; karakteri gerçek mesh'e oturturken bunun yerine sim yüzeyi örneklenmelidir.

## Çalışan servisler ve rota testi

Yerel HTTP yanıtları [test_results.json](test_results.json) içinde durum, hash ve sayısal kontrollerle kaydedilmiştir. Test POST'ları yalnız hesaplama içindir; `/replan` gözlemi API kodunda kopyalanmış katmana uygulanır, depo dosyası yazılmaz. Kaynak: [api/main.py](C:/Users/Batu/Desktop/mm-pr/martian-map/api/main.py), [Layers.copy](C:/Users/Batu/Desktop/mm-pr/martian-map/api/planner/layers.py).

- `GET http://127.0.0.1:8000/grid`: **200**; boyut/resolution dosyayla eşleşti; `synthetic=false`, `provisional_terrain=true`, **4 bilim durağı**. Ancak canlı yanıtta `origin_xy_m` ve `crs` **yok**. Mevcut `/grid` yanıtı tek başına dönüşüm için yeterli değil; tam `contracts/grid.json` ayrıca kullanılmalı. Bu API değişikliği önerisidir, uygulanmadı.
- `GET http://127.0.0.1:8001/sim/data/tiles/manifest.json`: **200**, disk manifest'iyle eşit.
- `POST /route`, `start=[433,525], goal=[491,774]`: shortest/balanced/safest yollarının her birinde **258 segment noktası** okundu; tümü sim dikdörtgeninde ve L0 yüksekliği geçerli; başlangıç/bitiş eşleşti.
- `POST /replan`, aynı başlangıç/hedef, `observations=[{px:[467,609],radius_m:20,cls:"sand"}]`: shortest **258**, balanced **259**, safest **259** nokta; hepsi sim sınırında ve L0 geçerli; başlangıç/bitiş eşleşti. Segmentlerin ortak uçları sayımda tekrar bulunabilir; bunlar benzersiz nokta sayıları değildir.

Canlı rota testi, dönüşümün arazi kapsamına oturduğunu gösterir; rotanın güvenliğini, planlayıcı maliyet doğruluğunu veya 3B çizimin görsel sonucunu kanıtlamaz. Bunlar **ölçülmedi**. Gösterilen sayılar test anına aittir; başka desk servis/veri güncellerse yeniden çalıştırılmalıdır.

## Tekrarlanabilir test komutları ve çıktı

Workspace kökü `C:/Users/Batu/Desktop/martian-map-main` içinden:

```powershell
python -B martian-map-main/docs/data/ekip/cevirme/check_coords.py
node --check martian-map-main/docs/data/ekip/cevirme/px_to_world.js
```

Başka checkout için:

```powershell
python -B martian-map-main/docs/data/ekip/cevirme/check_coords.py --planner C:/Users/Batu/Desktop/mm-pr/martian-map --sim C:/Users/Batu/Desktop/martian-map-main/martian-map-main/sim
```

Gereksinimler: mevcut Python + NumPy + Node. Bu görevde paket kurulmadı. `-B` ve `sys.dont_write_bytecode=True` pycache yazımını engeller. Script çıktı yolunu kullanıcıdan almaz; yalnız kendi teslimat dizinine `test_results.json`, `height_samples.csv`, `test_output.txt` yazar. HTTP kaynakları mevcut olmalı; yoksa JSON'a servis hatası kaydeder, hata başarılı HTTP testi gibi yorumlanmamalı.

Çalıştırılmış sayısal testler:

```text
Python/JS ortak koordinat noktası: 1032; iki merkez modu
JS vs gerçek sim Geo maksimum X/Z farkı: 1.856279e-9 m
JS dünya->px geri dönüş maksimum farkı: 1.862759e-10 px
Python vs JS maksimum fark: 2.842171e-14 (x,z metre; lon,lat derece ayrı alanlarda karşılaştırıldı)
Gerçek Terrain.heightAt vs Python L0: 1024 nokta, maksimum fark 1.136868e-12 m: PASS
1024 yükseklik örneği: geçerli=1024, NoData=0
Kontrol edilen 7 kaynak dosyanın çalışma öncesi/sonrası SHA-256 eşitliği: PASS
Python: boyut, sınır, >=200 örnek, NaN reddi, bilinen NW,
        asimetrik sentetik yüzey, tile kenarlığı, bilineer örnekleme, NoData: PASS
python -B check_coords.py: process exit code 0
node --check px_to_world.js: process exit code 0
İki Markdown teslimatının UTF-8 / kod bloğu / yerel bağlantı kontrolü: PASS
```

Gerçek `Terrain.heightAt` karşılaştırması, kaynak import satırlarını yalnız bellekte çıkartıp renderer constructor'ını çağırmadan metodu çalıştırır; `sim/` kaynakları değiştirilmez. Nihai sayısı/hatası ve giriş hash'lerinin çalışma boyunca değişip değişmediği [test_output.txt](test_output.txt) ve [test_results.json](test_results.json) içindedir. GPU, görsel FPS ve dinamik LOD geçiş testi **ölçülmedi**.

## Teslimatlar ve veri izi

- [px_to_world.md](px_to_world.md): formül, eksenler, hücre kenarı/merkezi, yükseklik semantiği.
- [px_to_world.js](px_to_world.js): saf JS dönüşümü, ters dönüşüm ve NoData koruyan dünya Y decoder'ı.
- [check_coords.py](check_coords.py): Python dönüşümü + tekrar çalıştırılabilir test/ölçüm aracı.
- [height_samples.csv](height_samples.csv): 1024 ham planner/sim örneği ve farkları.
- [test_results.json](test_results.json): metrikler, nokta koordinatları, API testleri ve kaynak dosyaların SHA-256 değerleri.
- [test_output.txt](test_output.txt): çalıştırmanın sayısal çıktı kaydı.

HiRISE kaynak URL'si ve veri kimliği sim manifest'inden okunmuştur; bu görevde büyük veri indirilmedi. Ölçülen şey diskteki döşemeler ile diskteki planlayıcı dizisidir; uzak COG'un aynı anda güncel sürümle byte-byte eşitliği **ölçülmedi**.
