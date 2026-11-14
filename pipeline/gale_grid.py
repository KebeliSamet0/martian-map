# Kapi 1 (issue #19): Gale boxwork 2x2 km -> layers/{elevation,slope}[_norm].npy, layers/ortho_*.png, contracts/grid.json
# Calistirma (Colab): !pip -q install rasterio  ->  !python pipeline/gale_grid.py  (repo kokunde). Cikti repo koku altina yazilir.
import json, os, urllib.request, numpy as np, rasterio
from rasterio.windows import Window
from rasterio.transform import from_origin
from pyproj import CRS, Transformer
from PIL import Image

BASE = "/vsicurl/https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/"
DEM, ORT = BASE + "MSL_Gale_DEM_Mosaic_1m_v3.tif", BASE + "MSL_Gale_Orthophoto_Mosaic_25cm_v3.tif"
LAT, LON, HALF, RES, N = -4.805, 137.382, 1000.0, 2.0, 1000  # merkez, yari kenar (m), izgara (m), izgara boyu
OUT = os.environ.get("OUT", ".")  # repo koku
for d_ in ("layers", "contracts", "bora"): os.makedirs(f"{OUT}/{d_}", exist_ok=True)

# 1) Kutuyu DEM piksel kenarina hizala, 2000x2000 @1 m oku
with rasterio.open(DEM) as d:
    crs = CRS.from_wkt(d.crs.to_wkt()); proj4 = d.crs.to_proj4(); T = d.transform
    tf = Transformer.from_crs(crs.geodetic_crs, crs, always_xy=True)
    cx, cy = tf.transform(LON, LAT)
    col0, row0 = round((cx - HALF - T.c) / T.a), round((T.f - (cy + HALF)) / -T.e)
    x0, y0 = T.c + col0 * T.a, T.f + row0 * T.e  # izgaranin sol ust kosesi (piksel kenari)
    z = d.read(1, window=Window(col0, row0, 2 * N, 2 * N), masked=True).astype("float32")
assert z.shape == (2 * N, 2 * N) and not np.ma.getmaskarray(z).any(), "kesitte nodata var"
inv = Transformer.from_crs(crs, crs.geodetic_crs, always_xy=True)
x1, y1 = x0 + N * RES, y0 - N * RES
corners = {k: [round(v, 6) for v in inv.transform(x, y)[::-1]] for k, (x, y) in {"NW": (x0, y0), "NE": (x1, y0), "SW": (x0, y1), "SE": (x1, y1)}.items()}
print("ORIGIN_xy_m", x0, y0, "| CORNERS [lat, lon]", corners)

# 2) 2 m: 2x2 blok ortalamasi, egim (derece)
elev = z.filled(np.nan).reshape(N, 2, N, 2).mean(axis=(1, 3)).astype("float32")
gy, gx = np.gradient(elev.astype("float64"), RES)
slope = np.degrees(np.arctan(np.hypot(gx, gy))).astype("float32")
assert np.isfinite(elev).all() and np.isfinite(slope).all()
np.save(f"{OUT}/layers/elevation.npy", elev); np.save(f"{OUT}/layers/slope.npy", slope)
print(f"ELEV min {elev.min():.1f} max {elev.max():.1f} | SLOPE mean {slope.mean():.1f} median {np.median(slope):.1f} max {slope.max():.1f}")

