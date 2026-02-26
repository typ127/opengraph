from gqlalchemy import Memgraph
import os

def clear_database():
    host = os.getenv("MEMGRAPH_HOST", "localhost")
    port = int(os.getenv("MEMGRAPH_PORT", 7687))
    memgraph = Memgraph(host, port)

    print(f"Connecting to Memgraph at {host}:{port} to clear data...")
    
    try:
        # DETACH DELETE n löscht den Knoten UND alle seine Kanten
        query = "MATCH (n) DETACH DELETE n;"
        memgraph.execute(query)
        print("Successfully deleted all nodes and edges from Memgraph.")
    except Exception as e:
        print(f"Error while clearing database: {e}")

if __name__ == "__main__":
    # Sicherheitsabfrage (optional, falls lokal ausgeführt)
    confirm = input("Are you sure you want to delete ALL data in Memgraph? (y/n): ")
    if confirm.lower() == 'y':
        clear_database()
    else:
        print("Operation cancelled.")
