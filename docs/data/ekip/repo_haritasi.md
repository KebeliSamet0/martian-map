# Martian Map repo haritası (2026-11-15)

## Karar özeti (2026-11-15)

**Uzak repo:** `KebeliSamet0/martian-map`; sabit ana dal commit'i **`8f142f691f77d93dffb016d3c3ed8adc31ce0d92`**, commit tarihi **2026-11-14 22:04:28 UTC**. Tarama **2026-11-15 03:17 UTC** civarında yapıldı; sonradan gelen commit/PR'lar kapsam dışıdır. **319 dosya / 90.071.264 bayt** envantere alındı; GitHub ağacı kırpılmamıştı. Aşağıdaki tam envanterde her dosyanın sabit commit bağlantısı ve uzak boyutu var. Açık PR taramasında **yalnız #98** bulundu. Kaynaklar: [sabit ağaç](https://github.com/KebeliSamet0/martian-map/tree/8f142f691f77d93dffb016d3c3ed8adc31ce0d92), [açık PR](https://github.com/KebeliSamet0/martian-map/pull/98).

**EVA prova için kullanılabilecek temel paket mevcut:** gerçek coğrafi grid, DEM/eğim/ortofoto, modelden yayılan dört zemin olasılığı ve belirsizlik, gerçek Curiosity izi ve fotoğraf manifestleri, üç görev, rota/yeniden planlama/adım tüketimi API'si ve sim bağlantıları. Bunların hepsi doğrudan ölçüm değildir: zemin rasterleri **Navcam'den çıkarılan durak tahminlerinin uzaklığa göre yayılmasıdır**. Kaynaklar: `contracts/grid.json`, `layers/*`, `ml/rover_terrain/LAYERS.md`, `pipeline/spread_terrain.py`, `api/main.py`, `sim/app/wire.js`.

**Öncelikli açıklar:** araştırma önerileriyle çalışma limitleri farklı; doğrulama koşusu eski; web statik verisi modelden önceki sürümde; model ağırlıkları ve arazi döşemeleri Git'te yok; DEM düzeltmesini anlatan belge ile varsayılan kod yolu aynı değil. Bu bulgular aşağıda dosya çiftleriyle ayrıldı. Repo verilerinin gerçek bir insanlı Mars EVA'sı için operasyonel uygunluğu **doğrulanmadı**; bu inceleme envanter ve statik veri tutarlılığı araştırmasıdır.

**Yazım sınırı varsayımı:** “TEK dosya” kuralıyla “küçük dosyaları `ornek/` altına kopyala” maddesi çeliştiği için tek dosya kuralı korundu. Yalnız bu rapor yazıldı; kopya oluşturulmadı. Gerekli küçük örneklerin seçimi, kesin boyutları ve kaynak yolları §Küçük örnek paketi bölümünde verildi. Kaynak depolar, `sim/`, `.borje/`, kod, ayarlar ve git değiştirilmedi; klon/checkout/fetch yapılmadı. GitHub REST kullanıldı; `gh` CLI bulunamadı.

## Klasör bazında içerik, üretici ve güncellik (2026-11-15)

Boyutlar **uzak Git bloblarının toplamıdır**, çalışma kopyasının CRLF boyutu değildir. Sorumlular `README.md` tablosundan; son commit yazarları raporun üretici izi bölümünde ayrı verilmiştir. Bir klasördeki her baytın aynı kişi tarafından üretildiği **doğrulanmadı**.

| Klasör | Uzak dosya / bayt | Üretici / sorumlu ve içerik | Birim, koordinat ve güncellik |
| --- | ---: | --- | --- |
| `layers/` | 20 / 47.355.257 | Elif Rana: DEM/eğim/ortofoto ve yayma; Emre: sınıf/entropi tahminleri; Bora: kaya/kum; Veysel: rover durakları; Elif Nisa katkısı: bilim açıklamaları. Kaynak: `pipeline/gale_grid.py`, `pipeline/spread_terrain.py`, `ml/*`, `layers/science_stops.json`. | 1000×1000, 2 m, Mars EQC. 11 NPY Float32; mevcut dört olasılık ve entropy gerçek modelden türetilmiş. Eski demo/doğrulama raporları bu sürümle aynı koşu değil. |
| `contracts/` | 5 / 18.032 | Ekip ortak sözleşmesi; grid üretimi Elif Rana. `grid.json`, örnek grid/rota/durak ve ayrıntılı README. | px=`[sütun,satır]`, origin piksel **kenarı**, merkez `indis+0.5`. Rota metre/dakika/kcal/µGy/L alanları. Güncel grid artık **128 durağı** gösteriyor. |
| `api/` | 24 / 130.739 | Samet: FastAPI, katman doğrulama, maliyet, üç rota, gözlem sonrası replan, adım tüketimi, test/dağıtım raporları. | Girdi tam sayı px; metre tabanlı grid. `/route`, `/replan`, `/step`, `/consume`, `/grid`, `/assumptions`, katman BIN/PNG. Parametreler araştırma önerilerinin hepsini almamış. |
| `ml/` | 30 / 127.730 | Emre: rover segmentasyonu, maske, eğitim/çıkarım/test; Bora: orbital gölge-kaya tespiti, CFA ve kum adayları. | Navcam yer seviyesi modeli; orbital piksele doğrudan uygulanmıyor. `full/best.pt` referansı var, ağırlık **repoda yok**. Model kartı/test JSON'u mevcut; yerel eğitim yeniden yapılmadı. |
| `pipeline/` | 13 / 55.821 | Elif Rana: grid/yayma/mission/Curiosity export; Veysel: `pipeline/msl/` Navcam ve site/drive paketleme. | NASA/PDS/MMGIS → Mars EQC → px; fotoğrafta kamera/site koordinatları ayrıca mevcut. Üreticiler var; her girdinin yeniden indirilebilirliği bu görevde test edilmedi. |
| `web/` | 35 / 1.123.409 | Veysel: React/TypeScript/Leaflet, canlı API rota görünümü ve statik örnekler. | `CRS.Simple` px; statik `public/data` kopyaları güncel `layers/` ile eşdeğer değil. `class_frac`/entropy boş eski durak kopyaları var; sentetik rota örnekleri de mevcut. |
| `docs/` | 67 / 26.713.331 | README sorumlusu Elif Nisa; Samet RAD/REMS ve doğrulama; Batu/Claude sim belgeleri; Emre/Bora model/veri raporları. | Kaynak/parametre/model kartları, doğrulama JSON/MD, görseller. Belgelerde “öneri”, “uygulanmış”, tarihsel koşu ayrımı şart; bazı iddialar aşağıda kodla çelişiyor. |
| `scripts/` | 5 / 32.028 | Samet ağırlıklı: `dev.sh`, `smoke.py`, `precompute_routes.py`, `compare_msl.py`, örnek rota çiftleri. | Üç servisi başlatma, smoke, offline rota ve gerçek traverse karşılaştırması. Üretilen sonuçlar parametre/veri sürümüne bağlı; eski JSON otomatik güncellenmiyor. |
| `sim/` | 109 / 12.938.595 | Batu/Claude: Three.js terrain, FPS/TPS, rigli karakter, scanner, görev/HUD, gerçek rota/fotoğraf ve API bağlama. | Dünya X doğu, Y yukarı, Z güney; Mars R=3396190. Runtime `data/tiles/` **Git dışında**. Uzak dosya sayısı yerel döşeme binlerce dosyasını içermez. |
| `data/` | 5 / 1.571.884 | Veysel: Navcam manifesti ve 3D durak paketi. | 1415 fotoğraf kaydı, 128 3D durak; site/drive, kamera yönü/konumu ve URL. Gerçek fotoğraf tam bir metrik 360° panorama veya derinlik haritası değildir. |
| Kök | 6 / 4.438 | README, katkı/ignore/Docker/conftest. | Çalıştırma/ekip/dağıtım bilgisi. Bilimsel veri rasteri değil. |

Kaynak yollarının tamamı aynı adla aşağıdaki envanterde sabit commit'e bağlıdır. Klasör sorumluluğu kaynağı: [README.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/README.md).

## Ortak coğrafi sözleşme ve veri şemaları (2026-11-15)

**Planlayıcı:** `contracts/grid.json`: W=H=1000; `res_m=2`; origin `[8142276.492786024,-283815.075189438]` m. CRS `+proj=eqc +lat_ts=0 +lat_0=0 +lon_0=0 +R=3396190 +units=m`. `xp=ox+2*c`, `yp=oy−2*r`; `lon=xp/R`, `lat=yp/R` radyan. Güney/kuzey yaklaşık −4.821873…−4.788132°, batı/doğu 137.365129…137.398871°E. Hücre merkezinde c/r'ye 0.5 eklenir; ondalıklı gerçek durak koordinatlarına tekrar 0.5 eklenmez. Kaynaklar: `contracts/grid.json`, `sim/app/api.js`, `sim/app/gridgeo.js`.

**Sim:** `sim/app/geo.js` dünya X'e `cos(lat0)` ölçeği uygular, Z güneye artar; Y mutlak areoid yüksekliği değildir, `H−manifest.z_min_data`'dır. `sim/tools/build_tiles.py` yaklaşık 1.01175 m T3 DTM ve 0.25 m LRGB kaynağından 128 hücrelik LOD tile üretir: 131×131 little-endian uint16, `H=−4400+q*0.05`, **q=0 NoData**. Kaynaklar: `sim/app/terrain.js`, `sim/tools/build_tiles.py`. Bu görevde uzak COG yeniden indirilmedi.

