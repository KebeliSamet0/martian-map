"""Gerçek veri uyumu: ondalıklı px, tek hücrelik NOGO abartısı, contracts/grid.json yeri (issue #19)."""
import json

import numpy as np
import pytest

from api import planner
from api.planner import params as P
from api.planner.layers import LayerError, load
from api.planner.route import PlanError, _check


@pytest.fixture
def layers():
    return planner.synthetic()


def test_single_steep_cell_snaps_to_nearest_passable(layers):
    x, y = 110, 235
    layers.slope[y, x] = 41.8
    ry, rx = _check(layers, [x + 0.4, y + 0.7])
    assert (ry, rx) != (y, x) and layers.slope[ry, rx] < P.SLOPE_NOGO_DEG
    assert np.hypot(ry - y, rx - x) * layers.res_m <= P.SNAP_RADIUS_M


def test_steep_neighbourhood_still_rejected(layers):
    x, y = 110, 235
    r = int(P.SNAP_RADIUS_M // layers.res_m) + 1
    layers.slope[y - r:y + r + 1, x - r:x + r + 1] = 30
    with pytest.raises(PlanError, match="geçilmez"):
        _check(layers, [x, y])


def test_float_px_marks_evidence_cell(layers):
    L = planner.Layers(layers.width, layers.height, layers.res_m, layers.elevation, layers.slope,
                              layers.rock_cfa, layers.probs, layers.entropy,
                              [{"stop_id": "s", "px": [12.9, 7.2]}])
    assert L.evidence_dist_m[7, 12] == 0


def _write_package(root, stops_px, grid_at_root):
    L = planner.synthetic(); h, w = L.slope.shape
    (root / "layers").mkdir()
    arrays = {"elevation": L.elevation, "slope": L.slope, "rock_cfa": L.rock_cfa, "entropy": L.entropy,
              **{f"p_{c}": a for c, a in L.probs.items()}}
    for k, a in arrays.items():
        np.save(root / "layers" / f"{k}.npy", a)
    (root / "layers" / "rover_stops.json").write_text(json.dumps([{"stop_id": "s", "px": p} for p in stops_px]))
    grid = {"width": w, "height": h, "res_m": L.res_m, "origin_xy_m": [0.0, 0.0], "crs": "+proj=eqc +R=3396190 +units=m",
            "layers": {**{k: f"layers/{k}.npy  float32" for k in arrays}, "rover_stops": "layers/rover_stops.json  json"}}
    target = root / "grid.json" if grid_at_root else root / "contracts" / "grid.json"
    target.parent.mkdir(exist_ok=True)
    target.write_text(json.dumps(grid))


def test_load_float_px_and_contracts_grid(tmp_path):
    _write_package(tmp_path, [[179.8, 12.5], [3, 4]], grid_at_root=False)
    L = load(tmp_path)
    assert [s["px"] for s in L.rover_stops] == [[179.8, 12.5], [3, 4]]
    assert L.evidence_dist_m[12, 179] == 0


@pytest.mark.parametrize("bad", [[float("nan"), 1], [True, 1], ["1", 2], [-0.5, 1], [1e9, 1]])
def test_load_rejects_bad_px(tmp_path, bad):
    _write_package(tmp_path, [bad], grid_at_root=True)
    with pytest.raises(LayerError, match="px"):
        load(tmp_path)
