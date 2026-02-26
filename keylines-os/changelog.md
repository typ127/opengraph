# Changelog - KeyLines OS

All notable changes to this project will be documented in this file.

## [1.1.0] - 2026-02-26

### Added
- **Predictive Donuts (Look-ahead)**: Backend now calculates neighbor distributions for all returned nodes, allowing donuts to visualize "what's next" before expansion.
- **Asimov Universe Dataset**: Added CSV-based dataset with 20+ nodes and edges (Seldon, Robots, Planets).
- **Layout Control Panel**: Integrated UI buttons (Icon-only with tooltips) for:
    - **Hierarchical Layout** (Dagre)
    - **Circular Layout**
    - **Force-Directed Layout** (D3-Force)
- **Database Management Tools**: Added `import_asimov.py` and `clear_db.py` for easy data lifecycle management.
- **Auto-Initialization**: App now automatically fetches data for the start node (Hari Seldon) on mount.

### Changed
- **Visual Overhaul**: 
    - Nodes now feature a solid color fill based on type (Person: Blue, Planet: Green, Tech: Orange, Entity: Purple).
    - Icons are now white for better contrast.
    - Edges are now straight lines originating exactly from the center of the nodes.
- **Donut Logic**: Grouped multiple node types into color categories (e.g., Robot + Item = Orange) for cleaner visualization.

### Fixed
- **Edge Alignment**: Moved handles inside the circular container to prevent offsets caused by long labels.
- **State Integration**: Improved `integrateNewData` to properly refresh existing node data (labels, icons, donuts) during expansion.

## [1.0.0] - 2026-02-26

### Added
- **Custom Node Architecture**: Implemented `KeyLinesNode` in React with SVG Donut and MUI Icons.
- **Graph Interaction**: Basic radial expansion on node click.
- **Backend API**: FastAPI endpoint with Memgraph/GQLAlchemy integration.
- **Infrastructure**: Initial Docker Compose setup.
