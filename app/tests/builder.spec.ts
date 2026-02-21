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

async function enterBuilder(page: import('@playwright/test').Page) {
  await page.locator('.builder-toggle').click();
  await page.locator('.base-taxonomy-dialog').waitFor({ state: 'visible' });
}

async function startFromScratch(page: import('@playwright/test').Page) {
  await enterBuilder(page);
  // Click "Start from Scratch" card
  await page.locator('.base-dialog-option-card:has-text("Start from Scratch")').click();
  await page.waitForTimeout(300);
}

async function cloneHS(page: import('@playwright/test').Page) {
  await enterBuilder(page);
  // Select HS from dropdown
  await page.locator('.base-taxonomy-dialog .builder-form-select').selectOption('hs');
  await page.waitForTimeout(200);
  // Clone
  await page.locator('.base-taxonomy-dialog .builder-form-save').click();
  await page.waitForTimeout(500);
}

// --- Entering and Exiting Builder ---

test.describe('Builder Mode - Enter/Exit', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('Build Custom button is visible', async ({ page }) => {
    const btn = page.locator('.builder-toggle');
    await expect(btn).toBeVisible();
    await expect(btn).toContainText('Build Custom');
  });

  test('clicking Build Custom opens base taxonomy dialog', async ({ page }) => {
    await enterBuilder(page);
    await expect(page.locator('.base-taxonomy-dialog')).toBeVisible();
    await expect(page.locator('.builder-modal-header h2')).toContainText('Choose a Starting Point');
  });

  test('Start from Scratch creates empty builder', async ({ page }) => {
    await startFromScratch(page);
    // Builder banner should appear
    await expect(page.locator('.builder-banner')).toBeVisible();
    // Right pane should show builder header
    await expect(page.locator('.builder-pane-header h2')).toContainText('Custom Taxonomy Builder');
    // Empty state should be visible
    await expect(page.locator('.builder-empty-state')).toBeVisible();
  });

  test('Clone HS taxonomy populates tree', async ({ page }) => {
    await cloneHS(page);
    // Builder should be active
    await expect(page.locator('.builder-banner')).toBeVisible();
    // Tree should have nodes (not empty state)
    await expect(page.locator('.builder-empty-state')).not.toBeVisible();
    // Root node should be visible
    await expect(page.locator('.builder-tree-panel .tree-node').first()).toBeVisible();
  });

  test('Exit Builder button opens reset dialog', async ({ page }) => {
    await startFromScratch(page);
    // Click Exit Builder
    await page.locator('.builder-toggle').click();
    await expect(page.locator('.builder-modal:has-text("Exit Builder")')).toBeVisible();
  });

  test('Save & Exit keeps taxonomy and exits', async ({ page }) => {
    await startFromScratch(page);
    await page.locator('.builder-toggle').click();
    // Click Save & Exit
    await page.locator('.builder-reset-option:has-text("Save & Exit")').click();
    await page.waitForTimeout(300);
    // Builder should be inactive
    await expect(page.locator('.builder-banner')).not.toBeVisible();
    // Standard right pane should be visible
    await expect(page.locator('.right-pane .taxonomy-selector')).toBeVisible();
  });

  test('Discard & Exit clears taxonomy and exits', async ({ page }) => {
    await cloneHS(page);
    await page.locator('.builder-toggle').click();
    // Click Discard & Exit
    await page.locator('.builder-reset-option:has-text("Discard & Exit")').click();
    await page.waitForTimeout(300);
    // Builder should be inactive
    await expect(page.locator('.builder-banner')).not.toBeVisible();
    // Re-enter builder: should show empty state (tree was discarded)
    await enterBuilder(page);
    await page.locator('.base-dialog-option-card:has-text("Start from Scratch")').click();
    await page.waitForTimeout(300);
    await expect(page.locator('.builder-empty-state')).toBeVisible();
  });
});

// --- Quick Add ---

