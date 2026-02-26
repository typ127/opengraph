# Changelog - KeyLines OS

All notable changes to this project will be documented in this file.

## [1.7.0] - 2026-02-26

### Added
- **Interactive Type Histogram**: A new left-side panel showing a real-time distribution of entity types (e.g., "PERSON", "PLANET", "MUTANT").
- **Global Type Filtering**: Integrated checkboxes in the histogram to hide/show entire entity types across the canvas.
- **Centralized Color Architecture**: Created `constants.js` as a single source of truth for all category-to-color mappings, ensuring 100% consistency between donuts, nodes, sidebar, and histogram.

### Changed
- **Refined Color Palette**: 
    - Mutants are now distinctively **Crimson** (#dc143c).
    - Robots are now **Deepskyblue** (#00bfff).
- **Code Quality**: Refactored `App.jsx` and `KeyLinesNode.jsx` to eliminate duplicate color logic by using the new central utility functions.

## [1.6.0] - 2026-02-26

## [1.0.0] - 2026-02-26

### Added
- **Custom Node Architecture**: Implemented `KeyLinesNode` in React with SVG Donut and MUI Icons.
- **Graph Interaction**: Basic radial expansion on node click.
- **Backend API**: FastAPI endpoint with Memgraph/GQLAlchemy integration.
- **Infrastructure**: Initial Docker Compose setup.
