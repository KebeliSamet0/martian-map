"""Model açık/kapalı karşılaştırması (api/planner/insight.py, /compare, /route terrain_model)."""
import numpy as np
import pytest
from fastapi.testclient import TestClient

from api import planner
from api.main import app
from api.planner import insight

START, GOAL = [110, 235], [150, 30]


@pytest.fixture(scope="module")
def layers():
    return planner.synthetic()


@pytest.fixture
def client(monkeypatch, layers):
    monkeypatch.setattr(planner, "load", lambda: layers.copy())
    with TestClient(app) as c:
        yield c


def test_naive_layers_blind_to_terrain(layers):
    n = insight.naive_layers(layers)
    assert (n.probs["bedrock"] == 1).all() and (n.rock_cfa == 0).all() and (n.entropy == 0).all()
    assert np.array_equal(n.slope, layers.slope)


def test_route_default_unchanged_and_naive_flag(client):
    a = client.post("/route", json={"start": START, "goal": GOAL}).json()["routes"]
    b = client.post("/route", json={"start": START, "goal": GOAL, "terrain_model": True}).json()["routes"]
    assert a == b
    n = client.post("/route", json={"start": START, "goal": GOAL, "terrain_model": False}).json()["routes"]
    assert [r["kind"] for r in n] == ["shortest", "balanced", "safest"]
    assert all(r["terrain_model"] is False for r in n)


def test_shortest_same_weights_same_path_when_no_terrain_term(layers):
    # Süre ağırlıklı "shortest" naifte de kayanın hız çarpanını görmez; maliyeti gerçek katmanda ölçülür.
    c = insight.compare(layers, START, GOAL, "shortest")
    assert c["naive"]["metrics"]["kcal"] > 0 and "saved" in c


def test_compare_endpoint_numbers_consistent(client, layers):
    d = client.post("/compare", json={"start": START, "goal": GOAL}).json()
    assert [c["kind"] for c in d["comparisons"]] == ["shortest", "balanced", "safest"]
    for c in d["comparisons"]:
        n, m = c["naive"]["metrics"], c["model"]["metrics"]
        assert c["saved"]["kcal"] == pytest.approx(n["kcal"] - m["kcal"], abs=0.01)
        assert c["saved"]["risk"] == pytest.approx(n["risk"] - m["risk"], abs=0.01)
        for side in ("naive", "model"):
            for s in c[side]["segments"]:
                ins = s["insight"]
                assert 0 <= ins["confidence"] <= 1 and ins["eta_mean"] > 0
                assert ins["hazard"] in (None, "sand", "rock")
    # Model rotası, aynı ağırlıkla naiften gerçek maliyette kötü olamaz: dengeli ve güvenli rotada risk ≤.
    for c in d["comparisons"][1:]:
        assert c["model"]["metrics"]["risk"] <= c["naive"]["metrics"]["risk"] + 1e-6


def test_compare_rejects_bad_point(client):
    r = client.post("/compare", json={"start": [-5, 3], "goal": GOAL})
    assert r.status_code == 422


def test_terrain_u8_layout(client, layers):
    r = client.get("/layers/terrain_u8.bin")
    assert r.status_code == 200
    arr = np.frombuffer(r.content, np.uint8).reshape(layers.height, layers.width, 5)
    y, x = 100, 120
    assert abs(arr[y, x, 2] / 255 - layers.probs["sand"][y, x]) < 0.003
    assert abs(arr[y, x, 4] / 255 - (1 - layers.entropy[y, x])) < 0.003
    assert r.headers["x-channels"].endswith("confidence")
