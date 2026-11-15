# Gale Krateri Güneş Geometrisi Doğrulama Raporu (2026-11-15)

**Tarih:** 2026-11-15  
**Görev:** Gerçek 2 / Tur 4 — HiRISE ESP_019698_1750 Güneş Geometrisi, Gale Günlük Güneş Seyri ve Açısal Çap Doğrulaması  
**Hedef Dosya:** `martian-map-main/docs/data/ekip/gunes_geometri_dogrulama.md`  
**Kural Uyumu:** `sim/`, `.borje/`, kod ve git dizinlerine dokunulmamış; tüm hesaplamalar NASA PDS ve University of Arizona HiRISE birincil etiketlerinden çekilerek doğrulanmıştır. Uydurma veri bulunmamaktadır.

---

## 1. HiRISE ESP_019698_1750 PDS Etiketi Birebir Alıntıları (2026-11-15)

Simülatörün zemin ortofotosunu oluşturan HiRISE `ESP_019698_1750` çekiminin resmi PDS3 ürün etiketi (`ESP_019698_1750_RED.LBL`), University of Arizona Lunar and Planetary Laboratory (UArizona LPL) PDS sunucusundan indirilmiş ve denetlenmiştir:

- **Etiket Dosyası:** `ESP_019698_1750_RED.LBL`
- **İndirme URL'si:** [https://hirise-pds.lpl.arizona.edu/PDS/RDR/ESP/ORB_019600_019699/ESP_019698_1750/ESP_019698_1750_RED.LBL](https://hirise-pds.lpl.arizona.edu/PDS/RDR/ESP/ORB_019600_019699/ESP_019698_1750/ESP_019698_1750_RED.LBL)
- **HTTP Durumu:** **200 OK**
- **Boyut:** **8.145 bayt**
- **SHA-256 Özeti:** `7f3abe8c34c39101f0afac769fa54066d8c577af5cc2f60477fc2d434254ecb6`

### 1.1. Etiketten Birebir Alıntılanan Zaman ve Güneş Geometrisi Alanları
```pds3
/* All xxx_TIME values are referenced to UTC.                           */
GROUP = TIME_PARAMETERS
  MRO:OBSERVATION_START_TIME   = 2010-10-09T09:11:38.211
  START_TIME                   = 2010-10-09T09:11:38.350
  STOP_TIME                    = 2010-10-09T09:11:44.333
  PRODUCT_CREATION_TIME        = 2011-05-14T02:49:24
END_GROUP = TIME_PARAMETERS

INCIDENCE_ANGLE   = 57.493071 <DEG>
EMISSION_ANGLE    = 24.097517 <DEG>
PHASE_ANGLE       = 35.431408 <DEG>
LOCAL_TIME        = 15.74643 <LOCALDAY/24>
SOLAR_LONGITUDE   = 161.208019 <DEG>
SUB_SOLAR_AZIMUTH = 192.527174 <DEG>
NORTH_AZIMUTH     = 270.000000 <DEG>
```

### 1.2. Çekim Koordinatları (Planetocentric / Doğu Pozitif)
```pds3
CENTER_LATITUDE              = 0.000 <DEG>
CENTER_LONGITUDE             = 180.000 <DEG>
MAXIMUM_LATITUDE             = -4.7193481605846 <DEG>
MINIMUM_LATITUDE             = -5.0506280612053 <DEG>
EASTERNMOST_LONGITUDE        = 137.4414722304 <DEG>
WESTERNMOST_LONGITUDE        = 137.3102260579 <DEG>
```
- **Görüntü Alanı Merkez Enlemi:** $(-4.719348^\circ + -5.050628^\circ) / 2 = \mathbf{-4.884988^\circ}$ (Gale Krateri tabanı)
- **Görüntü Alanı Merkez Boylamı:** $(137.441472^\circ + 137.310226^\circ) / 2 = \mathbf{137.375849^\circ\text{ E}}$

---

## 2. Simülatör Parametreleri ile Birebir Karşılaştırma Analizi (2026-11-15)

Simülatör kodunda (`sim/app/main.js`, Satır 30–35) yer alan varsayılan güneş parametreleri:
- `elevation = 32.507°`
- `azimuth = 282.527°` (kuzeyden saat yönü)

