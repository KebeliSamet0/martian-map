# Sunum iddia denetimi — 2026-11-15

**Öncelikli düzeltmeler:** “her sayı NASA'dan”, “enerji alt sınırdır”, “güven uyarısına güvenebiliriz”, eski **2,26–2,30 km**, **144 noktada 0,0 m**, **829 gerçek kaya**, **80 L = yarım tüp**, “yeniden planlama kum hatasını kapatır” ifadelerini kullanmayın. Aşağıdaki TR/EN cümleleri öneridir; kaynak dosyalar değiştirilmedi.

**Sonuç:** 110 benzersiz iddia; 45 DESTEKLENİYOR, 49 ABARTILI, 10 KAYNAKSIZ, 6 YASAK. Bu sayı, tekrarlanan ifadeler birleştirildikten sonraki denetim satırı sayısıdır; bağımsız deney sayısı değildir.

## Kapsam ve karar yöntemi (2026-11-15)

- Salt okunan kök: `C:/Users/Batu/Desktop/mm-pr/main-wt`. Ana sunumlar: `docs/sunum_taslak.md`, `README.md`, `docs/submission/{SLIDES,PROJECT,MODEL_CARD,DEMO_SCRIPT,VIDEO_30S,REFERENCES}.md`.
- `docs/` altında `.pptx`, `.txt`, `.html` dosyası bulunmadı; dolayısıyla çıkarılacak PPTX metni yoktu. Sunum/video dosyaları metin taslaklarıdır; nihai render ve canlı oturum incelenmedi.
- İddiaların tekrarları tek satırda toplandı; T=taslak, S=SLIDES, P=PROJECT, M=MODEL_CARD, D=DEMO_SCRIPT, V=VIDEO_30S, R=README. Kaynak araştırmalarındaki tüm sayıları sunum iddiası saymadım; sunuma taşınanları ve belirgin yasak örnekleri denetledim.
- **DESTEKLENİYOR:** belirtilen kapsamda dosya veya kaynakla destekli; bağımsız fiziksel doğrulama anlamına gelmez. **ABARTILI:** dayanak var ama kapsam/yorum aşılıyor veya eski sonuç güncel gibi sunuluyor. **KAYNAKSIZ:** okunabilir yeterli kanıt bulunamadı. **YASAK:** tıbbi/operasyonel garanti veya açıkça yanlış kaynak atfı olarak sunulmamalı.
- Her olumsuz karar için TR ve EN önerilerinin **her biri en fazla 20 kelimedir**. Destekli satırlardaki sınır açıklamaları da sunumda korunmalı.
- Erişim: **2026-11-15**. Model eğitimi, rota üretimi ve tarayıcı testleri yeniden çalıştırılmadı; ekip sonuçları ve mevcut veri dosyaları karşılaştırıldı. JSON kayıt sayıları salt okunur olarak sayıldı.

## Ürün tanımı, veri ve bilim bağlamı (2026-11-15)

