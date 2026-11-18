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

ARTIFACT="$($GH_BIN api "repos/$REPO/actions/runs/$RUN_ID/artifacts" --paginate --jq '[.artifacts[] | select(.name | startswith("fabelbattler-v"))][0].name // empty')"

if [ "$ARTIFACT" = "null" ] || [ -z "$ARTIFACT" ]; then
  echo "Kein versionsbenannter APK-Artifact gefunden" >&2
  exit 1
fi

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

$GH_BIN run download "$RUN_ID" --repo "$REPO" -n "$ARTIFACT" -D "$TMP_DIR"
mkdir -p "$OUT_DIR"
FILE="$(python3 - "$TMP_DIR" "$ARTIFACT" <<'PY'
import pathlib, sys
root = pathlib.Path(sys.argv[1])
matches = [p for p in root.rglob(sys.argv[2]) if p.is_file()]
print(matches[0] if matches else '')
PY
)"

if [ -z "$FILE" ]; then
  echo "APK-Datei nicht im Artifact gefunden" >&2
  exit 1
fi

cp "$FILE" "$OUT_DIR/$ARTIFACT"
echo "$OUT_DIR/$ARTIFACT"
