# Changelog - KeyLines OS

All notable changes to this project will be documented in this file.

## [1.32.0] - 2026-03-05

### Added
- **Intelligent Pathfinding Engine**: Implemented a background pathfinder using Memgraph's BFS algorithm. The system now automatically discovers "hidden" connections between any nodes currently on the stage (up to 10 hops deep).
- **Custom `PathEdge` Component**: Developed a high-performance SVG edge component for path visualization.
    - **Static Rendering**: Paths are static (no animation) to maintain focus, styled in the secondary Pink theme color.
    - **Smart Glyphs**: Circular pink badges appear in the center of paths, displaying the exact count of intermediate nodes (excluding start/end).
    - **Drop Shadows**: Added subtle depth to path glyphs for better visual separation.
- **Dedicated "Pfad" Drawer**:
    - Introduced a specific drawer mode for paths (Pink/Secondary) that lists all nodes in the discovered chain.
    - **Interactive Exploration**: Added "+" buttons to every node in the path list, allowing users to surgically "unpack" a path by adding its bridge nodes to the stage.
- **Enhanced Donut Visualization**: Overhauled the normalization logic for node rings. Segments now shrink relative to the original total count, creating "empty gaps" for neighbors already on stage. This provides a clear visual indicator of exploration progress.

### Changed
- **Visual Hierarchy Refinement**:
    - **Rendering Order**: All edges (real and virtual) now render behind nodes. Virtual paths render behind real relations to minimize clutter.
    - **Edge Styling**: Unified all real relationships to use the Primary Blue color, removing noisy type-based coloring rules.
    - **Snappy Interaction**: Removed bouncy CSS transitions from edges and labels. Connections now stick perfectly to node centers during dragging, eliminating "lag" and "ghosting".
- **Spacious Layouts**: Massive overhaul of all layout engines (Force, Dagre, Circular, Grid, Concentric). Increased link distances, repulsion, and ring radii by up to 100% to give the graph more room to "breathe".
- **Dynamic Style Sync**: Virtual paths now respect global edge style settings (Bezier, Straight, etc.) and update instantly when changed.

### Fixed
- **Performance Optimization**: Optimized pathfinding triggers to only fire when the set of node IDs changes, preventing redundant database requests during node movement.
- **DOM Consistency**: Fixed `validateDOMNesting` warnings in the neighbor lists by switching to `span` components for complex secondary text.
- **ReactFlow Deprecations**: Replaced `getRectOfNodes` with the modern `getNodesBounds` API.
- **Console Cleanup**: Silenced noisy debug logs and backend print statements for a cleaner developer experience.

## [1.31.0] - 2026-03-05

### Changed
- **Redefined Graph Interaction Model**: Completely overhauled the exploration workflow to prioritize controlled discovery over automatic expansion.
    - **Nodes**: Clicking a node now opens its details in the Sidebar instead of triggering an automatic neighbor expansion.
    - **Donut Segments**: Single-clicking a segment now opens a "Group Drawer" listing all neighbors in that category, while `Shift+Click` performs a "Cleanup" (collapsing that specific category from the stage).
- **Enhanced Neighbor List**: The "Neighbors" section in the drawers now displays relationship names (e.g., "lives on") instead of generic node types, providing immediate context for the link.
- **Directional Awareness**: Added subtle chevron markers (`ChevronLeft` / `ChevronRight`) to neighbor rows to indicate whether a relationship is incoming or outgoing relative to the selected node.
- **Simplified Edge Exploration**: Details for relationships are now accessible via a standard single `Click` (moved from `Shift+Click`).
- **Minimalist Tooltips**: Removed interaction help text from donut segment tooltips to maintain a clean, high-signal visual aesthetic.

### Added
- **"Collect Leaves" Functionality**: Implemented a new `Shift+Click` action on nodes that surgically removes "leaf" nodes (those with only one connection to the target) while preserving nodes that lead deeper into the network.

### Removed
- **Full Expansion Logic**: Disabled all "Full Expand" triggers, including the Spacebar global expansion shortcut and the `batchExpandNodes` engine, to encourage intentional, step-by-step graph building.

## [1.30.0] - 2026-03-01

### Added
- **Database Health Monitoring**: Implemented a real-time connectivity indicator in the status bar.
    - **Backend**: New `/health` endpoint performs active verification of the Memgraph connection.
    - **Frontend**: Automated polling system (10s interval) with a color-coded status dot (Green: Online, Red: Offline, Orange: Checking).
- **Interactive Status Prompts**: Added status bar hover support for the Database indicator.