| ID / yer | Denetlenen iddia | Karar ve dayanak | Önerilen düzeltme TR / EN |
|---|---|---|---|
| A01 R, T özet | Astronota “güvenli rota” çiziyoruz. | **ABARTILI** — [Q] soru 2; güvenlik doğrulaması yok, göreli maliyet optimizasyonu var. | TR: Tanımlı varsayımlar altında rota seçeneklerini karşılaştıran bir EVA prova prototipiyiz.<br>EN: We are an EVA rehearsal prototype comparing route options under explicit assumptions. |
| A02 T2, T7 | Her sayı NASA verisinden veya kaynaklı modelden gelir; her sayının kaynak bağlantısı var. | **ABARTILI** — [E], [K] §3; bütçeler, eşikler ve bazı dönüşümler varsayım; tam arayüz bağlantı denetimi yok. | TR: Ölçüm, model çıktısı ve planlama varsayımlarını ayırıyoruz; kaynak kapsamındaki eksikleri açıklıyoruz.<br>EN: We separate measurements, model outputs, and planning assumptions, and disclose gaps in source coverage. |
| A03 P özet | Sayılar veri, atıflı model veya etiketli varsayımdan gelir. | **ABARTILI** — doğru hedef; “uygulama hepsini etiketler” bütünlük kanıtı yok, [AK] etiket sorunları içeriyor. | TR: Sayıları üç kategoriyle açıklıyoruz; arayüzdeki bazı etiketlerin tamamlanması gerekiyor.<br>EN: We explain three categories of numbers; some interface labels still need completion. |
| A04 T2, P | “Astronaut mission rehearsal simulator”, uçuş onay aracı değil. | **DESTEKLENİYOR** — [Q], [E]; araştırma/prova tanımı, operasyonel yeterlilik iddiası içermediğinde uygun. | — |
| A05 T1, S1, P fark | Bugünün/çoğu rota araçları yalnız çizgi gösterir, neden ve güven göstermez. | **KAYNAKSIZ** — karşılaştırmalı ürün taraması ve kapsam tanımı sunulmamış. | TR: Katmanları, rota gerekçelerini ve 3B provayı aynı akışta birleştiriyoruz.<br>EN: We combine terrain layers, route explanations, and 3D rehearsal in one workflow. |
| A06 T1, D | Mars'ta gerçek arazide önceden prova edilemez. | **ABARTILI** — uzaktan veriyle sanal prova zaten mümkün; fiziksel ziyaretle sanal temsil ayrılmalı. | TR: Mars'a gitmeden, yörünge ve rover verileriyle hazırlanmış arazide sanal prova sunuyoruz.<br>EN: Before visiting Mars, users can rehearse virtually on terrain reconstructed from orbital and rover data. |
| A07 T1 slogan | “Every step … spends oxygen you cannot get back.” | **ABARTILI** — tüketim yalnız adımlarla sınırlı değil; geri kazanılamazlık sistem tasarımına bağlı. | TR: EVA boyunca yaşam desteği kaynakları tüketilir; rota seçimi planlanan bütçeyi etkiler.<br>EN: Life support resources are consumed during EVA; route choices affect the planned budget. |
| A08 T7, S7 slogan | “Rehearse on data today, walk on Mars tomorrow.” | **ABARTILI** — gelecek operasyonuna hazır olma çağrışımı; [Q] soru 2. | TR: Gerçek arazi verileriyle bugün prova edin; modelin sınırlarını görün.<br>EN: Rehearse with real terrain data today, while seeing the model's limits. |
| A09 T5 ad listesi, P | Martian Map çalışma adı; GaleGuide/Gale Rehearsal/RegolithRoute aday. | **DESTEKLENİYOR** — R ve P açıkça çalışma adı diyor; nihai oylama sonucu bu belgelerde yok. | — |
| A10 T5 | Aday adların benzersizliği web/GitHub'da kontrol edildi; elenen adlar mevcut ürünlerle çakışır. | **KAYNAKSIZ** — issue #50 araştırma kanıtı/URL'leri bu dosyalarda yok; marka uygunluğu doğrulanmadı. | TR: Martian Map çalışma adıdır; nihai ad ve kullanım uygunluğu henüz kesinleşmedi.<br>EN: Martian Map is a working name; the final name and its availability remain unconfirmed. |
| A11 R, P ekip | Space Apps 2026, Konya, Selçuk Üniversitesi; resmî teslim saatleri/format kuralları. | **KAYNAKSIZ** — ekip kaydı mevcut; organizatör sayfası, ekip kaydı ve form kuralları bağımsız doğrulanmadı. | TR: Etkinlik, ekip ve teslim bilgileri organizatör kaydıyla ayrıca doğrulanmalıdır.<br>EN: Event, team, and submission details require confirmation against the organizer's record. |
| A12 T3, S3, P | Gerçek Mars yörünge ve Curiosity verileri kullanılıyor. | **DESTEKLENİYOR** — [G], [L], [K]; “bütün görüntü gerçek ölçümdür” sonucu çıkarılmaz. | — |
| A13 T3, S3 | USGS birleşik DEM 1 m, ortofoto 25 cm, planlama 2 m ızgara. | **DESTEKLENİYOR** — [G] §§1–4, `contracts/grid.json` 1000×1000, `res_m=2`; 3B'nin T3/LRGB kaynakları ayrıca [K]. | — |
| A14 T1/3, S | Alan 2×2 km ve Gale/Mount Sharp boxwork bağlamında. | **DESTEKLENİYOR** — [G] sınırlar; “bütün geniş 3B sahne 2×2 km” denmemeli, bu planlayıcı kutusu. | — |
| A15 T3, P | Curiosity'nin 2025–2026'da çalıştığı bölge. | **DESTEKLENİYOR** — [L] soller ve [C] bilim bağlamı, [N1] Atacama 2026 haberi; yörünge görüntülerinin tarihi aynı değil. | — |
| A16 T3 | Bilim durakları roverın gerçekten durduğu kesin bilim hedefleridir; hedef tam Atacama sondajıdır. | **ABARTILI** — [C] §6: sci_4 sol aralığıyla eşlenmiş, blog noktasının tam konumu ayrıca doğrulanmamış. | TR: Hedef, Atacama kampanyasıyla sol aralığı üzerinden ilişkilendirilmiş bir rover durağıdır; kesin sondaj noktası doğrulanmadı.<br>EN: The target is a rover stop associated with Atacama by sol range; the exact drill location is unverified. |
| A17 T3, S3 “ground truth” | Waypoint, Navcam ve AI4Mars yer gerçeğidir. | **ABARTILI** — waypoint konumu, görüntü ve uzman/gönüllü etiketi farklı kanıtlar; haritanın tüm hücreleri etiketlenmemiş. | TR: Rover konumlarını, görüntülerini ve etiketli test verilerini kullanıyoruz; tüm harita için yer gerçeği yok.<br>EN: We use rover positions, images, and labelled test data; ground truth does not cover the entire map. |
| A18 S3, P | CRISM bilim durakları için bağlam sağlar. | **DESTEKLENİYOR** — [C] §6–7; yayınlanmış birim haritalarıyla bağlam, doğrudan yerel mineral ölçümü değil. | — |
| A19 R akış / olası anlatım | CRISM piksel katmanı rota maliyetini/bilim hedefini doğrudan belirliyor; boxwork kapsamı kesin. | **ABARTILI** — [C] §3 ve §6 bunu desteklemiyor; kutunun tam kapsamı belirsiz, maliyet katmanı yapılmamış. | TR: CRISM ve yayınlanmış jeoloji haritaları bilimsel bağlam sağlar; yerel maliyet katmanı olarak kullanılmıyor.<br>EN: CRISM and published geology maps provide scientific context, rather than a local route-cost layer. |
| A20 P | Tüm sentetik görseller etiketli ve saf veri moduyla kapatılabilir. | **ABARTILI** — [K] ve [R3] bu tasarımı bildiriyor; tüm görsel varlıkların kapsam testi yok. | TR: Prosedürel zemin ayrıntıları sentetiktir; saf veri modu bu ayrıntıları kapatmayı amaçlar.<br>EN: Procedural ground details are synthetic; pure-data mode is intended to disable these details. |
| A21 T7, S7 | Prova planları daha güvenli yapar. | **ABARTILI** — kullanıcı/operasyon çalışması veya kaza riski ölçümü yok. | TR: Araç, rota varsayımlarını incelemeyi ve seçenekleri karşılaştırmayı amaçlar; güvenlik etkisi henüz ölçülmedi.<br>EN: The tool supports examining assumptions and comparing routes; its safety impact has not been measured. |

## Model, örnek sayıları ve güven (2026-11-15)

