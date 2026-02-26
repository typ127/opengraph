# KeyLines OS - Project Context

This project is a graph visualization and analysis platform, designed to provide a "KeyLines-like" experience for exploring complex networks. It integrates a graph database with a web-based frontend and a Python-powered backend for graph algorithms.

## Architecture

- **Backend:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
  - Uses [NetworkX](https://networkx.org/) for graph analysis and social algorithms (e.g., centrality, PageRank).
  - Uses [gqlalchemy](https://github.com/memgraph/gqlalchemy) as an Object Graph Mapper (OGM) for Memgraph.
- **Frontend:** [React](https://reactjs.org/)
  - Uses [ReactFlow](https://reactflow.dev/) for interactive graph visualization.
  - Uses [Material UI (MUI)](https://mui.com/) for UI components and styling.
- **Database:** [Memgraph](https://memgraph.com/)
  - An in-memory graph database that is Cypher-compatible.
- **Infrastructure:** [Docker Compose](https://docs.docker.com/compose/)
  - Orchestrates the Memgraph database and the FastAPI backend.

## Project Structure

- `backend/`: Python FastAPI application.
  - `main.py`: Entry point and API definitions.
  - `requirements.txt`: Python dependencies.
  - `Dockerfile`: Containerization for the backend.
- `frontend/`: React application (Currently in scaffolding phase).
  - `package.json`: Frontend dependencies (ReactFlow, MUI).
- `docker-compose.yml`: Multi-container configuration.

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed.
- Python 3.11+ (for local backend development).
- Node.js (for frontend development).

### Running the Project

1.  **Start the infrastructure:**
    ```bash
    docker-compose up
    ```
    This will start Memgraph (ports 7687, 3000) and the backend (port 8000).

2.  **Access the services:**
    - **Backend API:** `http://localhost:8000/docs` (Swagger UI)
    - **Memgraph Lab:** `http://localhost:3000` (Database UI)
    - **Frontend:** *(TBD once development server is configured)*

### Development Commands

#### Backend (Local)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

#### Frontend (Local)
```bash
cd frontend
npm install
# TODO: Add start/dev script to package.json
```

## Development Conventions

- **API Design:** Use FastAPI's automatic documentation and type hints.
- **Graph Logic:** Prefer `NetworkX` for complex analysis and `Cypher` for database queries.
- **Frontend Styling:** Use MUI components for consistency.
- **Service Interaction:** The backend communicates with Memgraph via the `MEMGRAPH_HOST` and `MEMGRAPH_PORT` environment variables.
