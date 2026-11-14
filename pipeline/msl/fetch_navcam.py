#!/usr/bin/env python3
"""
Curiosity (MSL) Navcam ham görüntülerini sol aralığına göre çeker,
durak (site + drive) bazında gruplar ve rover_stops.json iskeleti üretir.

Yalnız standart kütüphane kullanır (pip gerekmez).

Kullanım (PowerShell):
  python fetch_navcam.py --sol-min 4600 --sol-max 4700 --no-download   # önce sadece say
  python fetch_navcam.py --sol-min 4600 --sol-max 4700                 # sonra indir

Çıktılar (--out, varsayılan ~/Documents/msl_data):
  navcam/sol_XXXXX/<imageid>.JPG   görüntüler (repoya GİRMEZ)
  index.csv                        tüm seçilen görüntülerin listesi
  rover_stops.json                 contracts/rover_stops formatında iskelet (px boş)
"""
import argparse
import csv
import json
import os
import sys
import time
import urllib.parse
import urllib.request
from collections import defaultdict

API = "https://mars.nasa.gov/api/v1/raw_image_items"
UA = {"User-Agent": "martian-map-spaceapps/0.1 (NASA Space Apps hackathon)"}
FULL_RECT = "(1,1,1024,1024)"


def parse_tuple(s):
    try:
        return [float(x) for x in str(s).strip("() ").split(",")]
    except (ValueError, AttributeError):
        return None


def get_json(params):
    url = API + "?" + urllib.parse.urlencode(params)
    for attempt in range(4):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except Exception as e:  # ağ zayıf olabilir, tekrar dene
            print(f"  istek hatası ({e}), tekrar {attempt + 1}/4", file=sys.stderr)
            time.sleep(2 * (attempt + 1))
    raise SystemExit(f"Sayfa alınamadı:\n{url}")


def base_params(cams, per_page, page):
    return [
        ("order", "sol desc,date_taken desc"),
        ("per_page", per_page),
        ("page", page),
        ("condition_1", "msl:mission"),
        ("search", "|".join(cams)),
        ("extended", "thumbnail::sample_type::noteq"),
    ]


