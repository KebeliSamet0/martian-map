# Kaynaklı kum uyarısı metinleri — tur 4 (2026-11-15)

**Teslim:** Üç arayüz konumu için metin önerisi; uygulama değişikliği yapılmadı. Bütün rover bulguları insan/skafandr eşiklerinden ayrıldı. Web kaynaklarına erişim: **2026-11-15**.

## Öneri tablosu (2026-11-15)

Her öneri en fazla iki cümledir. Noktalı anahtarlar JSON içindeki nesne yolunu gösterir; üst düzey, nokta içeren JSON anahtarı ekleme talimatı değildir.

| Yer | texts.json yolu / mevcut durum | Önerilen Türkçe metin | Dayanak |
|---|---|---|---|
| (a) Kum olayı bandı | **`alerts.sand` — mevcut.** Çalışma anında `alert.sand.body` anahtarına aktarılıyor. | Kum uyarısı: Curiosity’nin megaripple geçişlerinde rover kayması %77’ye kadar çıktı. Bu rover bulgusudur, insan/skafandr sınırı değildir; rota yeniden hesaplanabilir. | **S1:** %77, makalenin açık özeti; çoklu geçişlerin özeti, bu simülasyon noktasında ölçülmüş kayma değil. Son eylem ifadesi arayüz önerisi. |
| (b) Başarılı `/replan` sonrası toast | **`alerts.replan_done` — mevcut.** Mevcut toast bağlantısı ayrıca aşağıda açıklanıyor. | Yeni rota hazır; bildirilen kum alanı planlamaya eklendi. Sonuç bir model önerisidir, insan/skafandr geçilebilirliği ölçümü değildir. | **L4:** başarılı yanıt ve planlama girdisi yerel koddan. **S3/S4:** kumda sürüş güçlüğü üzerine alternatif rota değerlendirmesi için rover bağlamı; API sonucunu NASA doğrulaması diye sunmuyoruz. |
| (c) “Zemin (model)” satırının açıklama ipucu | **`hud.ground_model_hint` — YENİ anahtar önerisi**, mevcut `hud` nesnesinin biçimine uygun. Şu an açıklama inline. | p_sand, modelin kum olasılığı skorudur; ≥0,4 bu uyarı için seçilen eşiğe ulaşıldığını gösterir. Zemin ölçümü, kayma yüzdesi veya insan/skafandr geçiş sınırı değildir. | **Görevde verilen tasarım eşiği:** `p_sand >= 0.4`; NASA ölçümü veya insan sınırı değil. **L4:** mevcut satır da model tahmini/ölçüm ayrımı yapıyor. |

**Bandın başlığı için eşlik eden öneri:** Mevcut `screens.js` varsayılan anahtarı **`alert.sand.title`** için **“Kum uyarısı”**. Mevcut “Kum algılandı” başlığı, model/tetikleyici bilgisini sensörle doğrulanmış bulgu gibi gösterebilir. Bu başlık şu an texts.json'da yok; `alerts.sand` gövdesine gizlice ikinci bir anahtar eklenmiş sayılmamalı. Bağlantı değişikliği yalnız uygulama sorumlusuna öneridir.

## Anahtarların ve kullanım yerlerinin salt-okuma denetimi (2026-11-15)

Bu masanın çalışma kopyasında `martian-map-main/sim/data/texts.json` bulunamadı. Kullanıcının belirttiği **main-wt** kopyası bulundu ve yalnız okundu: `C:/Users/Batu/Desktop/mm-pr/main-wt/sim/data/texts.json`. Teslimat ise bu masanın istenen `martian-map-main/docs/data/ekip/` yolundadır; başka masanın dosyasına yazılmadı.

| Kod | Okunan yerel dosya / yer | Bulgusu |
|---|---|---|
| L1 | `main-wt/sim/data/texts.json`, `alerts` ve `hud` nesneleri | `alerts.sand` ve `alerts.replan_done` var; `hud.ground_model_hint` yok. Kum metni bu kopyada “Önünde kum var. Rota yeniden hesaplanıyor.”; görevde alıntılanan eski metin fallback'te duruyor. |
| L2 | `main-wt/sim/app/wire-adapters.js:18–19`, `uiTexts()` | `'alert.sand.body': texts.alerts?.sand` eşlemesi var. Önerilen bandın JSON kaynağı `alerts.sand`; bunun kopyası olarak üst düzey `alert.sand.body` eklenmesi gerekmiyor. |
| L3 | `main-wt/sim/app/screens.js:13–15`, `:142` | Başlık/body fallback'leri ve bandın bu anahtarlardan çizilmesi okundu. `alert.sand.body` eski “Önündeki zemin planlanandan yumuşak…” metnini içeriyor. |
| L4 | `main-wt/sim/app/main.js:258–277`, `fireReplan()`; `:438`, zemin açıklaması | Kum bildirimi `/replan` isteğinin `observations` girdisine ekleniyor. Başarılı toast hâlen inline; “Kum bölgesi kaçınıldı” diyor. Zemin ipucu da inline ve ölçüm olmadığını belirtiyor. |
| L5 | `main-wt/sim/app/routeline.js:101–109` | Ayrı segment işaretçisi `sandWarn = 0.6` varsayılanını kullanıyor. Görevdeki **0,4'ün uygulamanın her yerindeki mevcut eşik olduğu doğrulanmadı**. |

