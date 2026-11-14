"""Kapi 2: 2x2 km ortofotodan kaya tespiti -> layers/rock_cfa.npy (grid.json izgarasinda, CFA 0-1).

Yontem shadow_rocks.py ile AYNI (dogruladigimiz yontem, esikler degismedi); tek fark:
gunes/golge yonu tum resim icin degil, 250 m'lik parcalarda ayri tahmin edilir (mozaik
birden cok goruntuden olusabilir). Parcada yeterli sinyal yoksa komsu parcalarin medyani kullanilir.

Kullanim:
  python ml/orbital/rock_cfa_grid.py --tif data/raw/gale_2x2km_25cm.tif --grid data/raw/grid_kapi1.json \
      --out-dir layers --preview docs/data/img/rock_cfa_preview.png
"""
import argparse, csv, json, math, sys
sys.stdout.reconfigure(encoding="utf-8")
import numpy as np
import rasterio
from skimage import measure, morphology
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

sys.path.insert(0, __file__.rsplit("\\", 1)[0] if "\\" in __file__ else __file__.rsplit("/", 1)[0])
from shadow_rocks import normalize, estimate_shadow_dir  # ayni fonksiyonlar

p = argparse.ArgumentParser()
p.add_argument("--tif", required=True)
p.add_argument("--grid", required=True)
p.add_argument("--out-dir", default="layers")
p.add_argument("--preview", default=None)
p.add_argument("--rocks-csv", default="data/interim/rock_cfa_rocks.csv")
p.add_argument("--k", type=float, default=2.0)
p.add_argument("--min-px", type=int, default=4)
p.add_argument("--incidence", type=float, default=40.0)
p.add_argument("--tile", type=int, default=1000, help="yon tahmini parcasi, piksel (1000 px = 250 m)")
a = p.parse_args()

g = json.load(open(a.grid, encoding="utf-8"))
N, cell_m = g["width"], g["res_m"]

with rasterio.open(a.tif) as ds:
    img = ds.read(1)
    res = ds.res[0]
H, W = img.shape
cell_px = round(cell_m / res)
assert H == W == N * cell_px, f"tif {img.shape} izgara {N}x{cell_px} ile uyusmuyor"
valid = img > 0

print("normalize...", flush=True)
z = normalize(img, sigma_px=round(15 / res))
z[~valid] = 0

# --- 1) parca basina golge yonu ---
T = a.tile
nt = H // T
dirs = np.full((nt, nt, 2), np.nan)
for i in range(nt):
    for j in range(nt):
        zt = z[i*T:(i+1)*T, j*T:(j+1)*T]
        if (zt < -2).mean() > 0.002:  # yeterli golge var mi
            dirs[i, j] = estimate_shadow_dir(zt)
az = lambda v: (math.degrees(math.atan2(v[0], v[1])) + 360) % 360
good = ~np.isnan(dirs[..., 0])
med = np.nanmedian(dirs[good], axis=0); med /= np.linalg.norm(med)
angdiff = lambda v: abs(((az(v) - az(med)) + 180) % 360 - 180)
n_fallback = 0
for i in range(nt):
    for j in range(nt):
        if not good[i, j] or angdiff(dirs[i, j]) > 40:  # sinyal yok ya da medyandan >40 derece: guvenme
            dirs[i, j] = med; n_fallback += 1
print(f"medyana cekilen (guvenilmez) parca: {n_fallback}/{nt*nt}")
az_tab = np.array([[az(dirs[i, j]) for j in range(nt)] for i in range(nt)])
print(f"golge yonu (derece, saga/saat yonu) parca tablosu {nt}x{nt}:")
print(np.round(az_tab).astype(int))
dev = np.abs(((az_tab - az(med)) + 180) % 360 - 180)
print(f"medyan yon {az(med):.0f} derece; parcalar medyandan sapma: medyan {np.median(dev):.0f}, maks {dev.max():.0f}; "
      f"{(dev > 20).sum()}/{nt*nt} parca >20 derece sapiyor; yon tahmini yapilamayan parca: {(~good).sum()}")