| Veri / yol | Şema ve ölçülen boyut | Birim / kaynak / anlam |
| --- | --- | --- |
| `layers/elevation.npy` | Float32 `[1000,1000]`, 4.000.128 bayt; min −3884.3074, max −3389.5542 | m; USGS merged DEM 1m v3, 2×2 blok ortalaması (`pipeline/gale_grid.py`). |
| `layers/slope.npy` | Aynı şekil/boyut; min 0.027313, max 76.823967, ort. 16.000139 | **derece**, DEM'den türetilmiş; insan güvenlik limiti değildir. |
| `layers/elevation_norm.npy`, `slope_norm.npy` | Her biri 4.000.128 bayt, [0,1] | Gösterim/normalize veri; metre veya derece yerine doğrudan kullanılamaz. Min/max `contracts/grid.json.normalization` içinde. |
| `layers/rock_cfa.npy`, `rock_cfa_ge1m.npy` | Her biri 4.000.128 bayt; [0,1], ort. 0.00811234 / 0.00732316 | Kaplama alan oranı; tüm gölge adayları / yalnız ≥1 m adaylar. Kaya adedi veya tek tek kaya konumu değildir (`ml/orbital/rock_cfa_grid.py`). |
| `layers/p_soil.npy`, `p_bedrock.npy`, `p_sand.npy`, `p_bigrock.npy` | Her biri 4.000.128 bayt, Float32 [0,1] | Model sınıf olasılıkları; Navcam durak çıkarımından haritaya yayılmış (`ml/rover_terrain/LAYERS.md`, `pipeline/spread_terrain.py`). |
| `layers/entropy.npy` | 4.000.128 bayt; ort. **0.69683439**, ≥0.6 hücre **%64.6238** | [0,1] normalize belirsizlik; 1 belirsiz. Sıfır fiziksel risk anlamına gelmez. |
| `layers/ortho_2m.png`, `ortho_1m.png` | **628.861 / 2.564.656 bayt**; sözleşmede 1000² / 2000² gri | USGS 25 cm ortofotodan blok örnekleme. Sim'in renkli LRGB dokusu başka üründür (`pipeline/gale_grid.py`). |
| `layers/rover_stops.json` | **128** kayıt / 103.158 bayt; `stop_id,sol,px,images,class_frac,entropy,site,drive,lat,lon,easting,northing…` | NASA MMGIS site konumları + ham Navcam + model karışımları. **128/128** kayıtta class_frac var. |
| `layers/rover_stops_selected.json` | **18** kayıt / 16.045 bayt; yön/eğim ve seçilmiş görüntü alanları da var | Ayrı seçki; ana grid artık bunu değil 128 kayıtlı dosyayı işaretliyor. |
| `layers/science_stops.json` | **4** kayıt / 4.868 bayt; `id,name,px,why,lat,lon,evidence,source` | Boxwork/Atacama çalışma noktaları; bilimsel açıklama ve gözlem izi. Beş durak yok. |
| `layers/msl_proposed_path.json` | **854** ondalıklı px / 25.961 bayt | Adı “proposed” olsa da `source` **NASA MMGIS MSL_traverse.json**, yani gerçek traverse kesiti; tarihsel öneri haritasıyla karıştırılmamalı. |
| `layers/demo_scenarios.json` | **3** senaryo / 4.420 bayt | Başlangıç/hedef hücreleri, kum olayı, gerçek yol kesiti ve önceden ölçülmüş demo sayıları; çalışma sürümünün güncel benchmark'ı olduğu doğrulanmadı. |
| `data/navcam/manifest.csv` | **1415 satır**, 1.059.065 bayt | stop/sol/site/drive, `date_taken,lmst,mast_az_deg,mast_el_deg,camera_position_m,camera_vector,camera_model*,rover_attitude_quat,url,file` alanları; gerçek stereo/poz işi için giriş. |
| `data/navcam/stops_3d.json` | **128 durak**, 510.392 bayt | `elevation_m,elevation_source,rover_yaw_deg,yaw_source,images` ve px/lon/lat. Kamera referans çerçevesi `pipeline/msl/*` ve kaynak metadata ile birlikte yorumlanmalı. |
| `ml/rover_terrain/stops_128.csv` | **128 satır**, 7.399 bayt | `n_images,valid_frac,soil,bedrock,sand,bigrock,entropy` sonuçları; yeni çıkarım değil kayıtlı sonuç. |
| `sim/data/curiosity.json` | **457 px noktası + 23 fotoğraf durağı**, 21.706 bayt | Gerçek traverse'nin sadeleştirilmiş gösterimi; `pipeline/export_curiosity.py`; 23 yerel Navcam JPG zaten repoda. |
| `sim/data/rocks.json` | **829** kayıt / 27.776 bayt, `{px,d_m}` | Bora'nın gölge tabanlı adayları. Küçük taşların tam yer gerçeği veya kesin çarpışma geometrisi değildir. |
| `sim/data/sand_zones.json` | **16** kayıt / 1.637 bayt, `{id,px,radius_m,confidence}` | Orbital kum adayları; güven fiziksel zemin sertliği ölçümü değildir. |
| `sim/data/missions.json` | **3** görev / 2.174 bayt | Start/goal px, `limits`, kum `events`, `sample_kg`; generator `pipeline/export_missions.py`. |
| `sim/data/params.json` | **5.723 bayt**, `{source,params:{key:{value,unit,source_url,quote,accessed,verified,audited}}}` | Kaynaklı görsel/suit benchmark parametreleri; `verified=true` Mars'ta operasyonel geçerlilik kanıtı değildir. |

**Sayısal kontrol:** dört olasılık toplamında maksimum hata **1.1920929×10⁻⁷**; hepsi sonlu. Baskın hücreler: soil **238.099**, bedrock **761.901**, sand **0**, bigrock **0**. Bu sonuç “hiç kum/kaya yok” demek değildir: `p_sand` max **0.4116**, `p_bigrock` max **0.3387**, uzak hücreler 0.25'e yumuşatılıyor. Kaynaklar: ilgili NPY dosyaları (Git blob eşleşmesi doğrulandı), `pipeline/spread_terrain.py`.

## Sim şimdi neyi kullanıyor; ne eklenebilir? (2026-11-15)

“Kullanılmıyor” aşağıda **doğrudan sim tüketimi** ile **API üzerinden dolaylı tüketim** ayrılarak yazıldı. Yalnız kaynak kodu ve veri bağlantıları doğrulandı; bu görevde canlı uygulama/browser çalıştırılmadı.

| Veri / yetenek | Ana dalda mevcut kullanım | Kullanılabilir ek / nasıl |
| --- | --- | --- |
| Grid, DEM, ortofoto | `sim/app/main.js` → `data/tiles/manifest.json`, `Nav.load`, `Terrain`; `wire.js` → `../contracts/grid.json` + `/grid`. | Manifest/grid/version hash'ini aynı çalışma kaydında saklamak; farklı DEM/affine karışmasını engellemek. |
| `p_*`, entropy, slope, CFA | **Zaten API'de kullanılıyor.** `api/planner/layers.py` okur; `cost.py` enerji/hız/risk üretir. Sim `/route`, `/replan`, `/step` ve `/layers/scan_class.bin?dtype=uint8` üzerinden kullanır (`main.js`, `wire-map.js`, `wire-step.js`, `wire-scan.js`). | “ML henüz hiç bağlı değil” yanlış. Ancak dört ham olasılığı 3B'de ayrı inceleme ve pikselden kanıta tıklama yok; `/layers/p_sand.bin`, `/layers/entropy.bin` ile değer+belirsizlik paneli önerilir. |
| `p_bigrock` | Maliyet modelindeki sınıf ağırlıklı hız/η hesabına dolaylı girer. **Scanner kuralı doğrudan kullanmaz**; `classify_scan(slope,p_sand,entropy,rock_cfa)` imzası bunu gösterir. | `ml/rover_terrain/SCAN_CHECK.md` de boşluğu kaydeder. Yeni scanner/engel kuralı önce yanlış alarm metrikleriyle kalibre edilmeli; salt yüksek p_bigrock'u kesin kaya diye çizmek uygunluğu doğrulanmadı. |
| Hücre maliyet katmanları | API BIN/PNG uçları `speed_mps,kcal_per_m,o2_l_per_m,o2_g_per_m,risk,scan_class,reachable` türetebiliyor (`layers.py`, `main.py`). Sim'in doğrulanan özel GPU yolu scan_class içindir. | Enerji/O₂ maliyet haritası, erişilebilir bileşen ve belirsizlik ayrı katman olarak gösterilebilir. BIN Float32 little-endian; scan_class için istekle uint8. Yalnız PNG renginden sayısal değer geri çıkarmayın. |
| Gerçek Curiosity izi/fotoğraf | **Zaten bağlı.** `wire-extras.js` → `hazards.js` + `corridor.js`; `curiosity.json`, Navcam JPG ve durak kartları. | 128 duraklık zengin `stops_3d.json` + 1415 manifestten sol/site/drive filtresi, kamera yönü ve kaynak gösterimi eklenebilir. 23 JPG ile tam 360° Street View veya sürekli gerçek kamera rotası iddia edilmemeli. |
| Bilim durakları | API `/grid` verisinde ve web statik görünümünde; görevlerin start/goal stop kimliklerinde mevcut. | Sim'de görev noktasına `why/evidence/references` açıklamasını bağlamak; `sci_4` Atacama gibi coğrafi bağlamı göstermek. Tam bilim kartının sim'de sunulduğu doğrulanmadı. |
| Gerçek kaya/kum adayları | `hazards.js` gösterimde kullanıyor. Ana API maliyeti CFA'yı kullanır; tek tek `rocks.json` kaya diskleri ana dalda hard-obstacle olarak uygulanmıyor. | Gerçek/sentetik ayrımı korunarak katman olarak sunmak; fiziksel engel maskesi yalnız doğrulanmış adaylarla. PR #98 bu boşluk için deney, henüz main değil. |
| Demo/mission, numune yükü | `mission.js` API `/missions` dener, yoksa `data/missions.json`, sonra gömülü demo; `wire.js` `/step` için OpenAPI desteğini kontrol eder. | Senaryo, rota, parametre ve bilim faaliyetini aynı tekrar üretilebilir prova kaydına bağlamak; numune `load_kg` güncellemesini tüketim modeliyle birlikte denetlemek. |
| `validation_msl.*` / `compare_msl.py` | Offline rapor ve karşılaştırma aracı; çalışma anı sim girdisi olduğu görülmedi. | Parametre/model/grid sürümüyle yeniden üretilecek bir regression kanıtı olarak kullanmak. Gerçek rover yolu insan için optimum veya güvenli yolun etiketi değildir. |
| RAD/REMS | `docs/data/rad_rems_route.md` arşiv ürünlerini ve birimleri açıklıyor; çalışma kodunda **sabit tarihsel RAD ortalaması 8.75 µGy/saat** var. Ham RAD/REMS zaman serisi veya yerel sıcaklık/UV grid'i repoda bulunmadı. | Sol/LMST bazında kalite bayraklı sıcaklık/UV ve doz profili; `sample/source/quality/time` alanlarıyla beslemek. Sim güneş slider'ı gerçek REMS/SPICE senaryosu değildir. |
| ML checkpoint / yeniden çıkarım | `train.py`, `infer_stops.py`, `train_mask.py`, metrikler var; `.pt` checkpoint Git ağacında yok. Sim tarayıcıda yeni Navcam inference çalıştırmıyor. | Kayıtlı model hash'i, izinli ağırlık paketi ve inference servis sürümü olmadan “sahada canlı AI taraması” denmemeli. Önce export/yeniden üretme yolu paketlenmeli. |

Kaynak yolları: `api/main.py`, `api/planner/{layers,cost,params,route}.py`, `sim/app/{main,wire,wire-map,wire-step,wire-scan,wire-extras,corridor,hazards,mission,vitals}.js`, `ml/rover_terrain/{LAYERS,METRICS,SCAN_CHECK}.md`, `docs/data/rad_rems_route.md`.

## Çelişen, eski, eksik veya sınırlı veriler (2026-11-15)

