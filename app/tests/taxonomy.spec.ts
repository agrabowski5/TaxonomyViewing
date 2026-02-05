import { test, expect } from '@playwright/test';

const BASE_URL = '/';

async function waitForAppReady(page: import('@playwright/test').Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');

  const loading = page.locator('.loading');
  if (await loading.count()) {
    await loading.waitFor({ state: 'hidden', timeout: 30000 });
  }

  await page.locator('.main-content.two-pane').waitFor({ state: 'visible' });
}

test.describe('Taxonomy Explorer - Two Pane Interface', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('page loads successfully with correct title', async ({ page }) => {
    await expect(page).toHaveTitle(/Taxonomy/i);
    await expect(page.locator('h1')).toContainText('Taxonomy Explorer');
  });

  test('both panes are visible with correct structure', async ({ page }) => {
    await expect(page.locator('.main-content.two-pane')).toBeVisible();
    await expect(page.locator('.pane-wrapper.left-pane')).toBeVisible();
    await expect(page.locator('.pane-wrapper.right-pane')).toBeVisible();
  });

  test('left pane displays HS taxonomy by default', async ({ page }) => {
    const leftSelector = page.locator('.left-pane .taxonomy-selector');
    await expect(leftSelector).toBeVisible();
    await expect(leftSelector).toHaveValue('hs');
  });

  test('right pane displays CPC taxonomy by default', async ({ page }) => {
    const rightSelector = page.locator('.right-pane .taxonomy-selector');
    await expect(rightSelector).toBeVisible();
    await expect(rightSelector).toHaveValue('cpc');
  });

  test('can switch taxonomy in left pane', async ({ page }) => {
    const leftSelector = page.locator('.left-pane .taxonomy-selector');
    await leftSelector.selectOption('cn');
    await expect(leftSelector).toHaveValue('cn');
    await page.waitForTimeout(500);
    const paneInfo = page.locator('.left-pane .pane-info .full-name');
    await expect(paneInfo).toContainText(/Combined Nomenclature/i);
  });

  test('can switch taxonomy in right pane', async ({ page }) => {
    const rightSelector = page.locator('.right-pane .taxonomy-selector');
    await rightSelector.selectOption('hts');
    await expect(rightSelector).toHaveValue('hts');
    await page.waitForTimeout(500);
    const paneInfo = page.locator('.right-pane .pane-info .full-name');
    await expect(paneInfo).toContainText(/Harmonized Tariff Schedule/i);
  });

  test('search bar is functional', async ({ page }) => {
    const searchInput = page.locator('.search-bar input');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('agriculture');
    await expect(searchInput).toHaveValue('agriculture');
    const clearBtn = page.locator('.search-bar .clear-btn');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');
  });

  test('all 5 taxonomy options are available', async ({ page }) => {
    const leftSelector = page.locator('.left-pane .taxonomy-selector');
    const options = await leftSelector.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('HS'))).toBe(true);
    expect(options.some(opt => opt.includes('CPC'))).toBe(true);
    expect(options.some(opt => opt.includes('CN'))).toBe(true);
    expect(options.some(opt => opt.includes('HTS'))).toBe(true);
    expect(options.some(opt => opt.includes('Canadian'))).toBe(true);
  });

  test('comparison panel appears when node is selected', async ({ page }) => {
    // Expand first section, then click a chapter
    const firstToggle = page.locator('.left-pane .tree-node .toggle').first();
    await firstToggle.click();
    await page.waitForTimeout(300);

    // Click the first child node
    const childNode = page.locator('.left-pane .tree-node').nth(1);
    await childNode.click();

    const comparisonPanel = page.locator('.comparison-panel');
    await expect(comparisonPanel).toBeVisible();
  });
});

