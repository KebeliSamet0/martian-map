#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PYTHON="${PYTHON:-$ROOT/.venv/bin/python}"
API_PORT="${API_PORT:-8000}"
WEB_PORT="${WEB_PORT:-5173}"
SIM_PORT="${SIM_PORT:-8001}"

if [[ ! -x "$PYTHON" ]]; then
  echo "Hata: Python sanal ortamı bulunamadı ($PYTHON)." >&2
  echo "Kurulum için: python3 -m venv .venv && .venv/bin/python -m pip install -r api/requirements.txt" >&2
  exit 1
fi

if ! "$PYTHON" -c "import fastapi, uvicorn, numpy, scipy, skimage, PIL" >/dev/null 2>&1; then
  echo "Hata: Python API bağımlılıkları eksik." >&2
  echo "Kurulum için: $PYTHON -m pip install -r api/requirements.txt" >&2
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "Hata: 'npm' komutu bulunamadı. Node.js (LTS) ve npm kurun." >&2
  exit 1
fi

if [[ ! -d "$ROOT/web/node_modules" ]]; then
  echo "Hata: web/node_modules bulunamadı." >&2
  echo "Kurulum için: (cd web && npm install)" >&2
  exit 1
fi

if [[ ! -d "$ROOT/sim/data/tiles" ]]; then
  echo "Uyarı: sim/data/tiles bulunamadı (3D arazi karoları bu makinede üretilmemiş)." >&2
  echo "       Sim sunucusu yine de başlatılıyor; karoları üretmek isterseniz: $PYTHON -I sim/tools/build_tiles.py" >&2
fi

PIDS=()
cleanup() {
  echo ""
  echo "Servisler kapatılıyor..."
  for pid in "${PIDS[@]:-}"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

MARTIAN_LAYERS_DIR="$ROOT" "$PYTHON" -m uvicorn api.main:app --host 127.0.0.1 --port "$API_PORT" &
PIDS+=("$!")

(cd "$ROOT/web" && npm run dev -- --host 127.0.0.1 --port "$WEB_PORT") &
PIDS+=("$!")

"$PYTHON" "$ROOT/sim/tools/devserver.py" "$SIM_PORT" &
PIDS+=("$!")

cat <<EOF
============================================================
Martian Map geliştirme ortamı başlatıldı:
  API (FastAPI) : http://127.0.0.1:${API_PORT}  (Docs: http://127.0.0.1:${API_PORT}/docs)
  Web (Vite)    : http://127.0.0.1:${WEB_PORT}
  Sim (3D)      : http://127.0.0.1:${SIM_PORT}/sim/
  Katman dizini : MARTIAN_LAYERS_DIR=${ROOT}
Durdurmak için Ctrl-C basın.
============================================================
EOF

wait