| Öncelik | Dosya kanıtı | Bulgu / öneri |
| --- | --- | --- |
| P0 | `api/planner/params.py`, `sim/data/missions.json` ↔ `docs/eva_parameters.md` | Kod/görev **420 L, 2000 kcal, 6 saat**; araştırma önerisi **370 L, 1800 kcal, 7 saat**. Beden/skafandr/ekipman kodda **80/120/10 kg**, belgede **82/104/23 kg**; baz hız **0.8** ↔ **0.75 m/s**. Hangisinin onaylı senaryo olduğu tek kaynakta kararlaştırılmalı. 370 L de gerçek Mars güvenlik sınırı değil, 1800/4.86 türetilmiş bütçe. S3'ün **80 L** sınırı ayrı zorluk senaryosu; normal görevle karıştırılmamalı. |
| P0 | `docs/sim/DEM_KAYMA.md`, `docs/sim/VERI_KAYNAKLARI.md`, `sim/README.md` ↔ `sim/app/main.js:21`, `sim/tools/build_tiles.py:130` | Belge ayrı `tiles_shifted`, +30/+33 kaynak piksel ve `?tiles=tiles_shifted` anlatıyor. **Bu ana dal kodunda BASE sabit `./data/tiles`; query parametresi tiles seçimini yapmıyor.** Üretici dcol/drow varsayılanları da **0/0**. Dolayısıyla “düzeltildi” belge cümlesi varsayılan çalışmayı kanıtlamıyor. Paket manifest'inde düzeltme/sürüm ve açık seçici gerekir. Browser ile query davranışı yeniden denenmedi; sonuç statik kaynak okumasıdır. |
| P0 | `docs/validation_msl.json` ↔ `layers/p_*.npy`, `layers/entropy.npy`, `contracts/grid.json` | Kayıt **terrain_model_available=false / zemin_modeli_yok** diyor; ana dalda beş model katmanı var, 128 durak bağlı. JSON bugünkü modelin doğrulaması değil. `scripts/compare_msl.py` mevcut verilerle yeniden koşulmalı; eski GO/süre/kcal bugünkü sonuçmuş gibi kullanılmamalı. |
| P0 | `docs/data/rad_rems_route.md`, `api/planner/params.py`, `sim/data/missions.json` | 8.75 µGy/saat tarihsel doz yaklaşımı; **60 µGy görev bütçesi** bir NASA EVA sağlık limiti olarak doğrulanmadı. REMS kalite/UV/gece/SEP ve skafandr termal limiti beslemesi yok. Kodun GO sonucu bu değişkenleri kapsadığı anlamına gelmez. |
| P1 | `web/public/data/rover_stops_all.json`, `rover_stops_selected.json` ↔ `layers/rover_stops*.json` | Web kopyalarında 128/18 kaydın **hiçbirinde class_frac dolu değil**; layers sürümlerinde **128/128 ve 18/18** dolu. `web/public/data/science_stops.json` ve grid kopyaları da ayrı blob. Tek export/versiyon zinciri önerilir. |
| P1 | `ml/rover_terrain/LAYERS.md` ↔ `contracts/grid.json` | Model kartının alt notu hâlâ “grid 18 durak kullanıyor” diyor; **ana grid 128 duraklı `layers/rover_stops.json`'a geçmiş** (`cd4c284ef202` commit). Bu not eskimiş. |
| P1 | `sim/data/params.json.source`, `sim/tools/export_params.py` | Kaynak diye **`docs/data/real_params.json`** yazıyor; bu dosya 319 dosyalık uzak ağaçta **yok**. Runtime export var, üretim kaynağının aynı sürümü repoda yok. İnceleme parametrelerin dış bilimsel kaynaklarını tekrar doğrulamadı. |
| P1 | `contracts/grid.json.layers.thermal_inertia` ↔ `layers/` | Opsiyonel **thermal_inertia.npy** sözleşmede var, gerçek dosya yok. TIU katmanı yüklenmiş/gösterilmiş gibi sunulmamalı; aynı şekilde CRISM rapor/görseli, hazır jeoloji grid'i değildir. |
| P1 | `ml/rover_terrain/METRICS.md`, `metrics_test.json`, `LAYERS.md`, `SCAN_CHECK.md` | Eğitim ve saha genellemesi farklı: kayıtta min3 mIoU **0.798** (12 epoch), bigrock IoU yaklaşık **0.294**, recall **0.973**; altı/18 durak incelemesinde kum kaçırma ve yanlış kaya alarmı var. Ölçümler yeniden üretilmedi; model kartı sonuçlarıdır. Entropy düşükken yanlış tahmin örneği de mevcut; düşük entropy güvenli zemin kanıtı değil. |
| P1 | `pipeline/spread_terrain.py`, `ml/rover_terrain/LAYERS.md` | Yakın durak oranını **200 m**'ye kadar koruyup **800 m**'de 0.25'e yumuşatıyor. Yaklaşık **30 m** maskeli görüş kanıtının 200 m'ye yayılması varsayım; gerçek yerel taş/kum sınırını ölçmez. |
| P1 | `api/planner/cost.py`, `sim/app/main.js`, `sim/data/params.json` | API hızında zemin katsayıları + **Tobler**, enerji yapısında Pandolf + g oranı + **272 W Ay** kalibrasyonu var; sim yürüyüş benchmark'ı **0.67056 m/s**, N=1 APACHE deneyi. Prova saati / rota tahmini aynı fiziksel hız yasası değildir. Mars skafandrlı genel hız/enerji doğruluğu doğrulanmadı. |
| P1 | `sim/app/api.js.GRID`, `sim/app/wire.js`, `api/planner/layers.py.grid_info` | API adaptöründeki origin/res sabit kopya; wire sözleşmeyi ayrıca yüklüyor. `/grid` ana sürümünde tam coğrafi affine/CRS dönüşümü dönmüyor. İki dönüşüm kaynağı ayrı güncellenirse sessiz kayma riski; tek sürümlü coğrafi sözleşme önerilir. |
| P1 | `sim/.gitignore`, `sim/README.md`, `sim/tools/build_tiles.py` | `sim/data/tiles/` Git'te yok; boş klon doğrudan terrain render edemez. Yerel ekip kopyasında **354.868.030 bayt** tile paketi görüldü; bu yalnız yerel ölçüm, uzak dağıtım kanıtı değil. README `sim-tiles.zip` **277 MB** diyor; ZIP bu görevde bulunup hash'lenmedi, boyutu bağımsız doğrulanmadı. |
| P2 | `layers/msl_proposed_path.json`, `docs/data/rad_rems_route.md` | “proposed_path” dosya adı gerçekleşmiş traverse içeriğiyle yanıltıcı; belge tarihsel önerilen GIF'i de tartışıyor. `source_kind=actual/proposed` ve zaman aralığı açık olmalı. |
| P2 | `layers/demo_scenarios.json.status`, `docs/demo_senaryolari.md` ↔ `ml/rover_terrain/LAYERS.md` | Demo statüsü hâlâ 12 epoch sürümü gelince tekrar kontrol gerektiğini söylüyor. Aynı senaryoların son model/parametrelerle başarı durumu bu araştırmada canlı test edilmedi. |
| P2 | `sim/app/mission.js`, `api/main.py`, `sim/app/wire.js` | Sim `/missions` ve `/debrief` varsa kullanıyor; **ana API bu yolları tanımlamıyor**. Mission dosyası ve yerel debrief yedeği tasarlanmış. Sunucuya kalıcı oturum/sonuç kaydı varlığı doğrulanmadı. |
| P2 | `sim/README.md`, `docs/sim/DEM_KAYMA.md`, `sim/data/curiosity.json` | README'de “boxwork kapsamı doğrulanmadı” eski cümlesi duruyor; diğer belgeler/gerçek duraklar daha ileri bağlam sunuyor. Durağın dikdörtgen içinde olması yine piksel/morfoloji hizasının bağımsız doğrulaması değil; iki iddiayı ayırmak gerekir. |

Bu maddelerin hiçbiri bu görevde düzeltilmedi. Özellikle #98'deki **25°** ifadesi bir yazılım/planlama eşiğidir; doğrulanmış Mars insan yürüyüş sınırı olarak yorumlanmamalı (`api/planner/params.py`, `docs/data/ekip/gercek_parametre_arastirmasi.md`).

## Açık PR #98 için kullanılabilirlik kararı (2026-11-15)

