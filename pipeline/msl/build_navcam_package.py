"""Navcam paketi: 128 durağın tüm tam kare Navcam görüntüleri + eksen/kamera manifesti.
Çıktı: <out>/navcam_boxwork/ (stops/<stop_id>/*.JPG, manifest.json, manifest.csv, README.md) ve navcam_boxwork.zip
Daha önce indirilmiş kareler --cache klasöründen kopyalanır, tekrar indirilmez."""
import argparse, csv, json, os, shutil, sys, time, urllib.parse, urllib.request, zipfile

API = "https://mars.nasa.gov/api/v1/raw_image_items"
UA = {"User-Agent": "martian-map-spaceapps/0.1 (NASA Space Apps hackathon)"}
DOCS = os.path.join(os.path.expanduser("~"), "Documents")
FULL_RECT = "(1,1,1024,1024)"

README = """# Navcam boxwork paketi

Curiosity (MSL) Navcam sol kamera (NAV_LEFT_A/B) tam kare görüntüleri, Gale / Mount Sharp boxwork bölgesi.
Kaynak: NASA/JPL-Caltech ham görüntü API'si (mars.nasa.gov/api/v1/raw_image_items). Ham, kalibre edilmemiş JPEG.
Durak konumları: MMGIS MSL_waypoints.json (site orijini + xyz), grid: Martian Map contracts/grid.json.

Dosya adı: <imageid>__az<mast_az>_el<mast_el>.JPG

Alanlar (API'deki ham değerler):
- mast_az_deg: direğin azimutu, derece (rover çerçevesinde)
- mast_el_deg: direğin yükseklik açısı, derece (negatif = aşağı/zemine bakıyor)
- camera_position_m, camera_vector: kameranın konumu ve bakış vektörü (API'nin verdiği çerçevede)
- camera_model_type / camera_model: CAHVOR kamera modeli bileşenleri
- rover_attitude_quat: rover duruş kuaterniyonu
- xyz_site_m: rover'ın site yerel çerçevesindeki konumu (m; x=kuzey, y=doğu)
- stop_lat, stop_lon, stop_px: durağın küresel konumu ve grid pikseli [sütun, satır]

Not: Çerçeve tanımları NASA PDS MSL kamera dokümantasyonuyla doğrulanmalıdır.
3D için dünya yönü (kuzeye göre) 3d/stops_3d.json içindeki world_az_deg alanındadır.
"""

def parse_tuple(s):
    try:
        return [float(x) for x in str(s).strip("() ").split(",")]
    except (ValueError, AttributeError):
        return None

def get_json(params):
    url = API + "?" + urllib.parse.urlencode(params)
    for i in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                return json.load(r)
        except Exception as e:
            print(f"  istek hatası ({e}), tekrar {i + 1}/4", file=sys.stderr)
            time.sleep(2 * (i + 1))
    raise SystemExit("Sayfa alınamadı: " + url)

