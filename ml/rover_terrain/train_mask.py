"""Rover gövdesi + 30 m ötesi (ufuk/gökyüzü) maskesi: AI4MARS'ın kendi rover_mask / range_mask'larıyla eğitilen küçük U-Net.

Neden: zemin modeli eğitimde bu bölgeleri hiç görmedi (etiket 255), yeni Navcam karelerinde oralara
anlamsız sınıf veriyor ("gökyüzüne kum"). Yeni karelerde maske yok; bu model aynı tanımla üretir.

Kullanım:
    python train_mask.py <parquet_dir> [--n 6000] [--size 256] [--epochs 3] [--out models/rover_terrain/mask]
Çıktı: <out>/mask.pt, <out>/metrics.json (val IoU: rover, range).
"""
import argparse, glob, io, json, os, time
from concurrent.futures import ProcessPoolExecutor
import numpy as np
import pyarrow.parquet as pq
import torch, torch.nn as nn
from PIL import Image
import segmentation_models_pytorch as smp

MEAN, STD = np.array([0.485, 0.456, 0.406], np.float32), np.array([0.229, 0.224, 0.225], np.float32)


def build_mask_model(pretrained=True):
    return smp.Unet("resnet18", encoder_weights="imagenet" if pretrained else None, classes=2)  # 0 rover, 1 >30 m


def to_input(gray):  # HxW uint8 -> 1x3xHxW float
    x = (np.repeat(gray[..., None], 3, -1).astype(np.float32) / 255 - MEAN) / STD
    return torch.from_numpy(x.transpose(2, 0, 1))[None]


def _load(job):
    f, rg, size, cap = job
    t = pq.ParquetFile(f).read_row_group(rg, columns=["image", "rover_mask", "range_mask", "has_masks"]).to_pylist()
    X, Y = [], []
    for r in t:
        if not r["has_masks"] or len(X) >= cap:
            continue
        try:
            img = Image.open(io.BytesIO(r["image"]["bytes"])).convert("L").resize((size, size), Image.BILINEAR)
            m = [np.array(Image.open(io.BytesIO(r[k]["bytes"])).convert("L").resize((size, size), Image.NEAREST)) > 0
                 for k in ("rover_mask", "range_mask")]
        except Exception:
            continue
        X.append(np.array(img)); Y.append(np.stack(m))
    return X, Y


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("parquet_dir")
    ap.add_argument("--n", type=int, default=6000)
    ap.add_argument("--size", type=int, default=256)
    ap.add_argument("--epochs", type=int, default=3)
    ap.add_argument("--bs", type=int, default=16)
    ap.add_argument("--out", default="models/rover_terrain/mask")
    a = ap.parse_args()
    rng = np.random.default_rng(0)
    files = sorted(glob.glob(os.path.join(a.parquet_dir, "train-*.parquet")))
    jobs = [(f, rg) for f in files for rg in range(pq.ParquetFile(f).num_row_groups)]
    rng.shuffle(jobs)
    cap = max(1, a.n // len(jobs) + 1)
    t0 = time.time()
    with ProcessPoolExecutor(4) as ex:
        res = list(ex.map(_load, [(f, rg, a.size, cap) for f, rg in jobs]))
    X = np.stack([x for xs, _ in res for x in xs])[:a.n]; Y = np.stack([y for _, ys in res for y in ys])[:a.n]
    print(f"{len(X)} görüntü yüklendi ({time.time() - t0:.0f} sn) | rover %{100 * Y[:, 0].mean():.1f} · >30 m %{100 * Y[:, 1].mean():.1f}", flush=True)
    nv = len(X) // 10; Xv, Yv, Xt, Yt = X[:nv], Y[:nv], X[nv:], Y[nv:]

    dev = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = build_mask_model().to(dev)
    opt = torch.optim.AdamW(model.parameters(), 3e-4, weight_decay=1e-4)
    steps = a.epochs * (len(Xt) // a.bs)
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, 3e-4, total_steps=steps, pct_start=0.1)
    lossf = nn.BCEWithLogitsLoss()

    def batch(Xs, Ys, idx, aug):
        xs, ys = Xs[idx], Ys[idx]
        if aug:  # yatay çevirme: rover gövdesi sağ/sol kamerada ve farklı pan açılarında yer değiştirir
            fl = rng.random(len(idx)) < 0.5; xs = xs.copy(); ys = ys.copy()
            xs[fl] = xs[fl][:, :, ::-1]; ys[fl] = ys[fl][..., ::-1]
        x = torch.cat([to_input(g) for g in xs]).to(dev)
        return x, torch.from_numpy(ys.astype(np.float32)).to(dev)

    for ep in range(a.epochs):
        model.train(); perm = rng.permutation(len(Xt)); tot = 0
        for s in range(len(Xt) // a.bs):
            x, y = batch(Xt, Yt, perm[s * a.bs:(s + 1) * a.bs], True)
            with torch.autocast("cuda", dtype=torch.float16, enabled=dev.type == "cuda"):
                loss = lossf(model(x), y)
            opt.zero_grad(); loss.backward(); opt.step(); sched.step(); tot += loss.item()
        model.eval(); inter = np.zeros(2); union = np.zeros(2)
        with torch.no_grad():
            for s in range(0, len(Xv), a.bs):
                x, y = batch(Xv, Yv, np.arange(s, min(s + a.bs, len(Xv))), False)
                p = model(x) > 0; y = y > 0.5
                inter += (p & y).sum((0, 2, 3)).cpu().numpy(); union += (p | y).sum((0, 2, 3)).cpu().numpy()
        iou = inter / np.maximum(union, 1)
        print(f"ep {ep + 1} loss {tot / max(1, len(Xt) // a.bs):.4f} | val IoU rover {iou[0]:.3f} · >30 m {iou[1]:.3f}", flush=True)
    os.makedirs(a.out, exist_ok=True)
    torch.save(model.state_dict(), os.path.join(a.out, "mask.pt"))
    json.dump(dict(args=vars(a), n_train=len(Xt), n_val=len(Xv),
                   val_IoU={"rover": round(float(iou[0]), 4), "range_30m": round(float(iou[1]), 4)}),
              open(os.path.join(a.out, "metrics.json"), "w"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
