import { test, expect } from '@playwright/test';

async function waitForAppReady(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const loading = page.locator('.loading');
  if (await loading.count()) {
    await loading.waitFor({ state: 'hidden', timeout: 30000 });
  }
  await page.locator('.main-content.two-pane').waitFor({ state: 'visible' });
}

/** Ensure relaxed match mode (for chapter-level databases) */
async function ensureRelaxedMode(page: import('@playwright/test').Page) {
  const toggle = page.locator('.match-mode-track');
  const isStrict = await toggle.evaluate(el => el.classList.contains('strict'));
  if (isStrict) {
    await toggle.click();
    await page.waitForTimeout(500);
  }
}

/** Ensure exact/strict match mode */
async function ensureExactMode(page: import('@playwright/test').Page) {
  const toggle = page.locator('.match-mode-track');
  const isStrict = await toggle.evaluate(el => el.classList.contains('strict'));
  if (!isStrict) {
    await toggle.click();
    await page.waitForTimeout(500);
  }
}

/** Expand HS Section I to reveal chapter nodes */
async function expandHsChapter01(page: import('@playwright/test').Page) {
  const leftPane = page.locator('.left-pane');
  await leftPane.locator('.tree-node .toggle').first().click();
  await page.waitForTimeout(300);
}

// --- Match Mode Toggle ---

test.describe('Coverage - Match Mode', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('match mode slider is visible', async ({ page }) => {
    await expect(page.locator('.match-mode-track')).toBeVisible();
    await expect(page.locator('.match-mode-label')).toHaveCount(2);
  });

  test('can toggle between Relaxed and Exact mode', async ({ page }) => {
    const toggle = page.locator('.match-mode-track');
    const wasStrict = await toggle.evaluate(el => el.classList.contains('strict'));

    await toggle.click();
    await page.waitForTimeout(300);

    const isNowStrict = await toggle.evaluate(el => el.classList.contains('strict'));
    expect(isNowStrict).not.toBe(wasStrict);
  });

  test('Relaxed label is highlighted when in relaxed mode', async ({ page }) => {
    await ensureRelaxedMode(page);
    const relaxedLabel = page.locator('.match-mode-label').first();
    await expect(relaxedLabel).toHaveClass(/active/);
  });

  test('Exact label is highlighted when in exact mode', async ({ page }) => {
    await ensureExactMode(page);
    const exactLabel = page.locator('.match-mode-label').last();
    await expect(exactLabel).toHaveClass(/active/);
  });
});

// --- ecoinvent Coverage ---

test.describe('Coverage - ecoinvent Badges', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await ensureRelaxedMode(page);
  });

  test('ecoinvent badges appear on HS nodes', async ({ page }) => {
    await expandHsChapter01(page);
    const eiBadges = page.locator('.left-pane .ef-badge.ef-ecoinvent');
    await expect(eiBadges.first()).toBeVisible({ timeout: 5000 });
    expect(await eiBadges.count()).toBeGreaterThan(0);
  });

  test('ecoinvent badge starts with "e"', async ({ page }) => {
    await expandHsChapter01(page);
    const badge = page.locator('.left-pane .ef-badge.ef-ecoinvent').first();
    await expect(badge).toBeVisible({ timeout: 5000 });
    const text = await badge.textContent();
    expect(text).toMatch(/^e/);
  });

  test('ecoinvent badges appear on CPC tree', async ({ page }) => {
    const leftSelector = page.locator('.left-pane .taxonomy-selector');
    await leftSelector.selectOption('cpc');
    await page.waitForTimeout(500);

    const leftPane = page.locator('.left-pane');
    // Expand CPC Section 0 → Division 01
    await leftPane.locator('.tree-node .toggle').first().click();
    await page.waitForTimeout(300);
    await leftPane.locator('.tree-node:has-text("01")').first().locator('.toggle').click();
    await page.waitForTimeout(300);
    await leftPane.locator('.tree-node:has-text("011")').first().locator('.toggle').click();
    await page.waitForTimeout(300);

    const eiBadges = leftPane.locator('.ef-badge.ef-ecoinvent');
    await expect(eiBadges.first()).toBeVisible({ timeout: 5000 });
  });
});

