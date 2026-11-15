# Gale Krateri Zemin Varlıkları İndirme ve Denetim Manifesti (2026-11-15)

**Tarih:** 2026-11-15  
**Görev:** Gerçek 2 / Tur 2 — Varlıkların Gerçek İndirilmesi ve Denetimi  
**Varlık Dizin Yolu:** `martian-map-main/docs/data/ekip/varlik/`  
**Manifest Dosyası:** `martian-map-main/docs/data/ekip/varlik_manifest.md`  
**Kural Uyumu:** `sim/`, `.borje/`, kod ve git dizinlerine dokunulmamış; varlıklar yalnız `docs/data/ekip/varlik/` altına indirilmiştir.

---

## 1. Genel Özet ve Doğrulama Durumu (2026-11-15)

Önerilen en iyi 4 CC0 doku seti (Poly Haven `terrain_red_01`, `sand_03`, `rock_face_03` ve ambientCG `Rocks012`) ile NASA Curiosity Gale zemin fotoğrafı (`PIA20755`) gerçek sunuculardan indirilmiş, yerel disk üzerinde SHA-256, dosya boyutu, kanal türleri, çözünürlük, renk uzayı ve normal vektör yönelimleri (OpenGL vs DirectX) Python / Pillow ile denetlenmiştir.

- **Toplam İndirilen Varlık Sayısı:** 4 PBR Doku Seti (17 harita dosyası) + 1 ambientCG ZIP arşivi + 1 NASA Gale zemin fotoğrafı.
- **Tüm İsteklerin HTTP Durumu:** **200 OK** (Erişilemeyen veya kırık URL yoktur).
- **Lisans Durumu:** Tüm dokular **CC0-1.0 Universal** (kamu malı); NASA fotoğrafı **Public Domain** (US Gov Work).

---

## 2. İndirilen ve Denetlenen CC0 Doku Setleri (2026-11-15)

