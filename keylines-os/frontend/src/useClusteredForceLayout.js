import { useEffect, useRef, useMemo } from 'react';
import * as d3Force from 'd3-force';

/**
 * useClusteredForceLayout
 * 
 * Groups nodes into visual "islands" based on their data.planet attribute.
 * Uses d3-force with multiple focal points.
 */
export const useClusteredForceLayout = (nodes, edges, setNodes, options, isActive, layoutTrigger = 0) => {
  const simulationRef = useRef(null);
  const lastTriggerRef = useRef(layoutTrigger);

  // 1. Calculate Cluster Centers
  // We memoize this so it only recalculates when nodes change significantly
  const clusterCenters = useMemo(() => {
    if (!isActive) return new Map();

    const planets = Array.from(new Set(nodes.map(n => n.data?.planet || 'Unknown'))).sort();
    const centers = new Map();
    
    // Distribute centers in a large circle
    const numClusters = planets.length;
    const radius = Math.max(600, numClusters * 150); // Scale radius with number of clusters
    const angleStep = (2 * Math.PI) / (numClusters || 1);

    planets.forEach((planet, i) => {
      const angle = i * angleStep;
      centers.set(planet, {
        x: radius * Math.cos(angle),
        y: radius * Math.sin(angle)
      });
    });

    return centers;
  }, [nodes.length, isActive]);

  // 2. Initialize or Update Simulation
  useEffect(() => {
    if (!isActive) {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
      return;
    }

    if (!simulationRef.current) {
      simulationRef.current = d3Force.forceSimulation()
        .alphaTarget(0)
        .alphaMin(0.001)
        .velocityDecay(options.friction || 0.4);

      simulationRef.current.on('tick', () => {
        const simNodes = simulationRef.current.nodes();
        setNodes((nds) => nds.map((node) => {
          const matched = simNodes.find(sn => sn.id === node.id);
          if (matched && !isNaN(matched.x) && !isNaN(matched.y)) {
            return {
              ...node,
              position: { x: matched.x, y: matched.y }
            };
          }
          return node;
        }));
      });
    }

    return () => {
      if (simulationRef.current) simulationRef.current.stop();
    };
  }, [isActive, setNodes]);

  // 3. Sync Structural Changes
  useEffect(() => {
    if (!isActive || !simulationRef.current) return;

    const sim = simulationRef.current;
    const currentSimNodes = sim.nodes();
    const isManualTrigger = layoutTrigger !== lastTriggerRef.current;
    lastTriggerRef.current = layoutTrigger;

    const newSimNodes = nodes.map(n => {
      const existing = currentSimNodes.find(sn => sn.id === n.id);
      if (existing && !isManualTrigger) return existing;
      
      // Starting positions
      const x = n.position.x || (Math.random() - 0.5) * 1000;
      const y = n.position.y || (Math.random() - 0.5) * 1000;
      
      return { 
        id: n.id, 
        planet: n.data?.planet || 'Unknown',
        x, y, vx: 0, vy: 0 
      };
    });

    sim.nodes(newSimNodes);

    // Sync Edges
    const simLinks = edges
      .filter(e => nodes.some(n => n.id === e.source) && nodes.some(n => n.id === e.target))
      .map(e => ({ source: e.source, target: e.target, id: e.id }));

    if (!sim.force('link')) {
      sim.force('link', d3Force.forceLink().id(d => d.id));
    }
    sim.force('link').links(simLinks);

    sim.alpha(isManualTrigger ? 1.0 : 0.3).restart();
  }, [nodes.length, edges.length, isActive, layoutTrigger]);

  // 4. Update Forces (Clustering logic)
  useEffect(() => {
    if (!isActive || !simulationRef.current) return;

    const sim = simulationRef.current;
    
    // Friction
    sim.velocityDecay(options.friction || 0.4);

    // Repulsion (Many-Body)
    if (!sim.force('charge')) sim.force('charge', d3Force.forceManyBody());
    sim.force('charge').strength(options.repulsion || -1000).distanceMax(1000);

    // Links
    if (sim.force('link')) {
      sim.force('link')
         .distance(options.linkDistance || 150)
         .strength(0.5); // Fixed moderate strength for links in clustered mode
    }

    // Collision (to prevent node overlap)
    if (!sim.force('collide')) sim.force('collide', d3Force.forceCollide());
    sim.force('collide').radius(options.collisionRadius || 70);

    // CLUSTER FORCES (The magic part)
    // We use forceX and forceY targeting the specific center for each node's planet
    const gravityStrength = options.clusterGravity || 0.1;

    sim.force('x', d3Force.forceX((d) => {
      const center = clusterCenters.get(d.planet || 'Unknown');
      return center ? center.x : 0;
    }).strength(gravityStrength));

    sim.force('y', d3Force.forceY((d) => {
      const center = clusterCenters.get(d.planet || 'Unknown');
      return center ? center.y : 0;
    }).strength(gravityStrength));

    // Warm restart
    sim.alpha(0.3).restart();

  }, [
    options.clusterGravity,
    options.repulsion,
    options.collisionRadius,
    options.linkDistance,
    options.friction,
    clusterCenters,
    isActive
  ]);

  return simulationRef;
};