| ID / yer | Denetlenen iddia | Karar ve dayanak | Önerilen düzeltme TR / EN |
|---|---|---|---|
| B01 T4/yedek, S3, M, P | 128 durak, 391 Navcam karesi; sol 4580–4848. | **DESTEKLENİYOR** — [L] yöntem; bu tur `layers/rover_stops.json` **128** kayıt sayıldı; görüntülerin tamamı yeniden indirilmedi. | — |
| B02 M | 14 453 train, 1611 val, 322 uzman test görüntüsü. | **DESTEKLENİYOR** — [MT] veri hazırlığı; min1/min2/min3 aynı 322 görüntüde farklı piksel maskeleri. | — |
| B03 M | DeepLabv3+/ResNet34, dört sınıf, 20 MC Dropout geçişi; maske U-Net, >30 m dışlama. | **DESTEKLENİYOR** — [MT], [L] yöntem; modelin doğrudan HiRISE üzerinde çalıştığı söylenmemeli. | — |
| B04 M, T7 | 12 epoch, yaklaşık 2 saat laptop GPU eğitimi. | **DESTEKLENİYOR** — [MT] Kapı 2, RTX 4070 Laptop kaydı; “model henüz yalnız bir epoch” eski bilgidir. | — |
| B05 T6, S6, M | mIoU 0,798; büyük kaya recall 0,973; ECE 0,004. | **DESTEKLENİYOR** — [MT] test_min3; üç uzmanın uzlaştığı pikseller, yuvarlatılmış değerler; tüm saha başarısı değil. | — |
| B06 M, P | Val mIoU 0,832; büyük kaya IoU 0,294; test_min1 mIoU 0,669. | **DESTEKLENİYOR** — [MT] ayrı kümeler; recall ile IoU karıştırılmamalı. | — |
| B07 T6 notu | Etiketlerin hepsini NASA rover ekibi yaptı. | **ABARTILI** — [MT] gönüllü train/val ile uzman test ayrımı var. | TR: Eğitimde gönüllü etiketleri, raporlanan uzman testinde uzlaşılan pikseller kullanıldı.<br>EN: Training used volunteer labels; the reported expert test uses pixels with expert agreement. |
| B08 T6 notu, D “calibrated” | ECE 0,004 sayesinde “emin değil” uyarısına güvenebiliriz. | **ABARTILI** — [MT] son bölüm ve [SC]: piksel kalibrasyonu durak hatasını ayırmıyor. | TR: Testte piksel kalibrasyon hatası düşüktü; durak düzeyindeki güven, yanlış tahminleri ayıramadı.<br>EN: Pixel calibration error was low on the test; stop-level confidence did not distinguish incorrect predictions. |
| B09 P, M | 18 durakta tutan/tutmayan ortalama entropy 0,21/0,18. | **DESTEKLENİYOR** — [MT] güven denetimi, [SC]; küçük elle kontrol, istatistiksel genelleme değil. | — |
| B10 T6, S6, D | Tarayıcı 6 durakta 3 doğru, 1 kısmi, 2 kaçırma; ikisi kumlu. | **DESTEKLENİYOR** — [SC] baştaki tarayıcı tablosu; ayrı tek-kare model tablosuyla karıştırılmamalı. | — |
| B11 T6 yedek, M, P | 18 durağın 16'sında baskın sınıf doğru; kum 7'nin 2'sinde yakalandı. | **DESTEKLENİYOR** — [L] elle kontrol özeti; 16/18 kısmi baskın-sınıf eşleşmelerini de içerir, bağımsız uzman testi değil. | — |
| B12 T yedek, P | Haritanın %64,6'sı “bilinmiyor”; yaklaşık %65 yakın Navcam kanıtı yok. | **ABARTILI** — [L] entropy≥0,6 hücre oranı destekli; bu oran doğrudan “hiç görüntü yok” alan ölçümü değil. | TR: Yayılım yöntemimizde hücrelerin yüzde 64,6'sı belirsizlik eşiğini aşıyor; bu doğrudan görüntü kapsamı değildir.<br>EN: Under our propagation method, 64.6 percent of cells exceed the uncertainty threshold; this is not direct image coverage. |
| B13 D, P | Kanıt olmayan yerde tahmin etmiyor, yalnız “emin değil” diyor. | **ABARTILI** — [L] olasılıklar uzaklıkla eşit dağılıma çekiliyor; matematiksel değer üretiliyor, arayüz uyarıyor. | TR: Uzak hücrelerde olasılıklar bilgi taşımayan dağılıma yaklaşır; arayüz belirsizlik uyarısı gösterir.<br>EN: Probabilities approach an uninformative distribution in distant cells; the interface displays an uncertainty warning. |
| B14 T yedek | 200 m'ye kadar tam güven, 800 m'de eşit dağılım. | **ABARTILI** — [L], `pipeline/spread_terrain.py`; mesafeler yazılım varsayımı, ölçülmüş güven menzili değil. | TR: 200 ve 800 metre yayılım mesafeleri modelleme tercihleridir; doğrulanmış görüş veya güven menzili değildir.<br>EN: The 200 and 800 metre propagation distances are modelling choices, not validated viewing or confidence ranges. |
| B15 T/S tarayıcı | Tarayıcı güvenli/dikkat/geçilmez/emin değil sınıflarını gerçekten gösterir. | **ABARTILI** — [AK] lejant yalnız dikkat/geçilmez gösteriyor; “güvenli” fiziksel doğrulama değil. | TR: Tarayıcı, önceden hesaplanmış katmanlardan kural tabanlı uyarılar üretir; fiziksel güvenliği ölçmez.<br>EN: The scanner produces rule-based warnings from precomputed layers; it does not measure physical safety. |
| B16 T, M | Eğitim 2012–2019; 2025 boxwork uzman etiketi yok; alan kayması var. | **DESTEKLENİYOR** — [MT] sınırlar, [L]; alan kaymasının hata nedeni olduğu hipotezi kesin nedensel kanıt değildir. | — |
| B17 P | 16 kum bölgesi gerçek kum ölçümüdür. | **ABARTILI** — `layers/sand_hint.json` **16** nokta; [SA] bunları ortofotodan aday olarak tanımlar. | TR: Ortofotodan seçilmiş 16 kum adayı var; yerel kum varlığı tüm noktalarda doğrulanmadı.<br>EN: There are 16 sand candidates selected from orthophotos; local sand presence is not verified at every point. |
| B18 P, D, S | Kanıtlı 13 kum noktasında p_sand≤0,11. | **ABARTILI** — [O] §7 en büyük **0,111**; ≤0,11 katı eşitsizlik yuvarlama nedeniyle yanlış, noktalar da aday. | TR: Navcam kanıtına yakın 13 kum adayında en yüksek model kum skoru 0,111 oldu.<br>EN: At 13 sand candidates near Navcam evidence, the maximum model sand score was 0.111. |
| B19 P | Diğer üç kum noktası yaklaşık 900 m uzakta, değerler varsayılan; tespit değil. | **DESTEKLENİYOR** — [O] §7: 904/930/942 m; [SA]. | — |
| B20 P, D | Kum olayları ve replan modelin kaçırma açığını kapatır. | **ABARTILI** — [Q] soru 19; olay senaryo girdisi, otomatik hata düzeltme/sensör doğrulaması yok. | TR: Kum senaryosu yeniden planlama akışını gösterir; modelin kaçırdığı gerçek tehlikeleri otomatik gidermeyi kanıtlamaz.<br>EN: The sand scenario demonstrates replanning; it does not prove automatic correction of missed real hazards. |

## Kaya tespiti ve zemin riski (2026-11-15)

