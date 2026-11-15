"""Kask kamerası için zemin maskeleri: her Navcam karesi için renkli sınıf haritası (+ belirsizlik).

Kullanım (ağırlık gelince tek komut):
    python ml/rover_terrain/export_masks.py --model models/rover_terrain/full/best.pt \
        [--mask-model models/rover_terrain/mask/mask.pt] [--T 20] [--limit-stops N] [--stop msl_s117_d0384]

Girdi : sim/data/navcam_all/<stop_id>/<kare>.jpg  (sim/data/navcam_manifest.json'daki duraklar)
Çıktı : sim/data/navcam_masks/<stop_id>/<kare>.png       RGBA sınıf haritası, fotoğrafla aynı boyut;
                                                         maskelenen alan (rover gövdesi, >30 m) şeffaf
        sim/data/navcam_masks/<stop_id>/<kare>_unc.png   MC Dropout belirsizliği, gri ton (255 = emin değil)
        sim/data/navcam_masks/frame_fracs.csv            kare başına sınıf oranı (geçerli piksellerde)
Tutarlılık: durak başına kare oranları piksel ağırlıklı toplanıp ml/rover_terrain/stops_128.csv ile karşılaştırılır.

Model kurulumu infer_stops.py ile aynıdır (aynı build_model / predict: DeepLabv3+ ResNet34, 4 sınıf, 512 px,
gri->3 kanal ImageNet normalizasyonu, MC Dropout, train_mask.py U-Net'i ile gövde ve 30 m ötesi maskesi).
Sınıf renkleri sim tarafındaki helmetcam.js'in beklediği adlarla eşleşir (navcam_masks/<stop_id>/<kare>.png).
"""
import argparse, csv, json, os, sys
import numpy as np
import torch
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from train import build_model  # noqa: E402
from train_mask import build_mask_model  # noqa: E402
from infer_stops import predict, CLASSES  # noqa: E402  (soil, bedrock, sand, bigrock)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
# toprak, ana kaya, kum, büyük kaya
PALETTE = np.array([[0xb0, 0x7a, 0x4a], [0x8a, 0x8a, 0x8a], [0xe8, 0xc3, 0x5a], [0xd0, 0x44, 0x3a]], np.uint8)


