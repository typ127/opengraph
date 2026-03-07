import { useEffect, useRef } from 'react';
import * as d3Force from 'd3-force';

/**
 * useLiveForceLayout
 * 
 * Manages a persistent D3 force simulation for React Flow nodes.
 * Achieve a "Live & Warm" feel where physics parameters update the running simulation.
 */
export const useLiveForceLayout = (nodes, edges, setNodes, options, isActive, layoutTrigger = 0) => {
  const simulationRef = useRef(null);
  const lastTriggerRef = useRef(layoutTrigger);

  // 1. Initialize the simulation ONCE
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
        .alphaMin(0.05) // Clean cut-off
        .alphaDecay(0.08) // More time for movement
        .velocityDecay(0.55); // Smoother travel

      // LIVE TICK UPDATES
      simulationRef.current.on('tick', () => {
        const simNodes = simulationRef.current.nodes();
        
        setNodes((nds) => nds.map((node) => {
          const matched = simNodes.find(sn => sn.id === node.id);
          if (matched && !isNaN(matched.x) && !isNaN(matched.y)) {
            // We only update position. D3 mutates simNode.x/y directly.
            return {
              ...node,
              position: { x: matched.x, y: matched.y }
            };
          }
          return node;
        }));
      });
    }

    // Cleanup on unmount or when layout is switched
    return () => {
      if (simulationRef.current) simulationRef.current.stop();
    };
  }, [isActive, setNodes]);

  // 2. Synchronize Structural Changes (Adding/Removing nodes/edges) OR Manual Rearrange
  useEffect(() => {
    if (!isActive || !simulationRef.current) return;

    const sim = simulationRef.current;
    const currentSimNodes = sim.nodes();
    const isManualTrigger = layoutTrigger !== lastTriggerRef.current;
    lastTriggerRef.current = layoutTrigger;

    // Update node list while preserving existing simulation state (x, y, vx, vy)
    // UNLESS it's a manual trigger, then we randomize!
    const newSimNodes = nodes.map(n => {
      const existing = currentSimNodes.find(sn => sn.id === n.id);
      
      if (existing && !isManualTrigger) {
        // Update importance in simulation node
        existing.importance = n.data?.importance || 0.5;
        return existing;
      }
      
      // If new node OR manual rearrange, give it random position or current pos
      const x = isManualTrigger ? (Math.random() - 0.5) * 800 + 400 : n.position.x;
      const y = isManualTrigger ? (Math.random() - 0.5) * 800 + 400 : n.position.y;
      
      return { 
        id: n.id, 
        x, y, vx: 0, vy: 0, 
        importance: n.data?.importance || 0.5 
      };
    });

    sim.nodes(newSimNodes);

    // Sync Edges (Links)
    const simLinks = edges
      .filter(e => nodes.some(n => n.id === e.source) && nodes.some(n => n.id === e.target))
      .map(e => ({ 
        source: e.source, 
        target: e.target,
        id: e.id,
        isPath: e.data?.type === 'PATH' // Pink edges are path edges
      }));

    if (!sim.force('link')) {
      sim.force('link', d3Force.forceLink().id(d => d.id));
    }
    sim.force('link').links(simLinks);

    // Reheat significantly when structure changes or manually triggered
    sim.alpha(isManualTrigger ? 1.0 : 0.3).restart();
  }, [nodes.length, edges.length, isActive, layoutTrigger]);

  // 3. DYNAMIC PARAMETER UPDATES (The Core Feature)
  useEffect(() => {
    if (!isActive || !simulationRef.current) return;

    const sim = simulationRef.current;
    
    // Apply friction changes live
    sim.velocityDecay(options.friction || 0.5);

    // Apply specific forces based on options
    if (!sim.force('charge')) sim.force('charge', d3Force.forceManyBody());
    sim.force('charge')
       .strength(d => options.repulsion * (d.importance || 0.5) * (options.importanceWeight || 2.0))
       .distanceMax(1200);

    if (sim.force('link')) {
      sim.force('link')
         .distance(options.linkDistance)
         .strength(d => d.isPath ? (options.linkStrengthPink || 0.3) : (options.linkStrengthBlue || 1.2));
    }

    if (!sim.force('collide')) sim.force('collide', d3Force.forceCollide());
    sim.force('collide').radius(options.collisionRadius || 90);

    // Soft Centering
    // Instead of using dynamic avgX/Y (which can cause drift), we use a fixed center
    // based on the initial nodes if simulation is just starting, or keep it stable.
    if (!sim.force('center')) {
      const avgX = nodes.reduce((sum, n) => sum + n.position.x, 0) / (nodes.length || 1);
      const avgY = nodes.reduce((sum, n) => sum + n.position.y, 0) / (nodes.length || 1);
      sim.force('center', d3Force.forceCenter(avgX, avgY));
    }

    // Pull toward center softly
    if (!sim.force('x')) sim.force('x', d3Force.forceX());
    sim.force('x').x(sim.force('center').x()).strength(options.gravityX || 0.03);

    if (!sim.force('y')) sim.force('y', d3Force.forceY());
    sim.force('y').y(sim.force('center').y()).strength(options.gravityY || 0.03);

    // CRITICAL: Gently "reheat" without jumping
    sim.alpha(0.3).restart();

  }, [
    options.linkDistance,
    options.repulsion,
    options.collisionRadius,
    options.linkStrengthBlue,
    options.linkStrengthPink,
    options.gravityX,
    options.gravityY,
    options.friction,
    options.importanceWeight,
    isActive
  ]);

  return simulationRef;
};
