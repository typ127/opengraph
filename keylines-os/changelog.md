# Changelog - KeyLines OS

All notable changes to this project will be documented in this file.

## [1.6.0] - 2026-02-26

### Added
- **Neighborhood Explorer**: Shift+Clicking a node now opens a detailed list of all database neighbors in the sidebar.
- **Selective Node Addition**: Users can now "pick" individual nodes from the sidebar list using a new "+" button, adding only that specific node to the canvas instead of the whole group.
- **Visual Neighborhood Status**: The sidebar list now indicates if a neighbor is already present on the canvas (Checkmark) or can be added (Add icon).
- **Crimson Robot Theme**: Specialized robots are now categorized under "Crimson" (#dc143c) to distinguish them from standard "Orange" items.
- **Auto-Zoom & Viewport Tracking**: Integrated `useReactFlow` to automatically center the view after expansion and added zoom-dependent label visibility.

### Changed
- **Sidebar UX**: Removed raw JSON data from the sidebar to focus on navigational discovery and neighborhood sorting (by type).
- **Consolidated Categorization**: Refactored `categoryMap` and `typeColors` across backend and frontend for consistent crimson branding.

## [1.5.0] - 2026-02-26

## [1.0.0] - 2026-02-26

### Added
- **Custom Node Architecture**: Implemented `KeyLinesNode` in React with SVG Donut and MUI Icons.
- **Graph Interaction**: Basic radial expansion on node click.
- **Backend API**: FastAPI endpoint with Memgraph/GQLAlchemy integration.
- **Infrastructure**: Initial Docker Compose setup.
