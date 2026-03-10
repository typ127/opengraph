# Changelog - KeyLines OS

All notable changes to this project will be documented in this file.

## [1.72.0] - 2026-03-09

### Entfernt
- **Clustered Force Layout**: Die experimentelle "Planet Island" Ansicht wurde vollständig entfernt.
- **Concentric Layout**: Die konzentrische Anordnung wurde entfernt.
- **UI-Bereinigung**: Redundante Regler (`Node Width`, `Node Height`, `Link Distance`) im Tree-Setup sowie der "Load Tree Test Graph"-Button wurden entfernt.
- **Bereinigung**: Unnötige Hooks (`useClusteredForceLayout`) und Hilfsfunktionen (`getConcentricLayout`) wurden aus der Codebase gelöscht.

### Änderungen
- **Tree Setup Optimierung**:
    - **Automatische Root-Wahl**: Falls kein Root manuell gesetzt wurde, wählt die Engine nun automatisch den Knoten mit der höchsten `importance` als Anker.
    - **Live Updates**: Alle Einstellungen im Tree-Setup (Ranker, Alignment, Spacing) triggern nun sofort eine Neuberechnung.
    - **Kompaktere Ansichten**: Spacing-Werte können nun bis auf 1 (Node) bzw. 10 (Rank) reduziert werden.
    - **Importance-Scaling**: Der neue Regler `IMPORTANCE WEIGHT` skaliert Knoten im Baum proportional zu ihrer Bedeutung.
- **AI Training Panel Upgrade**:
    - **Tree-Layout Support**: Die KI analysiert nun auch Baum-Strukturen und schlägt optimierte Spacing-Werte vor.
    - **Dynamische UI**: Die Analyse-Ergebnisse passen sich automatisch dem aktiven Layout-Typ an.
    - **Load Random Subgraph**: Button umbenannt und von Layout-Wechseln entkoppelt.

## [1.71.0] - 2026-03-08

### Neu
- **Vollständige Root-Entkopplung**: Ein normaler Klick auf einen Knoten öffnet nun **nur noch** die Sidebar. Es findet **kein** automatischer Layout-Wechsel oder Root-Wechsel mehr statt.
- **Explizites Setting via Shift+Klick**: Die strukturelle Neuordnung (Root-Anker setzen) ist nun exklusiv an `Shift+Klick` gebunden. Dies verhindert versehentliche Graph-Sprünge beim reinen Inspizieren von Daten.

## [1.70.0] - 2026-03-08

### Neu
- **Sidebar-Entkopplung**: `Shift+Klick` auf einen Knoten setzt diesen nun als Root (Anker) für das hierarchische Layout, **ohne** dass sich die Node-Sidebar auf der rechten Seite öffnet. Die Sidebar öffnet sich weiterhin nur bei einem normalen Klick.

## [1.69.0] - 2026-03-08

### Neu
- **Shift+Click für Root-Anker**: Ein `Shift+Klick` auf einen Knoten setzt diesen nun permanent als **Root** für das hierarchische Layout.
- **Auto-Switch & Reorganize**: Beim Setzen des Roots via Shift+Klick wechselt das System automatisch in das **Hierarchical-Layout** (falls nicht bereits aktiv) und berechnet die Positionen sofort neu.
- **Tuner-Synchronisation**: Der neue Root wird sofort im Tree-Setup des Tuning-Panels angezeigt.

## [1.68.0] - 2026-03-08

### Neu
- **Refined Layout Comparison UI**:
    - **Vektorisierte Pfeile**: Anzeige von Richtungs-Pfeilen (`→` / `←`) zwischen aktuellem Wert und KI-Vorschlag.
    - **Dezentes Design**: Entfernung des Glow-Effekts; Marker sind nun schmale 2px-Striche, die bündig zur Slider-Bahn ausgerichtet sind (2px nach oben versetzt).
    - **Themen-Konsistenz**: Marker nutzen nun die Systemfarben `Primary` (Blau) und `Secondary` (Pink) anstatt Rot/Grün.
    - **Verbindungslinien**: Eine subtile Linie verbindet den aktuellen Daumen des Sliders mit dem Ziel-Marker der KI.

## [1.67.0] - 2026-03-08

### Neu
- **AI Training UX Refinement**:
    - **Auto-Cleanup**: User Snapshots und Analyse-Ergebnisse werden jetzt beim Schließen des AI-Panels automatisch geleert.
    - **Cancel-Button**: Neuer Button zum manuellen Verwerfen der Analyse-Ergebnisse ohne Anwendung.
    - **Verbesserte Visualisierung**:
        - Grüne Markierung/Delta: Wenn der KI-Wert eine Verbesserung darstellt (z.B. mehr Spread, weniger Gravity).
        - Rote Markierung/Delta: Wenn der KI-Wert eine Verschlechterung/Regression darstellt.
- **Outlined Design**: Alle Buttons im AI Panel nutzen nun konsequent den `outlined` Stil für ein leichteres UI-Gefühl.

## [1.66.0] - 2026-03-07

### Neu
- **AI Training Comparison UI**:
    - **Vorschau-Modus**: Analyse-Ergebnisse werden nicht mehr sofort angewandt, sondern als "Vorschau" im Tuning-Panel visualisiert.
    - **RPG-Style Comparison Sliders**: Slider im Tuning-Panel zeigen nun grüne Markierungen für die vorgeschlagenen KI-Werte.
    - **Delta-Anzeige**: Neben den Slidern wird die Differenz zum aktuellen Wert angezeigt (z.B. +150 oder -0.05).
    - **Manueller Apply-Button**: Neuer Button im AI Training Panel ("APPLY LEARNED PARAMETERS") zum finalen Übernehmen der Werte.

## [1.65.0] - 2026-03-07

### Neu
- **Detaillierte Tree-Justierung**:
    - **NODE DIMENSIONS**: Neue Slider für `NODE WIDTH` und `NODE HEIGHT` zur präzisen Steuerung der Bounding Boxes für Dagre.
    - **NODE ALIGNMENT**: Unterstützung für `UL`, `UR`, `DL`, `DR` Ausrichtungen innerhalb der Ebenen.
    - **TREE EDGE STYLE**: Direkte Auswahl des Kantenstils (Bezier, Step, Straight) im Tree-Setup für einen konsistenten Look.
- **Dynamische Root-Logik**: Der Tree nutzt nun den selektierten Knoten als Ankerpunkt (Root). Ohne Selektion wird ein natürliches Ranking basierend auf der DB-Struktur berechnet.

### Behoben
- **Reaktivitäts-Fix**: Tree-Parameter lösen nun sofort eine Neuberechnung des Layouts aus.
- **MUI Warning Fix**: Fehler behoben, bei dem `simplebezier` als ungültiger Wert im Tree-Auswahlmenü gemeldet wurde.

## [1.64.0] - 2026-03-07

### Neu
- **Tree Test Graph Generator**: Neuer Button im AI Training Panel zum Laden einer speziellen DAG-Struktur (Directed Acyclic Graph).
- **Ranker-Visualisierung**: Der Test-Graph enthält Pfade unterschiedlicher Länge (Direkt-Links vs. Multi-Hop), um die Unterschiede zwischen den Ranker-Algorithmen (*Longest Path* vs. *Network Simplex*) deutlich zu machen.

## [1.63.0] - 2026-03-07

### Neu
- **Hierarchisches Tree-Layout**: Das "Sequential"-Layout wurde durch ein vollwertiges hierarchisches Baum-Layout ersetzt.
- **Strukturelle Tree-Parameter**: Neue Regler und Auswahlfelder im Tuning-Panel:
    - **RANKER ALGORITHM**: Auswahl zwischen *Network Simplex*, *Tight Tree* und *Longest Path* zur Steuerung der Ebenen-Zuweisung.
    - **TREE DIRECTION**: Flexible Ausrichtung des Baums (Top-to-Bottom, Bottom-to-Top, Left-to-Right, Right-to-Left).
    - **Spacing Controls**: Feinjustierung von horizontalem (Node Spacing) und vertikalem (Rank Spacing) Abstand.
- **Tuning-Panel Synchronisation**: Das Graph Tuning Panel zeigt nun spezifische Parameter für das Tree-Layout an, sobald dieses ausgewählt ist.
- **KI-Training für Bäume**: Alle neuen Tree-Parameter wurden in das KI-Trainingssystem aufgenommen und mit dem Psychology-Icon markiert.

## [1.62.0] - 2026-03-07

### Geändert
- **Tuning Panel Visual Refinement**:
    - **Toolbar Alignment**: Das Panel ist nun auf die Position der globalen Toolbars ausgerichtet (`top: 16`, `right: 16`).
    - **Glass-Morphism**: Umstellung auf `rgba(30, 30, 30, 0.9)` mit `backdropFilter: blur(10px)` für eine perfekte optische Integration mit den anderen Toolbars.
    - **UI Polish**: Entfernung farbiger Ränder zugunsten eines subtilen Panel-Borders und Erhöhung des Z-Index (1200) für eine saubere Layer-Trennung.

