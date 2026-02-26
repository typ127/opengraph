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
  InputAdornment
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
  ControlPointDuplicate as ExpandAllIcon
} from '@mui/icons-material';
import * as Icons from '@mui/icons-material';

import { categoryMap, typeColors, getHexColor } from './constants';

const nodeTypes = {
  keylines: KeyLinesNode,
};

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

// --- HELPER ---
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
  return Array.from(new Set(descendants));
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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeLayout, setActiveLayout] = useState('force');
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeNeighbors, setSelectedNodeNeighbors] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hiddenTypes, setHiddenTypes] = useState(new Set());
  
  const [searchResults, setSearchResults] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const activeLayoutRef = useRef(activeLayout);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { activeLayoutRef.current = activeLayout; }, [activeLayout]);

  const applyLayout = useCallback((nds, eds, type) => {
    if (type === 'hierarchical') return getLayoutedElements(nds, eds);
    if (type === 'circular') return getCircularLayout(nds);
    if (type === 'force') return getForceLayout(nds, eds);
    return nds;
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
      const directChildren = currentEdges
        .filter(e => e.source === nodeId)
        .map(e => currentNodes.find(n => n.id === e.target))
        .filter(n => n && categoryMap[n.data.type?.toLowerCase()] === filterCategory);

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
    } catch (error) { console.error('Error expanding node:', error); }
  }, [applyLayout, fitView]);

  const expandAllOfType = useCallback(async (typeName) => {
    const nodesToExpand = nodesRef.current.filter(n => n.data.type === typeName);
    for (const node of nodesToExpand) {
      await expandNode(node.id);
    }
  }, [expandNode]);

  const addSingleNode = useCallback((sourceId, targetNode) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    if (currentNodes.find(n => n.id === targetNode.id)) return;
    const sourceNode = currentNodes.find(n => n.id === sourceId);
    const sourcePos = sourceNode ? sourceNode.position : { x: 400, y: 400 };
    const newNode = { ...targetNode, type: 'keylines', position: { ...sourcePos }, data: { ...targetNode.data, onSegmentClick: (cat, e) => expandNode(targetNode.id, cat, e) } };
    const newEdge = { id: `e-${sourceId}-manual-${targetNode.id}`, source: sourceId, target: targetNode.id, animated: true, style: getEdgeStyle('default') };
    const nextNodes = deduplicate([...currentNodes, newNode]);
    const nextEdges = deduplicate([...currentEdges, newEdge]);
    setNodes(nextNodes);
    setEdges(nextEdges);
    setTimeout(() => {
      setNodes(nds => applyLayout(nds, nextEdges, activeLayoutRef.current));
      setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
    }, 50);
  }, [expandNode, applyLayout, fitView]);

  const openDetails = useCallback(async (node) => {
    setSelectedNode(node);
    setPreviewData(null);
    try {
      const response = await fetch(`http://localhost:8000/expand/${node.id}`);
      const data = await response.json();
      const neighbors = data.nodes.filter(n => n.id !== node.id);
      setSelectedNodeNeighbors(neighbors);
    } catch (e) { console.error(e); }
  }, []);

  const handleSearch = async (val) => {
    setSearchValue(val);
    if (val.length < 2) { setSearchResults([]); return; }
    try {
      const response = await fetch(`http://localhost:8000/search?q=${val}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (e) { console.error(e); }
  };

  const onSelectSearchResult = async (nodeInfo) => {
    if (!nodeInfo) return;
    let existing = nodes.find(n => n.id === nodeInfo.id);
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

  useEffect(() => {}, []);

  const onLayoutClick = (type) => {
    setActiveLayout(type);
    setNodes(nds => applyLayout(nds, edgesRef.current, type));
    setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
  };

  const toggleType = (typeName) => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      if (next.has(typeName)) next.delete(typeName);
      else next.add(typeName);
      return next;
    });
  };

  const closeSidebar = () => { setSelectedNode(null); setPreviewData(null); setSelectedNodeNeighbors([]); };

  const visibleNodes = useMemo(() => nodes.filter(n => !hiddenTypes.has(n.data.type)), [nodes, hiddenTypes]);
  const visibleEdges = useMemo(() => {
    const nodeIds = new Set(visibleNodes.map(n => n.id));
    return edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target)).map(edge => ({...edge, label: zoomLevel > 0.6 ? (edge.data?.type?.replace("_", " ").toLowerCase()) : ""}));
  }, [edges, visibleNodes, zoomLevel]);

  const stats = useMemo(() => {
    const counts = {};
    nodes.forEach(n => { const type = n.data.type || 'Unknown'; counts[type] = (counts[type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  const sidebarColor = selectedNode ? getHexColor(selectedNode.data.type) : previewData ? typeColors[previewData.category] : typeColors.other;

  return (
    <Box sx={{ width: '100vw', height: '100vh', background: '#f5f5f5', display: 'flex', fontFamily: '"Open Sans", sans-serif' }}>
      <style>{`
        .react-flow__node { transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1); will-change: transform; }
        .react-flow__node.dragging { transition: none !important; }
        .react-flow__edge-textwrapper { transition: opacity 0.3s ease; opacity: ${zoomLevel > 0.6 ? 1 : 0}; }
      `}</style>
      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(e, n) => e.shiftKey ? openDetails(n) : expandNode(n.id)}
        onPaneClick={closeSidebar}
        onMove={(e, v) => setZoomLevel(v.zoom)}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ type: 'straight' }}
        fitView
      >
        <Background />
        <Controls />
        
        {/* TOP CENTER: SEARCH & CLEAR */}
        <Panel position="top-center">
          <Paper elevation={3} sx={{ p: 0.5, m: 2, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(255,255,255,0.95)', borderRadius: 2 }}>
            <Autocomplete
              sx={{ width: 400 }}
              size="small"
              options={searchResults}
              getOptionLabel={(option) => option.label}
              onInputChange={(e, val) => handleSearch(val)}
              onChange={(e, val) => onSelectSearchResult(val)}
              autoSelect
              selectOnFocus
              handleHomeEndKeys
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Search Asimov's Universe..."
                  variant="outlined"
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <ListItem {...props} key={option.id}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getHexColor(option.type), width: 24, height: 24 }}>
                      {React.createElement(Icons[option.icon] || Icons.HelpOutline, { sx: { fontSize: 14 } })}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={option.label} secondary={option.type} />
                </ListItem>
              )}
            />
            <Divider orientation="vertical" flexItem sx={{ my: 1 }} />
            <Tooltip title="Clear Canvas" arrow>
              <IconButton 
                color="error" 
                onClick={() => {
                  setNodes([]);
                  setEdges([]);
                  setSearchValue("");
                  setSelectedNode(null);
                  setPreviewData(null);
                }}
              >
                <ClearAllIcon />
              </IconButton>
            </Tooltip>
          </Paper>
        </Panel>

        {/* TOP LEFT: FILTERS & HISTOGRAM */}
        <Panel position="top-left">
          <Paper elevation={3} sx={{ p: 2, m: 2, width: 220, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <FilterIcon size="small" sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Entity Types</Typography>
            </Box>
            
            <FormGroup>
              {stats.map(([type, count]) => {
                const color = getHexColor(type);
                const maxCount = Math.max(...stats.map(s => s[1]), 1);
                const barWidth = (count / maxCount) * 100;

                return (
                  <Box key={type} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            size="small" 
                            checked={!hiddenTypes.has(type)} 
                            onChange={() => toggleType(type)}
                            sx={{ color: color, '&.Mui-checked': { color: color }, py: 0 }}
                          />
                        }
                        label={<Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{type.toUpperCase()}</Typography>}
                        sx={{ m: 0 }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', mr: 0.5 }}>{count}</Typography>
                        <Tooltip title={`Expand all ${type}s`} arrow>
                          <IconButton size="small" sx={{ p: 0 }} onClick={() => expandAllOfType(type)}>
                            <AddIcon sx={{ fontSize: 16, color: color }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                    <Box sx={{ height: 4, width: '100%', bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${barWidth}%`, bgcolor: color, transition: 'width 0.5s ease' }} />
                    </Box>
                  </Box>
                );
              })}
            </FormGroup>
          </Paper>
        </Panel>

        <Panel position="top-right">
          <Paper elevation={3} sx={{ p: 0.5, m: 2, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
            <ButtonGroup variant="text" size="small">
              <Tooltip title="Hierarchical"><IconButton onClick={() => onLayoutClick('hierarchical')} color={activeLayout === 'hierarchical' ? 'secondary' : 'primary'}><TreeIcon /></IconButton></Tooltip>
              <Tooltip title="Circular"><IconButton onClick={() => onLayoutClick('circular')} color={activeLayout === 'circular' ? 'secondary' : 'primary'}><CircularIcon /></IconButton></Tooltip>
              <Tooltip title="Force"><IconButton onClick={() => onLayoutClick('force')} color={activeLayout === 'force' ? 'secondary' : 'primary'}><ForceIcon /></IconButton></Tooltip>
            </ButtonGroup>
          </Paper>
        </Panel>
      </ReactFlow>

      <Drawer anchor="right" open={!!selectedNode || !!previewData} onClose={closeSidebar} variant="temporary" sx={{ width: 350, '& .MuiDrawer-paper': { width: 350, borderLeft: `4px solid ${sidebarColor}`, boxShadow: -5 } }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Avatar sx={{ bgcolor: sidebarColor, width: 64, height: 64 }}>
              {selectedNode ? React.createElement(Icons[selectedNode.data.icon] || Icons.HelpOutline, { sx: { fontSize: 32 } }) : <GroupIcon sx={{ fontSize: 32 }} />}
            </Avatar>
            <IconButton onClick={closeSidebar}><CloseIcon /></IconButton>
          </Box>

          {selectedNode && (
            <>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{selectedNode.data.label}</Typography>
              <Typography variant="subtitle1" color="text.secondary">ID: {selectedNode.id}</Typography>
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>ALL NEIGHBORS:</Typography>
              <List>
                {selectedNodeNeighbors.length === 0 && <Typography variant="body2" color="text.secondary">Loading neighbors...</Typography>}
                {[...selectedNodeNeighbors]
                  .sort((a, b) => (a.data.type || "").localeCompare(b.data.type || ""))
                  .map(node => {
                    const NodeIcon = Icons[node.data.icon] || Icons.HelpOutline;
                  const isAlreadyOnCanvas = nodes.some(n => n.id === node.id);
                  return (
                    <ListItem key={node.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: getHexColor(node.data.type), width: 32, height: 32 }}>
                          <NodeIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={node.data.label} secondary={node.data.type} />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          color="primary" 
                          disabled={isAlreadyOnCanvas}
                          onClick={() => addSingleNode(selectedNode.id, node)}
                        >
                          {isAlreadyOnCanvas ? <Icons.Check /> : <AddIcon />}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}

          {previewData && (
            <>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{previewData.category.toUpperCase()} Group</Typography>
              <Typography variant="subtitle1" color="text.secondary">{previewData.nodes.length} Neighbors found</Typography>
              <Divider sx={{ my: 2 }} />
              <List>
                {[...previewData.nodes]
                  .sort((a, b) => (a.data.type || "").localeCompare(b.data.type || ""))
                  .map(node => {
                    const NodeIcon = Icons[node.data.icon] || Icons.HelpOutline;
                  const isAlreadyOnCanvas = nodes.some(n => n.id === node.id);
                  return (
                    <ListItem key={node.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: sidebarColor, width: 32, height: 32 }}>
                          <NodeIcon sx={{ fontSize: 18 }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={node.data.label} secondary={node.data.type} />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          color="primary" 
                          disabled={isAlreadyOnCanvas}
                          onClick={() => addSingleNode(previewData.sourceId, node)}
                        >
                          {isAlreadyOnCanvas ? <Icons.Check /> : <AddIcon />}
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  );
                })}
              </List>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}
