#!/usr/bin/env bash
set -euo pipefail

GH_BIN="${GH_BIN:-gh}"
REPO="${REPO:-Totalstoned/Fabelbattler-android}"
WORKFLOW="${WORKFLOW:-build-apk.yml}"
OUT_DIR="${PROJECT_APK_DIR:-/root/projects/FABELBATTLER}"
RUN_ID="${1:-}"

if [ -z "$RUN_ID" ]; then
  RUN_ID="$($GH_BIN run list --repo "$REPO" --workflow "$WORKFLOW" --status success --limit 1 --json databaseId --jq '.[0].databaseId')"
fi

if [ -z "$RUN_ID" ]; then
  echo "Kein erfolgreicher APK-Build gefunden" >&2
  exit 1
fi

ARTIFACT="$($GH_BIN api "repos/$REPO/actions/runs/$RUN_ID/artifacts" --jq '[.artifacts[] | select(.name | test("^[0-9]+[.][0-9]+[.][0-9]+[.]apk$"))][0].name // empty' | python3 -c 'import sys; print(sys.stdin.readline().strip())')"

if [ -z "$ARTIFACT" ]; then
  echo "Kein versionsbenannter APK-Artifact (1.00.1.apk) gefunden" >&2
  exit 1
fi

TARGET="$OUT_DIR/$ARTIFACT"
if [ -e "$TARGET" ]; then
  echo "$TARGET"
  exit 0
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

if ! $GH_BIN run download "$RUN_ID" --repo "$REPO" -n "$ARTIFACT" -D "$TMP_DIR"; then
  echo "Download von Lauf $RUN_ID fehlgeschlagen" >&2
  exit 1
fi

FILE="$(python3 - "$TMP_DIR" <<'PY'
import pathlib, sys
root = pathlib.Path(sys.argv[1])
matches = [p for p in root.rglob('*.apk') if p.is_file()]
print(matches[0] if matches else '')
PY
)"

if [ -z "$FILE" ]; then
  echo "APK-Datei nicht im Artifact gefunden" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
cp "$FILE" "$TARGET"
echo "$TARGET"