PR **`emre/deneme-kaya-engel`**, yazar **EmrCpr**, head **`55c6dee1b18c6957f971ce9cc1242a4fe83e0c2d`**, son güncelleme **2026-11-15 01:28:24 UTC**; **6 değiştirilmiş dosya, yeni eklenen dosya yok**. Dosya bazlı tam liste aşağıda. Kaynak: [PR #98](https://github.com/KebeliSamet0/martian-map/pull/98).

- `api/main.py`, `api/planner/{cost,route}.py`: isteğe bağlı **max_slope_deg 5…45**; ana 25° kuralı korunup yalnız sıkılaştırılıyor. Başlangıç/hedefte daha sıkı eşikten muafiyet var; dolayısıyla “12° istendi, bütün noktalar ≤12°” garantisi yok. `sim/app/{api,main,wire}.js` slider değerini `/route` ve `/replan`'a ekliyor. **Henüz main değil.**
- `cost.py`: **MARTIAN_ROCK_BLOCK=1** opt-in ile `sim/data/rocks.json`'dan hard-obstacle maskesi; yarıçap `min(d,2.6)/2+0.5` metre. Varsayılan kapalı; yalnız 1000² gerçek grid. Bu, orbital model adayını fiziksel engel olarak yorumlayan deneydir. Üretim için katmanın `layers/` sözleşmesine alınması, aday doğrulaması ve cache'in veri sürümüne bağlanması önerilir. Kaynak: PR diff; runtime test bu görevde yapılmadı.
- PR gövdesi DTM korelasyon/dik nokta ölçümleri ve pytest/Node sonuçları bildiriyor; bunlar **PR yazarının beyanı**, bu araştırmada tekrar ölçülmedi. Gövde ayrıca iki pytest hatası ve browser slider uçtan uca testinin yapılmadığını söylüyor. Değişen dosyalar içinde yeni test veya DEM veri paketi yok. Test kapsamı/operasyon uygunluğu bağımsız doğrulanmadı.
- PR gövdesi `?tiles=tiles_shifted` ile ölçüm anlatıyor; sabit ana dal `BASE` ile uyuşmuyor. **Dalın tam recursive ağacı da okundu: 319 dosya; ana dala göre 0 eklenen, 0 silinen, tam 6 değişen dosya.** Değişen üç Python dosyasının baş commit içeriği AST ile denetlendi: **3/3 PASS**. Klon/checkout yapılmadı. Dalın çalışır bir bütün oluşturduğu runtime testle doğrulanmadı; değişiklikler main'e uygulanmadı.

## Küçük örnek paketi seçimi ve büyük veriler (2026-11-15)

**Kopya oluşturulmadı:** üstte açıklanan tek-dosya varsayımı. Aşağıdaki dosyalar doğrudan kaynaklarından okunabilecek, gerçekten yararlı <20 MB adaylarıdır; tümünün immutable bağlantısı tam envanterde var. Bir dosyanın küçük olması bütün paketin küçük olduğu anlamına gelmez.

| Öncelik | Kaynak dosya | Uzak bayt | Prova amacı |
| --- | --- | ---: | --- |
| 1 | `contracts/grid.json` | 2.669 | Bütün veri için tek affine/CRS/çözünürlük sözleşmesi |
| 1 | `layers/science_stops.json` | 4.868 | Bilim hedefi/evidence kartı |
| 1 | `layers/rover_stops.json` | 103.158 | Gerçek durak + model karışımı/belirsizlik |
| 1 | `layers/msl_proposed_path.json` | 25.961 | Gerçek rover izi karşılaştırması |
| 1 | `layers/demo_scenarios.json` | 4.420 | Tekrar edilebilir senaryo tanımı |
| 1 | `sim/data/missions.json` | 2.174 | Görev ve kaynak bütçeleri; yukarıdaki limit farkıyla birlikte |
| 1 | `sim/data/curiosity.json` | 21.706 | 23 durak ve 457 noktalı sim koridoru |
| 1 | `sim/data/params.json` | 5.723 | Değer/birim/kaynak/alıntı metadata; eksik üretim kaynağı notuyla |
| 2 | `data/navcam/stops_3d.json` | 510.392 | Kamera/yaw/yer konumuyla ayrıntılı durak |
| 2 | `data/navcam/manifest.csv` | 1.059.065 | Görüntü URL'lerini/sol/site/drive'ı konumla bulma |
| 2 | `sim/data/rocks.json`, `sand_zones.json` | 27.776 / 1.637 | Ölçüm-aday katmanını 3B gösterme; kesin fiziksel engel değil |
| 2 | `layers/ortho_2m.png` | 628.861 | Planlayıcıyla aynı 2 m gri referans |
| 2 | `ml/rover_terrain/metrics_test.json`, `stops_128.csv` | 2.107 / 7.399 | Model hata/kapsamını gösterme |
| 3 | `docs/validation_msl.json` | 2.672 | **Tarihsel** koşu; güncel doğrulama yerine kullanılmamalı |
| İsteğe bağlı | `layers/*.npy` içindeki 11 dizi | her biri **4.000.128** | Hepsi tek tek <20 MB; birlikte **44.001.408 bayt**, yalnız gerekli katmanlar seçilmeli |

**Uzak takipli ağaçta tek dosya olarak ≥20 MB ürün yok.** Büyük modeller/veriler başlıca repo dışıdır: `models/rover_terrain/full/best.pt`, maske checkpoint'i, ham eğitim/Navcam arşivi ve USGS COG'ları. Checkpoint/ham eğitim boyutları **doğrulanmadı**; COG tam boyutu bu görevde ölçülmedi. Yerel tile toplamı yukarıda verilmiştir; yeniden kopyalanmadı. Kaynaklar: tam uzak envanter, `.gitignore`, `ml/rover_terrain/{METRICS,LAYERS}.md`, `sim/README.md`.

## Gerçek EVA prova aracına ilerleme önerisi (2026-11-15)

1. **Çalışma kaydı:** grid SHA, layer/model/params/mission/tile sürümü, kaynak tarihi ve dönüşüm/datum bilgisi aynı prova oturumunda saklansın. Öncelik dosyaları: `contracts/grid.json`, `sim/data/missions.json`, `sim/data/params.json`, `layers/*`, tile manifest'i. Öneri uygulanmadı.
2. **Veriyle sınırlı anlatım:** scanner noktasında Navcam kanıtı, uzaklık, dört olasılık, entropy ve kalite etiketi birlikte gösterilsin. `p_*` yorumu için `LAYERS.md`, yanlış emin sonuç için `SCAN_CHECK.md`, erişim için `/layers/*.bin` kullanılabilir. Harita yayılımı gerçek kaya/kum sınırı diye sunulmasın.
3. **Fizik/bütçe tutarlılığı:** `params.py` ile öneri belgelerindeki senaryolar ayrıştırılsın; doğrulanmış alıntı ≠ Mars geçerliliği. Göz yüksekliği, kıyafet kütlesi, APACHE hız benchmark'ı ve enerji kalibrasyonu aynı fiziksel modele aitmiş gibi birleştirilmesin. Kaynaklar: `docs/eva_parameters.md`, `docs/metabolic_model.md`, `docs/data/ekip/gercek_parametre_arastirmasi.md`, `sim/app/main.js`.
4. **Zaman ve çevre:** gerekli RAD/REMS/SPICE girdileri ve kalite aralıkları ayrı senaryo katmanı olsun; boş veri için belirsizlik korunsun. Mevcut sabit RAD hesabı ve güneş görüntüsü gerçek zamanlı görev çevresi değildir. Kaynak: `docs/data/rad_rems_route.md`, `sim/data/params.json`.
5. **Bağımsız doğrulama:** aynı rota üzerinde grid/3B eğim, tile düzeltmesi, ters koordinat, NoData, kaya adaylarının hata oranı, güncel model karşılaştırması ve geri dönüş bütçesi kayıtlı testlerle bağlansın. `api/tests/*`, `sim/tests/*`, `scripts/compare_msl.py` başlangıçtır; bu araştırma o testleri çalıştırmadı ve güvenlik onayı vermiyor.

## Bu araştırmada yapılan kontroller (2026-11-15)

- GitHub recursive tree: **319 blob**, `truncated=false`; toplam **90.071.264 bayt**. Açık PR listesi ve #98'in tüm altı dosya diff'i okundu; pagination 100 dosya/sayfa ile son sayfaya kadar işlendi.
- PR baş ağacı ayrıca main ağacıyla karşılaştırıldı: **319/319 yol**, **0 eklenen / 0 silinen / 6 değiştirilmiş** dosya; PR'daki Python sözdizimi **3/3 PASS**. Bu sözdizimi kontrolü işlev testi veya merge onayı değildir.
- **208** birinci taraf metin/NPY içeriği okundu; **182** yerel içerik uzak Git blob SHA-1 ile eşleştirilerek okundu, **26** fark/yokluk uzak blob üzerinden bellekte tamamlandı. PNG/JPG/GLB ve üçüncü taraf kütüphane kaynakları için tam semantik test değil, dosya metadata envanteri yapıldı; bu sınır tam tabloda işaretli.
- **11 NPY**: şekil/dtype, sonluluk, min/max/ortalama/tekil değer sayısı; dört olasılık toplamı ve entropy eşiği ayrıca ölçüldü. Sonuçlar §Ortak sözleşme ve sondaki NPY tablosunda.
- JSON alanları/kayıt sayıları ve CSV başlık/satır sayıları kontrol edildi. İlk otomatik taramada dört Python dosyasının **UTF-8 BOM**'u AST'ye, iki TypeScript config'in **JSONC yorumları** saf JSON parser'a takıldı. Bunlar repo hatası diye sayılmadı: BOM-aware AST tekrarında **4/4 PASS**, yorumlar çıkarılmış JSONC kontrolünde **2/2 PASS**. Kod dosyaları değiştirilmedi.
- Kaynak kod, pytest, eğitim, uygulama veya browser entegrasyon testleri çalıştırılmadı. Repo içindeki test raporları tarihsel/yazar beyanıdır; burada yeni başarılı koşu gibi sunulmadı.
- Araştırma yardımcı script'i yazılmadı; Python `-B` ile bellek içi okuma ve tek rapor yazımı yapıldı. GitHub erişiminde mevcut credential helper yalnız kimlik erişimi için kullanıldı; token/şifre rapora veya dosyaya yazılmadı. Repo çalışma ağacı ve `.borje/` değiştirilmedi.

## Tam taramanın envanter eki (2026-11-15)


Inceleme UTC: `2026-11-15T03:17:01.148969+00:00`; sabit main `8f142f691f77d93dffb016d3c3ed8adc31ce0d92`. 319 blob; tree truncated=false.

## Yontem ve kapsam (2026-11-15)

208 birinci taraf metin/NPY okundu: 182 yerel blob hash eslesmesi, 26 uzak blob. Ilk parser gecisindeki 6 format uyarisinin 4 BOM / 2 JSONC oldugu yeniden dogrulandi; yukaridaki kontrol bolumune bakin.

Tek-dosya/kopya celiskisi ve kucuk dosya secimleri yukaridaki kapsam bolumunde aciklandi; kopya olusturulmadi.

## Acik PR taramasi (2026-11-15)

### PR #98: ⚠️ DENEME (inceleme gerekli): kaya engeli + azami eğim API'ye + DEM kayma ölçümü (2026-11-15)

Yazar `EmrCpr`; dal `emre/deneme-kaya-engel`; head `55c6dee1b18c6957f971ce9cc1242a4fe83e0c2d`; base `8f142f691f77d93dffb016d3c3ed8adc31ce0d92`; updated `2026-11-15T01:28:24Z`. [PR #98](https://github.com/KebeliSamet0/martian-map/pull/98).

| Dosya | Durum | + / - |
| --- | --- | --- |
| `api/main.py` | modified | +4 / -1 |
| `api/planner/cost.py` | modified | +36 / -1 |
| `api/planner/route.py` | modified | +16 / -6 |
| `sim/app/api.js` | modified | +7 / -0 |
| `sim/app/main.js` | modified | +2 / -2 |
| `sim/app/wire.js` | modified | +2 / -1 |

## Uzak ana dalin butun dosyalari (2026-11-15)

Boyutlar uzak Git blob baytlaridir; CRLF calisma kopyasi farkli olabilir. Her yol sabit commit kaynagina baglidir.

### (kok) tam envanter (2026-11-15)

6 dosya, 4,438 bayt.

| Yol | Bayt | Icerik denetimi |
| --- | ---: | --- |
| [.dockerignore](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/.dockerignore) | 73 | metin okundu |
| [.gitignore](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/.gitignore) | 225 | metin okundu |
| [CONTRIBUTING.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/CONTRIBUTING.md) | 909 | metin okundu |
| [Dockerfile](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/Dockerfile) | 380 | metin okundu |
| [README.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/README.md) | 2690 | metin okundu |
| [conftest.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/conftest.py) | 161 | metin okundu |
### api tam envanter (2026-11-15)

24 dosya, 130,739 bayt.

| Yol | Bayt | Icerik denetimi |
| --- | ---: | --- |
| [api/.gitkeep](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/.gitkeep) | 0 | yalniz metadata; icerik dogrulanmadi |
| [api/DEPLOY.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/DEPLOY.md) | 2016 | metin okundu |
| [api/DEPLOY_REPORT.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/DEPLOY_REPORT.md) | 3001 | metin okundu |
| [api/GATE2_REPORT.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/GATE2_REPORT.md) | 3264 | metin okundu |
| [api/MVP_REPORT.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/MVP_REPORT.md) | 7241 | metin okundu |
| [api/README.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/README.md) | 4969 | metin okundu |
| [api/REPORT.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/REPORT.md) | 4267 | metin okundu |
| [api/benchmarks/route_perf.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/benchmarks/route_perf.py) | 1454 | metin okundu |
| [api/main.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/main.py) | 6269 | metin okundu |
| [api/planner/__init__.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/planner/__init__.py) | 151 | metin okundu |
| [api/planner/comparison.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/planner/comparison.py) | 3018 | metin okundu |
| [api/planner/cost.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/planner/cost.py) | 4162 | metin okundu |
| [api/planner/layers.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/planner/layers.py) | 17488 | metin okundu |
| [api/planner/params.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/planner/params.py) | 10158 | metin okundu |
| [api/planner/route.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/planner/route.py) | 24051 | metin okundu |
| [api/planner/terrain.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/planner/terrain.py) | 1456 | metin okundu |
| [api/requirements.txt](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/requirements.txt) | 149 | metin okundu |
| [api/tests/test_api.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/tests/test_api.py) | 7482 | metin okundu |
| [api/tests/test_compare_msl.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/tests/test_compare_msl.py) | 4533 | metin okundu |
| [api/tests/test_data_compat.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/tests/test_data_compat.py) | 3280 | metin okundu |
| [api/tests/test_gate2.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/tests/test_gate2.py) | 7372 | metin okundu |
| [api/tests/test_mvp.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/tests/test_mvp.py) | 6540 | metin okundu |
| [api/tests/test_precompute.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/tests/test_precompute.py) | 2369 | metin okundu |
| [api/tests/test_sim_api.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/api/tests/test_sim_api.py) | 6049 | metin okundu |
### contracts tam envanter (2026-11-15)

5 dosya, 18,032 bayt.

| Yol | Bayt | Icerik denetimi |
| --- | ---: | --- |
| [contracts/README.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/contracts/README.md) | 11052 | metin okundu |
| [contracts/grid.example.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/contracts/grid.example.json) | 680 | metin okundu |
| [contracts/grid.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/contracts/grid.json) | 2669 | metin okundu |
| [contracts/route.example.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/contracts/route.example.json) | 3394 | metin okundu |
| [contracts/rover_stops.example.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/contracts/rover_stops.example.json) | 237 | metin okundu |
### data tam envanter (2026-11-15)

5 dosya, 1,571,884 bayt.

| Yol | Bayt | Icerik denetimi |
| --- | ---: | --- |
| [data/.gitkeep](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/data/.gitkeep) | 0 | yalniz metadata; icerik dogrulanmadi |
| [data/navcam/README.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/data/navcam/README.md) | 1172 | metin okundu |
| [data/navcam/README_3D.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/data/navcam/README_3D.md) | 1255 | metin okundu |
| [data/navcam/manifest.csv](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/data/navcam/manifest.csv) | 1059065 | metin okundu |
| [data/navcam/stops_3d.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/data/navcam/stops_3d.json) | 510392 | metin okundu |
### docs tam envanter (2026-11-15)

67 dosya, 26,713,331 bayt.

| Yol | Bayt | Icerik denetimi |
| --- | ---: | --- |
| [docs/REFERENCES.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/REFERENCES.md) | 11472 | metin okundu |
| [docs/data/README.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/README.md) | 1150 | metin okundu |
| [docs/data/TEMPLATE.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/TEMPLATE.md) | 1079 | metin okundu |
| [docs/data/ai4mars.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/ai4mars.md) | 6464 | metin okundu |
| [docs/data/crism_geology.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/crism_geology.md) | 11057 | metin okundu |
| [docs/data/ekip/gercek_parametre_arastirmasi.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/ekip/gercek_parametre_arastirmasi.md) | 32529 | metin okundu |
| [docs/data/gale_dtm_ortho.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/gale_dtm_ortho.md) | 7328 | metin okundu |
| [docs/data/img/ai4mars_test_samples.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/ai4mars_test_samples.png) | 297106 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/ai4mars_train_samples.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/ai4mars_train_samples.png) | 351303 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/crism_b6f1_hyd.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/crism_b6f1_hyd.png) | 314461 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/crism_b6f1_phy.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/crism_b6f1_phy.png) | 217702 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/gale_dtm_ortho_preview.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/gale_dtm_ortho_preview.png) | 151361 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/navcam_ornek_1.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/navcam_ornek_1.png) | 321549 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/rock_abundance_detection.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/rock_abundance_detection.png) | 518621 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/rock_abundance_rocks.csv](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/rock_abundance_rocks.csv) | 10191 | metin okundu |
| [docs/data/img/rock_abundance_validation.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/rock_abundance_validation.png) | 1606611 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/rock_cfa_preview.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/rock_cfa_preview.png) | 401727 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/sand_candidates.csv](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/sand_candidates.csv) | 774 | metin okundu |
| [docs/data/img/sand_corridor_candidates.csv](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/sand_corridor_candidates.csv) | 724 | metin okundu |
| [docs/data/img/sand_corridor_sheet_1.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/sand_corridor_sheet_1.png) | 842068 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/sand_sheet_1.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/sand_sheet_1.png) | 894768 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/validation2_sample.csv](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/validation2_sample.csv) | 1120 | metin okundu |
| [docs/data/img/validation2_sheet_1.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/validation2_sheet_1.png) | 559061 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/validation2_sheet_2.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/validation2_sheet_2.png) | 547464 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/validation_sample.csv](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/validation_sample.csv) | 987 | metin okundu |
| [docs/data/img/validation_sheet_1.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/validation_sheet_1.png) | 521158 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/img/validation_sheet_2.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/img/validation_sheet_2.png) | 521531 | yalniz metadata; icerik dogrulanmadi |
| [docs/data/msl_traverse_navcam.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/msl_traverse_navcam.md) | 5638 | metin okundu |
| [docs/data/rad_rems_route.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/rad_rems_route.md) | 12763 | metin okundu |
| [docs/data/rock_abundance.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/data/rock_abundance.md) | 4830 | metin okundu |
| [docs/demo_senaryolari.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/demo_senaryolari.md) | 4517 | metin okundu |
| [docs/eva_parameters.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/eva_parameters.md) | 7172 | metin okundu |
| [docs/figures/msl_compare.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/figures/msl_compare.png) | 101412 | yalniz metadata; icerik dogrulanmadi |
| [docs/figures/navcam_vs_model.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/figures/navcam_vs_model.png) | 2127074 | yalniz metadata; icerik dogrulanmadi |
| [docs/figures/rover_terrain_bigrock_missed.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/figures/rover_terrain_bigrock_missed.png) | 468842 | yalniz metadata; icerik dogrulanmadi |
| [docs/figures/rover_terrain_boxwork_preview.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/figures/rover_terrain_boxwork_preview.png) | 652065 | yalniz metadata; icerik dogrulanmadi |
| [docs/figures/rover_terrain_examples.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/figures/rover_terrain_examples.png) | 465594 | yalniz metadata; icerik dogrulanmadi |
| [docs/figures/rover_terrain_stops.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/figures/rover_terrain_stops.png) | 2915464 | yalniz metadata; icerik dogrulanmadi |
| [docs/figures/rover_terrain_unlabeled_area.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/figures/rover_terrain_unlabeled_area.png) | 292752 | yalniz metadata; icerik dogrulanmadi |
| [docs/figures/scan_msl_s118_d0726.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/figures/scan_msl_s118_d0726.jpg) | 77197 | yalniz metadata; icerik dogrulanmadi |
| [docs/figures/scan_msl_s118_d1608.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/figures/scan_msl_s118_d1608.jpg) | 74136 | yalniz metadata; icerik dogrulanmadi |
| [docs/figures/scan_msl_s118_d2406.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/figures/scan_msl_s118_d2406.jpg) | 75410 | yalniz metadata; icerik dogrulanmadi |
| [docs/figures/scan_msl_s120_d2366.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/figures/scan_msl_s120_d2366.jpg) | 72439 | yalniz metadata; icerik dogrulanmadi |
| [docs/figures/scan_msl_s120_d2690.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/figures/scan_msl_s120_d2690.jpg) | 75799 | yalniz metadata; icerik dogrulanmadi |
| [docs/figures/scan_msl_s120_d3056.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/figures/scan_msl_s120_d3056.jpg) | 67974 | yalniz metadata; icerik dogrulanmadi |
| [docs/metabolic_model.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/metabolic_model.md) | 10765 | metin okundu |
| [docs/sim/AKIS_TESTI.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/AKIS_TESTI.md) | 3039 | metin okundu |
| [docs/sim/DEM_KAYMA.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/DEM_KAYMA.md) | 2034 | metin okundu |
| [docs/sim/DENETIM_ekip.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/DENETIM_ekip.md) | 1595 | metin okundu |
| [docs/sim/RAPOR_sim_3d.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/RAPOR_sim_3d.md) | 1909 | metin okundu |
| [docs/sim/TERRAIN_SCANNER_ARASTIRMA.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/TERRAIN_SCANNER_ARASTIRMA.md) | 21237 | metin okundu |
| [docs/sim/TERRAIN_SCANNER_KAYNAKLAR.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/TERRAIN_SCANNER_KAYNAKLAR.md) | 3483 | metin okundu |
| [docs/sim/VERI_KAYNAKLARI.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/VERI_KAYNAKLARI.md) | 8384 | metin okundu |
| [docs/sim/dem_kayma_tarama.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/dem_kayma_tarama.png) | 41598 | yalniz metadata; icerik dogrulanmadi |
| [docs/sim/shots/01_isik_atmosfer_once.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/shots/01_isik_atmosfer_once.png) | 1617815 | yalniz metadata; icerik dogrulanmadi |
| [docs/sim/shots/01_isik_atmosfer_sonra.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/shots/01_isik_atmosfer_sonra.png) | 1671844 | yalniz metadata; icerik dogrulanmadi |
| [docs/sim/shots/02_zemin_ayrintisi_once.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/shots/02_zemin_ayrintisi_once.png) | 1671844 | yalniz metadata; icerik dogrulanmadi |
| [docs/sim/shots/02_zemin_ayrintisi_sonra.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/shots/02_zemin_ayrintisi_sonra.png) | 1624587 | yalniz metadata; icerik dogrulanmadi |
| [docs/sim/shots/akis/S1_2_rotalar.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/shots/akis/S1_2_rotalar.png) | 400516 | yalniz metadata; icerik dogrulanmadi |
| [docs/sim/shots/akis/S1_4_kum_replan.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/shots/akis/S1_4_kum_replan.png) | 1143633 | yalniz metadata; icerik dogrulanmadi |
| [docs/sim/shots/akis/S1_5_karne.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/shots/akis/S1_5_karne.png) | 591328 | yalniz metadata; icerik dogrulanmadi |
| [docs/sim/shots/akis/S3_2_rotalar.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/shots/akis/S3_2_rotalar.png) | 429180 | yalniz metadata; icerik dogrulanmadi |
| [docs/sim/shots/akis/S3_5_karne.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/shots/akis/S3_5_karne.png) | 590339 | yalniz metadata; icerik dogrulanmadi |
| [docs/sim/shots/tarama_cizgi_dili.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sim/shots/tarama_cizgi_dili.png) | 1204956 | yalniz metadata; icerik dogrulanmadi |
| [docs/sunum_taslak.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/sunum_taslak.md) | 13584 | metin okundu |
| [docs/validation_msl.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/validation_msl.json) | 2672 | metin okundu |
| [docs/validation_msl.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/docs/validation_msl.md) | 4545 | metin okundu |
### layers tam envanter (2026-11-15)

