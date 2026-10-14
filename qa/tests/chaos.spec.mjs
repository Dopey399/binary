import { test, expect } from '@playwright/test';
import { openApp, importSvg, selectTrack, setValue, saveProject, svg, assertClean } from './helpers.mjs';

function rng(seed = 0xC8C8) {
  let x = seed >>> 0;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 0x100000000;
  };
}

test('deterministic randomized editor actions do not corrupt state or throw', async ({ page }) => {
  const errors = await openApp(page);
  await importSvg(page, 'v1.svg', svg.blue);
  await selectTrack(page, 'V2');
  await importSvg(page, 'v2.svg', svg.alphaOverlay);
  await selectTrack(page, 'V3');
  await importSvg(page, 'v3.svg', svg.greenKey);

  const random = rng();
  const ranges = [
    ['#brightness', 70, 140], ['#contrast', 70, 145], ['#saturation', 60, 160],
    ['#layerOpacity', 20, 100], ['#layerScale', 25, 180], ['#layerX', 0, 100], ['#layerY', 0, 100],
    ['#effectIntensity', 0, 180], ['#effectSpeed', 25, 260], ['#effectBlend', 0, 100],
    ['#keyTolerance', 0, 55], ['#keySoftness', 0, 55], ['#textX', 0, 100], ['#textY', 0, 100]
  ];
  const safeButtons = ['#undoBtn', '#redoBtn', '#creatorMakeCoolBtn', '#creatorTryAnotherBtn', '#timelineZoomBtn'];

  for (let i = 0; i < 75; i += 1) {
    if (random() < 0.78) {
      const [selector, min, max] = ranges[Math.floor(random() * ranges.length)];
      const value = Math.round(min + random() * (max - min));
      await setValue(page, selector, value);
    } else {
      const selector = safeButtons[Math.floor(random() * safeButtons.length)];
      const locator = page.locator(selector);
      if (await locator.isVisible() && await locator.isEnabled()) await locator.click();
    }
    if (i % 10 === 0) await page.waitForTimeout(20);
  }

  await page.locator('#overlayText').fill('chaos survived');
  await page.locator('#overlayText').press('Tab');
  const project = await saveProject(page);
  expect(project.schemaVersion).toBe(3);
  expect(project.tracks.filter((t) => t.type === 'video')).toHaveLength(3);
  expect(project.assets).toHaveLength(3);
  expect(JSON.stringify(project)).toContain('chaos survived');
  assertClean(errors);
});
