from gqlalchemy import Memgraph
import os

def debug_memgraph():
    host = os.getenv("MEMGRAPH_HOST", "localhost")
    port = int(os.getenv("MEMGRAPH_PORT", 7687))
    print(f"Connecting to {host}:{port}...")
    
    try:
        memgraph = Memgraph(host, port)
        
        # 1. Verbindungstest
        memgraph.execute_and_fetch("RETURN 1 as test;")
        print("Connection OK!")

        # 2. Daten zählen
        results = list(memgraph.execute_and_fetch("MATCH (n) RETURN count(n) as count;"))
        print(f"Total nodes in DB: {results[0]['count']}")

        # 3. Struktur prüfen
        print("Checking first 5 nodes structure:")
        nodes = list(memgraph.execute_and_fetch("MATCH (n) RETURN n LIMIT 5;"))
        for row in nodes:
            node = row['n']
            print(f"Labels: {node.labels}, Properties: {node.properties}")

        # 4. Spezieller ID-Check
        target_id = 'n1'
        print(f"Checking for ID '{target_id}':")
        query = f"MATCH (n) WHERE n.id = '{target_id}' RETURN n;"
        results = list(memgraph.execute_and_fetch(query))
        if results:
            print(f"MATCH FOUND: {results[0]['n'].properties}")
        else:
            print("NO MATCH FOUND with n.id = 'n1'")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    debug_memgraph()
