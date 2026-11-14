# Kapi 2 (issue #19): Veysel'in 128 duragindan Emre icin 15-20 durak sec -> layers/rover_stops_selected.json
# Kullanim: python pipeline/select_rover_stops.py <repo_koku> <Veysel rover_stops.json> <fetch_navcam.py index.csv>
# Yontem: grid.json origin'iyle px yeniden hesapla, en uzak nokta orneklemesi (mekansal yayilim), durak basina
# zemine en cok bakan (mast_el en negatif) 2-3 tam kare Navcam URL'si.
import csv, json, sys
import numpy as np

REPO, STOPS, INDEX, K = sys.argv[1], sys.argv[2], sys.argv[3], 18
g = json.load(open(f"{REPO}/contracts/grid.json", encoding="utf-8"))
(x0, y0), res, N = g["origin_xy_m"], g["res_m"], g["width"]
slope = np.load(f"{REPO}/layers/slope.npy")
S = json.load(open(STOPS, encoding="utf-8"))
for s in S:
    s["px"] = [round((s["easting"] - x0) / res, 2), round((y0 - s["northing"]) / res, 2)]  # [sutun, satir], ondalikli
    assert 0 <= s["px"][0] < N and 0 <= s["px"][1] < N, s["stop_id"]

imgs = {}
for r in csv.DictReader(open(INDEX, encoding="utf-8")):
    imgs.setdefault((int(r["site"]), int(r["drive"])), []).append((float(r["mast_el"] or 0), r["url"]))
cand = [s for s in S if len(imgs.get((s["site"], s["drive"]), [])) >= 2]

P = np.array([s["px"] for s in cand])
c = P.mean(axis=0); pick = [int(np.argmin(((P - c) ** 2).sum(1)))]  # merkeze en yakin durakla basla
dmin = ((P - P[pick[0]]) ** 2).sum(1)
while len(pick) < K:
    i = int(np.argmax(dmin)); pick.append(i); dmin = np.minimum(dmin, ((P - P[i]) ** 2).sum(1))

out = []
for i in sorted(pick, key=lambda i: (cand[i]["sol"], cand[i]["drive"])):
    s = cand[i]; best = sorted(imgs[(s["site"], s["drive"])])[:3]
    col, row = int(s["px"][0]), int(s["px"][1])
    out.append({"stop_id": s["stop_id"], "sol": s["sol"], "px": s["px"], "images": [u for _, u in best],
                "class_frac": None, "entropy": None,
                "site": s["site"], "drive": s["drive"], "lat": s["lat"], "lon": s["lon"],
                "easting": s["easting"], "northing": s["northing"], "loc_source": s.get("loc_source"),
                "slope_deg": round(float(slope[row, col]), 1), "images_mast_el": [e for e, _ in best]})

# oz-kontrol
assert 15 <= len(out) <= 20 and len({o["stop_id"] for o in out}) == len(out)
assert all(2 <= len(o["images"]) <= 3 and all(u.startswith("https://") for u in o["images"]) for o in out)
Q = np.array([o["px"] for o in out]); D = np.sqrt(((Q[:, None] - Q[None]) ** 2).sum(-1)) + np.eye(len(Q)) * 1e9
allP = np.array([s["px"] for s in S]); far = np.sqrt(((allP[:, None] - Q[None]) ** 2).sum(-1)).min(1)
print(f"secilen {len(out)} / {len(S)} | site {sorted({o['site'] for o in out})} | sol {out[0]['sol']}-{out[-1]['sol']}")
print(f"secilenler arasi min mesafe {D.min() * res:.0f} m | 128 duragin en yakin secilene uzakligi: maks {far.max() * res:.0f} m, medyan {np.median(far) * res:.0f} m")
print("egim (derece):", sorted(o["slope_deg"] for o in out))
json.dump(out, open(f"{REPO}/layers/rover_stops_selected.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