def pick_device():
    if torch.cuda.is_available():
        return torch.device("cuda")
    if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def render(p, ent, invalid, size_wh):
    """p: 4xSxS olasılık, ent: SxS, invalid: SxS bool (512 px) -> (RGBA, gri belirsizlik) orijinal boyutta."""
    lab = Image.fromarray(p.argmax(0).astype(np.uint8)).resize(size_wh, Image.NEAREST)
    inv = Image.fromarray(invalid.astype(np.uint8) * 255).resize(size_wh, Image.NEAREST)
    lab, inv = np.array(lab), np.array(inv) > 0
    rgba = np.zeros((*lab.shape, 4), np.uint8)
    rgba[..., :3] = PALETTE[lab]
    rgba[..., 3] = np.where(inv, 0, 255)
    unc = np.array(Image.fromarray((np.clip(ent, 0, 1) * 255).astype(np.uint8)).resize(size_wh, Image.BILINEAR))
    unc[inv] = 0
    return rgba, unc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", required=True, help="zemin modeli ağırlığı (best.pt)")
    ap.add_argument("--mask-model", default="", help="gövde/30 m maskesi U-Net'i (mask.pt); verilmezse maskeleme yok")
    ap.add_argument("--T", type=int, default=20, help="MC Dropout geçiş sayısı")
    ap.add_argument("--data", default=os.path.join(ROOT, "sim", "data"))
    ap.add_argument("--out", default="", help="varsayılan <data>/navcam_masks")
    ap.add_argument("--stops-csv", default=os.path.join(ROOT, "ml", "rover_terrain", "stops_128.csv"))
    ap.add_argument("--stop", action="append", default=[], help="yalnız bu durak(lar)")
    ap.add_argument("--limit-stops", type=int, default=0, help="ilk N durak (deneme)")
    ap.add_argument("--limit-frames", type=int, default=0, help="durak başına en fazla N kare (deneme)")
    ap.add_argument("--random-init", action="store_true", help="ağırlık yükleme, rastgele ağ (yalnız biçim testi)")
    a = ap.parse_args()
    out_root = a.out or os.path.join(a.data, "navcam_masks")
    dev = pick_device()
    print("cihaz:", dev)
    torch.manual_seed(0)

    model = build_model(pretrained=False)
    if not a.random_init:
        model.load_state_dict(torch.load(a.model, map_location=dev))
    model.to(dev)
    mask_model = None
    if a.mask_model:
        mask_model = build_mask_model(pretrained=False)
        if not a.random_init:
            mask_model.load_state_dict(torch.load(a.mask_model, map_location=dev))
        mask_model.to(dev).eval()
    elif not a.random_init:
        print("UYARI: --mask-model yok; gövde ve 30 m ötesi maskelenmez (stops_128.csv maskeli üretildi, oranlar sapar).")

    manifest = json.load(open(os.path.join(a.data, "navcam_manifest.json"), encoding="utf-8"))
    stops = manifest["stops"] if isinstance(manifest, dict) and "stops" in manifest else manifest
    if a.stop:
        stops = [s for s in stops if s["stop_id"] in a.stop]
    if a.limit_stops:
        stops = stops[: a.limit_stops]

    ref = {}
    if os.path.exists(a.stops_csv):
        for r in csv.DictReader(open(a.stops_csv, encoding="utf-8")):
            ref[r["stop_id"]] = r

    os.makedirs(out_root, exist_ok=True)
    frame_rows, cmp_rows, n_done = [], [], 0
    for s in stops:
        sid = s["stop_id"]
        d = os.path.join(a.data, "navcam_all", sid)
        names = sorted(f["name"] for f in s["files"] if os.path.exists(os.path.join(d, f["name"]))) if s.get("files") else []
        if a.limit_frames:
            names = names[: a.limit_frames]
        if not names:
            print(f"{sid}: indirilmiş kare yok, atlandı")
            continue
        os.makedirs(os.path.join(out_root, sid), exist_ok=True)
        psum, nval, ntot = np.zeros(4), 0, 0
        for name in names:
            im = Image.open(os.path.join(d, name)).convert("L")
            gray = np.array(im)
            g, p, ent, inv = predict(model, mask_model, gray, a.T, dev)
            rgba, unc = render(p, ent, inv, im.size)
            stem = os.path.splitext(name)[0]
            Image.fromarray(rgba, "RGBA").save(os.path.join(out_root, sid, stem + ".png"), optimize=True)
            Image.fromarray(unc, "L").save(os.path.join(out_root, sid, stem + "_unc.png"), optimize=True)
            v = ~inv
            nv = int(v.sum())
            fr = p[:, v].sum(1) / max(p[:, v].sum(), 1e-9) if nv else np.full(4, 0.25)
            frame_rows.append([sid, name, round(nv / v.size, 3), *np.round(fr, 4), round(float(ent[v].mean()) if nv else 1.0, 4)])
            psum += p[:, v].sum(1); nval += nv; ntot += v.size
            n_done += 1
        fr = psum / psum.sum() if nval else np.full(4, 0.25)
        row = {"stop_id": sid, "n": len(names), **{c: float(x) for c, x in zip(CLASSES, fr)}}
        if sid in ref:
            row["ref"] = {c: float(ref[sid][c]) for c in CLASSES}
            row["maxdiff"] = max(abs(row[c] - row["ref"][c]) for c in CLASSES)
        cmp_rows.append(row)
        print(f"{sid:16s} {len(names)} kare | " + " ".join(f"{c} {row[c]:.2f}" for c in CLASSES)
              + (f" | stops_128'e göre en büyük fark {row['maxdiff']:.3f}" if "maxdiff" in row else ""), flush=True)

    with open(os.path.join(out_root, "frame_fracs.csv"), "w", encoding="utf-8", newline="\n") as fh:
        fh.write("stop_id,frame,valid_frac," + ",".join(CLASSES) + ",entropy\n")
        fh.writelines(",".join(map(str, r)) + "\n" for r in frame_rows)
    diffs = [r["maxdiff"] for r in cmp_rows if "maxdiff" in r]
    print(f"\n{n_done} kare, {len(cmp_rows)} durak -> {out_root}")
    if diffs:
        print(f"tutarlılık: {len(diffs)} durak karşılaştırıldı, en büyük sınıf-oranı farkı medyan {np.median(diffs):.3f}, "
              f"maks {max(diffs):.3f} (stops_128.csv ile; deneme/sınırlı kare çalıştırmasında fark beklenir)")


if __name__ == "__main__":
    main()
