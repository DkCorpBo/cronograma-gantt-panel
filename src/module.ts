import { PanelPlugin } from '@grafana/data';
import { CronogramaOptions } from './types';
import { CronogramaPanel } from './components/CronogramaPanel';
import { FieldNamesMultiSelectEditor } from './components/FieldNamesMultiSelectEditor';

// Registro oficial del plugin de panel en Grafana
export const plugin = new PanelPlugin<CronogramaOptions>(CronogramaPanel)
  .useFieldConfig()
  .setPanelOptions((builder) => {
    return builder
      // --- Grupo 1: Mapeo de Datos (Columnas SQL) ---
      .addFieldNamePicker({
        path: 'idField',
        name: 'Columna de Nombre (Actividad)',
        description: 'Columna que contiene el nombre de la actividad o tarea individual.',
        defaultValue: 'name',
        category: ['Mapeo de Datos'],
      })
      .addFieldNamePicker({
        path: 'startTimeField',
        name: 'Columna de Fecha de Inicio',
        description: 'Columna con la fecha y hora de inicio de las tareas.',
        defaultValue: 'start_time',
        category: ['Mapeo de Datos'],
      })
      .addFieldNamePicker({
        path: 'endTimeField',
        name: 'Columna de Fecha de Fin',
        description: 'Columna con la fecha y hora de fin de las tareas.',
        defaultValue: 'end_time',
        category: ['Mapeo de Datos'],
      })
      .addFieldNamePicker({
        path: 'categoryField',
        name: 'Columna de Proyecto',
        description: 'Columna que define el proyecto (agrupación final que contiene las actividades).',
        defaultValue: 'category',
        category: ['Mapeo de Datos'],
      })
      .addFieldNamePicker({
        path: 'progressField',
        name: 'Columna de Progreso (Opcional)',
        description: 'Columna de avance. Admite valores decimales (0 a 1) o porcentajes (0 a 100).',
        defaultValue: 'progress',
        category: ['Mapeo de Datos'],
      })
      .addFieldNamePicker({
        path: 'colorField',
        name: 'Columna de Color (Opcional)',
        description: 'Columna que contiene el color de cada barra en formato hexadecimal o CSS.',
        defaultValue: 'color',
        category: ['Mapeo de Datos'],
      })

      // --- Grupo 2: Agrupación Jerárquica Multivel ---
      .addCustomEditor({
        id: 'groupByFields',
        path: 'groupByFields',
        name: 'Agrupar por (Columnas en Cascada)',
        description: 'Selecciona las columnas por las cuales agrupar. El orden de selección define los niveles jerárquicos (ej: Gerencia, Equipo).',
        editor: FieldNamesMultiSelectEditor,
        defaultValue: [],
        category: ['Agrupación Jerárquica'],
      })

      // --- Grupo 3: Personalización del Tooltip ---
      .addTextInput({
        path: 'tooltipFields',
        name: 'Campos Extra en Tooltip (separados por coma)',
        description: 'Nombres de columnas adicionales de la consulta SQL a visualizar en el tooltip detallado (ej: estado, CodEquipo, Gerencia_Area).',
        defaultValue: 'estado',
        category: ['Configuración de Tooltip'],
      })

      // --- Grupo 4: Leyenda y Colores por Estado ---
      .addBooleanSwitch({
        path: 'showLegend',
        name: 'Mostrar Leyenda Superior',
        description: 'Habilita o deshabilita la barra de la leyenda en la parte superior del panel.',
        defaultValue: true,
        category: ['Leyenda y Estados'],
      })
      .addColorPicker({
        path: 'projectColor',
        name: 'Color de Proyectos (Resumen)',
        description: 'Color asignado a las barras de resumen de los proyectos (ej: Naranja).',
        defaultValue: '#E65100',
        category: ['Leyenda y Estados'],
      })
      .addColorPicker({
        path: 'actIniciadaColor',
        name: 'Color de Actividad Iniciada',
        description: 'Color asignado a actividades en estado "Iniciada" / "En Progreso" (ej: Verde).',
        defaultValue: '#2E7D32',
        category: ['Leyenda y Estados'],
      })
      .addColorPicker({
        path: 'actFinalizadaColor',
        name: 'Color de Actividad Finalizada',
        description: 'Color asignado a actividades en estado "Finalizada" / "Completado" (ej: Azul).',
        defaultValue: '#1565C0',
        category: ['Leyenda y Estados'],
      })
      .addColorPicker({
        path: 'actCreadaColor',
        name: 'Color de Actividad Creada',
        description: 'Color asignado a actividades en estado "Creada" / "Pendiente" / "Nueva" (ej: Amarillo/Dorado).',
        defaultValue: '#D4AF37',
        category: ['Leyenda y Estados'],
      })

      // --- Grupo 5: Diseño y Estilo del Panel ---
      .addNumberInput({
        path: 'labelWidth',
        name: 'Ancho de Columna de Etiquetas (px)',
        description: 'Ancho en píxeles de la columna de estructura jerárquica de la izquierda.',
        defaultValue: 240,
        category: ['Diseño y Estilo'],
      })
      .addNumberInput({
        path: 'barHeight',
        name: 'Altura de Barra (px)',
        description: 'Grosor de la barra de la tarea en píxeles.',
        defaultValue: 32,
        category: ['Diseño y Estilo'],
      })
      .addNumberInput({
        path: 'rowSpacing',
        name: 'Espaciado de Fila (px)',
        description: 'Margen vertical de separación entre filas.',
        defaultValue: 10,
        category: ['Diseño y Estilo'],
      })
      .addNumberInput({
        path: 'activityFontSize',
        name: 'Tamaño de Letra en Actividades (px)',
        description: 'Tamaño de fuente para las etiquetas dentro de las barras de actividad.',
        defaultValue: 10,
        category: ['Diseño y Estilo'],
      })
      .addNumberInput({
        path: 'projectFontSize',
        name: 'Tamaño de Letra en Proyectos (px)',
        description: 'Tamaño de fuente para las etiquetas dentro de las barras de resumen de proyecto.',
        defaultValue: 11,
        category: ['Diseño y Estilo'],
      })
      .addColorPicker({
        path: 'defaultBarColor',
        name: 'Color por Defecto',
        description: 'Color predeterminado si el registro no define un color o estado específico.',
        defaultValue: '#3B82F6',
        category: ['Diseño y Estilo'],
      });
  });