20 dosya, 47,355,257 bayt.

| Yol | Bayt | Icerik denetimi |
| --- | ---: | --- |
| [layers/.gitkeep](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/.gitkeep) | 0 | yalniz metadata; icerik dogrulanmadi |
| [layers/demo_scenarios.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/demo_scenarios.json) | 4420 | metin okundu |
| [layers/elevation.npy](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/elevation.npy) | 4000128 | NPY ölçüldü |
| [layers/elevation_norm.npy](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/elevation_norm.npy) | 4000128 | NPY ölçüldü |
| [layers/entropy.npy](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/entropy.npy) | 4000128 | NPY ölçüldü |
| [layers/msl_proposed_path.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/msl_proposed_path.json) | 25961 | metin okundu |
| [layers/ortho_1m.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/ortho_1m.png) | 2564656 | yalniz metadata; icerik dogrulanmadi |
| [layers/ortho_2m.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/ortho_2m.png) | 628861 | yalniz metadata; icerik dogrulanmadi |
| [layers/p_bedrock.npy](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/p_bedrock.npy) | 4000128 | NPY ölçüldü |
| [layers/p_bigrock.npy](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/p_bigrock.npy) | 4000128 | NPY ölçüldü |
| [layers/p_sand.npy](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/p_sand.npy) | 4000128 | NPY ölçüldü |
| [layers/p_soil.npy](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/p_soil.npy) | 4000128 | NPY ölçüldü |
| [layers/rock_cfa.npy](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/rock_cfa.npy) | 4000128 | NPY ölçüldü |
| [layers/rock_cfa_ge1m.npy](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/rock_cfa_ge1m.npy) | 4000128 | NPY ölçüldü |
| [layers/rover_stops.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/rover_stops.json) | 103158 | metin okundu |
| [layers/rover_stops_selected.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/rover_stops_selected.json) | 16045 | metin okundu |
| [layers/sand_hint.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/sand_hint.json) | 5880 | metin okundu |
| [layers/science_stops.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/science_stops.json) | 4868 | metin okundu |
| [layers/slope.npy](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/slope.npy) | 4000128 | NPY ölçüldü |
| [layers/slope_norm.npy](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/layers/slope_norm.npy) | 4000128 | NPY ölçüldü |
### ml tam envanter (2026-11-15)

