import { test, expect } from '@playwright/test';
import { openApp, importSvg, importSvgFiles, setValue, svg, assertClean } from './helpers.mjs';

const simple = [
  'creatorModeBtn', 'creatorMakeCoolBtn', 'creatorTryAnotherBtn', 'creatorAdvancedBtn',
  'beforeAfterBtn', 'textStyleBtn', 'textAnimationBtn', 'previewTextAnimationBtn',
  'effectBtn', 'previewEffectBtn', 'resetBtn', 'timelineZoomBtn'
];

for (const id of simple) {
  test(`button smoke: #${id}`, async ({ page }) => {
    const errors = await openApp(page);
    await importSvg(page, `${id}.svg`, svg.blue);
    const button = page.locator(`#${id}`);
    if (id === 'creatorAdvancedBtn') {
      await page.locator('#creatorMakeCoolBtn').click();
    }
    if (id === 'previewEffectBtn') {
      await page.locator('#effectBtn').click();
      await page.locator('[data-effect="digital-glitch"]').first().click();
    }
    await expect(button).toBeEnabled();
    if (id === 'beforeAfterBtn') {
      await button.dispatchEvent('pointerdown');
      await button.dispatchEvent('pointerup');
    } else {
      await button.click();
    }
    await expect(page.locator('#previewCanvas')).toBeVisible();
    assertClean(errors);
  });
}

test('button smoke: undo/redo', async ({ page }) => {
  const errors = await openApp(page);
  await importSvg(page, 'undo.svg', svg.blue);
  await setValue(page, '#brightness', 130);
  await expect(page.locator('#undoBtn')).toBeEnabled();
  await page.locator('#undoBtn').click();
  await expect(page.locator('#redoBtn')).toBeEnabled();
  await page.locator('#redoBtn').click();
  assertClean(errors);
});

test('button smoke: previous/next, move left/right', async ({ page }) => {
  const errors = await openApp(page);
  await importSvgFiles(page, [['one.svg', svg.blue], ['two.svg', svg.red]]);
  for (const id of ['previousClipBtn', 'nextClipBtn', 'moveLeftBtn', 'moveRightBtn']) {
    const button = page.locator(`#${id}`);
    if (await button.isEnabled()) await button.click();
  }
  assertClean(errors);
});

test('button smoke: split/delete', async ({ page }) => {
  const errors = await openApp(page);
  await importSvg(page, 'cut.svg', svg.blue);
  await setValue(page, '#scrubber', 2.0);
  await page.locator('#splitBtn').click();
  await page.locator('#deleteClipBtn').click();
  await expect(page.locator('#previewCanvas')).toBeVisible();
  assertClean(errors);
});

test('button smoke: layer up/down', async ({ page }) => {
  const errors = await openApp(page);
  await importSvg(page, 'layer.svg', svg.blue);
  await page.locator('#layerUpBtn').click();
  await expect(page.locator('#layerDownBtn')).toBeEnabled();
  await page.locator('#layerDownBtn').click();
  assertClean(errors);
});

test('button smoke: key picker', async ({ page }) => {
  const errors = await openApp(page);
  await importSvg(page, 'key.svg', svg.greenKey);
  await page.locator('#pickKeyColorBtn').click();
  const canvas = page.locator('#previewCanvas');
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box.width * 0.15, y: box.height * 0.15 } });
  await expect(page.locator('#keyEnabled')).toBeChecked();
  assertClean(errors);
});

test('button smoke: sphere picker', async ({ page }) => {
  const errors = await openApp(page);
  await importSvg(page, 'sphere.svg', svg.blue);
  await page.locator('#effectBtn').click();
  await page.locator('[data-effect="sphere-glow"]').first().click();
  await expect(page.locator('#pickSphereBtn')).toBeEnabled();
  await page.locator('#pickSphereBtn').click();
  const canvas = page.locator('#previewCanvas');
  const box = await canvas.boundingBox();
  await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
  assertClean(errors);
});

test('button smoke: set in/out are callable after active media selection', async ({ page }) => {
  const errors = await openApp(page);
  await importSvg(page, 'trim.svg', svg.blue);
  await page.locator('#setInBtn').click();
  await page.locator('#setOutBtn').click();
  assertClean(errors);
});
