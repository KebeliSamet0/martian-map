import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[2]
MISSIONS = json.loads((ROOT / "sim/data/missions.json").read_text(encoding="utf-8"))["missions"]


def test_precomputed_routes_match_missions_and_real_grid():
    contract = json.loads((ROOT / "contracts/grid.json").read_text(encoding="utf-8"))
    for m in MISSIONS:
        d = json.loads((ROOT / f"sim/data/routes/{m['id']}.json").read_text(encoding="utf-8"))
        assert d["request"] == {"start": m["start_px"], "goal": m["goal_px"], "budget": m.get("limits")}
        g = d["response"]["grid"]
        assert (g["width"], g["height"], g["res_m"]) == (contract["width"], contract["height"], contract["res_m"])
        assert g["synthetic"] is False and d["meta"]["offline"] is True
        assert {r["kind"] for r in d["response"]["routes"]} == {"shortest", "balanced", "safest"}


@pytest.fixture(scope="module")
def client():
    import os
    os.environ["MM_LAYERS_DIR"] = str(ROOT)
    from deploy.server import app
    with TestClient(app) as c:
        yield c


def test_single_container_serves_sim_and_api(client):
    assert client.get("/health").json() == {"status": "ok"}
    r = client.get("/", follow_redirects=False)
    assert r.status_code in (302, 307) and r.headers["location"] == "/sim/"
    assert client.get("/sim/").status_code == 200
    assert client.get("/contracts/grid.json").status_code == 200
    assert client.get("/grid").json()["synthetic"] is False
    assert len(client.get("/layers/p_sand.bin").content) == 1000 * 1000 * 4      # API ucu statik bağlamadan önce gelir
    assert client.get("/layers/p_sand.npy").status_code == 200                    # statik yedek


def test_route_matches_precomputed(client):
    m = MISSIONS[0]
    d = json.loads((ROOT / f"sim/data/routes/{m['id']}.json").read_text(encoding="utf-8"))
    live = client.post("/route", json={"start": m["start_px"], "goal": m["goal_px"], "budget": m["limits"]}).json()
    assert live == d["response"]
