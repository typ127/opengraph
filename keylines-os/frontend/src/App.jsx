import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import ReactFlow, { 
  useNodesState, 
  useEdgesState, 
  Background, 
  Controls, 
  Panel, 
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';
import KeyLinesNode from './KeyLinesNode';
import dagre from 'dagre';
import * as d3Force from 'd3-force';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { 
  ButtonGroup, 
  IconButton, 
  Paper, 
  Tooltip, 
  Drawer, 
  Box, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  ListItemIcon,
  Avatar,
  ListItemAvatar,
  ListItemSecondaryAction,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Autocomplete,
  TextField,
  InputAdornment,
  Button
} from '@mui/material';
import { 
  AccountTree as TreeIcon, 
  BlurCircular as CircularIcon, 
  ElectricBolt as ForceIcon,
  Close as CloseIcon, 
  Info as InfoIcon, 
  Category as TypeIcon,
  Group as GroupIcon, 
  AddCircleOutline as AddIcon, 
  FilterList as FilterIcon,
  Search as SearchIcon, 
  ClearAll as ClearAllIcon, 
  Download as DownloadIcon,
  FilterCenterFocus as DrillDownIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Psychology as AlgorithmIcon,
  Hub as DegreeIcon,
  Animation as BetweennessIcon,
  Star as PageRankIcon,
  Stream as ClosenessIcon,
  GridView as GridIcon,
  Adjust as ConcentricIcon,
  ChevronLeft as ChevronLeftIcon,
  BuildOutlined as BuildIcon,
  Person as PersonIcon,
  Public as PublicIcon,
  Android as AndroidIcon,
  AutoStories as ItemIcon,
  Science as ScienceIcon,
  AddLink as LinkIcon,
  MenuOpen as MenuIcon
} from '@mui/icons-material';
import * as Icons from '@mui/icons-material';

import { categoryMap, typeColors, getHexColor } from './constants';
import { COLORS, EDGE_TYPES, NODE_CATEGORIES } from './theme';

const nodeTypes = {
  keylines: KeyLinesNode,
};

// --- GLOBAL UTILS ---
const deduplicate = (arr) => {
  const map = new Map();
  arr.forEach(item => map.set(item.id, item));
  return Array.from(map.values());
};

const getEdgeStyle = (type) => {
  const edgeStyles = {
    RULES: { stroke: EDGE_TYPES.rules, strokeWidth: 3 },
    CONQUERED: { stroke: EDGE_TYPES.conquered, strokeWidth: 3 },
    PROTECTS: { stroke: EDGE_TYPES.protects, strokeWidth: 2 },
    GUIDES: { stroke: EDGE_TYPES.guides, strokeWidth: 2, strokeDasharray: '5,5' },
    LIVES_ON: { stroke: EDGE_TYPES.livesOn, strokeWidth: 1.5 },
    CREATED: { stroke: EDGE_TYPES.created, strokeWidth: 2 },
    default: { stroke: EDGE_TYPES.default, strokeWidth: 1.5 }
  };
  return edgeStyles[type] || edgeStyles.default;
};

const getDescendants = (nodeId, edges, visited = new Set()) => {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);
  const children = edges.filter(edge => edge.source === nodeId).map(edge => edge.target);
  let descendants = [];
  children.forEach(childId => {
    if (!visited.has(childId)) {
      descendants.push(childId);
      descendants = [...descendants, ...getDescendants(childId, edges, visited)];
    }
  });
  return descendants;
};

// --- LAYOUT ENGINES ---
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  if (nodes.length === 0) return [];
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });
  const selectedIds = new Set(nodes.filter(n => n.selected).map(n => n.id));
  nodes.forEach((node) => dagreGraph.setNode(node.id, { width: 150, height: 100 }));
  edges.forEach((edge) => {
    if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
      if (selectedIds.has(edge.target) && !selectedIds.has(edge.source)) {
        dagreGraph.setEdge(edge.target, edge.source);
      } else {
        dagreGraph.setEdge(edge.source, edge.target);
      }
    }
  });
  dagre.layout(dagreGraph);
  return nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    return { ...node, position: { x: pos ? pos.x - 75 : node.position.x, y: pos ? pos.y - 50 : node.position.y } };
  });
};

const getCircularLayout = (nodes) => {
  if (nodes.length === 0) return [];
  const radius = Math.max(200, nodes.length * 40);
  const center = { x: 400, y: 400 };
  return nodes.map((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    return { ...node, position: { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) } };
  });
};

const getForceLayout = (nodes, edges) => {
  if (nodes.length === 0) return [];
  const simNodes = nodes.map(n => ({ id: n.id, x: n.position.x, y: n.position.y }));
  const nodeIds = new Set(simNodes.map(n => n.id));
  const simLinks = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target)).map(e => ({ source: e.source, target: e.target }));
  const repulsion = nodes.length > 20 ? -1000 : -800;
  const simulation = d3Force.forceSimulation(simNodes)
    .force('link', d3Force.forceLink(simLinks).id(d => d.id).distance(200).strength(0.4))
    .force('charge', d3Force.forceManyBody().strength(repulsion))
    .force('center', d3Force.forceCenter(400, 400))
    .force('collide', d3Force.forceCollide().radius(80))
    .stop();
  for (let i = 0; i < 300; ++i) simulation.tick();
  return nodes.map(node => {
    const sn = simNodes.find(s => s.id === node.id);
    return { ...node, position: { x: sn ? sn.x : node.position.x, y: sn ? sn.y : node.position.y } };
  });
};

