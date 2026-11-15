# Yakın Mars zemini: CC0 doku, shader ve bağımsız test — 2026-11-14

**Sonuç:** 4 CC0 PBR seti / 20 adet 1024×1024 JPG indirildi; **11.751.611 bayt = 11,752 MB**. Her set 6.000.000 bayt, toplam 30.000.000 bayt sınırının altında. Three.js **r160** için triplanar/stokastik yama bağımsız Chrome/SwiftShader testinde çalıştı: **14 tarayıcı durumu geçti; konsol hatası/uyarısı, başarısız istek ve WebGL hatası sıfır.** 12 PNG ekran görüntüsü, dosya bütünlüğü ve görüntü farkı kanıtları teslim edildi.

**Kapsam:** Bütün dosyalar bu `docs/data/ekip/zemin/` klasörüne yazıldı. `sim/`, `.borje/`, kaynak kod ve git değiştirilmedi. Uygulamaya entegrasyon uygulanmadı; aşağıdaki kod/ayarlar Claude'un değerlendirmesine sunulan prototiptir. Başlangıç varsayımları: metre birimi, +Y yukarı, WebGL2, yerel dünya koordinatları; kullanıcı tarafından belirtilen DTM ~1 m / ortofoto ~0,25 m çözünürlükleri bu çalışmada yeniden doğrulanmadı.

## 1. Teslimat ve lisans

| Dosya / klasör | İçerik |
|---|---|
| [textures/](textures/) | Her set için diffuse/albedo, OpenGL normal, roughness, AO ve hazır paketli ARM; tamamı 1K JPG |
| [textures_manifest.json](textures_manifest.json) | Her dosyanın gerçek indirme URL'si, SHA-256, baytı, çözünürlüğü ve UTC tarihi; lisans kaynağı/alıntısı |
| [ATTRIBUTION.txt](ATTRIBUTION.txt), [SHA256SUMS.txt](SHA256SUMS.txt) | Yazar/lisans, kısa birebir lisans alıntısı, kaynak bağlantıları ve 20 dosyanın hash'i |
| [terrain_patch.glsl.js](terrain_patch.glsl.js) | ES modülü: yükleyici, uniform'lar, GLSL enjeksiyonu, triplanar normal, stokastik döşeme, cavity hesabı |
| [test.html](test.html), [run_test.cjs](run_test.cjs) | Uygulamadan bağımsız test sayfası ve yerel sunucu/headless Chrome çalıştırıcısı |
| [test_results.json](test_results.json), [verification.json](verification.json), [cavity_test_results.json](cavity_test_results.json) | Gerçek test sonuçları |
| [screenshots/](screenshots/) | Düz/dalgalı önce/sonra, alternatif malzemeler ve döşeme karşılaştırması |

