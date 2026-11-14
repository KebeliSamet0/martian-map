# Sprint 3 (issue #47): Curiosity'nin izi ve demo koridoru duraklari -> sim/data/curiosity.json + sim/data/navcam/*.jpg
# - path_px: layers/msl_proposed_path.json (gercekte surulen yol, izgara icindeki kisim) ~5 m aralikla seyreltilmis.
# - stops: demo koridorundaki (msl_proposed_path indeks 430-701, gorevlerin S1/S2/S3 kesiti) panorama duraklari,
#   yol boyunca >= SPACING_M aralikla; her durak icin ufka en yakin bakan Navcam karesi (mast_el ~ -12 derece).
# - Fotograflar NASA/JPL ham goruntu adresinden (data/navcam/stops_3d.json url) indirilir, 640 px genislige kucultulur.
# Kullanim: python pipeline/export_curiosity.py <repo_koku> [onbellek_klasoru]
import io, json, math, pathlib, sys, tempfile, time, urllib.request
import numpy as np
from PIL import Image

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
CACHE = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else pathlib.Path(tempfile.gettempdir()) / "martian_navcam_cache"
SECTION = (430, 701)       # demo_scenarios.json curiosity_section birlesimi (S1 en genisi)
CORRIDOR_M = 15.0          # durak yola en fazla bu kadar uzak
SPACING_M = 25.0           # yol boyunca duraklar arasi en az mesafe
MIN_IMAGES = 15            # panorama duraklari (2 kareli surus sonu duraklari elenir)
PATH_STEP_M = 5.0
TARGET_EL = -12.0
WIDTH_PX, MAX_TOTAL_MB = 640, 15.0

g = json.loads((ROOT / "contracts/grid.json").read_text(encoding="utf-8")); res = g["res_m"]
path = np.array(json.loads((ROOT / "layers/msl_proposed_path.json").read_text(encoding="utf-8"))["path_px"], float)

# 1) yolu ~5 m aralikla seyrelt (ilk ve son nokta korunur)
keep, acc = [0], 0.0
for i in range(1, len(path)):
    acc += float(np.hypot(*(path[i] - path[i - 1]))) * res
    if acc >= PATH_STEP_M: keep.append(i); acc = 0.0
if keep[-1] != len(path) - 1: keep.append(len(path) - 1)
trail = path[keep]

# 2) koridor duraklari: kesitteki en yakin yol indeksine gore sirala, aralikla sec
sec = path[SECTION[0]:SECTION[1] + 1]
cum = np.concatenate([[0], np.cumsum(np.hypot(*np.diff(sec, axis=0).T)) * res])
stops = json.loads((ROOT / "data/navcam/stops_3d.json").read_text(encoding="utf-8"))
cand = []
for s in stops:
    d = np.hypot(*(sec - s["px"]).T) * res; i = int(d.argmin())
    if d[i] <= CORRIDOR_M and len(s["images"]) >= MIN_IMAGES:
        cand.append((cum[i], s))
cand.sort(key=lambda t: t[0])
chosen = []
for along, s in cand:
    if not chosen or along - chosen[-1][0] >= SPACING_M: chosen.append((along, s))

# 3) fotograflar
out_dir = ROOT / "sim/data/navcam"; out_dir.mkdir(parents=True, exist_ok=True); CACHE.mkdir(parents=True, exist_ok=True)
for old in out_dir.glob("*.jpg"): old.unlink()


def fetch(url):
    f = CACHE / url.rsplit("/", 1)[-1]
    if not f.exists():
        for k in range(4):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "martian-map-spaceapps/0.1"})
                f.write_bytes(urllib.request.urlopen(req, timeout=60).read()); break
            except Exception:
                if k == 3: raise
                time.sleep(2 * (k + 1))
    return f.read_bytes()


out, total = [], 0
for along, s in chosen:
    img = min(s["images"], key=lambda im: abs(im["mast_el_deg"] - TARGET_EL))
    im = Image.open(io.BytesIO(fetch(img["url"]))).convert("L")
    im = im.resize((WIDTH_PX, round(im.height * WIDTH_PX / im.width)), Image.LANCZOS)
    name = f"{s['stop_id']}.jpg"; buf = io.BytesIO(); im.save(buf, "JPEG", quality=80, optimize=True)
    (out_dir / name).write_bytes(buf.getvalue()); total += len(buf.getvalue())
    out.append({"id": s["stop_id"], "sol": s["sol"], "px": s["px"], "photo": f"navcam/{name}",
                "photo_world_az_deg": img.get("world_az_deg"), "photo_source": img["url"], "along_m": round(float(along))})
assert total / 1e6 < MAX_TOTAL_MB, f"fotograflar {total / 1e6:.1f} MB"

(ROOT / "sim/data/curiosity.json").write_text(json.dumps({
    "description": "Curiosity'nin bu izgarada gercekte surdugu yol ve demo koridorundaki Navcam duraklari (issue #47).",
    "source": "layers/msl_proposed_path.json (NASA/JPL MMGIS traverse); data/navcam/stops_3d.json (NASA/JPL ham goruntuler, Veysel)",
    "px_note": "px = [sutun, satir] ondalikli, contracts/grid.json izgarasi; donusum sim/app/api.js pxToWorld",
    "credit": "Navcam: NASA/JPL-Caltech (ham, kalibre edilmemis)",
    "path_step_m": PATH_STEP_M,
    "path_px": [[round(float(c), 2), round(float(r), 2)] for c, r in trail],
    "stops": out}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
print(f"yol {len(path)} -> {len(trail)} nokta (~{PATH_STEP_M:.0f} m), aday durak {len(cand)}, secilen {len(out)}, fotograflar {total / 1e6:.2f} MB")
