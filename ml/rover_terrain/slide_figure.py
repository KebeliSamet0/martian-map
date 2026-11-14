"""Sunum doğrulama slaytı görseli: Navcam karesi + model tahmini, 3 durak yan yana → docs/figures/navcam_vs_model.png (1920 px).

Kullanım (repo kökünden): python ml/rover_terrain/slide_figure.py <img_dir> --model models/rover_terrain/full/best.pt
Durak değerleri LAYERS.md'deki 18 durak tablosuyla aynı kaynaktan (layers/rover_stops.json).
"""
import argparse, json, os, sys
import numpy as np
import torch

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from infer_stops import predict, load_image, COLORS, CLASSES  # noqa: E402
from train import build_model  # noqa: E402
from train_mask import build_mask_model  # noqa: E402

TR = ("toprak", "ana kaya", "kum", "büyük kaya")
# (durak, LAYERS.md sırası, başlık, rover_stops.json images içindeki kare sırası; None = kumu en yüksek kare)
PICKS = [("msl_s118_d0726", 6, "Tuttu: ana kaya", 0),
         ("msl_s120_d3056", 15, "Kum kaçtı: kumu ana kaya sandı", 0),
         ("msl_s120_d2366", 13, "Kum yakalandı: rover izindeki kum", 3)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("img_dir"); ap.add_argument("--model", required=True)
    ap.add_argument("--mask", default="models/rover_terrain/mask/mask.pt")
    ap.add_argument("--out", default="docs/figures/navcam_vs_model.png")
    a = ap.parse_args()
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    from matplotlib.patches import Patch
    dev = torch.device("cuda" if torch.cuda.is_available() else "cpu"); torch.manual_seed(0)
    model = build_model(pretrained=False); model.load_state_dict(torch.load(a.model, map_location=dev)); model.to(dev)
    mm = build_mask_model(pretrained=False); mm.load_state_dict(torch.load(a.mask, map_location=dev)); mm.to(dev).eval()
    stops = {s["stop_id"]: s for s in json.load(open("layers/rover_stops.json", encoding="utf-8"))}
    fig, ax = plt.subplots(2, 3, figsize=(19.2, 14.4), dpi=100)
    for j, (sid, no, title, fi) in enumerate(PICKS):
        s = stops[sid]
        res = []
        for k, ref in enumerate(s["images"]):
            if fi is not None and k != fi:
                continue
            g, p, ent, inv = predict(model, mm, load_image(a.img_dir, sid, ref), 20, dev)
            v = ~inv
            res.append((float(p[2][v].mean()) if v.any() else 0.0, g, p, inv))
        _, g, p, inv = max(res, key=lambda r: r[0])
        gray3 = np.repeat(g[..., None], 3, -1).astype(np.float32)
        ov = 0.4 * gray3 + 0.6 * COLORS[p.argmax(0)]
        ov[inv] = gray3[inv] * 0.3
        cf = s["class_frac"]
        ax[0, j].imshow(g, cmap="gray"); ax[0, j].set_title(f"{title}\n#{no} · {sid} · Navcam", fontsize=15, loc="left")
        ax[1, j].imshow(ov.astype(np.uint8))
        ax[1, j].set_title(f"Model · durak: " + ", ".join(f"{TR[k]} {cf[c]:.2f}" for k, c in enumerate(CLASSES) if cf[c] >= 0.05),
                           fontsize=13, loc="left")
        for x in ax[:, j]:
            x.axis("off")
    fig.legend(handles=[Patch(color=COLORS[i] / 255, label=TR[i]) for i in range(4)]
               + [Patch(color=(0.15, 0.15, 0.15), label="maske (rover gövdesi / 30 m ötesi)")],
               loc="lower center", ncol=5, fontsize=15, frameon=False)
    fig.subplots_adjust(left=0.01, right=0.99, top=0.93, bottom=0.06, wspace=0.03, hspace=0.12)
    fig.savefig(a.out, dpi=100, pil_kwargs={"optimize": True}); print(a.out, os.path.getsize(a.out) // 1024, "KB")


if __name__ == "__main__":
    main()
