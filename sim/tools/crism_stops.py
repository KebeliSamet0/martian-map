"""CRISM HYD browse -> sim/data/science_crism.json (footprint + bilim duraklarindaki piksel degerleri).

Girdi: sim/data/crism/frt0000b6f1_hyd.png (PDS MTRDR browse, 775x714, 18 m/px) + ENVI `map info`
(docs/data/crism_geology.md, PDS .hdr), layers/science_stops.json, contracts/grid.json.
Kural: yalniz dosyadan okunan degerler. R=SINDEX2, G=BD2100_2, B=BD1900_2 (HDR band adlari); 8-bit, goreli, mutlak degil.
Calistir: .venv/bin/python sim/tools/crism_stops.py
"""
import json, math
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
R = 3396190.0
MAP = {"x0": 8138478.6, "y0": -278195.96, "px_m": 18.0, "w": 775, "h": 714}   # FRT0000B6F1 HYD .hdr map info
grid = json.loads((ROOT / "contracts/grid.json").read_text())
ox, oy = grid["origin_xy_m"]; res = grid["res_m"]
stops = json.loads((ROOT / "layers/science_stops.json").read_text())
im = Image.open(ROOT / "sim/data/crism/frt0000b6f1_hyd.png").convert("RGBA")
assert im.size == (MAP["w"], MAP["h"])
deg = lambda v: math.degrees(v / R)

def crism_px(col, row):
    x, y = ox + col * res, oy - row * res
    return (x - MAP["x0"]) / MAP["px_m"], (MAP["y0"] - y) / MAP["px_m"]

def pix(i, j):
    i, j = int(math.floor(i)), int(math.floor(j))
    r, g, b, a = im.getpixel((i, j))
    return {"valid": a > 0, "SINDEX2": r, "BD2100_2": g, "BD1900_2": b} if a > 0 else {"valid": False}

out_stops = {}
for s in stops:
    i, j = crism_px(*s["px"])
    out_stops[s["id"]] = {"crism_px": [round(i, 2), round(j, 2)], **pix(i, j)}
c0 = crism_px(0, 0); c1 = crism_px(grid["width"], grid["height"])
data = {
    "_about": "Uretildi: sim/tools/crism_stops.py. Degerler PDS browse PNG'sinden okunan 8-bit goreli indeks (mutlak degil).",
    "product": {"id": "FRT0000B6F1", "date": "2008-07-09", "dataset": "MRO-M-CRISM-5-RDR-MPTARGETED-V1.0 (MTRDR, mrocr_4001, _MTR3)",
                "composite": "HYD", "bands": {"R": "SINDEX2", "G": "BD2100_2", "B": "BD1900_2"}, "px_m": MAP["px_m"], "size": [MAP["w"], MAP["h"]],
                "file": "data/crism/frt0000b6f1_hyd.png",
                "source_url": "https://pds-geosciences.wustl.edu/mro/mro-m-crism-5-rdr-mptargeted-v1/mrocr_4001/browse/2008/2008_191/frt0000b6f1/frt0000b6f1_07_brhydj_mtr3.png"},
    "map_info": MAP,
    "footprint_latlon": {"west": deg(MAP["x0"]), "east": deg(MAP["x0"] + MAP["w"] * MAP["px_m"]),
                         "north": deg(MAP["y0"]), "south": deg(MAP["y0"] - MAP["h"] * MAP["px_m"])},
    "grid_crop": {"col": [round(c0[0], 2), round(c1[0], 2)], "row": [round(c0[1], 2), round(c1[1], 2)]},
    "stops": out_stops,
}
# Izgara kutusundaki gecerli piksel orani
cc, rr = data["grid_crop"]["col"], data["grid_crop"]["row"]
tot = ok = 0
for j in range(int(rr[0]), int(math.ceil(rr[1]))):
    for i in range(int(cc[0]), int(math.ceil(cc[1]))):
        tot += 1; ok += im.getpixel((i, j))[3] > 0
data["grid_valid_fraction"] = round(ok / tot, 3); data["grid_crism_pixels"] = tot
(ROOT / "sim/data/science_crism.json").write_text(json.dumps(data, indent=1, ensure_ascii=False))
print(json.dumps(data["footprint_latlon"]), data["grid_crop"], data["grid_valid_fraction"], tot)
for k, v in out_stops.items(): print(k, v)
