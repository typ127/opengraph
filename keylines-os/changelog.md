# Changelog - KeyLines OS

All notable changes to this project will be documented in this file.

## [1.8.0] - 2026-02-26

### Added
- **Global Search**: A centered search bar with autocomplete allows finding characters and entities directly. Selecting a result automatically adds it to the canvas and centers the camera.
- **Batch Type Expansion**: Added an "Expand All" button to each entry in the histogram panel, allowing users to expand all visible nodes of a specific type with a single click.
- **Instant MUI Tooltips**: Replaced native tooltips with Material-UI Tooltips on donut segments. Configured with zero delay and a 12px offset for a premium, responsive feel.
- **Dynamic Type Labels in Tooltips**: Donut tooltips now show specific entity types and their counts (e.g., "PERSON (3), MUTANT (1)").
- **Empty Start State**: The application now starts with a clean canvas, encouraging discovery via search.

### Fixed
- **Backend Search Robustness**: Switched search logic to `CONTAINS` for better character matching across different database versions.
- **Search Error Handling**: Refactored `main.py` to fix syntax errors and ensure reliable autocomplete responses.

## [1.7.0] - 2026-02-26

## [1.0.0] - 2026-02-26

### Added
- **Custom Node Architecture**: Implemented `KeyLinesNode` in React with SVG Donut and MUI Icons.
- **Graph Interaction**: Basic radial expansion on node click.
- **Backend API**: FastAPI endpoint with Memgraph/GQLAlchemy integration.
- **Infrastructure**: Initial Docker Compose setup.