| ID / yer | Denetlenen iddia | Karar ve dayanak | Önerilen düzeltme TR / EN |
|---|---|---|---|
| C01 T4, P | Kaya tespiti gölge tabanlı klasik görüntü işleme; ML eğitimi değil. | **DESTEKLENİYOR** — [O] giriş, [P] AI disclosure. | — |
| C02 T yedek | 30/30 doğru tespit, görünür kayaların yaklaşık %86'sı bulundu. | **DESTEKLENİYOR** — [O] §§1–2, yalnız ilk sırtsız kesit, elle sayım: 131/153; çift sayım/şüpheliler var. | — |
| C03 T yedek/olası kısa anlatım | Kaya dedektörü %100 doğru veya %86 genel doğrulukta. | **ABARTILI** — [O] §3b ikinci örneklem 23/30; ilk kesitin precision/recall'ı tüm alan metriği değil. | TR: İlk kesit güçlüydü; rota ve yamaç örnekleminde 30 adayın yalnız 23'ü kaya olarak değerlendirildi.<br>EN: The first patch performed well; only 23 of 30 route and slope candidates were judged rocks. |
| C04 P | Koridorda 829 tespit/kaya adayı. | **DESTEKLENİYOR** — `sim/data/rocks.json` bu tur **829** kayıt sayıldı; [O] §6. | — |
| C05 Olası görsel başlık | 829 gerçek kaya tespit ettik. | **ABARTILI** — etiketler: rock=709, outcrop=110, shadow=10; küçük 706 varsayılan rock. | TR: 829 adayın 123 büyüğü incelendi; 120'si yüzlek veya gölge, üçü bağımsız kaya gibi göründü.<br>EN: We reviewed 123 large candidates among 829 detections; 120 were outcrops or shadows, three resembled separate rocks. |
| C06 P, S6 | >2,6 m olan 123 aday: 110 yüzlek, 10 gölge, 3 kaya; 706 küçük tek tek incelenmedi. | **DESTEKLENİYOR** — [O] §6 ve mevcut JSON etiket sayımları; bir kişinin 1 m/piksel görüntü yorumu. | — |
| C07 P | Yüzlek/gölgeleri etiketliyoruz ve kaya saymıyoruz. | **ABARTILI** — nesne etiketi destekli; [O] §6 `rock_cfa` yeniden üretilmedi, maliyet katmanında etkisi sürüyor. | TR: Büyük adayları etiketledik; kaya kaplama katmanı henüz bu etiketlerle yeniden üretilmedi.<br>EN: We labelled large candidates; the rock-cover layer has not yet been regenerated using those labels. |
| C08 P | Daire alanının %78'i yüzlek/gölge; kaya kaplama oranı gölgelerden etkileniyor. | **DESTEKLENİYOR** — [O] §6; gerçek yüzey kaplama ölçümü değil, aday dairelerinin alan toplamı. | — |
| C09 P, T yedek | Yalnız ≥1 m kaya sayıldığı için rock_cfa kesin alt sınır. | **ABARTILI** — küçük kayalar kaçsa da yüzlek/gölge yanlış alarmları yukarı yanlılık yaratıyor; iki etki var. | TR: Küçük kayalar kaçabilir; yüzlek ve gölge yanlış alarmları da kaplama tahminini artırabilir.<br>EN: Small rocks may be missed; outcrop and shadow false alarms can also inflate estimated cover. |
| C10 P, O §3b | Hatalar güvenli yönde; yalnız gereksiz kaçınır, tehlikeli yeri güvenli göstermez. | **YASAK** — kaçırılan kaya/kum örnekleri mevcut, birleşik planlayıcının güvenlik garantisi yok. | TR: Yanlış alarmlar ve kaçırmalar birlikte var; toplam güvenlik etkisi doğrulanmadı.<br>EN: False alarms and misses coexist; their overall safety impact has not been validated. |
| C11 Kum bağlamı | Arvidson 2017: yaklaşık %30 tekerlek çapı batma, %77'ye kadar kayma. | **DESTEKLENİYOR** — [KU] birincil özet dayanağı; rover megaripple sonuçları, insan veya her kum alanı için değil. | — |
| C12 Kum bağlamı | 10° kumda orta kayma, 17° gömülme, ana kayada 22° geçiş. | **DESTEKLENİYOR** — [G3], [KU], Heverly 2013 özeti; rover/test koşulları korunmalı. | — |
| C13 Olası anlatım | Bu değerler insan/skafandr eğim veya kayma eşikleridir. | **YASAK** — [Q] soru 15, [G3]; rover sonuçları insana aktarılamaz. | TR: Bu bulgular rover testleridir; insan yürüyüş sınırlarını belirlemez.<br>EN: These are rover findings; they do not establish human walking limits. |

## Enerji, oksijen, radyasyon ve limitler (2026-11-15)

