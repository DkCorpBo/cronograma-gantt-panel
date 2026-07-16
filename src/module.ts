import { PanelPlugin } from '@grafana/data';
import { CronogramaOptions } from './types';
import { CronogramaPanel } from './components/CronogramaPanel';
import { FieldNamesMultiSelectEditor } from './components/FieldNamesMultiSelectEditor';

// Official registration of the panel plugin in Grafana
export const plugin = new PanelPlugin<CronogramaOptions>(CronogramaPanel)
  .useFieldConfig()
  .setPanelOptions((builder) => {
    return builder
      // --- Group 1: Data Mapping (SQL Columns) ---
      .addFieldNamePicker({
        path: 'idField',
        name: 'Name Column (Activity)',
        description: 'Column containing the name of the individual activity or task.',
        defaultValue: 'name',
        category: ['Data Mapping'],
      })
      .addFieldNamePicker({
        path: 'startTimeField',
        name: 'Start Time Column',
        description: 'Column containing the start date and time of the tasks.',
        defaultValue: 'start_time',
        category: ['Data Mapping'],
      })
      .addFieldNamePicker({
        path: 'endTimeField',
        name: 'End Time Column',
        description: 'Column containing the end date and time of the tasks.',
        defaultValue: 'end_time',
        category: ['Data Mapping'],
      })
      .addFieldNamePicker({
        path: 'categoryField',
        name: 'Project Column',
        description: 'Column defining the project (final grouping level containing activities).',
        defaultValue: 'category',
        category: ['Data Mapping'],
      })
      .addFieldNamePicker({
        path: 'progressField',
        name: 'Progress Column (Optional)',
        description: 'Progress column. Accepts decimals (0 to 1) or percentages (0 to 100).',
        defaultValue: 'progress',
        category: ['Data Mapping'],
      })
      .addFieldNamePicker({
        path: 'colorField',
        name: 'Color Column (Optional)',
        description: 'Column containing the custom bar color in HEX or CSS format.',
        defaultValue: 'color',
        category: ['Data Mapping'],
      })

      // --- Group 2: Hierarchical Grouping ---
      .addCustomEditor({
        id: 'groupByFields',
        path: 'groupByFields',
        name: 'Group By (Cascading Columns)',
        description: 'Select the columns to group by. The selection order defines the hierarchical levels (e.g., Management, Team).',
        editor: FieldNamesMultiSelectEditor,
        defaultValue: [],
        category: ['Hierarchical Grouping'],
      })

      // --- Group 3: Tooltip Customization ---
      .addTextInput({
        path: 'tooltipFields',
        name: 'Extra Fields in Tooltip (comma-separated)',
        description: 'Names of extra columns from your SQL query to display inside the details tooltip (e.g., status, assignee, priority).',
        defaultValue: 'estado',
        category: ['Tooltip Configuration'],
      })

      // --- Group 4: Legend and Status Colors ---
      .addBooleanSwitch({
        path: 'showLegend',
        name: 'Show Top Legend',
        description: 'Enable or disable the status legend bar at the top of the panel.',
        defaultValue: true,
        category: ['Legend and Statuses'],
      })
      .addColorPicker({
        path: 'projectColor',
        name: 'Projects Color (Summary)',
        description: 'Color assigned to the summary bars of the projects (e.g., Orange).',
        defaultValue: '#E65100',
        category: ['Legend and Statuses'],
      })
      .addColorPicker({
        path: 'actIniciadaColor',
        name: 'Activity Started Color',
        description: 'Color assigned to activities in "Started" / "In Progress" status (e.g., Green).',
        defaultValue: '#2E7D32',
        category: ['Legend and Statuses'],
      })
      .addColorPicker({
        path: 'actFinalizadaColor',
        name: 'Activity Completed Color',
        description: 'Color assigned to activities in "Completed" / "Finished" status (e.g., Blue).',
        defaultValue: '#1565C0',
        category: ['Legend and Statuses'],
      })
      .addColorPicker({
        path: 'actCreadaColor',
        name: 'Activity Created Color',
        description: 'Color assigned to activities in "Created" / "Pending" status (e.g., Yellow/Gold).',
        defaultValue: '#D4AF37',
        category: ['Legend and Statuses'],
      })

      // --- Group 5: Design and Styling ---
      .addNumberInput({
        path: 'labelWidth',
        name: 'Label Column Width (px)',
        description: 'Width in pixels of the left-hand hierarchical structure column.',
        defaultValue: 240,
        category: ['Design and Styling'],
      })
      .addNumberInput({
        path: 'barHeight',
        name: 'Bar Height (px)',
        description: 'Height of the task bars in pixels.',
        defaultValue: 32,
        category: ['Design and Styling'],
      })
      .addNumberInput({
        path: 'rowSpacing',
        name: 'Row Spacing (px)',
        description: 'Vertical spacing separating the timeline rows.',
        defaultValue: 10,
        category: ['Design and Styling'],
      })
      .addNumberInput({
        path: 'activityFontSize',
        name: 'Activity Font Size (px)',
        description: 'Font size for label text inside activity bars.',
        defaultValue: 10,
        category: ['Design and Styling'],
      })
      .addNumberInput({
        path: 'projectFontSize',
        name: 'Project Font Size (px)',
        description: 'Font size for label text inside project summary bars.',
        defaultValue: 11,
        category: ['Design and Styling'],
      })
      .addColorPicker({
        path: 'defaultBarColor',
        name: 'Default Color',
        description: 'Fallback color if the database record does not specify a color or status.',
        defaultValue: '#3B82F6',
        category: ['Design and Styling'],
      });
  });
