"""Hücre başına astronot maliyeti: süre, metabolik enerji, risk.

Metabolik model Pandolf (1977) yük taşıma denklemi (DOĞRULANACAK):
    M [W] = 1.5·W + 2.0·(W+L)·(L/W)² + η·(W+L)·(1.5·V² + 0.35·V·G)
    W: vücut kütlesi, L: taşınan yük (skafandr + ekipman), V: hız (m/s), G: eğim (%)
η zemin sınıfı olasılıklarıyla ağırlıklandırılır. Mars için yük ve hareket terimleri
g oranıyla ölçeklenir (VARSAYIM). Eğim yönü hücre maliyetinde bilinmediği için |G|
kullanılır (temkinli yaklaşım; iniş ve çıkış aynı sayılır).
"""
from __future__ import annotations

import numpy as np

from . import params as P
from .layers import Layers


def speed_ms(L: Layers) -> np.ndarray:
    """Zemin ve eğime göre yürüme hızı (m/s)."""
    terrain = sum(L.probs[c] * P.TERRAIN_SPEED[c] for c in P.CLASSES)
    # Tobler yürüyüş fonksiyonunun düz zemine normalize hâli (|eğim| ile)
    tan = np.tan(np.radians(L.slope))
    tobler = np.exp(-3.5 * np.abs(tan + 0.05)) / np.exp(-3.5 * 0.05)
    return np.clip(P.BASE_SPEED_MS * terrain * tobler, 0.05, None)


def eta(L: Layers) -> np.ndarray:
    return sum(L.probs[c] * P.TERRAIN_ETA[c] for c in P.CLASSES)


def _pandolf_raw(v, grade_pct, eta_arr):
    W, Lk = P.BODY_KG, P.SUIT_KG + P.TOOLS_KG
    base = 1.5 * W
    load = 2.0 * (W + Lk) * (Lk / W) ** 2 * P.G_RATIO
    move = eta_arr * (W + Lk) * (1.5 * v**2 + 0.35 * v * grade_pct) * P.G_RATIO
    return base + load + move


_FLAT_RAW = float(_pandolf_raw(np.array(P.BASE_SPEED_MS), np.array(0.0), np.array(P.TERRAIN_ETA["bedrock"])))
CALIBRATION = P.FLAT_REFERENCE_W / _FLAT_RAW


def metabolic_w(v: np.ndarray, grade_pct: np.ndarray, eta_arr: np.ndarray) -> np.ndarray:
    """Pandolf yapısı, düz ana kayada FLAT_REFERENCE_W'ye kalibre edilmiş (W)."""
    return _pandolf_raw(v, grade_pct, eta_arr) * CALIBRATION


def kcal_per_m(L: Layers, v: np.ndarray | None = None) -> np.ndarray:
    v = speed_ms(L) if v is None else v
    grade = np.tan(np.radians(L.slope)) * 100.0
    watts = metabolic_w(v, grade, eta(L))
    return watts / v / 4184.0  # J/m -> kcal/m


def flat_bedrock_kcal_per_m() -> float:
    """Karşılaştırma tabanı: düz ana kayada metre başına kcal."""
    v = P.BASE_SPEED_MS
    return float(metabolic_w(np.array(v), np.array(0.0), np.array(P.TERRAIN_ETA["bedrock"])) / v / 4184.0)


def risk_per_m(L: Layers) -> np.ndarray:
    """0-1 civarı risk: eşik üstü eğim, kaya yoğunluğu, model belirsizliği."""
    slope_r = np.clip((L.slope - 10.0) / (P.SLOPE_NOGO_DEG - 10.0), 0, 1)
    rock_r = np.clip(L.rock_cfa / 0.2, 0, 1)
    return 0.5 * slope_r + 0.3 * rock_r + 0.2 * L.entropy


def cost_surface(L: Layers, w: dict) -> tuple[np.ndarray, dict]:
    v = speed_ms(L)
    t = 1.0 / v
    k = kcal_per_m(L, v)
    r = risk_per_m(L)
    c = w["t"] * t + w["k"] * k + w["r"] * r
    c = np.where(L.slope >= P.SLOPE_NOGO_DEG, np.inf, c)
    return c, {"s_per_m": t, "kcal_per_m": k, "risk_per_m": r}
