"""Hizalama kanıtı: 1 m karo eğimi >= 30° (3B tarayıcıda kırmızı) ve S1 rotaları, orijinal ve düzeltilmiş karolarla.
Kullanım: python ml/orbital/align_check_fig.py <tiles_L0.u16 orijinal> <tiles_L0.u16 düzeltilmiş> <route_S1.json> <out.png>
(L0 dosyaları sim/tools/build_tiles.py'nin --work klasöründe; manifest orijinal karolarınki.)"""
import json, sys
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import map_coordinates
a, b, rj, out = sys.argv[1:5]
man = json.load(open("sim/data/tiles/manifest.json")); g = json.load(open("contracts/grid.json"))
W, H, res = man["W"], man["H"], man["res_p"]; x0, yt = man["origin_proj"]["x0"], man["origin_proj"]["ytop"]; ox, oy = g["origin_xy_m"]
Z = 3  # piksel / ızgara hücresi
routes = json.load(open(rj))["routes"]; cols = ((31, 119, 180), (44, 160, 44), (20, 20, 20))
panels = []
for f, title in ((a, "Orijinal karolar"), (b, "Duzeltilmis karolar (+30/+33 px)")):
    L = np.memmap(f, dtype=np.uint16, mode="r", shape=(H, W))
    xs = ox + (np.arange(380, 560, 1 / Z) + .5 / Z) * 2; ys = oy - (np.arange(480, 800, 1 / Z) + .5 / Z) * 2
    X, Y = np.meshgrid(xs, ys)
    r0 = int((yt - ys.max()) / res) - 4; c0 = int((xs.min() - x0) / res) - 4
    sub = np.array(L[r0:int((yt - ys.min()) / res) + 5, c0:int((xs.max() - x0) / res) + 5], np.float32) * 0.05 - 4400
    h = lambda dx, dy: map_coordinates(sub, [(yt - (Y + dy)) / res - .5 - r0, (X + dx - x0) / res - .5 - c0], order=1, mode="nearest")
    sl = np.degrees(np.arctan(np.hypot((h(1, 0) - h(-1, 0)) / 2, (h(0, 1) - h(0, -1)) / 2)))
    img = np.where((sl >= 30)[..., None], np.array([214, 39, 40], np.uint8), np.array([238, 238, 238], np.uint8)).astype(np.uint8)
    im = Image.fromarray(img); d = ImageDraw.Draw(im)
    for rt, col in zip(routes, cols):
        P = np.array([q for sg in rt["segments"] for q in sg["path_px"]], float) + .5
        d.line([((x - 380) * Z, (y - 480) * Z) for x, y in P], fill=col, width=3)
    d.rectangle([0, 0, im.width, 14], fill="white"); d.text((4, 2), title + "  (kirmizi: 1 m egim >= 30 derece; mavi/yesil/siyah: en kisa/dengeli/en guvenli)", fill="black")
    panels.append(im)
out_im = Image.new("RGB", (panels[0].width * 2 + 10, panels[0].height), "white")
out_im.paste(panels[0], (0, 0)); out_im.paste(panels[1], (panels[0].width + 10, 0)); out_im.save(out)