const getGridLayout = (nodes) => {
  if (nodes.length === 0) return [];
  const count = nodes.length;
  const cols = Math.ceil(Math.sqrt(count));
  const spacing = 250;
  return nodes.map((node, index) => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    return { ...node, position: { x: col * spacing, y: row * spacing } };
  });
};

const getConcentricLayout = (nodes) => {
  if (nodes.length === 0) return [];
  const sortedNodes = [...nodes].sort((a, b) => (b.data?.score || 0) - (a.data?.score || 0));
  const center = { x: 400, y: 400 };
  const layoutedNodes = [];
  const ringCapacities = [1, 5, 12, 20, 30];
  let nodeIndex = 0;
  ringCapacities.forEach((capacity, ringIndex) => {
    const radius = ringIndex * 250;
    const countInRing = Math.min(capacity, sortedNodes.length - nodeIndex);
    for (let i = 0; i < countInRing; i++) {
      const node = sortedNodes[nodeIndex++];
      const angle = (i / countInRing) * 2 * Math.PI;
      layoutedNodes.push({ ...node, position: { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) } });
    }
  });
  const outerRadius = ringCapacities.length * 250;
  const remainingCount = sortedNodes.length - nodeIndex;
  for (let i = 0; i < remainingCount; i++) {
    const node = sortedNodes[nodeIndex++];
    const angle = (i / remainingCount) * 2 * Math.PI;
    layoutedNodes.push({ ...node, position: { x: center.x + outerRadius * Math.cos(angle), y: center.y + outerRadius * Math.sin(angle) } });
  }
  return layoutedNodes;
};

const integrateNewData = (currentNodes, currentEdges, newData, sourceNodeId, expandNodeFn) => {
  const sourceNode = currentNodes.find(n => n.id === sourceNodeId);
  const sourcePos = sourceNode ? sourceNode.position : { x: 400, y: 400 };
  const nodesMap = new Map(currentNodes.map(n => [n.id, n]));
  const edgesMap = new Map(currentEdges.map(e => [e.id, e]));
  newData.nodes.forEach(newNode => {
    if (nodesMap.has(newNode.id)) {
      const existing = nodesMap.get(newNode.id);
      nodesMap.set(newNode.id, { ...existing, data: { ...existing.data, ...newNode.data, onSegmentClick: (cat, e) => expandNodeFn(newNode.id, cat, e) } });
    } else {
      nodesMap.set(newNode.id, { ...newNode, type: 'keylines', position: { ...sourcePos }, data: { ...newNode.data, onSegmentClick: (cat, e) => expandNodeFn(newNode.id, cat, e) } });
    }
  });
  newData.edges.forEach(newEdge => {
    if (!edgesMap.has(newEdge.id)) {
      edgesMap.set(newEdge.id, {
        ...newEdge, data: { ...newEdge.data, isNew: true }, style: getEdgeStyle(newEdge.data?.type),
        labelStyle: { fill: COLORS.nodeLabel, fontWeight: 600, fontSize: '10px', fontFamily: '"Open Sans", sans-serif' },
        labelBgStyle: { fill: COLORS.background, fillOpacity: 0.8 }, labelBgPadding: [4, 2], labelBgBorderRadius: 4
      });
    }
  });
  return { nodes: Array.from(nodesMap.values()), edges: Array.from(edgesMap.values()) };
};

