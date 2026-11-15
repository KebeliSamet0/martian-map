# Gale sayısal iddialarının bağımsız denetimi — tur 3 (2026-11-15)

**Karar:** İncelenen raporun “teyit edildi” özeti topluca kabul edilmemeli. UV sayılarının gerçek karşılığı bulundu; **yazar, yıl, başlık ve DOI yanlış**. Dingo Gap için gösterilen Arvidson 2014 makalesi olayı kapsamıyor. Heverly'ye bağlanan ayrıntılı yüzde-kayma tablosu açık tam metinden doğrulanamadı. Hidden Valley'deki yaklaşık batma/kayma büyüklükleri makale özetiyle kısmen uyumlu; olay tarihi ve koruma eşiği ayrıca düzeltilmeli. Büyük dalgacık yüksekliğine getirilen kesin üst sınır ise okunan Bagnold ölçümüyle çelişiyor.

**Girdi:** `docs/data/ekip/gale_zemin_ortam_arastirmasi.md`, başlık tarihi 2026-11-14. Okunan dosyanın SHA-256 değeri: `9ae42e2522e2061a59d534ee546c017892b1d5565cf8002a0f4e416a762f59ff`.

**Erişim tarihi:** Aşağıdaki bütün web kaynakları için **2026-11-15**. Bu tur yalnız istenen a–f başlıklarını denetler; doku varlıkları/lisansları, gök RGB, görüş uzaklığı ve diğer ortam iddiaları kabul edilmiş sayılmaz. Yalnız bu dosya yazıldı. Girdi raporu, sim/, .borje/, kod, ayarlar ve git değiştirilmedi.

## Karar yöntemi (2026-11-15)

| Sonuç | Anlamı |
|---|---|
| **DOĞRULANDI** | Belirtilen sayısal bilgi birincil kaynakta okundu; kapsamı satırda korunuyor. |
| **KISMEN** | Büyüklük veya nitel davranış destekleniyor; sayı dizisi, yer/zaman ya da atıf bütünü desteklenmiyor. |
| **REDDEDİLDİ** | Okunan kaynak iddiayla çelişiyor veya ona yapılan atıf açıkça yanlış. Bu, sayının başka koşullarda fiziksel olarak imkânsız olduğu anlamına gelmez. |
| **OKUNAMADI** | Gerekli tam metin/şekil/veri okunamadı; yanlışlık kararı verilmez ve sayı doğrulanmış sayılmaz. |

Kaynakların kısa adları aşağıdaki tablolarda bağlantılıdır; tam künyeleri son bölümdedir. HTML'de sayfa numarası saptanamayan yerde bölüm/şekil kullanıldı; sayfa numarası üretilmedi. Açık özet, tam makale okundu diye sunulmadı. Arama dizininden görülen metin de ayrıca etiketlendi.

## A. Heverly 2013: eğim başına kayma ve batma tablosu (2026-11-15)

