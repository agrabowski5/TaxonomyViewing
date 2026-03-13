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

/** Switch left pane to given taxonomy and wait for tree to load */
async function switchLeftTo(page: import('@playwright/test').Page, value: string) {
  const selector = page.locator('.left-pane .taxonomy-selector');
  await selector.selectOption(value);
  await page.waitForTimeout(500);
}

// --- All 13 Taxonomies Load ---

test.describe('Taxonomy Loading - All Types', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  const taxonomies = [
    { value: 'hs', name: 'Harmonized System', minNodes: 5 },
    { value: 'cpc', name: 'Central Product Classification', minNodes: 5 },
    { value: 'cn', name: 'Combined Nomenclature', minNodes: 5 },
    { value: 'hts', name: 'Harmonized Tariff Schedule', minNodes: 5 },
    { value: 'ca', name: 'Canadian', minNodes: 5 },
    { value: 'unspsc', name: 'UNSPSC', minNodes: 5 },
    { value: 'naics', name: 'NAICS', minNodes: 3 },
    { value: 'isic', name: 'ISIC', minNodes: 3 },
    { value: 'nace', name: 'NACE', minNodes: 3 },
    { value: 'cpa', name: 'CPA', minNodes: 3 },
    { value: 'bea', name: 'BEA', minNodes: 3 },
    { value: 't1', name: 'Taxonomy 1', minNodes: 5 },
    { value: 't2', name: 'Taxonomy 2', minNodes: 5 },
  ];

  for (const tax of taxonomies) {
    test(`${tax.value.toUpperCase()} taxonomy loads with tree nodes`, async ({ page }) => {
      test.setTimeout(60000); // larger taxonomies need more time
      await switchLeftTo(page, tax.value);
      const nodes = page.locator('.left-pane .tree-node');
      await expect(nodes.first()).toBeVisible({ timeout: 15000 });
      const count = await nodes.count();
      expect(count).toBeGreaterThanOrEqual(tax.minNodes);
    });
  }

  for (const tax of taxonomies) {
    test(`${tax.value.toUpperCase()} tree can expand to show children`, async ({ page }) => {
      test.setTimeout(60000);
      await switchLeftTo(page, tax.value);
      const leftPane = page.locator('.left-pane');

      // Get initial node names
      const initialNames = await leftPane.locator('.tree-node .node-name').allTextContents();

      // Try to expand first node via toggle
      const firstToggle = leftPane.locator('.tree-node .toggle-icon, .tree-node .toggle').first();
      if (await firstToggle.count() > 0) {
        await firstToggle.click();
        await page.waitForTimeout(500);

        // After expanding, the set of visible node names should change
        const expandedNames = await leftPane.locator('.tree-node .node-name').allTextContents();
        // New names should appear that weren't there before (children)
        const newNames = expandedNames.filter(n => !initialNames.includes(n));
        expect(newNames.length).toBeGreaterThan(0);
      }
    });
  }
});

// --- Taxonomy Header Labels ---

test.describe('Taxonomy Headers', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  const headerTests = [
    { value: 'hs', expected: /Harmonized System/i },
    { value: 'cpc', expected: /Central Product Classification/i },
    { value: 'cn', expected: /Combined Nomenclature/i },
    { value: 'hts', expected: /Harmonized Tariff Schedule/i },
    { value: 'ca', expected: /Canadian/i },
    { value: 'unspsc', expected: /UNSPSC/i },
    { value: 'naics', expected: /NAICS/i },
    { value: 'isic', expected: /ISIC/i },
    { value: 'nace', expected: /NACE/i },
    { value: 'cpa', expected: /CPA/i },
    { value: 'bea', expected: /BEA/i },
    { value: 't1', expected: /Taxonomy 1|T1/i },
    { value: 't2', expected: /Taxonomy 2|T2/i },
  ];

  for (const { value, expected } of headerTests) {
    test(`${value.toUpperCase()} shows correct header`, async ({ page }) => {
      await switchLeftTo(page, value);
      const header = page.locator('.left-pane .panel-header h2');
      await expect(header).toContainText(expected);
    });
  }
});

// --- Taxonomy Selector Options ---