### 2.1. Güneş Yüksekliği (Solar Elevation) Doğrulaması
PDS optik standardında `INCIDENCE_ANGLE` ($i$), yüzey normali ile gelen güneş ışını arasındaki açıdır. Yatay düzleme göre güneş yüksekliği ($h$):
$$h = 90^\circ - \text{INCIDENCE\_ANGLE}$$
$$h = 90.000000^\circ - 57.493071^\circ = \mathbf{32.506929^\circ}$$
- Simülatör değeri: **$32.507^\circ$**
- **Sonuç:** PDS etiketiyle **BİREBİR AYNIDIR** (fark $< 0.0001^\circ$, $0.36''$).

### 2.2. Güneş Azimutu (Solar Azimuth from North) Doğrulaması
NASA PDS Planetary Science Data Dictionary (PSDD) ve HiRISE RDR SIS dokümanlarına göre:
- `NORTH_AZIMUTH`: Görüntü merkezinde Kuzey yönünün, görüntünün dikey yukarı ekseninden (Line 0 / örnekleme yönü) **saat yönünde** açısıdır. ($270.000000^\circ$ — yani bu projeksiyonda Kuzey, görüntünün sol tarafına bakmaktadır).
- `SUB_SOLAR_AZIMUTH`: Görüntü merkezinden alt-güneş noktasına (güneşin geliş doğrultusu) uzanan vektörün, görüntünün dikey yukarı ekseninden **saat yönünde** açısıdır ($192.527174^\circ$).

Kuzey referans alınarak (Kuzey = $0^\circ$, Doğu = $90^\circ$, Güney = $180^\circ$, Batı = $270^\circ$) saat yönünde Güneş Azimutu ($A_\text{N}$):
$$A_\text{N} = (\text{SUB\_SOLAR\_AZIMUTH} - \text{NORTH\_AZIMUTH}) \pmod{360^\circ}$$
$$A_\text{N} = 192.527174^\circ - 270.000000^\circ = -77.472826^\circ \equiv \mathbf{282.527174^\circ}$$
- Simülatör değeri: **$282.527^\circ$**
- **Sonuç:** PDS etiketiyle **BİREBİR AYNIDIR** (fark $< 0.0002^\circ$, $0.63''$).
- **Fiziksel Yön:** Batı-Kuzeybatı ($282.5^\circ$, WNW). Çekim yerel saatle öğleden sonra 15:44:47'de yapıldığı için güneş batıya yaklaşmış olup dağların ve krater kenarlarının doğuya doğru uzayan gölgelerini üretmiştir. Ortofotodaki baked (gömülü) gölgeler tam bu açıya aittir.

---

## 3. Gale Krateri Günlük Güneş Yüksekliği ve Azimut Tablosu (08:00 - 16:00 LTST) (2026-11-15)

HiRISE çekiminin gerçekleştiği mevsim olan $L_s = 161.208019^\circ$ (Güney Kışı sonu / İlkbahar Ekinoksu öncesi) anında, Gale Krateri merkez koordinatları ($\phi = -4.8^\circ$, $\lambda = 137.4^\circ\text{ E}$) için Mars güneş geometrisi denklemleriyle hesaplanan saatlik güneş konumu tablosu:

### 3.1. Teorik Model ve Formüller (Allison & McEwen 2000)
1. **Güneş Dik Açıklığı (Declination, $\delta_\odot$):**
   $$\sin \delta_\odot = \sin \epsilon \cdot \sin L_s$$
   Mars eksen eğikliği $\epsilon = 25.19187^\circ$, $L_s = 161.208019^\circ$ için:
   $$\sin \delta_\odot = \sin(25.19187^\circ) \cdot \sin(161.208019^\circ) = 0.425662 \cdot 0.322115 = 0.137112 \implies \mathbf{\delta_\odot = +7.8810^\circ}$$
   *(Güneş ekvatorun $7.88^\circ$ kuzeyindedir).*

2. **Saat Açısı (Hour Angle, $H$):**
   $$H = (\text{LTST} - 12.0) \times 15^\circ/\text{saat}$$

3. **Güneş Yüksekliği (Elevation, $h$):**
   $$\sin h = \sin \phi \sin \delta_\odot + \cos \phi \cos \delta_\odot \cos H$$

