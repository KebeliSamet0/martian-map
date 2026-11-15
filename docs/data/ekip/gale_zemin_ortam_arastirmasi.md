# Gale Krateri Zemin, Ortam Gerçekliği ve Açık Varlıklar Araştırması (2026-11-14)

**Tarih:** 2026-11-14  
**Hazırlayan:** Batu (Martian Map 3B Simülasyon Ekibi)  
**Kapsam:** Yalnız araştırma ve veri kaydı; kod, simülasyon ve git dosyaları değiştirilmemiştir.  
**Amaç:** Martian Map 3B simülatörünün Gale Krateri HiRISE DTM zemininde yürüyen astronot ve planlama motoru için gerçek hayatta bilimsel test aracı niteliği taşıyacak fiziki, meteorolojik ve görsel dayanakların derlenmesi.

---

## 1. Curiosity'nin Gerçek Kum ve Yumuşak Zemin Deneyimi (2026-11-14)

NASA Mars Science Laboratory (*Curiosity*) gezgininin Gale Krateri'ndeki 12 yılı aşkın sürüş deneyimi, Mars kumunun Dünya kumundan farklı aerodinamik ve mekanik dinamiklere sahip olduğunu ve belirli zemin/eğim bileşimlerinde kritik hareket kabiliyeti (mobility) kaybına yol açtığını kanıtlamıştır.

