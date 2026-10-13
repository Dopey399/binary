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
