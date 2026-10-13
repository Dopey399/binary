import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = process.env.CRE8TORCUT_ASSETS || path.resolve(here, '../../android-build/app/src/main/assets');
const require = createRequire(import.meta.url);
const Core = require(path.join(assets, 'editor-core.js'));

const checks = [];
function check(name, fn) {
  fn();
  checks.push(name);
}

check('new project has V1/V2/V3', () => {
  const p = Core.createProject('qa');
  assert.equal(p.schemaVersion, 3);
  assert.deepEqual(Core.getVideoTracks(p).map((t) => t.id), ['video_1', 'video_2', 'video_3']);
});

let p = Core.createProject('qa-model');
let a1;
check('add main asset/clip', () => {
  a1 = Core.addAsset(p, { name: 'main.webm', type: 'video/webm', duration: 6, width: 640, height: 360, size: 10, lastModified: 1 }, { trackId: 'video_1' });
  p = a1.project;
  assert.equal(Core.projectDuration(p), 6);
});

let a2;
check('add overlay with layer/transparency state', () => {
  a2 = Core.addAsset(p, { name: 'overlay.png', type: 'image/png', duration: 5, width: 320, height: 180, size: 11, lastModified: 2 }, {
    trackId: 'video_2',
    clip: {
      timelineStart: 1,
      effects: { keyEnabled: true, keyColor: '#00ff00', keyTolerance: 27, keySoftness: 19 },
      layer: { opacity: 82, scale: 64, x: 70, y: 35, blendMode: 'screen' },
      overlay: { text: 'QA', animation: 'fade-pop' }
    }
  });
  p = a2.project;
  const clip = Core.findClipLocation(p, a2.clipId).clip;
  assert.equal(clip.effects.keyEnabled, true);
  assert.equal(clip.effects.keyTolerance, 27);
  assert.equal(clip.layer.opacity, 82);
  assert.equal(clip.layer.blendMode, 'screen');
});

check('clip normalization clamps invalid edits', () => {
  p = Core.updateClip(p, a2.clipId, {
    effects: { keyTolerance: 999, keySoftness: -5 },
    layer: { opacity: 999, scale: 1, x: -2, y: 500, blendMode: 'not-real' }
  });
  const clip = Core.findClipLocation(p, a2.clipId).clip;
  assert.equal(clip.effects.keyTolerance, 100);
  assert.equal(clip.effects.keySoftness, 0);
  assert.equal(clip.layer.opacity, 100);
  assert.equal(clip.layer.scale, 10);
  assert.equal(clip.layer.x, 0);
  assert.equal(clip.layer.y, 100);
  assert.equal(clip.layer.blendMode, 'normal');
});

check('split produces two contiguous clips', () => {
  const result = Core.splitClip(p, a1.clipId, 2.5);
  p = result.project;
  const clips = Core.getVideoTrack(p, 'video_1').clips;
  assert.equal(clips.length, 2);
  assert.equal(Number(clips[0].sourceEnd.toFixed(3)), 2.5);
  assert.equal(Number(clips[1].sourceStart.toFixed(3)), 2.5);
});

check('move and cross-track operations preserve clip', () => {
  const main = Core.getVideoTrack(p, 'video_1');
  const secondId = main.clips[1].id;
  p = Core.moveClip(p, secondId, 0);
  assert.equal(Core.getVideoTrack(p, 'video_1').clips[0].id, secondId);
  p = Core.moveClipToTrack(p, secondId, 'video_3', 0.5);
  const found = Core.findClipLocation(p, secondId);
  assert.equal(found.trackId, 'video_3');
  assert.equal(found.clip.timelineStart, 0.5);
});

check('track state lock blocks clip mutation', () => {
  p = Core.setTrackState(p, 'video_2', { hidden: true, muted: true, locked: true });
  const track = Core.getVideoTrack(p, 'video_2');
  assert.equal(track.hidden, true);
  assert.equal(track.muted, true);
  assert.equal(track.locked, true);
  assert.throws(() => Core.updateClip(p, a2.clipId, { layer: { opacity: 50 } }), /locked/i);
  p = Core.setTrackState(p, 'video_2', { locked: false });
});

check('serialize/parse preserves layered transparency', () => {
  const q = Core.parseProject(Core.serializeProject(p));
  const clip = Core.findClipLocation(q, a2.clipId).clip;
  assert.equal(clip.effects.keyEnabled, true);
  assert.equal(clip.layer.opacity, 100);
  assert.equal(Core.getVideoTracks(q).length, 3);
  p = q;
});

check('history undo/redo is deterministic', () => {
  const history = new Core.ProjectHistory(p);
  const changed = Core.updateClip(history.current(), a2.clipId, { layer: { opacity: 42 } });
  history.replace(changed, true);
  assert.equal(Core.findClipLocation(history.current(), a2.clipId).clip.layer.opacity, 42);
  const undone = history.undo();
  assert.notEqual(Core.findClipLocation(undone, a2.clipId).clip.layer.opacity, 42);
  const redone = history.redo();
  assert.equal(Core.findClipLocation(redone, a2.clipId).clip.layer.opacity, 42);
});

check('legacy v2 project migrates into three tracks', () => {
  const legacy = {
    schemaVersion: 2,
    app: 'Cre8torCut',
    projectId: 'legacy',
    name: 'legacy',
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    assets: [{ id: 'a', name: 'old.mp4', type: 'video/mp4', duration: 2, width: 100, height: 100, size: 1, lastModified: 1 }],
    tracks: [{ id: 'old', type: 'video', name: 'Video', order: 0, role: 'main', clips: [{ id: 'c', assetId: 'a', name: 'old', sourceStart: 0, sourceEnd: 2, speed: 1, volume: 1, effects: {}, overlay: {}, layer: {} }] }]
  };
  const migrated = Core.validateProject(legacy);
  assert.equal(migrated.schemaVersion, 3);
  assert.equal(Core.getVideoTracks(migrated).length, 3);
  assert.equal(Core.getVideoTrack(migrated, 'video_1').clips.length, 1);
});

check('invalid app/project references fail closed', () => {
  assert.throws(() => Core.validateProject({ app: 'Other', schemaVersion: 3 }), /not a Cre8torCut/i);
  const broken = Core.createProject('broken');
  broken.tracks[0].clips.push({ id: 'missing', assetId: 'nope' });
  assert.throws(() => Core.validateProject(broken), /missing asset/i);
});

console.log(JSON.stringify({ bot: 'core-model-bot', status: 'PASS', checks: checks.length, names: checks }, null, 2));
