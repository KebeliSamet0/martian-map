"""Sprint 2 / #46: ortofotoda "kum olma ihtimali yuksek" adaylari bul, gozle dogrulama sayfasi uret,
onaylananlardan layers/sand_hint.json yaz.

Kum belirtisi (hepsi birden): duz (egim<10 derece), puruzsuz doku, kayasiz (rock_cfa dusuk),
cevresinden alcak. Bunlarin ortak noktasi: kumlu cukur/vadi tabani. KESIN kum degil, ADAY; son karar gozle.

Adim 1 (aday + sayfa):
  python ml/orbital/sand_candidates.py find --tif data/raw/gale_2x2km_25cm.tif
Adim 2 (onaylananlardan json):
  python ml/orbital/sand_candidates.py write --accept 1,4,7
"""
import argparse, csv, json, math
import numpy as np
from scipy import ndimage as ndi
from skimage import measure, morphology
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

CELL_M, N, PX_PER_CELL = 2.0, 1000, 8
OUT_CSV = "docs/data/img/sand_candidates.csv"

ap = argparse.ArgumentParser()
ap.add_argument("cmd", choices=["find", "write"])
ap.add_argument("--tif", default="data/raw/gale_2x2km_25cm.tif")
ap.add_argument("--path", default="layers/msl_proposed_path.json")
ap.add_argument("--accept", default="", help="onaylanan aday numaralari, ornek 1,4,7")
ap.add_argument("--n-near", type=int, default=8)
ap.add_argument("--n-far", type=int, default=7)
a = ap.parse_args()


def route_dist_map():
    path = np.array(json.load(open(a.path, encoding="utf-8"))["path_px"])
    m = np.zeros((N, N), bool)
    for s, e in zip(path[:-1], path[1:]):
        for t in np.linspace(0, 1, max(int(np.hypot(*(e - s)) * 2), 2)):
            c, r = s + (e - s) * t
            if 0 <= int(c) < N and 0 <= int(r) < N:
                m[int(r), int(c)] = True
    return ndi.distance_transform_edt(~m) * CELL_M


