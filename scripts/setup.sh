#!/usr/bin/env bash
# Tek seferlik kurulum: Python sanal ortamı + API bağımlılıkları (+ isteğe bağlı web).
# Kullanım (repo kökünden):  bash scripts/setup.sh   →   bash scripts/dev.sh   →   http://127.0.0.1:8001/sim/
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# 3.10+ Python bul (macOS'un /usr/bin/python3'ü 3.9 olabilir).
PY="${PYTHON_BIN:-}"
if [[ -z "$PY" ]]; then
  for c in python3.13 python3.12 python3.11 python3.10 python3 python; do
    if command -v "$c" >/dev/null 2>&1 && "$c" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' 2>/dev/null; then PY="$c"; break; fi
  done
fi
if [[ -z "$PY" ]]; then
  echo "Hata: Python 3.10+ bulunamadı. macOS: brew install python@3.12 · Windows/Linux: python.org" >&2
  echo "       Belirli bir yorumlayıcı için: PYTHON_BIN=/yol/python3.12 bash scripts/setup.sh" >&2
  exit 1
fi
echo "Python: $("$PY" --version) ($PY)"
if [[ -x .venv/bin/python ]] && ! .venv/bin/python -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)'; then
  echo "Eski .venv (Python < 3.10) siliniyor..."; rm -rf .venv
fi

if [[ ! -x .venv/bin/python ]]; then
  echo "Sanal ortam oluşturuluyor (.venv)..."
  "$PY" -m venv .venv
fi
.venv/bin/python -m pip install -q --upgrade pip
.venv/bin/python -m pip install -q -r api/requirements.txt
echo "API bağımlılıkları kuruldu."

if command -v npm >/dev/null 2>&1 && [[ -f web/package.json ]]; then
  echo "Web bağımlılıkları kuruluyor (isteğe bağlı)..."
  (cd web && npm install --silent) || echo "Uyarı: web kurulamadı; sim yine çalışır." >&2
fi

if [[ ! -f sim/data/tiles_fixed/manifest.json ]]; then
  echo "Uyarı: sim/data/tiles_fixed eksik. 'git pull' ile güncel main'i alın." >&2
fi
echo "Hazır. Başlatmak için: bash scripts/dev.sh  →  http://127.0.0.1:8001/sim/"