# --- 2) tespit (shadow_rocks.py ile ayni) ---
print("tespit...", flush=True)
mask = (z < -a.k) & valid
mask = morphology.opening(mask, morphology.disk(1))
mask = morphology.remove_small_objects(mask, a.min_px)
lab = measure.label(mask, connectivity=2)
tan_inc = math.tan(math.radians(a.incidence))
rocks = []
for r in measure.regionprops(lab):
    coords = r.coords.astype(float)
    c = coords.mean(0)
    sdir = dirs[min(int(c[0]) // T, nt - 1), min(int(c[1]) // T, nt - 1)]
    perp = np.array([-sdir[1], sdir[0]])
    along, across = (coords - c) @ sdir, (coords - c) @ perp
    wpx, lpx = across.max() - across.min() + 1, along.max() - along.min() + 1
    if lpx > 4 * wpx or wpx > 40:
        continue
    rc = c - sdir * (wpx / 2)
    rocks.append((rc[0], rc[1], wpx * res, lpx * res / tan_inc))
rocks = np.array(rocks)
d = rocks[:, 2]
print(f"{len(rocks)} kaya adayi; >=1 m: {(d >= 1).sum()}; >=1.5 m: {(d >= 1.5).sum()}")

# --- 3) CFA izgarasi: her kaya dairesini 25 cm cozunurlukte ciz, 2 m hucrede kaplanan alan orani al ---
# (buyuk kayalar birden cok hucreye yayilir; ust uste binen kayalar iki kez sayilmaz)
from skimage.draw import disk as draw_disk
def cfa_grid(sel):
    cov = np.zeros((H, W), np.uint8)
    for row, col, dm, _ in rocks[sel]:
        rr, cc = draw_disk((row, col), max(dm / res / 2, 0.5), shape=cov.shape)
        cov[rr, cc] = 1
    return cov.reshape(N, cell_px, N, cell_px).mean(axis=(1, 3)).astype(np.float32)

cfa_all = cfa_grid(np.ones(len(rocks), bool))
cfa_1m = cfa_grid(d >= 1.0)
total_area = valid.sum() * res * res
glob_all = (math.pi * (d / 2) ** 2).sum() / total_area
glob_1m = (math.pi * (d[d >= 1] / 2) ** 2).sum() / total_area
print(f"CFA (tum adaylar, dogruladigimiz tanim): %{glob_all*100:.2f} | >=1 m: %{glob_1m*100:.2f}")
print(f"hucre bazinda: kaya iceren hucre %{(cfa_all > 0).mean()*100:.1f}, "
      f"izgara ortalamasi %{cfa_all.mean()*100:.2f} (genel %{glob_all*100:.2f} ile ~ayni olmali), p99 {np.percentile(cfa_all, 99):.2f}, maks {cfa_all.max():.2f}")
assert cfa_all.shape == (N, N) and np.isfinite(cfa_all).all()

np.save(f"{a.out_dir}/rock_cfa.npy", cfa_all)
np.save(f"{a.out_dir}/rock_cfa_ge1m.npy", cfa_1m)
import os; os.makedirs(os.path.dirname(a.rocks_csv), exist_ok=True)
with open(a.rocks_csv, "w", newline="", encoding="utf-8") as f:
    w = csv.writer(f); w.writerow(["row_px", "col_px", "diam_m", "height_m"])
    w.writerows([[round(x, 2) for x in row] for row in rocks])
print("yazildi:", f"{a.out_dir}/rock_cfa.npy", f"{a.out_dir}/rock_cfa_ge1m.npy", a.rocks_csv)

# --- 4) onizleme ---
if a.preview:
    sm = img[::8, ::8]  # 1000x1000 ortofoto
    fig, axs = plt.subplots(1, 2, figsize=(13, 6.5))
    axs[0].imshow(sm, cmap="gray"); axs[0].set_title("Ortofoto 2x2 km (2 m)")
    im = axs[1].imshow(cfa_all, cmap="magma", vmin=0, vmax=np.percentile(cfa_all[cfa_all > 0], 99))
    axs[1].set_title(f"Kaya yogunlugu (CFA, hucre 2 m) · genel %{glob_all*100:.2f}")
    fig.colorbar(im, ax=axs[1], fraction=0.046, label="kaplanan alan orani")
    for ax in axs: ax.axis("off")
    fig.tight_layout(); fig.savefig(a.preview, dpi=80)
    print("yazildi:", a.preview)
