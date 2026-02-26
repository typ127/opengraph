import React, { useCallback, useState } from 'react';
import ReactFlow, { 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Background, 
  Controls 
} from 'reactflow';
import 'reactflow/dist/style.css';
import KeyLinesNode from './KeyLinesNode';

const nodeTypes = {
  keylines: KeyLinesNode,
};

// Helper: Radial layout for new nodes around source
const integrateNewData = (currentNodes, currentEdges, newData, sourceNodeId) => {
  const sourceNode = currentNodes.find(n => n.id === sourceNodeId);
  const sourcePos = sourceNode ? sourceNode.position : { x: 0, y: 0 };
  
  const radius = 180;
  
  // 1. Bestehende Knoten aktualisieren (falls neue Daten vom Backend kommen)
  const updatedNodes = currentNodes.map(node => {
    const freshData = newData.nodes.find(n => n.id === node.id);
    if (freshData) {
      return { ...node, data: { ...node.data, ...freshData.data } };
    }
    return node;
  });

  // 2. Nur wirklich neue Knoten hinzufügen
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

  // 3. Neue Kanten hinzufügen
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
    data: { label: 'Start Node', icon: 'Source', donut: [100], score: 0.5 },
  },
];

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onNodeClick = useCallback(async (event, node) => {
    try {
      console.log('Expanding:', node.id);
      const response = await fetch(`http://localhost:8000/expand/${node.id}`);
      const data = await response.json();
      
      setNodes((nds) => {
        const { nodes: integratedNodes } = integrateNewData(nds, edges, data, node.id);
        return [...integratedNodes]; // Force new array reference
      });

      setEdges((eds) => {
        const { edges: integratedEdges } = integrateNewData(nodes, eds, data, node.id);
        return [...integratedEdges];
      });
    } catch (error) {
      console.error('Error expanding node:', error);
    }
  }, [setNodes, setEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#f5f5f5' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
