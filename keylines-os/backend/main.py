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

    # --- LOOK-AHEAD ABFRAGE (OHNE DISTINCT FÜR KORREKTE ANZAHL) ---
    query = f"""
    MATCH (n {{id: '{node_id}'}})
    OPTIONAL MATCH (n)-[e]-(m)
    WITH n, e, m
    OPTIONAL MATCH (m)-[]-(mn)
    WITH n, e, m, collect(mn.type) as m_neighbor_types
    OPTIONAL MATCH (n)-[]-(nn)
    RETURN n, collect(nn.type) as n_neighbor_types, e, m, m_neighbor_types;
    """
    
    try:
        results = list(memgraph.execute_and_fetch(query))
    except Exception as e:
        print(f"DB Error: {e}")
        return {"nodes": [], "edges": []}
    
    nodes_dict = {}
    edges = []
    
    # Mapping von Typen zu Kategorien/Farben
    category_map = {
        "person": "blue", "mutant": "blue",
        "planet": "green",
        "robot": "orange", "item": "orange",
        "entity": "purple", "science": "purple",
    }
    
    color_values = {
        "blue": "#1976d2",
        "green": "#4caf50",
        "orange": "#ff9800",
        "purple": "#9c27b0",
        "other": "#9e9e9e"
    }

    def calculate_donut(type_list):
        if not type_list: return []
        
        # 1. Typen auf Kategorien mappen und zählen
        cat_counts = {}
        for t in type_list:
            if not t: continue
            cat = category_map.get(t.lower(), "other")
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
        
        total = sum(cat_counts.values())
        
        # 2. In Prozent umrechnen
        return [
            {"value": (count / total) * 100, "color": color_values[cat]}
            for cat, count in cat_counts.items()
        ]

    def get_props(ent):
        if not ent: return {}
        return getattr(ent, "properties", getattr(ent, "_properties", {}))

    for row in results:
        n, e, m = row.get("n"), row.get("e"), row.get("m")
        n_neighbor_types = row.get("n_neighbor_types", [])
        m_neighbor_types = row.get("m_neighbor_types", [])

        # Zentrum n verarbeiten
        p_n = get_props(n)
        id_n = p_n.get("id")
        if id_n and id_n not in nodes_dict:
            nodes_dict[id_n] = {
                "id": id_n, "type": "keylines",
                "data": {
                    "label": p_n.get("label"), 
                    "icon": p_n.get("icon"),
                    "type": p_n.get("type"),
                    "donut": calculate_donut(n_neighbor_types)
                }
            }

        # Nachbar m verarbeiten
        if m:
            p_m = get_props(m)
            id_m = p_m.get("id")
            if id_m and id_m not in nodes_dict:
                nodes_dict[id_m] = {
                    "id": id_m, "type": "keylines",
                    "data": {
                        "label": p_m.get("label"), 
                        "icon": p_m.get("icon"),
                        "type": p_m.get("type"),
                        "donut": calculate_donut(m_neighbor_types)
                    }
                }
            
            if e and id_n and id_m:
                edges.append({
                    "id": f"e-{id_n}-{id_m}",
                    "source": id_n, "target": id_m, "animated": True
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