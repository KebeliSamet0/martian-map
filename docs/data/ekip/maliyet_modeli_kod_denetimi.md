# Maliyet modeli kod denetimi — 2026-11-15

**Karar:** Kod, mevcut haliyle operasyonel astronot tüketimi veya güvenli dönüş hesabı olarak doğrulanmış değildir. Pandolf'un dört katsayısı ve yüzde eğim dönüşümü doğru aktarılmış; buna karşılık Mars yerçekimi ölçeklemesi ve Apollo kalibrasyonu özgün modeli değiştiriyor. Santee iniş düzeltmesi yok; rota ve `/step` ana hesabı yönsüz, ek `directional` hesabı ise inişin metabolik eğimini sıfıra kesiyor. **Kod değiştirilmedi.**

Salt okunan kök: `C:/Users/Batu/Desktop/mm-pr/main-wt`. İncelenen dosyalar: `api/planner/{cost,params,route,terrain,layers,comparison}.py`, `docs/{metabolic_model,eva_parameters}.md`; satırlar bu anlık kopyaya aittir. Kaynak erişimi 2026-11-15; ayrıntılı geçmiş/yeni kaynak kaydı: [kaynaklar/gercek.md](kaynaklar/gercek.md). Kullanıcının son kararı uyarınca bu raporla birlikte yalnız kaynak defteri de yazılmıştır.

## Önem sırasıyla bulgular (2026-11-15)

**P0:** fiziksel tüketim/görev kararını yanlış gösterebilen hesap veya kısıt hatası; **P1:** kalibrasyon/geçerlilik belirsizliği ya da yöntem uyuşmazlığı; **P2:** adlandırma/belge hatası. P0, Mars için bilinmeyen katsayıyı bildiğimiz anlamına gelmez; doğrulanmamış fizik operasyonel sonuç gibi kullanılmamalıdır.

