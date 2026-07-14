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
  panelEditPage,
  readProvisionedDataSource,
  page,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Cronograma (Gantt)');
  // Verifica que se muestre el texto de cabecera de la columna izquierda
  await expect(page.getByText('Estructura Jerárquica')).toBeVisible();
});

// Prueba 3: Verificar que se oculte la leyenda al desactivar la opción
test('should display legend by default and hide it when option is disabled', async ({
  panelEditPage,
  readProvisionedDataSource,
  page,
  selectors,
}) => {
  const ds = await readProvisionedDataSource({ fileName: 'datasources.yml' });
  await panelEditPage.datasource.set(ds.name);
  await panelEditPage.setVisualization('Cronograma (Gantt)');

  // Por defecto, showLegend es true y la leyenda "Actividad Iniciada" debe ser visible
  await expect(page.getByText('Actividad Iniciada')).toBeVisible();

  // Expande/colapsa la sección de opciones y busca la opción de ocultar leyenda
  await panelEditPage.collapseSection('Leyenda y Estados');
  const showLegendField = panelEditPage.getByGrafanaSelector(
    selectors.components.PanelEditor.OptionsPane.fieldLabel('Leyenda y Estados Mostrar Leyenda Superior')
  );
  const toggle = showLegendField.getByLabel('Toggle switch');
  await toggle.click();

  // Después de hacer clic en el switch, la leyenda "Actividad Iniciada" debe desaparecer
  await expect(page.getByText('Actividad Iniciada')).not.toBeVisible();
});

