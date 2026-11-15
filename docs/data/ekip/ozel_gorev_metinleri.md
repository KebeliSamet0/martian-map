# Özel görev: kendi rotanı planla — metin önerileri ve dürüstlük incelemesi (2026-11-15)

## Kapsam ve sözleşme

Bu dosya, haritadan A/B seçerek rota planlama akışı için **arayüz metni önerisidir**; UI'ın gerçekten bu akışı sunduğunun veya bir kod davranışının doğrulandığının kanıtı değildir. sim/data/texts.json değiştirilmedi. Metin anahtarları mevcut biçime uyar: ui altında noktalı ui.custom.* adları, her biri tr ve en alanları. Metinler en fazla iki cümledir.

## Önerilen metinler

| texts.json anahtarı | Türkçe | English |
|---|---|---|
| ui.custom.card.title | Kendi rotanı planla | Plan your own route |
| ui.custom.card.subtitle | Haritadan başlangıç ve hedefi seç; planlayıcı varsayımları altındaki rota seçeneklerini karşılaştır. | Choose a start and destination on the map; compare routes under the planner's assumptions. |
| ui.custom.map.pickA | Başlangıç için haritada A noktasını seç. | Select point A on the map as your start. |
| ui.custom.map.pickB | Hedef için haritada B noktasını seç. | Select point B on the map as your destination. |
| ui.custom.map.calculate | Hesapla | Calculate |
| ui.custom.map.layer.blocked | Geçilmez alan (25° planlama varsayımı) | Planner-excluded area (25° planning assumption) |
| ui.custom.map.layer.curiosity | Curiosity durakları | Curiosity stops |
| ui.custom.map.layer.science | Bilim durakları | Science stops |
| ui.custom.map.layer.uncertainty | Model belirsizliği | Model uncertainty |
| ui.custom.slope.warning | Burası {slope}°; proje planındaki 25° eşiği aşılmış. Eşiğin altındaki en yakın harita noktası {m} m uzakta; bu insan yürüyüş sınırı değildir. | This cell is {slope}°; it exceeds the project's 25° planning threshold. The nearest mapped point below that threshold is {m} m away; this is not a human walking limit. |
| ui.custom.distance.label | Kuş uçuşu mesafe | Straight-line distance |
| ui.custom.time.label | Tahmini süre (0,67 m/s APACHE referansı, N=1) | Estimated time (0.67 m/s APACHE reference, N=1) |
| ui.custom.time.note | Süre, kuş uçuşu mesafenin 0,67 m/s'ye bölünmesinden türetilen kaba tahmindir; planlayıcı rotasının mesafesi veya süresi değildir. | This is a rough estimate from straight-line distance divided by 0.67 m/s; it is not the planner route's distance or duration. |
| ui.custom.stop.science.title | Bilim durağı | Science stop |
| ui.custom.stop.curiosity.title | Curiosity durağı | Curiosity stop |
| ui.custom.stop.modelHint | p_sand ve p_bigrock model sınıf skorlarıdır, saha ölçümü değildir. Belirsizlik çıktı dağılımını özetler; hata olasılığı veya saha doğruluğu değildir. | p_sand and p_bigrock are model class scores, not field measurements. Uncertainty summarizes the output distribution; it is not an error probability or field accuracy. |
| ui.custom.budget.o2.title | Kısıtlı O₂ bütçesi (80 L) | Limited O₂ budget (80 L) |
| ui.custom.budget.o2.note | 80 L bu senaryo için tanımlı planlama bütçesidir; doğrulanmış Mars giysisi kapasitesi değildir. Gidiş-dönüş tahmini bu bütçeyi aşabilir. | 80 L is the planning budget set for this scenario, not a verified Mars suit capacity. The round-trip estimate may exceed it. |
| ui.custom.sand.candidate | Planlanan rota, ortofotoda kum adayı işaretli bir alana yaklaşıyor; bu bir görüntü tespitidir, doğrulanmış kum ölçümü değildir. | The planned route approaches an area marked as a sand candidate in the orthophoto; this is an image detection, not a confirmed sand measurement. |
| ui.custom.share.copy | Bağlantıyı kopyala | Copy link |
| ui.custom.share.copied | Bağlantı kopyalandı | Link copied |
| ui.custom.error.api | Planlayıcı API'sine ulaşılamıyor; bu A/B rotası hesaplanamadı. | The planner API is unreachable; this A/B route could not be computed. |
| ui.custom.error.outsideGrid | A veya B, planlayıcı haritasının dışında. Harita içinden bir nokta seç. | A or B is outside the planner map. Select a point inside the map. |
| ui.custom.error.samePoint | A ve B aynı noktayı gösteriyor. Farklı başlangıç ve hedef seç. | A and B point to the same location. Choose different start and destination points. |
| ui.custom.error.noRoute | Bu A/B çifti için rota bulunamadı. Başka noktalar seç veya planlayıcı durumunu kontrol et. | No route was found for this A/B pair. Choose different points or check the planner status. |
| ui.custom.error.tooShort | A ile B arası bu planlayıcı için çok kısa. Birbirinden farklı noktalar seç. | A and B are too close for this planner. Choose points farther apart. |

