# Changelog - KeyLines OS

All notable changes to this project will be documented in this file.

## [1.3.0] - 2026-02-26

### Added
- **Donut Toggle Logic**: Donut segments now act as toggles. Clicking a segment once expands its category; clicking it again recursively collapses that entire branch.
- **Advanced Hitbox Precision**: Optimized SVG donuts with `pointer-events: stroke` and `fill: none`, ensuring that clicks and hover effects only trigger on the actual visible ring segments.
- **Recursive Cleanup**: Implementing a `getDescendants` helper to ensure that collapsing a node or segment also removes all subsequent "child-of-child" nodes, keeping the canvas clean.

### Fixed
- **Interaction Overlap**: Resolved a bug where inner transparent areas of the donut segments blocked clicks to lower segments.
- **State Reliability**: Integrated `useRef` for nodes and edges to ensure the expansion/collapse logic always operates on the most current graph state.

## [1.2.0] - 2026-02-26

## [1.0.0] - 2026-02-26

### Added
- **Custom Node Architecture**: Implemented `KeyLinesNode` in React with SVG Donut and MUI Icons.
- **Graph Interaction**: Basic radial expansion on node click.
- **Backend API**: FastAPI endpoint with Memgraph/GQLAlchemy integration.
- **Infrastructure**: Initial Docker Compose setup.