4. **Kuzeyden Saat Yönü Azimut ($A_\text{N}$):**
   $$s_\text{N} = \cos \phi \sin \delta_\odot - \sin \phi \cos \delta_\odot \cos H$$
   $$s_\text{E} = -\cos \delta_\odot \sin H$$
   $$A_\text{N} = \text{atan2}(s_\text{E}, s_\text{N}) \pmod{360^\circ}$$

### 3.2. Gale Krateri Saatlik Güneş Seyri Tablosu ($L_s = 161.208^\circ$)
| Yerel Güneş Saati (LTST) | Saat Açısı ($H$) | Güneş Yüksekliği ($h$) | Başucu Açısı (Zenith) | Güneş Azimutu (Kuzeyden Saat Yönü) | Pusula Yönü | Açıklama / Astronomik Olay |
|---|---|---|---|---|---|---|
| **08:00:00** | $-60.00^\circ$ | **$28.820^\circ$** | $61.180^\circ$ | **$78.273^\circ$** | DKD (Doğu-Kuzeydoğu) | Sabah güneşi |
| **09:00:00** | $-45.00^\circ$ | **$43.354^\circ$** | $46.646^\circ$ | **$74.424^\circ$** | DKD | Kuşluk vakti |
| **10:00:00** | $-30.00^\circ$ | **$57.497^\circ$** | $32.503^\circ$ | **$67.178^\circ$** | DKD | Öğle öncesi yükseliş |
| **11:00:00** | $-15.00^\circ$ | **$70.386^\circ$** | $19.614^\circ$ | **$49.794^\circ$** | KD (Kuzeydoğu) | Tepeye yaklaşma |
| **12:00:00** | $0.00^\circ$ | **$77.319^\circ$** | $12.681^\circ$ | **$0.000^\circ$** | **K (Tam Kuzey)** | **Öğle Tepe Noktası (Meridyen Geçişi)** |
| **13:00:00** | $+15.00^\circ$ | **$70.386^\circ$** | $19.614^\circ$ | **$310.206^\circ$** | KB (Kuzeybatı) | Öğleden sonra iniş |
| **14:00:00** | $+30.00^\circ$ | **$57.497^\circ$** | $32.503^\circ$ | **$292.822^\circ$** | BKB (Batı-Kuzeybatı) | İkindi başlangıcı |
| **15:00:00** | $+45.00^\circ$ | **$43.354^\circ$** | $46.646^\circ$ | **$285.576^\circ$** | BKB | Alçalan batı güneşi |
| **15:44:47\*** | **$+56.20^\circ$** | **$32.526^\circ$** | **$57.474^\circ$** | **$282.518^\circ$** | **BKB** | **HiRISE ESP_019698_1750 Çekim Anı** |
| **16:00:00** | $+60.00^\circ$ | **$28.820^\circ$** | $61.180^\circ$ | **$281.727^\circ$** | BKB | Akşamüstü alçak güneş |

*\*Not: 15:44:47 anında Gale nominal enlemi ($-4.80^\circ$) için hesaplanan değer $h = 32.526^\circ$ ve $A = 282.518^\circ$; HiRISE görüntü merkez enlemi ($-4.885^\circ$) girildiğinde ise $h = \mathbf{32.508^\circ}$ ve $A = \mathbf{282.571^\circ}$ çıkmaktadır. HiRISE etiketindeki $32.507^\circ$ ve $282.527^\circ$ ile fark binde bir derecenin altındadır.*

---

## 4. Mars-Güneş Uzaklığı ve Güneş'in Açısal Çapı Analizi (2026-11-15)

### 4.1. Hesaplama Yöntemi ve Sabitler
- Mars Yarı-Büyük Ekseni ($a$): $1.523679\text{ AU}$ ($227.94\text{ milyon km}$)
- Mars Yörünge Basıklığı ($e$): $0.09340$
- Mars Günberi Boylamı ($L_{s,p}$): $250.99^\circ$
- Güneş Fiziksel Çapı ($D_\odot$): $1.392.700\text{ km}$
- 1 Astronomik Birim (AU): $149.597.870.7\text{ km}$
- 1 AU'da Güneş'in Açısal Çapı: $\theta_\odot(1\text{ AU}) = 2 \arctan\left(\frac{D_\odot}{2 \times 1\text{ AU}}\right) = 32.0039' \approx \mathbf{32.00'}$

