"""Uzman test kümelerinde (test_min1/2/3) mIoU, sınıf IoU, piksel doğruluğu ve kalibrasyon (ECE).

Kullanım: python eval_test.py <prep_dir> <ckpt> [<ckpt> ...] [--out metrics_test.json]
- Deterministik (dropout kapalı) tek geçiş; 512 px (prepare_data.py çıktısı).
- ECE: etiketli piksellerde en yüksek softmax olasılığı ile doğruluk arasındaki fark, 15 eşit kutu.
"""
import argparse, json, os, sys
import numpy as np
import torch
from torch.utils.data import DataLoader

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from train import AI4Mars, build_model, NAMES  # noqa: E402

BINS = 15


@torch.no_grad()
def run(model, loader, dev):
    model.eval()
    conf = torch.zeros(4, 4, dtype=torch.int64, device=dev)
    cnt = torch.zeros(BINS, device=dev, dtype=torch.float64); acc = torch.zeros_like(cnt); cs = torch.zeros_like(cnt)
    for x, y in loader:
        x, y = x.to(dev), y.to(dev)
        with torch.autocast("cuda", dtype=torch.float16, enabled=dev.type == "cuda"):
            pr = model(x).float().softmax(1)
        c, p = pr.max(1); m = y < 4
        conf += torch.bincount(4 * y[m] + p[m], minlength=16).reshape(4, 4)
        b = (c[m] * BINS).long().clamp(max=BINS - 1); ok = (p[m] == y[m]).double()
        cnt += torch.bincount(b, minlength=BINS).double()
        acc += torch.bincount(b, weights=ok, minlength=BINS); cs += torch.bincount(b, weights=c[m].double(), minlength=BINS)
    conf = conf.cpu().double()
    iou = conf.diag() / (conf.sum(0) + conf.sum(1) - conf.diag()).clamp(min=1)
    ece = float(((acc - cs).abs()).sum() / cnt.sum())
    rec = conf.diag() / conf.sum(1).clamp(min=1)
    return {"mIoU": round(iou.mean().item(), 4), "pixel_acc": round((conf.diag().sum() / conf.sum()).item(), 4),
            "ECE": round(ece, 4), "IoU": {NAMES[i]: round(iou[i].item(), 4) for i in range(4)},
            "recall": {NAMES[i]: round(rec[i].item(), 4) for i in range(4)},
            "bigrock_as_bedrock": round((conf[3, 1] / conf[3].sum().clamp(min=1)).item(), 4)}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("prep_dir"); ap.add_argument("ckpts", nargs="+")
    ap.add_argument("--out", default="")
    a = ap.parse_args()
    dev = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    idx = json.load(open(os.path.join(a.prep_dir, "index.json")))
    res = {}
    for ck in a.ckpts:
        model = build_model(pretrained=False); model.load_state_dict(torch.load(ck, map_location=dev)); model.to(dev)
        res[ck] = {}
        for sp in ("test_min3", "test_min2", "test_min1"):
            dl = DataLoader(AI4Mars(a.prep_dir, sp, idx[sp]), 8, num_workers=4)
            res[ck][sp] = run(model, dl, dev)
            print(ck, sp, json.dumps(res[ck][sp], ensure_ascii=False), flush=True)
    if a.out:
        json.dump(res, open(a.out, "w", encoding="utf-8"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