### Fixed
- **Isolation Donut Persistence**: Fixed a bug where neighbor distribution rings (donuts) disappeared when using the "Isolate" function. The system now correctly references the original node state instead of the filtered UI view.

### Changed
- **Status Bar Refinement**: Optimized layout alignment using `box-sizing: border-box` and adjusted padding to ensure all indicators are perfectly aligned within the viewport.

## [1.29.0] - 2026-03-01

### Added
- **Context-Sensitive Status Bar**: Implemented a dynamic helper bar at the bottom of the screen that provides real-time interaction hints based on mouse hover.
- **UI-Wide Integration**: Added interactive status hints for:
    - **Stage**: Nodes (Expand/Details/Drag) and Edges (Type/Details).
    - **Toolbox**: Templates (Add/Batch-Load) and Relationship mode.
    - **Histogram**: Visibility toggles and Focus modes.
    - **Global Toolbar**: Search, Layout engines, Analysis algorithms, and Export tools.
    - **Profile Drawer**: Neighbor management, Edit mode, Icon picker, and Database deletion.
- **Semantic Styling**: Triggers (e.g., `CLICK`, `DRAG`) are styled in bright uppercase, while actions (e.g., `Expand`) use a subtle, darker sentence-case for optimal readability and a technical aesthetic.

### Changed
- **Adaptive UI Layout**: Restructured the main viewport using a flexbox column layout to ensure the ReactFlow canvas and status bar coexist without occlusion.
- **Drawer Ergonomics**: Added strategic bottom padding to the right profile drawer to maintain button accessibility above the new status bar.

## [1.28.0] - 2026-03-01

### Added
- **Weighted Edge Thickness**: Implemented dynamic stroke width for relationships. Edges now scale their thickness based on the `weight` property (1-10) provided by the database, allowing for immediate visual identification of relationship strength.
- **Weighted Edges Toggle**: Added a new "Weighted Edges" switch to the Settings panel, allowing users to toggle the dynamic thickness calculation on or off. When disabled, all edges revert to a uniform base thickness.
- **Backend Property Passthrough**: The expansion engine now automatically includes all relationship properties (like `weight`) in the edge data sent to the frontend.

### Changed
- **Histogram Interaction Refinement**: Applied `user-select: none` to the Entity Types panel. This prevents accidental text selection when using `Shift+Click` for multi-type highlighting, ensuring a smoother and more focused user experience.

### Fixed
- **State Scope Issue**: Fixed a `ReferenceError` during node expansion where the global `enableWeightedEdges` state was inaccessible to the detached data integration utility.

## [1.27.0] - 2026-02-28

### Added
- **Entity Isolation (Drill Down)**: New "Drill Down (Isolate)" button in the node drawer. This allows users to immediately clear the stage of all other entities, focusing exclusively on the selected node.
- **Robust Batch Architecture**: Globalized core backend utilities (`calculate_donut`, `category_map`) to ensure consistent data structures across all endpoints, including batch-loading and search.

### Changed
- **Drawer Footer Refinement**: Grouped "Remove from Canvas" and "Drill Down" buttons in a persistent, non-shrinking footer for improved ergonomics and faster exploration resets.
- **Enhanced Error Resilience**: The frontend now gracefully handles non-array responses from the backend during batch operations, preventing UI crashes.

### Fixed
- **Backend Scope Issue**: Resolved a `NameError` in the `/nodes-by-type` endpoint by lifting shared logic to the module level.

## [1.26.0] - 2026-02-28

### Added
- **Category Batch Loading**: Users can now `Shift+Click` any template in the Toolbox to immediately load all entities of that type from the database onto the stage.
- **Database Counters**: The Toolbox now displays the total number of available entities for each category (e.g., "BOOK (14)") directly below the template icons.
- **Node-Counts API**: New backend endpoint `/node-counts` provides real-time entity statistics for the frontend UI.

### Changed
- **Toolbox UI Refinement**: Simplified the Toolbox by removing redundant tooltips and integrating counts directly into the template labels for better glanceability.
- **Optimized Batch Layout**: Newly batch-loaded nodes are automatically arranged and the camera is adjusted to ensure full visibility of the added group.

## [1.25.0] - 2026-02-28