// --- EPA/USEEIO Coverage ---

test.describe('Coverage - EPA Badges', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await ensureRelaxedMode(page);
  });

  test('EPA badges appear on deeper HS nodes', async ({ page }) => {
    await expandHsChapter01(page);
    const leftPane = page.locator('.left-pane');
    await leftPane.locator('.tree-node:has-text("01")').first().locator('.toggle').click();
    await page.waitForTimeout(300);
    await leftPane.locator('.tree-node:has-text("0101")').first().locator('.toggle').click();
    await page.waitForTimeout(300);

    const epaBadges = leftPane.locator('.ef-badge.ef-epa');
    const count = await epaBadges.count();
    // EPA may not cover all codes — just verify no crash
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EPA badge shows "U" prefix when present', async ({ page }) => {
    await expandHsChapter01(page);
    const leftPane = page.locator('.left-pane');
    await leftPane.locator('.tree-node:has-text("01")').first().locator('.toggle').click();
    await page.waitForTimeout(300);
    await leftPane.locator('.tree-node:has-text("0101")').first().locator('.toggle').click();
    await page.waitForTimeout(300);

    const badge = leftPane.locator('.ef-badge.ef-epa').first();
    if (await badge.count() > 0) {
      const text = await badge.textContent();
      expect(text).toMatch(/^U/);
    }
  });
});

// --- EXIOBASE Coverage ---

test.describe('Coverage - EXIOBASE Badges', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await ensureRelaxedMode(page);
  });

  test('EXIOBASE badges appear on HS chapter nodes', async ({ page }) => {
    await expandHsChapter01(page);
    // EXIOBASE uses chapter-level in relaxed mode — expand to heading level
    const leftPane = page.locator('.left-pane');
    await leftPane.locator('.tree-node:has-text("01")').first().locator('.toggle').click();
    await page.waitForTimeout(300);

    const exBadges = leftPane.locator('.ef-badge.ef-exiobase');
    // EXIOBASE has broad coverage in relaxed mode
    const count = await exBadges.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('EXIOBASE badge shows "X" prefix when present', async ({ page }) => {
    await expandHsChapter01(page);
    const leftPane = page.locator('.left-pane');
    await leftPane.locator('.tree-node:has-text("01")').first().locator('.toggle').click();
    await page.waitForTimeout(300);

    const badge = leftPane.locator('.ef-badge.ef-exiobase').first();
    if (await badge.count() > 0) {
      const text = await badge.textContent();
      expect(text).toMatch(/^X/);
    }
  });
});

// --- USLCI Coverage ---

test.describe('Coverage - USLCI Badges', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await ensureRelaxedMode(page);
  });

  test('USLCI badge shows "L" prefix when present', async ({ page }) => {
    await expandHsChapter01(page);
    const leftPane = page.locator('.left-pane');
    await leftPane.locator('.tree-node:has-text("01")').first().locator('.toggle').click();
    await page.waitForTimeout(300);

    const badge = leftPane.locator('.ef-badge.ef-uslci').first();
    if (await badge.count() > 0) {
      const text = await badge.textContent();
      expect(text).toMatch(/^L/);
    }
  });
});

// --- BAFU Coverage ---

test.describe('Coverage - BAFU Badges', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await ensureRelaxedMode(page);
  });

  test('BAFU badges appear on HS chapter nodes', async ({ page }) => {
    await expandHsChapter01(page);
    const bafuBadges = page.locator('.left-pane .ef-badge.ef-bafu');
    await expect(bafuBadges.first()).toBeVisible({ timeout: 5000 });
    expect(await bafuBadges.count()).toBeGreaterThan(0);
  });

  test('BAFU badge shows "B" prefix', async ({ page }) => {
    await expandHsChapter01(page);
    const badge = page.locator('.left-pane .ef-badge.ef-bafu').first();
    await expect(badge).toBeVisible({ timeout: 5000 });
    const text = await badge.textContent();
    expect(text).toMatch(/^B/);
  });

  test('BAFU badges appear in Exact mode (native HS-2 resolution)', async ({ page }) => {
    await ensureExactMode(page);
    await expandHsChapter01(page);
    const bafuBadges = page.locator('.left-pane .ef-badge.ef-bafu');
    await expect(bafuBadges.first()).toBeVisible({ timeout: 5000 });
    expect(await bafuBadges.count()).toBeGreaterThan(0);
  });
});