| ID | Önem / yer | Bulgu, kanıt ve etkisi | Düzeltme önerisi; uygulanmadı |
|---|---|---|---|
| F01 | **P0**, `cost.py:31–45`, `params.py:8–10,21–24` | `G_RATIO` yük ve hareket terimlerini çarpar, sonra bütün ifade 272 W'a ölçeklenir; özgün Pandolf değildir. Mars'a geçerli fizyolojik dönüşüm doğrulanmadı [S1,S2,S5]; Farley–McMahon yürüyüşün g ile doğrusal azalmadığını gösterir. | Saf Dünya referans fonksiyonunu ayrı tutun; Mars modeli bulunmadığı sürece `mars_validated=false`, güç senaryosu ve belirsizlik gösterin; Dünya modelini Mars ölçümü diye kullanmayın. |
| F02 | **P0**, `cost.py:43–45`; `route.py:498–499` | Güç için negatif/sonlu/değer alanı kontrolü veya clamp yok. İzole Dünya testinde −%10 için **−69,0625 W**; mevcut varsayılanlarda V=1 m/s, −%50 doğrudan çağrıda **−323,0705 W** çıktı. Mevcut normal rota bu negatif eğimleri fonksiyona vermiyor; bu yüzden üretimde negatif kcal görüldüğü iddia edilmiyor. | Signed eğim desteğinden önce doğrulanmış iniş modeli, geçerlilik kontrolü ve açık hata politikası ekleyin; keyfî clamp fizik doğrulaması değildir. Sıfıra keserek “doğrulandı” demeyin. |
| F03 | **P0**, `route.py:20–36,269–278` | Snap, yalnız çevredeki <25° hücreyi seçer; başlangıçtan o hücreye bağlantının geçilebilirliğini, süre/enerjisini ve kayalarını denetlemez. Testte istenen `[2,1]` yerine yol `[0,1]`'den başladı; **4 m bağlantı** hesap dışı kaldı, API başlangıç alanı eski koordinatı korudu. | Talep/gerçek uçları ve snap mesafesini ayrı döndürün; fiziksel bağlantı yoksa durdurun veya açık kullanıcı yer değişikliği isteyin; bağlantı maliyetini toplama katın. |
| F04 | **P0**, `route.py:42–47` | Kullanıcı `max_slope_deg=10` verdiğinde uç hücrenin maliyeti eski yüzeyden geri açılıyor. **20° uç içeren yol için `go=true`** testi geçti; arayüzde katı sınırmış gibi sunulursa yanlış karar doğurur. | Kullanıcı sınırını uçlarda da uygulayın veya istisnayı açık sözleşme/uyarı yapın; aynı `passable` maskesini uç, arama ve son doğrulamada kullanın. |
| F05 | **P0**, `route.py:216–259` | `total.min/kcal` tek yön; `eva_kcal/o2_L` yalnız iki yön yürüyüş; `dose_uGy` iki yön+bilim; `budget.used` bunlara rezerv ve durak metabolizmasını ekler. Aynı “görev tüketimi” gibi sunulursa gerçek dönüş payı ciddi eksik görünür. | `outbound`, `return`, `science`, `reserve`, `committed` alanlarını tutarlı birimlerle ayrı sunun; HUD/GO aynı toplamı ve kapsamı kullanmalı. |
| F06 | **P0**, `cost.py:91–97`, `layers.py:61–62`, `route.py:48,64` | Varsayılan 8-komşulukta köşe geçişi engellenmiyor: iki karşı köşesi 0°, diğer ikisi 30° olan 2×2 testte yol doğrudan çapraz geçti (**2,8284 m**). İki engelin arasına sıfır genişlikli geçiş sığdırıyor; astronot/ekipman açıklığı modellenmiyor. | No-corner-cutting kenar testi ve fiziksel açıklık/engel şişirmesi ekleyin; yalnız hücre merkezleri değil bağlantının tamamı denetlensin. |
| F07 | **P1**, `cost.py:18–24,48–52`, `route.py:488–501` | Hücre eğimi maksimum yerel eğimdir; yürüyüş yönündeki eğim değildir. Planlayıcı ve `/step` ana tüketimi iniş-çıkışı eşit hesaplar; `directional` yalnız ek çıktı, GO bütçesini değiştirmez. | Kenar bazlı signed `G=100·Δz/Δhorizontal` ile arama/ölçüm/dönüş aynı hesap motoruna bağlanmalı; yönsüz yaklaşım fiziksel kestirim diye sunulmamalı. |
| F08 | **P1**, `route.py:498`; `docs/metabolic_model.md:38–53` | Santee **uygulanmıyor**; `max(100·tan_dir,0)` inişi düz zemin metabolizmasına çeviriyor. Belgedeki “iniş çıkış kadar pahalı” yalnız ana yönsüz hesaba uyar; ek yönlü sonuç farklıdır. | İniş modelini kaynak ve geçerlilik alanıyla seçin; G<0 koşulunu bağımsız test edin. Belgedeki CF ifadesini işaret/üs doğrulaması yapmadan taşımayın [S2,S3]. |
| F09 | **P1**, `cost.py:39–45`, `params.py:54` | Kalibrasyon import anında sabitlenir; çalışma sırasında kütle/BASE_SPEED/g/referans değişirse yeniden hesaplanmaz. `STOP_METABOLIC_W` de referans gücün dinamik bağlantısı değil, import anındaki sayısal kopyasıdır. | Değişmez, sürümlü model-konfigürasyon nesnesi kullanın; kalibrasyon ve durak gücünü açık girdiler yapın; eski sabitleri sessiz taşımayın. |
| F10 | **P1**, `cost.py:32`, `route.py:39–40,263–269,423–468` | Ek yük `/step` içinde tam yük terimine giriyor; `plan_one/shortest_path` ek yük almıyor, bütçesi varsayılan sıfır ek yükle kuruluyor. Numune sonrası prova ile önceden planlanan tüketim farklılaşabilir; yükten dönüş planlamasına otomatik yayılım yok. | Planlama/dönüş/gözlem çağrılarına evre bazlı ek yük geçirin; yükün ne zaman alındığını modelleyin; yalnız oranla veya sıfır yükle bütçe üretmeyin. |
| F11 | **P1**, `cost.py:20,27–28` | η ve hız çarpanı ayrı ayrı olasılık ağırlıklı ortalama; bunların nonlinear birleşimi **beklenen kcal/metre değildir**. Yarı ana kaya/yarı kum testi eklenti yöntemi 0,101477, sınıf maliyetlerinin ortalaması 0,106303 kcal/m verdi. | Olasılıkların sınıf belirsizliği mi alan karışımı mı olduğunu tanımlayın; beklenen maliyet isteniyorsa sınıf başına hesaplayıp ağırlıklandırın, belirsizlik senaryolarını ayırın. |
| F12 | **P1**, `cost.py:71–90`, `params.py:68–71` | Entropy yalnız göreli risk maliyetine girer; süre/enerji/O₂ belirsizlik bandına dönüşmez. `shortest` risk ağırlığı sıfır olduğundan entropy'yi önemsemez; `risk` kaza olasılığı değildir. | Belirsizlik cezalarını güvenlik ölçümü diye adlandırmayın; kanıtsız alan politikası ve tüketim aralığı ayrı karar olmalı. |
| F13 | **P1**, `params.py:31–33`; `terrain.py:6–26` | Çalışan η/hız tablosu Markdown'dan okunuyor; yalnız params sözlüğünü görmek yetmez. Mars sınıf eşlemesi ve hız çarpanları doğrulanmamış; yükleyici pozitif sonlu değer denetliyor ama fiziksel geçerlilik alanı taşımıyor. | Kaynağı/sürümü/gezegeni/geçerlilik alanını konfigürasyona ekleyin; çalışma çıktısında etkin tabloyu kaydedin; belgeyi değiştirmek sessiz fizik değişikliği olmasın. |
| F14 | **P1**, `cost.py:18–24`, `params.py:19,33` | Tobler Dünya fonksiyonu BASE_SPEED=0,8 m/s'ye normalize edilmiş, Mars skafandr hız yasası değil. Alt hız clamp'i 0,05 m/s; yüksek eğimlerde kaynak fonksiyonundan ayrılır. | Kaynaklı Mars hız fonksiyonu yoksa benchmark/senaryo adı kullanın; clamp etkinliğini bildirin; süre aralığını gösterin [S4,S5]. |
| F15 | **P1**, `params.py:49–58`; `cost.py:55–62` | 4,8 kcal/L sabit kalorik eşdeğer, RER/protein ve gaz referans koşuluna bağlı; Mars dış atmosfer basıncıyla doğrudan belirlenmez. 1,429 g/L yalnız belirtilen referans koşulunda hacmi kütleye çevirir; tüp/suit hacmi değildir. | STPD/BTPS ve tank hacmi ayrımını açık yazın; metabolik O₂, kaçak/purge, kullanılabilir tank stoğu ve rezerv ayrı tutulmalı [S6]. |
| F16 | **P1**, `params.py:48–53`, `route.py:232,247,485` | 8,75 µGy/SI saat, tarihsel 0,21 mGy/day değerinin 24'e bölünmesi. Hassler ana metni day ve sol kullanıyor; okunan pasajlarda doz normalizasyonunun tam saniye tanımı ayrıca bulunmadı. Sabit değer yerel/saatlik/SEP modeli değil. | Rate kaydında `denominator_seconds` zorunlu olsun; day=86400 s doğrulanmadan otomatik sol dönüşümü yapmayın; kişisel doz/standart limiti olarak sunmayın [S7,S8]. |
| F17 | **P1**, `route.py:219–232,259` | Dönüş aynı yol ve aynı tüketim kabul edilip gidiş ikiyle çarpılıyor. Yön, yük değişimi, etkinlik/yorulma ve dönüşe özgü zemin koşulları yok; `walkback_ok` yalnız zaman limitini denetliyor. | İzin ters yönünü ve evre yükünü yeniden değerlendirin; tüm kaynaklara göre dönüş uygunluğu verin, zaman kontrolünün adını daraltın. |
| F18 | **P1**, `cost.py:90`, `route.py:74–87`, `comparison.py:58–64` | MCP kenar maliyeti komşu hücreler arası geometrik integrasyonken rapor profili yalnız varış hücresinin metre maliyetini çarpar. Heterojen hücrelerde optimize edilen ve raporlanan maliyetler farklılaşır; referansın rasterleştirilmesi de poliline uzunluğunu değiştirir. | Aynı kenar integrasyonunu planlayıcı, profil ve referans karşılaştırmasında kullanın; planimetri/raster/3B mesafeyi ayrı etiketleyin. |
| F19 | **P1**, `route.py:68–71,435–437,492–501` | Mesafe yatay `hypot(Δx,Δy)`; `Δz` eklenmiyor. Pandolf V'nin bant/zemin boyu hızıyla yatay hız eşlemesi açık değil; eğimde süre/enerji mesafesi farklı tanımlara kayabilir. | `horizontal_m`, `surface_m`, signed grade ve hızın referans mesafesini tanımlayın; seçilen deney formülüyle tutarlı kullanın. |
| F20 | **P1**, `params.py:37–41`, `cost.py:91–94`, `layers.py:61` | 25° insan Mars limiti değil; 10 m snap için rover/DEM gözlemi insan erişilebilirlik kanıtı sağlamaz. İsteğe bağlı kaya maskesi ve kullanıcı eğim sınırı connectivity/snap ile aynı değil. | Politik eşikleri bilimsel limitten ayırın; tek geçerlilik maskesi ve son yol doğrulaması kullanın; bilinmeyeni geçilebilirlikle eşitlemeyin. |
| F21 | **P2**, `params.py:62,69` | “En kısa” ön ayar t=1,k=r=0; minimize edilen **süre**, metre değil. Hız zemin/eğimle değiştiğinden en kısa mesafe garantisi yok. | “En hızlı (model)” olarak adlandırın veya mesafe için sabit birim kenar maliyeti kullanın. |
| F22 | **P2**, `docs/metabolic_model.md:5,34–35`; `cost.py:92` | “Kod orijinalle birebir” ve “25° güvenlik sınırı” ifadeleri kapsamı aşıyor. Katsayılar aynı ama g/kalibrasyon eklenmiş; sınır varsayım. | “Pandolf yapısının doğrulanmamış Mars uyarlaması” ve “proje planlama eşiği” yazın. |

