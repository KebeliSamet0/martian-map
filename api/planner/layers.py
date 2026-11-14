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


def load(layers_dir: Path = LAYERS_DIR) -> Layers:
    grid_path = layers_dir / "grid.json"
    if not grid_path.exists():
        return synthetic()
    g = json.loads(grid_path.read_text(encoding="utf-8"))
    ld = lambda name: np.load(layers_dir / f"{name}.npy").astype(np.float32)
    elev = ld("elevation")
    slope = ld("slope") if (layers_dir / "slope.npy").exists() else slope_deg(elev, g["res_m"])
    h, w = elev.shape
    rock = ld("rock_cfa") if (layers_dir / "rock_cfa.npy").exists() else np.zeros_like(elev)
    probs = {}
    for c in P.CLASSES:
        f = layers_dir / f"p_{c}.npy"
        probs[c] = ld(f"p_{c}") if f.exists() else np.full_like(elev, 0.25)
    ent = ld("entropy") if (layers_dir / "entropy.npy").exists() else np.ones_like(elev)
    stops = []
    rs = layers_dir / "rover_stops.json"
    if rs.exists():
        stops = [{"stop_id": s["stop_id"], "px": s["px"]} for s in json.loads(rs.read_text(encoding="utf-8"))]
    sci = []
    ss = layers_dir / "science_stops.json"
    if ss.exists():
        sci = json.loads(ss.read_text(encoding="utf-8"))
    return Layers(w, h, float(g["res_m"]), elev, slope, rock, probs, ent, stops, sci,
                  synthetic=False, region=g.get("region", ""))
