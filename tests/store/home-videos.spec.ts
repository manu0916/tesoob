import { test, expect } from '@playwright/test';

for (const width of [390, 1440]) {
  test(`vídeos da home iniciam sem clique e repetem (${width}px)`, async ({ page, baseURL }) => {
    if (!baseURL || !['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname))
      throw new Error('Run against a local preview.');
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('/');
    const videos = page.locator('video');
    await expect(videos).toHaveCount(2);
    for (const video of await videos.all()) {
      await expect(video).toHaveJSProperty('autoplay', true);
      await expect(video).toHaveJSProperty('muted', true);
      await expect(video).toHaveJSProperty('loop', true);
      await expect(video).toHaveJSProperty('playsInline', true);
      await expect(video).toHaveJSProperty('controls', true);
      await video.scrollIntoViewIfNeeded();
      await expect.poll(() => video.evaluate((el) => (el as HTMLVideoElement).currentTime)).toBeGreaterThan(0);
      // Seek close to the end and observe a real wraparound, without calling play().
      await video.evaluate((el) => {
        const media = el as HTMLVideoElement;
        media.currentTime = media.duration - 0.3;
      });
      await expect.poll(() => video.evaluate((el) => {
        const media = el as HTMLVideoElement;
        return !media.paused && media.currentTime < media.duration - 1;
      })).toBe(true);
    }
    // Scrolling away must no longer trigger the old permanent pause.
    await page.evaluate(() => window.scrollTo(0, 0));
    for (const video of await videos.all()) await expect(video).toHaveJSProperty('paused', false);
    // A visitor can still pause intentionally using the native controls.
    await videos.first().evaluate((el) => (el as HTMLVideoElement).pause());
    await expect(videos.first()).toHaveJSProperty('paused', true);
    await page.goto('/pecas/vermelho-amarracoes');
    await expect(page.locator('video')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Reproduzir:/ })).toBeVisible();
    expect(errors).toEqual([]);
  });
}