### Added
- **Asimov Universe Expansion**: Massive dataset update with over 40 interconnected entities, including major characters (Giskard, Hober Mallow, Bayta Darell), organizations (Second Foundation, Galactic Empire), and locations (Gaia, Solaria, Kalgan).
- **Books as Entities**: Introduced a new `book` category with dedicated icons and styling. Books are now fully integrated nodes linked via `APPEARS_IN` and `FEATURING` relationships.
- **Dynamic Property Editor**: The node drawer now automatically renders and allows editing for all database properties (e.g., `published` year for books, `planet` for characters).
- **Expandable Lore Descriptions**: Added a "Show more/less" feature for long entity descriptions, keeping the drawer clean while providing deep lore access.
- **Backend Dynamic Upsert**: Refactored the `/upsert-node` endpoint to dynamically handle any number of properties, enabling full database-backed customization from the frontend.

### Changed
- **Professional Drawer Layout**: Redesigned the sidebar structure to ensure the "Remove from Canvas" button is always visible and anchored to the bottom of the viewport using a fixed-height flex container.
- **Immersive Sidebar Aesthetics**: Added a custom, slim scrollbar for the drawer that blends seamlessly into the dark theme.

### Fixed
- **Cypher Escaping Stability**: Enhanced the import script and backend logic to correctly handle single quotes in titles and descriptions (e.g., "Foundation's Edge"), preventing database query failures.
- **Data Synchronization**: Ensured that manually added neighbors from the drawer immediately inherit all their database-driven attributes and styles on the stage.

## [1.24.0] - 2026-02-28

### Added
- **Full Relationship Editing**: Users can now modify existing relationships in the right drawer. This includes changing the relationship type (via a dropdown) and editing custom properties like `weight`, `since`, or `status`.
- **Intelligent Neighbor Addition**: Neighbors added via the drawer now correctly inherit their real database type and properties on the stage, replacing the generic "manual" label.
- **Backend Edge Update Engine**: Implemented a robust `/update-edge` endpoint that handles relationship type renames by managing edge deletion and recreation in Memgraph while preserving properties.

### Changed
- **Optimized Drawer Logic**: Lifted relationship lookup logic to ensure all actions (Add/Delete) in the neighbor list have access to full database metadata.
- **Improved Interaction Flow**: Selecting an edge for editing now creates a data snapshot, allowing users to revert changes using the `Escape` key.

### Fixed
- **ReferenceError Fix**: Resolved a scope issue in the drawer where `dbEdge` was not accessible to all interaction buttons.
- **Backend Syntax Compatibility**: Fixed a Python `SyntaxError` by moving string escaping logic outside of f-string expressions, ensuring compatibility with Python 3.11.

## [1.23.0] - 2026-02-28

### Added
- **Edge Path Customization**: Users can now choose between different visual styles for relationship lines in the Settings panel: `Straight`, `Bezier (Curved)`, `Step`, `Smooth Step`, and `Simple Bezier`.
- **Settings Persistence**: All visualization preferences (Edge Coloring, Node Donuts, and Edge Path Style) are now automatically saved to `localStorage` and restored upon browser reload.
- **Dynamic Style Sync**: Existing edges on the canvas update their path style in real-time when the setting is changed.

### Changed
- **Subtle Interaction Model**: Removed all visible handles and hover outlines during edge creation to maintain a clean, immersive aesthetic. Feedback is now provided solely through cursor changes and the animated connection line.
- **Enhanced Reliability**: Relationship deletion is now fully direction-agnostic and synchronized across all UI components (Stage, Profile Drawer, and Segment Preview).

### Fixed
- **Edge Style Consistency**: Unified `defaultEdgeOptions` with global settings to ensure newly expanded or created edges immediately match the active visualization rules.
- **Settings Initialization**: Fixed a bug where default visualization states could conflict with user preferences on first load.

## [1.22.0] - 2026-02-28

### Added
- **Manual Edge Creation Workflow**: Introduced a dedicated "Relationship Mode" in the toolbox. When active, users can draw connections directly between characters by clicking and dragging from icon to icon.
- **Visual Connection Feedback**: While drawing, a thick primary-colored line appears, which becomes dashed and animated once it "snaps" to a valid target node.
- **Relationship Type Definition**: A new drawer interface allows users to select from a predefined list of relationship types (e.g., `PROTECTS`, `CREATED`, `TRAVELS_WITH`) immediately after drawing a connection.
- **Integrated Relationship Deletion**: Added the ability to delete database relationships directly from the node profile and donut segment drawers, regardless of whether the partner is currently on the stage.
- **Backend Persistence (`/create-edge`)**: New POST endpoint to permanently save user-created relationships into the Memgraph database using Cypher `MERGE` logic.

### Changed
- **Invisible Interaction Handles**: Replaced technical anchor points with full-area invisible handles that only activate in connection mode, keeping the UI clean during normal navigation.
- **Seamless Edge Deletion**: The drawer now remains open after deleting a relationship, providing a continuous workflow for managing entity connections.
- **Direction-Agnostic Operations**: Both deletion and expansion now handle edge directions intelligently, preventing "ghost" relations caused by mismatched source/target orientations in the DB.

