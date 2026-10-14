#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
for patch in \
  qa/patches/v090-index.patch \
  qa/patches/v090-styles.patch \
  qa/patches/v090-core.patch \
  qa/patches/v090-app-1.patch \
  qa/patches/v090-app-2.patch \
  qa/patches/v090-app-3.patch \
  qa/patches/v090-app-4.patch; do
  git apply "$patch"
done
cat > /tmp/cre8torcut-v090.sha256 <<'SUMS'
7da6aec3956fdbf7da008cc60c72a71c9b2a519da94361ff789eb624fc92aff0  android-build/app/src/main/assets/index.html
8e9a43f5120ef2bb69314c7d17804a778e4cc8015ca4031ad06ab47bbec4559e  android-build/app/src/main/assets/styles.css
72ecb368da5b4207b54538470938d70f30414ffbe227775eaf63d21f426b0d86  android-build/app/src/main/assets/editor-core.js
17e8d33f294278bcc0cc696fc3a281b30d1cdde88c08d2e8fe154add9d0bff26  android-build/app/src/main/assets/app.js
SUMS
sha256sum -c /tmp/cre8torcut-v090.sha256
node --check android-build/app/src/main/assets/editor-core.js
node --check android-build/app/src/main/assets/app.js
echo 'Cre8torCut v0.9.0 exact source patch: PASS'
