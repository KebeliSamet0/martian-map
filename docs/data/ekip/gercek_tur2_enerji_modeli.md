# Gerçek parametre araştırması — ikinci tur (2026-11-15)

**Sonuç:** 0,378 ile bütün metabolik gücü çarpmak için doğrulanmış bir Mars yürüme modeli bulunmadı. Açık bir yazar tezinde regresyon katsayıları bulundu; değişken kodlaması çözülemediğinden çalıştırılabilir Mars modeli olarak önerilmiyor. Kullanılabilir çözüm, eşleşen deney verileriyle yerçekimi enterpolasyonu ve açık belirsizlik kaydıdır; sayısal veri eksikken Mars watt değeri boş kalmalıdır. **3,5 km / bir saat dönüş önerisi** birincil kaynakta bulundu, ancak skafandr kapasitesine bağlı bir tasarım değerlendirmesidir. Curiosity verileri insan yürüyüşünden ayrıldı.

Erişim tarihi tüm kaynaklar için **2026-11-15**. “Kaynaklı” kaynakta gerçekten okunan bilgiyi; “türetilmiş” bu raporun hesabını; “varsayım / doğrulanmadı” deney veya tam metinle tamamlanmamış kısmı belirtir. Sayfalar, aksi belirtilmedikçe belgenin basılı sayfa numarasıdır. Kullanıcının **272 W Dünya Pandolf düz zemin referansı** girdi kabul edildi; aynı sonucun hangi kütle, hız, yük ve zeminle üretildiği bu turda doğrulanmadı. Yalnız bu teslimat dosyası yazıldı; aşağıdakiler uygulama önerileridir.

## 1. Enerji modeli: bulunanlar ve kullanılabilirlik (2026-11-15)

