# Kapi 3-4 (issue #19): Curiosity'nin gercekte surulen rotasi -> layers/msl_proposed_path.json
# Kullanim: python pipeline/msl_proposed_path.py <repo_koku>
# Kaynak: NASA MMGIS MSL_traverse.json (her surus bir feature, kronolojik). Kutuya kesilir, izgara px'e cevrilir,
# >=1 m (0,5 px) aralikla seyreltilir (hata < 1 m). px = [sutun, satir], ondalikli.
import json, math, sys, urllib.request
import numpy as np

REPO = sys.argv[1]
g = json.load(open(f"{REPO}/contracts/grid.json", encoding="utf-8"))
(x0, y0), res, N = g["origin_xy_m"], g["res_m"], g["width"]
R = 3396190.0
URL = "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_traverse.json"
F = json.load(urllib.request.urlopen(urllib.request.Request(URL, headers={"User-Agent": "martian-map-spaceapps/0.1"}), timeout=60))["features"]

pts = []
for f in F:
    geo = f["geometry"]
    for line in ([geo["coordinates"]] if geo["type"] == "LineString" else geo["coordinates"]):
        for lon, lat, *_ in line:
            pts.append(((math.radians(lon) * R - x0) / res, (y0 - math.radians(lat) * R) / res))
P = np.array(pts)
inb = (P[:, 0] >= 0) & (P[:, 0] < N) & (P[:, 1] >= 0) & (P[:, 1] < N)
idx = np.flatnonzero(inb)
assert idx.size and (np.diff(idx) == 1).all(), "rota kutuya birden fazla kez giriyor; parca mantigi gerekir"
seg = P[idx]

keep = [0]  # en az 0,5 px (1 m) ilerleyince yeni nokta; son nokta her zaman
for i in range(1, len(seg)):
    if math.dist(seg[i], seg[keep[-1]]) >= 0.5: keep.append(i)
if keep[-1] != len(seg) - 1: keep.append(len(seg) - 1)
path = seg[keep]

# oz-kontrol: seyreltilmis cizgi ham noktalardan en fazla 1 m sapar
def seg_dist(p, a, b):
    v = b - a; t = np.clip(((p - a) @ v) / max(v @ v, 1e-12), 0, 1); return np.linalg.norm(p - (a + t[:, None] * v), axis=1)
err = np.zeros(len(seg))
for k in range(len(keep) - 1):
    s, e = keep[k], keep[k + 1]; err[s:e + 1] = seg_dist(seg[s:e + 1], path[k], path[k + 1])
assert err.max() * res <= 1.0, err.max() * res
length = float(np.hypot(*np.diff(path, axis=0).T).sum() * res)

out = {
    "description": "Curiosity'nin bu izgarada GERCEKTE surdugu rota (referans). Planlayici rotasiyla karsilastirma icin (api.planner.comparison.compare_reference).",
    "source": URL,
    "source_note": "NASA/JPL MMGIS MSL traverse; kutuya giris kuzey kenar, cikis guney kenar; sol ~4459-4983 (MMGIS waypoint)",
    "px_note": "path_px = [[sutun, satir], ...] ondalikli, contracts/grid.json origin_xy_m ve res_m ile; hucre = floor",
    "simplification": f"ham {len(seg)} nokta -> {len(path)} nokta, >=1 m aralik, maks sapma {err.max() * res:.2f} m",
    "length_m": round(length, 1),
    "path_px": [[round(float(c), 2), round(float(r), 2)] for c, r in path],
}
json.dump(out, open(f"{REPO}/layers/msl_proposed_path.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(out["simplification"], "| uzunluk", out["length_m"], "m | ilk", out["path_px"][0], "son", out["path_px"][-1])