## [1.61.0] - 2026-03-07

### Geändert
- **Graph Tuning Cleanup**:
    - Entfernung des redundanten "RUN LAYOUT" Buttons, da alle Parameteränderungen nun in Echtzeit auf die Stage wirken.
    - Verschlankung der Force-Layout Einstellungen: Fokus auf Kern-Physik (Repulsion, Gravity, Collision, Friction).
    - Konsistentes Farbschema im Tuning-Panel (Blau für globale Einstellungen, Pink für Layout-spezifische Werte).

## [1.60.0] - 2026-03-07

### Neu
- **Reaktives Importance-Scaling**: Der neue "Importance Weight" Regler ist jetzt direkt mit der Force-Simulation gekoppelt und ermöglicht Echtzeit-Anpassungen der planetaren Abstoßungskräfte.

### Behoben
- **Config-Persistence**: Fehler behoben, bei dem die detaillierten Layout-Optionen (`kl_layoutOptions`) nicht im LocalStorage gespeichert wurden. Alle Physik-Einstellungen bleiben nun über Sitzungen hinweg erhalten.
- **Hook-Reaktivität**: Die Layout-Hooks reagieren nun korrekt auf Änderungen des `importanceWeight` Parameters.

## [1.59.0] - 2026-03-07

### Neu
- **Refactoring des Graph Tuning Panels**:
    - **Globaler Viewport Bereich**: Zentrale Steuerung von Knoten-Skalierung, Rotation und Basis-Kantenlänge in einem hervorgehobenen blauen Bereich.
    - **Kontextsensitive Einstellungen**: Dynamische Anzeige von Parametern basierend auf dem aktiven Layout (Force, Clustered, Sequential, etc.).
    - **KI-Indikatoren**: Visuelle Kennzeichnung (Brain-Icon) für alle Parameter, die durch die KI-Analyse beeinflusst werden (z.B. Repulsion, Collision).
    - **Importance Weight**: Neuer Regler zur globalen Steuerung, wie stark die Wichtigkeit eines Knotens seine Abstoßungskraft beeinflusst.
    - **Config Portabilität**: Neue Buttons zum Kopieren und Einfügen der kompletten Layout-Konfiguration als JSON für einfaches Sharing und Backup.

### Geändert
- **Verbesserte UI-Struktur**: Reduzierung der visuellen Last im Tuning-Panel durch gruppierte Boxen und standardisierte Typografie.

## [1.58.0] - 2026-03-07

### Neu
- **Snapshot Import/Export**:
    - Neue "Import Snapshot" Funktion in der Toolbar zum direkten Laden von JSON-Layouts.
    - Dedizierte "Copy JSON" Buttons für jeden Snapshot in der Historie (bereinigt um redundante Bilddaten).
- **High-Response Physik-Tuning**:
    - Eliminierung von "Nachziehen" der Knoten durch Erhöhung von `alphaMin` (0.05) und `alphaDecay` (0.08).
    - Entfernung von CSS-Transitions während der Live-Simulation für eine absolut lineare und unmittelbare Reaktion der Knoten.
    - Beschleunigung der Kamera-Bewegungen (`fitView`) auf 600ms für einen flüssigeren Workflow.

### Geändert
- **Architektur-Fix**: Reorganisation der Funktions-Initialisierung (`onLoadSnapshot`, `expandNode`) zur Vermeidung von Reference-Errors beim Import.
- **Workflow-Speed**: Verkürzung des Auto-Capture-Timeouts auf 800ms, passend zur neuen Physik-Geschwindigkeit.

## [1.57.0] - 2026-03-07

### Neu
- **Default Parameter Export**:
    - Neuer Button "Copy Options as Defaults" im Training-Panel zum Exportieren der aktuell optimierten Physik-Parameter (`repulsion`, `gravity`, etc.) als JSON.
- **Optimierte Testdaten-Generierung**:
    - Reduzierung der Komplexität von Zufallsgraphen auf max. 12 Knoten für präziseres manuelles Layout-Training.

### Geändert
- **Verbesserte Interaktivität**: Test-Knoten unterstützen nun vollumfänglich die Donut-Segment-Klicks (Expansion/Details).
- **Edge-Rendering Fix**: Korrektur der Kanten-Initialisierung beim Laden von Testdaten (Mapping auf `pathEdges`), um sofortige Sichtbarkeit der Beziehungen zu gewährleisten.
- **Präzises ID-Mapping**: Umstellung des Backend-Exports auf semantische `id`-Properties zur Vermeidung von Konflikten mit internen Datenbank-IDs.

## [1.56.0] - 2026-03-07

### Neu
- **AI Training Environment (Interactive Learning)**:
    - Einführung eines dedizierten Debug-Panels zur Kalibrierung der Layout-Physik durch menschliches Feedback.
    - **Load Test Graph**: Lädt automatisch komplexe Subgraphen (2 Anker, bis zu 2 Hops, max 25 Knoten) zur Analyse von Clustern und Pfadlängen.
    - **Layout Comparison (AI vs. User)**: Speicherung des automatischen Ausgangsmaterials und deines verbesserten Wunsch-Layouts in separaten Slots.
    - **Echtzeit-Analyse & Auto-Apply**: Automatischer Vergleich der geometrischen Metriken (Spread, Link Distance, Collision) mit sofortiger Anwendung der optimierten Force-Parameter auf die Stage.
- **Wichtigkeits-basierte Physik (Importance-Scaling)**:
    - Überarbeitung der Force-Engines: Knoten mit hoher `importance` stoßen andere Knoten nun exponentiell stärker ab ("Planetary Gravity").
    - Erzeugt automatisch mehr Freiraum um zentrale Knotenpunkte und verbessert die semantische Trennung.
- **Copy JSON Support**: Neue Buttons zum schnellen Export der Layout-Daten für die KI-Analyse (inkl. automatischer Bereinigung von Bilddaten).

### Geändert
- **Backend-Stabilität**: Der `/random-subgraph` Endpoint wurde massiv gehärtet (ID-Mapping Fix, semantische Typ-Priorisierung, robustes Relationship-Handling).
- **UI Clean-up**: Umstellung aller Drawer-Buttons auf `outlined` Stil für ein moderneres, weniger überladenes Interface.
- **Frontend-Robustheit**: Implementierung von Sicherheitschecks (Optional Chaining) bei der Knotenverarbeitung zur Vermeidung von Abstürzen bei unvollständigen Daten.

## [1.55.0] - 2026-03-07

### Neu
- **Relative Zeit für Snapshots**:
    - Implementierung von `Intl.RelativeTimeFormat` für eine dynamische Zeitanzeige in der Snapshot-Historie (z.B. "3 minutes ago", "2 days ago").
    - Automatische Aktualisierung der Labels basierend auf dem Alter des Snapshots.
- **Präzises Zeit-Tracking**:
    - Snapshots speichern nun einen `rawTimestamp` (Unix-Time) für exakte relative Berechnungen.
    - Umstellung des primären Zeitstempels auf `ISO 8601` zur verbesserten Kompatibilität und Robustheit beim Parsen über verschiedene Browser hinweg.

### Geändert
- **Verbesserte Accessibility**: Snapshot-Vorschaubilder nutzen nun die relative Zeit als `alt`-Attribut für einen besseren Kontext.
- **Optimierte Anzeige**: Kurze Zeitabstände (< 5 Sekunden) werden als "just now" angezeigt, um visuelles Rauschen durch schnell tickende Sekunden-Updates zu vermeiden.

## [1.54.0] - 2026-03-07

### Neu
- **Clustered Force Layout (Planet Islands)**:
    - Einführung des `useClusteredForceLayout` Hooks zur automatischen Gruppierung von Knoten in visuelle "Inseln" basierend auf ihrem `planet`-Attribut.
    - **Geometrische Cluster-Zentren**: Planeten-Zentren werden automatisch auf einem großzügigen Kreis angeordnet, um Überlappungen der Inseln zu vermeiden.
    - **Cluster Gravity / Density**: Neuer dynamischer Slider in den Layout-Einstellungen, der die Zugkraft der Knoten zu ihren jeweiligen Cluster-Zentren steuert.
    - **Live & Warm Transition**: Nahtloser Übergang zwischen organischem Force-Layout und Clustered-Modus durch sanfte D3-Animationen ohne harte Sprünge.
- **UI-Erweiterungen**:
    - Neuer Button in der zentralen Toolbar (Icon: `GroupIcon`) zum schnellen Umschalten auf das Clustered Layout.
    - Kontextueller "Cluster Gravity" Slider im Graph Tuning Panel (wird nur eingeblendet, wenn das Clustered Layout aktiv ist).