### Durum koşulları

- ui.custom.sand.candidate yalnızca ortofoto kum-adayı katmanı mevcutsa ve seçilen rota o işaretli alana yaklaşıyorsa gösterilsin. Görüntü etiketi kumun sahada doğrulandığını kanıtlamaz.
- ui.custom.share.copied yalnızca panoya yazma işlemi başarılı olduğunda gösterilsin. Paylaşım URL'sinin oluşturulamaması veya kopyalamanın reddedilmesi için mevcut akışta hata durumu tanımlı değil; bu görevde yeni bir metin uydurulmadı.
- ui.custom.error.tooShort ancak API/ürün gerçekten böyle bir minimum mesafe kuralı uyguluyorsa kullanılsın. Eşik değeri bu araştırma girdilerinde verilmediğinden sayısal minimum eklenmedi.
- “Geçilmez alan” katmanının alt açıklaması 25°'nin ürünün planlama varsayımı olduğunu söylemeli; katman insan için fiziksel yürünebilirlik hükmü değildir.

## YASAK kelime/iddia denetimi

| İfade | Bu akışta kullanma nedeni |
|---|---|
| “Güvenli rota”, “buradan geçmek güvenlidir” | Planlayıcı maliyet/kurallarına göre rota üretir; insanlı Mars yürüyüş güvenliği doğrulanmadı. |
| “Garanti”, “kesinlikle varırsın”, “bu noktadan geçemezsin” | Model ve rota API'si fiziksel sonucu veya gerçek dünyadaki yürünebilirliği garanti etmiyor. |
| “NASA onayladı”, “NASA'nın önerdiği rota” | APACHE hız yayını bir araştırma benchmarkıdır; Martian Map için NASA ürün onayı veya operasyon onayı değildir. |
| “25° insan sınırı”, “NASA 25°'de yürümeyi yasaklıyor” | 25° bu projede planlama eşiğidir; insan EVA eşiği olarak doğrulanmadı. |
| “Gerçek ölçüm”, “ölçülmüş kum/kaya”, “kesin zemin” (yalnız model/ortofoto adayına dayanarak) | p_sand/p_bigrock ve görüntü adayları sınıflandırma/çıkarımdır; saha ölçümü veya uzman doğrulaması değildir. |
| “80 L yarım tüp”, “gerçek Mars giysisi 80 L taşır” | 80 L senaryo bütçesidir; fiziksel tüp oranı veya Mars giysisi kapasitesi dayanağı yoktur. |
| “Kuş uçuşu süre planlanan rota süresidir” | Düz hat mesafesi arazi yolunu, sapmayı, eğimi, durakları ve engelleri içermez. |

## Mars'a özgü parametre kontrolü

