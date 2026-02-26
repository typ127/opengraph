import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, { 
  useNodesState, 
  useEdgesState, 
  Background, 
  Controls,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import KeyLinesNode from './KeyLinesNode';
import dagre from 'dagre';
import * as d3Force from 'd3-force';
import { ButtonGroup, IconButton, Paper, Tooltip } from '@mui/material';
import { 
  AccountTree as TreeIcon, 
  BlurCircular as CircularIcon, 
  ElectricBolt as ForceIcon 
} from '@mui/icons-material';

const nodeTypes = {
  keylines: KeyLinesNode,
};

const categoryMap = {
  "person": "blue", "mutant": "blue",
  "planet": "green",
  "robot": "orange", "item": "orange",
  "entity": "purple", "science": "purple",
};

// --- LAYOUT ENGINES ---

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });
  nodes.forEach((node) => dagreGraph.setNode(node.id, { width: 150, height: 100 }));
  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  dagre.layout(dagreGraph);
  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return { ...node, position: { x: nodeWithPosition.x - 75, y: nodeWithPosition.y - 50 } };
  });
};

const getCircularLayout = (nodes) => {
  const radius = nodes.length * 40 + 100;
  const center = { x: 400, y: 400 };
  return nodes.map((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    return { ...node, position: { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) } };
  });
};

const getForceLayout = (nodes, edges) => {
  const simulationNodes = nodes.map(n => ({ ...n, x: n.position.x, y: n.position.y }));
  const simulationLinks = edges.map(e => ({ ...e }));
  const simulation = d3Force.forceSimulation(simulationNodes)
    .force('link', d3Force.forceLink(simulationLinks).id(d => d.id).distance(150).strength(0.5))
    .force('charge', d3Force.forceManyBody().strength(-500))
    .force('center', d3Force.forceCenter(400, 400))
    .force('collide', d3Force.forceCollide().radius(50))
    .stop();
  for (let i = 0; i < 300; ++i) simulation.tick();
  return simulationNodes.map(node => ({ ...nodes.find(n => n.id === node.id), position: { x: node.x, y: node.y } }));
};

// --- HELPER ---

const getDescendants = (nodeId, edges) => {
  let descendants = [];
  const children = edges.filter(edge => edge.source === nodeId).map(edge => edge.target);
  children.forEach(childId => {
    descendants.push(childId);
    descendants = [...descendants, ...getDescendants(childId, edges)];
  });
  return Array.from(new Set(descendants));
};

