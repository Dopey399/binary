#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
HOST="$ROOT/android-build/app/src/main/java/com/cre8torcut/mobile/MainActivity.java"
GRADLE="$ROOT/android-build/app/build.gradle"
MANIFEST="$ROOT/android-build/app/src/main/AndroidManifest.xml"

grep -q 'Intent.ACTION_GET_CONTENT' "$HOST"
grep -q 'Intent.ACTION_OPEN_DOCUMENT' "$HOST"
grep -q 'Intent.EXTRA_INITIAL_INTENTS' "$HOST"
grep -q 'Intent.EXTRA_ALLOW_MULTIPLE' "$HOST"
grep -q 'Intent.EXTRA_MIME_TYPES' "$HOST"
grep -q 'FLAG_GRANT_READ_URI_PERMISSION' "$HOST"
grep -q 'takePersistableUriPermission' "$HOST"
grep -q 'setJavaScriptEnabled(true)' "$HOST"
grep -q 'setDomStorageEnabled(true)' "$HOST"
grep -q 'file:///android_asset/index.html' "$HOST"
grep -q "applicationId 'com.cre8torcut.mobile'" "$GRADLE"
grep -q 'versionCode 19' "$GRADLE"
grep -q "versionName '0.9.0'" "$GRADLE"
grep -q 'android.permission.INTERNET' "$MANIFEST" || true

echo 'android-host-bot: PASS'
