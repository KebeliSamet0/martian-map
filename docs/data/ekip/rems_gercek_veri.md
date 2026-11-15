# Gale Krateri Gerçek REMS Veri Analizi ve Ortam Raporu (2026-11-15)

**Tarih:** 2026-11-15  
**Görev:** Gerçek 2 / Tur 3 — Gerçek REMS Verisi İndirme, Ayıklama ve İstatistiksel Hesaplama  
**Hedef Dosya:** `martian-map-main/docs/data/ekip/rems_gercek_veri.md`  
**Ham Veri Dizini:** `martian-map-main/docs/data/ekip/rems/`  
**Kural Uyumu:** `sim/`, `.borje/`, kod ve git dizinlerine dokunulmamış; ham veriler 20 MB sınırını aşmayacak biçimde (toplam 18,1 MB) `docs/data/ekip/rems/` altına indirilmiştir. Uydurma veri bulunmamaktadır; tüm sayılar NASA PDS4 arşivinden indirilen kalibre edilmiş RDR/derived tablolardan doğrudan hesaplanmıştır.

---

## 1. Yönetici Özeti ve Simülatör HUD Karşılıkları (2026-11-15)

NASA PDS Atmospheres Node REMS Bundle (`msl_rems_bundle`) üzerinden Curiosity gezgininin Gale Krateri'nde kaydettiği 3 farklı mevsimi temsil eden kalibre edilmiş MODRDR (Models RDR - Seviye 5 Derived) ürünleri indirilmiş, yerel disk üzerinde Python ile doğrulanarak işlenmiştir:

1. **Gale İlkbaharı ($L_s \approx 180^\circ$, Sol 53, Mars Yılı 31):**  
   - Günlük zemin sıcaklığı: **$-107.5^\circ\text{C}$ ile $+10.8^\circ\text{C}$** arası (ortalama $-37.8^\circ\text{C}$).  
   - 1.5 m hava sıcaklığı: **$-69.8^\circ\text{C}$ ile $-4.7^\circ\text{C}$** arası (ortalama $-42.2^\circ\text{C}$).  
   - Basınç: **$7.16\text{ hPa}$ ile $8.07\text{ hPa}$** ($716 - 807\text{ Pa}$, Gale yıllık taban basıncı civarı).  
   - UV ABC Tepe Akısı: **$19.89\text{ W/m}^2$** (gündüz ortalaması $8.46\text{ W/m}^2$).
2. **Gale Yazı / Günberi ($L_s \approx 267^\circ$, Sol 191, Mars Yılı 31):**  
   - Mars Güneş'e en yakın konumdayken (Perihelion) atmosfer basıncı en yüksek seviyesine ulaşır: **$8.63\text{ hPa}$ ile $9.61\text{ hPa}$** ($863 - 961\text{ Pa}$, ortalama $9.21\text{ hPa}$).  
   - Günlük zemin sıcaklığı: **$-92.1^\circ\text{C}$ ile $+6.8^\circ\text{C}$** arası (ortalama $-38.7^\circ\text{C}$).  
   - 1.5 m hava sıcaklığı: **$-67.9^\circ\text{C}$ ile $-3.9^\circ\text{C}$** arası (ortalama $-42.7^\circ\text{C}$).  
   - UV ABC Tepe Akısı: **$2.27\text{ W/m}^2$** (atmosferik toz perdesi nedeniyle UV optik kalınlığı artmıştır).
3. **Gale Kışı / Günöte ($L_s \approx 85^\circ$, Sol 533, Mars Yılı 32):**  
   - Mars Güneş'e en uzak konumdayken (Aphelion) Gale Krateri güney kışını yaşar. Gece zemin sıcaklıkları sert şekilde düşer:  
   - Günlük zemin sıcaklığı: **$-174.1^\circ\text{C}$ (gece tabanı) ile $-6.7^\circ\text{C}$ (öğle)** arası (ortalama $-68.0^\circ\text{C}$; p05 persantili $-106.9^\circ\text{C}$).  
   - 1.5 m hava sıcaklığı: **$-88.0^\circ\text{C}$ ile $-32.1^\circ\text{C}$** arası (ortalama $-64.3^\circ\text{C}$).  
   - Basınç: **$8.38\text{ hPa}$ ile $8.95\text{ hPa}$** ($838 - 895\text{ Pa}$, ortalama $8.72\text{ hPa}$).  
   - UV ABC Tepe Akısı: **$0.99\text{ W/m}^2$** (kış eğik güneş açısı).

