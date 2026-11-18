#!/usr/bin/env bash
set -euo pipefail

GH_BIN="${GH_BIN:-gh}"
REPO="${REPO:-Totalstoned/Fabelbattler-android}"
WORKFLOW="${WORKFLOW:-build-apk.yml}"
OUT_DIR="${PROJECT_APK_DIR:-/root/projects/FABELBATTLER}"
ALL_RUNS=false

if [ "${1:-}" = "--all" ]; then
  ALL_RUNS=true
  shift
fi

RUN_ID="${1:-}"

download_run() {
  local run_id="$1"
  local artifact sha base target tmp file

  artifact="$($GH_BIN api "repos/$REPO/actions/runs/$run_id/artifacts" --jq '[.artifacts[] | select((.name | startswith("fabelbattler-v")) or .name == "fb")][0].name // empty' | python3 -c 'import sys; print(sys.stdin.readline().strip())')"

  if [ -z "$artifact" ]; then
    echo "Kein APK-Artifact in Lauf $run_id gefunden" >&2
    return
  fi

  if [ "$artifact" = "fb" ]; then
    sha="$($GH_BIN run view "$run_id" --repo "$REPO" --json headSha --jq '.headSha')"
    base="fabelbattler-v1.0-b1-run${run_id}-${sha:0:7}.apk"
  else
    base="$artifact"
  fi

  target="$OUT_DIR/$base"
  if [ -e "$target" ]; then
    target="$OUT_DIR/${base%.apk}-run${run_id}.apk"
  fi
  if [ -e "$target" ]; then
    echo "$target"
    return
  fi

  tmp="$(mktemp -d)"
  if ! $GH_BIN run download "$run_id" --repo "$REPO" -n "$artifact" -D "$tmp"; then
    echo "Download von Lauf $run_id fehlgeschlagen" >&2
    rm -rf "$tmp"
    return
  fi

  file="$(python3 - "$tmp" <<'PY'
import pathlib, sys
root = pathlib.Path(sys.argv[1])
matches = [p for p in root.rglob('*.apk') if p.is_file()]
print(matches[0] if matches else '')
PY
)"

  if [ -z "$file" ]; then
    echo "APK-Datei nicht im Artifact von Lauf $run_id gefunden" >&2
    rm -rf "$tmp"
    return
  fi

  mkdir -p "$OUT_DIR"
  cp "$file" "$target"
  echo "$target"
  rm -rf "$tmp"
}

if $ALL_RUNS; then
  mapfile -t RUN_IDS < <($GH_BIN run list --repo "$REPO" --workflow "$WORKFLOW" --status success --limit 1000 --json databaseId --jq '.[].databaseId')
  if [ "${#RUN_IDS[@]}" -eq 0 ]; then
    echo "Keine erfolgreichen APK-Builds gefunden" >&2
    exit 1
  fi
  for run in "${RUN_IDS[@]}"; do
    download_run "$run"
  done
else
  if [ -z "$RUN_ID" ]; then
    RUN_ID="$($GH_BIN run list --repo "$REPO" --workflow "$WORKFLOW" --status success --limit 1 --json databaseId --jq '.[0].databaseId')"
  fi
  if [ -z "$RUN_ID" ]; then
    echo "Kein erfolgreicher APK-Build gefunden" >&2
    exit 1
  fi
  download_run "$RUN_ID"
fi