def fetch_items(sol_min, sol_max, cams):
    out, page = [], 0
    while True:
        d = get_json([
            ("order", "sol desc,date_taken desc"), ("per_page", 50), ("page", page),
            ("condition_1", "msl:mission"), ("search", "|".join(cams)),
            ("extended", "thumbnail::sample_type::noteq"),
            ("condition_2", f"{sol_max}:sol:lte"), ("condition_3", f"{sol_min}:sol:gte"),
        ])
        items = d.get("items", [])
        out += [it for it in items if sol_min <= it["sol"] <= sol_max]
        print(f"  sayfa {page}: {len(out)} kayıt")
        if not d.get("more") or not items:
            return out
        page += 1
        time.sleep(0.2)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sol-min", type=int, default=4580)
    ap.add_argument("--sol-max", type=int, default=4850)
    ap.add_argument("--stops", default=os.path.join(DOCS, "msl_data", "rover_stops.json"))
    ap.add_argument("--cache", default=os.path.join(DOCS, "msl_data", "navcam"))
    ap.add_argument("--out", default=os.path.join(DOCS, "navcam_package"))
    ap.add_argument("--no-download", action="store_true")
    ap.add_argument("--no-zip", action="store_true")
    a = ap.parse_args()

    stops = {(s["site"], s["drive"]): s for s in json.load(open(a.stops, encoding="utf-8"))}
    print(f"Durak: {len(stops)} | API taranıyor...")
    items = fetch_items(a.sol_min, a.sol_max, ["NAV_LEFT_A", "NAV_LEFT_B"])
    full = [it for it in items
            if (it.get("extended") or {}).get("sample_type") == "full" and it.get("subframe_rect") == FULL_RECT]

    root = os.path.join(a.out, "navcam_boxwork")
    rows, n_dl, n_copy, n_fail = [], 0, 0, 0
    for i, it in enumerate(full, 1):
        s = stops.get((it["site"], it["drive"]))
        if not s:
            continue
        ext = it.get("extended") or {}
        az, el = float(ext.get("mast_az") or 0), float(ext.get("mast_el") or 0)
        rel = f"stops/{s['stop_id']}/{it['imageid']}__az{az:05.1f}_el{el:+05.1f}.JPG"
        path = os.path.join(root, *rel.split("/"))
        if not a.no_download and not os.path.exists(path):
            os.makedirs(os.path.dirname(path), exist_ok=True)
            cached = os.path.join(a.cache, f"sol_{it['sol']:05d}", it["imageid"] + ".JPG")
            try:
                if os.path.exists(cached):
                    shutil.copy2(cached, path); n_copy += 1
                else:
                    req = urllib.request.Request(it["https_url"], headers=UA)
                    with urllib.request.urlopen(req, timeout=60) as r, open(path, "wb") as f:
                        f.write(r.read())
                    n_dl += 1
                    time.sleep(0.1)
            except Exception as e:
                print(f"  indirilemedi {it['imageid']}: {e}", file=sys.stderr); n_fail += 1
                continue
        if i % 50 == 0:
            print(f"  {i}/{len(full)} işlendi (indirilen {n_dl}, kopyalanan {n_copy})")
        rows.append({
            "stop_id": s["stop_id"], "sol": it["sol"], "site": it["site"], "drive": it["drive"],
            "stop_lat": s.get("lat"), "stop_lon": s.get("lon"), "stop_px": s.get("px"),
            "instrument": it["instrument"], "imageid": it["imageid"],
            "date_taken": it.get("date_taken"), "lmst": ext.get("lmst"),
            "mast_az_deg": az, "mast_el_deg": el,
            "camera_position_m": parse_tuple(it.get("camera_position")),
            "camera_vector": parse_tuple(it.get("camera_vector")),
            "camera_model_type": it.get("camera_model_type"),
            "camera_model": it.get("camera_model_component_list"),
            "rover_attitude_quat": parse_tuple(it.get("attitude")),
            "xyz_site_m": parse_tuple(it.get("xyz")),
            "url": it["https_url"], "file": rel,
        })

    os.makedirs(root, exist_ok=True)
    rows.sort(key=lambda r: (r["sol"], r["site"], r["drive"], r["mast_az_deg"]))
    meta = {"source": API, "sol_range": [a.sol_min, a.sol_max], "camera": "Navcam left, full frame 1024x1024",
            "n_stops": len({r["stop_id"] for r in rows}), "n_images": len(rows), "images": rows}
    json.dump(meta, open(os.path.join(root, "manifest.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    with open(os.path.join(root, "manifest.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        for r in rows:
            w.writerow({k: (json.dumps(v) if isinstance(v, list) else v) for k, v in r.items()})
    open(os.path.join(root, "README.md"), "w", encoding="utf-8").write(README)

    size = sum(os.path.getsize(os.path.join(dp, fn)) for dp, _, fs in os.walk(root) for fn in fs)
    print(f"\nDurak: {meta['n_stops']} | görüntü: {len(rows)} | indirilen: {n_dl} | kopyalanan: {n_copy} | hata: {n_fail}")
    print(f"Paket boyutu: {size / 1e6:.1f} MB -> {root}")

    if not a.no_zip and not a.no_download:
        zpath = root + ".zip"
        print("ZIP hazırlanıyor (JPEG zaten sıkıştırılmış; ZIP_STORED)...")
        with zipfile.ZipFile(zpath, "w", zipfile.ZIP_STORED) as z:
            for dp, _, fs in os.walk(root):
                for fn in fs:
                    full_path = os.path.join(dp, fn)
                    z.write(full_path, os.path.relpath(full_path, a.out))
        print(f"ZIP: {zpath} ({os.path.getsize(zpath) / 1e6:.1f} MB)")

if __name__ == "__main__":
    main()