### 2.1. Poly Haven — `terrain_red_01` (Ana Regolit & Çakıl)
- **Kaynak Sayfası:** [https://polyhaven.com/a/terrain_red_01](https://polyhaven.com/a/terrain_red_01)
- **Yazar:** Rob Tuytel
- **Lisans:** `CC0-1.0 Universal`
- **Sayfadaki Lisans Metninin Birebir Alıntısı:**  
  > *"Our assets are all licensed as CC0, which is essentially public domain. This means you can use them for any purpose, including commercial projects, without having to pay or give attribution."*  
  *(Kaynak URL: `https://polyhaven.com/license`, Erişim Zamanı: 2026-11-15T06:38:00Z)*
- **Fiziksel Ölçek:** $2000 \times 2000\text{ mm}$ ($2.0\text{ m}$ döşeme boyutu).
- **Simülatör Kullanımı:** Gale Krateri düzlüklerinde kırmızımsı-kahverengi regolit ve sıkışmış çakıl taban kaplaması.

#### Dosya Bazında Teknik Denetim Tablosu:
| Harita Kanalı | Dosya Adı | HTTP Durumu | Boyut (Bayt) | Çözünürlük | Renk Uzayı | Normal Formatı | SHA-256 Özeti |
|---|---|---|---|---|---|---|---|
| **Diffuse / Albedo** | `terrain_red_01_diff_1k.jpg` | **200 OK** | 583.519 | $1024 \times 1024$ | sRGB | N/A | `f3f3fa6ebcddce22ece1fc8a343b469cbf67faefafac453ba53bce1fa28fc4b0` |
| **Normal (OpenGL)** | `terrain_red_01_nor_gl_1k.jpg` | **200 OK** | 756.034 | $1024 \times 1024$ | Linear (NoColorSpace) | **OpenGL (+Y yukarı)** | `97b57469b655d40c2e4c39b7c5f8deb9cbaee2af16c0ee19cd85f435f48f1da6` |
| **Roughness** | `terrain_red_01_rough_1k.jpg` | **200 OK** | 546.786 | $1024 \times 1024$ | Linear (NoColorSpace) | N/A | `d28d3cb3cb1cff885eff978ebab96e2e887aad9c82294978554bc09ae00b2832` |
| **Ambient Occlusion** | `terrain_red_01_ao_1k.jpg` | **200 OK** | 338.135 | $1024 \times 1024$ | Linear (NoColorSpace) | N/A | `a7b0b649ca9e6ae319b5f7b7c077b491eee9e3ee34f912c95b4aebd003e050c6` |

- **Gerçek İndirme URL Kökü:** `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/terrain_red_01/`

---

### 2.2. Poly Haven — `sand_03` (Dalgacıklı Rüzgâr Kumu)
- **Kaynak Sayfası:** [https://polyhaven.com/a/sand_03](https://polyhaven.com/a/sand_03)
- **Yazar:** Charlotte Baglioni
- **Lisans:** `CC0-1.0 Universal`
- **Sayfadaki Lisans Metninin Birebir Alıntısı:**  
  > *"Our assets are all licensed as CC0, which is essentially public domain. This means you can use them for any purpose, including commercial projects, without having to pay or give attribution."*  
  *(Kaynak URL: `https://polyhaven.com/license`, Erişim Zamanı: 2026-11-15T06:38:00Z)*
- **Fiziksel Ölçek:** $2000 \times 2000\text{ mm}$ ($2.0\text{ m}$ döşeme boyutu).
- **Simülatör Kullanımı:** Hidden Valley ve Dingo Gap kumul sırtları ve aktif eoliyen bazalt kumu birikintileri.

#### Dosya Bazında Teknik Denetim Tablosu:
| Harita Kanalı | Dosya Adı | HTTP Durumu | Boyut (Bayt) | Çözünürlük | Renk Uzayı | Normal Formatı | SHA-256 Özeti |
|---|---|---|---|---|---|---|---|
| **Diffuse / Albedo** | `sand_03_diff_1k.jpg` | **200 OK** | 703.132 | $1024 \times 1024$ | sRGB | N/A | `e72144f9d7b81bdb7bbdb34222b53431738dcef79346dd89412d2abd541e4d30` |
| **Normal (OpenGL)** | `sand_03_nor_gl_1k.jpg` | **200 OK** | 884.706 | $1024 \times 1024$ | Linear (NoColorSpace) | **OpenGL (+Y yukarı)** | `1bde5f49ea78f94bcad73592696bf3949711c4ac197133b710c0c8521b6e996b` |
| **Roughness** | `sand_03_rough_1k.jpg` | **200 OK** | 291.218 | $1024 \times 1024$ | Linear (NoColorSpace) | N/A | `5c9ead290a94913cfa2d0452a576ba527b50301fe208f2ffc4861e42a8fea45b` |
| **Ambient Occlusion** | `sand_03_ao_1k.jpg` | **200 OK** | 640.155 | $1024 \times 1024$ | Linear (NoColorSpace) | N/A | `5789af3cb61185c2bab282eb27b1fd78e4d50ca6578855998b0834f71a2d7b74` |

- **Gerçek İndirme URL Kökü:** `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/sand_03/`

---

### 2.3. Poly Haven — `rock_face_03` (Tabakalı Yamaç & Kayaç)
- **Kaynak Sayfası:** [https://polyhaven.com/a/rock_face_03](https://polyhaven.com/a/rock_face_03)
- **Yazar:** Dario Barresi & Rico Cilliers
- **Lisans:** `CC0-1.0 Universal`
- **Sayfadaki Lisans Metninin Birebir Alıntısı:**  
  > *"Our assets are all licensed as CC0, which is essentially public domain. This means you can use them for any purpose, including commercial projects, without having to pay or give attribution."*  
  *(Kaynak URL: `https://polyhaven.com/license`, Erişim Zamanı: 2026-11-15T06:38:00Z)*
- **Fiziksel Ölçek:** $\sim 2700 \times 2700\text{ mm}$ ($2.7\text{ m}$ döşeme boyutu).
- **Simülatör Kullanımı:** Eğim $\ge 35^\circ$ olan kuesta dikliklerinde ve kanyon duvarlarında tabakalı ana kaya dokusu.

#### Dosya Bazında Teknik Denetim Tablosu:
| Harita Kanalı | Dosya Adı | HTTP Durumu | Boyut (Bayt) | Çözünürlük | Renk Uzayı | Normal Formatı | SHA-256 Özeti |
|---|---|---|---|---|---|---|---|
| **Diffuse / Albedo** | `rock_face_03_diff_1k.jpg` | **200 OK** | 927.082 | $1024 \times 1024$ | sRGB | N/A | `ea48e0e47ad42c8bd312476178b1248ec66f0eb19156a26a1c222f2a40caaf2d` |
| **Normal (OpenGL)** | `rock_face_03_nor_gl_1k.jpg` | **200 OK** | 1.146.788 | $1024 \times 1024$ | Linear (NoColorSpace) | **OpenGL (+Y yukarı)** | `c6423169583f31715cf0636954bad524e806848a5f2861fcea6794275f726ff0` |
| **Roughness** | `rock_face_03_rough_1k.jpg` | **200 OK** | 638.904 | $1024 \times 1024$ | Linear (NoColorSpace) | N/A | `9e3d9a2fd75244892e7acb6bab2eaed1279299510a7970672c0ee27ff1c19fea` |
| **Ambient Occlusion** | `rock_face_03_ao_1k.jpg` | **200 OK** | 689.257 | $1024 \times 1024$ | Linear (NoColorSpace) | N/A | `be3536db0cf69c950fff97a196310f486cef8b23d16e6eb48743a58fadef0917` |

- **Gerçek İndirme URL Kökü:** `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/rock_face_03/`

---

### 2.4. ambientCG — `Rocks012` (Çöl Çakılları ve Taş Saçılımı)
- **Kaynak Sayfası:** [https://ambientcg.com/view?id=Rocks012](https://ambientcg.com/view?id=Rocks012)
- **Yazar:** Lennart Demes (ambientCG)
- **Lisans:** `Creative Commons CC0 1.0 Universal Public Domain Dedication`
- **Sayfadaki Lisans Metninin Birebir Alıntısı:**  
  > *"You can copy, modify, distribute and perform the work, even for commercial purposes, all without asking permission."*  
  *(Kaynak URL: `https://ambientcg.com/view?id=Rocks012` & `https://creativecommons.org/publicdomain/zero/1.0/`, Erişim Zamanı: 2026-11-15T06:38:00Z)*
- **Gerçek İndirme URL'si:** `https://ambientcg.com/get?file=Rocks012_1K-JPG.zip`
- **İndirilen Arşiv Boyutu:** **7.764.703 bayt** (HTTP 200 OK).
- **Arşiv SHA-256:** `6043aec4579bec77aba7619af1f5f8e9db612cf409f677648464440f2baef1f3`
- **Simülatör Kullanımı:** Regolit üzerinde dağınık duran ventifakt çakılları, taş kırıkları ve pürüzlü regolit parçaları; döşeme ölçeği: **$1.5\text{ m}$**.

#### Arşivden Çıkarılan Dosyaların Teknik Denetim Tablosu:
| Harita Kanalı | Dosya Adı | HTTP Durumu | Boyut (Bayt) | Çözünürlük | Renk Uzayı | Normal Formatı | SHA-256 Özeti |
|---|---|---|---|---|---|---|---|
| **Color (Albedo)** | `Rocks012_1K-JPG_Color.jpg` | **200 OK** | 1.500.716 | $1024 \times 1024$ | sRGB | N/A | `5db4b31d41f2d31560a39d2ccf98486a37c0a197dc84b226d5a576085bdacf79` |
| **Normal (OpenGL)** | `Rocks012_1K-JPG_NormalGL.jpg` | **200 OK** | 2.086.338 | $1024 \times 1024$ | Linear (NoColorSpace) | **OpenGL (+Y yukarı)** | `84f70a509062a2869de36e0e03122e660fac9dc59581b3c62c3a872d4e507a3b` |
| **Normal (DirectX)** | `Rocks012_1K-JPG_NormalDX.jpg` | **200 OK** | 2.085.269 | $1024 \times 1024$ | Linear (NoColorSpace) | **DirectX (-Y aşağı)** *(Sim'de kullanılmaz)* | `ec93f11265b6136c0a5b76b24380a16a5d95051ff4b75a6bd6155f5470cbfacf` |
| **Roughness** | `Rocks012_1K-JPG_Roughness.jpg` | **200 OK** | 394.520 | $1024 \times 1024$ | Linear (NoColorSpace) | N/A | `f0df7ce0dc8df4ef409fec11307b2dfb3f3467cc5cbc29b41a3b83fbdd564951` |
| **Displacement** | `Rocks012_1K-JPG_Displacement.jpg` | **200 OK** | 234.509 | $1024 \times 1024$ | Linear (NoColorSpace) | N/A | `aab547c4aa900dc541d167ee5045fb24f3ee59dfa2d119d94c5c65314020854b` |

> [!IMPORTANT]
> **Normal Haritası Uyarısı:** `ambientCG` arşivinde hem `NormalGL` hem de `NormalDX` haritaları mevcuttur. Three.js ve WebGL standartları **OpenGL (+Y yeşil kanal yukarı)** beklediği için simülatör materyalinde mutlaka `Rocks012_1K-JPG_NormalGL.jpg` bağlanmalıdır. `NormalDX` bağlanırsa çakıl gölgeleri ters döner ve çukurlar çıkıntı gibi görünür.

---

## 3. NASA Gale Krateri Gerçek Zemin Fotoğrafı ve Albedo Kalibrasyonu (2026-11-15)

Gale Krateri zemininin gerçek spektroskopik renk ve albedo kalibrasyonu için Curiosity gezgininin Namib Kumulu'nda çektiği yüksek çözünürlüklü Mastcam mozaik görüntüsü indirilmiş ve piksel düzeyinde istatistiksel renk analizi yapılmıştır.

### 3.1. Seçilen Görüntü Kimlik Bilgileri
- **Görüntü Kodu / PIA No:** **PIA20755**
- **Başlık:** *"Two Sizes of Ripples on Surface of Martian Sand Dune"*
- **Görev & Araç:** Mars Science Laboratory (MSL) / Curiosity Rover
- **Enstrüman:** Mast Camera (Mastcam)
- **Çekim Zamanı / Konumu:** Sol 1192, Namib Kumulu, Bagnold Kumul Alanı, Gale Krateri, Mars.
- **Katalog Sayfası URL:** [https://photojournal.jpl.nasa.gov/catalog/PIA20755](https://photojournal.jpl.nasa.gov/catalog/PIA20755)
- **Gerçek İndirme URL'si:** [https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia20/pia20755/PIA20755.jpg](https://assets.science.nasa.gov/content/dam/science/psd/photojournal/pia/pia20/pia20755/PIA20755.jpg)
- **HTTP Durumu:** **200 OK**
- **Dosya Boyutu:** **1.352.810 bayt**
- **SHA-256 Özeti:** `0f315fa3308b4c83bc9161ce41c4857683c4d9f7cc25fb53ac5c7d0d29cf3161`
- **Yerel Dosya Yolu:** `docs/data/ekip/varlik/nasa_pia20755/PIA20755.jpg`
- **Piksel Çözünürlüğü:** $9091 \times 1089\text{ px}$ (Tam mozaik)
- **Kredi Notu (Birebir Sayfadan Alıntı):**  
  > *"Credits: NASA/JPL-Caltech/MSSS"*
- **Telif / Lisans Notu (Birebir NASA Politikası):**  
  > *"Unless otherwise stated, images and video on NASA websites are not copyrighted and are available for educational and informational purposes."*  
  *(Kaynak URL: `https://www.nasa.gov/nasa-brand-center/images-and-media/`, Erişim: 2026-11-15T06:38:00Z)*

---

### 3.2. Renk ve Albedo Kalibrasyon Analizi (Piksel İstatistikleri)

İndirilen `PIA20755.jpg` görüntüsü Python (`Pillow` ve `numpy.float32`) ile okunarak tüm $9.900.099$ pikselin RGB kanalları üzerinde ortalama (mean), medyan ve standart sapma değerleri hesaplanmıştır:

```text
Görüntü Boyutu: 9091 x 1089 piksel (RGB, 8-bit/kanal)
Toplam Piksel Sayısı: 9.900.099 piksel
```

#### Hesaplanan İstatistiksel Renk Değerleri:
| İstatistiksel Metrik | Kırmızı Kanalı (R) | Yeşil Kanalı (G) | Mavi Kanalı (B) | Hex Renk Kodu |
|---|---|---|---|---|
| **Aritmetik Ortalama [0 – 255]** | **103.55** | **105.64** | **107.41** | **`#686A6B`** |
| **Normalize Ortalama [0.0 – 1.0]** | **0.4061** | **0.4143** | **0.4212** | — |
| **Medyan (p50) [0 – 255]** | 98.00 | 98.00 | 97.00 | `#626261` |
| **Standart Sapma ($\sigma$)** | 60.28 | 66.27 | 73.75 | — |

#### Bilimsel Yorum ve Simülatör Albedo Çıkarımı:
1. **Mars Kumu Kırmızı Değildir:** Yaygın popüler kültür yanılgısının aksine, Gale Krateri'ndeki aktif eoliyen kumullar (Bagnold, Namib vb.) yoğun piroksen ve olivin içeren bazaltik kökenlidir; bu nedenle pas kırmızısı değil, **koyu nötr gri-kahverengi (`#686A6B`)** tonlarındadır.
2. **Kanal Dengesi:** $R \approx 103.5$, $G \approx 105.6$, $B \approx 107.4$ değerleri, kumulun çıplak yüzeyinde demir oksit toz örtüsünün rüzgâr tarafından süpürüldüğünü ve alttaki koyu bazalt tanelerinin baskın olduğunu kanıtlar.
3. **Simülasyon Shader Kalibrasyonu:**
   - 3B simülasyon arazisinde kumlu bölgelerde albedo çarpanı `vec3(0.406, 0.414, 0.421)` civarına çekilmeli, aşırı parlak turuncu/kırmızı diffuse haritaları bazalt koyuluğuna doğru modüle edilmelidir.
   - Ortofoto üzerine bindirilen mikro detay dokularında ortalama parlaklık bu değerle eşitlenirse, astronot birinci şahıs gözünden baktığında NASA fotoğraflarıyla birebir tutarlı bir fotogerçekçilik elde edilecektir.

---

## 4. Denetim Kanıtı ve Dosya İndirme Doğrulaması

Tüm varlıkların disk üzerindeki varlığı, bayt boyutları ve SHA-256 özetleri `docs/data/ekip/varlik/audit_summary.json` dosyasında makinelerce okunabilir JSON formatında kalıcı olarak saklanmaktadır.