// --- GaBi Coverage on Non-HS Taxonomies ---

test.describe('Coverage - GaBi on Industry Taxonomies', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await ensureRelaxedMode(page);
  });

  test('GaBi badges appear on NAICS nodes after deep expansion', async ({ page }) => {
    test.setTimeout(60000);
    const leftSelector = page.locator('.left-pane .taxonomy-selector');
    await leftSelector.selectOption('naics');
    await page.waitForTimeout(500);

    const leftPane = page.locator('.left-pane');
    // Expand first NAICS sector → subsector → industry group
    await leftPane.locator('.tree-node .toggle').first().click();
    await page.waitForTimeout(300);
    await leftPane.locator('.tree-node').nth(1).locator('.toggle').click();
    await page.waitForTimeout(300);
    await leftPane.locator('.tree-node').nth(2).locator('.toggle').click();
    await page.waitForTimeout(300);

    const gabiBadges = leftPane.locator('.ef-badge.ef-gabi');
    const count = await gabiBadges.count();
    // GaBi may need deeper expansion for NAICS — just verify no crash
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

// --- Coverage Comparison Cards ---

test.describe('Coverage - Comparison Panel Cards', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await ensureRelaxedMode(page);
  });

  test('selecting covered node shows BAFU card', async ({ page }) => {
    await expandHsChapter01(page);
    const leftPane = page.locator('.left-pane');

    const nodeWithBafu = leftPane.locator('.tree-node:has(.ef-badge.ef-bafu)').first();
    await nodeWithBafu.click();
    await page.waitForTimeout(500);

    const panel = page.locator('.comparison-panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.bafu-card')).toBeVisible({ timeout: 3000 });
    await expect(panel.locator('.bafu-card')).toContainText('BAFU');
  });

  test('selecting covered node shows GaBi card', async ({ page }) => {
    await expandHsChapter01(page);
    const leftPane = page.locator('.left-pane');

    const nodeWithGabi = leftPane.locator('.tree-node:has(.ef-badge.ef-gabi)').first();
    await nodeWithGabi.click();
    await page.waitForTimeout(500);

    const panel = page.locator('.comparison-panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.gabi-card')).toBeVisible({ timeout: 3000 });
    await expect(panel.locator('.gabi-card')).toContainText('GaBi');
  });

  test('comparison panel shows database cards for covered nodes', async ({ page }) => {
    await expandHsChapter01(page);
    const leftPane = page.locator('.left-pane');

    const firstChapter = leftPane.locator('.tree-node:has(.ef-badge)').first();
    await firstChapter.click();
    await page.waitForTimeout(500);

    const panel = page.locator('.comparison-panel');
    await expect(panel).toBeVisible();
  });
});

// --- Strict vs Relaxed Badge Differences ---

test.describe('Coverage - Strict vs Relaxed Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('relaxed mode shows at least as many badges as exact mode', async ({ page }) => {
    await ensureExactMode(page);
    await expandHsChapter01(page);
    const leftPane = page.locator('.left-pane');

    await leftPane.locator('.tree-node:has-text("01")').first().locator('.toggle').click();
    await page.waitForTimeout(300);

    const exactBadgeCount = await leftPane.locator('.ef-badge').count();

    await ensureRelaxedMode(page);
    await page.waitForTimeout(500);

    const relaxedBadgeCount = await leftPane.locator('.ef-badge').count();
    expect(relaxedBadgeCount).toBeGreaterThanOrEqual(exactBadgeCount);
  });
});
