"""Planlayıcı parametreleri.

Her değerin yanında kaynağı ya da VARSAYIM etiketi var. VARSAYIM etiketli değerler
Elif Nisa'nın docs/metabolic_model.md doğrulamasıyla güncellenecek; arayüz bu
listeyi /assumptions uç noktasından okuyup ekranda gösterir.
"""

G_EARTH = 9.81
G_MARS = 3.71  # m/s²
G_RATIO = G_MARS / G_EARTH

# Kütleler (kg)
BODY_KG = 80.0  # VARSAYIM: astronot
SUIT_KG = 120.0  # VARSAYIM: skafandr + yaşam destek ünitesi (xEMU mertebesi, doğrulanacak)
TOOLS_KG = 10.0  # VARSAYIM: taşınan bilim ekipmanı
DEFAULT_LOAD_KG = 0.0  # VARSAYIM: taşınan ek görev/numune yükü varsayılanı (kg)

# Yürüme hızı
BASE_SPEED_MS = 0.8  # VARSAYIM: düz, sıkı zeminde skafandrlı yürüyüş (Apollo mertebesi, doğrulanacak)

# Metabolik kalibrasyon: Pandolf göreli yapıyı verir, mutlak düzey düz ana kayada
# bu değere eşitlenir. Apollo ay EVA'larının ortalaması ~234 kcal/saat ≈ 272 W
# (Waligora & Horrigan 1975; DOĞRULANACAK).
FLAT_REFERENCE_W = 272.0

# Zemin sınıfları: AI4Mars sırası
CLASSES = ("soil", "bedrock", "sand", "bigrock")
CLASS_TR = {"soil": "toprak", "bedrock": "ana kaya", "sand": "kum", "bigrock": "büyük kaya"}

# Pandolf arazi katsayısı η (Pandolf 1977 tablosu; DOĞRULANACAK)
TERRAIN_ETA = {"bedrock": 1.0, "soil": 1.2, "sand": 2.1, "bigrock": 1.5}
# Zemine göre hız çarpanı
TERRAIN_SPEED = {"bedrock": 1.0, "soil": 0.95, "sand": 0.6, "bigrock": 0.5}  # VARSAYIM

# Eğim sınırları (derece)
SLOPE_RISKY_DEG = 15.0  # VARSAYIM (rakip projelerle aynı eşik; kaynak aranacak)
SLOPE_NOGO_DEG = 25.0  # VARSAYIM
# Başlangıç/hedef NOGO hücresindeyse bu yarıçaptaki en yakın geçilebilir hücreye bağlanır.
# VARSAYIM: 2 m DEM boxwork sırt kenarında eğimi tek hücrede abartıyor; rover tilt ≤17,5°,
# DEM'in ≥25° gösterdiği 4 waypoint'in hepsinde 10 m içinde <25° hücre var (issue #19).
SNAP_RADIUS_M = 10.0

# EVA bütçesi
EVA_MAX_H = 6.0  # VARSAYIM: toplam yürüyüş + durak süresi
SCIENCE_STOP_MIN = 30.0  # VARSAYIM: hedefte bilim çalışması
RESERVE_MIN = 30.0  # VARSAYIM: eve dönüş için yedek pay

# Radyasyon: Curiosity RAD yüzey dozu ~180–225 µGy/gün (Hassler et al. 2014)
SURFACE_DOSE_MGY_PER_DAY = 0.21  # Hassler et al. 2014, doi:10.1126/science.1244797
DOSE_UGY_PER_H = SURFACE_DOSE_MGY_PER_DAY * 1000 / 24.0
EVA_MAX_KCAL = 2000.0  # VARSAYIM: görev bütçesi, tıbbi sınır değil
EVA_MAX_O2_L = 420.0  # VARSAYIM
EVA_MAX_DOSE_UGY = 60.0  # VARSAYIM: EVA planlama bütçesi
STOP_METABOLIC_W = FLAT_REFERENCE_W  # VARSAYIM: durak/yedek metabolizması