### Geändert
- **Robuste Datenverarbeitung**: Knoten ohne explizites Planeten-Attribut werden automatisch einem "Unknown"-Cluster zugewiesen, um die Konsistenz des Layouts zu wahren.
- **Optimiertes Reheating**: Die Simulation wird bei Parameteränderungen (wie Cluster Gravity) gezielt "aufgewärmt", um ein flüssiges Gleiten der Knoten zu ermöglichen.

## [1.53.0] - 2026-03-06

### Neu
- **Live & Warm Force Simulation**: 
    - Einführung des `useLiveForceLayout` Hooks für eine persistente D3-Simulation.
    - Der Force-Layout berechnet sich nun nicht mehr statisch im Hintergrund, sondern reagiert **live und organisch** auf Parameteränderungen.
    - Knoten "gleiten" sanft in ihr neues Gleichgewicht, anstatt hart zu springen.
- **Erweitertes Graph Tuning Panel**:
    - Neues, einklappbares Interface (oben rechts) zur Feinjustierung aller Layout-Parameter.
    - **Organic (Force)**: Getrennte Regler für Link-Distanz, Blue-Strength (Direct), Pink-Strength (Path), Repulsion, Gravity, Friction und Collision.
    - **Sequential**: Einstellbarer Node- und Rank-Spacing.
    - **Circular**: Dynamische Radius-Anpassung.
    - **Concentric**: Regler für Ring-Spacing und Knoten pro Ring.
    - **General Visuals**: Echtzeit-Skalierung der Knoten (Node Scale), globale Rotation des Graphen und Anpassung der Edge-Krümmung (Bezier Curvature).
- **Manual Shuffle**: Ein erneuter Klick auf das Force-Layout-Icon (wenn bereits aktiv) randomisiert alle Positionen und "reheated" die Simulation für eine frische Perspektive.

### Geändert
- **Stabilitäts-Fixes**: 
    - Behebung von `NaN` Fehlern bei der Koordinatenberechnung.
    - Trennung der State-History (Split Refs) zur Vermeidung von Konflikten bei gleichzeitigen Skalierungs- und Rotationsänderungen.
    - Stabilisierung der Zentrierungskräfte zur Vermeidung von ungewolltem "Drift" oder permanenter Rotation.
- **Persistenz**: Alle Tuning-Parameter werden nun zuverlässig im `localStorage` gespeichert und beim Neuladen wiederhergestellt.

## [1.52.0] - 2026-03-06

### Geändert
- **Layout-Reorganisation**: 
    - Das `Sequential` Layout wurde von Left-to-Right auf **Top-to-Bottom** (`TB`) umgestellt, um tiefere Hierarchien besser darzustellen.
    - Implementierung einer **"Set as Root"** Funktion: Ein `Shift + Click` auf einen Knoten zentriert nun das aktive Layout um diesen spezifischen Knoten.
    - Im `Sequential` Layout erzwingt `Shift + Click` nun eine Neuausrichtung aller Kanten (mittels BFS), sodass sie "vom Root-Knoten weg" fließen. Der gewählte Knoten erscheint somit immer an der Spitze der Hierarchie.
- **Universal Gravity Scaling**: Der "Gravity (Tension)" Slider skaliert nun *alle* Layout-Typen (inklusive Force und Sequential) strikt linear vom Masseschwerpunkt aus. Dies verhindert strukturelles Chaos und "Jumping" bei der Anpassung der Graph-Dichte.
- **Luftiges Force-Layout**: Die Basis-Parameter des statischen `Organic (Force)` Layouts wurden drastisch "gelockert" (`linkDistance`: 250, `repulsion`: -1800), um dem Graphen standardmäßig mehr Raum zu geben und Überlappungen bei komplexen Clustern zu vermeiden.
- **Entfernt**: Die veraltete `collectLeaves` Funktion (ehemals auf `Shift + Click`) wurde entfernt, um Platz für das mächtigere "Set as Root" Interaktionsmodell zu schaffen.

## [1.51.0] - 2026-03-06

### Neu
- **Intelligente Knoten-Platzierung**: Überarbeitung der `getSmartPosition`-Logik zur Vermeidung von zufälligem Spawning.
    - **Nachbarschafts-Analyse**: Neue Knoten prüfen nun vor der Platzierung auf bestehende Beziehungen zu allen bereits auf der Stage befindlichen Entities.
    - **Zentrierte Anordnung**: Falls Verbindungen existieren, wird der neue Knoten automatisch im Masseschwerpunkt (Durchschnittsposition) all seiner sichtbaren Nachbarn platziert.
    - **Radialer Versatz**: Integration eines leichten radialen Offsets, um Überlappungen zu verhindern und eine klare Struktur zu wahren.
- **Systemweite Integration**: Die verbesserte Platzierungslogik wurde konsistent in die Suche (`onSelectSearchResult`) und die manuelle Expansion (`addSingleNode`) integriert.

## [1.50.0] - 2026-03-06

### Neu
- **Zentralisiertes Analytics-Drawer**: Einführung eines dedizierten Analytics-Panels auf der linken Seite.
    - **Visualisierung**: Das "Entity Types" Histogramm wurde von der rechten Seite in diesen neuen Drawer verschoben.
    - **Metriken**: Echtzeit-Anzeige von Stage-Statistiken (Knotenanzahl, Beziehungen, Zoom-Level) und System-Konfigurationen (Layout, Gravity, Suchtiefe).
    - **Datenbank-Abgleich**: Direkter Vergleich der auf der Stage befindlichen Knoten mit den Gesamtzahlen in der Datenbank.
- **Analytics-Button**: Neues Icon (BarChart) in der linken Toolbar zum Umschalten des Analytics-Panels.

### Geändert
- **UI-Konsistenz**: Der Analytics-Drawer wurde komplett überarbeitet, um das visuelle Design der Node- und Pfad-Drawer zu übernehmen (Listen, Icons, einheitliche Header).
- **Interaktions-Modell**: Panel-Management für die linke Seite implementiert (Settings, Analytics, Snapshots und Toolbox schließen sich nun gegenseitig aus).
- **Farbliche Anpassung**: Der "Clear Canvas" Button wurde von Rot (`error`) auf Blau (`secondary`) umgestellt, um besser in das restliche UI-Farbschema zu passen.
- **Naming**: Umbenennung interner Layout-Parameter ("Spacing" zu "Gravity") in allen UI-Komponenten zur besseren Verständlichkeit.

## [1.49.0] - 2026-03-06

### Neu
- **Zentralisierte Layout-Architektur**: Die gesamte Layout-Logik wurde in die dedizierte Utility `layoutUtils.js` ausgelagert, um Redundanz zu vermeiden und die Wartbarkeit zu erhöhen.
- **Force-Refresh Mechanismus**: Ein neuer `layoutTrigger` ermöglicht es, das aktuelle Layout (insbesondere das organische Force-Layout) durch erneutes Klicken auf den Button neu zu berechnen, um alternative Anordnungen zu generieren.
- **Statische Hintergrund-Berechnung**: Implementierung einer tick-basierten Vorberechnung (300 Ticks) für das Force-Directed Layout. Dies eliminiert visuelles "Zappeln" während der Initialisierung.

### Geändert
- **Präzises Gravity-Scaling**: Der "Gravity (Tension)" Slider ist nun direkt mit den physikalischen Kräften des D3-Engines (`linkDistance`, `manyBody strength`) verknüpft. Höhere Werte führen zu einem deutlich dichteren, spannungsvolleren Graphen.
- **Optimierte Toolbar**: Die Layout-Buttons wurden aktualisiert und bieten nun direkten Zugriff auf `Sequential (LR)`, `Organic (Force)`, `Circular` und `Concentric`.
- **Erweitertes Concentric Layout**: Die Anordnung erfolgt nun strikt in drei Ringen basierend auf dem `importance`-Wert der Knoten (Top 5 Center, Next 25 Middle, Rest Outer).
- **Kollisionsschutz**: Integration von `forceCollide` in alle physikalischen Layouts, um Überlappungen von Knoten strikt zu verhindern.

### Fixed
- **Scoping & Reference Errors**: Behebung kritischer `ReferenceError` (setNodes) und Syntax-Fehler (duplicate identifiers), die durch unsauberes Refactoring entstanden waren.
- **Initialisierungs-Reihenfolge**: Sicherstellung, dass Hilfsfunktionen wie `fitToNodes` vor ihrer Verwendung in Callbacks definiert sind.

## [1.48.0] - 2026-03-06

### Neu
- **Zentralisierte Layout-Architektur**: Auslagerung der gesamten Layout-Logik in eine dedizierte `layoutUtils.js`.
- **Physik-basierte "Gravity" Steuerung**: Der Spacing-Slider wurde zu einem Gravity-Slider umfunktioniert. Er steuert nun direkt die `linkDistance` und Repulsionskräfte im Force-Layout für einen organischeren, dichteren oder luftigeren Graphen.
- **Statisches Layout-Rendering**: Alle Layouts (insbesondere D3-Force) werden nun statisch im Hintergrund (300 Ticks) berechnet, bevor die Positionen an React Flow übergeben werden. Dies eliminiert das "Zappeln" und "Wobbeln" während der Berechnung.

