#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
for patch in qa/patches/v091-ui.patch qa/patches/v091-transform.patch qa/patches/v091-timeline.patch; do
  git apply "$patch"
done
cat > /tmp/cre8torcut-v091.sha256 <<'SUMS'
27771340fc766ee88d445d183b90cba18ae08d48b6696f27529253605f2f5c69  android-build/app/src/main/assets/index.html
88966ad6a6376215100b3eceb5831f7e378ef7c422bd61e83c30f07185858118  android-build/app/src/main/assets/styles.css
72ecb368da5b4207b54538470938d70f30414ffbe227775eaf63d21f426b0d86  android-build/app/src/main/assets/editor-core.js
101e4c9f5278a473fccd4bcd2e29c1b837730a8a280bb9f90b7f553bea557aef  android-build/app/src/main/assets/app.js
SUMS
sha256sum -c /tmp/cre8torcut-v091.sha256
node --check android-build/app/src/main/assets/editor-core.js
node --check android-build/app/src/main/assets/app.js
echo 'Cre8torCut v0.9.1 touch correction patch: PASS'
