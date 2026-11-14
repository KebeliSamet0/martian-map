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

# Oksijen: 1 L O₂ ≈ 4.8 kcal (dolaylı kalorimetri kalorik eşdeğeri)
KCAL_PER_L_O2 = 4.8

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


def assumptions(provisional_terrain: bool = False):
    """Arayüzde gösterilecek varsayım tablosu."""
    items = [
        {"name": "Astronot kütlesi", "value": BODY_KG, "unit": "kg", "source": "VARSAYIM"},
        {"name": "Skafandr + yaşam destek", "value": SUIT_KG, "unit": "kg", "source": "VARSAYIM (doğrulanacak)"},
        {"name": "Ekipman", "value": TOOLS_KG, "unit": "kg", "source": "VARSAYIM"},
        {"name": "Temel yürüme hızı", "value": BASE_SPEED_MS, "unit": "m/s", "source": "VARSAYIM (doğrulanacak)"},
        {"name": "Düz zemin metabolik düzeyi", "value": FLAT_REFERENCE_W, "unit": "W", "source": "Apollo EVA ortalaması, Waligora & Horrigan 1975 (doğrulanacak)"},
        {"name": "Arazi katsayısı η", "value": TERRAIN_ETA, "unit": "-", "source": TERRAIN_SOURCE},
        {"name": "Riskli eğim", "value": SLOPE_RISKY_DEG, "unit": "°", "source": "VARSAYIM"},
        {"name": "Geçilmez eğim", "value": SLOPE_NOGO_DEG, "unit": "°", "source": "VARSAYIM"},
        {"name": "Geçilmez hücreden bağlanma yarıçapı", "value": SNAP_RADIUS_M, "unit": "m", "source": "VARSAYIM: 2 m DEM sırt kenarında eğimi abartıyor (rover tilt karşılaştırması)"},
        {"name": "Segment uzunluk ve yumuşatma sınırları", "value": {"min_m": SEG_MIN_M, "max_m": SEG_MAX_M, "max_count": SEG_MAX_COUNT, "smooth_m": SEG_SMOOTH_M, "hysteresis_deg": SEG_HYSTERESIS_DEG}, "unit": "m / °", "source": "VARSAYIM: DEM hücre gürültüsünde 8–25 okunabilir segment hedefi"},
        {"name": "Rota ön ayar ağırlıkları (t, k, r)", "value": {k: {x: v[x] for x in ("t", "k", "r")} for k, v in REAL_PRESETS.items()}, "unit": "-", "source": "VARSAYIM: gerçek veride süre/enerji/risk ödünleşimi kalibrasyonu"},
        {"name": "Maksimum EVA süresi", "value": EVA_MAX_H, "unit": "saat", "source": "VARSAYIM"},
        {"name": "Yüzey doz hızı", "value": round(DOSE_UGY_PER_H, 2), "unit": "µGy/saat", "source": "Curiosity RAD, Hassler et al. 2014"},
        {"name": "Mars yerçekimi ölçeği", "value": round(G_RATIO, 3), "unit": "-", "source": "VARSAYIM: yük ve eğim terimleri g oranıyla ölçeklenir"},
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
