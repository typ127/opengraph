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
const getSequentialLayout = (nodes, edges, options = {}, rootNodeId = null) => {
  console.log("DAGRE CALCULATION - Ranker:", options.ranker, "Direction:", options.rankDir);
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = options.nodeWidth || 180;
  const nodeHeight = options.nodeHeight || 80;
  
  // Use specific options or fallback to defaults
  const nodeSep = options.nodeSpacing || 120;
  const rankSep = options.rankSpacing || 180;
  const rankDir = options.rankDir || 'TB';
  const ranker = options.ranker || 'network-simplex';
  const align = options.align || 'UL';

  dagreGraph.setGraph({
    rankdir: rankDir,
    ranker: ranker,
    align: align,
    nodesep: nodeSep,
    ranksep: rankSep,
    marginx: 50,
    marginy: 50,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Re-orient edges away from the root if provided
  const adjustedEdges = [...edges];
  if (rootNodeId) {
    const visited = new Set([rootNodeId]);
    const queue = [rootNodeId];
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
const getForceLayout = (nodes, edges, options = {}) => {
  const center = getLayoutCenter(nodes);
  
  const simNodes = nodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y }));
  const nodeIds = new Set(simNodes.map((n) => n.id));
  const simLinks = edges
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((e) => ({ source: e.source, target: e.target }));

  // Use dynamic options
  const linkDistance = options.linkDistance || 250;
  const repulsion = options.repulsion || -1800; 
  const linkStrength = options.linkStrength || 1.2;
  const gravityX = options.gravityX || 0.08;
  const gravityY = options.gravityY || 0.08;
  const collisionRadius = options.collisionRadius || 90;

  const simulation = d3Force.forceSimulation(simNodes)
    .force('link', d3Force.forceLink(simLinks).id((d) => d.id).distance(linkDistance).strength(linkStrength))
    .force('charge', d3Force.forceManyBody().strength(repulsion).distanceMax(1200))
    .force('x', d3Force.forceX(center.x).strength(gravityX))
    .force('y', d3Force.forceY(center.y).strength(gravityY))
    .force('collide', d3Force.forceCollide().radius(collisionRadius)) 
    .stop();

  for (let i = 0; i < 300; ++i) simulation.tick();

  return nodes.map((node) => {
    const sn = simNodes.find((s) => s.id === node.id);
    return { ...node, position: { x: sn.x, y: sn.y } };
  });
};

/**
 * 3. Circular Layout
 */
const getCircularLayout = (nodes, options = {}) => {
  const center = getLayoutCenter(nodes);
  const radius = options.radius || Math.max(200, nodes.length * 40);
  const angleStep = (2 * Math.PI) / nodes.length;

  return nodes.map((node, i) => {
    const angle = i * angleStep;
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
 * Main Layout Entry Point
 */
export const calculateLayout = (nodes, edges, type, options = {}, rootNodeId = null) => {
  if (!nodes || nodes.length === 0) return [];

  let layoutedNodes = [];
  switch (type) {
    case 'hierarchical':
    case 'sequential':
      layoutedNodes = getSequentialLayout(nodes, edges, options, rootNodeId);
      break;
    case 'force':
      layoutedNodes = getForceLayout(nodes, edges, options);
      break;
    case 'circular':
      layoutedNodes = getCircularLayout(nodes, options);
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