| ID / yer | Denetlenen iddia | Karar ve dayanak | Önerilen düzeltme TR / EN |
|---|---|---|---|
| D01 T1, S1 | Mars yerçekimi Dünya'nın 3/8'i. | **DESTEKLENİYOR** — [K], [E]; yaklaşık ifade, 3/8 tam fiziksel oran değil. | — |
| D02 T1 | NASA, Mars'ta skafandrlı yürümenin Ay'dan çok zor olduğunu kanıtladı. | **ABARTILI** — [E2] tasarım/metabolik değerlendirme; doğrudan insanlı Mars deneyi yok. | TR: NASA tasarım çalışmaları Mars yürüyüşü için kütle ve metabolik kapasite kısıtlarını değerlendiriyor.<br>EN: NASA design studies assess mass and metabolic capacity constraints for Mars walking. |
| D03 T4, S4, D | Pandolf yük taşıma denklemi, Apollo ortalaması 272 W'a kalibre. | **DESTEKLENİYOR** — [ME], [E]; yayınlı Dünya formülünün proje uyarlaması, Mars doğrulaması değil. | — |
| D04 T yedek | Apollo 234 kcal/sa≈272 W, yaklaşık 158,7 sa EVA ortalaması. | **DESTEKLENİYOR** — [E], [K] ve SP-368 atfı; yalnız sürekli düz zemin yürüyüşü değil, EVA ortalaması. | — |
| D05 T yedek | NASA aynı Pandolf denklemini EVA planlamasında kullanıyor, dolayısıyla modelimiz NASA doğrulamalı. | **ABARTILI** — [E2] Kim çalışması benzer yaklaşımı destekler; bizim kodun Mars uyarlaması ayrıca doğrulanmış değil. | TR: NASA araştırmalarındaki Dünya tabanlı yaklaşımı uyarlıyoruz; kendi Mars modelimiz doğrulanmış değil.<br>EN: We adapt an Earth-based approach used in NASA research; our Mars model remains unvalidated. |
| D06 S1, T yedek | Kumda yürüyüş 2,1–2,7 kat enerji, Dünya ölçümü. | **DESTEKLENİYOR** — [E], [K] §6, Lejeune 1998; deney koşullu Dünya bulgusu, Mars katsayısı değil. | — |
| D07 T yedek, P | bedrock 1,0 / soil 1,2 / sand 2,1 / boulders 1,5 katsayılarının tamamı özgün tablodan doğrulanmış. | **ABARTILI** — [E], [K] §6: Soule–Goldman özgün tablo okunamadı; Mars sınıf eşlemesi varsayım. | TR: Bu katsayılar kodun Dünya kökenli varsayımlarıdır; her değerin özgün tablo dayanağı bağımsız doğrulanmadı.<br>EN: These are Earth-derived code assumptions; original-table support for every coefficient was not independently verified. |
| D08 T/P | Mars için ölçülmüş hiçbir zemin katsayısı yok. | **ABARTILI** — evrensel yokluk kanıtlanamaz; [E] taranan kaynaklarda bulunamadı. | TR: Taranan kaynaklarda insanlı Mars yürüyüşüne ait doğrulanmış zemin katsayıları bulunamadı.<br>EN: The reviewed sources provided no validated terrain coefficients for human walking on Mars. |
| D09 T yedek, P, D | 3,71/9,81 ölçeklemesi nedeniyle enerji kesin alt sınırdır. | **ABARTILI** — [E2], [N2]; doğrusal ölçek desteklenmiyor ama tüm rota çıktısı için matematiksel alt sınır ispatı yok. | TR: Mars enerji tahmini doğrulanmadı; düşük tahmin riski var, fakat kesin alt sınır olduğu kanıtlanmadı.<br>EN: Mars energy estimates are unvalidated; underestimation is possible, but a strict lower bound has not been established. |
| D10 T yedek | Ek yük toplam kütle oranıyla tahmin edilir, tam Pandolf yeniden hesabı değildir. | **DESTEKLENİYOR** — [ME] yük açıklaması; kaba yöntem olarak belirtilmeli. | — |
| D11 P, denetim §10 | 352 W referansı enerjiyi yaklaşık %38 artırır. | **ABARTILI** — [DU], eski sürüm yalnız S1/balanced; tek yön kcal +%38,6, tam taahhüt kcal +%16,5; genel oran değil. | TR: Eski S1 deneyinde tek yön enerji yüzde 38,6 arttı; tüm görev bütçesi için aynı oran geçerli değil.<br>EN: In an older S1 experiment, one-way energy increased 38.6 percent; the full mission budget changed differently. |
| D12 T yedek, P | 6 sa, 2000 kcal, 420 L, 30 dk bilim ve 30 dk rezerv. | **DESTEKLENİYOR** — [K] §3, `params.py`, görev JSON'u; yalnız uygulama varsayımları olarak. | — |
| D13 T yedek | Alternatif 7 sa/1800 kcal Apollo kapasitesi; 3,5 km Mars dönüş sınırı. | **ABARTILI** — [E2]: Apollo sistemiyle Mars tasarım önerisi farklı; 3,5 km koşullu hesap, evrensel sınır değil. | TR: Apollo kapasitesi ve koşullu Mars dönüş önerileri karşılaştırma sağlar; doğrudan görev limitimiz değildir.<br>EN: Apollo capacity and conditional Mars walk-back proposals provide context, rather than direct limits for our mission. |
| D14 K eski satır | 370 L kaynaklı gerçek skafandr kapasitesi; 4,86 veya 4,8 kcal/L kesin dönüşüm. | **ABARTILI** — [E], [K] §6: 370 L türetilmiş öneri, RER ve dönüşüm seçimine bağlı. | TR: Oksijen tüketimi metabolik varsayımlardan türetilir; 370 litre ölçülmüş Mars skafandr kapasitesi değildir.<br>EN: Oxygen consumption is derived from metabolic assumptions; 370 litres is not a measured Mars suit capacity. |
| D15 S3, P | RAD 0,210±0,040 mGy/gün, sabit 8,75 µGy/sa gösterge. | **DESTEKLENİYOR** — [REF] Hassler 2014, [K] §6; saat dönüşümü 24 Dünya saatli gün kabul eder. | — |
| D16 T/S/P “live” | HUD canlı oksijen/enerji/doz ölçer. | **ABARTILI** — [Q], [AK]; yürüyüş sırasında güncellenen hesap, fiziksel sensör ölçümü değil. | TR: HUD hareketle güncellenen model tahminleri gösterir; gerçek zamanlı yaşam desteği veya radyasyon ölçümü yapmaz.<br>EN: The HUD updates model estimates during movement; it does not measure live life support or radiation. |
| D17 S7 “next” | Rota boyunca canlı RAD/REMS ekleyeceğiz. | **ABARTILI** — veri tek rover konumu/zamanından; tüm gelecekteki yürüyüş güzergâhında sensör yok. | TR: Gelecekte konumu ve zamanı belirtilmiş RAD/REMS kayıtlarını bağlam olarak eklemeyi hedefliyoruz.<br>EN: We aim to add RAD and REMS records with explicit locations and timestamps as contextual data. |
| D18 Olası iddia | 60 µGy NASA EVA limiti. | **YASAK** — [N3] §4.8.2 kariyer etkin dozunu düzenler; [E], [Q] bu proje bütçesini ayırır. | TR: 60 µGy gösterim amaçlı plan bütçesidir; NASA'nın EVA başına limiti değildir.<br>EN: 60 µGy is a demonstration planning budget, not a NASA per-EVA limit. |
| D19 T yedek | 15°/25°, kumda 12° eşikleri proje varsayımıdır. | **DESTEKLENİYOR** — [E], [K], `params.py`; görsel renk bantları da ayrıca tasarım seçimi. | — |
| D20 Olası iddia | 25° insan için NASA'nın geçilmez eşiği. | **YASAK** — [E], [Q] soru 9; rover DEM dağılımı insan limitini doğrulamaz. | TR: 25° proje planlama eşiğidir; Mars'ta insan için doğrulanmış sınır değildir.<br>EN: 25 degrees is a project planning threshold, not a validated human limit on Mars. |

## Rotalar, DEM ve demo sonuçları (2026-11-15)

