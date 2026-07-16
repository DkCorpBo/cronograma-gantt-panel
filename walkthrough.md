# Testing Guide - Hierarchical Gantt Schedule Plugin

This guide details the steps to populate test data and validate the functionality of the **Hierarchical Gantt Schedule** panel in Grafana.

---

## 1. Database Schema Setup (Standard Method)

To test all panel features (multi-level hierarchies, progress tracking, status colors, and legend rendering), we recommend creating a tasks table with the following structure (Transact-SQL / SQL Server example):

```sql
-- Create sample table for tasks
CREATE TABLE TareasCronograma (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Actividad VARCHAR(100) NOT NULL,
    FechaInicio DATETIME NOT NULL,
    FechaFin DATETIME NOT NULL,
    Proyecto VARCHAR(100) NOT NULL,
    Gerencia VARCHAR(100) NOT NULL,
    Progreso DECIMAL(5,2) NULL, -- Values from 0 to 100 or decimal from 0.0 to 1.0
    ColorHex VARCHAR(7) NULL,    -- E.g., '#2E7D32'
    Estado VARCHAR(50) NULL      -- 'Iniciada', 'Finalizada', 'Creada'
);
```

---

## 2. Populating Test Data (Standard Method)

Execute the following SQL script to insert a realistic hierarchical dataset (two projects under different management departments with several activities):

```sql
-- Clear table and insert test data
TRUNCATE TABLE TareasCronograma;

INSERT INTO TareasCronograma (Actividad, FechaInicio, FechaFin, Proyecto, Gerencia, Progreso, ColorHex, Estado)
VALUES
-- Project Alfa (Operations Management)
('Diseño de Planos', DATEADD(day, -5, GETDATE()), DATEADD(day, -2, GETDATE()), 'Proyecto Alfa', 'Operaciones', 100, '#1565C0', 'Finalizada'),
('Cimentación', DATEADD(day, -2, GETDATE()), DATEADD(day, 2, GETDATE()), 'Proyecto Alfa', 'Operaciones', 45, '#2E7D32', 'Iniciada'),
('Estructura Principal', DATEADD(day, 2, GETDATE()), DATEADD(day, 7, GETDATE()), 'Proyecto Alfa', 'Operaciones', 0, '#D4AF37', 'Creada'),

-- Project Beta (IT Management)
('Requerimientos', DATEADD(day, -10, GETDATE()), DATEADD(day, -6, GETDATE()), 'Proyecto Beta', 'Tecnología', 100, '#1565C0', 'Finalizada'),
('Desarrollo Backend', DATEADD(day, -5, GETDATE()), DATEADD(day, 5, GETDATE()), 'Proyecto Beta', 'Tecnología', 75, '#2E7D32', 'Iniciada'),
('Desarrollo Frontend', DATEADD(day, -1, GETDATE()), DATEADD(day, 6, GETDATE()), 'Proyecto Beta', 'Tecnología', 20, '#2E7D32', 'Iniciada'),
('Pruebas QA', DATEADD(day, 6, GETDATE()), DATEADD(day, 10, GETDATE()), 'Proyecto Beta', 'Tecnología', 0, '#D4AF37', 'Creada');
```

---

## 3. Quick Zero-Setup Method (No Tables Needed)

If you want to evaluate the panel instantly without creating tables or inserting data, connect your PostgreSQL or MySQL database and run the following self-contained query. It generates static rows dynamically:

### For PostgreSQL / MySQL:
```sql
SELECT 'Plan & Design' AS name, NOW() - INTERVAL '5 days' AS start_time, NOW() - INTERVAL '2 days' AS end_time, 'Project Alfa' AS category, 'Operations' AS Gerencia, 1.0 AS progress, '#1565C0' AS color, 'Completed' AS status
UNION ALL
SELECT 'Excavation' AS name, NOW() - INTERVAL '2 days' AS start_time, NOW() + INTERVAL '2 days' AS end_time, 'Project Alfa' AS category, 'Operations' AS Gerencia, 0.45 AS progress, '#2E7D32' AS color, 'In Progress' AS status
UNION ALL
SELECT 'Requirements' AS name, NOW() - INTERVAL '8 days' AS start_time, NOW() - INTERVAL '4 days' AS end_time, 'Project Beta' AS category, 'IT Dept' AS Gerencia, 1.0 AS progress, '#1565C0' AS color, 'Completed' AS status
UNION ALL
SELECT 'Backend Development' AS name, NOW() - INTERVAL '4 days' AS start_time, NOW() + INTERVAL '6 days' AS end_time, 'Project Beta' AS category, 'IT Dept' AS Gerencia, 0.75 AS progress, '#2E7D32' AS color, 'In Progress' AS status;
```

---

## 4. Panel Configuration in Grafana

1. Add a new panel of type **Hierarchical Gantt Schedule** to your Grafana dashboard.
2. Paste either the Standard Query (from Section 1) or the Zero-Setup Query (from Section 3) into your SQL editor.
3. In the options panel on the right, map the columns in the **Data Mapping** section:
   * **Name Column:** `name`
   * **Start Time Column:** `start_time`
   * **End Time Column:** `end_time`
   * **Project/Category Column:** `category`
   * **Progress Column:** `progress`
   * **Color Column:** `color`
4. Under **Hierarchical Grouping**, select the `Gerencia` column. The panel will automatically group in a cascading hierarchy: `Gerencia -> Project (Summary) -> Activities`.
