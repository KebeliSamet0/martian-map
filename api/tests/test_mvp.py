"""Sprint 2 MVP testleri: geçici zemin katmanı dolgusu, kısmi paket hatası ve gerçek veri duman testi."""
import json
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

from api import planner
from api.main import app
from api.planner import params as P
from api.planner.layers import PROVISIONAL_TERRAIN_NOTE, LayerError, load
from scripts.smoke import run_smoke

ROOT = Path(__file__).resolve().parents[2]


def _make_partial_or_provisional_pkg(tmp_path: Path, include_terrain: list[str]):
    w, h = 12, 12
    elev = np.linspace(-3800, -3750, w * h, dtype=np.float32).reshape(h, w)
    slope = np.linspace(2.0, 20.0, w * h, dtype=np.float32).reshape(h, w)
    rock = np.linspace(0.0, 0.3, w * h, dtype=np.float32).reshape(h, w)
    np.save(tmp_path / "elevation.npy", elev)
    np.save(tmp_path / "slope.npy", slope)
    np.save(tmp_path / "rock_cfa.npy", rock)
    layers_manifest = {
        "elevation": "elevation.npy",
        "slope": "slope.npy",
        "rock_cfa": "rock_cfa.npy",
        "p_soil": "p_soil.npy",
        "p_bedrock": "p_bedrock.npy",
        "p_sand": "p_sand.npy",
        "p_bigrock": "p_bigrock.npy",
        "entropy": "entropy.npy",
    }
    for name in include_terrain:
        val = 0.25 if name.startswith("p_") else 0.1
        np.save(tmp_path / f"{name}.npy", np.full((h, w), val, dtype=np.float32))
    manifest = {
        "region": "Test Gale",
        "width": w,
        "height": h,
        "res_m": 2.0,
        "origin_xy_m": [0.0, 0.0],
        "crs": "LOCAL:MARS_METRIC",
        "layers": layers_manifest,
    }
    (tmp_path / "grid.json").write_text(json.dumps(manifest), encoding="utf-8")
    return tmp_path


def test_provisional_terrain_when_all_missing(monkeypatch, tmp_path):
    pkg = _make_partial_or_provisional_pkg(tmp_path, include_terrain=[])
    monkeypatch.setenv("MARTIAN_LAYERS_DIR", str(pkg))
    layers = load()
    assert not layers.synthetic
    assert layers.provisional_terrain is True
    assert np.allclose(sum(layers.probs.values()), 1.0, atol=1e-3)
    assert float(layers.entropy.min()) >= P.CONF_LOW
    assert not (pkg / "p_soil.npy").exists()

    with TestClient(app) as client:
        grid = client.get("/grid").json()
        assert grid["provisional_terrain"] is True
        assert grid["terrain_note"] == PROVISIONAL_TERRAIN_NOTE

        assumptions = client.get("/assumptions").json()
        assert any(PROVISIONAL_TERRAIN_NOTE in str(item.get("value", "")) for item in assumptions)

        resp = client.post("/route", json={"start": [1, 1], "goal": [10, 10]})
        assert resp.status_code == 200
        routes = resp.json()["routes"]
        for r in routes:
            assert all(PROVISIONAL_TERRAIN_NOTE in s["reason"] for s in r["segments"])


def test_real_terrain_files_used_automatically_when_all_present(monkeypatch, tmp_path):
    all_terrain = ["p_soil", "p_bedrock", "p_sand", "p_bigrock", "entropy"]
    pkg = _make_partial_or_provisional_pkg(tmp_path, include_terrain=all_terrain)
    monkeypatch.setenv("MARTIAN_LAYERS_DIR", str(pkg))
    layers = load()
    assert layers.provisional_terrain is False
    assert np.allclose(layers.entropy, 0.1)

    with TestClient(app) as client:
        grid = client.get("/grid").json()
        assert grid["provisional_terrain"] is False
        assert grid["terrain_note"] is None
        assumptions = client.get("/assumptions").json()
        assert not any(PROVISIONAL_TERRAIN_NOTE in str(item.get("value", "")) for item in assumptions)
        resp = client.post("/route", json={"start": [1, 1], "goal": [10, 10]})
        assert resp.status_code == 200
        for r in resp.json()["routes"]:
            assert all(PROVISIONAL_TERRAIN_NOTE not in s["reason"] for s in r["segments"])


@pytest.mark.parametrize("present", [
    ["p_soil"],
    ["p_soil", "p_bedrock", "p_sand", "p_bigrock"],
    ["entropy"],
])
def test_partial_terrain_package_raises_turkish_error(tmp_path, present):
    pkg = _make_partial_or_provisional_pkg(tmp_path, include_terrain=present)
    with pytest.raises(LayerError, match="Kısmi zemin katmanı paketi"):
        load(pkg)


@pytest.mark.skipif(
    not (ROOT / "layers" / "elevation.npy").exists() or not (ROOT / "contracts" / "grid.json").exists(),
    reason="Gerçek Gale katmanları bu ortamda yok",
)
def test_smoke_real_gale_layers():
    summary = run_smoke(ROOT)
    assert summary["size"] == "1000x1000"
    assert summary["route_s"] < 2.0
    assert [r["kind"] for r in summary["route_summary"]] == ["shortest", "balanced", "safest"]
    assert [r["kind"] for r in summary["replan_summary"]] == ["shortest", "balanced", "safest"]
    assert all(r["status"] in ("GO", "NO-GO") for r in summary["route_summary"])
