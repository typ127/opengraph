# Changelog - KeyLines OS

All notable changes to this project will be documented in this file.

## [1.18.0] - 2026-02-27

### Added
- **Default Dark Theme**: Implemented a comprehensive dark grey (`#121212`) aesthetic as the new system standard, providing a professional and immersive "Operating System" feel.
- **Centralized Theme Management**: Extracted all UI, node, and edge colors into a dedicated `theme.js` file, allowing for rapid global style adjustments.
- **Themed UI Components**: Custom-styled ReactFlow Controls, Background patterns, and MUI Panels to align with the new dark aesthetic.

### Changed
- **Refined Color Palette**: Integrated `DeepSkyBlue` and `HotPink` as primary and secondary accent colors.
- **Optimized Visibility**: Updated node labels, search field borders, and panel outlines for maximum readability and a cleaner look on dark backgrounds.
- **Animation Timing**: Further refined the edge appearance delay (200ms) for a snappier, more responsive feel during graph growth.

## [1.17.0] - 2026-02-27

### Added
- **Synchronized Edge Animation**: Implemented CSS transitions for SVG edge paths (`d` attribute). Connections now fluidly follow nodes during layout changes instead of jumping to the end position.
- **Label Motion**: Edge labels now animate their position (`transform`) in sync with the nodes and edges, creating a cohesive "liquid" graph experience.
- **Improved Edge Fade-In**: Refined the timing of new edge appearances (200ms delay + 1s fade) to prevent visual clutter during the rapid node expansion phase.

### Changed
- **Animation Performance**: Optimized CSS transitions to use hardware-accelerated properties where possible for smoother high-node-count interactions.

## [1.16.0] - 2026-02-27

### Added
- **New Layout Engines**: Introduced `Grid` and `Concentric` layout options. The Concentric layout automatically uses node centrality scores to place important entities at the center.
- **Selection-Based Hierarchical Layout**: The hierarchical layout now places selected nodes at the top of the tree, allowing users to define the root of the hierarchy dynamically.
- **Shift + Delete (Inverted Deletion)**: Implemented a powerful shortcut to remove everything *except* the currently selected nodes, acting as a quick keyboard-driven "Drill Down".

### Changed
- **Semantic Category Labeling**: Switched category internal IDs from color names to semantic labels (e.g., "Science Group", "People Group"). This improves readability in the Sidebar and data consistency.
- **Refined Branding**: Updated the search bar placeholder to "Search the Asimov Universe!" for a more engaging user experience.

### Fixed
- **Category Consistency**: Unified the mapping for "Science" and "Entity" types to ensure they always appear under the same semantic group in the UI.

## [1.15.0] - 2026-02-27

### Added
- **Fly-Out Expansion Animation**: Restored the signature expansion effect where new nodes emerge from their parent before sliding to their layout positions. This was achieved using a timed two-step state update (150ms delay) to ensure browser repaint.
- **Aggressive Error Suppression**: Implemented a robust global error handler to intercept and suppress "ResizeObserver" loop errors. This prevents intrusive development overlays during complex layout transitions.

### Changed
- **Sidebar Sorting**: Neighbor lists and preview groups in the right Drawer are now automatically sorted alphabetically by **Entity Type**, making it easier to navigate large clusters.
- **Refined Force Layout**: Optimized the `force-directed` layout parameters for a more balanced "airy" feel (Link distance: 200, Repulsion: -800, Collision: 80).
- **CSS Animation Safety**: Applied `!important` to node transitions to ensure they aren't overridden by ReactFlow's internal style updates during rapid expansion.

### Fixed
- **ResizeObserver Loop Error**: Resolved the persistent runtime error caused by simultaneous node transitions and camera `fitView` adjustments.
- **Development Overlay Block**: Configured the error handler to specifically target and hide Webpack and Next.js dev-server overlays that were blocking the UI.

## [1.14.0] - 2026-02-27

### Added
- **Expanded Universe Data**: Massive expansion of the Asimov dataset (35+ nodes, 50+ edges), including characters like Preem Palver, Arcadia Darell, Bel Riose, and Cleon I.
- **Rich Metadata**: Added a `description` field to all entities, providing deep lore, biographies, and historical context within the Sidebar.
- **Dynamic Lore Integration**: Updated the import pipeline and API to support and display extended text metadata.

### Changed
- **Sidebar UX**: Redesigned the Drawer to feature entity descriptions prominently at the top, styled with italics for readability.

## [1.13.0] - 2026-02-27

### Added
- **Space-to-Expand**: Implemented a global shortcut (Spacebar) to expand all currently visible nodes simultaneously, allowing for rapid exploration of the network.
- **Robust Batch Expansion**: Developed `batchExpandNodes` logic that aggregates multiple expansion requests and performs a single atomic state update to prevent race conditions and state overwriting.

### Changed
- **Clear Canvas Icon**: Replaced the previous `ClearAll` icon with a standard "X" (`CloseIcon`) for clearer visual intent.

### Fixed
- **Expansion Reliability**: Fixed a bug where rapid, simultaneous expansion requests (via Space) would fail to integrate all new data due to overlapping state updates.

## [1.12.0] - 2026-02-27

### Added
- **Social Graph Algorithms**: Integrated backend support for advanced graph metrics:
  - **Degree Centrality**: Identifies the most connected hubs.
  - **Betweenness Centrality**: Highlights bridge nodes that control information flow.
  - **Closeness Centrality**: Measures how "near" a node is to all other nodes.
  - **PageRank**: Ranks nodes based on the importance of their neighbors.
- **Dynamic Node Scaling**: Node sizes now automatically adjust based on the selected algorithm's score, providing instant visual feedback on network importance.
- **Algorithm Toolbar**: Added a dedicated toolbar in the top-right panel for switching between centrality metrics.

### Changed
- **Enhanced Node Data**: Updated node schema to support real-time score injection from the `/analyze` endpoint.

### Fixed
- **Layout Recovery**: Restored missing layout engine functions (`getForceLayout`, `getCircularLayout`, `getLayoutedElements`) that were accidentally removed during refactoring.
- **Handler Stability**: Ensured all algorithm and layout handlers are properly scoped within `useCallback`.

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