### Geändert
- **Layout-Typen**:
    - **Sequential (LR)**: Nutzt Dagre für eine saubere Links-nach-Rechts Ausrichtung.
    - **Circular**: Mathematisch präzise Kreisform.
    - **Concentric (Importance)**: Ordnet Knoten in 3 Ringen basierend auf ihrer `importance` an (Top 5 Center, 25 Middle, Rest Outer).
- **Smooth Scaling**: Bei nicht-physikalischen Layouts skaliert der Slider den Graphen weiterhin linear vom Masseschwerpunkt aus, um die Struktur beizubehalten.

## [1.47.0] - 2026-03-06

### Geändert
- **Zentrierte Layout-Engines**: Alle Layout-Algorithmen (Force, Circular, Dagre, Grid, Concentric) berechnen nun dynamisch den Masseschwerpunkt (`getLayoutCenter`) der sichtbaren Knoten. Dies verhindert das "Wegspringen" des Graphen beim Wechsel des Layout-Typs.
- **Optimiertes Force-Layout**:
    - Erhöhte Repulsion und Kollisionsradien für eine klarere Knotentrennung.
    - Ersetzung von `forceCenter` durch individuelle `forceX` und `forceY` Kräfte. Dies zieht isolierte Knoten aktiv zum Zentrum des Graphen, statt sie weit entfernt zu platzieren.
- **Smarte Knoten-Platzierung**:
    - Neue Knoten (aus dem Drawer oder der Suche) werden nun intelligent platziert: entweder in der Nähe ihres Ursprungsknotens oder im aktuellen Sichtfeld (`Viewport`) des Nutzers.
    - Fallback-Logik: Ist die Stage leer, wird der neue Knoten exakt in der Mitte des Bildschirms platziert.
- **Präzises Layout-Spacing**: Das Anpassen des Spacing-Sliders skaliert nun den Graphen linear vom Masseschwerpunkt aus, anstatt einen kompletten strukturellen Re-Layout-Zyklus zu triggern. Dies ermöglicht eine flüssige Größenänderung ohne strukturelle Sprünge.
- **Fokussierte Layout-Berechnung**: Layout-Operationen berücksichtigen ab sofort nur noch aktuell sichtbare Knoten und Kanten. Versteckte Typen werden bei der Positionsberechnung ignoriert.

### Fixed
- **Edge Rendering Order (Z-Index)**:
    - Pinke Pfade (virtuelle Verbindungen) werden nun konsistent **über** blauen direkten Beziehungen gerendert.
    - Z-Index-Hierarchie: Knoten (oben) > Pfad-Labels (1000) > Pfad-Kanten (-1) > Direkte Kanten (-2).
- **Bereinigung**: Entfernung der ungenutzten Hilfsfunktion `integrateNewData` zur Verschlankung der Codebasis.

## [1.46.0] - 2026-03-06

### Neu
- **Variable Pfadsuch-Tiefe (Max Hops)**: Einführung eines Sliders in den Einstellungen zur Steuerung der maximalen Pfadlänge [1..10].
    - **Interaktive Aktualisierung**: Der Graph auf der Stage aktualisiert sich sofort beim Verschieben des Sliders. Pfade, die die eingestellte Tiefe überschreiten, werden entfernt, während neue Pfade innerhalb der neuen Tiefe angefordert werden.
    - **Exklusive Direktsicht (Tiefe 1)**: Bei Einstellung der Tiefe auf 1 werden ausschließlich direkte Datenbank-Beziehungen (blau) angezeigt, was eine fokussierte Analyse unmittelbarer Abhängigkeiten ermöglicht.
    - **Persistente Einstellungen**: Die gewählte Pfadlänge wird im `localStorage` gespeichert und bleibt auch nach einem Browser-Reload erhalten.

### Geändert
- **Backend Pathfinder Optimierung**: Der Endpunkt `/find-paths` akzeptiert nun den Parameter `max_length` und nutzt diesen direkt in der Cypher-BFS-Abfrage (`[*BFS 2..n]`), was die Performance bei geringeren Tiefen verbessert.
- **Backend-API**: Das Datenmodell `FindPathsRequest` wurde um das Feld `max_length` erweitert.

## [1.45.0] - 2026-03-06

### Fixed
- **Backend Pathfinder (Cypher Syntax)**: Resolved critical query errors by aligning with Memgraph-specific Cypher standards.
    - Replaced `shortestPath` with native `BFS` syntax for multi-hop pathfinding (lengths 2-10).
    - Replaced unsupported `length()` function with `size(relationships(p))` for accurate distance calculation.
- **Visual Uniformity**: Eliminated inconsistent relationship line widths by enforcing a strict global style.
    - Set all standard blue relations to a precise **1px** stroke width.
    - Removed dynamic `weight` scaling on the stage to achieve a cleaner, more technical minimalist aesthetic.

## [1.44.0] - 2026-03-06

### Changed
- **Unified Path Visualization**: Removed the distinction between "Real Edges" and "Path Edges" on the stage. The system now uses the pathfinder as the single source of truth for all relationships.
    - **Architecture Simplification**: The stage now exclusively renders `pathEdges`.
    - **Full Detail for Direct Links**: Backend `/find-paths` was updated to return all direct relationships between stage nodes, including their types and properties (like `weight`).
    - **Visual Consistency**: Direct relationships (length 1) are rendered as standard solid edges, while virtual paths (length > 1) remain distinct with glyphs.
- **Dynamic Style Sync**: Node donuts, pruning logic (`collectLeaves`), and cluster collapsing (`Shift+Click`) now all reference the pathfinder's state, ensuring a perfectly consistent exploration experience.
- **Responsive Updates**: Manual edge creation and deletion now trigger an immediate pathfinder refresh to ensure the UI remains in sync with the database.

## [1.43.0] - 2026-03-06

### Added
- **Enhanced Path Drawer**: The path drawer now visualizes relationships between nodes chronologically.
    - **Directional Arrows**: Added `ArrowDownwardIcon` to indicate the flow of the path.
    - **Italic Labels**: Relationship types (e.g., "lives on") are displayed in italics between nodes.
    - **Sequence Styling**: Improved vertical spacing and added dashed connectors for a clearer "step-by-step" timeline feel.
- **Importance-Based Scaling**: 
    - Re-imported the dataset with specific `importance` values (0.1 to 1.0) for all nodes.
    - The `importance` value is now the absolute baseline for node size.
    - Social algorithms (Degree, PageRank, etc.) only override scaling when active; deselecting an algorithm now instantly restores nodes to their original `importance` scale.
- **Robust String Escaping**: Updated the backend import engine to correctly handle single quotes in all data fields (Labels, Categories, Descriptions), preventing Cypher query failures (e.g., for "Star's End").

### Fixed
- **Drawer Crash**: Resolved a `TypeError` (Cannot read properties of null) by removing misplaced Importance sliders from the Settings and Group drawers.
- **Import Reference Error**: Fixed a missing `ArrowDownwardIcon` import in `App.jsx`.
- **Pathfinding Data Sync**: Updated the backend `/find-paths` endpoint to return full relationship metadata, ensuring the frontend has access to the correct edge types for path sequences.

## [1.42.0] - 2026-03-06

### Added
- **Node Importance System**: Added a persistent `importance` value for each node that controls its base visual scale.
- **Importance Slider**: New UI control in the Node Drawer's edit mode to manually adjust an entity's importance (0.1 to 1.0).

### Changed
- **Algorithm Toggling**: Social algorithms are now deselected by default. Clicking an active algorithm button now deselects it.
- **Dynamic Scaling**: Node sizes now automatically revert to their individual `importance` value when no social algorithm is active.
- **Unified Initialization**: All node creation paths (Drop, Search, Expand) now correctly initialize importance and score.

## [1.41.9] - 2026-03-06

### Changed
- **UI Consistency**: Applied italic styling to relationship labels in the Neighbors and Group drawers, matching the aesthetic of the main graph canvas.

## [1.41.8] - 2026-03-06

### Fixed
- **Dependency Initialization**: Resolved a "Cannot access 'expandNode' before initialization" runtime error by re-ordering hook definitions in `App.jsx`. This ensures that snapshot loading logic has reliable access to the node expansion handlers.

## [1.41.7] - 2026-03-06

### Fixed
- **Snapshot Interaction Restoration**: Fixed a critical bug where donut segments on nodes loaded from snapshots were non-interactive. Since JSON serialization strips functional handlers from node data, the system now automatically re-injects the `onSegmentClick` handler to all nodes during the snapshot loading process.

## [1.41.6] - 2026-03-06

### Fixed
- **Segment Drawer Interaction**: Resolved a conflict where clicking on a node donut segment would immediately close the resulting drawer. The system now correctly distinguishes between a click on the central node (details) and a click on a donut segment (expansion), ensuring stable drawer transitions.

