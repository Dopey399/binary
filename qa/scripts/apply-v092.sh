#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
for patch in qa/patches/v092-index.patch qa/patches/v092-styles.patch qa/patches/v092-core.patch qa/patches/v092-app.patch; do
  git apply --unidiff-zero "$patch"
done
cat > /tmp/cre8torcut-v092.sha256 <<'SUMS'
2a397298259f946698f96e5bce2706743299c664aa323104af94a8059924325c  android-build/app/src/main/assets/index.html
01abd9da097173c73b1adf75ce8c66d08526e0c39a5d7a4bdcc1817543f84d77  android-build/app/src/main/assets/styles.css
084bedbe6734b495b22c1410debc90f48bf818aa1940f5a150493032a06bb691  android-build/app/src/main/assets/editor-core.js
f98b8cd05750db1de3474991f058cce19805d572c08778c50442439085f8ea33  android-build/app/src/main/assets/app.js
SUMS
sha256sum -c /tmp/cre8torcut-v092.sha256
node --check android-build/app/src/main/assets/editor-core.js
node --check android-build/app/src/main/assets/app.js
echo 'Cre8torCut v0.9.2 crop-first correction patch: PASS'
