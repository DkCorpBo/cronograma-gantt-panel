import React, { useState, useEffect, useMemo, useRef } from 'react';
import { PanelProps, dateTimeFormat, LinkModel } from '@grafana/data';
import { CronogramaOptions } from '../types';
import { useTheme2 } from '@grafana/ui';

// Interfaz para representar un evento parseado listo para procesar
interface TaskItem {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  category: string;
  groupByValues: string[]; // Valores ordenados para cada nivel de agrupación jerárquica
  progress: number;
  color: string;
  estado: string;        // Estado/Status de la actividad
  rowIndex: number;     // Índice del registro en el DataFrame original
  frameIndex: number;    // Índice del DataFrame de la serie de datos
}

// Nodo del árbol de agrupación jerárquica
interface TreeNode {
  label: string;
  key: string;
  level: number;
  children: Map<string, TreeNode>;
  tasks: TaskItem[];
}

// Interfaz para cada fila visible en el árbol colapsable
interface TreeRow {
  type: 'group' | 'project' | 'activity';
  label: string;
  key: string;
  indent: number;
  task?: TaskItem;
}

export const CronogramaPanel: React.FC<PanelProps<CronogramaOptions>> = ({
  data,
  options,
  width,
  height,
  timeRange,
}) => {
  const theme = useTheme2();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);

  // Opciones con valores por defecto
  const {
    idField = 'name',
    startTimeField = 'start_time',
    endTimeField = 'end_time',
    categoryField = 'category',
    groupByFields = [],
    tooltipFields = 'estado',
    progressField = 'progress',
    colorField = 'color',
    barHeight = 32,
    rowSpacing = 10,
    defaultBarColor = '#3B82F6',
    labelWidth = 240,
    showLegend = true,
    projectColor = '#E65100',
    actIniciadaColor = '#2E7D32',
    actFinalizadaColor = '#1565C0',
    actCreadaColor = '#D4AF37',
    activityFontSize = 10,
    projectFontSize = 11,
  } = options;

  // Función segura para resolver colores con nombre nativos de Grafana (ej: semi-dark-green)
  const resolveColor = useMemo(() => {
    return (c: string): string => {
      if (!c) {
        return defaultBarColor;
      }
      try {
        return theme.visualization.getColorByName(c);
      } catch (err) {
        return c; // Si falla, retorna el valor original (ej: HEX plano)
      }
    };
  }, [theme, defaultBarColor]);

  // Colores resueltos para su uso en renderizado
  const resolvedProjectColor = useMemo(() => resolveColor(projectColor), [projectColor, resolveColor]);
  const resolvedActIniciadaColor = useMemo(() => resolveColor(actIniciadaColor), [actIniciadaColor, resolveColor]);
  const resolvedActFinalizadaColor = useMemo(() => resolveColor(actFinalizadaColor), [actFinalizadaColor, resolveColor]);
  const resolvedActCreadaColor = useMemo(() => resolveColor(actCreadaColor), [actCreadaColor, resolveColor]);

  // Las columnas de agrupación se mapean directamente desde el arreglo seleccionado por el usuario
  const groupColumns = useMemo(() => {
    return (groupByFields || []).filter(Boolean);
  }, [groupByFields]);

  // Lista completa de campos jerárquicos (los niveles superiores seguidos de la columna del Proyecto)
  const hierarchyFields = useMemo(() => {
    return [...groupColumns, categoryField];
  }, [groupColumns, categoryField]);

  // Estado local para el rango de tiempo visible
  const [viewRange, setViewRange] = useState({
    from: timeRange.from.valueOf(),
    to: timeRange.to.valueOf(),
  });

  // Estado para nodos colapsados
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  // Temporizador interno para actualizar la línea de tiempo "Ahora" en tiempo real
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Sincronizar el rango temporal global de Grafana
  useEffect(() => {
    setViewRange({
      from: timeRange.from.valueOf(),
      to: timeRange.to.valueOf(),
    });
  }, [timeRange.from, timeRange.to]);

  // Estados para arrastrar (Pan con mouse)
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartRange, setDragStartRange] = useState({ from: 0, to: 0 });

  // Estados para el tooltip de Hover (Simple y Ligero)
  const [hoveredTask, setHoveredTask] = useState<TaskItem | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  // Estados para el tooltip de Clic (Fijo / Detallado)
  const [pinnedTask, setPinnedTask] = useState<TaskItem | null>(null);
  const [pinnedPos, setPinnedPos] = useState({ x: 0, y: 0 });
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Función segura para leer datos de columnas
  const getValue = (field: any, index: number) => {
    if (!field || !field.values) {
      return null;
    }
    return typeof field.values.get === 'function' ? field.values.get(index) : field.values[index];
  };

  // 1. Parseo de los datos del DataFrame de Grafana
  const tasks = useMemo<TaskItem[]>(() => {
    const parsedTasks: TaskItem[] = [];
    if (!data.series || data.series.length === 0) {
      return parsedTasks;
    }

    data.series.forEach((frame, frameIndex) => {
      const length = frame.length || 0;
      if (length === 0) {
        return;
      }

      const idCol = frame.fields.find((f) => f.name === idField);
      const startCol = frame.fields.find((f) => f.name === startTimeField);
      const endCol = frame.fields.find((f) => f.name === endTimeField);
      const progressCol = frame.fields.find((f) => f.name === progressField);
      const estadoCol = frame.fields.find((f) => f.name.toLowerCase() === 'estado' || f.name.toLowerCase() === 'status');

      const hierarchyCols = hierarchyFields.map((fName) => frame.fields.find((f) => f.name === fName));

      if (!startCol || !endCol) {
        return;
      }

      for (let i = 0; i < length; i++) {
        const startVal = getValue(startCol, i);
        const endVal = getValue(endCol, i);

        if (startVal == null || endVal == null) {
          continue;
        }

        const startTime = new Date(startVal).getTime();
        const endTime = new Date(endVal).getTime();

        if (isNaN(startTime) || isNaN(endTime)) {
          continue;
        }

        const name = idCol ? String(getValue(idCol, i) ?? '') : `Tarea ${i}`;
        const estado = estadoCol ? String(getValue(estadoCol, i) ?? '') : '';

        const groupByValues = hierarchyFields.map((fName, colIdx) => {
          const col = hierarchyCols[colIdx];
          return col ? String(getValue(col, i) ?? `Sin ${fName}`) : `Sin ${fName}`;
        });

        const category = groupByValues[groupByValues.length - 1];

        let progress = 0;
        if (progressCol) {
          const pVal = getValue(progressCol, i);
          if (typeof pVal === 'number') {
            progress = pVal > 1 ? pVal / 100 : pVal;
          }
        }

        // --- Value Mapping e Integración de Color por Estado o Datos ---
        let color = '';
        const colorCol = frame.fields.find((f) => f.name === colorField);
        if (colorCol) {
          const colorVal = getValue(colorCol, i);
          if (colorVal) {
            color = String(colorVal);
          }
        }

        // Si no hay color directo, intentamos leer Value Mappings nativos de Grafana
        if (!color) {
          const candidateNames = ['Estado', 'estado', 'status', 'Status', idField];
          for (const cName of candidateNames) {
            const field = frame.fields.find((f) => f.name === cName);
            if (field && field.display) {
              const val = getValue(field, i);
              const displayVal = field.display(val);
              if (displayVal && displayVal.color) {
                color = displayVal.color;
                break;
              }
            }
          }
        }

        // Si sigue sin color, aplicamos lógica de color automático en base al campo "Estado"
        if (!color && estado) {
          const estLower = estado.toLowerCase();
          if (estLower.includes('iniciada') || estLower.includes('progreso') || estLower.includes('iniciado')) {
            color = resolvedActIniciadaColor;
          } else if (estLower.includes('finalizada') || estLower.includes('completado') || estLower.includes('completada') || estLower.includes('finalizado')) {
            color = resolvedActFinalizadaColor;
          } else if (estLower.includes('creada') || estLower.includes('pendiente') || estLower.includes('creado') || estLower.includes('nueva') || estLower.includes('nuevo')) {
            color = resolvedActCreadaColor;
          }
        }

        // Color por defecto fallback (resuelto)
        if (!color) {
          color = resolveColor(defaultBarColor);
        } else {
          color = resolveColor(color);
        }

        parsedTasks.push({
          id: `${frame.refId ?? 'A'}_${i}`,
          name,
          startTime,
          endTime,
          category,
          groupByValues,
          progress,
          color,
          estado,
          rowIndex: i,
          frameIndex,
        });
      }
    });

    return parsedTasks;
  }, [
    data.series,
    idField,
    startTimeField,
    endTimeField,
    colorField,
    progressField,
    defaultBarColor,
    hierarchyFields,
    resolvedActIniciadaColor,
    resolvedActFinalizadaColor,
    resolvedActCreadaColor,
    resolveColor,
  ]);

  // Dimensiones
  const legendHeight = showLegend ? 35 : 0;
  const controlsHeight = 40;
  const timelineHeaderHeight = 35;
  const timelineWidth = Math.max(width - labelWidth - 25, 200);
  const rowHeight = barHeight + rowSpacing * 2;
  const containerHeight = height - controlsHeight - timelineHeaderHeight - legendHeight;

  // Convertir timestamp a coordenada X
  const getX = (time: number) => {
    const ratio = (time - viewRange.from) / (viewRange.to - viewRange.from);
    return ratio * timelineWidth;
  };

  // 2. Obtener los Data Links nativos para Proyectos y Actividades
  const getProjectLinks = (task: TaskItem): LinkModel[] => {
    const frame = data.series[task.frameIndex];
    const categoryCol = frame?.fields.find((f) => f.name === categoryField);
    return categoryCol && categoryCol.getLinks ? categoryCol.getLinks({ valueRowIndex: task.rowIndex }) : [];
  };

  const getActivityLinks = (task: TaskItem): LinkModel[] => {
    const frame = data.series[task.frameIndex];
    const idCol = frame?.fields.find((f) => f.name === idField);
    return idCol && idCol.getLinks ? idCol.getLinks({ valueRowIndex: task.rowIndex }) : [];
  };

  // 3. Agrupamiento en estructura de árbol y cálculo de rangos de tiempo
  const { treeRoot, nodeSpans } = useMemo(() => {
    const root: Map<string, TreeNode> = new Map();
    const spans: Record<string, { start: number; end: number; tasks: TaskItem[] }> = {};

    tasks.forEach((task) => {
      let currentMap = root;
      let pathPrefix = '';

      for (let depth = 0; depth < hierarchyFields.length; depth++) {
        const fieldName = hierarchyFields[depth];
        const value = task.groupByValues[depth] || `Sin ${fieldName}`;
        pathPrefix = pathPrefix ? `${pathPrefix}|${depth}:${value}` : `${depth}:${value}`;

        if (!spans[pathPrefix]) {
          spans[pathPrefix] = { start: task.startTime, end: task.endTime, tasks: [task] };
        } else {
          spans[pathPrefix].start = Math.min(spans[pathPrefix].start, task.startTime);
          spans[pathPrefix].end = Math.max(spans[pathPrefix].end, task.endTime);
          spans[pathPrefix].tasks.push(task);
        }

        if (!currentMap.has(value)) {
          currentMap.set(value, {
            label: value,
            key: pathPrefix,
            level: depth,
            children: new Map(),
            tasks: [],
          });
        }

        const node = currentMap.get(value)!;
        if (depth === hierarchyFields.length - 1) {
          node.tasks.push(task);
        }

        currentMap = node.children;
      }
    });

    return { treeRoot: root, nodeSpans: spans };
  }, [tasks, hierarchyFields]);

  // 4. Aplanar el árbol jerárquico
  const visibleRows = useMemo<TreeRow[]>(() => {
    const rows: TreeRow[] = [];

    const traverse = (nodesMap: Map<string, TreeNode>, indent: number) => {
      Array.from(nodesMap.keys())
        .sort()
        .forEach((label) => {
          const node = nodesMap.get(label)!;
          const isCollapsed = collapsedNodes[node.key];
          const isProject = node.level === hierarchyFields.length - 1;
          const type = isProject ? 'project' : 'group';

          const repTask = node.tasks[0] || (nodeSpans[node.key]?.tasks[0]);

          rows.push({
            type,
            label: node.label,
            key: node.key,
            indent,
            task: repTask,
          });

          if (!isCollapsed) {
            if (isProject) {
              const sortedTasks = [...node.tasks].sort((a, b) => a.startTime - b.startTime);
              sortedTasks.forEach((act) => {
                const actKey = `${node.key}|a:${act.id}`;
                rows.push({
                  type: 'activity',
                  label: act.name,
                  key: actKey,
                  indent: indent + 1,
                  task: act,
                });
              });
            } else {
              traverse(node.children, indent + 1);
            }
          }
        });
    };

    traverse(treeRoot, 0);
    return rows;
  }, [treeRoot, collapsedNodes, hierarchyFields, nodeSpans]);

  const svgHeight = visibleRows.length * rowHeight;

  // Colapsar / Expandir nodos
  const toggleCollapse = (key: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 5. Zoom con Rueda del Mouse (Wheel Zoom) centrado en el cursor
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) {
      return;
    }

    const handleWheelZoom = (e: WheelEvent) => {
      e.preventDefault();

      const factor = e.deltaY > 0 ? 1.15 : 0.85;
      const rect = svgEl.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseRatio = Math.max(0, Math.min(1, mouseX / timelineWidth));

      setViewRange((prev) => {
        const duration = prev.to - prev.from;
        const mouseTime = prev.from + mouseRatio * duration;
        const newDuration = duration * factor;

        return {
          from: mouseTime - mouseRatio * newDuration,
          to: mouseTime + (1 - mouseRatio) * newDuration,
        };
      });
    };

    svgEl.addEventListener('wheel', handleWheelZoom, { passive: false });
    return () => {
      svgEl.removeEventListener('wheel', handleWheelZoom);
    };
  }, [timelineWidth]);

  // 6. Arrastre horizontal (Pan por Mouse Drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) {
      return;
    }
    setIsDragging(true);
    setDragStartX(e.clientX);
    setDragStartRange({ from: viewRange.from, to: viewRange.to });
    e.preventDefault();
  };

  const handleMouseMoveContainer = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const duration = dragStartRange.to - dragStartRange.from;
      const timeOffset = -(deltaX / timelineWidth) * duration;

      setViewRange({
        from: dragStartRange.from + timeOffset,
        to: dragStartRange.to + timeOffset,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Controladores de hover de tooltip de Hover (Simple)
  const handleBarMouseEnter = (e: React.MouseEvent, task: TaskItem) => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setHoveredTask(task);
    setShowTooltip(true);
    updateTooltipPos(e);
  };

  const handleBarMouseLeave = () => {
    tooltipTimeoutRef.current = window.setTimeout(() => {
      setShowTooltip(false);
      setHoveredTask(null);
    }, 150);
  };

  // Posicionamiento de ambos Tooltips (Hover y Click Pinned)
  const updateTooltipPos = (e: React.MouseEvent) => {
    if (!containerRef.current) {
      return;
    }
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 1. Posición del Tooltip Fijo/Detallado (calculado al hacer click)
    const tooltipWidth = 255;
    const tooltipHeight = 175;
    let px = mouseX + 15;
    let py = mouseY - 90;

    if (px + tooltipWidth > rect.width) {
      px = mouseX - tooltipWidth - 15;
    }
    if (py < 0) {
      py = mouseY + 15;
    } else if (py + tooltipHeight > rect.height) {
      py = rect.height - tooltipHeight - 15;
    }
    setTooltipPos({ x: px, y: py });

    // 2. Posición del Tooltip de Hover (Ligero, sigue al cursor de cerca)
    let hx = mouseX + 12;
    let hy = mouseY + 15;
    if (hx + 180 > rect.width) {
      hx = mouseX - 190;
    }
    if (hy + 25 > rect.height) {
      hy = mouseY - 30;
    }
    setHoverPos({ x: hx, y: hy });
  };

  // Controlador de Clic en barras y carpetas (Fijar Tooltip)
  const handleElementClick = (task: TaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pinnedTask && pinnedTask.id === task.id) {
      setPinnedTask(null);
    } else {
      setPinnedTask(task);
      setPinnedPos({
        x: tooltipPos.x,
        y: tooltipPos.y,
      });
    }
  };

  const handleReset = () => {
    setViewRange({
      from: timeRange.from.valueOf(),
      to: timeRange.to.valueOf(),
    });
  };

  const handleZoomBtn = (factor: number) => {
    const duration = viewRange.to - viewRange.from;
    const center = viewRange.from + duration / 2;
    const newDuration = duration * factor;

    setViewRange({
      from: center - newDuration / 2,
      to: center + newDuration / 2,
    });
  };

  const handlePanBtn = (direction: number) => {
    const duration = viewRange.to - viewRange.from;
    const shift = duration * 0.2 * direction;

    setViewRange({
      from: viewRange.from + shift,
      to: viewRange.to + shift,
    });
  };

  // Rejilla de tiempos adaptativa
  const timeTicks = useMemo(() => {
    const ticks: Array<{ timestamp: number; label: string }> = [];
    const duration = viewRange.to - viewRange.from;
    const tickCount = 6;

    let interval = duration / tickCount;
    if (interval < 60 * 1000 * 15) {
      interval = 60 * 1000 * 15;
    } else if (interval < 3600 * 1000) {
      interval = 3600 * 1000;
    } else if (interval < 3600 * 1000 * 6) {
      interval = 3600 * 1000 * 6;
    } else if (interval < 3600 * 1000 * 24) {
      interval = 3600 * 1000 * 24;
    } else if (interval < 3600 * 1000 * 24 * 7) {
      interval = 3600 * 1000 * 24 * 7;
    }

    const startTick = Math.ceil(viewRange.from / interval) * interval;
    for (let t = startTick; t < viewRange.to; t += interval) {
      let format = 'HH:mm';
      if (interval >= 3600 * 1000 * 24 * 7) {
        format = 'DD MMM YYYY';
      } else if (interval >= 3600 * 1000 * 24) {
        format = 'DD MMM HH:mm';
      } else if (interval >= 3600 * 1000 * 6) {
        format = 'DD MMM HH:mm';
      }

      ticks.push({
        timestamp: t,
        label: dateTimeFormat(t, { format }),
      });
    }

    return ticks;
  }, [viewRange.from, viewRange.to]);

  const formatDuration = (ms: number) => {
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));

    const parts = [];
    if (days > 0) {
      parts.push(`${days}d`);
    }
    if (hours > 0) {
      parts.push(`${hours}h`);
    }
    if (minutes > 0 || parts.length === 0) {
      parts.push(`${minutes}m`);
    }
    return parts.join(' ');
  };

  const showNowLine = currentTime >= viewRange.from && currentTime <= viewRange.to;
  const nowX = getX(currentTime);

  // Ajustes de labels responsive basados en el ancho del panel
  const isCompact = width < 600;

  // Cálculo del padding superior para centrar la primera línea de texto de forma estática
  const actPaddingTop = useMemo(() => {
    // La altura del contenedor del texto en la actividad es barHeight - 6
    const textHeight = activityFontSize * 1.2;
    return Math.max(0, (barHeight - 6 - textHeight) / 2);
  }, [barHeight, activityFontSize]);

  const projPaddingTop = useMemo(() => {
    // La altura de la barra del proyecto es fija en 20px, y el contenedor tiene summaryBarHeight - 2 = 18px
    const textHeight = projectFontSize * 1.2;
    return Math.max(0, (18 - textHeight) / 2);
  }, [projectFontSize]);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.background.primary,
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily,
        position: 'relative',
        userSelect: isDragging ? 'none' : 'auto',
        boxSizing: 'border-box',
      }}
      onClick={() => {
        setPinnedTask(null);
      }}
      onMouseMove={handleMouseMoveContainer}
      onMouseUp={handleMouseUp}
    >
      {/* Definición de estilos globales para hover de enlaces estilo Grafana oficial */}
      <style>{`
        .cronograma-label-link {
          text-decoration: none !important;
          transition: color 0.15s ease, text-decoration 0.15s ease;
        }
        .cronograma-label-link:hover {
          text-decoration: underline !important;
          color: ${theme.colors.text.link} !important;
        }
      `}</style>

      {/* 1. Barra de Controles Responsive */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: `${controlsHeight}px`,
          padding: '0 8px',
          borderBottom: `1px solid ${theme.colors.border.weak}`,
          backgroundColor: theme.colors.background.secondary,
          boxSizing: 'border-box',
        }}
      >
        <button onClick={() => handleZoomBtn(0.8)} style={buttonStyle(theme)} title="Acercar Rango Temporal">
          {isCompact ? '➕' : '➕ Acercar'}
        </button>
        <button onClick={() => handleZoomBtn(1.2)} style={buttonStyle(theme)} title="Alejar Rango Temporal">
          {isCompact ? '➖' : '➖ Alejar'}
        </button>
        <button onClick={() => handlePanBtn(-1)} style={buttonStyle(theme)} title="Desplazar a la Izquierda">
          {isCompact ? '⬅️' : '⬅️ Izquierda'}
        </button>
        <button onClick={() => handlePanBtn(1)} style={buttonStyle(theme)} title="Desplazar a la Derecha">
          {isCompact ? '➡️' : '➡️ Derecha'}
        </button>
        {width >= 800 && (
          <div style={{ fontSize: '11px', color: theme.colors.text.secondary, marginLeft: '12px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            💡 <em>Tip: Clic en barras abre detalles. Arrastra para mover el tiempo, y haz zoom con la rueda.</em>
          </div>
        )}
        <button onClick={handleReset} style={{ ...buttonStyle(theme), marginLeft: 'auto' }} title="Restablecer rango temporal inicial">
          {isCompact ? '🔄' : '🔄 Restablecer Rango'}
        </button>
      </div>

      {/* 2. Barra de Leyenda Dinámica de Estados */}
      {showLegend && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '24px',
            height: `${legendHeight}px`,
            borderBottom: `1px solid ${theme.colors.border.weak}`,
            backgroundColor: theme.colors.background.secondary,
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: resolvedProjectColor }} />
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: theme.colors.text.primary }}>Proyecto</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: resolvedActIniciadaColor }} />
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: theme.colors.text.primary }}>Actividad Iniciada</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: resolvedActFinalizadaColor }} />
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: theme.colors.text.primary }}>Actividad Finalizada</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '14px', height: '14px', borderRadius: '4px', backgroundColor: resolvedActCreadaColor }} />
            <span style={{ fontSize: '11px', fontWeight: 'bold', color: theme.colors.text.primary }}>Actividad Creada</span>
          </div>
        </div>
      )}

      {/* 3. Cabecera Temporal Superior */}
      <div
        style={{
          display: 'flex',
          height: `${timelineHeaderHeight}px`,
          borderBottom: `2px solid ${theme.colors.border.strong}`,
          backgroundColor: theme.colors.background.secondary,
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: `${labelWidth}px`,
            borderRight: `2px solid ${theme.colors.border.strong}`,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '12px',
            fontSize: '12px',
            fontWeight: 'bold',
            color: theme.colors.text.secondary,
            boxSizing: 'border-box',
          }}
        >
          Estructura Jerárquica
        </div>
        <div style={{ position: 'relative', flex: 1, height: '100%' }}>
          {timeTicks.map((tick, idx) => {
            const x = getX(tick.timestamp);
            if (x < 0 || x > timelineWidth) {
              return null;
            }
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: '0',
                  transform: 'translateX(-50%)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '11px',
                  color: theme.colors.text.secondary,
                }}
              >
                <span style={{ color: theme.colors.text.secondary }}>{tick.label}</span>
                <div style={{ width: '1px', height: '5px', backgroundColor: theme.colors.border.strong, marginTop: '2px' }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Área Principal (Alineación vertical perfecta mediante altura explícita de filas en ambas columnas) */}
      {tasks.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: theme.colors.text.disabled, fontSize: '14px' }}>
          No hay datos disponibles para mostrar.
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            height: `${containerHeight}px`,
            overflowY: 'auto',
          }}
        >
          {/* Columna Izquierda: Etiquetas Fijas (Alineación garantizada con height: svgHeight) */}
          <div
            style={{
              width: `${labelWidth}px`,
              borderRight: `2px solid ${theme.colors.border.strong}`,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: theme.colors.background.secondary,
              boxSizing: 'border-box',
              height: `${svgHeight}px`, // Fuerza a que la columna ocupe la altura total real, habilitando scroll síncrono
            }}
          >
            {visibleRows.map((row, idx) => {
              const isCollapsed = collapsedNodes[row.key];
              const isHeader = row.type !== 'activity';

              let labelLinks: LinkModel[] = [];
              if (row.task) {
                if (row.type === 'project') {
                  labelLinks = getProjectLinks(row.task);
                } else if (row.type === 'activity') {
                  labelLinks = getActivityLinks(row.task);
                }
              }
              const hasLinkLabel = labelLinks.length > 0;

              return (
                <div
                  key={idx}
                  style={{
                    height: `${rowHeight}px`,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: `${row.indent * 18 + 8}px`,
                    fontSize: isHeader ? '13px' : '12px',
                    fontWeight: isHeader ? 'bold' : 'normal',
                    borderBottom: `1px solid ${theme.colors.border.weak}`,
                    backgroundColor: isHeader ? theme.colors.background.secondary : theme.colors.background.primary,
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    boxSizing: 'border-box',
                  }}
                >
                  {isHeader && (
                    <span
                      onClick={(e) => {
                        toggleCollapse(row.key);
                        e.stopPropagation();
                      }}
                      style={{
                        cursor: 'pointer',
                        marginRight: '6px',
                        display: 'inline-block',
                        width: '12px',
                        textAlign: 'center',
                        userSelect: 'none',
                        color: theme.colors.text.secondary,
                      }}
                    >
                      {isCollapsed ? '▶' : '▼'}
                    </span>
                  )}
                  <span
                    onClick={(e) => {
                      if (row.task) {
                        handleElementClick(row.task, e);
                      }
                    }}
                    className={hasLinkLabel ? 'cronograma-label-link' : undefined}
                    style={{
                      cursor: 'pointer',
                      color: isHeader ? theme.colors.text.primary : theme.colors.text.secondary,
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                    }}
                    title={row.label + (hasLinkLabel ? ' (Haz clic para ver detalles/enlaces)' : '')}
                  >
                    {row.type === 'group'
                      ? `📂 ${row.label}`
                      : row.type === 'project'
                      ? `📁 ${row.label}`
                      : `📄 ${row.label}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Columna Derecha: Lienzo del Cronograma SVG (Fuerza a que la columna ocupe la altura total real) */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              cursor: isDragging ? 'grabbing' : 'grab',
              boxSizing: 'border-box',
              height: `${svgHeight}px`, // Fuerza a que la columna ocupe la altura total real, habilitando scroll síncrono
            }}
            onMouseDown={handleMouseDown}
          >
            <svg
              ref={svgRef}
              width={timelineWidth}
              height={svgHeight}
              style={{
                display: 'block',
                backgroundColor: theme.colors.background.primary,
              }}
            >
              {/* Líneas horizontales de cuadrícula */}
              {visibleRows.map((_, idx) => (
                <line
                  key={`grid-row-${idx}`}
                  x1={0}
                  y1={(idx + 1) * rowHeight}
                  x2={timelineWidth}
                  y2={(idx + 1) * rowHeight}
                  stroke={theme.colors.border.weak}
                  strokeWidth={1}
                />
              ))}

              {/* Líneas verticales punteadas de cuadrícula */}
              {timeTicks.map((tick, idx) => {
                const x = getX(tick.timestamp);
                if (x < 0 || x > timelineWidth) {
                  return null;
                }
                return (
                  <line
                    key={`grid-time-${idx}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={svgHeight}
                    stroke={theme.colors.border.weak}
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                );
              })}

              {/* Renderizado de barras */}
              {visibleRows.map((row, rowIdx) => {
                // Caso 1: Fila de Actividad (Gantt Event Bar con primera línea fija y resto recortado abajo)
                if (row.type === 'activity' && row.task) {
                  const task = row.task;
                  const xStart = getX(task.startTime);
                  const xEnd = getX(task.endTime);

                  if (xEnd < 0 || xStart > timelineWidth) {
                    return null;
                  }

                  const x = Math.max(0, xStart);
                  const w = Math.min(timelineWidth, xEnd) - x;

                  if (w <= 1) {
                    return null;
                  }

                  const y = rowIdx * rowHeight + rowSpacing;

                  return (
                    <g
                      key={task.id}
                      style={{ cursor: 'pointer' }}
                      onClick={(e) => handleElementClick(task, e)}
                      onMouseEnter={(e) => handleBarMouseEnter(e, task)}
                      onMouseMove={updateTooltipPos}
                      onMouseLeave={handleBarMouseLeave}
                    >
                      {/* Fondo de la barra */}
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={barHeight}
                        rx={6}
                        ry={6}
                        fill={task.color}
                        opacity={0.3}
                      />

                      {/* Progreso de la barra */}
                      <rect
                        x={x}
                        y={y}
                        width={w * Math.min(1, task.progress > 0 ? task.progress : 0.08)}
                        height={barHeight}
                        rx={6}
                        ry={6}
                        fill={task.color}
                        opacity={0.9}
                      />

                      {/* Nombre dentro de la barra alineado arriba de forma estática */}
                      {w > 40 && (
                        <foreignObject
                          x={x + 8}
                          y={y + 3}
                          width={w - 16}
                          height={barHeight - 6}
                          style={{ pointerEvents: 'none' }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'block', // Alineación estática para que la primera línea nunca se mueva
                              paddingTop: `${actPaddingTop}px`,
                              boxSizing: 'border-box',
                              fontSize: `${activityFontSize}px`,
                              fontWeight: 600,
                              color: theme.colors.getContrastText(task.color),
                              pointerEvents: 'none',
                              userSelect: 'none',
                              WebkitFontSmoothing: 'antialiased',
                              MozOsxFontSmoothing: 'grayscale',
                              textRendering: 'optimizeLegibility',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: '100%',
                                lineHeight: '1.2',
                                wordBreak: 'break-word',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'normal',
                              }}
                            >
                              {task.name}
                            </div>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                }

                // Caso 2: Fila de Proyecto o Grupo Superior (Summary Bar de 20px, con nombre adentro)
                const span = nodeSpans[row.key];
                if (span && (row.type === 'project' || row.type === 'group')) {
                  const xStart = getX(span.start);
                  const xEnd = getX(span.end);

                  if (xEnd < 0 || xStart > timelineWidth) {
                    return null;
                  }

                  const x = Math.max(0, xStart);
                  const w = Math.min(timelineWidth, xEnd) - x;

                  if (w <= 1) {
                    return null;
                  }

                  const summaryBarHeight = 20;
                  const y = rowIdx * rowHeight + rowSpacing + (barHeight - summaryBarHeight) / 2;
                  const isProject = row.type === 'project';
                  
                  const avgProgress = span.tasks.reduce((sum, t) => sum + t.progress, 0) / span.tasks.length;
                  const summaryColor = isProject ? resolvedProjectColor : theme.colors.text.disabled;

                  const summaryTask: TaskItem = {
                    id: row.key,
                    name: `Proyecto: ${row.label}`,
                    startTime: span.start,
                    endTime: span.end,
                    category: row.label,
                    groupByValues: [],
                    progress: avgProgress,
                    color: summaryColor,
                    estado: '',
                    rowIndex: span.tasks[0]?.rowIndex ?? 0,
                    frameIndex: span.tasks[0]?.frameIndex ?? 0,
                  };

                  return (
                    <g
                      key={`summary-${row.key}`}
                      style={{ cursor: isProject ? 'pointer' : 'default' }}
                      onClick={(e) => {
                        if (isProject) {
                          handleElementClick(summaryTask, e);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (isProject) {
                          handleBarMouseEnter(e, summaryTask);
                        }
                      }}
                      onMouseMove={(e) => {
                        if (isProject) {
                          updateTooltipPos(e);
                        }
                      }}
                      onMouseLeave={handleBarMouseLeave}
                    >
                      {/* Fondo de la barra de resumen */}
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={summaryBarHeight}
                        fill={summaryColor}
                        opacity={0.15}
                        rx={4}
                      />

                      {/* Progreso promedio de los hijos */}
                      {avgProgress > 0 && (
                        <rect
                          x={x}
                          y={y}
                          width={w * Math.min(1, avgProgress)}
                          height={summaryBarHeight}
                          fill={summaryColor}
                          opacity={0.65}
                          rx={4}
                        />
                      )}

                      {/* Nombre dentro de la barra de proyecto alineado de forma estática */}
                      {w > 40 && (
                        <foreignObject
                          x={x + 8}
                          y={y + 1}
                          width={w - 16}
                          height={summaryBarHeight - 2}
                          style={{ pointerEvents: 'none' }}
                        >
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'block',
                              paddingTop: `${projPaddingTop}px`,
                              boxSizing: 'border-box',
                              fontSize: `${projectFontSize}px`,
                              fontWeight: 600,
                              color: theme.colors.getContrastText(summaryColor),
                              pointerEvents: 'none',
                              userSelect: 'none',
                              WebkitFontSmoothing: 'antialiased',
                              MozOsxFontSmoothing: 'grayscale',
                              textRendering: 'optimizeLegibility',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: '100%',
                                lineHeight: '1.2',
                                wordBreak: 'break-word',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'normal',
                              }}
                            >
                              {row.label}
                            </div>
                          </div>
                        </foreignObject>
                      )}

                      {/* Corchetes finales de Gantt */}
                      {xStart >= 0 && (
                        <polygon
                          points={`${xStart},${y} ${xStart + 8},${y} ${xStart + 4},${y + 8} ${xStart},${y}`}
                          fill={summaryColor}
                          opacity={0.9}
                        />
                      )}
                      {xEnd <= timelineWidth && (
                        <polygon
                          points={`${xEnd},${y} ${xEnd - 8},${y} ${xEnd - 4},${y + 8} ${xEnd},${y}`}
                          fill={summaryColor}
                          opacity={0.9}
                        />
                      )}
                    </g>
                  );
                }

                return null;
              })}

              {/* 7. Línea temporal "Ahora" */}
              {showNowLine && (
                <g key="now-line-group">
                  <line
                    x1={nowX}
                    y1={0}
                    x2={nowX}
                    y2={svgHeight}
                    stroke={theme.colors.error.main}
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    style={{ pointerEvents: 'none' }}
                  />
                  <polygon
                    points={`${nowX},0 ${nowX - 6},8 ${nowX + 6},8`}
                    fill={theme.colors.error.main}
                    style={{ pointerEvents: 'none' }}
                  />
                  <text
                    x={nowX + 8}
                    y={12}
                    fill={theme.colors.error.main}
                    fontSize="11px"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    Ahora
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      )}

      {/* 5. Tooltip 1: Hover Ligero (Solo Nombre) */}
      {showTooltip && hoveredTask && (!pinnedTask || pinnedTask.id !== hoveredTask.id) && (
        <div
          style={{
            position: 'absolute',
            left: `${hoverPos.x}px`,
            top: `${hoverPos.y}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: '#ffffff',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontWeight: 'bold',
            pointerEvents: 'none', // Crucial para que no bloquee clics ni arrastres
            zIndex: 9998,
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
            border: '1px solid rgba(255,255,255,0.15)',
            transition: 'left 0.05s ease-out, top 0.05s ease-out',
          }}
        >
          {hoveredTask.name}
        </div>
      )}

      {/* 6. Tooltip 2: Pinned / Fijo Detallado (Solo en Clic) */}
      {pinnedTask && (
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
          style={{
            position: 'absolute',
            left: `${pinnedPos.x}px`,
            top: `${pinnedPos.y}px`,
            backgroundColor: theme.colors.background.secondary,
            color: theme.colors.text.primary,
            border: `2px solid ${theme.colors.primary.main}`,
            borderRadius: '6px',
            padding: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 9999,
            pointerEvents: 'auto',
            fontSize: '12px',
            minWidth: '245px',
            boxSizing: 'border-box',
          }}
        >
          {/* Botón de cerrar */}
          <button
            onClick={(e) => {
              setPinnedTask(null);
              e.stopPropagation();
            }}
            style={{
              position: 'absolute',
              top: '6px',
              right: '8px',
              background: 'none',
              border: 'none',
              color: theme.colors.text.secondary,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              padding: '2px',
              outline: 'none',
            }}
            title="Cerrar detalles"
          >
            ✖
          </button>

          <div style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '6px', color: pinnedTask.color, paddingRight: '16px' }}>
            {pinnedTask.name}
          </div>
          
          {pinnedTask.id.startsWith('g:') || pinnedTask.id.startsWith('p:') ? (
            <>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: theme.colors.text.secondary }}>Tipo:</span>{' '}
                <strong style={{ color: theme.colors.text.primary }}>Resumen Acumulado</strong>
              </div>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: theme.colors.text.secondary }}>Proyecto:</span>{' '}
                <strong style={{ color: theme.colors.text.primary }}>{pinnedTask.category}</strong>
              </div>
            </>
          ) : (
            <>
              {hierarchyFields.map((fName, idx) => {
                const val = pinnedTask.groupByValues[idx];
                const isLast = idx === hierarchyFields.length - 1;
                const label = isLast ? 'Proyecto' : `Nivel ${idx + 1} (${fName})`;
                return (
                  <div key={idx} style={{ marginBottom: '4px' }}>
                    <span style={{ color: theme.colors.text.secondary }}>{label}:</span>{' '}
                    <strong style={{ color: theme.colors.text.primary }}>{val}</strong>
                  </div>
                );
              })}
            </>
          )}
          
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: theme.colors.text.secondary }}>Inicio:</span>{' '}
            <strong style={{ color: theme.colors.text.primary }}>{dateTimeFormat(pinnedTask.startTime, { format: 'YYYY-MM-DD HH:mm:ss' })}</strong>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: theme.colors.text.secondary }}>Fin:</span>{' '}
            <strong style={{ color: theme.colors.text.primary }}>{dateTimeFormat(pinnedTask.endTime, { format: 'YYYY-MM-DD HH:mm:ss' })}</strong>
          </div>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ color: theme.colors.text.secondary }}>Duración:</span>{' '}
            <strong style={{ color: theme.colors.text.primary }}>{formatDuration(pinnedTask.endTime - pinnedTask.startTime)}</strong>
          </div>
          <div style={{ marginBottom: '6px' }}>
            <span style={{ color: theme.colors.text.secondary }}>Progreso:</span>{' '}
            <strong style={{ color: theme.colors.text.primary }}>{Math.round(pinnedTask.progress * 100)}%</strong>
          </div>

          {/* Renderizado de campos extra dinámicos */}
          {(() => {
            const frame = data.series[pinnedTask.frameIndex];
            if (!frame) {
              return null;
            }

            const extraFieldNames = tooltipFields
              ? tooltipFields.split(',').map((s) => s.trim()).filter(Boolean)
              : [];

            return extraFieldNames.map((fName, idx) => {
              const field = frame.fields.find((f) => f.name.toLowerCase() === fName.toLowerCase());
              if (!field) {
                return null;
              }
              const val = getValue(field, pinnedTask.rowIndex);
              return (
                <div key={`extra-${idx}`} style={{ marginBottom: '4px' }}>
                  <span style={{ color: theme.colors.text.secondary }}>{field.name}:</span>{' '}
                  <strong style={{ color: theme.colors.text.primary }}>{String(val ?? 'N/A')}</strong>
                </div>
              );
            });
          })()}

          {/* Renderizado del Botón de Data Link */}
          {(() => {
            const isProj = pinnedTask.id.startsWith('g:') || pinnedTask.id.startsWith('p:');
            const links = isProj ? getProjectLinks(pinnedTask) : getActivityLinks(pinnedTask);
            if (links && links.length > 0) {
              const link = links[0];
              return (
                <a
                  href={link.href}
                  target={link.target}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '8px',
                    padding: '6px 12px',
                    backgroundColor: theme.colors.background.canvas,
                    border: `1px solid ${theme.colors.border.strong}`,
                    borderRadius: '4px',
                    color: theme.colors.text.link,
                    fontWeight: 'bold',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    textAlign: 'center',
                    width: '100%',
                    boxSizing: 'border-box',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.background.secondary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = theme.colors.background.canvas;
                  }}
                >
                  🔗 {link.title || (isProj ? 'Editar Proyecto' : 'Editar Actividad')}
                </a>
              );
            }
            return null;
          })()}
        </div>
      )}
    </div>
  );
};

const buttonStyle = (theme: any) => ({
  backgroundColor: theme.colors.background.secondary,
  border: `1px solid ${theme.colors.border.strong}`,
  color: theme.colors.text.primary,
  borderRadius: '4px',
  padding: '4px 10px',
  fontSize: '11px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  outline: 'none',
  transition: 'background-color 0.2s',
  fontWeight: 'bold' as any,
  height: '28px',
  whiteSpace: 'nowrap' as any,
});