30 dosya, 127,730 bayt.

| Yol | Bayt | Icerik denetimi |
| --- | ---: | --- |
| [ml/orbital/.gitkeep](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/orbital/.gitkeep) | 0 | yalniz metadata; icerik dogrulanmadi |
| [ml/orbital/VALIDATION.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/orbital/VALIDATION.md) | 5201 | metin okundu |
| [ml/orbital/export_sim.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/orbital/export_sim.py) | 2974 | metin okundu |
| [ml/orbital/fetch_crop.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/orbital/fetch_crop.py) | 1545 | metin okundu |
| [ml/orbital/fetch_grid_ortho.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/orbital/fetch_grid_ortho.py) | 1851 | metin okundu |
| [ml/orbital/rock_cfa_grid.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/orbital/rock_cfa_grid.py) | 6314 | metin okundu |
| [ml/orbital/sand_candidates.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/orbital/sand_candidates.py) | 7337 | metin okundu |
| [ml/orbital/sand_corridor.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/orbital/sand_corridor.py) | 4595 | metin okundu |
| [ml/orbital/shadow_rocks.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/orbital/shadow_rocks.py) | 6750 | metin okundu |
| [ml/orbital/validation_sheet.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/orbital/validation_sheet.py) | 2097 | metin okundu |
| [ml/orbital/validation_sheet_route.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/orbital/validation_sheet_route.py) | 3630 | metin okundu |
| [ml/rover_terrain/.gitkeep](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/.gitkeep) | 0 | yalniz metadata; icerik dogrulanmadi |
| [ml/rover_terrain/LAYERS.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/LAYERS.md) | 6295 | metin okundu |
| [ml/rover_terrain/METRICS.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/METRICS.md) | 4176 | metin okundu |
| [ml/rover_terrain/SCAN_CHECK.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/SCAN_CHECK.md) | 7178 | metin okundu |
| [ml/rover_terrain/data_analysis/ai4mars_browse.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/data_analysis/ai4mars_browse.py) | 5593 | metin okundu |
| [ml/rover_terrain/data_analysis/ai4mars_stats.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/data_analysis/ai4mars_stats.py) | 5739 | metin okundu |
| [ml/rover_terrain/data_analysis/ai4mars_viz.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/data_analysis/ai4mars_viz.py) | 2748 | metin okundu |
| [ml/rover_terrain/eval_test.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/eval_test.py) | 2938 | metin okundu |
| [ml/rover_terrain/infer_stops.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/infer_stops.py) | 8379 | metin okundu |
| [ml/rover_terrain/inspect_labels.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/inspect_labels.py) | 6130 | metin okundu |
| [ml/rover_terrain/layer_report.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/layer_report.py) | 1669 | metin okundu |
| [ml/rover_terrain/metrics_test.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/metrics_test.json) | 2107 | metin okundu |
| [ml/rover_terrain/prepare_data.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/prepare_data.py) | 4182 | metin okundu |
| [ml/rover_terrain/requirements.txt](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/requirements.txt) | 365 | metin okundu |
| [ml/rover_terrain/scan_check.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/scan_check.py) | 4575 | metin okundu |
| [ml/rover_terrain/slide_figure.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/slide_figure.py) | 3479 | metin okundu |
| [ml/rover_terrain/stops_128.csv](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/stops_128.csv) | 7399 | metin okundu |
| [ml/rover_terrain/train.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/train.py) | 7272 | metin okundu |
| [ml/rover_terrain/train_mask.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/ml/rover_terrain/train_mask.py) | 5212 | metin okundu |
### pipeline tam envanter (2026-11-15)

13 dosya, 55,821 bayt.

| Yol | Bayt | Icerik denetimi |
| --- | ---: | --- |
| [pipeline/.gitkeep](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/pipeline/.gitkeep) | 0 | yalniz metadata; icerik dogrulanmadi |
| [pipeline/export_curiosity.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/pipeline/export_curiosity.py) | 4687 | metin okundu |
| [pipeline/export_missions.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/pipeline/export_missions.py) | 4980 | metin okundu |
| [pipeline/gale_grid.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/pipeline/gale_grid.py) | 6670 | metin okundu |
| [pipeline/msl/add_latlon.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/pipeline/msl/add_latlon.py) | 3191 | metin okundu; BOM/JSONC yeniden denetlendi |
| [pipeline/msl/add_px.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/pipeline/msl/add_px.py) | 2255 | metin okundu; BOM/JSONC yeniden denetlendi |
| [pipeline/msl/build_3d_bundle.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/pipeline/msl/build_3d_bundle.py) | 6936 | metin okundu; BOM/JSONC yeniden denetlendi |
| [pipeline/msl/build_navcam_package.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/pipeline/msl/build_navcam_package.py) | 7865 | metin okundu; BOM/JSONC yeniden denetlendi |
| [pipeline/msl/fetch_navcam.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/pipeline/msl/fetch_navcam.py) | 8454 | metin okundu |
| [pipeline/msl_proposed_path.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/pipeline/msl_proposed_path.py) | 2924 | metin okundu |
| [pipeline/select_rover_stops.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/pipeline/select_rover_stops.py) | 3004 | metin okundu |
| [pipeline/spread_terrain.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/pipeline/spread_terrain.py) | 3343 | metin okundu |
| [pipeline/test_spread_terrain.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/pipeline/test_spread_terrain.py) | 1512 | metin okundu |
### scripts tam envanter (2026-11-15)

5 dosya, 32,028 bayt.

| Yol | Bayt | Icerik denetimi |
| --- | ---: | --- |
| [scripts/compare_msl.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/scripts/compare_msl.py) | 16755 | metin okundu |
| [scripts/dev.sh](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/scripts/dev.sh) | 2236 | metin okundu |
| [scripts/precompute_routes.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/scripts/precompute_routes.py) | 3219 | metin okundu |
| [scripts/route_pairs.example.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/scripts/route_pairs.example.json) | 218 | metin okundu |
| [scripts/smoke.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/scripts/smoke.py) | 9600 | metin okundu |
### sim tam envanter (2026-11-15)

109 dosya, 12,938,595 bayt.

