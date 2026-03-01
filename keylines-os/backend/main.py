from fastapi import FastAPI, Query, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import networkx as nx
from gqlalchemy import Memgraph
import os
from typing import List, Dict, Any

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

def get_props(ent):
    if not ent: return {}
    # GQLAlchemy Node Objekte haben oft 'properties' oder '_properties'
    if hasattr(ent, "properties"): return ent.properties
    if hasattr(ent, "_properties"): return ent._properties
    # Falls es ein Dictionary ist (direkt aus Cypher)
    if isinstance(ent, dict): return ent
    return {}

def process_with_social_algorithms(nodes, edges, algorithm: str = "degree"):
    """Berechnet Centrality Scores mit NetworkX für das Visual-Scaling."""
    if not nodes:
        return {"nodes": [], "edges": []}

    G = nx.Graph()
    for e in edges:
        G.add_edge(e["source"], e["target"])
    
    # Sicherstellen, dass alle Knoten im Graph sind (auch isolierte)
    for n in nodes:
        if n["id"] not in G:
            G.add_node(n["id"])

    scores = {}
    try:
        if algorithm == "betweenness":
            scores = nx.betweenness_centrality(G)
        elif algorithm == "pagerank":
            scores = nx.pagerank(G, alpha=0.85)
        elif algorithm == "closeness":
            scores = nx.closeness_centrality(G)
        elif algorithm == "eigenvector":
            scores = nx.eigenvector_centrality(G, max_iter=1000)
        else: # default: degree
            scores = nx.degree_centrality(G)
    except Exception as e:
        print(f"Algorithm error ({algorithm}): {e}")
        # Fallback auf Degree Centrality
        scores = nx.degree_centrality(G)
    
    # Scores normalisieren (0.0 bis 1.0)
    if scores:
        max_val = max(scores.values()) if scores.values() else 1.0
        if max_val == 0: max_val = 1.0
        
        for node in nodes:
            # Score im data-Objekt speichern für KeyLinesNode.jsx
            raw_score = scores.get(node["id"], 0.0)
            node["data"]["score"] = raw_score / max_val

    return {"nodes": nodes, "edges": edges}

@app.post("/analyze")
async def analyze(data: Dict[str, Any] = Body(...)):
    """Berechnet Metriken für den aktuellen Graphen auf dem Frontend."""
    nodes = data.get("nodes", [])
    edges = data.get("edges", [])
    algorithm = data.get("algorithm", "degree")
    return process_with_social_algorithms(nodes, edges, algorithm)

@app.post("/upsert-node")
async def upsert_node(node_data: Dict[str, Any] = Body(...)):
    """Erstellt oder aktualisiert einen Knoten in der Datenbank."""
    props = node_data.get("data", {})
    node_id = node_data.get("id")
    label = props.get("label", "")
    node_type = props.get("type", "other")
    icon = props.get("icon", "HelpOutline")
    description = props.get("description", "")

    print(f"UPSERT NODE: {node_id} (Label: '{label}')")

    # Strings für Cypher vorbereiten (Escaping von Hochkommas)
    safe_label = label.replace("'", "\\'")
    safe_description = description.replace("'", "\\'")

    # Cypher Query: MERGE findet den Knoten anhand der ID oder erstellt ihn.
    # Wir stellen sicher, dass der Knoten das Label :Entity erhält (wie im Import-Skript).
    query = f"""
    MERGE (n:Entity {{id: '{node_id}'}})
    SET n.label = '{safe_label}',
        n.type = '{node_type}',
        n.icon = '{icon}',
        n.description = '{safe_description}'
    RETURN n;
    """
    try:
        memgraph.execute(query)
        print(f"SUCCESSfully upserted {node_id}")
        return {"status": "success", "id": node_id}
    except Exception as e:
        print(f"Upsert error: {e}")
        return {"status": "error", "message": str(e)}

@app.delete("/delete-node/{node_id}")
async def delete_node(node_id: str):
    """Löscht einen Knoten und alle seine Kanten permanent aus der Datenbank."""
    query = f"MATCH (n {{id: '{node_id}'}}) DETACH DELETE n;"
    try:
        memgraph.execute(query)
        print(f"DELETED node {node_id} from DB")
        return {"status": "success", "id": node_id}
    except Exception as e:
        print(f"Delete error: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/search")
async def search(q: str = Query(...)):
    print(f"SEARCH REQUEST: '{q}'")
    # Query-Parameter für Cypher vorbereiten
    safe_q = q.replace("'", "\\'")
    
    # Suche in Label und Typ, Rückgabe der Props direkt aus Cypher (ohne Label-Zwang)
    query = f"""
    MATCH (n)
    WHERE toLower(coalesce(n.label, "")) CONTAINS toLower('{safe_q}') 
       OR toLower(coalesce(n.type, "")) CONTAINS toLower('{safe_q}')
    RETURN n.id as id, n.label as label, n.type as type, n.icon as icon, n.description as description
    LIMIT 15;
    """
    try:
        results = list(memgraph.execute_and_fetch(query))
        print(f"FOUND {len(results)} matches for '{q}': {results}")
        return results
    except Exception as e:
        print(f"Search error: {e}")
        return []