if a.cmd == "find":
    import rasterio
    img = rasterio.open(a.tif).read(1).astype(np.float32)
    slope, cfa, elev = (np.load(f"layers/{n}.npy") for n in ("slope", "rock_cfa", "elevation"))
    b = img.reshape(N, PX_PER_CELL, N, PX_PER_CELL)
    mean, std = b.mean(axis=(1, 3)), b.std(axis=(1, 3))
    std10 = ndi.uniform_filter(std, 5)                                          # 10 m pencerede doku
    r10 = np.sqrt(np.maximum(ndi.uniform_filter(mean**2, 5) - ndi.uniform_filter(mean, 5)**2, 0))
    rel_e = elev - ndi.uniform_filter(elev, 51)                                  # 100 m cevresine gore yukseklik
    cfa_s = ndi.uniform_filter(cfa, 9)
    mask = (slope < 10) & (std10 < 7.0) & (r10 < 6.0) & (rel_e < 0.3) & (cfa_s < 0.003)
    mask = morphology.opening(mask, morphology.disk(2))
    lab = measure.label(mask)
    dist = route_dist_map()
    regs = []
    for p in measure.regionprops(lab):
        if p.area < 30:  # >= 120 m2
            continue
        rr, cc = p.centroid
        reg = lab == p.label
        regs.append(dict(col=cc, row=rr, area_m2=p.area * CELL_M**2,
                         radius_m=min(math.sqrt(p.area * CELL_M**2 / math.pi), 30.0),
                         std10=float(std10[reg].mean()), slope=float(slope[reg].mean()),
                         route_m=float(dist[reg].min())))
    print(f"{len(regs)} aday bolge; rotaya <=150 m: {sum(r['route_m'] <= 150 for r in regs)}")

    def pick(pool, n, min_gap_m=100.0):
        chosen = []
        for r in sorted(pool, key=lambda r: -r["area_m2"]):
            if all(math.hypot(r["col"] - c["col"], r["row"] - c["row"]) * CELL_M >= min_gap_m for c in chosen):
                chosen.append(r)
            if len(chosen) == n:
                break
        return chosen
    near = pick([r for r in regs if r["route_m"] <= 150], a.n_near)
    far = pick([r for r in regs if r["route_m"] > 150], a.n_far)
    for r in near: r["grup"] = "rota_yakini"
    for r in far: r["grup"] = "rota_uzagi"
    sel = near + far
    rng = np.random.default_rng(2)
    sel = [sel[i] for i in rng.permutation(len(sel))]   # kor: karistir

    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f); w.writerow(["no", "col", "row", "radius_m", "alan_m2", "rota_uzaklik_m", "grup", "karar", "not"])
        for i, r in enumerate(sel, 1):
            w.writerow([i, round(r["col"], 1), round(r["row"], 1), round(r["radius_m"], 1), round(r["area_m2"]),
                        round(r["route_m"]), r["grup"], "", ""])

    HALF = 200  # 25 cm px: 400 px = 100 m
    pad = np.pad(img, HALF, mode="constant")
    for s in range(math.ceil(len(sel) / 15)):
        fig, axs = plt.subplots(5, 6, figsize=(14, 12))
        for ax in axs.ravel(): ax.axis("off")
        for k in range(15):
            i = s * 15 + k
            if i >= len(sel): break
            r = sel[i]
            rc, cc = int(r["row"] * PX_PER_CELL), int(r["col"] * PX_PER_CELL)
            crop = pad[rc:rc + 2 * HALF, cc:cc + 2 * HALF]
            for j in (0, 1):
                ax = axs[k // 3, (k % 3) * 2 + j]
                ax.imshow(crop, cmap="gray", vmin=np.percentile(crop[crop > 0], 1) if (crop > 0).any() else 0,
                          vmax=np.percentile(crop, 99), interpolation="bicubic")
                if j == 1:
                    ax.add_patch(plt.Circle((HALF, HALF), r["radius_m"] / 0.25, fill=False, ec="cyan", lw=1.2))
                ax.set_xticks([]); ax.set_yticks([])
                ax.axis("on")
                if j == 0:
                    ax.set_title(f"#{i+1}  (~{r['area_m2']:.0f} m2)", fontsize=11, loc="left", fontweight="bold")
        fig.suptitle(f"Kum adaylari, sayfa {s+1} (100 m x 100 m): sol = isaretsiz, sag = adayin yeri (camgobegi daire)", fontsize=12)
        fig.tight_layout(); fig.savefig(f"docs/data/img/sand_sheet_{s+1}.png", dpi=80); plt.close(fig)
    print("yazildi:", OUT_CSV, "docs/data/img/sand_sheet_*.png")

else:  # write
    rows = list(csv.DictReader(open(OUT_CSV, encoding="utf-8")))
    acc = {int(x) for x in a.accept.split(",") if x.strip()}
    out = []
    for r in rows:
        if int(r["no"]) not in acc:
            continue
        near = float(r["rota_uzaklik_m"]) <= 150
        out.append({
            "id": f"sand_{len(out)+1}",
            "px": [float(r["col"]), float(r["row"])],
            "radius_m": float(r["radius_m"]),
            "reason": ("Duz (egim <10 derece), puruzsuz dokulu, kayasiz, cevresinden alcak: kumlu cukur/vadi tabani gorunumu. "
                       "Ortofotodan aday, gozle dogrulandi." + (f" Curiosity rotasina ~{float(r['rota_uzaklik_m']):.0f} m." if near else "")),
            "route_dist_m": float(r["rota_uzaklik_m"]),
        })
    doc = {"description": "Ortofotoda kum olma ihtimali yuksek adaylar (kesin degil). px = [sutun, satir], contracts/grid.json izgarasinda (2 m hucre, ondalikli).",
           "source": "ml/orbital/sand_candidates.py, Bora gozle dogruladi", "points": out}
    json.dump(doc, open("layers/sand_hint.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"{len(out)} nokta yazildi: layers/sand_hint.json")
