# KeyLines OS - Projekt-Historie & Architektur-Evolution

Dieses Dokument dokumentiert die strategische Entwicklung von KeyLines OS, vom initialen Grundgerüst bis zur aktuellen KI-gesteuerten Graph-Visualisierungsplattform.

## Phase 1: Fundament & Interaktions-Kern (v1.0.0 - v1.20.0)
*26. Februar - 27. Februar 2026*

Das Projekt startete mit einer klaren Mission: Ein hochperformantes, immersives Graph-Explorationstool ("Operating System") auf Basis eines modernen Tech-Stacks zu bauen: **ReactFlow**, **MUI**, **FastAPI** und **Memgraph**.

### Zentrale Architektur-Meilensteine:
- **Custom Node Architektur (v1.0.0)**: Entwicklung des `KeyLinesNode` mit einem proportionalen **SVG-Donut**, der Verbindungstypen visualisiert, und integrierten MUI-Icons zur semantischen Kategorisierung.
- **Immersive Dark Aesthetic (v1.18.0)**: Etablierung eines professionellen Dark-Themes (`#121212`) mit `DeepSkyBlue` (Primär) und `HotPink` (Sekundär) als Signaturfarben.
- **Advanced Graph Intelligence (v1.12.0)**: Integration von **NetworkX** im Backend für Echtzeit-Zentralitätsmetriken (**Betweenness, Closeness, PageRank**). Knoten skalieren ihren Radius automatisch basierend auf diesen Werten.
- **Interaktionsmodell (v1.9.0 - v1.13.0)**: 
    - **Fly-Out Expansion**: Neue Knoten gehen mit einer 150ms Status-Verzögerung aus ihrem Elternknoten hervor, um den räumlichen Kontext zu wahren.
    - **Space-to-Expand**: Globaler Shortcut (Leertaste), um eine Batch-Expansion aller sichtbaren Knoten auszulösen.
    - **Histogramm-Highlighting**: Interaktives Filtern und Multi-Typ-Highlighting via `Shift+Klick`.

---

## Phase 2: User Empowerment & Semantische Tiefe (v1.21.0 - v1.40.0)
*27. Februar - 28. Februar 2026*

Diese Phase konzentrierte sich darauf, die Visualisierung in ein bi-direktionales Werkzeug zu verwandeln, mit dem Benutzer die zugrunde liegenden Graphdaten direkt manipulieren können.

### Zentrale funktionale Meilensteine:
- **Manual Relationship Engine (v1.22.0 - v1.24.0)**:
    - **Beziehungs-Modus**: Benutzer können Verbindungen zwischen Knoten direkt auf der Stage zeichnen.
    - **Permanente Persistenz**: Implementierung eines robusten `/create-edge` und `/update-edge` Backend-Systems mit Cypher `MERGE`-Logik, um benutzererstellte Links dauerhaft in Memgraph zu speichern.
- **Asimov Universum Expansion (v1.25.0)**: Integration eines tiefen Datensatzes (Giskard, Seldon, Foundation) inklusive reicher Metadaten (Biografien, Herkunftsplaneten, Erscheinungsjahre).
- **Visualisierungs-Steuerung (v1.23.0)**: Persistierung aller UI-Einstellungen (Kanten-Stile, Knoten-Donuts, Kanten-Färbung) via `localStorage`.
- **Weighted Edges (v1.29.0)**: Kanten skalieren ihre Dicke nun dynamisch basierend auf datenbankgesteuerten `weight`-Eigenschaften (1-10).

---

## Phase 3: Performance, KI-Training & "Planetare" Physik (v1.55.0 - v1.62.0)
*März 2026*

Die aktuelle Phase fokussiert sich auf extreme Performance und "intelligente", automatisierte Layouts.

### Zentrale Performance- & KI-Meilensteine:
- **Snappy Physics (v1.58.0)**: Erzielung eines "Live & Warm" Gefühls durch Optimierung der D3-Force-Konstanten (`alphaMin: 0.05`, `alphaDecay: 0.08`). 
    - **Lineare Reaktion**: CSS-Transitionen an `.react-flow__node` werden während der Simulation dynamisch deaktiviert, damit Knoten der Maus/Physik ohne "schwimmende" Verzögerung folgen.
- **AI Training Environment (v1.56.0)**: 
    - **Human-in-the-Loop**: Eine dedizierte Umgebung zum Vergleich von KI-generierten Layouts mit benutzeroptimierten "Gold Standard"-Layouts.
    - **Daten-Portabilität**: Layouts und Einstellungen sind als sauberes JSON für das Fein-Tuning von Modellen exportierbar.