| Parametre | Kaynak ve geçerlilik | Arayüzdeki sınır |
|---|---|---|
| 0,67 m/s yürüme referansı | NASA NTRS APACHE ICES 2022 sunumu, slayt/PDF s.23: Mark III giysisi, ARGOS'ta “configured to a Martian gravity offload”, N=1, powered treadmill 1.5 mph, grade −10%…+30%, metabolik oran 45 mL/kg·min'e kadar. 1.5 mph'nin 0,67 m/s gösterimi birim dönüşümüdür. [Tam kaynak ve alıntı](https://ntrs.nasa.gov/api/citations/20220010306/downloads/07-13-2022%20ICES%20Presentation%20-%20APACHE%20Physical%20Workload%20Approximation-JSLWL0520074362.pdf) · [NTRS kayıt metadatası](https://ntrs.nasa.gov/citations/20220010306) | Kaynak tek katılımcı ve kontrollü treadmill koşuludur; Mars yüzeyinde tercih edilen/ortalama hız veya Gale'de doğrulanmış yürüyüş hızı değildir. Sabit 0,67 m/s yalnızca istenen kaba ETA benchmark'ı olarak görünür; arazi eğimi/zemin/fizyoloji hesabı değildir. |
| Mars yerçekimi | APACHE slaytı deneyin Mars yerçekimi boşaltmasıyla kurulduğunu söylüyor, fakat bu slaytta sayısal g değeri yok. Bu ETA metni ayrıca Gale yerel g'sini çarpan olarak kullanmıyor. | Mars'a özgü hız koşulu kaynakta; Gale'e özgü hız-doğrulama ve sayısal yerel g bu hesap için doğrulanmadı. 0,67'yi Mars'ta genel insan yürüme hızı diye sunma. |
| Eğim, arazi ve mesafe | APACHE % grade koşullarını treadmill üzerinde verir; bizim ETA düz çizgi mesafesi / sabit referans hızı aritmetiğidir. | Slope'e göre hız düzeltmesi, yüzey mesafesi, detour, bilim durağı/dinlenme süresi yok. ETA gerçek rota süresi değildir. |
| Süre birimi | m ÷ (m/s) = saniye; dakikaya çevrim 60 SI saniyedir. Bu, süreyi Mars soluna çevirmek değildir. | Gösterim “dk” olarak kalır; sol/LMST/LTST ile karıştırılmaz. |

## Kaynak ve okuma kaydı

- **NASA APACHE birincil kaynak:** Baughman, A. J.; Kim, K. J.; Suri, K.; Abercromby, A. F. J. (2022). *Assessments of Physiology and Cognition in Hybrid-reality Environments (APACHE) – Physical Workload Approximation*. Presentation, 51st International Conference on Environmental Systems, Paper ID 209; 13 July 2022; NASA NTRS 20220010306. Açık dağıtım. Slayt 23 / PDF s.23'te N=1 ve 1.5 mph (−10%…30% grade) koşulu. “N = 1”; “1.5 mph”; “configured to a Martian gravity offload.” Tam PDF erişildi ve ilgili slayt okundu.
- **texts.json:** C:\Users\Batu\Desktop\mm-pr\main-wt\sim\data\texts.json okundu; üst düzey missions, hud, scan, alerts, debrief, ui, helmetcam, insight, compare, bilim, walk, offline. ui literal noktalı anahtarları {tr,en} biçiminde; öneri anahtarları bu biçimi korur.
- **Jüri soruları:** C:\Users\Batu\Desktop\mm-pr\main-wt\docs\data\ekip\juri_sorulari.md okundu. Özellikle Q2 operasyonel güvenlik doğrulamasının yokluğu, Q6 entropinin hata olasılığı olmadığı, Q9 25°'nin insan için doğrulanmış NASA eşiği olmadığı.
- **Sunum denetimi:** C:\Users\Batu\Desktop\mm-pr\main-wt\docs\data\ekip\sunum_denetimi.md okundu. Özellikle 80 L “yarım tüp” abartısı, “NASA onayladı” ve güvenli rota garantisi yasağı, tespit/model/ölçüm ayrımı.
- Bu görevde yapılan web araştırmasında ek Mars parametresi, EVA kapasitesi veya insan eğim sınırı sayısı kullanılmadı.

## Tur 5 eki — özel görev ve kaya/yüzlek etiketleri (2026-11-15)

### İncelenen veri ve dürüstlük sınırı

Salt okunarak incelendi: main-wt kopyasında `sim/data/texts.json`, `sim/data/rocks.json`, `sim/app/hazards.js`, `docs/sim/VERI_KAYNAKLARI.md`. `texts.json` içinde `ui` nesnesinin noktalı anahtarları `custom.*` biçiminde (`ui.custom.*` tam yolları); `scan.rock` ve `scan.outcrop` ise üst seviye `scan` nesnesinde. Hiçbiri değiştirilmedi.

`rocks.json` bu kopyada 829 kayıt içeriyor: `kind=rock` 709, `outcrop` 110, `shadow` 10. Her kayıt yalnızca `px`, `d_m`, `kind` alanlarını taşıyor. Dolayısıyla JSON kendi başına 3 elle incelenen ve 706 incelenmemiş kaydı ayırt etmiyor; ekipçe bildirilen 3/706 ayrımı bu dosyada ilişkilendirilmiş/denetlenebilir bir durum alanı değil. İnceleme kimlikleri başka bir kayıtla eşleştirilene kadar her bir `rock` öğesini “aday/otomatik tespit” olarak göstermek en dürüst varsayılandır. Toplamların kendisi dosyadan sayıldı; 3 manuel inceleme iddiası kullanıcı/ekip bilgisidir, JSON’dan doğrulanmadı.

