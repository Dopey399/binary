#!/usr/bin/env bash
set -euo pipefail
: "${GITHUB_TOKEN:?GITHUB_TOKEN is required to download the candidate artifact}"
ROOT="${1:-.}"
ARTIFACT_ID="11827753664"
EXPECTED_APK_SHA="c743abed076d7a5235ee5d8eece94858c4f97ac592dc633305570deda626c7b4"
API="https://api.github.com/repos/${GITHUB_REPOSITORY}/actions/artifacts/${ARTIFACT_ID}/zip"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

curl -fsSL --retry 3 \
  -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  -H 'Accept: application/vnd.github+json' \
  -H 'X-GitHub-Api-Version: 2022-11-28' \
  "$API" -o "$TMP/artifact.zip"
unzip -q "$TMP/artifact.zip" -d "$TMP/artifact"
APK="$(find "$TMP/artifact" -type f -name '*.apk' | head -n 1)"
[[ -n "$APK" ]] || { echo 'candidate APK missing from artifact' >&2; exit 1; }
echo "$EXPECTED_APK_SHA  $APK" | sha256sum -c -

rm -rf "$ROOT/android-build/app/src/main/assets"
mkdir -p "$ROOT/android-build/app/src/main/assets" "$TMP/apk"
unzip -qq "$APK" 'assets/*' -d "$TMP/apk"
cp -a "$TMP/apk/assets/." "$ROOT/android-build/app/src/main/assets/"

cat > "$TMP/assets.sha256" <<SUMS
3e1feaac8691da8829b702ace88f61babdd7e280df7f1fd1b9c199ce792edca3  $ROOT/android-build/app/src/main/assets/index.html
98b260e79aaaca361237e14addeb05df8ced18ded9d50bb136d6cfe173ac62cc  $ROOT/android-build/app/src/main/assets/styles.css
1f21f2be66fc8625ea36c0941f8c740d7267d637791d4f9318ab8885a54952ec  $ROOT/android-build/app/src/main/assets/editor-core.js
0d61c05d0cdcbdf45365ae1a6c5dbd8132c89f746942e6e0c58d3cc25a1dd26e  $ROOT/android-build/app/src/main/assets/app.js
SUMS
sha256sum -c "$TMP/assets.sha256"
node --check "$ROOT/android-build/app/src/main/assets/editor-core.js"
node --check "$ROOT/android-build/app/src/main/assets/app.js"
echo "v0.8.0 base candidate restored from artifact $ARTIFACT_ID: PASS"
bash "$ROOT/qa/scripts/apply-v090.sh" "$ROOT"
