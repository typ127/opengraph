# Technischer Bericht: Layout-Stabilität & Kanten-Management

## Das Problem: "Kanten-Kontamination" (Edge Contamination)

In der Architektur von KeyLines OS verwalten wir zwei verschiedene Listen von Kanten, die denselben logischen Ursprung haben, aber unterschiedliche Zwecke erfüllen:

1.  **`edges` (Struktur-Kanten):** Die echten, persistenten Verbindungen aus der Memgraph-Datenbank. Sie definieren die geometrische Form und Hierarchie des Graphen.
2.  **`pathEdges` (Visualisierungs-Kanten):** Temporäre Overlays, die für Analyse-Features (z. B. Kürzeste Pfade) erzeugt werden. Diese liegen oft exakt über bereits existierenden Struktur-Kanten.

### Der Fehlermechanismus (Discovery)

Die Layout-Engine **Dagre** (für hierarchische Baum-Layouts) arbeitet nach einem strikten mathematischen Constraint-System. Wenn für die Berechnung beide Listen kombiniert wurden (`[...edges, ...pathEdges]`), passierte Folgendes:

*   **Constraint-Redundanz:** Dagre sieht für zwei Knoten **A** und **B** zwei identische Verbindungs-Befehle.
*   **Algorithmus-Konflikt:** Ein Computer-Algorithmus interpretiert dies nicht als "doppelt gemoppelt", sondern als zwei separate Abhängigkeiten.
*   **Layout-Explosion:** In komplexen Netzen führt diese Redundanz dazu, dass Dagre den Graphen als extrem dicht vernetzt wahrnimmt. Es versucht, Platz für beide (identische) Verbindungen zu schaffen, was das Layout unnötig aufbläht. Dies führte dazu, dass beim "Spawnen" neuer Knoten der bestehende Baum oft in ein ungeordnetes Chaos "explodierte".

---

## Die Lösung: Trennung von Logik und Präsentation

Um die Geometrie des Baumes stabil zu halten, wurde eine strikte Funktionstrennung eingeführt:

### 1. Structural-Only Layout Calculation
Die Funktionen zum Hinzufügen von Knoten (`addSingleNode`, `addAllNodesOfType`, `onSelectSearchResult`) wurden so refactored, dass sie für die Positionsberechnung **ausschließlich** die `edges`-Liste verwenden.
*   **Ergebnis:** Die Engine sieht nur noch die echten logischen Hierarchien. Die Geometrie bleibt sauber und kompakt.

### 2. Visuelles Overlay (Rendering)
Die `pathEdges` werden weiterhin im Frontend gerendert, um dem Benutzer die Analyse-Ergebnisse farbig anzuzeigen. Da sie jedoch nicht mehr Teil der mathematischen Layout-Berechnung sind, haben sie keinen Einfluss mehr auf die Position der Knoten.

### 3. State Synchronisation via Refs
Zusätzlich wurde ein **Persistent Sync** via `useRef` (z.B. `layoutOptionsRef`) implementiert. Dies stellt sicher, dass asynchrone Callbacks (wie das Laden eines Knotens aus der DB) immer auf die exakten Tuning-Parameter des Benutzers zugreifen und nicht kurzzeitig auf Standardwerte zurückfallen.

---

## Evolution: Unified Visual Layer

### Die architektonische Vision (Nutzer-Prompt)
> "Wir haben am Anfang des projektes nur Relationen angezeigt - also direkte verbindungen zwischen knoten. Später kamen dann Pfade hinzu, die größere sprünge anzeigen sollen. Dabei werden für jeden Knoten anfragen an die datenbank ausgeführt um pfadgrößen zu ermitteln. Auch Pfade mit der länge 1 sollten ja angezeigt werden. Pfade der länge 1 haben das aussehen wie die alten Relationen (primary 1px). Damit sollten die Pfade doch die alten Relationen volkommen ablösen können, die alten relationen werden nur noch für die graph berechnungeb verwendet, nicht jedoch für die Anzeige."

### Implementierung (v1.74.0)
Nach Prüfung dieser Vision wurde das System am 10. März 2026 grundlegend bereinigt:

1.  **Eliminierung von DOM-Redundanz**: Die Basis-Relationen (`edges`) wurden vollständig aus der Rendering-Pipeline entfernt. Sie werden nicht mehr im DOM (ReactFlow Stage) gerendert.
2.  **PathEdges als Unified View**: Da Pfade der Länge 1 visuell identisch mit direkten Relationen sind, übernehmen die `pathEdges` nun die exklusive Verantwortung für die visuelle Darstellung auf der Stage.
3.  **Hintergrund-Datenlayer**: Die `edges` dienen nun ausschließlich als "unsichtbarer" Daten-Layer für die Layout-Engines (Dagre/Force). Dies garantiert mathematische Korrektheit bei gleichzeitig maximaler Performance, da die Grafikkarte pro Verbindung nur noch eine einzige Linie zeichnen muss.

### Fazit für die Architektur
Visuelle Effekte dürfen niemals die strukturelle Integrität der Layout-Engine beeinflussen. Durch die konsequente Trennung von **Struktur (Dagre-Input)** und **Präsentation (React-Rendering)** ist das System nun immun gegen Layout-Jumping bei dynamischen Graph-Änderungen. Zudem führt die Bereinigung des DOM zu einer signifikant höheren Render-Performance bei großen Graphen.