Veri kökeni için `hazards.js` yorumları “HiRISE ortofotodan gölge yöntemiyle bulundu” der ve `ml/orbital/shadow_rocks.py → export_sim.py → data/rocks.json` hattını adlandırır; `docs/sim/VERI_KAYNAKLARI.md` de kayaları HiRISE’tan gölge yöntemiyle bulunan MODEL olarak sınıflar. Bu, bu kopyadaki dosyanın HiRISE ortofoto kökenini destekler; tek tek nesnelerin kaya olduğu, `d_m` çapının sahada ölçüldüğü veya el ile doğrulandığı anlamına gelmez. Başka ürün/branch verisi yüklenirse “HiRISE” ibaresi ancak onun kaynak metadatası da HiRISE olduğunu gösteriyorsa kullanılmalı.

### `ui.custom.*` metin denetimi

| Mevcut anahtar | Denetim | Önerilen metin (TR / EN) |
|---|---|---|
| `ui.custom.badge`, `ui.custom.card.title`, `ui.custom.card.go`, `ui.custom.title`, `ui.custom.help`, `ui.custom.compute`, `ui.custom.back`, `ui.custom.stop.science`, `ui.custom.stop.rover` | Kaynak/ölçüm iddiası yok; mevcut kısa arayüz metinleri korunabilir. | Değişiklik gerekmiyor. |
| `ui.custom.card.text` | “yürüyerek prova et” simülasyon kapsamını anlatıyor; fiziksel EVA doğrulaması ima etmediği için kalabilir. | TR: Haritadan başlangıç ve hedefi seç; planlayıcının varsayımlarıyla üretilen rota seçeneklerini karşılaştır, sonra simülasyonda yürü. / EN: Choose a start and destination on the map; compare routes generated under the planner's assumptions, then walk the route in the simulation. |
| `ui.custom.err.api` | “API kapalı” yalnız bağlantı gerçekten kapalıysa doğru; genel istek/ağ hatasında yanlış neden söyler. | TR: Planlayıcı API'sine ulaşılamıyor; özel rota hesaplanamadı. / EN: The planner API could not be reached; the custom route was not calculated. |
| `ui.custom.map.aria` | HiRISE ortofoto ifadesi, harita katmanı gerçekten HiRISE ortofotosu olduğunda doğru. Mevcut data pipeline belgeleri bu kaynağı belirtiyor. | Kaynak eşleşiyorsa mevcut ifade kalabilir: “HiRISE ortofoto üzerinde…” / “on the HiRISE orthophoto…”. Farklı/karma kaynak yüklenirse genel “harita üzerinde” / “on the map” kullan. |
| `ui.custom.layer.impassable` | 25° doğru biçimde proje planlama varsayımı diye etiketlenmiş; insan sınırı iddiası yok. Ancak “geçilmez” kesin fiziksel hüküm gibi algılanabilir. | Öneri: `Eşik üstü alan (25° planlama varsayımı)` / `Above-threshold area (25° planning assumption)`. Mevcut planlayıcı katmanı gerçekten hücreleri dışlıyorsa daha açık: `Planlayıcının dışladığı alan…` / `Area excluded by planner…`. |
| `ui.custom.layer.rover`, `ui.custom.layer.science` | Sabit `(128)` / `(4)` sayıları veri sayısı değişince yanlış olabilir; gösterilecekse aktif veri kümesinden sayılmalı. Bu denetimde o katmanların güncel kayıt sayısı yeniden doğrulanmadı. | Öneri: `Curiosity durakları` / `Curiosity stops`; `Bilim durakları` / `Science stops`. Sayaç gerekiyorsa yüklenen listeden dinamik ekle; sabit sayıyı metne gömme. |
| `ui.custom.layer.uncertainty` | Model belirsizliğini ölçülmüş hata/olasılık diye tanımlamıyor; kısa etiket olarak kalabilir. | Değişiklik gerekmiyor. |
| `ui.custom.o2.limited`, `ui.custom.o2.hint` | 80 L'nin senaryo bütçesi olduğu ve doğrulanmış giysi kapasitesi olmadığı açıkça yazılmış. | Değişiklik gerekmiyor. Başlığı arayüzde kısaltmak gerekirse: `Senaryo O₂ bütçesi: 80 L` / `Scenario O₂ budget: 80 L`. |
| `ui.custom.eta`, `ui.custom.eta.note` | Not, 0,67 m/s APACHE tek denek referansından hesaplandığını ve planlayıcı süresi olmadığını açıklıyor. Başlıkta “tahmini” korunmalı; dakika SI/Dünya dakikasıdır, sol zamanı değildir. | Başlık önerisi: `Kuş uçuşu {m} m · kaba süre tahmini ≈ {min} dk` / `Straight-line distance {m} m · rough time estimate ≈ {min} min`. Notun mevcut dürüst açıklaması korunabilir. |
| `ui.custom.warn.steep`, `ui.custom.warn.steep.none` | 25° proje planlama eşiği olarak ayrılmış, insan sınırı olmadığı belirtilmiş. “Burası {slope}°” ancak değerin kaynağı ve aynı konum/hücre olduğu doğruysa kullanılmalı. | TR: Bu harita hücresinde hesaplanan eğim {slope}°. Projenin 25° planlama eşiği aşılmış; bu insan yürüyüş sınırı değildir. / EN: The estimated slope in this map cell is {slope}°. It exceeds the project's 25° planning threshold; this is not a human walking limit. “Yakın nokta” alanı yalnız gerçekten arandıysa eklenmeli. |
| `ui.custom.warn.short` | 15 m bir ürün/API minimumuysa arayüz kuralı olarak doğru olabilir; evrensel ya da kaynaklı fiziksel sınır değildir. Bu denetimde uygulama koşulu bağımsız doğrulanmadı. | API 15 m eşiğini gerçekten uyguluyorsa: `A ve B en az 15 m uzakta olmalı (planlayıcı giriş kuralı).` / `A and B must be at least 15 m apart (planner input rule).` Aksi halde sayıyı kaldırıp “A ve B farklı noktalar olmalı.” / “Choose distinct points for A and B.” kullan. |
| `ui.custom.share`, `ui.custom.share.done` | Düğme ve başarı bildirimi; başarı metni yalnız panoya yazma işlemi başarılı olduğunda gösterilmeli. | Mevcut TR/EN korunabilir; `Bağlantı kopyalandı` yalnız başarı durumunda. |
| `ui.custom.sand.candidate` | Mevcut metin “görüntü tespiti” ile “doğrulanmış kum ölçümü değil” ayrımını doğru kuruyor; HiRISE etiketi şu an yok, gereksiz yere ekleme. | Mevcut TR/EN korunabilir. |
| `ui.custom.err.noroute` | “Rota bulunamadı” hesap sonucu için uygun; yeniden deneme önerisi de koşullu kalabilir. | Mevcut TR/EN korunabilir. |

