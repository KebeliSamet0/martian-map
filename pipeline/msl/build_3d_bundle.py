"""Batu (3D) için paket: arazi + duraklar (yükseklik dahil) + her fotoğrafın dünya yönü.
Önce build_navcam_package.py --no-zip çalıştırılmış olmalı. Çıktı: <package>/3d/ ve isteğe bağlı ZIP."""
import argparse, json, math, os, shutil, zipfile

DOCS = os.path.join(os.path.expanduser("~"), "Documents")

README_3D = """# 3D paketi (Batu için)

## Koordinat sistemi
- Izgara: 1000x1000 piksel, 2 m/piksel, sol üst köşe = grid.json origin_xy_m (Equirectangular, R=3396190).
- px = [x, y] = [sütun, satır]; (0,0) sol üst (kuzeybatı). x doğuya, y güneye artar.
- Three.js önerisi: X = sütun*2 (m, doğu), Z = satır*2 (m, güney), Y = elevation_m - min_elevation.
- elevation.npy: float32, metre, şekil (1000,1000), indeks [satır, sütun].

## Duraklar (stops_3d.json)
- px, lat/lon, easting/northing, elevation_m (DTM'den örneklendi), rover_yaw_deg.
- images[]: file (paket içi yol), mast_az_deg (rovera göre), mast_el_deg (negatif = aşağı),
  world_az_deg = (rover_yaw + mast_az) mod 360; 0 = kuzey, 90 = doğu (saat yönü).
- Navcam görüş alanı yaklaşık 45x45 derece, 1024x1024 piksel, siyah-beyaz.
- Fotoğrafı yerleştirmek için: durak noktasında, yerden yaklaşık 1.9 m yükseklikte (direk kamerası),
  world_az_deg yönüne ve mast_el_deg açısıyla bakan bir düzlem.

## Doğruluk
- Durak konumu: iki yöntem arası fark <0,5 m.
- yaw_source = "waypoint" ise NASA kaydı; "quaternion" ise fotoğraftaki rover duruşundan hesaplandı.
- Açı kuralları NASA PDS MSL dokümantasyonuyla doğrulanmadı; sahnede görsel kontrol önerilir.
"""

def records(data):
    if isinstance(data, dict) and "features" in data:
        for f in data["features"]:
            yield dict(f.get("properties") or {})
    elif isinstance(data, list):
        yield from data

def yaw_from_q(q, scalar_first):
    w, x, y, z = q if scalar_first else (q[3], q[0], q[1], q[2])
    return math.degrees(math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z))) % 360

def angdiff(a, b):
    return abs((a - b + 180) % 360 - 180)