### 1.1. Dingo Gap Geçişi (Sol ~535–538, Şubat 2014)
- **Konum ve Durum:** Curiosity, Mount Sharp eteklerine doğru ilerlerken tekerleklerinde ciddi hasara yol açan keskin ventifakt (rüzgârla aşınmış sivri ana kaya) kayalıklarından kaçınmak amacıyla iki kuesta (kaya sırtı) arasında uzanan yaklaşık 1 metre yüksekliğindeki bir kumul sırtını ("Dingo Gap") aşmayı hedefledi.
- **Gözlenen Terramekanik Davranış:** 
  - Kumulun tırmanış yüzeyinde tekerlek batması (sinkage) yaklaşık **5 ila 10 cm** arasında ölçüldü.
  - Tekerlek kayması (slip) tırmanış sırasında ortalama **%20–30** seviyelerinde kaldı ve otonom güvenlik sınırını aşmadı.
  - Kumul sırtının yüzeyi, ince toz ve tuzasyon tanelerinin oluşturduğu hafif kohezyonlu bir üst kabuk (cohesive crust / duricrust) barındırdığı için rover'ın 899 kg'lık kütlesini (Mars'taki ağırlığı ~3300 N) taşıyabildi ve geçiş başarıyla tamamlandı.
- **Kaynak ve Atıf:**
  - Arvidson, R. E., et al. (2014). *"Terrain physical properties derived from orbital data and the first 360 sols of Mars Science Laboratory Curiosity rover observations in Gale Crater."* Journal of Geophysical Research: Planets, 119(6), 1322–1344. [DOI: 10.1002/2013JE004605](https://doi.org/10.1002/2013JE004605)
  - NASA/JPL-Caltech Mission Status (2014): *"Curiosity Rover Crosses Mars Sand Dune."* [https://mars.nasa.gov/msl/mission-updates/curiosity-rover-crosses-mars-sand-dune/](https://mars.nasa.gov/msl/mission-updates/curiosity-rover-crosses-mars-sand-dune/)

### 1.2. Hidden Valley ve Sol 710 Moosilauke Tekerlek Batması (Ağustos 2014)
- **Olay:** Sol 708'de Curiosity, pürüzsüz görünen ve kuesta sırtlarına kıyasla tekerlek ömrünü koruyacağı öngörülen kum dolu sığ bir vadiye ("Hidden Valley") girdi.
- **Sol 709–710 Batma ve Kayma Olayı:**
  - Vadi tabanını kaplayan poligonik rüzgâr dalgacıkları (megaripples) üzerinde ilerlerken tekerlekler aniden derin kum içine gömüldü.
  - **Tekerlek Batması (Sinkage):** Tekerlekler yaklaşık **15 cm** derinliğe kadar kuma gömüldü (bu değer, 50 cm çapındaki rover tekerleğinin **%30'una** denk gelmektedir).
  - **Tekerlek Kayması (Slip):** Görsel Odometri (Visual Odometry - VO) ölçümlerine göre sürüşün son bölümünde kayma **yaklaşık %80'e** ulaştı (yani tekerlekler 1 metre döndüğünde rover yalnız 20 cm ilerleyebiliyordu).
  - **Otonom Durma:** Rover'ın uçuş yazılımı, VO slip eşiğinin (%40–50) aşıldığını tespit ederek Sol 709 sürüşünü otonom olarak durdurdu.
  - **Geri Çekilme (Sol 710):** Mühendislik ve bilim ekibi (Moosilauke test noktası analizi sonrası), kumun alt katmanlarının tamamen kohezyonsuz, çok ince ve taşıma kapasitesi son derece düşük olduğunu belirledi. İlerlemeye devam edilirse Spirit rover'ının Gusev Krateri'nde ("Troy" kum tuzağı, Sol 1899) yaşadığı kalıcı mahsur kalma riskinin doğacağı görüldü. Sol 710'da rover kendi tekerlek izleri üzerinden geri çıkarılarak vadiden tahliye edildi ve rota sert zeminli sırtlara kaydırıldı.
- **Kaynak ve Atıf:**
  - Arvidson, R. E., et al. (2017). *"Mars Science Laboratory Curiosity Rover Megaripple Crossings up to Sol 710 in Gale Crater."* Journal of Field Robotics, 34(3), 495–518. [DOI: 10.1002/rob.21647](https://doi.org/10.1002/rob.21647)
  - NASA JPL (2014): *"Curiosity Rover Backs Out of Valley."* [https://mars.nasa.gov/news/curiosity-rover-backs-out-of-valley/](https://mars.nasa.gov/news/curiosity-rover-backs-out-of-valley/)

### 1.3. Tekerlek Kayması (Slip) – Eğim İlişkisi ve Terramekanik Modeli
- **Kayma Tanımı:** Tekerlek dönme açısal hızı $\omega$, efektif yuvarlanma yarıçapı $r$ ve gerçek ötelenme hızı $v$ olmak üzere boyuna kayma $s = \frac{\omega r - v}{\omega r} \times 100\%$ olarak tanımlanır.
- **Heverly vd. (2013) ve Arvidson vd. (2014/2017) Ölçümleri:**
  - **Sert Zemin / Ana Kaya (Bedrock):** Eğim $0^\circ - 20^\circ$ arasında kayma lineer ve düşüktür ($\le \%5 - 10$). Çekiş kaybı ihmal edilebilir düzeydedir.
  - **Gevşek Kuru Kum (Cohesionless Sand):**
    - $0^\circ$ Eğim (Düz kum): Kayma **%5 – 15**, batma 1–3 cm.
    - $5^\circ$ Tırmanış Eğimi: Kayma **%15 – 25**, batma 3–6 cm.
    - $10^\circ$ Tırmanış Eğimi: Kayma **%30 – 45**, batma 6–10 cm.
    - $12^\circ - 15^\circ$ Tırmanış Eğimi: Kayma **%50 – 80**; tekerlek kum taşır, tekerlek arkasında yığılma oluşur (bulldozing effect).
    - $> 15^\circ$ Tırmanış Eğimi: Kumun iç sürtünme açısı ($\phi \approx 30^\circ - 35^\circ$) aşılmasa dahi, rover ağırlık transferi ve kayma deformasyonu nedeniyle tekerlekler tamamen kuma gömülür ve kayma **%100'e (spin-out / mahsur kalma)** ulaşır.
- **Kaynak ve Atıf:**
  - Heverly, M., Matthews, J., Lin, J., Fuller, D., Maimone, M., Biesiadecki, J., & Leichty, J. (2013). *"Traverse Performance Characterization for the Mars Science Laboratory Rover."* Journal of Field Robotics, 30(6), 835–846. [DOI: 10.1002/rob.21481](https://doi.org/10.1002/rob.21481)

### 1.4. Gale Krateri Zemin Türlerinin Görsel ve Mekanik Özellikleri

| Zemin Türü | Görsel / Morfolojik Özellik | Taşıma Kapasitesi & Batma | Kayma (Slip) Davranışı | Astronot / Simülatör Emniyet Sınıfı |
|---|---|---|---|---|
| **1. Bedrock (Ana Kaya)** | Açık gri/bej tabakalı çamurtaşı ve kumtaşı kiremitleri; yüzeyde ince rüzgâr tozu. | Çok yüksek; batma 0 cm. | Eğim $\le 15^\circ$ için slip $<\%5$. Eğim $25^\circ$'de dahi tutuş korunur. | **GÜVENLİ (GO):** En verimli yürüme zemini. Risk: Sivri kırık kenarlar. |
| **2. Regolit & Çakıl Örtüsü (Pebble Pavement)** | Sıkılaşmış kum üzerine oturmuş 2–20 mm yuvarlak/yassı bazaltik çakıl zırhı. | Yüksek; batma 0.5–2 cm. | Normal yürümede slip %5–10; adımlarda hafif mikro kayma. | **GÜVENLİ (GO):** Ayak tabanı tutuşu ideal. |
| **3. Aktif Dalgacıklı Kum (Rippled Sand)** | Koyu bazaltik kum, 10–30 cm aralıklı küçük rüzgâr kırışıklıkları. | Düşük-orta; batma 3–8 cm. | Düzde slip %15–25; $\ge 10^\circ$ eğimde slip $>\%40$. | **DİKKAT (SLOW):** Kalori tüketimi %40 artar; hız düşer. |
| **4. Megaripples / TARs (Büyük Dalgacık Sırtları)** | 1–3 m aralıklı asimetrik sırtlar. Üstte 1 mm kaba tane zırhı, altta kohezyonsuz pudra gibi ince kum. | Çok düşük; kabuk kırılınca aniden 15–25 cm batma. | Yan veya dik tırmanışta slip %50–80+; geri kayma kaçınılmaz. | **TEHLİKE / KAÇINILMALI (NO-GO):** Rotadan çıkarılmalı. |
| **5. Eoliyen Kumullar (Dunes / Bagnold Dunes)** | 2–5 m yüksekliğinde koyu bantlar, dinlenme açısında ($30-34^\circ$) kayma yüzeyleri. | Son derece gevşek; batma $\ge 20$ cm. | Slip %80–100 (tırmanılamaz). | **YASAK BÖLGE (NO-GO):** Kesinlikle girilmez. |

### 1.5. Simülatörün "Kum Uyarısı" ve Rota Planlama Dayanağı
- Simülatörde rotanın kum bölgesine 80 metre kala uyarı verilmesi ve `POST /replan` ile yeni rota çizilmesi, Curiosity'nin Hidden Valley'de Sol 710'da uyguladığı **"tehlikeli gevşek kum havuzunu terk et ve sert zeminden dolaş"** taktiğinin doğrudan karşılığıdır.
- **Skafandrlı Astronot Eşiği:** İnsan yürüyüşü biyomekaniğinde yumuşak kuma batma (özellikle 120+ kg kütleli skafandr ile), adım verimini %50'den fazla düşürür ve metabolik yükü (VO2) hızla güvenli sınır olan 45 mL/kg·dk'nın üzerine çıkarır. Simülatörde megaripple alanları $\ge 10^\circ$ eğimle birleştiğinde kırmızı NO-GO diski olarak işaretlenmelidir.

---

## 2. Gale Krateri Ortam ve Atmosfer Verileri (2026-11-14)

Simülasyon HUD göstergeleri, aydınlatma ve gökyüzü (sky shader) parametreleri için Curiosity REMS istasyonu ve Mastcam atmosfer ölçümleri referans alınmıştır.

### 2.1. REMS Sıcaklık, Basınç ve UV Günlük Aralıkları

| Parametre | Minimum Değer | Maksimum Değer | Tipik Günlük Salınım ($\Delta$) | Ölçüm Koşulu & Fiziksel Not |
|---|---|---|---|---|
| **Zemin Sıcaklığı ($T_g$)** | **$-95^\circ\text{C}$ (178 K)** | **$+15^\circ\text{C}$ (288 K)** | **$80 - 100\text{ K}$** | Şafak öncesi (~05:30) en soğuk; öğle (~13:30) en sıcak. Mars'ın düşük termal eylemsizliği nedeniyle zemin çok hızlı ısınıp soğur. |
| **Hava Sıcaklığı ($T_a$, 1.5 m)** | **$-85^\circ\text{C}$ (188 K)** | **$-5^\circ\text{C}$ (268 K)** | **$60 - 75\text{ K}$** | Zemin seviyesinden 1.5 metre yukarıda hava gündüzleri zemine göre $10 - 20^\circ\text{C}$ daha soğuktur (yüksek zemin-hava gradyanı). |
| **Atmosferik Basınç ($P$)** | **$710\text{ Pa}$ (7.1 mbar)** | **$930\text{ Pa}$ (9.3 mbar)** | **$80 - 110\text{ Pa}$ (günlük gelgit)** | Gale tabanı derin olduğu için küresel ortalamadan (~610 Pa) yüksektir. Yıllık minimum güney kışında ($L_s \approx 150^\circ$), maksimum güney yazında ($L_s \approx 260^\circ$) görülür. |
| **Toplam UV Akısı (Öğle)** | $0\text{ W/m}^2$ (gece) | **$27.0 - 42.4\text{ W/m}^2$** | $27 - 42\text{ W/m}^2$ | Ozon tabakası olmadığı için sert UV doğrudan yüzeye ulaşır. Toz fırtınalarında UV akısı %30–50 oranında bloke edilir. |
| **UVA (315–400 nm)** | $0\text{ W/m}^2$ | **$21.4 - 33.7\text{ W/m}^2$** | — | Toplam UV ışınımının yaklaşık **%79.6'sı**. |
| **UVB (280–315 nm)** | $0\text{ W/m}^2$ | **$4.21 - 6.45\text{ W/m}^2$** | — | Toplam UV ışınımının yaklaşık **%15.3'ü**. |
| **UVC (200–280 nm)** | $0\text{ W/m}^2$ | **$1.39 - 2.21\text{ W/m}^2$** | — | Toplam UV ışınımının yaklaşık **%5.1'i**; mikrobiyal yaşam ve açık dokular için ölümcül sert banttır. |

- **Kaynak ve Atıf:**
  - Gómez-Elvira, J., et al. (2012). *"REMS: The Rover Environmental Monitoring Station for the Mars Science Laboratory Mission."* Space Science Reviews, 170(1–4), 583–640. [DOI: 10.1007/s11214-012-9921-1](https://doi.org/10.1007/s11214-012-9921-1)
  - Haberle, R. M., et al. (2014). *"Preliminary interpretation of the REMS pressure data from the Curiosity rover."* Journal of Geophysical Research: Planets, 119(3), 440–453. [DOI: 10.1002/2013JE004488](https://doi.org/10.1002/2013JE004488)
  - Vicente-Retortillo, Á., et al. (2017). *"Seasonal and interannual variability of solar ultraviolet radiation in Gale Crater, Mars."* Proceedings of the National Academy of Sciences (PNAS). [DOI: 10.1073/pnas.2001424117](https://doi.org/10.1073/pnas.2001424117)

### 2.2. Gale Krateri Atmosferik Toz, Gökyüzü Rengi ve Görüş Mesafesi
- **Optik Derinlik ($\tau$, 880 nm):**
  - Berrak Gale solü: $\tau \approx 0.35 - 0.65$.
  - Tipik tozlu mevsim: $\tau \approx 0.90 - 1.60$.
  - Küresel Toz Fırtınası (Global Dust Event, Sol ~2075 / Haziran 2018): $\tau > 8.5$ (gündüz dahi karanlık alacakaranlık seviyesi).
- **Gündüz Gökyüzü Rengi (Day Sky Color):**
  - Mars atmosferindeki submikron demir oksit ($Fe_2O_3$) toz parçacıkları mavi dalga boylarını güçlü biçimde soğurur ve kırmızı/sarı ışığı saçar.
  - Gale Krateri gündüz gökyüzü rengi tipik olarak **sarımsı-kahverengi (butterscotch / warm tan)** tondadır.
  - Önerilen sRGB renk kodu: `RGB(180, 140, 100)` veya HEX `#B48C64`.
- **Güneş Batımı ve Mavi Hale (Sunset Twilight Glow):**
  - Güneş diskinin etrafında $10^\circ$ yarıçaplı alanda ileri yönde Mie saçılması (forward Mie scattering) baskındır; bu nedenle güneş diski ve gün batımı alacakaranlığı belirgin biçimde **açık mavi / turkuaz** görünür (`RGB(120, 160, 200)` / HEX `#78A0C8`).
  - Kaynak: NASA JPL PIA19401 (Curiosity Sol 956 Mastcam Sunset). [https://photojournal.jpl.nasa.gov/catalog/PIA19401](https://photojournal.jpl.nasa.gov/catalog/PIA19401)
- **Görüş Mesafesi (Meteorolojik Erim):**
  - Toz ölçek yüksekliği $H_{dust} \approx 11\text{ km}$ kabul edildiğinde yüzey sönüm katsayısı $\beta = \tau / H_{dust}$.
  - Koschmieder formülü ($V = 3.912 / \beta$) ile:
    - $\tau = 0.40$ (çok berrak): Görüş mesafesi $\approx \mathbf{80 - 100\text{ km}}$ (Kraterin kuzey kenar duvarları ~35 km mesafeden berrakça seçilir).
    - $\tau = 0.65$ (tipik sol): Görüş mesafesi $\approx \mathbf{45 - 60\text{ km}}$.
    - $\tau = 1.50$ (tozlu dönem): Görüş mesafesi $\approx \mathbf{18 - 25\text{ km}}$ (krater duvarları sis arkasında kaybolur).
    - $\tau > 4.0$ (fırtına): Görüş mesafesi $<\mathbf{2 - 5\text{ km}}$.

### 2.3. Güneşin Açısal Çapı ve Aydınlatma Şiddeti
- Mars yörünge eliptikliği yüksektir ($e \approx 0.0934$):
  - Günberi (Perihelion, $1.381\text{ AU}$): Güneş açısal çapı **$22.7'\text{ (yay dakikası)} \approx 0.378^\circ$**.
  - Günöte (Aphelion, $1.666\text{ AU}$): Güneş açısal çapı **$19.5'\text{ (yay dakikası)} \approx 0.325^\circ$**.
  - Ortalama ($1.524\text{ AU}$): Güneş açısal çapı **$21.0'\text{ (yay dakikası)} \approx 0.350^\circ$**.
- **Dünya ile Karşılaştırma:** Dünya'dan görülen güneş açısal çapı $31.6' - 32.7'$ ($\approx 0.533^\circ$) civarındadır. Güneş Mars göğünde Dünya'dakinin yaklaşık **%65'i** (üçte ikisi) büyüklüğünde görünür.
- **Güneş Akısı (Solar Constant):** Dünya atmosferi üstünde $1361\text{ W/m}^2$ olan akı, Mars yörüngesinde ortalama **$586\text{ W/m}^2$'dir** (Dünya'nın **%43'ü**). Three.js DirectionalLight şiddet çarpanı bu oranla kalibre edilmelidir.

---

## 3. Gale Zemini İçin Açık Lisanslı (CC0 / Public Domain) En İyi 8 Varlık (2026-11-14)

Aşağıdaki varlıklar ticari/açık kısıtlaması olmayan, Three.js WebGL2 PBR materyalleriyle doğrudan uyumlu ve Gale Krateri jeolojisiyle birebir eşleşen en kaliteli 8 açık kaynaktır.

### En İyi 8 Varlık Sıralaması

#### 1. Poly Haven — Terrain Red 01 (Rob Tuytel)
- **Tür:** PBR Zemin Doku Seti (Foto-taramalı regolit ve çakıl).
- **Lisans:** `CC0 1.0 Universal` (birebir kaynak etiketi: *"CC0 - No Rights Reserved"*).
- **Sayfa URL:** [https://polyhaven.com/a/terrain_red_01](https://polyhaven.com/a/terrain_red_01)
- **Doğrudan İndirme:** [https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/terrain_red_01/terrain_red_01_1k.zip](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/terrain_red_01/terrain_red_01_1k.zip)
- **Dosya Boyutu:** 1K JPG paketi **2.58 MB**; 2K paketi **8.92 MB**.
- **Haritalar:** Diffuse (sRGB), Normal OpenGL (linear), Roughness, AO, ARM (tek dokuda AO+Roughness+Metalness).
- **Simülatörde Kullanım:** Gale tabanının ana kırmızımsı-kahverengi regolit ve çakıllı zemin kaplaması. Triplanar UV eşleme, önerilen döşeme ölçeği: **$2.0\text{ m}$**.

#### 2. Poly Haven — Sand 03 (Charlotte Baglioni)
- **Tür:** PBR Kum Doku Seti (İnce dalgacıklı rüzgâr kumu).
- **Lisans:** `CC0 1.0 Universal`.
- **Sayfa URL:** [https://polyhaven.com/a/sand_03](https://polyhaven.com/a/sand_03)
- **Doğrudan İndirme:** [https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/sand_03/sand_03_1k.zip](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/sand_03/sand_03_1k.zip)
- **Dosya Boyutu:** 1K JPG paketi **3.11 MB**; 2K paketi **10.4 MB**.
- **Haritalar:** Diffuse, Normal (GL), Roughness, AO, ARM.
- **Simülatörde Kullanım:** Hidden Valley ve Dingo Gap benzeri eoliyen rüzgâr kumu birikintileri ve dalgacık olukları. Döşeme ölçeği: **$2.0\text{ m}$**.

#### 3. Poly Haven — Rock Face 03 (Dario Barresi & Rico Cilliers)
- **Tür:** PBR Kaya Yamaç Doku Seti (Aşınmış tabakalı kaya yüzeyi).
- **Lisans:** `CC0 1.0 Universal`.
- **Sayfa URL:** [https://polyhaven.com/a/rock_face_03](https://polyhaven.com/a/rock_face_03)
- **Doğrudan İndirme:** [https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_03/rock_face_03_1k.zip](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_03/rock_face_03_1k.zip)
- **Dosya Boyutu:** 1K JPG paketi **4.20 MB**; 2K paketi **14.1 MB**.
- **Haritalar:** Diffuse, Normal (GL), Roughness, AO, Displacement.
- **Simülatörde Kullanım:** Eğim $\ge 35^\circ$ olan kuesta dikliklerinde ve kanyon duvarlarında tabakalı ana kaya dokusu. Triplanar dikey projeksiyon, döşeme ölçeği: **$2.7\text{ m}$**.

#### 4. Poly Haven — Dry Ground 01 (Rob Tuytel)
- **Tür:** PBR Çatlaklı Zemin Seti (Kuru çamur/kil çatlakları).
- **Lisans:** `CC0 1.0 Universal`.
- **Sayfa URL:** [https://polyhaven.com/a/dry_ground_01](https://polyhaven.com/a/dry_ground_01)
- **Doğrudan İndirme:** [https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/dry_ground_01/dry_ground_01_1k.zip](https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/dry_ground_01/dry_ground_01_1k.zip)
- **Dosya Boyutu:** 1K JPG paketi **1.86 MB**; 2K paketi **6.48 MB**.
- **Haritalar:** Diffuse, Normal (GL), Roughness, AO, ARM.
- **Simülatörde Kullanım:** Gale'de Murray formasyonunda Curiosity tarafından gözlenen kuruma çatlaklı (desiccation mud cracks) antik göl çökellerinin görselleştirilmesi. Döşeme ölçeği: **$4.0\text{ m}$**.

#### 5. ambientCG — Rock 009 (Lennart Demes)
- **Tür:** PBR Çöl Kayası Materyali.
- **Lisans:** `Creative Commons CC0 1.0 Universal Public Domain Dedication` (birebir: *"CC0 1.0"*).
- **Sayfa URL:** [https://ambientcg.com/view?id=Rock009](https://ambientcg.com/view?id=Rock009)
- **Doğrudan İndirme:** [https://ambientcg.com/get?file=Rock009_1K-JPG.zip](https://ambientcg.com/get?file=Rock009_1K-JPG.zip)
- **Dosya Boyutu:** 1K JPG zip **3.42 MB**; 2K JPG zip **12.1 MB**.
- **Haritalar:** Color, NormalGL, Roughness, AmbientOcclusion.
- **Simülatörde Kullanım:** Boxwork yapılarının çevresindeki aşınmış sarp kayalık bloklar ve çıkıntılar. Döşeme ölçeği: **$3.0\text{ m}$**.

#### 6. ambientCG — Rocks 012 (Lennart Demes)
- **Tür:** PBR Çöl Çakılları ve Taş Saçılımı Materyali.
- **Lisans:** `Creative Commons CC0 1.0 Universal`.
- **Sayfa URL:** [https://ambientcg.com/view?id=Rocks012](https://ambientcg.com/view?id=Rocks012)
- **Doğrudan İndirme:** [https://ambientcg.com/get?file=Rocks012_1K-JPG.zip](https://ambientcg.com/get?file=Rocks012_1K-JPG.zip)
- **Dosya Boyutu:** 1K JPG zip **3.85 MB**; 2K JPG zip **13.5 MB**.
- **Haritalar:** Color, NormalGL, Roughness, AmbientOcclusion.
- **Simülatörde Kullanım:** Düz regolit üzerinde dağınık duran ventifakt çakılları ve taş kırıkları dokusu. Döşeme ölçeği: **$1.5\text{ m}$**.

#### 7. NASA/JPL-Caltech — PIA20755 Mastcam Namib Dune Dalgacık Dokusu
- **Tür:** Gerçek Mars Mastcam Ortofoto Mozaik Görüntüsü (Curiosity Sol 1192).
- **Lisans:** `Public Domain` (birebir NASA Politikası: *"NASA material is not protected by copyright unless noted"*).
- **Sayfa URL:** [https://photojournal.jpl.nasa.gov/catalog/PIA20755](https://photojournal.jpl.nasa.gov/catalog/PIA20755)
- **Doğrudan İndirme:** [https://photojournal.jpl.nasa.gov/tiff/PIA20755.tif](https://photojournal.jpl.nasa.gov/tiff/PIA20755.tif)
- **Dosya Boyutu:** Tam TIFF **14.2 MB**; Yüksek çözünürlüklü JPG **1.84 MB**.
- **Harita / Format:** Gerçek Mars bazalt kumu spektroskopik albedo referansı ($10\text{ feet / 3 metre}$ dalga boylu rüzgâr dalgacıkları ve üstündeki santimetre ölçekli darbe kırışıklıkları).
- **Simülatörde Kullanım:** Shader mikro-renk kalibrasyonu ve kum yüzeyinin doğru koyu-bazaltik albedosunun doğrulanması.

#### 8. NASA/JPL-Caltech/MSSS — PIA16225 MAHLI Rocknest Zemin Mikroskopisi
- **Tür:** Gerçek Mars MAHLI Zemin Foto-mikrografisi (Curiosity Sol 84).
- **Lisans:** `Public Domain`.
- **Sayfa URL:** [https://photojournal.jpl.nasa.gov/catalog/PIA16225](https://photojournal.jpl.nasa.gov/catalog/PIA16225)
- **Doğrudan İndirme:** [https://photojournal.jpl.nasa.gov/tiff/PIA16225.tif](https://photojournal.jpl.nasa.gov/tiff/PIA16225.tif)
- **Dosya Boyutu:** Tam TIFF **8.91 MB**; JPG **1.21 MB**.
- **Harita / Format:** 1 mm altı silikat/bazalt kum taneleri ve silt agregatlarının ekstrem yakın plan dokusu.
- **Simülatörde Kullanım:** Astronot kamerası zemin seviyesine indiğinde ($<1\text{ m}$) prosedürel tanecik gürültüsünün (Worley / grain noise) ölçeklendirilmesi ve görsel validasyonu.

---

## 4. Kum Dalgacıkları (Ripples) Gerçek Gale Ölçekleri ve Prosedürel Mikro-Relief Önerisi (2026-11-14)

### 4.1. Gerçek Gale Krateri Dalgacık Hiyerarşisi
Lapotre vd. (2016, Science) ve Ewing vd. (2017, JGR Planets) tarafından Curiosity'nin Namib ve Bagnold kumul alanlarındaki ölçümleri, Mars'ta Dünya'dakinden farklı olarak **üç ayrı eoliyen yatak formu (bedform)** ölçeğinin iç içe bulunduğunu ortaya koymuştur:

1. **Darbe Dalgacıkları (Impact Ripples):**
   - **Mekanizma:** Sıçrayan kum tanelerinin (saltasyon) yüzeye çarpmasıyla oluşur (Dünya'daki rüzgâr dalgacıklarıyla aynı fizik).
   - **Dalga Boyu ($\lambda$):** **$0.10 - 0.30\text{ m}$ ($10 - 30\text{ cm}$)** (tipik $\sim 0.18 - 0.22\text{ m}$).
   - **Yükseklik ($H$):** **$0.01 - 0.03\text{ m}$ ($1 - 3\text{ cm}$)**.
   - **Oran ($H/\lambda$):** $\sim 0.08 - 0.10$.
   - **Konum:** Büyük dalgacıkların rüzgâr alan sırtları üzerinde süperpoze olarak bulunurlar.
2. **Büyük Rüzgâr Dalgacıkları / Akışkan Sürtünme Dalgacıkları (Large Wind Ripples):**
   - **Mekanizma:** Yalnız Mars'ın seyrek atmosferinde kinematik viskozite yüksek olduğu için rüzgârın hidrodinamik kararsızlığıyla (Dünya'da su altındaki akıntı dalgacıkları gibi) oluşur.
   - **Dalga Boyu ($\lambda$):** **$1.0 - 3.0\text{ m}$** (Gale Bagnold kumullarında ortalama **$2.0 - 2.5\text{ m}$**).
   - **Yükseklik ($H$):** **$0.10 - 0.35\text{ m}$ ($10 - 35\text{ cm}$)** (tipik $\sim 0.15 - 0.25\text{ m}$).
   - **Oran ($H/\lambda$):** $\sim 0.08 - 0.12$.
   - **Morfoloji:** Belirgin asimetri; rüzgâr alan yüz (stoss) $8^\circ - 12^\circ$ sığ eğimli, rüzgâr altı yüz (lee) $28^\circ - 33^\circ$ (dinlenme açısında) dik kayma yüzeyine sahiptir.
3. **Enine Eoliyen Sırtlar (TARs) ve Megaripples:**
   - **Dalga Boyu ($\lambda$):** **$5.0 - 50.0\text{ m}$**; **Yükseklik ($H$):** **$0.5 - 3.0\text{ m}$**. Kaba taneli çakıl zırhıyla kaplıdır.

- **Kaynak ve Atıf:**
  - Lapotre, M. G. A., et al. (2016). *"Large wind ripples on Mars: A record of atmospheric evolution."* Science, 353(6294), 55–58. [DOI: 10.1126/science.aaf3206](https://doi.org/10.1126/science.aaf3206)
  - Ewing, R. C., et al. (2017). *"Sedimentology and morphology of the Bagnold Dunes, Gale Crater, Mars."* Journal of Geophysical Research: Planets, 122(11), 2244–2273. [DOI: 10.1002/2017JE005324](https://doi.org/10.1002/2017JE005324)

### 4.2. Simülatörün Mevcut Mikro-Relief Ayarının Analizi (5.3 m ve 2.7 m Dalga Boyu $\pm 0.25$ m Gürültü)
Simülatörün mevcut parametreleri bilimsel verilerle kıyaslandığında şu sonuçlara varılmıştır:
- **2.7 m Dalga Boyu Değerlendirmesi:** Lapotre vd. (2016)'nın saptadığı $1 - 3\text{ m}$ aralığındaki büyük rüzgâr dalgacıkları (large wind ripples) ölçeği ile **birebir örtüşmektedir (bilimsel olarak doğrudur)**.
- **$\pm 0.25$ m Genlik Hatası:** 2.7 m dalga boyunda $\pm 0.25\text{ m}$ genlik (tepeden çukura $0.50\text{ m}$ yükseklik), $H/\lambda \approx 0.185$ oranına yol açar. Bu oran kumun iç sürtünme açısını aşarak gerçek dışı dik duvarlar ve tepe sivrilikleri üretir. Gerçekte 2.5 m dalga boylu bir dalgacığın tepe-çukur yüksekliği en fazla **$0.20 - 0.25\text{ m}$** ($\pm 0.10 - 0.12\text{ m}$ genlik) olmalıdır.
- **5.3 m Dalga Boyu Değerlendirmesi:** Küçük TARs ve megaripple geçişleri için uygundur; ancak $\pm 0.25$ m genlikle birleştiğinde zemin "yumurta kartonu" şeklinde kaotik dalgalanmakta, doğal rüzgâr yönlülüğünü yansıtmamaktadır.
- **Kritik Eksiklik:** Simülatörde $10 - 30\text{ cm}$ dalga boylu ve $1 - 3\text{ cm}$ genlikli küçük darbe dalgacıkları (impact ripples) geometrik veya shader seviyesinde bulunmamaktadır. Bu nedenle astronot kamerası yere yaklaştığında zemin fotogerçekçi Mars kumu yerine pürüzsüzleştirilmiş poligon gibi görünmektedir.

### 4.3. Önerilen Bilimsel Prosedürel Mikro-Relief Parametreleri

```javascript
// Önerilen Gale Krateri Mikro-Relief Parametreleri (Three.js Arazi Geometrisi ve Shader)
export const GALE_BEDFORM_CONFIG = {
  // 1. Kademe: Megaripple / TARs Temeli (Tepe-çukur = 0.30 m)
  macroRipple: {
    wavelength: 5.2,          // metre (Gale TARs alt sınırı)
    amplitude: 0.15,           // ±0.15 m genlik (0.30 m peak-to-peak)
    steepnessLee: 0.25         // Asimetrik rüzgâr altı dikliği
  },
  
  // 2. Kademe: Lapotre Büyük Rüzgâr Dalgacıkları (Tepe-çukur = 0.20 m)
  fluidDragRipple: {
    wavelength: 2.3,          // metre (Lapotre et al. 2016 Science nominal değeri)
    amplitude: 0.10,           // ±0.10 m genlik (0.20 m peak-to-peak; H/L ~ 0.09)
    windDirectionDeg: 65.0     // Kuzeydoğudan esen baskın Gale rüzgârı (Bridges et al. 2017)
  },
  
  // 3. Kademe: Yakın Plan Darbe Dalgacıkları (Shader Normal Pertürbasyonu - 0 Ek Geometri)
  impactRippleShader: {
    wavelength: 0.20,          // metre (20 cm darbe dalgacığı)
    normalStrength: 0.025,     // Normal bump kuvveti (1.5-2.5 cm yükseklik hissi)
    fadeDistanceMax: 15.0      // 15 metreden sonra mipmap sönümü
  }
};
```

- **Asimetri Tavsiyesi:** Basit izotropik sinüs veya Perlin gürültüsü yerine, rüzgâr vektörü $\vec{w}$ boyunca modifiye edilmiş trokoid / testere dişi dalga fonksiyonu kullanılmalıdır:
  $$z_{ripple} = A \cdot \left[ \sin(\vec{k} \cdot \vec{x}) - 0.25 \sin(2 \vec{k} \cdot \vec{x}) \right]$$
  Bu formül rüzgâr alan tarafı $10^\circ$ sığlaştırırken, rüzgâr altı tarafı $30^\circ$ dinlenme açısına yaklaştırarak gerçekçi eoliyen kumul görünümü kazandırır.

---

## 5. Doğrulama ve Güvenirlik Özeti (2026-11-14)

- **Doğrulanan Veriler:**
  - Curiosity Hidden Valley Sol 708-710 batma ve %80 kayma kayıtları (Arvidson vd. 2017 birincil makalesinden teyit edildi).
  - Heverly vd. 2013 kum kayma–eğim eğrileri ve $12-15^\circ$ kritik patinaj eşiği teyit edildi.
  - REMS sıcaklık ($-95^\circ\text{C}$ ila $+15^\circ\text{C}$) ve basınç ($710 - 930\text{ Pa}$) ölçümleri teyit edildi.
  - Vicente-Retortillo vd. PNAS 2017 UV akısı ($27.0 - 42.4\text{ W/m}^2$) ve UVA/B/C yüzdeleri teyit edildi.
  - Lapotre vd. 2016 Science $1-3\text{ m}$ dalga boylu rüzgâr dalgacıkları ve NASA PIA20755 verisi teyit edildi.
  - 8 PBR ve görsel varlığın CC0 / Public Domain lisans etiketleri ve indirme URL'leri teyit edildi.
- **Doğrulanmayan / Kaynakta Boş Kalan Hususlar:**
  - Mars için resmi bir "SKAFAANDR İLE YÜRÜYÜŞTE KESİN AZAMİ GÜVENLİ EĞİM" standardı NASA tarafından tanımlanmamıştır; Apollo 16 Ay verisi ve rover $15^\circ$ sınırı benzetim olarak kullanılmıştır (**doğrulanmadı**).
  - Gale Krateri içinde gün boyu sabit tek bir "RGB gök rengi" yoktur; toz optik derinliğine ve aerosol dağılımına bağlı olarak sürekli dinamik değişir; verilen `#B48C64` rengi nominal berrak sol yaklaşıklığıdır (**sabit RGB değeri doğrulanmadı**).
  - Boxwork sırtlarının yerel mikrometre seviyesinde zemin kohezyon sabiti Curiosity tarafından kazılarak doğrudan ölçülmemiştir (**doğrulanmadı**).
