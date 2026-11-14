"""rover_stops.json'daki duraklara grid piksel konumu (px = [sütun, satır]) ekler.
Formül (Elif Rana): sütun = (easting - origin_x) / res, satır = (origin_y - northing) / res
Değerler contracts/grid.json'dan okunur; --origin-x/--origin-y ile geçici olarak ezilebilir."""
import argparse, json, os

HOME = os.path.join(os.path.expanduser("~"), "Documents", "msl_data")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--stops", default=os.path.join(HOME, "rover_stops.json"))
    ap.add_argument("--grid", default=None, help="Varsayılan: contracts/grid.json, yoksa grid.example.json")
    ap.add_argument("--origin-x", type=float, default=None)
    ap.add_argument("--origin-y", type=float, default=None)
    a = ap.parse_args()

    gpath = a.grid or ("contracts/grid.json" if os.path.exists("contracts/grid.json") else "contracts/grid.example.json")
    g = json.load(open(gpath, encoding="utf-8"))
    res, w, h = float(g["res_m"]), int(g["width"]), int(g["height"])
    ox, oy = g.get("origin_xy_m", [0, 0])
    if a.origin_x is not None: ox = a.origin_x
    if a.origin_y is not None: oy = a.origin_y
    if ox == 0 and oy == 0:
        raise SystemExit(f"{gpath} içinde origin_xy_m hâlâ [0, 0]. --origin-x ve --origin-y verin.")
    print(f"Grid: {gpath} | {w}x{h} px, {res} m/px | origin = ({ox}, {oy})")

    stops = json.load(open(a.stops, encoding="utf-8"))
    inside = []
    for s in stops:
        if s.get("easting") is None:
            s["px"], s["in_grid"] = None, False
            continue
        col = (s["easting"] - ox) / res
        row = (oy - s["northing"]) / res
        s["px"] = [round(col, 1), round(row, 1)]
        s["in_grid"] = 0 <= col < w and 0 <= row < h
        if s["in_grid"]:
            inside.append(s)
    json.dump(stops, open(a.stops, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

    print(f"Toplam durak: {len(stops)} | kutu içinde: {len(inside)}")
    if inside:
        sols = [s["sol"] for s in inside]
        print(f"Kutu içi sol aralığı: {min(sols)}–{max(sols)} | site'lar: {sorted({s['site'] for s in inside})}")
        for s in inside[:5]:
            print(f"  {s['stop_id']}  sol {s['sol']}  px {s['px']}")

if __name__ == "__main__":
    main()
