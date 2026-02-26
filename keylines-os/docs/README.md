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

## 2. Datenbank-Management (CLI)

Wir nutzen Python-Skripte innerhalb des Backend-Containers, um die Datenbank zu verwalten.

### Datenbank leeren
Löscht alle Knoten und Kanten unwiderruflich:
```bash
docker-compose exec backend python clear_db.py
```

### Asimov-Daten importieren
Lädt den Psychohistorik-Datensatz (Personen, Planeten, Roboter):
```bash
docker-compose exec backend python import_asimov.py
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

## 4. Visualisierungs-Features

### Layouts
Über das Panel oben rechts können verschiedene Layout-Algorithmen getriggert werden:
- **Hierarchisch:** Zeigt Strukturen (z.B. Management-Ebenen).
- **Circular:** Ordnet alle Knoten übersichtlich im Kreis an.
- **Force:** Physik-Simulation für organische Netzwerke.

### Donuts (Look-ahead)
Die Ringe um die Knoten zeigen die Verteilung der **direkten Nachbarn** eines Knotens an, auch wenn dieser noch nicht ausgeklappt ist:
- **Blau:** Personen / Mutanten
- **Grün:** Planeten
- **Orange:** Roboter / Gegenstände
- **Lila:** Entitäten / Wissenschaft

### Styling
Die Knoten sind nach ihrem eigenen Typ eingefärbt (Hintergrund des Icons), was eine schnelle visuelle Klassifizierung ermöglicht.

---

## 5. Nützliche Cypher Queries (Memgraph Lab)

### Alles anzeigen
```cypher
MATCH (n)-[r]-(m) RETURN n, r, m;
```

### Speziellen Knoten mit Nachbarn prüfen
```cypher
MATCH (n {id: 'n1'})-[r]-(m) RETURN n, r, m;
```
