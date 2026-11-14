"""Gölge tabanlı kaya tespiti — Aşama 0 denemesi (Golombek et al. 2008/2012 fikrinin sade hali).

Adımlar:
  1. Görüntüyü yerel ortalama/std ile normalize et (z-skoru) → albedo farklarını bastırır.
  2. Güneş yönünü görüntüden tahmin et: parlak (güneşe bakan) ve koyu (gölge) pikseller
     arasındaki ortalama kayma = gölge yönü.  Etiketteki SUB_SOLAR_AZIMUTH biliniyorsa --shadow-az ile ver.
  3. z < -k olan pikseller gölge adayıdır → morfolojik temizlik → bağlı bileşenler.
  4. Her gölge için: güneşe dik genişlik ≈ kaya çapı, güneş yönündeki uzunluk → yükseklik (geliş açısıyla).
  5. Çıktı: kaya listesi (CSV) + üst üste bindirilmiş PNG + özet.

Kullanım:
  python ml/orbital/shadow_rocks.py data/raw/gale_test.tif --out-prefix docs/data/img/rock_abundance
"""
import argparse, csv, math, sys
sys.stdout.reconfigure(encoding="utf-8")
import numpy as np
import rasterio
from scipy import ndimage as ndi
from skimage import measure, morphology
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def normalize(img, sigma_px):
    img = img.astype(np.float32)
    mu = ndi.gaussian_filter(img, sigma_px)
    var = ndi.gaussian_filter(img ** 2, sigma_px) - mu ** 2
    return (img - mu) / np.sqrt(np.maximum(var, 1e-3))


