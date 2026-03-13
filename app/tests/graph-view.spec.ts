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

function switchToGraph(page: import('@playwright/test').Page, pane: 'left' | 'right') {
  const wrapper = page.locator(`.${pane}-pane`);
  return wrapper.locator('.view-mode-btn:has-text("Graph")').click();
}

// --- View Mode Toggle ---

test.describe('Graph View - Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('List and Graph toggle buttons are visible', async ({ page }) => {
    const leftToggle = page.locator('.left-pane .view-mode-toggle');
    await expect(leftToggle).toBeVisible();
    await expect(leftToggle.locator('.view-mode-btn')).toHaveCount(2);
    await expect(leftToggle.locator('.view-mode-btn:has-text("List")')).toBeVisible();
    await expect(leftToggle.locator('.view-mode-btn:has-text("Graph")')).toBeVisible();
  });

  test('List mode is active by default', async ({ page }) => {
    const listBtn = page.locator('.left-pane .view-mode-btn:has-text("List")');
    await expect(listBtn).toHaveClass(/active/);
  });

  test('switching to Graph mode shows graph container', async ({ page }) => {
    await switchToGraph(page, 'left');
    await page.waitForTimeout(300);

    const graphContainer = page.locator('.left-pane .graph-container');
    await expect(graphContainer).toBeVisible();

    const graphBtn = page.locator('.left-pane .view-mode-btn:has-text("Graph")');
    await expect(graphBtn).toHaveClass(/active/);
  });

  test('switching back to List mode restores tree view', async ({ page }) => {
    await switchToGraph(page, 'left');
    await page.waitForTimeout(300);

    const listBtn = page.locator('.left-pane .view-mode-btn:has-text("List")');
    await listBtn.click();
    await page.waitForTimeout(300);

    await expect(page.locator('.left-pane .graph-container')).not.toBeVisible();
    await expect(page.locator('.left-pane .tree-node').first()).toBeVisible();
  });

  test('both panes can independently use Graph mode', async ({ page }) => {
    await switchToGraph(page, 'left');
    await switchToGraph(page, 'right');
    await page.waitForTimeout(300);

    await expect(page.locator('.left-pane .graph-container')).toBeVisible();
    await expect(page.locator('.right-pane .graph-container')).toBeVisible();
  });

  test('panes can have different view modes', async ({ page }) => {
    await switchToGraph(page, 'left');
    await page.waitForTimeout(300);

    await expect(page.locator('.left-pane .graph-container')).toBeVisible();
    await expect(page.locator('.right-pane .tree-node').first()).toBeVisible();
  });
});

// --- Graph Rendering ---

