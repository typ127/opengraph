import React, { useMemo } from 'react';
import { BaseEdge, getBezierPath } from 'reactflow';
import { COLORS } from './theme';

/**
 * BundledEdge.jsx
 * 
 * Custom edge for Hierarchical Edge Bundling.
 * Pulls the control point of a quadratic bezier curve towards the center.
 */
export default function BundledEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data,
}) {
  // Tension from layoutOptions (0.0 - 1.0)
  // We check both direct data and nested layoutOptions for flexibility
  const tension = data?.tension ?? data?.layoutOptions?.bundlingTension ?? 0.8;
  
  // Center point for bundling pull
  let centerX = data?.centerX ?? 0;
  let centerY = data?.centerY ?? 0;

  // If nodes are provided in data, calculate center dynamically
  if (data?.nodes && data.nodes.length > 0) {
    const avgX = data.nodes.reduce((sum, n) => sum + n.position.x, 0) / data.nodes.length;
    const avgY = data.nodes.reduce((sum, n) => sum + n.position.y, 0) / data.nodes.length;
    centerX = avgX;
    centerY = avgY;
  }

  const edgePath = useMemo(() => {
    // 1. Calculate the midpoint of the direct line
    const midX = (sourceX + targetX) / 2;
    const midY = (sourceY + targetY) / 2;

    // 2. Interpolate the control point between the midpoint and the center
    // If tension = 0, CP = Midpoint (straight line)
    // If tension = 1, CP = Center (maximum pull)
    const controlX = midX + (centerX - midX) * tension;
    const controlY = midY + (centerY - midY) * tension;

    // 3. Construct quadratic bezier path: M source Q control target
    return `M${sourceX},${sourceY} Q${controlX},${controlY} ${targetX},${targetY}`;
  }, [sourceX, sourceY, targetX, targetY, centerX, centerY, tension]);

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        ...style,
        strokeWidth: style.strokeWidth ?? 1.2,
      }}
    />
  );
}
