# KeyLines OS - Dokumentation

Dieses Projekt ist eine Open-Source Alternative zu KeyLines, basierend auf React Flow, FastAPI und Memgraph.

## 1. Infrastruktur & Backend starten

Der einfachste Weg ist die Nutzung von Docker Compose. Dies startet die Memgraph-Datenbank und das FastAPI-Backend.

```bash
# Im Hauptverzeichnis ausführen
docker-compose up -d
```

- **Backend API:** http://localhost:8000/docs
- **Memgraph Lab (DB-Interface):** http://localhost:3000

---

## 2. Daten in Memgraph anlegen

Damit das Frontend Knoten und Kanten anzeigen kann, müssen diese in Memgraph mit spezifischen Attributen existieren. Öffne [Memgraph Lab](http://localhost:3000) und führe folgendes Skript aus:

```cypher
// Datenbank leeren
MATCH (n) DETACH DELETE n;

// Knoten mit Visualisierungs-Attributen erstellen
MERGE (n1:Entity {id: 'n1'}) SET n1.label = 'Zentrale Hub', n1.icon = 'Hub', n1.donut = [100]
MERGE (n2:Company {id: 'n2'}) SET n2.label = 'Global Corp', n2.icon = 'Business', n2.donut = [70, 30]
MERGE (n3:Person {id: 'n3'}) SET n3.label = 'Alice Admin', n3.icon = 'Person', n3.donut = [50, 50]
MERGE (n4:Bank {id: 'n4'}) SET n4.label = 'Investment Bank', n4.icon = 'AccountBalance', n4.donut = [10, 90];

// Beziehungen erstellen
MATCH (a {id: 'n1'}), (b {id: 'n2'}) MERGE (a)-[:CONNECTS]->(b);
MATCH (a {id: 'n1'}), (b {id: 'n3'}) MERGE (a)-[:MANAGES]->(b);
MATCH (a {id: 'n1'}), (b {id: 'n4'}) MERGE (a)-[:FUNDED_BY]->(b);
```

---

## 3. Frontend starten

Das Frontend läuft auf einem separaten Port, um Konflikte mit Memgraph Lab zu vermeiden.

```bash
cd frontend
npm install
npm start
```

- **Frontend URL:** http://localhost:3001

---

## 4. Nützliche Cypher Queries

Hier sind einige Befehle für das Memgraph Lab zur Fehlersuche:

### Alle Knoten und Kanten anzeigen
```cypher
MATCH (n)-[r]-(m) RETURN n, r, m;
```

### Prüfen, ob ein bestimmter Knoten Beziehungen hat
```cypher
MATCH (n {id: 'n1'})-[r]-() RETURN count(r);
```

### Nur die IDs und Labels auflisten
```cypher
MATCH (n) RETURN n.id, n.label, labels(n);
```

---

## 5. Architektur-Hinweise

- **Custom Nodes:** Die Visualisierung nutzt `KeyLinesNode.jsx`. Icons kommen aus `@mui/icons-material`.
- **Scaling:** Die Knotengröße wird im Backend via `networkx.degree_centrality` berechnet.
- **Expansion:** Beim Klick auf einen Knoten wird `GET /expand/{id}` aufgerufen, was die Nachbarn in einem radialen Layout anordnet.
