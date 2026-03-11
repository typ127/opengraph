import React, { useMemo } from 'react';
import { BaseEdge } from 'reactflow';
import { COLORS } from './theme';
import { getHexColor } from './constants';

/**
 * ArcEdge.jsx
 * 
 * Custom edge for Arc Diagrams.
 * Draws a perfect semi-circle (SVG Elliptical Arc) between nodes.
 * Arcs are above if sourceX < targetX, below otherwise.
 */
export default function ArcEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data,
}) {
  const edgePath = useMemo(() => {
    const dx = targetX - sourceX;
    const distance = Math.abs(dx);
    
    // Radius is half the distance for a perfect semi-circle
    const r = distance / 2;
    
    // Direction from layout options
    const direction = data?.layoutOptions?.arcDirection || 'both';
    
    // Sweep flag: 
    // In SVG coordinate system (Y increases downwards):
    // Sweep 0 -> Arc Above (Counter-clockwise from Left to Right)
    // Sweep 1 -> Arc Below (Clockwise from Left to Right)
    
    let sweep = 0;
    if (direction === 'up') {
      sweep = dx > 0 ? 0 : 1;
    } else if (direction === 'down') {
      sweep = dx > 0 ? 1 : 0;
    } else {
      // Default: BOTH (Smart)
      // dx > 0 (Left to Right) -> Above (Sweep 0)
      // dx < 0 (Right to Left) -> Below (Sweep 0) - Wait, let's re-verify:
      // If we want L->R Above and R->L Below:
      // dx > 0 -> Sweep 0 (Above)
      // dx < 0 -> Sweep 0 (Below) - Yes, because the points are swapped.
      sweep = 0; 
    }
    
    return `M${sourceX},${sourceY} A${r},${r} 0 0,${sweep} ${targetX},${targetY}`;
  }, [sourceX, sourceY, targetX, targetY, data?.layoutOptions?.arcDirection]);

  // Find source node color for aesthetic mapping
  const sourceNode = data?.nodes?.find(n => n.id === data?.source);
  
  // Color Logic: If useSystemColor is on, use primary. Else use node type color.
  const useSystemColor = data?.layoutOptions?.arcUseSystemColor ?? false;
  const nodeColor = sourceNode ? getHexColor(sourceNode.data.type) : COLORS.primary;
  const strokeColor = useSystemColor ? COLORS.primary : nodeColor;

  const importanceWeight = data?.layoutOptions?.arcImportanceWeight ?? 2.0;
  const importance = sourceNode?.data.importance ?? 0.5;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        stroke: data?.type === 'PATH' ? COLORS.secondary : strokeColor,
        strokeWidth: 2 + (importance * importanceWeight), // Base thickness increased to 2 + dynamic weight
        opacity: data?.type === 'PATH' ? 1.0 : 0.4,
        transition: 'stroke 0.3s, opacity 0.3s, stroke-width 0.3s',
      }}
    />
  );
}
