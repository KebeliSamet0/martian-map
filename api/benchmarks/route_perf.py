"""Repo kökünden: .venv/bin/python -m api.benchmarks.route_perf 2000"""
import cProfile
import io
import json
import platform
import pstats
import sys
import time
from fastapi.testclient import TestClient
from api import planner
from api.main import app

n = int(sys.argv[1])
t = time.perf_counter()
layers = planner.synthetic(n, n, res_m=8, seed=7)
load_s = time.perf_counter() - t
planner.load = lambda: layers
start, goal = [int(n*.44), int(n*.94)], [int(n*.60), int(n*.12)]
with TestClient(app) as client:
    profile = cProfile.Profile()
    # TestClient handler ayrı thread'de: gerçek /route işini handler içinde profille.
    original = planner.plan
    def measured(*args, **kwargs):
        return profile.runcall(original, *args, **kwargs)
    planner.plan = measured
    t = time.perf_counter()
    response = client.post('/route', json={'start': start, 'goal': goal})
    elapsed = time.perf_counter() - t
    print(json.dumps({'n': n, 'res_m': 8, 'start': start, 'goal': goal, 'seed': 7,
                      'python': platform.python_version(), 'machine': platform.machine(),
                      'load_s': load_s, 'route_s': elapsed, 'status': response.status_code,
                      'routes': len(response.json().get('routes', []))}), flush=True)
    stream = io.StringIO()
    pstats.Stats(profile, stream=stream).sort_stats('cumtime').print_stats(12)
    print(stream.getvalue(), flush=True)
    response.raise_for_status()
