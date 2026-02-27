# Changelog - KeyLines OS

All notable changes to this project will be documented in this file.

## [1.11.0] - 2026-02-27

### Added
- **Node Deletion**: Introduced a "Remove from Canvas" button at the bottom of the Drawer, allowing users to prune specific nodes and their connected edges from the current exploration.

### Changed
- **Immersive Viewport**: Removed scrollbars from the main window and applied `overflow: hidden` to provide a true "Operating System" fullscreen experience.
- **Restored Branding**: Reverted the search bar placeholder to "Search Asimov's Universe..." for consistency with the project's theme.

### Fixed
- **Layout Switcher**: Resolved a `ReferenceError` where `onLayoutClick` was missing after refactoring.
- **JSX Integrity**: Fixed a syntax error involving an incorrectly closed `Paper` tag in the top-right panel.

## [1.10.0] - 2026-02-27

### Added
- **PNG Export**: Users can now download the current graph view as a high-resolution PNG image. The export logic automatically hides UI panels and controls for a clean capture.
- **Drill Down Mechanism**: Added a "Drill Down" button to the histogram. It allows users to permanently remove all non-highlighted nodes from the canvas to focus on specific subsets.
- **Multi-Type Highlighting**: Enabled `Shift + Click` on histogram labels to highlight multiple entity types simultaneously.
- **Advanced CSS Security Handling**: Configured `crossorigin` attributes for external stylesheets (Google Fonts) to ensure consistent text rendering during image export.

### Changed
- **Codebase Refactoring**: Completely restructured `App.jsx` to improve component scope stability and prevent runtime reference errors.
- **Enhanced Sidebar Reliability**: Improved data checking in the neighbor list to prevent crashes during rapid expansions.

### Fixed
- **SVG Export Security**: Resolved `SecurityError` during PNG generation caused by Cross-Origin CSS rules.
- **Handler Scope**: Fixed `ReferenceError` issues related to `onExport` and other handler functions.

## [1.9.0] - 2026-02-26

### Added
- **Interactive Highlighting**: Clicking a type label or bar in the histogram now highlights all corresponding nodes on the canvas by dimming out unrelated elements (opacity reduction).
- **Centered Search Interface**: Moved the search bar to a prominent `top-center` position for better accessibility.
- **Clear Canvas Button**: Integrated a red `ClearAll` button next to the search bar to instantly reset the entire exploration.
- **Auto-Select on Search**: Pressing `Enter` in the search field now automatically selects the first result, adds it to the canvas, and centers the camera.

### Changed
- **Advanced Histogram Interaction**: Refactored event handling in the filter panel to separate "Visibility Toggling" (Checkbox) from "Focus Highlighting" (Label click).
- **Refined UI Feedback**: Added hover states and selection backgrounds to histogram entries to signal interactivity.

### Fixed
- **Event Bubbling**: Resolved a conflict where clicking histogram labels would unintentionally trigger checkboxes.
- **Search reliability**: Optimized Backend `search` logic to be case-insensitive and robust against special characters.

## [1.8.0] - 2026-02-26

## [1.0.0] - 2026-02-26

### Added
- **Custom Node Architecture**: Implemented `KeyLinesNode` in React with SVG Donut and MUI Icons.
- **Graph Interaction**: Basic radial expansion on node click.
- **Backend API**: FastAPI endpoint with Memgraph/GQLAlchemy integration.
- **Infrastructure**: Initial Docker Compose setup.
