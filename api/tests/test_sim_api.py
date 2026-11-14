"""Simülasyon API veri uçları testleri (issue #51: maliyet katmanları, scan_class, /step)."""
from io import BytesIO
import time

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from api import planner
from api.main import app
from api.planner import cost, params as P

START, GOAL = [110, 235], [150, 30]


@pytest.fixture(scope="module")
def layers():
    return planner.synthetic()


@pytest.fixture
def client(monkeypatch, layers):
    monkeypatch.setattr(planner, "load", lambda: layers.copy())
    with TestClient(app) as c:
        yield c


@pytest.mark.parametrize("name", ["speed_mps", "kcal_per_m", "o2_l_per_m", "o2_g_per_m", "risk", "scan_class"])
def test_derived_cost_and_scan_layers(client, layers, name):
    grid = client.get("/grid").json()
    assert name in grid["aux_layers"]

    raw = client.get(f"/layers/{name}.bin")
    assert raw.status_code == 200
    arr = np.frombuffer(raw.content, dtype="<f4").reshape(layers.height, layers.width)

    if name == "speed_mps":
        expected = cost.speed_ms(layers).astype(np.float32)
    elif name == "kcal_per_m":
        expected = cost.kcal_per_m(layers).astype(np.float32)
    elif name == "o2_l_per_m":
        expected = cost.o2_l_per_m(layers).astype(np.float32)
    elif name == "o2_g_per_m":
        expected = cost.o2_g_per_m(layers).astype(np.float32)
    elif name == "risk":
        expected = cost.risk_per_m(layers).astype(np.float32)
    elif name == "scan_class":
        expected = P.classify_scan(layers.slope, layers.probs["sand"], layers.entropy, layers.rock_cfa)
    np.testing.assert_allclose(arr, expected, rtol=1e-6, atol=1e-6)

    png = client.get(f"/layers/{name}.png")
    assert png.status_code == 200
    assert png.headers["content-type"] == "image/png"
    im = Image.open(BytesIO(png.content))
    assert im.size == (layers.width, layers.height)
    assert im.mode == "RGBA"


def test_scan_class_priority_and_grid_legend(client, layers):
    grid = client.get("/grid").json()
    legend = grid["scan_legend"]
    assert [legend[str(i)]["name"] for i in range(4)] == ["güvenli", "dikkat", "geçilmez", "bilinmiyor"]
    assert all("color" in legend[str(i)] and "rgb" in legend[str(i)] for i in range(4))

    assumptions = client.get("/assumptions").json()
    assert any("scan_class" in item["name"] for item in assumptions)

    # Öncelik: 2 geçilmez -> 3 bilinmiyor -> 1 dikkat -> 0 güvenli
    slope = np.array([5.0, 16.0, 5.0, 26.0, 13.0, 16.0, 26.0], dtype=np.float32)
    sand = np.array([0.1, 0.1, 0.1, 0.1, 0.60, 0.50, 0.60], dtype=np.float32)
    ent = np.array([0.2, 0.2, 0.70, 0.2, 0.80, 0.70, 0.80], dtype=np.float32)
    rock = np.array([0.05, 0.05, 0.05, 0.05, 0.20, 0.20, 0.20], dtype=np.float32)
    sc = P.classify_scan(slope, sand, ent, rock)
    # 0: güvenli (5°, düşük kum/entropi/kaya)
    # 1: dikkat (16° eğim)
    # 2: bilinmiyor (entropi 0.70 >= 0.60)
    # 3: geçilmez (26° >= 25°)
    # 4: geçilmez (p_sand 0.60 >= 0.55 ve eğim 13° >= 12°, entropi 0.80 olsa bile geçilmez öncelikli!)
    # 5: bilinmiyor (dikkat + bilinmiyor çakıştığında bilinmiyor öncelikli!)
    # 6: geçilmez (hepsi çakıştığında geçilmez öncelikli!)
    assert sc.tolist() == [0.0, 1.0, 3.0, 2.0, 2.0, 3.0, 2.0]

    u8 = client.get("/layers/scan_class.bin?dtype=uint8")
    assert u8.status_code == 200
    arr_u8 = np.frombuffer(u8.content, dtype=np.uint8).reshape(layers.height, layers.width)
    assert set(np.unique(arr_u8)).issubset({0, 1, 2, 3})


def test_step_endpoint_matches_route_and_fast(client, layers):
    route = planner.plan(layers, START, GOAL)[1]
    pts = []
    for i, seg in enumerate(route["segments"]):
        pts.extend(seg["path_px"][1:] if i else seg["path_px"])

    t0 = time.perf_counter()
    resp = client.post("/step", json={"path": pts})
    elapsed_ms = (time.perf_counter() - t0) * 1000.0
    assert resp.status_code == 200
    assert elapsed_ms < 50.0
    data = resp.json()

    assert data["km"] == pytest.approx(route["total"]["km"], abs=0.02)
    assert data["min"] == pytest.approx(route["total"]["min"], abs=0.2)
    assert data["kcal"] == pytest.approx(route["total"]["kcal"], abs=1.5)
    assert data["o2_L"] == pytest.approx(data["kcal"] / P.KCAL_PER_L_O2, abs=0.02)
    assert data["dose_uGy"] == pytest.approx(data["duration_s"] / 3600.0 * P.DOSE_UGY_PER_H, abs=0.02)
    assert sum(v["cells"] for v in data["terrain_classes"].values()) == len(pts)
    assert sum(v["cells"] for v in data["scan_classes"].values()) == len(pts)
    assert len(data["cells"]) == len(pts)

    # /consume takma adı aynı yanıtı üretir
    resp_consume = client.post("/consume", json={"path": pts[:10]})
    assert resp_consume.status_code == 200
    assert resp_consume.json() == client.post("/step", json={"path": pts[:10]}).json()


def test_step_load_kg_and_observations(client):
    subpath = [[110, 235], [111, 235], [112, 235], [113, 235], [114, 235]]
    base = client.post("/step", json={"path": subpath}).json()
    heavy = client.post("/step", json={"path": subpath, "load_kg": 25.0}).json()
    assert heavy["kcal"] > base["kcal"]
    assert heavy["o2_L"] > base["o2_L"]
    assert heavy["duration_s"] == base["duration_s"]

    with_sand = client.post(
        "/step",
        json={
            "path": subpath,
            "observations": [{"px": [112, 235], "radius_m": 50.0, "cls": "sand"}],
        },
    ).json()
    assert with_sand["dominant_class"] == "sand"
    assert with_sand["terrain_classes"]["sand"]["cells"] == len(subpath)
    assert with_sand["duration_s"] > base["duration_s"]
    assert with_sand["kcal"] > base["kcal"]


@pytest.mark.parametrize("bad_body", [
    {"path": []},
    {"path": [[-1, 10]]},
    {"path": [[10, 999]]},
    {"path": [[10, 10]], "load_kg": -5},
    {"path": [[10, 10]], "observations": [{"px": [10, 10], "radius_m": 10, "cls": "invalid"}]},
])
def test_step_validation_errors(client, bad_body):
    assert client.post("/step", json=bad_body).status_code == 422
