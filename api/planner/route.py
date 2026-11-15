"""Rota planlama, segmentleme, açıklama ve EVA bütçesi."""
from __future__ import annotations

from dataclasses import dataclass
import math

import numpy as np
from scipy.ndimage import uniform_filter1d
from skimage.graph import MCP_Geometric

from . import params as P
from .cost import cost_surface, flat_bedrock_kcal_per_m, kcal_per_m, metabolic_w, o2_g_per_m, o2_l_per_m, risk_per_m, speed_ms
from .layers import PROVISIONAL_TERRAIN_NOTE, Layers


class PlanError(ValueError):
    pass


def _check(L: Layers, px, snap: bool = True):
    x, y = math.floor(px[0]), math.floor(px[1])
    if not (0 <= x < L.width and 0 <= y < L.height):
        raise PlanError(f"Nokta ızgara dışında: {px} (genişlik {L.width}, yükseklik {L.height})")
    if L.slope[y, x] >= P.SLOPE_NOGO_DEG and not snap:
        raise PlanError(f"Nokta geçilmez eğimde ({L.slope[y, x]:.0f}°): {px}")
    if L.slope[y, x] >= P.SLOPE_NOGO_DEG:
        # Tek hücrelik DEM abartısı noktayı kilitlemesin: SNAP_RADIUS_M içindeki en yakın geçilebilir hücre
        r = int(P.SNAP_RADIUS_M // L.res_m)
        r0, c0 = max(y - r, 0), max(x - r, 0)
        rr, cc = np.nonzero(L.slope[r0:y + r + 1, c0:x + r + 1] < P.SLOPE_NOGO_DEG)
        d = np.hypot(rr + r0 - y, cc + c0 - x) * L.res_m
        if not (d <= P.SNAP_RADIUS_M).any():
            raise PlanError(f"Nokta geçilmez eğimde ({L.slope[y, x]:.0f}°), {P.SNAP_RADIUS_M:.0f} m içinde geçilebilir hücre yok: {px}")
        i = int(np.argmin(np.where(d <= P.SNAP_RADIUS_M, d, np.inf)))
        return int(rr[i] + r0), int(cc[i] + c0)
    return y, x


_NEIGH = [(-1, 0), (1, 0), (0, -1), (0, 1), (-1, -1), (-1, 1), (1, -1), (1, 1)]


def _window_search(cost: np.ndarray, s, g, res_m: float, r0: int, r1: int, c0: int, c1: int):
    """[r0:r1, c0:c1] penceresinde 8-komşuluk Dijkstra; çapraz adım yalnız iki yan hücre de geçilebilirse (F06: köşe kesme yok).
    Kenar maliyeti MCP_Geometric ile aynı: (c_a + c_b) / 2 * adım uzunluğu."""
    sub = cost[r0:r1, c0:c1]
    h, w = sub.shape
    ok = np.isfinite(sub)
    idx = np.arange(h * w).reshape(h, w)
    rows, cols, wts = [], [], []
    for dr, dc in _NEIGH:
        ra, rb = slice(max(0, -dr), h - max(0, dr)), slice(max(0, dr), h - max(0, -dr))
        ca, cb = slice(max(0, -dc), w - max(0, dc)), slice(max(0, dc), w - max(0, -dc))
        m = ok[ra, ca] & ok[rb, cb]
        if dr and dc:  # çapraz: iki yan hücre (dr,0) ve (0,dc) de geçilebilir olmalı
            # kaynak (y,x) -> yan1 (y+dr, x), yan2 (y, x+dc); kaynak dilimi ra×ca
            y0 = ra.start; x0 = ca.start
            hh, ww = m.shape
            side1 = ok[y0 + dr:y0 + dr + hh, x0:x0 + ww]
            side2 = ok[y0:y0 + hh, x0 + dc:x0 + dc + ww]
            m &= side1 & side2
        length = res_m * (math.sqrt(2.0) if dr and dc else 1.0)
        wt = 0.5 * (sub[ra, ca] + sub[rb, cb]) * length
        rows.append(idx[ra, ca][m]); cols.append(idx[rb, cb][m]); wts.append(wt[m])
    from scipy.sparse import csr_matrix
    from scipy.sparse.csgraph import dijkstra
    graph = csr_matrix((np.concatenate(wts), (np.concatenate(rows), np.concatenate(cols))), shape=(h * w, h * w))
    si, gi = (s[0] - r0) * w + (s[1] - c0), (g[0] - r0) * w + (g[1] - c0)
    dist, pred = dijkstra(graph, directed=True, indices=si, return_predecessors=True)
    if not np.isfinite(dist[gi]):
        return None
    seq, k = [gi], gi
    while k != si:
        k = int(pred[k]); seq.append(k)
    seq = np.array(seq[::-1])
    return np.stack([seq // w + r0, seq % w + c0], axis=1)


def _search(L: Layers, cost: np.ndarray, s, g):
    """Pencereli arama: yol pencere kenarına değiyorsa pencereyi büyütüp yeniden dener; pencere ızgarayı kaplayınca kesin."""
    H, W = cost.shape
    span = max(abs(s[0] - g[0]), abs(s[1] - g[1]), 1)
    pad = max(40, 2 * span)
    while True:
        r0, r1 = max(min(s[0], g[0]) - pad, 0), min(max(s[0], g[0]) + pad + 1, H)
        c0, c1 = max(min(s[1], g[1]) - pad, 0), min(max(s[1], g[1]) + pad + 1, W)
        full = (r0, r1, c0, c1) == (0, H, 0, W)
        path = _window_search(cost, s, g, L.res_m, r0, r1, c0, c1)
        if full:
            return path
        if path is not None:
            touches = (path[:, 0].min() == r0 and r0 > 0) or (path[:, 0].max() == r1 - 1 and r1 < H) \
                or (path[:, 1].min() == c0 and c0 > 0) or (path[:, 1].max() == c1 - 1 and c1 < W)
            if not touches:
                return path
        pad *= 2


def _line_cells(a, b) -> np.ndarray:
    from skimage.draw import line
    rr, cc = line(int(a[0]), int(a[1]), int(b[0]), int(b[1]))
    return np.stack([rr, cc], axis=1)


def shortest_path_info(L: Layers, start, goal, w: dict, max_slope_deg: float | None = None):
    """(yol, maliyet terimleri, bilgi). Yol, istenen uçtan başlar/biter: snap bağlantısı yola dahildir (F03).
    Bilgi: istenen/kullanılan uç, snap_m, kullanıcı eğim sınırı ihlalleri (F04)."""
    cost, terms = cost_surface(L, w, max_slope_deg=max_slope_deg)
    s, g = _check(L, start), _check(L, goal)
    req = [(math.floor(start[1]), math.floor(start[0])), (math.floor(goal[1]), math.floor(goal[0]))]
    limit = P.SLOPE_NOGO_DEG if max_slope_deg is None else min(max_slope_deg, P.SLOPE_NOGO_DEG)
    violations = []
    if max_slope_deg is not None:
        # F04: uçlar kullanıcı sınırından dik olsa da bağlanabilir (aksi hâlde sim ucu sıfır yol olur), ama
        # sessiz geçilmez: yanıtta uyarı ve go=false. Arama, yol sonrası doğrulama ve bütçe aynı sınırı kullanır.
        base, _ = cost_surface(L, w)
        for name, q in (("start", s), ("goal", g)):
            if not np.isfinite(cost[q]):
                cost[q] = base[q]
    path = _search(L, cost, s, g)
    if path is None:
        raw_labels, comp_sizes, ranks, _ = L.connectivity()
        total_cells = L.width * L.height
        cs, cg = int(raw_labels[s]), int(raw_labels[g])
        rs, rg = ranks.get(cs, 0), ranks.get(cg, 0)
        ss, sg = int(comp_sizes[rs]) if rs else 0, int(comp_sizes[rg]) if rg else 0
        ps, pg = ss / total_cells * 100, sg / total_cells * 100
        if max_slope_deg is not None:
            raise PlanError(f"Azami eğim {max_slope_deg:g}° ile başlangıç ve hedef arasında yol yok; sınırı gevşet.")
        if cs and cs == cg:
            raise PlanError("Başlangıç ile hedef aynı geçilebilir bölgede ama köşe kesmeden (iki yan hücre geçilebilir) bağlanamıyor")
        raise PlanError(
            f"Başlangıç ile hedef arasında geçilebilir yol yok: "
            f"başlangıç {[int(start[0]), int(start[1])]} bileşen #{rs} ({ss} hücre, %{ps:.2f}), "
            f"hedef {[int(goal[0]), int(goal[1])]} bileşen #{rg} ({sg} hücre, %{pg:.2f}) içinde kaldı"
        )
    # F03: snap bağlantısı. İstenen hücre geçilmezse (DEM abartısı) kullanılan hücreye düz hatla bağlanır;
    # ara hücreler geçilebilir olmalı, aksi hâlde hata. Bağlantı yola eklenir, maliyeti toplamlara girer.
    snap = {}
    pieces = [path]
    for name, q, r_ in (("start", s, req[0]), ("goal", g, req[1])):
        d_m = float(np.hypot(q[0] - r_[0], q[1] - r_[1])) * L.res_m
        snap[name] = {"requested": [int(r_[1]), int(r_[0])], "used": [int(q[1]), int(q[0])], "snap_m": round(d_m, 2),
                      "requested_slope_deg": round(float(L.slope[r_]), 1)}
        if d_m > 0:
            cells = _line_cells(r_, q)
            mid = cells[1:-1]
            blocked = [tuple(c) for c in mid if L.slope[tuple(c)] >= P.SLOPE_NOGO_DEG]
            if blocked:
                raise PlanError(f"{name} noktası ({snap[name]['requested']}) ile bağlandığı hücre ({snap[name]['used']}) arasındaki "
                                f"bağlantı geçilemez eğimden geçiyor ({len(blocked)} hücre); noktayı kaydır")
            if name == "start":
                pieces.insert(0, cells[:-1])
            else:
                pieces.append(cells[::-1][1:])
    full_path = np.concatenate(pieces, axis=0) if len(pieces) > 1 else path
    # kullanıcı eğim sınırı: uç hücreleri (kullanılan) ihlal ediyorsa kaydet
    if max_slope_deg is not None:
        for name, q in (("start", s), ("goal", g)):
            if L.slope[q] >= limit:
                violations.append({"point": name, "px": [int(q[1]), int(q[0])], "slope_deg": round(float(L.slope[q]), 1), "limit_deg": limit})
    info = {"endpoints": snap, "slope_limit_violations": violations,
            "snap_connector_cells": int(len(full_path) - len(path))}
    return full_path, terms, info


def shortest_path(L: Layers, start, goal, w: dict, max_slope_deg: float | None = None):
    path, terms, _ = shortest_path_info(L, start, goal, w, max_slope_deg)
    return path, terms


def _step_lengths(path: np.ndarray, res_m: float) -> np.ndarray:
    d = np.diff(path, axis=0)
    step = np.hypot(d[:, 0], d[:, 1]) * res_m
    return np.concatenate([[0.0], step])


def _profile(L: Layers, path: np.ndarray, terms: dict):
    r, c = path[:, 0], path[:, 1]
    step = _step_lengths(path, L.res_m)
    return {
        "step_m": step,
        "cum_m": np.cumsum(step),
        "slope": L.slope[r, c],
        "rock": L.rock_cfa[r, c],
        "ent": L.entropy[r, c],
        "dom": np.argmax(np.stack([L.probs[k][r, c] for k in P.CLASSES]), axis=0),
        "p": {k: L.probs[k][r, c] for k in P.CLASSES},
        "sec": terms["s_per_m"][r, c] * step,
        "kcal": terms["kcal_per_m"][r, c] * step,
        "risk": terms["risk_per_m"][r, c] * step,
        "evid": L.evidence_dist_m[r, c],
    }


def _band(s):
    return int(np.searchsorted(P.SLOPE_BANDS, s))


def _segment_bounds(prof) -> list[tuple[int, int]]:
    n = len(prof["cum_m"])
    if n <= 1:
        return [(0, max(n - 1, 0))]
    step_mean = max(float(prof["cum_m"][-1]) / max(n - 1, 1), 1e-6)
    # 2 m gibi ince ızgaralarda hücreden hücreye DEM eğim ve sınıf gürültüsünü pencere ortalaması ve histerezisle yumuşat
    use_smooth = step_mean < 5.0 and n >= 10
    if use_smooth:
        w = max(1, min(int(round(P.SEG_SMOOTH_M / step_mean)), n))
        s_arr = uniform_filter1d(prof["slope"].astype(float), size=w, mode="nearest")
        dom_probs = np.stack([prof["p"][k] for k in P.CLASSES])
        d_arr = np.argmax(uniform_filter1d(dom_probs, size=w, axis=1, mode="nearest"), axis=0)
        hyst = P.SEG_HYSTERESIS_DEG
        min_m = P.SEG_MIN_M
        max_m = P.SEG_MAX_M
    else:
        s_arr = prof["slope"]
        d_arr = prof["dom"]
        hyst = 0.0
        min_m = 0.0
        max_m = 100.0

    bounds, start = [], 0
    cur_dom = int(d_arr[0])
    cur_band = _band(s_arr[0])
    for i in range(1, n):
        seg_len = prof["cum_m"][i] - prof["cum_m"][start]
        new_dom = int(d_arr[i])
        new_band = _band(s_arr[i])
        if hyst > 0 and new_band != cur_band:
            thresh = P.SLOPE_BANDS[min(cur_band, new_band)]
            if abs(float(s_arr[i]) - thresh) < hyst:
                new_band = cur_band
        changed = (new_dom != cur_dom) or (new_band != cur_band)
        if (changed and seg_len >= min_m) or seg_len >= max_m:
            bounds.append((start, i))
            start = i
            cur_dom = int(d_arr[i])
            cur_band = _band(s_arr[i])
    if start < n - 1 or not bounds:
        bounds.append((start, n - 1))

    if use_smooth:
        while len(bounds) > 1:
            lengths = [prof["cum_m"][b] - prof["cum_m"][a] for a, b in bounds]
            idx = int(np.argmin(lengths))
            if lengths[idx] >= min_m and len(bounds) <= P.SEG_MAX_COUNT:
                break
            if idx == 0:
                bounds[0:2] = [(bounds[0][0], bounds[1][1])]
            elif idx == len(bounds) - 1:
                bounds[-2:] = [(bounds[-2][0], bounds[-1][1])]
            elif lengths[idx - 1] <= lengths[idx + 1]:
                bounds[idx - 1:idx + 1] = [(bounds[idx - 1][0], bounds[idx][1])]
            else:
                bounds[idx:idx + 2] = [(bounds[idx][0], bounds[idx + 1][1])]
    return bounds


def _conf(ent: float) -> str:
    return "low" if ent >= P.CONF_LOW else ("mid" if ent >= P.CONF_MID else "high")


def _reason(seg: dict, base_kcal_m: float, provisional_terrain: bool = False) -> str:
    parts = []
    extra = (seg["kcal"] / max(seg["len_m"], 1) / base_kcal_m - 1) * 100
    if seg["p_sand"] >= 0.4:
        parts.append(f"kum ağırlıklı (%{seg['p_sand'] * 100:.0f})")
    if seg["slope_max"] >= P.SLOPE_RISKY_DEG:
        parts.append(f"dik ({seg['slope_max']:.0f}°), dikkatli geç")
    if seg["rock_cfa"] >= 0.1:
        parts.append(f"kayalık (yüzeyin %{seg['rock_cfa'] * 100:.0f}'i kaya)")
    if not parts:
        parts.append(f"{P.CLASS_TR[seg['class']]} zemin, eğim {seg['slope_max']:.0f}°")
    txt = ", ".join(parts)
    txt = txt[0].upper() + txt[1:]
    if extra >= 5:
        txt += f"; düz ana kayaya göre +%{extra:.0f} kcal"
    if seg["conf"] == "low":
        ev = seg["nearest_evidence_m"]
        txt += ". Model emin değil" + (f": en yakın rover kanıtı {ev:.0f} m uzakta" if ev is not None else "")
        if provisional_terrain:
            txt += f"; {PROVISIONAL_TERRAIN_NOTE}"
    elif provisional_terrain:
        txt += f". {PROVISIONAL_TERRAIN_NOTE.capitalize()}"
    return txt + "."


def _segments(L: Layers, path: np.ndarray, prof) -> list[dict]:
    base = flat_bedrock_kcal_per_m()
    segs = []
    for i, (a, b) in enumerate(_segment_bounds(prof)):
        sl = slice(a, b + 1)
        length = float(prof["cum_m"][b] - prof["cum_m"][a])
        dom_counts = np.bincount(prof["dom"][sl], minlength=len(P.CLASSES))
        ent = float(prof["ent"][sl].mean())
        evid = prof["evid"][sl]
        seg = {
            "id": i + 1,
            "path_px": [[int(c), int(r)] for r, c in path[sl]],
            "len_m": round(length, 1),
            "slope_max": round(float(prof["slope"][sl].max()), 1),
            "slope_mean": round(float(prof["slope"][sl].mean()), 1),
            "class": P.CLASSES[int(dom_counts.argmax())],
            "p_sand": round(float(prof["p"]["sand"][sl].mean()), 2),
            "p_bigrock": round(float(prof["p"]["bigrock"][sl].mean()), 2),
            "rock_cfa": round(float(prof["rock"][sl].mean()), 3),
            "entropy": round(ent, 2),
            "conf": _conf(ent),
            "nearest_evidence_m": None if np.all(np.isnan(evid)) else round(float(np.nanmin(evid)), 0),
            "kcal": round(float(prof["kcal"][a + 1:b + 1].sum()), 1),
            "min": round(float(prof["sec"][a + 1:b + 1].sum()) / 60, 1),
            "risk": round(float(prof["risk"][a + 1:b + 1].sum()), 2),
            "rejected_alt": None,
        }
        seg["reason"] = _reason(seg, base, L.provisional_terrain)
        segs.append(seg)
    return segs


def _budget(prof, segs, path, limits=None, max_slope_deg: float | None = None, exempt=()) -> dict:
    out_min = float(prof["sec"].sum()) / 60
    kcal_out = float(prof["kcal"].sum())
    # Dönüş aynı yoldan; iniş/çıkış simetrik kabul (|eğim| modeli)
    eva_min = 2 * out_min + P.SCIENCE_STOP_MIN
    limit_min = P.EVA_MAX_H * 60
    limits = {**{"time_min": limit_min, "kcal": P.EVA_MAX_KCAL,
                 "o2_L": P.EVA_MAX_O2_L, "dose_uGy": P.EVA_MAX_DOSE_UGY,
                 "reserve_min": P.RESERVE_MIN}, **(limits or {})}
    limit_min = limits["time_min"]
    cum = np.cumsum(prof["sec"]) / 60
    committed_min = 2 * cum + P.SCIENCE_STOP_MIN + limits["reserve_min"]
    committed_kcal = (2 * np.cumsum(prof["kcal"]) +
                      (P.SCIENCE_STOP_MIN + limits["reserve_min"]) * 60 * P.STOP_METABOLIC_W / 4184)
    usage = {"time_min": committed_min, "kcal": committed_kcal,
             "o2_L": committed_kcal / P.KCAL_PER_L_O2,
             "dose_uGy": committed_min / 60 * P.DOSE_UGY_PER_H}
    exceeded = {k: v > limits[k] for k, v in usage.items()}
    over = np.flatnonzero(np.logical_or.reduce(list(exceeded.values())))
    first = int(over[0]) if len(over) else None
    walkback_ok = not bool(exceeded["time_min"][-1])
    exceeded_at = round(float(prof["cum_m"][first]), 1) if first is not None else None
    total_kcal = 2 * kcal_out
    slope_limit = P.SLOPE_NOGO_DEG if max_slope_deg is None else min(float(max_slope_deg), P.SLOPE_NOGO_DEG)
    keep = np.ones(len(prof["slope"]), bool)
    keep[list(exempt)] = False
    slope_ok = bool(prof["slope"][keep].max() < slope_limit) if keep.any() else True
    # F05: tüketim kapsamı. Hepsi aynı birimde (dk, kcal, L O₂, µGy); mevcut alanlar uyumluluk için duruyor.
    def _scope(minutes: float, kcal: float) -> dict:
        return {"min": round(minutes, 3), "kcal": round(kcal, 3), "o2_L": round(kcal / P.KCAL_PER_L_O2, 3),
                "dose_uGy": round(minutes / 60 * P.DOSE_UGY_PER_H, 3)}
    stop_kcal = lambda m: m * 60 * P.STOP_METABOLIC_W / 4184
    consumption = {
        "outbound": _scope(out_min, kcal_out),
        "return": _scope(out_min, kcal_out),  # VARSAYIM: aynı yoldan dönüş, |eğim| modeli iniş/çıkışı ayırmaz
        "science": _scope(P.SCIENCE_STOP_MIN, stop_kcal(P.SCIENCE_STOP_MIN)),
        "reserve": _scope(limits["reserve_min"], stop_kcal(limits["reserve_min"])),
    }
    # toplam yuvarlanmış parçaların değil, GO kararının kullandığı hesabın (usage) kendisi: parçalar ≤ yuvarlama farkıyla tutar
    consumption["committed"] = {k: round(float(usage[src][-1]), 3)
                                for k, src in (("min", "time_min"), ("kcal", "kcal"), ("o2_L", "o2_L"), ("dose_uGy", "dose_uGy"))}
    consumption["note"] = ("committed = outbound + return + science + reserve = budget.used (GO kararının kullandığı toplam). "
                           "Eski alanlar: kcal=yalnız gidiş, eva_kcal/o2_L=iki yön yürüyüş (bilim ve rezerv hariç), "
                           "dose_uGy=iki yön+bilim (rezerv hariç).")
    return {
        "consumption": consumption,
        "km": round(float(prof["cum_m"][-1]) / 1000, 2),
        "min": round(out_min, 1),
        "eva_min": round(eva_min, 1),
        "eva_limit_min": limit_min,
        "kcal": round(kcal_out, 0),
        "eva_kcal": round(total_kcal, 0),
        "o2_L": round(total_kcal / P.KCAL_PER_L_O2, 0),
        "dose_uGy": round(eva_min / 60 * P.DOSE_UGY_PER_H, 1),
        "slope_max": round(float(prof["slope"].max()), 1),
        "low_conf_m": round(sum(s["len_m"] for s in segs if s["conf"] == "low"), 0),
        "walkback_ok": bool(walkback_ok),
        "limit_exceeded_at_m": exceeded_at,
        "go": bool(first is None and slope_ok),
        "slope_limit_deg": slope_limit,
        "status": "GO" if first is None else "NO-GO",
        "limit_exceeded_at_px": path[first][::-1].tolist() if first is not None else None,
        "limit_exceeded_at_index": first,
        "budget": {"limits": limits, "used": {k: round(float(v[-1]), 3) for k, v in usage.items()},
                   "exceeded": [k for k, v in exceeded.items() if v[-1]],
                   "first_exceeded": [k for k, v in exceeded.items() if first is not None and v[first]],
                   "return_min": round(out_min, 3), "return_kcal": round(kcal_out, 3)},
    }


def plan_one(L: Layers, start, goal, kind: str = "balanced", weights: dict | None = None, budget: dict | None = None,
             max_slope_deg: float | None = None) -> dict:
    presets = P.PRESETS if L.synthetic else P.REAL_PRESETS
    w = dict(presets.get(kind, presets["balanced"]))
    if weights:
        w.update(weights)
    path, terms, info = shortest_path_info(L, start, goal, w, max_slope_deg)
    prof = _profile(L, path, terms)
    segs = _segments(L, path, prof)
    # F03: istenen ucun kendisi geçilmezse (snap) o hücre go kararından muaf; ama uyarıyla görünür
    exempt = [i for i, name in ((0, "start"), (len(path) - 1, "goal"))
              if info["endpoints"][name]["snap_m"] > 0 and L.slope[tuple(path[i])] >= P.SLOPE_NOGO_DEG]
    total = _budget(prof, segs, path, budget, max_slope_deg=max_slope_deg, exempt=exempt)
    total["endpoints"] = info["endpoints"]
    total["snap_connector_cells"] = info["snap_connector_cells"]
    total["slope_limit_violations"] = info["slope_limit_violations"]
    warnings = []
    for name, e in info["endpoints"].items():
        if e["snap_m"] > 0:
            warnings.append(f"{name}: istenen nokta geçilmez eğimde ({e['requested_slope_deg']}°); {e['snap_m']:.0f} m ötedeki hücreye bağlandı (maliyet toplamlara dahil)")
    for v in info["slope_limit_violations"]:
        warnings.append(f"{v['point']} hücresi eğim sınırını aşıyor ({v['slope_deg']}° ≥ {v['limit_deg']:g}°): uç istisnası, go=false")
    total["warnings"] = warnings
    return {
        "kind": kind,
        "label": w.get("label", kind),
        "weights": {k: w[k] for k in ("t", "k", "r")},
        "start": {"px": [int(start[0]), int(start[1])]},
        "goal": {"px": [int(goal[0]), int(goal[1])]},
        "total": total,
        "segments": segs,
        "_path": path,
        "_prof": prof,
    }


def _contrast(chosen: dict, alt: dict, res_m: float, min_dev_m: float = 40.0):
    """Alternatif rotanın seçilen rotadan ayrıldığı kısımları bul ve açıklamayı ilgili segmente iliştir."""
    cp, ap = chosen["_path"], alt["_path"]
    d = np.sqrt(((ap[:, None, :] - cp[None, :, :]) ** 2).sum(-1))  # alt × chosen
    near_idx = d.argmin(1)
    off = d.min(1) * res_m > min_dev_m
    if not off.any():
        return
    runs, i = [], 0
    while i < len(off):
        if off[i]:
            j = i
            while j + 1 < len(off) and off[j + 1]:
                j += 1
            runs.append((max(i - 1, 0), min(j + 1, len(off) - 1)))
            i = j + 1
        else:
            i += 1
    ap_prof, cp_prof = alt["_prof"], chosen["_prof"]
    seg_of = np.zeros(len(cp), int)
    pos = 0
    for k, s in enumerate(chosen["segments"]):
        n = len(s["path_px"])
        seg_of[pos:pos + n] = k
        pos += n - 1 if k < len(chosen["segments"]) - 1 else n
    for a, b in runs:
        ca, cb = sorted((int(near_idx[a]), int(near_idx[b])))
        alt_sec = ap_prof["sec"][a + 1:b + 1].sum() / 60
        alt_kcal = ap_prof["kcal"][a + 1:b + 1].sum()
        ch_sec = cp_prof["sec"][ca + 1:cb + 1].sum() / 60
        ch_kcal = cp_prof["kcal"][ca + 1:cb + 1].sum()
        alt_len = ap_prof["cum_m"][b] - ap_prof["cum_m"][a]
        alt_slope = float(ap_prof["slope"][a:b + 1].max())
        alt_sand = float(ap_prof["p"]["sand"][a:b + 1].mean())
        alt_ent = float(ap_prof["ent"][a:b + 1].mean())
        dt, dk = float(alt_sec - ch_sec), float(alt_kcal - ch_kcal)
        # Küçük süre/enerji ayrılmaları açıklama gürültüsü üretmesin.
        if abs(dt) < 1.0 and abs(dk) < 5.0:
            continue
        why = []
        ch_sl = slice(ca, cb + 1)
        alt_risk = float(ap_prof["risk"][a + 1:b + 1].sum())
        ch_risk = float(cp_prof["risk"][ca + 1:cb + 1].sum())
        if alt_risk > ch_risk + 1e-6:
            why.append("daha yüksek risk")
        if alt_slope >= P.SLOPE_RISKY_DEG and alt_slope > float(cp_prof["slope"][ch_sl].max()) + 0.5:
            why.append(f"daha dik eğim ({alt_slope:.0f}°)")
        if alt_sand >= 0.4 and alt_sand > float(cp_prof["p"]["sand"][ch_sl].mean()) + 0.01:
            why.append(f"daha fazla kum (%{alt_sand * 100:.0f})")
        if alt_ent >= P.CONF_LOW and alt_ent > float(cp_prof["ent"][ch_sl].mean()) + 0.01:
            why.append("daha düşük model güveni")
        if dt >= 1.0:
            why.append(f"{dt:.0f} dk daha uzun süre")
        if dk >= 5.0:
            why.append(f"{dk:.0f} kcal daha fazla enerji")
        if not why:
            continue
        head = f"{alt['label']} rota burada ayrılıyor ({alt_len:.0f} m)"
        txt = head + ": " + ", ".join(why) + "."
        k = int(seg_of[min(ca, len(seg_of) - 1)])
        seg = chosen["segments"][k]
        seg["rejected_alt"] = (seg["rejected_alt"] + " " if seg["rejected_alt"] else "") + txt


def plan(L: Layers, start, goal, kinds=("shortest", "balanced", "safest"), weights: dict | None = None, budget: dict | None = None,
         terrain_model: bool = True, max_slope_deg: float | None = None) -> list[dict]:
    """terrain_model=False: yol zemin sınıfı/kaya bilinmeden (yalnız eğim) aranır, maliyet gerçek katmanlarda ölçülür."""
    if terrain_model:
        routes = [plan_one(L, start, goal, k, weights if k == "balanced" else None, budget, max_slope_deg) for k in kinds]
    else:
        from .insight import plan_one_naive
        routes = [plan_one_naive(L, start, goal, k, budget) for k in kinds]
    for r in routes:
        for alt in routes:
            if alt is not r:
                _contrast(r, alt, L.res_m)
    for r in routes:
        r.pop("_path"), r.pop("_prof")
    return routes


def apply_observation(L: Layers, px, radius_m: float, cls: str) -> Layers:
    """Simülasyonda görülen gerçek zemini katmana işle (sis kalktı)."""
    if cls not in P.CLASSES:
        raise PlanError(f"Bilinmeyen sınıf: {cls}")
    L2 = L.copy()
    yy, xx = np.mgrid[0:L.height, 0:L.width]
    m = np.hypot(xx - px[0], yy - px[1]) * L.res_m <= radius_m
    for c in P.CLASSES:
        L2.probs[c][m] = 1.0 if c == cls else 0.0
    L2.entropy[m] = 0.0
    return L2


@dataclass
class _CellView:
    slope: np.ndarray
    rock_cfa: np.ndarray
    probs: dict[str, np.ndarray]
    entropy: np.ndarray
    synthetic: bool


def _sample_path(L: Layers, path) -> np.ndarray:
    if not isinstance(path, (list, tuple, np.ndarray)) or len(path) == 0:
        raise PlanError("Yol boş olamaz; en az bir [x,y] noktası gerekli")
    raw = []
    for pt in path:
        if not isinstance(pt, (list, tuple, np.ndarray)) or len(pt) != 2:
            raise PlanError(f"Geçersiz nokta biçimi: {pt}")
        x, y = pt[0], pt[1]
        if (isinstance(x, bool) or isinstance(y, bool)
                or not isinstance(x, (int, float, np.number))
                or not isinstance(y, (int, float, np.number))
                or not (math.isfinite(float(x)) and math.isfinite(float(y)))):
            raise PlanError(f"Nokta sonlu sayısal [x,y] olmalı: {pt}")
        fx, fy = float(x), float(y)
        if not (0 <= math.floor(fx) < L.width and 0 <= math.floor(fy) < L.height):
            raise PlanError(f"Nokta ızgara dışında: [{fx}, {fy}] (genişlik {L.width}, yükseklik {L.height})")
        raw.append([fx, fy])
    pts_in = np.asarray(raw, dtype=float)
    is_int = bool(np.all(pts_in == np.floor(pts_in)))
    pts_list = [pts_in[0]]
    for a, b in zip(pts_in[:-1], pts_in[1:]):
        diff_max = float(np.abs(b - a).max())
        if is_int:
            n = int(diff_max)
            if n > 0:
                pts_list.extend(np.rint(np.linspace(a, b, n + 1)[1:]))
        else:
            n = int(math.ceil(diff_max))
            if n > 1:
                pts_list.extend(np.linspace(a, b, n + 1)[1:])
            elif diff_max > 0:
                pts_list.append(b)
    return np.asarray(pts_list, dtype=float)


def evaluate_step(
    L: Layers,
    path,
    load_kg: float = P.DEFAULT_LOAD_KG,
    observations: list[dict] | None = None,
) -> dict:
    """Verilen yürüyüş izi (path) için süre (sn), kcal, O₂, doz ve hücre sınıfı dökümünü hesaplar."""
    if isinstance(load_kg, bool) or not isinstance(load_kg, (int, float)) or not math.isfinite(load_kg) or load_kg < 0:
        raise PlanError("load_kg negatif olmayan sonlu bir sayı olmalı")
    pts = _sample_path(L, path)
    c = np.clip(np.floor(pts[:, 0]).astype(int), 0, L.width - 1)
    r = np.clip(np.floor(pts[:, 1]).astype(int), 0, L.height - 1)
    if len(pts) > 1:
        d = np.diff(pts, axis=0)
        step_m = np.concatenate([[0.0], np.hypot(d[:, 0], d[:, 1]) * L.res_m])
    else:
        step_m = np.array([0.0], dtype=float)

    slope = L.slope[r, c].astype(np.float32)
    elev = L.elevation[r, c].astype(np.float32)
    rock = L.rock_cfa[r, c].astype(np.float32)
    ent = L.entropy[r, c].astype(np.float32).copy()
    probs = {k: L.probs[k][r, c].astype(np.float32).copy() for k in P.CLASSES}

    if observations:
        for obs in observations:
            ox, oy = obs["px"]
            if not (0 <= math.floor(ox) < L.width and 0 <= math.floor(oy) < L.height):
                raise PlanError(f"Gözlem noktası ızgara dışında: {obs['px']}")
            cls = obs["cls"]
            if cls not in P.CLASSES:
                raise PlanError(f"Bilinmeyen sınıf: {cls}")
            rad = float(obs["radius_m"])
            if not math.isfinite(rad) or rad < 0:
                raise PlanError("Gözlem yarıçapı negatif olamaz")
            m = np.hypot(c - ox, r - oy) * L.res_m <= rad
            for k in P.CLASSES:
                probs[k][m] = 1.0 if k == cls else 0.0
            ent[m] = 0.0

    view = _CellView(slope=slope, rock_cfa=rock, probs=probs, entropy=ent, synthetic=L.synthetic)
    v_arr = speed_ms(view)
    s_per_m = 1.0 / v_arr
    k_per_m = kcal_per_m(view, v_arr, load_kg=float(load_kg))
    o2_l_m = o2_l_per_m(view, v_arr, load_kg=float(load_kg))
    o2_g_m = o2_g_per_m(view, v_arr, load_kg=float(load_kg))
    r_per_m = risk_per_m(view)
    scan_arr = P.classify_scan(slope, probs["sand"], ent, rock).astype(int)
    dom_arr = np.argmax(np.stack([probs[k] for k in P.CLASSES]), axis=0)

    sec_arr = s_per_m * step_m
    kcal_arr = k_per_m * step_m
    o2_l_arr = o2_l_m * step_m
    o2_g_arr = o2_g_m * step_m
    risk_arr = r_per_m * step_m

    dist_m = float(step_m.sum())
    sec_total = float(sec_arr.sum())
    min_total = sec_total / 60.0
    kcal_total = float(kcal_arr.sum())
    o2_l_total = float(o2_l_arr.sum())
    o2_g_total = float(o2_g_arr.sum())
    dose_total = (sec_total / 3600.0) * P.DOSE_UGY_PER_H
    risk_total = float(risk_arr.sum())

    if len(elev) > 1:
        dz = np.diff(elev).astype(float)
        ascent_m = float(np.maximum(dz, 0.0).sum())
        descent_m = float(np.maximum(-dz, 0.0).sum())
        ds_pos = np.maximum(step_m[1:], 1e-6)
        tan_dir = np.where(step_m[1:] > 1e-6, dz / ds_pos, 0.0)
        terrain_mult = sum(probs[k][1:] * P.TERRAIN_SPEED[k] for k in P.CLASSES)
        tobler_dir = np.exp(-3.5 * np.abs(tan_dir + 0.05)) / np.exp(-3.5 * 0.05)
        v_dir = np.clip(P.BASE_SPEED_MS * terrain_mult * tobler_dir, 0.05, None)
        eta_dir = sum(probs[k][1:] * P.TERRAIN_ETA[k] for k in P.CLASSES)
        grade_dir = np.maximum(tan_dir * 100.0, 0.0)
        watts_dir = metabolic_w(v_dir, grade_dir, eta_dir, load_kg=float(load_kg))
        sec_dir = float((step_m[1:] / v_dir).sum())
        kcal_dir = float(((watts_dir / v_dir / 4184.0) * step_m[1:]).sum())
    else:
        ascent_m, descent_m, sec_dir, kcal_dir = 0.0, 0.0, 0.0, 0.0

    n_cells = len(pts)
    terrain_classes = {}
    class_counts = {}
    for idx, cname in enumerate(P.CLASSES):
        m = dom_arr == idx
        cnt = int(m.sum())
        dm = float(step_m[m].sum())
        pct = (dm / dist_m * 100.0) if dist_m > 0 else (cnt / n_cells * 100.0)
        terrain_classes[cname] = {"cells": cnt, "distance_m": round(dm, 2), "pct": round(pct, 1)}
        class_counts[cname] = cnt

    scan_classes = {}
    scan_counts = {}
    for _, meta in P.SCAN_LEGEND.items():
        code = meta["code"]
        key = meta["key"]
        m = scan_arr == code
        cnt = int(m.sum())
        dm = float(step_m[m].sum())
        pct = (dm / dist_m * 100.0) if dist_m > 0 else (cnt / n_cells * 100.0)
        scan_classes[key] = {
            "code": code,
            "name": meta["name"],
            "cells": cnt,
            "distance_m": round(dm, 2),
            "pct": round(pct, 1),
        }
        scan_counts[key] = cnt

    dom_overall = P.CLASSES[int(np.bincount(dom_arr, minlength=len(P.CLASSES)).argmax())]
    cells = [
        {
            "px": [int(c[i]), int(r[i])],
            "class": P.CLASSES[int(dom_arr[i])],
            "scan_class": int(scan_arr[i]),
            "scan_key": P.SCAN_LEGEND[str(int(scan_arr[i]))]["key"],
            "scan_name": P.SCAN_LEGEND[str(int(scan_arr[i]))]["name"],
            "slope_deg": round(float(slope[i]), 1),
            "step_m": round(float(step_m[i]), 2),
            "sec": round(float(sec_arr[i]), 2),
            "kcal": round(float(kcal_arr[i]), 3),
        }
        for i in range(n_cells)
    ]

    return {
        "distance_m": round(dist_m, 2),
        "km": round(dist_m / 1000.0, 4),
        "duration_s": round(sec_total, 2),
        "sec": round(sec_total, 2),
        "min": round(min_total, 2),
        "kcal": round(kcal_total, 2),
        "o2_L": round(o2_l_total, 3),
        "o2_g": round(o2_g_total, 2),
        "dose_uGy": round(dose_total, 3),
        "risk": round(risk_total, 3),
        "load_kg": float(load_kg),
        "slope_max": round(float(slope.max()), 1),
        "slope_mean": round(float(slope.mean()), 1),
        "ascent_m": round(ascent_m, 2),
        "descent_m": round(descent_m, 2),
        "directional": {
            "duration_s": round(sec_dir, 2),
            "kcal": round(kcal_dir, 2),
            "o2_L": round(kcal_dir / P.KCAL_PER_L_O2, 3),
            "o2_g": round((kcal_dir / P.KCAL_PER_L_O2) * P.O2_G_PER_L, 2),
            # Açık bayrak (F02): iniş eğimi bu hesapta 0'a kesiliyor; doğrulanmış iniş modeli yok, değerler üst-alt sınır değil.
            "descent_grade_clamped": True,
            "descent_note": "Directional hesapta iniş (negatif eğim) 0 kabul edilir; Pandolf iniş için doğrulanmadı (mars_validated=false).",
        },
        "dominant_class": dom_overall,
        "terrain_classes": terrain_classes,
        "scan_classes": scan_classes,
        "class_counts": class_counts,
        "scan_counts": scan_counts,
        "cells": cells,
    }
