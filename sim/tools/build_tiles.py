"""Gale / Mount Sharp NW: HiRISE DTM + HiRISE renkli ortofoto mozaiğinden LOD'lu döşeme piramidi üretir.

Kaynaklar (ikisi de COG, yalnız gereken bloklar HTTP aralık okumasıyla alınır):
  DTM : DTEEC_019698_1750_019988_1750_U01 (HiRISE/UA, USGS)   ~1.0117 m/px, areoid yüksekliği, Float32
  Renk: MSL_Gale_HiRISE-LRGB_78quads_sharp_cog (USGS)          0.25 m/px, JPEG-YCbCr RGB
Çıktı (sim/data/tiles/):
  manifest.json            kapsama, koordinat, seviye ve döşeme listesi
  h/{k}/{cx}_{cy}.u16      131x131 uint16 (128 hücre + 1 taşma + 1 kenar boşluğu); 0 = veri yok
  t/{k}/{cx}_{cy}.jpg      256x256 renkli doku (128 hücrelik alanı birebir kaplar)
  nav.u16                  tüm alan, 4 hücre aralıklı (≈4 m) yükseklik (yol bulma)
  overview.jpg             tüm alanın küçük renkli görüntüsü (harita katmanı)
Tekrar çalıştırılabilir: var olan dosyalar atlanır.

Kullanım (rasterio, numpy, pillow):
  python -I sim/tools/build_tiles.py [--out sim/data/tiles] [--work <geçici klasör>] [--threads 8] [--max-k K]
Koordinat: Mars küresi R=3396190 m, ekvatoral equirectangular (x=R*lon, y=R*lat). Dünya metresi: doğu-batı ölçeği cos(lat0)
ile çarpılır (kutup yönünde pikseller kare değildir), manifest'te res_x_m / res_z_m olarak yazılır.
"""
import argparse
import json
import math
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import rasterio
from PIL import Image
from rasterio.enums import Resampling
from rasterio.windows import Window

R = 3396190.0
DTM_ID = "DTEEC_019698_1750_019988_1750_U01"
DTM_URL = ("https://astrogeo-ard.s3-us-west-2.amazonaws.com/mars/mro/hirise/controlled/dtm/"
           "ESP_019698_1750_ESP_019988_1750/" + DTM_ID + ".tif")