| Yol | Bayt | Icerik denetimi |
| --- | ---: | --- |
| [sim/.gitignore](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/.gitignore) | 154 | yalniz metadata; icerik dogrulanmadi |
| [sim/ASSETS.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/ASSETS.md) | 1050 | metin okundu |
| [sim/README.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/README.md) | 8685 | metin okundu |
| [sim/WIRE_REPORT.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/WIRE_REPORT.md) | 3276 | metin okundu |
| [sim/app/MODULES.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/MODULES.md) | 4127 | metin okundu |
| [sim/app/api.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/api.js) | 3766 | metin okundu |
| [sim/app/astronaut.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/astronaut.js) | 23472 | metin okundu |
| [sim/app/audio.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/audio.js) | 6576 | metin okundu |
| [sim/app/corridor.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/corridor.js) | 8616 | metin okundu |
| [sim/app/detail.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/detail.js) | 28375 | metin okundu |
| [sim/app/fx.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/fx.js) | 5731 | metin okundu |
| [sim/app/geo.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/geo.js) | 1169 | metin okundu |
| [sim/app/gridgeo.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/gridgeo.js) | 1080 | metin okundu |
| [sim/app/hazards.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/hazards.js) | 9470 | metin okundu |
| [sim/app/hud.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/hud.js) | 6038 | metin okundu |
| [sim/app/main.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/main.js) | 34005 | metin okundu |
| [sim/app/mapview.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/mapview.js) | 11542 | metin okundu |
| [sim/app/mission.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/mission.js) | 6426 | metin okundu |
| [sim/app/nav.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/nav.js) | 10701 | metin okundu |
| [sim/app/rocks.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/rocks.js) | 5537 | metin okundu |
| [sim/app/rocks_rich.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/rocks_rich.js) | 6021 | metin okundu |
| [sim/app/routeline.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/routeline.js) | 8016 | metin okundu |
| [sim/app/screens.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/screens.js) | 8712 | metin okundu |
| [sim/app/sky.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/sky.js) | 12210 | metin okundu |
| [sim/app/terrain.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/terrain.js) | 12740 | metin okundu |
| [sim/app/vitals.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/vitals.js) | 8559 | metin okundu |
| [sim/app/wire-adapters.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/wire-adapters.js) | 1502 | metin okundu |
| [sim/app/wire-extras.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/wire-extras.js) | 1536 | metin okundu |
| [sim/app/wire-map.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/wire-map.js) | 3624 | metin okundu |
| [sim/app/wire-scan.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/wire-scan.js) | 948 | metin okundu |
| [sim/app/wire-step.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/wire-step.js) | 1863 | metin okundu |
| [sim/app/wire.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/app/wire.js) | 8370 | metin okundu |
| [sim/assets/characters/astronaut.glb](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/assets/characters/astronaut.glb) | 1944976 | yalniz metadata; icerik dogrulanmadi |
| [sim/assets/textures/bedrock_diff.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/assets/textures/bedrock_diff.jpg) | 859211 | yalniz metadata; icerik dogrulanmadi |
| [sim/assets/textures/bedrock_nor.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/assets/textures/bedrock_nor.jpg) | 802497 | yalniz metadata; icerik dogrulanmadi |
| [sim/assets/textures/bedrock_rough.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/assets/textures/bedrock_rough.jpg) | 668127 | yalniz metadata; icerik dogrulanmadi |
| [sim/assets/textures/regolith_diff.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/assets/textures/regolith_diff.jpg) | 906764 | yalniz metadata; icerik dogrulanmadi |
| [sim/assets/textures/regolith_nor.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/assets/textures/regolith_nor.jpg) | 1494933 | yalniz metadata; icerik dogrulanmadi |
| [sim/assets/textures/regolith_rough.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/assets/textures/regolith_rough.jpg) | 722823 | yalniz metadata; icerik dogrulanmadi |
| [sim/assets/textures/sand_diff.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/assets/textures/sand_diff.jpg) | 490916 | yalniz metadata; icerik dogrulanmadi |
| [sim/assets/textures/sand_nor.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/assets/textures/sand_nor.jpg) | 665488 | yalniz metadata; icerik dogrulanmadi |
| [sim/assets/textures/sand_rough.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/assets/textures/sand_rough.jpg) | 205159 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/curiosity.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/curiosity.json) | 21706 | metin okundu |
| [sim/data/missions.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/missions.json) | 2174 | metin okundu |
| [sim/data/navcam/msl_s118_d0762.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s118_d0762.jpg) | 77087 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s118_d1194.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s118_d1194.jpg) | 59884 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s118_d1608.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s118_d1608.jpg) | 67971 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s118_d1944.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s118_d1944.jpg) | 81705 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s118_d2268.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s118_d2268.jpg) | 72395 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s118_d2742.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s118_d2742.jpg) | 115396 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s118_d3156.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s118_d3156.jpg) | 111215 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s119_d0198.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s119_d0198.jpg) | 106262 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s119_d0486.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s119_d0486.jpg) | 93214 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s119_d1344.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s119_d1344.jpg) | 108472 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s120_d0082.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s120_d0082.jpg) | 84760 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s120_d0346.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s120_d0346.jpg) | 96611 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s120_d0808.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s120_d0808.jpg) | 82285 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s120_d1042.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s120_d1042.jpg) | 107595 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s120_d1546.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s120_d1546.jpg) | 64427 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s120_d2030.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s120_d2030.jpg) | 71673 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s120_d2366.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s120_d2366.jpg) | 74449 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s120_d2726.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s120_d2726.jpg) | 109500 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s121_d0000.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s121_d0000.jpg) | 107813 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s121_d0396.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s121_d0396.jpg) | 104527 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s121_d0762.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s121_d0762.jpg) | 76244 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s121_d0990.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s121_d0990.jpg) | 90835 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/navcam/msl_s121_d1446.jpg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/navcam/msl_s121_d1446.jpg) | 98847 | yalniz metadata; icerik dogrulanmadi |
| [sim/data/params.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/params.json) | 5723 | metin okundu |
| [sim/data/rocks.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/rocks.json) | 27776 | metin okundu |
| [sim/data/sand_zones.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/sand_zones.json) | 1637 | metin okundu |
| [sim/data/texts.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/data/texts.json) | 2634 | metin okundu |
| [sim/index.html](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/index.html) | 9997 | metin okundu |
| [sim/lib/addons/loaders/GLTFLoader.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/loaders/GLTFLoader.js) | 108522 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/math/SimplexNoise.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/math/SimplexNoise.js) | 14351 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/postprocessing/EffectComposer.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/postprocessing/EffectComposer.js) | 4651 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/postprocessing/GTAOPass.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/postprocessing/GTAOPass.js) | 16466 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/postprocessing/MaskPass.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/postprocessing/MaskPass.js) | 2231 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/postprocessing/OutputPass.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/postprocessing/OutputPass.js) | 2398 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/postprocessing/Pass.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/postprocessing/Pass.js) | 1706 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/postprocessing/RenderPass.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/postprocessing/RenderPass.js) | 1915 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/postprocessing/SMAAPass.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/postprocessing/SMAAPass.js) | 49467 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/postprocessing/ShaderPass.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/postprocessing/ShaderPass.js) | 1576 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/postprocessing/UnrealBloomPass.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/postprocessing/UnrealBloomPass.js) | 12406 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/shaders/CopyShader.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/shaders/CopyShader.js) | 571 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/shaders/GTAOShader.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/shaders/GTAOShader.js) | 13009 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/shaders/LuminosityHighPassShader.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/shaders/LuminosityHighPassShader.js) | 1192 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/shaders/OutputShader.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/shaders/OutputShader.js) | 1393 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/shaders/PoissonDenoiseShader.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/shaders/PoissonDenoiseShader.js) | 6614 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/shaders/SMAAShader.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/shaders/SMAAShader.js) | 14628 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/addons/utils/BufferGeometryUtils.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/addons/utils/BufferGeometryUtils.js) | 31906 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/leaflet/images/layers-2x.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/leaflet/images/layers-2x.png) | 1259 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/leaflet/images/layers.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/leaflet/images/layers.png) | 696 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/leaflet/images/marker-icon-2x.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/leaflet/images/marker-icon-2x.png) | 2464 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/leaflet/images/marker-icon.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/leaflet/images/marker-icon.png) | 1466 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/leaflet/images/marker-shadow.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/leaflet/images/marker-shadow.png) | 618 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/leaflet/leaflet.css](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/leaflet/leaflet.css) | 10879 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/leaflet/leaflet.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/leaflet/leaflet.js) | 147171 | yalniz metadata; icerik dogrulanmadi |
| [sim/lib/three.module.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/lib/three.module.js) | 1272972 | yalniz metadata; icerik dogrulanmadi |
| [sim/tests/corridor.test.mjs](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/tests/corridor.test.mjs) | 6579 | metin okundu |
| [sim/tests/gridgeo.test.mjs](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/tests/gridgeo.test.mjs) | 1418 | metin okundu |
| [sim/tests/mission.test.mjs](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/tests/mission.test.mjs) | 3128 | metin okundu |
| [sim/tests/vitals.test.mjs](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/tests/vitals.test.mjs) | 3035 | metin okundu |
| [sim/tests/wire.test.mjs](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/tests/wire.test.mjs) | 2922 | metin okundu |
| [sim/tools/build_tiles.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/tools/build_tiles.py) | 12913 | metin okundu |
| [sim/tools/devserver.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/tools/devserver.py) | 913 | metin okundu |
| [sim/tools/export_params.py](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/tools/export_params.py) | 2204 | metin okundu |
| [sim/tools/qa/perf_probe.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/tools/qa/perf_probe.js) | 20834 | metin okundu |
| [sim/tools/wire_smoke.mjs](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/tools/wire_smoke.mjs) | 5550 | metin okundu |
| [sim/ui.css](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/sim/ui.css) | 6967 | metin okundu |
### web tam envanter (2026-11-15)

35 dosya, 1,123,409 bayt.

