import dagre from 'dagre';
import * as d3Force from 'd3-force';

/**
 * Utility to calculate the center of gravity for a set of nodes
 */
export const getLayoutCenter = (nodes) => {
  if (!nodes || nodes.length === 0) return { x: 400, y: 400 };
  const avgX = nodes.reduce((sum, n) => sum + n.position.x, 0) / nodes.length;
  const avgY = nodes.reduce((sum, n) => sum + n.position.y, 0) / nodes.length;
  return { x: avgX, y: avgY };
};

/**
 * 1. Sequential Layout (Top-to-Bottom)
 * Uses Dagre for hierarchical positioning.
 */
const getSequentialLayout = (nodes, edges, gravity, rootNodeId = null) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 180;
  const nodeHeight = 80;
  const spacing = 150 / gravity;

  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: spacing * 0.8,
    ranksep: spacing * 1.2,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // If we have a root node, we want all paths to FLOW AWAY from it.
  // We'll perform a simple BFS/DFS to orient edges away from the root.
  const adjustedEdges = [...edges];
  if (rootNodeId) {
    const visited = new Set([rootNodeId]);
    const queue = [rootNodeId];
    
    // Create an adjacency list for UNORIENTED traversal
    const adj = {};
    edges.forEach(e => {
      if (!adj[e.source]) adj[e.source] = [];
      if (!adj[e.target]) adj[e.target] = [];
      adj[e.source].push(e);
      adj[e.target].push(e);
    });

    while (queue.length > 0) {
      const u = queue.shift();
      const neighbors = adj[u] || [];
      
      neighbors.forEach(edge => {
        const v = edge.source === u ? edge.target : edge.source;
        if (!visited.has(v)) {
          visited.add(v);
          queue.push(v);
          
          // Force edge to point from U to V for layout purposes
          const edgeIdx = adjustedEdges.findIndex(e => e.id === edge.id);
          if (edgeIdx > -1) {
            adjustedEdges[edgeIdx] = { ...edge, source: u, target: v };
          }
        }
      });
    }
  }

  adjustedEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    return {
      ...node,
      position: { x: pos.x - nodeWidth / 2, y: pos.y - nodeHeight / 2 },
    };
  });
};

/**
 * 2. Force-Directed Layout (Organic)
 * Static calculation using d3-force. 
 */
const getForceLayout = (nodes, edges, gravity) => {
  const center = getLayoutCenter(nodes);
  
  // Create shallow copies for simulation
  const simNodes = nodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y }));
  const nodeIds = new Set(simNodes.map((n) => n.id));
  const simLinks = edges
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((e) => ({ source: e.source, target: e.target }));

  // INCREASED DISTANCES for a "looser" feel.
  // Note: Gravity is now handled by linear scaling in App.jsx,
  // so these act as the stable baseline for the structural calculation.
  const linkDistance = 250;
  const repulsion = -1800; 

  const simulation = d3Force.forceSimulation(simNodes)
    // Pull nodes toward their neighbors
    .force('link', d3Force.forceLink(simLinks).id((d) => d.id).distance(linkDistance).strength(1.2))
    // Stronger repulsion with larger range
    .force('charge', d3Force.forceManyBody().strength(repulsion).distanceMax(1200))
    // Soft centering forces
    .force('x', d3Force.forceX(center.x).strength(0.08))
    .force('y', d3Force.forceY(center.y).strength(0.08))
    // Prevent overlap
    .force('collide', d3Force.forceCollide().radius(90)) 
    .stop();

  // Perform 300 ticks in the background
  for (let i = 0; i < 300; ++i) simulation.tick();

  return nodes.map((node) => {
    const sn = simNodes.find((s) => s.id === node.id);
    return { ...node, position: { x: sn.x, y: sn.y } };
  });
};

/**
 * 3. Circular Layout
 */
const getCircularLayout = (nodes, gravity) => {
  const center = getLayoutCenter(nodes);
  // Higher gravity = smaller radius
  const radius = (Math.max(400, nodes.length * 60)) / gravity;

  return nodes.map((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    return {
      ...node,
      position: {
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      },
    };
  });
};

/**
 * 4. Concentric Layout (Tiered Importance)
 * Top 5 (Center) -> Next 25 (Middle) -> Rest (Outer)
 */
const getConcentricLayout = (nodes, gravity, rootNodeId = null) => {
  const center = getLayoutCenter(nodes);
  
  // Sort by importance (highest first)
  let sorted = [...nodes].sort((a, b) => (b.data?.importance || 0) - (a.data?.importance || 0));
  
  // If we have a root node, we FORCE it to be the first element (the absolute center)
  if (rootNodeId) {
    const rootIdx = sorted.findIndex(n => n.id === rootNodeId);
    if (rootIdx > -1) {
      const rootNode = sorted.splice(rootIdx, 1)[0];
      sorted.unshift(rootNode);
    }
  }

  const result = [];
  const ring1 = sorted.slice(0, 1);      // Just the top 1 node in the center (often the root)
  const ring2 = sorted.slice(1, 10);     // 9 nodes in ring 2
  const ring3 = sorted.slice(10, 40);    // 30 nodes in ring 3
  const ring4 = sorted.slice(40);        // rest in ring 4

  const placeInRing = (nodeList, baseRadius) => {
    if (nodeList.length === 0) return;
    const radius = baseRadius / gravity;
    nodeList.forEach((node, i) => {
      const angle = (i / nodeList.length) * 2 * Math.PI;
      result.push({
        ...node,
        position: {
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle),
        },
      });
    });
  };

  placeInRing(ring1, 0); 
  placeInRing(ring2, 250);
  placeInRing(ring3, 600);
  placeInRing(ring4, 1100);

  return result;
};

/**
 * Main Layout Engine Entry Point
 */
export const calculateLayout = (nodes, edges, type, gravityValue, rootNodeId = null) => {
  if (!nodes || nodes.length === 0) return [];

  // Normalize gravityValue (ensure it's a positive number, default to 1.0)
  const gravity = parseFloat(gravityValue) || 1.0;

  let layoutedNodes = [];
  switch (type) {
    case 'sequential':
      layoutedNodes = getSequentialLayout(nodes, edges, gravity, rootNodeId);
      break;
    case 'force':
      layoutedNodes = getForceLayout(nodes, edges, gravity);
      break;
    case 'circular':
      layoutedNodes = getCircularLayout(nodes, gravity);
      break;
    case 'concentric':
      layoutedNodes = getConcentricLayout(nodes, gravity, rootNodeId);
      break;
    default:
      return nodes;
  }

  // Preserve the original viewport center to prevent the graph from jumping
  const oldCenter = getLayoutCenter(nodes);
  const newCenter = getLayoutCenter(layoutedNodes);
  const offsetX = oldCenter.x - newCenter.x;
  const offsetY = oldCenter.y - newCenter.y;

  return layoutedNodes.map(n => ({
    ...n,
    position: { x: n.position.x + offsetX, y: n.position.y + offsetY }
  }));
};
