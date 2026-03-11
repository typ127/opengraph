import React, { useMemo, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer } from 'reactflow';
import { COLORS } from './theme';
import { getHexColor } from './constants';

/**
 * BioFabricEdge.jsx
 * 
 * Custom edge for BioFabric Layout.
 * Draws a strict vertical line with intersection dots.
 * Shows relation string on hover and glyphs for paths.
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
  label,
}) {
  const [isHovered, setIsHovered] = useState(false);
  
  const colIndex = data?.columnIndex || 0;
  const labelPadding = 40; 
  const colSpacing = data?.layoutOptions?.bioFabricColSpacing || 15;
  
  // Calculate X relative to the source node position
  const edgeX = sourceX + labelPadding + (colIndex * colSpacing);

  const edgePath = useMemo(() => {
    // Full path for hit area
    return `M${edgeX},${sourceY} L${edgeX},${targetY}`;
  }, [edgeX, sourceY, targetY]);

  const visualPath = useMemo(() => {
    // Shortened path for BaseEdge to allow for arrow offset
    const offset = 12; 
    const isDown = targetY > sourceY;
    const arrowY = isDown ? targetY - offset : targetY + offset;
    
    // Safety check: if distance is too small, use original
    if (Math.abs(targetY - sourceY) <= offset) return edgePath;
    
    return `M${edgeX},${sourceY} L${edgeX},${arrowY}`;
  }, [edgeX, sourceY, targetY, edgePath]);

  // Find source node color for aesthetic mapping
  const sourceNode = data?.nodes?.find(n => n.id === data?.source);
  
  // Color Logic: If useSystemColor is on, use primary. Else use node type color.
  const useSystemColor = data?.layoutOptions?.bioFabricUseSystemColor ?? false;
  const nodeColor = sourceNode ? getHexColor(sourceNode.data.type) : COLORS.primary;
  
  const isPath = data?.type === 'PATH';
  const intermediateCount = data?.intermediateCount || 0;
  
  // Final Stroke Color determination
  const strokeColor = isPath ? COLORS.secondary : (useSystemColor ? COLORS.primary : nodeColor);

  // Midpoint for label/glyph placement
  const midY = (sourceY + targetY) / 2;

  return (
    <>
      <g 
        onMouseEnter={() => setIsHovered(true)} 
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: 'pointer' }}
      >
        {/* Invisible wider hit area for easier hovering */}
        <path d={edgePath} fill="none" stroke="transparent" strokeWidth={10} />
        
        <BaseEdge
          id={id}
          path={visualPath}
          markerEnd={markerEnd}
          style={{
            ...style,
            stroke: strokeColor,
            strokeWidth: isHovered ? 2.5 : 1.5,
            opacity: isPath ? 1.0 : (isHovered ? 1.0 : 0.6),
            transition: 'stroke 0.3s, opacity 0.3s, stroke-width 0.2s',
          }}
        />
        
        {/* Intersection Dots */}
        <circle cx={edgeX} cy={sourceY} r={isHovered ? 4 : 3} fill={strokeColor} style={{ transition: 'r 0.2s' }} />
        <circle cx={edgeX} cy={targetY} r={isHovered ? 4 : 3} fill={strokeColor} style={{ transition: 'r 0.2s' }} />

        {/* Path Glyph (Intermediate Nodes) */}
        {isPath && intermediateCount > 0 && (
          <g transform={`translate(${edgeX}, ${midY})`} style={{ pointerEvents: 'none' }}>
            <circle 
              r="10" 
              fill={COLORS.secondary} 
              stroke="none"
              style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.4))' }}
            />
            <text
              y="0"
              fill="#fff"
              textAnchor="middle"
              dominantBaseline="central"
              style={{ 
                fontSize: '12px', 
                fontWeight: 900, 
                fontFamily: '"Open Sans", sans-serif',
                userSelect: 'none',
                letterSpacing: '-0.5px'
              }}
            >
              {intermediateCount}
            </text>
          </g>
        )}
      </g>

      {/* Relation String on Hover */}
      {isHovered && label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${edgeX}px,${midY}px)`,
              fontSize: 10,
              fontWeight: 600,
              pointerEvents: 'none',
              color: COLORS.nodeLabel,
              background: COLORS.background,
              padding: '2px 4px',
              borderRadius: 4,
              fontStyle: 'italic',
              whiteSpace: 'nowrap',
              zIndex: 1000,
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
