"""AI4MARS parquet → 512×512 PNG (görüntü + etiket) + grup bazlı train/val ayrımı.

Kullanım:
    python prepare_data.py <parquet_klasörü> <çıktı_klasörü> [--size 512] [--val 0.1]

Çıktı:
    <çıktı>/{train,test_min1,test_min2,test_min3}/img/<ad>.png   (gri, uint8)
    <çıktı>/{...}/lab/<ad>.png                                   (0-3 sınıf, 255 yok-say)
    <çıktı>/index.json   {"train": [...], "val": [...], "test_min3": [...], ...}

Notlar:
- Yalnız has_labels=True ve çözülebilen satırlar alınır (3 bozuk satır + etiketsizler atılır;
  test görüntülerinin train'deki etiketsiz kopyaları bu sayede girmez).
- Rover gövdesi ve 30 m ötesi etiket maskesinde zaten 255.
- Val ayrımı rastgele satır değil, rover konumuna göre (dosya adındaki site/drive kodu, ör. F0600888):
  aynı konumdan çekilmiş tüm kareler (sol/sağ stereo, ardışık çekimler) aynı tarafa düşer.
"""
import argparse, glob, io, json, os, random
from concurrent.futures import ProcessPoolExecutor
import numpy as np
import pyarrow.parquet as pq
from PIL import Image


def dec(v):
    if not v or not v.get("bytes"):
        return None
    try:
        return Image.open(io.BytesIO(v["bytes"]))
    except Exception:
        return None


def work(args):
    f, rg, out_dir, size = args
    split = os.path.basename(f).split("-")[0]
    names = []
    for r in pq.ParquetFile(f).read_row_group(rg).to_pylist():
        if not r["has_labels"]:
            continue
        img, lab = dec(r["image"]), dec(r["label_mask"])
        if img is None or lab is None:
            continue
        name = os.path.splitext(r["image"]["path"])[0]
        img = img.convert("L").resize((size, size), Image.BILINEAR)
        lab = np.array(lab)
        if lab.ndim == 3:
            lab = lab[..., 0]
        lab = Image.fromarray(lab.astype(np.uint8)).resize((size, size), Image.NEAREST)
        img.save(os.path.join(out_dir, split, "img", name + ".png"))
        lab.save(os.path.join(out_dir, split, "lab", name + ".png"))
        names.append(name)
    return split, names


def group_key(name):
    # NLB_537932733EDR_F0600888NCAM00320M1 → "F0600888" (rover site/drive)
    i = name.find("EDR_")
    return name[i + 4:i + 12] if i >= 0 else name


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("parquet_dir"); ap.add_argument("out_dir")
    ap.add_argument("--size", type=int, default=512)
    ap.add_argument("--val", type=float, default=0.1)
    ap.add_argument("--seed", type=int, default=0)
    a = ap.parse_args()

    files = sorted(glob.glob(os.path.join(a.parquet_dir, "*.parquet")))
    for f in files:
        sp = os.path.basename(f).split("-")[0]
        for sub in ("img", "lab"):
            os.makedirs(os.path.join(a.out_dir, sp, sub), exist_ok=True)
    jobs = [(f, rg, a.out_dir, a.size) for f in files for rg in range(pq.ParquetFile(f).num_row_groups)]

    by_split = {}
    with ProcessPoolExecutor(max_workers=max(1, os.cpu_count() - 2)) as ex:
        for i, (sp, names) in enumerate(ex.map(work, jobs)):
            by_split.setdefault(sp, []).extend(names)
            if i % 20 == 0:
                print(f"{i + 1}/{len(jobs)}", flush=True)

    train = sorted(by_split.pop("train"))
    groups = sorted({group_key(n) for n in train})
    random.Random(a.seed).shuffle(groups)
    # grupları sırayla val'e ekle, hedef görüntü oranına ulaşınca dur
    target, val_groups, cnt = a.val * len(train), set(), 0
    sizes = {}
    for n in train:
        sizes[group_key(n)] = sizes.get(group_key(n), 0) + 1
    for g in groups:
        if cnt >= target:
            break
        val_groups.add(g); cnt += sizes[g]
    index = {
        "size": a.size,
        "train": [n for n in train if group_key(n) not in val_groups],
        "val": [n for n in train if group_key(n) in val_groups],
        **{k: sorted(v) for k, v in by_split.items()},
    }
    json.dump(index, open(os.path.join(a.out_dir, "index.json"), "w"))
    print({k: len(v) for k, v in index.items() if isinstance(v, list)},
          f"| gruplar: {len(groups)} toplam, {len(val_groups)} val")


if __name__ == "__main__":
    main()