export default function App() {
  const { fitView, setCenter, screenToFlowPosition } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeLayout, setActiveLayout] = useState('force');
  const [activeAlgorithm, setActiveAlgorithm] = useState('degree');
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeNeighbors, setSelectedNodeNeighbors] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hiddenTypes, setHiddenTypes] = useState(new Set());
  const [highlightedTypes, setHighlightedTypes] = useState(new Set());
  const [searchResults, setSearchResults] = useState([]);
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [editSnapshot, setEditSnapshot] = useState(null);

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const activeLayoutRef = useRef(activeLayout);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { activeLayoutRef.current = activeLayout; }, [activeLayout]);

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...newData } };
        }
        return node;
      })
    );
    // Auch den lokalen State des selektierten Knotens aktualisieren
    setSelectedNode(prev => prev && prev.id === nodeId ? { ...prev, data: { ...prev.data, ...newData } } : prev);
  }, [setNodes]);

  const persistNode = useCallback(async (node) => {
    if (!node) return;
    console.log("PERSISTING NODE:", node.id, node.data.label);
    
    // Draft-Flag entfernen, da wir jetzt speichern
    const nodeToPersist = {
      ...node,
      data: { ...node.data, isDraft: false }
    };

    try {
      await fetch('http://localhost:8000/upsert-node', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: nodeToPersist.id, data: nodeToPersist.data })
      });
      
      // Lokal das Flag ebenfalls löschen
      setNodes(nds => nds.map(n => n.id === node.id ? nodeToPersist : n));
    } catch (e) {
      console.error("Persist error:", e);
    }
  }, [setNodes]);

  const closeSidebar = useCallback((skipPersist = false) => { 
    // Wenn wir im Edit-Modus waren, speichern wir die Änderungen (außer beim Löschen oder Abbrechen)
    if (selectedNode && isEditingNode && !skipPersist) {
      persistNode(selectedNode);
    }
    setSelectedNode(null); 
    setPreviewData(null); 
    setSelectedNodeNeighbors([]); 
    setIsEditingNode(false);
    setEditSnapshot(null);
  }, [selectedNode, isEditingNode, persistNode]);

  const cancelEditing = useCallback(() => {
    if (!selectedNode) return;
    
    // Fall 1: Echter, ungespeicherter Entwurf -> Löschen
    if (selectedNode.data.isDraft) {
      setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
    } 
    // Fall 2: Existierender Knoten (bereits in DB oder geladen) -> Revert auf Snapshot
    else if (editSnapshot) {
      setNodes(nds => nds.map(node => 
        node.id === selectedNode.id ? { ...node, data: { ...node.data, ...editSnapshot } } : node
      ));
    }
    
    closeSidebar(true);
  }, [selectedNode, editSnapshot, setNodes, closeSidebar]);

  const deleteNodePermanently = useCallback(async (nodeId) => {
    if (!window.confirm("Do you really want to delete this entity permanently from the database?")) return;
    
    try {
      await fetch(`http://localhost:8000/delete-node/${nodeId}`, { method: 'DELETE' });
      setNodes(nds => nds.filter(n => n.id !== nodeId));
      setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
      closeSidebar(true); // Persistierung explizit überspringen
    } catch (e) {
      console.error("Delete error:", e);
    }
  }, [setNodes, setEdges, closeSidebar]);

  const openDetails = useCallback(async (node, forceEdit = false) => {
    // Wenn wir gerade einen anderen Knoten editiert haben, speichern wir diesen erst
    if (selectedNode && isEditingNode && selectedNode.id !== node.id) {
      persistNode(selectedNode);
    }
    
    setSelectedNode(node); 
    setPreviewData(null);
    setIsEditingNode(forceEdit);
    
    // Snapshot für mögliches Revert (Escape) erstellen
    if (forceEdit) {
      setEditSnapshot({ label: node.data.label, description: node.data.description, icon: node.data.icon });
    } else {
      setEditSnapshot(null);
    }
    
    // Keine Nachbarn laden, wenn es ein brandneuer Knoten ist
    if (node.id.toString().startsWith('new-')) {
      setSelectedNodeNeighbors([]);
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/expand/${node.id}`);
      const data = await response.json();
      setSelectedNodeNeighbors(data.nodes.filter(n => n.id !== node.id));
    } catch (e) { console.error(e); }
  }, [selectedNode, isEditingNode, persistNode]);

  const handleDrawerClose = useCallback((event, reason) => {
    if (reason === 'escapeKeyDown' && isEditingNode) {
      cancelEditing();
    } else {
      closeSidebar();
    }
  }, [isEditingNode, cancelEditing, closeSidebar]);

  const applyLayout = useCallback((nds, eds, type) => {
    if (type === 'hierarchical') return getLayoutedElements(nds, eds);
    if (type === 'circular') return getCircularLayout(nds);
    if (type === 'force') return getForceLayout(nds, eds);
    if (type === 'grid') return getGridLayout(nds);
    if (type === 'concentric') return getConcentricLayout(nds);
    return nds;
  }, []);

  const onLayoutClick = useCallback((type) => {
    setActiveLayout(type);
    setNodes(nds => applyLayout(nds, edgesRef.current, type));
    setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
  }, [applyLayout, fitView, setNodes]);

  const onAnalyze = useCallback(async (algorithm) => {
    setActiveAlgorithm(algorithm);
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nodes: nodesRef.current.map(n => ({ id: n.id, data: n.data })), 
          edges: edgesRef.current.map(e => ({ source: e.source, target: e.target })),
          algorithm 
        })
      });
      const data = await response.json();
      setNodes(nds => nds.map(node => {
        const analyzed = data.nodes.find(an => an.id === node.id);
        if (analyzed) return { ...node, data: { ...node.data, score: analyzed.data.score } };
        return node;
      }));
    } catch (e) { console.error('Analyze error:', e); }
  }, [setNodes]);

  const onExport = useCallback(() => {
    const reactFlowElement = document.querySelector('.react-flow');
    if (!reactFlowElement) return;
    const controls = document.querySelector('.react-flow__controls');
    if (controls) controls.style.display = 'none';
    toPng(reactFlowElement, { backgroundColor: COLORS.background, filter: (node) => !(node?.classList?.contains('react-flow__panel')), cacheBust: true })
    .then((dataUrl) => download(dataUrl, `keylines-export-${new Date().toISOString().slice(0,10)}.png`))
    .finally(() => { if (controls) controls.style.display = 'flex'; });
  }, []);

  const expandNode = useCallback(async (nodeId, filterCategory = null, event = null) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    if (filterCategory && event?.shiftKey) {
      try {
        const response = await fetch(`http://localhost:8000/expand/${nodeId}?filter_category=${filterCategory}`);
        const data = await response.json();
        setPreviewData({ category: filterCategory, sourceId: nodeId, nodes: data.nodes.filter(n => n.id !== nodeId) });
        setSelectedNode(null); return;
      } catch (e) { console.error(e); return; }
    }
    if (filterCategory) {
      const directChildren = currentEdges.filter(e => e.source === nodeId).map(e => currentNodes.find(n => n.id === e.target)).filter(n => n && categoryMap[n.data.type?.toLowerCase()] === filterCategory);
      if (directChildren.length > 0) {
        const childIds = directChildren.map(n => n.id);
        const allToCollapse = new Set(childIds);
        childIds.forEach(id => getDescendants(id, currentEdges).forEach(d => allToCollapse.add(d)));
        setNodes(nds => nds.filter(n => !allToCollapse.has(n.id)));
        setEdges(eds => eds.filter(e => !allToCollapse.has(e.source) && !allToCollapse.has(e.target)));
        return;
      }
    }
    try {
      const response = await fetch(`http://localhost:8000/expand/${nodeId}${filterCategory ? `?filter_category=${filterCategory}` : ''}`);
      const data = await response.json();
      const { nodes: integratedNodes, edges: integratedEdges } = integrateNewData(currentNodes, currentEdges, data, nodeId, expandNode);
      setNodes(integratedNodes); setEdges(integratedEdges);
      setTimeout(() => {
        setNodes(applyLayout(integratedNodes, integratedEdges, activeLayoutRef.current));
        requestAnimationFrame(() => fitView({ duration: 800, padding: 0.2 }));
      }, 150);
      setTimeout(() => setEdges(integratedEdges.map(e => ({ ...e, data: { ...e.data, isNew: false } }))), 200);
    } catch (error) { console.error(error); }
  }, [applyLayout, fitView, setNodes, setEdges]);

  const addSingleNode = useCallback((sourceId, targetNode) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    if (currentNodes.find(n => n.id === targetNode.id)) return;
    const sourceNode = currentNodes.find(n => n.id === sourceId);
    const newNode = { ...targetNode, type: 'keylines', position: { ...(sourceNode?.position || {x:400,y:400}) }, data: { ...targetNode.data, onSegmentClick: (cat, e) => expandNode(targetNode.id, cat, e) } };
    const newEdge = { id: `e-${sourceId}-manual-${targetNode.id}`, source: sourceId, target: targetNode.id, animated: true, style: getEdgeStyle('default') };
    setNodes(nds => deduplicate([...nds, newNode]));
    setEdges(eds => deduplicate([...eds, newEdge]));
    setTimeout(() => {
      setNodes(nds => applyLayout(nds, edgesRef.current, activeLayoutRef.current));
      setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
    }, 50);
  }, [expandNode, applyLayout, fitView, setNodes, setEdges]);

  const onDrillDown = useCallback(() => {
    if (highlightedTypes.size === 0) return;
    setNodes((nds) => {
      const remainingNodes = nds.filter(n => highlightedTypes.has(n.data.type));
      const remainingIds = new Set(remainingNodes.map(n => n.id));
      setEdges((eds) => eds.filter(e => remainingIds.has(e.source) && remainingIds.has(e.target)));
      setHighlightedTypes(new Set()); return remainingNodes;
    });
  }, [highlightedTypes, setNodes, setEdges]);

  const toggleHighlight = useCallback((type, isShift) => {
    setHighlightedTypes(prev => {
      const next = new Set(isShift ? prev : []);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }, []);

  const handleSearch = async (val) => {
    if (val.length < 2) { setSearchResults([]); return; }
    try {
      const response = await fetch(`http://localhost:8000/search?q=${val}`);
      setSearchResults(await response.json());
    } catch (e) { console.error(e); }
  };

  const onSelectSearchResult = async (nodeInfo) => {
    if (!nodeInfo) return;
    let existing = nodesRef.current.find(n => n.id === nodeInfo.id);
    if (!existing) {
      const response = await fetch(`http://localhost:8000/expand/${nodeInfo.id}`);
      const data = await response.json();
      const fullNode = data.nodes.find(n => n.id === nodeInfo.id);
      if (fullNode) {
        const currentNodes = nodesRef.current;
        let newPos = { x: 400, y: 400 };
        
        if (currentNodes.length > 0) {
          const maxX = Math.max(...currentNodes.map(n => n.position.x));
          const rightmostNode = currentNodes.reduce((prev, curr) => (prev.position.x > curr.position.x) ? prev : curr);
          newPos = { x: maxX + 200, y: rightmostNode.position.y };
        }

        const newNode = { 
          ...fullNode, 
          type: 'keylines', 
          position: newPos, 
          data: { ...fullNode.data, onSegmentClick: (cat, e) => expandNode(fullNode.id, cat, e) } 
        };
        
        setNodes(nds => deduplicate([...nds, newNode]));
        existing = newNode;
        
        // Kamera sanft auf den neuen Bereich ausrichten
        setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
      }
    }
    if (existing) {
      setTimeout(() => {
        const nodePos = nodesRef.current.find(n => n.id === nodeInfo.id)?.position;
        if (nodePos) setCenter(nodePos.x, nodePos.y, { zoom: 1.2, duration: 800 });
      }, 200);
    }
  };

  const onDeleteNode = useCallback(() => {
    if (!selectedNode) return;
    setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
    setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
    closeSidebar();
  }, [selectedNode, setNodes, setEdges, closeSidebar]);

  const batchExpandNodes = useCallback(async (nodeIds) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    try {
      const promises = nodeIds.map(id => fetch(`http://localhost:8000/expand/${id}`).then(r => r.json()));
      const allResults = await Promise.all(promises);
      let nextNodes = [...currentNodes]; let nextEdges = [...currentEdges];
      allResults.forEach((data, index) => {
        const integrated = integrateNewData(nextNodes, nextEdges, data, nodeIds[index], expandNode);
        nextNodes = integrated.nodes; nextEdges = integrated.edges;
      });
      setNodes(nextNodes); setEdges(nextEdges);
      setTimeout(() => {
        setNodes(applyLayout(nextNodes, nextEdges, activeLayoutRef.current));
        requestAnimationFrame(() => fitView({ duration: 800, padding: 0.2 }));
      }, 150);
      setTimeout(() => setEdges(nextEdges.map(e => ({ ...e, data: { ...e.data, isNew: false } }))), 200);
    } catch (e) { console.error('Batch expansion failed:', e); }
  }, [expandNode, applyLayout, fitView, setNodes, setEdges]);

  const deleteSelectedElements = useCallback(() => {
    const nodeIdsToRemove = new Set(nodesRef.current.filter(n => n.selected).map(n => n.id));
    const edgeIdsToRemove = new Set(edgesRef.current.filter(e => e.selected).map(e => e.id));
    if (nodeIdsToRemove.size === 0 && edgeIdsToRemove.size === 0) return;
    setNodes(nds => nds.filter(n => !nodeIdsToRemove.has(n.id)));
    setEdges(eds => eds.filter(e => !edgeIdsToRemove.has(e.id) && !nodeIdsToRemove.has(e.source) && !nodeIdsToRemove.has(e.target)));
    if (selectedNode && nodeIdsToRemove.has(selectedNode.id)) closeSidebar();
  }, [selectedNode, setNodes, setEdges, closeSidebar]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
      if (e.code === 'Space') { e.preventDefault(); const nodeIds = nodesRef.current.map(n => n.id); if (nodeIds.length > 0) batchExpandNodes(nodeIds); }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (e.shiftKey) {
          const selectedNodes = nodesRef.current.filter(n => n.selected);
          const selectedIds = new Set(selectedNodes.map(n => n.id));
          if (selectedIds.size > 0) {
            setNodes(selectedNodes); setEdges(eds => eds.filter(edge => selectedIds.has(edge.source) && selectedIds.has(edge.target)));
            if (selectedNode && !selectedIds.has(selectedNode.id)) closeSidebar();
          }
        } else deleteSelectedElements();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [expandNode, batchExpandNodes, deleteSelectedElements, selectedNode, closeSidebar]);

  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const nodeId = `new-${Date.now()}`;
    const iconMap = { person: 'Person', planet: 'Public', robot: 'Android', mutant: 'Psychology', item: 'AutoStories', science: 'Science' };
    const newNode = {
      id: nodeId, type: 'keylines', position,
      data: { 
        label: '', 
        type, 
        icon: iconMap[type] || 'HelpOutline', 
        description: '', 
        score: 0.5, 
        isDraft: true,
        onSegmentClick: (cat, e) => expandNode(nodeId, cat, e) 
      },
    };
    setNodes((nds) => nds.concat(newNode));
    // Sofort selektieren und in den Edit-Modus schalten
    setTimeout(() => {
      openDetails(newNode, true);
    }, 50);
  }, [setNodes, expandNode, openDetails, screenToFlowPosition]);

  const visibleNodes = useMemo(() => {
    const hasHighlight = highlightedTypes.size > 0;
    return nodes.filter(n => !hiddenTypes.has(n.data.type)).map(n => ({
      ...n, style: { ...n.style, opacity: hasHighlight ? (highlightedTypes.has(n.data.type) ? 1 : 0.2) : 1, transition: 'opacity 0.3s ease' }
    }));
  }, [nodes, hiddenTypes, highlightedTypes]);

  const visibleEdges = useMemo(() => {
    const nodeIds = new Set(visibleNodes.map(n => n.id));
    const hasHighlight = highlightedTypes.size > 0;
    return edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target)).map(edge => {
      const sourceNode = nodes.find(n => n.id === edge.source); const targetNode = nodes.find(n => n.id === edge.target);
      const isHighlighted = hasHighlight ? (highlightedTypes.has(sourceNode?.data.type) || highlightedTypes.has(targetNode?.data.type)) : true;
      const highlightOpacity = hasHighlight ? (isHighlighted ? 0.8 : 0.1) : 1;
      return { 
        ...edge, label: zoomLevel > 0.6 ? (edge.data?.type?.replace("_", " ").toLowerCase()) : "", 
        style: { ...edge.style, opacity: edge.data?.isNew ? 0 : highlightOpacity, transition: edge.data?.isNew ? 'none' : 'opacity 1.0s ease-in-out, stroke 0.3s ease' } 
      };
    });
  }, [edges, visibleNodes, zoomLevel, highlightedTypes, nodes]);

  const stats = useMemo(() => {
    const counts = {}; nodes.forEach(n => { const type = n.data.type || 'Unknown'; counts[type] = (counts[type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  const sidebarColor = selectedNode ? getHexColor(selectedNode.data.type) : previewData ? typeColors[previewData.category] : typeColors.other;

  const topBarHeight = 48; // Common height for the top toolbars

  return (
    <Box sx={{ width: '100vw', height: '100vh', bgcolor: 'background.default', display: 'flex', fontFamily: '"Open Sans", sans-serif', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        body { margin: 0; padding: 0; overflow: hidden; background: ${COLORS.background}; }
        .react-flow__node { transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); will-change: transform; }
        .react-flow__node.dragging, .react-flow__node.selected { transition: none !important; }
        .react-flow__edge-path { transition: d 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .react-flow__edge-textwrapper { transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease; opacity: ${zoomLevel > 0.6 ? 1 : 0}; }
        .react-flow__edge-text { fill: ${COLORS.nodeLabel} !important; }
        .react-flow__edge-textbg { fill: ${COLORS.background} !important; fill-opacity: 0.8 !important; }
        .react-flow__controls { box-shadow: 0 0 10px rgba(0,0,0,0.5); }
        .react-flow__controls-button { background: ${COLORS.paper} !important; border-bottom: 1px solid ${COLORS.panelBorder} !important; fill: ${COLORS.textSecondary} !important; }
        .react-flow__controls-button:hover { background: #2a2a2a !important; fill: ${COLORS.primary} !important; }
        .react-flow__controls-button svg { fill: currentColor !important; }
      `}</style>
      
      {/* LEFT TOOLBAR (DRAWER TOGGLE) */}
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1200 }}>
        <Paper elevation={3} sx={{ px: 1, height: topBarHeight, display: 'flex', alignItems: 'center', bgcolor: 'rgba(30, 30, 30, 0.9)', borderRadius: 2, border: `1px solid ${COLORS.panelBorder}` }}>
          <Tooltip title="Toolbox">
            <IconButton onClick={() => setIsLeftDrawerOpen(!isLeftDrawerOpen)} color={isLeftDrawerOpen ? 'secondary' : 'primary'} size="small">
              <MenuIcon />
            </IconButton>
          </Tooltip>
        </Paper>
      </Box>

      {/* UNIFIED GLOBAL TOOLBAR (CENTER) */}
      <Box sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1200 }}>
        <Paper elevation={3} sx={{ pl: 2, pr: 1, height: topBarHeight, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(30, 30, 30, 0.9)', borderRadius: 2, border: `1px solid ${COLORS.panelBorder}` }}>
          <Autocomplete 
            sx={{ width: 300, ml: 0.5 }} 
            size="small" 
            options={searchResults} 
            getOptionLabel={(o) => o.label || o.type || 'Unknown'} 
            onInputChange={(e, v) => handleSearch(v)} 
            onChange={(e, v) => onSelectSearchResult(v)} 
            autoSelect 
            renderInput={(params) => <TextField {...params} placeholder="Search Universe..." variant="outlined" InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>), }} />} 
            renderOption={(props, o) => {
              const { key, ...otherProps } = props;
              return (
                <ListItem key={o.id || key} {...otherProps}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getHexColor(o.type), width: 24, height: 24 }}>
                      {React.createElement(Icons[o.icon] || Icons.HelpOutline, { sx: { fontSize: 14 } })}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={o.label || `[${o.type}]`} secondary={o.type} />
                </ListItem>
              );
            }} 
          />
          <Tooltip title="Clear Canvas"><IconButton size="small" color="error" onClick={() => { setNodes([]); setEdges([]); setSelectedNode(null); setPreviewData(null); }}><CloseIcon /></IconButton></Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <ButtonGroup variant="text" size="small">
            <Tooltip title="Hierarchical"><IconButton onClick={() => onLayoutClick('hierarchical')} color={activeLayout === 'hierarchical' ? 'secondary' : 'primary'}><TreeIcon /></IconButton></Tooltip>
            <Tooltip title="Circular"><IconButton onClick={() => onLayoutClick('circular')} color={activeLayout === 'circular' ? 'secondary' : 'primary'}><CircularIcon /></IconButton></Tooltip>
            <Tooltip title="Force"><IconButton onClick={() => onLayoutClick('force')} color={activeLayout === 'force' ? 'secondary' : 'primary'}><ForceIcon /></IconButton></Tooltip>
            <Tooltip title="Grid"><IconButton onClick={() => onLayoutClick('grid')} color={activeLayout === 'grid' ? 'secondary' : 'primary'}><GridIcon /></IconButton></Tooltip>
            <Tooltip title="Concentric"><IconButton onClick={() => onLayoutClick('concentric')} color={activeLayout === 'concentric' ? 'secondary' : 'primary'}><ConcentricIcon /></IconButton></Tooltip>
          </ButtonGroup>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <ButtonGroup variant="text" size="small">
            <Tooltip title="Degree"><IconButton onClick={() => onAnalyze('degree')} color={activeAlgorithm === 'degree' ? 'secondary' : 'primary'}><DegreeIcon /></IconButton></Tooltip>
            <Tooltip title="Betweenness"><IconButton onClick={() => onAnalyze('betweenness')} color={activeAlgorithm === 'betweenness' ? 'secondary' : 'primary'}><BetweennessIcon /></IconButton></Tooltip>
            <Tooltip title="Closeness"><IconButton onClick={() => onAnalyze('closeness')} color={activeAlgorithm === 'closeness' ? 'secondary' : 'primary'}><ClosenessIcon /></IconButton></Tooltip>
            <Tooltip title="PageRank"><IconButton onClick={() => onAnalyze('pagerank')} color={activeAlgorithm === 'pagerank' ? 'secondary' : 'primary'}><PageRankIcon /></IconButton></Tooltip>
          </ButtonGroup>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Export PNG"><IconButton onClick={onExport} color="primary"><DownloadIcon /></IconButton></Tooltip>
        </Paper>
      </Box>

      {/* HISTOGRAM (RIGHT) */}
      <Box sx={{ position: 'absolute', top: 16, right: 16, zIndex: 1200 }}>
        <Paper elevation={3} sx={{ p: 2, width: 220, bgcolor: 'rgba(30, 30, 30, 0.9)', borderRadius: 2, border: `1px solid ${COLORS.panelBorder}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}><FilterIcon size="small" sx={{ mr: 1, color: 'text.secondary' }} /><Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Entity Types</Typography></Box>
          <FormGroup>
            {stats.map(([type, count]) => {
              const color = getHexColor(type);
              const maxCount = Math.max(...stats.map(s => s[1]), 1);
              const isHighlighted = highlightedTypes.has(type);
              return (
                <Box key={type} sx={{ mb: 1.5, p: 0.5, borderRadius: 1, bgcolor: isHighlighted ? 'rgba(0, 191, 255, 0.1)' : 'transparent' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                      <Checkbox size="small" checked={!hiddenTypes.has(type)} onChange={() => setHiddenTypes(prev => { const n = new Set(prev); if (n.has(type)) n.delete(type); else n.add(type); return n; })} sx={{ color: color, '&.Mui-checked': { color: color }, p: 0.5 }} />
                      <Typography variant="caption" onClick={(e) => toggleHighlight(type, e.shiftKey)} sx={{ fontWeight: 600, fontSize: '0.7rem', cursor: 'pointer', ml: 0.5, flexGrow: 1 }}>{type.toUpperCase()}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{count}</Typography>
                  </Box>
                  <Box sx={{ height: 4, width: '100%', bgcolor: 'rgba(0, 191, 255, 0.05)', borderRadius: 1, overflow: 'hidden' }}><Box sx={{ height: '100%', width: `${(count/maxCount)*100}%`, bgcolor: color }} /></Box>
                </Box>
              );
            })}
          </FormGroup>
          {highlightedTypes.size > 0 && (<Button fullWidth variant="outlined" size="small" startIcon={<DrillDownIcon />} onClick={onDrillDown} sx={{ mt: 2, fontSize: '0.65rem' }}>Drill Down</Button>)}
        </Paper>
      </Box>

      <Drawer 
        anchor="left" open={isLeftDrawerOpen} variant="persistent" 
        sx={{ width: isLeftDrawerOpen ? 280 : 0, flexShrink: 0, '& .MuiDrawer-paper': { width: 280, borderRight: `2px solid ${COLORS.panelBorder}`, bgcolor: COLORS.paper, boxShadow: 5 } }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1 }}>TOOLBOX</Typography>
            <IconButton onClick={() => setIsLeftDrawerOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}><ChevronLeftIcon /></IconButton>
          </Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 2, letterSpacing: 1 }}>NODE TEMPLATES (Drag & Drop)</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 4 }}>
            {Object.keys(NODE_CATEGORIES).filter(cat => cat !== 'other').map(cat => (
              <Box key={cat} draggable onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', cat); e.dataTransfer.effectAllowed = 'move'; }}
                sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.05)`, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'grab', transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', borderColor: NODE_CATEGORIES[cat], transform: 'translateY(-2px)', boxShadow: `0 4px 10px ${NODE_CATEGORIES[cat]}33` } }}
              >
                <Avatar sx={{ bgcolor: NODE_CATEGORIES[cat], width: 32, height: 32, mb: 1 }}>
                  {cat === 'person' ? <PersonIcon sx={{ fontSize: 18, color: '#fff' }} /> : 
                   cat === 'planet' ? <PublicIcon sx={{ fontSize: 18, color: '#fff' }} /> : 
                   cat === 'robot' ? <AndroidIcon sx={{ fontSize: 18, color: '#fff' }} /> : 
                   cat === 'item' ? <ItemIcon sx={{ fontSize: 18, color: '#fff' }} /> :
                   cat === 'science' ? <ScienceIcon sx={{ fontSize: 18, color: '#fff' }} /> :
                   <Icons.HelpOutline sx={{ fontSize: 18, color: '#fff' }} />}
                </Avatar>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>{cat.toUpperCase()}</Typography>
              </Box>
            ))}
          </Box>
          <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 2, letterSpacing: 1 }}>RELATIONSHIP TOOLS</Typography>
          <Button variant="outlined" fullWidth startIcon={<LinkIcon />} sx={{ textTransform: 'none', justifyContent: 'flex-start', borderRadius: 2, color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.2)', '&:hover': { borderColor: COLORS.secondary, color: COLORS.secondary, bgcolor: `${COLORS.secondary}11` } }}>Add Connection (Edge)</Button>
          <Box sx={{ flexGrow: 1 }} />
          <Typography variant="caption" sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>KeyLines OS Editor Mode v0.1</Typography>
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, height: '100%', position: 'relative', transition: 'all 0.3s ease' }}>
        <ReactFlow
          nodes={visibleNodes} edges={visibleEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onNodeClick={(e, n) => e.shiftKey ? openDetails(n) : expandNode(n.id)}
          onPaneClick={() => { closeSidebar(); setHighlightedTypes(new Set()); }}
          onMove={(e, v) => setZoomLevel(v.zoom)} onDrop={onDrop} onDragOver={onDragOver}
          nodeTypes={nodeTypes} defaultEdgeOptions={{ type: 'straight' }} fitView
        >
          <Background color="#333" variant="dots" gap={20} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </Box>

      <Drawer anchor="right" open={!!selectedNode || !!previewData} onClose={handleDrawerClose} variant="temporary" sx={{ width: 350, '& .MuiDrawer-paper': { width: 350, borderLeft: `4px solid ${sidebarColor}`, boxShadow: -5, bgcolor: COLORS.paper } }}>
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: sidebarColor, width: 64, height: 64, boxShadow: '0 0 20px ' + sidebarColor + '44' }}>
                  {selectedNode ? React.createElement(Icons[selectedNode.data.icon] || Icons.HelpOutline, { sx: { fontSize: 32, color: '#fff' } }) : <GroupIcon sx={{ fontSize: 32, color: '#fff' }} />}
                </Avatar>
                {selectedNode && (
                  <Tooltip title={isEditingNode ? "View Info" : "Edit Properties"}>
                    <IconButton 
                      onClick={() => {
                        if (!isEditingNode) {
                          setEditSnapshot({ label: selectedNode.data.label, description: selectedNode.data.description, icon: selectedNode.data.icon });
                        } else {
                          setEditSnapshot(null);
                        }
                        setIsEditingNode(!isEditingNode);
                      }} 
                      sx={{ bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: isEditingNode ? `${COLORS.secondary}22` : `${COLORS.primary}22` } }}
                    >
                      {isEditingNode ? <Icons.Visibility sx={{ fontSize: 20, color: COLORS.secondary }} /> : <Icons.Edit sx={{ fontSize: 20, color: COLORS.primary }} />}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              <IconButton onClick={() => closeSidebar()}><CloseIcon /></IconButton>
            </Box>

            {selectedNode && isEditingNode ? (
              <>
                <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 'bold', letterSpacing: 1, display: 'block', mb: 2 }}>EDIT ENTITY</Typography>
                <TextField
                  fullWidth label="Label" variant="outlined" size="small"
                  autoFocus
                  placeholder="Enter name..."
                  value={selectedNode.data.label || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter') closeSidebar(); 
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth label="Description" variant="outlined" size="small" multiline rows={4}
                  placeholder="Enter details..."
                  value={selectedNode.data.description || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) closeSidebar(); 
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  sx={{ mb: 3 }}
                />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 1, display: 'block' }}>CHOOSE ICON</Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                  {['Person', 'Android', 'Public', 'Science', 'AutoStories', 'Psychology', 'Hub', 'Star'].map(iconName => (
                    <IconButton 
                      key={iconName} size="small" 
                      onClick={() => updateNodeData(selectedNode.id, { icon: iconName })}
                      sx={{ 
                        bgcolor: selectedNode.data.icon === iconName ? `${COLORS.primary}22` : 'transparent',
                        border: `1px solid ${selectedNode.data.icon === iconName ? COLORS.primary : 'rgba(255,255,255,0.1)'}`,
                        color: selectedNode.data.icon === iconName ? COLORS.primary : 'rgba(255,255,255,0.5)'
                      }}
                    >
                      {React.createElement(Icons[iconName], { sx: { fontSize: 18 } })}
                    </IconButton>
                  ))}
                </Box>

                <Button 
                  variant="outlined" 
                  color="error" 
                  fullWidth 
                  startIcon={<Icons.DeleteForever />} 
                  onClick={() => deleteNodePermanently(selectedNode.id)}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', mb: 2, borderColor: 'rgba(211, 47, 47, 0.3)' }}
                >
                  Delete from Database
                </Button>
              </>
            ) : selectedNode ? (
              <>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>{selectedNode.data.label}</Typography>
                <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>
                  {selectedNode.data.description}
                </Typography>
                <List>
                  <ListItem sx={{ px: 0 }}><ListItemIcon><TypeIcon sx={{ color: sidebarColor }} /></ListItemIcon><ListItemText primary="Type" secondary={selectedNode.data.type} secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.5)' } }} /></ListItem>
                  <ListItem sx={{ px: 0 }}><ListItemIcon><InfoIcon sx={{ color: sidebarColor }} /></ListItemIcon><ListItemText primary="Importance" secondary={(selectedNode.data.score * 100).toFixed(1) + "%"} secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.5)' } }} /></ListItem>
                </List>
              </>
            ) : null}

            {(selectedNode || previewData) && (
              <>
                <Typography variant="caption" color="rgba(255,255,255,0.4)" display="block" sx={{ mt: 2, mb: 1, fontWeight: 'bold', letterSpacing: 1 }}>
                  {previewData ? `${previewData.category.toUpperCase()} GROUP` : "NEIGHBORS"}
                </Typography>
                <List>
                  {(previewData ? previewData.nodes : selectedNodeNeighbors)
                    .sort((a, b) => (a.data.type || '').localeCompare(b.data.type || ''))
                    .map(node => (
                      <ListItem key={node.id} sx={{ px: 0 }}>
                        <ListItemAvatar><Avatar sx={{ bgcolor: getHexColor(node.data.type), width: 32, height: 32 }}>{React.createElement(Icons[node.data.icon] || Icons.HelpOutline, { sx: { fontSize: 18, color: '#fff' } })}</Avatar></ListItemAvatar>
                        <ListItemText primary={node.data.label} secondary={node.data.type} primaryTypographyProps={{ style: { fontSize: '0.9rem' } }} secondaryTypographyProps={{ style: { fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' } }} />
                        <ListItemSecondaryAction><IconButton edge="end" color="primary" disabled={nodes.some(n => n.id === node.id)} onClick={() => addSingleNode(selectedNode?.id || previewData?.sourceId, node)}>{nodes.some(n => n.id === node.id) ? <CheckIcon sx={{ color: 'success.main' }} /> : <AddIcon />}</IconButton></ListItemSecondaryAction>
                      </ListItem>
                    ))}
                </List>
              </>
            )}
          </Box>
                    {selectedNode && (
                      <Box sx={{ pt: 2 }}><Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} /><Button variant="outlined" color="error" fullWidth startIcon={<DeleteIcon />} onClick={onDeleteNode} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', borderColor: 'rgba(211, 47, 47, 0.5)' }}>Remove from Canvas</Button></Box>
                    )}
                  </Box>
                </Drawer>
              </Box>
            );
          }
          