test.describe('Cross-pane sync', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('selecting HS node syncs to CPC pane via concordance', async ({ page }) => {
    // Default: left=HS, right=CPC
    // Expand HS Section I > Chapter 01 > Heading 0101 to reach subheading 010121
    const leftPane = page.locator('.left-pane');

    // Expand Section I
    await leftPane.locator('.tree-node .toggle').first().click();
    await page.waitForTimeout(200);

    // Expand Chapter 01
    await leftPane.locator('.tree-node:has-text("01")').first().locator('.toggle').click();
    await page.waitForTimeout(200);

    // Expand Heading 0101
    await leftPane.locator('.tree-node:has-text("0101")').first().locator('.toggle').click();
    await page.waitForTimeout(200);

    // Click subheading 010121
    const subheading = leftPane.locator('.tree-node:has-text("010121")').first();
    await subheading.click();
    await page.waitForTimeout(500);

    // Check comparison panel shows the selection and CPC concordance
    const panel = page.locator('.comparison-panel');
    await expect(panel).toBeVisible();
    await expect(panel.locator('.source-item')).toContainText('HS');
    await expect(panel.locator('.source-item')).toContainText('010121');

    // Check CPC concordance section appears
    const concordanceItem = panel.locator('.concordance-item');
    await expect(concordanceItem).toBeVisible();
    await expect(concordanceItem).toContainText('CPC');

    // Check right pane has a selected node (cross-pane sync worked)
    const rightSelected = page.locator('.right-pane .tree-node.selected');
    await expect(rightSelected).toBeVisible({ timeout: 5000 });
  });

  test('selecting CPC node syncs to HS pane', async ({ page }) => {
    // Switch right pane to HS so we can test CPC->HS sync
    const rightSelector = page.locator('.right-pane .taxonomy-selector');
    await rightSelector.selectOption('hs');
    await page.waitForTimeout(500);

    // Left pane is HS by default, switch to CPC
    const leftSelector = page.locator('.left-pane .taxonomy-selector');
    await leftSelector.selectOption('cpc');
    await page.waitForTimeout(500);

    const leftPane = page.locator('.left-pane');

    // Expand CPC Section 0
    await leftPane.locator('.tree-node .toggle').first().click();
    await page.waitForTimeout(200);

    // Expand Division 02
    await leftPane.locator('.tree-node:has-text("02")').first().locator('.toggle').click();
    await page.waitForTimeout(200);

    // Expand Group 021
    await leftPane.locator('.tree-node:has-text("021")').first().locator('.toggle').click();
    await page.waitForTimeout(200);

    // Expand Class 0213
    await leftPane.locator('.tree-node:has-text("0213")').first().locator('.toggle').click();
    await page.waitForTimeout(200);

    // Click subclass 02131
    const subclass = leftPane.locator('.tree-node:has-text("02131")').first();
    await subclass.click();
    await page.waitForTimeout(500);

    // Check comparison panel shows HS mappings
    const panel = page.locator('.comparison-panel');
    await expect(panel).toBeVisible();

    // Check right pane has a selected node (cross-pane sync worked)
    const rightSelected = page.locator('.right-pane .tree-node.selected');
    await expect(rightSelected).toBeVisible({ timeout: 5000 });
  });

  test('tree switches when taxonomy selector changes', async ({ page }) => {
    // Right pane starts as CPC
    const rightPane = page.locator('.right-pane');
    const rightSelector = rightPane.locator('.taxonomy-selector');

    // Get first node text in CPC
    const firstNodeBefore = await rightPane.locator('.tree-node .node-name').first().textContent();

    // Switch to CN
    await rightSelector.selectOption('cn');
    await page.waitForTimeout(500);

    // Get first node text after switch
    const firstNodeAfter = await rightPane.locator('.tree-node .node-name').first().textContent();

    // They should be different (CPC section 0 vs CN section I)
    expect(firstNodeBefore).not.toBe(firstNodeAfter);
  });
});

test.describe('Data Loading', () => {
  test('HS tree data loads', async ({ page }) => {
    await waitForAppReady(page);
    const hsNodes = page.locator('.left-pane .tree-node');
    expect(await hsNodes.count()).toBeGreaterThan(0);
  });

  test('CPC tree data loads', async ({ page }) => {
    await waitForAppReady(page);
    const cpcNodes = page.locator('.right-pane .tree-node');
    expect(await cpcNodes.count()).toBeGreaterThan(0);
  });

  test('no error messages appear on load', async ({ page }) => {
    await waitForAppReady(page);
    const errorMsg = page.locator('.error');
    expect(await errorMsg.count()).toBe(0);
  });
});
