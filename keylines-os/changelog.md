# Changelog - KeyLines OS

All notable changes to this project will be documented in this file.

## [1.5.0] - 2026-02-26

### Added
- **Semantic Edge Visualization**: Connections now feature labels indicating their type (e.g., "lives on", "mentors").
- **Smart Edge Styling**:
    - Power/Authority relationships (`RULES`, `CONQUERED`) are highlighted in **Red**.
    - Protective relationships (`PROTECTS`, `GUIDES`) are highlighted in **Green**.
    - Affiliation/Origin (`LIVES_ON`) is highlighted in **Blue**.
    - Dynamic animation for traveling/connecting relationships.
- **Typography Overhaul**: Migrated the entire application UI and graph labels to the **Open Sans** font family for a cleaner, modern look.

### Changed
- **Improved Integration Map**: Refactored the internal data merging to use Map-based deduplication, providing a 100% guarantee against duplicate keys.
- **Backend Edge Logic**: Enhanced relationship type extraction to reliably fetch Cypher types (e.g., `LIVES_ON`) from Memgraph objects.

## [1.4.0] - 2026-02-26

## [1.0.0] - 2026-02-26

### Added
- **Custom Node Architecture**: Implemented `KeyLinesNode` in React with SVG Donut and MUI Icons.
- **Graph Interaction**: Basic radial expansion on node click.
- **Backend API**: FastAPI endpoint with Memgraph/GQLAlchemy integration.
- **Infrastructure**: Initial Docker Compose setup.
