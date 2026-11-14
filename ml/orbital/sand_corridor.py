"""#46 / Elif Rana'nin istegi: demo senaryo koridorunda (sci_* -> sci_4) kum adaylari + Elif'in 2 gecici noktasi, KOR sayfa.

sand_candidates.py ile ayni olcutler (duz, puruzsuz, kayasiz, alcak) ama daha gevsek esik ve yalniz koridorda
(Curiosity kesiti 430-701 + durak->hedef dogrulari, <=60 m). Sonra gozle dogrulama icin sayfa uretir.

Kullanim: python ml/orbital/sand_corridor.py --tif data/raw/gale_2x2km_25cm.tif
"""
import argparse, csv, json, math
import numpy as np
import rasterio
from scipy import ndimage as ndi
from skimage import measure, morphology
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

N, PX = 1000, 8
ap = argparse.ArgumentParser()
ap.add_argument("--tif", default="data/raw/gale_2x2km_25cm.tif")
ap.add_argument("--scen", default="layers/demo_scenarios.json")
ap.add_argument("--path", default="layers/msl_proposed_path.json")
ap.add_argument("--n", type=int, default=13)
ap.add_argument("--prefix", default="docs/data/img/sand_corridor")
a = ap.parse_args()

img = rasterio.open(a.tif).read(1).astype(np.float32)
slope, cfa, elev = (np.load(f"layers/{n}.npy") for n in ("slope", "rock_cfa", "elevation"))
b = img.reshape(N, PX, N, PX)
mean, std = b.mean(axis=(1, 3)), b.std(axis=(1, 3))
std10 = ndi.uniform_filter(std, 5)
r10 = np.sqrt(np.maximum(ndi.uniform_filter(mean**2, 5) - ndi.uniform_filter(mean, 5)**2, 0))
rel_e = elev - ndi.uniform_filter(elev, 51)
cfa_s = ndi.uniform_filter(cfa, 9)

pp = np.array(json.load(open(a.path, encoding="utf-8"))["path_px"])
sc = json.load(open(a.scen, encoding="utf-8"))["scenarios"]
lines = [pp[430:702]] + [np.array([s["start"]["stop_px"], s["goal"]["stop_px"]]) for s in sc]
m = np.zeros((N, N), bool)
for L in lines:
    for p0, p1 in zip(L[:-1], L[1:]):
        for t in np.linspace(0, 1, max(int(np.hypot(*(p1 - p0)) * 2), 2)):
            c, r = p0 + (p1 - p0) * t
            if 0 <= int(c) < N and 0 <= int(r) < N:
                m[int(r), int(c)] = True
dist = ndi.distance_transform_edt(~m) * 2.0

mask = (slope < 12) & (std10 < 8.0) & (r10 < 7.5) & (rel_e < 0.5) & (cfa_s < 0.005) & (dist <= 60)
mask = morphology.opening(mask, morphology.disk(1))
lab = measure.label(mask)
regs = []
for p in measure.regionprops(lab):
    if p.area < 12:  # >= 48 m2
        continue
    rr, cc = p.centroid
    regs.append(dict(col=cc, row=rr, area_m2=p.area * 4.0, radius_m=max(min(math.sqrt(p.area * 4.0 / math.pi), 30.0), 8.0),
                     d=float(dist[lab == p.label].min()), grup="koridor_adayi"))
chosen = []
for r in sorted(regs, key=lambda r: -r["area_m2"]):
    if all(math.hypot(r["col"] - c["col"], r["row"] - c["row"]) * 2 >= 40 for c in chosen):
        chosen.append(r)
    if len(chosen) == a.n:
        break
elif_pts = [dict(col=467.0, row=609.0, area_m2=0, radius_m=20.0, d=float(dist[609, 467]), grup="elif_S1S3"),
            dict(col=487.0, row=672.0, area_m2=0, radius_m=20.0, d=float(dist[672, 487]), grup="elif_S2")]
sel = chosen + elif_pts
rng = np.random.default_rng(3)
sel = [sel[i] for i in rng.permutation(len(sel))]  # kor
print(f"koridor adayi: {len(regs)} bolge, sayfaya {len(chosen)} + Elif'in 2 noktasi")

with open(a.prefix + "_candidates.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["no", "col", "row", "radius_m", "alan_m2", "rota_uzaklik_m", "grup", "karar", "not"])
    for i, r in enumerate(sel, 1):
        w.writerow([i, round(r["col"], 1), round(r["row"], 1), round(r["radius_m"], 1), round(r["area_m2"]),
                    round(r["d"]), r["grup"], "", ""])

HALF = 200
pad = np.pad(img, HALF, mode="constant")
fig, axs = plt.subplots(5, 6, figsize=(14, 12))
for ax in axs.ravel(): ax.axis("off")
for k, r in enumerate(sel):
    rc, cc = int(r["row"] * PX), int(r["col"] * PX)
    crop = pad[rc:rc + 2 * HALF, cc:cc + 2 * HALF]
    for j in (0, 1):
        ax = axs[k // 3, (k % 3) * 2 + j]
        ax.imshow(crop, cmap="gray", vmin=np.percentile(crop[crop > 0], 1) if (crop > 0).any() else 0,
                  vmax=np.percentile(crop, 99), interpolation="bicubic")
        if j == 1:
            ax.add_patch(plt.Circle((HALF, HALF), r["radius_m"] / 0.25, fill=False, ec="cyan", lw=1.2))
        ax.set_xticks([]); ax.set_yticks([]); ax.axis("on")
        if j == 0:
            ax.set_title(f"#{k+1}", fontsize=11, loc="left", fontweight="bold")
fig.suptitle("Koridor kum adaylari (100 m x 100 m): sol = isaretsiz, sag = adayin yeri (camgobegi daire)", fontsize=12)
fig.tight_layout(); fig.savefig(a.prefix + "_sheet_1.png", dpi=80)
print("yazildi:", a.prefix + "_candidates.csv", a.prefix + "_sheet_1.png")