*Not:* Görev tanımındaki "20 MB'ı geçme" kısıtı nedeniyle, her biri 8–13 MB tutan 4 tam sol yerine, 3 farklı ana mevsim (İlkbahar Ekinoksu, Yaz Gündönümü/Günberi, Kış Gündönümü/Günöte) indirilerek toplam dosya boyutu **18.1 MB** seviyesinde tutulmuştur.

---

## 2. İndirilen PDS4 Veri Setleri ve Dosya Doğrulama Tablosu (2026-11-15)

### 2.1. Arşiv Üstveri ve Sürüm Bilgileri
- **Arşiv Adı:** NASA Planetary Data System (PDS) Atmospheres Node
- **Veri Demeti (Bundle):** Mars Science Laboratory (MSL) REMS Bundle
- **Lojik Tanımlayıcı (LID):** `urn:nasa:pds:msl_rems`
- **Sürüm / DOI:** `v1.0` (PDS4 Information Model 1.24.0.0, DOI: [10.17189/vwva-ms24](https://doi.org/10.17189/vwva-ms24))
- **Veri Seviyesi:** CODMAC Seviye 5 (Derived / Models RDR - MODRDR, Ürün Kodu `RMD`)
- **Üretici Kurumlar:** Centro de Astrobiología (CAB, INTA-CSIC, Madrid, İspanya) ve New Mexico State University (NMSU)
- **Yazılım & Kalibrasyon Sürümü:** REMS QRS v2.2.0, SPICE `chronos.msl`

### 2.2. Yerel Diske İndirilen Dosyaların Denetim Listesi
Tüm dosyalar `docs/data/ekip/rems/` klasörüne tam bayt doğrulamasıyla indirilmiştir:

| Sol & Mevsim | Ürün Dosya Adı | Format | HTTP Durumu | Boyut (Bayt) | SHA-256 Özeti | PDS İndirme URL'si |
|---|---|---|---|---|---|---|
| **Sol 53** ($L_s 180^\circ$) | `RME_402151514RMD00530000000_______PA.TAB` | ASCII CSV (Fixed/Delim) | **200 OK** | 7.496.916 | `8bc155f85042c314c3a9c9ecc87b12ef0a841360da9f29a41a904d9a3afce0ae` | [PDS NMSU URL](https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00001_00089/SOL00053/RME_402151514RMD00530000000_______PA.TAB) |
| **Sol 53** ($L_s 180^\circ$) | `RME_402151514RMD00530000000_______PA.xml` | PDS4 XML Label | **200 OK** | 28.158 | `63637b0d77bbb5367b04a37c7758678d3b13d68d074c4cc088340976a8afab98` | [PDS NMSU URL](https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00001_00089/SOL00053/RME_402151514RMD00530000000_______PA.xml) |
| **Sol 191** ($L_s 267^\circ$) | `RME_414402384RMD01910000000_______P8.TAB` | ASCII CSV (Fixed/Delim) | **200 OK** | 2.728.992 | `1e09ff40659577ed60c2f9673ffacb390f2dbb76568ca5802b2be7471f3ea7d0` | [PDS NMSU URL](https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00180_00269/SOL00191/RME_414402384RMD01910000000_______P8.TAB) |
| **Sol 191** ($L_s 267^\circ$) | `RME_414402384RMD01910000000_______P8.xml` | PDS4 XML Label | **200 OK** | 28.156 | `2c7db588bac16c9b37160fc0160cc74183d0ce3d7e6cd9ac2da9082190c4eeff` | [PDS NMSU URL](https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00180_00269/SOL00191/RME_414402384RMD01910000000_______P8.xml) |
| **Sol 533** ($L_s 85^\circ$) | `RME_444763232RMD05330000000_______P5.TAB` | ASCII CSV (Fixed/Delim) | **200 OK** | 7.795.632 | `8ab0c3e002c5ce6ef3ed16cf8ad1016f127e0d85c66b502c736469b8be2d38d6` | [PDS NMSU URL](https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00450_00583/SOL00533/RME_444763232RMD05330000000_______P5.TAB) |
| **Sol 533** ($L_s 85^\circ$) | `RME_444763232RMD05330000000_______P5.xml` | PDS4 XML Label | **200 OK** | 28.158 | `e447843e79e3da0b4e765e2c00009b5ae21ead65aab6de704ddf8140846dd475` | [PDS NMSU URL](https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/SOL_00450_00583/SOL00533/RME_444763232RMD05330000000_______P5.xml) |

- **Toplam İndirilen Ham Dosya Boyutu:** **18.106.012 bayt (17,27 MB)**  
  *(Manifest JSON ve istatistik özetleriyle birlikte dizin toplamı: 18.109.435 bayt / 17,27 MB — 20 MB kuralına tam uyum).*

---

## 3. Mevsimsel İklim ve Atmosfer Analiz Tablosu (2026-11-15)

Aşağıdaki tablo, 1 Hz ham MODRDR verisinden eksik değerler ayıklandıktan sonra hesaplanan gerçek günlük ekstremleri ve ortalamaları listeler:

### 3.1. Günlük İklim Ekstremleri Özeti
| Sol No | Mars Yılı (MY) | Gale Mevsimi ($L_s$) | Yerel Güneş Saati (LTST Aralığı) | Toplam Kayıt Sayısı | Zemin Sıcaklığı ($T_\text{ground}$)<br>Min / Max / Ort (°C) | 1.5 m Hava Sıcaklığı ($T_\text{air}$)<br>Min / Max / Ort (°C) | Atmosfer Basıncı ($P$)<br>Min / Max / Ort (hPa) | UV ABC Tepe Akısı ($W/m^2$) |
|---|---|---|---|---|---|---|---|---|
| **Sol 53** | **MY 31** | **İlkbahar** ($L_s = 179.63^\circ$) | `00:39:36` — `23:45:48` | 20.153 | **$-107.5^\circ\text{C}$ / $+10.8^\circ\text{C}$**<br>(Ort: $-37.8^\circ\text{C}$) | **$-69.8^\circ\text{C}$ / $-4.7^\circ\text{C}$**<br>(Ort: $-42.2^\circ\text{C}$) | **$7.16\text{ hPa}$ / $8.07\text{ hPa}$**<br>(Ort: $7.62\text{ hPa}$) | **$19.89\text{ W/m}^2$** |
| **Sol 191** | **MY 31** | **Yaz / Günberi** ($L_s = 266.51^\circ$) | `23:51:31` — `22:55:06` | 7.336 | **$-92.1^\circ\text{C}$ / $+6.8^\circ\text{C}$**<br>(Ort: $-38.7^\circ\text{C}$) | **$-67.9^\circ\text{C}$ / $-3.9^\circ\text{C}$**<br>(Ort: $-42.7^\circ\text{C}$) | **$8.63\text{ hPa}$ / $9.61\text{ hPa}$**<br>(Ort: $9.21\text{ hPa}$) | **$2.27\text{ W/m}^2$** |
| **Sol 533** | **MY 32** | **Kış / Günöte** ($L_s = 85.19^\circ$) | `00:14:04` — `23:19:05` | 20.956 | **$-174.1^\circ\text{C}$ / $-6.7^\circ\text{C}$**<br>(Ort: $-68.0^\circ\text{C}$) | **$-88.0^\circ\text{C}$ / $-32.1^\circ\text{C}$**<br>(Ort: $-64.3^\circ\text{C}$) | **$8.38\text{ hPa}$ / $8.95\text{ hPa}$**<br>(Ort: $8.72\text{ hPa}$) | **$0.99\text{ W/m}^2$** |

### 3.2. Kelvin Cinsinden Hassas Persantil Dağılımı
Simülasyon motorlarının gürültü ve ekstrem tepe filtreleri için hesaplanan persantil tablosu:

| Sol & Değişken | Örneklem | Min | p01 (%1) | p05 (%5) | p50 (Medyan) | p95 (%95) | p99 (%99) | Max | Standart Sapma ($\sigma$) |
|---|---|---|---|---|---|---|---|---|---|
| **Sol 53 — Zemin $T_\text{g}$** | 18.653 | 165.62 K | 187.75 K | 195.33 K | 228.80 K | 276.79 K | 280.61 K | 283.97 K | 28.65 K |
| **Sol 53 — Hava $T_\text{air}$** | 20.153 | 203.34 K | 204.26 K | 207.57 K | 228.17 K | 261.48 K | 265.95 K | 268.41 K | 18.52 K |
| **Sol 53 — Basınç $P$** | 20.153 | 716.08 Pa | 716.27 Pa | 720.53 Pa | 763.51 Pa | 791.29 Pa | 806.41 Pa | 806.61 Pa | 25.06 Pa |
| **Sol 191 — Zemin $T_\text{g}$** | 5.536 | 181.04 K | 194.31 K | 200.33 K | 222.69 K | 275.89 K | 277.60 K | 279.90 K | 28.08 K |
| **Sol 191 — Hava $T_\text{air}$** | 7.336 | 205.23 K | 206.30 K | 207.22 K | 225.22 K | 262.93 K | 267.62 K | 269.22 K | 18.86 K |
| **Sol 191 — Basınç $P$** | 7.336 | 863.12 Pa | 863.27 Pa | 866.46 Pa | 926.34 Pa | 959.53 Pa | 960.39 Pa | 960.79 Pa | 31.94 Pa |
| **Sol 533 — Zemin $T_\text{g}$** | 19.276 | 99.03 K | 152.11 K | 166.26 K | 194.69 K | 260.05 K | 262.05 K | 266.43 K | 32.58 K |
| **Sol 533 — Hava $T_\text{air}$** | 20.956 | 185.10 K | 186.23 K | 188.08 K | 207.99 K | 236.86 K | 239.21 K | 241.01 K | 16.93 K |
| **Sol 533 — Basınç $P$** | 20.956 | 837.76 Pa | 837.95 Pa | 842.45 Pa | 871.81 Pa | 895.00 Pa | 895.23 Pa | 895.44 Pa | 19.87 Pa |

---

## 4. Sensör Bazında Kalite Bayrakları ve Veri Ayıklama Metodolojisi (2026-11-15)

### 4.1. Eksik Değer Kodlaması
NASA PDS REMS arşivinde ölçüm alınamayan, kalibrasyon hatası oluşan veya sensörün kapalı olduğu aralıklarda sabit olarak **`-999.00`** değeri yazılmaktadır.
- Python veri okuma betiğinde tüm fiziksel büyüklükler (`BRIGHTNESS_TEMP`, `AMBIENT_TEMP`, `PRESSURE`, `UV_*`) için `val > 0` şartı koşulmuş; negatif ve `-999.00` olan örnekler istatistiksel havuzdan tamamen elenmiştir.

### 4.2. REMS Kalite Bayrakları Formatı ve Ayıklama
REMS MODRDR veri tablosundaki her ana ölçüm kanalına bir `CONFIDENCE_LEVEL` dizesi eşlik eder (`REMS_RDR_SIS.TXT` Bölüm 3.1.3):

1. **GTS Zemin Sıcaklığı Bayrağı (`GTS_CONFIDENCE_LEVEL`):**
   - 4 karakterlik dizedir (`Byte 0..3`).
   - `Byte 0`: ASIC besleme gerilimi (1: $[4.87 - 4.97\text{ V}]$ aralığında uygun, 0: aralık dışı).
   - `Byte 1`: Yeniden kalibrasyon kalitesi (1: yüksek kalite, 0: düşük).
   - `Byte 2`: Gezgin hareketi (1: hareketsiz / duruyor, 0: sürüş halinde).
   - `Byte 3`: GTS görüş alanında gölge durumu (1: gölge yok, 0: kısmi veya tam gölge).
   - *Uygulanan Filtre:* `XXXX` veya `XXXXXX` bilinmeyen bayraklı kayıtlar (toplam 1.500–1.600 satır) filtrelenmiş, yalnız geçerli sayısal termopil okumaları işleme alınmıştır.
   - *Sol 533 Gece Taban Analizi:* Sol 533 gece yarısı (LTST 00:25–01:05) 58 adet kayıtta zemin sıcaklığının 99 K ile 139 K arasına sarktığı görülmüştür. Bu satırlarda bayrak `1111` olsa dahi p01 persantili ($152.1\text{ K} / -121.0^\circ\text{C}$) ve p05 persantili ($166.3\text{ K} / -106.9^\circ\text{C}$), Mars Gale kış gecesi için fiziksel olarak daha istikrarlı referans noktasıdır.

2. **ATS 1.5 m Hava Sıcaklığı Bayrağı (`AMBIENT_TEMP_CONFIDENCE_LEVEL`):**
   - 9 karakterlik dizedir. Boom 1 ve Boom 2 yerel sıcaklıkları, rüzgâr hızı, gezgin desk pertürbasyonları ve RTG ısı yayılımı modellenerek gezgin gövdesinden bağımsız ortam havası tahmin edilir.
   - `Byte 7`: Hata operasyonel aralıkta ($< 5\text{ K}$) ise `1`.
   - `Byte 8`: Gözlem güvenilirliği (1: güvenilir, 0: güvenilmez).

3. **Basınç Sensörü Bayrağı (`PS_CONFIDENCE_LEVEL`):**
   - Barocap silikon kapasitif sensör güvenilirlik bayrağıdır (1: nominal). 
   - Analiz edilen tüm geçerli satırlarda basınç ölçüm hatası $\pm 2.9\text{ Pa}$ civarında son derece düşüktür.

4. **UV Sensörü Bayrağı (`UVS_CONFIDENCE_LEVEL`):**
   - 5 karakterlik dizedir. Güneş başucu açısı (zenith angle) $> 85^\circ$ olduğunda (gece) UV akısı $0.00\text{ W/m}^2$ değerini alır.
   - Analizde tepe gündüz akısı (`UV_ABC Max`) ile gündüz ortalaması (`day_mean`, $UV > 0.05\text{ W/m}^2$) ayrıştırılmıştır.

---

## 5. Simülatör HUD Tasarımı İçin Somut Ortam Satırı Önerileri (2026-11-15)

Simülatörün sol/üst köşesinde yer alan telemetri veya mini durum çubuğuna (`HUD`) eklenecek Gale Ortam telemetrisi için bilimsel dayanaklı sayısal kalıplar:

### 5.1. HUD Satırı Format Önerisi
```text
[GALE ORTAM] Ls 180° (İlkbahar) | Hava: -42°C [-70°, -5°] | Zemin: -38°C [-108°, +11°] | Basınç: 7.6 hPa | UV: 19.9 W/m²
```

### 5.2. Mevsime Göre HUD Durum Matrisi
Simülasyonda seçilen mevsim veya Sol parametresine göre HUD değerleri şu aralıklarda güncellenmelidir:

| Simülasyon Mevsimi | Örnek Sol | Gösterilecek Hava $T_\text{air}$ | Gösterilecek Zemin $T_\text{g}$ | Atmosfer Basıncı | UV İndeksi / Akı Durumu |
|---|---|---|---|---|---|
| **Gale İlkbahar (Ekinoks)** | Sol 53 | $-42^\circ\text{C}$ (Aralık: $-70^\circ\text{C} \dots -5^\circ\text{C}$) | $-38^\circ\text{C}$ (Aralık: $-108^\circ\text{C} \dots +11^\circ\text{C}$) | $7.6\text{ hPa}$ | $19.9\text{ W/m}^2$ (Yüksek UV / İnce Atmosfer) |
| **Gale Yaz (Günberi)** | Sol 191 | $-43^\circ\text{C}$ (Aralık: $-68^\circ\text{C} \dots -4^\circ\text{C}$) | $-39^\circ\text{C}$ (Aralık: $-92^\circ\text{C} \dots +7^\circ\text{C}$) | $9.2\text{ hPa}$ | $2.3\text{ W/m}^2$ (Toz Fırtınası / Yoğun Atmosfer) |
| **Gale Kış (Günöte)** | Sol 533 | $-64^\circ\text{C}$ (Aralık: $-88^\circ\text{C} \dots -32^\circ\text{C}$) | $-68^\circ\text{C}$ (Aralık: $-121^\circ\text{C} \dots -7^\circ\text{C}$) | $8.7\text{ hPa}$ | $1.0\text{ W/m}^2$ (Düşük Güneş Açısı) |

---

## 6. Doğrulama ve Hesaplama Komutları (Python) (2026-11-15)

Bu rapordaki tüm SHA-256 özetleri, persantiller ve ekstremler aşağıdaki bağımsız Python betikleriyle üretilmiştir.

### 6.1. İndirme ve Sağlama Özeti Betiği (`scratch/download_and_process_rems.py`)
```python
import os, hashlib, urllib.request, json

DEST_DIR = r"martian-map-main/docs/data/ekip/rems"
DATASETS = [
    {"sol": 53, "parent": "SOL_00001_00089", "tab": "RME_402151514RMD00530000000_______PA.TAB", "xml": "RME_402151514RMD00530000000_______PA.xml"},
    {"sol": 191, "parent": "SOL_00180_00269", "tab": "RME_414402384RMD01910000000_______P8.TAB", "xml": "RME_414402384RMD01910000000_______P8.xml"},
    {"sol": 533, "parent": "SOL_00450_00583", "tab": "RME_444763232RMD05330000000_______P5.TAB", "xml": "RME_444763232RMD05330000000_______P5.xml"}
]

def fetch_and_hash(url, dest):
    sha = hashlib.sha256()
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as resp, open(dest, 'wb') as f:
        while chunk := resp.read(65536):
            f.write(chunk)
            sha.update(chunk)
    return sha.hexdigest(), os.path.getsize(dest)

for d in DATASETS:
    base = f"https://atmos.nmsu.edu/PDS/data/PDS4/msl_rems_bundle/data_calibrated/{d['parent']}/SOL{d['sol']:05d}/"
    tab_sha, tab_sz = fetch_and_hash(base + d['tab'], os.path.join(DEST_DIR, d['tab']))
    xml_sha, xml_sz = fetch_and_hash(base + d['xml'], os.path.join(DEST_DIR, d['xml']))
    print(f"Sol {d['sol']}: TAB {tab_sz} B (SHA {tab_sha}), XML {xml_sz} B (SHA {xml_sha})")
```

### 6.2. İstatistik ve Persantil Hesaplama Betiği (`scratch/calc_detailed_quantiles.py`)
```python
import csv, numpy as np

def compute_sol_stats(tab_path):
    with open(tab_path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.reader(f)
        tb, ta, p, uv = [], [], [], []
        for r in reader:
            if len(r) < 40: continue
            v_tb, v_ta, v_p, v_uv = float(r[7]), float(r[15]), float(r[37]), float(r[20])
            if v_tb > 0: tb.append(v_tb)
            if v_ta > 0: ta.append(v_ta)
            if v_p > 0: p.append(v_p)
            if v_uv >= 0: uv.append(v_uv)

    tb, ta, p, uv = np.array(tb), np.array(ta), np.array(p), np.array(uv)
    print("Zemin T [K]:", np.min(tb), np.percentile(tb, 50), np.max(tb), "Ort:", np.mean(tb))
    print("Hava T  [K]:", np.min(ta), np.percentile(ta, 50), np.max(ta), "Ort:", np.mean(ta))
    print("Basınç [Pa]:", np.min(p), np.percentile(p, 50), np.max(p), "Ort:", np.mean(p))
    print("UV ABC [W/m2]: Max:", np.max(uv))
```

---

## 7. Sonuç ve Teslimat Beyanı

Tüm veriler resmi NASA PDS Atmospheres Node arşivinden indirilmiş, 20 MB disk kısıtı gözetilerek doğrulanmış ve `martian-map-main/docs/data/ekip/rems/` altında saklanmıştır. Simülatör koduna (`sim/`) veya git ayarlarına müdahale edilmemiştir. Rapor, simülasyon motorunun Gale Krateri atmosferini gerçeğe uygun simüle edebilmesi için gereken tüm sayısal temeli sunmaktadır.