| Yol | Bayt | Icerik denetimi |
| --- | ---: | --- |
| [web/.env.example](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/.env.example) | 138 | metin okundu |
| [web/.gitignore](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/.gitignore) | 253 | yalniz metadata; icerik dogrulanmadi |
| [web/.gitkeep](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/.gitkeep) | 0 | yalniz metadata; icerik dogrulanmadi |
| [web/README.md](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/README.md) | 2427 | metin okundu |
| [web/eslint.config.js](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/eslint.config.js) | 591 | metin okundu |
| [web/index.html](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/index.html) | 355 | metin okundu |
| [web/package-lock.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/package-lock.json) | 117022 | metin okundu |
| [web/package.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/package.json) | 857 | metin okundu |
| [web/public/base.svg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/public/base.svg) | 385 | metin okundu |
| [web/public/data/grid.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/public/data/grid.json) | 2262 | metin okundu |
| [web/public/data/ortho_2m.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/public/data/ortho_2m.png) | 628861 | yalniz metadata; icerik dogrulanmadi |
| [web/public/data/rover_stops_all.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/public/data/rover_stops_all.json) | 90678 | metin okundu |
| [web/public/data/rover_stops_selected.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/public/data/rover_stops_selected.json) | 14289 | metin okundu |
| [web/public/data/science_stops.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/public/data/science_stops.json) | 3801 | metin okundu |
| [web/public/favicon.svg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/public/favicon.svg) | 9522 | metin okundu |
| [web/public/icons.svg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/public/icons.svg) | 5031 | metin okundu |
| [web/public/routes/route.example.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/public/routes/route.example.json) | 3394 | metin okundu |
| [web/public/routes/synthetic-crossing.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/public/routes/synthetic-crossing.json) | 99045 | metin okundu |
| [web/public/routes/synthetic-short.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/public/routes/synthetic-short.json) | 9673 | metin okundu |
| [web/public/routes/synthetic-west.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/public/routes/synthetic-west.json) | 67655 | metin okundu |
| [web/src/App.css](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/src/App.css) | 2891 | metin okundu |
| [web/src/App.tsx](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/src/App.tsx) | 12475 | metin okundu |
| [web/src/MapView.tsx](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/src/MapView.tsx) | 4481 | metin okundu |
| [web/src/assets/hero.png](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/src/assets/hero.png) | 13057 | yalniz metadata; icerik dogrulanmadi |
| [web/src/assets/react.svg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/src/assets/react.svg) | 4126 | metin okundu |
| [web/src/assets/vite.svg](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/src/assets/vite.svg) | 8709 | metin okundu |
| [web/src/components/ApiRoutesView.tsx](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/src/components/ApiRoutesView.tsx) | 13536 | metin okundu |
| [web/src/index.css](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/src/index.css) | 118 | metin okundu |
| [web/src/lib/api.ts](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/src/lib/api.ts) | 4447 | metin okundu |
| [web/src/main.tsx](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/src/main.tsx) | 267 | metin okundu |
| [web/src/types.ts](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/src/types.ts) | 1536 | metin okundu |
| [web/tsconfig.app.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/tsconfig.app.json) | 655 | metin okundu; BOM/JSONC yeniden denetlendi |
| [web/tsconfig.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/tsconfig.json) | 119 | metin okundu |
| [web/tsconfig.node.json](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/tsconfig.node.json) | 558 | metin okundu; BOM/JSONC yeniden denetlendi |
| [web/vite.config.ts](https://github.com/KebeliSamet0/martian-map/blob/8f142f691f77d93dffb016d3c3ed8adc31ce0d92/web/vite.config.ts) | 195 | metin okundu |

## NPY sayisal denetimi (2026-11-15)

| Katman | Sekil / dtype | Min | Max | Ortalama | Tekil deger |
| --- | --- | ---: | ---: | ---: | ---: |
| `layers/elevation_norm.npy` | [1000, 1000] / float32 | 0 | 1 | 0.55465955 | 698050 |
| `layers/elevation.npy` | [1000, 1000] / float32 | -3884.3074 | -3389.5542 | -3609.8877 | 698050 |
| `layers/entropy.npy` | [1000, 1000] / float32 | 0.016100001 | 1 | 0.69683439 | 294087 |
| `layers/p_bedrock.npy` | [1000, 1000] / float32 | 0.0035999999 | 0.99650002 | 0.4543004 | 295339 |
| `layers/p_bigrock.npy` | [1000, 1000] / float32 | 0.00019999999 | 0.3387 | 0.15069263 | 270487 |
| `layers/p_sand.npy` | [1000, 1000] / float32 | 9.9999997e-05 | 0.41159999 | 0.1446906 | 258649 |
| `layers/p_soil.npy` | [1000, 1000] / float32 | 0.0014 | 0.98210001 | 0.25031638 | 295566 |
| `layers/rock_cfa.npy` | [1000, 1000] / float32 | 0 | 1 | 0.008112344 | 65 |
| `layers/rock_cfa_ge1m.npy` | [1000, 1000] / float32 | 0 | 1 | 0.0073231561 | 65 |
| `layers/slope.npy` | [1000, 1000] / float32 | 0.027312886 | 76.823967 | 16.000139 | 919429 |
| `layers/slope_norm.npy` | [1000, 1000] / float32 | 0 | 1 | 0.20798856 | 917137 |

## Son bes yol commitinin uretici izi (2026-11-15)

Son bes klasor commit yazari listelenir; README sorumlulugu veya tum dosyalarin yazarligi ile ozdes degildir.

### layers uretici izi (2026-11-15)

- `2026-11-14T15:55:21Z` — Emre Çapar / `EmrCpr` — `Zemin katmanları 128 durak + tam eğitim modeli + model kartı (#45)` — `a3f23b2ce91d`.
- `2026-11-14T14:39:06Z` — Elifranakemal / `Elifranakemal` — `Demo senaryolari: main uzerinde (17:29 birlestirmeleri sonrasi) yeniden olculen rakamlar` — `aaa45029ff1e`.
- `2026-11-14T14:29:54Z` — Samet / `None` — `Merge PR #63: elifrana/demo-sand-bora` — `9f91498002a7`.
- `2026-11-14T14:29:52Z` — Samet / `None` — `Merge PR #61: bora/sand-corridor` — `9534c8fbe1d6`.
- `2026-11-14T14:29:49Z` — Samet / `None` — `Merge PR #60: emre/terrain-layers` — `4effe55e1338`.
### contracts uretici izi (2026-11-15)

- `2026-11-14T16:15:35Z` — Elifranakemal / `Elifranakemal` — `grid.json: rover_stops -> layers/rover_stops.json (128 durak)` — `cd4c284ef202`.
- `2026-11-14T14:51:16Z` — Samet / `None` — `feat(api): POST /step uç noktası, katman PNG/BIN desteği ve testler (#51)` — `db8379a507b7`.
- `2026-11-14T14:29:42Z` — Samet / `None` — `Merge PR #55: samet/mvp` — `cdb43c13488f`.
- `2026-11-14T13:03:43Z` — Samet / `None` — `Eksik zemin katmanları için eğim+rock_cfa geçici dolgusu ekle` — `ae86eb3977e1`.
- `2026-11-14T12:36:18Z` — Elifranakemal / `Elifranakemal` — `grid.json: rover_stops, rock_cfa_ge1m ve Curiosity referans rotası kayıtları` — `5f4be82df4a1`.
### api uretici izi (2026-11-15)

- `2026-11-14T15:34:58Z` — Samet / `None` — `Merge PR #76: samet/sim-api` — `25e632dbe977`.
- `2026-11-14T15:25:47Z` — Samet / `None` — `MSL karşılaştırması: planlayıcının geçici zemin dolgusunu 'model yok' olarak etiketle, testi güncelle` — `694f3dd9b210`.
- `2026-11-14T15:24:57Z` — Samet / `None` — `Merge PR #65: samet/msl-compare` — `c555781455f0`.
- `2026-11-14T14:51:16Z` — Samet / `None` — `feat(api): POST /step uç noktası, katman PNG/BIN desteği ve testler (#51)` — `db8379a507b7`.
- `2026-11-14T14:49:56Z` — Samet / `None` — `feat(api): hücre maliyet katmanları ve scan_class kuralı/lejantı (#51)` — `775ff5e50d1f`.
### ml uretici izi (2026-11-15)

- `2026-11-14T18:09:43Z` — Emre Çapar / `EmrCpr` — `SCAN_CHECK: tarayıcı sınıfı tablosu + slayt görseli navcam_vs_model.png (#45)` — `3ab44ff03046`.
- `2026-11-14T16:05:28Z` — Emre Çapar / `EmrCpr` — `Tarayıcı kanıtı: 6 durak (SCAN_CHECK.md, #45)` — `ff34be756de7`.
- `2026-11-14T15:55:21Z` — Emre Çapar / `EmrCpr` — `Zemin katmanları 128 durak + tam eğitim modeli + model kartı (#45)` — `a3f23b2ce91d`.
- `2026-11-14T14:47:26Z` — BoraY / `None` — `feat(sim): gerçek kayalar ve kum bölgeleri 3B'de (#46)` — `d6cb1d9dcb47`.
- `2026-11-14T14:29:52Z` — Samet / `None` — `Merge PR #61: bora/sand-corridor` — `9534c8fbe1d6`.
### pipeline uretici izi (2026-11-15)

- `2026-11-14T15:26:16Z` — Abdüssamet Kebeli / `KebeliSamet0` — `Merge pull request #73 from KebeliSamet0/elifrana/curiosity-trail` — `daa7464aa8f5`.
- `2026-11-14T14:50:59Z` — Elifranakemal / `Elifranakemal` — `Sprint 3 (#47): sim/data/curiosity.json + 23 Navcam durak fotoğrafı` — `8618ac50345e`.
- `2026-11-14T14:44:09Z` — Elifranakemal / `Elifranakemal` — `Sprint 3 (#47): sim/data/missions.json — üç oynanabilir görev` — `15ea3852de1b`.
- `2026-11-14T12:34:27Z` — Elifranakemal / `Elifranakemal` — `Kapı 2: zemin sınıflarını haritaya yayma (pipeline/spread_terrain.py)` — `a5973f1912a2`.
- `2026-11-14T12:32:31Z` — Samet / `None` — `Merge PR #41: veysel/navcam-package` — `3b33026262f5`.
### web uretici izi (2026-11-15)

- `2026-11-14T14:00:40Z` — Veysel Furkan Akyıldız / `Veysel1Akyldz` — `web: Canlı rota sekmesi — planlayıcı API'sine bağlantı (/grid, /route, segment kartı, GO/NO-GO bütçe)` — `989f04b697b1`.
- `2026-11-14T12:32:33Z` — Samet / `None` — `Merge PR #31: samet/deploy` — `5ae57ac52d5a`.
- `2026-11-14T11:19:46Z` — Veysel Furkan Akyıldız / `Veysel1Akyldz` — `Web: küçük noktalar için tıklama toleransı (Refs #20)` — `f93b852d00e5`.
- `2026-11-14T11:17:19Z` — Veysel Furkan Akyıldız / `Veysel1Akyldz` — `Web: 128 rover durağının tamamı aç/kapa katmanı olarak (Refs #20)` — `83f13869adfe`.
- `2026-11-14T11:07:34Z` — Veysel Furkan Akyıldız / `Veysel1Akyldz` — `Web: gerçek bölge görünümü (ortofoto, bilim ve rover durakları, Navcam fotoğrafları) (Refs #20)` — `2166afd84832`.
### docs uretici izi (2026-11-15)

- `2026-11-14T22:04:28Z` — Samet / `None` — `Merge PR #86` — `8f142f691f77`.
- `2026-11-14T22:04:22Z` — Samet / `None` — `Merge PR #91` — `d2293e1aa67a`.
- `2026-11-14T22:04:22Z` — Samet / `None` — `Merge PR #97` — `5bf04d59b0a3`.
- `2026-11-14T22:04:22Z` — Samet / `None` — `Merge PR #95` — `a226fcc56aba`.
- `2026-11-14T20:08:10Z` — Elif Nisa Gökdoğan / `eliinisa` — `docs: yedek slayta eğim eşiklerinin varsayım olduğu satırı` — `9ab353c03c59`.
### scripts uretici izi (2026-11-15)

- `2026-11-14T15:34:58Z` — Samet / `None` — `Merge PR #76: samet/sim-api` — `25e632dbe977`.
- `2026-11-14T15:25:47Z` — Samet / `None` — `MSL karşılaştırması: planlayıcının geçici zemin dolgusunu 'model yok' olarak etiketle, testi güncelle` — `694f3dd9b210`.
- `2026-11-14T15:24:57Z` — Samet / `None` — `Merge PR #65: samet/msl-compare` — `c555781455f0`.
- `2026-11-14T14:51:16Z` — Samet / `None` — `feat(api): POST /step uç noktası, katman PNG/BIN desteği ve testler (#51)` — `db8379a507b7`.
- `2026-11-14T13:34:08Z` — Samet / `None` — `Brif 2: gerçek veride segment birleştirme, rota ayrışması ve erişilebilirlik katmanı` — `60666ed4085d`.
### sim uretici izi (2026-11-15)

- `2026-11-14T22:04:28Z` — Samet / `None` — `Merge PR #86` — `8f142f691f77`.
- `2026-11-14T22:04:22Z` — Samet / `None` — `Merge PR #88` — `35ddb887d087`.
- `2026-11-14T22:04:22Z` — Samet / `None` — `Merge PR #85` — `6d1710f6d9a4`.
- `2026-11-14T22:04:22Z` — Samet / `None` — `Merge PR #92` — `86f5f5757eb2`.
- `2026-11-14T22:04:22Z` — Samet / `None` — `Merge PR #89` — `c66838f63a23`.
### data uretici izi (2026-11-15)

- `2026-11-14T12:02:53Z` — Veysel Furkan Akyıldız / `Veysel1Akyldz` — `Navcam paketi: 1415 foto manifesti + 3D verisi (stops_3d.json) ve script'ler (Refs #20)` — `f5fe3f96e0ff`.
- `2026-11-14T07:00:43Z` — Samet / `None` — `Repo iskeleti: klasörler, veri sözleşmeleri, çalışma kuralları` — `429d2e729968`.

Ilk-gecis BOM/JSONC uyari listesi: yukaridaki yeniden denetim bolumunde aciklandi. Proje dosyalari degistirilmedi.