def estimate_shadow_dir(z, k=1.5, max_shift=6):
    """Parlak maske ile koyu maske arasındaki en iyi kaymayı bul → gölge yön vektörü (satır, sütun)."""
    B = (z > k).astype(np.float32)
    D = (z < -k).astype(np.float32)
    B -= B.mean(); D -= D.mean()
    F = np.fft.ifft2(np.conj(np.fft.fft2(B)) * np.fft.fft2(D)).real
    best, best_v = (0, 0), -np.inf
    for dr in range(-max_shift, max_shift + 1):
        for dc in range(-max_shift, max_shift + 1):
            if dr == 0 and dc == 0:
                continue
            v = F[dr % F.shape[0], dc % F.shape[1]] / math.hypot(dr, dc) ** 0.5
            if v > best_v:
                best, best_v = (dr, dc), v
    v = np.array(best, float)
    return v / np.linalg.norm(v)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("tif")
    p.add_argument("--out-prefix", required=True)
    p.add_argument("--k", type=float, default=2.0, help="gölge eşiği (yerel std cinsinden)")
    p.add_argument("--min-px", type=int, default=4, help="en küçük gölge (piksel); 4 px = 0.25 m²")
    p.add_argument("--incidence", type=float, default=40.0, help="güneş geliş açısı, derece (etiketten)")
    p.add_argument("--shadow-az", type=float, default=None,
                   help="gölge yönü, derece, görüntüde sağdan saat yönünde (biliniyorsa)")
    a = p.parse_args()

    with rasterio.open(a.tif) as ds:
        img = ds.read(1)
        res = ds.res[0]
    valid = img > 0
    z = normalize(img, sigma_px=round(15 / res))  # ~15 m'lik yerel pencere
    z[~valid] = 0

    if a.shadow_az is None:
        sdir = estimate_shadow_dir(z)
        src = "görüntüden tahmin"
    else:
        t = math.radians(a.shadow_az)
        sdir = np.array([math.sin(t), math.cos(t)])  # satır aşağı, sütun sağa
        src = "verilen"
    shadow_az = (math.degrees(math.atan2(sdir[0], sdir[1])) + 360) % 360
    perp = np.array([-sdir[1], sdir[0]])

    mask = (z < -a.k) & valid
    mask = morphology.opening(mask, morphology.disk(1))
    mask = morphology.remove_small_objects(mask, a.min_px)
    lab = measure.label(mask, connectivity=2)
    props = measure.regionprops(lab)

    tan_inc = math.tan(math.radians(a.incidence))
    rocks = []
    for r in props:
        coords = r.coords.astype(float)
        c = coords.mean(0)
        along = (coords - c) @ sdir
        across = (coords - c) @ perp
        width_px = across.max() - across.min() + 1
        length_px = along.max() - along.min() + 1
        if length_px > 4 * width_px or width_px > 40:  # çok uzun/büyük: çizgi, kraterin gölgesi vs.
            continue
        d_m = width_px * res
        h_m = length_px * res / tan_inc
        rc = c - sdir * (width_px / 2)  # kaya merkezi gölgenin güneş tarafında
        rocks.append(dict(row=rc[0], col=rc[1], diam_m=d_m, height_m=h_m, shadow_px=r.area))

    area_m2 = valid.sum() * res * res
    cfa = sum(math.pi * (x["diam_m"] / 2) ** 2 for x in rocks) / area_m2
    big = [x for x in rocks if x["diam_m"] >= 1.0]
    print(f"gölge yönü: {shadow_az:.0f}° (sağdan saat yönü, {src})")
    print(f"alan: {area_m2:,.0f} m²  ({img.shape[1]}x{img.shape[0]} px, {res} m/px)")
    print(f"tespit: {len(rocks)} kaya adayı; ≥1 m: {len(big)}; ≥1.5 m: {sum(x['diam_m']>=1.5 for x in rocks)}")
    if rocks:
        ds_ = np.array([x["diam_m"] for x in rocks])
        print(f"çap (m): medyan {np.median(ds_):.2f}, maks {ds_.max():.2f}")
    print(f"CFA (kayaların kapladığı alan oranı): {cfa*100:.2f} %")

    with open(a.out_prefix + "_rocks.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["row", "col", "diam_m", "height_m", "shadow_px"])
        w.writeheader()
        for x in rocks:
            w.writerow({k: round(v, 2) if isinstance(v, float) else v for k, v in x.items()})

    # Görsel: tamamı + yakın plan
    vmin, vmax = np.percentile(img[valid], [1, 99])
    fig, axs = plt.subplots(1, 2, figsize=(12, 6))
    n = min(400, img.shape[0])
    r0 = c0 = (img.shape[0] - n) // 2
    for ax, (title, sl) in zip(axs, [("Tüm kesit", (slice(None), slice(None))),
                                    (f"Yakın plan ({n*res:.0f} m)", (slice(r0, r0 + n), slice(c0, c0 + n)))]):
        ax.imshow(img[sl], cmap="gray", vmin=vmin, vmax=vmax)
        off = (sl[0].start or 0, sl[1].start or 0)
        sel = [x for x in rocks if x["diam_m"] >= 1.0
               and 0 <= x["row"] - off[0] < img[sl].shape[0] and 0 <= x["col"] - off[1] < img[sl].shape[1]]
        ax.scatter([x["col"] - off[1] for x in sel], [x["row"] - off[0] for x in sel],
                   s=[max(6, (x["diam_m"] / res) ** 2 * (1 if off != (0, 0) else 0.08)) for x in sel],
                   facecolors="none", edgecolors="red", linewidths=0.7)
        ax.set_title(f"{title} — ≥1 m kaya adayı: {len(sel)}")
        ax.axis("off")
    cx, cy = img[sl].shape[1] * 0.9, img[sl].shape[0] * 0.1
    axs[1].annotate("", xy=(cx + sdir[1] * 30, cy + sdir[0] * 30), xytext=(cx, cy),
                    arrowprops=dict(color="yellow", width=2))
    axs[1].text(cx - 60, cy - 15, "gölge yönü", color="yellow")
    fig.suptitle(f"Gölge tabanlı kaya tespiti (eşik z<-{a.k}) · CFA ≈ {cfa*100:.1f} %")
    fig.tight_layout()
    fig.savefig(a.out_prefix + "_detection.png", dpi=90)
    print("yazıldı:", a.out_prefix + "_detection.png", a.out_prefix + "_rocks.csv")


if __name__ == "__main__":
    main()
