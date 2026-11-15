#!/usr/bin/env python3
"""Kask kamerası görüntüleri: Curiosity'nin durak başına çektiği gerçek Navcam karelerini NASA ham görüntü arşivinden indirir.

  python sim/tools/fetch_navcam.py --manifest      # yalnız sim/data/navcam_manifest.json'u (durak + model çıktısı + dosya adları) yazar
  python sim/tools/fetch_navcam.py                 # manifesti yazar, eksik kareleri indirir (1024 px, JPEG kalite 80) -> sim/data/navcam_all/<stop_id>/<ad>.jpg
  python sim/tools/fetch_navcam.py --check         # eksik kare sayısını yazar, indirmez (çıkış kodu 1 = eksik var)

Kaynak: layers/rover_stops.json (128 durak; images alanı 'navcam/sol_NNNNN/<ad>.JPG'). Model alanları (class_frac, entropy) aynı dosyadan gelir
(ml/rover_terrain/stops_128.csv ile aynı sayılar). Görüntüler NASA/JPL-Caltech kamu malıdır; sim/data/navcam_all/ git'e girmez, deploy bu betiği çalıştırır.
Gereksinim: curl, Pillow."""
import argparse, json, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STOPS = ROOT / "layers" / "rover_stops.json"
OUT = ROOT / "sim" / "data" / "navcam_all"
MANIFEST = ROOT / "sim" / "data" / "navcam_manifest.json"
BASE = "https://mars.nasa.gov/msl-raw-images/proj/msl/redops/ods/surface/sol/{sol5}/opgs/edr/ncam/{name}"
MAX_PX, QUALITY = 1024, 80


def build_manifest():
    stops = json.loads(STOPS.read_text(encoding="utf-8"))
    out = []
    for s in stops:
        files = []
        for rel in s.get("images", []):
            parts = rel.split("/")                      # navcam/sol_04580/<ad>.JPG
            sol5, name = parts[1].replace("sol_", ""), parts[-1]
            files.append({"name": Path(name).stem + ".jpg", "src": name, "sol": int(sol5), "url": BASE.format(sol5=sol5, name=name)})
        out.append({"stop_id": s["stop_id"], "sol": s["sol"], "px": s["px"], "class_frac": s["class_frac"], "entropy": s["entropy"],
                    "in_grid": s.get("in_grid", True), "local": (ROOT / "sim" / "data" / "navcam" / f"{s['stop_id']}.jpg").exists(), "files": files})
    doc = {"source": "layers/rover_stops.json + NASA MSL raw images (NASA/JPL-Caltech, kamu malı)", "max_px": MAX_PX, "stops": out}
    MANIFEST.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    return doc


def fetch_one(job):
    stop_id, f = job
    dst = OUT / stop_id / f["name"]
    if dst.exists() and dst.stat().st_size > 0:
        return job, "var", 0
    from PIL import Image
    r = subprocess.run(["curl", "-s", "--retry", "5", "--retry-delay", "2", "-m", "60", "-f", f["url"]], capture_output=True)
    if r.returncode != 0 or len(r.stdout) < 1000:
        return job, f"curl {r.returncode}", 0
    try:
        im = Image.open(BytesIO(r.stdout)).convert("RGB")
    except Exception as e:  # noqa: BLE001
        return job, f"görüntü okunamadı: {e}", 0
    im.thumbnail((MAX_PX, MAX_PX))
    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, "JPEG", quality=QUALITY, optimize=True)
    return job, "indirildi", dst.stat().st_size


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--manifest", action="store_true")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    doc = build_manifest()
    jobs = [(s["stop_id"], f) for s in doc["stops"] for f in s["files"]]
    print(f"manifest: {len(doc['stops'])} durak, {len(jobs)} kare -> {MANIFEST.relative_to(ROOT)}")
    if a.manifest:
        return 0
    missing = [j for j in jobs if not (OUT / j[0] / j[1]["name"]).exists()]
    if a.check:
        print(f"eksik kare: {len(missing)}/{len(jobs)}")
        return 1 if missing else 0
    ok = fail = new_bytes = 0
    with ThreadPoolExecutor(6) as ex:
        for (sid, f), st, size in ex.map(fetch_one, jobs):
            if st in ("var", "indirildi"):
                ok += 1; new_bytes += size
            else:
                fail += 1; print(f"BAŞARISIZ {sid}/{f['name']}: {st}", file=sys.stderr)
    total = sum(p.stat().st_size for p in OUT.rglob("*.jpg")) if OUT.exists() else 0
    print(f"tamam: {ok}, başarısız: {fail}; navcam_all toplam {total / 1e6:.1f} MB")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
