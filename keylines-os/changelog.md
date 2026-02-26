# Changelog - KeyLines OS

All notable changes to this project will be documented in this file.

## [1.2.0] - 2026-02-26

### Added
- **Selective Expansion**: Users can now click on specific donut segments (e.g., the "blue" segment) to expand only nodes of that category (e.g., Persons).
- **Automated Layout System**: The active layout (Force, Hierarchical, or Circular) is now automatically reapplied after every graph expansion to maintain structure.
- **Visual Layout Feedback**: The active layout button in the toolbar is now highlighted (secondary color).
- **Interactive Neighbor Donuts**: Neighbors appearing after an expansion now also have interactive donut segments, allowing for deep exploration of the network.

### Changed
- **Default Layout**: Set Force-Directed Layout as the default on application start.
- **Improved Force Physics**: Refined D3-force parameters (charge, distance, collision) for a more stable and aesthetically pleasing organic look.
- **Smarter Node Spawning**: New nodes now spawn close to their parent, preventing the "exploding graph" effect during expansion.

### Fixed
- **Backend Robustness**: Refactored `main.py` to fix `NameError` and ensure correct function ordering and error handling.
- **State Consistency**: Fixed a bug where `onSegmentClick` handlers were not correctly assigned to dynamically added neighbor nodes.

## [1.1.0] - 2026-02-26

## [1.0.0] - 2026-02-26

### Added
- **Custom Node Architecture**: Implemented `KeyLinesNode` in React with SVG Donut and MUI Icons.
- **Graph Interaction**: Basic radial expansion on node click.
- **Backend API**: FastAPI endpoint with Memgraph/GQLAlchemy integration.
- **Infrastructure**: Initial Docker Compose setup.
