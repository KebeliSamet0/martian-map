"""2. dogrulama: Curiosity rotasi yakini + dik yamac (sirt kenari) adaylari, KOR (hangi gruptan oldugu sayfada yok).
Elif Rana'nin PR #44 notu: rota boyunca CFA ~2x yuksek, sirt kenari golgeleri kaya sayilmis olabilir.

Kullanim:
  python ml/orbital/validation_sheet_route.py --tif data/raw/gale_2x2km_25cm.tif --rocks data/interim/rock_cfa_rocks.csv \
      --path data/raw/msl_path.json --slope data/raw/slope.npy
"""
import argparse, csv, json
import numpy as np, rasterio
from scipy import ndimage as ndi
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

p = argparse.ArgumentParser()
p.add_argument("--tif", required=True); p.add_argument("--rocks", required=True)
p.add_argument("--path", required=True); p.add_argument("--slope", required=True)
p.add_argument("--n-each", type=int, default=15)
p.add_argument("--prefix", default="docs/data/img/validation2")
a = p.parse_args()
HALF, CELL = 24, 8  # 24 px = 12 m yaricap; 8 px = 2 m hucre

img = rasterio.open(a.tif).read(1)
slope = np.load(a.slope)
rocks = [r for r in csv.DictReader(open(a.rocks)) if 1.0 <= float(r["diam_m"]) <= 4.0]

# rota koridoru (+-5 hucre = 10 m)
path = np.array(json.load(open(a.path, encoding="utf-8"))["path_px"])
m = np.zeros(slope.shape, bool)
for s, e in zip(path[:-1], path[1:]):
    for t in np.linspace(0, 1, max(int(np.hypot(*(e - s)) * 2), 2)):
        c, r = s + (e - s) * t
        if 0 <= int(c) < 1000 and 0 <= int(r) < 1000:
            m[int(r), int(c)] = True
corr = ndi.binary_dilation(m, iterations=5)

def cell(r): return min(int(float(r["row_px"]) // CELL), 999), min(int(float(r["col_px"]) // CELL), 999)
g_path = [r for r in rocks if corr[cell(r)]]
g_steep = [r for r in rocks if slope[cell(r)] >= 30 and not corr[cell(r)]]
print(f"havuz: rota yakini {len(g_path)}, dik yamac (>=30 derece, rota disi) {len(g_steep)}")

rng = np.random.default_rng(1)
pick = [(r, "rota") for r in rng.choice(g_path, a.n_each, replace=False)] + \
       [(r, "dik_yamac") for r in rng.choice(g_steep, a.n_each, replace=False)]
order = rng.permutation(len(pick)); pick = [pick[i] for i in order]  # kor: karistir

pad = np.pad(img, HALF, mode="constant")
with open(a.prefix + "_sample.csv", "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["no", "row_px", "col_px", "diam_m", "grup", "karar"])
    for i, (r, g) in enumerate(pick, 1):
        w.writerow([i, r["row_px"], r["col_px"], r["diam_m"], g, ""])

PER = 15
for s in range(len(pick) // PER):
    fig, axs = plt.subplots(5, 6, figsize=(14, 12))
    for k in range(PER):
        i = s * PER + k
        r = pick[i][0]; rr, cc = int(float(r["row_px"])), int(float(r["col_px"]))
        crop = pad[rr:rr + 2 * HALF, cc:cc + 2 * HALF]
        d_px = float(r["diam_m"]) / 0.25
        for j in (0, 1):
            ax = axs[k // 3, (k % 3) * 2 + j]
            ax.imshow(crop, cmap="gray", vmin=np.percentile(crop[crop > 0], 1) if (crop > 0).any() else 0,
                      vmax=np.percentile(crop, 99), interpolation="bicubic")
            if j == 1:
                ax.add_patch(plt.Circle((HALF, HALF), d_px / 2 + 2, fill=False, ec="red", lw=1))
            ax.set_xticks([]); ax.set_yticks([])
            if j == 0:
                ax.set_title(f"#{i+1}  (~{float(r['diam_m']):.1f} m)", fontsize=11, loc="left", fontweight="bold")
    fig.suptitle(f"2. dogrulama, sayfa {s+1}: her adayda sol = isaretsiz, sag = programin buldugu yer", fontsize=12)
    fig.tight_layout(); fig.savefig(f"{a.prefix}_sheet_{s+1}.png", dpi=80); plt.close(fig)
print("tamam:", a.prefix + "_sheet_1.png", a.prefix + "_sheet_2.png", a.prefix + "_sample.csv")