| ID / yer | Denetlenen iddia | Karar ve dayanak | Önerilen düzeltme TR / EN |
|---|---|---|---|
| E01 T6, S6, P | Curiosity aynı uçlar arasında 3887,6 m/3,89 km ilerledi. | **DESTEKLENİYOR** — [VA], [DA] §3; poliline uzunluğu, rasterleştirilmiş 4141,3 m ile aynı hesap değil. | — |
| E02 T6, S6, P, D | Güncel üç rota 2,26–2,30 km; ortalama sapma yaklaşık 140 m. | **ABARTILI** — [VA] eski koşu; [DA] güncel kayıt 2257,9/2284,1/2396,3 m; sapmalar 131,4/133,4/132,4 m. | TR: Son kayıtlı koşuda rotalar 2,26–2,40 km; Curiosity izinden ortalama sapma yaklaşık 130 metre.<br>EN: In the latest recorded run, routes span 2.26–2.40 km, with about 130 metres mean deviation from Curiosity's track. |
| E03 P | Uçlar arası düz mesafe 2019,8 m; karşılaştırma yalnız eğim ve kaya katmanlarıyla. | **DESTEKLENİYOR** — [VA], yalnız eski deneyin tanımı olarak; güncel [DA] zemin katmanlarını da kullanıyor. | — |
| E04 T6 başlığı, D | “Checked against reality” insan enerji/süre modelini doğrular veya izler çakışır. | **ABARTILI** — [DA] §3 bunu açıkça reddeder; bilim hedefleri ve araç kısıtları farklı. | TR: Gerçek rover iziyle geometrik karşılaştırma yaptık; insan enerji ve süre tahminleri doğrulanmadı.<br>EN: We compared route geometry with a real rover track; human energy and time predictions remain unvalidated. |
| E05 T6 not | Curiosity yalnız boxwork bilim sapmaları yüzünden uzun gitti. | **ABARTILI** — farklı görev hedefleri/rover kısıtları makul bağlam; her sapmanın nedeni bu dosyalarda ayrı doğrulanmıyor. | TR: Rover ve yaya planları farklı bilim hedefleri ve hareket kısıtları taşıyor; uzunluk farkı üstünlük kanıtı değil.<br>EN: Rover and walking plans have different science goals and mobility constraints; distance differences do not prove superiority. |
| E06 T yedek | 144 waypoint'te medyan yükseklik farkı 0,0 m. | **KAYNAKSIZ** — 144 [G]'de var; `gale_grid.py:37–45` kontrol yöntemini içeriyor, fakat 0,0 çıktısının ham kaydı bulunamadı. | TR: 144 waypoint için karşılaştırma yöntemi mevcut; medyan 0,0 metre sonucunun ham kaydı doğrulanmadı.<br>EN: A comparison method exists for 144 waypoints; the raw record supporting a 0.0 metre median was not verified. |
| E07 P DTM maddesi | 144 yükseklik kontrolü, 30,7/33,5 m kayma düzeltildikten sonra yapıldı. | **KAYNAKSIZ** — eski planlayıcı waypoint kontrolü ile yeni sim T3 kayma kontrolü ayrı işlemler; zaman sıralaması kanıtı yok. | TR: Planlayıcı waypoint kontrolü ile sim DEM hizalama testi ayrıdır; ortak bir doğrulama sonucu gibi sunulmamalı.<br>EN: Planner waypoint checks and simulator DEM alignment tests are separate; they should not be presented as one validation result. |
| E08 K, DEM belgesi | Sim T3 yükseklik ofseti yaklaşık +30,7 m doğu/+33,5 m güney. | **DESTEKLENİYOR** — [DEM] yeni bağımsız bölüm yaklaşık 30/32 m, çeyrekler arasında değişim; yerel ampirik kayıt. | — |
| E09 DEM eski bölüm | Düzeltme sonrası her yerde yaklaşık 0,5 m hata. | **ABARTILI** — ilk ifade örnekleme yuvarlaması; yeni [DEM] bağımsız kontrol 2–4 m kalan kayma bildiriyor, evrensel doğruluk değil. | TR: Yerel bağımsız kontrol, düzeltme sonrasında yaklaşık 2–4 metre kalan kayma bildiriyor; tüm alan doğruluğu garanti değil.<br>EN: Local independent checks report roughly 2–4 metres residual shift after correction; whole-area accuracy is not guaranteed. |
| E10 Q16, eski denetim | Varsayılan hâlâ tiles, düzeltme yalnız isteğe bağlı. | **ABARTILI** — bu tur kod değişmiş: `main.js:27`, `tiles-base.js` önce tiles_fixed, sonra tiles; fixed manifest mevcut. | TR: Güncel kod önce düzeltilmiş karoları seçer; bulunamazsa eski karolara düşer, sunum oturumu ayrıca kontrol edilmeli.<br>EN: Current code prefers corrected tiles and falls back to older tiles; the presentation session still requires checking. |
| E11 R çalıştırma | Düzeltilmiş bütün karolar ve tüm katmanlar repoda, her makinede iki komutla çalışır. | **ABARTILI** — yerel manifest mevcut olmak dağıtım kanıtı değil; [DEM] git dışı diyor, temiz kurulum testi yapılmadı. | TR: Çalıştırmak bağımlılıkları ve uygun veri paketini gerektirir; temiz makinede kurulum bu denetimde sınanmadı.<br>EN: Running requires dependencies and the appropriate data package; installation on a clean machine was not tested in this audit. |
| E12 P | 2 m DEM eğimleri abartır; rover izinde ≥25° olan 35 hücre var. | **ABARTILI** — 35 [VA] eski örnekleme; [EG] yeni hücre yöntemi farklı, gerçek IMU eğimiyle kıyas yok. | TR: DEM hücre eğimi gerçek araç veya yürüyüş eğimi değildir; sonuçlar örnekleme yöntemine bağlıdır.<br>EN: DEM cell slope is not actual vehicle or walking slope; results depend on the sampling method. |
| E13 T/S/D/V | Üç rota, segment gerekçeleri, 3B yürüyüş, kum olayı ve karne akışı. | **DESTEKLENİYOR** — [AK] kayıtlı üç görevde akış; güncel sürümde yeniden test edilmedi. | — |
| E14 T5, P | Üç görev/senaryo: S1 kolay, S2 orta, S3 zor. | **DESTEKLENİYOR** — bu tur `sim/data/missions.json` üç kayıt; zorluk etiketleri tasarım tercihi. | — |
| E15 T5, S5 | S1 yaklaşık 0,55 km; 18,4/18,7/19,4 dk; 87/88/91 kcal. | **DESTEKLENİYOR** — [L] “sonra” tablosu, sırasıyla 0,55/0,57/0,61 km; kayıtlı model çıktıları, güncel canlı ölçüm değil. | — |
| E16 T5 | S2 replan rotayı yaklaşık 46 m kaydırır. | **KAYNAKSIZ** — [AK] API çağrısını doğruluyor fakat 46 m ölçümü yok; bu sayı için sürümlü ham çıktı bulunamadı. | TR: S2 yeniden planlamayı gösterir; güncel rota kayması mesafesi bu denetimde doğrulanmadı.<br>EN: S2 demonstrates replanning; the current route displacement was not verified in this audit. |
| E17 T5, S5, P | S3 oksijeni 80 L ile sınırlar. | **DESTEKLENİYOR** — mevcut görev JSON'u `S3.limits.o2_L=80`; tasarlanmış senaryo bütçesi. | — |
| E18 T5, görev adı | 80 L “yarım O₂ tüpü”. | **ABARTILI** — varsayılan 420 L'nin yarısı 210 L; 80 L için fiziksel tüp dayanağı yok. | TR: S3, oksijen bütçesi 80 litreye düşürülmüş bir senaryodur.<br>EN: S3 is a scenario with its oxygen budget reduced to 80 litres. |
| E19 T5, S5 | S3 tüm rotalar NO-GO; astronot dönmek zorunda. | **ABARTILI** — [AK] ilk NO-GO rotada yürünebildiğini, replan sonrası GO olduğunu bildiriyor; zorunlu dönüş akışı kanıtlanmadı. | TR: S3 düşük bütçeyle dönüş kararını tartıştırır; yazılımın dönüşü zorunlu kıldığı doğrulanmadı.<br>EN: S3 explores return decisions under a low budget; enforced turn-back behavior has not been verified. |
| E20 T/P/D/V | Beklenmedik kum görülür, astronot gözlemine göre anında replan yapılır. | **ABARTILI** — görev JSON'unda önceden konumlu olay; [AK] çağrılar yaklaşık 1,4–1,8 s, fiziksel gözlem yok. | TR: Önceden tanımlı kum olayı yeniden planlama çağrısını tetikler; canlı sensör algılama gösterilmiyor.<br>EN: A predefined sand event triggers replanning; live sensor detection is not demonstrated. |
| E21 T/P/D/V | Karne planlananla gerçekleşeni karşılaştırır ve not verir. | **DESTEKLENİYOR** — [AK] karneye ulaşma kaydı; gerçekleşen, simülasyon kaydıdır, insan deneyi değil. | — |
| E22 Demo anlatımı | Karneyle gerçek yürüyüş süresi/dozu ve görev başarısı doğrulandı. | **ABARTILI** — [AK] setProgress zıplatması, süre/doz 0, not yapay; tek yön/gidiş-dönüş etiket farkı var. | TR: Otomatik test akışı kontrol etti; gerçek zamanlı yürüyüş, tüketim ve karne doğruluğunu doğrulamadı.<br>EN: Automated testing checked the workflow, not real-time walking, consumption, or debrief accuracy. |
| E23 T4, P | Simülatördeki her sayı API'den okunur. | **ABARTILI** — görev limitleri JSON'dan, süre yerel telemetriden; [K], [AK], görev dosyası; tüm sayılar API çıktısı değil. | TR: Planlayıcı rota tahminlerini sağlar; görev ayarları ve simülasyon telemetrisi ayrıca hesaplanır veya yüklenir.<br>EN: The planner supplies route estimates; mission settings and simulation telemetry are calculated or loaded separately. |
| E24 R akış | Termal katman rota maliyetinde etkin. | **KAYNAKSIZ** — şema tek başına kanıt değil; bu denetimde güncel termal maliyet bağlantısı gösterilmedi. | TR: Termal veri bilimsel bağlamdır; rota maliyetine güncel etkisi bu denetimde doğrulanmadı.<br>EN: Thermal data provides scientific context; its current contribution to route cost was not verified in this audit. |

