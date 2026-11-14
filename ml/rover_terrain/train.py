"""DeepLabv3+ (ResNet34, ImageNet) ile AI4MARS zemin segmentasyonu.

Önce: python prepare_data.py <parquet_dir> <prep_dir>
Kullanım:
    python train.py <prep_dir> [--epochs 1] [--bs 8] [--lr 3e-4] [--max-steps N] [--out models/rover_terrain]

- Loss: CrossEntropy, ignore_index=255 (etiketsiz / rover / >30 m).
- Decoder çıkışında Dropout2d (MC Dropout için çıkarımda açık bırakılacak).
- Her epoch sonunda val üzerinde mIoU + sınıf bazlı IoU; sonuç <out>/metrics.json'a eklenir.
- Ağırlıklar (<out>/*.pt) git'e girmez.
"""
import argparse, json, os, time
import numpy as np
import torch, torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from PIL import Image
import albumentations as A
import segmentation_models_pytorch as smp

NAMES = ["toprak", "ana kaya", "kum", "büyük kaya"]
MEAN, STD = np.array([0.485, 0.456, 0.406], np.float32), np.array([0.229, 0.224, 0.225], np.float32)


class AI4Mars(Dataset):
    def __init__(self, root, split, names, aug=None):
        self.root, self.split, self.names, self.aug = root, split, names, aug

    def __len__(self):
        return len(self.names)

    def __getitem__(self, i):
        n = self.names[i]
        img = np.array(Image.open(os.path.join(self.root, self.split, "img", n + ".png")))
        lab = np.array(Image.open(os.path.join(self.root, self.split, "lab", n + ".png")))
        if self.aug:
            o = self.aug(image=img, mask=lab); img, lab = o["image"], o["mask"]
        x = (np.repeat(img[..., None], 3, -1).astype(np.float32) / 255 - MEAN) / STD
        return torch.from_numpy(x.transpose(2, 0, 1)), torch.from_numpy(lab.astype(np.int64))


def build_model(dropout=0.1, pretrained=True):
    m = smp.DeepLabV3Plus("resnet34", encoder_weights="imagenet" if pretrained else None, classes=4)
    m.segmentation_head = nn.Sequential(nn.Dropout2d(dropout), m.segmentation_head)
    return m


@torch.no_grad()
def evaluate(model, loader, dev):
    model.eval()
    conf = torch.zeros(4, 4, dtype=torch.int64, device=dev)
    for x, y in loader:
        x, y = x.to(dev, non_blocking=True), y.to(dev, non_blocking=True)
        with torch.autocast("cuda", dtype=torch.float16, enabled=dev.type == "cuda"):
            p = model(x).argmax(1)
        m = y < 4
        conf += torch.bincount(4 * y[m] + p[m], minlength=16).reshape(4, 4)
    conf = conf.cpu().double()
    iou = conf.diag() / (conf.sum(0) + conf.sum(1) - conf.diag()).clamp(min=1)
    return {"mIoU": round(iou.mean().item(), 4), "pixel_acc": round((conf.diag().sum() / conf.sum()).item(), 4),
            "IoU": {NAMES[i]: round(iou[i].item(), 4) for i in range(4)}}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("prep_dir")
    ap.add_argument("--epochs", type=int, default=1)
    ap.add_argument("--bs", type=int, default=8)
    ap.add_argument("--lr", type=float, default=3e-4)
    ap.add_argument("--dropout", type=float, default=0.1)
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--max-steps", type=int, default=0, help="duman testi için epoch başına adım sınırı")
    ap.add_argument("--out", default="models/rover_terrain")
    a = ap.parse_args()

    dev = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    torch.backends.cudnn.benchmark = True
    idx = json.load(open(os.path.join(a.prep_dir, "index.json")))
    aug = A.Compose([A.HorizontalFlip(), A.RandomBrightnessContrast(0.2, 0.2, p=0.5),
                     A.Affine(scale=(0.9, 1.2), translate_percent=0.05, rotate=(-5, 5), p=0.5,
                              mask_interpolation=0, fill_mask=255)])
    tr = DataLoader(AI4Mars(a.prep_dir, "train", idx["train"], aug), a.bs, shuffle=True, drop_last=True,
                    num_workers=a.workers, pin_memory=True, persistent_workers=a.workers > 0)
    va = DataLoader(AI4Mars(a.prep_dir, "train", idx["val"]), a.bs, num_workers=a.workers, pin_memory=True)
    print(f"cihaz: {torch.cuda.get_device_name(0) if dev.type == 'cuda' else 'CPU'} | "
          f"train {len(idx['train'])} · val {len(idx['val'])} · {idx['size']}px · bs {a.bs}")

    model = build_model(a.dropout).to(dev).to(memory_format=torch.channels_last)
    opt = torch.optim.AdamW(model.parameters(), lr=a.lr, weight_decay=1e-4)
    steps = (a.max_steps or len(tr)) * a.epochs
    sched = torch.optim.lr_scheduler.OneCycleLR(opt, a.lr, total_steps=steps, pct_start=0.1)
    scaler = torch.amp.GradScaler(enabled=dev.type == "cuda")
    lossf = nn.CrossEntropyLoss(ignore_index=255)
    os.makedirs(a.out, exist_ok=True)
    log = []

    for ep in range(a.epochs):
        model.train(); t0 = time.time(); tot, n = 0.0, 0
        for step, (x, y) in enumerate(tr):
            if a.max_steps and step >= a.max_steps:
                break
            x = x.to(dev, non_blocking=True).to(memory_format=torch.channels_last); y = y.to(dev, non_blocking=True)
            with torch.autocast("cuda", dtype=torch.float16, enabled=dev.type == "cuda"):
                loss = lossf(model(x), y)
            opt.zero_grad(set_to_none=True)
            scaler.scale(loss).backward(); scaler.step(opt); scaler.update(); sched.step()
            tot += loss.item(); n += 1
            if step % 100 == 0:
                el = time.time() - t0
                print(f"ep {ep + 1} adım {step}/{a.max_steps or len(tr)} loss {loss.item():.3f} "
                      f"| {(step + 1) * a.bs / max(el, 1e-6):.1f} img/s", flush=True)
        train_s = time.time() - t0
        t1 = time.time(); m = evaluate(model, va, dev); val_s = time.time() - t1
        rec = dict(epoch=ep + 1, steps=n, train_loss=round(tot / max(n, 1), 4), train_sec=round(train_s, 1),
                   img_per_sec=round(n * a.bs / train_s, 1), val_sec=round(val_s, 1),
                   est_full_epoch_min=round(len(tr) * a.bs / (n * a.bs / train_s) / 60, 1),
                   max_mem_gb=round(torch.cuda.max_memory_allocated() / 1e9, 2) if dev.type == "cuda" else None,
                   val=m)
        print(json.dumps(rec, ensure_ascii=False), flush=True)
        log.append(rec)
        torch.save(model.state_dict(), os.path.join(a.out, "last.pt"))
    json.dump(dict(args=vars(a), gpu=torch.cuda.get_device_name(0) if dev.type == "cuda" else "cpu",
                   torch=torch.__version__, log=log),
              open(os.path.join(a.out, "metrics.json"), "w"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
