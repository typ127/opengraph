from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import networkx as nx
from gqlalchemy import Memgraph
import os

app = FastAPI()

# Memgraph Verbindung initialisieren
MEMGRAPH_HOST = os.getenv("MEMGRAPH_HOST", "localhost")
MEMGRAPH_PORT = int(os.getenv("MEMGRAPH_PORT", 7687))
memgraph = Memgraph(MEMGRAPH_HOST, MEMGRAPH_PORT)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

MOCK_DATA = {
    "nodes": [
        {"id": "n1", "data": {"label": "Source (Mock)", "icon": "Person", "donut": [40, 60]}},
        {"id": "n2", "data": {"label": "Follower A", "icon": "Group", "donut": [10, 90]}},
        {"id": "n3", "data": {"label": "Follower B", "icon": "Group", "donut": [100, 0]}},
    ],
    "edges": [
        {"id": "e1-2", "source": "n1", "target": "n2"},
        {"id": "e1-3", "source": "n1", "target": "n3"},
    ]
}

@app.get("/expand/{node_id}")
async def expand(node_id: str, use_mock: bool = Query(False)):
    if use_mock:
        return process_with_social_algorithms(MOCK_DATA["nodes"], MOCK_DATA["edges"])

    # Direkte Abfrage nach dem Knoten und all seinen Nachbarn
    query = f"""
    MATCH (n {{id: '{node_id}'}})
    OPTIONAL MATCH (n)-[e]-(m)
    RETURN n, e, m;
    """
    
    try:
        results = list(memgraph.execute_and_fetch(query))
    except Exception as e:
        print(f"DB Error: {e}")
        return {"nodes": [], "edges": []}
    
    nodes_dict = {}
    edges = []
    
    def get_props(ent):
        if not ent: return {}
        return getattr(ent, "properties", getattr(ent, "_properties", {}))

    for row in results:
        n, e, m = row.get("n"), row.get("e"), row.get("m")
        p_n = get_props(n)
        id_n = p_n.get("id")

        if id_n:
            if id_n not in nodes_dict:
                nodes_dict[id_n] = {
                    "id": id_n, "type": "keylines",
                    "data": {"label": p_n.get("label"), "icon": p_n.get("icon"), "donut": p_n.get("donut", [100])}
                }
            
            if m:
                p_m = get_props(m)
                id_m = p_m.get("id")
                if id_m:
                    if id_m not in nodes_dict:
                        nodes_dict[id_m] = {
                            "id": id_m, "type": "keylines",
                            "data": {"label": p_m.get("label"), "icon": p_m.get("icon"), "donut": p_m.get("donut", [100])}
                        }
                    
                    if e:
                        edges.append({
                            "id": f"e-{id_n}-{id_m}",
                            "source": id_n,
                            "target": id_m,
                            "animated": True
                        })

    return process_with_social_algorithms(list(nodes_dict.values()), edges)

def process_with_social_algorithms(nodes, edges):
    """Berechnet Centrality Scores mit NetworkX für das Visual-Scaling."""
    if not nodes:
        return {"nodes": [], "edges": []}

    G = nx.Graph()
    for e in edges:
        G.add_edge(e["source"], e["target"])
    
    # Centrality berechnen (Wichtigkeit im Netzwerk)
    centrality = nx.degree_centrality(G) if len(G.nodes) > 1 else {n["id"]: 1.0 for n in nodes}
    
    # Scores normalisieren und zuweisen
    for node in nodes:
        node["data"]["score"] = centrality.get(node["id"], 0.1)

    return {"nodes": nodes, "edges": edges}