@app.get("/expand/{node_id}")
async def expand(node_id: str, use_mock: bool = Query(False), filter_category: str = Query(None)):
    if use_mock:
        return process_with_social_algorithms(MOCK_DATA["nodes"], MOCK_DATA["edges"])

    query = f"""
    MATCH (n {{id: '{node_id}'}})
    
    // Finde alle distinkten Nachbarn von n und sammle ihre Typen
    OPTIONAL MATCH (n)-[]-(nn)
    WITH DISTINCT n, nn
    WITH n, collect(nn.type) as n_neighbor_types
    
    // Hole alle Kanten und Zielknoten m für die Expansion
    OPTIONAL MATCH (n)-[e]-(m)
    WITH n, n_neighbor_types, e, m
    
    // Finde für jeden Zielknoten m dessen distinkte Nachbarn (für die Vorschau im Donut)
    OPTIONAL MATCH (m)-[]-(mn)
    WITH DISTINCT n, n_neighbor_types, e, m, mn
    WITH n, n_neighbor_types, e, m, collect(mn.type) as m_neighbor_types
    
    RETURN n, n_neighbor_types, e, m, m_neighbor_types;
    """
    
    try:
        results = list(memgraph.execute_and_fetch(query))
    except Exception as e:
        print(f"DB Error: {e}")
        return {"nodes": [], "edges": []}
    
    nodes_dict = {}
    edges = []
    
    category_map = {
        "person": "person", 
        "mutant": "mutant",
        "planet": "planet",
        "robot": "robot",
        "item": "item",
        "entity": "science", 
        "science": "science",
    }
    
    color_values = {
        "person": "#1976d2", 
        "planet": "#4caf50",
        "mutant": "#dc143c", 
        "robot": "#00bfff",
        "item": "#ff9800", 
        "science": "#9c27b0",
        "other": "#9e9e9e"
    }

    def calculate_donut(type_list):
        if not type_list: return []
        cat_counts = {}
        cat_type_details = {}
        
        for t in type_list:
            if not t: continue
            cat = category_map.get(t.lower(), "other")
            cat_counts[cat] = cat_counts.get(cat, 0) + 1
            
            if cat not in cat_type_details: cat_type_details[cat] = {}
            t_upper = t.upper()
            cat_type_details[cat][t_upper] = cat_type_details[cat].get(t_upper, 0) + 1
        
        total = sum(cat_counts.values())
        return [
            {
                "category": cat,
                "type_labels": [f"{t} ({count})" for t, count in cat_type_details[cat].items()],
                "value": (count / total) * 100, 
                "total_count": count,
                "color": color_values[cat]
            }
            for cat, count in cat_counts.items()
        ]

    for row in results:
        n, e, m = row.get("n"), row.get("e"), row.get("m")
        n_neighbor_types = row.get("n_neighbor_types", [])
        m_neighbor_types = row.get("m_neighbor_types", [])

        if filter_category and m:
            p_m = get_props(m)
            m_cat = category_map.get(p_m.get("type", "").lower(), "other")
            if m_cat != filter_category:
                continue

        p_n = get_props(n)
        id_n = p_n.get("id")
        if id_n and id_n not in nodes_dict:
            nodes_dict[id_n] = {
                "id": id_n, "type": "keylines",
                "data": {
                    "label": p_n.get("label"), 
                    "icon": p_n.get("icon"),
                    "type": p_n.get("type"),
                    "description": p_n.get("description", ""),
                    "donut": calculate_donut(n_neighbor_types)
                }
            }

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
                        "description": p_m.get("description", ""),
                        "donut": calculate_donut(m_neighbor_types)
                    }
                }
            
            if e and id_n and id_m:
                rel_type = "RELATES_TO"
                if hasattr(e, "_type"):
                    rel_type = e._type
                elif hasattr(e, "type"):
                    rel_type = e.type
                
                p_e = get_props(e)
                edges.append({
                    "id": f"e-{id_n}-{rel_type}-{id_m}",
                    "source": id_n, "target": id_m, 
                    "label": rel_type.replace("_", " ").lower(),
                    "data": {**p_e, "type": rel_type},
                    "animated": rel_type in ["TRAVELS_WITH", "CONNECTS", "FOLLOWS"]
                })

    unique_nodes = list(nodes_dict.values())
    unique_edges = []
    seen_edge_ids = set()
    for e in edges:
        if e["id"] not in seen_edge_ids:
            unique_edges.append(e)
            seen_edge_ids.add(e["id"])

    return process_with_social_algorithms(unique_nodes, unique_edges)

class EdgeCreate(BaseModel):
    source: str
    target: str
    type: str

@app.post("/create-edge")
async def create_edge(edge: EdgeCreate):
    rel_type = edge.type.upper().replace(" ", "_")
    if not rel_type: rel_type = "RELATES_TO"
    
    query = f"""
    MATCH (a {{id: '{edge.source}'}}), (b {{id: '{edge.target}'}})
    MERGE (a)-[e:{rel_type}]->(b)
    SET e.type = '{rel_type}'
    RETURN e;
    """
    try:
        memgraph.execute(query)
        return {"status": "success"}
    except Exception as e:
        print(f"Edge creation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