Lisans: bütün indirilen dokular **CC0-1.0**; [Poly Haven — Asset License](https://polyhaven.com/license), erişim **2026-11-14**, ilk lisans paragrafı. Birebir alıntı `ATTRIBUTION.txt` içinde. Doku dosyaları yeniden boyutlandırılmadı, renklendirilmedi veya sıkıştırılmadı; kaynak JPG'leri aynen korundu. Kaynak MD5'i, boyut, görüntü açılabilirliği ve 1024×1024 boyutları indirmede kontrol edildi; yerel SHA-256 ikinci kez doğrulandı.

**Bunlar Dünya materyalleridir; Mars'tan ölçülmüş albedo, tane dağılımı, kaya formasyonu veya güvenli basış verisi değildir.** Başlangıçta `terrain_red_01` önerilir. Kum/kaya sınıfını bu dokulardan otomatik çıkarmayın. NASA fotoğrafı doku setiymiş gibi sunulmadı; kalibre normal/roughness/AO kanalı eksik bir fotoğraf PBR seti yerine geçirilmedi.

| Set / yazar / lisans | Yerel boyut (5 harita, bayt) | Kaynak ölçeği | Seçim gerekçesi ve kısa kaynak alıntısı |
|---|---:|---|---|
| [Terrain Red 01](https://polyhaven.com/a/terrain_red_01) — Rob Tuytel — CC0 | 2.578.694 | 2 m | Kırmızı-kahverengi çakıl/regolit görsel temsili. Görsel açıklaması: “coarse reddish-brown gravel with compacted pebbles and rough, matte soil”. |
| [Sand 03](https://polyhaven.com/a/sand_03) — Charlotte Baglioni — CC0 | 3.114.033 | 2 m | Kahverengi kum, ince kırışıklıklar; sahil kökeni Mars ölçümü anlamına gelmez. Görsel açıklaması: “compacted, gritty grains, subtle ripple creases and worn, muted brown tones”. |
| [Rock Face 03](https://polyhaven.com/a/rock_face_03) — Dario Barresi / Rico Cilliers — CC0 | 4.195.272 | ~2,7 m | Dik yüzey/kaya için çatlak doku. Görsel açıklaması: “rough, cracked, uneven stone, chipped edges and eroded details in variegated brown tones”. |
| [Dry Ground 01](https://polyhaven.com/a/dry_ground_01) — Rob Tuytel — CC0 | 1.863.612 | 4 m | Kuru çatlak yüzey alternatifi; bölge geneline çatlak kil varsayımı yapmayın. Görsel açıklaması: “rough fissures, sandy-brown tones and fine-grain surface detail”. |

Tablodaki kaynaklara erişim/indirme **2026-11-14**; indirme partisi başlangıcı **15:19:35 UTC / 18:19:35 TSİ**. Dosya bazında UTC kayıtları manifestte. Fiziksel ölçekler sayfa/API metadatasından; API `dimensions` milimetre cinsinden saklandı. Testte ilk, kum ve kuru set **2 m**, kaya **2,7 m** döşenir; kuru seti 2 m yapmak görsel test tercihidir, kaynaktaki 4 m ölçeğini yeniden ölçmek değildir.

## 2. Çalışan shader şartnamesi

Yama **MeshStandardMaterial.onBeforeCompile** içindeki `map_fragment`, `roughnessmap_fragment`, `normal_fragment_maps`, `aomap_fragment` noktalarına eklenir. Standart ışık, gölge ve emissive/scanner parçaları korunur. Üç ayrı malzeme örnekleyicisi kullanılır: sRGB diffuse; lineer OpenGL normal; lineer **ARM: R=AO, G=roughness, B=metalness**. Bu arazide metalness sıfır kalır; B kanalı kullanılmaz. Ayrı AO/roughness JPG'leri de teslim edildi; çalışma anında aynı veriyi ikinci kez yüklememek için ARM yeterlidir.

| İşlev | Çalışan prototip / önerilen başlangıç | Not |
|---|---|---|
| Triplanar | Dünya normalinin mutlak bileşenlerinin 4. kuvvetiyle X/Y/Z ağırlıkları; ağırlık ≤0,01 projeksiyonunu atla | Dik yüzey UV uzaması azalır. Eksen işaretleri normal yönüne göre düzeltilir; tangent pertürbasyonu makro normale yansıtılır. |
| Tekrar kırma | Üçgen ızgara + aynı köşede deterministik UV ötelemesi + kesintisiz barycentric karışım | **Histogram koruyan Heitz algoritmasının tam uygulaması değildir.** Çatlaklarda hayaletlenme/kontrast azalması olabilir. Normal yönlerini döndürme hatasından kaçınmak için UV rotasyonu yapılmaz. |
| Mipmap / uzaklık | `textureGrad`; UV türevleri rastgele ötelemeden ve dallanmadan önce alınır. 0–12 m tam, 12–35 m `smoothstep` sönme, ≥35 m ayrıntı örneklemesi atlanır | 1–20 m önceliği için **tasarım önerisi**. Sayısal mesafeler Mars verisi değildir. Kamera/vWP aynı dünya başlangıcını kullanmalı. |
| Ortofoto rengi | Kaynak diffuse'un lineer ortalamasına bölünmüş yerel kontrast, 0,45–1,75 aralığında sınırlanır; ortofotoya yakın mesafede **%28 çarpımsal etki** | Basit %28 ham fotoğraf çapraz geçişi değildir; makro renk/aydınlık korunur. Normal .65, roughness karışımı .40, mikro AO .25: tümü görsel ayar önerisi. |
| Normal / roughness | Dünya uzayında pertürbasyon → `viewMatrix` ile ışık hesabının view normaline dönüşüm; roughness .55–1 sınırı | Normal/ARM `NoColorSpace`; diffuse `SRGBColorSpace`. JPG normal sıkıştırma izleri mümkün. |
| Cavity AO | `tpCavity` float vertex özniteliği; yalnız `reflectedLight.indirectDiffuse` üzerinde | Yönlü güneş ışığını/final rengi toptan karartmaz. Gerçek ufuk tabanlı AO değildir. Eksik öznitelik yerine açıkça sıfır dizisi sağlayın. |

**Entegrasyon örneği — uygulamaya yapılacak değişiklik önerisi:**

```js
// Bu dosya uygulamaya kopyalanmadı. Yolları entegratör seçer.
const maps = await loadTerrainSet(THREE, textureBase, 'terrain_red_01', renderer);
const u = makeTerrainUniforms(THREE, maps, { tileMetres: 2 });
geometry.setAttribute('tpCavity', new THREE.BufferAttribute(cavityValues, 1));
material.onBeforeCompile = shader => {
  worldAndScannerHook(shader); // vWP/vWN + scanner; eski DETAIL/strata ayrı ele alınır
  injectTerrainShader(shader, u, { worldVaryingsProvided: true, stochastic: true });
};
material.customProgramCacheKey = () => 'terrain-pbr-r160-stochastic-v1';
material.needsUpdate = true;
```

`worldAndScannerHook` entegratörün sağlayacağı yer tutucudur; teslim edilen/yüklü bir fonksiyon olduğu iddia edilmez. Sıfırdan malzemede çalışan giriş `installTerrainPatch(material,u)`; var olan bir `onBeforeCompile` varsa sessizce üzerine yazmak yerine hata verir. `worldVaryingsProvided:true` yolunun testi ayrıca geçti.

**Mevcut detail.js için karar:** Eski ayrıntı rengini/gradient normalini bu yamayla üst üste bindirmeyin; aynı frekansta iki bump katmanı aşırı pütür üretir. Claude eski DETAIL/steep-strata bölümünü seçerek değiştirmeli, scanner/emissive hook'unu korumalı. Bu prototip eğime göre otomatik ikinci kaya seti karıştırmaz; tek aktif set kullanır. Sınıf/eğim tabanlı ikinci set ve geçiş maskesi sonraki iş olarak önerilir.

### Maliyet / kalite kademeleri

| Kademe | Ek GLSL doku örnekleme çağrısı / fragment | Ek geometri / draw call | Bellek / sınır |
|---|---:|---|---|
| Düzenli triplanar MVP | Tek baskın eksen 3; üç eksen 9 | 0 / 0 | 3 aktif 1K RGBA harita + mip yaklaşık **16 MiB**; kaynak JPG boyutundan farklıdır. |
| Stokastik yakın kalite | Tek eksen 9; üç eksen **27 en kötü** | 0 / 0 | Ortofoto örneklemesi ayrıca genellikle 1. Anizotropi/filtreleme nedeniyle gerçek donanım fetch sayısı bu GLSL çağrı sayısından fazla olabilir. |
| ≥35 m ayrıntısız | 0 ek doku çağrısı hedefi | 0 / 0 | Dynamic branch kazancı GPU/sahneye bağlı; donanım FPS garantisi verilmez. Cavity/fog devam eder. |
| Cavity + analitik ripple | 0 ek doku; cavity 4 bayt/vertex, ripple trigonometrik ALU | 0 / 0 | Dört seti birden GPU'da tutmak ~64 MiB ek harita belleği; gereksiz seti `dispose()` edin. |

En kötü 27 çağrılı modu tüm araziye açmak yerine yalnız yakındaki yamalarda kullanın. Kalite seçimi ilk MVP'de `stochastic:false`; masaüstü yakın görünümünde true. İki farklı seti aynı fragmentte karıştırmak bu maliyeti yaklaşık iki katına çıkarır; bu bütçede uygulanmadı. LOD parçaları aynı metre ölçeğini/orijini paylaşmalı; floating origin kaydırılırken doku ankrajını da tutarlı kaydırın, aksi halde doku yürür. Uydu ortofotosundaki gölgeleri bu shader fiziksel olarak gidermez.

## 3. Ucuz yüzey iyileştirmeleri: uygulanan / sonraki

Buradaki sayısal ayarlar **tasarım önerisidir**, Gale için doğrulanmış parametre olarak kullanılmamalıdır. 1 m DTM'nin altındaki gerçek taş yüksekliği/basamak/ayak basış emniyeti yeniden üretilemez; shader görsel normal değiştirir, çarpışma geometrisini değiştirmez.

| İyileştirme | MVP | Sonra | Maliyet / sınır |
|---|---|---|---|
| DTM çukur karartma | **Kodda var:** merkez ile dört yönde `radius=2` komşunun ortalaması arasındaki pozitif fark / `depth=.35 m`; AO kuvveti .20 | DTM'yi gerçek metre aralığında 2–4 m çekirdekle, tile sınırında halo ile hesapla; ufuk yönlü AO'yu çevrimdışı bake et | Tile başına O(vertex), kare başına 0 fetch. NoData/NaN ve sınırlar nötr bırakılır. 1 m gridde radius=2, 2 m anlamına gelir; test gridinde aynı fiziksel mesafe değildir. |
| Kum ripple normali | **Kodda var:** yalnız `sand_03` testinde rüzgâr yönlü kosinüs tangent pertürbasyonu; 0,18 m dalga boyu / .06 kuvvet, türevle anti-alias | Kaynak Mastcam görüntüsüyle yerel yön/dalga boyunu kalibre et; sınıf maskesiyle kuma sınırla; gerekirse döngüsüz normal bake et | 0 fetch, dot/cos/fwidth. DTM tek başına rüzgâr yönünü veya santimetre dalgalarını vermez. Sabit 0,18 m ölçüm değildir. |
| Toz rengi | MVP önerisi: ortofoto makro rengini ana kaynak yap; mikro dokunun ortalama rengini normalize et (**kodda var**). Keyfî tek kırmızı renk bütün araziye basılmasın | Ayrı doğrulanmış toz/zemin sınıfı maskesi, düşük frekanslı toz örtüsü; malzeme RGB'sini aynı ışık/color-management altında karşılaştır | Mevcut renk işlemleri 0 yeni fetch; ayrı maske +1. Toz çökelmesi eğimden tek başına çıkarılamaz. |
| Atmosferik perspektif | Testte `FogExp2('#b69b83', .006)`; yalnız **görsel test ayarı**, Mars tau/mesafe ölçümü değil | Gale tau + dalga boyu/ışık geometrisiyle tutarlı atmosfer; kamera pozuna göre ufuk kalibrasyonu | Mevcut sis parçası ALU, yeni pass yok. Tau'dan tek başına göz hizası görüş mesafesi hesaplanmaz; düşey toz profili gerekir. |

Bilimsel kontrol: [JPL PIA20755](https://www.jpl.nasa.gov/images/pia20755-two-sizes-of-ripples-on-surface-of-martian-sand-dune/), ilk açıklama paragrafı, **erişim 2026-11-14**: “roughly 10 feet (3 meters) apart”. Namib/Bagnold, Curiosity **sol 1192**, büyük ripple aralığıdır; shader'daki 0,18 m için kaynak olarak kullanılamaz. Aynı sayfa kumun koyu olduğunu ve görüntünün görünürlüğü artırmak için işlendiğini açıklar; bütün Mars kumunu turuncuya çevirmek bilimsel eşleşme değildir.

## 4. Çalıştırma, test ve görüntüler

Repo kökünden (bu ortamda `C:\Users\Batu\Desktop\martian-map-main\martian-map-main`):

```powershell
python -B docs/data/ekip/zemin/fetch_textures.py
node docs/data/ekip/zemin/check_cavity.cjs
node docs/data/ekip/zemin/run_test.cjs
python -B docs/data/ekip/zemin/verify_outputs.py
```

İlk komut ağ kullanır ve yeniden çalıştırılırsa kaynak metadata/tarih kaydını yeniler; mevcut JPG'leri yeniden indirmez, hash/MD5/boyut kontrolü yapar. Python: `requests`, Pillow; Node: mevcut `sim/node_modules/playwright-core` **1.64.1**. Yeni paket kurulmadı. `run_test.cjs` salt okunur dar yol listeli loopback HTTP sunucusunu geçici portta açar; yalnız test klasörü ve `/sim/lib/three.module.js` sunulur. Sunucu portu terminale/`test_results` içine sabitlenmedi. Yerel inceleme için repo kökünde `python -B -m http.server 8765 --bind 127.0.0.1` ve `/docs/data/ekip/zemin/test.html` kullanılabilir; bu ikinci sunucu tüm repo kökünü sunar, yalnız kendi makinenizde kullanın.

Tarayıcı: **Chrome 157.0.8103.78**, `C:/Program Files/Google/Chrome/Application/chrome.exe`, headless; `--use-angle=swiftshader --enable-unsafe-swiftshader`; gerçek raporlanan aygıt **ANGLE / Vulkan / SwiftShader Device (Subzero)**. Görüntüler **1100×720**, DPR=1. Tarayıcı profili/geçici dosyaları bu teslimat klasöründe oluşturulup doğrulanmış yollarından temizlendi. `sim` uygulaması başlatılmadı.

| Kontrol | Gerçek sonuç / kanıt |
|---|---|
| Motor / renderer | Yerel modül `REVISION=160`, WebGL2=true; her 14 durumda GL error=0, başarısız program=0 |
| Tarayıcı | **14/14**; düz/dalgalı × önce/sonra/düzenli=6, diğer 3 set, hazır varyings, uzak sönme, dik/oblik bakış, iki üstten döşeme bakışı |
| Konsol / ağ | **0 error, 0 warning, 0 başarısız istek**; `test_results.json` |
| Geometri / çizim | Önce/sonra aynı: **34.928 üçgen / 4 draw call**; 1 arazi + 3 elipsoid kaya. Bunlar sentetik test geometri sayılarıdır. |
| Shader doku sayısı | Render edilmiş önce 1, sonra 4 GPU texture: makro renk + diffuse/normal/ARM |
| Cavity işlevi | **5/5**: düz zemin ve doğrusal eğim nötr; çukur karanlık; NoData ve NaN komşu varsa nötr |
| İndirilen dosyalar | **20/20** SHA-256, boyut ve 1024×1024 görüntü kontrolü; set/toplam bütçe geçti |
| Görüntü farkı | HUD/gökyüzü hariç x=0..1099, y=430..719; düz MAE **7,590/255**, dalgalı **7,363/255**; herhangi kanalda >5 fark gösteren piksel **%69,34 / %67,96** |
| Görsel inceleme | Düz/dalgalı önce/sonra, kaya ve üstten stokastik görüntü açılıp incelendi. Yakın yüzeyde mikro gölgeleme belirgin; geometri silueti aynı. |

Görüntü farkı yalnız etkinin render edildiğini kanıtlar; fiziksel doğruluk veya öznel kalite puanı değildir. Uzak sönme durumunun testi derleme/GL hatası denetimidir; GPU'da gerçekten kaç fetch tasarruf edildiği profillenmedi.

| Önce | Sonra |
|---|---|
| [Düz önce](screenshots/flat_before.png) | [Düz sonra](screenshots/flat_after.png) |
| [Dalgalı önce](screenshots/wavy_before.png) | [Dalgalı sonra](screenshots/wavy_after.png) |
| [Düzenli üstten](screenshots/tiling_regular.png) | [Stokastik üstten](screenshots/tiling_after.png) |

Diğer örnekler: [kum](screenshots/sand_03_after.png), [kaya](screenshots/rock_face_03_after.png), [kuru zemin](screenshots/dry_ground_01_after.png), [oblik dik yüzey](screenshots/three_axis_oblique.png). “Önce” sade MeshStandardMaterial + sentetik makro renk referansıdır; mevcut `sim/app/detail.js` ile elde edilmiş uygulama görüntüsü değildir. Işık/kamera/tonemapping geometri çiftlerinde aynıdır. Test sahnesi gerçek Gale koordinatı/ortofotosu kullanmaz.

## 5. Teknik kaynak kaydı ve bilinen eksikler

Aşağıdaki kaynakların tamamına erişim **2026-11-14**. Alıntılar birebirdir; uygulama yorumları yukarıda tasarım/prototip olarak ayrıldı.

| Kaynak URL / kaynakta yer | Kısa alıntı | Kullanım / doğrulama |
|---|---|---|
| [Three.js r160 Material](https://raw.githubusercontent.com/mrdoob/three.js/r160/docs/api/en/materials/Material.html), `onBeforeCompile` açıklaması | “Useful for the modification of built-in materials.” | Hook ve sürüm sabitlenmiş belge; çalışma testi geçti. `clone/copy` hook'u taşımaz; yeniden bağlayın. |
| [r160 normal_fragment_begin](https://raw.githubusercontent.com/mrdoob/three.js/r160/src/renderers/shaders/ShaderChunk/normal_fragment_begin.glsl.js), normal tanımı | `vec3 normal = normalize( vNormal );` | Aydınlatma normalinin uzayı/yerleşimi; yerel r160 kaynakla karşılaştırıldı. |
| [r160 aomap_fragment](https://raw.githubusercontent.com/mrdoob/three.js/r160/src/renderers/shaders/ShaderChunk/aomap_fragment.glsl.js), AO uygulaması | `reflectedLight.indirectDiffuse *= ambientOcclusion;` | AO'nun dolaylı ışığa uygulanması. |
| [r160 roughnessmap_fragment](https://raw.githubusercontent.com/mrdoob/three.js/r160/src/renderers/shaders/ShaderChunk/roughnessmap_fragment.glsl.js), kanal yorumu | “reads channel G” | ARM G roughness; Poly Haven sayfaları ayrıca “AO/Rough/Metal” sunar. |
| [Heitz / Neyret 2018, yazar sayfası](https://eheitzresearch.wordpress.com/722-2/), Abstract | “the evaluation inside a triangle is done by blending 3 patches” | Üçgen/üç örnek fikri; özgün histogram dönüşümleri uygulanmadı, kaynak kod kopyalanmadı. |
| [Poly Haven API](https://polyhaven.com/our-api), giriş | “The Poly Haven API is now free for everyone - including commercial use.” | API ile gerçek link/metadata alındı; ayırt edici User-Agent gönderildi. Uygulama canlı API'ye bağlanmaz; kaynak kredisi ATTRIBUTION içinde. |
| [ambientCG](https://ambientcg.com/), lisans açıklaması | “All assets are released under the Creative Commons CC0 license” | Alternatif CC0 sağlayıcı tarandı; bu teslimatta buradan dosya indirilmedi. |
| [Red Sand](https://polyhaven.com/a/red_sand), görsel açıklaması | “shallow footprints and tyre tracks” | Elendi; insan/araç izi taşıyan hazır doku zemin geneline uygulanmamalı. |
| [Aerial Rocks 02](https://polyhaven.com/a/aerial_rocks_02), görsel açıklaması | “patches of green moss” | Elendi; organik yeşil izler. Yalnız tarama metadata'sı kaldı, doku indirilmedi. |
| [Sand 02](https://polyhaven.com/a/sand_02), görsel açıklaması | “wet-looking patches, subtle ripples and footprints” | Elendi; ıslak görünüm ve izler. |

Diğer tarama adayları: [Sandstone Cracks](https://polyhaven.com/a/sandstone_cracks), [Dry Ground 01](https://polyhaven.com/a/dry_ground_01), [Coast Sand 01](https://polyhaven.com/a/coast_sand_01), [Aerial Sand](https://polyhaven.com/a/aerial_sand), [Marble Cliff 02](https://polyhaven.com/a/marble_cliff_02). İlk üç seçili set + kuru zemin ihtiyaç/bütçeyi karşıladığı için yeni dosya eklenmedi. `ambientcg.com/view?id=Sand001`, `polyhaven.com/a/gravely_sand`, `polyhaven.com/a/beige_sand` web aracıyla erişilemedi; bunların lisansı/içeriği tek tek doğrulanmış sayılmadı. Sayfa hatasının HTTP 403 olduğu doğrulanmadı.

**Sınırlar / sonraki iş:**

- Gerçek sim sahnesi, ortofoto/LOD geçişleri, tarama efektleriyle birleşim ve donanım GPU FPS'i test edilmedi; bağımsız r160 prototip testi tamamlandı. Ölçülmemiş FPS/VRAM tasarrufu iddiası yok.
- Şu sürüm tek aktif set, tek yüzlü statik MeshStandardMaterial ve WebGL2 içindir. Testte nonuniform ölçekli elipsoidlerde normal matrisi yolu çalışır. Instancing/skinning/displacement için son geometri konumu/normalini çağıran kod sağlamalı; bu yollar test edilmedi.
- Mevcut normalMap/bumpMap, eski DETAIL gradient'i veya ayrı AO ile aynı etkiyi iki kez uygulamayın. Normal sonuç yeni mikro yüzey normalidir; rastgele başka normal yamasının birleşimi garanti edilmez.
- Üçgen lineer harmanlama belirgin kaya çatlaklarını yumuşatır. Sonraki kalite adımı histogram koruyan ön işlem veya sınıfa özel düzenli kaya + stokastik granüler zemin ayrımıdır.
- HiRISE ortofoto gerçek yansıtırlık ölçümü değildir; pişmiş gölge/renk dengelemesi içerebilir. Yeni PBR normal, o gölgeleri kaldırmaz. Renk ve aydınlatmayı aynı güneş geometrisinde ayrıca gözle değerlendirin.
- Kuru çatlak yüzeyin veya rüzgâr ripplenin her Gale noktasında bulunduğu iddia edilmez. Gerçek zemin sınıfı/yerel görüntü doğrulaması olmadan bütün haritaya uygulamayın.