- **Planetare Gravitation (v1.60.0)**:
    - Einführung des `importanceWeight`. Dieser Parameter skaliert die Abstoßung eines Knotens basierend auf seinem Wichtigkeits-Score. Zentrale Hubs schaffen sich aggressiv Platz, was automatisch zu klareren Cluster-Trennungen führt.
- **Glass-Morphism UI (v1.62.0)**:
    - Das **Graph Tuning Panel** wurde für ein Premium-Gefühl refactored: `rgba(30, 30, 30, 0.9)`, `backdropFilter: blur(10px)` und perfekte Ausrichtung an den Toolbars (`top: 16px`, `right: 16px`).

---

## Phase 4: Struktur-Integrität & Layout-Präzision (v1.70.0 - v1.74.0)
*9. März - 10. März 2026*

In dieser Phase wurde der Fokus auf die mathematische Stabilität der Layout-Engine (Dagre), die Reduktion der DOM-Last und die visuelle Konsistenz der Steuerungselemente gelegt.

### Zentrale Architektur-Fixes & Evolution:
- **Unified Visual Layer (v1.74.0)**:
    - **Discovery**: Identifizierung redundanter Kanten-Renderings im DOM. Base `edges` (Datenstruktur) und `pathEdges` (Visualisierung) überlagerten sich, was zu Performance-Einbußen und visuellen Artefakten führte.
    - **Lösung**: Umstellung auf eine reine **Visual-Layer-Architektur**. Nur noch `pathEdges` werden im DOM gerrendered (inklusive 1-Längen Pfaden), während die Basis-Relationen exklusiv als unsichtbarer Daten-Layer für die Layout-Berechnungen dienen. Dies eliminiert redundante DOM-Elemente vollständig.
- **Persistent Tuning Sync (v1.73.0)**:
    - Einführung von **State-Synchronisierten Refs** (`layoutOptionsRef`, `activeAlgorithmRef`). Diese stellen sicher, dass asynchrone Callbacks (z.B. nach einem Datenbank-Fetch beim Knoten-Spawn) immer auf die exakten Benutzer-Tuning-Parameter zugreifen, anstatt auf veraltete Standardwerte zurückzufallen.
- **Tuning UI Professionalisierung (v1.74.0)**:
    - **Kontext-Sensitivität**: Regler wie `Importance Weight` wurden aus dem globalen Bereich entfernt und in die spezifischen Layout-Sektionen (z.B. Force Physics) verschoben, wo sie tatsächlich wirken.
    - **Visuelle Kohärenz**: Vereinheitlichung aller Slider-Layouts (Padding, Farben, Größen) im Tuning Panel für ein bündiges, professionelles Interface.
- **Intelligente Root-Wahl (v1.72.0)**:
    - Automatisierung der Hierarchie-Anker. Falls kein manueller Root via `Shift+Click` gesetzt wurde, wählt das System nun dynamisch den Knoten mit der höchsten `importance` als stabilen Ankerpunkt für den Baum.
- **Zirkuläre Segmentierung (v1.72.0)**:
    - Erweiterung des Circular Layouts um **semantische Sortierung** (Standard, By Type, By Importance). Dies ermöglicht eine sofortige visuelle Gruppierung von Clustern entlang des Kreises.
- **Deterministic Hive Plot Layout (v1.75.0)**:
    - **Mathematische Ordnung**: Implementierung eines Hive Plot Algorithmus zur Kategorisierung des Asimov-Universums auf 3 radialen Achsen (0°, 120°, 240°).
    - **Importance-Mapping**: Knoten werden entlang der Achsen strikt nach ihrem `importance` Score verteilt, was eine absolute, vergleichende Analyse der Entitäten ermöglicht.
    - **Visual Flow**: Automatisierte Umstellung auf Bezier-Kurven für Kanten, um die typische "fließende" Ästhetik zwischen den Hive-Achsen zu erzielen.

---

## Technischer Stack - Zusammenfassung

| Komponente | Technologie | Rolle |
| :--- | :--- | :--- |
| **Frontend** | React, ReactFlow | Interaktive Leinwand und Knoten-Management. |
| **UI Library** | Material UI (MUI) | Theme-Komponenten, Drawer und Panels. |
| **Backend** | FastAPI (Python) | Hochperformante API und Graph-Logik. |
| **Datenbank** | Memgraph | In-Memory, Cypher-kompatible Graph-Datenbank. |
| **Analyse** | NetworkX, GQLAlchemy | Social-Graph Algorithmen und OGM. |
| **Persistenz** | localStorage / JSON | Clientseitige Einstellungen und Snapshot-Portabilität. |