[H13 — Heverly vd., açık yayıncı özeti](https://onlinelibrary.wiley.com/doi/abs/10.1002/rob.21481) Dünya'da Mars ağırlığını temsil eden rover testlerini anlatıyor. Özette **10° kumda orta kayma, 17° kumda gömülme; düzgün ana kayada 22°, bazı kohezyonlu zeminlerde 28° geçilebilirlik** var. Kısa alıntı: “vehicle embedding at 17 degrees”. Ayrıntılı yüzde eğrileri özette yok. Yayıncı `/full/` isteği özete yönlendi; ResearchGate kaydı tam metin sunmuyor.

| ID | Girdi raporundaki iddia | Birincil kaynakta bulunan / yer | Sonuç |
|---|---|---|---|
| A01 | 0° kum: kayma %5–15; batma 1–3 cm | H13 özetinde bu hücreler yok; gerekli tam metin/şekil okunamadı. | **OKUNAMADI** |
| A02 | 5° kum: kayma %15–25; batma 3–6 cm | H13 ayrıntılı eğrisi okunamadı. | **OKUNAMADI** |
| A03 | 10° kum: kayma %30–45; batma 6–10 cm | H13 özeti yalnız “moderate slip” diyor; yüzde ve santimetre hücreleri yok. | **OKUNAMADI** |
| A04 | 12–15° kum: kayma %50–80 | H13 ayrıntılı eğrisi okunamadı. | **OKUNAMADI** |
| A05 | Her >15° kum tırmanışında tam gömülme ve %100 slip | H13, 17°'de gömülme bildiriyor; bütün >15° durumlarına ait evrensel eşik vermiyor. Nicel eğri okunamadı. | **KISMEN** |
| A06 | Kum iç sürtünme açısı 30–35° | H13 tam metninde zemin parametre tablosu okunamadı. Başka zeminin değerini buraya taşıyamayız. | **OKUNAMADI** |
| A07 | 0–20° ana kayada lineer kayma ≤%5–10 | H13 özeti 22°'ye kadar geçilebilirlik bildirir; bu, belirtilen kayma yüzdelerini doğrulamaz. | **OKUNAMADI** |
| A08 | Ana kayada ≤15° için <%5 slip; 25°'de tutuş korunur | Rapor §1.4'teki bu ek eşikler H13 açık özetinde yok. 22° test sonucu, 25° iddiasının kanıtı değildir. | **OKUNAMADI** |
| A09 | “12–15° kritik patinaj eşiği teyit edildi” | [S14 — Stein & Arvidson 2014](https://www.hou.usra.edu/meetings/lpsc2014/pdf/1281.pdf), PDF s.1, “Validation of Deformable Soil Model”: modelde kohezyonsuz zeminde 10–15° arasında doğrusal olmayan artış; Dumont örneğinde 20° civarında %100'e yaklaşma. Şekil 2, PDF s.2. | **KISMEN** — nitel geçiş desteklenir; rapordaki hücreler ve tek evrensel eşik desteklenmez. |

**Uygulama sonucu:** Bu tabloyu ölçülmüş Gale kayma/batma LUT'u olarak kullanmak için kanıt yok. H13 Dünya rover testi; Curiosity'nin belirli Mars sürüşleri ve insan/skafandr yürüyüşüyle aynı veri değildir. “Geçilebilir” sözcüğünden belirli bir yüzde kayma üretilemez. S14, ayrı bir birincil modelleme çalışmasıdır; H13'ün okunamayan sayısal tablosunun yerine geçirilmedi.

## B. Hidden Valley / Arvidson 2017 (2026-11-15)

[A17 — Arvidson vd., JFR 34(3), 495–518](https://onlinelibrary.wiley.com/doi/abs/10.1002/rob.21647), **özet**, geçilen megaripple olayları genelinde 0,50 m tekerlek çapının yaklaşık %30'u kadar batma ve %77'ye kadar rover slip bildiriyor. Kısa alıntı: “rover-based slip up to 77%”. **0,30 × 0,50 m = 0,15 m**, bu raporun aritmetik dönüşümüdür; tek başına Hidden Valley sol/tekerlek eşleştirmesi değildir. Makalenin ilk çevrim içi tarihi 2016-02-23, cilt/sayı tarihi Mayıs 2017; 2017 künyesi geçerlidir.

| ID | İddia | Birincil kaynakta bulunan / sayfa-bölüm | Sonuç |
|---|---|---|---|
| B01 | Hidden Valley sol 709–710'da ~15 cm batma; tekerlek çapının %30'u | A17 özeti, s.495: toplam olay kümesinde yaklaşık %30 × 0,50 m. Tam metindeki olay/tekerlek ayrımı okunamadı. | **KISMEN** |
| B02 | Hidden Valley sonunda ~%80 slip | A17 özeti %77'ye kadar bildiriyor, olayları ayırmıyor. ~%80 yuvarlaması büyüklükçe uyumlu; tam yer/zaman ataması özette yok. | **KISMEN** |
| B03 | Sabit VO slip eşiği %40–50 aşıldığı için sol 709 durdu | [R21 — Rankin vd. 2021, JPL açık kopyası](https://www-robotics.jpl.nasa.gov/media/documents/ROB-20-0040_R3.pdf), Hidden Valley / Şekil 44 çevresi **arama dizini metni**: sol 709'da %45→%77,5, yedi adım ve **Limit Cycle**; sol 710'da **Slow Slip %70**, beş ardışık adım. PDF gövdesi araç boyut sınırında okunamadı. | **OKUNAMADI** — tam metin teyidi yok; dizin metni raporun eşik/mekanizma açıklamasına güçlü karşı kanıt. %40–50 doğrulanmış sayılmamalı. |
| B04 | Sol 709 sürüşü yüksek slip nedeniyle otonom durdu | [P16 — Arvidson vd. 2016 birincil konferans posteri](https://www-robotics.jpl.nasa.gov/media/documents/lpsc_2016_arvidson_ripple_crossing.pdf), tek sayfa, “Prior Megaripple Crossings”: sols 672/709, VO kaynaklı yüksek slip nedeniyle otomatik sonlandırma. | **DOĞRULANDI** — genel olay; B03'teki yüzde eşiği değil. |
| B05 | Vadiye giriş sol 708 | [D24 — Dibb vd., NASA açık yazar metni](https://ntrs.nasa.gov/api/citations/20240015813/downloads/20240015813-Dibb%20et%20al%20202X%20-%20Observed%20correlation.pdf), §3.1, PDF s.10, satır 322: giriş **sol 706**, sol 709'a kadar park. | **REDDEDİLDİ** |
| B06 | Sol 710'da geri çıkarılıp vadiden tahliye edildi | D24, §3.1, PDF s.13, satır 338–347: kum alanından girişe dönüş **sol 713**, vadi çıkışı **sol 714**. | **REDDEDİLDİ** — rippledaki kısa bir hareket ile vadiyi terk etmek aynı olay değil. |
| B07 | Sol 710 / Moosilauke analizinin bu batma ve kayma sayılarını verdiği | A17 tam metnindeki yer/sol/ölçüm tablosu okunamadı; açık özette Moosilauke eşleştirmesi yok. | **OKUNAMADI** |
| B08 | VO, %80 slip demek: 1 m tekerlek yolu başına 0,20 m ilerleme | Raporun yazdığı boyuna slip tanımı kabul edilirse `1−0.80=0.20`: **aritmetik doğru**. R21'in sözünü ettiği rover 3D slip metriğiyle özdeşliği burada doğrulanmadı. | **KISMEN** — sayısal örnek, tek başına VO ölçüm tanımı değil. |

R21'den alınan dizin bilgisi **tam metinden doğrulandı diye etiketlenmedi**. JPL'deki açık PDF gerçekten mevcut; salt-okuma ağ isteği 200 ve 22.477.746 bayt döndürdü. Web aracı boyut sınırı verdi; yerel PDF ayrıştırıcı bulunmadığından dosya gövdesi okunamadı. Paket kurulmadı, PDF diske yazılmadı. “Açık kopya bulundu” ile “ilgili sayfa okundu” farklıdır.

## C. Dingo Gap ve yanlış Arvidson 2014 atfı (2026-11-15)

| ID | İddia | Birincil kaynakta bulunan / sayfa-bölüm | Sonuç |
|---|---|---|---|
| C01 | Dingo Gap sayıları Arvidson 2014, DOI 2013JE004605'ten teyitli | [A14 — açık tam metin](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1002/2013JE004605), başlık/özet ve §7: **ilk 360 sol**. Dingo Gap geçişi bu kapsamın dışında; tam metinde Dingo adı yok. | **REDDEDİLDİ** — kaynak atfı yanlış. |
| C02 | Geçiş sol ~535–538 | [DG14 — Stein, Arvidson, Bellutta & Heverly 2014](https://www.hou.usra.edu/meetings/8thmars2014/pdf/1081.pdf), PDF s.1, giriş ve Şekil 3 açıklamasına giden paragraf: **533 çıkış / 535 iniş**. | **REDDEDİLDİ** — kaynaklı sürüş sol çifti 533/535. |
| C03 | Tekerlek batması yaklaşık 5–10 cm | DG14, PDF s.1: **~7 cm**. Ancak [ZF20](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2020JE006489), §4.2, A17'ye atıfla **~5 cm'den fazla değil** diyor. | **KISMEN** — erken birincil bildirimle örtüşür; kaynaklar/sürümler farklı, birleşik kesin aralık kurulamaz. |
| C04 | Çıkışta **ortalama %20–30** slip | DG14, PDF s.1: çıkışta **%40–50** ve ~%50'ye yaklaşma; inişte **>%20 skid**. Ortalama %20–30 verilmemiş. Tepe değeri, ortalamayı tek başına çürütmez. | **OKUNAMADI** — belirtilen ortalama teyit edilemedi. |
| C05 | Güvenlik sınırı aşılmadığı bu ortalamadan biliniyor | DG14 otomatik limit için bu sonucu vermiyor; ortalama, anlık/ardışık-adım koruma eşiğiyle karşılaştırılamaz. | **OKUNAMADI** |

DG14'ten kısa alıntı: “slip of 40-50%” (PDF s.1). ZF20'deki sayılar megaripple morfoloji makalesinin **A17'den aktardığı** değerlerdir; yeni bağımsız slip ölçümü diye sunulmadı. ZF20 §4.2 ayrıca %78'e kadar çıkış slip aktarıyor. Bu fark varken 2014 ve 2017/2020 değerleri tek bir sorunsuz ölçüm dizisi gibi birleştirilmemeli. A14'ün kendi §7 verisi, ilk 360 sol boyunca çoğunlukla yaklaşık 1 cm veya daha az batmadır; Dingo Gap'in sayısı değildir.

## D. REMS sıcaklık ve basınç aralıkları (2026-11-15)

[GE12 — Gómez-Elvira vd. 2012 açık yazar kopyası](https://aeolisresearch.com/papers/REMS_paper.pdf) bir **cihaz/tasarım/kalibrasyon** makalesidir. §4.14, PDF s.53: GTS ve ATS için **150–300 K ölçüm aralığı**, basınç için **4–12 hPa kalibrasyon aralığı** verir. Kısa alıntı: “will measure the ground brightness temperature”. Bu aralıklar Gale'de kaydedilmiş günlük minimum/maksimum değildir.

[H14 — Haberle vd. 2014 açık tam metin](https://repository.si.edu/bitstream/handle/10088/30823/Haberle_et_al-2014-Journal_of_Geophysical_Research%253A_Planets.pdf?isAllowed=y&sequence=1) **ilk 100 sol**, Ls=151–208° kapsamındadır. Özgün başlık raporda kısaltılmıştır: *Preliminary interpretation of the REMS pressure data from the first 100 sols of the MSL mission*.

| ID | İddia | Okunan birincil kaynak / yer | Sonuç |
|---|---|---|---|
| D01 | Zemin −95…+15 °C = 178…288 K ölçülmüş aralık | GE12 böyle bir ölçüm serisi vermiyor; §4.14 cihaz aralığı veriyor. H14 sıcaklık uçları bu zemin aralığını doğrulamıyor. | **REDDEDİLDİ** — bu iki kaynakla “ölçüm teyidi” iddiası; sayının tüm Gale tarihçesinde imkânsızlığı değil. |
| D02 | Zemin günlük salınımı 80–100 K | GE12/H14'te bu aralığın ilgili zemin ölçüm tablosu bulunamadı. D01 uçları arasındaki fark ayrıca 110 K'dir; tipik gün ile tüm dönem uçları ayrılmalı. | **OKUNAMADI** |
| D03 | En soğuk 05:30, en sıcak 13:30 | İncelenen kaynaklarda bu kesin saat çifti, sol ve LTST/LMST tanımıyla doğrulanmadı. | **OKUNAMADI** |
| D04 | Hava −85…−5 °C = 188…268 K | H14 **s.443**, §3.2: o dönem için tipik min/maks/ortalama **195/275/225 K**. Rapordaki uçlar bu kaynaktan çıkmıyor. | **REDDEDİLDİ** — atıf ve ölçüm kapsamı bakımından. |
| D05 | Hava günlük salınımı 60–75 K; gündüz zeminden 10–20 °C soğuk | H14'teki 195/275 K uçları arası 80 K; bu, raporun günlük dağılımını veya eşzamanlı zemin-hava farkını doğrulamaz. | **OKUNAMADI** |
| D06 | Hava sensörü yüksekliği 1,5 m | GE12 §4.1, PDF s.13: boomlar yüzeyden **yaklaşık 1,6 m**. | **KISMEN** — yaklaşık yükseklik; metindeki kaynaklı sayı 1,6 m. |
| D07 | Basınç 710–930 Pa = 7,1–9,3 mbar | H14 **s.441**, §3.2: günlük ortalama **739,8 Pa (sol 10) → 829,8 Pa (sol 100)**. 710–930 Pa, bu metinde doğrulanmış yıllık aralık değil. Birim dönüşümü doğru. | **KISMEN** — dönüşüm doğru, belirtilen gözlem aralığı doğrulanmadı. |
| D08 | Günlük basınç salınımı 80–110 Pa | H14 **s.442**, §3.2/Şekil 2: ortalama **85 Pa tepeden tepeye**; s.446–447'de başlangıç için ~95 Pa karşılaştırması. | **KISMEN** — ölçek desteklenir; 80–110 Pa'nın kapsamlı min/maks aralığı teyit edilmedi. |
| D09 | Yıllık min Ls~150°, maks Ls~260° | H14 s.441 inişi beklenen küresel yıllık minimum yakınına koyar; ilk 100 sol verisi Ls=208°'de biter. Ls~260° maksimumunu bu ölçüm serisi teyit edemez. | **KISMEN** |
| D10 | Kelvin/Celsius uç dönüşümleri | `T_C=T_K−273.15`: 178/288 K = −95,15/+14,85 °C; 188/268 K = −85,15/−5,15 °C. | **DOĞRULANDI** — yalnız aritmetik; gözlem kaynağı doğrulaması değil. |

H14'ten kısa alıntı: “85 Pa peak to peak” (s.442). Yarım genlik ile tepeden-tepeye değişim, günlük ortalama ile anlık uç ve cihaz kalibrasyon aralığı ile gözlem aralığı ayrılmalıdır. Önerilen düzeltme, kaynağı olmayan genel uçları H14'ün açıkça belirtilmiş dönem değerleriyle değiştirmek ya da boş bırakmaktır; burada uygulama değiştirilmedi.

## E. UV: gerçek sayılar, yanlış atıf (2026-11-15)

**Doğru çalışma [UV25]:** Viúdez-Moreiras, D.; Zorzano, M.-P.; Lemmon, M. T.; Fairén, A. G.; Saiz-Lopez, A.; Smith, M. D. (**2025**), *Ultraviolet and biological effective dose observations at Gale Crater, Mars*, **PNAS 122(21), e2426611122**, DOI **10.1073/pnas.2426611122**. [PubMed](https://pubmed.ncbi.nlm.nih.gov/40354557/), [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12130865/), [okunan açık yazar tam metni](https://www.researchgate.net/publication/391675044_Ultraviolet_and_biological_effective_dose_observations_at_Gale_Crater_Mars). PMC doğrudan isteği CAPTCHA verdi; RG tam metni s.3 ve s.5 okunabildi.

| ID | İddia | Birincil kaynakta bulunan / sayfa-tablo | Sonuç |
|---|---|---|---|
| E01 | Vicente-Retortillo 2017; belirtilen başlık; DOI 10.1073/pnas.2001424117 | [DOI'nin gerçek açık tam metni](https://pmc.ncbi.nlm.nih.gov/articles/PMC7261083/): **Schoch, Werneburg & Voigt 2020**, *A Triassic stem-salamander from Kyrgyzstan and the origin of salamanders*, PNAS 117(21), 11584–11588. | **REDDEDİLDİ** — konu dahil tüm atıf eşleşmesi yanlış. |
| E02 | Toplam UV **27,0–42,4 W/m²** | UV25 **s.3, Results**: bağımsız chUVABC kanalından aynı aralık. Bantların toplamı ayrıca 26,9–42,3. | **DOĞRULANDI** — doğru kaynak ve aşağıdaki örnekleme koşullarıyla. |
| E03 | UVA **21,4–33,7 W/m²** | UV25 **s.3 ve s.5 Tablo 1**: aynı. | **DOĞRULANDI** |
| E04 | UVB **4,21–6,45 W/m²** | UV25 **s.3 ve s.5 Tablo 1**: aynı. | **DOĞRULANDI** |
| E05 | UVC **1,39–2,21 W/m²** | UV25 **s.3 ve s.5 Tablo 1**: aynı. | **DOĞRULANDI** |
| E06 | Ortalama paylar UVA %79,6; UVB %15,3; UVC %5,1 | UV25 **s.3**, Tablo 1 çevresi: aynı ortalama paylar. | **DOĞRULANDI** — sabit spektral oran değildir. |
| E07 | UVA 315–400; UVB 280–315; UVC 200–280 nm | UV25 **s.5 Tablo 2**: aynı bantlar; bunlar düzeltilmiş/geri kazanılmış bant akılarıdır. | **DOĞRULANDI** — REMS ham kanal bantlarıyla karıştırılmamalı. |
| E08 | Toz fırtınalarında UV yalnız %30–50 bloke olur | UV25 **s.3 ve s.5 Tablo 1**: yüksek tozlu 2018 GDS'de UV zayıflaması yaklaşık **%90 ve üzeri**. | **REDDEDİLDİ** — genel fırtına aralığı diye kullanılamaz; karşılaştırılan referans akı da belirtilmeli. |
| E09 | Gece bütün kanalların ölçülmüş minimumu tam 0 W/m² | UV25'in burada kullanılan tablosu gündüz maksimumlarını inceler; gece ölçüm alt sınırı tablosu değildir. | **OKUNAMADI** |

**Koşul:** UV25 Tablo 1 uçları GDS dışındaki **beş solluk dönemler** üzerinden; s.3'teki analiz öğle günlük maksimumlarını kullanıyor. “Tipik günlük salınım” ya da her sol için minimum/maksimum değildir. Kısa alıntı: “excluding the GDS period”. Belirsizlikler s.5 Tablo 2'de UV/UVA **%7,1**, UVB **%7,8**, UVC **%11,2 (1σ)**. Sayılar düzeltilebilir bir kaynak hatasıdır; doğru sayılar yanlış DOI yüzünden tümden uydurma ilan edilmemeli.

## F. Lapotre 2016 ve Ewing 2017: dalgacık ölçekleri (2026-11-15)

[L16 — Lapotre vd. açık tam metin](https://sseh.uchicago.edu/doc/Lapotre_et_al_Science_2016.pdf), **Science 353(6294), 55–58**, DOI 10.1126/science.aaf3206, okundu. [EW17 — Ewing vd. açık yayıncı tam metni](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1002/2017JE005324), DOI 10.1002/2017JE005324, okundu. EW17'nin gerçek başlığı *Sedimentary processes of the Bagnold Dunes: Implications for the eolian rock record of Mars*, künyesi **122(12), 2544–2573**; girdi raporundaki başlık ve 2244–2273 sayfaları yanlış.

| ID | İddia | Birincil kaynakta bulunan / sayfa-şekil | Sonuç |
|---|---|---|---|
| F01 | Darbe dalgacığı λ=10–30 cm; tipik 18–22 cm | L16 **s.56**, Mastcam paragrafı: **~5–12 cm**; EW17 §4.1 yaklaşık **8 cm** ortalama. | **REDDEDİLDİ** — bu Bagnold gözlemlerinin kaynaklı aralığı olarak. |
| F02 | Darbe dalgacığı H=1–3 cm; H/λ=0,08–0,10 | L16 ana metninde bu yükseklik/aralık yok; ilgili ek sayısal veri okunamadı. | **OKUNAMADI** |
| F03 | Büyük ripple λ=1–3 m, Lapotre'nin kesin aralığı | L16 **s.55** genel Mars örnekleri **1–5 m**; EW17 §4.1'de ortalama **2,1 m**, n=158. | **KISMEN** — metre ölçeği doğru, kesin aralık atfı aşırı dar. |
| F04 | Bagnold ortalama λ=2–2,5 m | EW17 §4.1: **2,1 m** ortalama bu aralıkta; sahaya ve örneklemine bağlı. | **DOĞRULANDI** — aralıkla uyumlu ortalama, bütün Gale için sabit değil. |
| F05 | Büyük ripple H=10–35 cm; tipik 15–25 cm | EW17 **özet; §4.1 Şekil 5b; §4.2 Şekil 9b–d**: ölçülen relief **12–28 cm**; ayrı profiller 12/16/28 cm. | **KISMEN** — büyüklük yakın; rapordaki uçlar/tipik aralık ölçülmüş aralık olarak verilmemiş. |
| F06 | H/λ=0,08–0,12 evrensel oran | İncelenen metinlerde bu sabit aralık yok; yükseklikle dalga boyu aynı profile eşlenmeden oran kurulamaz. | **OKUNAMADI** |
| F07 | Bütün büyük ripple stoss 8–12°, lee 28–33° | L16 **s.56** lee ~30°. EW17 **Şekil 9** lee profilleri yaklaşık **15/25/29°**; §4.1'deki 7–10° stoss modları **kumul** içindir. | **REDDEDİLDİ** — bütün ripple'lara uygulanan aralık ve ölçek karışımı. |
| F08 | TAR/megaripple λ=5–50 m; H=0,5–3 m, bu iki makaleden kesin Gale aralığı | Bu kapsamda böyle bir ölçüm tablosu okunamadı; dunes/large ripples/TARs tek sınıf değildir. | **OKUNAMADI** |
| F09 | 2,5 m ripple tepe-çukur yüksekliği **en fazla 20–25 cm** olmalı | EW17'nin Gobabeb ölçümü **28 cm**, Şekil 9b; evrensel üst sınır verilmez. | **REDDEDİLDİ** — 20–25 cm'yi fiziksel azami ilan etme; 28 cm kaydının tam λ'sı burada 2,5 m diye varsayılmadı. |
| F10 | λ=2,7 m ve genlik ±0,25 m, H/λ≈0,185 olduğu için sürtünme açısını zorunlu aşar | `0.50/2.7=0.185185` doğru; tek başına oran yerel eğimi belirlemez. Saf sinüste en dik açı `atan(2π*0.25/2.7)≈30,19°`. | **KISMEN** — aritmetik doğru, her dalga profili için fiziksel sonuç çıkmaz. |
| F11 | Önerilen `sin(kx)−0,25 sin(2kx)` formülü stoss 10° / lee 30° üretir | Girdideki A=0,10 m, λ=2,3 m ile türev `Ak[cos(kx)−0.5cos(2kx)]`; en büyük pozitif eğim **~11,58°**, negatif **~22,28°**. | **REDDEDİLDİ** — kendi formülünün türev denetimi; ölçüm iddiası değil. |
| F12 | Kodda λ=2,3 m “Lapotre nominal değeri”; kum için rüzgâr yönü 65° | L16'dan böyle bir sabit nominal parametre okunmadı; 65° için verilen Bridges atfının tam künye/veri yeri yok. | **OKUNAMADI** — seçilmiş tasarım parametreleri olarak etiketlenmeli. |

L16'dan kısa alıntı: “wavelength range of ~5 to 12 cm” (s.56). EW17'den kısa alıntı: “heights ranging between 12 cm and 28 cm” (özet). **H, tepe-çukur relief; A, sinüs yarı genliğidir**. H ile A'nın birbirine eşit yazıldığı parametreler ayrıca düzeltilmeli. Normal haritası `strength` değeri de metre cinsinden fiziksel yükseklik değildir.

## Kullanım kararı ve açık kalanlar (2026-11-15)

| Kullanılabilecek kayıt | Korunması gereken koşul |
|---|---|
| UV25 bant akıları/payları | Doğru yazar/yıl/DOI; öğle maksimumu, beş solluk örnekleme, GDS hariç ve bant tanımı. |
| H14 basınç değerleri | İlk 100 sol; günlük ortalama ve peak-to-peak ayrımı. Yıllık Gale uçları değil. |
| H13'ün 10°/17° nitel kum sonucu | Dünya rover testi; insan güvenli eğim limiti değil. |
| A17 özetindeki %30 tekerlek çapı / %77 slip | Çoklu geçişlerin özeti; Hidden Valley tek bir solunun tam profili gibi sunulmamalı. |
| EW17 2,1 m ortalama ve 12–28 cm relief | Bagnold örneklemi; evrensel dağılım veya azami yükseklik değil. |

**Kabul edilmemesi önerilenler:** kaynaklı veri gibi sunulan eğim-başına kayma/batma hücreleri; sabit %40–50 VO limiti; sol 710 vadi tahliyesi; Arvidson 2014'ten Dingo Gap teyidi; Gómez-Elvira 2012'den gözlenmiş Gale uçları; PNAS 2017 UV künyesi; bütün ripple'lara sabit geometri/eğim sınırları. “OKUNAMADI” hücreleri yanlış diye hükme bağlanmamalı; açık veri yerini alacak sayı da üretilmemeli.

**Bu tur insan eşiği üretmez:** rover batması veya slip yüzdesi, astronot taban tutuşu, metabolik katsayı ya da NO-GO eğimi değildir. Girdi raporundaki %40 enerji artışı, 45 mL kg⁻¹ dk⁻¹ “güvenli sınır” ve benzeri insan eşikleri bu kaynaklarla doğrulanmış hale gelmez; bu tur bunları kullanmayı onaylamaz.

## Kaynak künyeleri ve erişim kaydı (2026-11-15)

| Kod | Künye / okunan bağlantı | Erişim durumu |
|---|---|---|
| H13 | Heverly, M. vd. (2013). *Traverse Performance Characterization for the Mars Science Laboratory Rover*. **JFR 30(6), 835–846**, DOI 10.1002/rob.21481. [Yayıncı özeti](https://onlinelibrary.wiley.com/doi/abs/10.1002/rob.21481); [RG kaydı](https://www.researchgate.net/publication/260283339_Traverse_Performance_Characterization_for_the_Mars_Science_Laboratory_Rover). | Özet okundu; `/full/` özete döndü; RG “No full-text available”. Tam sayısal tablo **okunamadı**. |
| S14 | Stein, N. T.; Arvidson, R. E. (2014). *Artemis Simulation of Curiosity Rover Traverses*. **45th LPSC, #1281**. [Tam iki sayfa](https://www.hou.usra.edu/meetings/lpsc2014/pdf/1281.pdf). | Metin ve şekil açıklamaları okundu; grafik noktaları sayısallaştırılmadı. |
| A17 | Arvidson, R. E. vd. (2017; çevrim içi 2016). *Mars Science Laboratory Curiosity Rover Megaripple Crossings up to Sol 710 in Gale Crater*. **JFR 34(3), 495–518**, DOI 10.1002/rob.21647. [Özet](https://onlinelibrary.wiley.com/doi/abs/10.1002/rob.21647); [RG](https://www.researchgate.net/publication/297790794_Mars_Science_Laboratory_Curiosity_Rover_Megaripple_Crossings_up_to_Sol_710_in_Gale_Crater). | Özet okundu; yayıncı full özete döndü, RG tam metin sunmuyor. Olay ayrıntıları **okunamadı**. |
| P16 | Arvidson, R. E.; Maimone, M.; Gildner, M. W.; Hines, E. K. (2016). *Curiosity Rover Mobility Issues Crossing Martian Megaripple Fields*. **47th LPSC, #1137**. [JPL poster](https://www-robotics.jpl.nasa.gov/media/documents/lpsc_2016_arvidson_ripple_crossing.pdf). | Tam tek sayfa okundu. Posterin kaynakçasında DOI yazım hatası var; kaynakça dizgesi düzeltilmiş DOI diye aynen kopyalanmadı. |
| R21 | Rankin, A.; Maimone, M.; Biesiadecki, J.; Patel, N.; Levine, D.; Toupet, O. (2021). *Mars curiosity rover mobility trends during the first 7 years*. **JFR 38(5), 759–800**, DOI 10.1002/rob.22011. [JPL açık PDF](https://www-robotics.jpl.nasa.gov/media/documents/ROB-20-0040_R3.pdf); [yayıncı](https://onlinelibrary.wiley.com/doi/abs/10.1002/rob.22011). | Yayıncı özeti ve PDF'nin arama dizini parçaları okundu. PDF tam ayrıştırılamadı; ilgili sayfa numarası **doğrulanmadı**. RG yalnız önizleme. |
| D24 | Dibb, S. D.; Hardgrove, C.; Lightholder, J.; Heffern, L.; Ehresmann, B. *Observed Correlation Between Local Topography and Passive Neutron Measurements from the Dynamic Albedo of Neutrons (DAN) Instrument on the Mars Science Laboratory (MSL) Rover*. [NASA NTRS 20240015813, açık yazar metni](https://ntrs.nasa.gov/api/citations/20240015813/downloads/20240015813-Dibb%20et%20al%20202X%20-%20Observed%20correlation.pdf). | §3.1 ve Şekil 3 zaman çizelgesi okundu. NTRS 2024 kimliği; eldeki dosya “manuscript submitted” sürümü. Dergi yıl/cilt/sayfa uydurulmadı. |
| A14 | Arvidson, R. E. vd. (2014). *Terrain physical properties derived from orbital data and the first 360 sols of Mars Science Laboratory Curiosity rover observations in Gale Crater*. **JGR Planets 119(6), 1322–1344**, DOI 10.1002/2013JE004605. [Açık tam metin](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1002/2013JE004605). | Başlık/özet, §7 ve ilgili batma açıklamaları okundu; Dingo Gap atfı reddedildi. |
| DG14 | Stein, N. T.; Arvidson, R. E.; Bellutta, P.; Heverly, M. (2014). *Artemis Simulation of Curiosity Rover Traverse Across Dingo Gap*. **8th International Conference on Mars, #1081**. [Tam metin](https://www.hou.usra.edu/meetings/8thmars2014/pdf/1081.pdf). | Açık iki sayfa; gözlem ile simülasyon cümleleri ayrılarak okundu. |
| ZF20 | Zimbelman, J. R.; Foroutan, M. (2020). *Dingo Gap: Curiosity Went Up a Small Transverse Aeolian Ridge and Came Down a Megaripple*. **JGR Planets 125(12), e2020JE006489**, DOI 10.1029/2020JE006489. [Tam metin](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2020JE006489). | §4.2 okundu; A17'den aktardığı slip değerleri bağımsız yeni ölçüm sayılmadı. |
| GE12 | Gómez-Elvira, J. vd. (2012). *REMS: The Environmental Sensor Suite for the Mars Science Laboratory Rover*. **SSR 170, 583–640**, DOI 10.1007/s11214-012-9921-1. [Açık yazar PDF](https://aeolisresearch.com/papers/REMS_paper.pdf); [yayıncı](https://link.springer.com/article/10.1007/s11214-012-9921-1). | Yayıncı abonelik önizlemesi; alternatif 58 sayfalık metinde §4.1/4.14 okundu. PDF'de dergi sayfaları basılı değil; dosya sayfası kullanıldı. |
| H14 | Haberle, R. M. vd. (2014). *Preliminary interpretation of the REMS pressure data from the first 100 sols of the MSL mission*. **JGR Planets 119, 440–453**, DOI 10.1002/2013JE004488. [Smithsonian açık kopyası](https://repository.si.edu/bitstream/handle/10088/30823/Haberle_et_al-2014-Journal_of_Geophysical_Research%253A_Planets.pdf?isAllowed=y&sequence=1). | Açık tam metin; özellikle §3.2 ve Şekil 1–2 okundu. |
| UV25 | Viúdez-Moreiras vd. (2025), yukarıdaki doğru künye. [Açık yazar tam metni](https://www.researchgate.net/publication/391675044_Ultraviolet_and_biological_effective_dose_observations_at_Gale_Crater_Mars); [kalıcı DOI](https://doi.org/10.1073/pnas.2426611122). | Results, Tablo 1–2 okundu; PMC CAPTCHA, yayıncı isteği sonuç vermedi. |
| X20 | Schoch, R. R.; Werneburg, R.; Voigt, S. (2020). *A Triassic stem-salamander from Kyrgyzstan and the origin of salamanders*. [PMC tam metin](https://pmc.ncbi.nlm.nih.gov/articles/PMC7261083/), DOI 10.1073/pnas.2001424117. | DOI/başlık/yazar/yıl ilk sayfadan doğrulandı; Mars UV verisi değildir. |
| L16 | Lapotre, M. G. A. vd. (2016). *Large wind ripples on Mars: A record of atmospheric evolution*. **Science 353(6294), 55–58**, DOI 10.1126/science.aaf3206. [Okunan PDF](https://sseh.uchicago.edu/doc/Lapotre_et_al_Science_2016.pdf); [kurumsal kayıt](https://authors.library.caltech.edu/records/ctwqe-jcm25). | Ana metin okundu. Caltech indirme yönlendirmesi/ek dosya erişimi başarısız; eklerin sayısal yükseklik tablosu okunmadı. PDF'de erratum işareti mevcut; ayrı erratum kapsamı bu tur doğrulanmadı. |
| EW17 | Ewing, R. C. vd. (2017). *Sedimentary processes of the Bagnold Dunes: Implications for the eolian rock record of Mars*. **JGR Planets 122(12), 2544–2573**, DOI 10.1002/2017JE005324. [Açık yayıncı metni](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1002/2017JE005324). | HTML tam metin §4.1/4.2, Şekil 5/9 okundu. Caltech PDF boyut/zaman sınırına takıldı; HTML alternatifinden doğrulandı. |

## Teslimat denetimi (2026-11-15)

**53 denetim satırı:** 9 DOĞRULANDI, 13 KISMEN, 12 REDDEDİLDİ, 19 OKUNAMADI. Bir satır birden fazla ilişkili sayıyı içerebilir; bu, benzersiz fiziksel parametre adedi değildir. Salt-okuma Python denetimi UTF-8 okumayı, tarihli başlıkları, benzersiz satır kimliklerini ve girdi dosyasının SHA-256 değerinin değişmediğini doğruladı. Dalga türevlerinin aritmetiği ayrıca hesaplandı: 30,1898°; 11,5789° / 22,2825°.

Katsayı veya grafik noktası tahmin edilmedi; okunamayan kaynak için sayfa/table numarası icat edilmedi. Aritmetik kontroller: tekerlek batması dönüşümü, yüzde/birim dönüşümleri ve iki dalga formülünün analitik türevleri. Bunlar bilimsel ölçüm teyidinden ayrı işaretlendi. Hüküm, gözlenmeyen veri için “uydurmadır” demek yerine hangi atfın yanlış, hangi değerin okunmuş ve hangisinin hâlâ okunamamış olduğunu ayırır.
