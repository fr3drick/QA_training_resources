#!/usr/bin/env bash
# Usage: ./run-tests.sh [smoke|regression|known-defects|all]
set -euo pipefail
cd "$(dirname "$0")"

SUITE="${1:-regression}"
COLLECTION="qa-shop.postman_collection.json"
ENVIRONMENT="local.postman_environment.json"
mkdir -p reports

run() {
  local name="$1"; shift
  newman run "$COLLECTION" -e "$ENVIRONMENT" "$@" \
    -r cli,junit,htmlextra \
    --reporter-junit-export "reports/${name}-junit.xml" \
    --reporter-htmlextra-export "reports/${name}.html"
}

case "$SUITE" in
  smoke)         run smoke --folder "01 Smoke" --bail ;;
  regression)    run regression --folder "02 Auth" --folder "03 Products" \
                                --folder "04 Order workflow" --folder "05 Order validation" ;;
  known-defects) run known-defects --folder "99 Known defects" ;;
  all)           "$0" smoke && "$0" regression ;;
  *)             echo "Unknown suite: $SUITE"; exit 2 ;;
esac
