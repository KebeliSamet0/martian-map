"""Kapi 1: Elif Rana'nin 2x2 km izgarasina (contracts/grid.json) hizali 25 cm ortofoto indirir.

grid.json'daki origin_xy_m (sol ust kose) ve boyut (width*res_m) kullanilir; boylece
rock_cfa.npy hucreleri elevation/slope ile birebir ayni yere oturur.

Kullanim:
  python ml/orbital/fetch_grid_ortho.py --grid data/raw/grid_kapi1.json --out data/raw/gale_2x2km_25cm.tif
"""
import argparse, json, time
import numpy as np
import rasterio
from rasterio.transform import from_origin
from rasterio.windows import Window

URL = "/vsicurl/https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/MSL_Gale_Orthophoto_Mosaic_25cm_v3.tif"

p = argparse.ArgumentParser()
p.add_argument("--grid", required=True)
p.add_argument("--out", required=True)
a = p.parse_args()

g = json.load(open(a.grid, encoding="utf-8"))
x0, y0 = g["origin_xy_m"]
side_m = g["width"] * g["res_m"]
env = dict(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", GDAL_HTTP_MULTIRANGE="YES",
           GDAL_HTTP_MERGE_CONSECUTIVE_RANGES="YES")
t = time.time()
with rasterio.Env(**env), rasterio.open(URL) as ds:
    U = ds.transform
    n = round(side_m / U.a)  # 2000 m / 0.25 = 8000 px
    c0, r0 = round((x0 - U.c) / U.a), round((U.f - y0) / -U.e)
    ox0, oy0 = U.c + c0 * U.a, U.f + r0 * U.e
    print(f"pencere {n}x{n} px, ortofoto-izgara kaymasi dx {ox0 - x0:+.3f} m dy {oy0 - y0:+.3f} m")
    assert abs(ox0 - x0) <= 0.125 and abs(oy0 - y0) <= 0.125, "izgara ile ortofoto hizalanmiyor"
    arr = ds.read(1, window=Window(c0, r0, n, n))
    prof = dict(driver="GTiff", width=n, height=n, count=1, dtype=arr.dtype, crs=ds.crs,
                compress="deflate", tiled=True, transform=from_origin(ox0, oy0, U.a, -U.e))
with rasterio.open(a.out, "w", **prof) as dst:
    dst.write(arr, 1)
print(f"yazildi {a.out}  {arr.shape}  {time.time()-t:.0f} s  bos piksel%={(arr==0).mean()*100:.3f}")
