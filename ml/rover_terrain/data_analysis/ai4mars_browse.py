"""AI4MARS etkileşimli görüntüleyici (matplotlib penceresi).

Kullanım:
    python ai4mars_browse.py <parquet_klasörü> [--split train|test_min1|test_min2|test_min3]
                             [--class toprak|anakaya|kum|buyukkaya] [--shuffle]

Tuşlar:
    → / ←   sonraki / önceki görüntü        (Shift ile 10'ar)
    o       etiket overlay aç/kapa
    m       rover + 30 m maskesini göster/gizle
    r       rastgele görüntüye atla
    s       ekranı PNG olarak kaydet (çalışılan klasöre)
    q       çık
"""
import argparse, glob, io, os, random
import numpy as np
import pyarrow.parquet as pq
from PIL import Image
import matplotlib.pyplot as plt

COL = np.array([[166, 120, 70], [90, 90, 200], [240, 200, 60], [220, 40, 40]], np.uint8)
NAMES = ["toprak", "ana kaya", "kum", "büyük kaya"]
CLS_ARG = {"toprak": 0, "anakaya": 1, "kum": 2, "buyukkaya": 3}


def dec(v):
    if not v or not v.get("bytes"):
        return None
    try:
        return np.array(Image.open(io.BytesIO(v["bytes"])))
    except Exception:
        return None


class Data:
    """Satırları (dosya, row_group, sıra) ile indeksler; yalnız o anki row group belleğe alınır."""

    def __init__(self, folder, split, shuffle):
        self.idx = []
        for f in sorted(glob.glob(os.path.join(folder, f"{split}-*.parquet"))):
            pf = pq.ParquetFile(f)
            for rg in range(pf.num_row_groups):
                hl = pf.read_row_group(rg, columns=["has_labels"]).column(0).to_pylist()
                self.idx += [(f, rg, i) for i, h in enumerate(hl) if h]   # yalnız etiketliler
        if shuffle:
            random.shuffle(self.idx)
        self._key, self._rows = None, None

    def __len__(self):
        return len(self.idx)

    def get(self, k):
        f, rg, i = self.idx[k]
        if self._key != (f, rg):
            self._rows = pq.ParquetFile(f).read_row_group(rg).to_pylist()
            self._key = (f, rg)
        return self._rows[i]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("folder")
    ap.add_argument("--split", default="test_min3")
    ap.add_argument("--class", dest="cls", choices=list(CLS_ARG), help="yalnız bu sınıfı içeren görüntüler")
    ap.add_argument("--shuffle", action="store_true")
    a = ap.parse_args()

    print("indeksleniyor…")
    data = Data(a.folder, a.split, a.shuffle)
    print(f"{len(data)} etiketli görüntü ({a.split})")
    want = CLS_ARG.get(a.cls)
    st = dict(k=0, overlay=True, masks=False)

    fig, (ax0, ax1) = plt.subplots(1, 2, figsize=(14, 7.5))
    fig.canvas.manager.set_window_title("AI4MARS görüntüleyici")
    handles = [plt.Rectangle((0, 0), 1, 1, color=COL[c] / 255) for c in range(4)]
    handles.append(plt.Rectangle((0, 0), 1, 1, color=(0, 1, 1)))
    fig.legend(handles, NAMES + ["rover / >30 m"], loc="lower center", ncol=5)

    def load(step):
        # sınıf filtresi varsa, istenen sınıfı içeren ilk görüntüye kadar ilerle
        for _ in range(len(data)):
            r = data.get(st["k"])
            lab = dec(r["label_mask"])
            if lab is not None and lab.ndim == 3:
                lab = lab[..., 0]
            if want is None or (lab is not None and (lab == want).any()):
                return r, lab
            st["k"] = (st["k"] + (step or 1)) % len(data)
        raise SystemExit("Bu sınıfı içeren görüntü yok.")

    def draw(step=0):
        r, lab = load(step)
        img = dec(r["image"])
        rgb = np.stack([img] * 3, -1).astype(np.float32)
        if st["overlay"] and lab is not None:
            m = lab < 4
            rgb[m] = 0.45 * rgb[m] + 0.55 * COL[lab[m]]
        if st["masks"]:
            for key in ("rover_mask", "range_mask"):
                mk = dec(r[key])
                if mk is not None and mk.shape == img.shape:
                    rgb[mk > 0] = 0.5 * rgb[mk > 0] + 0.5 * np.array([0, 255, 255])
        ax0.clear(); ax1.clear()
        ax0.imshow(img, cmap="gray"); ax0.set_title("ham görüntü")
        ax1.imshow(rgb.astype(np.uint8)); ax1.set_title("etiket" + (" + maskeler" if st["masks"] else ""))
        for ax in (ax0, ax1):
            ax.axis("off")
        if lab is not None:
            tot = lab.size
            parts = [f"{NAMES[c]} %{100 * (lab == c).sum() / tot:.1f}" for c in range(4) if (lab == c).any()]
            parts.append(f"etiketsiz %{100 * (lab == 255).sum() / tot:.1f}")
        else:
            parts = ["etiket yok"]
        fig.suptitle(f"[{st['k'] + 1}/{len(data)}]  {r['image']['path']}\n" + " · ".join(parts), fontsize=10)
        fig.canvas.draw_idle()

    def on_key(e):
        k = e.key
        if k in ("right", "left", "shift+right", "shift+left"):
            step = (10 if "shift" in k else 1) * (1 if "right" in k else -1)
            st["k"] = (st["k"] + step) % len(data); draw(step)
        elif k == "o":
            st["overlay"] = not st["overlay"]; draw()
        elif k == "m":
            st["masks"] = not st["masks"]; draw()
        elif k == "r":
            st["k"] = random.randrange(len(data)); draw(1)
        elif k == "s":
            name = os.path.splitext(data.get(st["k"])["image"]["path"])[0] + "_view.png"
            fig.savefig(name, dpi=100); print("kaydedildi:", os.path.abspath(name))

    plt.rcParams["keymap.save"] = []        # 's' tuşunu matplotlib'in kendi kaydet penceresinden al
    plt.rcParams["keymap.back"] = []; plt.rcParams["keymap.forward"] = []
    fig.canvas.mpl_connect("key_press_event", on_key)
    draw()
    plt.show()


if __name__ == "__main__":
    main()
