"""Gerçek Gale katmanlarıyla uçtan uca duman testi (smoke test).

Repo kökünden:
    .venv/bin/python scripts/smoke.py
"""
from __future__ import annotations

import json
import math
import os
from pathlib import Path
import sys
import time

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from fastapi.testclient import TestClient
from api.main import app


def midpoint_px(route: dict) -> list[int]:
    pts = []
    for i, seg in enumerate(route["segments"]):
        pts.extend(seg["path_px"][1:] if i else seg["path_px"])
    mid = pts[len(pts) // 2]
    return [int(mid[0]), int(mid[1])]


def run_smoke(layers_dir: Path = ROOT) -> dict:
    stops_path = layers_dir / "layers" / "science_stops.json"
    if not stops_path.exists():
        stops_path = layers_dir / "science_stops.json"
    stops = json.loads(stops_path.read_text(encoding="utf-8"))
    if len(stops) < 2:
        raise RuntimeError("En az iki bilim durağı gerekli")

    start_stop, goal_stop = stops[0], stops[2] if len(stops) > 2 else stops[1]
    start = [math.floor(start_stop["px"][0]), math.floor(start_stop["px"][1])]
    goal = [math.floor(goal_stop["px"][0]), math.floor(goal_stop["px"][1])]

    prev_env = os.environ.get("MARTIAN_LAYERS_DIR")
    os.environ["MARTIAN_LAYERS_DIR"] = str(layers_dir)
    try:
        t0 = time.perf_counter()
        with TestClient(app) as client:
            load_s = time.perf_counter() - t0
            grid_resp = client.get("/grid")
            if grid_resp.status_code != 200:
                raise RuntimeError(f"/grid hatası: {grid_resp.status_code} {grid_resp.text}")
            grid = grid_resp.json()
            if grid.get("synthetic"):
                raise RuntimeError("Gerçek katman yerine sentetik katman yüklendi")

            assumptions_resp = client.get("/assumptions")
            if assumptions_resp.status_code != 200:
                raise RuntimeError(f"/assumptions hatası: {assumptions_resp.status_code}")

            t_route = time.perf_counter()
            route_resp = client.post("/route", json={"start": start, "goal": goal})
            route_s = time.perf_counter() - t_route
            if route_resp.status_code != 200:
                raise RuntimeError(f"/route hatası: {route_resp.status_code} {route_resp.text}")
            routes = route_resp.json()["routes"]
            if [r["kind"] for r in routes] != ["shortest", "balanced", "safest"]:
                raise RuntimeError(f"Beklenen 3 ön ayar gelmedi: {[r['kind'] for r in routes]}")

            mid = midpoint_px(routes[1])
            t_replan = time.perf_counter()
            replan_resp = client.post(
                "/replan",
                json={
                    "start": start,
                    "goal": goal,
                    "observations": [{"px": mid, "radius_m": 60.0, "cls": "sand"}],
                },
            )
            replan_s = time.perf_counter() - t_replan
            if replan_resp.status_code != 200:
                raise RuntimeError(f"/replan hatası: {replan_resp.status_code} {replan_resp.text}")
            replanned = replan_resp.json()["routes"]
            if [r["kind"] for r in replanned] != ["shortest", "balanced", "safest"]:
                raise RuntimeError("Replan 3 ön ayar döndürmedi")
            if not any(
                a["total"]["kcal"] != b["total"]["kcal"]
                or a["total"]["min"] != b["total"]["min"]
                or [s["path_px"] for s in a["segments"]] != [s["path_px"] for s in b["segments"]]
                for a, b in zip(routes, replanned)
            ):
                raise RuntimeError("Kum gözlemi hiçbir rotayı veya maliyeti değiştirmedi")
    finally:
        if prev_env is None:
            os.environ.pop("MARTIAN_LAYERS_DIR", None)
        else:
            os.environ["MARTIAN_LAYERS_DIR"] = prev_env

    return {
        "region": grid["region"],
        "size": f"{grid['width']}x{grid['height']}",
        "res_m": grid["res_m"],
        "provisional_terrain": grid.get("provisional_terrain"),
        "terrain_note": grid.get("terrain_note"),
        "start_stop": {"id": start_stop["id"], "px": start},
        "goal_stop": {"id": goal_stop["id"], "px": goal},
        "observation_px": mid,
        "load_s": round(load_s, 3),
        "route_s": round(route_s, 3),
        "replan_s": round(replan_s, 3),
        "route_summary": [
            {
                "kind": r["kind"],
                "km": r["total"]["km"],
                "min": r["total"]["min"],
                "kcal": r["total"]["kcal"],
                "status": r["total"]["status"],
                "go": r["total"]["go"],
            }
            for r in routes
        ],
        "replan_summary": [
            {
                "kind": r["kind"],
                "km": r["total"]["km"],
                "min": r["total"]["min"],
                "kcal": r["total"]["kcal"],
                "status": r["total"]["status"],
                "go": r["total"]["go"],
            }
            for r in replanned
        ],
    }


def main() -> int:
    try:
        summary = run_smoke(ROOT)
    except Exception as exc:
        print(f"SMOKE HATA: {exc}", file=sys.stderr)
        return 1
    print(f"Bölge: {summary['region']} ({summary['size']}, {summary['res_m']} m)")
    if summary.get("terrain_note"):
        print(f"Not: {summary['terrain_note']}")
    print(
        f"Duraklar: {summary['start_stop']['id']} {summary['start_stop']['px']} -> "
        f"{summary['goal_stop']['id']} {summary['goal_stop']['px']}"
    )
    print(
        f"Süreler: yükleme={summary['load_s']:.3f}s, "
        f"/route={summary['route_s']:.3f}s, /replan={summary['replan_s']:.3f}s"
    )
    for label, key in (("/route", "route_summary"), ("/replan (kum gözlemi)", "replan_summary")):
        parts = [
            f"{r['kind']}: {r['km']} km, {r['min']} dk, {r['kcal']:.0f} kcal, {r['status']}"
            for r in summary[key]
        ]
        print(f"{label}: " + " | ".join(parts))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