# Oksijen: 1 L O₂ ≈ 4.8 kcal (dolaylı kalorimetri kalorik eşdeğeri); 1 L O₂ ≈ 1.429 g (STP)
KCAL_PER_L_O2 = 4.8
O2_G_PER_L = 1.429  # Standart koşullarda (0°C, 1 atm) O₂ yoğunluğu (g/L)

# Rota ön ayarları: hücre maliyeti = t·süre + k·kcal + r·risk (hepsi metre başına)
PRESETS = {
    "shortest": {"t": 1.0, "k": 0.0, "r": 0.0, "label": "En kısa"},
    "balanced": {"t": 1.0, "k": 10.0, "r": 4.0, "label": "Dengeli"},
    "safest": {"t": 1.0, "k": 10.0, "r": 25.0, "label": "En güvenli"},
}
# Gerçek yüksek çözünürlüklü (ör. 2 m) DEM ve zemin verisinde riskin süre/enerjiyle anlamlı
# ödünleşmesi için ön ayarlar (VARSAYIM: gerçek Gale verisi kalibrasyonu):
REAL_PRESETS = {
    "shortest": {"t": 1.0, "k": 0.0, "r": 0.0, "label": "En kısa"},
    "balanced": {"t": 1.0, "k": 12.0, "r": 22.0, "label": "Dengeli"},
    "safest": {"t": 0.2, "k": 1.5, "r": 140.0, "label": "En güvenli"},
}

# Segmentleme
SEG_MIN_M = 40.0
SEG_MAX_M = 70.0  # VARSAYIM: 0.5–3 km rotalarda 8–24 segment için üst bölme eşiği
SEG_MAX_COUNT = 24  # VARSAYIM: arayüzde okunabilir kart sayısı üst sınırı (hedef 8–25)
SEG_SMOOTH_M = 30.0  # VARSAYIM: eğim/sınıf gürültüsünü yumuşatma penceresi
SEG_HYSTERESIS_DEG = 1.5  # VARSAYIM: eğim bandı geçişinde histerezis payı
SLOPE_BANDS = (8.0, 15.0, 25.0)

# Risk modeli ölçekleri (VARSAYIM: dik eğim, kaya kaplama oranı ve belirsizlik duyarlılığı)
RISK_STEER_SLOPE_DEG = 8.0
RISK_ROCK_SCALE = 0.15

# Güven sınıfları (normalize entropi)
CONF_LOW = 0.6
CONF_MID = 0.35

# Arazi tarayıcı sınıfı (scan_class: 0 güvenli, 1 dikkat, 2 geçilmez, 3 bilinmiyor)
SCAN_NOGO_SAND = 0.55  # VARSAYIM: orta eğimde saplanma için kum olasılığı eşiği
SCAN_NOGO_SAND_SLOPE_DEG = 12.0  # VARSAYIM: kumlu zeminde geçilmez eğim eşiği (°)
SCAN_CAUTION_SAND = 0.40  # VARSAYIM: dikkat gerektiren kum olasılığı eşiği
SCAN_CAUTION_ROCK_CFA = 0.15  # VARSAYIM: dikkat gerektiren kaya kaplama oranı eşiği

SCAN_LEGEND = {
    "0": {"code": 0, "key": "safe", "name": "güvenli", "color": "#2ecc71", "rgb": [46, 204, 113]},
    "1": {"code": 1, "key": "caution", "name": "dikkat", "color": "#f1c40f", "rgb": [241, 196, 15]},
    "2": {"code": 2, "key": "nogo", "name": "geçilmez", "color": "#e74c3c", "rgb": [231, 76, 60]},
    "3": {"code": 3, "key": "unknown", "name": "bilinmiyor", "color": "#9b59b6", "rgb": [155, 89, 182]},
}

