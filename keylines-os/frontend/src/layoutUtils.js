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

  const baseWidth = options.nodeWidth || 180;
  const baseHeight = options.nodeHeight || 80;
  
  // Use specific options or fallback to defaults
  const nodeSep = options.nodeSpacing || 120;
  
  // linkDistance acts as a base for rank spacing if rankSpacing is high
  const rankSep = (options.rankSpacing || 180) * (options.linkDistance / 250);
  
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
    // Fixed node size in the layout engine for cleaner tree structures
    dagreGraph.setNode(node.id, { width: baseWidth, height: baseHeight });
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
      position: { x: pos.x - baseWidth / 2, y: pos.y - baseHeight / 2 },
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

  // Sorting logic
  let sortedNodes = [...nodes];
  const sortMode = options.circularSort || 'standard';

  if (sortMode === 'byType') {
    sortedNodes.sort((a, b) => {
      const typeA = a.data.type || '';
      const typeB = b.data.type || '';
      return typeA.localeCompare(typeB);
    });
  } else if (sortMode === 'byImportance') {
    sortedNodes.sort((a, b) => (b.data.importance || 0) - (a.data.importance || 0));
  }
  // 'standard' keeps original order

  return sortedNodes.map((node, i) => {
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
 * 4. Hive Plot Layout
 * Groups nodes by type onto radial axes.
 */
const getHivePlotLayout = (nodes, options = {}) => {
  const center = getLayoutCenter(nodes);
  const innerRadius = options.hiveInnerRadius || 200;
  const axisLength = options.hiveAxisLength || 800;
  
  // 1. Group nodes into axes based on type
  // Axis 0: PERSON, MUTANT
  // Axis 1: PLANET, LOCATION, ENTITY
  // Axis 2: ROBOT, ITEM, SCIENCE, OTHER
  const axes = [[], [], []];
  
  nodes.forEach(node => {
    const type = (node.data.type || 'OTHER').toUpperCase();
    if (['PERSON', 'MUTANT'].includes(type)) {
      axes[0].push(node);
    } else if (['PLANET', 'LOCATION', 'ENTITY'].includes(type)) {
      axes[1].push(node);
    } else {
      axes[2].push(node);
    }
  });

  // 2. Position nodes along each axis
  const result = [];
  const axisAngles = [0, (2 * Math.PI) / 3, (4 * Math.PI) / 3]; // 0°, 120°, 240°

  axes.forEach((axisNodes, axisIdx) => {
    const angle = axisAngles[axisIdx];
    
    // Sort by importance (highest importance furthest from center)
    const sorted = [...axisNodes].sort((a, b) => (a.data.importance || 0) - (b.data.importance || 0));
    
    sorted.forEach((node, nodeIdx) => {
      // Linear distribution along the axis length
      const progress = sorted.length > 1 ? nodeIdx / (sorted.length - 1) : 0.5;
      const radius = innerRadius + (progress * axisLength);
      
      // Add a tiny spiral offset if importance is identical to avoid overlap
      const spiralOffset = (node.data.importance || 0) * 0.05;
      const finalAngle = angle + spiralOffset;

      result.push({
        ...node,
        position: {
          x: center.x + radius * Math.cos(finalAngle),
          y: center.y + radius * Math.sin(finalAngle),
        }
      });
    });
  });

  return result;
};

/**
 * 5. Bundled Layout (Hierarchical Edge Bundling Style)
 * Groups nodes by planet/type on a circle with gaps.
 */
const getBundledLayout = (nodes, options = {}) => {
  const center = getLayoutCenter(nodes);
  const radius = options.radius || 800;
  const groupGap = options.groupGap || 0.2; // Radians
  
  // 1. Group nodes by planet (or type as fallback)
  const groups = {};
  nodes.forEach(node => {
    const planet = node.data.planet || node.data.type || 'Other';
    if (!groups[planet]) groups[planet] = [];
    groups[planet].push(node);
  });

  const groupKeys = Object.keys(groups).sort();
  const totalNodes = nodes.length;
  
  // 2. Calculate total angular space including gaps
  // We subtract some space for the gaps
  const availableAngle = 2 * Math.PI - (groupKeys.length * groupGap);
  const anglePerNode = availableAngle / totalNodes;

  let currentAngle = 0;
  const result = [];

  groupKeys.forEach(key => {
    const groupNodes = groups[key];
    
    // Sort within group by importance
    groupNodes.sort((a, b) => (b.data.importance || 0) - (a.data.importance || 0));

    groupNodes.forEach(node => {
      result.push({
        ...node,
        position: {
          x: center.x + radius * Math.cos(currentAngle),
          y: center.y + radius * Math.sin(currentAngle),
        }
      });
      currentAngle += anglePerNode;
    });
    
    currentAngle += groupGap; // Add gap after each group
  });

  return result;
};

/**
 * Main Layout Entry Point
 */
export const calculateLayout = (nodes, edges, type, options = {}, rootNodeId = null) => {
  if (!nodes || nodes.length === 0) return [];

  // Auto-select root if none provided for hierarchical layouts
  let effectiveRootId = rootNodeId;
  if (!effectiveRootId && (type === 'hierarchical' || type === 'sequential')) {
    const sortedByImportance = [...nodes].sort((a, b) => (b.data.importance || 0) - (a.data.importance || 0));
    if (sortedByImportance.length > 0) {
      effectiveRootId = sortedByImportance[0].id;
      console.log(`[LayoutEngine] Auto-selected root node by importance: ${effectiveRootId} (${sortedByImportance[0].data.label})`);
    }
  }

  let layoutedNodes = [];
  switch (type) {
    case 'hierarchical':
    case 'sequential':
      layoutedNodes = getSequentialLayout(nodes, edges, options, effectiveRootId);
      break;
    case 'force':
      layoutedNodes = getForceLayout(nodes, edges, options);
      break;
    case 'circular':
      layoutedNodes = getCircularLayout(nodes, options);
      break;
    case 'hive':
      layoutedNodes = getHivePlotLayout(nodes, options);
      break;
    case 'bundled':
      layoutedNodes = getBundledLayout(nodes, options);
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
