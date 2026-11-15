"""Güven (entropy) anlamlı mı? Elle kontrol edilen duraklarda tutan ve tutmayan tahminlerin entropy'sini karşılaştırır.

Girdi: ml/rover_terrain/stops_128.csv (durak entropy'si) + Emre'nin elle kontrol sonuçları (LAYERS.md, 18 durak tablosu;
SCAN_CHECK.md, 6 durak). Sonuçlar aşağıda elle yazılı, tek kaynağı o iki belge.
Kullanım (repo kökünden): python ml/rover_terrain/confidence_check.py
"""
import csv, itertools, statistics as st

# LAYERS.md "Elle kontrol: 18 durak": T = tuttu, K = kısmen, X = tutmadı. Üçüncü alan: göz kum gördü mü.
EL18 = {"s117_d0384": ("T", 0), "s117_d1434": ("T", 0), "s117_d1890": ("T", 0), "s117_d2490": ("T", 0),
        "s117_d3024": ("X", 1), "s118_d0726": ("T", 0), "s118_d1314": ("T", 0), "s118_d1608": ("K", 1),
        "s118_d2406": ("T", 0), "s118_d3156": ("T", 0), "s119_d0426": ("K", 1), "s120_d1492": ("K", 1),
        "s120_d2366": ("T", 1), "s120_d2690": ("T", 0), "s120_d3056": ("X", 1), "s121_d0360": ("T", 0),
        "s121_d0948": ("T", 0), "s121_d1446": ("K", 1)}
SAND_CAUGHT = {"s120_d2366", "s120_d3056"}  # model kum payı >= 0,2
# SCAN_CHECK.md, zemin modeli bölümü (kare düzeyinde): 6 durak
SC6 = {"s118_d0726": "T", "s118_d2406": "T", "s120_d2690": "T", "s120_d2366": "K", "s118_d1608": "X", "s120_d3056": "X"}


def auc(pos, neg):  # P(pos > neg), eşitlikte 0,5 (Mann-Whitney)
    return sum((a > b) + 0.5 * (a == b) for a, b in itertools.product(pos, neg)) / (len(pos) * len(neg))


ent = {r["stop_id"].replace("msl_", ""): float(r["entropy"]) for r in csv.DictReader(open("ml/rover_terrain/stops_128.csv", encoding="utf-8"))}


def report(name, held, missed):
    h, m = [ent[s] for s in held], [ent[s] for s in missed]
    print(f"{name}: tutan n={len(h)} ort. entropy {st.mean(h):.3f} (medyan {st.median(h):.3f}) | "
          f"tutmayan n={len(m)} ort. {st.mean(m):.3f} (medyan {st.median(m):.3f}) | "
          f"P(tutmayanın entropy'si daha yüksek)={auc(m, h):.2f}  (0,5 = ayırt etmiyor)")


report("18 durak (tutan T / tutmayan K+X)", [s for s, v in EL18.items() if v[0] == "T"], [s for s, v in EL18.items() if v[0] != "T"])
report("18 durak (tutan T+K / tutmayan X)", [s for s, v in EL18.items() if v[0] != "X"], [s for s, v in EL18.items() if v[0] == "X"])
report("6 SCAN_CHECK durağı (T / K+X)", [s for s, v in SC6.items() if v == "T"], [s for s, v in SC6.items() if v != "T"])
c = [s for s, v in EL18.items() if v[1] and s in SAND_CAUGHT]; u = [s for s, v in EL18.items() if v[1] and s not in SAND_CAUGHT]
report("7 kumlu durak (kumu yakalayan / kaçıran)", c, u)
print("tüm 128 durak: ort. entropy %.3f, medyan %.3f" % (st.mean(ent.values()), st.median(ent.values())))
