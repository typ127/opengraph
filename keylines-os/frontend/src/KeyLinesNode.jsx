import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import * as Icons from '@mui/icons-material';
import { Typography, Box } from '@mui/material';

const KeyLinesNode = ({ data }) => {
  const { label, icon, donut = [], score = 1.0 } = data;
  const IconComponent = Icons[icon] || Icons.HelpOutline;

  // Constants for Donut SVG
  const size = 60;
  const radius = 25;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  // Scale node based on score (0.1 - 1.0)
  const baseScale = 0.8;
  const scale = baseScale + (score * 0.5);

  let cumulativeOffset = 0;

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
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {donut.map((percentage, index) => {
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativeOffset;
            cumulativeOffset += (percentage / 100) * circumference;

            return (
              <circle
                key={index}
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke={index === 0 ? '#1976d2' : '#dc004e'}
                strokeWidth="6"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
              />
            );
          })}
          {/* Background circle if donut is empty */}
          {donut.length === 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#e0e0e0"
              strokeWidth="6"
            />
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
          bgcolor: 'white',
          borderRadius: '50%',
          width: 34,
          height: 34,
          boxShadow: 2
        }}>
          <IconComponent sx={{ fontSize: 24, color: '#444' }} />
        </Box>
      </div>

      {/* Label */}
      <Typography variant="caption" sx={{ mt: 1, fontWeight: 'bold', color: '#333' }}>
        {label}
      </Typography>

      {/* Handles */}
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </Box>
  );
};

export default memo(KeyLinesNode);
