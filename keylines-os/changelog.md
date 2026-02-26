# Changelog - KeyLines OS

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-02-26

### Added
- **Custom Node Architecture**: Implemented `KeyLinesNode` in React, featuring:
    - Central MUI Icon (dynamic via props).
    - SVG Donut Ring visualization for percentage data.
    - Dynamic scaling based on social "score".
- **Graph Interaction**: Added `onNodeClick` functionality that triggers a radial expansion of the graph.
- **Backend API**: Developed a FastAPI endpoint `/expand/{node_id}` that:
    - Connects to Memgraph via GQLAlchemy.
    - Performs Cypher queries to fetch neighboring nodes and edges.
    - Integrates `NetworkX` to calculate real-time centrality scores for visual node scaling.
- **Data Integration**: Created a helper function in React to merge new graph data into the existing state without duplicates and with a radial layout algorithm.
- **Database Schema**: Established a standard for node properties (`id`, `label`, `icon`, `donut`) compatible with the visualization engine.

### Fixed
- **Port Conflict**: Resolved port 3000 conflict between Memgraph Lab and React by moving the frontend to port 3001 via `.env`.
- **Data Extraction**: Optimized GQLAlchemy node property extraction to handle various internal data formats (direct properties vs. `_properties`).
- **Query Reliability**: Improved Cypher queries using `OPTIONAL MATCH` to ensure nodes are returned even if they have no current relationships.

### Infrastructure
- **Docker Integration**: Configured `docker-compose.yml` to orchestrate Memgraph, the FastAPI backend, and provide the environment for the React frontend.
- **Project Context**: Initialized `GEMINI.md` as a foundation for AI-assisted development.

---
*Status: MVP (Minimum Viable Product) for graph exploration is functional.*
