# Cre8torCut QA bots

This directory is compiler/test infrastructure. Drive remains the authoritative Cre8torCut source of truth.

The QA suite deliberately splits failures by responsibility:

- `source-truth-bot` — exact current-candidate source hashes.
- `core-model-bot` — project model, tracks, clips, history, persistence, migration, and transparency/layer fields.
- `ui-contract-bot` — DOM/JS wiring, labels, accessible button names, unique IDs, and mandatory button coverage assignment.
- `browser-bot / desktop` — desktop editing state, undo/redo, layers, text, FX, transport, split/delete/navigation.
- `browser-bot / buttons` — direct smoke click coverage for button families with scenario-specific preconditions.
- `browser-bot / mobile` — phone dock/sheets, mobile edit shortcuts, zoom, and fullscreen entry.
- `browser-bot / media` — native alpha layering, color-key transparency, project persistence, and short WebM export.
- `browser-bot / chaos` — deterministic randomized control mutations intended to expose state/render exceptions.
- `android-host-bot` — Android chooser/host contract plus debug APK compilation.
- `apk-package-bot` — APK integrity/signature and embedded web-source hash verification.

The suite restores the exact v0.8.0 APK candidate from the successful GitHub artifact before testing, then verifies the embedded source hashes against Drive truth. Browser traces, screenshots, videos, and reports are uploaded on failures so a red bot has evidence attached.
