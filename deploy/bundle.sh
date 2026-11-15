#!/usr/bin/env bash
# Yayın paketini deploy/dist/ altında toplar (git dışı). Hiçbir yere yüklemez.
# Kullanım (repo kökünden): deploy/bundle.sh [--no-tiles]
# Döşemeler git'te değildir (354 MB, sim/data/tiles_fixed = DEM kayması düzeltilmiş); yerel kopyadan alınır, yoksa
# python -I sim/tools/build_tiles.py --out sim/data/tiles_fixed --work <ayrı klasör> --dtm-dcol 30 --dtm-drow 33 ile üretilir (docs/sim/DEM_KAYMA.md).
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=deploy/dist
rm -rf "$OUT"; mkdir -p "$OUT"
RS="rsync -a --exclude __pycache__ --exclude '*.pyc' --exclude .DS_Store"
eval $RS --exclude tests api/ "$OUT/api/"
eval $RS contracts/ "$OUT/contracts/"
eval $RS layers/ "$OUT/layers/"
eval $RS --exclude tests --exclude tools --exclude '*.md' --exclude data/tiles --exclude data/tiles_fixed sim/ "$OUT/sim/"
mkdir -p "$OUT/deploy"; cp deploy/server.py deploy/requirements.txt "$OUT/deploy/"
touch "$OUT/deploy/__init__.py"
cp deploy/Dockerfile "$OUT/Dockerfile"
cp deploy/SPACE_README.md "$OUT/README.md"
cp deploy/gitattributes "$OUT/.gitattributes"
if [ "${1:-}" != "--no-tiles" ]; then
  [ -f sim/data/tiles_fixed/manifest.json ] || { echo "sim/data/tiles_fixed yok: python -I sim/tools/build_tiles.py --out sim/data/tiles_fixed --work <ayrı klasör> --dtm-dcol 30 --dtm-drow 33 ile üret (kaymış sim/data/tiles paketlenmez)" >&2; exit 1; }
  rsync -aL sim/data/tiles_fixed/ "$OUT/sim/data/tiles_fixed/"
fi
printf '__pycache__/\n*.pyc\n' > "$OUT/.dockerignore"
du -sh "$OUT"; find "$OUT" -type f | wc -l
