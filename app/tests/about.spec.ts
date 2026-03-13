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

async function openAbout(page: import('@playwright/test').Page) {
  await page.locator('.about-toggle').click();
  await page.locator('.about-panel').waitFor({ state: 'visible' });
}

// --- About Panel Open/Close ---

test.describe('About Section - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('About toggle button is visible', async ({ page }) => {
    await expect(page.locator('.about-toggle')).toBeVisible();
  });

  test('clicking About toggle opens the panel', async ({ page }) => {
    test.setTimeout(60000);
    await openAbout(page);
    await expect(page.locator('.about-panel')).toBeVisible();
  });

  test('About panel has tabs', async ({ page }) => {
    await openAbout(page);
    const tabs = page.locator('.about-tab');
    const count = await tabs.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('can switch between all tabs', async ({ page }) => {
    await openAbout(page);
    const tabs = page.locator('.about-tab');
    const count = await tabs.count();

    for (let i = 0; i < count; i++) {
      await tabs.nth(i).click();
      await page.waitForTimeout(200);
      await expect(tabs.nth(i)).toHaveClass(/active/);
    }
  });
});

// --- Taxonomy Map Tab ---

test.describe('About Section - Taxonomy Map Tab', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await openAbout(page);
    // "Taxonomy Map" is the first tab, should be active by default
  });

  test('Taxonomy Map tab shows detail cards', async ({ page }) => {
    const cards = page.locator('.about-detail-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Taxonomy Map tab mentions key taxonomies', async ({ page }) => {
    const panel = page.locator('.about-panel');
    const text = await panel.textContent();
    expect(text).toContain('Harmonized System');
    expect(text).toContain('CPC');
  });
});

// --- LCA Databases Tab ---

test.describe('About Section - LCA Databases Tab', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await openAbout(page);
    await page.locator('.about-tab:has-text("LCA Databases")').click();
    await page.waitForTimeout(300);
  });

  test('LCA tab shows the diagram', async ({ page }) => {
    const diagram = page.locator('.about-diagram');
    await expect(diagram).toBeVisible();
  });

  test('LCA diagram contains key database nodes', async ({ page }) => {
    const diagram = page.locator('.about-diagram');
    // Use .first() since "ecoinvent" appears in multiple text elements
    await expect(diagram.locator('text:has-text("ecoinvent")').first()).toBeVisible();
    await expect(diagram.locator('text:has-text("GaBi")').first()).toBeVisible();
  });

  test('LCA tab shows database detail cards', async ({ page }) => {
    const panel = page.locator('.about-panel');
    const text = await panel.textContent();
    expect(text).toContain('ecoinvent');
    expect(text).toContain('EPA');
    expect(text).toContain('BAFU');
    expect(text).toContain('GaBi');
  });

  test('LCA diagram container is scrollable', async ({ page }) => {
    const container = page.locator('.about-diagram-container');
    const overflowX = await container.evaluate(el => getComputedStyle(el).overflowX);
    expect(overflowX).toBe('auto');
  });
});

// --- Resolution Methods Tab ---

test.describe('About Section - Resolution Methods Tab', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await openAbout(page);
    await page.locator('.about-tab:has-text("Resolution Methods")').click();
    await page.waitForTimeout(300);
  });

  test('Resolution Methods tab has content', async ({ page }) => {
    const panel = page.locator('.about-panel .about-body');
    await expect(panel).toBeVisible();
    const text = await panel.textContent();
    expect(text!.length).toBeGreaterThan(100);
  });

  test('Methods tab discusses reachability or coverage', async ({ page }) => {
    const panel = page.locator('.about-panel');
    const text = await panel.textContent();
    const hasMethodContent = text!.toLowerCase().includes('reachability') ||
                             text!.toLowerCase().includes('coverage') ||
                             text!.toLowerCase().includes('concordance') ||
                             text!.toLowerCase().includes('resolution');
    expect(hasMethodContent).toBe(true);
  });
});

// --- Coverage Matrix Tab ---

test.describe('About Section - Coverage Matrix Tab', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await openAbout(page);
    await page.locator('.about-tab:has-text("Coverage Matrix")').click();
    await page.waitForTimeout(300);
  });

  test('Coverage Matrix tab shows content', async ({ page }) => {
    const panel = page.locator('.about-panel .about-body');
    await expect(panel).toBeVisible();
    const text = await panel.textContent();
    expect(text!.length).toBeGreaterThan(50);
  });

  test('Matrix includes taxonomy names', async ({ page }) => {
    const panel = page.locator('.about-panel');
    const text = await panel.textContent();
    expect(text).toContain('HS');
    expect(text).toContain('CPC');
  });
});

// --- Edge Cases Documentation ---

test.describe('About Section - Edge Cases', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await openAbout(page);
    await page.locator('.about-tab:has-text("Resolution Methods")').click();
    await page.waitForTimeout(300);
  });

  test('documents exact-match vs ancestor-aware databases', async ({ page }) => {
    const panel = page.locator('.about-panel');
    const text = await panel.textContent();

    const hasExactMatch = text!.toLowerCase().includes('exact') || text!.toLowerCase().includes('exact-match');
    const hasAncestor = text!.toLowerCase().includes('ancestor') || text!.toLowerCase().includes('ancestor-aware');
    expect(hasExactMatch || hasAncestor).toBe(true);
  });
});

// --- Concordance Browser Tab ---

test.describe('About Section - Concordance Browser Tab', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await openAbout(page);
    await page.locator('.about-tab:has-text("Concordance Browser")').click();
    await page.waitForTimeout(300);
  });

  test('Concordance Browser tab has content', async ({ page }) => {
    const panel = page.locator('.about-panel .about-body');
    await expect(panel).toBeVisible();
    const text = await panel.textContent();
    expect(text!.length).toBeGreaterThan(20);
  });
});