## İstenen sekiz başlığın hesap izi (2026-11-15)

### 1. Pandolf: katsayı, birim ve eğim

Birincil NASA araştırma çıktısı [S2] Denklem 2, şu Dünya referansını açıkça veriyor:

```text
P_E = 1.5·m + 2·(m+l)·(l/m)^2 + η·(m+l)·(1.5·v^2 + 0.35·v·G)
m,l: kg; v: m/s; G: yüzde eğim; P_E: W = J/SI saniye.
G = 100·tan(θ); θ fonksiyona derece veriliyorsa önce radyana çevrilir.
```

Katsayılar 1,5 / 2,0 / 1,5 / 0,35 kodla aynı. **%10 = 5,710593°; 10° = %17,632698**; ikisi birbirinin yerine kullanılamaz. `layers.py:159–161` pozitif maksimum hücre eğimini üretir; `cost.py:50` bu açıdan yüzdeyi doğru çıkarır. Özgün 1977 tam metni bu tur 403 nedeniyle okunamadı; katsayı eşliği NASA'nın açık denkleminden doğrulandı, özgün deneyin bütün geçerlilik aralığı doğrulanmadı. **Bu eşlik Mars geçerliliği değildir.**

Kodun gerçekten hesapladığı ifade:

```text
B = 1.5·m
H = 2·(m+l)·(l/m)^2
A = η·(m+l)·(1.5·v^2 + 0.35·v·G)
raw = B + γ·H + γ·A; γ = 3.71/9.81
C = 272 / raw(BASE_SPEED, G=0, η_bedrock, ek_yük=0)
P_code = C·raw
```

Burada `l = SUIT_KG + TOOLS_KG + load_kg`; m=80, l=130 kg varsayılan. g yalnız eğim terimine değil **yük terimi ile V² ve VG hareket terimlerinin tamamına** uygulanıyor; başlangıçtaki 1,5m terimine doğrudan uygulanmıyor, fakat C onu da değiştiriyor. Kütle kg olarak kalır; Newton'a çevrilmez. Boyutsal olarak γ ve C birimsiz olsa da bu, fizyolojik ölçeklemenin doğru olduğunu kanıtlamaz.

### 2. Santee, işaret ve negatif güç

Kaynak [S3] Tablo I dipnotu düzeltmenin **G<0** için Pandolf'a eklenmesini belirtir: “Added to Pandolf et al. when G < 0”. Kodun hiçbirinde bu CF uygulanmıyor. Ana akış G≥0 kullanıyor; yönlü akışta da `grade_dir = maximum(100·tan_dir,0)` var. Dolayısıyla “Santee kullanıyoruz” denemez.

`docs/metabolic_model.md` NASA 2024'ten CF kopyalıyor; NASA Denklem 3'te son ifade `(25−V²)` biçiminde, ancak 2018 PDF Tablo I'in metin çıkarımı farklı bir terim gösteriyor ve matematik dizgisi eksiliyor. **Orijinal Santee 2001/2003 denkleminin işaret/üs uyuşmazlığı bu tur çözülemedi; “baskı hatası kesin düzeltildi” doğrulanmadı.** 2018 açık PDF metni okunabildi, görsel sayfa isteği cache miss verdi; düzeltmenin G<0 koşulu okunabilir, tüm sembollerin görsel teyidi yok. Belgedeki formülü körlemesine uygulamak önerilmiyor.

Negatif güç testi bir **alan dışı/korumasız çağrı** testidir; −%10 saf Pandolf negatif sonucu geçerli fizyoloji değildir, iniş düzeltmesi gereksinimini gösterir. Kaynak alanı dışında daha büyük negatif eğimle güncel fonksiyon da negatif olabilir; yalnız `speed_ms` hızını clamp etmek gücü korumaz. Clamp gerekiyorsa ayrıca modellenmiş fizyolojik alt sınır, ihlal bayrağı ve kaynak gerekir; burada yeni bir alt sınır sayısı önerilmedi.

### 3. Kalibrasyon, kütle ve yük

Varsayılan import sonucunda **raw=615,673585627 W**, **C=0,44179254454**, çıktı düz ana kayada v=0,8 m/s için **272 W**. Apollo EVA ortalamasını bu tek noktaya eşitlemek, Mars yürüyüşünü ya da skafandr eklem direncini doğrulamaz. [S5] az yerçekiminde yürüyüş maliyetinin orantılı azalmadığını gösterir; bununla birlikte mevcut çıktı için kesin alt/üst sınır çıkarılamaz.

| γ; her seferinde 272 W'a yeniden normalize | C | Ölçeklenmiş B / H / A; düz v=0,8 | v=1, G=+%10 sonucu |
|---|---:|---|---:|
| 1, Dünya matematik referansı | 0,19012170935 | 22,8146 / 210,8569 / 38,3285 W | 433,2993 W |
| 0,37818552497, mevcut Mars varsayımı | 0,44179254454 | 53,0151 / 185,3017 / 33,6832 W | 413,7503 W |

Bu tablo **Mars deney verisi değil**, kodun cebirsel duyarlılığıdır: kalibrasyon sonrası fark salt ×0,378 değildir. m ve l değiştirilip yeniden import/reload yapıldığında düz referans yine zorla aynı olur; kütle etkisinin kalibrasyonla kısmen silinmesi kişi/suit doğrulaması sayılmamalı.

Sabit kalibrasyonda v=0,8, düz ana kaya için ek yük **0 / 8 / 30 kg → 272,0000 / 304,7459 / 412,3030 W** çıktı. `/step` tam l terimini kullanıyor; planlayıcı aramasına aynı ek yük geçmiyor. Bu değerler yalnız yazılım davranışıdır.

### 4. Oksijen: enerji, litre ve gram