## Performans, lisans, teslim ve yasak iddialar (2026-11-15)

| ID / yer | Denetlenen iddia | Karar ve dayanak | Önerilen düzeltme TR / EN |
|---|---|---|---|
| F01 AK / olası sunum | Üç senaryonun üçü de karneye ulaştı, konsol hatası yok. | **DESTEKLENİYOR** — [AK], belirtilen eski birleşik test sürümü ve yapay ilerleme koşulunda; bugünkü canlı demo garantisi değil. | — |
| F02 AK, R3 | Yaklaşık 1 FPS; 590–780 bin üçgen; JS yaklaşık ≤11 ms/kare. | **DESTEKLENİYOR** — [AK] ve [R3] farklı yazılım GL kayıtları; aynı koşuda tüm sayıların birlikte ölçüldüğü varsayılmamalı. | — |
| F03 Olası iddia | Gerçek GPU 60 FPS; JS 11 ms olduğundan 90 FPS çalışır. | **YASAK** — GPU süresi, toplam kare ve donanım ölçümü yok; [Q] soru 18. | TR: Gerçek GPU'da güncel FPS ölçümü yok; mevcut kayıtlar yazılımsal grafik testlerinden geliyor.<br>EN: No current physical-GPU FPS measurement is available; existing records come from software-rendered tests. |
| F04 R eğitim ortamı | RTX 4070 ve M5 Pro eğitim makineleri. | **DESTEKLENİYOR** — R ekip ortamı, [MT] gerçek eğitim RTX 4070 Laptop; M5 üzerinde eğitim ölçümü gösterilmemiş. | — |
| F05 V başlık, D süreler | 30 saniyelik video, 3 dakikalık demo hazır. | **ABARTILI** — metin zaman çizelgesi var, yer tutucular ve eksik kayıt bağlantıları var; bitmiş video kanıtı yok. | TR: 30 saniyelik video ve üç dakikalık demo metni hazır; son kayıt ve süre henüz doğrulanmadı.<br>EN: Scripts exist for a 30-second video and three-minute demo; final recordings and durations remain unverified. |
| F06 V | Kayıt 1920×1080, altyazı sesle aynı, son build. | **KAYNAKSIZ** — bunlar üretim talimatları, tamamlanmış çıktı özellikleri olarak doğrulanmadı. | TR: 1920×1080 kayıt ve eşleşen altyazı hedefleniyor; nihai dosya özellikleri henüz doğrulanmadı.<br>EN: Recording targets 1920×1080 with matching captions; final file properties remain unverified. |
| F07 P, V | Astronot Quaternius CC0, Three.js MIT. | **DESTEKLENİYOR** — `sim/ASSETS.md`, [Q] soru 20; ilgili varlık/bileşen kapsamıyla. | — |
| F08 P “open data/open code” | Bütün proje/etiketler/görseller CC0 veya NASA kamu malı. | **ABARTILI** — [Q] lisans ayrımı; AI4Mars ayna/orijinal uyuşmazlığı, makale şekilleri, MIT ve NASA kullanım koşulları ayrı. | TR: Lisanslar varlık ve veri sürümü bazında değişir; tüm proje CC0 değildir.<br>EN: Licenses vary by asset and dataset version; the entire project is not CC0. |
| F09 P | NASA logosu yok; müzik CC0 veya hiç yok. | **KAYNAKSIZ** — metin politikası var; nihai video/slayt/render varlık taraması yapılmadı. | TR: NASA logosu ve müzik hakları nihai çıktı üzerinden ayrıca kontrol edilmelidir.<br>EN: NASA logo use and music rights require a separate check of the final output. |
| F10 P AI beyanı | Claude Code kullanıldı; ekip tüm çıktıları ve sayıları kontrol etti. | **ABARTILI** — ilk bölüm ekip beyanı; “tümü kontrol edildi” bu rapordaki açık hatalarla bağdaşmıyor, beyan zaten taslak. | TR: Yapay zekâ araçları kullanıldı; ekip beyanı ve nihai kaynak kontrolleri tamamlanmalıdır.<br>EN: AI tools were used; the team disclosure and final source checks still require completion. |
| F11 D yedek plan | Çevrimdışı paket ve kayıtlı tam koşu hazır. | **KAYNAKSIZ** — deploy rehberi paket yöntemini anlatabilir; kayıt bağlantısı yer tutucu, sunum makinesinde paket testi yok. | TR: Çevrimdışı paket ve yedek kayıt, sunum makinesinde ayrıca doğrulanmalıdır.<br>EN: The offline package and backup recording require verification on the presentation machine. |
| F12 Olası iddia | NASA projeyi onayladı; uçuşa hazır ve güvenli rota garanti. | **YASAK** — onay belgesi yok; [Q], [N3] NASA standardına atıf ürün onayı değildir. | TR: NASA verilerinden yararlanan bağımsız bir araştırma prototipiyiz; operasyonel onayımız yok.<br>EN: We are an independent research prototype using NASA data, without operational approval. |

## TUR 5 ile tutarlılık ve yeni kanıt (2026-11-15)

1. [Q] içindeki enerji, O₂, doz, ML, rover/insan ve GPU sınırları korunur; bu tur bunlara operasyonel doğruluk eklemez.
2. **Q16'nın karo seçimi bilgisi eskidi:** güncel `sim/app/main.js` `pickTiles` çağırıyor; `tiles-base.js` önce `tiles_fixed` manifestini arıyor, bulamazsa `tiles` kullanıyor. Bu tur `tiles_fixed/manifest.json` mevcut bulundu; tarayıcıda hangi karonun gerçekten yüklendiği sınanmadı. Q16'yı sözlü anlatırken **E10** cümlesini kullanın; dosyası değiştirilmedi.
3. [DEM]'e eklenen bağımsız kontrol, ilk yol-parlaklık yönteminden ayrı DEM–DEM karşılaştırmasını içeriyor; raporlanan kalan kayma **2–4 m**, ilk bölümdeki **0,5 m** ise genel doğruluk kanıtı değil. 144 waypoint kontrolüyle aynı deney sayılmamalı.
4. Kaynak adı vermek, iddianın o kaynaktan çıktığını kanıtlamaz: “alt sınır” önerisi [DA] §10'da da tekrarlansa bile [E2]/[Q] düzeyindeki kanıt bunu kesinleştirmiyor.

