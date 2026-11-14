"""Zemin modelinin etkisi: "yalnız eğim" (naif) rota ile "zemin modeli + kaya" rotasının karşılaştırması.

Naif rota, zemin sınıfı olasılıkları ve kaya yoğunluğu BİLİNMEYEN bir planlayıcıyı temsil eder: bütün hücreler
düz ana kaya sayılır (η=1, hız çarpanı 1, rock_cfa=0, entropi=0), yalnız DTM eğimi kalır. Rota bu kör yüzeyde
aranır; ama maliyeti GERÇEK katmanlarda ölçülür. Böylece fark, aynı zemine iki ayrı planlayıcının yürümesinin
gerçek bedelidir; ikinci bir uydurma maliyet modeli yoktur.
"""
from __future__ import annotations

import numpy as np

from . import params as P
from .cost import cost_surface
from .layers import Layers
from .route import _budget, _profile, _segments, plan, plan_one, shortest_path

KINDS = ("shortest", "balanced", "safest")
HAZARD_SAND_P = 0.4      # segment kumlu sayılır: ortalama p_sand ≥ bu değer (route._reason ile aynı eşik)
HAZARD_ROCK_CFA = 0.10   # segment kayalık sayılır: ortalama rock_cfa ≥ bu değer (route._reason ile aynı)


def naive_layers(L: Layers) -> Layers:
    """Zemin modelsiz görünüm: yalnız elevation/slope kalır (Layers nesnesi başına önbellekli)."""
    cached = L.__dict__.get("_naive")
    if cached is not None:
        return cached
    N = L.copy()
    N.provisional_terrain = False
    N.probs = {c: np.full_like(L.probs[c], 1.0 if c == "bedrock" else 0.0) for c in P.CLASSES}
    N.rock_cfa = np.zeros_like(L.rock_cfa)
    N.entropy = np.zeros_like(L.entropy)
    L.__dict__["_naive"] = N
    return N


def plan_one_naive(L: Layers, start, goal, kind: str, budget: dict | None = None) -> dict:
    """Yolu naif yüzeyde bul, süre/kcal/risk/segmentleri gerçek katmanlarda hesapla."""
    presets = P.PRESETS if L.synthetic else P.REAL_PRESETS
    w = dict(presets.get(kind, presets["balanced"]))
    path, _ = shortest_path(naive_layers(L), start, goal, w)
    _, terms = cost_surface(L, w)
    prof = _profile(L, path, terms)
    segs = _segments(L, path, prof)
    return {
        "kind": kind, "label": w.get("label", kind), "terrain_model": False,
        "weights": {k: w[k] for k in ("t", "k", "r")},
        "start": {"px": [int(start[0]), int(start[1])]}, "goal": {"px": [int(goal[0]), int(goal[1])]},
        "total": _budget(prof, segs, path, budget), "segments": segs, "_path": path, "_prof": prof,
    }


def attach_insight(L: Layers, route: dict) -> None:
    """Rotanın her segmentine 'insight' ekle (plan() ve compare() ortak kullanır)."""
    _explain(L, naive_layers(L), route["_path"], route["_prof"], route["segments"])


def _explain(L: Layers, N: Layers, path: np.ndarray, prof: dict, segs: list[dict]) -> None:
    """Her segmente yapısal 'neden' sayıları ekle (metin istemcide, texts.json şablonlarından).

    extra_kcal: aynı yolda tüm zemin düz ana kaya olsaydı hesaplanacak kcal'e göre fark (modelin yüklediği bedel).
    eta_mean: Pandolf arazi katsayısı η'nın segment ortalaması (düz ana kaya = 1.0)."""
    from .cost import eta, kcal_per_m
    r, c = path[:, 0], path[:, 1]
    neutral = kcal_per_m(N)[r, c] * prof["step_m"]
    eta_arr = eta(L)[r, c]
    pos = 0
    for s in segs:
        n = len(s["path_px"])
        a, b = pos, pos + n - 1
        pos = b
        real = float(prof["kcal"][a + 1:b + 1].sum())
        flat = float(neutral[a + 1:b + 1].sum())
        s["insight"] = {
            "p": {k: round(float(prof["p"][k][a:b + 1].mean()), 2) for k in P.CLASSES},
            "eta_mean": round(float(eta_arr[a:b + 1].mean()), 2),
            "extra_kcal": round(real - flat, 1),
            "confidence": round(1.0 - float(prof["ent"][a:b + 1].mean()), 2),
            "hazard": hazard_of(s),
        }


def hazard_of(seg: dict) -> str | None:
    if seg["p_sand"] >= HAZARD_SAND_P or seg["class"] == "sand":
        return "sand"
    if seg["class"] == "bigrock" or seg["p_bigrock"] >= 0.4 or seg["rock_cfa"] >= HAZARD_ROCK_CFA:
        return "rock"
    return None


def _metrics(route: dict) -> dict:
    t, prof = route["total"], route["_prof"]
    step, p = prof["step_m"], prof["p"]
    dom = prof["dom"]
    ci = {k: i for i, k in enumerate(P.CLASSES)}
    return {
        "m": round(float(prof["cum_m"][-1]), 0),
        "min": t["min"], "kcal": t["kcal"], "o2_L": round(t["kcal"] / P.KCAL_PER_L_O2, 1),
        "eva_kcal": t["eva_kcal"], "eva_o2_L": t["o2_L"],
        "risk": round(float(prof["risk"].sum()), 2),
        "sand_m": round(float(step[dom == ci["sand"]].sum()), 0),
        "sand_expected_m": round(float((p["sand"] * step).sum()), 0),
        "rock_m": round(float(step[dom == ci["bigrock"]].sum()), 0),
        "low_conf_m": t["low_conf_m"], "status": t["status"], "slope_max": t["slope_max"],
    }


def compare(L: Layers, start, goal, kind: str = "balanced", budget: dict | None = None) -> dict:
    """Tek rota türü için naif ve model rotası, fark ve tek cümlelik sonuç sayıları."""
    model = plan_one(L, start, goal, kind, None, budget)
    naive = plan_one_naive(L, start, goal, kind, budget)
    for r in (model, naive):
        attach_insight(L, r)
    mm, nm = _metrics(model), _metrics(naive)
    keys = ("m", "min", "kcal", "o2_L", "eva_kcal", "eva_o2_L", "risk", "sand_m", "sand_expected_m", "rock_m")
    saved = {k: round(nm[k] - mm[k], 2) for k in keys}   # + = model kazandırdı
    same = bool(np.array_equal(model["_path"], naive["_path"]))
    out = {
        "kind": kind, "label": model["label"], "same_path": same,
        "model": {**{k: v for k, v in model.items() if not k.startswith("_")}, "metrics": mm},
        "naive": {**{k: v for k, v in naive.items() if not k.startswith("_")}, "metrics": nm},
        "saved": saved,
        "naive_hazard_m": round(float(sum(s["len_m"] for s in naive["segments"] if s["insight"]["hazard"])), 0),
        "model_hazard_m": round(float(sum(s["len_m"] for s in model["segments"] if s["insight"]["hazard"])), 0),
        "note": "Naif rota zemin sınıfını bilmeden planlanır, maliyeti gerçek katmanlarda ölçülür. Zemin katmanı model tahminidir (ölçüm değil).",
    }
    return out


def compare_all(L: Layers, start, goal, budget: dict | None = None) -> dict:
    return {"comparisons": [compare(L, start, goal, k, budget) for k in KINDS],
            "provisional_terrain": L.provisional_terrain, "synthetic": L.synthetic}
