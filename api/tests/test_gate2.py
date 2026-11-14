import json
import numpy as np
import pytest
from fastapi.testclient import TestClient
from api import planner
from api.main import app
from api.planner import params as P
from api.planner.layers import Layers, LayerError, load
from api.planner.route import _profile, _segments, _budget
from api.planner.cost import cost_surface
from api.planner.comparison import compare_reference
from api.planner.terrain import load_terrain


def flat(n=30):
    z = np.zeros((n, n), dtype=np.float32)
    return Layers(n, n, 10, z.copy(), z.copy(), z.copy(),
                  {c: np.full_like(z, float(c == 'bedrock')) for c in P.CLASSES}, z.copy())


def test_segments_changes_and_distance():
    l = flat()
    l.probs['bedrock'][0, 2:4] = 0
    l.probs['sand'][0, 2:4] = 1
    l.slope[0, 5:7] = 9
    p = np.array([[0, x] for x in range(25)])
    _, terms = cost_surface(l, P.PRESETS['balanced'])
    prof = _profile(l, p, terms)
    segments = _segments(l, p, prof)
    ends = [s['path_px'][-1][0] for s in segments]
    assert all(x in ends for x in (2, 4, 5, 7))
    assert max(s['len_m'] for s in segments) <= 100
    assert sum(s['len_m'] for s in segments) == 240
    for key, term, scale in [('min', 'sec', 60), ('kcal', 'kcal', 1), ('risk', 'risk', 1)]:
        assert sum(s[key] for s in segments) == pytest.approx(prof[term].sum() / scale, abs=.05 * len(segments))
    assert all(a['path_px'][-1] == b['path_px'][0] for a,b in zip(segments, segments[1:]))


@pytest.mark.parametrize('key', ['time_min', 'kcal', 'o2_L', 'dose_uGy'])
def test_each_budget_exact_boundary_and_first_point(key):
    l = flat()
    path = np.array([[0, x] for x in range(5)])
    _, terms = cost_surface(l, P.PRESETS['balanced'])
    prof = _profile(l, path, terms)
    prefix = {k: (v[:3] if isinstance(v, np.ndarray) else v) for k,v in prof.items()}
    limits = dict(time_min=1e6, kcal=1e6, o2_L=1e6, dose_uGy=1e6, reserve_min=0)
    # Use unrounded algebra to establish exact equality at index 2.
    mins = 2 * prof['sec'][:3].sum() / 60 + P.SCIENCE_STOP_MIN
    kcal = 2 * prof['kcal'][:3].sum() + P.SCIENCE_STOP_MIN * 60 * P.STOP_METABOLIC_W / 4184
    limits[key] = dict(time_min=mins, kcal=kcal, o2_L=kcal/P.KCAL_PER_L_O2, dose_uGy=mins/60*P.DOSE_UGY_PER_H)[key]
    assert _budget(prefix, [], path[:3], limits)['go']
    total = _budget(prof, [], path, limits)
    assert not total['go'] and total['status'] == 'NO-GO'
    assert total['limit_exceeded_at_px'] == [3, 0]
    assert total['limit_exceeded_at_m'] == 30
    assert total['budget']['first_exceeded'] == [key]


def test_budget_api_and_zero_length(monkeypatch):
    monkeypatch.setattr(planner, 'load', flat)
    with TestClient(app) as client:
        for url in ('/route', '/replan'):
            body = dict(start=[0,0], goal=[0,0], budget={'dose_uGy': 0})
            if url == '/replan': body['observations'] = []
            result = client.post(url, json=body)
            assert result.status_code == 200
            total = result.json()['routes'][0]['total']
            assert total['limit_exceeded_at_index'] == 0
            assert total['limit_exceeded_at_px'] == [0,0]
            assert total['budget']['used']['kcal'] > 0
            body['budget'] = {'kcal': -1}
            assert client.post(url, json=body).status_code == 422


@pytest.fixture
def package(tmp_path):
    l = flat(4)
    manifest = dict(width=4, height=4, res_m=10, origin_xy_m=[0,0], crs='LOCAL:MARS_METRIC', layers={})
    for name in l.grid_info()['layers']:
        a = l.probs[name[2:]] if name.startswith('p_') else getattr(l, name)
        np.save(tmp_path / f'{name}.npy', a)
        manifest['layers'][name] = f'{name}.npy'
    (tmp_path / 'grid.json').write_text(json.dumps(manifest))
    return tmp_path, manifest


