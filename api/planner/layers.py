"""Katmanları yükler. Gerçek katmanlar yoksa sahte (sentetik) katman üretir.

Gerçek veri: `layers/grid.json` + `layers/*.npy` (contracts/grid.example.json formatı).
Sahte veri: yaklaşık 2×2 km, Mount Sharp eteğine benzeyen kuzeye yükselen arazi.
"""
from __future__ import annotations

import json
import math
import os
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from scipy import ndimage

from . import params as P

REPO = Path(__file__).resolve().parents[2]
LAYERS_DIR = Path(os.environ.get("MM_LAYERS_DIR", REPO / "layers"))
PROVISIONAL_TERRAIN_NOTE = "geçici zemin katmanı (model çıktısı değil)"


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
    provisional_terrain: bool = False

    def __post_init__(self):
        mask = np.zeros((self.height, self.width), bool)
        for s in self.rover_stops:
            x, y = (math.floor(v) for v in s["px"])  # ondalıklı px: noktanın düştüğü hücre
            if 0 <= x < self.width and 0 <= y < self.height:
                mask[y, x] = True
        if mask.any():
            self.evidence_dist_m = ndimage.distance_transform_edt(~mask) * self.res_m
            if self.provisional_terrain:
                dist_factor = np.clip(self.evidence_dist_m / 400.0, 0.0, 1.0)
                self.entropy = np.clip(0.65 + 0.30 * dist_factor, 0.65, 0.95).astype(np.float32)
        else:
            self.evidence_dist_m = np.full((self.height, self.width), np.nan)
        self._comp_slope_ref: np.ndarray | None = None
        self._comp_data: tuple | None = None

    def connectivity(self) -> tuple[np.ndarray, np.ndarray, dict[int, int], np.ndarray]:
        """8-komşulukla geçilebilir bağlı bileşenleri hesaplar ve önbelleğe alır."""
        if (self._comp_data is not None and self._comp_slope_ref is not None
                and np.array_equal(self._comp_slope_ref, self.slope)):
            return self._comp_data
        passable = self.slope < P.SLOPE_NOGO_DEG
        raw_labels, num = ndimage.label(passable, structure=np.ones((3, 3), dtype=bool))
        sizes = np.bincount(raw_labels.ravel())
        sizes[0] = 0
        order = np.argsort(sizes)[::-1]
        ranks: dict[int, int] = {}
        comp_sizes_list = [0]
        for r_idx, cid in enumerate(order, start=1):
            if sizes[cid] <= 0:
                break
            ranks[int(cid)] = r_idx
            comp_sizes_list.append(int(sizes[cid]))
        comp_sizes = np.asarray(comp_sizes_list, dtype=int)
        main_cid = int(order[0]) if len(order) and sizes[order[0]] > 0 else -1
        reachable = np.where(raw_labels == main_cid, 1.0, np.where(passable, 0.35, 0.0)).astype(np.float32)
        self._comp_slope_ref = self.slope.copy()
        self._comp_data = (raw_labels, comp_sizes, ranks, reachable)
        return self._comp_data

    @property
    def reachable(self) -> np.ndarray:
        return self.connectivity()[3]

    @property
    def speed_mps(self) -> np.ndarray:
        from . import cost
        return cost.speed_ms(self).astype(np.float32)

    @property
    def kcal_per_m(self) -> np.ndarray:
        from . import cost
        return cost.kcal_per_m(self).astype(np.float32)

    @property
    def o2_l_per_m(self) -> np.ndarray:
        from . import cost
        return cost.o2_l_per_m(self).astype(np.float32)

    @property
    def o2_g_per_m(self) -> np.ndarray:
        from . import cost
        return cost.o2_g_per_m(self).astype(np.float32)

    @property
    def risk(self) -> np.ndarray:
        from . import cost
        return cost.risk_per_m(self).astype(np.float32)

    @property
    def scan_class(self) -> np.ndarray:
        return P.classify_scan(self.slope, self.probs["sand"], self.entropy, self.rock_cfa)

    @property
    def dominant(self) -> np.ndarray:
        stack = np.stack([self.probs[c] for c in P.CLASSES])
        return np.argmax(stack, axis=0)

    def copy(self) -> "Layers":
        return Layers(
            self.width, self.height, self.res_m, self.elevation, self.slope.copy(),
            self.rock_cfa.copy(), {k: v.copy() for k, v in self.probs.items()},
            self.entropy.copy(), list(self.rover_stops), list(self.science_stops),
            self.synthetic, self.region, self.provisional_terrain,
        )

    def grid_info(self) -> dict:
        _, comp_sizes, _, _ = self.connectivity()
        total_cells = self.width * self.height
        passable_cells = int(comp_sizes.sum())
        nogo_cells = total_cells - passable_cells
        main_cells = int(comp_sizes[1]) if len(comp_sizes) > 1 else 0
        return {
            "region": self.region,
            "width": self.width,
            "height": self.height,
            "res_m": self.res_m,
            "synthetic": self.synthetic,
            "provisional_terrain": self.provisional_terrain,
            "terrain_note": PROVISIONAL_TERRAIN_NOTE if self.provisional_terrain else None,
            "px_note": "Koordinatlar [x, y] = [sütun, satır]; (0,0) sol üst köşe",
            "layers": ["elevation", "slope", "rock_cfa", "p_soil", "p_bedrock", "p_sand", "p_bigrock", "entropy"],
            "aux_layers": ["reachable", "speed_mps", "kcal_per_m", "o2_l_per_m", "o2_g_per_m", "risk", "scan_class"],
            "scan_legend": P.SCAN_LEGEND,
            "reachability": {
                "passable_cells": passable_cells,
                "passable_pct": round(passable_cells / total_cells * 100, 2),
                "nogo_cells": nogo_cells,
                "nogo_pct": round(nogo_cells / total_cells * 100, 2),
                "component_count": max(len(comp_sizes) - 1, 0),
                "main_component_cells": main_cells,
                "main_component_pct": round(main_cells / total_cells * 100, 2),
                "reachable_layer": "/layers/reachable.png",
            },
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


def _provisional_terrain(slope: np.ndarray, rock_cfa: np.ndarray) -> tuple[dict[str, np.ndarray], np.ndarray]:
    """Zemin model çıktıları henüz yokken eğim + rock_cfa'dan geçici olasılık ve yüksek entropi üretir.

    Kural:
    - p_bigrock: kaya kaplama oranı (rock_cfa) ve dik eğimle artar [0.05, 0.65].
    - p_sand: düşük eğim (<10°) ve düşük kayalık (<0.10) alanlarda artar [0.05, 0.50].
    - Kalan olasılık (1 - p_bigrock - p_sand), eğime göre ana kaya (bedrock) ve toprak (soil) arasında paylaştırılır.
    - Entropi: normalize Shannon entropisi ile en az 0.75 (düşük güven / CONF_LOW = 0.60 üstü) olacak şekilde ayarlanır.
    """
    p_bigrock = np.clip(0.10 + 0.45 * np.clip(rock_cfa / 0.25, 0.0, 1.0)
                        + 0.15 * np.clip((slope - 15.0) / 10.0, 0.0, 1.0), 0.05, 0.65)
    p_sand = np.clip(0.10 + 0.35 * np.clip((10.0 - slope) / 10.0, 0.0, 1.0)
                     * (1.0 - np.clip(rock_cfa / 0.10, 0.0, 1.0)), 0.05, 0.50)
    rem = np.clip(1.0 - p_bigrock - p_sand, 0.10, 1.0)
    bed_share = np.clip((slope - 5.0) / 15.0, 0.30, 0.70)
    p_bedrock = rem * bed_share
    p_soil = rem * (1.0 - bed_share)
    probs = {
        "soil": p_soil.astype(np.float32),
        "bedrock": p_bedrock.astype(np.float32),
        "sand": p_sand.astype(np.float32),
        "bigrock": p_bigrock.astype(np.float32),
    }
    arr = np.stack([probs[c] for c in P.CLASSES])
    shannon = -(arr * np.log(arr + 1e-9)).sum(0) / np.log(4)
    ent = np.clip(np.maximum(shannon, 0.75), 0.0, 1.0).astype(np.float32)
    return probs, ent


def load(layers_dir: Path | None = None) -> Layers:
    selected = layers_dir or os.environ.get("MARTIAN_LAYERS_DIR") or os.environ.get("MM_LAYERS_DIR")
    if selected is None:
        return synthetic()
    root = Path(selected)
    try:
        grid_path = root / "grid.json"
        if not grid_path.exists():  # repo kökü verildiyse sözleşmedeki yer (yollar köke göre)
            grid_path = root / "contracts" / "grid.json"
        g = json.loads(grid_path.read_text(encoding="utf-8"))
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

        elev, slope, rock = (ld(n) for n in ("elevation", "slope", "rock_cfa"))
        terrain_names = [*(f"p_{c}" for c in P.CLASSES), "entropy"]
        existing_terrain = [n for n in terrain_names if n in g["layers"] and path_for(n)[0].exists()]
        if not existing_terrain:
            probs, ent = _provisional_terrain(slope, rock)
            provisional = True
        elif len(existing_terrain) < len(terrain_names):
            missing = [n for n in terrain_names if n not in existing_terrain]
            raise LayerError(
                f"Kısmi zemin katmanı paketi: {existing_terrain} mevcut ancak {missing} eksik; "
                "ya tüm zemin katmanları (p_soil, p_bedrock, p_sand, p_bigrock, entropy) hazır olmalı "
                "ya da geçici dolgu için hiçbiri olmamalı"
            )
        else:
            ent = ld("entropy")
            probs = {c: ld(f"p_{c}") for c in P.CLASSES}
            provisional = False
        if not np.allclose(sum(probs.values()), 1, atol=1e-3, rtol=0):
            raise LayerError("Sınıf olasılıkları her hücrede toplam 1 olmalı")
        def stops(name, *fallbacks):
            if name in g["layers"]:
                candidates = [path_for(name)[0]]
            else:
                candidates = [root / fb for fb in fallbacks] + [root / "layers" / fb for fb in fallbacks]
            path = next((p for p in candidates if p.exists()), None)
            values = json.loads(path.read_text(encoding="utf-8")) if path is not None else []
            for item in values:
                px = item["px"]
                # px ondalıklı olabilir (durağın hücre içindeki konumu); hücre = floor
                if (len(px) != 2 or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in px)
                        or not (0 <= px[0] < w and 0 <= px[1] < h)):
                    raise LayerError(f"{name}: durak px ızgara içinde sonlu sayı [x,y] olmalı")
            return values
        return Layers(w, h, float(res), elev, slope, rock, probs, ent,
                      stops("rover_stops", "rover_stops.json", "rover_stops_selected.json"),
                      stops("science", "science_stops.json"),
                      synthetic=False, region=g.get("region", ""), provisional_terrain=provisional)
    except LayerError:
        raise
    except (OSError, ValueError, KeyError, TypeError, AttributeError) as exc:
        raise LayerError(f"Katman paketi okunamadı ({root}): {exc}") from exc


