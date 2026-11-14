"""USGS MSL Gale 25 cm ortofoto mozaiginden kucuk bir kesit indirir (23 GB'i indirmeden).

Kullanim:  python ml/orbital/fetch_crop.py --lat -4.80 --lon 137.38 --size 1500 --out data/raw/gale_test.tif
"""
import argparse, math, time
import rasterio
from rasterio.windows import Window

URL = "/vsicurl/https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/MSL_Gale_Orthophoto_Mosaic_25cm_v3.tif"
R_MARS = 3396190.0  # mozaigin kullandigi kure yaricapi (etiketten)

p = argparse.ArgumentParser()
p.add_argument("--lat", type=float, required=True)
p.add_argument("--lon", type=float, required=True)
p.add_argument("--size", type=int, default=1500, help="kenar uzunlugu, piksel (0.25 m/px)")
p.add_argument("--out", required=True)
a = p.parse_args()

x, y = R_MARS * math.radians(a.lon), R_MARS * math.radians(a.lat)
env = dict(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", GDAL_HTTP_MULTIRANGE="YES",
           GDAL_HTTP_MERGE_CONSECUTIVE_RANGES="YES")
t = time.time()
with rasterio.Env(**env), rasterio.open(URL) as ds:
    r, c = ds.index(x, y)
    win = Window(c - a.size // 2, r - a.size // 2, a.size, a.size)
    arr = ds.read(1, window=win)
    prof = ds.profile.copy()
    prof.update(width=a.size, height=a.size, transform=ds.window_transform(win),
                tiled=False, compress="deflate", blockxsize=None, blockysize=None)
with rasterio.open(a.out, "w", **{k: v for k, v in prof.items() if v is not None}) as dst:
    dst.write(arr, 1)
print(f"yazildi {a.out}  {arr.shape}  {time.time()-t:.0f} s  nodata%={(arr==0).mean():.3f}")
