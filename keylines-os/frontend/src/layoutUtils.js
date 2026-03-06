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
 * 1. Sequential Layout (Left-to-Right)
 * Uses Dagre for hierarchical positioning.
 */
const getSequentialLayout = (nodes, edges, gravity) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 180;
  const nodeHeight = 80;

  // Spacing scales inversely with gravity (higher gravity = tighter)
  const spacing = 150 / gravity;

  dagreGraph.setGraph({
    rankdir: 'LR',
    nodesep: spacing * 0.8,
    ranksep: spacing * 1.2,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
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
 * Sensitivity: Higher gravity = lower link distance and lower repulsion.
 */
const getForceLayout = (nodes, edges, gravity) => {
  const center = getLayoutCenter(nodes);
  
  // Create shallow copies for simulation
  const simNodes = nodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y }));
  const nodeIds = new Set(simNodes.map((n) => n.id));
  const simLinks = edges
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((e) => ({ source: e.source, target: e.target }));

  // GRAVITY SCALING: 
  // Higher gravity (e.g., 2.0) -> smaller distance, weaker repulsion -> Tighter graph
  // Lower gravity (e.g., 0.5) -> larger distance, stronger repulsion -> Loose graph
  const linkDistance = 300 / gravity;
  const repulsion = -2000 / gravity; 

  const simulation = d3Force.forceSimulation(simNodes)
    .force('link', d3Force.forceLink(simLinks).id((d) => d.id).distance(linkDistance).strength(1))
    .force('charge', d3Force.forceManyBody().strength(repulsion).distanceMax(1500))
    .force('center', d3Force.forceCenter(center.x, center.y))
    .force('collide', d3Force.forceCollide().radius(120)) // Strictly prevent overlapping
    .stop();

  // Perform 300 ticks in the background to avoid UI wobbling
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
const getConcentricLayout = (nodes, gravity) => {
  const center = getLayoutCenter(nodes);
  // Sort by importance (highest first)
  const sorted = [...nodes].sort((a, b) => (b.data?.importance || 0) - (a.data?.importance || 0));
  
  const result = [];
  const ring1 = sorted.slice(0, 5);      
  const ring2 = sorted.slice(5, 30);     
  const ring3 = sorted.slice(30);        

  const placeInRing = (nodeList, baseRadius) => {
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

  placeInRing(ring1, ring1.length > 1 ? 150 : 0);
  placeInRing(ring2, 500);
  placeInRing(ring3, 1000);

  return result;
};

/**
 * Main Layout Engine Entry Point
 */
export const calculateLayout = (nodes, edges, type, gravityValue) => {
  if (!nodes || nodes.length === 0) return [];

  // Normalize gravityValue (ensure it's a positive number, default to 1.0)
  const gravity = parseFloat(gravityValue) || 1.0;

  let layoutedNodes = [];
  switch (type) {
    case 'sequential':
      layoutedNodes = getSequentialLayout(nodes, edges, gravity);
      break;
    case 'force':
      layoutedNodes = getForceLayout(nodes, edges, gravity);
      break;
    case 'circular':
      layoutedNodes = getCircularLayout(nodes, gravity);
      break;
    case 'concentric':
      layoutedNodes = getConcentricLayout(nodes, gravity);
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
