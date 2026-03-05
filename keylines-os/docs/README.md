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

## 4. Graph-Interaktion & Exploration

KeyLines OS verfolgt ein Modell der **kontrollierten Exploration**, um auch in großen Netzwerken den Überblick zu behalten. Automatische Massen-Expansionen sind deaktiviert; stattdessen steuert der Anwender den Datenfluss gezielt über Drawer.

### Knoten-Bedienung
- **Einfacher Klick:** Öffnet den **Entity-Drawer** auf der rechten Seite. Hier können Beschreibungen gelesen, Eigenschaften editiert und Nachbarn gezielt zum Canvas hinzugefügt werden.
- **Shift + Klick:** Führt die Funktion **"Collect Leaves"** aus. Dabei werden alle "Blätter" (Knoten, die nur eine einzige Verbindung zu diesem Knoten haben) von der Stage entfernt, während Pfade, die tiefer in das Netzwerk führen, erhalten bleiben.

### Donut-Ringe (Look-ahead & Navigation)
Die farbigen Ringe um die Knoten zeigen die Verteilung der **direkten Nachbarn** in der Datenbank an:
- **Einfacher Klick auf Segment:** Öffnet den **Group-Drawer** mit einer Liste aller Nachbarn dieser Kategorie.
- **Shift + Klick auf Segment:** Führt ein **Cleanup** durch. Alle Knoten dieser Kategorie (und deren Nachfahren) werden vom Canvas entfernt (**Einklappen**).

### Kanten (Relationships)
- **Einfacher Klick:** Öffnet den **Relationship-Drawer** mit Details zum Typ, der Richtung und benutzerdefinierten Eigenschaften (z. B. `weight`, `since`).

### Nachbarn & Richtungsmarker
In den Drawern werden Nachbarn mit ihrer spezifischen Relation angezeigt:
- **Chevron Rechts (>)**: Eine ausgehende Verbindung vom Fokus-Knoten weg (**Outgoing**).
- **Chevron Links (<)**: Eine eingehende Verbindung zum Fokus-Knoten hin (**Incoming**).

---

## 5. Visualisierungs-Features

### Layouts
Über die Toolbar oben können verschiedene Algorithmen getriggert werden:
- **Hierarchisch:** Sortiert Knoten nach Typ und Label in Ebenen.
- **Circular:** Ordnet Hubs und deren Umfeld im Kreis an.
- **Force:** Organische Physik-Simulation (Default).
- **Concentric:** Platziert wichtige Knoten (hoher Score) im Zentrum.

### Graph-Metriken (Social Network Analysis)
Über die Analyse-Icons können Knoten basierend auf ihrer Bedeutung skaliert werden:
- **Degree:** Anzahl der direkten Verbindungen.
- **Betweenness:** Brücken-Funktion im Netzwerk.
- **PageRank:** Wichtigkeit basierend auf der Wichtigkeit der Nachbarn.

---

## 6. Nützliche Cypher Queries (Memgraph Lab)

### Alles anzeigen
```cypher
MATCH (n)-[r]-(m) RETURN n, r, m;
```

### Speziellen Knoten mit Nachbarn prüfen
```cypher
MATCH (n {id: 'n1'})-[r]-(m) RETURN n, r, m;
```
