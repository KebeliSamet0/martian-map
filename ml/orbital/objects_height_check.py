"""3B nesnelerin (durak, kaya, kum) altındaki karo yüksekliği, planlayıcı DEM'iyle tutarlı mı? Orijinal ve düzeltilmiş karo L0'ı için artık.
Kullanım: python ml/orbital/objects_height_check.py <L0 orijinal> <L0 düzeltilmiş>
Artık = karo yüksekliği − planlayıcı yüksekliği − medyan düşey fark (≈ 15 m, kayıtlı, sim'i etkilemez). Nesne konumları ızgara pikselinden (contracts/grid.json)."""
import json, sys
import numpy as np
from scipy.ndimage import map_coordinates
man = json.load(open("sim/data/tiles/manifest.json")); g = json.load(open("contracts/grid.json"))
W, H, res = man["W"], man["H"], man["res_p"]; x0, yt = man["origin_proj"]["x0"], man["origin_proj"]["ytop"]; ox, oy = g["origin_xy_m"]
el = np.load("layers/elevation.npy").astype(np.float64)
sets = {
    "rover durakları (128)": [s["px"] for s in json.load(open("layers/rover_stops.json"))],
    "bilim durakları": [s["px"] for s in json.load(open("layers/science_stops.json"))["stops"]] if isinstance(json.load(open("layers/science_stops.json")), dict) else [s["px"] for s in json.load(open("layers/science_stops.json"))],
    "Curiosity Navcam durakları (23)": [s["px"] for s in json.load(open("sim/data/curiosity.json"))["stops"]],
    "kayalar (829)": [r["px"] for r in json.load(open("sim/data/rocks.json"))],
    "kum noktaları (16)": [s["px"] for s in json.load(open("layers/sand_hint.json"))["points"]],
}
for f, tag in ((sys.argv[1], "orijinal"), (sys.argv[2], "düzeltilmiş")):
    L = np.memmap(f, dtype=np.uint16, mode="r", shape=(H, W))
    print(f"--- {tag} karolar")
    allres = []
    for name, pts in sets.items():
        P = np.array(pts, float); P = P[(P[:, 0] > 5) & (P[:, 0] < 995) & (P[:, 1] > 5) & (P[:, 1] < 995)]
        x = ox + P[:, 0] * 2; y = oy - P[:, 1] * 2
        r0 = int((yt - y.max()) / res) - 3; c0 = int((x.min() - x0) / res) - 3
        sub = np.array(L[r0:int((yt - y.min()) / res) + 4, c0:int((x.max() - x0) / res) + 4], np.float32) * 0.05 - 4400
        h = map_coordinates(sub, [(yt - y) / res - .5 - r0, (x - x0) / res - .5 - c0], order=1, mode="nearest")
        pl = map_coordinates(el, [P[:, 1] - .5, P[:, 0] - .5], order=1, mode="nearest")
        d = h - pl; allres.append(d)
        print(f"{name}: n={len(P)} medyan fark {np.median(d):+.1f} m, medyan |artık| {np.median(np.abs(d - 14.9)):.1f} m, p90 |artık| {np.percentile(np.abs(d - 14.9), 90):.1f} m")