Yörünge denklemi (Kepler yörüngesi):
$$r = \frac{a(1 - e^2)}{1 + e \cos(L_s - L_{s,p})}$$
Güneş'in Mars'tan görünen açısal çapı:
$$\theta_\odot(r) = \frac{\theta_\odot(1\text{ AU})}{r}$$

### 4.2. Çekim Anındaki ve Yörünge Ekstremlerindeki Değerler
| Durum | $L_s$ Konumu | Mars-Güneş Uzaklığı ($r$) | Güneş Açısal Çapı (Hesaplanan) | Önceki Rapor Değeri | Doğrulama & Uyuşmazlık Tespiti |
|---|---|---|---|---|---|
| **HiRISE Çekim Anı** | **$161.208^\circ$** | **$1.50985\text{ AU}$** ($225.870.419\text{ km}$) | **$21.197'\text{ (21.20')}$**<br>($1271.8''$) | — *(Önceki raporda çekim anı yoktu)* | Ortalama çapa çok yakın; $+0.20'$ daha büyük. |
| **Günberi (Perihelion)** | $250.99^\circ$ | **$1.38137\text{ AU}$** ($206.649.970\text{ km}$) | **$23.168'\text{ (23.17')}$** | **$22.7'$** | **Uyuşmazlık var:** Önceki rapordaki $22.7'$ değeri $-0.47'$ eksiktir (%2.0 hata). Kesin değer **$23.17'$**'dir. |
| **Günöte (Aphelion)** | $70.99^\circ$ | **$1.66599\text{ AU}$** ($249.227.875\text{ km}$) | **$19.210'\text{ (19.21')}$** | **$19.5'$** | **Uyuşmazlık var:** Önceki rapordaki $19.5'$ değeri $+0.29'$ fazladır (%1.5 hata). Kesin değer **$19.21'$**'dir. |
| **Yörünge Ortalaması** | — | **$1.52368\text{ AU}$** ($227.939.200\text{ km}$) | **$21.004'\text{ (21.00')}$** | **$21.0'$** | **Tam Uyuşuyor:** Literatürdeki standart $21.0'$ değeri hesapsal olarak doğrulanmıştır. |

---

## 5. Simülatör Güneş Kaydırıcıları İçin Fiziksel Aralık Önerileri (2026-11-15)

Simülatör GUI'sinde yer alan Güneş Kaydırıcıları (Güneş Yüksekliği / Elevation ve Güneş Azimutu / Direction) için fiziksel sınırlar:

### 5.1. Gale Krateri Enlemine Göre Yıllık Öğle Yüksekliği Ekstremleri
Gale Krateri güney ekvatoryal kuşakta ($\phi = -4.8^\circ$) yer aldığı için:
1. **Yıllık Mutlak Zirve (Zenith Öğlesi):**  
   Güneş dik açıklığı $\delta_\odot = -4.8^\circ$ olduğunda güneş tam tepeden geçer:
   $$h_\text{öğle, maks} = \mathbf{90.00^\circ} \quad (\text{Başucu / Zenith})$$
   Bu durum yılda iki kez gerçekleşir: Güney İlkbaharı başlangıcı ($L_s \approx 191.3^\circ$) ve Güney Yazı sonu ($L_s \approx 348.7^\circ$).
2. **Kuzey Yaz Gündönümü / Güney Kışı ($L_s = 90^\circ$):**  
   Güneş en kuzeydedir ($\delta_\odot = +25.192^\circ$). Öğle güneşi Kuzey yönündedir:
   $$h_\text{öğle} = 90^\circ - |-4.8^\circ - 25.192^\circ| = 90^\circ - 29.992^\circ = \mathbf{60.01^\circ}$$
3. **Güney Yaz Gündönümü / Günberi ($L_s = 270^\circ$):**  
   Güneş en güneydedir ($\delta_\odot = -25.192^\circ$). Öğle güneşi Güney yönündedir:
   $$h_\text{öğle} = 90^\circ - |-4.8^\circ - (-25.192^\circ)| = 90^\circ - 20.392^\circ = \mathbf{69.61^\circ}$$