SCAN_RULE = {
    "priority": ["2: geçilmez (nogo)", "3: bilinmiyor (unknown)", "1: dikkat (caution)", "0: güvenli (safe)"],
    "nogo": f"slope >= {SLOPE_NOGO_DEG}° veya (p_sand >= {SCAN_NOGO_SAND} ve slope >= {SCAN_NOGO_SAND_SLOPE_DEG}°)",
    "unknown": f"entropy >= {CONF_LOW}",
    "caution": f"slope >= {SLOPE_RISKY_DEG}° veya p_sand >= {SCAN_CAUTION_SAND} veya rock_cfa >= {SCAN_CAUTION_ROCK_CFA}",
    "safe": "aksi (varsayılan)",
    "thresholds": {
        "nogo_slope_deg": SLOPE_NOGO_DEG,
        "nogo_sand": SCAN_NOGO_SAND,
        "nogo_sand_slope_deg": SCAN_NOGO_SAND_SLOPE_DEG,
        "unknown_entropy": CONF_LOW,
        "caution_slope_deg": SLOPE_RISKY_DEG,
        "caution_sand": SCAN_CAUTION_SAND,
        "caution_rock_cfa": SCAN_CAUTION_ROCK_CFA,
    },
}


def classify_scan(slope, p_sand, entropy, rock_cfa):
    """Tek kaynaklı tarayıcı sınıfı kuralı (öncelik: 2 geçilmez -> 3 bilinmiyor -> 1 dikkat -> 0 güvenli)."""
    import numpy as np
    s = np.asarray(slope)
    ps = np.asarray(p_sand)
    ent = np.asarray(entropy)
    rc = np.asarray(rock_cfa)
    out = np.zeros(s.shape, dtype=np.float32)
    caution = (s >= SLOPE_RISKY_DEG) | (ps >= SCAN_CAUTION_SAND) | (rc >= SCAN_CAUTION_ROCK_CFA)
    unknown = ent >= CONF_LOW
    nogo = (s >= SLOPE_NOGO_DEG) | ((ps >= SCAN_NOGO_SAND) & (s >= SCAN_NOGO_SAND_SLOPE_DEG))
    out = np.where(caution, 1.0, out)
    out = np.where(unknown, 3.0, out)
    out = np.where(nogo, 2.0, out)
    return out.astype(np.float32)


MARS_VALIDATION_NOTE = "Pandolf Dünya modeli, Mars için g-ölçekli; doğrulanmamış."


