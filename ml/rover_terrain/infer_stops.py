"""Rover duraklarının Navcam karelerinde zemin çıkarımı → durak başına class_frac + entropy.

Kullanım:
    python infer_stops.py <stops_json> <img_dir> --model models/rover_terrain/<run>/best.pt
        [--mask models/rover_terrain/mask/mask.pt] [--T 20] [--fig docs/figures/rover_terrain_stops.png]

- Görseller <img_dir>/<stop_id>__<dosya>.JPG; yoksa stops_json'daki URL'den indirilir.
- Maske: train_mask.py modeli rover gövdesi ve 30 m ötesini (ufuk/gökyüzü) çıkarır. Zemin modeli eğitimde bu
  bölgeleri görmedi (AI4MARS etiketi 255); oralardaki tahmin anlamsız.
- MC Dropout: decoder'daki Dropout2d açık, T geçiş. Piksel olasılığı = T geçişin ortalama softmax'ı;
  belirsizlik = tahmin entropisi / log(4) (0 = emin, 1 = dört sınıf eşit).
- Durak class_frac = geçerli piksellerde ortalama olasılık (kareler piksel sayısıyla ağırlıklı), toplamı 1.
  Durak entropy = geçerli piksellerin ortalama normalize entropisi.
- stops_json yerinde güncellenir; yalnız class_frac ve entropy alanları yazılır (sözleşme: contracts/rover_stops.example.json).
"""
import argparse, json, math, os, sys, urllib.request
import numpy as np
import torch, torch.nn as nn, torch.nn.functional as F
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from train import build_model, MEAN, STD  # noqa: E402
from train_mask import build_mask_model, to_input  # noqa: E402

CLASSES = ("soil", "bedrock", "sand", "bigrock")  # train.py NAMES sırası: toprak, ana kaya, kum, büyük kaya
COLORS = np.array([[205, 133, 63], [70, 130, 180], [240, 200, 80], [200, 40, 40]], np.uint8)


RAW = "https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/{sol:05d}/opgs/edr/ncam/{fn}"


def load_image(img_dir, stop_id, ref):
    """ref: tam URL ya da rover_stops.json biçimi 'navcam/sol_04580/<dosya>.JPG'. İndirilemezse None."""
    fn = ref.rsplit("/", 1)[1]
    f = os.path.join(img_dir, f"{stop_id}__{fn}")
    if not os.path.exists(f):
        url = ref if ref.startswith("http") else RAW.format(sol=int(ref.split("sol_")[1].split("/")[0]), fn=fn)
        try:
            os.makedirs(img_dir, exist_ok=True)
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            open(f, "wb").write(urllib.request.urlopen(req, timeout=60).read())
        except Exception as e:
            print(f"  atlandı ({e}): {fn}")
            return None
    return np.array(Image.open(f).convert("L"))


@torch.no_grad()
def predict(model, mask_model, gray, T, dev, size=512):
    g = np.array(Image.fromarray(gray).resize((size, size), Image.BILINEAR))
    x = (np.repeat(g[..., None], 3, -1).astype(np.float32) / 255 - MEAN) / STD
    x = torch.from_numpy(x.transpose(2, 0, 1))[None].to(dev)
    model.eval()
    for m in model.modules():
        if isinstance(m, nn.Dropout2d):
            m.train()
    acc = torch.zeros(1, 4, size, size, device=dev)
    for k in range(0, T, 10):
        n = min(10, T - k)
        with torch.autocast("cuda", dtype=torch.float16, enabled=dev.type == "cuda"):
            acc += model(x.expand(n, -1, -1, -1)).float().softmax(1).sum(0, keepdim=True)
    p = (acc / T)[0]
    ent = -(p * p.clamp_min(1e-8).log()).sum(0) / math.log(4)
    invalid = torch.zeros(size, size, dtype=torch.bool, device=dev)
    if mask_model is not None:
        gm = np.array(Image.fromarray(gray).resize((256, 256), Image.BILINEAR))
        lm = F.interpolate(mask_model(to_input(gm).to(dev)), size=(size, size), mode="bilinear")[0]
        invalid = (lm > 0).any(0)
    return g, p.cpu().numpy(), ent.cpu().numpy(), invalid.cpu().numpy()


