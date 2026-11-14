"""AI4MARS örnek görselleri: test_min3 ve train, görüntü + etiket overlay.
Kullanım: python ai4mars_viz.py <parquet_dir> <out_img_dir>"""
import sys, io, os, glob
import numpy as np, pyarrow.parquet as pq
from PIL import Image
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap

data_dir, out_dir = sys.argv[1], sys.argv[2]
os.makedirs(out_dir, exist_ok=True)
COL = np.array([[166, 120, 70], [90, 90, 200], [240, 200, 60], [220, 40, 40]], np.uint8)
NAMES = ["toprak", "ana kaya", "kum", "büyük kaya"]


def dec(v):
    try:
        return np.array(Image.open(io.BytesIO(v["bytes"])))
    except Exception:
        return None


def overlay(img, lab):
    rgb = np.stack([img] * 3, -1).astype(np.float32)
    m = lab < 4
    rgb[m] = 0.45 * rgb[m] + 0.55 * COL[lab[m]]
    return rgb.astype(np.uint8)


test = pq.read_table(os.path.join(data_dir, "test_min3-00000-of-00001.parquet")).to_pylist()
test_by = {r["image"]["path"]: r for r in test}

# train'den, etiketli alanı %30'dan büyük 4 örnek
train_samples = []
for f in sorted(glob.glob(os.path.join(data_dir, "train-*.parquet"))):
    for r in pq.ParquetFile(f).read_row_group(0).to_pylist()[::350]:
        tl = dec(r["label_mask"]) if r["label_mask"] else None
        if tl is not None and (tl < 4).mean() > 0.3:
            train_samples.append((r["image"]["path"], dec(r["image"]), tl))
    if len(train_samples) >= 4:
        train_samples = train_samples[:4]
        break


def grid(rows, fname, title):
    fig, ax = plt.subplots(len(rows), 2, figsize=(6, 3 * len(rows)), dpi=80)
    for i, (p, img, lab) in enumerate(rows):
        im = np.array(Image.fromarray(img).resize((256, 256)))
        lb = np.array(Image.fromarray(lab).resize((256, 256), Image.NEAREST))
        ax[i, 0].imshow(im, cmap="gray"); ax[i, 0].set_title(p[:22], fontsize=7)
        ax[i, 1].imshow(overlay(im, lb)); ax[i, 1].set_title("etiket (gri = etiketsiz)", fontsize=7)
        for a in ax[i]: a.axis("off")
    handles = [plt.Rectangle((0, 0), 1, 1, color=COL[k] / 255) for k in range(4)]
    fig.legend(handles, NAMES, loc="lower center", ncol=4, fontsize=8)
    fig.suptitle(title, fontsize=9); fig.tight_layout(rect=(0, 0.04, 1, 0.97))
    fig.savefig(os.path.join(out_dir, fname)); plt.close(fig)


# test: sınıf çeşitliliği yüksek 4 örnek
scored = sorted(test, key=lambda r: -len(set(np.unique(dec(r["label_mask"]))) & {0, 1, 2, 3}))
tsel = [(r["image"]["path"], dec(r["image"]), dec(r["label_mask"])) for r in scored[:4]]
grid(tsel, "ai4mars_test_samples.png", "AI4MARS test_min3 (uzman, %100 uzlaşı)")
grid(train_samples, "ai4mars_train_samples.png", "AI4MARS train (crowdsourced, 2/3 uzlaşı)")
print("saved")
