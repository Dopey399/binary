import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = process.env.CRE8TORCUT_ASSETS || path.resolve(here, '../../android-build/app/src/main/assets');
const qaRoot = path.resolve(here, '..');
const html = fs.readFileSync(path.join(assets, 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(assets, 'app.js'), 'utf8');
const styles = fs.readFileSync(path.join(assets, 'styles.css'), 'utf8');
const coverage = JSON.parse(fs.readFileSync(path.join(qaRoot, 'button-coverage.json'), 'utf8'));

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
const unique = new Set(ids);
assert.equal(unique.size, ids.length, 'duplicate DOM id found');

const dollarIds = [...app.matchAll(/\$\(['"]([^'"]+)['"]\)/g)].map((m) => m[1]);
for (const id of new Set(dollarIds)) assert(unique.has(id), `app.js references missing DOM id #${id}`);

for (const [, target] of html.matchAll(/<label\b[^>]*\bfor="([^"]+)"[^>]*>/gi)) {
  assert(unique.has(target), `label for=${target} has no matching element`);
}

const buttonMatches = [...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/gi)];
const staticButtonIds = [];
let genericButtons = 0;
for (const [, attrs, body] of buttonMatches) {
  const id = attrs.match(/\bid="([^"]+)"/i)?.[1];
  const aria = attrs.match(/\baria-label="([^"]+)"/i)?.[1]?.trim();
  const title = attrs.match(/\btitle="([^"]+)"/i)?.[1]?.trim();
  const text = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  assert(aria || title || text, `button${id ? ` #${id}` : ''} has no accessible name/text`);
  if (id) {
    staticButtonIds.push(id);
    assert(coverage[id], `button #${id} is not assigned to a QA bot in button-coverage.json`);
  } else {
    const generic = /data-(?:close-mobile-sheet|mobile-action|mobile-tool|mobile-sheet)(?:=|\s)/i.test(attrs);
    assert(generic, `anonymous button is not covered by a generic delegated handler: ${text || attrs}`);
    genericButtons += 1;
  }
}

for (const id of Object.keys(coverage)) assert(staticButtonIds.includes(id), `coverage manifest contains stale button #${id}`);

const requiredIds = [
  'videoInput', 'projectInput', 'previewCanvas', 'timeline', 'timelineClips',
  'creatorModeBtn', 'splitBtn', 'deleteClipBtn', 'layerUpBtn', 'layerDownBtn',
  'keyEnabled', 'keyColor', 'keyTolerance', 'keySoftness', 'pickKeyColorBtn',
  'effectBtn', 'pickSphereBtn', 'exportBtn'
];
for (const id of requiredIds) assert(unique.has(id), `critical UI contract missing #${id}`);

assert(/accept="video\/\*,image\/\*"/.test(html), 'media picker no longer accepts image + video');
assert(/colorKeyRenderer/.test(app), 'color-key renderer wiring missing');
assert(/probeImageFile/.test(app), 'image import path missing');
assert(/data-mobile-tool="effects"/.test(html), 'mobile Effects tool missing');
assert(/\.inspector\[data-active-tool="effects"\]/.test(styles), 'mobile Effects visibility CSS missing');
assert(/\.inspector\[data-active-tool="creator"\]/.test(styles), 'mobile Creator visibility CSS missing');

console.log(JSON.stringify({
  bot: 'ui-contract-bot',
  status: 'PASS',
  domIds: ids.length,
  appDomReferences: new Set(dollarIds).size,
  staticButtons: staticButtonIds.length,
  genericDelegatedButtons: genericButtons
}, null, 2));
