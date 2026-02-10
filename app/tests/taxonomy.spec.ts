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

  test('all 8 taxonomy options are available', async ({ page }) => {
    const leftSelector = page.locator('.left-pane .taxonomy-selector');
    const options = await leftSelector.locator('option').allTextContents();
    expect(options.some(opt => opt.includes('HS'))).toBe(true);
    expect(options.some(opt => opt.includes('CPC'))).toBe(true);
    expect(options.some(opt => opt.includes('CN'))).toBe(true);
    expect(options.some(opt => opt.includes('HTS'))).toBe(true);
    expect(options.some(opt => opt.includes('Canadian'))).toBe(true);
    expect(options.some(opt => opt.includes('UNSPSC'))).toBe(true);
    expect(options.some(opt => opt.includes('T1'))).toBe(true);
    expect(options.some(opt => opt.includes('T2'))).toBe(true);
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

test.describe('Search Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('search filters tree to show only matching nodes', async ({ page }) => {
    const searchInput = page.locator('.search-bar input');
    const leftPane = page.locator('.left-pane');

    // Initially the first section should be visible (e.g., "Live Animals" for HS)
    await expect(leftPane.locator('.tree-node').first()).toBeVisible();

    // Search for something specific
    await searchInput.fill('horses');
    // Wait for debounce (200ms) + render
    await page.waitForTimeout(500);

    // Matching nodes should be visible
    const nodeNames = await leftPane.locator('.tree-node .node-name').allTextContents();
    const hasMatch = nodeNames.some(name => name.toLowerCase().includes('horses'));
    expect(hasMatch).toBe(true);

    // Non-matching top-level sections should NOT be visible
    // HS section "Vegetable Products" should not appear for "horses"
    const hasVegetable = nodeNames.some(name => name.toLowerCase().includes('vegetable products'));
    expect(hasVegetable).toBe(false);
  });

  test('clearing search restores full tree', async ({ page }) => {
    const searchInput = page.locator('.search-bar input');
    const leftPane = page.locator('.left-pane');

    // Get the first visible node name before search (should be Section I)
    const initialFirstName = await leftPane.locator('.tree-node .node-name').first().textContent();

    // Search to filter
    await searchInput.fill('horses');
    await page.waitForTimeout(500);

    // Clear search via X button
    const clearBtn = page.locator('.search-bar .clear-btn');
    await clearBtn.click();
    await page.waitForTimeout(500);

    // Tree should be restored - first node should be a top-level section again
    const restoredFirstName = await leftPane.locator('.tree-node .node-name').first().textContent();
    expect(restoredFirstName).toBe(initialFirstName);

    // Multiple sections should be visible (not just the horses-related ones)
    const nodeNames = await leftPane.locator('.tree-node .node-name').allTextContents();
    // HS has 21 sections; in collapsed state, we should see multiple diverse sections
    const hasVegetable = nodeNames.some(name => name.toLowerCase().includes('vegetable'));
    const hasChemical = nodeNames.some(name => name.toLowerCase().includes('chemical'));
    expect(hasVegetable || hasChemical).toBe(true);
  });

  test('search filters both panes simultaneously', async ({ page }) => {
    const searchInput = page.locator('.search-bar input');
    const leftPane = page.locator('.left-pane');
    const rightPane = page.locator('.right-pane');

    await searchInput.fill('horses');
    await page.waitForTimeout(500);

    // Left pane (HS) should show horse-related content
    const leftNames = await leftPane.locator('.tree-node .node-name').allTextContents();
    expect(leftNames.some(name => name.toLowerCase().includes('horses'))).toBe(true);

    // Right pane (CPC) should also show horse-related content
    const rightNames = await rightPane.locator('.tree-node .node-name').allTextContents();
    expect(rightNames.some(name => name.toLowerCase().includes('horses'))).toBe(true);
  });

  test('search with no matches shows empty tree', async ({ page }) => {
    const searchInput = page.locator('.search-bar input');
    const leftPane = page.locator('.left-pane');

    await searchInput.fill('xyznonexistent12345');
    await page.waitForTimeout(500);

    const count = await leftPane.locator('.tree-node').count();
    expect(count).toBe(0);
  });

  test('search by code works', async ({ page }) => {
    const searchInput = page.locator('.search-bar input');
    const leftPane = page.locator('.left-pane');

    await searchInput.fill('0101');
    await page.waitForTimeout(500);

    const count = await leftPane.locator('.tree-node').count();
    expect(count).toBeGreaterThan(0);

    // Check that a node with code 0101 is visible
    const nodeCodes = await leftPane.locator('.tree-node .node-type-badge').allTextContents();
    const hasCodeMatch = nodeCodes.some(code => code.includes('0101'));
    expect(hasCodeMatch).toBe(true);
  });

  test('tree is interactive after clearing search (no stuck state)', async ({ page }) => {
    const searchInput = page.locator('.search-bar input');
    const leftPane = page.locator('.left-pane');

    // Search and clear
    await searchInput.fill('horses');
    await page.waitForTimeout(500);
    await page.locator('.search-bar .clear-btn').click();
    await page.waitForTimeout(500);

    // After clearing, tree should be in clean collapsed state
    // The first node should be a top-level section (not expanded)
    const firstNode = leftPane.locator('.tree-node').first();
    await expect(firstNode).toBeVisible();

    // Try expanding first section
    const firstToggle = leftPane.locator('.tree-node .toggle-icon').first();
    await firstToggle.click();
    await page.waitForTimeout(300);

    // Should see children now (chapter codes like "01", "02")
    const codes = await leftPane.locator('.tree-node .node-type-badge').allTextContents();
    const hasChapter = codes.some(code => /^\d{2}$/.test(code.trim()));
    expect(hasChapter).toBe(true);
  });

  test('repeated search-clear cycles work correctly', async ({ page }) => {
    const searchInput = page.locator('.search-bar input');
    const leftPane = page.locator('.left-pane');
    const clearBtn = page.locator('.search-bar .clear-btn');

    // Cycle 1: search for horses
    await searchInput.fill('horses');
    await page.waitForTimeout(500);
    let names = await leftPane.locator('.tree-node .node-name').allTextContents();
    expect(names.some(n => n.toLowerCase().includes('horses'))).toBe(true);
    // Non-matching sections should be gone
    expect(names.some(n => n.toLowerCase().includes('vegetable products'))).toBe(false);

    // Clear
    await clearBtn.click();
    await page.waitForTimeout(500);

    // Cycle 2: search for something different
    await searchInput.fill('dairy');
    await page.waitForTimeout(500);
    names = await leftPane.locator('.tree-node .node-name').allTextContents();
    expect(names.some(n => n.toLowerCase().includes('dairy'))).toBe(true);
    // Previous search results should not persist
    expect(names.some(n => n.toLowerCase().includes('horses'))).toBe(false);

    // Clear
    await clearBtn.click();
    await page.waitForTimeout(500);

    // Cycle 3: verify full tree is restored (vegetable sections visible)
    names = await leftPane.locator('.tree-node .node-name').allTextContents();
    const hasDiverseSections = names.some(n => n.toLowerCase().includes('vegetable')) ||
                               names.some(n => n.toLowerCase().includes('mineral'));
    expect(hasDiverseSections).toBe(true);
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
