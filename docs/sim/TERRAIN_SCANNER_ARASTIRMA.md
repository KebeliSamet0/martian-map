# Sprint 2 — Terrain Scanner / “basma–kaçın” araştırması (2026-11-14)

**Yalnız araştırma:** sadece bu dosya yazıldı; uygulama, oyun testi veya mod kurulumu yapılmadı. Hedef: **18:30 Europe/Istanbul**. Aşağıdaki **bütün kaynak ve alıntıların erişim tarihi 2026-11-14**; tarih her tablo satırı için geçerlidir. Birincil kaynaklar “resmî”, diğerleri “rehber”, görüşler “kullanıcı/eleştirmen” diye ayrıldı. Kaynağın anlattığı davranış, tarafımca oyun içinde ölçülmüş değildir.

**Sonuç:** DS taraması yakın çevreyi geçilebilirlik işaretleriyle okunur kılar; rota çizgisi, geçmiş ayak izleri ve canlı/nesne tespiti ayrı anlamlardır. Mars karşılığı, mevcut DTM/veri katmanının geçici görselleştirilmesi olmalı; yeni sensör ölçümü veya kesin güvenli ayak basış garantisi gibi sunulmamalı. Son bölüm bütünüyle **tasarım önerisidir**.

## 1. Tetikleme, animasyon ve zamanlama