def load_missions(layers_dir: Path | None = None) -> dict:
    """layers/demo_scenarios.json ve varsa layers/sand_hint.json dosyalarını okuyup sim için sunar."""
    selected = layers_dir or os.environ.get("MARTIAN_LAYERS_DIR") or os.environ.get("MM_LAYERS_DIR")
    roots = ([Path(selected), Path(selected) / "layers"] if selected else []) + [REPO / "layers", REPO]

    def _find_json(filename: str) -> dict | None:
        for base in roots:
            p = base / filename
            if p.exists():
                return json.loads(p.read_text(encoding="utf-8"))
        return None

    demo_data = _find_json("demo_scenarios.json") or {"scenarios": []}
    sand_data = _find_json("sand_hint.json") or {"points": []}

    default_limits = {
        "time_min": P.EVA_MAX_H * 60.0,
        "kcal": P.EVA_MAX_KCAL,
        "o2_L": P.EVA_MAX_O2_L,
        "dose_uGy": P.EVA_MAX_DOSE_UGY,
        "reserve_min": P.RESERVE_MIN,
    }

    sand_points = []
    for pt in sand_data.get("points", []):
        px_raw = pt["px"]
        px_int = [int(math.floor(float(px_raw[0]))), int(math.floor(float(px_raw[1])))]
        sand_points.append({
            "id": pt["id"],
            "px": px_int,
            "exact_px": [float(px_raw[0]), float(px_raw[1])],
            "radius_m": float(pt["radius_m"]),
            "cls": "sand",
            "reason": pt.get("reason", ""),
            "route_dist_m": pt.get("route_dist_m"),
        })

    missions = []
    for s in demo_data.get("scenarios", []):
        start_obj = dict(s["start"])
        goal_obj = dict(s["goal"])
        start_px = [int(math.floor(float(start_obj["px"][0]))), int(math.floor(float(start_obj["px"][1])))]
        goal_px = [int(math.floor(float(goal_obj["px"][0]))), int(math.floor(float(goal_obj["px"][1])))]
        start_obj["px"] = start_px
        goal_obj["px"] = goal_px
        limits = {**default_limits, **(s.get("limits") or s.get("budget") or {})}
        surprise = s.get("surprise_sand")
        sand_events = []
        if surprise:
            ev_px = [int(math.floor(float(surprise["px"][0]))), int(math.floor(float(surprise["px"][1])))]
            sand_events.append({
                "px": ev_px,
                "radius_m": float(surprise["radius_m"]),
                "cls": surprise.get("cls", "sand"),
                "source": surprise.get("source", ""),
            })
        title = s.get("title") or s.get("name") or s["id"]
        missions.append({
            "id": s["id"],
            "name": s.get("name") or title,
            "title": title,
            "start": start_obj,
            "goal": goal_obj,
            "start_px": start_px,
            "goal_px": goal_px,
            "limits": limits,
            "surprise_sand": sand_events[0] if sand_events else None,
            "sand_events": sand_events,
            "curiosity_section": s.get("curiosity_section"),
            "checked": s.get("checked"),
        })

    return {
        "description": demo_data.get("description", ""),
        "status": demo_data.get("status", ""),
        "default_limits": default_limits,
        "missions": missions,
        "scenarios": missions,
        "sand_points": sand_points,
        "sand_hints": sand_points,
    }