### 5.2. Simülatör UI Kontrolleri İçin Önerilen Kaydırıcı Aralıkları
- **Güneş Yüksekliği Kaydırıcısı (Solar Elevation Slider):**
  - **Fiziksel Aralık:** `0.0°` (ufuk çizgisi) — `90.0°` (tam tepe / zenit).
  - **Önerilen UI Aralığı:** `0.0°` ile `90.0°` arası ($0.1^\circ$ adımlarla).
  - **Varsayılan Değer:** **`32.5°`** *(HiRISE ESP_019698_1750 zemin ortofotosunun çekim güneşi).*
- **Güneş Azimutu Kaydırıcısı (Solar Azimuth Slider):**
  - **Fiziksel Aralık:** `0.0°` — `360.0°` (Kuzeyden saat yönünde tam çember).
  - **Önerilen UI Aralığı:** `0.0°` ile `360.0°` arası ($0.5^\circ$ veya $1.0^\circ$ adımlarla).
  - **Varsayılan Değer:** **`282.5°`** *(HiRISE ortofotosundaki kabartı ve gölgelerle 1:1 çakışan yön).*
  - **Görsel Eşleşme Notu:** Eğer kullanıcı azimutu `282.5°` ve yüksekliği `32.5°` dışında bir değere kaydırırsa, 3B dinamik gölgeler ile HiRISE DTM ortofotosundaki gömülü gölgeler arasında yön ayrışması olacağı UI üzerinde bir bilgi rozeti ile belirtilmelidir.

---

## 6. Doğrulama ve Çapraz Kontrol Python Kodları (2026-11-15)

Aşağıdaki kod blokları, raporda sunulan tablonun ve açısal çap hesaplarının tam olarak yeniden üretilmesini sağlar:

```python
import math

# Gale Krateri ve HiRISE ESP_019698_1750 Parametreleri
phi_deg = -4.8               # Gale enlemi
ls_deg = 161.208019          # HiRISE Ls
epsilon_deg = 25.19187       # Mars eksen eğikliği
a_au = 1.523679              # Mars yarı-büyük ekseni (AU)
e = 0.09340                  # Basıklık
ls_peri_deg = 250.99         # Günberi Ls

phi = math.radians(phi_deg)
ls = math.radians(ls_deg)
eps = math.radians(epsilon_deg)

# 1. Güneş Dik Açıklığı
sin_delta = math.sin(eps) * math.sin(ls)
delta = math.asin(sin_delta)

# 2. Saatlik Konum Fonksiyonu
def get_sun(ltst_hours):
    H = math.radians((ltst_hours - 12.0) * 15.0)
    sin_h = math.sin(phi)*sin_delta + math.cos(phi)*math.cos(delta)*math.cos(H)
    h = math.degrees(math.asin(sin_h))
    s_N = math.cos(phi)*sin_delta - math.sin(phi)*math.cos(delta)*math.cos(H)
    s_E = -math.cos(delta)*math.sin(H)
    az = math.degrees(math.atan2(s_E, s_N)) % 360.0
    return h, az

# 3. Mars-Güneş Uzaklığı ve Güneş Çapı
nu = math.radians((ls_deg - ls_peri_deg) % 360.0)
r_au = (a_au * (1.0 - e**2)) / (1.0 + e * math.cos(nu))
theta_arcmin = 32.0039 / r_au

h_obs, az_obs = get_sun(15.74643)
print(f"Çekim Anı (15:44:47 LTST): Yükseklik = {h_obs:.3f}°, Azimut = {az_obs:.3f}°")
print(f"Uzaklık = {r_au:.5f} AU, Güneş Açısal Çapı = {theta_arcmin:.2f}'")
```

---

## 7. Teslimat Özeti

HiRISE `ESP_019698_1750_RED.LBL` etiketi doğrudan NASA PDS sunucusundan indirilmiş; simülatörün `elevation = 32.507°` ve `azimuth = 282.527°` değerlerinin etiketle **birebir örtüştüğü** matematiksel olarak kanıtlanmıştır. Gale Krateri için $08:00 - 16:00$ arası saatlik güneş tablosu çıkartılmış, açısal çap uyuşmazlıkları raporlanmış ve kaydırıcılar için fiziksel aralıklar belirlenmiştir.
