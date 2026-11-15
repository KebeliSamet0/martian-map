"""Gerçek kaya engeli (Emre #98 MARTIAN_ROCK_BLOCK üstüne: kind farkındalığı + varsayılan açık)."""
import json
from pathlib import Path

import numpy as np
import pytest

from api import planner
from api.planner import cost

ROOT = Path(__file__).resolve().parents[2]
ROCKS = json.loads((ROOT / "sim/data/rocks.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def real_layers():
    L = planner.load(ROOT)
    if L.synthetic or L.slope.shape != (1000, 1000):
        pytest.skip("gerçek katman yok")
    return L


def test_varsayilan_acik_ve_kapatilabilir(monkeypatch):
    monkeypatch.delenv("MARTIAN_ROCK_BLOCK", raising=False)
    assert cost.rock_block_enabled()
    monkeypatch.setenv("MARTIAN_ROCK_BLOCK", "0")
    assert not cost.rock_block_enabled()


def test_kapaliyken_maske_yok(real_layers, monkeypatch):
    monkeypatch.setenv("MARTIAN_ROCK_BLOCK", "0")
    assert cost.rock_block_mask(real_layers) is None


def test_sentetik_katmanda_maske_yok():
    assert cost.rock_block_mask(planner.synthetic()) is None


def test_kind_farkindaligi(real_layers, monkeypatch):
    monkeypatch.delenv("MARTIAN_ROCK_BLOCK", raising=False)
    m = cost.rock_block_mask(real_layers)
    assert m is not None and m.any()
    for rk in ROCKS:
        x, y = rk["px"]
        inside = bool(m[int(y), int(x)])
        if rk.get("kind", "rock") in ("rock", "outcrop"):
            assert inside, f"engel olmalı: {rk}"
    # shadow merkezi, başka bir engelin içinde değilse serbest olmalı
    others = [r for r in ROCKS if r.get("kind", "rock") != "shadow"]
    free = 0
    for rk in ROCKS:
        if rk.get("kind") != "shadow":
            continue
        x, y = rk["px"]
        if all(np.hypot(x - o["px"][0], y - o["px"][1]) * real_layers.res_m > o["d_m"] / 2 + 3 for o in others):
            assert not m[int(y), int(x)], f"shadow engel olmamalı: {rk}"
            free += 1
    assert free > 0, "izole shadow bulunamadı (test anlamsız)"


def test_cost_yuzeyi_kayada_sonsuz(real_layers, monkeypatch):
    monkeypatch.delenv("MARTIAN_ROCK_BLOCK", raising=False)
    w = {"t": 1.0, "k": 0.0, "r": 0.0}
    c_on, _ = cost.cost_surface(real_layers, w)
    monkeypatch.setenv("MARTIAN_ROCK_BLOCK", "0")
    c_off, _ = cost.cost_surface(real_layers, w)
    assert np.isinf(c_on).sum() > np.isinf(c_off).sum()


def test_rotalar_kayaya_girmez(real_layers, monkeypatch):
    monkeypatch.delenv("MARTIAN_ROCK_BLOCK", raising=False)
    m = cost.rock_block_mask(real_layers)
    ms = json.loads((ROOT / "sim/data/missions.json").read_text(encoding="utf-8"))["missions"]
    for mi in ms:
        if not (mi.get("start_px") and mi.get("goal_px")):
            continue
        for r in planner.plan(real_layers, mi["start_px"], mi["goal_px"], weights=None, budget=mi.get("limits")):
            for s in r["segments"]:
                for x, y in s["path_px"]:
                    assert not m[int(y), int(x)], f"{mi['id']}/{r['kind']} kaya hücresinden geçiyor: {(x, y)}"
