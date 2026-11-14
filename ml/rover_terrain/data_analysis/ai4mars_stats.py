"""Kullanım: python ai4mars_stats.py <parquet_dir> <out.json>
AI4MARS HF parquet analizi: sayımlar, kamera, boyut, sınıf dağılımı, maske etkileşimi."""
import sys, io, json, glob, os, collections
from concurrent.futures import ProcessPoolExecutor
import numpy as np
import pyarrow.parquet as pq
from PIL import Image

CLS = {0: "soil", 1: "bedrock", 2: "sand", 3: "big_rock", 255: "null"}


BAD = collections.Counter()


def dec(v, kind):
    if not v or not v.get("bytes"):
        BAD[kind + "_missing"] += 1
        return None
    try:
        return np.array(Image.open(io.BytesIO(v["bytes"])))
    except Exception:
        BAD[kind + "_corrupt:" + repr(v["bytes"][:12])] += 1
        return None


def work(args):
    f, rg = args
    split = os.path.basename(f).split("-")[0]
    tbl = pq.ParquetFile(f).read_row_group(rg).to_pylist()
    out = dict(split=split, n=0, cams=collections.Counter(), sizes=collections.Counter(),
               has_labels=0, has_masks=0, names=[],
               hist=np.zeros(256, np.int64),            # tüm etiket pikselleri
               hist_rover=np.zeros(256, np.int64),      # rover_mask==1 altındaki etiketler
               hist_range=np.zeros(256, np.int64),      # range_mask==1 (>30m) altındaki etiketler
               img_present=collections.Counter(),       # her görüntüde hangi sınıflar var
               rover_px=0, range_px=0, total_px=0, unlabeled_imgs=0)
    for r in tbl:
        out["n"] += 1
        name = (r["image"] or {}).get("path") or ""
        out["names"].append(name)
        out["cams"][name[:3]] += 1
        try:
            img = Image.open(io.BytesIO(r["image"]["bytes"]))
            out["sizes"][f"{img.size[0]}x{img.size[1]} {img.mode}"] += 1
        except Exception:
            BAD["image_corrupt:" + repr(r["image"]["bytes"][:12]) + " " + name] += 1
            out["sizes"]["CORRUPT"] += 1
        out["has_labels"] += bool(r["has_labels"])
        out["has_masks"] += bool(r["has_masks"])
        lab = dec(r["label_mask"], "label")
        if lab is None:
            out["unlabeled_imgs"] += 1
            continue
        if lab.ndim == 3:
            lab = lab[..., 0]
        out["hist"] += np.bincount(lab.ravel(), minlength=256)
        out["total_px"] += lab.size
        for c in np.unique(lab):
            out["img_present"][int(c)] += 1
        rv = dec(r["rover_mask"], "rover"); rn = dec(r["range_mask"], "range")
        if rv is not None and rn is not None and rv.shape == lab.shape and rn.shape == lab.shape:
            rv = rv > 0; rn = rn > 0
            out["rover_px"] += int(rv.sum()); out["range_px"] += int(rn.sum())
            out["hist_rover"] += np.bincount(lab[rv], minlength=256)
            out["hist_range"] += np.bincount(lab[rn], minlength=256)
    out["bad"] = collections.Counter(BAD); BAD.clear()
    return out


def main(data_dir, out_json):
    files = sorted(glob.glob(os.path.join(data_dir, "*.parquet")))
    jobs = [(f, rg) for f in files for rg in range(pq.ParquetFile(f).num_row_groups)]
    agg = {}
    with ProcessPoolExecutor(max_workers=os.cpu_count() - 2) as ex:
        for i, o in enumerate(ex.map(work, jobs)):
            s = agg.setdefault(o["split"], dict(n=0, cams=collections.Counter(), sizes=collections.Counter(),
                                                 has_labels=0, has_masks=0, names=[], hist=np.zeros(256, np.int64),
                                                 hist_rover=np.zeros(256, np.int64), hist_range=np.zeros(256, np.int64),
                                                 img_present=collections.Counter(), bad=collections.Counter(), rover_px=0, range_px=0,
                                                 total_px=0, unlabeled_imgs=0))
            for k in ["n", "has_labels", "has_masks", "rover_px", "range_px", "total_px", "unlabeled_imgs"]:
                s[k] += o[k]
            for k in ["cams", "sizes", "img_present", "bad"]:
                s[k].update(o[k])
            for k in ["hist", "hist_rover", "hist_range"]:
                s[k] += o[k]
            s["names"] += o["names"]
            if i % 20 == 0:
                print(f"{i+1}/{len(jobs)}", flush=True)
    res = {}
    train_names = set(n.replace(".JPG", "") for n in agg.get("train", {}).get("names", []))
    for sp, s in agg.items():
        h = s["hist"]; lab = sum(int(h[c]) for c in (0, 1, 2, 3))
        res[sp] = dict(
            n=s["n"], bad=dict(s["bad"]), cams=dict(s["cams"]), sizes=dict(s["sizes"]),
            has_labels=s["has_labels"], has_masks=s["has_masks"], unlabeled_imgs=s["unlabeled_imgs"],
            px_total=int(s["total_px"]),
            px={CLS.get(c, str(c)): int(h[c]) for c in np.nonzero(h)[0]},
            frac_of_all={CLS.get(c, str(c)): round(float(h[c]) / max(1, s["total_px"]), 4) for c in np.nonzero(h)[0]},
            frac_of_labeled={CLS[c]: round(float(h[c]) / max(1, lab), 4) for c in (0, 1, 2, 3)},
            imgs_with_class={CLS.get(c, str(c)): v for c, v in sorted(s["img_present"].items())},
            rover_px_frac=round(s["rover_px"] / max(1, s["total_px"]), 4),
            range_px_frac=round(s["range_px"] / max(1, s["total_px"]), 4),
            labels_under_rover={CLS.get(c, str(c)): int(s["hist_rover"][c]) for c in np.nonzero(s["hist_rover"])[0]},
            labels_beyond_30m={CLS.get(c, str(c)): int(s["hist_range"][c]) for c in np.nonzero(s["hist_range"])[0]},
        )
        if sp != "train" and train_names:
            tn = set(n.replace(".JPG", "") for n in s["names"])
            res[sp]["overlap_with_train"] = len(tn & train_names)
    json.dump(res, open(out_json, "w"), indent=1)
    print(json.dumps(res, indent=1))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
