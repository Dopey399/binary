#!/usr/bin/env bash
set -euo pipefail
ROOT="${1:-.}"
cd "$ROOT"
PATCHES=(
  qa/patches/v090-index.patch
  qa/patches/v090-styles.patch
  qa/patches/v090-core.patch
  qa/patches/v090-app-1.patch
  qa/patches/v090-app-2.patch
  qa/patches/v090-app-3.patch
  qa/patches/v090-app-4.patch
)
for patch in "${PATCHES[@]}"; do
  tmp="$(mktemp)"
  python3 - "$patch" "$tmp" <<'PY'
from pathlib import Path
import sys
text = Path(sys.argv[1]).read_text()
Path(sys.argv[2]).write_text(text.rstrip('\n') + '\n')
PY
  git apply "$tmp"
  rm -f "$tmp"
done
python3 - <<'PY'
from pathlib import Path
p = Path('android-build/app/src/main/assets/app.js')
s = p.read_text()
replacements = {
"    previewTransformBox?.setPointerCapture?.(event.pointerId); event.preventDefault();": "    try { previewTransformBox?.setPointerCapture?.(event.pointerId); } catch (_) {} event.preventDefault();",
"  timeline?.addEventListener('pointerdown', (event) => {\n    if (event.pointerType === 'mouse' && event.button !== 0) return;\n    timelineScrubPointerId = event.pointerId; timelineScrubStartX = event.clientX; timelineWasScrubbed = false; pausePlayback(); timeline.setPointerCapture?.(event.pointerId);": "  timeline?.addEventListener('pointerdown', (event) => {\n    if (event.pointerType === 'mouse' && event.button !== 0) return;\n    if (event.target.closest('.timeline-clip') || event.target.closest('.track-rail') || event.target.closest('.replay-marker')) return;\n    timelineScrubPointerId = event.pointerId; timelineScrubStartX = event.clientX; timelineWasScrubbed = false; pausePlayback(); try { timeline.setPointerCapture?.(event.pointerId); } catch (_) {}",
"handle.setPointerCapture?.(event.pointerId);": "try { handle.setPointerCapture?.(event.pointerId); } catch (_) {}",
"timelineResizeGrip.setPointerCapture?.(event.pointerId);": "try { timelineResizeGrip.setPointerCapture?.(event.pointerId); } catch (_) {}",
"  beforeAfterBtn?.addEventListener('pointerdown', (event) => { event.preventDefault(); beforeAfterBtn.setPointerCapture?.(event.pointerId); setOriginalPreview(true); });": "  beforeAfterBtn?.addEventListener('pointerdown', (event) => { event.preventDefault(); try { beforeAfterBtn.setPointerCapture?.(event.pointerId); } catch (_) {} setOriginalPreview(true); });",
}
for old, new in replacements.items():
    if old not in s:
        raise SystemExit(f'missing v0.9.0 fixup target: {old[:72]}')
    s = s.replace(old, new)
p.write_text(s)
PY
cat > /tmp/cre8torcut-v090.sha256 <<'SUMS'
7da6aec3956fdbf7da008cc60c72a71c9b2a519da94361ff789eb624fc92aff0  android-build/app/src/main/assets/index.html
8e9a43f5120ef2bb69314c7d17804a778e4cc8015ca4031ad06ab47bbec4559e  android-build/app/src/main/assets/styles.css
72ecb368da5b4207b54538470938d70f30414ffbe227775eaf63d21f426b0d86  android-build/app/src/main/assets/editor-core.js
7f7de7128b1b34e61858c6dd79e0bcbafe1558db112b2ff9a0389857115d550a  android-build/app/src/main/assets/app.js
SUMS
sha256sum -c /tmp/cre8torcut-v090.sha256
node --check android-build/app/src/main/assets/editor-core.js
node --check android-build/app/src/main/assets/app.js
echo 'Cre8torCut v0.9.0 exact source patch: PASS'
