import { test, expect } from '@playwright/test';
import { openApp, importSvg, importSvgFiles, setValue, saveProject, findClip, selectTimelineClip, svg, assertClean } from './helpers.mjs';

test('desktop edit controls persist, layer move undo/redo works', async ({ page }) => {
  const errors = await openApp(page);
  await importSvg(page, 'base.svg', svg.blue);

  await page.locator('#projectName').fill('QA Desktop');
  await page.locator('#projectName').press('Tab');
  await setValue(page, '#brightness', 117);
  await setValue(page, '#contrast', 111);
  await setValue(page, '#saturation', 123);
  await setValue(page, '#layerOpacity', 76);
  await setValue(page, '#layerScale', 88);
  await setValue(page, '#layerX', 44);
  await setValue(page, '#layerY', 56);

  await page.locator('#overlayText').fill('QA title');
  await page.locator('#overlayText').press('Tab');
  await page.locator('#textStyleBtn').click();
  await page.locator('[data-style="chrome"]').first().click();
  await page.locator('#textAnimationBtn').click();
  await page.locator('[data-animation="fade-pop"]').first().click();
  await page.locator('#effectBtn').click();
  await page.locator('[data-effect="digital-glitch"]').first().click();

  await page.locator('#keyEnabled').check();
  await setValue(page, '#keyColor', '#00ff00');
  await setValue(page, '#keyTolerance', 23);
  await setValue(page, '#keySoftness', 9);

  await expect(page.locator('#layerUpBtn')).toBeEnabled();
  await page.locator('#layerUpBtn').click();
  await expect(page.locator('#selectedClipLabel')).toContainText('V2');
  await page.locator('#undoBtn').click();
  await expect(page.locator('#selectedClipLabel')).toContainText('V1');
  await page.locator('#redoBtn').click();
  await expect(page.locator('#selectedClipLabel')).toContainText('V2');

  const project = await saveProject(page);
  const found = findClip(project, 'base.svg');
  expect(project.name).toBe('QA Desktop');
  expect(found.track.id).toBe('video_2');
  expect(found.clip.effects.keyEnabled).toBe(true);
  expect(found.clip.effects.keyTolerance).toBe(23);
  expect(found.clip.effects.preset).toBe('digital-glitch');
  expect(found.clip.layer.opacity).toBe(76);
  expect(found.clip.layer.scale).toBe(88);
  expect(found.clip.overlay.text).toBe('QA title');
  expect(found.clip.overlay.style).toBe('chrome');
  expect(found.clip.overlay.animation).toBe('fade-pop');
  assertClean(errors);
});

test('transport, clip navigation, reorder, split and delete remain functional', async ({ page }) => {
  const errors = await openApp(page);
  await importSvgFiles(page, [['one.svg', svg.blue], ['two.svg', svg.red]]);
  await expect(page.locator('#previousClipBtn')).toBeEnabled();
  await expect(page.locator('#nextClipBtn')).toBeEnabled();

  await page.locator('#previousClipBtn').click();
  await expect(page.locator('#selectedClipLabel')).toContainText('one.svg');
  await page.locator('#nextClipBtn').click();
  await expect(page.locator('#selectedClipLabel')).toContainText('two.svg');

  await expect(page.locator('#moveLeftBtn')).toBeEnabled();
  await page.locator('#moveLeftBtn').click();
  await expect(page.locator('#moveRightBtn')).toBeEnabled();
  await page.locator('#moveRightBtn').click();

  // Select through transport. v0.9.1 intentionally lets a timeline clip tap select
  // without also moving the playhead, so split positioning is tested separately.
  await page.locator('#previousClipBtn').click();
  await expect(page.locator('#selectedClipLabel')).toContainText('one.svg');
  await setValue(page, '#scrubber', 2.0);
  await page.locator('#splitBtn').click();
  let project = await saveProject(page);
  expect(project.tracks.find((t) => t.id === 'video_1').clips.length).toBe(3);

  await page.locator('#deleteClipBtn').click();
  project = await saveProject(page);
  expect(project.tracks.find((t) => t.id === 'video_1').clips.length).toBe(2);

  await page.locator('#playBtn').click();
  await page.waitForTimeout(250);
  await expect(page.locator('#currentTime')).not.toHaveText('00:00.000');
  await page.locator('#playBtn').click();
  assertClean(errors);
});

test('Creator Mode changes the selected clip without crashing', async ({ page }) => {
  const errors = await openApp(page);
  await importSvg(page, 'creator.svg', svg.blue);
  await page.locator('#creatorModeBtn').click();
  await page.locator('#creatorMakeCoolBtn').click();
  await expect(page.locator('#creatorRecipeName')).not.toHaveText('No recipe selected');
  await page.locator('#creatorTryAnotherBtn').click();
  await page.locator('#beforeAfterBtn').dispatchEvent('pointerdown');
  await page.locator('#beforeAfterBtn').dispatchEvent('pointerup');
  const project = await saveProject(page);
  expect(findClip(project, 'creator.svg')).toBeTruthy();
  assertClean(errors);
});
