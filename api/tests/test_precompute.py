import json
from pathlib import Path
import subprocess
import sys

import pytest

from api import planner
from scripts.precompute_routes import precompute

ROOT = Path(__file__).resolve().parents[2]
PAIRS = json.loads((ROOT / "scripts/route_pairs.example.json").read_text())


def test_cli_outputs_match_core_and_committed_examples(tmp_path):
    completed = subprocess.run(
        [sys.executable, str(ROOT / "scripts/precompute_routes.py"),
         str(ROOT / "scripts/route_pairs.example.json"), "--synthetic",
         "--output-dir", str(tmp_path)], cwd=tmp_path, capture_output=True, text=True,
    )
    assert completed.returncode == 0, completed.stderr
    layers = planner.synthetic()
    contract = json.loads((ROOT / "contracts/route.example.json").read_text())
    for pair in PAIRS:
        path = tmp_path / f"{pair['name']}.json"
        payload = json.loads(path.read_text())
        assert set(payload) == set(contract)
        assert set(payload["grid"]) == set(contract["grid"])
        assert payload["grid"]["synthetic"] is True
        assert [r["kind"] for r in payload["routes"]] == ["shortest", "balanced", "safest"]
        assert payload["routes"] == planner.plan(layers, pair["start"], pair["goal"])
        assert path.read_bytes() == (ROOT / "web/public/routes" / path.name).read_bytes()


@pytest.mark.parametrize("pairs", [
    [], [dict(PAIRS[0], name="../escape")], [PAIRS[0], PAIRS[0]],
    [dict(PAIRS[0], start=[1.5, 2])], [dict(PAIRS[0], start=[True, 2])],
    [PAIRS[0], dict(PAIRS[1], goal=[999, 999])],
])
def test_invalid_batch_preserves_existing_output(tmp_path, pairs):
    target = tmp_path / "synthetic-short.json"
    target.write_text("existing")
    with pytest.raises(ValueError):
        precompute(pairs, planner.synthetic(), tmp_path)
    assert target.read_text() == "existing"
    assert list(tmp_path.iterdir()) == [target]


def test_explicit_missing_layers_fails_without_output(tmp_path):
    completed = subprocess.run(
        [sys.executable, str(ROOT / "scripts/precompute_routes.py"),
         str(ROOT / "scripts/route_pairs.example.json"),
         "--layers-dir", str(tmp_path / "missing"), "--output-dir", str(tmp_path / "out")],
        capture_output=True, text=True,
    )
    assert completed.returncode == 1
    assert "grid.json" in completed.stderr
    assert not (tmp_path / "out").exists()
