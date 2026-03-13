import React from 'react';
import { getBezierPath, BaseEdge } from 'reactflow';
import { getHexColor } from './constants';

const FlowingEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) => {
  // We use a stronger horizontal curvature for the xkcd look
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.2, // Subtle default, we'll manually pull the path if needed
  });

  // Color mapping based on character (source node type or ID)
  const strokeColor = data?.color || getHexColor(data?.type) || 'rgba(255, 255, 255, 0.4)';
  
  const finalStyle = {
    ...style,
    stroke: strokeColor,
    strokeWidth: data?.isTimeBridge ? 4 : 2.5,
    strokeOpacity: 0.8,
    transition: 'stroke 0.3s ease, stroke-width 0.3s ease',
  };

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={finalStyle}
    />
  );
};

export default FlowingEdge;
