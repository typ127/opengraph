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
    nodes_path = "data/asimov_nodes_expanded_era.csv"
    if not os.path.exists(nodes_path):
        # Fallback für lokalen Start ohne Docker
        nodes_path = "backend/data/asimov_nodes_expanded_era.csv"
    
    if not os.path.exists(nodes_path):
        print(f"Error: Could not find nodes file in data/ or backend/data/")
        return

    with open(nodes_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            donut_list = [int(x) for x in row['donut'].split(';')]
            label = row.get('label', '').replace("'", "\\'")
            type_val = row.get('type', '').replace("'", "\\'")
            icon = row.get('icon', '').replace("'", "\\'")
            planet = row.get('planet', '').replace("'", "\\'")
            category = row.get('category', '').replace("'", "\\'")
            desc = row.get('description', '').replace("'", "\\'")
            published = row.get('published', '').replace("'", "\\'")
            importance = float(row.get('importance', 0.5))
            era = int(row.get('era', 0)) if row.get('era') else 0
            
            query = f"""
            MERGE (n:Entity {{id: '{row['id']}'}})
            SET n.label = '{label}',
                n.type = '{type_val}',
                n.icon = '{icon}',
                n.donut = {donut_list},
                n.planet = '{planet}',
                n.category = '{category}',
                n.description = '{desc}',
                n.published = '{published}',
                n.importance = {importance},
                n.era = {era}
            """
            memgraph.execute(query)
            print(f"Imported Node: {row['label']} (Era: {era})")

    edges_path = "data/asimov_edges_expanded.csv"
    if not os.path.exists(edges_path):
        edges_path = "backend/data/asimov_edges_expanded.csv"

    with open(edges_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Füge einige Dummy-Daten für Kanten hinzu, damit der Drawer was zu tun hat
            extra_props = ""
            if row['source'] == 'n1' and row['type'] == 'LIVES_ON':
                extra_props = ", e.status = 'primary_residence', e.weight = 0.95, e.since = '11988 GE'"
            else:
                import random
                extra_props = f", e.weight = {round(random.uniform(0.1, 0.9), 2)}, e.since = '12000 GE'"

            query = f"""
            MATCH (a {{id: '{row['source']}'}}), (b {{id: '{row['target']}'}})
            MERGE (a)-[e:{row['type']}]->(b)
            SET e.type = '{row['type']}' {extra_props}
            """
            memgraph.execute(query)
            print(f"Imported Edge: {row['source']} -> {row['target']}")

    print("\nImport finished successfully!")

if __name__ == "__main__":
    import_data()
