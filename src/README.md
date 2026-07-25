# Schedule (Gantt) - Grafana Panel Plugin

A highly interactive, dynamic, and premium-designed panel plugin for Grafana that enables the visualization of schedules and timelines as **Gantt** charts.

Developed and maintained by **DkCorpBo**.

![Plugin Preview](https://raw.githubusercontent.com/DkCorpBo/cronograma-gantt-panel/main/src/img/preview.png)

---

## ✨ Key Features

### 📁 Hierarchical Structure and Unlimited Grouping Threads
* **Dynamic Cascade Grouping:** Allows selecting multiple columns from the database query via an interactive tag bar (e.g., `Management > Team > Project`).
* **Unlimited Levels:** No artificial depth limits. You can group your activities by as many hierarchical levels as you need.
* **Collapse/Expand:** Folders and projects with `▶` and `▼` controls to optimize space in complex dashboards.

### 🟠 Project Summary Bars
* Lower-level groupings (projects) are colored in **Premium Orange** (`#E65100`) by default.
* Display the project name centered directly on their bar.
* Automatically calculate the average progress bar and time range (minimum and maximum date) based on the status of their child activities.

### 🎨 Legend and Automatic Coloring by Status (SQL)
* **Automated Colors by Status:** If no color is defined in the SQL query, the plugin reads the `Estado` (or `status`) column and automatically assigns colors:
  * 🟢 **Started Activity** (`Iniciada`, `Iniciado`, `En Progreso`, `Started`, `In Progress`) -> Green.
  * 🔵 **Completed Activity** (`Finalizada`, `Finalizado`, `Completado`, `Completada`, `Finished`, `Completed`) -> Blue.
  * 🟡 **Created Activity** (`Creada`, `Creado`, `Pendiente`, `Nueva`, `Nuevo`, `Created`, `Pending`, `New`) -> Yellow/Gold.
* **100% Configurable:** You can toggle the top legend bar and customize each of these colors from the editor's right sidebar.

### 🔍 Interactive Time Controls and Zoom
* **Intuitive Navigation:** Integrated buttons for `Zoom In`, `Zoom Out`, `Pan Left`, `Pan Right`, and `Reset Range` to the global Grafana query time range.
* **Scroll Zoom:** Smooth continuous zoom using the mouse wheel (Mouse Wheel Zoom) centered on your cursor position.
* **Drag-to-Scroll:** Left-click and drag horizontally to pan across time.
* **"Now" Time Indicator:** A dashed vertical red line with the label "Now" that updates in real-time based on your local machine/server time.

### 💬 Dual Tooltip System (Hover and Click-to-Pin)
* **Lightweight Hover:** Hovering over a bar instantly displays a dark bubble showing the task name without blocking the view or clicks.
* **Pinned Details Click:** Left-clicking an activity or project bar opens an interactive tooltip pinned at the click point:
  * Task name, exact start and end dates, duration, and progress.
  * **Dynamic Extra Fields:** You can define in a text box which additional columns from your query (e.g., `estado, responsable, prioridad`) you want to display in this detail card.
  * **Integrated Data Links:** A button with a direct link (`href` and `target`) to navigate to other native Grafana detail dashboards.

### 📐 Ultra-crisp Typography and Flexible Layouts
* **Font Smoothing (Antialiasing):** Applied via CSS to ensure clean edges on small text within the SVG.
* **Semibold Weight (600):** Eliminates blurriness in small bold text.
* **Fixed Vertical Alignment:** The first line of text for activities and projects is vertically centered in a fixed position; if the text is too long, secondary lines flow downward and are clipped cleanly at the bottom edge (`overflow: hidden`) without shifting the main line.
* **Configurable Font Sizes:** Separately adjust font sizes for activities and projects in pixels.
