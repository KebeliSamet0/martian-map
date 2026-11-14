"""SCAN_CHECK görselleri: seçili duraklarda Navcam · model segmentasyonu · belirsizlik · haritadaki hücre.

Kullanım (repo kökünden):
    python ml/rover_terrain/scan_check.py <img_dir> --model models/rover_terrain/full/best.pt
Çıktı: docs/figures/scan_<stop_id>.jpg (her biri < 300 KB) + stdout'ta hücre olasılıkları.
"""
import argparse, json, os, sys
import numpy as np
import torch
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from infer_stops import predict, load_image, COLORS, CLASSES  # noqa: E402
from train import build_model  # noqa: E402
from train_mask import build_mask_model  # noqa: E402

# (durak, kare sırası rover_stops.json'daki images listesinde, grup)
PICKS = [("msl_s120_d2366", 2, "kumlu"), ("msl_s120_d3056", 0, "kumlu"),
         ("msl_s118_d0726", 0, "ana kaya"), ("msl_s118_d2406", 0, "ana kaya"),
         ("msl_s118_d1608", 0, "kararsız"), ("msl_s120_d2690", 0, "kararsız")]
TR = ("toprak", "ana kaya", "kum", "büyük kaya")
HALF = 75  # harita kırpması: ±75 hücre = ±150 m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("img_dir"); ap.add_argument("--model", required=True)
    ap.add_argument("--mask", default="models/rover_terrain/mask/mask.pt")
    ap.add_argument("--out", default="docs/figures")
    a = ap.parse_args()
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    from matplotlib.patches import Patch
    dev = torch.device("cuda" if torch.cuda.is_available() else "cpu"); torch.manual_seed(0)
    model = build_model(pretrained=False); model.load_state_dict(torch.load(a.model, map_location=dev)); model.to(dev)
    mm = build_mask_model(pretrained=False); mm.load_state_dict(torch.load(a.mask, map_location=dev)); mm.to(dev).eval()
    stops = {s["stop_id"]: s for s in json.load(open("layers/rover_stops.json", encoding="utf-8"))}
    P = np.stack([np.load(f"layers/p_{c}.npy") for c in CLASSES]); E = np.load("layers/entropy.npy")
    dom = P.argmax(0)
    out = {}
    for sid, fi, grp in PICKS:
        s = stops[sid]
        g, p, ent, inv = predict(model, mm, load_image(a.img_dir, sid, s["images"][fi]), 20, dev)
        lab = p.argmax(0)
        ov = 0.45 * np.repeat(g[..., None], 3, -1) + 0.55 * COLORS[lab]
        ov[inv] = np.repeat(g[..., None], 3, -1)[inv] * 0.35
        v = ~inv
        frame_frac = {c: round(float(p[k][v].mean()), 2) for k, c in enumerate(CLASSES)} if v.any() else {}
        cx, cy = int(s["px"][0]), int(s["px"][1])
        cell = {c: round(float(P[k, cy, cx]), 2) for k, c in enumerate(CLASSES)}
        y0, x0 = max(cy - HALF, 0), max(cx - HALF, 0)
        crop = COLORS[dom[y0:cy + HALF, x0:cx + HALF]].astype(np.float32)
        ec = E[y0:cy + HALF, x0:cx + HALF][..., None]
        crop = crop * (1 - ec) + 128 * ec  # belirsiz hücre griye kayar
        fig, ax = plt.subplots(1, 4, figsize=(15, 4.1))
        ax[0].imshow(g, cmap="gray"); ax[0].set_title(f"Navcam · {s['images'][fi].rsplit('/', 1)[1][:13]}…", fontsize=9)
        ax[1].imshow(ov.astype(np.uint8)); ax[1].set_title("Model (gri = maske: rover / >30 m)", fontsize=9)
        ax[2].imshow(np.where(inv, np.nan, ent), cmap="magma", vmin=0, vmax=1); ax[2].set_title("Belirsizlik (parlak = emin değil)", fontsize=9)
        ax[3].imshow(crop.astype(np.uint8), extent=(x0, x0 + crop.shape[1], y0 + crop.shape[0], y0))
        ax[3].plot(s["px"][0], s["px"][1], "w+", ms=14, mew=2.5); ax[3].plot(s["px"][0], s["px"][1], "k+", ms=10, mew=1.2)
        ax[3].set_title(f"Harita ±150 m · hücre: {TR[int(dom[cy, cx])]} (entropy {E[cy, cx]:.2f})", fontsize=9)
        for x in ax[:3]:
            x.axis("off")
        ax[3].tick_params(labelsize=7)
        fig.suptitle(f"{sid} · sol {s['sol']} · grup: {grp} · durak: " + " ".join(f"{TR[k]} {s['class_frac'][c]:.2f}" for k, c in enumerate(CLASSES))
                     + f" · entropy {s['entropy']:.2f}", fontsize=10)
        fig.legend(handles=[Patch(color=COLORS[i] / 255, label=TR[i]) for i in range(4)], loc="lower center", ncol=4, fontsize=8)
        fig.tight_layout(rect=(0, 0.05, 1, 0.94))
        f = os.path.join(a.out, f"scan_{sid}.jpg")
        fig.savefig(f, dpi=80, pil_kwargs={"quality": 85}); plt.close(fig)
        out[sid] = dict(group=grp, frame=fi, frame_frac=frame_frac, cell=cell, cell_entropy=round(float(E[cy, cx]), 2),
                        stop=s["class_frac"], stop_entropy=s["entropy"], kb=os.path.getsize(f) // 1024)
        print(sid, json.dumps(out[sid], ensure_ascii=False))


if __name__ == "__main__":
    main()
