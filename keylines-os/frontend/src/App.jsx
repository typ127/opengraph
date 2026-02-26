import React, { useCallback, useEffect } from 'react';
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

// --- LAYOUT ENGINES ---

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 150, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 50,
      },
    };
  });
};

const getCircularLayout = (nodes) => {
  const radius = nodes.length * 40 + 100;
  const center = { x: 400, y: 400 };
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

const getForceLayout = (nodes, edges) => {
  const simulationNodes = nodes.map(n => ({ ...n, x: n.position.x, y: n.position.y }));
  const simulationLinks = edges.map(e => ({ ...e }));

  const simulation = d3Force.forceSimulation(simulationNodes)
    .force('link', d3Force.forceLink(simulationLinks).id(d => d.id).distance(150))
    .force('charge', d3Force.forceManyBody().strength(-500))
    .force('center', d3Force.forceCenter(400, 400))
    .stop();

  for (let i = 0; i < 300; ++i) simulation.tick();

  return simulationNodes.map(node => ({
    ...nodes.find(n => n.id === node.id),
    position: { x: node.x, y: node.y }
  }));
};

// --- HELPER ---

const integrateNewData = (currentNodes, currentEdges, newData, sourceNodeId) => {
  const sourceNode = currentNodes.find(n => n.id === sourceNodeId);
  const sourcePos = sourceNode ? sourceNode.position : { x: 0, y: 0 };
  const radius = 180;
  
  const updatedNodes = currentNodes.map(node => {
    const freshData = newData.nodes.find(n => n.id === node.id);
    if (freshData) {
      return { ...node, data: { ...node.data, ...freshData.data } };
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
        position: {
          x: sourcePos.x + radius * Math.cos(angle),
          y: sourcePos.y + radius * Math.sin(angle),
        },
      };
    });

  const newEdges = newData.edges.filter(
    newEdge => !currentEdges.find(e => e.id === newEdge.id)
  );

  return {
    nodes: [...updatedNodes, ...reallyNewNodes],
    edges: [...currentEdges, ...newEdges],
  };
};

const initialNodes = [
  {
    id: 'n1',
    type: 'keylines',
    position: { x: 250, y: 250 },
    data: { 
      label: 'Hari Seldon', 
      icon: 'Hub', 
      type: 'Person', 
      donut: [], 
      score: 1.0 
    },
  },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const expandNode = useCallback(async (nodeId) => {
    try {
      const response = await fetch(`http://localhost:8000/expand/${nodeId}`);
      const data = await response.json();
      
      setNodes((nds) => {
        const { nodes: integratedNodes } = integrateNewData(nds, edges, data, nodeId);
        return [...integratedNodes];
      });

      setEdges((eds) => {
        const { edges: integratedEdges } = integrateNewData(nodes, eds, data, nodeId);
        return [...integratedEdges];
      });
    } catch (error) {
      console.error('Error expanding node:', error);
    }
  }, [nodes, edges, setNodes, setEdges]);

  // Initialer Load nur für den Donut des Startknotens (ohne Expansion)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/expand/n1`);
        const data = await response.json();
        const startNodeData = data.nodes.find(n => n.id === 'n1');
        
        if (startNodeData) {
          setNodes((nds) => nds.map(node => 
            node.id === 'n1' 
              ? { ...node, data: { ...node.data, ...startNodeData.data } }
              : node
          ));
        }
      } catch (error) {
        console.error('Error loading initial donut:', error);
      }
    };
    fetchInitialData();
  }, [setNodes]);

  const onLayout = useCallback((type) => {
    let layoutedNodes = [];
    if (type === 'hierarchical') layoutedNodes = getLayoutedElements(nodes, edges);
    if (type === 'circular') layoutedNodes = getCircularLayout(nodes);
    if (type === 'force') layoutedNodes = getForceLayout(nodes, edges);
    
    setNodes([...layoutedNodes]);
  }, [nodes, edges, setNodes]);

  const onNodeClick = useCallback((event, node) => {
    expandNode(node.id);
  }, [expandNode]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f5f5f5' }}>
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
                <IconButton onClick={() => onLayout('hierarchical')} color="primary">
                  <TreeIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Circular Layout" arrow>
                <IconButton onClick={() => onLayout('circular')} color="primary">
                  <CircularIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Force Directed Layout" arrow>
                <IconButton onClick={() => onLayout('force')} color="primary">
                  <ForceIcon />
                </IconButton>
              </Tooltip>
            </ButtonGroup>
          </Paper>
        </Panel>
      </ReactFlow>
    </div>
  );
}
