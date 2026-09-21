#!/usr/bin/env bash
# dsh-ponytail build: pure-JS plugin — no transpilation. Validate syntax + bundled
# assets, fail loud on anything missing. Produces nothing; npm pack does the packing.
set -euo pipefail
cd "$(dirname "$0")/.."

node --check lib/index.js

for f in skills/ponytail/SKILL.md cordis.patch.yml upstream/LICENSE upstream/README.md; do
  test -f "$f" || { echo "FAIL: $f missing" >&2; exit 1; }
done

count=$(find skills -name SKILL.md | wc -l | tr -d ' ')
test "$count" -ge 6 || { echo "FAIL: expected >=6 bundled skills, found $count" >&2; exit 1; }

echo "dsh-ponytail build OK ($count skills bundled)"
