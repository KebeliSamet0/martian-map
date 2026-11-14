"""Zemin katmanlarının özeti + S1 görevi rotaları (PR'daki önce/sonra tablosu için).

Repo kökünden (API bağımlılıklarıyla): MARTIAN_LAYERS_DIR=. python ml/rover_terrain/layer_report.py
Çıktı: JSON tek satır — unknown_frac (entropy ≥ 0,6), baskın sınıf payları, ortalama olasılıklar, S1 rota toplamları.
"""
import json, os, sys
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
CLASSES = ("soil", "bedrock", "sand", "bigrock")


def main():
    L = ROOT / "layers"
    P = np.stack([np.load(L / f"p_{c}.npy") for c in CLASSES]); E = np.load(L / "entropy.npy")
    dom = P.argmax(0)
    out = dict(unknown_frac=round(float((E >= 0.6).mean()), 3), entropy_mean=round(float(E.mean()), 3),
               dominant={c: round(float((dom == k).mean()), 3) for k, c in enumerate(CLASSES)},
               p_mean={c: round(float(P[k].mean()), 3) for k, c in enumerate(CLASSES)},
               p_sand_max=round(float(P[2].max()), 3))
    from fastapi.testclient import TestClient
    from api.main import app
    m = json.load(open(ROOT / "sim/data/missions.json", encoding="utf-8"))
    s1 = next(x for x in m.get("missions", m) if x["id"] == "S1")
    with TestClient(app) as c:
        g = c.get("/grid").json()
        out["provisional_terrain"] = g.get("provisional_terrain")
        r = c.post("/route", json={"start": s1["start_px"], "goal": s1["goal_px"]}).json()
        out["S1"] = {rt["kind"]: {k: rt["total"][k] for k in ("km", "min", "kcal", "low_conf_m")} for rt in r["routes"]}
    print(json.dumps(out, ensure_ascii=False))


if __name__ == "__main__":
    main()
