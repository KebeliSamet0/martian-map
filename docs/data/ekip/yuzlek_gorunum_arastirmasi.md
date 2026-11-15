# Gale yüzlek (outcrop) görünümü araştırması — 2026-11-15

Erişim tarihi: 2026-11-15 (yaklaşık 10:12 TRT; kaynak bazında saniye kaydı tutulmadı). Kod/sim dosyaları değiştirilmedi.

## Sonuç

Gale yüzlekleri tek tip alçak kaya değildir: ince tabakalı çamurtaşı, kırıklı/nodüllü ana kaya, sırtlar, butte/mesa ve kumla kısmen örtülmüş yüzeyler gözlenir. Gale için evrensel yükseklik/çap oranı veya yüzlek PBR albedo/RGB tablosu bulamadım. Dolayısıyla “yükseklik ≈ çapın %13'ü” varsayımı kaynaklı bir Mars ölçümü olarak savunulamaz.

Yüzleği bağımsız yuvarlak kaya yerine DTM'ye bağlı, tabakalı/kırıklı ana kaya çıkıntısı olarak temsil etmek daha savunulabilir. Gölge sınıfı/algılayıcı çıktısını da ölçülmüş kaya veya yüzlek geometrisi diye sunmamak gerekir.

## 1. Morfoloji ve ölçülebilen ölçek