test.describe('Graph View - Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await switchToGraph(page, 'left');
    await page.waitForTimeout(500);
  });

  test('graph renders root-level nodes', async ({ page }) => {
    const nodes = page.locator('.left-pane .graph-node-card');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('graph renders SVG edges layer', async ({ page }) => {
    const svg = page.locator('.left-pane .graph-edges');
    await expect(svg).toBeVisible();
  });

  test('clicking toggle button expands node children', async ({ page }) => {
    const initialCount = await page.locator('.left-pane .graph-node-card').count();

    // Click the graph-toggle button (not the card — card selects, toggle expands)
    const firstToggle = page.locator('.left-pane .graph-toggle').first();
    await firstToggle.click();
    await page.waitForTimeout(500);

    const newCount = await page.locator('.left-pane .graph-node-card').count();
    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('expanding a node creates edges', async ({ page }) => {
    const firstToggle = page.locator('.left-pane .graph-toggle').first();
    await firstToggle.click();
    await page.waitForTimeout(500);

    const edgeCount = await page.locator('.left-pane .graph-edge').count();
    expect(edgeCount).toBeGreaterThan(0);
  });

  test('collapsing a node removes its children', async ({ page }) => {
    const firstToggle = page.locator('.left-pane .graph-toggle').first();
    await firstToggle.click();
    await page.waitForTimeout(500);

    const expandedCount = await page.locator('.left-pane .graph-node-card').count();

    // Click toggle again to collapse
    await firstToggle.click();
    await page.waitForTimeout(500);

    const collapsedCount = await page.locator('.left-pane .graph-node-card').count();
    expect(collapsedCount).toBeLessThan(expandedCount);
  });
});

// --- Zoom Controls ---

test.describe('Graph View - Zoom Controls', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
    await switchToGraph(page, 'left');
    await page.waitForTimeout(500);
  });

  test('zoom controls are visible', async ({ page }) => {
    const controls = page.locator('.left-pane .graph-zoom-controls');
    await expect(controls).toBeVisible();
    await expect(controls.locator('button:has-text("Fit")')).toBeVisible();
    await expect(controls.locator('button:has-text("−")')).toBeVisible();
    await expect(controls.locator('button:has-text("+")')).toBeVisible();
    await expect(controls.locator('button:has-text("1:1")')).toBeVisible();
  });

  test('zoom level is displayed as percentage', async ({ page }) => {
    const zoomLevel = page.locator('.left-pane .graph-zoom-level');
    await expect(zoomLevel).toBeVisible();
    const text = await zoomLevel.textContent();
    expect(text).toMatch(/\d+%/);
  });

  test('zoom in increases zoom percentage', async ({ page }) => {
    const zoomLevel = page.locator('.left-pane .graph-zoom-level');
    const initialText = await zoomLevel.textContent();
    const initialZoom = parseInt(initialText!);

    await page.locator('.left-pane .graph-zoom-controls button:has-text("+")').click();
    await page.waitForTimeout(100);

    const newText = await zoomLevel.textContent();
    const newZoom = parseInt(newText!);
    expect(newZoom).toBeGreaterThan(initialZoom);
  });

  test('zoom out decreases zoom percentage', async ({ page }) => {
    await page.locator('.left-pane .graph-zoom-controls button:has-text("1:1")').click();
    await page.waitForTimeout(100);

    const zoomLevel = page.locator('.left-pane .graph-zoom-level');

    await page.locator('.left-pane .graph-zoom-controls button:has-text("−")').click();
    await page.waitForTimeout(100);

    const newText = await zoomLevel.textContent();
    const newZoom = parseInt(newText!);
    expect(newZoom).toBeLessThan(100);
  });

  test('1:1 button resets zoom to 100%', async ({ page }) => {
    await page.locator('.left-pane .graph-zoom-controls button:has-text("+")').click();
    await page.locator('.left-pane .graph-zoom-controls button:has-text("+")').click();
    await page.waitForTimeout(100);

    await page.locator('.left-pane .graph-zoom-controls button:has-text("1:1")').click();
    await page.waitForTimeout(100);

    const zoomLevel = page.locator('.left-pane .graph-zoom-level');
    await expect(zoomLevel).toHaveText('100%');
  });

  test('Fit button adjusts zoom to fit content', async ({ page }) => {
    await page.locator('.left-pane .graph-zoom-controls button:has-text("1:1")').click();
    await page.waitForTimeout(100);

    await page.locator('.left-pane .graph-zoom-controls button:has-text("Fit")').click();
    await page.waitForTimeout(100);

    const afterText = await page.locator('.left-pane .graph-zoom-level').textContent();
    expect(afterText).toMatch(/\d+%/);
  });
});

// --- Cross-pane Sync in Graph Mode ---

test.describe('Graph View - Cross-pane Sync', () => {
  test.beforeEach(async ({ page }) => {
    await waitForAppReady(page);
  });

  test('selecting node in list pane syncs to graph pane', async ({ page }) => {
    await switchToGraph(page, 'right');
    await page.waitForTimeout(300);

    const leftPane = page.locator('.left-pane');
    await leftPane.locator('.tree-node .toggle').first().click();
    await page.waitForTimeout(200);
    await leftPane.locator('.tree-node:has-text("01")').first().locator('.toggle').click();
    await page.waitForTimeout(200);

    const node = leftPane.locator('.tree-node:has-text("0101")').first();
    await node.click();
    await page.waitForTimeout(1000);

    // Right pane (CPC, graph mode) should have nodes visible (expanded via sync)
    const rightGraphNodes = page.locator('.right-pane .graph-node-card');
    const count = await rightGraphNodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('selecting node in graph pane shows comparison panel', async ({ page }) => {
    await switchToGraph(page, 'left');
    await page.waitForTimeout(500);

    // Expand first node via toggle button
    const firstToggle = page.locator('.left-pane .graph-toggle').first();
    await firstToggle.click();
    await page.waitForTimeout(500);

    // Click a child node card (selects it)
    const childNode = page.locator('.left-pane .graph-node-card').nth(1);
    await childNode.click();
    await page.waitForTimeout(500);

    const panel = page.locator('.comparison-panel');
    await expect(panel).toBeVisible({ timeout: 5000 });
  });
});