| Oyun / konu | Bulgu ve sınırı | URL, kaynakta yer, kısa birebir alıntı — erişim 2026-11-14 |
|---|---|---|
| DS1 / Director's Cut, PlayStation | **R1** elle tarama başlatır; holografik arama çevredeki nesneleri vurgular. Basılı tutma, bütün arazi taramaları için zorunludur denemez. | [Push Square](https://www.pushsquare.com/guides/death-stranding-how-to-use-the-scanner), How to Use the Scanner, ilk paragraf: “pressing R1”; “holographic search”. |
| DS2, PlayStation | Varsayılan tarama **L1**. Yol üstü ve dışındaki tehlikeleri; düşmanların taşıdığı kargoyu da gösterir. | [Resmî PlayStation rehberi](https://www.playstation.com/en-us/games/death-stranding-2-on-the-beach/death-stranding-2-on-the-beach-guide/), Traversal / Scan your surroundings: “L1 button by default”; “on and off the road”. |
| DS2, kısa/uzun basış | Rehber kısa basışı çevre ping'i, basılı tutmayı yön gösterimi olarak ayırır. Pusula ile alan taraması aynı eylem sanılmamalı. | [GameCast](https://www.gamecast.it/death-stranding-2-guida-iniziale-alla-platinum/), Scanner e navigazione: “Premendolo rapidamente attivi il classico ping”; “Tenendolo premuto vedi la direzione”. |
| DS1, tarama yayılımı | Arazi önüne doğru ilerleyen parlama betimlenir. BT siluetinin kısa görünmesi ayrıca anlatılır; bu süreyi zemin işaretlerinin süresi saymıyorum. | [Shacknews](https://www.shacknews.com/article/114845/how-to-use-the-odradek-in-death-stranding), How to use the Odradek: “A flash will run down the terrain in front of you”. |
| DS1, bekleme | Bir rehber **kısa cooldown** bildirir; saniyesi **bulunamadı**. Başka rehberin “kısıtsız kullanım” ifadesi kaynak tüketmemek bağlamındadır; buradan sıfır bekleme çıkmaz. | [Gamer Tweak](https://gamertweak.com/how-to-scan-death-stranding/), How to use Cargo Scanner: “small cooldown time”. [Gamepressure](https://www.gamepressure.com/death-stranding/starting-tips/z3cc85), The scanner makes it easy…: “use it without restrictions”. |
| DS2, bekleme | **Faster Scanner Recharging** yükseltmesi daha sık taramaya izin verir. Temel/yükseltilmiş bekleme süresi saniye cinsinden **bulunamadı**. | [GamesFuze](https://gamesfuze.com/game-tips/death-stranding-2-best-enhancements-to-unlock-first-apas-guide/), erken APAS önerileri: “Faster Scanner Recharging”; “scan more frequently”. |
| DS2, menzil | **Augmented Terrain Scanner** menzili artırır. Temel elle taramanın metre cinsinden yarıçapı, açısı ve tam yayılım süresi **bulunamadı**. | [Shacknews APAS](https://www.shacknews.com/article/144962/best-apas-enhancements-death-stranding-2), Best Porter Skills: “will vastly increase the range of the scanner”. |
| DS2, ayrı 20 m özelliği | **Proximity Scanner**, insan/hayvan tespiti için otomatik yakın taramadır. Rehber **20 m yarıçap** verir; **bu, manuel Terrain Scanner yarıçapı değildir**. Periyodun saniyesi bulunamadı. | [GamesFuze](https://gamesfuze.com/game-tips/death-stranding-2-best-enhancements-to-unlock-first-apas-guide/), Best Mid-Game… / Proximity Scanner: “periodically pings a 20m radius”. |

**Süre boşlukları:** DS1/DS2 standart arazi işaretlerinin kesin kaybolma süresi, tarama cephesinin m/s hızı ve bekleme zaman çizelgesi için doğrulanmış sayısal tablo **bulunamadı**. “Sık tara” tavsiyesi ölçüm değildir. DS2 modül/ayar/platform farkları varken tek evrensel tarama geometrisi ileri sürmüyorum.

## 2. Tarama neyi gösteriyor; zeminde nasıl görünüyor?

| Kapsam | Kaynaklı görünüm / anlam | URL, yer, kısa birebir alıntı — erişim 2026-11-14 |
|---|---|---|
| DS1, kara yüzeyi | **Mavi noktalar:** daha rahat geçiş; **sarı üçgen:** kaygan/dikkat; **kırmızı çarpı:** takılma/düşme tehlikesi. Rehber bunları zemindeki ayrı işaretler olarak anlatır; bütün yüzeyi tek renk boyayan bir katman değildir. | [GameSpot Prologue](https://www.gamespot.com/gallery/death-stranding-walkthrough-guide-prologue-tips/2900-3162/), Climb And Scan: “Blue dots”; “Yellow triangle”; “Red cross”. GameSpot'a bağımlı olmayan renk teyidi: [Reverse Shot](https://reverseshot.org/features/3379/kojima_death_stranding), arazi taraması paragrafı: “blue dots”; “yellow signals caution”. |
| DS1, kayalık/yokuş | Kayalık ve tepelik yerde kırmızı X'ler geçiş güçlüğünü belirtir. Bu, her kayanın boyutunu ölçen veya her kayayı ayrı nesne olarak etiketleyen sistem kanıtı değildir. | [Shacknews](https://www.shacknews.com/article/114845/how-to-use-the-odradek-in-death-stranding), son açıklama paragrafı: “red Xs”; “rocky, hilly areas”. |
| DS1, su derinliği | Mavi sığ/rahat; sarı daha derin, dayanıklılık ve denge gerektirir; kırmızı çok derin ve sürüklenme tehlikesi. **Metre eşikleri bulunamadı.** | [Push Square](https://www.pushsquare.com/guides/death-stranding-how-to-use-the-scanner), su geçişi: “blue circle”; “yellow square”; “Red squares”. [Gamepressure](https://www.gamepressure.com/death-stranding/starting-tips/z3cc85), Check the depth of the river…: “Red means it is too deep.” |
| DS1, resmî su teyidi | Geliştirici, kırmızı işaretleri daha derin su ve yıkanıp sürüklenme riskiyle ilişkilendirir; örnek Reverse Trike bölümündedir. | [Kojima Productions](https://www.kojimaproductions.jp/en/DSTips), Using the Reverse Trike / Beware of rivers: “red markers indicate deeper waters”. |
| DS1, nesne/düşman | Kayıp kargo, malzeme ve MULE kargosu bulunur. BT göstergesi ile zemin renk efsanesi aynı şey değildir. | [Push Square](https://www.pushsquare.com/guides/death-stranding-how-to-use-the-scanner), ilk tarama paragrafı: “lost cargo”; “nearby materials”. [Kojima Productions](https://www.kojimaproductions.jp/en/DSTips), Stealth Strategy / Point 1: “cargo carried by MULES”. |
| DS2, kara renkleri | GameSpot mavi için düz/kolay, sarı için hafif eğimli veya taşlı, kırmızı için dik ve düşme tehlikeli yüzey der. Derece/taş boyutu eşikleri verilmez. | [GameSpot 20 Things](https://www.gamespot.com/gallery/death-stranding-2-tips-beginners-guide/2900-6684/), Scan your surroundings: “Flat and easily navigable surfaces”; “Slightly sloped or rocky surfaces”. |
| DS2, açık alternatif ve ayrıntı farkı | Açılabilen KeenGamer maviye hafif eğim, sarıya bozuk yüzey, kırmızıya dik uçurum veya derin su der. “Yeşil güvenli” yorumu GameSpot'ın “yeşil saklanılabilen ot” açıklamasıyla örtüşmez; **yeşili evrensel güvenli basış rengi saymıyorum**. | [KeenGamer](https://www.keengamer.com/articles/guides/death-stranding-2-guide-37-best-survival-tips/), §1.4: “green is safe”; “blue is gentle slopes”; “steep cliffs or deep water”. Renk anlamları ikincil rehberlerden; resmî sayısal sınıflandırma bulunamadı. |
| DS2, su ve X işaretleri | Mavi/sarı su geçiş bölgeleri ve kaçınılacak kırmızı X'ler açık alternatif rehberde de bulunur. Bu açıklama suyun gerçek derinliğini sayısal ölçtüğümüz anlamına gelmez. | [GAMES.GG](https://games.gg/death-stranding-2-on-the-beach/guides/death-stranding-2-on-the-beach-advamced-tips-tricks/), How Does the Odradek Scanner Help With Route Planning?: “blue and yellow zones”; “red X markers”. |
| DS2, yüzeye bağlı işaretler | Bağımsız eleştirmen, taramadan sonra arazide mavi/sarı/kırmızı işaretler gördüğünü anlatır. Aynı yazı işaretlerin geçişi her durumda doğru anlatmadığını eleştirir. | [Akhil Arora](https://akhilarora.com/2025/12/death-stranding-2-review-ps5/), araçsız geçiş paragrafı: “blue, yellow and red markers”. |
| Uçurum / tehlikeli alan sınırı | DS2 rehberi kırmızı işaretleri dik uçurumla ilişkilendirir; **düşüş yüksekliği veya uçurum kenarına mesafe eşiği bulunamadı**. Taramadan eksiksiz bir tehlike poligonu üretildiği doğrulanmadı. | [KeenGamer](https://www.keengamer.com/articles/guides/death-stranding-2-guide-37-best-survival-tips/), §1.4; yukarıdaki uçurum alıntısı. DS2'nin yol dışını da taradığı resmî kaynakla §1'de kayıtlı. |

**Şekil ayrıntısı sınırı:** DS1 su sembolleri rehberlerde daire/kare, bazı başka anlatımlarda su üstünde çarpı olarak geçer. [GameSpot Prologue](https://www.gamespot.com/gallery/death-stranding-walkthrough-guide-prologue-tips/2900-3162/), Wading Through Water: “surface underneath the water”. Yüzey türü/uyarı durumunu ayırmadan tek değişmez sembol tablosu vermiyorum. DS2'nin tam nokta/ızgara aralığı, sembol ekran boyutu, alpha eğrisi ve kaybolma saniyesi **bulunamadı**. Videodan kare/saniye veya piksel ölçümü yapılmadı; “ızgara” şeklindeki erişilemeyen Yahoo yazısı ana kanıt alınmadı.

### Sayısal eşik denetimi

| Değer | Kaynak ve doğrulama sınırı — erişim 2026-11-14 |
|---|---|
| DS1 **>45°** | [Samurai Gamers](https://samurai-gamers.com/death-stranding/surveying-sensor-terrain-guide/), Steep Terrain: “inclination of more than 45 degrees”. **Tek ikincil rehber iddiası**, oyun ölçümü/birincil belgeyle doğrulanmadı. Aynı sayfanın üçgen açıklaması rough/muddy arasında değişiyor; sembol tablosu koşulsuz alınmamalı. DS2 veya Mars güvenlik sınırı değildir. |
| DS2 **20 m** | §1 GamesFuze kaydı: ayrı **Proximity Scanner**, manuel arazi taramasına uygulanamaz. |
| DS2 menzili **2 kat** | [VideoGamer](https://www.videogamer.com/guides/death-stranding-2-apas-enhancements-explained-how-to-get-more-memory/), APAS / Augmented Terrain Scanner arama indeksinde: “Doubles the terrain scanner’s range”. **Tam sayfa 403; bağımsız doğrulanmadı.** Açık Shacknews artışı nitel olarak destekliyor, katsayıyı değil. |
| DS1 DC **20 saniye** | [Nexus Mods, Longer Scanner Presistance](https://www.nexusmods.com/deathstranding/mods/125?tab=description), About this mod: “for 20 seconds instead of quickly fading out”. **Mod yazarının değiştirdiği süre**, orijinal oyunun varsayılanı değil. Mod indirilmedi/kurulmadı. |
| Diğerleri | Temel yarıçaplar, standart işaret ömrü, saniye cinsinden cooldown, su derinliği/metre ve DS2 eğim dereceleri: **bulunamadı**. |

## 3. Kullanıcıların yaşadığı tasarım sorunları

Bunlar **öznel deneyim/isteklerdir**; tüm oyuncularda aynı hatanın bulunduğu veya güncel yamada değişmediği iddia edilmez.

| Sorun | Kaynak, yer, birebir alıntı — erişim 2026-11-14 | Mars'a tasarım önerisi |
|---|---|---|
| Açık renk efekt üstünde yazılar okunmuyor | [Gamer Matters](https://gamermatters.com/death-stranding-2-on-the-beach-review/), görsel sunum/UI paragrafı: “some UI elements are hard to see”. Yazar beyaz/mavi hologram ve nesne etiketlerini eleştiriyor. | Koyu kontur, yazı zemini; renk yanında şekil ve metin. |
| İşaretler tırmanılabilirliği her zaman açıklamıyor | [Akhil Arora](https://akhilarora.com/2025/12/death-stranding-2-review-ps5/), araçsız geçiş paragrafı: “can never be fully relied upon”. | Maviyi “garantili BAS” diye adlandırma; çözünürlük/güven sınırını göster. |
| Tarama modunun yön/kapsam değişimi anlaşılmıyor | [AVForums](https://www.avforums.com/threads/death-stranding-2.2438471/page-14), Spiderpig, 3 Temmuz 2025, **#329**: “a cone in front of me”; “hoping this would be a toggle”. | “Çevre / ileri” mod adını ve kapsamını görünür yap; sessiz mod değişikliği yok. Bu forum iddiası temel taramanın 360° olduğunun resmî kanıtı değil. |
| İşaretler çabuk sönüyor | [Nexus Mods](https://www.nexusmods.com/deathstranding/mods/125?tab=description), About this mod; §2'deki sönme alıntısı. Daha uzun görünürlük isteyen mod mevcut; yaygınlık ölçümü yok. | Süre ayarı ve duraklatılabilir tarama görünümü; tehlike bildirimi sönünce güvenli sayılmasın. |
| Geçmiş iz rota tavsiyesi sanılabiliyor | [PC Gamer](https://www.pcgamer.com/games/action/death-stranding-2-fragile-lou-location/), How to find Lou and Fragile: “I mistakenly followed my own tracks”. | Yürünmüş iz, planlanan rota ve kaçınma işaretleri ayrı desen/efsane taşısın. |

## 4. Erişim ve elenen kanıtlar

- **GameSpot** bu oturumda web aracıyla okunabildi; kullanıcı tarafındaki 403'ün çözüldüğü iddia edilmiyor. Çekirdek alternatifi: Push Square, Shacknews, Gamepressure, GamesFuze, GAMES.GG, Reverse Shot ve resmî PlayStation/Kojima sayfaları. Bunların HTML metinleri bu oturumda giriş yapmadan okunabildi; başka ağlardaki erişim garanti edilmiyor.
- **Epic** ana kanıt yapılmadı. **VideoGamer** doğrudan403; indekslenen 2× iddiası ayrıca işaretlendi. **Yahoo/ATT**429, [Yahoo Tech kopyası](https://tech.yahoo.com/gaming/articles/18-tips-help-keep-balance-120000656.html)403; grid betimlemesi doğrulanmış görünüm sayılmadı.
- **GameCast** sayfasındaki cooldown cümlesi *Come sfruttare al meglio i movimenti di Sam* bölümünde **çift zıplama** bağlamında: “c’è un piccolo cooldown”. Tarama cooldown'una delil sayılmadı. Tetikleme için ayrı Scanner e navigazione bölümü kullanıldı.
- [Times of India](https://timesofindia.indiatimes.com/sports/esports/news/how-to-use-the-odradek-in-death-stranding-2/articleshow/122107077.cms), How to Use Odradek: “press the R1 button”. DS2 için resmî L1 bilgisiyle çeliştiğinden kontrol şeması/şekil eşlemesinde güvenilir ana kaynak sayılmadı.
- Reddit sonuçlarında UI kalabalığı ve küçük yazı şikâyetleri bulundu; doğrudan sayfalar açılamayınca ana kullanıcı kanıtı yapılmadı. Açılabilen eleştiriler ve AVForums kullanıldı. Cheat/trainer reklamları, tarama süreleri için ölçüm kaynağı sayılmadı.

## 5. Mars simülasyonu için “basma / kaçın” şartnamesi — tasarım önerisi

**Anlam:** bu, DTM ve mevcut zemin katmanlarını açığa çıkaran görsel yardımcıdır. Gerçek sensör simülasyonu veya santimetre ölçeğinde ayak yerleştirme çözümü değildir. Aşağıdaki yarıçap/süre/ızgara sayıları **önerilen UX bütçeleri**, DS veya NASA parametreleri değil. Uygulayıcıya şartname; kod çalıştırılmadı.

### 5.1 Girdi ve sınıflandırma

| Girdi / durum | MVP davranışı | Sonra |
|---|---|---|
| `heightAt(x,z)`, geçerlilik, metrik dönüşüm, DTM çözünürlüğü | Oyuncu etrafında merkez ve komşu yüksekliklerden yerel eğim/normal hesapla. Örnek tabanı veri çözünürlüğünden küçük olmasın. NoData komşuluğunu enterpole ederek güvenli ilan etme. | Ölçekli pürüzlülük, doğrulanmış engel/çukur ve kenar-düşüş haritaları. |
| `route.segments[].path_px`, `slope_max` | Rota üstündeki segment uyarısına bağla. **Segment maksimumunu tüm alana veya kesin bir noktaya yayma.** Yol dışı için yerel grid verisi gerekir. | API'nin konumsal risk katmanları; planlayıcıdan alternatif yol. |
| `class`, `conf`, `p_sand` | Konumu/kapsamı bilinen hücrede göster. `low/null` güven ve eksik sınıf açıkça etiketlenir. `p_sand` kum sınıfı skoru; düşme/batma olasılığı değil. | Kalibre sınıflandırma ve geçilebilirlik modeli. |
| `slopeLimit`, uyarı marjı ve birim | Mevcut planlayıcı politikasından al; derece/yüzde teyit edilir. Politika yoksa sayısal eğimi göster, güvenli rengi üretme. | Test edilmiş astronot/skafandr modeline bağlı politika. |
| NoData / yüklenmemiş alan | Gri `?` veya taralı sınır + “veri yok”. İşaret yokluğu güvenli değildir. | Kapsam/güncellik katmanı. |
| Limit aşımı / zemin belirsizliği | Kırmızı X = **mevcut politikaya göre kaçın**; sarı △ = dikkat/kum/düşük güven; açıklamada nedeni göster. | Yerel alternatif adaylarının gerekçeli karşılaştırması. |
| Kontrollerden geçen hücre | Mavi küçük ○ = **bu veri ölçeğinde geçiş adayı**. “Kesin buraya bas” yazma. Yalnız eğim biliniyorsa “eğim katmanı; zemin bilinmiyor” göster. | Ayak boyutu, karakter teması ve yerel yüksek çözünürlük birlikte varsa basış önerisi. |

**Kaya/su:** sentetik taşların çarpışma geometrisi varsa yalnız “simüle engel” diye işaretlenebilir; gerçek Gale kaya ölçümü sayılmaz. Sıvı su derinliği katmanı bu görevde mevcut diye varsayılmadı; DS'nin nehir renkleri Mars'a taşınmaz. Sadece yükseklik boşluğundan “uçurum derinliği” uydurulmaz.

### 5.2 Etkileşim, çizim ve performans

| Eleman | MVP | Sonra |
|---|---|---|
| Tetikleme | Yeniden atanabilir **Q / HUD Tara** eylemi önerisi; mevcut kontrollerle çakışma uygulayıcı tarafından kontrol edilir. Tek basış tarar, basılı tutmak gerekmez. | İsteğe bağlı otomatik tarama; çevre/ileri modu. |
| Tarama alanı | Tetik anındaki konumu sabitle; **20 m yarıçap**, **2 m** başlangıç ızgarası. Kamera dönerken veri alanını döndürme. Bu 20 m seçimi DS2 manuel menzili değildir. | Görüş/occlusion ve düşük güvenli alanlara göre adaptif örnekleme. |
| Animasyon / süre | Dışa ilerleyen aydınlanma: **0.8 s yayılma +4.2 s tutma +1 s solma =6 s**. En erken **1 s** sonra tekrar tetiklenebilir; yeni tarama aynı havuzu yeniler. Bunlar oyun kaynağından alınmadı. | Hareket azaltma modu ve kullanıcı süre ayarı. |
| Zemin işaretleri | Yaklaşık **0.3 m** glyph quad'ları: ○/△/X/?; yerel normal ve görünür arazi yüksekliğine oturt. Ortodokuyu tümüyle boyama; rota çizgisini başka desenle koru. | Kenar/engel konturları; veri desteklerse yaklaşık geçiş pedleri. |
| Derinlik / LOD | `depthTest=true`, `depthWrite=false`; küçük görsel açıklık ve gerekirse polygon offset. LOD değişince görsel yüksekliği yenile, sınıflandırmayı kamera LOD'una göre değiştirme. Dağ arkasındaki zemine X-ray yapma. | Gelişmiş yüzey yapışması ve kararlı yumuşatma. |
| İş yükü | Yükseklik/sınıf hesabı tetiklemede; kare başına yalnız zaman/alpha. Aynı geometri/materyalle InstancedMesh, ortak shader'da glyph/durum. 40×40 m kutuda2 m adımın üst sınırı **21×21=441 merkez**, disk dışı elenir; en fazla **882 quad üçgeni**. | Tile bazlı önbellek/worker; ölçüme göre yoğunluk. |
| Bilgi ve solma | Yakın risk için tek açıklama kartı: neden, yerel eğim, güven ve veri ölçeği. Ekran işareti sönmesi riski temizlemez; veri yaşı gösterilir. | Kanıt görüntüsü/katman kaynağını açma. |

**Teknik kaynaklar — erişim 2026-11-14:** [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html), giriş: “same geometry and material(s)”; [ShaderMaterial](https://threejs.org/docs/pages/ShaderMaterial.html), Code Example: `time: { value: 1.0 }`; [Material](https://threejs.org/docs/pages/Material.html), özellikler: `depthTest`, `depthWrite`, `polygonOffset`. Bunlar API dayanağıdır; **1 ana-geçiş çizim çağrısı** hedefi ve882üçgen hesabı bizim önerimizdir, performans ölçümü değildir. Shader/instancing uyumluluğu kurulu sürümde kontrol edilmeli. Marker başına mesh, tam ekran postprocess, gölge ve her karede yüzlerce DOM etiketi MVP'ye eklenmez.

### 5.3 Kabul kapısı — uygulayıcı için

- Düz alan, eğim geçişi, yerel yüksek basamak, NoData sınırı ve düşük güven ayrı gösterilir; kamera döndüğünde durum/risk rengi değişmez.
- Yol dışında veri yoksa tarama “bilinmiyor” verir; rota segmentinden sahte alan haritası üretmez. Eşik girilmedikçe45°/20° gibi sabit Mars güvenlik değeri kullanılmaz.
- Art arda tarama tek havuzu yeniler; eski asenkron sonuç yenisini ezmez. DTM sürümü değişmiş hücre eski “geçiş adayı” durumunda kalmaz.
- Yakın tehlike mesajı işaret alpha'sına bağlı kaybolmaz; renkler şekil/efsane ile okunur. Tarama sona ermesi veya taşın gizlenmesi güvenli yüzey anlamına gelmez.
- LOD/döşeme geçişinde işaretler batmaz/sıçramaz; zemin arkasından görünmez. Katman kapalı/açık kare süresi ve çizim çağrısı farkı ölçülür. **Bu kontroller bu araştırmada çalıştırılmadı.**