## Sunuma doğrudan alınabilecek kısa çerçeve (2026-11-15)

**TR:** Martian Map, gerçek Mars arazi verileri üzerinde rota seçeneklerini karşılaştıran bir EVA prova prototipidir. Ölçüm, model tahmini ve planlama varsayımlarını ayırır. Curiosity izi ve etiketli görüntülerle karşılaştırmalar yaptık; Mars'ta insan enerji tüketimi ve operasyonel güvenlik henüz doğrulanmadı.

**EN:** Martian Map is an EVA rehearsal prototype comparing route options on real Mars terrain data. It distinguishes measurements, model estimates, and planning assumptions. We compared results with Curiosity's track and labelled images; human energy use and operational safety on Mars remain unvalidated.

## Dayanak dizini ve denetim kaydı (2026-11-15)

Yerel yollar yukarıdaki salt okunan main-wt köküne göredir; köşeli kodlar tablo dayanaklarıdır. Kanıt türü: **ekip kaydı**, **mevcut veri/kod okuması**, **birincil web kaynağı**; birbirinin yerine geçirilmemeli.

| Kod | Dosya/kaynak ve kullanılan bölüm |
|---|---|
| Q | `docs/data/ekip/juri_sorulari.md`, TUR 5, 20 soru ve yasak iddialar |
| K | `docs/sim/VERI_KAYNAKLARI.md`, özellikle §3 ve eski tabloları sıkılaştıran §6 |
| E / E2 | `docs/data/ekip/gercek_parametre_arastirmasi.md` / `gercek_tur2_enerji_modeli.md` |
| G3 / KU | `docs/data/ekip/gale_dogrulama_tur3.md` / `kum_uyari_metinleri.md` |
| DA | `docs/sim/DENETIM_masa_arastirmalari_2026-11-15.md`, §§3,7,9,10 |
| DEM | `docs/sim/DEM_KAYMA.md`, özellikle 2026-11-15 bağımsız doğrulama eki |
| AK / R3 | `docs/sim/AKIS_TESTI.md` / `RAPOR_sim_3d.md`, test ortamı ve sınırlar |
| MT / L / SC / SA | `ml/rover_terrain/{METRICS,LAYERS,SCAN_CHECK,SAND_ANALYSIS}.md` |
| O | `ml/orbital/VALIDATION.md`, ilk kesit, ikinci kör örneklem, §6 büyük adaylar, §7 kum adayları |
| G / C | `docs/data/gale_dtm_ortho.md` / `crism_geology.md`, kapsam ve bilim durağı eşleme sınırları |
| ME / VA | `docs/metabolic_model.md` / `docs/validation_msl.md`; ayrıca `docs/eva_parameters.md` bütçe önerileriyle karşılaştırıldı |
| EG / DU | `docs/data/ekip/msl_egim_dagilimi.md` / `duyarlilik_analizi.md`, örnekleme ve sürüm sınırları |
| REF / P | `docs/REFERENCES.md` / `docs/submission/PROJECT.md` |
| Diğer ekip incelemeleri | `repo_haritasi.md`, `gale_zemin_ortam_arastirmasi.md`, `varlik_manifest.md`, `rems_gercek_veri.md`; doğrulanmamış sayılar yerine G3/DA kararları esas alındı |
| Tarayıcı tasarım belgeleri | `docs/sim/TERRAIN_SCANNER_{ARASTIRMA,KAYNAKLAR}.md`; oyun referansı bilimsel zemin güvenliği dayanağı değildir |
| Eski sim denetimi | `docs/sim/DENETIM_ekip.md`; eski kayma ve görsel testler güncel iddia gibi aktarılmadı |
| N1, birincil | [NASA, Sols 4873–4878: Welcome to the Atacama Drill Target](https://science.nasa.gov/blog/curiosity-blog-sols-4873-4878-welcome-to-the-atacama-drill-target/), 2026 kampanya bağlamı; tam sci_4 koordinatını doğrulamaz |
| N2, birincil özet | [Farley & McMahon 1992](https://pubmed.ncbi.nlm.nih.gov/1490989/), J Appl Physiol 73:2709–2712; yerçekimi ve yürüme enerjisi doğrusal azalmaz; Mars rota alt sınırı vermez |
| N3, birincil | [NASA-STD-3001 Vol 1 Rev C](https://standards.nasa.gov/sites/default/files/standards/NASA/C/nasa-std-3001-vol-1-rev-c-signature.pdf), §4.8.2, s.40; kariyer etkin doz sınırı, EVA başına 60 µGy değil |

### Okunan sunum metinlerinin SHA-256 değerleri (2026-11-15)

Bu değerler incelenen anlık kopyayı tanımlar; sonradan değişen metin için kararlar yeniden değerlendirilmelidir.

| Dosya | SHA-256 |
|---|---|
| README.md | `708d69d4bf556674f0fabd0fd96e1d96549441d5de0eacfa840c1d5133247714` |
| docs/sunum_taslak.md | `1bbc7744a319fa8f64eec840ea65ddfb4e00256048b40259e6bf708c4f58c6f4` |
| docs/submission/SLIDES.md | `71d0f71675049de8c04f4f6571860a9fdbb013e5665690d291b555b45b0ff1ba` |
| docs/submission/PROJECT.md | `30bbe7ff312119f5a70acd695b94778e720bb8dfb56d79519b9fefc87583b49a` |
| docs/submission/MODEL_CARD.md | `e07145197627df43ebc1e56834ffaf0f4d95e122a5133baf485776bb1a0dc803` |
| docs/submission/DEMO_SCRIPT.md | `b60b73bff302a8e25611e2606fe37d9e81910c574748c9b756f632ba39078d19` |
| docs/submission/VIDEO_30S.md | `18e34ef820cc7e1e9dbd7d60b4b2f23b523d4db52668e5725515e409b1584d1f` |
| docs/submission/REFERENCES.md | `021c194b284f3a2e5c199dc68c39ef8523cf1e3c92b8ea3df6e7b3669e6a9a53` |

### Kontrol yöntemi (2026-11-15)

`rg --files` ve dosya uzantısı envanteriyle sunumlar bulundu; UTF-8 metinler okundu; sayılar dayanak dosyalarıyla karşılaştırıldı. `python -B` ile JSON kayıtları sayıldı, sunum metinlerinin SHA-256 değerleri alındı; kod import edilmedi, API/test sunucusu başlatılmadı. Tek yazılan dosya bu rapordur; kaynaklar, sim, .borje ve git değiştirilmedi.

Yapısal kontrol: **110 benzersiz ID**, her olumsuz kararda **TR+EN düzeltme mevcut**, düzeltmelerin her biri **≤20 boşlukla ayrılmış kelime**; kontroller geçti. Bu kontrol bilimsel geçerlilik testi değildir.