```text
kcal/m = P[W] / v[m/SI s] / 4184[J/kcal]
O2_L/m = (kcal/m) / 4.8[kcal/L_ref]
O2_g/m = (O2_L/m) · 1.429[g/L_ref]
```

Birim zinciri doğru. **L_ref dış Mars atmosferinde solunan litre, tank geometrik hacmi veya skafandr boşluğu değildir**; gaz hacmi referans sıcaklık/basıncıyla tanımlanmalı. [S6] NIST mol kütlesiyle ideal gaz kontrolü 0°C, 101325 Pa için yaklaşık **1,42763 g/L** verir; kodun 1,429 değeriyle fark yaklaşık %0,1, gerçek gaz/yuvarlama ayrıntısı bu testte doğrulanmadı. Dünya yerçekimi veya Mars g oranı bu kimyasal litre→gram dönüşümüne çarpılmaz.

4,8 sabitinin belirli RER/protein durumundaki tam karşılığı özgün Péronnet–Massicotte tablosundan bu tur doğrulanmadı; litre ve gram hesapları aritmetik olarak tutarlı olmakla birlikte **Mars EVA tüketimi** fizyolojik modelden bağımsız doğrulanmış değildir. Yaşam desteğinde kaçak, purge, sistem kayıpları ve acil stok ayrıca modellenmediği için metabolik tüketimden tek başına kullanılabilir EVA süresi çıkarılamaz.

### 5. Doz ve süre/gün birimleri

`params.py:50`: 0,21 mGy/day ×1000 µGy/mGy ÷24 = **8,75 µGy/SI saat**. `/step`: süre SI saniyesi, doz `duration_s/3600·8.75`; plan bütçesi SI dakika üzerinden `/60` ile saate geçer. **Metre/(m/s) hesabının dakikaları Mars saatine çevrilmez; 6 saat yaşam desteği bütçesi 21600 SI saniyesidir**, yerel saat göstergesi ayrı olmalıdır.

Hassler [S7] Tablo 1 dozu mGy/day verir; aynı makale gözlem eksenini sollerle anlatır. Bu tur okunan ana metinden day normalizasyonunun tam saniye tanımı açıkça doğrulanamadı; bu nedenle **“24'e bölmek kesin yanlış” sonucu çıkarılmadı**. Kaynak arşiv/SIS tanımı tamamlanmalı:

| Koşul | Doğru hesap / sonuç | Durum |
|---|---|---|
| Day = 86400 SI saniyesi ise | 210/24 = **8,75 µGy/SI saat** | Mevcut kodla tutarlı; kaynak normalizasyonu ayrıca teyit edilmeli |
| Aynı 210 µGy değeri bir sol başına olsaydı | 210/24,65979 = **8,5158876 µGy/SI saat** | Yalnız koşullu birim örneği; kaynak değeri sol başına ilan edilmedi |
| Mevcut hız bir sol boyunca entegre edilirse | 8,75×24,65979 = **215,7731625 µGy/sol** | Aritmetik olarak doğru; “210 µGy/sol” ile aynı değildir |

RAD tarihsel rover ortam ölçümüdür; güncel Gale yüksekliği, atmosfer sütunu, güneş etkinliği ve SEP olayları hesaba katılmaz. µGy absorbe doz, Sv etkin doz ve NASA limitleri birbirinin yerine geçmez. Kodun 60 µGy değeri planlama varsayımıdır, NASA EVA sağlık limiti değildir.

### 6. Hız–eğim modeli

```text
f = Σ p(c)·terrain_speed(c)
s = tan(slope_deg)          # boyutsuz oran; yüzde değil
v = max(0.8·f·exp(−3.5·|s+0.05|)/exp(−3.5·0.05), 0.05) m/s
```

Tobler kaynak fonksiyonu [S4] `6·exp(−3.5·|s+0.05|)` km/sa biçimindedir; kod bunun **şeklini normalize ediyor**, özgün 6 km/sa genliğini kullanmıyor. Hücre slope≥0 olduğunda bu şekil `exp(−3.5s)` olur; bütün yürüme yönlerine yokuş yukarı eğimi verilmiş gibi davranır. Ek yönlü hesap s=Δz/Δhorizontal kullanır: −%5 eğimde düz referanstan daha hızlı olabilir, ama bu **Dünya fonksiyonunun** Mars skafandrına kanıtlanmamış aktarımıdır. [S2] ve [S4] kaynaklı olmak, BASE_SPEED=0,8 ve zemin hız çarpanlarının Mars için doğrulanması değildir.

### 7. Zemin harmanı ve entropy

`η̄=Σpη`, `f̄=Σpf` ağırlıklı ortalamadır; argmax yalnız baskın sınıf/gerekçe gösterimi için kullanılır (`route.py:83,190–200`). Hız nonlinear maliyete girdiğinden `k(η̄,f̄) ≠ Σp·k(ηc,fc)`; fiziksel karışım modeli veya olasılık beklenen değeri seçimi açık yapılmalı.

Gerçek katmanda:

```text
s_lin = clip(slope/25,0,1)
s_steep = clip((slope−8)/(25−8),0,1)^2
slope_r = 0.4·s_lin + 0.6·s_steep
rock_r = clip(rock_cfa/0.15,0,1)
ent_r = clip((entropy−0.35)/(1−0.35),0,1)
r = 0.65·slope_r + 0.25·rock_r + 0.10·ent_r
c = w_t/v + w_k·kcal_per_m + w_r·r
```

Düz/kayasız testte entropy **0 / 0,35 / 0,6 / 1 → risk 0 / 0 / 0,0384615 / 0,1**. Bu, olasılık kalibrasyonu veya kaza oranı değildir; katsayılar tercihtir. Olasılıkların kendisi düşük kanıtlı bölgede düzleştiğinde η/hız dolaylı değişebilir, ancak entropy doğrudan kalori veya metabolik güç çarpanı değildir.

`layers.load` gerçek paket seçilmişse NaN/NoData, şekil, aralık ve toplam olasılık denetimleri yapıyor; bu olumlu. Fakat hiç veri yolu verilmezse **sentetik** üretir; tüm zemin olasılık dosyaları yoksa **provisional** dolgu yapar. Bu bayraklar sonuçlarda korunmalı; geçici katman gerçek model tahmini diye sunulmamalı. `Layers` doğrudan kurucusu aynı yükleme kontrollerini tekrarlamaz; bu denetimin küçük test girdileri bilerek kontrollü kurulmuştur.

### 8. 25° ve 10 m bağlanma

25° ve üzeri maliyet sonsuz; eşitlik **geçilmez** sayılıyor. 10 m snap diskinde en yakın <25° hücre aranıyor; kullanıcının daha sıkı sınırı, kaya engeli ve aradaki bağlantı bu seçimde yok. `max_slope_deg` uç istisnası ve 8-komşuluk sorunu üstte gerçek modül testleriyle gösterildi; [S2]/rover eğim gözlemleri bunları insan güvenliği kuralına dönüştürmez.