**Bağlantı önerisi:** Uygulama sorumlusu bandı L2'deki mevcut eşlemeden besleyebilir; başarılı inline toast'ı `alerts.replan_done` ile, inline zemin `title` açıklamasını yeni `hud.ground_model_hint` ile bağlamalıdır. Bunlar bu dosyada önerildi, uygulanmadı. Toast yalnız başarılı, kullanılabilir rota yanıtından sonra gösterilmeli; başarısızlıkta bu başarı metni kullanılmamalı. Dönen rotanın bildirilen alanı gerçekten dolaştığı ayrıca denetlenmedikçe “kumdan kaçınıldı” yazılmamalı.

**0,4'ün anlamı:** Model skoru eşikle karşılaştırılır; eşitlik de uyarıya dahildir. Bu değer %40 kayma, %40 batma riski veya zeminin %40'ının kumla kaplı olması demek değildir. Model olasılık kalibrasyonu bu tur doğrulanmadı; “%40 doğrulukla kum var” da denmemeli. İpucundaki 0,4, **kullanıcının bu görev için verdiği tasarım eşiğidir**; yayımlanmış rover/insan eşiği diye kaynaklandırılmaz. Bağlanacak gerçek eşik farklı seçilirse metin onunla birlikte değişmelidir.

## Birincil kaynak ve sayı dayanakları (2026-11-15)

Aşağıdaki bütün sayılar okunan birincil özet veya NASA sayfasındandır. Kısa arayüzde yalnız S1'in %77 değeri kullanıldı; diğer doğrulanmış büyüklükler, uyarının neden rover deneyimine dayandığını belgelemek içindir.

