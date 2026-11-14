"""Curiosity (MSL) gerçek/önerilen rotası ile planlayıcının 3 ön ayarını karşılaştırır."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from api import planner
from api.planner import params as P
from api.planner.comparison import _cells, compare_reference
from api.planner.layers import LayerError, Layers

TERRAIN_LAYER_NAMES = ("p_soil", "p_bedrock", "p_sand", "p_bigrock", "entropy")


def clip_reference_path(path_px, width: int, height: int) -> list[list[float]]:
    """Yolun [0, width) x [0, height) ızgarasına düşen en uzun kesintisiz kesitini döndürür."""
    pts = np.asarray(path_px, dtype=float)
    if pts.ndim != 2 or pts.shape[1] != 2 or len(pts) < 2 or not np.isfinite(pts).all():
        raise ValueError("Referans yol en az iki sonlu [x,y] noktası içermeli")
    inb = (pts[:, 0] >= 0) & (pts[:, 0] < width) & (pts[:, 1] >= 0) & (pts[:, 1] < height)
    if not inb.any():
        raise ValueError("Referans yolun ızgaraya düşen noktası yok")
    runs: list[tuple[int, int]] = []
    start = None
    for i, ok in enumerate(inb):
        if ok and start is None:
            start = i
        elif not ok and start is not None:
            runs.append((start, i))
            start = None
    if start is not None:
        runs.append((start, len(pts)))
    a, b = max(runs, key=lambda r: r[1] - r[0])
    seg = pts[a:b]
    if len(seg) < 2:
        raise ValueError("Izgara kesitinde en az iki nokta olmalı")
    return [[float(c), float(r)] for c, r in seg]


def route_points(route: dict) -> list[list[int]]:
    """Segmentlerin paylaştığı sınır noktalarını tekilleştirerek tam [x,y] hücre dizisini döndürür."""
    pts: list[list[int]] = []
    for i, seg in enumerate(route["segments"]):
        pts.extend(seg["path_px"] if i == 0 else seg["path_px"][1:])
    return pts


def polyline_length_m(points, res_m: float) -> float:
    """Nokta dizisinin Öklid adım uzunlukları toplamı (metre)."""
    arr = np.asarray(points, dtype=float)
    if len(arr) < 2:
        return 0.0
    return float(np.hypot(*np.diff(arr, axis=0).T).sum() * res_m)


def _resolve_grid_entry(root: Path, entry) -> Path:
    rel = entry["path"] if isinstance(entry, dict) else entry.split("  ", 1)[0]
    return (root / rel).resolve()


def load_layers_with_fallback(root: Path = ROOT) -> tuple[Layers, dict]:
    """Katmanları yükler; yalnız zemin olasılık/entropi katmanları eksikse eğim+rock_cfa ile çalışır."""
    root = Path(root)
    try:
        layers = planner.load(root)
        if getattr(layers, "provisional_terrain", False):
            # Planlayıcı eksik zemin katmanlarını eğim+rock_cfa'dan geçici dolguyla tamamladı: model çıktısı değil.
            return layers, {
                "terrain_model_available": False,
                "mode": "gecici_zemin_dolgusu",
                "label": "geçici zemin dolgusu (eğim + rock_cfa; zemin modeli çıktısı değil)",
            }
        return layers, {
            "terrain_model_available": True,
            "mode": "tam_zemin_modeli",
            "label": "tam zemin modeli (p_soil, p_bedrock, p_sand, p_bigrock, entropy)",
        }
    except LayerError as exc:
        grid_path = root / "grid.json"
        if not grid_path.exists():
            grid_path = root / "contracts" / "grid.json"
        if not grid_path.exists():
            raise
        g = json.loads(grid_path.read_text(encoding="utf-8"))
        layer_map = g.get("layers", {})
        missing_terrain = [
            name for name in TERRAIN_LAYER_NAMES
            if name not in layer_map or not _resolve_grid_entry(root, layer_map[name]).is_file()
        ]
        if not missing_terrain:
            raise exc
        w, h, res = int(g["width"]), int(g["height"]), float(g["res_m"])

        def load_core(name: str) -> np.ndarray:
            if name not in layer_map:
                raise exc
            p = _resolve_grid_entry(root, layer_map[name])
            if not p.is_file():
                raise exc
            arr = np.load(p, allow_pickle=False).astype(np.float32)
            if arr.shape != (h, w) or not np.isfinite(arr).all():
                raise LayerError(f"{name}: geçersiz şekil veya NaN/Inf değer")
            return arr

        elev = load_core("elevation")
        slope = load_core("slope")
        rock = load_core("rock_cfa")
        probs = {
            c: np.full((h, w), 1.0 if c == "bedrock" else 0.0, dtype=np.float32)
            for c in P.CLASSES
        }
        ent = np.zeros((h, w), dtype=np.float32)

        def load_stops(name: str, fallback: str) -> list:
            p = _resolve_grid_entry(root, layer_map[name]) if name in layer_map else (root / "layers" / fallback)
            if not p.is_file():
                return []
            return json.loads(p.read_text(encoding="utf-8"))

        layers = Layers(
            w, h, res, elev, slope, rock, probs, ent,
            rover_stops=load_stops("rover_stops", "rover_stops.json"),
            science_stops=load_stops("science", "science_stops.json"),
            synthetic=False,
            region=g.get("region", ""),
        )
        return layers, {
            "terrain_model_available": False,
            "mode": "zemin_modeli_yok",
            "label": "zemin modeli yok (yalnız eğim + rock_cfa; tek tip referans zemin: p_bedrock=1, entropy=0)",
            "missing_layers": missing_terrain,
        }


def evaluate_msl_comparison(
    layers: Layers,
    raw_reference_px,
    terrain_meta: dict | None = None,
    source_meta: dict | None = None,
) -> tuple[dict, list[list[float]], dict[str, list[list[int]]]]:
    """Referans rotayı ızgaraya keser, 3 ön ayarı planlar ve karşılaştırma metriklerini hesaplar."""
    ref_px = clip_reference_path(raw_reference_px, layers.width, layers.height)
    start = [math.floor(ref_px[0][0]), math.floor(ref_px[0][1])]
    goal = [math.floor(ref_px[-1][0]), math.floor(ref_px[-1][1])]

    routes = planner.plan(layers, start, goal)
    ref_cells = _cells(layers, ref_px, driven=True)
    ref_poly_len_m = polyline_length_m(ref_px, layers.res_m)
    ref_grid_len_m = polyline_length_m(ref_cells, layers.res_m)
    straight_len_m = float(math.hypot(goal[0] - start[0], goal[1] - start[1]) * layers.res_m)
    ref_slopes = layers.slope[ref_cells[:, 1], ref_cells[:, 0]]

    presets = []
    route_paths: dict[str, list[list[int]]] = {}
    ref_totals = None

    for route in routes:
        pts = route_points(route)
        route_paths[route["kind"]] = pts
        cmp = compare_reference(layers, pts, ref_px)
        if ref_totals is None:
            ref_totals = cmp["reference"]
        r_len_m = polyline_length_m(pts, layers.res_m)
        presets.append({
            "kind": route["kind"],
            "label": route["label"],
            "weights": route["weights"],
            "length_m": round(r_len_m, 1),
            "delta_length_m": round(r_len_m - ref_poly_len_m, 1),
            "delta_grid_length_m": round(r_len_m - ref_grid_len_m, 1),
            "mean_deviation_m": round(cmp["mean_deviation_m"], 2),
            "max_deviation_m": round(cmp["max_deviation_m"], 2),
            "min": round(cmp["route"]["min"], 1),
            "delta_min": round(cmp["delta_min"], 1),
            "kcal": round(cmp["route"]["kcal"], 1),
            "delta_kcal": round(cmp["delta_kcal"], 1),
            "slope_max_deg": route["total"]["slope_max"],
            "status": route["total"]["status"],
            "go": route["total"]["go"],
        })

    if terrain_meta is None:
        terrain_meta = {
            "terrain_model_available": True,
            "mode": "sentetik" if layers.synthetic else "tam_zemin_modeli",
            "label": "sentetik katman" if layers.synthetic else "tam zemin modeli",
        }

    report = {
        "region": layers.region,
        "grid": {
            "width": layers.width,
            "height": layers.height,
            "res_m": layers.res_m,
            "synthetic": layers.synthetic,
        },
        "terrain_model": terrain_meta,
        "endpoints": {
            "start_px": start,
            "goal_px": goal,
            "reference_start_px": [round(ref_px[0][0], 2), round(ref_px[0][1], 2)],
            "reference_goal_px": [round(ref_px[-1][0], 2), round(ref_px[-1][1], 2)],
            "euclidean_distance_m": round(straight_len_m, 1),
        },
        "reference": {
            "source": (source_meta or {}).get("source", ""),
            "source_note": (source_meta or {}).get("source_note", ""),
            "point_count": len(ref_px),
            "sampled_cell_count": int(len(ref_cells)),
            "length_m": round(ref_poly_len_m, 1),
            "grid_length_m": round(ref_grid_len_m, 1),
            "min": round(float(ref_totals["min"]), 1),
            "kcal": round(float(ref_totals["kcal"]), 1),
            "slope_mean_deg": round(float(ref_slopes.mean()), 1),
            "slope_max_deg": round(float(ref_slopes.max()), 1),
            "steep_cells_ge_nogo": int((ref_slopes >= P.SLOPE_NOGO_DEG).sum()),
        },
        "presets": presets,
    }
    return report, ref_px, route_paths


def format_table(report: dict) -> str:
    """Terminal ve rapor için Markdown karşılaştırma tablosu üretir."""
    ref = report["reference"]
    tm = report["terrain_model"]
    ep = report["endpoints"]
    lines = [
        f"Katman modu : {tm['label']}",
        f"Başlangıç/Hedef hücre : {ep['start_px']} -> {ep['goal_px']} (kuş uçuşu {ep['euclidean_distance_m']:.1f} m)",
        f"Curiosity referans    : polyline {ref['length_m']:.1f} m (ızgara örnekleme {ref['grid_length_m']:.1f} m), "
        f"eşdeğer tek yön {ref['min']:.1f} dk, {ref['kcal']:.1f} kcal",
        "",
        "| Ön ayar | Uzunluk (m) | Δ Uzunluk (m) | Ort. Sapma (m) | Maks. Sapma (m) | Süre (dk) | Δ Süre (dk) | Enerji (kcal) | Δ Enerji (kcal) | Maks. Eğim (°) | Durum |",
        "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|",
    ]
    for p in report["presets"]:
        lines.append(
            f"| `{p['kind']}` ({p['label']}) | {p['length_m']:.1f} | {p['delta_length_m']:+.1f} | "
            f"{p['mean_deviation_m']:.1f} | {p['max_deviation_m']:.1f} | "
            f"{p['min']:.1f} | {p['delta_min']:+.1f} | "
            f"{p['kcal']:.1f} | {p['delta_kcal']:+.1f} | "
            f"{p['slope_max_deg']:.1f} | {p['status']} |"
        )
    return "\n".join(lines)


def render_comparison_png(
    layers: Layers,
    ref_px: list[list[float]],
    route_paths: dict[str, list[list[int]]],
    out_path: Path,
    ortho_path: Path | None = None,
    report: dict | None = None,
) -> Path:
    """Ortofoto (veya yükselti) üzerine Curiosity referansı ve 3 planlayıcı rotasını çizer (<500 KB PNG)."""
    if ortho_path is not None and Path(ortho_path).is_file():
        base = Image.open(ortho_path).convert("L")
        if base.size != (layers.width, layers.height):
            base = base.resize((layers.width, layers.height), Image.Resampling.BILINEAR)
    else:
        elev = layers.elevation
        span = float(elev.max() - elev.min()) or 1.0
        norm = ((elev - float(elev.min())) / span * 215 + 20).clip(0, 255).astype(np.uint8)
        base = Image.fromarray(norm, mode="L")

    # Kontrastı hafif yumuşat ve 64 gri seviyesine kuantize et ki paletli PNG'de rota renkleri tam korunsun
    if max(base.size) > 750:
        scale = 750.0 / max(base.size)
        new_size = (int(round(base.width * scale)), int(round(base.height * scale)))
        base = base.resize(new_size, Image.Resampling.BILINEAR)
    else:
        scale = 1.0
    arr = ((np.asarray(base, dtype=np.float32) * 0.80 + 20.0).clip(0, 255).astype(np.uint8) // 4) * 4
    rgb = Image.fromarray(np.stack([arr, arr, arr], axis=-1), mode="RGB")
    draw = ImageDraw.Draw(rgb)

    colors = {
        "reference": (255, 75, 43),   # parlak turuncu-kırmızı: Curiosity
        "safest": (217, 70, 239),     # parlak macenta/mor: En güvenli
        "balanced": (34, 197, 94),    # canlı yeşil: Dengeli
        "shortest": (56, 189, 248),   # açık mavi/camgöbeği: En kısa
    }

    if len(ref_px) >= 2:
        draw.line([(float(x) * scale, float(y) * scale) for x, y in ref_px], fill=colors["reference"], width=4)

    widths = {"safest": 5, "balanced": 3, "shortest": 2}
    for kind in ("safest", "balanced", "shortest"):
        pts = route_paths.get(kind, [])
        if len(pts) >= 2:
            draw.line([(float(x) * scale, float(y) * scale) for x, y in pts], fill=colors[kind], width=widths[kind])

    # Başlangıç ve bitiş işaretçileri
    sx, sy = ref_px[0][0] * scale, ref_px[0][1] * scale
    gx, gy = ref_px[-1][0] * scale, ref_px[-1][1] * scale
    r = max(5, int(round(rgb.width * 0.008)))
    draw.ellipse((sx - r, sy - r, sx + r, sy + r), fill=(250, 204, 21), outline=(15, 23, 42), width=2)
    draw.ellipse((gx - r, gy - r, gx + r, gy + r), fill=(248, 250, 252), outline=(15, 23, 42), width=2)

    # Sol üst köşede açıklama kutusu (rotalar sağ yarıda olduğu için çakışmaz)
    if rgb.width >= 300 and rgb.height >= 160:
        box = (12, 12, 360, 146)
        draw.rectangle(box, fill=(15, 23, 42), outline=(100, 116, 139), width=2)
        mode_tag = "ZEMIN MODELI YOK (egim+rock_cfa)"
        if report and report.get("terrain_model", {}).get("terrain_model_available"):
            mode_tag = "TAM ZEMIN MODELI AKTIF"
        draw.text((22, 20), f"Gale / Mount Sharp Boxwork ({layers.width}x{layers.height}, {layers.res_m:g}m)", fill=(241, 245, 249))
        draw.text((22, 36), f"Mod: {mode_tag}", fill=(253, 224, 71))
        ref_len_txt = f" ({report['reference']['length_m']:.1f} m)" if report and "reference" in report else ""
        preset_lens = {p["kind"]: f" ({p['length_m']:.1f} m)" for p in (report or {}).get("presets", [])}
        legend_items = [
            ("reference", f"Curiosity gercek rota{ref_len_txt}"),
            ("shortest", f"shortest / En kisa{preset_lens.get('shortest', '')}"),
            ("balanced", f"balanced / Dengeli{preset_lens.get('balanced', '')}"),
            ("safest", f"safest / En guvenli{preset_lens.get('safest', '')}"),
        ]
        y0 = 58
        for key, label in legend_items:
            draw.line([(22, y0 + 6), (48, y0 + 6)], fill=colors[key], width=4)
            draw.text((56, y0), label, fill=(226, 232, 240))
            y0 += 20

    out_path = Path(out_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    pal = rgb.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    pal.save(out_path, format="PNG", optimize=True)
    return out_path


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT, help="Repo veya katman kök dizini")
    parser.add_argument("--msl-path", type=Path, default=ROOT / "layers/msl_proposed_path.json", help="Referans MSL JSON yolu")
    parser.add_argument("--ortho", type=Path, default=ROOT / "layers/ortho_2m.png", help="Ortofoto PNG yolu")
    parser.add_argument("--out-json", type=Path, default=ROOT / "docs/validation_msl.json", help="Çıktı JSON yolu")
    parser.add_argument("--out-png", type=Path, default=ROOT / "docs/figures/msl_compare.png", help="Çıktı PNG yolu")
    parser.add_argument("--synthetic", action="store_true", help="Sentetik katmanlarla çalıştır")
    args = parser.parse_args(argv)

    msl_data = json.loads(args.msl_path.read_text(encoding="utf-8"))
    if args.synthetic:
        layers = planner.synthetic()
        terrain_meta = {
            "terrain_model_available": True,
            "mode": "sentetik",
            "label": "sentetik arazi katmanı",
        }
    else:
        layers, terrain_meta = load_layers_with_fallback(args.root)

    report, ref_px, route_paths = evaluate_msl_comparison(
        layers, msl_data["path_px"], terrain_meta=terrain_meta, source_meta=msl_data
    )

    args.out_json.parent.mkdir(parents=True, exist_ok=True)
    args.out_json.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    render_comparison_png(layers, ref_px, route_paths, args.out_png, ortho_path=args.ortho, report=report)

    print(format_table(report))
    print(f"\nJSON kaydedildi : {args.out_json}")
    print(f"PNG kaydedildi  : {args.out_png} ({args.out_png.stat().st_size / 1024:.1f} KB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