def assumptions(provisional_terrain: bool = False):
    """Arayüzde gösterilecek varsayım tablosu."""
    items = [
        {"name": "Astronot kütlesi", "value": BODY_KG, "unit": "kg", "source": "VARSAYIM"},
        {"name": "Skafandr + yaşam destek", "value": SUIT_KG, "unit": "kg", "source": "VARSAYIM (doğrulanacak)"},
        {"name": "Ekipman", "value": TOOLS_KG, "unit": "kg", "source": "VARSAYIM"},
        {"name": "Varsayılan ek yük (load_kg)", "value": DEFAULT_LOAD_KG, "unit": "kg", "source": "VARSAYIM: Pandolf L = SUIT_KG + TOOLS_KG + load_kg terimine eklenir"},
        {"name": "Temel yürüme hızı", "value": BASE_SPEED_MS, "unit": "m/s", "source": "VARSAYIM (doğrulanacak)"},
        {"name": "Düz zemin metabolik düzeyi", "value": FLAT_REFERENCE_W, "unit": "W", "source": "Apollo EVA ortalaması, Waligora & Horrigan 1975 (doğrulanacak)", "mars_validated": False},
        {"name": "Arazi katsayısı η", "value": TERRAIN_ETA, "unit": "-", "source": TERRAIN_SOURCE},
        {"name": "Hücre maliyet katmanı eğim özeti", "value": "|slope| ile çıkış (yönsüz hücre özeti); yönlü yol hesabı /step ucunda", "unit": "-", "source": "VARSAYIM: tek hücrede yürüyüş yönü bilinmediğinden |G| = tan(slope)·100 kullanılır"},
        {"name": "Bilim durağı süresi", "value": SCIENCE_STOP_MIN, "unit": "dk", "source": "VARSAYIM: hedefte bilim çalışması; GO kararındaki committed toplamına girer"},
        {"name": "Durak metabolik düzeyi", "value": STOP_METABOLIC_W, "unit": "W", "source": "VARSAYIM: durak/yedek metabolizması (şimdilik düz zemin düzeyine eşit)"},
        {"name": "Oksijen dönüşümü", "value": {"kcal_per_L_o2": KCAL_PER_L_O2, "g_per_L_o2": O2_G_PER_L}, "unit": "kcal/L, g/L", "source": "Dolaylı kalorimetri (4.8 kcal/L O₂) ve STP yoğunluğu (1.429 g/L)"},
        {"name": "Riskli eğim", "value": SLOPE_RISKY_DEG, "unit": "°", "source": "VARSAYIM"},
        {"name": "Geçilmez eğim", "value": SLOPE_NOGO_DEG, "unit": "°", "source": "VARSAYIM"},
        {"name": "Tarayıcı sınıfı (scan_class) kuralı", "value": SCAN_RULE, "unit": "sınıf (0..3)", "source": "VARSAYIM: öncelik sırasıyla 2 geçilmez -> 3 bilinmiyor -> 1 dikkat -> 0 güvenli"},
        {"name": "Geçilmez hücreden bağlanma yarıçapı", "value": SNAP_RADIUS_M, "unit": "m", "source": "VARSAYIM: 2 m DEM sırt kenarında eğimi abartıyor (rover tilt karşılaştırması)"},
        {"name": "Segment uzunluk ve yumuşatma sınırları", "value": {"min_m": SEG_MIN_M, "max_m": SEG_MAX_M, "max_count": SEG_MAX_COUNT, "smooth_m": SEG_SMOOTH_M, "hysteresis_deg": SEG_HYSTERESIS_DEG}, "unit": "m / °", "source": "VARSAYIM: DEM hücre gürültüsünde 8–25 okunabilir segment hedefi"},
        {"name": "Rota ön ayar ağırlıkları (t, k, r)", "value": {k: {x: v[x] for x in ("t", "k", "r")} for k, v in REAL_PRESETS.items()}, "unit": "-", "source": "VARSAYIM: gerçek veride süre/enerji/risk ödünleşimi kalibrasyonu"},
        {"name": "Maksimum EVA süresi", "value": EVA_MAX_H, "unit": "saat", "source": "VARSAYIM"},
        {"name": "Yüzey doz hızı", "value": round(DOSE_UGY_PER_H, 2), "unit": "µGy/saat", "source": "Curiosity RAD, Hassler et al. 2014"},
        {"name": "Mars yerçekimi ölçeği", "value": round(G_RATIO, 3), "unit": "-", "source": "VARSAYIM: yük ve eğim terimleri g oranıyla ölçeklenir",
         "mars_validated": False},
        {"name": "Metabolik model Mars doğrulaması", "value": False, "unit": "-", "mars_validated": False, "source": MARS_VALIDATION_NOTE},
    ]
    if provisional_terrain:
        items.append({
            "name": "Zemin olasılık ve belirsizlik katmanları",
            "value": "geçici zemin katmanı (model çıktısı değil)",
            "unit": "-",
            "source": "VARSAYIM: p_soil, p_bedrock, p_sand, p_bigrock ve entropy eğim + rock_cfa'dan geçici kuralla üretildi (entropi ≥ 0.75)",
        })
    return items


# Tek yükleme noktası; belge yoksa yukarıdaki varsayılanlar korunur.
from .terrain import load_terrain
TERRAIN_ETA, TERRAIN_SPEED, TERRAIN_SOURCE = load_terrain(TERRAIN_ETA, TERRAIN_SPEED)