## [1.41.5] - 2026-03-06

### Fixed
- **Visual Alignment**: Refined the vertical centering of the path glyph text by switching to `dominantBaseline="central"`, ensuring perfect alignment across different browsers and zoom levels.

## [1.41.4] - 2026-03-06

### Changed
- **Visual Refinement**: Increased the path glyph count font size to `12px` to improve legibility on high-density displays.

## [1.41.3] - 2026-03-06

### Changed
- **Typography Refinement**: Switched the path glyph count font to **Extra Bold** (900) for better contrast and visibility against the primary path color.

## [1.41.2] - 2026-03-06

### Changed
- **Visual Refinement**: Improved the readability and aesthetic of the path glyph text (the node count in the center of paths). Explicitly applied the `"Open Sans"` font family and refined the font weight, size, and letter-spacing for a cleaner, more professional look.

## [1.41.1] - 2026-03-06

### Fixed
- **Consistent Italic Labels**: Fixed a regression where some relationship labels (especially those from snapshots or specific edge types) were not appearing in italics.
    - **Global CSS Force**: Added `font-style: italic !important;` to the global React Flow edge text class.
    - **Reactive Memo Enforcement**: The `visibleEdges` logic now explicitly re-applies the italic `labelStyle` and solid `labelBgStyle` to every edge before rendering, ensuring total visual consistency across the entire graph.

## [1.41.0] - 2026-03-06

### Changed
- **Typography Refinement**: All relationship labels across the stage (standard relations, paths, and manual connections) are now styled with **italics**. This helps to further distinguish relationship text from entity labels and technical UI elements.

## [1.40.1] - 2026-03-06

### Fixed
- **Hierarchical Layout Integrity**: Restored the natural tree-like structure by removing manual horizontal sorting that overrode Dagre's optimized positioning. Sub-trees are now correctly spaced, and edge crossings are minimized.
- **Direction-Sensitive Edge Handling**: Refined the layout engine to respect reciprocal relationships while still preventing redundant edge calculations.

## [1.40.0] - 2026-03-06

### Fixed
- **Robust Hierarchical Layout**: Resolved stability issues in the Dagre-based hierarchical engine.
    - **Edge Deduplication**: The layout engine now automatically deduplicates relationships between node pairs before calculation. This prevents layout artifacts and "broken" structures when nodes are connected by both standard relations and virtual paths.
    - **Type-Aware Rank Sorting**: Restored and improved the horizontal sorting logic. Nodes within the same level (rank) are now grouped by **Entity Type** and then sorted alphabetically by **Label**, resulting in significantly cleaner and more structured tree views.
    - **Full Relationship Inclusion**: Confirmed that all discovered paths and stage relations are correctly integrated into the layout calculation.

## [1.39.1] - 2026-03-06

### Changed
- **CSS Style Sync**: Set the `fill-opacity` of the relationship label background (`.react-flow__edge-textbg`) to `1` in the global stylesheet. This ensures consistent, solid backgrounds across all edge types and prevents line bleed-through during camera movement.

## [1.39.0] - 2026-03-06

### Changed
- **Edge Type Simplification**: Unified the visual representation of relationships.
    - **Dual Category System**: The system now strictly distinguishes between only two visual edge types: **Relations** (Standard Blue) and **Paths** (DeepPink).
    - **Unified Relations**: Direct relationships discovered by the pathfinder (length=1) are now visually identical to standard stage edges and manual connections. They use the primary color and standard line style.
    - **Focused Pathfinding**: Only virtual paths (length > 1) use the `pathEdge` component and secondary color, making multi-hop connections immediately distinct from direct ones.

## [1.38.1] - 2026-03-06

### Changed
- **Label Aesthetic Update**: Removed the explicit border around relationship labels. The labels now use a clean, solid background to isolate text from lines without the visual noise of a stroke, aligning with a more minimalist design.

## [1.38.0] - 2026-03-06

### Changed
- **Relationship Label Refinement**: Improved label visibility and isolation from relationship lines.
    - **Solid Background**: Removed transparency (`opacity: 0.8` -> `fillOpacity: 1`) to ensure labels completely mask the underlying lines.
    - **Isolation Border**: Added a subtle `1px` border (`COLORS.panelBorder`) around all edge labels, providing a clean visual break between the text and the graph structure.
    - **Consistent Styling**: Applied these refinements across all edge types, including standard relations, manual connections, and discovered paths.

## [1.37.1] - 2026-03-06

### Fixed
- **Snapshot Thumbnails**: Resolved an issue where thumbnails appeared as empty backgrounds. The capture logic now captures the full viewport and resizes it proportionally via canvas to ensure all visible nodes and edges are included.
- **LocalStorage Protection**: Added a cap of 20 snapshots and switched to JPEG compression (0.7 quality) for thumbnails to prevent `localStorage` overflow.

## [1.37.0] - 2026-03-06

### Added
- **Snapshots System**: Introduced a powerful state-management panel on the left toolbar.
    - **Visual History**: Capture the exact state of the stage (all nodes, edges, and positions) with a single click.
    - **Interactive Thumbnails**: Each snapshot includes a high-fidelity image preview generated in real-time.
    - **One-Click Restore**: Replace the current stage with a saved state instantly.
    - **Persistence**: Snapshots are automatically saved to `localStorage`, ensuring history remains available across browser sessions.
    - **Management Tools**: Ability to delete specific snapshots from the history.

## [1.36.0] - 2026-03-06

### Changed
- **Drawer Interaction Optimization**: Converted the Settings and Toolbox drawers from `persistent` to `temporary` variants. Both drawers now feature `onClose` handlers, allowing them to be dismissed instantly by clicking outside or on the background backdrop, significantly improving UI ergonomics and focus management.

## [1.35.0] - 2026-03-06

### Changed
- **Branding Refinement**: Updated the system's secondary accent color from `HotPink` (#FF69B4) to `DeepPink` (#FF1493) for a more vibrant and professional appearance. This change ensures maximum compatibility with Material UI (MUI) color calculations. This affects paths, drawer headers, and active state indicators.

## [1.34.0] - 2026-03-06

### Changed
- **Node Label Refinement**: Adjusted the vertical positioning of node titles (labels). The labels have been moved significantly closer to the node center (from `mt: 1` to `mt: -0.60`) to create a more compact and integrated visual unit.

## [1.33.0] - 2026-03-05

### Added
- **Dynamic Graph Spacing Control**: Introduced a "Graph Spacing" slider in the Settings drawer (range 0.5x to 2.5x). This allows users to adjust the "gravitation" and layout density of the entire graph in real-time.
- **Immediate Re-layout**: Adjusting the spacing slider now triggers an instant re-calculation of the active layout, making the graph feel more interactive and "alive".
- **Rich Path Metadata**: Nodes within discovered paths are now enriched with full database properties (Labels, Icons, Types), replacing generic "Unknown" placeholders in the Path Drawer.

### Changed
- **Node UI Refinement**:
    - **Filigree Donuts**: Reduced donut ring thickness from 10 to 6 for a more elegant, less massive appearance.
    - **Clean Masking**: Increased the inner icon border to 5px using the stage's background color, creating a sharp visual gap between the icon and the donut ring.
    - **Flat Design**: Removed the glow/drop-shadow effect from nodes to achieve a cleaner, modern technical aesthetic.
- **Advanced Layout Integration**:
    - **Proportional Scaling**: All layout engines (Force, Circular, Grid, Concentric) now use the global spacing factor to scale distances, repulsion forces, and radii.
    - **Precise Hierarchical Layout**: Completely overhauled the Dagre-based hierarchical engine. Centering is now calculated dynamically, and node dimensions scale with the spacing factor, ensuring perfectly aligned structures at any density.
- **Snappy Interaction**: Completely disabled CSS transitions for edges and labels. Relationships and glyphs now stick instantly to node centers during movement, eliminating all lag and "swing-back" artifacts.

### Fixed
- **Slider Consistency**: Added persistence for the Graph Spacing setting using `localStorage`.
- **Hierarchical Alignment**: Fixed shifty/offset positioning in hierarchical layouts that previously occurred when using non-default spacing values.

## [1.32.0] - 2026-03-05

### Added
- **Intelligent Pathfinding Engine**: Implemented a background pathfinder using Memgraph's BFS algorithm. The system now automatically discovers "hidden" connections between any nodes currently on the stage (up to 10 hops deep).
- **Custom `PathEdge` Component**: Developed a high-performance SVG edge component for path visualization.
    - **Static Rendering**: Paths are static (no animation) to maintain focus, styled in the secondary Pink theme color.
    - **Smart Glyphs**: Circular pink badges appear in the center of paths, displaying the exact count of intermediate nodes (excluding start/end).
    - **Drop Shadows**: Added subtle depth to path glyphs for better visual separation.
