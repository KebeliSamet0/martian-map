"""Görev çiftleri için /route yanıtlarını önceden hesaplar (API çökerse sim'in çevrimdışı yedeği).
Kullanım (repo kökünden):  MM_LAYERS_DIR=$PWD python deploy/precompute_missions.py [--check]
Çıktı: sim/data/routes/<görev>.json = {request, response:{grid,routes}, meta}. Aynı planlayıcı çekirdeği, gerçek 1000x1000 katmanlar.
--check: dosyalar güncel mi (yalnız karşılaştırır, yazmaz). Planlayıcı/katman değişince yeniden üret."""
import argparse, hashlib, json, os, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
OUT = ROOT / "sim" / "data" / "routes"


def source_hash():
    h = hashlib.sha256()
    for p in sorted((ROOT / "api" / "planner").glob("*.py")) + [ROOT / "sim" / "data" / "missions.json"]:
        h.update(p.read_bytes())
    return h.hexdigest()[:16]


def build(layers, mission):
    from api import planner
    req = {"start": mission["start_px"], "goal": mission["goal_px"], "budget": mission.get("limits")}
    routes = planner.plan(layers, req["start"], req["goal"], weights=None, budget=req["budget"])
    info = layers.grid_info()
    grid = {k: info[k] for k in ("region", "width", "height", "res_m", "synthetic", "px_note")}
    return {"request": req, "response": {"grid": grid, "routes": routes},
            "meta": {"offline": True, "source": "api.planner (önceden hesaplanmış)", "planner_hash": source_hash()}}


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    from api import planner
    layers = planner.load(Path(os.environ.get("MM_LAYERS_DIR", ROOT)))
    if layers.synthetic:
        sys.exit("Sentetik katman: gerçek katmanla çalıştır (MM_LAYERS_DIR=$PWD).")
    missions = json.loads((ROOT / "sim" / "data" / "missions.json").read_text(encoding="utf-8"))["missions"]
    OUT.mkdir(parents=True, exist_ok=True)
    stale = []
    for m in missions:
        if not (m.get("start_px") and m.get("goal_px")):
            continue
        path = OUT / f"{m['id']}.json"
        if a.check:
            old = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
            if old.get("meta", {}).get("planner_hash") != source_hash():
                stale.append(m["id"])
            continue
        data = build(layers, m)
        path.write_text(json.dumps(data, ensure_ascii=False, allow_nan=False, separators=(",", ":")) + "\n", encoding="utf-8")
        print(path.relative_to(ROOT), path.stat().st_size, "bayt")
    if a.check:
        print("ESKİ:" if stale else "güncel", *stale)
        sys.exit(1 if stale else 0)


if __name__ == "__main__":
    main()
