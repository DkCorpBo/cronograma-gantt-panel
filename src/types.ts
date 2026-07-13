// Interfaz que define las opciones de configuración del panel de cronograma
export interface CronogramaOptions {
  // --- Mapeo de Campos del DataFrame ---
  idField: string;
  startTimeField: string;
  endTimeField: string;
  categoryField: string;
  progressField: string;
  colorField: string;

  // --- Agrupación Jerárquica Multivel ---
  groupByFields: string[]; // Arreglo de columnas seleccionadas por orden de nivel

  // --- Campos Dinámicos para el Tooltip ---
  tooltipFields: string; // Columnas a mostrar separadas por coma (ej: estado, CodEquipo)

  // --- Leyenda y Colores de Estado ---
  showLegend: boolean; // Mostrar u ocultar la barra de leyenda superior
  projectColor: string; // Color para los proyectos (resúmenes)
  actIniciadaColor: string; // Color para actividades en estado 'Iniciada' / 'En Progreso'
  actFinalizadaColor: string; // Color para actividades en estado 'Finalizada' / 'Completado'
  actCreadaColor: string; // Color para actividades en estado 'Creada' / 'Pendiente'

  // --- Opciones de Estilo y Visualización ---
  barHeight: number;
  rowSpacing: number;
  defaultBarColor: string;
  timeResolution: 'auto' | 'hours' | 'days' | 'weeks';
  labelWidth: number;
  
  // --- Tamaños de Letras dentro de las Barras ---
  activityFontSize: number; // Tamaño de letra de las actividades en px
  projectFontSize: number;  // Tamaño de letra de los proyectos en px
}