### `scan.rock` ve `scan.outcrop`

Mevcut metinler `kaya (HiRISE, d = {d} m)` / `rock (HiRISE, d = {d} m)` ve `yüzlek (HiRISE, d = {d} m)` / `outcrop (HiRISE, d = {d} m)`. “HiRISE” kaynak kökenini anlatmak için, yalnız bu gölge tespit hattından gelen veri üzerinde kalabilir. `d_m` alanı kaynakta tahmini nesne çapıdır; ölçülmüş saha çapı gibi yazılmamalı. `kind` sınıfı model/iş akışı etiketidir; kaya/yüzlek teşhisinin her kayıt için doğrulandığını kanıtlamaz.

| Anahtar/durum | Önerilen TR | Suggested EN |
|---|---|---|
| `scan.rock` — doğrulama durumu kayıtta yoksa (709 kaydın tamamı için güvenli varsayılan) | Kaya adayı (HiRISE ortofotosunda otomatik gölge tespiti; doğrulanmadı, tahmini çap {d} m) | Candidate rock (automated shadow detection in HiRISE orthophoto; unverified, estimated diameter {d} m) |
| `scan.rock` — yalnız inceleme kaydıyla eşleşen 3 öğe için | Kaya adayı (HiRISE görüntüsünde elle gözden geçirildi; tahmini çap {d} m) | Candidate rock (manually reviewed in HiRISE imagery; estimated diameter {d} m) |
| `scan.outcrop` | Yüzlek adayı (HiRISE ortofotosunda gölge/şekil tespiti; doğrulanmadı, tahmini genişlik {d} m) | Candidate outcrop (shadow/shape detection in HiRISE orthophoto; unverified, estimated width {d} m) |

