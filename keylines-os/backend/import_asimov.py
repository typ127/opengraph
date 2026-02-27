import csv
from gqlalchemy import Memgraph
import os

def import_data():
    host = os.getenv("MEMGRAPH_HOST", "localhost")
    port = int(os.getenv("MEMGRAPH_PORT", 7687))
    memgraph = Memgraph(host, port)

    print(f"Connecting to Memgraph at {host}:{port}...")

    # Im Docker-Container ist das /app Verzeichnis das Root-Verzeichnis
    # Die Daten liegen also in /app/data/asimov_nodes.csv
    nodes_path = "data/asimov_nodes.csv"
    if not os.path.exists(nodes_path):
        # Fallback für lokalen Start ohne Docker
        nodes_path = "backend/data/asimov_nodes.csv"
    
    if not os.path.exists(nodes_path):
        print(f"Error: Could not find nodes file in data/ or backend/data/")
        return

    with open(nodes_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            donut_list = [int(x) for x in row['donut'].split(';')]
            desc = row.get('description', '').replace("'", "\\'")
            query = f"""
            MERGE (n:Entity {{id: '{row['id']}'}})
            SET n.label = '{row['label']}',
                n.type = '{row['type']}',
                n.icon = '{row['icon']}',
                n.donut = {donut_list},
                n.planet = '{row['planet']}',
                n.category = '{row['category']}',
                n.description = '{desc}'
            """
            memgraph.execute(query)
            print(f"Imported Node: {row['label']}")

    edges_path = "data/asimov_edges.csv"
    if not os.path.exists(edges_path):
        edges_path = "backend/data/asimov_edges.csv"

    with open(edges_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            query = f"""
            MATCH (a {{id: '{row['source']}'}}), (b {{id: '{row['target']}'}})
            MERGE (a)-[:{row['type']}]->(b)
            """
            memgraph.execute(query)
            print(f"Imported Edge: {row['source']} -> {row['target']}")

    print("\nImport finished successfully!")

if __name__ == "__main__":
    import_data()
