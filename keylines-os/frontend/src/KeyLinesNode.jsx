import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import * as Icons from '@mui/icons-material';
import { Typography, Box, Tooltip } from '@mui/material';

import { getHexColor } from './constants';

const KeyLinesNode = ({ data }) => {
  const { label, icon, donut = [], score = 1.0 } = data;
  const IconComponent = Icons[icon] || Icons.HelpOutline;

  const size = 60;
  const radius = 25;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const baseScale = 0.8;
  const scale = baseScale + (score * 0.5);

  let cumulativeOffset = 0;
  const myColor = getHexColor(data.type);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      transform: `scale(${scale})`,
      transition: 'transform 0.3s ease-out'
    }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        {/* SVG Donut Ring */}
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
          {donut.map((segment, index) => {
            const value = typeof segment === 'object' ? segment.value : segment;
            const color = typeof segment === 'object' ? segment.color : (index === 0 ? '#1976d2' : '#dc004e');
            
            const strokeDasharray = `${(value / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativeOffset;
            cumulativeOffset += (value / 100) * circumference;

            const tooltipTitle = segment.type_labels ? segment.type_labels.join(", ") : (segment.types ? segment.types.join(", ") : segment.category?.toUpperCase());

            return (
              <Tooltip 
                key={index} 
                title={tooltipTitle} 
                arrow 
                placement="top"
                enterDelay={0}
                enterNextDelay={0}
                slotProps={{
                  popper: {
                    modifiers: [
                      {
                        name: 'offset',
                        options: {
                          offset: [0, 12],
                        },
                      },
                    ],
                  },
                }}
              >
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={color}
                  strokeWidth="10"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="butt"
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'stroke-width 0.2s',
                    pointerEvents: 'stroke' 
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (data.onSegmentClick && segment.category) {
                      data.onSegmentClick(segment.category, e);
                    }
                  }}
                  onMouseEnter={(e) => e.target.setAttribute('stroke-width', '14')}
                  onMouseLeave={(e) => e.target.setAttribute('stroke-width', '10')}
                />
              </Tooltip>
            );
          })}
          {donut.length === 0 && (
            <circle cx={center} cy={center} r={radius} fill="none" stroke="#e0e0e0" strokeWidth="2" />
          )}
        </svg>

        {/* Central Icon */}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: myColor,
          borderRadius: '50%',
          width: 34,
          height: 34,
          boxShadow: 2,
          border: '2px solid white'
        }}>
          <IconComponent sx={{ fontSize: 24, color: 'white' }} />
        </Box>

        {/* Handles */}
        <Handle type="target" position={Position.Top} style={{ top: '30px', left: '30px', background: 'transparent', border: 'none', pointerEvents: 'none' }} />
        <Handle type="source" position={Position.Bottom} style={{ top: '30px', left: '30px', background: 'transparent', border: 'none', pointerEvents: 'none' }} />
      </div>

      {/* Label */}
      <Typography variant="caption" sx={{ mt: 1, fontWeight: 'bold', color: '#333', textAlign: 'center' }}>
        {label}
      </Typography>
    </Box>
  );
};

export default memo(KeyLinesNode);
