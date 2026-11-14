"""Elle dogrulama icin numarali kaya adaylari sayfalari uretir.
Her aday: solda ham kesit (isaretsiz), sagda ayni kesit + kirmizi daire.
Kullanim: python ml/orbital/validation_sheet.py data/raw/gale_test.tif docs/data/img/rock_abundance_rocks.csv
"""
import csv, sys
import numpy as np, rasterio
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

tif, csv_path = sys.argv[1], sys.argv[2]
N, PER_SHEET, HALF = 30, 15, 24  # 24 px yaricap = 12 m
img = rasterio.open(tif).read(1)
rows = [r for r in csv.DictReader(open(csv_path)) if float(r["diam_m"]) >= 1.0 and float(r["diam_m"]) <= 4.0]
rng = np.random.default_rng(0)
pick = [rows[i] for i in sorted(rng.choice(len(rows), N, replace=False))]
pad = np.pad(img, HALF, mode="constant")
with open("docs/data/img/validation_sample.csv", "w", newline="") as f:
    w = csv.writer(f); w.writerow(["no", "row", "col", "diam_m", "karar"])
    for i, r in enumerate(pick, 1):
        w.writerow([i, r["row"], r["col"], r["diam_m"], ""])
for s in range(N // PER_SHEET):
    fig, axs = plt.subplots(5, 6, figsize=(14, 12))
    for k in range(PER_SHEET):
        i = s * PER_SHEET + k
        r = pick[i]; rr, cc = int(float(r["row"])), int(float(r["col"]))
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
    fig.suptitle(f"Dogrulama sayfasi {s+1}: her adayda sol = isaretsiz, sag = programin buldugu yer", fontsize=12)
    fig.tight_layout()
    fig.savefig(f"docs/data/img/validation_sheet_{s+1}.png", dpi=80)
print("tamam")
