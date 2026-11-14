# python -m pytest pipeline/test_spread_terrain.py  (yalniz numpy). Duraklar SENTETIK test verisi.
import numpy as np
import pytest

from spread_terrain import CLASSES, spread

STOPS = [
    {"stop_id": "a", "px": [10.7, 10.2], "class_frac": {"soil": 0.1, "bedrock": 0.7, "sand": 0.1, "bigrock": 0.1}, "entropy": 0.2},
    {"stop_id": "b", "px": [60.0, 60.0], "class_frac": {"soil": 0.2, "bedrock": 0.1, "sand": 0.6, "bigrock": 0.1}, "entropy": 0.4},
]


def test_stop_cells_keep_model_output_and_far_cells_flatten():
    probs, ent, _ = spread(STOPS, 400, 400, 2.0)
    assert np.allclose(sum(probs.values()), 1, atol=1e-5)
    assert probs["bedrock"][10, 10] == pytest.approx(0.7, abs=1e-6) and ent[10, 10] == pytest.approx(0.2, abs=1e-6)
    assert probs["sand"][60, 60] == pytest.approx(0.6, abs=1e-6) and ent[60, 60] == pytest.approx(0.4, abs=1e-6)
    # en yakin durak 'b'den > 800 m: en duz hal (0,75 esit dagilim + 0,25 durak), entropy 1
    far = (399, 399)
    assert probs["sand"][far] == pytest.approx(0.25 * 0.6 + 0.75 * 0.25, abs=1e-6) and ent[far] == pytest.approx(1.0)


@pytest.mark.parametrize("bad", [
    {"stop_id": "x", "px": [1, 1], "class_frac": None, "entropy": None},
    {"stop_id": "x", "px": [1, 1], "class_frac": {"soil": 1.0}, "entropy": 0.1},
    {"stop_id": "x", "px": [1, 1], "class_frac": {c: 0.5 for c in CLASSES}, "entropy": 0.1},
])
def test_missing_or_bad_model_output_is_rejected(bad):
    with pytest.raises(SystemExit, match="eksik"):
        spread([bad], 50, 50, 2.0)
