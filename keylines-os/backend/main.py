from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import networkx as nx

app = FastAPI()

# WICHTIG: Erlaubt deinem React-Frontend den Zugriff
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/expand/{node_id}")
async def expand(node_id: str):
    # Beispiel-Daten (später aus Memgraph)
    # n1 ist der Ursprungsknoten, n2-n4 sind die neuen Nachbarn
    nodes = [
        {"id": "n1", "data": {"label": "Source", "icon": "Person", "donut": [40, 60]}},
        {"id": "n2", "data": {"label": "Follower A", "icon": "Group", "donut": [10, 90]}},
        {"id": "n3", "data": {"label": "Follower B", "icon": "Group", "donut": [100, 0]}},
    ]
    edges = [
        {"id": "e1-2", "source": "n1", "target": "n2"},
        {"id": "e1-3", "source": "n1", "target": "n3"},
    ]

    # --- SOCIAL ALGORITHM (SIMULIERT) ---
    # Wir nutzen NetworkX, um die Wichtigkeit zu berechnen
    G = nx.Graph()
    for e in edges:
        G.add_edge(e["source"], e["target"])
    
    centrality = nx.degree_centrality(G)
    
    # Füge den Score zu den Knoten hinzu
    for node in nodes:
        node["data"]["score"] = centrality.get(node["id"], 0.1)

    return {"nodes": nodes, "edges": edges}