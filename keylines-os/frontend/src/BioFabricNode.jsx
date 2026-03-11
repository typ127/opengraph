import React from 'react';
import { Handle, Position } from 'reactflow';
import { Typography, Box } from '@mui/material';
import { COLORS } from './theme';
import { getHexColor } from './constants';
import * as Icons from '@mui/icons-material';

export default function BioFabricNode({ data }) {
  const IconComponent = Icons[data.icon] || Icons.HelpOutline;
  const nodeColor = getHexColor(data.type);

  return (
    <div style={{ position: 'relative', width: '1500px', height: '1px', display: 'flex', alignItems: 'center' }}>
      <Handle type="target" position={Position.Left} style={{ opacity: 0, left: 0 }} />
      <Handle type="source" position={Position.Left} style={{ opacity: 0, left: 0 }} />

      {/* Visual Track Line - Extends far to the right, starting from the anchor */}
      <div style={{ 
        position: 'absolute', left: 0, width: '4000px', height: '1px', 
        backgroundColor: nodeColor, opacity: 0.2, boxShadow: `0 0 5px ${nodeColor}66`,
        pointerEvents: 'none'
      }} />

      {/* Node Label - Right-aligned to the anchor (extends to the left) */}
      <Box 
        onMouseEnter={() => data.onMouseEnter?.()}
        onMouseLeave={() => data.onMouseLeave?.()}
        sx={{ 
          position: 'absolute', right: '100%', mr: 2, display: 'flex', alignItems: 'center', gap: 1, 
          transform: 'translateY(-50%)', bgcolor: nodeColor, 
          px: 1.5, py: 0.5, borderRadius: 1, zIndex: 10,
          whiteSpace: 'nowrap',
          boxShadow: `0 0 10px ${nodeColor}44`,
          cursor: 'pointer',
          transition: 'transform 0.2s ease',
          '&:hover': { transform: 'translateY(-50%) scale(1.05)' }
        }}
      >
        <Typography sx={{ fontSize: '10px', color: '#fff', fontWeight: 'bold', letterSpacing: 0.5 }}>
          {data.label?.toUpperCase()}
        </Typography>
        <IconComponent sx={{ fontSize: 14, color: '#fff' }} />
      </Box>
    </div>
  );
}