## Bağımsız sayısal doğrulama (2026-11-15)

### İzole Pandolf hesabı: m=80 kg, l=30 kg, v=1 m/s, η=1

Elle hesap: B=120 W, H=30,9375 W, düz hareket=165 W; %10 eğim terimi=±385 W. Mars varsayımı ve kalibrasyon **yalnız test sürecinin belleğinde** γ=1 ve C=1 yapıldı; SUIT=30, TOOLS=0 ayarlanarak toplam dış yük 30 kg oldu, sonra değerler geri yüklendi.

| G | Elle saf Dünya Pandolf | İçe aktarılan fonksiyon, izole ayar | Fark | Yorum |
|---|---:|---:|---:|---|
| %0 | 315,9375 W | 315,9375 W | 0 | Katsayı/aritmetik eşliği geçti |
| +%10 | 700,9375 W | 700,9375 W | 0 | Katsayı/aritmetik eşliği geçti |
| −%10 | −69,0625 W | −69,0625 W | 0 | Aritmetik eşlik geçti; **fizyolojik sonuç geçersiz**, iniş desteği yok |

Mevcut varsayılan ayarlarda aynı v=1 ve G=%0/+%10/−%10 çağrıları **290,946820 / 413,750286 / 168,143355 W** verdi. Bunları yukarıdaki 30 kg yük hesabıyla doğrudan karşılaştırmak yanlış olur: mevcut dış yük **130 kg**, γ farklı ve C=0,44179. Bunlar Mars doğrulama noktaları değildir.

### Yürüyüş, dönüş ve bütçe testleri

| Test | Gerçek modül çıktısı | Sonuç |
|---|---|---|
| Düz ana kayada 20 yatay metre | 25,00 SI s; 1,63 kcal; 0,339 L; 0,48 g O₂; 0,061 µGy | SI birim ve dönüşüm zinciri yuvarlama içinde tutarlı |
| +%10, 20 yatay metre / 2 m çıkış | Ana: 35,48 s, 2,75 kcal; directional aynı | Signed yukarı veri zinciri bu yapay düzlemde tutarlı |
| Aynı izin ters yönü, −%10 | Ana: yine 35,48 s, 2,75 kcal; directional: 25,00 s, 1,63 kcal | Ana ve ek sonuç fizik modeli bakımından farklı; Santee yok |
| Düz 20 m plan bütçesi | total: 0,4 dk, 2 kcal, 1 L, 4,5 µGy; budget.used: 60,833 dk, 237,285 kcal, 49,434 L, 8,872 µGy | Fark dönüş/bilim/rezerv kapsamından, tek bir tüketim gibi sunulmamalı |
| ≥25° başlangıçtan snap | Talep [2,1]; gerçek yol [0,1]→[0,2], 2 m; 4 m başlangıç bağlantısı yok | F03 yeniden üretildi |
| 10° kullanıcı sınırı; 20° başlangıç | Yolun maksimumu 20°; go=true | F04 yeniden üretildi |
| Köşelerde serbest, diğer iki hücre 30° | Yol [0,0]→[1,1] | F06 yeniden üretildi |
| %50 ana kaya/%50 kum | η=1,55; v≈0,64; eklenti 0,1014768, sınıf ortalaması 0,1063031 kcal/m | F11 yeniden üretildi |

### Ortam ve yeniden üretim

Çalışan yorumlayıcı: `C:/Users/Batu/Desktop/mm-pr/.venv-api/Scripts/python.exe`; Python **3.13.12**, NumPy **2.5.4**, SciPy **1.18.1**, scikit-image **0.26.0**. Çalışma dizini bu görev için oluşturulan `C:/Users/Batu/AppData/Local/Temp/mm-cost-audit-7f85xw9r`; kaynak doğrudan main-wt'den import edildi, `-B` ve `sys.dont_write_bytecode=True` kullanıldı. Test kodu `-c` ile çalıştı; repoya test dosyası veya pycache yazılmadı. Sekiz incelenen dosyanın hash'leri test başı/sonu eşit çıktı.

Çekirdek yeniden üretim komutu (diğer küçük düzlem ve eşik testleri yukarıdaki girdilerle çalıştırıldı):

```powershell
& 'C:/Users/Batu/Desktop/mm-pr/.venv-api/Scripts/python.exe' -B -X utf8 -c "import sys; sys.dont_write_bytecode=True; sys.path.insert(0,'C:/Users/Batu/Desktop/mm-pr/main-wt'); import numpy as np; from api.planner import cost,params as P; P.BODY_KG=80.; P.SUIT_KG=30.; P.TOOLS_KG=0.; P.G_RATIO=1.; cost.CALIBRATION=1.; a=cost.metabolic_w(np.ones(3),np.array([0.,10.,-10.]),np.ones(3)); print(a); assert np.allclose(a,[315.9375,700.9375,-69.0625],rtol=0,atol=1e-10)"
```

Bu süreç sonlandığında bellek değişiklikleri kaybolur. **Aritmetik kontrol geçti; fiziksel Mars doğrulaması geçmedi/henüz yok.**

## Mars-özgü parametre kontrol listesi (2026-11-15)

Kullanıcının verdiği sayılar da kaynakla karşılaştırıldı; sayıların birbirinden farklı fiziksel tanımları tek sabit altında birleştirilmedi. Bu bölüm çevresel model uygulanmış olduğu anlamına gelmez.