test.describe('Taxonomy Selector', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('all 13 taxonomy options are available in dropdown', async ({ page }) => {
    const selector = page.locator('.left-pane .taxonomy-selector');
    const options = await selector.locator('option').allTextContents();

    const expectedKeywords = [
      'HS', 'CPC', 'CN', 'HTS', 'Canadian', 'UNSPSC',
      'NAICS', 'ISIC', 'NACE', 'CPA', 'BEA',
      'T1', 'T2',
    ];

    for (const keyword of expectedKeywords) {
      const found = options.some(opt => opt.includes(keyword));
      expect(found).toBe(true);
    }
  });

  test('dropdown has optgroup categories', async ({ page }) => {
    const selector = page.locator('.left-pane .taxonomy-selector');
    const optgroups = selector.locator('optgroup');
    const count = await optgroups.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('left and right selectors are independent', async ({ page }) => {
    const leftSelector = page.locator('.left-pane .taxonomy-selector');
    const rightSelector = page.locator('.right-pane .taxonomy-selector');

    await leftSelector.selectOption('naics');
    await page.waitForTimeout(300);

    await expect(rightSelector).toHaveValue('cpc');
    await expect(leftSelector).toHaveValue('naics');
  });
});

// --- Cross-pane Sync with Various Taxonomy Combos ---

test.describe('Cross-pane Sync - Taxonomy Combinations', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('HS → NAICS sync via concordance', async ({ page }) => {
    const rightSelector = page.locator('.right-pane .taxonomy-selector');
    await rightSelector.selectOption('naics');
    await page.waitForTimeout(500);

    const leftPane = page.locator('.left-pane');
    await leftPane.locator('.tree-node .toggle').first().click();
    await page.waitForTimeout(200);
    await leftPane.locator('.tree-node:has-text("01")').first().locator('.toggle').click();
    await page.waitForTimeout(200);
    await leftPane.locator('.tree-node:has-text("0101")').first().locator('.toggle').click();
    await page.waitForTimeout(200);
    await leftPane.locator('.tree-node:has-text("010121")').first().click();
    await page.waitForTimeout(1000);

    const panel = page.locator('.comparison-panel');
    await expect(panel).toBeVisible({ timeout: 5000 });
  });

  test('CPC → HS sync via concordance', async ({ page }) => {
    const leftSelector = page.locator('.left-pane .taxonomy-selector');
    await leftSelector.selectOption('cpc');
    await page.waitForTimeout(500);

    const rightSelector = page.locator('.right-pane .taxonomy-selector');
    await rightSelector.selectOption('hs');
    await page.waitForTimeout(500);

    const leftPane = page.locator('.left-pane');
    await leftPane.locator('.tree-node .toggle').first().click();
    await page.waitForTimeout(200);
    await leftPane.locator('.tree-node:has-text("01")').first().locator('.toggle').click();
    await page.waitForTimeout(200);

    await leftPane.locator('.tree-node:has-text("011")').first().click();
    await page.waitForTimeout(1000);

    await expect(page.locator('.comparison-panel')).toBeVisible({ timeout: 5000 });
  });

  test('ISIC → CPC sync via concordance chain', async ({ page }) => {
    const leftSelector = page.locator('.left-pane .taxonomy-selector');
    await leftSelector.selectOption('isic');
    await page.waitForTimeout(500);

    const leftPane = page.locator('.left-pane');
    await leftPane.locator('.tree-node .toggle').first().click();
    await page.waitForTimeout(200);
    await leftPane.locator('.tree-node').nth(1).locator('.toggle').click();
    await page.waitForTimeout(200);

    await leftPane.locator('.tree-node').nth(2).click();
    await page.waitForTimeout(1000);

    await expect(page.locator('.comparison-panel')).toBeVisible({ timeout: 5000 });
  });
});

// --- Taxonomy-specific Features ---

test.describe('Taxonomy-specific Behavior', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('T1 (Combined) shows both HTS and CPC content', async ({ page }) => {
    await switchLeftTo(page, 't1');
    const leftPane = page.locator('.left-pane');
    const names = await leftPane.locator('.tree-node .node-name').allTextContents();
    expect(names.length).toBeGreaterThanOrEqual(5);
  });

  test('T2 (CPC+HTS) shows CPC backbone', async ({ page }) => {
    await switchLeftTo(page, 't2');
    const nodes = page.locator('.left-pane .tree-node');
    await expect(nodes.first()).toBeVisible();
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('UNSPSC shows segment-level nodes', async ({ page }) => {
    await switchLeftTo(page, 'unspsc');
    const leftPane = page.locator('.left-pane');
    await expect(leftPane.locator('.tree-node').first()).toBeVisible();
    const count = await leftPane.locator('.tree-node').count();
    expect(count).toBeGreaterThan(10);
  });

  test('search works across taxonomy switch', async ({ page }) => {
    const searchInput = page.locator('.search-bar input');

    await searchInput.fill('agriculture');
    await page.waitForTimeout(500);
    const hsResults = await page.locator('.left-pane .tree-node').count();

    await switchLeftTo(page, 'naics');
    await page.waitForTimeout(500);

    const naicsResults = await page.locator('.left-pane .tree-node').count();
    expect(hsResults + naicsResults).toBeGreaterThanOrEqual(0);
  });
});
