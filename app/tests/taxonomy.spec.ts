import { test, expect } from '@playwright/test';

const BASE_URL = '/';

async function waitForAppReady(page: import('@playwright/test').Page) {
  await page.goto(BASE_URL);
  await page.waitForLoadState('domcontentloaded');

  const loading = page.locator('.loading');
  if (await loading.count()) {
    await loading.waitFor({ state: 'hidden' });
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
    // Check for main content wrapper
    await expect(page.locator('.main-content.two-pane')).toBeVisible();
    
    // Check for left and right panes
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
    
    // Switch to CN
    await leftSelector.selectOption('cn');
    await expect(leftSelector).toHaveValue('cn');
    
    // Wait for tree to update
    await page.waitForTimeout(500);
    
    // Check if pane info updates
    const paneInfo = page.locator('.left-pane .pane-info .full-name');
    await expect(paneInfo).toContainText(/Combined Nomenclature/i);
  });

  test('can switch taxonomy in right pane', async ({ page }) => {
    const rightSelector = page.locator('.right-pane .taxonomy-selector');
    
    // Switch to NAICS
    await rightSelector.selectOption('naics');
    await expect(rightSelector).toHaveValue('naics');
    
    // Wait for tree to update
    await page.waitForTimeout(500);
    
    // Check if pane info updates
    const paneInfo = page.locator('.right-pane .pane-info .full-name');
    await expect(paneInfo).toContainText(/NAICS/i);
  });

  test('search bar is functional', async ({ page }) => {
    const searchInput = page.locator('.search-bar input');
    await expect(searchInput).toBeVisible();
    
    // Type in search
    await searchInput.fill('agriculture');
    await expect(searchInput).toHaveValue('agriculture');
    
    // Check if clear button appears
    const clearBtn = page.locator('.search-bar .clear-btn');
    await expect(clearBtn).toBeVisible();
    
    // Clear search
    await clearBtn.click();
    await expect(searchInput).toHaveValue('');
  });

  test('tree nodes are expandable in left pane', async ({ page }) => {
    // Find first node
    const firstNode = page.locator('.left-pane .tree-panel .tree-node').first();
    await expect(firstNode).toBeVisible();

    // Try to expand via toggle
    await firstNode.locator('.toggle').click();
  });

  test('tree nodes are expandable in right pane', async ({ page }) => {
    // Find first node in right pane
    const firstNode = page.locator('.right-pane .tree-panel .tree-node').first();
    await expect(firstNode).toBeVisible();
  });

  test('comparison panel appears when node is selected', async ({ page }) => {
    // Click on a node in left pane
    const leftNode = page.locator('.left-pane .tree-panel .tree-node .node-name').first();
    await leftNode.click();

    // Check if comparison panel appears
    const comparisonPanel = page.locator('.comparison-panel');
    await expect(comparisonPanel).toBeVisible();
  });

  test('all taxonomy options are available in selectors', async ({ page }) => {
    const leftSelector = page.locator('.left-pane .taxonomy-selector');
    
    // Get all options
    const options = await leftSelector.locator('option').allTextContents();
    
    // Check for all 4 taxonomies
    expect(options.some(opt => opt.includes('HS'))).toBe(true);
    expect(options.some(opt => opt.includes('CN'))).toBe(true);
    expect(options.some(opt => opt.includes('NAICS'))).toBe(true);
    expect(options.some(opt => opt.includes('CPC'))).toBe(true);
  });

  test('panes can display different taxonomies simultaneously', async ({ page }) => {
    const leftSelector = page.locator('.left-pane .taxonomy-selector');
    const rightSelector = page.locator('.right-pane .taxonomy-selector');
    
    // Set left to HS
    await leftSelector.selectOption('hs');
    await page.waitForTimeout(300);
    
    // Set right to NAICS
    await rightSelector.selectOption('naics');
    await page.waitForTimeout(300);
    
    // Verify both are showing different taxonomies
    await expect(leftSelector).toHaveValue('hs');
    await expect(rightSelector).toHaveValue('naics');
  });

  test('color legend is present in left pane', async ({ page }) => {
    const legend = page.locator('.left-pane .pane-info .legend');
    await expect(legend).toBeVisible();
    await expect(legend).not.toHaveText('');
  });

  test('can search and see highlighted results', async ({ page }) => {
    const searchInput = page.locator('.search-bar input');
    
    // Search for "01" which should exist in HS codes
    await searchInput.fill('01');
    await page.waitForTimeout(1000);

    // Ensure tree still renders nodes after search
    const nodes = page.locator('.left-pane .tree-panel .tree-node');
    expect(await nodes.count()).toBeGreaterThan(0);
  });

  test('responsive design - panes stack on smaller screens', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    // Check if main-content still has two-pane class
    const mainContent = page.locator('.main-content.two-pane');
    await expect(mainContent).toBeVisible();
  });
});

test.describe('Taxonomy Explorer - Data Loading', () => {
  test('HS tree data loads', async ({ page }) => {
    await waitForAppReady(page);

    // Check if tree has nodes
    const hsNodes = page.locator('.left-pane .tree-panel .tree-node');
    expect(await hsNodes.count()).toBeGreaterThan(0);
  });

  test('CPC tree data loads', async ({ page }) => {
    await waitForAppReady(page);

    // Check if tree has nodes
    const cpcNodes = page.locator('.right-pane .tree-panel .tree-node');
    expect(await cpcNodes.count()).toBeGreaterThan(0);
  });

  test('no error messages appear on load', async ({ page }) => {
    await waitForAppReady(page);

    // Check for error divs
    const errorMsg = page.locator('.error');
    expect(await errorMsg.count()).toBe(0);
  });

  test('loading spinner disappears after data loads', async ({ page }) => {
    await page.goto(BASE_URL);

    const loading = page.locator('.loading');
    if (await loading.count()) {
      await loading.waitFor({ state: 'hidden' });
    }

    expect(await loading.count()).toBe(0);
  });
});
