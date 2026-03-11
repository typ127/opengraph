import React, { useMemo } from 'react';
import { BaseEdge } from 'reactflow';
import { COLORS } from './theme';
import { getHexColor } from './constants';

/**
 * BioFabricEdge.jsx
 * 
 * Custom edge for BioFabric Layout.
 * Draws a strict vertical line with intersection dots.
 */
export default function BioFabricEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data,
}) {
  const colIndex = data?.columnIndex || 0;
  const labelPadding = 250; // Leave space for node labels
  const colSpacing = data?.layoutOptions?.bioFabricColSpacing || 15;
  const edgeX = labelPadding + (colIndex * colSpacing);

  const edgePath = useMemo(() => {
    // Strict vertical line
    return `M${edgeX},${sourceY} L${edgeX},${targetY}`;
  }, [edgeX, sourceY, targetY]);

  // Find source node color for aesthetic mapping
  const sourceNode = data?.nodes?.find(n => n.id === data?.source);
  
  // Color Logic: If useSystemColor is on, use primary. Else use node type color.
  const useSystemColor = data?.layoutOptions?.bioFabricUseSystemColor ?? false;
  const nodeColor = sourceNode ? getHexColor(sourceNode.data.type) : COLORS.primary;
  const strokeColor = useSystemColor ? COLORS.primary : nodeColor;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: data?.type === 'PATH' ? COLORS.secondary : strokeColor,
          strokeWidth: 1.5,
          opacity: data?.type === 'PATH' ? 1.0 : 0.6,
          transition: 'stroke 0.3s, opacity 0.3s',
        }}
      />
      {/* Intersection Dots */}
      <circle cx={edgeX} cy={sourceY} r={3} fill={data?.type === 'PATH' ? COLORS.secondary : strokeColor} />
      <circle cx={edgeX} cy={targetY} r={3} fill={data?.type === 'PATH' ? COLORS.secondary : strokeColor} />
    </>
  );
}
