#!/usr/bin/env python3
"""Kask kamerası görüntüleri: Curiosity'nin durak başına çektiği gerçek Navcam karelerini NASA ham görüntü arşivinden indirir.

  python sim/tools/fetch_navcam.py --manifest      # yalnız sim/data/navcam_manifest.json'u (durak + model çıktısı + dosya adları) yazar
  python sim/tools/fetch_navcam.py                 # manifesti yazar, eksik kareleri indirir (1024 px, JPEG kalite 80) -> sim/data/navcam_all/<stop_id>/<ad>.jpg
  python sim/tools/fetch_navcam.py --dirs          # sim/data/navcam_dirs.json: her karenin bakış azimutu/yüksekliği/FOV'u (NASA raw_image_items API, CAHVOR kamera modeli)
  python sim/tools/fetch_navcam.py --check         # eksik kare sayısını yazar, indirmez (çıkış kodu 1 = eksik var)

Kaynak: layers/rover_stops.json (128 durak; images alanı 'navcam/sol_NNNNN/<ad>.JPG'). Model alanları (class_frac, entropy) aynı dosyadan gelir
(ml/rover_terrain/stops_128.csv ile aynı sayılar). Görüntüler NASA/JPL-Caltech kamu malıdır; sim/data/navcam_all/ git'e girmez, deploy bu betiği çalıştırır.
Gereksinim: curl, Pillow."""
import argparse, json, math, subprocess, sys, urllib.request, urllib.parse
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
STOPS = ROOT / "layers" / "rover_stops.json"
OUT = ROOT / "sim" / "data" / "navcam_all"
MANIFEST = ROOT / "sim" / "data" / "navcam_manifest.json"
DIRS = ROOT / "sim" / "data" / "navcam_dirs.json"
API = "https://mars.nasa.gov/api/v1/raw_image_items/"
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


def _vec(txt):
    return [float(x) for x in txt.strip("()").split(",")]


def _cross(a, b):
    return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]


def _dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def _rot(q, v):
    """q=(w,x,y,z) birim kuaterniyon ile v vektörünü döndürür (v' = q v q*)."""
    w, x, y, z = q
    t = [2 * c for c in _cross((x, y, z), v)]
    c2 = _cross((x, y, z), t)
    return [v[i] + w * t[i] + c2[i] for i in range(3)]


def direction_of(item):
    """raw_image_items kaydı -> {az_deg, el_deg, fov_deg, ...}.
    camera_model_component_list (CAHVOR) ROVER çerçevesindedir (x ileri, y sağ, z aşağı): A ekseninin azimutu extended.mast_az ile birebir aynı çıkar (en çok 0,5° fark).
    Kuzeye göre azimut için rover duruşunu (attitude kuaterniyonu, site çerçevesine göre; site: x kuzey, y doğu, z aşağı) uygularız: v_site = q·A·q*.
    Doğrulama: aynı kuaterniyonun yaw'ı, ardışık duraklar arası hareket yönüyle uyuşuyor (50 çiftte 35'i ±60° içinde, medyan −1,8°; ters işaretle 22 ve −9,6°).
    az = atan2(doğu, kuzey) (kuzeyden saat yönü), el = −asin(z_site) (eksi = aşağı). fov: yatay, CAHV'dan 2·atan(W/2 / |A×H|); O,R distorsiyonu yok sayılır."""
    comps = [_vec(c) for c in item["camera_model_component_list"].split(";")]
    _, A, H, _, _, _ = comps
    n = math.sqrt(_dot(A, A)); A = [x / n for x in A]
    az_rover = math.degrees(math.atan2(A[1], A[0])) % 360
    q = _vec(item["attitude"])
    qn = math.sqrt(sum(c * c for c in q)); q = [c / qn for c in q]
    As = _rot(q, A)
    az = math.degrees(math.atan2(As[1], As[0])) % 360
    el = -math.degrees(math.asin(max(-1, min(1, As[2]))))
    yaw = math.degrees(math.atan2(2 * (q[0] * q[3] + q[1] * q[2]), 1 - 2 * (q[2] ** 2 + q[3] ** 2))) % 360
    rect = [int(x) for x in item["subframe_rect"].strip("()").split(",")]
    w = rect[2] if len(rect) == 4 else 1024
    hs = math.sqrt(_dot(_cross(A, H), _cross(A, H))); hc = _dot(A, H)
    fov = math.degrees(math.atan2(w - hc, hs) + math.atan2(hc, hs))
    mast = item.get("extended", {}).get("mast_az")
    return {"az_deg": round(az, 1), "el_deg": round(el, 1), "fov_deg": round(fov, 1), "az_rover_deg": round(az_rover, 1), "rover_yaw_deg": round(yaw, 1),
            "mast_az": float(mast) if mast else None, "site": item.get("site"), "drive": item.get("drive"),
            "kaynak": "NASA raw_image_items API: CAHVOR kamera modeli (rover çerçevesi) + attitude kuaterniyonu (site çerçevesi), sol %s" % item["sol"]}


def fetch_dirs(doc):
    """Manifestteki her kare için yön; API'de bulunmayan karede alanlar null (uydurma yok)."""
    wanted = {f["name"][:-4]: f for s in doc["stops"] for f in s["files"]}   # imageid -> dosya
    by_sol = {}
    for iid, f in wanted.items():
        by_sol.setdefault(f["sol"], set()).add(iid)
    found = {}
    for sol, ids in sorted(by_sol.items()):
        page = 0
        while ids - set(found):
            q = {"order": "sol desc", "per_page": 200, "page": page, "condition_1": "msl:mission", "condition_2": f"{sol}:sol:in", "condition_3": "NAV_LEFT_B:instrument:in"}
            url = API + "?" + urllib.parse.urlencode(q)
            r = subprocess.run(["curl", "-s", "--retry", "5", "--retry-delay", "2", "-m", "60", "-f", url], capture_output=True)
            if r.returncode != 0:
                break
            items = json.loads(r.stdout).get("items", [])
            for it in items:
                if it["imageid"] in ids:
                    found[it["imageid"]] = it
            if len(items) < 200:
                break
            page += 1
    out = {}
    for iid, f in sorted(wanted.items()):
        it = found.get(iid)
        out[f["name"]] = direction_of(it) if it else {"az_deg": None, "el_deg": None, "fov_deg": None, "kaynak": None}
    n_ok = sum(1 for v in out.values() if v["az_deg"] is not None)
    DIRS.write_text(json.dumps({"_about": "Bakış yönü: az_deg kuzeyden saat yönü (site çerçevesi), el_deg eksi = aşağı, fov_deg yatay. null = API'de yok.", "frames": out},
                               ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(f"yönler: {n_ok}/{len(out)} kare -> {DIRS.relative_to(ROOT)}")


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
    ap.add_argument("--dirs", action="store_true")
    a = ap.parse_args()
    doc = build_manifest()
    jobs = [(s["stop_id"], f) for s in doc["stops"] for f in s["files"]]
    print(f"manifest: {len(doc['stops'])} durak, {len(jobs)} kare -> {MANIFEST.relative_to(ROOT)}")
    if a.dirs:
        fetch_dirs(doc)
        return 0
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