def test_loader_env_and_legacy(monkeypatch, package):
    root, g = package
    monkeypatch.setenv('MARTIAN_LAYERS_DIR', str(root))
    assert not load().synthetic
    monkeypatch.delenv('MARTIAN_LAYERS_DIR')
    monkeypatch.setenv('MM_LAYERS_DIR', str(root))
    assert load().width == 4
    monkeypatch.delenv('MM_LAYERS_DIR')
    assert load().synthetic
    with pytest.raises(LayerError, match='okunamadı'): load(root/'missing')


@pytest.mark.parametrize('change', ['shape', 'nan', 'nodata', 'res', 'crs', 'layer_crs', 'prob', 'missing'])
def test_loader_invalid(package, change):
    root, g = package
    if change == 'shape': np.save(root/'slope.npy', np.zeros((2,3)))
    if change == 'nan': np.save(root/'slope.npy', np.full((4,4), np.nan))
    if change == 'nodata':
        g['nodata'] = -9999
        np.save(root/'elevation.npy', np.full((4,4), -9999))
    if change == 'res': g['res_m'] = 0
    if change == 'crs': del g['crs']
    if change == 'layer_crs': g['layers']['slope'] = {'path': 'slope.npy', 'crs': 'OTHER'}
    if change == 'prob': np.save(root/'p_sand.npy', np.ones((4,4)))
    if change == 'missing': g['layers']['entropy'] = 'absent.npy'
    (root/'grid.json').write_text(json.dumps(g))
    with pytest.raises(LayerError): load(root)


def test_reference_identity_offset_and_deltas():
    l = flat()
    same = compare_reference(l, [[0,0],[10,0]], [[0,0],[10,0]])
    assert all(same[k] == 0 for k in ('mean_deviation_m', 'max_deviation_m', 'delta_min', 'delta_kcal'))
    shifted = compare_reference(l, [[0,2],[10,2]], [[0,0],[10,0]])
    assert shifted['mean_deviation_m'] == shifted['max_deviation_m'] == 20
    longer = compare_reference(l, [[0,0],[10,0],[10,10]], [[0,0],[10,0]])
    assert longer['delta_min'] > 0 and longer['delta_kcal'] > 0
    assert longer['max_deviation_m'] == 100
    l.slope[0,5] = 30
    with pytest.raises(planner.PlanError): compare_reference(l, [[0,0],[10,0]], [[0,0]])
    with pytest.raises(planner.PlanError): compare_reference(l, [], [[0,0]])


def test_terrain_source(tmp_path):
    path = tmp_path/'model.md'
    assert load_terrain(P.TERRAIN_ETA, P.TERRAIN_SPEED, path)[0] == P.TERRAIN_ETA
    path.write_text('| class | eta | speed |\n|---|---|---|\n' + '\n'.join(f'| {c} | 2 | 0.8 |' for c in P.CLASSES))
    eta, speed, source = load_terrain(P.TERRAIN_ETA, P.TERRAIN_SPEED, path)
    assert set(eta.values()) == {2} and set(speed.values()) == {.8}
    path.write_text('| class | eta | speed |\n| soil | nan | 1 |')
    with pytest.raises(ValueError): load_terrain(P.TERRAIN_ETA, P.TERRAIN_SPEED, path)


def test_real_package_api_and_metadata_objects(monkeypatch, package):
    root, g = package
    for name, path in list(g['layers'].items()):
        g['layers'][name] = {'path': path, 'res_m': 10, 'crs': g['crs'], 'origin_xy_m': [0,0]}
    (root/'grid.json').write_text(json.dumps(g))
    monkeypatch.setenv('MARTIAN_LAYERS_DIR', str(root))
    with TestClient(app) as client:
        response = client.post('/route', json={'start': [0,0], 'goal': [3,3]})
        assert response.status_code == 200 and not response.json()['grid']['synthetic']
        assert len(response.json()['routes']) == 3


def test_radiation_is_not_cell_cost(monkeypatch):
    l = flat()
    before, _ = cost_surface(l, P.PRESETS['safest'])
    monkeypatch.setattr(P, 'DOSE_UGY_PER_H', P.DOSE_UGY_PER_H * 100)
    after, _ = cost_surface(l, P.PRESETS['safest'])
    np.testing.assert_array_equal(before, after)
    result = planner.plan(l, [0,0], [3,3])[0]
    assert not result['total']['go']
    assert 'dose_uGy' in result['total']['budget']['exceeded']
