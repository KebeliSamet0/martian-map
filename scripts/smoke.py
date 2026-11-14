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


def route_cells(route: dict) -> list[tuple[int, int]]:
    pts = []
    for i, seg in enumerate(route["segments"]):
        pts.extend(seg["path_px"][1:] if i else seg["path_px"])
    return [(int(p[0]), int(p[1])) for p in pts]


def midpoint_px(route: dict) -> list[int]:
    pts = route_cells(route)
    mid = pts[len(pts) // 2]
    return [mid[0], mid[1]]


def overlap_ratio(route_a: dict, route_b: dict) -> float:
    sa, sb = set(route_cells(route_a)), set(route_cells(route_b))
    return len(sa & sb) / max(len(sa | sb), 1)


def run_smoke(layers_dir: Path = ROOT) -> dict:
    stops_path = layers_dir / "layers" / "science_stops.json"
    if not stops_path.exists():
        stops_path = layers_dir / "science_stops.json"
    stops = json.loads(stops_path.read_text(encoding="utf-8"))
    if len(stops) < 2:
        raise RuntimeError("En az iki bilim durağı gerekli")

    start_stop, goal_stop = stops[0], stops[-1]
    start = [math.floor(start_stop["px"][0]), math.floor(start_stop["px"][1])]
    goal = [math.floor(goal_stop["px"][0]), math.floor(goal_stop["px"][1])]
    long_start, long_goal = [150, 150], [850, 850]

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
            if not all(8 <= len(r["segments"]) <= 25 for r in routes):
                raise RuntimeError(f"Segment sayısı 8-25 aralığında değil: {[len(r['segments']) for r in routes]}")
            if overlap_ratio(routes[0], routes[2]) >= 0.85:
                raise RuntimeError("Kısa ve güvenli rotalar yeterince ayrışmadı")

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

            t_long = time.perf_counter()
            long_resp = client.post("/route", json={"start": long_start, "goal": long_goal})
            long_s = time.perf_counter() - t_long
            if long_resp.status_code != 200:
                raise RuntimeError(f"Uzun /route hatası: {long_resp.status_code} {long_resp.text}")
            long_routes = long_resp.json()["routes"]
            if not all(8 <= len(r["segments"]) <= 25 for r in long_routes):
                raise RuntimeError(f"Uzun rotada segment sayısı 8-25 aralığında değil: {[len(r['segments']) for r in long_routes]}")
            overlaps_long = {
                "shortest_balanced": round(overlap_ratio(long_routes[0], long_routes[1]), 3),
                "balanced_safest": round(overlap_ratio(long_routes[1], long_routes[2]), 3),
                "shortest_safest": round(overlap_ratio(long_routes[0], long_routes[2]), 3),
            }
            if any(v >= 0.75 for v in overlaps_long.values()):
                raise RuntimeError(f"Uzun rotada üç ön ayar yeterince ayrışmadı: {overlaps_long}")
    finally:
        if prev_env is None:
            os.environ.pop("MARTIAN_LAYERS_DIR", None)
        else:
            os.environ["MARTIAN_LAYERS_DIR"] = prev_env

    def summarize(rlist):
        return [
            {
                "kind": r["kind"],
                "km": r["total"]["km"],
                "min": r["total"]["min"],
                "kcal": r["total"]["kcal"],
                "segments": len(r["segments"]),
                "status": r["total"]["status"],
                "go": r["total"]["go"],
            }
            for r in rlist
        ]

    return {
        "region": grid["region"],
        "size": f"{grid['width']}x{grid['height']}",
        "res_m": grid["res_m"],
        "provisional_terrain": grid.get("provisional_terrain"),
        "terrain_note": grid.get("terrain_note"),
        "reachability": grid.get("reachability"),
        "start_stop": {"id": start_stop["id"], "px": start},
        "goal_stop": {"id": goal_stop["id"], "px": goal},
        "long_pair": {"start": long_start, "goal": long_goal},
        "observation_px": mid,
        "load_s": round(load_s, 3),
        "route_s": round(route_s, 3),
        "replan_s": round(replan_s, 3),
        "long_route_s": round(long_s, 3),
        "route_summary": summarize(routes),
        "replan_summary": summarize(replanned),
        "long_route_summary": summarize(long_routes),
        "long_overlaps": overlaps_long,
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
    if summary.get("reachability"):
        rc = summary["reachability"]
        print(f"Erişilebilirlik: geçilebilir=%{rc['passable_pct']}, ana bileşen=%{rc['main_component_pct']} ({rc['component_count']} bileşen)")
    print(
        f"Duraklar: {summary['start_stop']['id']} {summary['start_stop']['px']} -> "
        f"{summary['goal_stop']['id']} {summary['goal_stop']['px']}"
    )
    print(
        f"Süreler: yükleme={summary['load_s']:.3f}s, "
        f"/route={summary['route_s']:.3f}s, /replan={summary['replan_s']:.3f}s, "
        f"uzun_rota={summary['long_route_s']:.3f}s"
    )
    for label, key in (
        ("/route (duraklar)", "route_summary"),
        ("/replan (kum gözlemi)", "replan_summary"),
        ("/route (uzun [150,150]->[850,850])", "long_route_summary"),
    ):
        parts = [
            f"{r['kind']}: {r['km']} km, {r['min']} dk, {r['kcal']:.0f} kcal, seg={r['segments']}, {r['status']}"
            for r in summary[key]
        ]
        print(f"{label}: " + " | ".join(parts))
    print(f"Uzun rota ortak hücre oranları: {summary['long_overlaps']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