### Fixed
- **Manual Edge Donut Sync**: Manually created edges now correctly update the node's internal `total_count`, ensuring donut segments are properly restored when partner nodes are removed from the canvas.
- **Real-time Donut Shrinking**: Fixed a bug where donut segments wouldn't update after deletion in the drawer due to missing type metadata for off-stage nodes.

## [1.21.0] - 2026-02-27

### Added
- **Edge Details Drawer**: Shift-clicking an edge now opens the right sidebar with comprehensive information, including relationship type, connected nodes (with type-colored icons), and all database-driven properties (weight, status, date).
- **Global Settings Panel**: A new dedicated settings panel on the left toolbar allows users to toggle visualization rules in real-time.
- **Dynamic Donut Shrinking**: Donut segments now dynamically shrink or vanish based on the nodes currently present on the stage. This provides immediate visual feedback on which connections have already been explored.
- **Edge Data Enrichment**: The Asimov dataset now includes additional relationship properties like `weight`, `since`, and `status` for more detailed analysis.

### Changed
- **Visual Toggle System**: Users can now globally disable "Edge Coloring Rules" and "Node Donuts" for a cleaner, more focused view of the graph structure.
- **Sync Consistency**: Unified category naming (e.g., using `person` instead of `people`) across the entire stack to match the backend database schema perfectly.

### Fixed
- **Accurate Donut Proportions**: Refined the Cypher query logic to count distinct neighbor nodes instead of relationships, ensuring that donut segments reflect the true quantity of connected entities.
- **Backend Stability**: Fixed Python indentation errors and Cypher syntax issues in the `/expand` endpoint.

## [1.20.0] - 2026-02-27

### Added
- **Type-Aware Hierarchical Layout**: The hierarchical layout engine now automatically sorts nodes by their **Entity Type** and **Label** horizontally. This results in much cleaner, grouped structures within each level.
- **Smart Camera Tracking (`fitToNodes`)**: Replaced standard `fitView` with a more precise manual calculation system that determines the final bounding box before node animations finish, preventing "half-visible" graphs in structured layouts.
- **Responsive Camera Triggers**: Added automatic camera adjustments to `onDrillDown` and `onDeleteNode` for a seamless experience.

### Changed
- **Optimized Animation Timing**: Refined the camera zoom delay to 300ms. The camera now begins its move while nodes are still in motion, creating a more fluid and responsive "fly-out" effect.
- **Improved Animation Consistency**: Re-enabled transitions for selected nodes to ensure that expanded clusters always glide smoothly into position.
- **Manual Alignment Refinement**: Replaced random offsets with a fixed 200px rightward placement for isolated nodes added from search.

### Fixed
- **Dagre Sorting Logic**: Corrected the horizontal order in hierarchical views by sorting edges by the target node's properties, overriding Dagre's default "first-seen" placement.
- **Node dragging stability**: Confirmed that only active dragging disables transitions, preserving smooth motion for all other layout-driven changes.

## [1.19.0] - 2026-02-27

### Added
- **Toolbox (Node Templates)**: Introduced a persistent left drawer containing templates for `person`, `robot`, `planet`, etc. Users can now build the graph manually via **Drag & Drop**.
- **Interactive Node Editor**: Added an Edit Mode to the right drawer. Includes live-editing for labels and descriptions, plus a custom icon picker.
- **Backend Persistence (UPSERT/DELETE)**: Implemented full CRUD operations for nodes. Changes are automatically saved to Memgraph, and nodes can be permanently deleted from the database.
- **Smart "Escape" Handling**: Implemented a draft system. Pressing `Escape` while editing reverts changes for existing nodes or removes un-persisted "draft" nodes from the canvas.
- **Unified Toolbar Alignment**: Consistently aligned all top-level UI elements (Toolbox toggle, Search, Layouts, Algorithms, Histogram) at the top of the viewport.

### Changed
- **Optimized Search**: The search engine is now more robust, handling case-insensitivity, special characters, and missing labels by falling back to entity types.
- **UX Refinements**: 
  - Isolated nodes from search now automatically align to the right of existing elements to prevent overlapping.
  - Removed the "empty ring" visual for nodes without relationships for a cleaner aesthetic.
  - Disabled CSS transitions during node dragging for precise, non-floating movement.

### Fixed
- **Sync Consistency**: Unified category naming (e.g., using `person` instead of `people`) to match the backend database schema perfectly.

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
