import { test, expect } from '@playwright/test';
import { openApp, importSvg, selectTrack, sampleCanvas, setValue, saveProject, findClip, selectTimelineClip, svg, assertClean } from './helpers.mjs';

function near(pixel, expected, tolerance = 18) {
  return expected.every((value, i) => Math.abs(pixel[i] - value) <= tolerance);
}

test('native alpha overlay preserves lower layer', async ({ page }) => {
  const errors = await openApp(page);
  await importSvg(page, 'base.svg', svg.blue);
  await selectTrack(page, 'V2');
  await importSvg(page, 'alpha.svg', svg.alphaOverlay);
  await page.waitForTimeout(120);

  const transparentArea = await sampleCanvas(page, 90, 50);
  const redCenter = await sampleCanvas(page, 160, 90);
  expect(near(transparentArea, [0, 80, 255, 255])).toBe(true);
  expect(near(redCenter, [239, 35, 60, 255], 25)).toBe(true);
  assertClean(errors);
});

test('color key removes selected background and persists settings', async ({ page }) => {
  const errors = await openApp(page);
  await importSvg(page, 'base.svg', svg.blue);
  await selectTrack(page, 'V2');
  await importSvg(page, 'key.svg', svg.greenKey);
  await page.waitForTimeout(120);

  const before = await sampleCanvas(page, 90, 50);
  expect(before[1]).toBeGreaterThan(200);

  await page.locator('#keyEnabled').check();
  await setValue(page, '#keyColor', '#00ff00');
  await setValue(page, '#keyTolerance', 8);
  await setValue(page, '#keySoftness', 4);
  await page.waitForTimeout(120);

  const after = await sampleCanvas(page, 90, 50);
  const center = await sampleCanvas(page, 160, 90);
  expect(near(after, [0, 80, 255, 255], 25)).toBe(true);
  expect(near(center, [239, 35, 60, 255], 35)).toBe(true);

  const project = await saveProject(page);
  const found = findClip(project, 'key.svg');
  expect(found.track.id).toBe('video_2');
  expect(found.clip.effects.keyEnabled).toBe(true);
  expect(found.clip.effects.keyColor.toLowerCase()).toBe('#00ff00');
  expect(found.clip.effects.keyTolerance).toBe(8);
  expect(found.clip.effects.keySoftness).toBe(4);
  assertClean(errors);
});

test('background picker samples preview and enables key', async ({ page }) => {
  const errors = await openApp(page);
  await importSvg(page, 'picker.svg', svg.greenKey);
  await page.locator('#pickKeyColorBtn').click();
  const canvas = page.locator('#previewCanvas');
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  await canvas.click({ position: { x: box.width * 0.18, y: box.height * 0.18 } });
  await expect(page.locator('#keyEnabled')).toBeChecked();
  const color = await page.locator('#keyColor').inputValue();
  expect(color.toLowerCase()).toBe('#00ff00');
  assertClean(errors);
});

test('short layered WebM export downloads a non-empty file', async ({ page }) => {
  const errors = await openApp(page);
  await importSvg(page, 'base.svg', svg.blue);
  await selectTimelineClip(page, 'base.svg');
  await page.locator('#trimEnd').fill('0.350');
  await page.locator('#trimEnd').press('Tab');

  await selectTrack(page, 'V2');
  await importSvg(page, 'alpha.svg', svg.alphaOverlay);
  await page.locator('#trimEnd').fill('0.350');
  await page.locator('#trimEnd').press('Tab');

  const supported = await page.evaluate(() => Boolean(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream));
  test.skip(!supported, 'Chromium MediaRecorder/captureStream unavailable on this runner');

  const downloadPromise = page.waitForEvent('download', { timeout: 20_000 });
  await page.locator('#exportBtn').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/layered-export\.webm$/);
  const stream = await download.createReadStream();
  let bytes = 0;
  for await (const chunk of stream) bytes += chunk.length;
  expect(bytes).toBeGreaterThan(100);
  await expect(page.locator('#exportLabel')).toContainText(/complete/i);
  assertClean(errors);
});