def find_start_page(cams, per_page, sol_max):
    """Liste sol'e göre azalan sıralı: sol_max'ın başladığı sayfayı ikili aramayla bul."""
    first = get_json(base_params(cams, per_page, 0))
    total = first.get("total", 0)
    lo, hi = 0, max(0, (total - 1) // per_page)
    while lo < hi:
        mid = (lo + hi) // 2
        items = get_json(base_params(cams, per_page, mid)).get("items", [])
        if items and items[-1]["sol"] > sol_max:
            lo = mid + 1
        else:
            hi = mid
    return lo


def collect(cams, per_page, sol_min, sol_max):
    # 1) Sunucu tarafı sol filtresini dene; desteklenmiyorsa ikili aramaya düş.
    cond = [("condition_2", f"{sol_max}:sol:lte"), ("condition_3", f"{sol_min}:sol:gte")]
    probe = get_json(base_params(cams, per_page, 0) + cond).get("items", [])
    server_filter = bool(probe) and all(sol_min <= it["sol"] <= sol_max for it in probe)
    if server_filter:
        print("Sunucu sol filtresi çalışıyor.")
        page, extra = 0, cond
    else:
        print("Sunucu sol filtresi yok sayıldı, başlangıç sayfası aranıyor...")
        page, extra = find_start_page(cams, per_page, sol_max), []

    out = []
    while True:
        data = get_json(base_params(cams, per_page, page) + extra)
        items = data.get("items", [])
        if not items:
            break
        for it in items:
            if it["sol"] > sol_max:
                continue
            if it["sol"] < sol_min:
                return out
            out.append(it)
        print(f"  sayfa {page}: sol {items[0]['sol']}–{items[-1]['sol']}, toplam {len(out)}")
        if not data.get("more"):
            break
        page += 1
        time.sleep(0.2)
    return out


def is_full_frame(it):
    ext = it.get("extended") or {}
    return ext.get("sample_type") == "full" and it.get("subframe_rect") == FULL_RECT


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sol-min", type=int, required=True)
    ap.add_argument("--sol-max", type=int, required=True)
    ap.add_argument("--cams", default="NAV_LEFT_A,NAV_LEFT_B",
                    help="Virgülle. Stereo çiftin tek gözü yeterli (varsayılan: sol kamera)")
    ap.add_argument("--max-per-stop", type=int, default=12,
                    help="Durak başına en fazla görüntü (zemine en çok bakanlar önce)")
    ap.add_argument("--out", default=os.path.join(os.path.expanduser("~"), "Documents", "msl_data"))
    ap.add_argument("--per-page", type=int, default=50)
    ap.add_argument("--no-download", action="store_true", help="Sadece listele ve say")
    args = ap.parse_args()

    cams = [c.strip() for c in args.cams.split(",") if c.strip()]
    raw = collect(cams, args.per_page, args.sol_min, args.sol_max)
    full = [it for it in raw if is_full_frame(it)]
    print(f"\nAPI'den gelen: {len(raw)}  |  tam kare 1024x1024: {len(full)}")

    # Durak = (site, drive). xyz o durağın SITE çerçevesindeki konumu (metre).
    stops = defaultdict(list)
    for it in full:
        stops[(it["site"], it["drive"])].append(it)

    os.makedirs(args.out, exist_ok=True)
    rows, stop_json, total_bytes = [], [], 0

    for (site, drive), items in sorted(stops.items()):
        # mast_el ne kadar negatifse kamera o kadar zemine bakıyor -> önce onlar
        items.sort(key=lambda it: float((it.get("extended") or {}).get("mast_el") or 0))
        chosen = items[: args.max_per_stop]
        sols = sorted({it["sol"] for it in items})
        local_paths = []
        for it in chosen:
            sol_dir = os.path.join(args.out, "navcam", f"sol_{it['sol']:05d}")
            path = os.path.join(sol_dir, it["imageid"] + ".JPG")
            if not args.no_download and not os.path.exists(path):
                os.makedirs(sol_dir, exist_ok=True)
                try:
                    req = urllib.request.Request(it["https_url"], headers=UA)
                    with urllib.request.urlopen(req, timeout=60) as r, open(path, "wb") as f:
                        f.write(r.read())
                    time.sleep(0.2)
                except Exception as e:
                    print(f"  indirilemedi {it['imageid']}: {e}", file=sys.stderr)
                    continue
            if os.path.exists(path):
                total_bytes += os.path.getsize(path)
            local_paths.append(os.path.relpath(path, args.out).replace("\\", "/"))
            ext = it.get("extended") or {}
            rows.append({
                "sol": it["sol"], "site": site, "drive": drive,
                "instrument": it["instrument"], "imageid": it["imageid"],
                "mast_az": ext.get("mast_az"), "mast_el": ext.get("mast_el"),
                "xyz_site_m": it.get("xyz"), "date_taken": it.get("date_taken"),
                "url": it["https_url"], "local_path": local_paths[-1],
            })

        stop_json.append({
            "stop_id": f"msl_s{site:03d}_d{drive:04d}",
            "sol": sols[0],
            "px": None,  # site çerçevesi -> grid dönüşümü gelince doldurulacak
            "images": local_paths,
            "class_frac": None,  # Emre'nin modeli dolduracak
            "entropy": None,
            "site": site,
            "drive": drive,
            "sols": sols,
            "xyz_site_m": parse_tuple(items[0].get("xyz")),
            "n_full_frames": len(items),
        })

    with open(os.path.join(args.out, "index.csv"), "w", newline="", encoding="utf-8") as f:
        if rows:
            w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
            w.writeheader()
            w.writerows(rows)
    with open(os.path.join(args.out, "rover_stops.json"), "w", encoding="utf-8") as f:
        json.dump(stop_json, f, ensure_ascii=False, indent=2)

    # Rapor için özet
    sites = sorted({s for s, _ in stops})
    print("\n===== RAPOR ÖZETİ =====")
    print(f"Sol aralığı (istenen): {args.sol_min}–{args.sol_max}")
    if full:
        print(f"Sol aralığı (bulunan): {min(i['sol'] for i in full)}–{max(i['sol'] for i in full)}")
    print(f"Kameralar: {', '.join(cams)}")
    print(f"Durak sayısı (site+drive): {len(stops)}  |  site'lar: {sites}")
    print(f"Seçilen görüntü: {len(rows)}  (durak başına en fazla {args.max_per_stop})")
    if not args.no_download:
        print(f"İndirilen toplam boyut: {total_bytes / 1e6:.1f} MB")
    print(f"Çıktılar: {args.out}")


if __name__ == "__main__":
    main()