| Başlık | Mars'a özgü doğrulama ve kod etkisi | Durum / kaynak |
|---|---|---|
| g ve Gale yerel g | Kod 3,71 m/s²; ESA genel değer 3,711, güncel NASA Fact Sheet ortalama 3,73 ve ekvator efektif 3,69 veriyor. Tanımlar farklı; Gale enlem/yükseklik/gravitasyon potansiyeliyle hesaplanmış yerel g **doğrulanmadı**. | Nominal değer var, yerel g yok [S9,S10]; buna dayanarak metabolik γ doğrulanmış sayılamaz |
| Sol, SI süre, yıldız günü | Sol **88775,244 SI s = 24 sa 39 dk 35,244 s**; Mars yıldız günü 88642,663 s; Dünya yıldız günü 86164,0905 s, Dünya ortalama güneş günü 86400 s. Sol, Dünya güneş gününden **%2,749125** uzun; solar–sidereal karışık oran kullanılmaz. | Doğrulandı [S8]; kodun süreleri SI saniye/dakika, saat göstergesi Mars saati değil |
| LMST/LTST/sol sayısı | LMST ortalama yerel güneş saati, LTST gerçek Güneş konumuna bağlı; EOT ve konum gerekir. 24 Mars saatinin her biri bir solun 1/24'üdür; SI saati değildir. | [S8]; mevcut maliyet modüllerinde LMST/LTST dönüşümü yok |
| Yıl, Ls, eksantriklik | Mars24 tropikal yıl 686,9725 Dünya günü / 668,5921 sol; Ls eşit zamanda eşit ilerlemez. 0,0934 J2000 ortalama eleman, Fact Sheet genel tabloda 0,0935; aynı tanım/sürüm sayılmamalı. | [S8,S9]; mevsimsel tüketim/ısı/doz etkisi kodda yok; mevsim süreleri tek tek bu tur çıkarılmadı |
| Eksen eğikliği | 25,19° genel nominal; yerel gün/gece ve mevsim için epoch/geometri gerekir. | [S9]; maliyet modelinde yok |
| Yarıçap / kutup / areoid | **3389,5 km kutup yarıçapı değil, hacimsel ortalama yarıçap**; NASA kutup 3376,2 km, ekvator 3396,2 km. 3396,19 km projeksiyon küresi, fiziksel kutup yarıçapı veya areoid değildir. | [S9]; projeksiyon alanı için `contracts/grid.json`, MOLA referansı için kaynak raster etiketi gerekir; bu altı modül yeniden projeksiyon yapmıyor |
| Basınç ve Gale | Sabit 700–950 Pa bütün Gale/sol/mevsimler için doğrulanmadı; ekip PDS örnekleri sol 53:716–807, 191:863–961, 533:838–895 Pa. | `rems_gercek_veri.md` ve denetim §9; bu tur ham TAB yeniden okunmadı; maliyet içinde basınç yok |
| CO₂ atmosfer / suit içi | Mars dış atmosferi CO₂ baskın; suit solunum gazının p/T/bileşimi farklıdır. O₂ litre→gram hesabına Gale dış basıncı uygulanmamalı. | [S9,S10]; seçilmiş suit içi koşul bu modelde doğrulanmadı |
| Sıcaklık | Tek bir Gale aralığı yerine sol/sensör/kayıt kalitesi gerekli; ekip sol 53 hava −69,8…−4,7°C, zemin −107,5…+10,8°C örnekleri veriyor. | Ekip PDS kaydı, yeniden hesaplanmadı; ısı/soğutma bütçesine bağlı değil |
| Güneş ışınımı | NASA nominal 586,2 W/m²; 590 yuvarlaması ve günberi/günöte 717/493 sayıları aynı kesinlikte ölçüm diye alınmadı; son ikisi bu tur bağımsız doğrulanmadı. | [S9]; kodda güneş yükü, suit soğutma hesabı yok |
| Güneş açısal çapı | Mars24 Güneş yarıçapı 0,16–0,19°; çap yaklaşık 0,32–0,38° türetilir, uzaklığa bağlıdır. | [S11]; metabolik modelde yok |
| Toz optik derinliği/fırtına | Yerel tau, dalga boyu, Ls ve tarih olmadan sabit Gale değeri doğrulanmadı; görüş ve ışınım etkisi mevcut maliyet hesabında yok. | Sayısal Mars katsayısı eklenmedi; bilinmiyor |
| Manyetik/radyasyon ortamı | **Küresel** manyetik alan yok; kabuksal alanlar var. GCR ve SEP ayrı; atmosfer/zemin/suit kalkanı önemlidir, sabit RAD bunları modellemez. | [S7,S12]; kişisel doz modeli doğrulanmadı |
| Ses hızı | Frekans, sıcaklık ve CO₂ koşullarına bağlı Mars değeri gerekir; tek Dünya ses hızı aktarılmadı. | Bu tur sayısal değer doğrulanmadı; bu altı modülde kullanılmıyor |
| Haberleşme gecikmesi | Mars24 FAQ görünür ışık gecikmesi yaklaşık 3–20 dk diyor; bu, istenen 4–24 dk genel aralığıyla aynı uçlar değil. Görev tarihi/ephemeris olmadan sabit gecikme seçilmedi. | [S11]; kaynak bağlamı korundu, canlı komut gecikmesi simülasyonu yok |

NASA Fact Sheet'teki yuvarlak gezegen ortalamaları, örnek REMS solü veya eski ESA tanıtımı **yerel Gale yürüyüş parametresi değildir**. Eksik parametreler Dünya karşılığıyla doldurulmadı.

## Kurum ve bağlam farkları: tek değer seçilmedi (2026-11-15)