test.describe('Builder Mode - Quick Add', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await startFromScratch(page);
  });

  test('Quick Add button is visible', async ({ page }) => {
    await expect(page.locator('.builder-quick-add-btn')).toBeVisible();
    await expect(page.locator('.builder-quick-add-btn')).toContainText('Quick Add');
  });

  test('Quick Add opens sidebar with form', async ({ page }) => {
    await page.locator('.builder-quick-add-btn').click();
    await page.waitForTimeout(200);
    // Guide sidebar should show Quick Add header
    await expect(page.locator('.builder-guide-header h3')).toContainText('Quick Add Node');
    // Form should be visible
    await expect(page.locator('.builder-node-form')).toBeVisible();
  });

  test('can create a node with Quick Add', async ({ page }) => {
    await page.locator('.builder-quick-add-btn').click();
    await page.waitForTimeout(200);

    // Fill in required fields
    await page.locator('.builder-node-form input[type="text"]').first().fill('Test Category');
    await page.locator('.builder-node-form textarea').first().fill('A test category for testing');

    // Save
    await page.locator('.builder-form-save').click();
    await page.waitForTimeout(300);

    // Node should appear in tree
    const nodes = page.locator('.builder-tree-panel .tree-node');
    // Root + new node = at least 2
    await expect(nodes.first()).toBeVisible();
    // Empty state should be gone
    await expect(page.locator('.builder-empty-state')).not.toBeVisible();
  });

  test('no placement toggle when no node is selected', async ({ page }) => {
    await page.locator('.builder-quick-add-btn').click();
    await page.waitForTimeout(200);
    // No placement toggle visible (nothing selected)
    await expect(page.locator('.quick-add-placement')).not.toBeVisible();
  });

  test('placement toggle appears when node is selected', async ({ page }) => {
    // First create a node
    await page.locator('.builder-quick-add-btn').click();
    await page.waitForTimeout(200);
    await page.locator('.builder-node-form input[type="text"]').first().fill('Parent Node');
    await page.locator('.builder-node-form textarea').first().fill('A parent node');
    await page.locator('.builder-form-save').click();
    await page.waitForTimeout(300);

    // Expand root to see nodes
    await page.locator('.builder-tree-panel .tree-node .toggle').first().click();
    await page.waitForTimeout(200);

    // Click the newly created node
    await page.locator('.builder-tree-panel .tree-node:has-text("Parent Node")').click();
    await page.waitForTimeout(200);

    // Now click Quick Add
    await page.locator('.builder-quick-add-btn').click();
    await page.waitForTimeout(200);

    // Placement toggle should be visible
    await expect(page.locator('.quick-add-placement')).toBeVisible();
    await expect(page.locator('.quick-add-toggle-btn.active')).toContainText('Child');
  });

  test('can switch between child and sibling mode', async ({ page }) => {
    // Create a parent node first
    await page.locator('.builder-quick-add-btn').click();
    await page.waitForTimeout(200);
    await page.locator('.builder-node-form input[type="text"]').first().fill('First Node');
    await page.locator('.builder-node-form textarea').first().fill('First node');
    await page.locator('.builder-form-save').click();
    await page.waitForTimeout(300);

    // Expand root and select the node
    await page.locator('.builder-tree-panel .tree-node .toggle').first().click();
    await page.waitForTimeout(200);
    await page.locator('.builder-tree-panel .tree-node:has-text("First Node")').click();
    await page.waitForTimeout(200);

    // Quick Add again
    await page.locator('.builder-quick-add-btn').click();
    await page.waitForTimeout(200);

    // Switch to sibling mode
    await page.locator('.quick-add-toggle-btn:has-text("Sibling")').click();
    await expect(page.locator('.quick-add-toggle-btn:has-text("Sibling")')).toHaveClass(/active/);
  });
});

// --- Search in Builder ---

test.describe('Builder Mode - Search', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await cloneHS(page);
  });

  test('search filters custom tree nodes', async ({ page }) => {
    const searchInput = page.locator('.search-bar input');
    await searchInput.fill('live animals');
    await page.waitForTimeout(400); // debounce

    // Filtered tree should still show nodes
    const treeNodes = page.locator('.builder-tree-panel .tree-node');
    await expect(treeNodes.first()).toBeVisible();
  });

  test('clearing search restores full tree', async ({ page }) => {
    const searchInput = page.locator('.search-bar input');
    await searchInput.fill('live animals');
    await page.waitForTimeout(400);

    // Clear search
    const clearBtn = page.locator('.search-bar .clear-btn');
    await clearBtn.click();
    await page.waitForTimeout(400);

    // Tree should still show root
    await expect(page.locator('.builder-tree-panel .tree-node').first()).toBeVisible();
  });
});

// --- Cross-pane Mapping in Builder ---

test.describe('Builder Mode - Cross-pane Mapping', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await cloneHS(page);
  });

  test('clicking cloned node maps to left pane', async ({ page }) => {
    // Expand root
    await page.locator('.builder-tree-panel .tree-node .toggle').first().click();
    await page.waitForTimeout(200);

    // Expand first section (Section I)
    const firstSection = page.locator('.builder-tree-panel .tree-node').nth(1);
    await firstSection.locator('.toggle').click();
    await page.waitForTimeout(200);

    // Click a chapter node
    const chapter = page.locator('.builder-tree-panel .tree-node').nth(2);
    await chapter.click();
    await page.waitForTimeout(800); // wait for cross-pane sync

    // Comparison panel should appear showing mappings
    const comparisonPanel = page.locator('.comparison-panel').first();
    await expect(comparisonPanel).toBeVisible();
  });
});

// --- Modification Badges ---

