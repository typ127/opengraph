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
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      
      {/* Visual Track Line - Extends far to the right */}
      <div style={{ 
        position: 'absolute', left: 0, width: '4000px', height: '1px', 
        backgroundColor: nodeColor, opacity: 0.2, boxShadow: `0 0 5px ${nodeColor}66`,
        pointerEvents: 'none'
      }} />

      <Box sx={{ 
        position: 'absolute', left: 0, display: 'flex', alignItems: 'center', gap: 1, 
        transform: 'translateY(-50%)', bgcolor: 'rgba(30,30,30,0.9)', border: `1px solid ${nodeColor}44`,
        px: 1.5, py: 0.5, borderRadius: 1, zIndex: 10, backdropFilter: 'blur(4px)'
      }}>
        <IconComponent sx={{ fontSize: 14, color: nodeColor }} />
        <Typography sx={{ fontSize: '10px', color: '#fff', whiteSpace: 'nowrap', fontWeight: 'bold', letterSpacing: 0.5 }}>
          {data.label?.toUpperCase()}
        </Typography>
      </Box>
    </div>
  );
}