| Kurum / kaynak tarihi | Değer / öneri | Bağlam ve karşılaştırma sınırı | Kaynak / erişim |
|---|---|---|---|
| NASA GISS, 2023 güncelleme | Sol 24:39:35,244; yıldız günü 24:37:22,663 | Ayrıntılı zaman tanımları; EVA saatini Mars saatiyle karıştırmaz | [S8], 2026-11-15 |
| NASA JPL, 1995 | Sol 88775,245 s | Eski proje sabitleri; GISS'ten 0,001 s fark, farklı dönem/model/yuvarlama | [S13], s.40, 2026-11-15 |
| ESA Mars Express, 2003 | g=3,711; “sol” 24 sa 37 dk | Sayfa sol adını kullanıyor ama süre Mars yıldız gününe yakın; teknik solar tanımla tutarsızlık kayda alındı | [S10], 2026-11-15 |
| NASA/NSSDC Fact Sheet, erişilen sürüm | Ortalama g=3,73; ekvator efektif=3,69 m/s² | Farklı yerçekimi tanımları; ESA sayısıyla tek fiziksel örneklem gibi karşılaştırılmaz | [S9], 2026-11-15 |
| ISRO MOM broşürü, tarihsiz PDF | Arama dizininde 24 sa 37 dk | PDF açıldı ama araç metin çıkarmadı; tablo tam metinden teyit edilemedi | [S14], **doğrulanmadı**, 2026-11-15 |
| NASA SP-368, 1975 | Apollo ortalama ≈272 W; 7 sa / 1800 kcal referansı | Ay EVA profili / eski yaşam desteği; Mars hız veya sınırı değil | Önceki `gercek_parametre_arastirmasi.md`; bu tur SP-368 yeniden açılmadı |
| NASA Ogilvie vd., 2026 | Başlangıç azami Mars suit kütlesi 230 lbm≈104 kg önerisi; yaklaşık352 W tasarım referansı | Ön çalışma; var olan Mars suit'i veya doğrulanmış insan yürüyüş gücü değil | [S15], s.1 ve tasarım bağlamı; 2026-11-15 |
| NASA xEVA ConOps, 2020 | Mars EVA 2–8 saat | Kavramsal PET aralığı, sağlık limiti değil | Önceki TUR 2, Ek D Tablo D-9; bu tur yeniden açılmadı |
| NASA Agui–Perry, 2017 | 3–6,5 saat | DRA ekine dayanan mühendislik senaryosu; 2–8 saatten farklı bağlam | Önceki TUR 2, Ek s.11; bu tur yeniden açılmadı |
| NASA BVAD Rev1, 2018 | 4 saatlik EVA; gün ortasında sarf yenilemeyle iki yarım günlük sorti seçeneği | Mars suit kütlesini azaltmaya yönelik olası görev tasarımı; 6/7/8 saat seçeneklerinden farklı operasyon varsayımı, zorunlu limit değil | [S16], §4.6.2, basılı s.141/PDF155; 2026-11-15 |
| Mars Society MDRS, Kasım 2018 revizyonu | Yaklaşık 1/3 yolculuk, 2/3 araştırma zaman paylaşımı; en çok iki görev EVA'sı/gün, özel izin istisnası | **Dünya analog istasyonu** prosedürü; basınçlı Mars suit kapasitesi veya genel Mars görev kuralı değildir | [S17], s.37–38; 2026-11-15 |
| NASA EVA Roadmaps, ICES-2025-61 | Görev bilgileri kavramsal ve planlama amaçlı | Arama sonucu 350 W/8 saat gösterse de bu sayılar açılan PDF metninde ayrıca doğrulanamadı; değer seçilmedi | [S18], §II.B ve şekil açıklamaları; 2026-11-15 |
| NASA-STD-3001 Rev C, 2023 | Kariyer etkin doz <600 mSv | EVA başına 60 µGy ile kapsam ve büyüklük farklı | Önceki TUR 5/6 birincil kaynak kontrolü; bu tur yeniden açılmadı |
| Proje, mevcut kod | 6 sa, 2000 kcal, 420 L, 60 µGy; 15°/25° | **Varsayımlar**; NASA standardı/sertifika değil | `params.py:35–58` |
| ESA / JAXA / SpaceX / ISRO | İnsanlı Mars EVA süresi, suit kütlesi, metabolik hız, eğim ve doz için karşılaştırılabilir doğrulanmış değer bulunmadı | Başka kurumun Dünya analoğu, roverı veya tasarımını Mars insan limiti yerine koymadım; bu satır “böyle çalışma yok” iddiası değildir | Hedefli web taraması tamamlanmış kurumlar arası fizyolojik veri kümesi sağlamadı; **doğrulanmadı** |

## Birincil kaynaklar, okunma kapsamı ve erişim (2026-11-15)

