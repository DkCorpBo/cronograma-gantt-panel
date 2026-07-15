import { test, expect } from '@grafana/plugin-e2e';

// Prueba 1: Verificar el mensaje cuando no hay datos disponibles
test('should display empty message in case panel data is empty', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
  // El plugin de Cronograma (Gantt) muestra este texto en español si tasks.length es 0
  await expect(panelEditPage.panel.locator).toContainText('No hay datos disponibles para mostrar.');
});

// Prueba 2: Verificar que se dibuje la estructura jerárquica cuando hay datos
test('should display Gantt structure when data is passed to the panel', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  // Navega directamente al panel de edición del panel 1 que ya tiene datos provisionados
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
  // Verifica que se muestre el texto de cabecera de la columna izquierda dentro del panel
  await expect(panelEditPage.panel.locator.getByText('Estructura Jerárquica', { exact: true })).toBeVisible();
});

// Prueba 3: Verificar que se oculte la leyenda al desactivar la opción
test('should display legend by default and hide it when option is disabled', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
  page,
  selectors,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  // Navega directamente al panel de edición del panel 1 que ya tiene datos provisionados
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });

  // Por defecto, showLegend es true y la leyenda "Actividad Iniciada" debe ser visible en el panel
  await expect(panelEditPage.panel.locator.getByText('Actividad Iniciada', { exact: true })).toBeVisible();

  // Expande/colapsa la sección de opciones y busca la opción de ocultar leyenda
  await panelEditPage.collapseSection('Leyenda y Estados');
  
  // Localizadores alternativos para soportar diferencias estructurales entre todas las versiones de Grafana
  const selectorOld = page.locator('[aria-label="Leyenda y Estados Mostrar Leyenda Superior field property editor"]').getByLabel('Toggle switch');
  const selectorNew = page.locator('[aria-label="Mostrar Leyenda Superior field property editor"]').getByLabel('Toggle switch');
  const selectorContainer = page.locator('div').filter({ has: page.locator('label', { hasText: 'Mostrar Leyenda Superior' }) }).getByLabel('Toggle switch');
  const selectorLabel = page.getByLabel('Mostrar Leyenda Superior');

  if (await selectorOld.isVisible()) {
    await selectorOld.click({ force: true });
  } else if (await selectorNew.isVisible()) {
    await selectorNew.click({ force: true });
  } else if (await selectorContainer.isVisible()) {
    await selectorContainer.click({ force: true });
  } else {
    // Si ninguno de los anteriores es visible, usamos el fallback por label nativo de Playwright
    await selectorLabel.click({ force: true });
  }

  // Después de hacer clic en el switch, la leyenda "Actividad Iniciada" debe desaparecer del panel
  await expect(panelEditPage.panel.locator.getByText('Actividad Iniciada', { exact: true })).not.toBeVisible();
});



