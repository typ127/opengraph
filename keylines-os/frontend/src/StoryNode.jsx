import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import * as Icons from '@mui/icons-material';
import { Typography, Box } from '@mui/material';
import { getHexColor } from './constants';
import { COLORS } from './theme';

const StoryNode = ({ data }) => {
  const { 
    label, icon, type, targetHandleCount = 1, sourceHandleCount = 1,
    importance = 0.5 
  } = data;
  
  const IconComponent = Icons[icon] || Icons.HelpOutline;
  const nodeColor = getHexColor(type);
  
  // Base size based on importance
  const size = 40 + (importance * 40);

  // Helper to render multiple handles
  const renderHandles = (count, position, typePrefix) => {
    return Array.from({ length: count }).map((_, i) => {
      // Calculate percentage offset for even spacing
      const top = count === 1 ? 50 : (100 / (count + 1)) * (i + 1);
      return (
        <Handle
          key={`${typePrefix}-${i}`}
          type={typePrefix === 'target' ? 'target' : 'source'}
          position={position}
          id={`${typePrefix}-${i}`}
          style={{ 
            top: `${top}%`, 
            background: 'transparent', 
            border: 'none',
            pointerEvents: 'none',
            opacity: 0
          }}
        />
      );
    });
  };

  return (
    <Box sx={{ 
      width: size, 
      height: size, 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative'
    }}>
      {/* Target Handles (Left) */}
      {renderHandles(targetHandleCount, Position.Left, 'target')}
      
      {/* Source Handles (Right) */}
      {renderHandles(sourceHandleCount, Position.Right, 'source')}

      {/* Visual Node Body */}
      <Box sx={{
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        bgcolor: 'rgba(20, 25, 35, 0.9)',
        border: `2px solid ${nodeColor}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 0 15px ${nodeColor}33`,
        zIndex: 2
      }}>
        <IconComponent sx={{ color: nodeColor, fontSize: size * 0.6 }} />
      </Box>

      {/* Label */}
      <Typography variant="caption" sx={{ 
        position: 'absolute', 
        top: '100%', 
        mt: 1, 
        color: COLORS.nodeLabel,
        fontWeight: 'bold',
        whiteSpace: 'nowrap',
        fontSize: '10px',
        textShadow: '0 0 4px black'
      }}>
        {label}
      </Typography>
    </Box>
  );
};

export default memo(StoryNode);
