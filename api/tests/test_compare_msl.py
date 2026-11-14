import json
from pathlib import Path

import numpy as np
import pytest

from api import planner
from api.planner import params as P
from api.planner.comparison import compare_reference
from scripts.compare_msl import (
    clip_reference_path,
    evaluate_msl_comparison,
    load_layers_with_fallback,
    main,
    render_comparison_png,
)


def test_clip_reference_path_and_core_evaluation_on_synthetic():
    layers = planner.synthetic()
    # Izgara dışından başlayıp biten, ortası (250x250) içinde kalan referans polyline
    raw_ref = [[-10.0, 240.0], [110.4, 235.6], [125.0, 140.0], [150.2, 30.8], [260.0, -5.0]]
    clipped = clip_reference_path(raw_ref, layers.width, layers.height)
    assert clipped == [[110.4, 235.6], [125.0, 140.0], [150.2, 30.8]]

    report, ref_px, route_paths = evaluate_msl_comparison(layers, raw_ref)
    assert report["endpoints"]["start_px"] == [110, 235]
    assert report["endpoints"]["goal_px"] == [150, 30]
    assert [p["kind"] for p in report["presets"]] == ["shortest", "balanced", "safest"]

    for p in report["presets"]:
        pts = route_paths[p["kind"]]
        cmp = compare_reference(layers, pts, ref_px)
        assert p["mean_deviation_m"] == pytest.approx(cmp["mean_deviation_m"], abs=0.01)
        assert p["max_deviation_m"] == pytest.approx(cmp["max_deviation_m"], abs=0.01)
        assert p["delta_min"] == pytest.approx(cmp["delta_min"], abs=0.1)
        assert p["delta_kcal"] == pytest.approx(cmp["delta_kcal"], abs=0.1)

    # Referans rota shortest ile birebir aynı verildiğinde sapma ve farklar sıfır olmalı
    shortest_pts = route_paths["shortest"]
    same_report, _, _ = evaluate_msl_comparison(layers, shortest_pts)
    s0 = same_report["presets"][0]
    assert s0["mean_deviation_m"] == 0.0
    assert s0["max_deviation_m"] == 0.0
    assert s0["delta_length_m"] == 0.0
    assert s0["delta_min"] == 0.0
    assert s0["delta_kcal"] == 0.0


def test_fallback_without_terrain_and_auto_upgrade_when_present(tmp_path: Path):
    h, w = 16, 16
    z = np.zeros((h, w), dtype=np.float32)
    layers_dir = tmp_path / "layers"
    layers_dir.mkdir()
    for name in ("elevation", "slope", "rock_cfa"):
        np.save(layers_dir / f"{name}.npy", z)

    grid = {
        "region": "test",
        "width": w,
        "height": h,
        "res_m": 2.0,
        "origin_xy_m": [0.0, 0.0],
        "crs": "LOCAL:MARS_METRIC",
        "layers": {
            name: f"layers/{name}.npy"
            for name in ("elevation", "slope", "rock_cfa", "p_soil", "p_bedrock", "p_sand", "p_bigrock", "entropy")
        },
    }
    (tmp_path / "grid.json").write_text(json.dumps(grid), encoding="utf-8")

    # 1) Zemin olasılık katmanları yokken eğim+rock_cfa yedek yolu çalışmalı
    loaded_fb, meta_fb = load_layers_with_fallback(tmp_path)
    assert meta_fb["terrain_model_available"] is False
    # Planlayıcı (PR #55) eksik katmanları geçici dolguyla tamamlar; betik bunu "model yok" olarak etiketlemeli.
    assert meta_fb["mode"] in ("zemin_modeli_yok", "gecici_zemin_dolgusu")
    assert loaded_fb.entropy.shape == (h, w)

    # 2) Zemin katmanları eklendiğinde otomatik olarak tam modeli yüklemeli
    for c in P.CLASSES:
        arr = np.full((h, w), 1.0 if c == "soil" else 0.0, dtype=np.float32)
        np.save(layers_dir / f"p_{c}.npy", arr)
    np.save(layers_dir / "entropy.npy", np.full((h, w), 0.25, dtype=np.float32))

    loaded_full, meta_full = load_layers_with_fallback(tmp_path)
    assert meta_full["terrain_model_available"] is True
    assert meta_full["mode"] == "tam_zemin_modeli"
    assert np.all(loaded_full.probs["soil"] == 1.0)
    assert np.allclose(loaded_full.entropy, 0.25)


def test_cli_and_png_generation_on_synthetic(tmp_path: Path):
    msl_path = tmp_path / "msl.json"
    out_json = tmp_path / "validation_msl.json"
    out_png = tmp_path / "msl_compare.png"
    msl_path.write_text(
        json.dumps({"source": "test", "path_px": [[110.2, 235.1], [130.5, 120.4], [150.0, 30.0]]}),
        encoding="utf-8",
    )
    rc = main([
        "--synthetic",
        "--msl-path", str(msl_path),
        "--ortho", str(tmp_path / "missing_ortho.png"),
        "--out-json", str(out_json),
        "--out-png", str(out_png),
    ])
    assert rc == 0
    assert out_json.is_file()
    assert out_png.is_file()
    assert out_png.stat().st_size < 500 * 1024
    payload = json.loads(out_json.read_text(encoding="utf-8"))
    assert payload["grid"]["synthetic"] is True
    assert len(payload["presets"]) == 3