def median(v):
    v = sorted(v)
    return v[len(v) // 2] if v else float("inf")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--package", default=os.path.join(DOCS, "navcam_package", "navcam_boxwork"))
    ap.add_argument("--waypoints", default=os.path.join(DOCS, "msl_data", "MSL_waypoints.json"))
    ap.add_argument("--repo", default=".")
    ap.add_argument("--zip", action="store_true")
    a = ap.parse_args()

    man = json.load(open(os.path.join(a.package, "manifest.json"), encoding="utf-8"))
    wp = {}
    for p in records(json.load(open(a.waypoints, encoding="utf-8"))):
        try:
            wp[(int(p["site"]), int(p["drive"]))] = p
        except (KeyError, TypeError, ValueError):
            pass

    stops = {}
    for im in man["images"]:
        stops.setdefault(im["stop_id"], {"meta": im, "images": []})["images"].append(im)

    # Kuaterniyon sırasını waypoint yaw'ı ile karşılaştırarak seç
    errs = {True: [], False: []}
    for st in stops.values():
        m, q = st["meta"], st["meta"].get("rover_attitude_quat")
        w = wp.get((m["site"], m["drive"]))
        if q and w and w.get("yaw") is not None:
            for conv in errs:
                errs[conv].append(angdiff(yaw_from_q(q, conv), float(w["yaw"])))
    conv = min(errs, key=lambda c: median(errs[c]))
    print(f"Kuaterniyon kontrolü (medyan hata): skaler-önde {median(errs[True]):.1f}°, "
          f"skaler-sonda {median(errs[False]):.1f}° -> seçilen: {'skaler-önde' if conv else 'skaler-sonda'}")

    elev = None
    epath = os.path.join(a.repo, "layers", "elevation.npy")
    try:
        import numpy as np
        if os.path.exists(epath):
            elev = np.load(epath)
    except ImportError:
        print("numpy yok: yükseklik waypoint elev_geoid'den alınacak (yalnız eşleşen duraklar)")

    out_dir = os.path.join(a.package, "3d")
    os.makedirs(os.path.join(out_dir, "terrain"), exist_ok=True)
    out, n_wp_yaw = [], 0
    for sid, st in sorted(stops.items(), key=lambda kv: kv[1]["meta"]["sol"]):
        m = st["meta"]
        w = wp.get((m["site"], m["drive"]))
        if w and w.get("yaw") is not None:
            yaw, ysrc = float(w["yaw"]), "waypoint"; n_wp_yaw += 1
        elif m.get("rover_attitude_quat"):
            yaw, ysrc = yaw_from_q(m["rover_attitude_quat"], conv), "quaternion"
        else:
            yaw, ysrc = None, None
        px = m.get("stop_px")
        z, zsrc = None, None
        if elev is not None and px:
            c, r = int(px[0]), int(px[1])
            if 0 <= r < elev.shape[0] and 0 <= c < elev.shape[1]:
                z, zsrc = float(elev[r, c]), "dtm"
        if z is None and w and w.get("elev_geoid") is not None:
            z, zsrc = float(w["elev_geoid"]), "waypoint"
        out.append({
            "stop_id": sid, "sol": m["sol"], "site": m["site"], "drive": m["drive"],
            "px": px, "lat": m.get("stop_lat"), "lon": m.get("stop_lon"),
            "elevation_m": z, "elevation_source": zsrc,
            "rover_yaw_deg": yaw, "yaw_source": ysrc,
            "images": [{
                "file": im["file"], "url": im["url"],
                "mast_az_deg": im["mast_az_deg"], "mast_el_deg": im["mast_el_deg"],
                "world_az_deg": None if yaw is None else round((yaw + im["mast_az_deg"]) % 360, 2),
            } for im in sorted(st["images"], key=lambda i: i["mast_az_deg"])],
        })
    json.dump(out, open(os.path.join(out_dir, "stops_3d.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(out_dir, "README_3D.md"), "w", encoding="utf-8").write(README_3D)

    copied = []
    for rel in ["contracts/grid.json", "layers/elevation.npy", "layers/elevation_norm.npy",
                "layers/ortho_1m.png", "layers/ortho_2m.png", "layers/science_stops.json"]:
        src = os.path.join(a.repo, *rel.split("/"))
        if os.path.exists(src):
            shutil.copy2(src, os.path.join(out_dir, "terrain", os.path.basename(src)))
            copied.append(os.path.basename(src))

    print(f"Durak: {len(out)} | yaw: waypoint {n_wp_yaw}, kuaterniyon {len(out) - n_wp_yaw} | "
          f"yükseklik: {sum(1 for s in out if s['elevation_m'] is not None)}/{len(out)}")
    print(f"Arazi dosyaları: {', '.join(copied) or 'YOK (layers/ klasörü bulunamadı)'}")
    print(f"3D paketi: {out_dir}")

    if a.zip:
        zpath = a.package + ".zip"
        base = os.path.dirname(a.package)
        print("ZIP hazırlanıyor...")
        with zipfile.ZipFile(zpath, "w", zipfile.ZIP_STORED) as z:
            for dp, _, fs in os.walk(a.package):
                for fn in fs:
                    fp = os.path.join(dp, fn)
                    z.write(fp, os.path.relpath(fp, base))
        print(f"ZIP: {zpath} ({os.path.getsize(zpath) / 1e6:.1f} MB)")

if __name__ == "__main__":
    main()
