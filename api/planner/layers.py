"""Katmanları yükler. Gerçek katmanlar yoksa sahte (sentetik) katman üretir.

Gerçek veri: `layers/grid.json` + `layers/*.npy` (contracts/grid.example.json formatı).
Sahte veri: yaklaşık 2×2 km, Mount Sharp eteğine benzeyen kuzeye yükselen arazi.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from scipy import ndimage

from . import params as P

REPO = Path(__file__).resolve().parents[2]
LAYERS_DIR = Path(os.environ.get("MM_LAYERS_DIR", REPO / "layers"))


@dataclass
class Layers:
    width: int
    height: int
    res_m: float
    elevation: np.ndarray
    slope: np.ndarray  # derece
    rock_cfa: np.ndarray  # 0-1
    probs: dict  # sınıf -> 0-1 olasılık
    entropy: np.ndarray  # 0-1
    rover_stops: list = field(default_factory=list)  # [{"stop_id", "px": [x, y]}]
    science_stops: list = field(default_factory=list)
    synthetic: bool = False
    region: str = ""

    def __post_init__(self):
        mask = np.zeros((self.height, self.width), bool)
        for s in self.rover_stops:
            x, y = s["px"]
            if 0 <= x < self.width and 0 <= y < self.height:
                mask[y, x] = True
        if mask.any():
            self.evidence_dist_m = ndimage.distance_transform_edt(~mask) * self.res_m
        else:
            self.evidence_dist_m = np.full((self.height, self.width), np.nan)

    @property
    def dominant(self) -> np.ndarray:
        stack = np.stack([self.probs[c] for c in P.CLASSES])
        return np.argmax(stack, axis=0)

    def copy(self) -> "Layers":
        return Layers(
            self.width, self.height, self.res_m, self.elevation, self.slope.copy(),
            self.rock_cfa.copy(), {k: v.copy() for k, v in self.probs.items()},
            self.entropy.copy(), list(self.rover_stops), list(self.science_stops),
            self.synthetic, self.region,
        )

    def grid_info(self) -> dict:
        return {
            "region": self.region,
            "width": self.width,
            "height": self.height,
            "res_m": self.res_m,
            "synthetic": self.synthetic,
            "px_note": "Koordinatlar [x, y] = [sütun, satır]; (0,0) sol üst köşe",
            "layers": ["elevation", "slope", "rock_cfa", "p_soil", "p_bedrock", "p_sand", "p_bigrock", "entropy"],
            "rover_stops": self.rover_stops,
            "science_stops": self.science_stops,
        }


def slope_deg(elev: np.ndarray, res_m: float) -> np.ndarray:
    gy, gx = np.gradient(elev, res_m)
    return np.degrees(np.arctan(np.hypot(gx, gy))).astype(np.float32)


def _noise(rng, shape, sigma):
    n = ndimage.gaussian_filter(rng.standard_normal(shape), sigma)
    return (n - n.mean()) / (n.std() + 1e-9)


def synthetic(width: int = 250, height: int = 250, res_m: float = 8.0, seed: int = 7) -> Layers:
    rng = np.random.default_rng(seed)
    shape = (height, width)
    yy, xx = np.mgrid[0:height, 0:width] / max(height, width)
    # Kuzeye (üste) yükselen etek + engebe + doğu-batı uzanan bir sırt
    elev = 110.0 * (1 - yy) + 9.0 * _noise(rng, shape, 20) + 1.5 * _noise(rng, shape, 4)
    # Doğu-batı uzanan sırt; ortasında alçak, kayalık bir geçit (kısa ama riskli yol).
    # Sırtın batı ucu açık: uzun ama yumuşak dolambaçlı yol.
    ridge_line = np.exp(-((yy - 0.48 - 0.04 * np.sin(6 * xx)) ** 2) / 0.0035)
    ridge_span = 1 / (1 + np.exp(-(xx - 0.3) * 40))  # x<0.3'te sırt söner
    pass_dip = 1 - 0.42 * np.exp(-((xx - 0.6) ** 2) / 0.002)  # geçit
    ridge = 55.0 * ridge_line * ridge_span * pass_dip
    elev = (elev + ridge - 4500.0).astype(np.float32)
    slope = slope_deg(elev, res_m)
    in_pass = (np.exp(-((xx - 0.6) ** 2) / 0.003) * ridge_line) > 0.3

    low = ndimage.gaussian_filter(elev, 10) - elev  # çukurlarda kum birikir
    sand_logit = 1.2 * _noise(rng, shape, 12) + 0.08 * low - 0.6
    # Güney ovasında belirgin bir kum yaması (dolambaçlı yolun kenarında)
    sand_logit += 2.5 * np.exp(-(((xx - 0.42) ** 2) + ((yy - 0.72) ** 2)) / 0.006)
    rock_logit = 0.15 * (slope - 10) + 0.8 * _noise(rng, shape, 4) - 1.5 + 2.0 * in_pass
    bed_logit = 0.9 * _noise(rng, shape, 9) + 0.5
    soil_logit = 0.6 * _noise(rng, shape, 7) + 0.4
    logits = 3.0 * np.stack([soil_logit, bed_logit, sand_logit, rock_logit])
    e = np.exp(logits - logits.max(0))
    probs_arr = e / e.sum(0)

    # Sahte rover durakları: güneyden kuzeye kıvrılan bir hat
    stops = []
    for i, t in enumerate(np.linspace(0.12, 0.9, 10)):
        x = int(width * (0.35 + 0.15 * np.sin(5 * t)))
        y = int(height * (1 - t))
        stops.append({"stop_id": f"fake_stop_{i:02d}", "px": [x, y]})
    mask = np.zeros(shape, bool)
    for s in stops:
        mask[s["px"][1], s["px"][0]] = True
    dist = ndimage.distance_transform_edt(~mask) * res_m
    # Kanıta uzaklaştıkça olasılıklar düzleşir, entropi artar
    flat = np.clip((dist - 200.0) / 600.0, 0, 1)
    probs_arr = (1 - 0.75 * flat) * probs_arr + 0.75 * flat * 0.25
    ent = -(probs_arr * np.log(probs_arr + 1e-9)).sum(0) / np.log(4)

    rock_cfa = np.clip(0.02 + 0.006 * np.maximum(slope - 5, 0) + 0.03 * _noise(rng, shape, 3)
                       + 0.15 * in_pass, 0, 0.35)
    science = [
        {"id": "boxwork_a", "name": "Boxwork sırtları (sahte)", "px": [int(width * 0.62), int(height * 0.22)],
         "why": "Kırık dolgusu mineraller; eski yeraltı suyunun izi (sahte veri)"},
        {"id": "sulfate_b", "name": "Sülfat katmanı (sahte)", "px": [int(width * 0.2), int(height * 0.35)],
         "why": "Kil-sülfat geçişi; iklim değişiminin kaydı (sahte veri)"},
    ]
    return Layers(
        width, height, res_m, elev, slope, rock_cfa.astype(np.float32),
        {c: probs_arr[i].astype(np.float32) for i, c in enumerate(P.CLASSES)},
        ent.astype(np.float32), stops, science, synthetic=True,
        region="SAHTE VERİ — Gale benzeri sentetik arazi",
    )


class LayerError(ValueError):
    """Gerçek katman paketi yüklenemedi; sentetiğe sessiz geçiş yapılmaz."""


def load(layers_dir: Path | None = None) -> Layers:
    selected = layers_dir or os.environ.get("MARTIAN_LAYERS_DIR") or os.environ.get("MM_LAYERS_DIR")
    if selected is None:
        return synthetic()
    root = Path(selected)
    try:
        g = json.loads((root / "grid.json").read_text(encoding="utf-8"))
        w, h, res = g["width"], g["height"], g["res_m"]
        if type(w) is not int or type(h) is not int or min(w, h) <= 0:
            raise LayerError("grid.json: width/height pozitif tam sayı olmalı")
        if isinstance(res, bool) or not isinstance(res, (int, float)) or not np.isfinite(res) or res <= 0:
            raise LayerError("grid.json: res_m pozitif sonlu metre değeri olmalı")
        crs = g.get("crs", g.get("crs_note"))
        if not isinstance(crs, str) or not crs.strip():
            raise LayerError("grid.json: crs veya crs_note metrik projeksiyon açıklaması gerekli")
        if g.get("units", "m") != "m" or crs.upper() in ("EPSG:4326", "EPSG:49900"):
            raise LayerError("grid.json: açısal değil metrik CRS ve metre birimi gerekli")
        origin = np.asarray(g["origin_xy_m"], dtype=float)
        if origin.shape != (2,) or not np.isfinite(origin).all():
            raise LayerError("grid.json: origin_xy_m iki sonlu sayı olmalı")

        def path_for(name):
            entry = g["layers"][name]
            if isinstance(entry, dict):
                for key, expected in (("crs", crs), ("res_m", res), ("origin_xy_m", g["origin_xy_m"])):
                    if key in entry and entry[key] != expected:
                        raise LayerError(f"{name}: {key} metadata ızgarayla uyumsuz")
                rel = entry["path"]
            else:
                # Eski örneğin 'dosya.npy  float32, birim' açıklamasını da kabul et.
                rel = entry.split("  ", 1)[0]
            path = (root / rel).resolve()
            if not path.is_relative_to(root.resolve()):
                raise LayerError(f"{name}: dosya katman klasörü dışında olamaz")
            return path, entry

        def ld(name):
            path, entry = path_for(name)
            a = np.load(path, allow_pickle=False)
            if a.shape != (h, w) or a.dtype.kind not in "fiu":
                raise LayerError(f"{name}: beklenen şekil {(h, w)} ve sayısal dizi; gelen {a.shape}")
            nodata = entry.get("nodata", g.get("nodata")) if isinstance(entry, dict) else g.get("nodata")
            if not np.isfinite(a).all() or (nodata is not None and np.any(a == nodata)):
                raise LayerError(f"{name}: NaN/sonsuz/no-data hücre var; paketi doldurun veya geçerli bölgeye kırpın")
            if name == "slope" and (np.any(a < 0) or np.any(a > 90)):
                raise LayerError("slope: eğim 0–90 derece aralığında olmalı")
            if name.startswith("p_") or name in ("rock_cfa", "entropy"):
                if np.any(a < 0) or np.any(a > 1):
                    raise LayerError(f"{name}: değerler 0–1 aralığında olmalı")
            a = a.astype(np.float32)
            if not np.isfinite(a).all():
                raise LayerError(f"{name}: float32 aralığı aşıldı")
            return a

        elev, slope, rock, ent = (ld(n) for n in ("elevation", "slope", "rock_cfa", "entropy"))
        probs = {c: ld(f"p_{c}") for c in P.CLASSES}
        if not np.allclose(sum(probs.values()), 1, atol=1e-3, rtol=0):
            raise LayerError("Sınıf olasılıkları her hücrede toplam 1 olmalı")
        def stops(name, fallback):
            path = path_for(name)[0] if name in g["layers"] else root / fallback
            values = json.loads(path.read_text(encoding="utf-8")) if path.exists() else []
            for item in values:
                px = item["px"]
                if len(px) != 2 or any(type(v) is not int for v in px) or not (0 <= px[0] < w and 0 <= px[1] < h):
                    raise LayerError(f"{name}: durak px ızgara içinde tam sayı [x,y] olmalı")
            return values
        return Layers(w, h, float(res), elev, slope, rock, probs, ent,
                      stops("rover_stops", "rover_stops.json"), stops("science", "science_stops.json"),
                      synthetic=False, region=g.get("region", ""))
    except LayerError:
        raise
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as exc:
        raise LayerError(f"Katman paketi okunamadı ({root}): {exc}") from exc