- **Dedicated "Pfad" Drawer**:
    - Introduced a specific drawer mode for paths (Pink/Secondary) that lists all nodes in the discovered chain.
    - **Interactive Exploration**: Added "+" buttons to every node in the path list, allowing users to surgically "unpack" a path by adding its bridge nodes to the stage.
- **Enhanced Donut Visualization**: Overhauled the normalization logic for node rings. Segments now shrink relative to the original total count, creating "empty gaps" for neighbors already on stage. This provides a clear visual indicator of exploration progress.

### Changed
- **Visual Hierarchy Refinement**:
    - **Rendering Order**: All edges (real and virtual) now render behind nodes. Virtual paths render behind real relations to minimize clutter.
    - **Edge Styling**: Unified all real relationships to use the Primary Blue color, removing noisy type-based coloring rules.
    - **Snappy Interaction**: Removed bouncy CSS transitions from edges and labels. Connections now stick perfectly to node centers during dragging, eliminating "lag" and "ghosting".
- **Spacious Layouts**: Massive overhaul of all layout engines (Force, Dagre, Circular, Grid, Concentric). Increased link distances, repulsion, and ring radii by up to 100% to give the graph more room to "breathe".
- **Dynamic Style Sync**: Virtual paths now respect global edge style settings (Bezier, Straight, etc.) and update instantly when changed.

### Fixed
- **Performance Optimization**: Optimized pathfinding triggers to only fire when the set of node IDs changes, preventing redundant database requests during node movement.
- **DOM Consistency**: Fixed `validateDOMNesting` warnings in the neighbor lists by switching to `span` components for complex secondary text.
- **ReactFlow Deprecations**: Replaced `getRectOfNodes` with the modern `getNodesBounds` API.
- **Console Cleanup**: Silenced noisy debug logs and backend print statements for a cleaner developer experience.

## [1.31.0] - 2026-03-05

### Changed
- **Redefined Graph Interaction Model**: Completely overhauled the exploration workflow to prioritize controlled discovery over automatic expansion.
    - **Nodes**: Clicking a node now opens its details in the Sidebar instead of triggering an automatic neighbor expansion.
    - **Donut Segments**: Single-clicking a segment now opens a "Group Drawer" listing all neighbors in that category, while `Shift+Click` performs a "Cleanup" (collapsing that specific category from the stage).
- **Enhanced Neighbor List**: The "Neighbors" section in the drawers now displays relationship names (e.g., "lives on") instead of generic node types, providing immediate context for the link.
- **Directional Awareness**: Added subtle chevron markers (`ChevronLeft` / `ChevronRight`) to neighbor rows to indicate whether a relationship is incoming or outgoing relative to the selected node.
- **Simplified Edge Exploration**: Details for relationships are now accessible via a standard single `Click` (moved from `Shift+Click`).
- **Minimalist Tooltips**: Removed interaction help text from donut segment tooltips to maintain a clean, high-signal visual aesthetic.

### Added
- **"Collect Leaves" Functionality**: Implemented a new `Shift+Click` action on nodes that surgically removes "leaf" nodes (those with only one connection to the target) while preserving nodes that lead deeper into the network.

### Removed
- **Full Expansion Logic**: Disabled all "Full Expand" triggers, including the Spacebar global expansion shortcut and the `batchExpandNodes` engine, to encourage intentional, step-by-step graph building.

## [1.30.0] - 2026-03-01

### Added
- **Database Health Monitoring**: Implemented a real-time connectivity indicator in the status bar.
    - **Backend**: New `/health` endpoint performs active verification of the Memgraph connection.
    - **Frontend**: Automated polling system (10s interval) with a color-coded status dot (Green: Online, Red: Offline, Orange: Checking).
- **Interactive Status Prompts**: Added status bar hover support for the Database indicator.

### Fixed
- **Isolation Donut Persistence**: Fixed a bug where neighbor distribution rings (donuts) disappeared when using the "Isolate" function. The system now correctly references the original node state instead of the filtered UI view.

### Changed
- **Status Bar Refinement**: Optimized layout alignment using `box-sizing: border-box` and adjusted padding to ensure all indicators are perfectly aligned within the viewport.

## [1.29.0] - 2026-03-01

### Added
- **Context-Sensitive Status Bar**: Implemented a dynamic helper bar at the bottom of the screen that provides real-time interaction hints based on mouse hover.
- **UI-Wide Integration**: Added interactive status hints for:
    - **Stage**: Nodes (Expand/Details/Drag) and Edges (Type/Details).
    - **Toolbox**: Templates (Add/Batch-Load) and Relationship mode.
    - **Histogram**: Visibility toggles and Focus modes.
    - **Global Toolbar**: Search, Layout engines, Analysis algorithms, and Export tools.
    - **Profile Drawer**: Neighbor management, Edit mode, Icon picker, and Database deletion.
- **Semantic Styling**: Triggers (e.g., `CLICK`, `DRAG`) are styled in bright uppercase, while actions (e.g., `Expand`) use a subtle, darker sentence-case for optimal readability and a technical aesthetic.

### Changed
- **Adaptive UI Layout**: Restructured the main viewport using a flexbox column layout to ensure the ReactFlow canvas and status bar coexist without occlusion.
- **Drawer Ergonomics**: Added strategic bottom padding to the right profile drawer to maintain button accessibility above the new status bar.

## [1.28.0] - 2026-03-01

### Added
- **Weighted Edge Thickness**: Implemented dynamic stroke width for relationships. Edges now scale their thickness based on the `weight` property (1-10) provided by the database, allowing for immediate visual identification of relationship strength.
- **Weighted Edges Toggle**: Added a new "Weighted Edges" switch to the Settings panel, allowing users to toggle the dynamic thickness calculation on or off. When disabled, all edges revert to a uniform base thickness.
- **Backend Property Passthrough**: The expansion engine now automatically includes all relationship properties (like `weight`) in the edge data sent to the frontend.

### Changed
- **Histogram Interaction Refinement**: Applied `user-select: none` to the Entity Types panel. This prevents accidental text selection when using `Shift+Click` for multi-type highlighting, ensuring a smoother and more focused user experience.

### Fixed
- **State Scope Issue**: Fixed a `ReferenceError` during node expansion where the global `enableWeightedEdges` state was inaccessible to the detached data integration utility.

## [1.27.0] - 2026-02-28

### Added
- **Entity Isolation (Drill Down)**: New "Drill Down (Isolate)" button in the node drawer. This allows users to immediately clear the stage of all other entities, focusing exclusively on the selected node.
- **Robust Batch Architecture**: Globalized core backend utilities (`calculate_donut`, `category_map`) to ensure consistent data structures across all endpoints, including batch-loading and search.

### Changed
- **Drawer Footer Refinement**: Grouped "Remove from Canvas" and "Drill Down" buttons in a persistent, non-shrinking footer for improved ergonomics and faster exploration resets.
- **Enhanced Error Resilience**: The frontend now gracefully handles non-array responses from the backend during batch operations, preventing UI crashes.

### Fixed
- **Backend Scope Issue**: Resolved a `NameError` in the `/nodes-by-type` endpoint by lifting shared logic to the module level.

## [1.26.0] - 2026-02-28

### Added
- **Category Batch Loading**: Users can now `Shift+Click` any template in the Toolbox to immediately load all entities of that type from the database onto the stage.
- **Database Counters**: The Toolbox now displays the total number of available entities for each category (e.g., "BOOK (14)") directly below the template icons.
- **Node-Counts API**: New backend endpoint `/node-counts` provides real-time entity statistics for the frontend UI.

### Changed
- **Toolbox UI Refinement**: Simplified the Toolbox by removing redundant tooltips and integrating counts directly into the template labels for better glanceability.
- **Optimized Batch Layout**: Newly batch-loaded nodes are automatically arranged and the camera is adjusted to ensure full visibility of the added group.

## [1.25.0] - 2026-02-28

### Added
- **Asimov Universe Expansion**: Massive dataset update with over 40 interconnected entities, including major characters (Giskard, Hober Mallow, Bayta Darell), organizations (Second Foundation, Galactic Empire), and locations (Gaia, Solaria, Kalgan).
- **Books as Entities**: Introduced a new `book` category with dedicated icons and styling. Books are now fully integrated nodes linked via `APPEARS_IN` and `FEATURING` relationships.
- **Dynamic Property Editor**: The node drawer now automatically renders and allows editing for all database properties (e.g., `published` year for books, `planet` for characters).
- **Expandable Lore Descriptions**: Added a "Show more/less" feature for long entity descriptions, keeping the drawer clean while providing deep lore access.
- **Backend Dynamic Upsert**: Refactored the `/upsert-node` endpoint to dynamically handle any number of properties, enabling full database-backed customization from the frontend.

### Changed
- **Professional Drawer Layout**: Redesigned the sidebar structure to ensure the "Remove from Canvas" button is always visible and anchored to the bottom of the viewport using a fixed-height flex container.
- **Immersive Sidebar Aesthetics**: Added a custom, slim scrollbar for the drawer that blends seamlessly into the dark theme.