| Birincil çalışma | Okunan yer ve kısa birebir alıntı | Sonuç / güven / uygulamaya etkisi |
|---|---|---|
| [Kluis vd. 2025, DOI:10.1152/japplphysiol.00627.2024](https://journals.physiology.org/doi/full/10.1152/japplphysiol.00627.2024) | Yayıncı tam metin/PDF uçları 403; [yazar ResearchGate kaydı](https://www.researchgate.net/publication/395035485_Characterization_of_the_Effects_of_Sex_Speed_and_Incline_on_Metabolic_Rate_during_Partial_Gravity_Ambulation): “No full-text available”. | **2025 makalesinin regresyon katsayıları doğrulanmadı.** Arama motorunun tablo parçalarından katsayı alınmadı. Açık 2024 tez, aşağıda ayrı sürüm olarak kullanıldı; 2025 makalesiyle aynı katsayılar olduğu iddia edilmiyor. |
| [Kluis 2024, açık yazar tezi](https://www.researchgate.net/publication/394929719_A_Novel_Metabolic_Model_for_Ambulation_in_Hypogravity_and_Applications_to_Planetary_Extravehicular_Activity) | §5.1.2.4.1, s.135–137; Şekil 5-9, s.145; Tablo 5-6, s.146. Dipnot: “coefficients β are given on the scale of the linear predictor”. | **Katsayılar tam metinden okundu**, aşağıda. Deney: 12 kişi, skafandrsız ağırlık boşaltma; 0,25/0,50/0,75/1 g; 3/4 mph; %0/%10 eğim. Girdi kodlaması doğrulanmadı; doğrudan kullanılamaz. |
| [Farley & McMahon 1992](https://journals.physiology.org/doi/abs/10.1152/jappl.1992.73.6.2709) | Hakemli makalenin açık özeti, s.2709–2712: “only by 33% during walking”. | Yerçekimi %75 azaltılınca yürüyüş enerji tüketim hızı %33 azalıyor; koşuda %72. **Özet düzeyinde kaynaklı**; tam metinden regresyon, hız aralığı veya katsayı doğrulanmadı. Yürüme için doğrusal g ölçeğine deneysel karşı örnektir; Mars kalibrasyonu değildir. |
| [Kim vd. 2025, ICES-2025-129](https://ntrs.nasa.gov/api/citations/20250001829/downloads/ICES%202025%20TraverseModel.pdf) | S.7, §V: “currently limited to terrestrial applications”; s.8, Denklem 7–8. | Açık tam metinde g içeren formül var. Ancak düz zemin Pandolf terimi yine bütünüyle g ile çarpılıyor. **Kaynaklı öneri, Mars doğrulaması yok.** |
| [Ogilvie vd. 2026, ICES-2026-127](https://ntrs.nasa.gov/api/citations/20260003038/downloads/Final_ICES2026_Mars_Mass_1.pdf) | S.11, §III, “Walking Speed”, 2,2 mph için: “is an assumption that will need to be verified.” | Bir dönüş yürüyüşü senaryosu ve yaklaşık VO₂ noktası veriyor; her hız/eğim/g için yürüyüş regresyonu değil. Kaynağın kendi varsayım uyarısı korunmalıdır. |

### 1.1. Tam metinden bulunan GLMM; neden henüz üretim modeli değil? (2026-11-15)

Kluis **2024 tezi**, Tablo 5-6 / dipnotundaki Gamma dağılımı ve log bağlantısı:

```text
log(μ_i) = β0 + βv*x_v + βg*x_g + βs*x_s
           + βvg*x_v*x_g + βgs*x_g*x_s + γ_i
μ: beklenen VO₂, mL O₂ kg⁻¹ min⁻¹
γ_i: kişi rastgele kesişimi; SD = 0.051
```

| Katsayı | Tezde verilen değer ± SD |
|---|---:|
| β0 | 3.001 ± 0.022 |
| βv | 0.113 ± 0.009 |
| βg | 0.104 ± 0.009 |
| βs | 0.157 ± 0.009 |
| βvg | 0.020 ± 0.009 |
| βgs | 0.055 ± 0.009 |

**Kullanım engeli:** `x_v/x_g/x_s` için fiziksel sayı mı, kodlanmış/merkezlenmiş değer mi kullanılacağı okunan metinde doğrulanamadı. Katsayılar log ölçektedir; tablo başlığındaki VO₂ birimini her katsayıya doğrudan fiziksel birim diye vermek hatalıdır. S.144 anlatımı ile tablo/dipnot arasında hız etkileşimi adlandırması da tutarsızdır. Bu yüzden fiziksel hız/eğim değerleri bu ifadeye körlemesine konulamaz. Bunlar **2024 tez katsayılarıdır**; 2025 makalesinin katsayıları değildir. Kaynak: yukarıdaki tez, belirtilen sayfalar.

**Uygulama önerisi:** `coefficients_read=true`, `predictor_encoding_verified=false`, `mars_model_validated=false` ayrımı gerekir. Rastgele kesişimi sıfırlamak da nüfus ortalaması ve tahmin aralığı sorununu kendiliğinden çözmez. Kodlama, kovaryans ve model sürümü doğrulanmadan bu tabloyla watt üretilmemeli.

### 1.2. Kim formülü ve 272 W karşılaştırması (2026-11-15)

[Kim 2025, s.4 ve s.8, Denklem 4/7](https://ntrs.nasa.gov/api/citations/20250001829/downloads/ICES%202025%20TraverseModel.pdf): kaynakta kullanılan `W` insan kütlesidir; güç birimiyle karışmaması için burada `M` yazıldı.

```text
MP_BTU/h = 3.41 * [1.5*M*G
                   + 2.0*G*(M+L)*(L/M)^2
                   + η*G*(M+L)*(1.5*v^2 + 0.35*v*S)]
M, L: kg; v: m/s; S: yüzde eğim; η: zemin katsayısı;
G: Dünya'ya göre boyutsuz yerçekimi oranı.
```

Bu, **Denklem 7'nin cebirsel aktarımıdır**; Denklem 8 iniş düzeltmesi ve zamana bağlı modelin tamamı değildir. Geçerli Mars hız/eğim/skafandr doğrulama aralığı makaleden çıkarılamadı. `%10` burada `S=10`; derece değildir. Bu formülün düz zemin MP kısmında `G` tüm ifadeden ortak çarpan olarak çıkar. Dolayısıyla kullanıcı referansına uygulanırsa:

| Hesap | Sonuç | Anlamı |
|---|---:|---|
| Dünya referansı | 272 W | Kullanıcı girdisi; yeniden kalibre edilmedi. |
| `272 × 0.378` | **102,816 W** | Türetilmiş aritmetik; **doğrulanmış Mars yürüyüş gücü değil**. |
| Farley özetinden `1 − 0.33` | **0,67** | 0,25 g deneyindeki oransal kalan tüketim; Mars için katsayı veya güven aralığı değil. |
| Doğrulanmış `P_Mars(272 W referansı)` | **doğrulanmadı** | Eşleşen hız, gross/net güç tanımı, kütle, yük, suit ve gaz değişimi dönüşümü gerekiyor. |

**Karar önerisi:** Kim'i kaynak gösterip 102,816 W değerini “doğrulanmış” yapmak sorunu çözmez. Yerçekimini insan ve yük kütlesine uygulayıp ayrıca bütün çıktıyı G ile çarpmak ise bu aktarımdan farklı, ikinci bir ölçekleme olur. Kütle ile ağırlık ayrılmalı.

### 1.3. Deney noktalarıyla kurulabilecek enterpolasyon ve bant (2026-11-15)

**Yöntem önerisi; sayısal Mars tahmini henüz yok.** Veri ızgarası Kluis tezinin Şekil 5-9'undadır; şekil ortalama±SD ve model güven aralığını ayırır. Aşağıdaki `q` değerlerinin sayısal ordinatları güvenilir biçimde okunmadı; piksel tahmini yapılmadı. Bu nedenle boşluklar sıfır veya tahmini watt ile doldurulmadı.

| Hız | Eğim | İstenen dört deney düğümü (mL kg⁻¹ min⁻¹) | Mars'ı çevreleyen komşular | Sayısal durum |
|---|---|---|---|---|
| 3 mph = 1,34112 m/s | %0 = 0° | q(0,25), q(0,50), q(0,75), q(1) | 0,25 ve 0,50 g | Ortalama/SD ordinatları doğrulanmadı |
| 3 mph = 1,34112 m/s | %10 ≈ 5,7106° | Aynı dört g düğümü | 0,25 ve 0,50 g | Doğrulanmadı |
| 4 mph = 1,78816 m/s | %0 = 0° | Aynı dört g düğümü | 0,25 ve 0,50 g | Doğrulanmadı |
| 4 mph = 1,78816 m/s | %10 ≈ 5,7106° | Aynı dört g düğümü | 0,25 ve 0,50 g | Doğrulanmadı |

Dönüşümler türetilmiştir: `1 mph = 1609.344/3600 m/s`; eğim açısı `atan(0.10)`. 0,378 kullanıcı senaryo girdisidir. Her **aynı hız/eğim** satırında doğrusal enterpolasyon önerisi:

```text
α = (0.378 - 0.25)/(0.50 - 0.25) = 0.512
q_Mars = 0.488*q_0.25 + 0.512*q_0.50
```

**Alt/üst bant önerisi:** önce eşleşen kişilerin iki komşu düğümündeki ölçümleri alınmalı. Ortalama eğriler arasında kalma kabulüyle `min(q_0.25,q_0.50)`–`max(q_0.25,q_0.50)` bir **senaryo zarfıdır**; güven veya insan güvenliği sınırı değildir. Kişiler arası dağılım için eşleşmiş örnekleri birlikte yeniden örneklemek gerekir. Ortalama varyansı aktarılacaksa:

```text
Var(q_Mars) = 0.488² Var(q_0.25) + 0.512² Var(q_0.50)
              + 2*0.488*0.512 Cov(q_0.25,q_0.50)
```

Bu yalnız enterpolasyonun örnekleme belirsizliğidir; doğrusal olmayan g ilişkisi, ağırlık boşaltma düzeneği, skafandr ve Mars zemini sapmasını kapsamaz. Sayısal %95 bant için veri/kovaryans ve ek model hatası yok: **doğrulanmadı**. 0,75 ve 1 g düğümleri eğrilik kontrolüne yarar. Hız/eğim enterpolasyonu yalnız 3–4 mph ve %0–10 içindeki deney alanında düşünülebilir; dışı ekstrapolasyondur. Yavaş skafandrlı yürüyüşe doğrudan taşınamaz.

**272 W ile eşleştirme önerisi:** aynı protokol ve gross/net tanımı sağlanırsa `r=q(g,v,S)/q(1,v,S)` oranı hesaplanabilir. `272*r` ancak bütün gross güce aynı oranı aktarma varsayımıyla üretilen **senaryo** olur. Daha açık ayrıştırma:

```text
P_senaryo = P_dinlenme + r_hareket*(P_Dünya - P_dinlenme) + ΔP_skafandr
```

Bu raporun önerdiği model yapısıdır; yayımlanmış kalibrasyon değildir. `P_dinlenme`, net harekete ait `r_hareket` ve ek suit maliyeti ölçülmeden sayısallaştırılamaz. Tezdeki gross VO₂ oranı otomatik olarak net hareket oranı değildir. Bugün raporlanabilir durum: **272 W Dünya vekili; Mars düzeltmesi kalibre edilmedi.** 272 W'ın gerçek Mars üst sınırı olduğu da iddia edilemez.

## 2. Curiosity eğimleri: rover bağlamı (2026-11-15)

| Değer | Birincil kaynak, yer ve kısa alıntı | Doğrulama ve kullanım |
|---|---|---|
| **30° kaçınma / 45° devrilmeden dayanma tasarımı** | [NASA/JPL eski Wheels and Legs sayfası](https://mars.nasa.gov/msl/spacecraft/rover/wheels/); [erişilebilen arama dizini kopyası](https://prod.mars.jpllab.net/msl/spacecraft/rover/wheels/), süspansiyon açıklaması: “avoid exceeding tilts of 30 degrees”. | NASA sayfasının arama aracının sunduğu metninde iki sayı birlikte okunuyor; canlı sayfa doğrudan isteği hata/zaman aşımı verdi. **Dizin metninde doğrulandı; canlı tam sayfa doğrulanmadı.** Gövde yatıklığı / koruma yazılımı bağlamı; zeminin her koşulda geçilebilir eğimi değil. |
| **22° düzgün ana kaya** | [Heverly vd. 2013, Abstract](https://onlinelibrary.wiley.com/doi/abs/10.1002/rob.21481): “slopes up to 22 degrees”. | **Kaynaklı**, açık yayıncı özeti. Test edilen yüzeyde doğrudan yukarı tırmanma; evrensel operasyon limiti değil. |
| **28° bazı kohezyonlu zeminler** | Aynı açık özet: “slopes up to 28 degrees”. | **Kaynaklı**, zemine bağlı deney sonucu. |
| **10° kumda orta kayma → 17° kumda gömülme** | Aynı açık özet: “vehicle embedding at 17 degrees”. | **Kaynaklı**, kohezyonsuz kumda keskin performans geçişi. 30° sınırının altında da geçilemezlik olabildiğini gösterir. |

Heverly deneyleri Dünya'da Mars ağırlığını temsil eden roverlarla yapıldı; insan/skafandr ölçümü değildir. **Koda etki önerisi:** bu sayıları yalnız “Curiosity karşılaştırması” metadata'sında tutmak; insan için 15°/25° eşiğini bu kaynaklarla doğrulanmış saymamak. `rover_body_tilt_limit` ile `human_terrain_slope_limit` farklı değişkenler olmalı. Canlı NASA sayfası erişim sorunu nedeniyle 30°/45° kaydının erişim notu korunmalı.

## 3. Mars EVA süresi, dönüş ve contingency (2026-11-15)

| Değer / bağlam | Kaynak ve yer | Kısa birebir alıntı | Güven ve koda etkisi |
|---|---|---|---|
| **2–8 saat EVA PET**, Mars kavramsal aralık | [NASA EVA-EXP-0042 Rev B, 2020-10-19](https://ntrs.nasa.gov/api/citations/20205008200/downloads/EVA-EXP-0042%20xEVA%20System%20Con%20Ops%20Rev%20B%20Final%20dtd%2010192020_REF%20DOC.pdf?attachment=true), Ek D, Tablo D-9 “Key FOMs for EVA on Mars”, s.150 | “2-8 hours” | **Kaynaklı ConOps senaryosu**; sertifikalı Mars skafandr kapasitesi / sağlık limiti değil. Senaryo profili seçimi olabilir. |
| **Mars dönüş mesafesi henüz geliştirme konusu** | Aynı ConOps, §4.2.1.3.1.2, s.41 | “associated walk back ranges are forward work.” | **Kaynaklı durum kaydı**; eski belgedeki Ay sayıları Mars'a aktarılmamalı. |
| **3–6,5 saat**, DRA 5.0 Addendum #2'ye dayanan çalışma | [Agui & Perry 2017, ICES-2017-28](https://ntrs.nasa.gov/api/citations/20170006616/downloads/20170006616.pdf), Ek, s.11; orada ADD2 s.399/402'ye atıf | “Duration is variable between 3 to 6.5 hours” | **NASA mühendislik çalışmasının kendi kullanımında doğrulandı.** Özgün ADD2 s.399/402 bu tur okunamadı; DRA'ya doğrudan doğrulanmış atıf sayılmamalı. 2–8 saatlik farklı tarihli ConOps ile tek sabit haline getirilmemeli. |
| **30 dakika / 1 saat dönüş** | [Ogilvie 2026](https://ntrs.nasa.gov/api/citations/20260003038/downloads/Final_ICES2026_Mars_Mass_1.pdf), §III “Walking Speed”, s.11 | “either 30 minute or 1-hour walkback are being considered.” | **Kaynaklı değerlendirilen seçenekler**; burada 30 dakika “genel yedek süre” değil, dönüş yürüyüşünün kendisidir. |
| **1,8 km / 3,5 km**, sırasıyla bu iki süre | Aynı bölüm, s.11 | Yukarıdaki alıntının devamındaki hesap; ayrıca kaynak hız uyarısı §1 tablosunda | **Kaynaklı öneri**, Apollo'dan varsayılan **2,2 mph** ile; ek kurtarma sistemleri yokken ve suit kapasitesi elverirse. Doğrudan güvenlik kuralı değil. |
| **8 saat birincil + 1 saat contingency**, **Ay** | ConOps, §9.1.2 **Lunar Surface Self Rescue / Rover Rescue**, s.124 | “plus one hour of contingency consumables” | **Kaynaklı Ay tasarımı**; Mars için sabit bir saat reserve diye kullanılmamalı. |
| Mars'a özel evrensel contingency süresi | İncelenen yukarıdaki kaynaklar | Sayısal, genel geçer Mars şartı bulunamadı | **Doğrulanmadı.** 30 veya 60 dakika seçilirse ayrıca senaryo varsayımı olarak işaretlenmeli. |

**3,5 km nasıl okunmalı?** “Araçtan uzaklık”, arıza sonrası **yürüyerek geri erişilebilen** uzaklıktır. Kuş uçuşu yarıçap ya da toplam gidiş+dönüş rota uzunluğu olarak dayatılamaz. Kaynağın 2,2 mph hızından hesap: 30 dakikada **1,7703 km**, bir saatte **3,5406 km**; makaledeki 1,8/3,5 km yuvarlatılmıştır. Bunlar aritmetik dönüşümdür; Mars'ta ölçülmüş hız değildir. Engebeli arazide yürünebilir dönüş rotasının süresi temel alınmalıdır (**uygulama önerisi**).

Ogilvie s.11 yaklaşık **19 mL kg⁻¹ min⁻¹ VO₂** dönüş noktası da verir; bu, önceki walkback çalışmasının uzantısıdır. Aynı sayfadaki **1700 / 2300 BTU/h** değerleri farklı beden kütlelerine bağlı senaryolardır; 272 W ile eş koşullu doğrulama oluşturmaz. Bir g/hız/eğim regresyonu yerine geçirilmemeli.

### 3.1. Dönüş bütçesine önerilen uygulama (2026-11-15)

**Tasarım önerisi; kaynakta verilmiş flight rule değil:**

```text
T_dönüş = yürünebilir dönüş rotasındaki segment süreleri toplamı
T_pay   = T_kullanılabilir - T_dönüş - T_ingress - T_contingency
```

`T_kullanılabilir`, nominal EVA saatinden otomatik türetilen değişmez sayaç olmamalı; planlanan son zaman ile kalan O₂, CO₂ giderme, enerji ve termal kapasiteye bağlı kısıtların en erken olanını temsil etmelidir. Her kapasite modeli ayrıca kaynak ister. Dönüş yürüyüş süresi, ingress süresi ve contingency ayrı tutulmalı; aynı reserve iki kere düşülmemeli. Mars için `T_contingency` bu tur kaynaklı sabit olarak doldurulamadı.

**Önerilen arayüz dili:** “Seçili araştırma senaryosu: dönüş için 30/60 dakika; 3,5 km değeri kapasiteye bağlı NASA tasarım değerlendirmesidir. Enerji, Dünya vekil modeliyle hesaplanıyor; Mars/skafandr kalibrasyonu tamamlanmadı.” Gösterilen kalan süre, görev güvenliği sertifikası olarak sunulmamalı.

## 4. Kaynak künyeleri ve erişim denetimi (2026-11-15)

| Kaynak | Tam künye / bağlantı | Erişim ve sınırlama |
|---|---|---|
| K1 | Kluis, L.; Wynn, C.; Kennedy, D.; Diaz-Artiles, A. (2025). *Characterization of the effects of sex, speed, and incline on metabolic rate during partial gravity ambulation*. **Journal of Applied Physiology 139(3), 787–796**. [DOI](https://doi.org/10.1152/japplphysiol.00627.2024). | 2026-11-15. Yayıncı `/doi/full/`, `/doi/abs/`, `/doi/pdf/` erişimleri 403; [PubMed](https://pubmed.ncbi.nlm.nih.gov/40879065/) bu erişimde kullanılabilir tam metin sunmadı. RG makale kaydı tam metin yok diyor. **2025 katsayıları doğrulanmadı.** |
| K2 | Kluis, L. (2024). *A Novel Metabolic Model for Ambulation in Hypogravity and Applications to Planetary Extravehicular Activity*. Doktora tezi, Texas A&M University, Ağustos 2024. [Yazarın açık tam metin kopyası](https://www.researchgate.net/publication/394929719_A_Novel_Metabolic_Model_for_Ambulation_in_Hypogravity_and_Applications_to_Planetary_Extravehicular_Activity). | 2026-11-15. Tam metin §5.1 ve Tablo 5-6 okundu. Hakemli 2025 sürümünün yerine eşitlenmedi. Katsayı kodlaması çözülemedi; şekil ordinatları sayısallaştırılmadı. |
| K3 | Farley, C. T.; McMahon, T. A. (1992). *Energetics of walking and running: insights from simulated reduced-gravity experiments*. **J Appl Physiol 73(6), 2709–2712**. [Yayıncı özeti](https://journals.physiology.org/doi/abs/10.1152/jappl.1992.73.6.2709), DOI:10.1152/jappl.1992.73.6.2709. | 2026-11-15. Açık özet okundu; katsayı çıkarılabilecek açık tam metin bulunamadı. |
| K4 | Kim, K. J.; Hoffmann, B.; Estep, P.; Kring, D. A.; Marshall-Goebel, K.; Buckland, D. (2025). *A Consolidated Tool for Planning and Analyzing Simulated Exploration Traverses and Associated Metabolic Workload*. **ICES-2025-129**, 54th ICES, Prag, 13–17 Temmuz. [NASA NTRS 20250001829, PDF](https://ntrs.nasa.gov/api/citations/20250001829/downloads/ICES%202025%20TraverseModel.pdf). | 2026-11-15. Açık tam metin, özellikle s.4,7–9 okundu. Mars'ta doğrulanmış model iddiası yok. |
| K5 | Ogilvie, R.; Swartout, B.; Hoffmann, B.; McFarland, S.; Hickox, L. (2026). *Mars Spacesuit Mass Requirements*. **ICES-2026-127**, 55th ICES, Rio Grande, 12–16 Temmuz. [NASA NTRS 20260003038, PDF](https://ntrs.nasa.gov/api/citations/20260003038/downloads/Final_ICES2026_Mars_Mass_1.pdf). | 2026-11-15. Açık tam metin, özellikle s.7 ve s.11 okundu. Mars walkback hızı yazarların da doğrulanmasını istediği varsayım. |
| K6 | Heverly, M.; Matthews, J.; Lin, J.; Fuller, D.; Maimone, M.; Biesiadecki, J.; Leichty, J. (2013). *Traverse Performance Characterization for the Mars Science Laboratory Rover*. **Journal of Field Robotics 30(6), 835–846**. [DOI / açık yayıncı özeti](https://onlinelibrary.wiley.com/doi/abs/10.1002/rob.21481), DOI:10.1002/rob.21481. | 2026-11-15. Eğim sayıları açık özette okundu; kapalı tam metnin tablo numarası uydurulmadı. |
| K7 | NASA/JPL. *Wheels and Legs*, Mars Science Laboratory spacecraft sayfası. [Eski NASA URL](https://mars.nasa.gov/msl/spacecraft/rover/wheels/), [dizinlenen kopya](https://prod.mars.jpllab.net/msl/spacecraft/rover/wheels/). | 2026-11-15. Arama aracının sunduğu sayfa metni okundu; canlı istekler başarısız. 30°/45° bu erişim ayrımıyla raporlandı. |
| K8 | Coan, D. / NASA JSC (2020). *Exploration EVA System Concept of Operations*. **EVA-EXP-0042 Rev B**, yürürlük 19 Ekim 2020. [NASA NTRS 20205008200, açık PDF](https://ntrs.nasa.gov/api/citations/20205008200/downloads/EVA-EXP-0042%20xEVA%20System%20Con%20Ops%20Rev%20B%20Final%20dtd%2010192020_REF%20DOC.pdf?attachment=true). | 2026-11-15. §4.2.1.3.1.2, §9.1.2, Ek D Tablo D-9 okundu. Mars/Ay bağlamları ayrıldı; belgenin 2020 sürümü olduğu korunmalı. |
| K9 | Agui, J. H.; Perry, J. L. (2017). *Life Support Filtration System Trade Study for Deep Space Missions*. **ICES-2017-28**, 47th ICES, Charleston, 16–20 Temmuz. [NASA NTRS 20170006616, PDF](https://ntrs.nasa.gov/api/citations/20170006616/downloads/20170006616.pdf). | 2026-11-15. Açık tam metin, Ek s.11; DRA atfı burada okundu. Özgün DRA sayfasının doğrudan doğrulanmasının yerine geçmez. |
| K10 | Drake, B. G.; Watts, K. D. (ed.) (2014). *Human Exploration of Mars Design Reference Architecture 5.0, Addendum #2*. **NASA/SP-2009-566-ADD2**. [NTRS PDF](https://ntrs.nasa.gov/api/citations/20160003093/downloads/20160003093.pdf), [katalog](https://ntrs.nasa.gov/citations/20160003093). | 2026-11-15. Büyük PDF erişim/araç boyut sınırına takıldı; kısmi dizin metni s.399/402'yi kapsamıyor. Bu sayfalardaki EVA değerleri **doğrudan doğrulanmadı**. |

**Sonuçsuz arama kaydı:** “Mars Architecture Watch” adıyla bu görevde sayısal EVA kuralı taşıyan, açık ve belirlenebilir bir NASA belgesi doğrulanamadı; URL veya künye üretilmedi. PMC/NTRS/yazar kopyası araması Kluis 2025 ve Farley 1992 için okunabilir makale tam metni sağlamadı; Kluis'in farklı tarihli açık tezi ayrı kaynak olarak bulundu. İlgisiz arama sonuçları kanıt olarak kullanılmadı.

## 5. Teslimatın denetimi ve açık işler (2026-11-15)

| Kontrol | Sonuç |
|---|---|
| Kim Denklem 7'nin cebirsel kontrolü | G ortak çarpan; `272*0.378=102.816`. Yeni bir Mars doğrulaması çıkmıyor. |
| Enterpolasyon ağırlıkları | `0.488+0.512=1`; `0.488*0.25+0.512*0.50=0.378`. |
| Eğim birimi | %10 için `atan(0.10)=5.7106°`; %10 ile 10° karıştırılmadı. |
| Dönüş mesafesi | `2.2*1609.344/1000=3.5405568 km/h`; kaynak yuvarlatması ve varsayımı ayrı yazıldı. |
| Katsayı kökeni | 2024 tez tam metni; 2025 makale katsayısı olarak etiketlenmedi. |
| Kaynak bağlamı | Rover/insan ve Ay/Mars ayrıldı; ConOps contingency satırı Mars'a aktarılmadı. |
| Sayısal belirsizlik bandı | **Açık:** eşleşen düğüm verileri, kovaryans ve model hatası yok; sayı uydurulmadı. |
| Üretim için kalan engeller | Girdi kodlaması ve 2025 model sürümü; yavaş/skafandrlı Mars yürüyüş kalibrasyonu; özgün ADD2 s.399/402; Mars'a özel contingency ve suit kapasite profili. |

Bu teslimat bir kaynak ve yöntem incelemesidir. Deney verisi eksikliği çözülmeden tek bir “gerçek Mars watt değeri” veya “güvenli dönüş garantisi” üretmeyi önermiyor.
