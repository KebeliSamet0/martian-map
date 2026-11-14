"""Etiket tutarlılığı: model tahmini ile crowdsourced etiketi karşılaştırır + sunum görselleri.

Kullanım:
    python inspect_labels.py <prep_dir> <weights.pt> <out_json> [--fig-dir docs/figures] [--split val]

Ölçülenler (val):
- Görüntü başına etiketli alan oranı dağılımı (kısmi etiketleme ne kadar yaygın?)
- Etiketsiz (255) bölgede modelin tahmin dağılımı (DİKKAT: bu bölge gökyüzü, rover gövdesi ve >30 m'yi de içerir;
  'atlanmış kum' ölçüsü olarak KULLANILAMAZ — model burada da bir sınıf uydurur → çıkarımda maskeleme şart)
- Etiket × tahmin karışıklık matrisi (ör. 'ana kaya' etiketli yerde 'büyük kaya' tahmini)
"""
import argparse, json, os, sys
import numpy as np, torch
from PIL import Image
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.dirname(__file__))
from train import AI4Mars, build_model, NAMES  # noqa: E402

COL = np.array([[166, 120, 70], [90, 90, 200], [240, 200, 60], [220, 40, 40]], np.uint8)


def overlay(img, lab):
    rgb = np.stack([img] * 3, -1).astype(np.float32)
    m = lab < 4
    rgb[m] = 0.45 * rgb[m] + 0.55 * COL[lab[m]]
    return rgb.astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("prep_dir"); ap.add_argument("weights"); ap.add_argument("out_json")
    ap.add_argument("--split", default="val")
    ap.add_argument("--fig-dir", default="docs/figures")
    a = ap.parse_args()
    dev = torch.device("cuda")
    idx = json.load(open(os.path.join(a.prep_dir, "index.json")))
    folder = "train" if a.split in ("train", "val") else a.split
    ds = AI4Mars(a.prep_dir, folder, idx[a.split])
    model = build_model(pretrained=False).to(dev)
    model.load_state_dict(torch.load(a.weights, map_location=dev)); model.eval()

    conf = np.zeros((5, 4), np.int64)          # satır: etiket (0-3, 4=etiketsiz), sütun: tahmin
    cover, per_img = [], []
    with torch.no_grad():
        for i in range(len(ds)):
            x, y = ds[i]
            with torch.autocast("cuda", dtype=torch.float16):
                p = model(x[None].to(dev)).argmax(1)[0].cpu().numpy()
            y = y.numpy(); yy = np.where(y < 4, y, 4)
            conf += np.bincount(4 * yy.ravel() + p.ravel(), minlength=20).reshape(5, 4)
            lab_frac = (y < 4).mean(); cover.append(lab_frac)
            # model büyük kaya gördü ama etiket ana kaya: büyük kaya kaçırma örnekleri
            per_img.append(dict(i=i, name=ds.names[i], lab_frac=float(lab_frac),
                                big_on_bed=int(((y == 1) & (p == 3)).sum()),
                                sand_unlabeled=int(((y == 255) & (p == 2)).sum()),
                                sand_on_soil=int(((y == 0) & (p == 2)).sum()),
                                n_cls=len(set(np.unique(y)) & {0, 1, 2, 3})))
            if i % 400 == 0:
                print(i, "/", len(ds), flush=True)

    cover = np.array(cover)
    lab_rows = conf[:4]
    res = {
        "split": a.split, "n_images": len(ds),
        "labeled_frac_per_image": {"median": round(float(np.median(cover)), 3),
                                   "p10": round(float(np.percentile(cover, 10)), 3),
                                   "p90": round(float(np.percentile(cover, 90)), 3),
                                   "share_images_lt50pct_labeled": round(float((cover < 0.5).mean()), 3),
                                   "share_images_gt90pct_labeled": round(float((cover > 0.9).mean()), 3)},
        "single_class_images_share": round(float(np.mean([d["n_cls"] == 1 for d in per_img])), 3),
        "pred_in_unlabeled_area": {NAMES[c]: round(float(conf[4, c] / conf[4].sum()), 3) for c in range(4)},
        "label_x_pred_row_normalized": {NAMES[r]: {NAMES[c]: round(float(lab_rows[r, c] / lab_rows[r].sum()), 3)
                                                    for c in range(4)} for r in range(4)},
        "images_with_bigrock_pred_on_bedrock_label_gt1pct":
            int(sum(d["big_on_bed"] > 0.01 * 512 * 512 for d in per_img)),
    }
    print(json.dumps(res, indent=1, ensure_ascii=False))
    json.dump(res, open(a.out_json, "w"), indent=1, ensure_ascii=False)

    # --- görseller: (1) tipik iyi örnekler (2) büyük kaya → ana kaya (3) atlanmış kum
    os.makedirs(a.fig_dir, exist_ok=True)

    def panel(sel, fname, title):
        fig, ax = plt.subplots(len(sel), 3, figsize=(9, 3 * len(sel)), dpi=90)
        ax = np.atleast_2d(ax)
        for r, d in enumerate(sel):
            x, y = ds[d["i"]]
            img = np.array(Image.open(os.path.join(a.prep_dir, folder, "img", d["name"] + ".png")))
            with torch.no_grad(), torch.autocast("cuda", dtype=torch.float16):
                p = model(x[None].to(dev)).argmax(1)[0].cpu().numpy()
            for c, (im, t) in enumerate([(np.stack([img] * 3, -1), "Navcam"),
                                         (overlay(img, y.numpy()), "gönüllü etiketi"),
                                         (overlay(img, p.astype(np.uint8)), "model tahmini")]):
                ax[r, c].imshow(im); ax[r, c].axis("off")
                if r == 0: ax[r, c].set_title(t, fontsize=10)
        handles = [plt.Rectangle((0, 0), 1, 1, color=COL[k] / 255) for k in range(4)]
        fig.legend(handles, NAMES, loc="lower center", ncol=4, fontsize=9)
        fig.suptitle(title, fontsize=11); fig.tight_layout(rect=(0, 0.04, 1, 0.97))
        fig.savefig(os.path.join(a.fig_dir, fname)); plt.close(fig)

    good = sorted([d for d in per_img if d["n_cls"] >= 3], key=lambda d: -d["lab_frac"])[:3]
    big = sorted(per_img, key=lambda d: -d["big_on_bed"])[:3]
    sand = sorted(per_img, key=lambda d: -d["sand_unlabeled"])[:3]
    panel(good, "rover_terrain_examples.png", "Val: Navcam · gönüllü etiketi · model (1 epoch)")
    panel(big, "rover_terrain_bigrock_missed.png", "Etikette 'ana kaya', modelde 'büyük kaya'")
    panel(sand, "rover_terrain_unlabeled_area.png", "Model, eğitimde hiç görmediği alana da sınıf uyduruyor (gökyüzü, rover)")
    print("görseller:", a.fig_dir)


if __name__ == "__main__":
    main()
