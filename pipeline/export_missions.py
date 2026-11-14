# Sprint 3 (issue #47): demo senaryolarini simulasyonun okudugu gorev dosyasina cevirir -> sim/data/missions.json
# Kaynak: layers/demo_scenarios.json (baslangic/hedef/kum). Sayilar planlayicidan (api.planner) gelir, gomulu fizik yok.
# Uc gorev bilerek farkli: S1 rahat (varsayilan limitler), S2 kum rotanin ustunde (replan rotayi kaydirir),
# S3 O2 limiti dusuk (planlayici NO-GO: hedefe varmadan geri donus noktasi).
# Her calistirmada beklenen davranisi dogrular; veri degisip gorev bozulursa hata verir.
# Kullanim: python pipeline/export_missions.py <repo_koku>   (markdown ozet tabloyu stdout'a yazar)
import json, pathlib, sys
import numpy as np

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
sys.path.insert(0, str(ROOT))
from api import planner  # noqa: E402
from api.planner import params as P  # noqa: E402

DEFAULT = {"time_min": P.EVA_MAX_H * 60, "o2_L": P.EVA_MAX_O2_L, "kcal": P.EVA_MAX_KCAL, "dose_uGy": P.EVA_MAX_DOSE_UGY}
DESIGN = {  # senaryo id -> gorev ayari; expect: planlayicidan beklenen
    "S1": {"title": "Boxwork'ten Atacama sondajına", "difficulty": "kolay", "sample_kg": 8, "limits": {}, "expect": "go"},
    "S2": {"title": "Kumlu kestirme", "difficulty": "orta", "sample_kg": 10, "limits": {}, "expect": "sand_reroute"},
    "S3": {"title": "Yarım O₂ tüpü", "difficulty": "zor", "sample_kg": 8, "limits": {"o2_L": 80}, "expect": "turn_back"},
}
SAND_NEAR_M = 20.0     # kabul testi: kum en az bir rotanin 20 m yakininda
REROUTE_MIN_M = 20.0   # S2: replan en az bir rotayi bu kadar kaydirmali
GOAL_RADIUS_M = 5.0    # varis: bilim duragi alani (mission.js varsayilani 2 m, oyuncu icin dar)


def pts(route):
    return np.array([p for s in route["segments"] for p in s["path_px"]], float)


def max_shift_m(a, b, res):
    d = np.sqrt(((a[:, None] - b[None]) ** 2).sum(-1))
    return float(max(d.min(1).max(), d.min(0).max()) * res)


L = planner.load(ROOT)
scen = {s["id"]: s for s in json.loads((ROOT / "layers/demo_scenarios.json").read_text(encoding="utf-8"))["scenarios"]}
missions, rows = [], []
for sid, d in DESIGN.items():
    s = scen[sid]
    start, goal, sand = s["start"]["px"], s["goal"]["px"], s["surprise_sand"]
    limits = {**DEFAULT, **d["limits"]}
    R = planner.plan(L, start, goal, budget=limits)
    R2 = planner.plan(planner.apply_observation(L, sand["px"], sand["radius_m"], "sand"), start, goal, budget=limits)
    assert len({json.dumps([g["path_px"] for g in r["segments"]]) for r in R}) == 3, f"{sid}: 3 farkli rota yok"
    near = min(float(np.hypot(*(pts(r) - sand["px"]).T).min()) * L.res_m for r in R)
    assert near <= SAND_NEAR_M, f"{sid}: kum en yakin rotaya {near:.1f} m"
    shift = max(max_shift_m(pts(a), pts(b), L.res_m) for a, b in zip(R, R2))
    status = [r["total"]["status"] for r in R]
    if d["expect"] == "go":
        assert status == ["GO"] * 3, f"{sid}: {status}"
    elif d["expect"] == "sand_reroute":
        assert status == ["GO"] * 3 and shift >= REROUTE_MIN_M, f"{sid}: {status}, kayma {shift:.1f} m"
    elif d["expect"] == "turn_back":
        assert all(r["total"]["status"] == "NO-GO" and r["total"]["limit_exceeded_at_m"] for r in R), f"{sid}: {status}"
    missions.append({"id": sid, "title": d["title"], "start_px": start, "goal_px": goal,
                     "start_stop": s["start"]["id"], "goal_stop": s["goal"]["id"],
                     "limits": {k: round(v, 1) for k, v in limits.items()},
                     "sand": {"px": sand["px"], "radius_m": sand["radius_m"]},
                     "sample_kg": d["sample_kg"], "difficulty": d["difficulty"],
                     # sim/app/mission.js (#66) bicimi: grid_px = hucre [sutun, satir], coords.cellToWorld ile dunyaya
                     "goal": {"grid_px": goal, "radius_m": GOAL_RADIUS_M},
                     "events": [{"id": f"{sid}-sand", "type": "sand", "grid_px": sand["px"], "radius_m": sand["radius_m"]}]})
    for r, r2 in zip(R, R2):
        t, t2 = r["total"], r2["total"]
        rows.append(f"| {sid} | {r['label']} | {t['km']} | {t['min']} | {t['status']}"
                    f"{' @' + str(t['limit_exceeded_at_m']) + ' m' if t['limit_exceeded_at_m'] else ''} | {t2['km']} | {t2['min']} | {t2['status']}"
                    f"{' @' + str(t2['limit_exceeded_at_m']) + ' m' if t2['limit_exceeded_at_m'] else ''} |")
    rows.append(f"| {sid} | kum en yakın rotaya {near:.0f} m, replan en çok {shift:.0f} m kaydırdı | | | | | | |")

out = ROOT / "sim/data/missions.json"
out.write_text(json.dumps({"source": "layers/demo_scenarios.json + api.planner (pipeline/export_missions.py)",
                           "px_note": "px = [sutun, satir], contracts/grid.json izgarasi; limits = /route budget alanlari",
                           "missions": missions}, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
print("| görev | rota | /route km | dk | durum | /replan km | dk | durum |\n|---|---|---|---|---|---|---|---|")
print("\n".join(rows))