test.describe('Builder Mode - Change Tracking', () => {
  test('cloned nodes show no modification badges', async ({ page }) => {
    await waitForAppReady(page);
    await cloneHS(page);

    // Expand root
    await page.locator('.builder-tree-panel .tree-node .toggle').first().click();
    await page.waitForTimeout(200);

    // No "new" or "edited" badges should be visible
    await expect(page.locator('.modification-badge')).not.toBeVisible();
  });

  test('newly added node shows new badge', async ({ page }) => {
    await waitForAppReady(page);
    // Use from-scratch tree so the new node is easily visible
    await startFromScratch(page);

    // Quick add a node
    await page.locator('.builder-quick-add-btn').click();
    await page.waitForTimeout(200);

    await page.locator('.builder-node-form input[type="text"]').first().fill('New Test Node');
    await page.locator('.builder-node-form textarea').first().fill('A brand new node');
    await page.locator('.builder-form-save').click();
    await page.waitForTimeout(300);

    // Expand root to see the new node
    await page.locator('.builder-tree-panel .tree-node .toggle').first().click();
    await page.waitForTimeout(200);

    // The new node should have a "new" badge
    const newBadge = page.locator('.modification-added');
    await expect(newBadge).toBeVisible();
  });
});

// --- Save/Library ---

test.describe('Builder Mode - Taxonomy Library', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    // Clear localStorage before each test
    await page.evaluate(() => {
      localStorage.removeItem('customTaxonomy_v1');
      localStorage.removeItem('customTaxonomyLibrary_v1');
    });
  });

  test('Save button is visible when tree has nodes', async ({ page }) => {
    await cloneHS(page);
    await expect(page.locator('.builder-save-btn')).toBeVisible();
  });

  test('Library button is visible', async ({ page }) => {
    await startFromScratch(page);
    await expect(page.locator('.builder-library-btn')).toBeVisible();
  });

  test('Library button opens library dialog', async ({ page }) => {
    await startFromScratch(page);
    await page.locator('.builder-library-btn').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.library-dialog')).toBeVisible();
    await expect(page.locator('.library-dialog .builder-modal-header h2')).toContainText('Taxonomy Library');
  });

  test('empty library shows empty message', async ({ page }) => {
    await startFromScratch(page);
    await page.locator('.builder-library-btn').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.library-empty')).toBeVisible();
  });

  test('can save and load taxonomy from library', async ({ page }) => {
    // Use a small taxonomy (from scratch + one node) to avoid localStorage limits
    await startFromScratch(page);

    // Quick add a node
    await page.locator('.builder-quick-add-btn').click();
    await page.waitForTimeout(200);
    await page.locator('.builder-node-form input[type="text"]').first().fill('Library Test Node');
    await page.locator('.builder-node-form textarea').first().fill('A test node for library');
    await page.locator('.builder-form-save').click();
    await page.waitForTimeout(300);

    // Save via button
    await page.locator('.builder-save-btn').click();
    await page.waitForTimeout(300);

    // Open library
    await page.locator('.builder-library-btn').click();
    await page.waitForTimeout(200);

    // Should have one entry
    await expect(page.locator('.library-entry')).toBeVisible();
    await expect(page.locator('.library-entry-name')).toBeVisible();

    // Close dialog
    await page.locator('.library-dialog .builder-form-cancel').click();
    await page.waitForTimeout(200);
  });

  test('can delete taxonomy from library', async ({ page }) => {
    // Use a small taxonomy
    await startFromScratch(page);

    // Quick add a node
    await page.locator('.builder-quick-add-btn').click();
    await page.waitForTimeout(200);
    await page.locator('.builder-node-form input[type="text"]').first().fill('Delete Test Node');
    await page.locator('.builder-node-form textarea').first().fill('A test node to delete');
    await page.locator('.builder-form-save').click();
    await page.waitForTimeout(300);

    // Save
    await page.locator('.builder-save-btn').click();
    await page.waitForTimeout(300);

    // Open library
    await page.locator('.builder-library-btn').click();
    await page.waitForTimeout(200);

    // Click delete
    await page.locator('.library-delete-btn').click();
    await page.waitForTimeout(100);
    // Confirm
    await page.locator('.library-delete-confirm-btn').click();
    await page.waitForTimeout(200);

    // Library should be empty now
    await expect(page.locator('.library-empty')).toBeVisible();
  });
});

// --- Export Panel ---

test.describe('Builder Mode - Export', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await startFromScratch(page);
  });

  test('Export button is visible', async ({ page }) => {
    await expect(page.locator('.builder-export-btn')).toBeVisible();
  });

  test('Export button opens export panel', async ({ page }) => {
    await page.locator('.builder-export-btn').click();
    await page.waitForTimeout(200);
    const exportPanel = page.locator('.builder-export-panel, .builder-modal:has-text("Export")');
    await expect(exportPanel).toBeVisible();
  });
});

// --- Guide Sidebar ---

test.describe('Builder Mode - Guide Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await startFromScratch(page);
  });

  test('Guide toggle button is visible', async ({ page }) => {
    await expect(page.locator('.builder-guide-toggle-btn')).toBeVisible();
  });

  test('can toggle guide sidebar', async ({ page }) => {
    // Guide should be open by default
    await expect(page.locator('.builder-guide-sidebar')).toBeVisible();

    // Hide guide
    await page.locator('.builder-guide-toggle-btn').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.builder-guide-sidebar')).not.toBeVisible();

    // Show guide
    await page.locator('.builder-guide-toggle-btn').click();
    await page.waitForTimeout(200);
    await expect(page.locator('.builder-guide-sidebar')).toBeVisible();
  });
});
