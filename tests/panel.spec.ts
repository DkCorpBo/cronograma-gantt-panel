import { test, expect } from '@grafana/plugin-e2e';

// Test 1: Verify the message shown when no data is available
test('should display empty message in case panel data is empty', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
  // The Hierarchical Gantt Schedule plugin displays this text in English when tasks.length is 0
  await expect(panelEditPage.panel.locator).toContainText('No data available to display.');
});

// Test 2: Verify that the hierarchical structure is rendered when data is present
test('should display Gantt structure when data is passed to the panel', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  // Navigate to the edit page of panel 1 (contains provisioned test data)
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
  // Verify that the left-hand label column header is visible
  await expect(panelEditPage.panel.locator.getByText('Hierarchical Structure', { exact: true })).toBeVisible();
});

// Test 3: Verify that the legend is hidden when the option is disabled
test('should hide legend when showLegend option is disabled', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  // Navigate to the edit page of panel 3 (has legend disabled in options)
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '3' });

  // Since showLegend option is set to false, "Activity In Progress" should not be visible
  await expect(panelEditPage.panel.locator.getByText('Activity In Progress', { exact: true })).not.toBeVisible();
});
