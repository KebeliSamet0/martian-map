#!/usr/bin/env bash
# Kullanım: sim/tools/qa/run-branch.sh <dal> <port> [görevler]
# Verilen dalı geçici worktree'de açar, sim'i o portta sunar, e2e'yi koşar, raporu sim/tools/qa/reports/<dal>.md'ye yazar.
# Kareler git dışı: /Users/samet/Desktop/Spaceapp/qa-shared/out/
set -uo pipefail
BRANCH="${1:?dal gerekli (örn. tur4/akis)}"; PORT="${2:?port gerekli}"; MISSIONS="${3:-S1,S2,S3}"
HERE="$(cd "$(dirname "$0")" && pwd)"; REPO="$(cd "$HERE/../../.." && pwd)"
SAFE="${BRANCH//\//-}"; TMP="$(mktemp -d "${TMPDIR:-/tmp}/qa-wt-XXXXXX")/wt"
OUT="/Users/samet/Desktop/Spaceapp/qa-shared/out"; REPORTS="$HERE/reports"; mkdir -p "$REPORTS" "$OUT"
REF="origin/$BRANCH"; git -C "$REPO" rev-parse --verify -q "$REF" >/dev/null || REF="$BRANCH"
SHA="$(git -C "$REPO" rev-parse --short "$REF")"
git -C "$REPO" worktree add --detach "$TMP" "$REF" >/dev/null 2>&1 || { echo "worktree açılamadı: $REF"; exit 2; }
# git dışı büyük veri (döşemeler) geçici worktree'de yok: bu worktree'den bağla
[ -e "$TMP/sim/data/tiles" ] || ln -s "$REPO/sim/data/tiles" "$TMP/sim/data/tiles"
PY="$REPO/.venv/bin/python"; [ -x "$PY" ] || PY=python3
"$PY" "$TMP/sim/tools/devserver.py" "$PORT" >/dev/null 2>&1 & SRV=$!
cleanup() { kill "$SRV" 2>/dev/null; git -C "$REPO" worktree remove --force "$TMP" 2>/dev/null; rm -rf "$(dirname "$TMP")"; }
trap cleanup EXIT
sleep 2
JSON="$OUT/${SAFE}.json"; LOG="$OUT/${SAFE}.log"
node "$HERE/e2e.mjs" --url "http://127.0.0.1:$PORT/sim/" --tag "$SAFE" --missions "$MISSIONS" --out "$OUT" --json "$JSON" >"$LOG" 2>&1; CODE=$?
node "$HERE/report.mjs" "$JSON" "$BRANCH" "$SHA" "$CODE" "$LOG" > "$REPORTS/$SAFE.md"
echo "rapor: $REPORTS/$SAFE.md (çıkış $CODE)"; exit $CODE