### Fixed
- **Cypher Escaping Stability**: Enhanced the import script and backend logic to correctly handle single quotes in titles and descriptions (e.g., "Foundation's Edge"), preventing database query failures.
- **Data Synchronization**: Ensured that manually added neighbors from the drawer immediately inherit all their database-driven attributes and styles on the stage.

## [1.24.0] - 2026-02-28

### Added
- **Full Relationship Editing**: Users can now modify existing relationships in the right drawer. This includes changing the relationship type (via a dropdown) and editing custom properties like `weight`, `since`, or `status`.
- **Intelligent Neighbor Addition**: Neighbors added via the drawer now correctly inherit their real database type and properties on the stage, replacing the generic "manual" label.
- **Backend Edge Update Engine**: Implemented a robust `/update-edge` endpoint that handles relationship type renames by managing edge deletion and recreation in Memgraph while preserving properties.

### Changed
- **Optimized Drawer Logic**: Lifted relationship lookup logic to ensure all actions (Add/Delete) in the neighbor list have access to full database metadata.
- **Improved Interaction Flow**: Selecting an edge for editing now creates a data snapshot, allowing users to revert changes using the `Escape` key.

### Fixed
- **ReferenceError Fix**: Resolved a scope issue in the drawer where `dbEdge` was not accessible to all interaction buttons.
- **Backend Syntax Compatibility**: Fixed a Python `SyntaxError` by moving string escaping logic outside of f-string expressions, ensuring compatibility with Python 3.11.

## [1.23.0] - 2026-02-28

### Added
- **Edge Path Customization**: Users can now choose between different visual styles for relationship lines in the Settings panel: `Straight`, `Bezier (Curved)`, `Step`, `Smooth Step`, and `Simple Bezier`.
- **Settings Persistence**: All visualization preferences (Edge Coloring, Node Donuts, and Edge Path Style) are now automatically saved to `localStorage` and restored upon browser reload.
- **Dynamic Style Sync**: Existing edges on the canvas update their path style in real-time when the setting is changed.

### Changed
- **Subtle Interaction Model**: Removed all visible handles and hover outlines during edge creation to maintain a clean, immersive aesthetic. Feedback is now provided solely through cursor changes and the animated connection line.
- **Enhanced Reliability**: Relationship deletion is now fully direction-agnostic and synchronized across all UI components (Stage, Profile Drawer, and Segment Preview).

### Fixed
- **Edge Style Consistency**: Unified `defaultEdgeOptions` with global settings to ensure newly expanded or created edges immediately match the active visualization rules.
- **Settings Initialization**: Fixed a bug where default visualization states could conflict with user preferences on first load.

## [1.22.0] - 2026-02-28

### Added
- **Manual Edge Creation Workflow**: Introduced a dedicated "Relationship Mode" in the toolbox. When active, users can draw connections directly between characters by clicking and dragging from icon to icon.
- **Visual Connection Feedback**: While drawing, a thick primary-colored line appears, which becomes dashed and animated once it "snaps" to a valid target node.
- **Relationship Type Definition**: A new drawer interface allows users to select from a predefined list of relationship types (e.g., `PROTECTS`, `CREATED`, `TRAVELS_WITH`) immediately after drawing a connection.
- **Integrated Relationship Deletion**: Added the ability to delete database relationships directly from the node profile and donut segment drawers, regardless of whether the partner is currently on the stage.
- **Backend Persistence (`/create-edge`)**: New POST endpoint to permanently save user-created relationships into the Memgraph database using Cypher `MERGE` logic.

### Changed
- **Invisible Interaction Handles**: Replaced technical anchor points with full-area invisible handles that only activate in connection mode, keeping the UI clean during normal navigation.
- **Seamless Edge Deletion**: The drawer now remains open after deleting a relationship, providing a continuous workflow for managing entity connections.
- **Direction-Agnostic Operations**: Both deletion and expansion now handle edge directions intelligently, preventing "ghost" relations caused by mismatched source/target orientations in the DB.

### Fixed
- **Manual Edge Donut Sync**: Manually created edges now correctly update the node's internal `total_count`, ensuring donut segments are properly restored when partner nodes are removed from the canvas.
- **Real-time Donut Shrinking**: Fixed a bug where donut segments wouldn't update after deletion in the drawer due to missing type metadata for off-stage nodes.

## [1.21.0] - 2026-02-27

### Added
- **Edge Details Drawer**: Shift-clicking an edge now opens the right sidebar with comprehensive information, including relationship type, connected nodes (with type-colored icons), and all database-driven properties (weight, status, date).
- **Global Settings Panel**: A new dedicated settings panel on the left toolbar allows users to toggle visualization rules in real-time.
- **Dynamic Donut Shrinking**: Donut segments now dynamically shrink or vanish based on the nodes currently present on the stage. This provides immediate visual feedback on which connections have already been explored.
- **Edge Data Enrichment**: The Asimov dataset now includes additional relationship properties like `weight`, `since`, and `status` for more detailed analysis.

### Changed
- **Visual Toggle System**: Users can now globally disable "Edge Coloring Rules" and "Node Donuts" for a cleaner, more focused view of the graph structure.
- **Sync Consistency**: Unified category naming (e.g., using `person` instead of `people`) across the entire stack to match the backend database schema perfectly.

### Fixed
- **Accurate Donut Proportions**: Refined the Cypher query logic to count distinct neighbor nodes instead of relationships, ensuring that donut segments reflect the true quantity of connected entities.
- **Backend Stability**: Fixed Python indentation errors and Cypher syntax issues in the `/expand` endpoint.

## [1.20.0] - 2026-02-27

### Added
- **Type-Aware Hierarchical Layout**: The hierarchical layout engine now automatically sorts nodes by their **Entity Type** and **Label** horizontally. This results in much cleaner, grouped structures within each level.
- **Smart Camera Tracking (`fitToNodes`)**: Replaced standard `fitView` with a more precise manual calculation system that determines the final bounding box before node animations finish, preventing "half-visible" graphs in structured layouts.
- **Responsive Camera Triggers**: Added automatic camera adjustments to `onDrillDown` and `onDeleteNode` for a seamless experience.

### Changed
- **Optimized Animation Timing**: Refined the camera zoom delay to 300ms. The camera now begins its move while nodes are still in motion, creating a more fluid and responsive "fly-out" effect.
- **Improved Animation Consistency**: Re-enabled transitions for selected nodes to ensure that expanded clusters always glide smoothly into position.
- **Manual Alignment Refinement**: Replaced random offsets with a fixed 200px rightward placement for isolated nodes added from search.

### Fixed
- **Dagre Sorting Logic**: Corrected the horizontal order in hierarchical views by sorting edges by the target node's properties, overriding Dagre's default "first-seen" placement.
- **Node dragging stability**: Confirmed that only active dragging disables transitions, preserving smooth motion for all other layout-driven changes.

## [1.19.0] - 2026-02-27

### Added
- **Toolbox (Node Templates)**: Introduced a persistent left drawer containing templates for `person`, `robot`, `planet`, etc. Users can now build the graph manually via **Drag & Drop**.
- **Interactive Node Editor**: Added an Edit Mode to the right drawer. Includes live-editing for labels and descriptions, plus a custom icon picker.
- **Backend Persistence (UPSERT/DELETE)**: Implemented full CRUD operations for nodes. Changes are automatically saved to Memgraph, and nodes can be permanently deleted from the database.
- **Smart "Escape" Handling**: Implemented a draft system. Pressing `Escape` while editing reverts changes for existing nodes or removes un-persisted "draft" nodes from the canvas.
- **Unified Toolbar Alignment**: Consistently aligned all top-level UI elements (Toolbox toggle, Search, Layouts, Algorithms, Histogram) at the top of the viewport.

### Changed
- **Optimized Search**: The search engine is now more robust, handling case-insensitivity, special characters, and missing labels by falling back to entity types.
- **UX Refinements**: 
  - Isolated nodes from search now automatically align to the right of existing elements to prevent overlapping.
  - Removed the "empty ring" visual for nodes without relationships for a cleaner aesthetic.
  - Disabled CSS transitions during node dragging for precise, non-floating movement.

### Fixed
- **Sync Consistency**: Unified category naming (e.g., using `person` instead of `people`) to match the backend database schema perfectly.

## [1.18.0] - 2026-02-27

### Added
- **Default Dark Theme**: Implemented a comprehensive dark grey (`#121212`) aesthetic as the new system standard, providing a professional and immersive "Operating System" feel.
- **Centralized Theme Management**: Extracted all UI, node, and edge colors into a dedicated `theme.js` file, allowing for rapid global style adjustments.
- **Themed UI Components**: Custom-styled ReactFlow Controls, Background patterns, and MUI Panels to align with the new dark aesthetic.