**Uygulanabilir sınırlama:** 3/706 ayrımına ait kayıt anahtarı veya doğrulama bayrağı `rocks.json` içinde yok. Bu yüzden mevcut `scan.rock` tek şablonuna “3'ü elle doğrulandı” demek doğru olmaz. Ekip, üç öğenin `px`/`d_m` kayıtlarını ayrı bir inceleme kaydıyla eşleştirmedikçe varsayılan aday metnini bütün `rock` öğelerinde kullanın; eşleştirme varsa yalnız o kimliklerde “görüntüde elle gözden geçirildi” varyantını gösterin. Toplam göstergesi gerekiyorsa, sayıların kaynağını UI'da açıklayın: `709 kaya adayı: 3 görüntü üzerinden gözden geçirildi; 706 henüz gözden geçirilmedi.` / `709 rock candidates: 3 reviewed in imagery; 706 not yet reviewed.` Bu 3 kayıt bile **saha ölçümü/yerinde doğrulama değildir**. Sayılar bu JSON kopyasının sayımı ve ekipçe verilen 3 inceleme notuna dayanır; kayıtlar arası bağ bu kopyada doğrulanmadı.

### Yasak / kaçınılacak sunum

- İnceleme bayrağı yokken tekil bir nesneye kesin “doğrulandı” deme; toplam içindeki 3 kaydın hangileri olduğu eşleştirilmiş olmalı.
- `{d} m` değerini “ölçülen çap” veya “saha ölçümü” diye sunma. Aday nesnenin gölgesinden/ortofoto iş akışından türetilmiş tahmin olarak etiketle.
- Kaynağı belirsiz başka görsel/katmanda “HiRISE” yazma. Bu kopyada köken kanıtı, HiRISE ortofoto kullanan gölge tespit hattının dosya açıklamasıdır.
- “Gerçek kaya”, “kesin yüzlek”, “sahada doğrulandı” ifadelerini yalnız otomatik `kind` veya gölge tespitinden çıkarma.
- 25°'yi insan sınırı; 80 L'yi gerçek suit kapasitesi; model belirsizliğini hata olasılığı olarak anlatma.

### Kaynak / okuma kaydı

| Tarih | Kaynak | Bu ekteki rolü | Durum / kısa dayanak |
|---|---|---|---|
| 2026-11-15 | Yerel kaynak: `C:\Users\Batu\Desktop\mm-pr\main-wt\sim\data\texts.json`, `ui.custom.*`, `scan.rock`, `scan.outcrop` | Var olan TR/EN metinlerin ve tam anahtar yollarının denetimi | İlgili JSON bölümleri okundu; `ui` altında `custom.*`, üst düzey `scan` içinde `rock/outcrop`; mevcut ifadeler yukarıda alıntılanıp değerlendirildi. |
| 2026-11-15 | Yerel kaynak: `C:\Users\Batu\Desktop\mm-pr\main-wt\sim\data\rocks.json` | Kayıt sayısı, sınıflar ve alanlar | JSON tam olarak sayıldı: 829 toplam, 709 rock, 110 outcrop, 10 shadow. Kayıt alanları yalnız `px`, `d_m`, `kind`; elle inceleme bayrağı yok. |
| 2026-11-15 | Yerel kaynak: `C:\Users\Batu\Desktop\mm-pr\main-wt\sim\app\hazards.js`, başlık yorumları ve sınıf notları | HiRISE ortofoto / gölge yöntemi veri kökeni ve `kind` sınırı | Dosya yorumu: “HiRISE ortofotodan gölge yöntemiyle bulundu”; üretim hattı `ml/orbital/shadow_rocks.py → export_sim.py → data/rocks.json`; otomatik tespit olduğunu açıkça ayırıyor. |
| 2026-11-15 | Yerel kaynak: `C:\Users\Batu\Desktop\mm-pr\main-wt\docs\sim\VERI_KAYNAKLARI.md`, kaya/sand adayları satırı | UI'da “MODEL” / tespit dili kullanımı | Kaynak tablosu kayaları ve kum adaylarını HiRISE gölge yöntemiyle bulunan “MODEL” olarak tanımlıyor. |
| 2026-11-15 | Ekip bilgisi: 709 `kind=rock` öğesinden 3'ünün elle doğrulandığı, 706'sının doğrulanmadığı notu | Öğe bazında etiketi dürüst kurmak | Kullanıcı/ekip girdisi; `rocks.json` içinden bağımsız doğrulanamadı, üç öğeye bağlanan kayıt anahtarı yok. |
