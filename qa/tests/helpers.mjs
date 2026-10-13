import { expect } from '@playwright/test';

export const svg = {
  blue: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#0050ff"/></svg>`,
  red: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#cf2338"/></svg>`,
  greenKey: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#00ff00"/><rect x="120" y="60" width="80" height="60" fill="#ef233c"/></svg>`,
  alphaOverlay: `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect x="120" y="60" width="80" height="60" fill="#ef233c"/></svg>`
};

export async function openApp(page, viewport = { width: 1440, height: 900 }) {
  await page.setViewportSize(viewport);
  const errors = [];
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('dialog', async (dialog) => {
    errors.push(`dialog: ${dialog.type()} ${dialog.message()}`);
    await dialog.dismiss();
  });
  await page.goto('/index.html');
  await page.waitForFunction(() => Boolean(window.Cre8torCore));
  await expect(page.locator('#previewCanvas')).toBeVisible();
  return errors;
}

export async function importSvg(page, name, contents) {
  await page.locator('#videoInput').setInputFiles({
    name,
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(contents)
  });
  await expect(page.locator('#mediaCount')).toContainText(/asset/);
  await expect(page.locator('#selectedClipLabel')).not.toHaveText('No clip selected');
}

export async function importSvgFiles(page, files) {
  await page.locator('#videoInput').setInputFiles(files.map(([name, contents]) => ({
    name,
    mimeType: 'image/svg+xml',
    buffer: Buffer.from(contents)
  })));
  await expect(page.locator('#selectedClipLabel')).not.toHaveText('No clip selected');
}

export async function setValue(page, selector, value, event = 'input') {
  await page.locator(selector).evaluate((el, payload) => {
    el.value = String(payload.value);
    el.dispatchEvent(new Event(payload.event, { bubbles: true }));
    if (payload.event !== 'change') el.dispatchEvent(new Event('change', { bubbles: true }));
  }, { value, event });
}

export async function saveProject(page) {
  const downloadPromise = page.waitForEvent('download');
  await page.locator('#saveProjectBtn').evaluate((el) => el.click());
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  let text = '';
  for await (const chunk of stream) text += chunk.toString('utf8');
  return JSON.parse(text);
}

export function findClip(project, name) {
  for (const track of project.tracks || []) {
    const clip = (track.clips || []).find((item) => item.name === name || item.name.startsWith(name));
    if (clip) return { track, clip };
  }
  return null;
}

export async function selectTrack(page, label) {
  const button = page.locator('.track-select').filter({ hasText: label }).first();
  await expect(button).toBeVisible();
  await button.click();
}

export async function sampleCanvas(page, x, y) {
  return page.locator('#previewCanvas').evaluate((canvas, point) => {
    const ctx = canvas.getContext('2d');
    return [...ctx.getImageData(point.x, point.y, 1, 1).data];
  }, { x, y });
}

export function assertClean(errors) {
  expect(errors, errors.join('\n')).toEqual([]);
}

export async function selectTimelineClip(page, name) {
  const clip = page.locator('.timeline-clip').filter({ hasText: name }).first();
  await expect(clip).toBeVisible();
  await clip.click({ position: { x: 8, y: 8 } });
}