const integrateNewData = (currentNodes, currentEdges, newData, sourceNodeId, expandNodeFn) => {
  const sourceNode = currentNodes.find(n => n.id === sourceNodeId);
  const sourcePos = sourceNode ? sourceNode.position : { x: 400, y: 400 };
  const initialRadius = 10;
  
  const updatedNodes = currentNodes.map(node => {
    const freshData = newData.nodes.find(n => n.id === node.id);
    if (freshData) {
      return { ...node, data: { ...node.data, ...freshData.data, onSegmentClick: (cat) => expandNodeFn(node.id, cat) } };
    }
    return node;
  });

  const reallyNewNodes = newData.nodes
    .filter(newNode => !currentNodes.find(n => n.id === newNode.id))
    .map((newNode, index, array) => {
      const angle = (index / array.length) * 2 * Math.PI;
      return {
        ...newNode,
        type: 'keylines',
        position: { x: sourcePos.x + initialRadius * Math.cos(angle), y: sourcePos.y + initialRadius * Math.sin(angle) },
        data: { ...newNode.data, onSegmentClick: (cat) => expandNodeFn(newNode.id, cat) }
      };
    });

  const newEdges = newData.edges.filter(newEdge => !currentEdges.find(e => e.id === newEdge.id));

  return { nodes: [...updatedNodes, ...reallyNewNodes], edges: [...currentEdges, ...newEdges] };
};

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeLayout, setActiveLayout] = useState('force');

  // Refs um Closure-Probleme zu vermeiden
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);

  const applyLayout = useCallback((nds, eds, type) => {
    if (type === 'hierarchical') return getLayoutedElements(nds, eds);
    if (type === 'circular') return getCircularLayout(nds);
    if (type === 'force') return getForceLayout(nds, eds);
    return nds;
  }, []);

  const expandNode = useCallback(async (nodeId, filterCategory = null) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;

    if (filterCategory) {
      const directChildren = currentEdges
        .filter(e => e.source === nodeId)
        .map(e => currentNodes.find(n => n.id === e.target))
        .filter(n => n && categoryMap[n.data.type?.toLowerCase()] === filterCategory);

      if (directChildren.length > 0) {
        // --- COLLAPSE MODE ---
        const childIds = directChildren.map(n => n.id);
        let allToCollapse = [...childIds];
        childIds.forEach(id => { allToCollapse = [...allToCollapse, ...getDescendants(id, currentEdges)]; });
        const uniqueToCollapse = Array.from(new Set(allToCollapse));

        setNodes(nds => nds.filter(n => !uniqueToCollapse.includes(n.id)));
        setEdges(eds => eds.filter(e => !uniqueToCollapse.includes(e.source) && !uniqueToCollapse.includes(e.target)));
        return;
      }
    }

    // --- EXPAND MODE ---
    try {
      let url = `http://localhost:8000/expand/${nodeId}`;
      if (filterCategory) url += `?filter_category=${filterCategory}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      let nextNodes, nextEdges;
      
      setNodes((nds) => {
        const integrated = integrateNewData(nds, currentEdges, data, nodeId, expandNode);
        nextNodes = integrated.nodes;
        return [...nextNodes];
      });

      setEdges((eds) => {
        const integrated = integrateNewData(currentNodes, eds, data, nodeId, expandNode);
        nextEdges = integrated.edges;
        return [...nextEdges];
      });

      setTimeout(() => {
        setNodes((nds) => applyLayout(nds, nextEdges, activeLayout));
      }, 50);

    } catch (error) {
      console.error('Error expanding node:', error);
    }
  }, [activeLayout, applyLayout]);

  useEffect(() => {
    const startHandler = (cat) => expandNode('n1', cat);
    setNodes([{
      id: 'n1',
      type: 'keylines',
      position: { x: 400, y: 400 },
      data: { label: 'Hari Seldon', icon: 'Hub', type: 'Person', donut: [], score: 1.0, onSegmentClick: startHandler },
    }]);
    
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/expand/n1`);
        const data = await response.json();
        const startNodeData = data.nodes.find(n => n.id === 'n1');
        if (startNodeData) {
          setNodes((nds) => nds.map(node => 
            node.id === 'n1' ? { ...node, data: { ...node.data, ...startNodeData.data, onSegmentClick: startHandler } } : node
          ));
        }
      } catch (error) { console.error('Error loading initial donut:', error); }
    };
    fetchInitialData();
  }, [expandNode, setNodes]);

  const onLayoutClick = useCallback((type) => {
    setActiveLayout(type);
    setNodes((nds) => applyLayout(nds, edgesRef.current, type));
  }, [applyLayout, setNodes]);

  const onNodeClick = useCallback((event, node) => { expandNode(node.id); }, [expandNode]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f5f5f5' }}>
      <style>{`
        .react-flow__node {
          transition: transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          will-change: transform;
        }
        .react-flow__node.dragging { transition: none !important; }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{ type: 'straight' }}
        fitView
      >
        <Background />
        <Controls />
        <Panel position="top-right">
          <Paper elevation={3} sx={{ p: 0.5, m: 2, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: 2 }}>
            <ButtonGroup variant="text" size="small">
              <Tooltip title="Hierarchical Layout" arrow>
                <IconButton onClick={() => onLayoutClick('hierarchical')} color={activeLayout === 'hierarchical' ? 'secondary' : 'primary'}><TreeIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Circular Layout" arrow>
                <IconButton onClick={() => onLayoutClick('circular')} color={activeLayout === 'circular' ? 'secondary' : 'primary'}><CircularIcon /></IconButton>
              </Tooltip>
              <Tooltip title="Force Directed Layout" arrow>
                <IconButton onClick={() => onLayoutClick('force')} color={activeLayout === 'force' ? 'secondary' : 'primary'}><ForceIcon /></IconButton>
              </Tooltip>
            </ButtonGroup>
          </Paper>
        </Panel>
      </ReactFlow>
    </div>
  );
}