### Changed
- **Refined Color Palette**: Integrated `DeepSkyBlue` and `HotPink` as primary and secondary accent colors.
- **Optimized Visibility**: Updated node labels, search field borders, and panel outlines for maximum readability and a cleaner look on dark backgrounds.
- **Animation Timing**: Further refined the edge appearance delay (200ms) for a snappier, more responsive feel during graph growth.

### Fixed
- **Sync Consistency**: Unified category naming (e.g., using `person` instead of `people`) to match the backend database schema perfectly.

## [1.17.0] - 2026-02-27

### Added
- **Synchronized Edge Animation**: Implemented CSS transitions for SVG edge paths (`d` attribute). Connections now fluidly follow nodes during layout changes instead of jumping to the end position.
- **Label Motion**: Edge labels now animate their position (`transform`) in sync with the nodes and edges, creating a cohesive "liquid" graph experience.
- **Improved Edge Fade-In**: Refined the timing of new edge appearances (200ms delay + 1s fade) to prevent visual clutter during the rapid node expansion phase.

### Changed
- **Animation Performance**: Optimized CSS transitions to use hardware-accelerated properties where possible for smoother high-node-count interactions.

## [1.16.0] - 2026-02-27

### Added
- **New Layout Engines**: Introduced `Grid` and `Concentric` layout options. The Concentric layout automatically uses node centrality scores to place important entities at the center.
- **Selection-Based Hierarchical Layout**: The hierarchical layout now places selected nodes at the top of the tree, allowing users to define the root of the hierarchy dynamically.
- **Shift + Delete (Inverted Deletion)**: Implemented a powerful shortcut to remove everything *except* the currently selected nodes, acting as a quick keyboard-driven "Drill Down".

### Changed
- **Semantic Category Labeling**: Switched category internal IDs from color names to semantic labels (e.g., "Science Group", "People Group"). This improves readability in the Sidebar and data consistency.
- **Refined Branding**: Updated the search bar placeholder to "Search the Asimov Universe!" for a more engaging user experience.

### Fixed
- **Category Consistency**: Unified the mapping for "Science" and "Entity" types to ensure they always appear under the same semantic group in the UI.

## [1.15.0] - 2026-02-27

### Added
- **Fly-Out Expansion Animation**: Restored the signature expansion effect where new nodes emerge from their parent before sliding to their layout positions. This was achieved using a timed two-step state update (150ms delay) to ensure browser repaint.
- **Aggressive Error Suppression**: Implemented a robust global error handler to intercept and suppress "ResizeObserver" loop errors. This prevents intrusive development overlays during complex layout transitions.

### Changed
- **Sidebar Sorting**: Neighbor lists and preview groups in the right Drawer are now automatically sorted alphabetically by **Entity Type**, making it easier to navigate large clusters.
- **Refined Force Layout**: Optimized the `force-directed` layout parameters for a more balanced "airy" feel (Link distance: 200, Repulsion: -800, Collision: 80).
- **CSS Animation Safety**: Applied `!important` to node transitions to ensure they aren't overridden by ReactFlow's internal style updates during rapid expansion.

### Fixed
- **ResizeObserver Loop Error**: Resolved the persistent runtime error caused by simultaneous node transitions and camera `fitView` adjustments.
- **Development Overlay Block**: Configured the error handler to specifically target and hide Webpack and Next.js dev-server overlays that were blocking the UI.

## [1.14.0] - 2026-02-27

### Added
- **Expanded Universe Data**: Massive expansion of the Asimov dataset (35+ nodes, 50+ edges), including characters like Preem Palver, Arcadia Darell, Bel Riose, and Cleon I.
- **Rich Metadata**: Added a `description` field to all entities, providing deep lore, biographies, and historical context within the Sidebar.
- **Dynamic Lore Integration**: Updated the import pipeline and API to support and display extended text metadata.

### Changed
- **Sidebar UX**: Redesigned the Drawer to feature entity descriptions prominently at the top, styled with italics for readability.

## [1.13.0] - 2026-02-27

### Added
- **Space-to-Expand**: Implemented a global shortcut (Spacebar) to expand all currently visible nodes simultaneously, allowing for rapid exploration of the network.
- **Robust Batch Expansion**: Developed `batchExpandNodes` logic that aggregates multiple expansion requests and performs a single atomic state update to prevent race conditions and state overwriting.

### Changed
- **Clear Canvas Icon**: Replaced the previous `ClearAll` icon with a standard "X" (`CloseIcon`) for clearer visual intent.

### Fixed
- **Expansion Reliability**: Fixed a bug where rapid, simultaneous expansion requests (via Space) would fail to integrate all new data due to overlapping state updates.

## [1.12.0] - 2026-02-27

### Added
- **Social Graph Algorithms**: Integrated backend support for advanced graph metrics:
  - **Degree Centrality**: Identifies the most connected hubs.
  - **Betweenness Centrality**: Highlights bridge nodes that control information flow.
  - **Closeness Centrality**: Measures how "near" a node is to all other nodes.
  - **PageRank**: Ranks nodes based on the importance of their neighbors.
- **Dynamic Node Scaling**: Node sizes now automatically adjust based on the selected algorithm's score, providing instant visual feedback on network importance.
- **Algorithm Toolbar**: Added a dedicated toolbar in the top-right panel for switching between centrality metrics.

### Changed
- **Enhanced Node Data**: Updated node schema to support real-time score injection from the `/analyze` endpoint.

### Fixed
- **Layout Recovery**: Restored missing layout engine functions (`getForceLayout`, `getCircularLayout`, `getLayoutedElements`) that were accidentally removed during refactoring.
- **Handler Stability**: Ensured all algorithm and layout handlers are properly scoped within `useCallback`.

## [1.11.0] - 2026-02-27

### Added
- **Node Deletion**: Introduced a "Remove from Canvas" button at the bottom of the Drawer, allowing users to prune specific nodes and their connected edges from the current exploration.

### Changed
- **Immersive Viewport**: Removed scrollbars from the main window and applied `overflow: hidden` to provide a true "Operating System" fullscreen experience.
- **Restored Branding**: Reverted the search bar placeholder to "Search Asimov's Universe..." for consistency with the project's theme.

### Fixed
- **Layout Switcher**: Resolved a `ReferenceError` where `onLayoutClick` was missing after refactoring.
- **JSX Integrity**: Fixed a syntax error involving an incorrectly closed `Paper` tag in the top-right panel.

## [1.10.0] - 2026-02-27

### Added
- **PNG Export**: Users can now download the current graph view as a high-resolution PNG image. The export logic automatically hides UI panels and controls for a clean capture.
- **Drill Down Mechanism**: Added a "Drill Down" button to the histogram. It allows users to permanently remove all non-highlighted nodes from the canvas to focus on specific subsets.
- **Multi-Type Highlighting**: Enabled `Shift + Click` on histogram labels to highlight multiple entity types simultaneously.
- **Advanced CSS Security Handling**: Configured `crossorigin` attributes for external stylesheets (Google Fonts) to ensure consistent text rendering during image export.

### Changed
- **Codebase Refactoring**: Completely restructured `App.jsx` to improve component scope stability and prevent runtime reference errors.
- **Enhanced Sidebar Reliability**: Improved data checking in the neighbor list to prevent crashes during rapid expansions.

### Fixed
- **SVG Export Security**: Resolved `SecurityError` during PNG generation caused by Cross-Origin CSS rules.
- **Handler Scope**: Fixed `ReferenceError` issues related to `onExport` and other handler functions.

## [1.9.0] - 2026-02-26

### Added
- **Interactive Highlighting**: Clicking a type label or bar in the histogram now highlights all corresponding nodes on the canvas by dimming out unrelated elements (opacity reduction).
- **Centered Search Interface**: Moved the search bar to a prominent `top-center` position for better accessibility.
- **Clear Canvas Button**: Integrated a red `ClearAll` button next to the search bar to instantly reset the entire exploration.
- **Auto-Select on Search**: Pressing `Enter` in the search field now automatically selects the first result, adds it to the canvas, and centers the camera.

### Changed
- **Advanced Histogram Interaction**: Refactored event handling in the filter panel to separate "Visibility Toggling" (Checkbox) from "Focus Highlighting" (Label click).
- **Refined UI Feedback**: Added hover states and selection backgrounds to histogram entries to signal interactivity.

### Fixed
- **Event Bubbling**: Resolved a conflict where clicking histogram labels would unintentionally trigger checkboxes.
- **Search reliability**: Optimized Backend `search` logic to be case-insensitive and robust against special characters.

## [1.8.0] - 2026-02-26

## [1.0.0] - 2026-02-26

### Added
- **Custom Node Architecture**: Implemented `KeyLinesNode` in React with SVG Donut and MUI Icons.
- **Graph Interaction**: Basic radial expansion on node click.
- **Backend API**: FastAPI endpoint with Memgraph/GQLAlchemy integration.
- **Infrastructure**: Initial Docker Compose setup.