| Kod | Tam atıf / URL | Okunan yer, kısa alıntı ve sınır |
|---|---|---|
| S1 | Pandolf, K.B.; Givoni, B.; Goldman, R.F. (1977). Predicting energy expenditure with loads while standing or walking very slowly. J Appl Physiol 43(4):577–581. [DOI](https://doi.org/10.1152/jappl.1977.43.4.577) | Yayıncı full 403; özgün tam metin **okunamadı**; denklem NASA S2'de yeniden basılmış |
| S2 | Kim, K.J. vd. (2024). Improving Metabolic Workload Estimation Accuracy for Planning and Analyzing Exploration Traverses. [NASA NTRS 20240001423](https://ntrs.nasa.gov/api/citations/20240001423/downloads/IEEE%20EMBC%202024.pdf) | Tek sayfalık araştırma özeti, Denklem 2–3 ve Methods okundu; “slope grade (G) as a percentage”; tam hakemli Pandolf deneyi yerine geçmez |
| S3 | Looney, D.P.; Santee, W.R.; Karis, A.J.; Blanchard, L.A.; Rome, M.N.; Carter, A.J.; Potter, A.W. (2018). Metabolic Costs of Military Load Carriage over Complex Terrain. Military Medicine 183(9–10):e357–e362. [DOI](https://doi.org/10.1093/milmed/usx099) | Yayıncı HTML hata; aramada bulunan yayıncı `watermark02.silverchair.com/usx099.pdf?token=…` açık PDF metni okundu; Tablo I dipnotu G<0, tam matematik dizgisi görsel olarak doğrulanamadı; tokenli tam URL kaynak defterinde |
| S4 | Tobler, W. (1993). Three Presentations on Geographical Analysis and Modeling. NCGIA TR-93-1. [Kurumsal açık PDF](https://escholarship.org/content/qt05r820mz/qt05r820mz_noSplash_8f1f13a718ba4a0db0079773ffa4a7af.pdf); Kim vd. (2025), ICES-2025-129, [s.4 Denklemler 1–2](https://ntrs.nasa.gov/api/citations/20250001829/downloads/ICES%202025%20TraverseModel.pdf) | Tobler metni Şekil II, Imhof verisi; formül NASA 2025'te okunabilir, s=tanθ oranı; kaynakta yan metindeki “% grade” tanımıyla s sembolü karıştırılmamalı |
| S5 | Farley, C.T.; McMahon, T.A. (1992). Energetics of walking and running: insights from simulated reduced-gravity experiments. J Appl Physiol 73:2709–2712. [PubMed](https://pubmed.ncbi.nlm.nih.gov/1490989/) | Özet okundu; “only by 33% during walking”; tam Mars suit regresyonu değil |
| S6 | NIST/NBS. Tables of industrial gas container contents and density for oxygen, argon, nitrogen, helium, and hydrogen. [GovInfo kaydı/PDF](https://www.govinfo.gov/content/pkg/GOVPUB-C13-8cea359d95d34564ebfc69a6d75ef385/pdf/GOVPUB-C13-8cea359d95d34564ebfc69a6d75ef385.pdf) | Arama özetinde O₂ mol kütlesi 31,9988 görüldü; tam PDF isteği araç boyut sınırını aştı (10.612.389 bayt), okunamadı. NIST WebBook doğrudan erişimi başarısız; ideal gaz kontrolü araştırmacı hesabı, yoğunluk ölçümü değil |
| S7 | Hassler, D.M. vd. (2014). Mars’ Surface Radiation Environment Measured with the Mars Science Laboratory’s Curiosity Rover. Science 343:1244797. [Açık tam metin](https://www.scienceintheclassroom.org/sites/default/files/research-papers/1244797.full_.pdf) | 1244797-2 GCR; Tablo 1/2, mGy/day; “0.210 ± 0.040 mGy/day”; yerel gün normalizasyonunun saniye tanımı ayrıca doğrulanmadı |
| S8 | Allison, M.; Schmunk, R. NASA GISS (2023-05-15). [Mars24 Technical Notes](https://www.giss.nasa.gov/tools/mars24/help/notes.html) | Solar/sidereal day, seasons, orbit periods, mean/true solar time; “24 hours 39 minutes 35.244 seconds” |
| S9 | NASA/NSSDC. [Mars Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html), erişilen sürüm | Bulk/Orbital/Atmosphere tabloları; “Volumetric mean radius”; nominal değerler yerel Gale ölçümü değil |
| S10 | ESA (2003-04-15). [Facts about Mars](https://www.esa.int/Science_Exploration/Space_Science/Mars_Express/Facts_about_Mars) | “Gravity: 3.711 m/s2”; aynı sayfanın 24:37 “sol” ifadesi teknik sol tanımıyla çelişiyor |
| S11 | NASA GISS (2023-03-01). [Mars24 FAQ](https://www.giss.nasa.gov/tools/mars24/help/faq.html) | §4 ışık gecikmesi, §5 Güneş görünür yarıçapı; görev uçları için evrensel sabit değil |
| S12 | NASA Science. [Mars Facts](https://science.nasa.gov/mars/facts/) | Magnetosphere: “no global magnetic field today”; kabuksal alanlar ayrıca belirtiliyor |
| S13 | Vaughan, R. (1995). Mars Pathfinder Project: Planetary Constants and Models. JPL D-12947. [NTRS](https://ntrs.nasa.gov/api/citations/20000057402/downloads/20000057402.pdf) | Basılı s.40 / PDF 49, 88775,245 SI s/sol; eski model, güncel GISS'ten farklı son basamak |
| S14 | ISRO. [MOM Brochure](https://www.isro.gov.in/media_isro/pdf/Publications/Brochures/publication%2810%29.pdf) | PDF tanındı fakat çıkarılmış gövde metni yok; sayısal tablo yalnız arama özeti düzeyinde, **doğrulanmadı** |
| S15 | Ogilvie, R.; Swartout, B.; Hoffmann, B.; McFarland, S.; Hickox, L. (2026). Mars Spacesuit Mass Requirements. ICES-2026-127. [NTRS](https://ntrs.nasa.gov/api/citations/20260003038/downloads/Final_ICES2026_Mars_Mass_1.pdf) | S.1 ön kütle önerisi ve s.4 tasarım sınırlılığı; “not enough data”; Mars suit fizyolojisi tamamlanmış standart değil |
| S16 | Anderson, M.S.; Ewert, M.K.; Keener, J.F. (2018). Life Support Baseline Values and Assumptions Document. NASA/TP-2015-218570/REV1. [NTRS](https://ntrs.nasa.gov/api/citations/20180001338/downloads/20180001338.pdf?attachment=true) | §4.6.2, basılı s.141/PDF155; “reduce the standard EVA duration to 4 hours”; ilgili bölüm okundu, 233 sayfanın tamamı incelenmedi |
| S17 | Rupert, S.M. (ed.). Mars Desert Research Station 2018–2019 Handbook. Mars Society, Kasım 2018 revizyonu. [Açık kurumsal PDF](https://marssociety.org.au/sites/default/files/library/MDRS%20Handbook%202018-2019.pdf) | EVA Protocols, s.37–38; yolculuk/araştırma paylaşımı ve analog görev kısıtları; gerçek Mars operasyonu standardı olarak reddedildi |
| S18 | Chullen, C.; Meginnis, C.; Sipila, S.; Wells, K.; McFarland, S.; Barrett, L. (2025). NASA Extravehicular Activity Technology Roadmaps for Exploration – 2025 Status. ICES-2025-61. [NTRS](https://ntrs.nasa.gov/api/citations/20250004024/downloads/ICES-2025-61.pdf) | Başlık ve §II.B varsayımlar okundu; şekillerdeki bütün sayılar teyit edilmedi, 350 W/8 saat bu tur doğrulanmadı; PDF üstbilgisindeki 2024 ifadesiyle başlık/sürüm yılı arasındaki fark da çözülmedi |

Diğer taranan/okunamayanlar: Santee TN03-3 için bulunan CiteSeer bağlantısı cache miss; özgün Santee 2001/2003 formülü bu tur okunamadı. Weyand vd. 2021 PMC8560389 ve Weir 1949 PMC1392602 erişimleri captcha/erişim hatası verdi; bunlardan katsayı alınmadı. Başarısız denemeler ve önceki raporların kaynakları kaynak defterinde ayrıca kayıtlıdır.

## İncelenen dosya parmak izleri (2026-11-15)

| Dosya | SHA-256 |
|---|---|
| api/planner/cost.py | `e77e7b76554e5d56e9bfabf720d84b29ba2e2e3514ee82cb4a02cbbd40e32b3c` |
| api/planner/params.py | `8da695bd9e2daef18335423a11812691e5f95e01e051d54c98f1f2882c808913` |
| api/planner/route.py | `a49a1507a8c60bf5b9ced961267c755020a534fb1e3cf1ce4fb6a8758d7f2961` |
| api/planner/terrain.py | `d2bf98bff60c6266c0e0b3d2151b95f2fc1f08327a986bf9006d3ee6160c346b` |
| api/planner/layers.py | `27714668c260bd27cbb9d8794e7422dda8fcabb6351d43981232b800c0772c03` |
| api/planner/comparison.py | `cd0d683650622ab81ab9242230dfa35d6856e89a694d229c6d364e877cb3eed6` |
| docs/metabolic_model.md | `d3fe067e2f8ccd388ce57f1b0025dd731e520f398c8e8ae24b955acc43ad57f9` |
| docs/eva_parameters.md | `d45df2717ebf67f664f666a0e73fd0c2b7bf6a9d9192e52119f6ccc1e15ab5cb` |

## Uygulama öncesi kabul kapıları — öneri (2026-11-15)

1. Saf Dünya referans formülü, signed iniş modeli ve **doğrulanmamış Mars senaryosu** ayrı model kimlikleri taşımalı; yanlış modeli varsayılan seçerek eksik veri kapatılmamalı.
2. Geçerli aralıkta sonlu/pozitif güç; hız, eğim, yük ve gaz referans birimleri; SI saat–sol ve day normalizasyonu test edilmeli.
3. Snap, açıklık, köşe geçişi ve kullanıcı sınırı bütün kenar/uçlarda sağlanmalı; gerçek uçlar ve bağlantı maliyeti raporlanmalı.
4. Gidiş/dönüş/yük alma/bilim/rezerv maliyetleri aynı hesap motorunda, kapsamları açık alanlarla üretilmeli; `GO` bir güvenlik sertifikası olmamalı.
5. Alan dışı Dünya katsayıları operasyonel astronot tahmini diye kullanılmamalı; Mars/suit/kişi/zemin deneyleriyle karşılaştırma olmadan “gerçek hayatta doğrulandı” denmemeli.