# 3) Dogrulama: Curiosity waypoint yuksekligi vs DEM (yon/kayma hatasini yakalar)
wp = json.load(urllib.request.urlopen(urllib.request.Request("https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json", headers={"User-Agent": "martian-map-spaceapps/0.1"})))["features"]
diffs = []
for f in wp:
    p = f["properties"]; c, r = int((p["easting"] - x0) // RES), int((y0 - p["northing"]) // RES)
    if 0 <= c < N and 0 <= r < N: diffs.append(elev[r, c] - p["elev_geoid"])
diffs = np.array(diffs)
print(f"WAYPOINT_CHECK n={diffs.size} DEM-rover median {np.median(diffs):+.1f} m, |fark| p90 {np.percentile(abs(diffs), 90):.1f} m")
assert diffs.size > 50 and np.percentile(abs(diffs), 90) < 30, "DEM ile rover yuksekligi uyusmuyor: izgara kaymis/ters olabilir"

# 4) Ortofoto: ayni sinirlar, 25 cm (Bora icin GeoTIFF) + izgaraya hizali PNG'ler
with rasterio.open(ORT) as o:
    U = o.transform; oc, orow = round((x0 - U.c) / U.a), round((U.f - y0) / -U.e)
    ox0, oy0 = U.c + oc * U.a, U.f + orow * U.e  # ortofotonun kendi piksel kenari; DEM izgarasindan en fazla yarim piksel (12,5 cm) kayar
    print(f"ORTHO_SHIFT dx {ox0 - x0:+.3f} m dy {oy0 - y0:+.3f} m")
    assert abs(ox0 - x0) <= 0.125 and abs(oy0 - y0) <= 0.125
    ortho = o.read(1, window=Window(oc, orow, 8 * N, 8 * N))
    prof = dict(driver="GTiff", width=8 * N, height=8 * N, count=1, dtype="uint8", crs=o.crs, compress="deflate", tiled=True,
                transform=from_origin(ox0, oy0, U.a, -U.e))
with rasterio.open(f"{OUT}/bora/ortho_25cm.tif", "w", **prof) as w: w.write(ortho, 1)
blk = lambda a, k: a.reshape(a.shape[0] // k, k, a.shape[1] // k, k).mean(axis=(1, 3)).round().astype("uint8")
Image.fromarray(blk(ortho, 8)).save(f"{OUT}/layers/ortho_2m.png", optimize=True)   # 1000x1000 = izgara
Image.fromarray(blk(ortho, 4)).save(f"{OUT}/layers/ortho_1m.png", optimize=True)   # 2000x2000 (3D doku)
print("ORTHO", ortho.shape, "zero%", round(float((ortho == 0).mean() * 100), 3))

# 5) grid.json (sozlesme alanlari + gercek degerler)
grid = {
    "region": "Gale / Mount Sharp boxwork bolgesi (Curiosity sol ~4459-4983)",
    "width": N, "height": N, "res_m": RES,
    "origin_xy_m": [x0, y0],
    "crs": proj4,
    "crs_note": "origin_xy_m = izgaranin sol ust kosesi (piksel kenari), kaynak DTM projeksiyonunda. px = [sutun, satir]; sutun = (x - origin_x) / res_m, satir = (origin_y - y) / res_m; hucre indeksi = floor. MMGIS waypoint easting/northing ayni projeksiyonda. Frontend piksel uzayinda (Leaflet CRS.Simple).",
    "corners_latlon": corners,
    "source": {"dem": "USGS MSL Gale Merged DEM 1m v3 (2x2 blok ortalamasi)", "ortho": "USGS MSL Gale Merged Orthophoto 25cm v3"},
    "layers": {
        "elevation": "layers/elevation.npy  float32, metre",
        "slope": "layers/slope.npy  float32, derece",
        "ortho": "layers/ortho_2m.png  uint8 gri, 1000x1000 (izgaraya hizali); layers/ortho_1m.png 2000x2000",
        "rock_cfa": "layers/rock_cfa.npy  float32, 0-1 (kayalarin kapladigi alan orani)",
        "thermal_inertia": "layers/thermal_inertia.npy  float32, TIU (opsiyonel)",
        "p_soil": "layers/p_soil.npy  float32, 0-1",
        "p_bedrock": "layers/p_bedrock.npy  float32, 0-1",
        "p_sand": "layers/p_sand.npy  float32, 0-1",
        "p_bigrock": "layers/p_bigrock.npy  float32, 0-1",
        "entropy": "layers/entropy.npy  float32, 0-1 (model belirsizligi, 1 = hic emin degil)",
        "science": "layers/science_stops.json  bilim duraklari listesi",
    },
}
json.dump(grid, open(f"{OUT}/contracts/grid.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# 6) Normalize (0-1, min-max): ham katmanlar kalir, *_norm yanina; parametreler grid.json'da
norm = {}
for k, a in (("elevation", elev), ("slope", slope)):
    lo, hi = float(a.min()), float(a.max()); n = ((a - lo) / (hi - lo)).astype("float32")
    assert 0 <= n.min() and n.max() <= 1
    np.save(f"{OUT}/layers/{k}_norm.npy", n); norm[k] = {"method": "min-max", "min": lo, "max": hi}
    grid["layers"][f"{k}_norm"] = f"layers/{k}_norm.npy  float32, 0-1 (min-max; gercek deger = v*(max-min)+min, bkz. normalization)"
grid["normalization"] = norm
json.dump(grid, open(f"{OUT}/contracts/grid.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("NORM", norm); print("KAPI1_DONE  (bora/ortho_25cm.tif repoya girmez)")
