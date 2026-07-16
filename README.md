# Hierarchical Gantt Schedule - Grafana Panel Plugin

An interactive, dynamic, and premium Gantt timeline schedule panel plugin for Grafana.

Developed and maintained by **DkCorpBo**.

![Plugin Preview](https://raw.githubusercontent.com/DkCorpBo/cronograma-gantt-panel/main/src/img/preview.png)

---

## ✨ Key Features

### 📁 Unlimited Hierarchical Grouping Levels
* **Dynamic Cascading Grouping:** Select multiple columns from your database query using an interactive tag-based selector (e.g., `Department > Team > Project`).
* **Infinite Depth:** No artificial depth limits. Group activities by as many hierarchical levels as your data requires.
* **Expand/Collapse Controls:** Folders and projects feature `▶` and `▼` toggle buttons to optimize space on busy dashboards.

### 🟠 Project Summary Bars
* Sub-groups (projects) are automatically colored in a premium **Orange** theme (`#E65100`).
* Project names are displayed centered directly inside their corresponding bars.
* Automatically calculates parent timelines (minimum start date and maximum end date) and average progress based on the state of child activities.

### 🎨 Automatic Status Coloring & Dynamic Legend (SQL)
* **Automatic Status Colors:** If no color column is specified in the SQL query, the plugin parses the `status` (or `estado`) column and assigns colors automatically:
  * 🟢 **Active/In Progress** (`Iniciada`, `Iniciado`, `En Progreso`, `In Progress`) -> Green.
  * 🔵 **Completed** (`Finalizada`, `Finalizado`, `Completado`, `Completada`, `Completed`) -> Blue.
  * 🟡 **Created/Pending** (`Creada`, `Creado`, `Pendiente`, `Nueva`, `Nuevo`, `Pending`, `Created`) -> Yellow/Gold.
* **100% Configurable:** Enable or disable the top legend bar and customize specific colors for each status from the right-hand panel editor options.

### 🔍 Interactive Time Controls & Zoom
* **Intuitive Panning and Zooming:** Built-in buttons for `Zoom In`, `Zoom Out`, `Pan Left`, `Pan Right`, and `Reset Range` to match the global Grafana time picker.
* **Mouse Wheel Zoom:** Smooth wheel zoom centered on your mouse cursor position.
* **Drag-to-Pan:** Click and drag horizontally to move along the timeline.
* **Real-time "Now" Line:** A dotted vertical red line labeled "Now" that updates dynamically based on the local system time.

### 💬 Dual Tooltip System (Hover & Click-to-Lock)
* **Lightweight Hover Tooltip:** Hovering over any task bar displays a dark bubble with the task name without blocking clicks or selections.
* **Sticky Click Tooltip:** Clicking on any activity or project bar locks a detailed tooltip showing:
  * Task name, exact start and end dates, duration, and progress.
  * **Dynamic Extra Fields:** Add any extra database columns (e.g., `status, assignee, priority`) in the options box to display them inside this details card.
  * **Integrated Data Links:** Native Grafana data links are supported, enabling redirection with `href` and `target`.

### 📐 High-Definition Rendering & Clean Typography
* **Antialiased SVG Text:** Custom CSS font-smoothing prevents blurring on small texts.
* **Semibold Font Weight (600):** Maintains legibility in tight Gantt rows.
* **Vertical Centering:** Text labels are vertically centered; long descriptions flow downwards and clip cleanly (`overflow: hidden`) without displacing the main timeline structure.
* **Custom Text Sizes:** Independently adjust the font sizes for activities and projects in pixels.

---

## 🛠️ Development & Installation

### Development Setup
1. Install project dependencies:
   ```bash
   yarn install
   # or:
   npm install
   ```

2. Run the plugin in development mode with live hot-reloading:
   ```bash
   yarn run dev
   # or:
   npm run dev
   ```

3. Build the plugin for production:
   ```bash
   yarn run build
   # or:
   npm run build
   ```

### Plugin Distribution & Signing
To run this plugin in a local development environment or privately without cryptographic signing, add the following to your Grafana configuration file (`grafana.ini`):
```ini
[plugins]
allow_loading_unsigned_plugins = dkcorpbo-cronograma-panel
```

---

## 📜 License

Licensed under the Apache-2.0 License. See the `LICENSE` file for details.