LRGB_URL = "https://asc-pds-services.s3.us-west-2.amazonaws.com/mosaic/Mars/MSL/MSL_Gale_HiRISE-LRGB_78quads_sharp_cog.tif"
CH, TS_UP, TS_L0, NAV_K = 128, 256, 512, 2   # doku: L0 → 512 px (0.25 m/px), diğer seviyeler 256 px
ZMIN, ZSTEP = -4400.0, 0.05          # uint16: q = round((z-ZMIN)/ZSTEP), 0 = veri yok
ENV = dict(GDAL_HTTP_MAX_RETRY="4", GDAL_HTTP_RETRY_DELAY="1", VSI_CACHE="TRUE", VSI_CACHE_SIZE="200000000",
           GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif", GDAL_HTTP_MULTIPLEX="YES")
LOCAL = threading.local()


def log(*a):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")   # Windows cp1254 konsolu
    print(time.strftime("%H:%M:%S"), *a, flush=True)


def down(a):
    """2x2 ortalama; geçersiz (0) hücreler sayılmaz. Bellek için şerit şerit."""
    h, w = a.shape
    H2, W2 = (h + 1) // 2, (w + 1) // 2
    out = np.zeros((H2, W2), np.uint16)
    for r in range(0, H2, 512):
        r1 = min(H2, r + 512)
        blk = np.zeros(((r1 - r) * 2, W2 * 2), np.float32)
        src = a[r * 2:min(h, r1 * 2)]
        blk[:src.shape[0], :src.shape[1]] = src
        b = blk.reshape(r1 - r, 2, W2, 2)
        n = (b > 0).sum(axis=(1, 3))
        s = b.sum(axis=(1, 3))
        out[r:r1] = np.where(n > 0, np.rint(s / np.maximum(n, 1)), 0).astype(np.uint16)
    return out


def extract(arr, k_cx, k_cy):
    """131x131 pencere (kenarlarda 1 örnek taşma), sınır dışı 0."""
    h, w = arr.shape
    out = np.zeros((CH + 3, CH + 3), np.uint16)
    r0, c0 = k_cy * CH - 1, k_cx * CH - 1
    rr0, cc0 = max(r0, 0), max(c0, 0)
    rr1, cc1 = min(r0 + CH + 3, h), min(c0 + CH + 3, w)
    if rr1 > rr0 and cc1 > cc0:
        out[rr0 - r0:rr1 - r0, cc0 - c0:cc1 - c0] = arr[rr0:rr1, cc0:cc1]
    return out


def lrgb():
    if not hasattr(LOCAL, "ds"):
        LOCAL.env = rasterio.Env(**ENV)
        LOCAL.env.__enter__()
        LOCAL.ds = rasterio.open(LRGB_URL)
    return LOCAL.ds


def make_texture(task):
    k, cx, cy, geo, out = task
    path = out / "t" / str(k) / f"{cx}_{cy}.jpg"
    if path.exists():
        return (k, cx, cy, 1)
    ds = lrgb()
    TS = TS_L0 if k == 0 else TS_UP                                       # en ince seviye kaynağın 0.25 m çözünürlüğünde
    span = CH * (2 ** k) * geo["res_p"]                                   # proje metre
    xa, yt = geo["x0"] + cx * span, geo["ytop"] - cy * span
    # Pencere LRGB piksel uzayında; yalnız veri sınırı içindeki kesişim okunur (boundless/WarpedVRT büyük küçültmede çok yavaş),
    # sonuç 256x256 tuvale yerleştirilir (sınır dışı siyah = veri yok).
    c0, r0 = (xa - ds.bounds.left) / ds.res[0], (ds.bounds.top - yt) / ds.res[1]
    cw, rh = span / ds.res[0], span / ds.res[1]
    ic0, ir0, ic1, ir1 = max(c0, 0.0), max(r0, 0.0), min(c0 + cw, float(ds.width)), min(r0 + rh, float(ds.height))
    if ic1 - ic0 < 1 or ir1 - ir0 < 1:
        return (k, cx, cy, 0)
    ox, oy = round((ic0 - c0) / cw * TS), round((ir0 - r0) / rh * TS)
    ow, oh = max(1, min(TS - ox, round((ic1 - ic0) / cw * TS))), max(1, min(TS - oy, round((ir1 - ir0) / rh * TS)))
    try:
        part = ds.read(window=Window(ic0, ir0, ic1 - ic0, ir1 - ir0), out_shape=(3, oh, ow),
                       resampling=Resampling.bilinear if k == 0 else Resampling.average)
    except Exception as e:  # noqa: BLE001
        log("doku hatası", k, cx, cy, e)
        return (k, cx, cy, 0)
    a = np.zeros((3, TS, TS), np.uint8)
    a[:, oy:oy + oh, ox:ox + ow] = part
    if a.mean() < 3:
        return (k, cx, cy, 0)
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.moveaxis(a, 0, -1)).save(path, quality=86, optimize=True)
    return (k, cx, cy, 1)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=str(Path(__file__).resolve().parent.parent / "data" / "tiles"))
    ap.add_argument("--work", default=None)
    ap.add_argument("--threads", type=int, default=8)
    ap.add_argument("--max-k", type=int, default=None)
    ap.add_argument("--no-texture", action="store_true")
    args = ap.parse_args()
    out = Path(args.out)
    work = Path(args.work) if args.work else out.parent / "_work"
    for p in (out / "h", out / "t", work):
        p.mkdir(parents=True, exist_ok=True)

    with rasterio.Env(**ENV):
        d, l = rasterio.open(DTM_URL), rasterio.open(LRGB_URL)
        res = d.res[0]
        X0, X1 = max(d.bounds.left, l.bounds.left), min(d.bounds.right, l.bounds.right)
        YT, YB = min(d.bounds.top, l.bounds.top), max(d.bounds.bottom, l.bounds.bottom)
        col0 = math.ceil((X0 - d.bounds.left) / res)
        row0 = math.ceil((d.bounds.top - YT) / res)
        x0, ytop = d.bounds.left + col0 * res, d.bounds.top - row0 * res
        W, H = int((X1 - x0) // res), int((ytop - YB) // res)
        lat0 = math.degrees((ytop - H * res / 2) / R)
        cosl = math.cos(math.radians(lat0))
        log(f"alan {W}x{H} piksel ≈ {W * res / 1000:.2f} x {H * res / 1000:.2f} km, lat0={lat0:.3f}")

        # --- Yükseklik: L0 memmap ---
        l0p = work / f"L0_{W}x{H}.u16"
        done = work / f"L0_{W}x{H}.done"
        L0 = np.memmap(l0p, dtype=np.uint16, mode="r+" if l0p.exists() else "w+", shape=(H, W))
        if not done.exists():
            for r in range(0, H, 512):
                rows = min(512, H - r)
                z = d.read(1, window=Window(col0, row0 + r, W, rows), boundless=True, fill_value=-3.4e38).astype(np.float32)
                ok = np.isfinite(z) & (z > -1e6)
                q = np.clip(np.rint((z - ZMIN) / ZSTEP), 1, 65535).astype(np.uint16)
                L0[r:r + rows] = np.where(ok, q, 0)
                if (r // 512) % 4 == 0:
                    log(f"DTM {r}/{H}")
            L0.flush()
            done.write_text("ok")
        valid = L0[::8, ::8] > 0
        log(f"DTM geçerli oran (örnek) {valid.mean():.3f}")

        K = max(1, math.ceil(math.log2(max(W, H) / CH)))
        if args.max_k is not None:
            K = min(K, args.max_k)
        levels = [np.asarray(L0)]
        for k in range(1, K + 1):
            levels.append(down(levels[-1]))
            log(f"seviye {k}: {levels[-1].shape}")

        # --- Yükseklik döşemeleri ---
        meta_levels, tex_tasks = [], []
        geo = dict(res_p=res, x0=x0, ytop=ytop)
        for k, arr in enumerate(levels):
            nx = max(1, math.ceil((arr.shape[1] - 1) / CH))
            ny = max(1, math.ceil((arr.shape[0] - 1) / CH))
            present = []
            (out / "h" / str(k)).mkdir(parents=True, exist_ok=True)
            for cy in range(ny):
                for cx in range(nx):
                    t = extract(arr, cx, cy)
                    if not t[1:CH + 2, 1:CH + 2].any():
                        continue
                    f = out / "h" / str(k) / f"{cx}_{cy}.u16"
                    if not f.exists():
                        f.write_bytes(t.astype("<u2").tobytes())
                    present.append([cx, cy])
                    tex_tasks.append((k, cx, cy, geo, out))
            meta_levels.append(dict(k=k, nx=nx, ny=ny, cell_p=res * 2 ** k, chunks=present))
            log(f"seviye {k}: {len(present)} yükseklik döşemesi")
        nav = levels[NAV_K]
        (out / "nav.u16").write_bytes(nav.astype("<u2").tobytes())

        # --- Renkli doku döşemeleri (çok iş parçacıklı, kaldığı yerden devam) ---
        tex_flags = {}
        if not args.no_texture:
            # kaba seviyeler önce (hızlı, harita hemen görünür), ince seviyeler sonra
            tex_tasks.sort(key=lambda t: -t[0])
            t0 = time.time()
            with ThreadPoolExecutor(args.threads) as ex:
                for i, (k, cx, cy, ok) in enumerate(ex.map(make_texture, tex_tasks), 1):
                    tex_flags[(k, cx, cy)] = ok
                    if i % 100 == 0 or i == len(tex_tasks):
                        el = time.time() - t0
                        log(f"doku {i}/{len(tex_tasks)}  {el / i:.2f} sn/döşeme  kalan ≈ {(len(tex_tasks) - i) * el / i / 60:.1f} dk")
        else:
            for k, cx, cy, *_ in tex_tasks:
                tex_flags[(k, cx, cy)] = 1 if (out / "t" / str(k) / f"{cx}_{cy}.jpg").exists() else 0
        for m in meta_levels:
            m["chunks"] = [[cx, cy, int(tex_flags.get((m["k"], cx, cy), 0))] for cx, cy in m["chunks"]]

        # --- Genel bakış görüntüsü ---
        span_x, span_y = W * res, H * res
        ow = 1280
        oh = int(ow * span_y / span_x)
        win = Window((x0 - l.bounds.left) / l.res[0], (l.bounds.top - ytop) / l.res[1], span_x / l.res[0], span_y / l.res[1])
        log("genel bakış okunuyor", ow, "x", oh)
        a = l.read(window=win, out_shape=(3, oh, ow), resampling=Resampling.average)   # bölge LRGB sınırları içinde: boundless gerekmez (yavaş)
        Image.fromarray(np.moveaxis(a, 0, -1)).save(out / "overview.jpg", quality=85)

        z_valid = L0[::16, ::16][L0[::16, ::16] > 0]
        manifest = dict(
            version=1, R=R, res_p=res, lat0=lat0, res_x_m=res * cosl, res_z_m=res,
            W=W, H=H, chunk_cells=CH, border=1, tex_size=TS_UP, tex_size_l0=TS_L0, levels=len(levels),
            zmin=ZMIN, zstep=ZSTEP, z_min_data=float(ZMIN + z_valid.min() * ZSTEP), z_max_data=float(ZMIN + z_valid.max() * ZSTEP),
            origin_proj=dict(x0=x0, ytop=ytop),
            bounds_lonlat=dict(w=math.degrees(x0 / R), e=math.degrees((x0 + W * res) / R),
                               n=math.degrees(ytop / R), s=math.degrees((ytop - H * res) / R)),
            nav=dict(file="nav.u16", k=NAV_K, w=int(nav.shape[1]), h=int(nav.shape[0])),
            overview=dict(file="overview.jpg", w=ow, h=oh),
            level_meta=meta_levels,
            sources=dict(dtm=dict(id=DTM_ID, url=DTM_URL), color=dict(name="MSL_Gale_HiRISE-LRGB_78quads_sharp_cog", url=LRGB_URL)),
            credit="NASA/JPL/University of Arizona (HiRISE); USGS Astrogeology Science Center",
            notes=["Yükseklik areoid (MOLA'ya bağlı) metre; 0 = veri yok.",
                   "Doku: HiRISE RED mozaiği + renk şeritleri, USGS 'sharp' LRGB; JPEG q86; keskinleştirme ve renk dengesi kaynakta uygulanmış.",
                   "Doğu-batı ölçeği cos(lat0) ile düzeltildi; yüksek enlemlerde yetersiz."],
        )
        (out / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
        log("bitti:", json.dumps({k: manifest[k] for k in ("W", "H", "levels", "bounds_lonlat", "z_min_data", "z_max_data")}))


if __name__ == "__main__":
    main()
