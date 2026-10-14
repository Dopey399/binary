import { test, expect } from '@playwright/test';
import { openApp, importSvg, setValue, saveProject, svg, assertClean } from './helpers.mjs';

test('mobile dock opens every tool/sheet and closes cleanly', async ({ page }) => {
  const errors = await openApp(page, { width: 390, height: 844 });
  await importSvg(page, 'mobile.svg', svg.blue);

  const cases = [
    ['[data-mobile-sheet="media"]', '.media-panel', null],
    ['[data-mobile-tool="creator"]', '.inspector', 'creator'],
    ['[data-mobile-tool="trim"]', '.inspector', 'trim'],
    ['[data-mobile-tool="effects"]', '.inspector', 'effects'],
    ['[data-mobile-tool="audio"]', '.inspector', 'audio'],
    ['[data-mobile-tool="text"]', '.inspector', 'text'],
    ['[data-mobile-tool="adjust"]', '.inspector', 'adjust'],
    ['[data-mobile-sheet="project"]', '#projectStrip', null]
  ];

  for (const [button, panel, tool] of cases) {
    await page.locator(`#mobileDock ${button}`).click();
    await expect(page.locator(panel)).toHaveClass(/mobile-open/);
    if (tool) await expect(page.locator('.inspector')).toHaveAttribute('data-active-tool', tool);
    const close = page.locator(`${panel} [data-close-mobile-sheet]`).first();
    if (await close.count()) await close.click();
    else await page.locator(`#mobileDock ${button}`).click();
  }

  await page.locator('#mobileMoreBtn').click();
  await expect(page.locator('#projectStrip')).toHaveClass(/mobile-open/);
  await page.locator('#projectStrip [data-close-mobile-sheet]').click();

  const before = await page.locator('#timelineZoomLabel').textContent();
  await page.locator('#timelineZoomBtn').click();
  await expect(page.locator('#timelineZoomLabel')).not.toHaveText(before || '');

  await page.locator('#fullscreenBtn').click();
  await page.waitForTimeout(100);
  assertClean(errors);
});

test('mobile split/delete shortcuts drive the same editor actions', async ({ page }) => {
  const errors = await openApp(page, { width: 390, height: 844 });
  await importSvg(page, 'mobile-edit.svg', svg.red);
  await setValue(page, '#scrubber', 2.2);
  await page.locator('#mobileDock [data-mobile-tool="trim"]').click();
  await page.locator('#mobileSplitToolBtn').click();
  let project = await saveProject(page);
  expect(project.tracks[0].clips.length).toBe(2);

  await page.locator('#mobileDeleteToolBtn').click();
  project = await saveProject(page);
  expect(project.tracks[0].clips.length).toBe(1);
  assertClean(errors);
});

test('mobile crop box edits framing independently, whole-image mode stays separate, and timeline drag scrubs', async ({ page }) => {
  const errors = await openApp(page, { width: 390, height: 844 });
  await importSvg(page, 'touch-qa.svg', svg.blue);

  const transformBox = page.locator('#previewTransformBox');
  const moveHandle = page.locator('.preview-move-handle');
  const modeHandle = page.locator('#previewModeHandle');
  await expect(transformBox).toBeVisible();
  await expect(transformBox).toHaveClass(/crop-mode/);
  await expect(modeHandle).toHaveText('Whole');

  let project = await saveProject(page);
  const initialLayer = project.tracks[0].clips[0].layer;
  expect(initialLayer.cropWidth).toBe(100);
  expect(initialLayer.cropHeight).toBe(100);
  const initialScale = initialLayer.scale;
  const initialX = initialLayer.x;
  const initialY = initialLayer.y;

  const beforeCrop = await transformBox.boundingBox();
  const resize = page.locator('.preview-transform-handle.se');
  const resizeBox = await resize.boundingBox();
  expect(beforeCrop).toBeTruthy();
  expect(resizeBox).toBeTruthy();
  await page.mouse.move(resizeBox.x + resizeBox.width / 2, resizeBox.y + resizeBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(resizeBox.x + resizeBox.width / 2 - 42, resizeBox.y + resizeBox.height / 2 - 34, { steps: 5 });
  await page.mouse.up();

  const afterCrop = await transformBox.boundingBox();
  expect(afterCrop.width).toBeLessThan(beforeCrop.width - 8);
  expect(afterCrop.height).toBeLessThan(beforeCrop.height - 8);
  project = await saveProject(page);
  let layer = project.tracks[0].clips[0].layer;
  expect(layer.cropWidth).toBeLessThan(100);
  expect(layer.cropHeight).toBeLessThan(100);
  expect(layer.scale).toBe(initialScale);
  expect(layer.x).toBe(initialX);
  expect(layer.y).toBe(initialY);

  const beforeMove = await transformBox.boundingBox();
  const moveBox = await moveHandle.boundingBox();
  expect(moveBox).toBeTruthy();
  await page.mouse.move(moveBox.x + moveBox.width / 2, moveBox.y + moveBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(moveBox.x + moveBox.width / 2 + 22, moveBox.y + moveBox.height / 2 + 12, { steps: 4 });
  await page.mouse.up();
  const afterMove = await transformBox.boundingBox();
  expect(afterMove.x - beforeMove.x).toBeGreaterThan(5);
  project = await saveProject(page);
  layer = project.tracks[0].clips[0].layer;
  expect(layer.cropX + layer.cropY).toBeGreaterThan(0);
  expect(layer.scale).toBe(initialScale);
  expect(layer.x).toBe(initialX);
  expect(layer.y).toBe(initialY);

  await modeHandle.click();
  await expect(transformBox).toHaveClass(/layer-mode/);
  await expect(modeHandle).toHaveText('Crop');
  const wholeMove = await moveHandle.boundingBox();
  await page.mouse.move(wholeMove.x + wholeMove.width / 2, wholeMove.y + wholeMove.height / 2);
  await page.mouse.down();
  await page.mouse.move(wholeMove.x + wholeMove.width / 2 + 18, wholeMove.y + wholeMove.height / 2, { steps: 4 });
  await page.mouse.up();
  project = await saveProject(page);
  layer = project.tracks[0].clips[0].layer;
  expect(layer.x).toBeGreaterThan(initialX);

  const touchAction = await page.locator('#timeline').evaluate((el) => getComputedStyle(el).touchAction);
  expect(touchAction).toBe('none');

  const clip = page.locator('.timeline-clip').first();
  const clipBox = await clip.boundingBox();
  expect(clipBox).toBeTruthy();
  const scrubBefore = Number(await page.locator('#scrubber').inputValue());
  await clip.dispatchEvent('click');
  expect(Number(await page.locator('#scrubber').inputValue())).toBeCloseTo(scrubBefore, 3);
  const scrollBefore = await page.locator('#timeline').evaluate((el) => el.scrollLeft);
  await page.mouse.move(clipBox.x + 12, clipBox.y + clipBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(clipBox.x + Math.min(90, clipBox.width - 6), clipBox.y + clipBox.height / 2, { steps: 5 });
  const scrubDuring = Number(await page.locator('#scrubber').inputValue());
  const scrollDuring = await page.locator('#timeline').evaluate((el) => el.scrollLeft);
  await page.mouse.up();
  expect(Math.abs(scrubDuring - scrubBefore)).toBeGreaterThan(.05);
  expect(scrollDuring).toBe(scrollBefore);

  assertClean(errors);
});
