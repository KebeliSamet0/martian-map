# Sprint 2 — Dünya içinde rota rehberliği araştırması (2026-11-14)

**Teslim:** araştırma ve uygulanabilir tasarım önerisi; kod uygulanmadı. Yalnız bu dosya yazıldı. Bitiş hedefi: **19:00 Europe/Istanbul**. Aşağıdaki bütün web kaynaklarının **erişim tarihi 2026-11-14**; tarih, her kaynak satırı için geçerlidir. “Doğrulandı” belgenin ilgili özelliği anlattığını belirtir; oyun tarafımca çalıştırılıp test edilmedi.

**Karar önerisi:** oyuncunun seçtiği hedefe API'nin hesapladığı rotayı zemine yapıştır; yakın bölümde yönlü chevron, hedefte beacon, HUD'da kalan rota mesafesi göster. Tehlike işaretleri ayrı anlam taşısın. DS2'deki mavi ayak izleri her durumda gelecekte basılacak güvenli noktalar değildir [S6].

## 1. Kaynaklı bulgular

Her satırda URL, kaynak içi yer ve birebir kısa alıntı var. **B:** geliştirici/kurum belgesi; **İ:** bağımsız oyun rehberi. Tasarım aktarımı ve sayısal bütçeler sonraki bölümlerde ayrıca öneri olarak işaretlendi.

