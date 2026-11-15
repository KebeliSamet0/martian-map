"""Tur 4 plan desk: maliyet modeli kod denetimi F01-F06 (docs/data/ekip/maliyet_modeli_kod_denetimi.md)."""
import numpy as np
import pytest
from fastapi.testclient import TestClient

from api import planner
from api.main import app
from api.planner import params as P
from api.planner.cost import ModelDomainError, metabolic_w
from api.planner.layers import Layers


def grid(h, w, res=10.0, slope=None):
    z = np.zeros((h, w), dtype=np.float32)
    return Layers(w, h, res, z.copy(), z.copy() if slope is None else np.asarray(slope, dtype=np.float32), z.copy(),
                  {c: np.full_like(z, float(c == "bedrock")) for c in P.CLASSES}, z.copy())


def route(L, start, goal, kind="shortest", **kw):
    return planner.plan_one(L, start, goal, kind, **kw)


# ---- F04 ----
def test_f04_user_limit_applies_to_endpoints():
    s = np.zeros((5, 20)); s[2, 19] = 20          # hedef hücre 20°
    L = grid(5, 20, slope=s)
    r = route(L, [0, 2], [19, 2], max_slope_deg=10)
    t = r["total"]
    assert t["go"] is False and t["status"] in ("GO", "NO-GO")
    assert t["slope_limit_violations"] == [{"point": "goal", "px": [19, 2], "slope_deg": 20.0, "limit_deg": 10.0}]
    assert any("eğim sınırını aşıyor" in w for w in t["warnings"])
    # sınır yokken (25° altında) aynı yol GO
    assert route(L, [0, 2], [19, 2])["total"]["go"] is True


def test_f04_interior_never_exceeds_limit():
    s = np.zeros((5, 20)); s[:, 10] = 15            # tam 15° duvar, kullanıcı sınırı 10°
    L = grid(5, 20, slope=s)
    with pytest.raises(planner.PlanError):
        route(L, [0, 2], [19, 2], max_slope_deg=10)


# ---- F06 ----
def test_f06_no_corner_cutting_blocks_zero_width_gap():
    L = grid(2, 2, slope=[[0, 30], [30, 0]])
    with pytest.raises(planner.PlanError):
        route(L, [0, 0], [1, 1])


def test_f06_diagonal_with_one_blocked_side_detours():
    L = grid(2, 2, slope=[[0, 0], [30, 0]])       # (x0,y1) engelli: çapraz (0,0)->(1,1) yasak
    r = route(L, [0, 0], [1, 1])
    assert r["total"]["km"] == pytest.approx(0.02)  # 2 dik adım (20 m), çapraz 14.1 m değil
    assert len(r["segments"][0]["path_px"]) == 3


def test_f06_free_diagonal_still_allowed():
    L = grid(3, 3)
    assert len(route(L, [0, 0], [2, 2])["segments"][0]["path_px"]) == 3   # iki çapraz adım, 3 nokta


# ---- F03 ----
def snap_grid():
    s = np.zeros((5, 8)); s[2, 2] = 30
    return grid(5, 8, slope=s)


def test_f03_snap_reported_and_connector_costed():
    L = snap_grid()
    r = route(L, [2, 2], [7, 2])
    t = r["total"]
    e = t["endpoints"]["start"]
    assert e["requested"] == [2, 2] and e["used"] != e["requested"] and e["snap_m"] == pytest.approx(10.0)
    assert t["endpoints"]["goal"]["snap_m"] == 0
    assert r["segments"][0]["path_px"][0] == [2, 2]            # yol istenen noktadan başlar
    assert t["snap_connector_cells"] == 1
    direct = route(grid(5, 8), [2, 2], [7, 2])["total"]
    assert t["km"] >= direct["km"] - 1e-9                       # bağlantı toplam mesafeye dahil
    assert t["go"] is True and any("bağlandı" in w for w in t["warnings"])


def test_f03_blocked_connector_is_error():
    s = np.full((5, 5), 30.0); s[:, 0] = 0
    L = grid(5, 5, res=5.0, slope=s)                           # (2,2) istenen; en yakın geçilebilir (0,2); ara hücre 30°
    with pytest.raises(planner.PlanError, match="bağlantı geçilemez"):
        route(L, [2, 2], [0, 4])


# ---- F05 ----
def test_f05_consumption_scopes_consistent():
    L = grid(5, 30)
    t = route(L, [0, 2], [29, 2], budget=None)["total"]
    c = t["consumption"]
    assert set(c) >= {"outbound", "return", "science", "reserve", "committed"}
    for k in ("min", "kcal", "o2_L", "dose_uGy"):
        parts = sum(c[x][k] for x in ("outbound", "return", "science", "reserve"))
        assert c["committed"][k] == pytest.approx(parts, abs=3e-3)   # parçalar ayrı yuvarlanır
        used = t["budget"]["used"]["time_min" if k == "min" else k]
        assert c["committed"][k] == pytest.approx(used, abs=2e-3)   # HUD/GO aynı toplam
    assert c["outbound"]["kcal"] == pytest.approx(t["kcal"], abs=1)               # eski alanlar duruyor
    assert 2 * c["outbound"]["kcal"] == pytest.approx(t["eva_kcal"], abs=1)
    assert c["reserve"]["min"] == P.RESERVE_MIN and c["science"]["min"] == P.SCIENCE_STOP_MIN


# ---- F02 ----
def test_f02_negative_power_raises_not_clamps():
    eta = np.array(1.0)
    with pytest.raises(ModelDomainError):
        metabolic_w(np.array(1.0), np.array(-50.0), eta)   # eskiden -323 W döndü
    with pytest.raises(ModelDomainError):
        metabolic_w(np.array(np.inf), np.array(0.0), eta)
    assert float(metabolic_w(np.array(1.0), np.array(10.0), eta)) > 0


def test_f02_step_directional_flag_exposes_descent_clamp():
    L = grid(3, 10)
    L.elevation[:, :] = np.linspace(10, 0, 10)
    out = planner.evaluate_step(L, [[0, 1], [9, 1]])
    assert out["directional"]["descent_grade_clamped"] is True


# ---- F01 ----
def test_f01_assumptions_mars_validated_false(monkeypatch):
    monkeypatch.setattr(planner, "load", lambda: grid(3, 3))
    with TestClient(app) as c:
        items = c.get("/assumptions").json()
    flagged = [i for i in items if i.get("mars_validated") is False]
    assert flagged and any("Pandolf Dünya modeli" in i["source"] and "doğrulanmamış" in i["source"] for i in flagged)