| Gale örneği | Birincil kaynakta görülen | Kapsam sınırı |
|---|---|---|
| Murray / Pahrump Hills — Whale Rock | Mastcam'de çapraz tabakalanma; açıklamada ölçek 30 cm. Renk, gündüz Dünya ışığına benzeyecek biçimde yaklaşık beyaz dengeli. [NASA Photojournal](https://science.nasa.gov/resource/martian-rocks-evidence-of-lake-currents/) | Tabakalar düz/eğik kesişebilir; görsel Earth-white-balanced, fiziksel Mars rengi değil. Ölçülmüş 3B dış sınır yok. |
| Glenelg — Point Lake | NASA, bu pütürlü outcrop'ı “bu açıdan” yaklaşık 2 m geniş × 0,5 m yüksek veriyor. İki sayının oranı 0,25'tir. [PIA17071](https://science.nasa.gov/photojournal/point-lake-outcrop-in-gale-crater/) | Tek bakış açısına göre boyut; 3B ölçüm ya da Murray/Glen Torridon ortalaması değil. Mevcut %13 oranı için karşı örnek, evrensel alternatif değil. |
| Kimberley — Mount Remarkable | Navcam açıklamasında butte yaklaşık 5 m yüksek; çevresinde farklı kaya katmanları ve tabandaki daha düz ayrı outcrop var. [NASA resource](https://science.nasa.gov/resource/mount-remarkable-and-surrounding-outcrops-at-mars-rovers-waypoint/) | 5 m butte ölçüsü; yerel kaya plakasına uygulanamaz. |
| Murray Buttes | Mastcam: eğimli butte'ler ve tabakalı yüzlekler; butte/mesa'lar antik kumtaşı kalıntısı, cross-bedding rüzgârla taşınan kumul tabakalanmasıdır. [PIA21042](https://science.nasa.gov/photojournal/farewell-to-murray-buttes-image-2/) | Murray çamurtaşı ile Stimson kumtaşını aynı doku/forma indirgememek gerekir. |
| Glen Torridon | Bennett et al. Mastcam/MAHLI görselleri: aşınmış “rubbly” doku, kırıklı/bloklu ana kaya, ince-kalın laminasyon. Woodland Bay MAHLI eki ~10×15 cm, ölçek 3 cm. Butte çevresinde ~10 m ek stratigrafik düşey görünüm, tek taş boyutu değildir. Fig. 7, 10, 12–18; §4.2.3. [NASA NTRS, DOI 10.1029/2022JE007185](https://ntrs.nasa.gov/api/citations/20230001618/downloads/JGR%20Planets%20-%202022%20-%20Bennett%20-%20The%20Curiosity%20Rover%20s%20Exploration%20of%20.pdf) | Farklı ölçekte laminasyon, kırık, nodül/damar ve sarp tabakalı yüzler var. 10 m ifadesi strata/outcrop bağlamı. |
| Boxwork / Mount Sharp | JPL PIA26693: düşük sırtlar ve hollows; panorama 179 Mastcam karesinden birleştirilmiş, Mars'ta insanın göreceği doğal renge yaklaşık. 2026 NASA/JPL haberi sırt yüksekliğini ~1–2 m, hollows'u kumlu tanımlar. [PIA26693](https://www.jpl.nasa.gov/images/pia26693-curiosity-surveys-the-boxwork-region/) · [JPL açıklaması](https://www.jpl.nasa.gov/news/nasas-curiosity-rover-sees-martian-spiderwebs-up-close/) | 1–2 m sadece boxwork sırtı için; kaynakta sırt genişliği/çapı yok. Kumu ve sağlam kaya sırtını bir katı mesh sayma. |
| Örtü/toz | Glen Torridon alt Jura nispeten en az tozlu saha olarak tanımlanır; Greenheugh temasları yer yer kum/döküntüyle örtülüdür ve kırılmış kayada açık tonlu taze yüzey açığa çıkar. Bennett et al. §5.3, Fig. 16, aynı NTRS kaynağı. | Örtü mekânsal olarak değişir. Toz kalınlığı veya örtülme yüzdesi bu taramada ölçülmüş parametre olarak bulunmadı. |

**Karar:** Gale'nin tüm yüzleklerine ait temsilî yükseklik/çap oranı, Murray–Glen Torridon boyut dağılımı, 3B genişlik/derinlik ve örtü yüzdesi **doğrulanmadı**. Point Lake 2×0,5 m, Mount Remarkable ~5 m butte ve boxwork 1–2 m sırt birbirinden ayrı jeolojik ölçeklerdir. %13 evrensel oranı iptal edilmeli/yalnızca açıkça “temsili sanatçı geometrisi” diye etiketlenmeli. Öneri (çıkarım): iz/poligonu DTM'ye oturt; tabakalı-kırıklı dış sınırı gerçek ortofoto/yerel DTM ile sınırla; doku ölçeği altındaki laminasyon ve nodülleri kabartı yüksekliğine çevirmeden normal/albedo ayrıntısı yap.

## 2. HiRISE gölgesinden kaya/yüzlek ayrımı

HiRISE gölge algoritmaları karanlık gölge alanını ölçüp varsayılan kaya modeliyle boulder yüksekliği/çapı çıkarır. MBARS, gölge oluşturan krater/knob gibi topoğrafyanın hatalı kaya ölçüsü üretebildiğini söyler; test alanı seçerken bariz gölge oluşturan topoğrafyadan kaçınılır. Tipik HiRISE çözünürlüğünde ≳1 m objeler çözülebilir, ancak örnek boyut belirsizliği ±37,5 cm; alçak güneş geliş açısında kısa gölgeler algılanmayabilir. Hood et al. 2022, §§2.1, 2.4, 3.3–3.4, DOI 10.1029/2022EA002410. [Açık AGU tam metin](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2022EA002410)

Gale MSL iniş yeri çalışmasında büyük gölgeli escarpment'lar kaya olmayan yanlış aday oldukları için özellikle elenmiştir. İniş elipsi için ortalama CFA %5,8±1,4 (başka fit yöntemiyle %3,9±3,0) raporlanır; gölgeler HiRISE'ta ölçülür, 1,5–2,25 m kaya çaplarından SFD modeline uydurulur. Bunlar **iniş elipsi ve rover iniş tehlikesi** bağlamıdır; boxwork/Glen Torridon yüzeyinin yerel taş oranı değildir. Golombek et al. 2012, §9.4, Fig. 9, Table 14, s.689–691. [Smithsonian açık tam metni](https://repository.si.edu/server/api/core/bitstreams/02f9c873-4427-4044-bcb0-ec9341d12ba0/content)

Golombek et al. >1,5 m kaya SFD'lerinin lander ölçümlerinden türetilen üstel modellerle tutarlı olduğunu ve daha küçük boylara model ekstrapolasyonu yapıldığını belirtir. Bu SFD'yi outcrop alanına veya boxwork sırt sıklığına uygulamak desteklenmiyor. Aynı makale yüzleklerin termal ölçekte kaya gibi görünürken tekil kaya tehlikesi olmayabileceğini de tartışır.

| Soru | Bulgu | Raporlama/çizim |
|---|---|---|
| Sırt/duvar gölgesi kaya sanılabilir mi? | Evet; MBARS topoğrafik gölge kaynaklarını hata sayar; Gale iniş çalışması escarpment adaylarını ayıklar. | Stereo/DTM ve görüntü teyidi yoksa “gölge tabanlı aday” de; boulder diye kesinleştirme. |
| Gölge rasterı 3B kaya mı? | Hayır; gölge maskesi doğrudan kaya yüzeyi ölçümü değildir. | Shadow polygonını ayrı cisim gibi çizme. Veri sözlüğü doğrulanana dek çizme veya “doğrulanmamış algılayıcı artığı” olarak ayır. |
| Kaya yoğunluğu üstel dağıtılabilir mi? | Evet, fakat kaynak Gale iniş elipsi büyük kaya sayımlarından SFD modeli kuruyor. | Yaya yüzeyindeki outcrop veya <1 m boyutlar için yerel sıklık çıkarımı yapma. |

**BoulderNet notu:** Prieur et al. (2023) BoulderNet'i Dünya, Ay ve Mars'tan 33 binden fazla elle işaretli boulder ve 750'den fazla görüntü döşemesiyle eğitmiş; test veri setindeki elle çizimlere göre IoU>50% koşulunda ortalama precision %72, recall %64 raporlamış. Bu çok gezegenli boulder maskesi modelidir; Gale/Murray outcrop sınıflandırma doğruluğu değildir. [DOI 10.1029/2023JE008013, abstract](https://agupubs.onlinelibrary.wiley.com/doi/abs/10.1029/2023JE008013)

## 3. Renk, albedo ve PIA kullanım notu

| Kaynak kanıtı | Birebir kısa alıntı | Anlamı |
|---|---|---|
| NASA PIA17071, Point Lake | “The color has been approximately white-balanced to show what the rock would look like if it were on Earth.” | Bu renkli sürümden Mars fiziksel albedosu çıkarılmaz; sayfa ham kamera rengi Figure 1'i de sunuyor. |
| NASA PIA21042 | “Credits: NASA/JPL-Caltech/MSSS” | PIA sayfasındaki kredi satırı aynen tutulmalı; ayrıca sayfada ayrı lisans/copyright cümlesi görmedim. |
| JPL PIA26693 | “This natural color view is approximately how the scene would appear to an average person if they were on Mars.” | Doğal renk görünüşü olarak nitelenmiş, sayısal albedo/RGB/PBR tablosu değil. Kredi NASA/JPL-Caltech/MSSS. |
| Jacob et al. 2020, §4.2 | Mastcam ham DN değerleri onboard kalibrasyon hedefiyle reflectance niceliklerine çevrilir ve kalibrasyon hedefindeki toz için düzeltme yapılır. [DOI 10.1029/2019JE006290](https://agupubs.onlinelibrary.wiley.com/doi/full/10.1029/2019JE006290) | Görüntü RGB'si fiziksel PBR baseColor'a eşit değildir. |
| Gómez-Elvira et al. | Gale enerji dengesi hesabında TES kaynaklı geniş alan albedo girdisi 0,20–0,25. [DOI 10.1002/2014JE004618](https://agupubs.onlinelibrary.wiley.com/doi/10.1002/2014JE004618) | Belirli outcrop/MAHLI I/F ölçümü ya da her mesh'e uygulanacak PBR değeri değil. |

**PBR yönlendirmesi:** Belirli Gale yüzleği için fiziksel 3-kanal albedo/baseColor aralığı **doğrulanmadı**. Nitel görünüş olarak Murray açık tonlu sedimenter kaya; Glen Torridon gri/açık-orta tonlu, kırıklı/nodüllü/damarlı ve yer yer açık taze kırık yüz; toz/kum örtüsü değişken kullanılabilir. Bunu kaynaklı spektral LUT gibi adlandırma. NASA Media Guidelines: “You may use this material for educational or informational purposes”; aynı sayfa NASA sitesindeki kimi materyallerin üçüncü taraf telifli olabileceğini söyler. PIA kredileri korunmalı; kredi satırı tek başına genel lisans izni değildir. [NASA görsel yönergeleri](https://www.nasa.gov/nasa-brand-center/images-and-media/?linkId=892614809)

## 4. Sim ipucu önerisi

> Bu yüzlek, yörünge görüntüsündeki şekil/gölge algısından türetilmiş bir adaydır; 3B yüksekliği veya kaya türü yerinde ölçüm değildir.

“Tespit” algılayıcı sınıfı; “ölçüm” konum/ölçek/geometriyi ölçüm verisiyle belirlemedir. Ürün metadata'sında yalnız shadow yazıyorsa bunu doğrulanmış yüzlek kabul etme.

## Mars'a özgü parametre kontrol listesi

| Alan | Durum |
|---|---|
| Mars/Gale yüzlek geometrisi | Birkaç yerel örnek sayısal; evrensel oran ve dağılım doğrulanmadı. Dünya veya Ay oranı Mars verisi diye kullanılmadı. |
| Renk/albedo | Mastcam kalibrasyon yöntemi kaynaklı; belirli outcrop fiziksel RGB/PBR değeri doğrulanmadı. TES 0,20–0,25 geniş alan model girdisi. |
| Toz/kum | Glen Torridon/Greenheugh/boxwork için nitel yerinde/rover gözlemi; yerel örtü kalınlığı ve yüzdesi doğrulanmadı. |
| Gölge algısı | HiRISE, güneş açısı ve topoğrafyaya bağlı gölge ölçümü; escarpment kaynaklı yanlış adaylar belgeli. |

## Taranıp kullanılmayan / okunamayan kaynaklar

- Meyer et al. (2022), “Orbital and In-Situ Investigation of Periodic Bedrock Ridges in Glen Torridon, Gale Crater, Mars,” DOI 10.1029/2021JE007098: PMC reCAPTCHA; Wiley 403. Arama metadata/figür açıklaması görüldü, birincil tam metin okunamadı; sayısal değer alınmadı.
- NASA PIA23047 “Curiosity on the Clay Unit” sayfası incelendi; Glen Torridon ve Sol 2316 tanımı var, nicel outcrop ölçüsü yok. [NASA sayfası](https://science.nasa.gov/photojournal/curiosity-on-the-clay-unit/)
- Başka Gale spektral yayınlarının arama sonuçları tarandı; yüzlek için kullanılabilir sayısal PBR/albedo tablosu doğrulanmadı.
- Golombek kaya CFA sonucu rover iniş elipsiyle sınırlı; mevcut sim rasterına yerel etiket sağlamaz.

## Kaynakça

1. Bennett, K. A. et al. (2023), “The Curiosity Rover's Exploration of Glen Torridon, Gale Crater, Mars: An Overview of the Campaign and Scientific Results,” JGR: Planets 128, e2022JE007185, DOI 10.1029/2022JE007185. NASA NTRS açık tam metin yukarıda.
2. Golombek, M. et al. (2012), “Selection of the Mars Science Laboratory Landing Site,” Space Science Reviews 170, 641–737, DOI 10.1007/s11214-012-9916-y. Smithsonian tam metin yukarıda.
3. Hood, D. R. et al. (2022), “The Martian Boulder Automatic Recognition System, MBARS,” Earth and Space Science 9, e2022EA002410, DOI 10.1029/2022EA002410. AGU tam metin yukarıda.
4. Jacob, S. R. et al. (2020), “Spectral, Compositional, and Physical Properties of the Upper Murray Formation and Vera Rubin Ridge,” JGR: Planets 125, e2019JE006290, DOI 10.1029/2019JE006290.
5. NASA/JPL Photojournal: PIA17071, PIA21042, PIA23047, PIA26693; bireysel URL'ler yukarıda.
