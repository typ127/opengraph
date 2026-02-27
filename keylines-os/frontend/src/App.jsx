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
  Stream as ClosenessIcon
} from '@mui/icons-material';
import * as Icons from '@mui/icons-material';

import { categoryMap, typeColors, getHexColor } from './constants';

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
    RULES: { stroke: '#d32f2f', strokeWidth: 3 },
    CONQUERED: { stroke: '#d32f2f', strokeWidth: 3 },
    PROTECTS: { stroke: '#2e7d32', strokeWidth: 2 },
    GUIDES: { stroke: '#2e7d32', strokeWidth: 2, strokeDasharray: '5,5' },
    LIVES_ON: { stroke: '#0288d1', strokeWidth: 1.5 },
    CREATED: { stroke: '#7b1fa2', strokeWidth: 2 },
    default: { stroke: '#bdbdbd', strokeWidth: 1.5 }
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
  nodes.forEach((node) => dagreGraph.setNode(node.id, { width: 150, height: 100 }));
  edges.forEach((edge) => {
    if (dagreGraph.hasNode(edge.source) && dagreGraph.hasNode(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
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
  const simulation = d3Force.forceSimulation(simNodes)
    .force('link', d3Force.forceLink(simLinks).id(d => d.id).distance(150).strength(0.5))
    .force('charge', d3Force.forceManyBody().strength(-500))
    .force('center', d3Force.forceCenter(400, 400))
    .force('collide', d3Force.forceCollide().radius(60))
    .stop();
  for (let i = 0; i < 300; ++i) simulation.tick();
  return nodes.map(node => {
    const sn = simNodes.find(s => s.id === node.id);
    return { ...node, position: { x: sn ? sn.x : node.position.x, y: sn ? sn.y : node.position.y } };
  });
};

const integrateNewData = (currentNodes, currentEdges, newData, sourceNodeId, expandNodeFn) => {
  const sourceNode = currentNodes.find(n => n.id === sourceNodeId);
  const sourcePos = sourceNode ? sourceNode.position : { x: 400, y: 400 };
  const nodesMap = new Map(currentNodes.map(n => [n.id, n]));
  const edgesMap = new Map(currentEdges.map(e => [e.id, e]));

  newData.nodes.forEach(newNode => {
    if (nodesMap.has(newNode.id)) {
      const existing = nodesMap.get(newNode.id);
      nodesMap.set(newNode.id, {
        ...existing,
        data: { ...existing.data, ...newNode.data, onSegmentClick: (cat, e) => expandNodeFn(newNode.id, cat, e) }
      });
    } else {
      nodesMap.set(newNode.id, {
        ...newNode,
        type: 'keylines',
        position: { ...sourcePos },
        data: { ...newNode.data, onSegmentClick: (cat, e) => expandNodeFn(newNode.id, cat, e) }
      });
    }
  });

  newData.edges.forEach(newEdge => {
    if (!edgesMap.has(newEdge.id)) {
      edgesMap.set(newEdge.id, {
        ...newEdge,
        style: getEdgeStyle(newEdge.data?.type),
        labelStyle: { fill: '#666', fontWeight: 600, fontSize: '10px', fontFamily: '"Open Sans", sans-serif' },
        labelBgStyle: { fill: '#f5f5f5', fillOpacity: 0.8 },
        labelBgPadding: [4, 2],
        labelBgBorderRadius: 4
      });
    }
  });

  return { nodes: Array.from(nodesMap.values()), edges: Array.from(edgesMap.values()) };
};

export default function App() {
  const { fitView, setCenter } = useReactFlow();
  
  // State
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

  // Refs
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const activeLayoutRef = useRef(activeLayout);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { activeLayoutRef.current = activeLayout; }, [activeLayout]);

  // --- HANDLERS ---

  const closeSidebar = useCallback(() => { setSelectedNode(null); setPreviewData(null); setSelectedNodeNeighbors([]); }, []);

  const applyLayout = useCallback((nds, eds, type) => {
    if (type === 'hierarchical') return getLayoutedElements(nds, eds);
    if (type === 'circular') return getCircularLayout(nds);
    if (type === 'force') return getForceLayout(nds, eds);
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nodes: nodesRef.current.map(n => ({ id: n.id, data: n.data })), 
          edges: edgesRef.current.map(e => ({ source: e.source, target: e.target })),
          algorithm 
        })
      });
      const data = await response.json();
      
      setNodes(nds => nds.map(node => {
        const analyzed = data.nodes.find(an => an.id === node.id);
        if (analyzed) {
          return { ...node, data: { ...node.data, score: analyzed.data.score } };
        }
        return node;
      }));
    } catch (e) { console.error('Analyze error:', e); }
  }, [setNodes]);

  const onExport = useCallback(() => {
    const reactFlowElement = document.querySelector('.react-flow');
    if (!reactFlowElement) return;
    
    // Controls ausblenden
    const controls = document.querySelector('.react-flow__controls');
    if (controls) controls.style.display = 'none';

    toPng(reactFlowElement, {
      backgroundColor: '#f5f5f5',
      // Wichtig: Wir filtern Elemente, die den Export stören könnten
      filter: (node) => {
        if (node?.classList?.contains('react-flow__panel')) return false;
        return true;
      },
      // Cache-Busting für Bilder
      cacheBust: true,
    })
    .then((dataUrl) => {
      download(dataUrl, `keylines-export-${new Date().toISOString().slice(0,10)}.png`);
    })
    .catch((err) => {
      console.error('Export failed:', err);
      alert('Export failed due to browser security restrictions. Try again or check the console.');
    })
    .finally(() => {
      if (controls) controls.style.display = 'flex';
    });
  }, []);

  const expandNode = useCallback(async (nodeId, filterCategory = null, event = null) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    if (filterCategory && event?.shiftKey) {
      try {
        const response = await fetch(`http://localhost:8000/expand/${nodeId}?filter_category=${filterCategory}`);
        const data = await response.json();
        const neighbors = data.nodes.filter(n => n.id !== nodeId);
        setPreviewData({ category: filterCategory, sourceId: nodeId, nodes: neighbors });
        setSelectedNode(null);
        return;
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
      setNodes(integratedNodes);
      setEdges(integratedEdges);
      setTimeout(() => {
        setNodes(nds => applyLayout(integratedNodes, integratedEdges, activeLayoutRef.current));
        setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
      }, 50);
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

  const openDetails = useCallback(async (node) => {
    setSelectedNode(node);
    setPreviewData(null);
    try {
      const response = await fetch(`http://localhost:8000/expand/${node.id}`);
      const data = await response.json();
      setSelectedNodeNeighbors(data.nodes.filter(n => n.id !== node.id));
    } catch (e) { console.error(e); }
  }, []);

  const onDrillDown = useCallback(() => {
    if (highlightedTypes.size === 0) return;
    setNodes((nds) => {
      const remainingNodes = nds.filter(n => highlightedTypes.has(n.data.type));
      const remainingIds = new Set(remainingNodes.map(n => n.id));
      setEdges((eds) => eds.filter(e => remainingIds.has(e.source) && remainingIds.has(e.target)));
      setHighlightedTypes(new Set());
      return remainingNodes;
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
      const data = await response.json();
      setSearchResults(data);
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
        const newNode = { ...fullNode, type: 'keylines', position: { x: 400, y: 400 }, data: { ...fullNode.data, onSegmentClick: (cat, e) => expandNode(fullNode.id, cat, e) } };
        setNodes(nds => deduplicate([...nds, newNode]));
        existing = newNode;
      }
    }
    if (existing) {
      setTimeout(() => {
        const nodePos = nodesRef.current.find(n => n.id === nodeInfo.id)?.position;
        if (nodePos) setCenter(nodePos.x, nodePos.y, { zoom: 1.2, duration: 800 });
      }, 100);
    }
  };

  const onDeleteNode = useCallback(() => {
    if (!selectedNode) return;
    const nodeId = selectedNode.id;
    setNodes(nds => nds.filter(n => n.id !== nodeId));
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    closeSidebar();
  }, [selectedNode, setNodes, setEdges, closeSidebar]);

  // --- MEMOS & UI LOGIC ---
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
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      const isHighlighted = hasHighlight ? (highlightedTypes.has(sourceNode?.data.type) || highlightedTypes.has(targetNode?.data.type)) : true;
      return { ...edge, label: zoomLevel > 0.6 ? (edge.data?.type?.replace("_", " ").toLowerCase()) : "", style: { ...edge.style, opacity: hasHighlight ? (isHighlighted ? 0.8 : 0.1) : 1, transition: 'opacity 0.3s ease' } };
    });
  }, [edges, visibleNodes, zoomLevel, highlightedTypes, nodes]);

  const stats = useMemo(() => {
    const counts = {};
    nodes.forEach(n => { const type = n.data.type || 'Unknown'; counts[type] = (counts[type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  const sidebarColor = selectedNode ? getHexColor(selectedNode.data.type) : previewData ? typeColors[previewData.category] : typeColors.other;

  return (
    <Box sx={{ width: '100vw', height: '100vh', background: '#f5f5f5', display: 'flex', fontFamily: '"Open Sans", sans-serif', overflow: 'hidden' }}>
      <style>{`
        body { margin: 0; padding: 0; overflow: hidden; }
        .react-flow__node { transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); will-change: transform; }
        .react-flow__node.dragging { transition: none !important; }
        .react-flow__edge-textwrapper { transition: opacity 0.3s ease; opacity: ${zoomLevel > 0.6 ? 1 : 0}; }
      `}</style>
      
      <ReactFlow
        nodes={visibleNodes} edges={visibleEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
        onNodeClick={(e, n) => e.shiftKey ? openDetails(n) : expandNode(n.id)}
        onPaneClick={() => { closeSidebar(); setHighlightedTypes(new Set()); }}
        onMove={(e, v) => setZoomLevel(v.zoom)}
        nodeTypes={nodeTypes} defaultEdgeOptions={{ type: 'straight' }} fitView
      >
        <Background />
        <Controls />
        
        {/* PANELS */}
        <Panel position="top-center">
          <Paper elevation={3} sx={{ p: 0.5, m: 2, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2 }}>
            <Autocomplete sx={{ width: 400 }} size="small" options={searchResults} getOptionLabel={(o) => o.label} onInputChange={(e, v) => handleSearch(v)} onChange={(e, v) => onSelectSearchResult(v)} autoSelect renderInput={(params) => <TextField {...params} placeholder="Search Asimov's Universe..." variant="outlined" InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>), }} />} renderOption={(props, o) => (<ListItem {...props} key={o.id}><ListItemAvatar><Avatar sx={{ bgcolor: getHexColor(o.type), width: 24, height: 24 }}>{React.createElement(Icons[o.icon] || Icons.HelpOutline, { sx: { fontSize: 14 } })}</Avatar></ListItemAvatar><ListItemText primary={o.label} secondary={o.type} /></ListItem>)} />
            <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
            <Tooltip title="Clear Canvas" arrow><IconButton color="error" onClick={() => { setNodes([]); setEdges([]); setSelectedNode(null); setPreviewData(null); }}><ClearAllIcon /></IconButton></Tooltip>
          </Paper>
        </Panel>

        <Panel position="top-left">
          <Paper elevation={3} sx={{ p: 2, m: 2, width: 220, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}><FilterIcon size="small" sx={{ mr: 1, color: 'text.secondary' }} /><Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Entity Types</Typography></Box>
            <FormGroup>
              {stats.map(([type, count]) => {
                const color = getHexColor(type);
                const maxCount = Math.max(...stats.map(s => s[1]), 1);
                const isHighlighted = highlightedTypes.has(type);
                return (
                  <Box key={type} sx={{ mb: 1.5, p: 0.5, borderRadius: 1, bgcolor: isHighlighted ? 'action.selected' : 'transparent', transition: 'background-color 0.2s' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        <Checkbox size="small" checked={!hiddenTypes.has(type)} onChange={() => setHiddenTypes(prev => { const n = new Set(prev); if (n.has(type)) n.delete(type); else n.add(type); return n; })} sx={{ color: color, '&.Mui-checked': { color: color }, p: 0.5 }} />
                        <Typography variant="caption" onClick={(e) => toggleHighlight(type, e.shiftKey)} sx={{ fontWeight: 600, fontSize: '0.7rem', cursor: 'pointer', ml: 0.5, flexGrow: 1, userSelect: 'none', '&:hover': { color: color } }}>{type.toUpperCase()}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mr: 0.5 }}>{count}</Typography>
                        <Tooltip title="Expand all" arrow><IconButton size="small" sx={{ p: 0 }} onClick={() => { const ns = nodesRef.current.filter(n => n.data.type === type); ns.forEach(node => expandNode(node.id)); }}><AddIcon sx={{ fontSize: 16, color: color }} /></IconButton></Tooltip>
                      </Box>
                    </Box>
                    <Box sx={{ height: 4, width: '100%', bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden', cursor: 'pointer' }} onClick={(e) => toggleHighlight(type, e.shiftKey)}><Box sx={{ height: '100%', width: `${(count/maxCount)*100}%`, bgcolor: color, transition: 'width 0.5s ease' }} /></Box>
                  </Box>
                );
              })}
            </FormGroup>
            {highlightedTypes.size > 0 && (<Button fullWidth variant="outlined" size="small" startIcon={<DrillDownIcon />} onClick={onDrillDown} sx={{ mt: 2, fontSize: '0.65rem' }}>Drill Down</Button>)}
          </Paper>
        </Panel>

        <Panel position="top-right">
          <Paper elevation={3} sx={{ p: 0.5, m: 2, display: 'flex', gap: 0.5, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
            <ButtonGroup variant="text" size="small">
              <Tooltip title="Hierarchical"><IconButton onClick={() => onLayoutClick('hierarchical')} color={activeLayout === 'hierarchical' ? 'secondary' : 'primary'}><TreeIcon /></IconButton></Tooltip>
              <Tooltip title="Circular"><IconButton onClick={() => onLayoutClick('circular')} color={activeLayout === 'circular' ? 'secondary' : 'primary'}><CircularIcon /></IconButton></Tooltip>
              <Tooltip title="Force"><IconButton onClick={() => onLayoutClick('force')} color={activeLayout === 'force' ? 'secondary' : 'primary'}><ForceIcon /></IconButton></Tooltip>
            </ButtonGroup>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <ButtonGroup variant="text" size="small">
              <Tooltip title="Degree Centrality"><IconButton onClick={() => onAnalyze('degree')} color={activeAlgorithm === 'degree' ? 'secondary' : 'primary'}><DegreeIcon /></IconButton></Tooltip>
              <Tooltip title="Betweenness Centrality"><IconButton onClick={() => onAnalyze('betweenness')} color={activeAlgorithm === 'betweenness' ? 'secondary' : 'primary'}><BetweennessIcon /></IconButton></Tooltip>
              <Tooltip title="Closeness Centrality"><IconButton onClick={() => onAnalyze('closeness')} color={activeAlgorithm === 'closeness' ? 'secondary' : 'primary'}><ClosenessIcon /></IconButton></Tooltip>
              <Tooltip title="PageRank"><IconButton onClick={() => onAnalyze('pagerank')} color={activeAlgorithm === 'pagerank' ? 'secondary' : 'primary'}><PageRankIcon /></IconButton></Tooltip>
            </ButtonGroup>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            <Tooltip title="Export PNG" arrow><IconButton onClick={onExport} color="primary"><DownloadIcon /></IconButton></Tooltip>
          </Paper>
        </Panel>
      </ReactFlow>

      {/* DRAWER */}
      <Drawer anchor="right" open={!!selectedNode || !!previewData} onClose={closeSidebar} variant="temporary" sx={{ width: 350, '& .MuiDrawer-paper': { width: 350, borderLeft: `4px solid ${sidebarColor}`, boxShadow: -5 } }}>
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}><Avatar sx={{ bgcolor: sidebarColor, width: 64, height: 64 }}>{selectedNode ? React.createElement(Icons[selectedNode.data.icon] || Icons.HelpOutline, { sx: { fontSize: 32 } }) : <GroupIcon sx={{ fontSize: 32 }} />}</Avatar><IconButton onClick={closeSidebar}><CloseIcon /></IconButton></Box>
            {selectedNode && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{selectedNode.data.label}</Typography>
                <Divider sx={{ my: 2 }} />
                <List>
                  <ListItem sx={{ px: 0 }}><ListItemIcon><TypeIcon /></ListItemIcon><ListItemText primary="Type" secondary={selectedNode.data.type} /></ListItem>
                  <ListItem sx={{ px: 0 }}><ListItemIcon><InfoIcon /></ListItemIcon><ListItemText primary="Importance" secondary={(selectedNode.data.score * 100).toFixed(1) + "%"} /></ListItem>
                </List>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2, mb: 1 }}>NEIGHBORS:</Typography>
                <List>{selectedNodeNeighbors.map(node => (<ListItem key={node.id} sx={{ px: 0 }}><ListItemAvatar><Avatar sx={{ bgcolor: getHexColor(node.data.type), width: 32, height: 32 }}>{React.createElement(Icons[node.data.icon] || Icons.HelpOutline, { sx: { fontSize: 18 } })}</Avatar></ListItemAvatar><ListItemText primary={node.data.label} secondary={node.data.type} /><ListItemSecondaryAction><IconButton edge="end" color="primary" disabled={nodes.some(n => n.id === node.id)} onClick={() => addSingleNode(selectedNode.id, node)}>{nodes.some(n => n.id === node.id) ? <CheckIcon /> : <AddIcon />}</IconButton></ListItemSecondaryAction></ListItem>))}</List>
              </>
            )}
            {previewData && (
              <>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{previewData.category.toUpperCase()} Group</Typography>
                <Divider sx={{ my: 2 }} /><List>{previewData.nodes.map(node => (<ListItem key={node.id} sx={{ px: 0 }}><ListItemAvatar><Avatar sx={{ bgcolor: sidebarColor, width: 32, height: 32 }}>{React.createElement(Icons[node.data.icon] || Icons.HelpOutline, { sx: { fontSize: 18 } })}</Avatar></ListItemAvatar><ListItemText primary={node.data.label} secondary={node.data.type} /><ListItemSecondaryAction><IconButton edge="end" color="primary" disabled={nodes.some(n => n.id === node.id)} onClick={() => addSingleNode(previewData.sourceId, node)}>{nodes.some(n => n.id === node.id) ? <CheckIcon /> : <AddIcon />}</IconButton></ListItemSecondaryAction></ListItem>))}</List>
              </>
            )}
          </Box>
          {selectedNode && (
            <Box sx={{ pt: 2 }}>
              <Divider sx={{ mb: 2 }} />
              <Button 
                variant="outlined" 
                color="error" 
                fullWidth 
                startIcon={<DeleteIcon />} 
                onClick={onDeleteNode}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
              >
                Remove from Canvas
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
