# Kapi 2 (issue #19): Emre'nin rover duragi zemin siniflarini haritaya yayar -> layers/p_{soil,bedrock,sand,bigrock}.npy, layers/entropy.npy
# Brifing 4.3: "Durak verisi haritaya yayilirken guven, en yakin rover kanitina uzaklikla duser."
# - Her hucre en yakin duragin class_frac'ini alir (Voronoi).
# - Uzaklik 200 m'ye kadar tam guven, 800 m'de en duz; olasiliklar esit dagilima (0,25) kayar.
#   Parametreler planlayicinin sentetik katmaniyla ayni (api/planner/layers.py synthetic()).
# - entropy = 1 - (1 - duragin model entropisi) * (1 - uzaklik duzlesmesi): durakta modelin belirsizligi, uzakta 1.
# Kullanim: python pipeline/spread_terrain.py <repo_koku> [durak_json=layers/rover_stops.json]
import json, math, sys
import numpy as np

CLASSES = ("soil", "bedrock", "sand", "bigrock")  # api/planner/params.py CLASSES ile ayni sira
NEAR_M, FAR_M, FLAT_MAX = 200.0, 800.0, 0.75


def spread(stops, width, height, res_m):
    bad = [s.get("stop_id") for s in stops
           if not isinstance(s.get("class_frac"), dict) or set(s["class_frac"]) != set(CLASSES)
           or s.get("entropy") is None or not 0 <= s["entropy"] <= 1
           or abs(sum(s["class_frac"].values()) - 1) > 0.02]
    if not stops or bad:
        raise SystemExit(f"Zemin modeli ciktisi eksik/hatali (class_frac 4 sinif, toplam 1; entropy 0-1): {bad or 'durak yok'}")
    xy = np.array([[math.floor(v) + 0.5 for v in s["px"]] for s in stops])  # hucre merkezi
    frac = np.array([[s["class_frac"][c] for c in CLASSES] for s in stops], dtype=np.float64)
    frac /= frac.sum(1, keepdims=True)
    e_stop = np.array([s["entropy"] for s in stops], dtype=np.float64)

    yy, xx = np.mgrid[0:height, 0:width] + 0.5
    best_d = np.full((height, width), np.inf); best_i = np.zeros((height, width), int)
    for i, (x, y) in enumerate(xy):  # en yakin durak (durak sayisi az, satir satir yeterince hizli)
        d = np.hypot(xx - x, yy - y)
        m = d < best_d; best_d[m] = d[m]; best_i[m] = i
    dist_m = best_d * res_m
    flat = np.clip((dist_m - NEAR_M) / (FAR_M - NEAR_M), 0, 1)

    probs = (1 - FLAT_MAX * flat)[None] * frac[best_i].transpose(2, 0, 1) + (FLAT_MAX * flat / len(CLASSES))[None]
    probs /= probs.sum(0, keepdims=True)
    ent = 1 - (1 - e_stop[best_i]) * (1 - flat)
    return {c: probs[k].astype(np.float32) for k, c in enumerate(CLASSES)}, ent.astype(np.float32), dist_m


if __name__ == "__main__":
    repo = sys.argv[1]; src = sys.argv[2] if len(sys.argv) > 2 else f"{repo}/layers/rover_stops.json"
    g = json.load(open(f"{repo}/contracts/grid.json", encoding="utf-8"))
    stops = json.load(open(src, encoding="utf-8"))
    probs, ent, dist_m = spread(stops, g["width"], g["height"], g["res_m"])
    total = sum(probs.values())
    assert np.allclose(total, 1, atol=1e-3) and all(0 <= p.min() and p.max() <= 1 for p in probs.values()) and 0 <= ent.min() <= ent.max() <= 1
    for c, p in probs.items():
        np.save(f"{repo}/layers/p_{c}.npy", p)
    np.save(f"{repo}/layers/entropy.npy", ent)
    print(f"{len(stops)} durak -> p_*.npy + entropy.npy | en yakin duraga uzaklik: medyan {np.median(dist_m):.0f} m, maks {dist_m.max():.0f} m | "
          f"entropy ort {ent.mean():.2f} | baskin sinif payi: " + ", ".join(f"{c} %{100 * (np.argmax(np.stack(list(probs.values())), 0) == k).mean():.0f}" for k, c in enumerate(probs)))
