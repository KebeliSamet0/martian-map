"""rover_stops.json'a MSL_waypoints.json'dan lat/lon/easting/northing ekler.
Eşleşme önce (site, drive) ile; yoksa site orijini (drive 0) + xyz_site_m ile."""
import argparse, json, math, os, urllib.request

URL = "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json"
R_MARS = 3396190.0
HOME = os.path.join(os.path.expanduser("~"), "Documents", "msl_data")

def get(d, k):
    for key, v in d.items():
        if key.lower() == k:
            return v
    return None

def records(data):
    if isinstance(data, dict) and "features" in data:
        for f in data["features"]:
            p = dict(f.get("properties") or {})
            geo = f.get("geometry") or {}
            if geo.get("type") == "Point" and get(p, "lat") is None:
                p["lon"], p["lat"] = geo["coordinates"][0], geo["coordinates"][1]
            yield p
    elif isinstance(data, list):
        yield from data

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dir", default=HOME)
    ap.add_argument("--inspect", action="store_true", help="İlk kaydı göster ve çık")
    a = ap.parse_args()
    wp_path = os.path.join(a.dir, "MSL_waypoints.json")
    if not os.path.exists(wp_path):
        print("Waypoint dosyası indiriliyor...")
        req = urllib.request.Request(URL, headers={"User-Agent": "martian-map-spaceapps/0.1"})
        with urllib.request.urlopen(req, timeout=60) as r, open(wp_path, "wb") as f:
            f.write(r.read())
    data = json.load(open(wp_path, encoding="utf-8"))
    recs = list(records(data))
    if a.inspect:
        print(f"{len(recs)} kayıt. İlk kayıt:\n{json.dumps(recs[0], indent=2, ensure_ascii=False)}")
        return
    wp = {}
    for p in recs:
        try:
            wp[(int(get(p, "site")), int(get(p, "drive")))] = {
                k: float(get(p, k)) for k in ("lat", "lon", "easting", "northing")}
        except (TypeError, ValueError):
            continue
    stops_path = os.path.join(a.dir, "rover_stops.json")
    stops = json.load(open(stops_path, encoding="utf-8"))
    n_exact = n_orig = n_none = 0
    for s in stops:
        key = (s["site"], s["drive"])
        if key in wp:
            s.update(wp[key]); s["loc_source"] = "waypoint"; n_exact += 1
        elif (s["site"], 0) in wp and s.get("xyz_site_m"):
            o = wp[(s["site"], 0)]
            x, y = s["xyz_site_m"][0], s["xyz_site_m"][1]   # site çerçevesi: x=kuzey, y=doğu (varsayım)
            s["northing"], s["easting"] = o["northing"] + x, o["easting"] + y
            s["lat"] = o["lat"] + math.degrees(x / R_MARS)
            s["lon"] = o["lon"] + math.degrees(y / (R_MARS * math.cos(math.radians(o["lat"]))))
            s["loc_source"] = "origin+xyz"; n_orig += 1
        else:
            s["loc_source"] = None; n_none += 1
    json.dump(stops, open(stops_path, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"Waypoint kaydı: {len(wp)} | durak: {len(stops)}")
    print(f"Doğrudan eşleşme: {n_exact} | orijin+xyz: {n_orig} | konumsuz: {n_none}")
    for s in stops[:3]:
        print(s["stop_id"], s.get("lat"), s.get("lon"), s.get("loc_source"))

if __name__ == "__main__":
    main()
