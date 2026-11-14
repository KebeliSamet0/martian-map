"""Mount Sharp referansı: aynı grid üzerinde [x,y] hücreleri/polyline."""
import numpy as np
from .cost import cost_surface
from .route import PlanError, _check, _profile


def _cells(layers, points):
    try:
        p = np.asarray(points, dtype=float)
    except (ValueError, TypeError) as exc:
        raise PlanError('Referans yol sayısal [x,y] noktaları olmalı') from exc
    if p.ndim != 2 or p.shape[1] != 2 or not len(p) or not np.isfinite(p).all() or np.any(p != np.floor(p)):
        raise PlanError('Yol boş olamaz; sonlu tam sayı [x,y] hücreleri gerekli')
    for px in p:
        _check(layers, px, snap=False)  # referans yol: geçilmez hücre reddedilir
    # Seyrek polyline düğümlerini en fazla bir hücre aralığıyla örnekle.
    cells = [p[0].astype(int)]
    for a, b in zip(p[:-1], p[1:]):
        n = int(np.abs(b - a).max())
        if n:
            cells.extend(np.rint(np.linspace(a, b, n + 1)[1:]).astype(int))
    cells = np.asarray(cells)
    for px in cells:
        _check(layers, px, snap=False)  # referans yol: geçilmez hücre reddedilir
    return cells


def _distances(points, line):
    """Noktadan polyline'a tam mesafe; O(N*M) zaman, O(N) bellek."""
    best = np.full(len(points), np.inf)
    if len(line) == 1:
        return np.linalg.norm(points - line[0], axis=1)
    for a, b in zip(line[:-1], line[1:]):
        v = b - a
        t = np.clip((points - a) @ v / max(float(v @ v), 1e-30), 0, 1)
        best = np.minimum(best, np.linalg.norm(points - (a + t[:, None] * v), axis=1))
    return best


def compare_reference(layers, route_px, reference_px):
    """Simetrik örneklenmiş sapma; farklar bizim rota eksi referans, tek yön."""
    route, reference = _cells(layers, route_px), _cells(layers, reference_px)
    distances = np.concatenate((_distances(route, reference), _distances(reference, route))) * layers.res_m
    _, terms = cost_surface(layers, {'t': 1, 'k': 0, 'r': 0})
    profiles = [_profile(layers, p[:, ::-1], terms) for p in (route, reference)]
    totals = [{'min': float(p['sec'].sum()) / 60, 'kcal': float(p['kcal'].sum())} for p in profiles]
    return {'mean_deviation_m': float(distances.mean()), 'max_deviation_m': float(distances.max()),
            'delta_min': totals[0]['min'] - totals[1]['min'],
            'delta_kcal': totals[0]['kcal'] - totals[1]['kcal'],
            'route': totals[0], 'reference': totals[1]}
