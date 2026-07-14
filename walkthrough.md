# Guía de Pruebas - Plugin Cronograma (Gantt)

Esta guía detalla los pasos para poblar los datos de prueba y validar el funcionamiento del panel **Cronograma (Gantt)** de Grafana.

---

## 1. Estructura de la Base de Datos de Prueba

Para probar todas las características del panel (jerarquías multinivel, barra de progreso, colores de estado y leyenda), se recomienda crear una tabla de tareas con la siguiente estructura (ejemplo en SQL Server / Transact-SQL):

```sql
-- Crear tabla de ejemplo para tareas
CREATE TABLE TareasCronograma (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Actividad VARCHAR(100) NOT NULL,
    FechaInicio DATETIME NOT NULL,
    FechaFin DATETIME NOT NULL,
    Proyecto VARCHAR(100) NOT NULL,
    Gerencia VARCHAR(100) NOT NULL,
    Progreso DECIMAL(5,2) NULL, -- Valores de 0 a 100 o decimal de 0.0 a 1.0
    ColorHex VARCHAR(7) NULL,    -- Ej: '#2E7D32'
    Estado VARCHAR(50) NULL      -- 'Iniciada', 'Finalizada', 'Creada'
);
```

---

## 2. Inserción de Datos de Prueba

Ejecute el siguiente script SQL para insertar un conjunto de datos jerárquico realista (dos proyectos bajo diferentes gerencias con varias actividades):

```sql
-- Limpiar tabla e insertar datos de prueba
TRUNCATE TABLE TareasCronograma;

INSERT INTO TareasCronograma (Actividad, FechaInicio, FechaFin, Proyecto, Gerencia, Progreso, ColorHex, Estado)
VALUES
-- Proyecto Alfa (Gerencia de Operaciones)
('Diseño de Planos', DATEADD(day, -5, GETDATE()), DATEADD(day, -2, GETDATE()), 'Proyecto Alfa', 'Operaciones', 100, '#1565C0', 'Finalizada'),
('Cimentación', DATEADD(day, -2, GETDATE()), DATEADD(day, 2, GETDATE()), 'Proyecto Alfa', 'Operaciones', 45, '#2E7D32', 'Iniciada'),
('Estructura Principal', DATEADD(day, 2, GETDATE()), DATEADD(day, 7, GETDATE()), 'Proyecto Alfa', 'Operaciones', 0, '#D4AF37', 'Creada'),

-- Proyecto Beta (Gerencia de TI)
('Requerimientos', DATEADD(day, -10, GETDATE()), DATEADD(day, -6, GETDATE()), 'Proyecto Beta', 'Tecnología', 100, '#1565C0', 'Finalizada'),
('Desarrollo Backend', DATEADD(day, -5, GETDATE()), DATEADD(day, 5, GETDATE()), 'Proyecto Beta', 'Tecnología', 75, '#2E7D32', 'Iniciada'),
('Desarrollo Frontend', DATEADD(day, -1, GETDATE()), DATEADD(day, 6, GETDATE()), 'Proyecto Beta', 'Tecnología', 20, '#2E7D32', 'Iniciada'),
('Pruebas QA', DATEADD(day, 6, GETDATE()), DATEADD(day, 10, GETDATE()), 'Proyecto Beta', 'Tecnología', 0, '#D4AF37', 'Creada');
```

---

## 3. Configuración del Panel en Grafana

1. Agregue un nuevo panel de tipo **Cronograma (Gantt)** en su dashboard de Grafana.
2. Configure la consulta SQL para leer de la tabla de prueba:
   ```sql
   SELECT 
       Actividad AS name,
       FechaInicio AS start_time,
       FechaFin AS end_time,
       Proyecto AS category,
       Gerencia,
       Progreso AS progress,
       ColorHex AS color,
       Estado AS estado
   FROM TareasCronograma;
   ```
3. En el panel de opciones de la derecha, configure los mapeos en la sección **Mapeo de Datos**:
   * **Columna de Nombre:** `name`
   * **Columna de Fecha de Inicio:** `start_time`
   * **Columna de Fecha de Fin:** `end_time`
   * **Columna de Proyecto:** `category`
   * **Columna de Progreso:** `progress`
   * **Columna de Color:** `color`
4. En **Agrupación Jerárquica**, seleccione la columna `Gerencia`. El panel agrupará jerárquicamente en cascada: `Gerencia -> Proyecto (Resumen) -> Actividades`.
