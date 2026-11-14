"""HTTP olmadan üç ön ayarı sözleşme biçiminde JSON dosyalarına yazar."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from api import planner


def validate_pairs(pairs):
    if not isinstance(pairs, list) or not pairs:
        raise ValueError("Girdi boş olmayan bir çift listesi olmalı")
    names = set()
    for pair in pairs:
        if not isinstance(pair, dict) or set(pair) != {"name", "start", "goal"}:
            raise ValueError("Her çift name, start ve goal alanlarını içermeli")
        name = pair["name"]
        if not isinstance(name, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", name):
            raise ValueError("Ad yalnız harf, rakam, tire ve alt çizgi içermeli")
        if name in names:
            raise ValueError(f"Tekrarlanan ad: {name}")
        names.add(name)
        for key in ("start", "goal"):
            px = pair[key]
            if not isinstance(px, list) or len(px) != 2 or any(type(v) is not int for v in px):
                raise ValueError(f"{name}: {key} tam sayı [x,y] olmalı")


def precompute(pairs, layers, output_dir):
    validate_pairs(pairs)
    info = layers.grid_info()
    grid = {k: info[k] for k in ("region", "width", "height", "res_m", "synthetic", "px_note")}
    # Tüm hesaplamalar başarılı olmadan mevcut çıktılara dokunma.
    results = []
    for pair in pairs:
        payload = {"grid": grid, "routes": planner.plan(layers, pair["start"], pair["goal"])}
        results.append((pair["name"], json.dumps(payload, ensure_ascii=False, allow_nan=False, indent=2) + "\n"))
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for name, data in results:
        path = output_dir / f"{name}.json"
        path.write_text(data, encoding="utf-8")
        paths.append(path)
    return paths


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pairs", type=Path, help="name/start/goal nesnelerinden oluşan JSON listesi")
    source = parser.add_mutually_exclusive_group()
    source.add_argument("--synthetic", action="store_true", help="Gerçek katman olsa da sentetik kullan")
    source.add_argument("--layers-dir", type=Path, help="grid.json içeren katman dizini")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "web/public/routes")
    args = parser.parse_args(argv)
    try:
        pairs = json.loads(args.pairs.read_text(encoding="utf-8"))
        validate_pairs(pairs)
        if args.layers_dir is not None and not (args.layers_dir / "grid.json").is_file():
            raise ValueError("Belirtilen katman dizininde grid.json bulunamadı")
        layers = (planner.synthetic() if args.synthetic else
                  planner.load(args.layers_dir) if args.layers_dir is not None else planner.load())
        for path in precompute(pairs, layers, args.output_dir):
            print(path)
    except (ValueError, OSError) as exc:
        parser.exit(1, f"Hata: {exc}\n")


if __name__ == "__main__":
    main()