def tile(g, p, ent, invalid, w=256):
    base = np.repeat(np.array(Image.fromarray(g).resize((w, w)))[..., None], 3, -1).astype(np.float32)
    lab = np.array(Image.fromarray(p.argmax(0).astype(np.uint8)).resize((w, w), Image.NEAREST))
    inv = np.array(Image.fromarray(invalid.astype(np.uint8)).resize((w, w), Image.NEAREST)).astype(bool)
    ov = 0.45 * base + 0.55 * COLORS[lab]
    ov[inv] = base[inv] * 0.35
    e = np.array(Image.fromarray((ent * 255).astype(np.uint8)).resize((w, w)))
    import matplotlib.cm as cm
    em = cm.magma(e)[..., :3] * 255
    em[inv] = 40
    return [base.astype(np.uint8), ov.astype(np.uint8), em.astype(np.uint8)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("stops_json"); ap.add_argument("img_dir")
    ap.add_argument("--model", required=True)
    ap.add_argument("--mask", default="models/rover_terrain/mask/mask.pt")
    ap.add_argument("--T", type=int, default=20)
    ap.add_argument("--fig", default="")
    ap.add_argument("--fig-max", type=int, default=18, help="figürdeki en fazla durak")
    ap.add_argument("--csv", default="", help="durak başına sonuçlar (geçerli piksel payı dahil)")
    ap.add_argument("--dry-run", action="store_true", help="json'a yazma, yalnız yazdır")
    a = ap.parse_args()
    dev = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    torch.manual_seed(0)
    model = build_model(pretrained=False); model.load_state_dict(torch.load(a.model, map_location=dev)); model.to(dev)
    mask_model = None
    if a.mask:
        mask_model = build_mask_model(pretrained=False)
        mask_model.load_state_dict(torch.load(a.mask, map_location=dev)); mask_model.to(dev).eval()

    stops = json.load(open(a.stops_json, encoding="utf-8"))
    tiles, rows = [], []
    for s in stops:
        psum, esum, nvalid, ntot = np.zeros(4), 0.0, 0, 0
        first = True
        for url in s["images"]:
            gray = load_image(a.img_dir, s["stop_id"], url)
            if gray is None:
                continue
            g, p, ent, inv = predict(model, mask_model, gray, a.T, dev)
            v = ~inv
            psum += p[:, v].sum(1); esum += float(ent[v].sum()); nvalid += int(v.sum()); ntot += v.size
            if first and len(tiles) < a.fig_max:
                tiles.append((s["stop_id"], tile(g, p, ent, inv)))
            first = False
        if nvalid == 0:
            frac, e = np.full(4, 0.25), 1.0
        else:
            frac, e = psum / psum.sum(), esum / nvalid
        frac = np.round(frac, 4); frac[np.argmax(frac)] += round(1 - frac.sum(), 4)  # toplam tam 1
        s["class_frac"] = {c: round(float(v), 4) for c, v in zip(CLASSES, frac)}
        s["entropy"] = round(float(e), 4)
        rows.append([s["stop_id"], len(s["images"]), round(nvalid / max(ntot, 1), 3), *s["class_frac"].values(), s["entropy"]])
        print(f"{s['stop_id']:16s} {len(s['images'])} kare | geçerli %{100 * nvalid / max(ntot, 1):4.1f} | "
              + " ".join(f"{c} {v:.2f}" for c, v in s["class_frac"].items()) + f" | entropy {s['entropy']:.3f}", flush=True)
    if a.csv:
        with open(a.csv, "w", encoding="utf-8", newline="\n") as fh:
            fh.write("stop_id,n_images,valid_frac," + ",".join(CLASSES) + ",entropy\n")
            fh.writelines(",".join(map(str, r)) + "\n" for r in rows)
    if not a.dry_run:
        json.dump(stops, open(a.stops_json, "w", encoding="utf-8", newline="\n"), indent=2, ensure_ascii=False)
        open(a.stops_json, "a", encoding="utf-8", newline="\n").write("\n")
        print("yazıldı:", a.stops_json)
    if a.fig:
        import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
        from matplotlib.patches import Patch
        nr = (len(tiles) + 1) // 2
        fig, ax = plt.subplots(nr, 6, figsize=(15, 2.6 * nr), squeeze=False)
        for i, (sid, t) in enumerate(tiles):
            for k in range(3):
                axx = ax[i // 2, 3 * (i % 2) + k]; axx.imshow(t[k]); axx.axis("off")
                if k == 0:
                    axx.set_title(sid, fontsize=8, loc="left")
        for i in range(len(tiles), nr * 2):
            for k in range(3):
                ax[i // 2, 3 * (i % 2) + k].axis("off")
        fig.legend(handles=[Patch(color=COLORS[i] / 255, label=n) for i, n in enumerate(("toprak", "ana kaya", "kum", "büyük kaya"))]
                   + [Patch(color=(0.2, 0.2, 0.2), label="maske (rover / >30 m)")], loc="lower center", ncol=5, fontsize=9)
        fig.suptitle("Her durak: Navcam · tahmin · belirsizlik (parlak = emin değil)", fontsize=10)
        fig.tight_layout(rect=(0, 0.02, 1, 0.985)); fig.savefig(a.fig, dpi=90); print("figür:", a.fig)


if __name__ == "__main__":
    main()
