from io import BytesIO

import numpy as np
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from api.main import app
from api import planner
from api.planner.route import _contrast

START, GOAL = [110, 235], [150, 30]


@pytest.fixture(scope="module")
def layers():
    return planner.synthetic()


@pytest.fixture(scope="module")
def routes(layers):
    return planner.plan(layers, START, GOAL)


@pytest.fixture
def client(monkeypatch, layers):
    monkeypatch.setattr(planner, "load", lambda: layers.copy())
    with TestClient(app) as client:
        yield client


def test_three_routes_and_shortest(routes):
    assert [r["kind"] for r in routes] == ["shortest", "balanced", "safest"]
    assert routes[0]["total"]["min"] <= min(r["total"]["min"] for r in routes[1:])
    for r in routes:
        # km iki, segment metreleri bir ondalık basamakla yuvarlanır.
        tolerance_m = 5 + 0.05 * len(r["segments"])
        assert abs(sum(s["len_m"] for s in r["segments"]) - r["total"]["km"] * 1000) <= tolerance_m
        assert "_path" not in r and "_prof" not in r


def test_route_and_metadata(client, routes):
    response = client.post("/route", json={"start": START, "goal": GOAL})
    assert response.status_code == 200
    assert response.json()["routes"] == routes
    assert response.json()["grid"]["synthetic"] is True
    assert client.get("/health").json() == {"status": "ok"}
    assert client.get("/grid").json()["width"] == 250
    assert client.get("/assumptions").json()
    cors = client.options("/route", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"})
    assert cors.headers["access-control-allow-origin"] == "*"


def test_impassable(client):
    app.state.layers.slope[START[1], START[0]] = 30
    response = client.post("/route", json={"start": START, "goal": GOAL})
    assert response.status_code == 422
    assert "geçilmez" in response.json()["detail"]


def test_replan_changes_route_or_cost_and_is_isolated(client, routes):
    response = client.post("/replan", json={"start": START, "goal": GOAL,
        "observations": [{"px": START, "radius_m": 600, "cls": "sand"}]})
    assert response.status_code == 200
    changed = response.json()["routes"]
    assert any(a["total"]["kcal"] != b["total"]["kcal"] or
               [s["path_px"] for s in a["segments"]] != [s["path_px"] for s in b["segments"]]
               for a, b in zip(routes, changed))
    assert client.post("/route", json={"start": START, "goal": GOAL}).json()["routes"] == routes


@pytest.mark.parametrize("name", ["slope", "rock_cfa", "p_sand", "p_bedrock", "p_soil", "p_bigrock", "entropy", "elevation"])
def test_layers(client, layers, name):
    response = client.get(f"/layers/{name}.png")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    im = Image.open(BytesIO(response.content))
    assert im.size == (layers.width, layers.height)
    assert im.mode == "RGBA"
    raw = client.get(f"/layers/{name}.bin")
    assert raw.status_code == 200
    data = np.frombuffer(raw.content, dtype="<f4").reshape(layers.height, layers.width)
    expected = layers.probs[name[2:]] if name.startswith("p_") else getattr(layers, name)
    np.testing.assert_array_equal(data, expected)


@pytest.mark.parametrize("body", [
    {"start": [-1, 0], "goal": GOAL},
    {"start": [1.5, 0], "goal": GOAL},
    {"start": START, "goal": GOAL, "weights": {"t": -1, "k": 0, "r": 0}},
    {"start": START, "goal": GOAL, "weights": {"t": 0, "k": 0, "r": 0}},
])
def test_invalid_route(client, body):
    assert client.post("/route", json=body).status_code == 422


@pytest.mark.parametrize("obs", [
    {"px": START, "radius_m": -1, "cls": "sand"},
    {"px": START, "radius_m": 100, "cls": "unknown"},
    {"px": [999, 999], "radius_m": 100, "cls": "sand"},
])
def test_invalid_observation(client, obs):
    assert client.post("/replan", json={"start": START, "goal": GOAL, "observations": [obs]}).status_code == 422


def test_unknown_layer(client):
    assert client.get("/layers/unknown.png").status_code == 404
    assert client.get("/layers/unknown.bin").status_code == 404


def contrast_fixture(seconds, kcal, risk=1, slope=2, sand=0.1, ent=0.1):
    path = np.array([[0, 0], [0, 10], [0, 20]])
    prof = {"sec": np.array([0, seconds/2, seconds/2]),
            "kcal": np.array([0, kcal/2, kcal/2]),
            "risk": np.array([0, risk/2, risk/2]),
            "cum_m": np.array([0, 10, 20]),
            "slope": np.full(3, slope), "p": {"sand": np.full(3, sand)},
            "ent": np.full(3, ent)}
    return {"_path": path, "_prof": prof, "label": "Alternatif",
            "segments": [{"path_px": path.tolist(), "rejected_alt": None}]}


@pytest.mark.parametrize("dt,dk,risk,expected", [
    (-120, -11, 1, None), (-120, -11, 2, "daha yüksek risk"),
    (59, 4.9, 2, None), (60, 0, 1, "1 dk daha uzun süre"),
    (0, 5, 1, "5 kcal daha fazla enerji"),
])
def test_contrast_only_real_disadvantages(dt, dk, risk, expected):
    chosen = contrast_fixture(300, 100)
    alt = contrast_fixture(300 + dt, 100 + dk, risk=risk)
    alt["_path"][1, 0] = 100
    _contrast(chosen, alt, 1)
    text = chosen["segments"][0]["rejected_alt"]
    if expected is None:
        assert text is None
    else:
        assert expected in text
        assert "-11" not in text
        assert "daha kısa ama" not in text


def test_contrast_does_not_claim_equal_terrain_is_worse():
    chosen = contrast_fixture(300, 100, slope=20, sand=0.7, ent=0.8)
    alt = contrast_fixture(420, 100, slope=20, sand=0.7, ent=0.8)
    alt["_path"][1, 0] = 100
    _contrast(chosen, alt, 1)
    text = chosen["segments"][0]["rejected_alt"]
    assert "2 dk daha uzun süre" in text
    assert all(word not in text for word in ("eğim", "kum", "güven", "risk"))



def test_disconnected_points(client):
    app.state.layers.slope[100, :] = 30
    response = client.post('/route', json={'start': START, 'goal': GOAL})
    assert response.status_code == 422
    assert 'geçilebilir yol yok' in response.json()['detail']


def test_weights_only_override_balanced(client, routes):
    response = client.post('/route', json={'start': START, 'goal': GOAL,
        'weights': {'t': 1, 'k': 0, 'r': 0}})
    assert response.status_code == 200
    result = response.json()['routes']
    assert result[0] == routes[0]
    # Açıklamalar diğer alternatiflere bağlı olduğu için geometrileri karşılaştır.
    assert result[2]['total'] == routes[2]['total']
    assert result[1]['weights'] == {'t': 1, 'k': 0, 'r': 0}
    assert result[1]['total'] == result[0]['total']


def test_load_once_per_lifespan(monkeypatch, layers):
    calls = []
    def load():
        calls.append(True)
        return layers
    monkeypatch.setattr(planner, 'load', load)
    with TestClient(app) as client:
        client.get('/grid')
        client.get('/grid')
        client.get('/layers/slope.png')
        assert len(calls) == 1


def test_contract_is_actual_output(layers):
    import json
    from pathlib import Path
    example = json.loads((Path(__file__).parents[2] / 'contracts/route.example.json').read_text())
    route = example['routes'][0]
    actual = planner.plan(layers, route['start']['px'], route['goal']['px'])[1]
    assert route == actual
    assert len(route['segments']) == 2
