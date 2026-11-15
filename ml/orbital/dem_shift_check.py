"""Karo yüksekliği (sim/tools/build_tiles.py L0) ile planlayıcı DEM'i (layers/elevation.npy) arasındaki kaymayı ölçer.
Yüksek geçiren yükseklikler arasında korelasyon, karo çerçevesi ±70 m taranır (önce 10 m, sonra 2 m adım).
Kullanım (repo kökünden): python ml/orbital/dem_shift_check.py <L0_WxH.u16> [manifest.json]
Çıktı işareti: "planlayıcı p noktasının karşılığı karoda p + (dE doğu, dS güney)". build_tiles.py --dtm-dcol/--dtm-drow bunu geri alır.
"""
import json, sys
import numpy as np
from scipy.ndimage import map_coordinates, uniform_filter

l0 = sys.argv[1]; man = json.load(open(sys.argv[2] if len(sys.argv) > 2 else "sim/data/tiles/manifest.json"))
g = json.load(open("contracts/grid.json")); W, H, res = man["W"], man["H"], man["res_p"]
x0, yt = man["origin_proj"]["x0"], man["origin_proj"]["ytop"]; ox, oy = g["origin_xy_m"]
el = np.load("layers/elevation.npy").astype(np.float64)
L0 = np.memmap(l0, dtype=np.uint16, mode="r", shape=(H, W))
r0, r1 = int((yt - (oy + 120)) / res) - 2, int((yt - (oy - 2000 - 120)) / res) + 2
c0, c1 = int((ox - 120 - x0) / res) - 2, int((ox + 2000 + 120 - x0) / res) + 2
sub = np.array(L0[r0:r1, c0:c1], np.float32) * man["zstep"] + man["zmin"]
hp = lambda a: a - uniform_filter(a, 15)
corr = lambda a, b: float(((a - a.mean()) * (b - b.mean())).sum() / np.sqrt(((a - a.mean()) ** 2).sum() * ((b - b.mean()) ** 2).sum()))


def samp(dE, dS, sl):
    ii, jj = np.meshgrid(np.arange(sl[0], sl[1]), np.arange(sl[2], sl[3]))
    x = ox + (ii + .5) * 2 + dE; y = oy - (jj + .5) * 2 - dS
    return map_coordinates(sub, [(yt - y) / res - .5 - r0, (x - x0) / res - .5 - c0], order=1, mode="nearest")


def best(sl):
    P = hp(el[sl[2]:sl[3], sl[0]:sl[1]]); b = max((corr(P, hp(samp(e, s, sl))), e, s) for e in range(-70, 71, 10) for s in range(-70, 71, 10))
    return max([b] + [(corr(P, hp(samp(e, s, sl))), e, s) for e in range(b[1] - 8, b[1] + 9, 2) for s in range(b[2] - 8, b[2] + 9, 2)]), corr(P, hp(samp(0, 0, sl)))


for name, sl in {"tüm kutu": (100, 900, 100, 900), "KB": (100, 500, 100, 500), "KD": (500, 900, 100, 500), "GB": (100, 500, 500, 900),
                 "GD": (500, 900, 500, 900), "koridor S1-S3": (380, 540, 480, 820)}.items():
    (c, e, s), c00 = best(sl); print(f"{name}: en iyi korelasyon {c:.3f} @ dE={e:+d} m (doğu), dS={s:+d} m (güney); kaymasız {c00:.3f}")