| ID / durum | Nasıl çalışıyor? | Kaynak URL, yer ve kısa birebir alıntı — erişim: 2026-11-14 |
|---|---|---|
| S1 — B, DS1 Director's Cut | Haritada çoklu işaretler çizgilerle bağlanır; sahada rehber işaretleri görünür. Pusula modu hedefi ve yerleştirilen yön işaretlerini gösterir. | [Kojima Productions, Beginner's Guide](https://www.kojimaproductions.jp/en/death-stranding-directors-cut-beginners-guide), Part 2 / Using Your Map: “place multiple markers”; “connect them with lines”; “Guide markers also appear on the field”; “see your destination”. |
| S2 — İ, DS1 | Çizgi kendiliğinden en uygun geçilebilir yol değildir. Hedef işaretine bakıldığında pusula mesafe ve aradaki topografyayı gösterir. | [GameSpot, Episode 1](https://www.gamespot.com/gallery/death-stranding-walkthrough-guide-episode-1-bridget/2900-3163/), You Are Not A Ghost / Check Your Compass!: “just a straight line”; “calculate the distance”; “topography that’s directly between you and that point”. |
| S3 — İ, DS2 | Haritada waypoint'lerle rota planlanır; Odradek taramasıyla kesikli dünya içi çizgi izlenir. Sapınca yeni rota planlamak önerilir. | [Epic Games Store / Dave Tach](https://store.epicgames.com/news/the-best-hidden-features-in-death-stranding-2-tips-tricks-you-need-to-know?lang=en-US), Why you should always plan and replan your route: “Just ping your Odradek and follow the dotted line.” |
| S4 — B, DS2 | Terrain Scanner rotada kalmayı ve yol üstü/çevresindeki tehlikeleri görmeyi destekler. Rehber varsayılan tarama tuşunu L1 olarak verir. | [PlayStation, Beginner's Guide](https://www.playstation.com/en-il/games/death-stranding-2-on-the-beach/death-stranding-2-on-the-beach-guide/), Traversal / Scan your surroundings: “Terrain Scanner”; “L1 button by default”; “spot hazards on and off the road”. |
| S5 — İ, DS2 | Haritada Square basılı tutularak rota başlangıç/bitişi oluşturulur. Tarama renkleri: mavi düz/kolay; sarı eğimli veya taşlı; kırmızı dik ve düşme tehlikesi olan yüzey. Sayısal eğim eşikleri verilmez. | [GameSpot, 20 Things](https://www.gamespot.com/gallery/death-stranding-2-tips-beginners-guide/2900-6684/), Plan your route / Scan your surroundings: “holding the Square button”; “Terrain features are color-coded in this manner:”. |
| S6 — İ, DS2 | Belirli Lou/Fragile görevinde pembe izler takip edilir; mavi izler oyuncunun önceki izleridir. Bu, bütün ayak izlerini ileriye dönük ayak basış tavsiyesi saymayı desteklemez. | [PC Gamer, Lou and Fragile](https://www.pcgamer.com/games/action/death-stranding-2-fragile-lou-location/), How to find Lou and Fragile: “follow the pink footsteps”; “blue footsteps—these are your own”. |
| S7 — B, DS1 | Çok oyuncunun geçtiği güzergâhlarda oluşan patikalar rota seçimi için referans olabilir. Bu patika ile haritadaki çizilmiş rota farklı öğelerdir. | [Kojima Productions, DSTips](https://kojimaproductions.jp/en/DSTips), Long-Distance Deliveries / Take advantage of Online Functions: “footpaths are created along routes taken by many of the other players”. |
| S8 — B, Google AR | Live View gerçek görüntü üstünde yön okları gösterir. Mars simülasyonuna aktarılabilecek kısım görsel yönlendirme fikridir. | [Google, Maps and Lens features](https://blog.google/products-and-platforms/products/maps/google-maps-lens-travel-features--/), Navigate with AR: “AR arrows that point you exactly where you need to go”. |
| S9 — B, Google yürüyüş | Lens ile 2D harita arasında geçiş var; iyi Street View kapsamı gerekir. Google ihtiyaç anında kullanım önerir. Bu konumlama altyapısı Mars için hazır değildir. | [Google Maps Help](https://support.google.com/maps/answer/9332056?co=GENIE.Platform%3DAndroid&hl=en), Availability / Switch to the 2D map / Practice safety: “good Street View coverage”; “switch between Lens in Maps and the 2D map view”; “only when necessary”. |
| S10 — B, oyun guide-line | Dead Space Locator kullanıldığında kameranın rota yönüne dönmesi açılıp kapatılabilir. Bu belge görselin rengini veya hesaplama algoritmasını doğrulamaz. | [EA, Dead Space Gameplay Settings](https://www.ea.com/able/resources/dead-space/dead-space/pc/gameplay), Orient View to Locator Path: “the camera will orient to show the Locator’s path direction”. |
| S11 — B, Apollo LRV | Sistem araç başını, gidilen toplam mesafeyi, hızı, LM'ye yön ve uzaklığı gösterir. Araç navigasyonudur; astronot ayak basış sistemi değildir. | [NASA TN D-7469](https://ntrs.nasa.gov/api/citations/19740003321/downloads/19740003321.pdf), System Description, basılı s.1–2 / PDF s.5–6: “total distance traveled”; “range to the LM and bearing to the LM”. |
| S12 — B, NASA yüzey AR | Joint AR prototipinde hareketli harita, mevcut baş yönü ve waypoint mesafesi aynı görüş alanında sunulur. Çalışma saha analoğudur; Mars uçuş doğrulaması değildir. | [NASA, Joint AR pilot study](https://ntrs.nasa.gov/api/citations/20250011653/downloads/IEEE%202026%20JointAR%20Final.pdf), Introduction, PDF s.2: “map, current heading, and displayed distance to waypoints.” |
| S13 — B, ESA | Electronic Field Book teknoloji gösteriminde kullanıcılar arazide yönlenmek için göz hizasından 3D görünüm istemiştir. Hazır Mars yürüyüş HUD'u olduğu iddia edilmez. | [ESA, Mapping forward to the Moon](https://www.esa.int/ESA_Multimedia/Videos/2022/07/Mapping_forward_to_the_Moon), açıklama son paragraf: “an eye view to see the terrain in 3D”. |
| S14 — B, NASA beacon | Dünya'daki Ay yürüyüşü testinden sonra AR navigasyon HUD'u ve iniş aracına dönüşü destekleyebilecek ışıklı beacon teknolojileri test edilmiştir. | [NASA, Arizona Moonwalk](https://science.nasa.gov/missions/artemis/behind-the-scenes-of-a-nasa-moonwalk-in-the-arizona-desert/), giriş: “lighting beacons that could help guide a crew back to a lunar lander”. |

**Doğrulanmayanlar:** DS2'de tek hedef tıklamasının her durumda otomatik güvenli rota ürettiği; her ayak izinin gelecekteki güvenli basış noktası olduğu; DS1/DS2'nin sürekli HUD'da *rota boyunca kalan mesafe + ETA* için hangi hesabı kullandığı; DS2 sayısal eğim eşikleri. Bunları oyun özelliği diye kesinleştirmiyorum. Mars'taki ETA, ileri basış işaretleri ve otomatik alternatif hesabı aşağıda **tasarım önerisi** olarak ayrıldı. DS1 mesafe/pusula özelliği S2 ile doğrulandı; DS2'ye aynen genellenmedi.

**Erişim notu:** Neoseeker ve PlayStationTrophies sayfaları doğrudan açılışta 403 verdi; ana kanıt yapılmadı. Ayak izi ayrımı için açılabilen PC Gamer S6 kullanıldı. Forum yorumları ve oyun süresini anlatan arama sonuçları HUD/ETA kanıtı sayılmadı.

## 2. Three.js için doğrulanan teknik dayanaklar

Bu API davranışları kaynaklıdır; bizim mesh boyutlarımız ve süre tahminlerimiz kaynaklardan alınmış performans ölçümleri değildir. Kurulu Three.js sürümü bu görevde incelenmedi; uygulayıcı uyumluluğu kontrol etmelidir.

| ID | Teknik dayanak | URL / yer / birebir alıntı — erişim: 2026-11-14 |
|---|---|---|
| T1 | BufferGeometry UV/renk/özel nitelik taşır. Material grupları ayrı çizim çağrılarıdır. | [BufferGeometry](https://threejs.org/docs/pages/BufferGeometry.html), giriş / groups: “colors, UVs, and custom attributes”; “each of which will be rendered in a separate draw call”. |
| T2 | Aynı geometri/materyalli işaretleri InstancedMesh ile toplamak çizim çağrılarını azaltır. | [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html), giriş: “reduce the number of draw calls”. |
| T3 | Özel shader ile rota desenini aynı materyalde üretmek mümkündür; sayfadaki örnekte time uniform'u vardır. | [ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial.html), giriş / Code Example: “A material rendered with custom shaders.” |
| T4 | Depth test/yazma ve polygon offset ayrı ayarlardır. Şeffaf DoubleSide materyal iki geçiş oluşturabilir. | [Material](https://threejs.org/docs/pages/Material.html), depthTest / depthWrite / polygonOffset / forceSinglePass: “Whether to have depth test enabled”; “two draw calls”. |
| T5 | Çizim çağrısı ve üçgen sayıları renderer istatistiğinden izlenebilir. | [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html), InfoRender: “The number of draw calls per frame.”; “The number of rendered triangles primitives per frame.” |
| T6 | Doku seçilirse UV ofseti ve tekrar sarma kullanılabilir. | [Texture](https://threejs.org/docs/pages/Texture.html), offset / repeat: “each direction U and V”; “RepeatWrapping”. |

## 3. İstenmemiş ek profesyonel özellikler — tasarım önerisi

MVP ekleri **süre kalırsa**; aşağıdaki 120 dakikalık çekirdek plana dahil değildir. Her öneri iki satırdır; hiçbirinin DS2'de bulunduğu iddia edilmez.

| Aşama | Özellik ve gerekçe |
|---|---|
| MVP ek | **Rotadan sapma uyarısı.**<br>Yatay uzaklık + giriş/çıkış histerezisi; her karede yanıp sönen “rotaya dön” mesajını önler. |
| MVP ek | **Erişilebilirlik profili.**<br>Renk dışı desenler, büyük yazı ve chevron hareketini kapatma; kullanıcı ayarına bağlı gösterim. |
| Sonra | **Dönüş bütçesi kartı.**<br>Yalnız API gerçek dönüş/rezerv hesabı sağlarsa habitat dönüş payı; kalan mesafeden oksijen uydurma. |
| Sonra | **Alternatifleri karşılaştırma.**<br>Planlayıcının döndürdüğü yollar için mesafe/süre/risk farkı; görsel katmanda yeni yol icat etme. |
| Sonra | **Kanıtı açan segment kartı.**<br>Güvenin nedeni, veri tarihi ve ilgili rover fotoğrafına erişim; “low” etiketini açıklanabilir kılar. |
| Sonra | **Oturum izi ve tekrar oynatma.**<br>Planlanan yol ile gerçekten yürünmüş izi ayrı desenlerle göster; DS2 geçmiş iz/rota karışıklığını önler. |

## 4. Uygulanabilir şartname — tamamı tasarım önerisi

**MVP hedefi:** mevcut arazi örnekleyicisi, dünya↔piksel dönüşümü, yürüyüş konumu ve HUD/minimap kancaları hazırsa **tek geliştirici için yaklaşık 2 saatlik uygulama hedefi**. Ölçülmüş teslim süresi değildir; bu önkoşullar eksikse kapsam/süre yeniden değerlendirilir. Çizim katmanı rota hesaplamaz ve hareket fiziğini değiştirmez.

### 4.1 Girdi ve anlam sözleşmesi

Salt okunur incelenen [route örneği](../../../../contracts/route.example.json) ve [grid örneği](../../../../contracts/grid.example.json), erişim **2026-11-14**: `"path_px": [[300, 600], [330, 570]]`, `"conf": "low"`, `"res_m": 2.0`. Bunlar **örnek dosya**, canlı API garantisi değil. Örnekte `class` yok; eklendi varsayılmamalı. Örnek sayılar simülasyona sabit olarak aktarılmamalı.

| Girdi | MVP davranışı / eksik veri |
|---|---|
| `route.segments[].path_px` | Sıralı `[px,py]` noktaları, segment kimliği korunur. Ortak uç noktalar tekilleşir. Kopuk segmentler, eksik start/goal bağlantısı veya NoData arası düz çizgiyle doldurulmaz. |
| `slope_max` | Segmentin maksimum eğimi; **maksimumun tam konumunu vermez**. Birimi API ile doğrula; grid örneği slope için derece diyor. Yüzde↔derece sessiz çevrilmez. `slopeLimit` planlayıcının politika girdisi olmalı; evrensel Mars güvenlik sınırı uydurulmaz. |
| `class` | Varsa sınıf sözlüğüyle isim göster; yoksa “zemin sınıfı yok”. Etiketin kod türü/sözlüğü teyit edilmeli. |
| `conf` | Örnekteki gibi kategorik güven desteklenir; `low` sayısal olasılık değildir. Bilinmeyen/null değer “bilinmiyor”; yüksek güven sayılmaz. |
| `p_sand` | Varsa aralığı/kalibrasyonu doğrulanır; kum sınıfı model skoru gösterilir. **Batma veya düşme olasılığı değildir.** `null`, sıfır kum diye yorumlanmaz. |
| Ek zorunlu bağlam | `heightAt(x,z)` + geçerlilik/NoData bilgisi; mevcut piksel→dünya dönüşümü/CRS ve eksen yönleri; oyuncu dünya konumu/baş yönü; hedef. `res_m` tek başına dönüş/merkez/ofset işaretlerini tanımlamaz. |
| İsteğe bağlı bütçe | API `len_m`, `min`, toplam süre sağlıyorsa kökeni/birimi korunur. Eksikse ETA “—”. Ekran çizgisinin geometrik uzunluğu ile API'nin planlama uzunluğu farklıysa ayrı etiketlenir. |

### 4.2 Görsel bileşenler ve maliyet

**Bütün sayısal ayarlar aşağıda başlangıç önerisidir; NASA sınırı, DS2 ayarı veya GPU ölçümü değildir.** Maliyetler yalnız ek rehberlik katmanının ana kamera geçişi içindir. DOM/Canvas2D, Three.js çağrısı eklemez fakat CPU/kompozisyon maliyeti vardır.

| Eleman | MVP — toplam çekirdek 2 saat içinde hedeflenen | Sonra | Girdiler | Üçgen / çizim çağrısı notu |
|---|---|---|---|---|
| Zemine yapışık rota şeridi | `heightAt` ile sol/sağ kenarları örneklenen indeksli ribbon; yaklaşık **0.6 m genişlik**, **2 m örnek aralığı**, yalnız öndeki **500 m** hazırlanır. Köşe ve risk sınırları korunur. | Eğim/kavis/yükseklik hatasına göre adaptif altbölme; sınırlı miter veya bevel köşeler. | `segments[].path_px`, dönüşüm, `heightAt`, arazi sürümü | N kesit: **2N vertex, 2(N−1) üçgen**. 500 m / 2 m düz örnek hesabı: N=251 → **500 üçgen**, tek materyalde **1 çağrı**. Ek kesitler maliyeti artırır. |
| Akan chevron | UV'de boyuna `u=s/repeat_m`, enine `v=0..1`; zamana bağlı faz ile hedef yönüne akan ok deseni. Aynı ribbon shader'ı [T1,T3]; doku alternatifi [T6]. | Virajda okunabilirlik; kullanıcı hızından bağımsız hareket tercihi. | Boyuna mesafe `s`, rota sırası, zaman | Ribbon'un aynı **1 çağrısı**; ilave üçgen yok. Animasyonda geometriyi yeniden üretme; yalnız zaman/faz güncelle. |
| Hedef beacon | Hedefe ankrajlı tek billboard + ad/mesafe etiketi. NoData hedefinde zemine oturmuş gibi gösterme; HUD'da “yükseklik yok”. | Ekran dışı yön oku ve örtülme göstergesi. | `route.goal` veya doğrulanmış son hedef, `heightAt`, kamera | Billboard **2 üçgen / 1 çağrı**; DOM etiketi ayrı. Işık, bloom ve gölge geçişi ekleme. |
| İlerleme / kalan mesafe | Oyuncuyu yakın rota parçalarına izdüşür; boyuna `s` ile toplamdan çıkar. “Kalan rota” ile “hedefe doğrusal mesafe” ayrılır. HUD yaklaşık **10 Hz** güncellenir. | Segment sürelerinden kalan plan süresi; yerel hareketten tahmin ayrı etiketli. | Oyuncu konumu, `path_px`, kümülatif uzunluk; varsa `len_m/min` | DOM **0 ek Three.js çağrısı**. Her karede bütün rotayı tarama; yerel segment penceresi kullan. ETA verisi yoksa “—”. |
| Segment rengi / güven | Normal rota camgöbeği; politika sınırını aşan segment kırmızı + X; düşük/bilinmeyen güven kesikli desen + yazı. Tek renk güvenli basışı kanıtlamaz. | Zemin/güven/eğim arasında seçilebilir görünüm. | `slope_max`, `conf`, `class`, `slopeLimit` | Renk/durum vertex nitelikleriyle aynı ribbon'da: **0 ilave çağrı**. Her segmente ayrı material group verme [T1]. Sınırda kesiti çoğalt; risk renklerini komşuya yumuşatıp gizleme. |
| “Basılacak yer” / kaçınma | Kesin ayak izi yerine, riskli **segment girişinde** X ve “ileride sınır aşımı” etiketi. Noktasal güvenli ayak basış iddiası yok. Yakın alanda ör. **en fazla 32 işaret**. | Yerel eğim/normal/engel haritası varsa yaklaşık geçiş pedleri; gerçek basış için ayrıca karakter ayağı/temas modeli. Alternatif yalnız API yeni geçerli yol döndürürse çizilir. | `path_px`, `slope_max`, `conf`; sonra yerel arazi/engel verisi | Aynı atlas/materyalle InstancedMesh [T2]: quad başına2 → **64 üçgen / 1 çağrı**. Zemin normaline hizala; örnek yoksa işaret basma. |
| Kum segmenti uyarısı | `p_sand` yüksekse segment girişinde kum ikonu + skor/sınıf ve güven. Eşik yapılandırması **ör.0.6** yalnız UI başlangıç önerisi; fiziksel güvenlik eşiği değil. | Gerçek geçilebilirlik modeliyle hız/enerji etkisi; yerel kum/taş ayrımı. | `p_sand`, `class`, `conf`, segment sırası | Kaçınma işaretleriyle aynı instance grubuna dahil: sınır içindeyse **ek çağrı yok**; HUD metni0. Skoru “batma riski %…” diye yazma. |
| Minimap yönü | Mevcut minimap/Canvas2D üstüne aynı rotanın izdüşümü, oyuncu oku ve hedef; 3B ile aynı dönüşüm. Kuzey yönü metadata yoksa N etiketi üretme. | Kuzey-yukarı / baş-yukarı tercihi, kenara sabitlenmiş hedef. | `path_px`, oyuncu baş yönü, grid/dönüşüm | Canvas2D önerisi **0 ek Three.js çağrısı**. İkinci 3B kamera render'ı MVP'ye dahil değil. |
| Mesafeye göre solma | Shader'da yakın/uzak alpha; başlangıç önerisi yakın **0.5–2 m**, önde **150–300 m** yumuşak solma. Beacon/HUD ayrı kalır; tehlike etiketi solmayla kaybolmaz. | Sise/kontrasta ve görünürlük durumuna göre ayar. | Kamera konumu, boyuna mesafe, görünürlük durumu | Ribbon'un aynı çağrısı; büyük saydam alanları sınırlayarak overdraw azalt. Solma, NoData boşluğunu örtme yöntemi değildir. |

### 4.3 Geometri, LOD ve ilerleme kuralları

| Kural | Uygulama önerisi |
|---|---|
| Yüzey | Sol/sağ kenarı ayrı örnekle; görsel açıklık başlangıcı **0.03 m**. Virajda ve içbükey arazide ara kesit ekle; NoData'yı köprüleme. |
| LOD | Görsel şerit görünür mesh yüksekliğine uysun. `heightAt` başka seviyeden geliyorsa yüzey adaptörü gerekir; hazır olduğu doğrulanmadı. Yalnız değişen döşeme bölümü yenilensin; navigasyon XZ'si/uzunluğu sabit kalsın. |
| Materyal | Unlit, FrontSide, `depthTest=true`, `depthWrite=false`; gerekirse küçük polygon offset [T4]. Dağ arkasını gösterme; gölge/bloom ekleme. |
| İlerleme | Metrik merkez çizgisinde `s=s_i+t·ell_i`, kalan `max(0,L−s)`. Kendini kesen rotada önceki segment çevresini ara; en yakın uzak kola sıçrama. Süreyi mesafeyle paylaştırırsan “tahmin” yaz. |
| Öncelik | Geçersiz veri → bilinmiyor; politika aşımı → X; kum → ikon; güven → desen/yazı. Segment maksimumundan tehlikenin kesin koordinatını çıkarma. |

### 4.4 Zaman planı ve kabul kapısı

| Süre hedefi | İş |
|---|---|
| 0–15 dk | Girdi/koordinat/NoData kontrolü; örneklerin canlı sözleşmeyle eşleşmesini teyit. |
| 15–50 dk | Ribbon, yükseklik örnekleme ve UV chevron; tek materyalli risk rengi/deseni. |
| 50–70 dk | Beacon ve geometrik kalan mesafe HUD'u; veri yoksa ETA “—”. |
| 70–90 dk | Mevcut minimap katmanı; ortak X/kum işaretleri. |
| 90–105 dk | Solma, döşeme/LOD değişimi ve kaynak temizleme; geometriyi her kare kurmayı engelle. |
| 105–120 dk | Aşağıdaki kontroller; zaman aşımında gelişmiş basış/alternatif/ETA **Sonra** kalır. |

**Kabul kontrolleri — uygulayıcı yapacak; bu araştırmada çalıştırılmadı:** düz arazide/sert virajda yönlü oklar hedefe akar; eğimde şerit batmaz; kamera sabitken LOD değişimi rehberliği titreştirmez; NoData/kopuk segment üzerinden yol çizilmez; `class/conf/p_sand` eksikliği güvenli sayılmaz; kendini kesen rotada ilerleme sıçramaz; rota yenilenince eski mesh/etiket temizlenir; arka arkaya rota değiştirmede eski API yanıtı yenisini ezmez.

**Önerilen maliyet kapısı:** tek görünür ribbon + tek beacon + ortak işaret grubu, gölgesiz/tek geçişli ana kamera için yaklaşık **3 ek çizim çağrısı**. Yukarıdaki düz 500 m örneği + beacon +32quad işaret = **566 üçgen** (hesap, ölçüm değil). Adaptif örnekleme için ör. **en fazla2000 kesit ≈4000 ribbon üçgeni** başlangıç bütçesi; sınıra gelince tehlike/kopukluk silinmez, görünür pencere kısaltılır. `renderer.info.render.calls/triangles` ile **katman kapalı/açık farkını** ölç [T5]; varsa diğer render geçişlerini de hesaba kat. FPS veya 2 saatlik bitiş garantisi verilmedi.