| Kod | Doğrulanmış bulgu | Tam kaynak / yer | Kısa birebir alıntı | Metne etkisi / sınırı |
|---|---|---|---|---|
| S1 | Megaripple geçişlerinde batma, **0,50 m tekerlek çapının yaklaşık %30'una kadar**; rover kayması **%77'ye kadar**. | Arvidson, R. E. vd. (2017). *Mars Science Laboratory Curiosity Rover Megaripple Crossings up to Sol 710 in Gale Crater*. **Journal of Field Robotics 34(3), 495–518**, DOI **10.1002/rob.21647**. [Açık yayıncı özeti, Abstract](https://onlinelibrary.wiley.com/doi/abs/10.1002/rob.21647). | “approximately 30% of the 0.50 m wheel diameter”; “rover-based slip up to 77%” | Bandın sayısal dayanağı. Çoklu olay özeti; %77'yi yalnız Hidden Valley'in belirli bir soluna veya mevcut sim noktasına atamıyoruz. Yaklaşık %30, skafandrlı ayağın batma tahmini değil. |
| S2 | Kohezyonsuz kum testinde **10°'de orta kayma**, **17°'de gömülme**; düzgün ana kayada **22°'ye kadar geçilebilirlik**. | Heverly, M.; Matthews, J.; Lin, J.; Fuller, D.; Maimone, M.; Biesiadecki, J.; Leichty, J. (2013). *Traverse Performance Characterization for the Mars Science Laboratory Rover*. **JFR 30(6), 835–846**, DOI **10.1002/rob.21481**. [Açık yayıncı özeti, Abstract](https://onlinelibrary.wiley.com/doi/abs/10.1002/rob.21481). | “moderate slip on 10 degree slopes”; “vehicle embedding at 17 degrees”; “slopes up to 22 degrees” | Dünya'da Mars ağırlığını temsil eden roverlarla deney. Aynı eğimde zeminin etkisine dayanak; insan uyarısı/NO-GO derecesi değildir. “Orta kayma”ya yüzde uydurulmaz. |
| S3 | Hidden Valley kumlu tabanında **sol 709**, **4 Ağustos 2014** görüntüsü. | NASA/JPL-Caltech, *Curiosity Tracks in ‘Hidden Valley’ on Mars*, yayımlanma 5 Ağustos 2014. [Görüntü açıklaması, ilk paragraf](https://science.nasa.gov/resource/curiosity-tracks-in-hidden-valley-on-mars/). | “709th Martian day, or sol” | Görevdeki ~708–710 bağlamında doğrudan okunan sol 709'dur; giriş/çıkış tarihini bu fotoğrafla üretmiyoruz. |
| S4 | Hidden Valley'de beklenmedik yüksek tekerlek kayması üzerine ekip vadiden çıkıp olası alternatif rotayı incelemeye karar verdi. | NASA/JPL-Caltech, *Looking Up the Ramp Holding ‘Bonanza King’ on Mars*, 15 Ağustos 2014. [Görüntü açıklaması, ikinci paragraf](https://science.nasa.gov/resource/looking-up-the-ramp-holding-bonanza-king-on-mars/). | “Due to unexpectedly high wheel slippage in the sand” | Yeniden değerlendirme için rover örneği. Bu sayfa belirli bir kayma yüzdesi, durma eşiği veya sol 710 tahliyesi vermiyor; toast bunları iddia etmiyor. |
| S5 | Curiosity Dingo Gap'teki kum engelini geçti; güncelleme **6 Şubat 2014**. | NASA/JPL, *Through the Gap: Curiosity Mars Rover Crosses Dune*, sayfa tarihi 3 Şubat, **UPDATED: February 6, 2014**. [Güncellenmiş ilk paragraf](https://www.jpl.nasa.gov/news/through-the-gap-curiosity-mars-rover-crosses-dune/). | “has crossed a dune” | **Dingo Gap için doğru, okunmuş NASA kaynağı.** Kum uyarısının her kum alanını evrensel geçilemezlik gibi sunmamasına dayanak; geçilebilirlik garantisi değildir. Arvidson 2014 kullanılmadı. |

**Erişim kapsamı:** S1/S2'nin açık birincil özetleri okundu; tam makale tabloları okunmuş sayılmadı. S3/S4/S5 NASA sayfalarının olay metinleri okundu. Önceki turdan aktarılan “teyit edildi” etiketine dayanılmadı. Ek taranan [Stein vd. 2014 Dingo Gap birincil bildirisi](https://www.hou.usra.edu/meetings/8thmars2014/pdf/1081.pdf) ve [Arvidson vd. 2016 JPL posteri](https://www-robotics.jpl.nasa.gov/media/documents/lpsc_2016_arvidson_ripple_crossing.pdf) okundu; bu kısa metinler için ek sayı taşınmadı. Bütün bağlantıların erişim tarihi 2026-11-15.

## Yapmayacaklarımız (2026-11-15)

- Eğim başına **yüzde-kayma/batma tablosu** üretmeyeceğiz; okunmayan eğriden hücre doldurmayacağız.
- Roverdaki **10°/17°/22°** bulgularından insan veya skafandr için eğim eşiği çıkarmayacağız.
- Önerilen üç metinde **“güvenli”** sözcüğünü kullanmayacağız; rota veya geçiş garantisi vermeyeceğiz.
- `p_sand` skorunu fiziksel ölçüm, kayma/batma yüzdesi, alan kaplama oranı veya kalibre edilmiş doğruluk diye sunmayacağız.
- Senaryo kum olayını, otomatik tetikleyiciyi veya model katmanını gerçek sensörle doğrulanmış zemin bulgusu gibi anlatmayacağız.
- `/replan` başarısını, bildirilen alanın gerçekten dolaşıldığının kanıtı saymayacağız; başarısız istekte “Yeni rota hazır” göstermeyeceğiz.
- Dingo Gap için **Arvidson 2014** atfı, Hidden Valley için doğrulanmamış **%40–50** VO limiti veya **sol 710'da tahliye** ifadesi kullanmayacağız.
- Bu araştırma tesliminde `sim/data/texts.json`, diğer kodlar, .borje/, ayarlar veya git üzerinde değişiklik yapmayacağız.

## Denetim kaydı (2026-11-15)

Öneri tablosu mevcut JSON anahtarlarıyla ve L2 eşlemesiyle karşılaştırıldı. Üç metin de iki cümle; yeni ipucu anahtarı açıkça yeni öneri olarak işaretlendi. Yalnız bandın %77 sayısı bilimsel ölçüm bulgusu; ipucunun 0,4 değeri kullanıcı tarafından verilen tasarım girdisi. Arayüzde 0,4 yerine 0.4 yazılması yalnız yerelleştirme tercihidir; eşik değeri değişmez. Görsel/çalışan uygulama testi yapılmadı; görev metin araştırması ve öneri teslimidir.

Salt-okuma Python kontrolü geçti: metinler sırasıyla **166 / 133 / 166 karakter**, her biri iki cümle; yasaklanan sözcük öneri metinlerinde yok. JSON mevcut/yeni anahtar ayrımı, UTF-8 ve tarihli başlıklar denetlendi. Okunan altı main-wt dosyasının önce/sonra SHA-256 değerleri aynı kaldı.
