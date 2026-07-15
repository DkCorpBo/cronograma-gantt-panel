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

// Prueba 3: Verificar que se oculte la leyenda cuando la opción está desactivada de forma predeterminada
test('should hide legend when showLegend option is disabled', async ({
  gotoPanelEditPage,
  readProvisionedDashboard,
}) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  // Navega directamente al panel de edición del panel 3 que tiene la leyenda desactivada
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '3' });

  // Como la opción showLegend está configurada en false, la leyenda "Actividad Iniciada" no debe ser visible
  await expect(panelEditPage.panel.locator.getByText('Actividad Iniciada', { exact: true })).not.toBeVisible();
});



