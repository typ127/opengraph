import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import ReactFlow, { 
  useNodesState, 
  useEdgesState, 
  Background, 
  Controls, 
  Panel, 
  useReactFlow,
  getNodesBounds,
  addEdge,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getStraightPath,
  getSmoothStepPath,
  getSimpleBezierPath
} from 'reactflow';
import 'reactflow/dist/style.css';
import KeyLinesNode from './KeyLinesNode';
import dagre from 'dagre';
import * as d3Force from 'd3-force';
import { toPng } from 'html-to-image';
import download from 'downloadjs';
import { 
  ButtonGroup, 
  IconButton, 
  Paper, 
  Tooltip, 
  Drawer, 
  Box, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Avatar,
  ListItemAvatar,
  ListItemSecondaryAction,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Autocomplete,
  TextField,
  InputAdornment,
  Button,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider
} from '@mui/material';
import { 
  BarChart as HistogramIcon,
  AccountTree as TreeIcon, 
  BlurCircular as CircularIcon, 
  Hub as HiveIcon,
  Polyline as BundledIcon,
  SettingsInputComponent as OrthogonalIcon,
  Timeline as ArcIcon,
  ViewStream as BioFabricIcon,
  ElectricBolt as ForceIcon,
  Close as CloseIcon, 
  Info as InfoIcon, 
  Category as TypeIcon,
  Group as GroupIcon, 
  AddCircleOutline as AddIcon, 
  FilterList as FilterIcon,
  Search as SearchIcon, 
  ClearAll as ClearAllIcon, 
  Download as DownloadIcon,
  FilterCenterFocus as DrillDownIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Settings as SettingsIcon,
  Psychology as AlgorithmIcon,
  Hub as DegreeIcon,
  Animation as BetweennessIcon,
  Star as PageRankIcon,
  Stream as ClosenessIcon,
  GridView as GridIcon,
  ChevronLeft as ChevronLeftIcon,
  BuildOutlined as BuildIcon,
  Person as PersonIcon,
  Public as PublicIcon,
  Android as AndroidIcon,
  AutoStories as ItemIcon,
  Science as ScienceIcon,
  MenuBook as BookIcon,
  AddLink as LinkIcon,
  MenuOpen as MenuIcon,
  CameraAlt as SnapshotIcon,
  DeleteOutline as DeleteOutlineIcon,
  ArrowDownward as ArrowDownwardIcon,
  ModelTraining as TrainingIcon,
  FileUpload as ImportIcon,
  History as HistoryIcon
  } from '@mui/icons-material';
  import * as Icons from '@mui/icons-material';
  import { categoryMap, typeColors, getHexColor } from './constants';
  import { COLORS, EDGE_TYPES, NODE_CATEGORIES } from './theme';
  import { calculateLayout, getLayoutCenter, assignHandles } from './layoutUtils';
  import { useLiveForceLayout } from './useLiveForceLayout';
  import BundledEdge from './BundledEdge';
  import ArcEdge from './ArcEdge';
  import BioFabricNode from './BioFabricNode';
  import BioFabricEdge from './BioFabricEdge';
  import StoryNode from './StoryNode';
  import FlowingEdge from './FlowingEdge';
  
  const nodeTypes = {
    keylines: KeyLinesNode,
    biofabric: BioFabricNode,
    story: StoryNode,
  };

  const PathEdge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    data,
    label,
  }) => {
    let edgePath = '';
    let labelX, labelY;

    const pathParams = { sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition };
    const type = data?.pathType || 'simplebezier';

    if (type === 'bundled') {
      return (
        <BundledEdge 
          id={id} sourceX={sourceX} sourceY={sourceY} targetX={targetX} targetY={targetY} 
          style={style} markerEnd={markerEnd}
          data={data}
        />
      );
    }

    if (type === 'bezier') [edgePath, labelX, labelY] = getBezierPath(pathParams);
    else if (type === 'step') [edgePath, labelX, labelY] = getSmoothStepPath({ ...pathParams, borderRadius: 0 });
    else if (type === 'smoothstep') [edgePath, labelX, labelY] = getSmoothStepPath(pathParams);
    else if (type === 'simplebezier') [edgePath, labelX, labelY] = getSimpleBezierPath(pathParams);
    else [edgePath, labelX, labelY] = getStraightPath(pathParams);

    const intermediateCount = data?.intermediateCount || 0;

    return (
      <>
        <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
        {label && (
          <EdgeLabelRenderer>
            <div
              style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                fontSize: 10,
                fontWeight: 600,
                pointerEvents: 'none',
                color: COLORS.nodeLabel,
                background: COLORS.background,
                padding: '2px 4px',
                borderRadius: 4,
                fontStyle: 'italic',
                zIndex: 1000,
              }}
              className="nodrag nopan"
            >
              {label}
            </div>
          </EdgeLabelRenderer>
        )}
        {intermediateCount > 0 && (
          <g transform={`translate(${labelX}, ${labelY})`} style={{ pointerEvents: 'none' }}>
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
      </>
    );
  };

  const edgeTypes = {
    pathEdge: PathEdge,
    bundled: BundledEdge,
    arc: ArcEdge,
    biofabric: BioFabricEdge,
    flowing: FlowingEdge,
  };
  
  const ExpandableText = ({ text, maxLength = 100 }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    if (!text) return null;
    if (text.length <= maxLength) return <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>{text}</Typography>;
    
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.7)', display: 'inline' }}>
          {isExpanded ? text : `${text.substring(0, maxLength)}...`}
        </Typography>
        <Button size="small" sx={{ ml: 1, textTransform: 'none', minWidth: 'auto', p: 0, fontSize: '0.75rem', color: COLORS.primary }} onClick={() => setIsExpanded(!isExpanded)}>
          {isExpanded ? 'Show less' : 'Show more'}
        </Button>
      </Box>
    );
  };
  
  // --- GLOBAL UTILS ---
  
const deduplicate = (arr) => {
  const map = new Map();
  arr.forEach(item => map.set(item.id, item));
  return Array.from(map.values());
};

const getEdgeStyle = (type) => {
  if (type === 'PATH') {
    return { 
      stroke: COLORS.secondary, 
      strokeWidth: 3, 
      strokeDasharray: '8,4' 
    };
  }
  
  return { 
    stroke: COLORS.primary, 
    strokeWidth: 1 
  };
};

const getDescendants = (nodeId, edges, visited = new Set()) => {
  if (visited.has(nodeId)) return [];
  visited.add(nodeId);
  const children = edges.filter(edge => edge.source === nodeId).map(edge => edge.target);
  let descendants = [];
  children.forEach(childId => {
    if (!visited.has(childId)) {
      descendants.push(childId);
      descendants = [...descendants, ...getDescendants(childId, edges, visited)];
    }
  });
  return descendants;
};

// --- Helper für relative Zeit (Intl) ---
const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const date = typeof dateInput === 'number' ? new Date(dateInput) : new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput; // Fallback für alte Strings
  
  const diff = Date.now() - date.getTime();
  const seconds = Math.max(0, Math.floor(diff / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (days > 0) return rtf.format(-days, 'day');
  if (hours > 0) return rtf.format(-hours, 'hour');
  if (minutes > 0) return rtf.format(-minutes, 'minute');
  if (seconds > 5) return rtf.format(-seconds, 'second');
  return 'just now';
};

export default function App() {
  const { fitView, setCenter, screenToFlowPosition, getViewport } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [pathEdges, setPathEdges] = useState([]);
  const [activeLayout, setActiveLayout] = useState(() => {
    const saved = localStorage.getItem('kl_activeLayout');
    if (saved === 'sequential') return 'hierarchical';
    return saved || 'force';
  });
  const [activeAlgorithm, setActiveAlgorithm] = useState(null);
  const [layoutTrigger, setLayoutTrigger] = useState(0);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeRootNodeId, setActiveRootNodeId] = useState(null);
  const [isNodeSidebarOpen, setIsNodeSidebarOpen] = useState(false);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [selectedNodeNeighbors, setSelectedNodeNeighbors] = useState([]);
  const [selectedNodeEdges, setSelectedNodeEdges] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  const [zoomLevel, setZoomLevel] = useState(1);
  const [dbCounts, setDbCounts] = useState({});
  const [hiddenTypes, setHiddenTypes] = useState(new Set());
  const [highlightedTypes, setHighlightedTypes] = useState(new Set());
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('kl_searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [statusParts, setStatusParts] = useState([]);
  const [dbStatus, setDbStatus] = useState('checking'); // 'online', 'offline', 'checking'

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('http://localhost:8000/health');
        const data = await res.json();
        setDbStatus(data.status === 'online' ? 'online' : 'offline');
      } catch (e) {
        setDbStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

      useEffect(() => {        const fetchCounts = async () => {
          try {
            const response = await fetch('http://localhost:8000/node-counts');
            setDbCounts(await response.json());
          } catch (e) { console.error("Counts fetch error:", e); }
        };
        fetchCounts();
      }, []);
  
      const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState(false);
  const [isHistogramOpen, setIsHistogramOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
          const [isSnapshotsOpen, setIsSnapshotsOpen] = useState(false);
          const [isTrainingOpen, setIsTrainingOpen] = useState(false);
          const [analysisResult, setAnalysisResult] = useState(null);
          const [trainingAI, setTrainingAI] = useState(() => {
            const saved = localStorage.getItem('kl_training_ai');
            return saved ? JSON.parse(saved) : null;
          });
          const [trainingUser, setTrainingUser] = useState(() => {
            const saved = localStorage.getItem('kl_training_user');
            return saved ? JSON.parse(saved) : null;
          });
          const [snapshots, setSnapshots] = useState(() => {

            const saved = localStorage.getItem('kl_snapshots');
            return saved !== null ? JSON.parse(saved) : [];
          });
          
          // Settings mit LocalStorage Initialisierung
          const [enableDonuts, setEnableDonuts] = useState(() => {
            const saved = localStorage.getItem('kl_enableDonuts');
            return saved !== null ? JSON.parse(saved) : true;
          });
          const [edgePathType, setEdgePathType] = useState(() => {
            return localStorage.getItem('kl_edgePathType') || 'simplebezier';
          });
          const [layoutSpacing, setLayoutSpacing] = useState(() => {
            const saved = localStorage.getItem('kl_layoutSpacing');
            return saved !== null ? parseFloat(saved) : 1.0;
          });
          const [maxPathLength, setMaxPathLength] = useState(() => {
            const saved = localStorage.getItem('kl_maxPathLength');
            return saved !== null ? parseInt(saved) : 10;
          });

          const [layoutOptions, setLayoutOptions] = useState(() => {
            const defaults = {
              linkDistance: 250,
              repulsion: -1800,
              linkStrengthBlue: 1.2,
              linkStrengthPink: 0.3,
              gravityX: 0.03,
              gravityY: 0.03,
              friction: 0.5,
              collisionRadius: 90,
              nodeSpacing: 120,
              rankSpacing: 180,
              radius: 500,
              nodeSizeFactor: 0,
              rotation: 0,
              edgeCurvature: 0.5,
              importanceWeight: 2.0,
              rankDir: 'TB',
              ranker: 'network-simplex',
              circularSort: 'standard',
              hiveInnerRadius: 200,
              hiveAxisLength: 800,
              bundlingTension: 0.85,
              groupGap: 0.4,
              elkDirection: 'RIGHT',
              elkNodeSpacing: 80,
              elkLayerSpacing: 120,
              elkPlacementStrategy: 'BRANDES_KOEPF',
              elkCrossingStrategy: 'LAYER_SWEEP',
              elkLayeringStrategy: 'NETWORK_SIMPLEX',
              arcSort: 'type',
              arcDirection: 'both',
              arcImportanceWeight: 2.0,
              arcUseSystemColor: false,
              bioFabricRowSpacing: 40,
              bioFabricColSpacing: 15,
              bioFabricSort: 'importance',
              bioFabricUseSystemColor: false,
              eraSpacing: 600,
              laneSpacing: 300,
              nodeSpacingY: 100,
              phyllotaxisSpacing: 40,
              enableEdgeHighlightOnHover: false
            };
            const saved = localStorage.getItem('kl_layoutOptions');
            if (saved !== null) {
              return { ...defaults, ...JSON.parse(saved) };
            }
            return defaults;
          });

          const [isLayoutSettingsOpen, setIsLayoutSettingsOpen] = useState(false);

          // ACTIVATE LIVE FORCE LAYOUT
          useLiveForceLayout(nodes, edges, setNodes, layoutOptions, activeLayout === 'force', layoutTrigger);

          const [pendingConnection, setPendingConnection] = useState(null);

                        const [isEdgeCreationMode, setIsEdgeCreationMode] = useState(false);
                  
                      const [isEditingNode, setIsEditingNode] = useState(false);
                      const [isEditingEdge, setIsEditingEdge] = useState(false);
                      const [editSnapshot, setEditSnapshot] = useState(null);
                      const [edgeEditSnapshot, setEdgeEditSnapshot] = useState(null);
                    const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const pathEdgesRef = useRef(pathEdges);
  const activeLayoutRef = useRef(activeLayout);
  const layoutOptionsRef = useRef(layoutOptions);
  const activeAlgorithmRef = useRef(activeAlgorithm);
  const activeRootNodeIdRef = useRef(activeRootNodeId);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { edgesRef.current = edges; }, [edges]);
  useEffect(() => { pathEdgesRef.current = pathEdges; }, [pathEdges]);
  useEffect(() => { activeLayoutRef.current = activeLayout; }, [activeLayout]);
  useEffect(() => { layoutOptionsRef.current = layoutOptions; }, [layoutOptions]);
  useEffect(() => { activeAlgorithmRef.current = activeAlgorithm; }, [activeAlgorithm]);
  useEffect(() => { activeRootNodeIdRef.current = activeRootNodeId; }, [activeRootNodeId]);
      
          // Persist Settings to LocalStorage
          useEffect(() => {
            localStorage.setItem('kl_enableDonuts', JSON.stringify(enableDonuts));
            localStorage.setItem('kl_edgePathType', edgePathType);
            localStorage.setItem('kl_layoutSpacing', layoutSpacing.toString());
            localStorage.setItem('kl_maxPathLength', maxPathLength.toString());
            localStorage.setItem('kl_snapshots', JSON.stringify(snapshots));
            localStorage.setItem('kl_activeLayout', activeLayout);
            localStorage.setItem('kl_searchHistory', JSON.stringify(searchHistory));
            localStorage.setItem('kl_snapshots', JSON.stringify(snapshots));
            localStorage.setItem('kl_training_ai', JSON.stringify(trainingAI));
            localStorage.setItem('kl_training_user', JSON.stringify(trainingUser));
            localStorage.setItem('kl_layoutOptions', JSON.stringify(layoutOptions));
          }, [enableDonuts, edgePathType, layoutSpacing, maxPathLength, snapshots, trainingAI, trainingUser, activeLayout, searchHistory, layoutOptions]);


          // Funktion zum manuellen Anpassen der Kamera an neue Knotenpositionen,
          // ignoriert CSS-Animationen für mehr Präzision.
          const fitToNodes = useCallback((nds) => {
            if (nds.length === 0) return;
            
            // In Arc Mode, we need more padding because edges make wide semi-circles
            // which are not part of the nodes' bounding box.
            let padding = 0.2;
            if (activeLayout === 'arc') padding = 0.8;
            if (activeLayout === 'biofabric') padding = 0.5;

            fitView({
              duration: 600,
              padding: padding,
              nodes: nds
            });
          }, [fitView, activeLayout]);

          const runLayout = useCallback(async (type, gravityValue = layoutSpacing, rootNodeId = null) => {
            // SKIP STATIC CALCULATION FOR LIVE FORCE
            if (type === 'force') return [];

            const visibleNodesOnStage = nodesRef.current.filter(n => !hiddenTypes.has(n.data.type));

            const visibleIds = new Set(visibleNodesOnStage.map(n => n.id));
            const visibleEdgesOnStage = edgesRef.current.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));

            console.log(`[LayoutEngine] Calculating "${type}" layout with options:`, layoutOptions, `RootNode: ${rootNodeId}`);
            const result = await calculateLayout(visibleNodesOnStage, visibleEdgesOnStage, type, layoutOptions, rootNodeId, layoutTrigger);
            let layoutedVisible = result.nodes;
            let finalEdges = result.edges;

            // APPLY ROTATION (if any)
            if (layoutOptions.rotation !== 0 && layoutedVisible.length > 0) {
              const center = getLayoutCenter(layoutedVisible);
              const rad = (layoutOptions.rotation * Math.PI) / 180;
              const cos = Math.cos(rad);
              const sin = Math.sin(rad);

              layoutedVisible = layoutedVisible.map(n => {
                const dx = n.position.x - center.x;
                const dy = n.position.y - center.y;
                return {
                  ...n,
                  position: {
                    x: center.x + (dx * cos - dy * sin),
                    y: center.y + (dx * sin + dy * cos)
                  }
                };
              });
            }

            const layoutedMap = new Map(layoutedVisible.map(n => [n.id, n]));

            setNodes(nds => nds.map(n => {
              if (layoutedMap.has(n.id)) {
                const ln = layoutedMap.get(n.id);
                return { ...n, position: ln.position, type: ln.type, data: ln.data };
              }
              return n;
            }));

            // We update edges if they were modified (like in narrative)
            if (finalEdges !== visibleEdgesOnStage) {
              const edgeMap = new Map(finalEdges.map(e => [e.id, e]));
              setEdges(eds => eds.map(e => {
                if (edgeMap.has(e.id)) {
                  const fe = edgeMap.get(e.id);
                  return { 
                    ...e, 
                    type: fe.type, 
                    sourceHandle: fe.sourceHandle, 
                    targetHandle: fe.targetHandle,
                    data: { ...e.data, ...fe.data }
                  };
                }
                return e;
              }));
            }

            return layoutedVisible;
          }, [setNodes, hiddenTypes, layoutOptions]);

          // Real-time Visual Tweaks (Rotation & Node Size)
          useEffect(() => {
            const prevRotation = prevLayoutOptionsRef.current.rotation || 0;
            const prevSize = prevLayoutOptionsRef.current.nodeSizeFactor || 0;

            if (prevRotation !== layoutOptions.rotation) {
              const currentNodes = nodesRef.current;
              if (currentNodes.length > 0) {
                const center = getLayoutCenter(currentNodes);
                const diffDeg = layoutOptions.rotation - prevRotation;
                const rad = (diffDeg * Math.PI) / 180;
                const cos = Math.cos(rad);
                const sin = Math.sin(rad);

                setNodes(nds => nds.map(n => {
                  const dx = n.position.x - center.x;
                  const dy = n.position.y - center.y;
                  return {
                    ...n,
                    position: {
                      x: center.x + (dx * cos - dy * sin),
                      y: center.y + (dx * sin + dy * cos)
                    }
                  };
                }));
              }
            }

            if (prevSize !== layoutOptions.nodeSizeFactor) {
               setNodes(nds => nds.map(n => ({
                 ...n,
                 data: { ...n.data, sizeFactor: layoutOptions.nodeSizeFactor }
               })));
            }

            prevLayoutOptionsRef.current = { ...layoutOptions };
          }, [layoutOptions.rotation, layoutOptions.nodeSizeFactor, layoutOptions.ranker, layoutOptions.rankDir, setNodes]);
            // Real-time Edge Curvature & Path Type Updates
            useEffect(() => {
            const updateEdges = (eds) => eds.map(edge => ({
              ...edge,
              type: edge.data?.type === 'PATH' ? 'pathEdge' : edgePathType,
              data: { ...edge.data, curvature: layoutOptions.edgeCurvature }
            }));

            setEdges(updateEdges);
            setPathEdges(updateEdges);
            }, [edgePathType, layoutOptions.edgeCurvature, setEdges, setPathEdges]);

            const onLayoutClick = useCallback((type) => {

    setActiveLayout(type);
    setLayoutTrigger(prev => prev + 1);
  }, []);

  // Handle structural layout changes (button click or option change)
  useEffect(() => {
    if (activeLayout === 'force') return;

    const performLayout = async () => {
      console.log("Triggering structural layout recalculation:", activeLayout);
      // Only use a root if a node is explicitly set as root by the user (Shift+Click)
      const rootId = activeRootNodeId || null;
      const layoutedVisible = await runLayout(activeLayout, layoutSpacing, rootId);

      if (layoutedVisible && layoutedVisible.length > 0) {
        setTimeout(() => {
          fitToNodes(layoutedVisible);
        }, 300);
      }
    };

    performLayout();
  }, [activeLayout, layoutTrigger, runLayout, fitToNodes, layoutOptions, activeRootNodeId]);
  const prevLayoutSpacingRef = useRef(layoutSpacing);
  const prevLayoutOptionsRef = useRef(layoutOptions);

  // Handle graph scaling when gravity changes (Universal Linear Scaling)
  useEffect(() => {
    if (prevLayoutSpacingRef.current !== layoutSpacing) {
      if (activeLayout === 'force') {
        // Live Force simulation handles this via its own internal hook
        prevLayoutSpacingRef.current = layoutSpacing;
        return;
      }
      
      const scaleFactor = layoutSpacing / prevLayoutSpacingRef.current;
      const currentNodes = nodesRef.current;
      
      if (currentNodes.length > 0) {
        const center = getLayoutCenter(currentNodes);
        
        setNodes(nds => nds.map(node => ({
          ...node,
          position: {
            x: center.x + (node.position.x - center.x) * scaleFactor,
            y: center.y + (node.position.y - center.y) * scaleFactor
          }
        })));
      }
      prevLayoutSpacingRef.current = layoutSpacing;
    }
  }, [layoutSpacing, activeLayout, setNodes]);

          // --- PATH FINDING LOGIC ---
          const updatePaths = useCallback(async (currentNodes) => {
            const nodeIds = currentNodes
              .map(n => n.id)
              .filter(id => !id.startsWith('new-'));

            if (nodeIds.length < 2) {
              setPathEdges([]);
              return;
            }

            try {
              const response = await fetch('http://localhost:8000/find-paths', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  node_ids: nodeIds,
                  max_length: maxPathLength
                })
              });
              
              if (!response.ok) return;

              const discoveredPaths = await response.json();
              
              const newPathEdges = discoveredPaths.map((p, idx) => {
                const isDirect = p.length === 1;
                const intermediateCount = p.length - 1;
                const relType = p.rel_type || (p.edges?.[0]?.type) || 'RELATES_TO';
                
                // Extrahiere Properties (z.B. weight) für direkte Relationen
                const properties = p.edges?.[0]?.properties || {};
                const weight = parseFloat(properties.weight) || 1;
                
                return {
                  id: isDirect ? `path-${p.source}-${relType}-${p.target}` : `path-v-${p.source}-${p.target}-${idx}`,
                  source: p.source,
                  target: p.target,
                  type: isDirect ? 'default' : 'pathEdge', 
                  data: { 
                    type: isDirect ? 'DIRECT_RELATION' : 'PATH',
                    dbType: relType,
                    length: p.length,
                    fullPathNodes: p.nodes || [], 
                    fullPathEdges: p.edges || [],
                    intermediateCount: intermediateCount,
                    pathType: edgePathType,
                    weight: weight
                  },
                  label: isDirect ? relType.replace(/_/g, " ").toLowerCase() : "",
                  style: {
                    ...(getEdgeStyle(isDirect ? 'default' : 'PATH')),
                    strokeWidth: isDirect ? 1 : 3
                  },
                  labelStyle: { fill: COLORS.nodeLabel, fontWeight: 600, fontSize: '10px', fontFamily: '"Open Sans", sans-serif', fontStyle: 'italic' },
                  labelBgStyle: { fill: COLORS.background, fillOpacity: 1 }, 
                  labelBgPadding: [4, 2], 
                  labelBgBorderRadius: 4,
                  animated: false,
                  selectable: true,
                  focusable: true,
                  zIndex: isDirect ? -2 : -1
                };
              });

              setPathEdges(newPathEdges);
            } catch (e) {
              console.error("Pathfinder connection error:", e);
            }
          }, [edgePathType, maxPathLength]);

          // Trigger path finding only when the set of Node IDs or maxPathLength changes
          useEffect(() => {
            updatePaths(nodes);
          }, [nodes.map(n => n.id).join(','), maxPathLength, updatePaths]);
      
                          useEffect(() => {
                            setNodes(nds => nds.map(node => ({
                              ...node,
                              className: isEdgeCreationMode ? 'edge-mode-node' : '',
                              data: { ...node.data, showDonuts: enableDonuts, isEdgeCreationMode: isEdgeCreationMode }
                            })));
                          }, [enableDonuts, isEdgeCreationMode, setNodes]);
                      
                          useEffect(() => {
                            setPathEdges(eds => eds.map(edge => ({
                              ...edge,
                              type: edge.data?.type === 'PATH' ? 'pathEdge' : edgePathType
                            })));
                          }, [edgePathType]);
                      

  const updateNodeData = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          const updatedData = { ...node.data, ...newData };
          // Wenn importance geändert wird und kein Algorithmus aktiv ist, score mitziehen
          if (activeAlgorithm === null && newData.hasOwnProperty('importance')) {
            updatedData.score = parseFloat(newData.importance) || 0;
          }
          return { ...node, data: updatedData };
        }
        return node;
      })
    );
    // Auch den lokalen State des selektierten Knotens aktualisieren
    setSelectedNode(prev => {
      if (prev && prev.id === nodeId) {
        const updatedData = { ...prev.data, ...newData };
        if (activeAlgorithm === null && newData.hasOwnProperty('importance')) {
          updatedData.score = parseFloat(newData.importance) || 0;
        }
        return { ...prev, data: updatedData };
      }
      return prev;
    });
  }, [setNodes, activeAlgorithm]);

      const persistNode = useCallback(async (node) => {
        if (!node) return;
        console.log("PERSISTING NODE:", node.id, node.data.label);
        
        // Draft-Flag entfernen, da wir jetzt speichern
        const nodeToPersist = {
          ...node,
          data: { ...node.data, isDraft: false }
        };
  
        try {
          await fetch('http://localhost:8000/upsert-node', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: nodeToPersist.id, data: nodeToPersist.data })
          });
          
          // Lokal das Flag ebenfalls löschen
          setNodes(nds => nds.map(n => n.id === node.id ? nodeToPersist : n));
        } catch (e) {
          console.error("Persist error:", e);
        }
      }, [setNodes]);
  
      const updateEdgeData = useCallback((edgeId, newData) => {
        setEdges((eds) =>
          eds.map((edge) => {
            if (edge.id === edgeId) {
              // Falls der Typ geändert wird, auch das Label anpassen
              const label = newData.type ? newData.type.replace("_", " ").toLowerCase() : edge.label;
              return { ...edge, label, data: { ...edge.data, ...newData } };
            }
            return edge;
          })
        );
        // Auch den lokalen State der selektierten Kante aktualisieren
        setSelectedEdge(prev => prev && prev.id === edgeId ? { 
          ...prev, 
          label: newData.type ? newData.type.replace("_", " ").toLowerCase() : prev.label,
          data: { ...prev.data, ...newData } 
        } : prev);
      }, [setEdges]);
  
      const persistEdge = useCallback(async (edge) => {
        if (!edge || !edgeEditSnapshot) return;
        console.log("PERSISTING EDGE:", edge.id);
  
        try {
          const { type, isNew, ...properties } = edge.data;
          await fetch('http://localhost:8000/update-edge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              source: edge.source, 
              target: edge.target, 
              old_type: edgeEditSnapshot.type,
              new_type: type,
              properties
            })
          });
          
      // Lokal die Kante aktualisieren (Stil neu berechnen falls Typ geändert)
      setEdges(eds => eds.map(e => e.id === edge.id ? {
        ...e,
        style: getEdgeStyle(type)
      } : e));
    } catch (e) {
      console.error("Persist edge error:", e);
    }
  }, [edgeEditSnapshot, setEdges]);
            const closeSidebar = useCallback((skipPersist = false) => { 
              // Wenn wir im Edit-Modus waren, speichern wir die Änderungen (außer beim Löschen oder Abbrechen)
              if (selectedNode && isEditingNode && !skipPersist) {
                persistNode(selectedNode);
              }
              if (selectedEdge && isEditingEdge && !skipPersist) {
                persistEdge(selectedEdge);
              }
              
              setSelectedNode(null); 
              setIsNodeSidebarOpen(false);
              setSelectedEdge(null);
              setPendingConnection(null);
              setPreviewData(null); 
              setSelectedNodeNeighbors([]); 
              setSelectedNodeEdges([]);
              setIsEditingNode(false);
              setIsEditingEdge(false);
              setEditSnapshot(null);
              setEdgeEditSnapshot(null);
            }, [selectedNode, isEditingNode, persistNode, selectedEdge, isEditingEdge, persistEdge]);
        
        const cancelEditing = useCallback(() => {
          // Fall 1: Knoten-Edit abbrechen
          if (selectedNode) {
            if (selectedNode.data.isDraft) {
              setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
            } else if (editSnapshot) {
              setNodes(nds => nds.map(node => 
                node.id === selectedNode.id ? { ...node, data: { ...node.data, ...editSnapshot } } : node
              ));
            }
          }
          
          // Fall 2: Kanten-Edit abbrechen
          if (selectedEdge && edgeEditSnapshot) {
            setEdges(eds => eds.map(edge => 
              edge.id === selectedEdge.id ? { 
                ...edge, 
                label: edgeEditSnapshot.type.replace("_", " ").toLowerCase(),
                data: { ...edge.data, ...edgeEditSnapshot } 
              } : edge
            ));
          }
          
          closeSidebar(true);
        }, [selectedNode, editSnapshot, selectedEdge, edgeEditSnapshot, setNodes, setEdges, closeSidebar]);
      const deleteNodePermanently = useCallback(async (nodeId) => {
    if (!window.confirm("Do you really want to delete this entity permanently from the database?")) return;
    
    try {
      await fetch(`http://localhost:8000/delete-node/${nodeId}`, { method: 'DELETE' });
      setNodes(nds => nds.filter(n => n.id !== nodeId));
      setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
      closeSidebar(true); // Persistierung explizit überspringen
    } catch (e) {
      console.error("Delete error:", e);
    }
      }, [setNodes, setEdges, closeSidebar]);
  
                  const deleteEdgePermanently = useCallback(async (edge) => {
                    if (!window.confirm("Do you really want to delete this relationship permanently from the database?")) return;
                    
                    // Vorab den Partner und seine Kategorie bestimmen
                    const currentContextId = selectedNode?.id || previewData?.sourceId;
                    const neighborId = edge.source === currentContextId ? edge.target : edge.source;
                    const neighborNode = nodesRef.current.find(n => n.id === neighborId) || 
                                         (previewData?.nodes || selectedNodeNeighbors).find(n => n.id === neighborId);
                    const neighborCat = categoryMap[neighborNode?.data?.type?.toLowerCase()] || 'other';
                    
                    console.log(`Deleting relationship. Neighbor: ${neighborId}, Category: ${neighborCat}`);
              
                    try {
                      await fetch('http://localhost:8000/delete-edge', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                          source: edge.source, 
                          target: edge.target, 
                          type: edge.data?.type || 'RELATES_TO' 
                        })
                      });
                      
                      // 1. Von der Stage entfernen
                      setEdges(eds => eds.filter(e => e.id !== edge.id));
                      
                      // 2. Donuts global aktualisieren (total_count dekrementieren)
                      // Wir nutzen hier neighborCat, den wir oben sicher bestimmt haben
                      setNodes(nds => nds.map(node => {
                        if (node.id === edge.source || node.id === edge.target) {
                          // Bestimme, welcher Typ für DIESEN Knoten abgezogen werden muss
                          const otherId = node.id === edge.source ? edge.target : edge.source;
                          const otherNode = nds.find(n => n.id === otherId) || 
                                            (previewData?.nodes || selectedNodeNeighbors).find(n => n.id === otherId);
                          const decrCat = categoryMap[otherNode?.data?.type?.toLowerCase()] || 'other';
              
                          const updatedDonut = (node.data.donut || []).map(seg => {
                            if (seg.category === decrCat) {
                              return { ...seg, total_count: Math.max(0, (seg.total_count || 0) - 1) };
                            }
                            return seg;
                          }).filter(seg => seg.total_count > 0);
                          return { ...node, data: { ...node.data, donut: updatedDonut } };
                        }
                        return node;
                      }));
              
                      // 3. Drawer-Listen bereinigen
                      if (selectedEdge?.id === edge.id) setSelectedEdge(null);
                      setSelectedNodeEdges(prev => prev.filter(e => e.id !== edge.id));
                      setSelectedNodeNeighbors(prev => prev.filter(n => n.id !== neighborId));
                      
                      setPreviewData(prev => prev ? { 
                        ...prev, 
                        nodes: prev.nodes.filter(n => n.id !== neighborId),
                        edges: prev.edges.filter(e => e.id !== edge.id) 
                      } : null);

                      // Pfade sofort aktualisieren, damit die gelöschte Verbindung verschwindet
                      updatePaths(nodesRef.current);
                      
                    } catch (e) {
                      console.error("Edge delete error:", e);
                    }
                  }, [setEdges, setNodes, selectedEdge, selectedNode, previewData, selectedNodeNeighbors]);
              
              const openDetails = useCallback(async (node, forceEdit = false) => {
                // Wenn wir gerade einen anderen Knoten editiert haben, speichern wir diesen erst
                if (selectedNode && isEditingNode && selectedNode.id !== node.id) {
                  persistNode(selectedNode);
                }

                      setSelectedNode(node);
                      setIsNodeSidebarOpen(true);
                      setSelectedEdge(null);

          setPreviewData(null);
          setIsEditingNode(forceEdit);
              // Snapshot für mögliches Revert (Escape) erstellen
              if (forceEdit) {
                setEditSnapshot({ ...node.data });
              } else {
                setEditSnapshot(null);
              }
                  // Keine Nachbarn laden, wenn es ein brandneuer Knoten ist
          if (node.data?.isDraft) {
            setSelectedNodeNeighbors([]);
            setSelectedNodeEdges([]);
            return;
          }
    
          try {
            const response = await fetch(`http://localhost:8000/expand/${node.id}`);
            const data = await response.json();
            setSelectedNodeNeighbors(data.nodes.filter(n => n.id !== node.id));
            setSelectedNodeEdges(data.edges || []);
          } catch (e) { console.error(e); }
    
        }, [selectedNode, isEditingNode, persistNode]);
    
    const openEdgeDetails = useCallback((edge) => {
      // Wenn wir gerade einen Knoten editiert haben, speichern wir diesen erst
      if (selectedNode && isEditingNode) {
        persistNode(selectedNode);
      }
      setSelectedEdge(edge);
      setSelectedNode(null);
      setPendingConnection(null);
      setPreviewData(null);
      setIsEditingNode(false);
      setIsEditingEdge(false);
      setEdgeEditSnapshot(null);
    }, [selectedNode, isEditingNode, persistNode]);
        
                const onConnect = useCallback((params) => {
                  console.log("Connection initiated:", params);
                  setPendingConnection(params);
                  setSelectedNode(null);
                  setIsNodeSidebarOpen(false);
                  setSelectedEdge(null);
                  setPreviewData(null);

                  setIsEditingNode(false);
                }, []);
                            const confirmConnection = useCallback(async (type) => {
                              if (!pendingConnection) return;
                              const { source, target } = pendingConnection;
                              const newEdge = {
                                ...pendingConnection,
                                id: `e-${source}-${type}-${target}`,
                                label: type.replace("_", " ").toLowerCase(),
                                data: { type },
                                style: getEdgeStyle(type),
                                labelStyle: { fill: COLORS.nodeLabel, fontWeight: 600, fontSize: '10px', fontFamily: '"Open Sans", sans-serif', fontStyle: 'italic' },
                                labelBgStyle: { fill: COLORS.background, fillOpacity: 1 }, 
                                labelBgPadding: [4, 2], 
                                labelBgBorderRadius: 4,
                                animated: ["TRAVELS_WITH", "CONNECTS", "FOLLOWS"].includes(type)
                              };
                              try {
                                await fetch('http://localhost:8000/create-edge', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ source, target, type })
                                });
                        
                                // 1. Kante zur Stage hinzufügen
                                setEdges((eds) => addEdge(newEdge, eds));
                        
                                // 2. Kategorien für Donut-Update bestimmen
                                const sourceNode = nodesRef.current.find(n => n.id === source);
                                const targetNode = nodesRef.current.find(n => n.id === target);
                                const sourceCat = categoryMap[sourceNode?.data.type?.toLowerCase()] || 'other';
                                const targetCat = categoryMap[targetNode?.data.type?.toLowerCase()] || 'other';
                        
                                // 3. Donuts global aktualisieren (total_count INKREMENTIEREN für neue DB-Relation)
                                setNodes(nds => nds.map(node => {
                                  if (node.id === source || node.id === target) {
                                    const incrCat = node.id === source ? targetCat : sourceCat;
                                    const existingDonut = node.data.donut || [];
                                    let updatedDonut;
                                    
                                    if (existingDonut.some(s => s.category === incrCat)) {
                                      updatedDonut = existingDonut.map(seg => 
                                        seg.category === incrCat ? { ...seg, total_count: (seg.total_count || 0) + 1 } : seg
                                      );
                                    } else {
                                      updatedDonut = [...existingDonut, {
                                        category: incrCat,
                                        total_count: 1,
                                        value: 0, // Wird von visibleNodes berechnet
                                        color: typeColors[incrCat] || typeColors.other,
                                        type_labels: [`${type} (1)`]
                                      }];
                                    }
                                    return { ...node, data: { ...node.data, donut: updatedDonut } };
                                  }
                                  return node;
                                }));
                        
                                setPendingConnection(null);
                                setIsEdgeCreationMode(false);
                                
                                // Pfade sofort aktualisieren, damit die neue Verbindung erscheint
                                updatePaths(nodesRef.current);
                              } catch (e) { console.error("Edge creation failed:", e); }
                            }, [pendingConnection, setEdges, setNodes]);
                        
        
          const handleDrawerClose = useCallback((event, reason) => {
            if (reason === 'escapeKeyDown' && (isEditingNode || isEditingEdge)) {
              cancelEditing();
            } else {
              closeSidebar();
            }
          }, [isEditingNode, isEditingEdge, cancelEditing, closeSidebar]);

  const getSmartPosition = useCallback((sourceNode = null, targetNodeId = null) => {
    const currentNodes = nodesRef.current;
    const currentEdges = edgesRef.current;
    const currentPathEdges = pathEdgesRef.current;
    const visibleNodesOnStage = currentNodes.filter(n => !hiddenTypes.has(n.data.type));

    // 1. Check for RELATIONS to nodes already on stage (Direct or Path)
    if (targetNodeId) {
      const allRelevantEdges = [...currentEdges, ...currentPathEdges];
      const stageNeighbors = allRelevantEdges
        .filter(e => e.source === targetNodeId || e.target === targetNodeId)
        .map(e => e.source === targetNodeId ? e.target : e.source)
        .map(id => currentNodes.find(n => n.id === id))
        .filter(Boolean);

      if (stageNeighbors.length > 0) {
        const avgX = stageNeighbors.reduce((acc, n) => acc + n.position.x, 0) / stageNeighbors.length;
        const avgY = stageNeighbors.reduce((acc, n) => acc + n.position.y, 0) / stageNeighbors.length;

        const angle = Math.random() * Math.PI * 2;
        const radius = 150; 
        return {
          x: avgX + Math.cos(angle) * radius,
          y: avgY + Math.sin(angle) * radius
        };
      }
    }
    // 2. Place near source if provided (fallback for expansion)
    if (sourceNode) {
      return {
        x: sourceNode.position.x + (Math.random() - 0.5) * 200,
        y: sourceNode.position.y + (Math.random() - 0.5) * 200,
      };
    }

    // 3. Find center of gravity of visible graph (fallback for new entities)
    if (visibleNodesOnStage.length > 0) {
      const center = getLayoutCenter(visibleNodesOnStage);
      return {
        x: center.x + (Math.random() - 0.5) * 400,
        y: center.y + (Math.random() - 0.5) * 400,
      };
    }

    // 4. Fallback: Place in current viewport center
    const { x, y, zoom } = getViewport();
    return {
      x: -x / zoom + (window.innerWidth / 2) / zoom,
      y: -y / zoom + (window.innerHeight / 2) / zoom
    };
  }, [hiddenTypes, getViewport]);

  const onAnalyze = useCallback(async (algorithm) => {

    if (algorithm === activeAlgorithm) {
      setActiveAlgorithm(null);
      // Revert to importance
      setNodes(nds => nds.map(node => ({
        ...node,
        data: { ...node.data, score: node.data.importance ?? 0.5 }
      })));
      return;
    }

    setActiveAlgorithm(algorithm);
    try {
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodes: nodesRef.current.map(n => ({ id: n.id, data: n.data })),
          edges: pathEdgesRef.current.map(e => ({ source: e.source, target: e.target })),
          algorithm
        })
      });
      const data = await response.json();
      setNodes(nds => nds.map(node => {
        const analyzed = data.nodes.find(an => an.id === node.id);
        if (analyzed) return { ...node, data: { ...node.data, score: analyzed.data.score } };
        return node;
      }));
    } catch (e) { console.error('Analyze error:', e); }
  }, [activeAlgorithm, setNodes]);

  const onExport = useCallback(() => {
    const reactFlowElement = document.querySelector('.react-flow');
    if (!reactFlowElement) return;
    const controls = document.querySelector('.react-flow__controls');
    if (controls) controls.style.display = 'none';
    toPng(reactFlowElement, { backgroundColor: COLORS.background, filter: (node) => !(node?.classList?.contains('react-flow__panel')), cacheBust: true })
    .then((dataUrl) => download(dataUrl, `keylines-export-${new Date().toISOString().slice(0,10)}.png`))
    .finally(() => { if (controls) controls.style.display = 'flex'; });
  }, []);

  const onSaveSnapshot = useCallback(() => {
    const reactFlowElement = document.querySelector('.react-flow');
    if (!reactFlowElement) return;

    // Temporarily hide UI elements for clean thumbnail
    const controls = document.querySelector('.react-flow__controls');
    const attribution = document.querySelector('.react-flow__attribution');
    if (controls) controls.style.display = 'none';
    if (attribution) attribution.style.display = 'none';

    // Capture the full viewport first
    toPng(reactFlowElement, { 
      backgroundColor: COLORS.background, 
      filter: (node) => !(node?.classList?.contains('react-flow__panel')), 
      cacheBust: true,
    })
    .then((dataUrl) => {
      // Resize the captured image to a small thumbnail using a canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 320;
        const height = (img.height / img.width) * width;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        const thumbnail = canvas.toDataURL('image/jpeg', 0.7); // Smaller JPEG for localStorage
        
        const newSnapshot = {
          id: `snap-${Date.now()}`,
          timestamp: new Date().toISOString(),
          rawTimestamp: Date.now(),
          nodes: JSON.parse(JSON.stringify(nodesRef.current)),
          edges: JSON.parse(JSON.stringify(edgesRef.current)),
          thumbnail: thumbnail
        };
        
        setSnapshots(prev => {
          const next = [newSnapshot, ...prev];
          // Simple limit to prevent localStorage overflow
          if (next.length > 20) return next.slice(0, 20);
          return next;
        });
      };
      img.src = dataUrl;
    })
    .catch((err) => {
      console.error('Snapshot failed:', err);
    })
    .finally(() => { 
      if (controls) controls.style.display = 'flex'; 
      if (attribution) attribution.style.display = 'flex';
    });
  }, []);

  const expandNode = useCallback(async (nodeId, filterCategory = null, event = null) => {
    const currentNodes = nodesRef.current;
    const currentEdges = pathEdgesRef.current;

    // Wenn keine Kategorie übergeben wurde (direkter Klick auf Knoten), 
    // machen wir nichts mehr, da onNodeClick das jetzt handhabt.
    if (!filterCategory) return;

    // 1. Shift+Klick auf Segment: Aufräumen / Einklappen
    if (event?.shiftKey) {
      const directChildren = currentEdges
        .filter(e => e.source === nodeId || e.target === nodeId)
        .map(e => {
          const neighborId = e.source === nodeId ? e.target : e.source;
          return currentNodes.find(n => n.id === neighborId);
        })
        .filter(n => n && categoryMap[n.data.type?.toLowerCase()] === filterCategory);

      if (directChildren.length > 0) {
        const childIds = directChildren.map(n => n.id);
        const allToCollapse = new Set(childIds);
        // Auch deren Nachfahren einsammeln, falls gewünscht (rekursiv)
        childIds.forEach(id => getDescendants(id, currentEdges).forEach(d => allToCollapse.add(d)));
        
        setNodes(nds => nds.filter(n => !allToCollapse.has(n.id)));
        setEdges(eds => eds.filter(e => !allToCollapse.has(e.source) && !allToCollapse.has(e.target)));
        return;
      }
      return;
    }

    // 2. Einfacher Klick auf Segment: Gruppen Drawer öffnen
    try {
      const response = await fetch(`http://localhost:8000/expand/${nodeId}?filter_category=${filterCategory}`);
      const data = await response.json();
      setPreviewData({ 
        category: filterCategory, 
        sourceId: nodeId, 
        nodes: data.nodes.filter(n => n.id !== nodeId),
        edges: data.edges || []
      });
      setSelectedNode(null);
    } catch (e) { 
      console.error("Failed to load group data:", e); 
    }
  }, [setNodes, setEdges]);
              
                const addSingleNode = useCallback((sourceId, targetNode, edgeData = null) => {
                  const currentNodes = nodesRef.current;
                  if (currentNodes.find(n => n.id === targetNode.id)) return;
                  const sourceNode = currentNodes.find(n => n.id === sourceId);
                  const importance = targetNode.data.importance ?? 0.5;
                  const initialScore = activeAlgorithm === null ? importance : (targetNode.data.score ?? importance);

                  // Pass targetNode.id to getSmartPosition to check for OTHER existing connections on stage
                  const smartPos = getSmartPosition(sourceNode, targetNode.id);

                  const newNode = { 
                    ...targetNode, 
                    type: 'keylines', 
                    position: smartPos, 
                    data: { 
                      ...targetNode.data, 
                      importance,
                      score: initialScore,
                      showDonuts: enableDonuts,
                      onSegmentClick: (cat, e) => expandNode(targetNode.id, cat, e) 
                    } 
                  };
            
                  const relType = edgeData?.data?.type || 'RELATES_TO';
                  const newEdge = { 
                    id: edgeData?.id || `e-${sourceId}-${relType}-${targetNode.id}`, 
                    source: sourceId, 
                    target: targetNode.id, 
                    label: edgeData?.label || relType.replace("_", " ").toLowerCase(),
                    animated: edgeData?.animated || ["TRAVELS_WITH", "CONNECTS", "FOLLOWS"].includes(relType), 
                    data: edgeData?.data || { type: relType }, 
                    style: getEdgeStyle(relType) 
                  };
                  
                  const nextNodes = deduplicate([...currentNodes, newNode]);
                  const nextEdges = deduplicate([...edgesRef.current, newEdge]);

                  setNodes(nextNodes);
                  setEdges(nextEdges);
                  
                  // Trigger layout only for visible nodes
                  setTimeout(async () => {
                    const visibleOnStage = nextNodes.filter(n => !hiddenTypes.has(n.data.type));
                    const visibleIds = new Set(visibleOnStage.map(n => n.id));
                    
                    // STRUCTURAL ONLY: Exclude pathEdges!
                    const visibleEdges = nextEdges.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
                    
                    const result = await calculateLayout(visibleOnStage, visibleEdges, activeLayout, layoutOptions, activeRootNodeId, layoutTrigger);
                    let layoutedVisible = result.nodes;
                    let finalEdges = result.edges;
                    
                    // APPLY ROTATION (Must match runLayout)
                    let rotatedVisible = layoutedVisible;
                    if (layoutOptions.rotation !== 0 && layoutedVisible.length > 0) {
                      const center = getLayoutCenter(layoutedVisible);
                      const rad = (layoutOptions.rotation * Math.PI) / 180;
                      const cos = Math.cos(rad);
                      const sin = Math.sin(rad);

                      rotatedVisible = layoutedVisible.map(n => {
                        const dx = n.position.x - center.x;
                        const dy = n.position.y - center.y;
                        return {
                          ...n,
                          position: {
                            x: center.x + (dx * cos - dy * sin),
                            y: center.y + (dx * sin + dy * cos)
                          }
                        };
                      });
                    }

                    const layoutedMap = new Map(rotatedVisible.map(n => [n.id, n]));

                    setNodes(nds => nds.map(n => {
                      if (layoutedMap.has(n.id)) {
                        const ln = layoutedMap.get(n.id);
                        return { ...n, position: ln.position, type: ln.type, data: ln.data };
                      }
                      return n;
                    }));

                    if (finalEdges !== visibleEdges) {
                      const edgeMap = new Map(finalEdges.map(e => [e.id, e]));
                      setEdges(eds => eds.map(e => {
                        if (edgeMap.has(e.id)) {
                          const fe = edgeMap.get(e.id);
                          return { 
                            ...e, 
                            type: fe.type, 
                            sourceHandle: fe.sourceHandle, 
                            targetHandle: fe.targetHandle,
                            data: { ...e.data, ...fe.data }
                          };
                        }
                        return e;
                      }));
                    }
                    
                    setTimeout(() => fitToNodes(rotatedVisible), 300);
                  }, 50);
                }, [expandNode, fitToNodes, setNodes, setEdges, enableDonuts, getSmartPosition, hiddenTypes, activeLayout, layoutOptions, activeRootNodeId, activeAlgorithm]);

                  const addAllNodesOfType = useCallback(async (category) => {
      console.log(`FETCHING ALL ${category.toUpperCase()} NODES...`);
      try {
        const response = await fetch(`http://localhost:8000/nodes-by-type/${category}`);
        const newNodesFromDB = await response.json();
        
        if (!Array.isArray(newNodesFromDB)) {
          console.error("Expected array from backend, got:", newNodesFromDB);
          return;
        }

        if (newNodesFromDB.length === 0) {
          console.log(`No nodes found for category: ${category}`);
          return;
        }

        const currentNodes = nodesRef.current;
        const nodesToAdd = newNodesFromDB.filter(n => !currentNodes.find(existing => existing.id === n.id));
        
        if (nodesToAdd.length === 0) return;

        // Position new nodes relative to the center of the existing graph
        const basePos = getSmartPosition();
        const preparedNodes = nodesToAdd.map((n, i) => {
          const importance = n.data.importance ?? 0.5;
          const initialScore = activeAlgorithm === null ? importance : (n.data.score ?? importance);
          return {
            ...n,
            position: { x: basePos.x + (i % 5) * 60, y: basePos.y + Math.floor(i / 5) * 60 },
            data: { 
              ...n.data, 
              importance,
              score: initialScore,
              showDonuts: enableDonuts,
              onSegmentClick: (cat, e) => expandNode(n.id, cat, e) 
            }
          };
        });

        const nextNodes = deduplicate([...currentNodes, ...preparedNodes]);
        setNodes(nextNodes);
        
        // Trigger layout
        setTimeout(async () => {
          const visibleOnStage = nextNodes.filter(n => !hiddenTypes.has(n.data.type));
          const visibleIds = new Set(visibleOnStage.map(n => n.id));
          
          // STRUCTURAL ONLY: Exclude pathEdges!
          const visibleEdges = edgesRef.current.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
          
          const result = await calculateLayout(visibleOnStage, visibleEdges, activeLayout, layoutOptions, activeRootNodeId, layoutTrigger);
          let layoutedVisible = result.nodes;
          let finalEdges = result.edges;
          
          // APPLY ROTATION (Must match runLayout)
          let rotatedVisible = layoutedVisible;
          if (layoutOptions.rotation !== 0 && layoutedVisible.length > 0) {
            const center = getLayoutCenter(layoutedVisible);
            const rad = (layoutOptions.rotation * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            rotatedVisible = layoutedVisible.map(n => {
              const dx = n.position.x - center.x;
              const dy = n.position.y - center.y;
              return {
                ...n,
                position: {
                  x: center.x + (dx * cos - dy * sin),
                  y: center.y + (dx * sin + dy * cos)
                }
              };
            });
          }

          const layoutedMap = new Map(rotatedVisible.map(n => [n.id, n]));

          setNodes(nds => nds.map(n => {
            if (layoutedMap.has(n.id)) {
              const ln = layoutedMap.get(n.id);
              return { ...n, position: ln.position, type: ln.type, data: ln.data };
            }
            return n;
          }));

          if (finalEdges !== visibleEdges) {
            const edgeMap = new Map(finalEdges.map(e => [e.id, e]));
            setEdges(eds => eds.map(e => {
              if (edgeMap.has(e.id)) {
                const fe = edgeMap.get(e.id);
                return { 
                  ...e, 
                  type: fe.type, 
                  sourceHandle: fe.sourceHandle, 
                  targetHandle: fe.targetHandle,
                  data: { ...e.data, ...fe.data }
                };
              }
              return e;
            }));
          }
          
          setTimeout(() => fitToNodes(rotatedVisible), 300);
        }, 50);
      } catch (e) {
        console.error("Batch load error:", e);
      }
    }, [enableDonuts, expandNode, fitToNodes, setNodes, getSmartPosition, hiddenTypes, activeLayout, layoutOptions, activeRootNodeId, activeAlgorithm]);

    const onDrillDown = useCallback(() => {
    if (highlightedTypes.size === 0) return;
    setNodes((nds) => {
      const remainingNodes = nds.filter(n => highlightedTypes.has(n.data.type));
      const remainingIds = new Set(remainingNodes.map(n => n.id));
      setEdges((eds) => eds.filter(e => remainingIds.has(e.source) && remainingIds.has(e.target)));
      setHighlightedTypes(new Set()); 
      setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
      return remainingNodes;
    });
  }, [highlightedTypes, setNodes, setEdges, fitView]);

  const toggleHighlight = useCallback((type, isShift) => {
    setHighlightedTypes(prev => {
      const next = new Set(isShift ? prev : []);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  }, []);

  const handleSearch = async (val) => {
    if (val.length < 2) { setSearchResults([]); return; }
    try {
      const response = await fetch(`http://localhost:8000/search?q=${val}`);
      setSearchResults(await response.json());
    } catch (e) { console.error(e); }
  };

  const onSelectSearchResult = async (nodeInfo) => {
    if (!nodeInfo) return;

    // Add to history (max 7, unique)
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item.id !== nodeInfo.id);
      return [nodeInfo, ...filtered].slice(0, 7);
    });

    let existing = nodesRef.current.find(n => n.id === nodeInfo.id);
    if (!existing) {
      const response = await fetch(`http://localhost:8000/expand/${nodeInfo.id}`);
      const data = await response.json();
      const fullNode = data.nodes.find(n => n.id === nodeInfo.id);
      if (fullNode) {
                  const importance = fullNode.data.importance ?? 0.5;
                  const initialScore = activeAlgorithm === null ? importance : (fullNode.data.score ?? importance);

                  // Calculate optimal position based on potential neighbors on stage
                  const smartPos = getSmartPosition(null, fullNode.id);

                  const newNode = { 
                    ...fullNode, 
                    type: 'keylines', 
                    position: smartPos, 
                    data: { 
                      ...fullNode.data, 
                      importance,
                      score: initialScore,
                      showDonuts: enableDonuts,
                      onSegmentClick: (cat, e) => expandNode(fullNode.id, cat, e) 
                    } 
                  };

                const nextNodes = deduplicate([...nodesRef.current, newNode]);
                setNodes(nextNodes);
        existing = newNode;
        
        // Trigger layout calculation for the new node to integrate it
        setTimeout(async () => {
          const visibleOnStage = nextNodes.filter(n => !hiddenTypes.has(n.data.type));
          const visibleIds = new Set(visibleOnStage.map(n => n.id));
          
          // STRUCTURAL ONLY: Exclude pathEdges!
          const visibleEdges = edgesRef.current.filter(e => visibleIds.has(e.source) && visibleIds.has(e.target));
          
          const result = await calculateLayout(visibleOnStage, visibleEdges, activeLayout, layoutOptions, activeRootNodeId, layoutTrigger);
          let layoutedVisible = result.nodes;
          let finalEdges = result.edges;
          
          // APPLY ROTATION (Must match runLayout)
          let rotatedVisible = layoutedVisible;
          if (layoutOptions.rotation !== 0 && layoutedVisible.length > 0) {
            const center = getLayoutCenter(layoutedVisible);
            const rad = (layoutOptions.rotation * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            rotatedVisible = layoutedVisible.map(n => {
              const dx = n.position.x - center.x;
              const dy = n.position.y - center.y;
              return {
                ...n,
                position: {
                  x: center.x + (dx * cos - dy * sin),
                  y: center.y + (dx * sin + dy * cos)
                }
              };
            });
          }

          const layoutedMap = new Map(rotatedVisible.map(n => [n.id, n]));

          setNodes(nds => nds.map(n => {
            if (layoutedMap.has(n.id)) {
              const ln = layoutedMap.get(n.id);
              return { ...n, position: ln.position, type: ln.type, data: ln.data };
            }
            return n;
          }));

          if (finalEdges !== visibleEdges) {
            const edgeMap = new Map(finalEdges.map(e => [e.id, e]));
            setEdges(eds => eds.map(e => {
              if (edgeMap.has(e.id)) {
                const fe = edgeMap.get(e.id);
                return { 
                  ...e, 
                  type: fe.type, 
                  sourceHandle: fe.sourceHandle, 
                  targetHandle: fe.targetHandle,
                  data: { ...e.data, ...fe.data }
                };
              }
              return e;
            }));
          }
          
          setTimeout(() => fitToNodes(rotatedVisible), 300);
        }, 50);
      }
    }
    if (existing) {
      setTimeout(() => {
        const nodePos = nodesRef.current.find(n => n.id === nodeInfo.id)?.position;
        if (nodePos) setCenter(nodePos.x, nodePos.y, { zoom: 1.2, duration: 800 });
      }, 200);
    }
  };

      const onDeleteNode = useCallback(() => {
        if (!selectedNode) return;
        setNodes(nds => nds.filter(n => n.id !== selectedNode.id));
        setEdges(eds => eds.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id));
        setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
        closeSidebar();
      }, [selectedNode, setNodes, setEdges, closeSidebar, fitView]);
  
      const onDrillDownToNode = useCallback(() => {
        if (!selectedNode) return;
        // Search for original node in state to avoid using the "filtered" donut from visibleNodes view
        const originalNode = nodesRef.current.find(n => n.id === selectedNode.id);
        setNodes(originalNode ? [originalNode] : [selectedNode]);
        setEdges([]);
        setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
      }, [selectedNode, setNodes, setEdges, fitView]);
              
                              const deleteSelectedElements = useCallback(() => {
    const nodeIdsToRemove = new Set(nodesRef.current.filter(n => n.selected).map(n => n.id));
    const edgeIdsToRemove = new Set(edgesRef.current.filter(e => e.selected).map(e => e.id));
    if (nodeIdsToRemove.size === 0 && edgeIdsToRemove.size === 0) return;
    setNodes(nds => nds.filter(n => !nodeIdsToRemove.has(n.id)));
    setEdges(eds => eds.filter(e => !edgeIdsToRemove.has(e.id) && !nodeIdsToRemove.has(e.source) && !nodeIdsToRemove.has(e.target)));
    if (selectedNode && nodeIdsToRemove.has(selectedNode.id)) closeSidebar();
  }, [selectedNode, setNodes, setEdges, closeSidebar]);

      useEffect(() => {
        const handleKeyDown = (e) => {
          if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') cancelEditing();
            return;
          }
          if (e.key === 'Escape') cancelEditing();
          if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            if (e.shiftKey) {
              const selectedNodes = nodesRef.current.filter(n => n.selected);
              const selectedIds = new Set(selectedNodes.map(n => n.id));
              if (selectedIds.size > 0) {
                setNodes(selectedNodes); setEdges(eds => eds.filter(edge => selectedIds.has(edge.source) && selectedIds.has(edge.target)));
                if (selectedNode && !selectedIds.has(selectedNode.id)) closeSidebar();
              }
            } else deleteSelectedElements();
          }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }, [expandNode, deleteSelectedElements, selectedNode, closeSidebar, cancelEditing, isEditingNode, isEditingEdge]);
    const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;
    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const nodeId = `new-${Date.now()}`;
    const iconMap = { person: 'Person', planet: 'Public', robot: 'Android', mutant: 'Psychology', item: 'AutoStories', science: 'Science', book: 'MenuBook' };
          const newNode = {
            id: nodeId, type: 'keylines', position,
            data: { 
              label: '', 
              type, 
              icon: iconMap[type] || 'HelpOutline', 
              description: '', 
              importance: 0.5,
              score: 0.5, 
              isDraft: true,
              showDonuts: enableDonuts,
              onSegmentClick: (cat, e) => expandNode(nodeId, cat, e) 
            },
          };
          setNodes((nds) => nds.concat(newNode));
          // Sofort selektieren und in den Edit-Modus schalten
          setTimeout(() => {
            openDetails(newNode, true);
          }, 50);
        }, [setNodes, expandNode, openDetails, screenToFlowPosition, enableDonuts]);
          const visibleNodes = useMemo(() => {
            const hasHighlight = highlightedTypes.size > 0;
            return nodes.filter(n => !hiddenTypes.has(n.data.type)).map(n => {
              // Dynamische Donut-Berechnung: Segmente verschwinden/schrumpfen, 
              // wenn Nachbarn bereits auf der Stage sind.
              let newDonut = n.data.donut || [];
              if (newDonut.length > 0) {
                // Finde alle Nachbarn dieses Knotens, die aktuell auf der Stage sind (über pathEdges)
                const pathNeighbors = pathEdges
                  .filter(e => (e.source === n.id || e.target === n.id) && e.data?.type === 'DIRECT_RELATION')
                  .map(e => e.source === n.id ? e.target : e.source);

                const uniqueNeighborsOnStage = new Set(pathNeighbors);
                const neighborsOnStage = nodes.filter(node => uniqueNeighborsOnStage.has(node.id));
      
                // Zähle Nachbarn pro Kategorie auf der Stage
                const stageCounts = {};
                neighborsOnStage.forEach(nb => {
                  const cat = categoryMap[nb.data.type?.toLowerCase()] || 'other';
                  stageCounts[cat] = (stageCounts[cat] || 0) + 1;
                });
      
                // Berechne verbleibende Counts für den Donut
                const originalTotal = (n.data.donut || []).reduce((sum, s) => sum + (s.total_count || 0), 0);
                
                newDonut = newDonut.map(segment => {
                  const currentOnStage = stageCounts[segment.category] || 0;
                  const remaining = Math.max(0, (segment.total_count || 0) - currentOnStage);
                  return { ...segment, value: remaining }; 
                }).filter(s => s.value > 0);
      
                // Normalisiere die Werte relativ zum URSPRÜNGLICHEN Total, 
                // damit Lücken entstehen, wenn Nachbarn auf der Stage sind.
                if (originalTotal > 0) {
                  newDonut = newDonut.map(s => ({
                    ...s,
                    value: (s.value / originalTotal) * 100
                  }));
                } else {
                  newDonut = [];
                }
                
              }
      
              return {
                ...n, 
                type: activeLayout === 'biofabric' ? 'biofabric' : 'keylines',
                data: { 
                  ...n.data, 
                  donut: newDonut,
                  onMouseEnter: () => setHoveredNodeId(n.id),
                  onMouseLeave: () => setHoveredNodeId(null)
                },
                style: { ...n.style, opacity: hasHighlight ? (highlightedTypes.has(n.data.type) ? 1 : 0.2) : 1, transition: 'opacity 0.3s ease' }
              };
            });
          }, [nodes, edges, pathEdges, hiddenTypes, highlightedTypes, activeLayout]);
        const visibleEdges = useMemo(() => {
          const nodeIds = new Set(visibleNodes.map(n => n.id));
          const hasHighlight = highlightedTypes.size > 0;

          // Wir nutzen NUR noch pathEdges für das Rendering auf der Stage.
          // Die Basis-Relationen (edges) werden NICHT mehr im DOM gerendert,
          // sondern dienen nur noch als Daten-Layer für das Layout-Engine.
          let filteredPathEdges = pathEdges.filter(pe => {
            const { source, target } = pe;
            const length = pe.data?.length || 0;

            if (!nodeIds.has(source) || !nodeIds.has(target)) return false;

            if (length === 1) {
              return true;
            } else {
              const fullPathNodes = pe.data?.fullPathNodes || [];
              const pathIds = fullPathNodes.map(n => n.id);
              const intermediateIds = pathIds.filter(id => id !== source && id !== target);
              // Wenn alle Zwischenknoten bereits auf der Stage sind, verbergen wir den virtuellen Pfad
              const allIntermediatesOnStage = intermediateIds.length > 0 && intermediateIds.every(id => nodeIds.has(id));

              return !allIntermediatesOnStage;
            }
          });

          // BIOFABRIC: Assign unique column indexes to visible edges
          if (activeLayout === 'biofabric') {
            // Sort edges by source node Y position to make it look organized
            const nodeYMap = {};
            visibleNodes.forEach(n => { nodeYMap[n.id] = n.position.y; });
            
            filteredPathEdges = [...filteredPathEdges].sort((a, b) => {
              const yA = nodeYMap[a.source] || 0;
              const yB = nodeYMap[b.source] || 0;
              return yA - yB;
            });
          }

          return filteredPathEdges.map((edge, idx) => {
            const sourceNode = nodes.find(n => n.id === edge.source); 
            const targetNode = nodes.find(n => n.id === edge.target);
            const isPath = edge.data?.type === 'PATH';
            const isHighlighted = hasHighlight ? (highlightedTypes.has(sourceNode?.data.type) || highlightedTypes.has(targetNode?.data.type)) : true;

            const isConnectedToHovered = hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
            const isDimmedByHover = layoutOptions.enableEdgeHighlightOnHover && hoveredNodeId && !isConnectedToHovered;

            const highlightOpacity = isPath ? 1.0 : (hasHighlight ? (isHighlighted ? 0.8 : 0.2) : 1.0);
            
            // Determination of the effective render type:
            // 1. If Layout is BUNDLED, force 'bundled' visual
            // 2. If Layout is ORTHOGONAL, force 'smoothstep' visual
            // 3. If Layout is ARC, force 'arc' visual
            // 4. If Layout is BIOFABRIC, force 'biofabric' visual
            // 5. If Layout is PHYLLOTAXIS, force 'straight' visual
            // 6. Otherwise, use global edgePathType (simplebezier, straight, etc.)
            let effectiveType = activeLayout === 'bundled' ? 'bundled' : edgePathType;
            if (activeLayout === 'orthogonal') effectiveType = 'smoothstep';
            if (activeLayout === 'arc') effectiveType = 'arc';
            if (activeLayout === 'biofabric') effectiveType = 'biofabric';
            if (activeLayout === 'phyllotaxis') effectiveType = 'straight';
            if (activeLayout === 'narrative') effectiveType = 'smoothstep';

            // Special Styling for Narrative "Time Bridges"
            let edgeStyleOverride = {};
            let isAnimated = edge.animated;
            
            if (activeLayout === 'narrative') {
              const sourceNode = nodes.find(n => n.id === edge.source);
              const targetNode = nodes.find(n => n.id === edge.target);
              if (sourceNode && targetNode) {
                const eraGap = Math.abs(parseInt(sourceNode.data.era || 0) - parseInt(targetNode.data.era || 0));
                if (eraGap > 2) {
                  // Massive historical connection (Time Bridge)
                  edgeStyleOverride = {
                    stroke: '#ffd700', // Gold
                    strokeWidth: 4,
                    filter: 'drop-shadow(0 0 8px #ffd700)',
                  };
                  isAnimated = true; // Make it pulse/flow
                } else {
                  edgeStyleOverride = {
                    stroke: 'rgba(255, 255, 255, 0.3)',
                    strokeWidth: 1.5,
                  };
                }
              }
            }
            
            const updatedData = { 
              ...edge.data, 
              pathType: effectiveType,
              layoutOptions,
              nodes,
              source: edge.source,
              target: edge.target,
              columnIndex: activeLayout === 'biofabric' ? idx : (edge.data?.columnIndex || 0)
            };

            const isPhyllotaxis = activeLayout === 'phyllotaxis';
            const isBioFabric = activeLayout === 'biofabric';
            const baseOpacity = isPhyllotaxis ? 0.1 : 1.0;

            return { 
              ...edge, 
              type: (activeLayout === 'bundled' || activeLayout === 'orthogonal' || activeLayout === 'arc' || activeLayout === 'biofabric' || activeLayout === 'phyllotaxis' || activeLayout === 'narrative') ? effectiveType : 'pathEdge', 
              data: updatedData,
              animated: isAnimated,
              label: (isPath || isPhyllotaxis) ? "" : (zoomLevel > 0.6 ? (edge.label || edge.data?.dbType?.replace("_", " ").toLowerCase()) : ""), 
              markerEnd: isBioFabric ? {
                type: MarkerType.Arrow,
                width: 20,
                height: 20,
                strokeWidth: 2,
                color: isPath ? COLORS.secondary : (layoutOptions.bioFabricUseSystemColor ? COLORS.primary : getHexColor(sourceNode?.data.type))
              } : edge.markerEnd,
              className: isPath ? 'path-edge' : '',
              zIndex: isPath ? -1 : -2, 
              labelStyle: { fill: COLORS.nodeLabel, fontWeight: 600, fontSize: '10px', fontFamily: '"Open Sans", sans-serif', fontStyle: 'italic' },
              labelBgStyle: { fill: COLORS.background, fillOpacity: 1 },
              labelBgPadding: [4, 2],
              labelBgBorderRadius: 4,
              style: { 
                ...edge.style, 
                stroke: isPath ? COLORS.secondary : (Object.keys(edgeStyleOverride).length > 0 ? edgeStyleOverride.stroke : COLORS.primary),
                strokeWidth: edgeStyleOverride.strokeWidth || 1,
                filter: edgeStyleOverride.filter || 'none',
                opacity: isPath ? 1.0 : (isDimmedByHover ? 0.05 : highlightOpacity * baseOpacity),
                borderRadius: activeLayout === 'orthogonal' ? 20 : 0,
                transition: 'opacity 0.3s ease'
              }
            };
          });
        }, [nodes, pathEdges, visibleNodes, hiddenTypes, highlightedTypes, edgePathType, zoomLevel, layoutOptions, hoveredNodeId]);
  const onDeleteSnapshot = useCallback((id) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
  }, []);

  const onAnalyzeComparison = useCallback((aiData, userData) => {
    if (!aiData || !userData) return;

    const getMetrics = (data) => {
      if (data.nodes.length === 0) return { spread: 1, avgLinkDist: 1, minDist: 50 };
      const xs = data.nodes.map(n => n.position.x);
      const ys = data.nodes.map(n => n.position.y);
      const width = Math.max(...xs) - Math.min(...xs);
      const height = Math.max(...ys) - Math.min(...ys);
      const spread = (width + height) / 2 || 1;

      let linkTotal = 0;
      data.edges.forEach(e => {
        const s = data.nodes.find(n => n.id === e.source);
        const t = data.nodes.find(n => n.id === e.target);
        if (s && t) {
          linkTotal += Math.sqrt(Math.pow(s.position.x - t.position.x, 2) + Math.pow(s.position.y - t.position.y, 2));
        }
      });
      const avgLinkDist = data.edges.length > 0 ? linkTotal / data.edges.length : 50;

      let minDist = Infinity;
      for (let i = 0; i < data.nodes.length; i++) {
        for (let j = i + 1; j < data.nodes.length; j++) {
          const d = Math.sqrt(Math.pow(data.nodes[i].position.x - data.nodes[j].position.x, 2) + Math.pow(data.nodes[i].position.y - data.nodes[j].position.y, 2));
          if (d < minDist) minDist = d;
        }
      }

      return { spread, avgLinkDist, minDist: minDist === Infinity ? 50 : minDist };
    };

    const ai = getMetrics(aiData);
    const user = getMetrics(userData);

    if (activeLayout === 'hierarchical') {
      // TREE LAYOUT ANALYSIS
      const nodeSpacingFactor = user.minDist / ai.minDist;
      const rankSpacingFactor = user.spread / ai.spread;
      
      setAnalysisResult({
        layoutType: 'hierarchical',
        suggestedNodeSpacing: Math.max(1, Math.min(300, Math.round(layoutOptions.nodeSpacing * nodeSpacingFactor))),
        suggestedRankSpacing: Math.max(10, Math.min(400, Math.round(layoutOptions.rankSpacing * rankSpacingFactor))),
        suggestedNodeWidth: Math.max(40, Math.min(400, Math.round((layoutOptions.nodeWidth || 180) * nodeSpacingFactor))),
        suggestedNodeHeight: Math.max(20, Math.min(200, Math.round((layoutOptions.nodeHeight || 80) * nodeSpacingFactor))),
      });
    } else {
      // FORCE LAYOUT ANALYSIS
      const repulsionFactor = user.spread / ai.spread;
      const linkFactor = user.avgLinkDist / ai.avgLinkDist;
      const suggestedCollision = Math.max(20, Math.min(200, Math.round(user.minDist / 2.2)));

      const newRepulsion = Math.max(-5000, Math.min(-100, Math.round(layoutOptions.repulsion * repulsionFactor)));
      const newLinkDist = Math.max(50, Math.min(600, Math.round(layoutOptions.linkDistance * linkFactor)));
      const newGravity = Math.max(0.01, Math.min(0.5, layoutOptions.gravityX / (repulsionFactor > 0 ? repulsionFactor : 1)));

      setAnalysisResult({
        layoutType: 'force',
        suggestedRepulsion: newRepulsion,
        suggestedLinkDist: newLinkDist,
        suggestedCollision: suggestedCollision,
        suggestedGravity: parseFloat(newGravity.toFixed(2)),
        spreadRatio: repulsionFactor.toFixed(2),
        linkRatio: linkFactor.toFixed(2),
      });
    }

    setStatusParts([{ trigger: 'INFO', action: 'Suggestions calculated. Review in Tuning Panel.' }]);
    setTimeout(() => setStatusParts([]), 3000);
  }, [layoutOptions, activeLayout]);

  const onApplySuggestions = useCallback(() => {
    if (!analysisResult) return;

    if (analysisResult.layoutType === 'hierarchical') {
      setLayoutOptions(prev => ({
        ...prev,
        nodeSpacing: analysisResult.suggestedNodeSpacing,
        rankSpacing: analysisResult.suggestedRankSpacing,
        nodeWidth: analysisResult.suggestedNodeWidth,
        nodeHeight: analysisResult.suggestedNodeHeight,
      }));
      setLayoutTrigger(prev => prev + 1);
    } else {
      setLayoutOptions(prev => ({
        ...prev,
        repulsion: analysisResult.suggestedRepulsion,
        linkDistance: analysisResult.suggestedLinkDist,
        collisionRadius: analysisResult.suggestedCollision,
        gravityX: analysisResult.suggestedGravity,
        gravityY: analysisResult.suggestedGravity,
      }));
    }

    setAnalysisResult(null); // Clear after applying
    setStatusParts([{ trigger: 'INFO', action: 'Learned parameters applied to live stage' }]);
    setTimeout(() => setStatusParts([]), 3000);
  }, [analysisResult]);

  const onLoadTestGraph = async () => {

    try {
      const res = await fetch('http://localhost:8000/random-subgraph');
      const data = await res.json();
      if (!data.nodes || data.nodes.length === 0) return;
      
      // Randomize positions a bit for a fresh simulation
      const newNodes = data.nodes.map(n => ({
        ...n, 
        position: { x: Math.random() * 200 - 100, y: Math.random() * 200 - 100 },
        data: {
          ...n.data,
          showDonuts: enableDonuts,
          onSegmentClick: (cat, e) => expandNode(n.id, cat, e)
        }
      }));
      setNodes(newNodes);
      setEdges(data.edges);
      
      // Since the UI renders pathEdges, we map the loaded edges to pathEdges format
      const initialPathEdges = data.edges.map(e => ({
        ...e,
        type: 'default',
        data: { ...e, type: 'DIRECT_RELATION' }
      }));
      setPathEdges(initialPathEdges);
      setActiveRootNodeId(null);

      // Use a small timeout to ensure the state updates (setNodes, setEdges)
      // are committed before runLayout starts (which uses nodesRef/edgesRef)
      setTimeout(() => {
        setLayoutTrigger(prev => prev + 1);
      }, 100);

      // Auto capture AI layout after short layout settle
      setTimeout(() => {
        setTrainingAI({
          nodes: JSON.parse(JSON.stringify(nodesRef.current)),
          edges: JSON.parse(JSON.stringify(edgesRef.current)),
          rawTimestamp: Date.now()
        });
      }, 900);
    } catch (err) {
    console.error('Failed to load test graph:', err);
    }
    };

  const onSpawnRandomNode = async () => {
    try {
      const res = await fetch('http://localhost:8000/random-node');
      const node = await res.json();
      if (!node) return;

      // Check if already on stage
      if (nodesRef.current.find(n => n.id === node.id)) {
        setStatusParts([{ trigger: 'INFO', action: `Node ${node.data.label} already on stage.` }]);
        setTimeout(() => setStatusParts([]), 2000);
        return;
      }

      const newNode = {
        ...node,
        position: { 
          x: activeLayout === 'biofabric' ? 0 : (Math.random() - 0.5) * 400 + 400, 
          y: (Math.random() - 0.5) * 400 + 400 
        },
        data: {
          ...node.data,
          showDonuts: enableDonuts,
          onSegmentClick: (cat, e) => expandNode(node.id, cat, e)
        }
      };

      const nextNodes = [...nodesRef.current, newNode];
      setNodes(nextNodes);
      
      setStatusParts([{ trigger: 'SPAWN', action: `Added ${node.data.label} to stage.` }]);
      setTimeout(() => setStatusParts([]), 2000);

      // Reheat simulation or trigger layout run
      setLayoutTrigger(prev => prev + 1);
      
      // Focus on the new node, but skip automatic zoom in BioFabric mode to keep viewport stability
      if (activeLayout !== 'biofabric') {
        setTimeout(() => fitToNodes(nextNodes), 150);
      }
    } catch (err) {
      console.error('Failed to spawn random node:', err);
    }
  };

    const onLoadSnapshot = useCallback((snapshot) => {    if (!snapshot) return;
    
    // JSON serialization strips functions, so we MUST re-attach the handlers
    const restoredNodes = snapshot.nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        showDonuts: enableDonuts,
        onSegmentClick: (cat, e) => expandNode(n.id, cat, e)
      }
    }));

    setNodes(restoredNodes);
    setEdges(snapshot.edges);
    // Give it a moment to render then fit view
    setTimeout(() => fitToNodes(restoredNodes), 100);
    setIsSnapshotsOpen(false);
  }, [setNodes, setEdges, fitToNodes, expandNode, enableDonuts]);

  const onImportSnapshot = useCallback(() => {
    const json = window.prompt("Paste Snapshot JSON here:");
    if (!json) return;
    try {
      const snapshot = JSON.parse(json);
      if (snapshot.nodes && snapshot.edges) {
        onLoadSnapshot(snapshot);
        setStatusParts([{ trigger: 'INFO', action: 'Snapshot imported successfully' }]);
        setTimeout(() => setStatusParts([]), 2000);
      } else {
        alert("Invalid snapshot format: Missing nodes or edges.");
      }
    } catch (e) {
      console.error("Import error:", e);
      alert("Failed to parse JSON. Please make sure it's a valid snapshot object.");
    }
  }, [onLoadSnapshot]);

  const stats = useMemo(() => {
    const counts = {}; nodes.forEach(n => { const type = n?.data?.type || 'Unknown'; counts[type] = (counts[type] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  const sidebarColor = selectedNode ? getHexColor(selectedNode?.data?.type) : (selectedEdge?.data?.type === 'PATH' || pendingConnection) ? COLORS.secondary : selectedEdge ? COLORS.primary : previewData ? typeColors[previewData.category] : typeColors.other;

    const topBarHeight = 48; // Common height for the top toolbars
    const statusBarHeight = 30;

  return (
    <Box sx={{ width: '100vw', height: '100vh', bgcolor: 'background.default', display: 'flex', flexDirection: 'column', fontFamily: '"Open Sans", sans-serif', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        body { margin: 0; padding: 0; overflow: hidden; background: ${COLORS.background}; }
        .react-flow__node { transition: none !important; will-change: transform; }
        .react-flow__node.dragging { transition: none !important; }
        
        /* Edges and Labels should stick immediately to nodes during movement - NO TRANSITIONS */
        .react-flow__edge-path, 
        .react-flow__edge-textwrapper, 
        .react-flow__edge-textbg,
        .react-flow__edge-text { 
          transition: none !important; 
        }
        
        .react-flow__edge-textwrapper { 
          opacity: ${zoomLevel > 0.6 ? 1 : 0}; 
        }
        
        .react-flow__edge-text { fill: ${COLORS.nodeLabel} !important; font-style: italic !important; }
        .react-flow__edge-textbg { fill: ${COLORS.background} !important; fill-opacity: 1 !important; }
        
        .react-flow__controls { box-shadow: 0 0 10px rgba(0,0,0,0.5); }
        .react-flow__controls-button { background: ${COLORS.paper} !important; border-bottom: 1px solid ${COLORS.panelBorder} !important; fill: ${COLORS.textSecondary} !important; }
        .react-flow__controls-button:hover { background: #2a2a2a !important; fill: ${COLORS.primary} !important; }
                            .react-flow__controls-button svg { fill: currentColor !important; }
                                      .react-flow__handle { 
                                        transition: all 0.3s ease;
                                        opacity: 0;
                                        pointer-events: ${isEdgeCreationMode ? 'all' : 'none'};
                                      }
                                      .react-flow__handle-connecting {
                            
                                        background: ${COLORS.secondary} !important;
                                      }
                                      
                                      /* Connection Line refinement */
                                      .react-flow__connection-path {
                                        stroke: ${COLORS.primary} !important;
                                        stroke-width: 3 !important;
                                        transition: stroke-dasharray 0.2s ease;
                                      }
                                      
                                      /* Animierte gestrichelte Linie wenn über einem Ziel (valid snap) */
                                      .react-flow__connection.valid .react-flow__connection-path {
                                        stroke-dasharray: 5;
                                        animation: dashdraw 0.5s linear infinite;
                                      }
                                      
                                                @keyframes dashdraw {
                                                  from { stroke-dashoffset: 10; }
                                                  to { stroke-dashoffset: 0; }
                                                }
                                              `}</style>
                                      
                                          {/* LEFT TOOLBAR (DRAWER TOGGLE) */}
      <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1200 }}>
        <Paper elevation={3} sx={{ px: 1, height: topBarHeight, display: 'flex', alignItems: 'center', bgcolor: 'rgba(30, 30, 30, 0.9)', borderRadius: 2, border: `1px solid ${COLORS.panelBorder}` }}>
                      <Tooltip title="Settings">
                        <IconButton 
                          onClick={() => { setIsSettingsOpen(!isSettingsOpen); setIsLeftDrawerOpen(false); setIsSnapshotsOpen(false); setIsHistogramOpen(false); setIsTrainingOpen(false); }} 
                          onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Toggle Visualization Settings' }])}
                          onMouseLeave={() => setStatusParts([])}
                          color={isSettingsOpen ? 'secondary' : 'primary'} size="small"
                        >
                          <SettingsIcon />
                        </IconButton>
                      </Tooltip>
                      <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                      <Tooltip title="Analytics">
                        <IconButton 
                          onClick={() => { setIsHistogramOpen(!isHistogramOpen); setIsLeftDrawerOpen(false); setIsSettingsOpen(false); setIsSnapshotsOpen(false); setIsTrainingOpen(false); }} 
                          onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Toggle Graph Analytics' }])}
                          onMouseLeave={() => setStatusParts([])}
                          color={isHistogramOpen ? 'secondary' : 'primary'} size="small"
                        >
                          <HistogramIcon />
                        </IconButton>
                      </Tooltip>
                      <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                      <Tooltip title="Snapshots">
                        <IconButton 
                          onClick={() => { setIsSnapshotsOpen(!isSnapshotsOpen); setIsLeftDrawerOpen(false); setIsSettingsOpen(false); setIsHistogramOpen(false); setIsTrainingOpen(false); }} 
                          onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Toggle Snapshots Panel' }])}
                          onMouseLeave={() => setStatusParts([])}
                          color={isSnapshotsOpen ? 'secondary' : 'primary'} size="small"
                        >
                          <SnapshotIcon />
                        </IconButton>
                      </Tooltip>
                      <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                      <Tooltip title="Training AI">
                        <IconButton 
                          onClick={() => { setIsTrainingOpen(!isTrainingOpen); setIsLeftDrawerOpen(false); setIsSettingsOpen(false); setIsHistogramOpen(false); setIsSnapshotsOpen(false); }} 
                          onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Toggle Training Environment' }])}
                          onMouseLeave={() => setStatusParts([])}
                          color={isTrainingOpen ? 'secondary' : 'primary'} size="small"
                        >
                          <TrainingIcon />
                        </IconButton>
                      </Tooltip>
                      <Divider orientation="vertical" flexItem sx={{ mx: 1, my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                      <Tooltip title="Toolbox">
                        <IconButton 
                          onClick={() => { setIsLeftDrawerOpen(!isLeftDrawerOpen); setIsSettingsOpen(false); setIsSnapshotsOpen(false); setIsHistogramOpen(false); setIsTrainingOpen(false); }} 
                          onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Toggle Node Toolbox' }])}
                          onMouseLeave={() => setStatusParts([])}
                          color={isLeftDrawerOpen ? 'secondary' : 'primary'} size="small"
                        >
                          <MenuIcon />
                        </IconButton>
                      </Tooltip>
          
        </Paper>
      </Box>

      {/* UNIFIED GLOBAL TOOLBAR (CENTER) */}
      <Box sx={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1200 }}>
        <Paper elevation={3} sx={{ pl: 2, pr: 1, height: topBarHeight, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(30, 30, 30, 0.9)', borderRadius: 2, border: `1px solid ${COLORS.panelBorder}` }}>
          <Autocomplete 
            sx={{ width: 300, ml: 0.5 }} 
            size="small" 
            options={searchResults.length > 0 ? searchResults : searchHistory} 
            getOptionLabel={(o) => o.label || o.type || 'Unknown'} 
            onInputChange={(e, v) => handleSearch(v)} 
            onChange={(e, v) => onSelectSearchResult(v)} 
            onMouseEnter={() => setStatusParts([{ trigger: 'TYPE', action: 'Search For Entities' }, { trigger: 'ENTER', action: 'Add First Result' }])}
            onMouseLeave={() => setStatusParts([])}
            autoSelect 
            renderInput={(params) => <TextField {...params} placeholder={searchHistory.length > 0 ? "Search or History..." : "Search Universe..."} variant="outlined" InputProps={{ ...params.InputProps, startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>), }} />} 
            renderOption={(props, o) => {
              const { key, ...otherProps } = props;
              const isHistory = !searchResults.length && searchHistory.some(h => h.id === o.id);
              return (
                <ListItem key={o.id || key} {...otherProps}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: getHexColor(o.type), width: 24, height: 24 }}>
                      {React.createElement(Icons[o.icon] || Icons.HelpOutline, { sx: { fontSize: 14 } })}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText 
                    primary={o.label || `[${o.type}]`} 
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption">{o.type}</Typography>
                        {isHistory && <Typography variant="caption" sx={{ color: COLORS.secondary, fontSize: '0.6rem', border: `1px solid ${COLORS.secondary}`, px: 0.5, borderRadius: 0.5 }}>HISTORY</Typography>}
                      </Box>
                    } 
                  />
                </ListItem>
              );
            }} 
          />
          <Tooltip title="Clear Canvas">
            <IconButton 
              size="small" color="secondary" 
              onClick={() => { setNodes([]); setEdges([]); setSelectedNode(null); setPreviewData(null); }}
              onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Clear All Nodes From Canvas' }])}
              onMouseLeave={() => setStatusParts([])}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <ButtonGroup variant="text" size="small">
            <Tooltip title="Hierarchical Tree (TB)"><IconButton onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Apply Hierarchical Tree Layout' }])} onMouseLeave={() => setStatusParts([])} onClick={() => onLayoutClick('hierarchical')} color={activeLayout === 'hierarchical' ? 'secondary' : 'primary'}><TreeIcon /></IconButton></Tooltip>
            <Tooltip title="Organic (Force)"><IconButton onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Apply Force-Directed Organic Layout' }])} onMouseLeave={() => setStatusParts([])} onClick={() => onLayoutClick('force')} color={activeLayout === 'force' ? 'secondary' : 'primary'}><ForceIcon /></IconButton></Tooltip>

            <Tooltip title="Circular"><IconButton onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Apply Circular Hub Layout' }])} onMouseLeave={() => setStatusParts([])} onClick={() => onLayoutClick('circular')} color={activeLayout === 'circular' ? 'secondary' : 'primary'}><CircularIcon /></IconButton></Tooltip>
            <Tooltip title="Hive Plot"><IconButton onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Apply Deterministic Hive Plot Layout' }])} onMouseLeave={() => setStatusParts([])} onClick={() => onLayoutClick('hive')} color={activeLayout === 'hive' ? 'secondary' : 'primary'}><HiveIcon /></IconButton></Tooltip>
            <Tooltip title="Bundled (HEB)"><IconButton onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Apply Hierarchical Edge Bundling' }])} onMouseLeave={() => setStatusParts([])} onClick={() => onLayoutClick('bundled')} color={activeLayout === 'bundled' ? 'secondary' : 'primary'}><BundledIcon /></IconButton></Tooltip>
            <Tooltip title="Orthogonal (Manhattan)"><IconButton onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Apply Orthogonal Manhattan Layout' }])} onMouseLeave={() => setStatusParts([])} onClick={() => onLayoutClick('orthogonal')} color={activeLayout === 'orthogonal' ? 'secondary' : 'primary'}><OrthogonalIcon /></IconButton></Tooltip>
            <Tooltip title="Arc Diagram"><IconButton onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Apply Linear Arc Diagram Layout' }])} onMouseLeave={() => setStatusParts([])} onClick={() => onLayoutClick('arc')} color={activeLayout === 'arc' ? 'secondary' : 'primary'}><ArcIcon /></IconButton></Tooltip>
            <Tooltip title="Narrative Timeline"><IconButton onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Apply Narrative Timeline Layout' }])} onMouseLeave={() => setStatusParts([])} onClick={() => onLayoutClick('narrative')} color={activeLayout === 'narrative' ? 'secondary' : 'primary'}><HistoryIcon /></IconButton></Tooltip>
            <Tooltip title="BioFabric"><IconButton onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Apply BioFabric Node-Line Layout' }])} onMouseLeave={() => setStatusParts([])} onClick={() => onLayoutClick('biofabric')} color={activeLayout === 'biofabric' ? 'secondary' : 'primary'}><BioFabricIcon /></IconButton></Tooltip>
            </ButtonGroup>          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <ButtonGroup variant="text" size="small">
            <Tooltip title="Degree"><IconButton onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Scale by Degree Centrality (Connectivity)' }])} onMouseLeave={() => setStatusParts([])} onClick={() => onAnalyze('degree')} color={activeAlgorithm === 'degree' ? 'secondary' : 'primary'}><DegreeIcon /></IconButton></Tooltip>
            <Tooltip title="Betweenness"><IconButton onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Scale by Betweenness (Bridge Nodes)' }])} onMouseLeave={() => setStatusParts([])} onClick={() => onAnalyze('betweenness')} color={activeAlgorithm === 'betweenness' ? 'secondary' : 'primary'}><BetweennessIcon /></IconButton></Tooltip>
            <Tooltip title="Closeness"><IconButton onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Scale by Closeness (Distance)' }])} onMouseLeave={() => setStatusParts([])} onClick={() => onAnalyze('closeness')} color={activeAlgorithm === 'closeness' ? 'secondary' : 'primary'}><ClosenessIcon /></IconButton></Tooltip>
            <Tooltip title="PageRank"><IconButton onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Scale by PageRank (Importance)' }])} onMouseLeave={() => setStatusParts([])} onClick={() => onAnalyze('pagerank')} color={activeAlgorithm === 'pagerank' ? 'secondary' : 'primary'}><PageRankIcon /></IconButton></Tooltip>
          </ButtonGroup>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Export PNG">
            <IconButton
              onClick={onExport} color="primary"
              onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Export Current View As PNG' }])}
              onMouseLeave={() => setStatusParts([])}
            >
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Import Snapshot">
            <IconButton
              onClick={onImportSnapshot} color="primary"
              onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Import Snapshot from JSON' }])}
              onMouseLeave={() => setStatusParts([])}
            >
              <ImportIcon />
            </IconButton>
          </Tooltip>

        </Paper>
      </Box>


      <Drawer 
        anchor="left" open={isLeftDrawerOpen} onClose={() => setIsLeftDrawerOpen(false)} variant="temporary" 
        sx={{ width: isLeftDrawerOpen ? 280 : 0, flexShrink: 0, '& .MuiDrawer-paper': { width: 280, borderRight: `2px solid ${COLORS.panelBorder}`, bgcolor: COLORS.paper, boxShadow: 5, overflow: 'hidden' } }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS.primary, letterSpacing: 1 }}>TOOLBOX</Typography>
            <IconButton onClick={() => setIsLeftDrawerOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}><ChevronLeftIcon /></IconButton>
          </Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 2, letterSpacing: 1 }}>NODE TEMPLATES (Drag & Drop, Shift+Click: Load All)</Typography>
                                              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 4 }}>
                                                {Object.keys(NODE_CATEGORIES).filter(cat => cat !== 'other').map(cat => {
                                                  const count = dbCounts[cat.toLowerCase()] || 0;
                                                  return (
                                                    <Box 
                                                      key={cat}
                                                      draggable 
                                                      onDragStart={(e) => { e.dataTransfer.setData('application/reactflow', cat); e.dataTransfer.effectAllowed = 'move'; }}
                                                      onClick={(e) => { if (e.shiftKey) addAllNodesOfType(cat); }}
                                                      onMouseEnter={() => setStatusParts([
                                                        { trigger: 'DRAG', action: 'Add Single Node' },
                                                        { trigger: 'SHIFT+CLICK', action: 'Load All From Database' }
                                                      ])}
                                                      onMouseLeave={() => setStatusParts([])}
                                                      sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.05)`, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'grab', transition: 'all 0.2s ease', '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', borderColor: NODE_CATEGORIES[cat], transform: 'translateY(-2px)', boxShadow: `0 4px 10px ${NODE_CATEGORIES[cat]}33`, cursor: 'pointer' } }}
                                                    >
                                                      <Avatar sx={{ bgcolor: NODE_CATEGORIES[cat], width: 32, height: 32, mb: 1 }}>
                                                        {cat === 'person' ? <PersonIcon sx={{ fontSize: 18, color: '#fff' }} /> : 
                                                         cat === 'planet' ? <PublicIcon sx={{ fontSize: 18, color: '#fff' }} /> : 
                                                         cat === 'robot' ? <AndroidIcon sx={{ fontSize: 18, color: '#fff' }} /> : 
                                                         cat === 'item' ? <ItemIcon sx={{ fontSize: 18, color: '#fff' }} /> :
                                                         cat === 'science' ? <ScienceIcon sx={{ fontSize: 18, color: '#fff' }} /> :
                                                         cat === 'book' ? <BookIcon sx={{ fontSize: 18, color: '#fff' }} /> :
                                                         <Icons.HelpOutline sx={{ fontSize: 18, color: '#fff' }} />}
                                                      </Avatar>
                                                      <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold' }}>{cat.toUpperCase()}</Typography>
                                                      {count > 0 && <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)' }}>({count})</Typography>}
                                                    </Box>
                                                  );
                                                })}
                                              </Box>
                                            <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 1, letterSpacing: 1 }}>ACTIONS</Typography>

                      <Button 
                        variant={isEdgeCreationMode ? "contained" : "outlined"} 
                        fullWidth 
                        startIcon={<LinkIcon />} 
                        onClick={() => setIsEdgeCreationMode(!isEdgeCreationMode)}
                        onMouseEnter={() => setStatusParts([
                          { trigger: 'CLICK', action: isEdgeCreationMode ? 'Disable Relationship Mode' : 'Enable Relationship Mode' }
                        ])}
                        onMouseLeave={() => setStatusParts([])}
                        sx={{ 
                          textTransform: 'none', 
                          justifyContent: 'flex-start', 
                          borderRadius: 2, 
                          mb: 1,
                          bgcolor: isEdgeCreationMode ? COLORS.secondary : 'transparent',
                          color: isEdgeCreationMode ? '#fff' : 'rgba(255,255,255,0.7)', 
                          borderColor: isEdgeCreationMode ? COLORS.secondary : 'rgba(255,255,255,0.2)', 
                          '&:hover': { 
                            borderColor: COLORS.secondary, 
                            bgcolor: isEdgeCreationMode ? COLORS.secondary : `${COLORS.secondary}11` 
                          } 
                        }}
                      >
                        {isEdgeCreationMode ? "Cancel Drawing" : "Add Connection (Edge)"}
                      </Button>
                      <Box sx={{ flexGrow: 1 }} />
          
          <Typography variant="caption" sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)' }}>KeyLines OS Editor Mode v0.1</Typography>
        </Box>
      </Drawer>

      <Drawer 
        anchor="left" open={isHistogramOpen} onClose={() => setIsHistogramOpen(false)} variant="temporary" 
        sx={{ width: isHistogramOpen ? 320 : 0, flexShrink: 0, '& .MuiDrawer-paper': { width: 320, borderRight: `2px solid ${COLORS.panelBorder}`, bgcolor: COLORS.paper, boxShadow: 5, overflow: 'hidden' } }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>Analytics</Typography>
            <IconButton onClick={() => setIsHistogramOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}><ChevronLeftIcon /></IconButton>
          </Box>
          <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />

          <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '4px' } }}>
            {/* STAGE METRICS */}
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 1, display: 'block', letterSpacing: 1 }}>STAGE SUMMARY</Typography>
            <List dense sx={{ mb: 2 }}>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><Icons.AutoGraph sx={{ color: COLORS.primary, fontSize: 20 }} /></ListItemIcon>
                <ListItemText primary="Active Nodes" secondary={nodes.length} primaryTypographyProps={{ variant: 'body2' }} secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' } }} />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><Icons.Timeline sx={{ color: COLORS.secondary, fontSize: 20 }} /></ListItemIcon>
                <ListItemText primary="Total Relations" secondary={pathEdges.length} primaryTypographyProps={{ variant: 'body2' }} secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' } }} />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><Icons.ZoomIn sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 20 }} /></ListItemIcon>
                <ListItemText primary="Zoom Level" secondary={zoomLevel.toFixed(2) + "x"} primaryTypographyProps={{ variant: 'body2' }} secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.5)', fontWeight: 'bold' } }} />
              </ListItem>
            </List>

            <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

            {/* ACTIVE CONFIGURATION */}
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 1, display: 'block', letterSpacing: 1 }}>SYSTEM CONFIG</Typography>
            <List dense sx={{ mb: 2 }}>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><Icons.Layers sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 20 }} /></ListItemIcon>
                <ListItemText primary="Active Layout" secondary={activeLayout.toUpperCase()} primaryTypographyProps={{ variant: 'body2' }} secondaryTypographyProps={{ style: { color: COLORS.primary, fontWeight: 'bold' } }} />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><Icons.SettingsInputComponent sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 20 }} /></ListItemIcon>
                <ListItemText primary="Gravity (Tension)" secondary={layoutSpacing.toFixed(1)} primaryTypographyProps={{ variant: 'body2' }} secondaryTypographyProps={{ style: { color: COLORS.secondary, fontWeight: 'bold' } }} />
              </ListItem>
              <ListItem sx={{ px: 0 }}>
                <ListItemIcon><Icons.Route sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 20 }} /></ListItemIcon>
                <ListItemText primary="Search Depth" secondary={maxPathLength + " Hops"} primaryTypographyProps={{ variant: 'body2' }} secondaryTypographyProps={{ style: { color: '#fff', fontWeight: 'bold' } }} />
              </ListItem>
            </List>

            <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.05)' }} />

            {/* ENTITY DISTRIBUTION */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: 1 }}>TYPE DISTRIBUTION</Typography>
              <Tooltip title="Clear Highlights">
                <IconButton size="small" onClick={() => setHighlightedTypes(new Set())} sx={{ p: 0, color: 'rgba(255,255,255,0.3)' }}><Icons.ClearAll sx={{ fontSize: 16 }} /></IconButton>
              </Tooltip>
            </Box>
            
            <List dense>
              {stats.map(([type, count]) => {
                const color = getHexColor(type);
                const maxCount = Math.max(...stats.map(s => s[1]), 1);
                const isHighlighted = highlightedTypes.has(type);
                const dbTotal = dbCounts[type.toLowerCase()] || 0;
                
                return (
                  <ListItem key={type} sx={{ px: 0, flexDirection: 'column', alignItems: 'stretch', mb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                        <Typography 
                          variant="caption" 
                          onClick={(e) => toggleHighlight(type, e.shiftKey)}
                          sx={{ 
                            fontWeight: isHighlighted ? 900 : 600, 
                            fontSize: '0.75rem', 
                            cursor: 'pointer', 
                            color: isHighlighted ? '#fff' : 'rgba(255,255,255,0.7)',
                            '&:hover': { color: '#fff' }
                          }}
                        >
                          {type.toUpperCase()}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{count}</span> / {dbTotal}
                      </Typography>
                    </Box>
                    <Box sx={{ height: 4, width: '100%', bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${(count/maxCount)*100}%`, bgcolor: color, borderRadius: 1 }} />
                    </Box>
                  </ListItem>
                );
              })}
            </List>
          </Box>

          {highlightedTypes.size > 0 && (
            <Box sx={{ pt: 2, flexShrink: 0 }}>
              <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
              <Button 
                fullWidth 
                variant="outlined" 
                color="primary" 
                startIcon={<DrillDownIcon />} 
                onClick={onDrillDown} 
                onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Remove All Unfocused Nodes' }])}
                onMouseLeave={() => setStatusParts([])}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', borderColor: 'rgba(0, 191, 255, 0.3)' }}
              >
                Isolate Focused Types
              </Button>
            </Box>
          )}
        </Box>
      </Drawer>

      <Box sx={{ flexGrow: 1, height: 'auto', position: 'relative', transition: 'all 0.3s ease' }}>
        <ReactFlow
          nodes={visibleNodes} edges={visibleEdges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onNodeClick={(e, n) => {
            // Wenn auf ein Donut-Segment geklickt wurde, ignorieren wir den Node-Klick
            if (e.target.classList.contains('donut-segment')) return;
            if (e.shiftKey) {
              // Permanently set as root for hierarchical layout (decoupled from sidebar)
              setActiveRootNodeId(n.id);
              if (activeLayout !== 'hierarchical') setActiveLayout('hierarchical');
              setLayoutTrigger(prev => prev + 1);
            } else {
              openDetails(n);
            }
          }}
          onEdgeClick={(e, edge) => openEdgeDetails(edge)}
          onConnect={onConnect}
          onPaneClick={() => { closeSidebar(); setHighlightedTypes(new Set()); }}
          onMove={(e, v) => setZoomLevel(v.zoom)} onDrop={onDrop} onDragOver={onDragOver}
          onNodeMouseEnter={(e, n) => setStatusParts([
            { trigger: 'CLICK', action: 'Show Details' },
            { trigger: 'SHIFT+CLICK', action: 'Set as Root & Reorganize' },
            { trigger: 'DRAG', action: 'Reposition' }
          ])}
          onNodeMouseLeave={() => setStatusParts([])}
          onEdgeMouseEnter={(e, edge) => setStatusParts([
            { trigger: 'CLICK', action: 'Show Edge Details' }
          ])}                                onEdgeMouseLeave={() => setStatusParts([])}
                                nodeTypes={nodeTypes} 
                                edgeTypes={edgeTypes}
                                defaultEdgeOptions={{ type: edgePathType }} fitView
                                nodesDraggable={!isEdgeCreationMode}
                    
                                nodesConnectable={true}
                                selectNodesOnDrag={false}
                                connectionMode="loose"
                              >
                              <Background color="#333" variant="dots" gap={20} size={1} />
          <Controls showInteractive={false} />
        </ReactFlow>

        {/* LAYOUT CONFIGURATION PANEL (Top Right) */}
        {!isLayoutSettingsOpen ? (
          <IconButton 
            onClick={() => setIsLayoutSettingsOpen(true)}
            sx={{ 
              position: 'absolute', top: 20, right: 20, zIndex: 1000,
              bgcolor: 'rgba(18,18,18,0.9)', color: COLORS.secondary,
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              '&:hover': { bgcolor: 'rgba(30,30,30,1)' }
            }}
          >
            <Icons.Tune />
          </IconButton>
        ) : (
          <Paper sx={{ 
            position: 'absolute', top: 16, right: 16, zIndex: 1200, 
            width: 320, p: 3, 
            bgcolor: 'rgba(30, 30, 30, 0.9)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${COLORS.panelBorder}`,
            maxHeight: 'calc(80vh + 50px)', overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 3,
            boxShadow: 10,
            borderRadius: 2,
            '&::-webkit-scrollbar': { width: '4px' }, 
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS.secondary, letterSpacing: 1 }}>TUNING</Typography>
              <IconButton size="small" onClick={() => setIsLayoutSettingsOpen(false)} sx={{ color: 'rgba(255,255,255,0.3)' }}>
                <CloseIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

            {/* Refactored Graph Tuning Content */}
            <Box sx={{ bgcolor: 'rgba(0, 191, 255, 0.05)', p: 1.5, borderRadius: 2, border: `1px solid ${COLORS.primary}33` }}>
              <Typography variant="body2" sx={{ color: COLORS.primary, fontSize: '0.65rem', fontWeight: 'bold', mb: 1.5, letterSpacing: 1 }}>GLOBAL VIEWPORT</Typography>
              
              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>NODE SCALE: {layoutOptions.nodeSizeFactor.toFixed(1)}</Typography>
                <Box sx={{ px: 1 }}>
                  <Slider size="small" value={layoutOptions.nodeSizeFactor} min={-1} max={1} step={0.1}
                    onChange={(e, v) => setLayoutOptions(prev => ({ ...prev, nodeSizeFactor: v }))} color="primary" />
                </Box>
              </Box>

              <Box sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>ROTATION: {layoutOptions.rotation}°</Typography>
                <Box sx={{ px: 1 }}>
                  <Slider size="small" value={layoutOptions.rotation} min={0} max={360} step={5}
                    onChange={(e, v) => setLayoutOptions(prev => ({ ...prev, rotation: v }))} color="primary" />
                </Box>
              </Box>

              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>LINK DISTANCE: {layoutOptions.linkDistance}</Typography>
                  {analysisResult?.suggestedLinkDist && (
                    <Typography variant="caption" sx={{ 
                      color: COLORS.primary, 
                      fontSize: '9px', fontWeight: 'bold' 
                    }}>
                      {analysisResult.suggestedLinkDist > layoutOptions.linkDistance ? '→ +' : '← '}{analysisResult.suggestedLinkDist - layoutOptions.linkDistance}
                    </Typography>
                  )}
                  <Tooltip title="AI Influenced"><Icons.Psychology sx={{ fontSize: 12, color: COLORS.secondary }} /></Tooltip>
                </Box>
                <Box sx={{ position: 'relative', px: 1 }}>
                  <Slider size="small" value={layoutOptions.linkDistance} min={50} max={600} step={10}
                    onChange={(e, v) => setLayoutOptions(prev => ({ ...prev, linkDistance: v }))} color="primary" />
                  {analysisResult?.suggestedLinkDist && (
                    <>
                      {/* Directional Arrow Path */}
                      <Box sx={{ 
                        position: 'absolute', 
                        left: `${Math.min(((layoutOptions.linkDistance - 50) / 550) * 100, ((analysisResult.suggestedLinkDist - 50) / 550) * 100)}%`,
                        width: `${Math.abs(layoutOptions.linkDistance - analysisResult.suggestedLinkDist) / 550 * 100}%`,
                        height: '1px',
                        bgcolor: `${COLORS.primary}66`,
                        top: '42%',
                        pointerEvents: 'none'
                      }} />
                      {/* Suggestion Marker */}
                      <Box sx={{ 
                        position: 'absolute', 
                        left: `${((analysisResult.suggestedLinkDist - 50) / 550) * 100}%`, 
                        top: '42%', transform: 'translate(-50%, -50%)',
                        width: 2, height: 10, 
                        bgcolor: COLORS.primary, 
                        borderRadius: '1px',
                        pointerEvents: 'none', zIndex: 1
                      }} />
                    </>
                  )}
                </Box>
              </Box>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

            {/* Context Specific Settings */}
            <Box sx={{ px: 0.5 }}>
              {activeLayout === 'force' && (
                <Box>
                  <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1 }}>
                    <ForceIcon sx={{ fontSize: 14, color: COLORS.secondary }} /> {activeLayout.toUpperCase()} PHYSICS
                  </Typography>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>IMPORTANCE WEIGHT: {layoutOptions.importanceWeight?.toFixed(1)}x</Typography>
                      <Tooltip title="AI Influenced"><Icons.Psychology sx={{ fontSize: 12, color: COLORS.secondary }} /></Tooltip>
                    </Box>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.importanceWeight || 2.0} min={0.1} max={5.0} step={0.1}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, importanceWeight: v }));
                        }} color="secondary" />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>REPULSION: {layoutOptions.repulsion}</Typography>
                      {analysisResult?.suggestedRepulsion && (
                        <Typography variant="caption" sx={{ color: COLORS.secondary, fontSize: '9px', fontWeight: 'bold' }}>
                          {analysisResult.suggestedRepulsion > layoutOptions.repulsion ? '→ +' : '← '}{analysisResult.suggestedRepulsion - layoutOptions.repulsion}
                        </Typography>
                      )}
                      <Tooltip title="AI Influenced"><Icons.Psychology sx={{ fontSize: 12, color: COLORS.secondary }} /></Tooltip>
                    </Box>
                    <Box sx={{ position: 'relative', px: 1 }}>
                      <Slider size="small" value={layoutOptions.repulsion} min={-5000} max={-100} step={100}
                        onChange={(e, v) => setLayoutOptions(prev => ({ ...prev, repulsion: v }))} color="secondary" />
                      {analysisResult?.suggestedRepulsion && (
                        <>
                          <Box sx={{ 
                            position: 'absolute', 
                            left: `${Math.min(((layoutOptions.repulsion - (-5000)) / 4900) * 100, ((analysisResult.suggestedRepulsion - (-5000)) / 4900) * 100)}%`,
                            width: `${Math.abs(layoutOptions.repulsion - analysisResult.suggestedRepulsion) / 4900 * 100}%`,
                            height: '1px', bgcolor: `${COLORS.secondary}66`, top: '42%', pointerEvents: 'none'
                          }} />
                          <Box sx={{ 
                            position: 'absolute', 
                            left: `${((analysisResult.suggestedRepulsion - (-5000)) / 4900) * 100}%`, 
                            top: '42%', transform: 'translate(-50%, -50%)',
                            width: 2, height: 10, bgcolor: COLORS.secondary, borderRadius: '1px', pointerEvents: 'none', zIndex: 1
                          }} />
                        </>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>GRAVITY: {layoutOptions.gravityX.toFixed(2)}</Typography>
                      {analysisResult?.suggestedGravity && (
                        <Typography variant="caption" sx={{ color: COLORS.secondary, fontSize: '9px', fontWeight: 'bold' }}>
                          {analysisResult.suggestedGravity > layoutOptions.gravityX ? '→ +' : '← '}{(analysisResult.suggestedGravity - layoutOptions.gravityX).toFixed(2)}
                        </Typography>
                      )}
                      <Tooltip title="AI Influenced"><Icons.Psychology sx={{ fontSize: 12, color: COLORS.secondary }} /></Tooltip>
                    </Box>
                    <Box sx={{ position: 'relative', px: 1 }}>
                      <Slider size="small" value={layoutOptions.gravityX} min={0} max={0.5} step={0.01}
                        onChange={(e, v) => setLayoutOptions(prev => ({ ...prev, gravityX: v, gravityY: v }))} color="secondary" />
                      {analysisResult?.suggestedGravity && (
                        <>
                          <Box sx={{ 
                            position: 'absolute', 
                            left: `${Math.min((layoutOptions.gravityX / 0.5) * 100, (analysisResult.suggestedGravity / 0.5) * 100)}%`,
                            width: `${Math.abs(layoutOptions.gravityX - analysisResult.suggestedGravity) / 0.5 * 100}%`,
                            height: '1px', bgcolor: `${COLORS.secondary}66`, top: '42%', pointerEvents: 'none'
                          }} />
                          <Box sx={{ 
                            position: 'absolute', 
                            left: `${(analysisResult.suggestedGravity / 0.5) * 100}%`, 
                            top: '42%', transform: 'translate(-50%, -50%)',
                            width: 2, height: 10, bgcolor: COLORS.secondary, borderRadius: '1px', pointerEvents: 'none', zIndex: 1
                          }} />
                        </>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>COLLISION: {layoutOptions.collisionRadius}</Typography>
                      {analysisResult?.suggestedCollision && (
                        <Typography variant="caption" sx={{ color: COLORS.secondary, fontSize: '9px', fontWeight: 'bold' }}>
                          {analysisResult.suggestedCollision > layoutOptions.collisionRadius ? '→ +' : '← '}{analysisResult.suggestedCollision - layoutOptions.collisionRadius}
                        </Typography>
                      )}
                      <Tooltip title="AI Influenced"><Icons.Psychology sx={{ fontSize: 12, color: COLORS.secondary }} /></Tooltip>
                    </Box>
                    <Box sx={{ position: 'relative', px: 1 }}>
                      <Slider size="small" value={layoutOptions.collisionRadius} min={20} max={200} step={5}
                        onChange={(e, v) => setLayoutOptions(prev => ({ ...prev, collisionRadius: v }))} color="secondary" />
                      {analysisResult?.suggestedCollision && (
                        <>
                          <Box sx={{ 
                            position: 'absolute', 
                            left: `${Math.min(((layoutOptions.collisionRadius - 20) / 180) * 100, ((analysisResult.suggestedCollision - 20) / 180) * 100)}%`,
                            width: `${Math.abs(layoutOptions.collisionRadius - analysisResult.suggestedCollision) / 180 * 100}%`,
                            height: '1px', bgcolor: `${COLORS.secondary}66`, top: '42%', pointerEvents: 'none'
                          }} />
                          <Box sx={{ 
                            position: 'absolute', 
                            left: `${((analysisResult.suggestedCollision - 20) / 180) * 100}%`, 
                            top: '42%', transform: 'translate(-50%, -50%)',
                            width: 2, height: 10, bgcolor: COLORS.secondary, borderRadius: '1px', pointerEvents: 'none', zIndex: 1
                          }} />
                        </>
                      )}
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>FRICTION: {layoutOptions.friction.toFixed(2)}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.friction} min={0.1} max={0.9} step={0.05}
                        onChange={(e, v) => setLayoutOptions(prev => ({ ...prev, friction: v }))} color="secondary" />
                    </Box>
                  </Box>
                </Box>
              )}

              {activeLayout === 'hierarchical' && (
                <Box>
                  <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1 }}>
                    <TreeIcon sx={{ fontSize: 14, color: COLORS.primary }} /> TREE SETUP
                  </Typography>

                  <Box sx={{ mb: 1.5, p: 1, borderRadius: 1, bgcolor: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '8px', display: 'block', mb: 0.5 }}>ACTIVE ROOT</Typography>
                    <Typography variant="caption" sx={{ color: COLORS.primary, fontSize: '10px', fontWeight: 'bold' }}>
                      {activeRootNodeId ? (nodes.find(n => n.id === activeRootNodeId)?.data.label || activeRootNodeId) : 'Auto-Calculated'}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>RANKER ALGORITHM</Typography>
                      <Tooltip title="AI Influenced"><Icons.Psychology sx={{ fontSize: 12, color: COLORS.secondary }} /></Tooltip>
                    </Box>
                    <Select
                      size="small"
                      value={layoutOptions.ranker || 'network-simplex'}
                      onChange={(e) => {
                        console.log("RANKER CHANGE:", e.target.value);
                        setLayoutOptions(prev => ({ ...prev, ranker: e.target.value }));
                        setLayoutTrigger(prev => prev + 1);
                      }}
                      fullWidth
                      sx={{ 
                        fontSize: '9px', height: 26, color: COLORS.secondary,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <MenuItem value="network-simplex" sx={{ fontSize: '10px' }}>Network Simplex</MenuItem>
                      <MenuItem value="tight-tree" sx={{ fontSize: '10px' }}>Tight Tree</MenuItem>
                      <MenuItem value="longest-path" sx={{ fontSize: '10px' }}>Longest Path</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>NODE ALIGNMENT</Typography>
                      <Tooltip title="AI Influenced"><Icons.Psychology sx={{ fontSize: 12, color: COLORS.secondary }} /></Tooltip>
                    </Box>
                    <Select
                      size="small"
                      value={layoutOptions.align || 'UL'}
                      onChange={(e) => {
                        setLayoutOptions(prev => ({ ...prev, align: e.target.value }));
                        setLayoutTrigger(prev => prev + 1);
                      }}
                      fullWidth
                      sx={{ 
                        fontSize: '9px', height: 26, color: COLORS.secondary,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <MenuItem value="UL" sx={{ fontSize: '10px' }}>Up-Left (Tight)</MenuItem>
                      <MenuItem value="UR" sx={{ fontSize: '10px' }}>Up-Right</MenuItem>
                      <MenuItem value="DL" sx={{ fontSize: '10px' }}>Down-Left</MenuItem>
                      <MenuItem value="DR" sx={{ fontSize: '10px' }}>Down-Right</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>TREE EDGE STYLE</Typography>
                      <Tooltip title="AI Influenced"><Icons.Psychology sx={{ fontSize: 12, color: COLORS.secondary }} /></Tooltip>
                    </Box>
                    <Select
                      size="small"
                      value={edgePathType}
                      onChange={(e) => {
                        setEdgePathType(e.target.value);
                        setLayoutTrigger(prev => prev + 1);
                      }}
                      fullWidth
                      sx={{ 
                        fontSize: '9px', height: 26, color: COLORS.secondary,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <MenuItem value="bezier" sx={{ fontSize: '10px' }}>Bezier (Curved)</MenuItem>
                      <MenuItem value="simplebezier" sx={{ fontSize: '10px' }}>Simple Bezier</MenuItem>
                      <MenuItem value="straight" sx={{ fontSize: '10px' }}>Straight</MenuItem>
                      <MenuItem value="step" sx={{ fontSize: '10px' }}>Step (Orthogonal)</MenuItem>
                      <MenuItem value="smoothstep" sx={{ fontSize: '10px' }}>Smooth Step</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>TREE DIRECTION</Typography>
                      <Tooltip title="AI Influenced"><Icons.Psychology sx={{ fontSize: 12, color: COLORS.secondary }} /></Tooltip>
                    </Box>
                    <Select
                      size="small"
                      value={layoutOptions.rankDir || 'TB'}
                      onChange={(e) => {
                        setLayoutOptions(prev => ({ ...prev, rankDir: e.target.value }));
                        setLayoutTrigger(prev => prev + 1);
                      }}
                      fullWidth
                      sx={{ 
                        fontSize: '9px', height: 26, color: COLORS.secondary,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <MenuItem value="TB" sx={{ fontSize: '10px' }}>Top to Bottom</MenuItem>
                      <MenuItem value="BT" sx={{ fontSize: '10px' }}>Bottom to Top</MenuItem>
                      <MenuItem value="LR" sx={{ fontSize: '10px' }}>Left to Right</MenuItem>
                      <MenuItem value="RL" sx={{ fontSize: '10px' }}>Right to Left</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>NODE SPACING: {layoutOptions.nodeSpacing}</Typography>
                      {analysisResult?.suggestedNodeSpacing && (
                        <Typography variant="caption" sx={{ color: COLORS.secondary, fontSize: '9px', fontWeight: 'bold' }}>
                          {analysisResult.suggestedNodeSpacing > layoutOptions.nodeSpacing ? '→ +' : '← '}{analysisResult.suggestedNodeSpacing - layoutOptions.nodeSpacing}
                        </Typography>
                      )}
                      <Tooltip title="AI Influenced"><Icons.Psychology sx={{ fontSize: 12, color: COLORS.secondary }} /></Tooltip>
                    </Box>
                    <Box sx={{ position: 'relative', px: 1 }}>
                      <Slider size="small" value={layoutOptions.nodeSpacing} min={1} max={300} step={5}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, nodeSpacing: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                      {analysisResult?.suggestedNodeSpacing && (
                        <>
                          <Box sx={{ 
                            position: 'absolute', 
                            left: `${Math.min(((layoutOptions.nodeSpacing - 1) / 299) * 100, ((analysisResult.suggestedNodeSpacing - 1) / 299) * 100)}%`,
                            width: `${Math.abs(layoutOptions.nodeSpacing - analysisResult.suggestedNodeSpacing) / 299 * 100}%`,
                            height: '1px', bgcolor: `${COLORS.secondary}66`, top: '42%', pointerEvents: 'none'
                          }} />
                          <Box sx={{ 
                            position: 'absolute', 
                            left: `${((analysisResult.suggestedNodeSpacing - 1) / 299) * 100}%`, 
                            top: '42%', transform: 'translate(-50%, -50%)',
                            width: 2, height: 10, bgcolor: COLORS.secondary, borderRadius: '1px', pointerEvents: 'none', zIndex: 1
                          }} />
                        </>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>RANK SPACING: {layoutOptions.rankSpacing}</Typography>
                      {analysisResult?.suggestedRankSpacing && (
                        <Typography variant="caption" sx={{ color: COLORS.secondary, fontSize: '9px', fontWeight: 'bold' }}>
                          {analysisResult.suggestedRankSpacing > layoutOptions.rankSpacing ? '→ +' : '← '}{analysisResult.suggestedRankSpacing - layoutOptions.rankSpacing}
                        </Typography>
                      )}
                      <Tooltip title="AI Influenced"><Icons.Psychology sx={{ fontSize: 12, color: COLORS.secondary }} /></Tooltip>
                    </Box>
                    <Box sx={{ position: 'relative', px: 1 }}>
                      <Slider size="small" value={layoutOptions.rankSpacing} min={10} max={400} step={5}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, rankSpacing: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                      {analysisResult?.suggestedRankSpacing && (
                        <>
                          <Box sx={{ 
                            position: 'absolute', 
                            left: `${Math.min(((layoutOptions.rankSpacing - 10) / 390) * 100, ((analysisResult.suggestedRankSpacing - 10) / 390) * 100)}%`,
                            width: `${Math.abs(layoutOptions.rankSpacing - analysisResult.suggestedRankSpacing) / 390 * 100}%`,
                            height: '1px', bgcolor: `${COLORS.secondary}66`, top: '42%', pointerEvents: 'none'
                          }} />
                          <Box sx={{ 
                            position: 'absolute', 
                            left: `${((analysisResult.suggestedRankSpacing - 10) / 390) * 100}%`, 
                            top: '42%', transform: 'translate(-50%, -50%)',
                            width: 2, height: 10, bgcolor: COLORS.secondary, borderRadius: '1px', pointerEvents: 'none', zIndex: 1
                          }} />
                        </>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}

              {activeLayout === 'circular' && (
                <Box>
                  <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1 }}>
                    <CircularIcon sx={{ fontSize: 14, color: COLORS.secondary }} /> CIRCULAR SETUP
                  </Typography>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>RADIUS: {layoutOptions.radius}</Typography>
                    <Slider size="small" value={layoutOptions.radius} min={100} max={2000} step={50}
                      onChange={(e, v) => {
                        setLayoutOptions(prev => ({ ...prev, radius: v }));
                        setLayoutTrigger(prev => prev + 1);
                      }} color="secondary" />
                  </Box>

                  <Box>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>SORTING</Typography>
                    <Select
                      size="small"
                      value={layoutOptions.circularSort || 'standard'}
                      onChange={(e) => {
                        setLayoutOptions(prev => ({ ...prev, circularSort: e.target.value }));
                        setLayoutTrigger(prev => prev + 1);
                      }}
                      fullWidth
                      sx={{ 
                        fontSize: '9px', height: 26, color: COLORS.secondary,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <MenuItem value="standard" sx={{ fontSize: '10px' }}>Standard</MenuItem>
                      <MenuItem value="byType" sx={{ fontSize: '10px' }}>By Type</MenuItem>
                      <MenuItem value="byImportance" sx={{ fontSize: '10px' }}>By Importance</MenuItem>
                      <MenuItem value="byEra" sx={{ fontSize: '10px' }}>By Era</MenuItem>
                    </Select>
                  </Box>
                </Box>
              )}

              {activeLayout === 'hive' && (
                <Box>
                  <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1 }}>
                    <HiveIcon sx={{ fontSize: 14, color: COLORS.secondary }} /> HIVE SETUP
                  </Typography>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>INNER RADIUS: {layoutOptions.hiveInnerRadius}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.hiveInnerRadius} min={50} max={1000} step={25}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, hiveInnerRadius: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                    </Box>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>AXIS LENGTH: {layoutOptions.hiveAxisLength}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.hiveAxisLength} min={200} max={3000} step={100}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, hiveAxisLength: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                    </Box>
                  </Box>
                </Box>
              )}

              {activeLayout === 'bundled' && (
                <Box>
                  <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1 }}>
                    <BundledIcon sx={{ fontSize: 14, color: COLORS.secondary }} /> BUNDLED SETUP
                  </Typography>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>RADIUS: {layoutOptions.radius}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.radius} min={100} max={2000} step={50}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, radius: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                    </Box>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>BUNDLING TENSION: {layoutOptions.bundlingTension.toFixed(2)}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.bundlingTension} min={0} max={2.5} step={0.05}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, bundlingTension: v }));
                        }} color="secondary" />
                    </Box>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>GROUP GAP: {layoutOptions.groupGap.toFixed(2)}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.groupGap} min={0.01} max={1.5} step={0.05}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, groupGap: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                    </Box>
                  </Box>
                </Box>
              )}

              {activeLayout === 'orthogonal' && (
                <Box>
                  <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1 }}>
                    <OrthogonalIcon sx={{ fontSize: 14, color: COLORS.secondary }} /> ORTHOGONAL SETUP
                  </Typography>
                  
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>DIRECTION</Typography>
                    <Select
                      size="small"
                      value={layoutOptions.elkDirection || 'RIGHT'}
                      onChange={(e) => {
                        setLayoutOptions(prev => ({ ...prev, elkDirection: e.target.value }));
                        setLayoutTrigger(prev => prev + 1);
                      }}
                      fullWidth
                      sx={{ 
                        fontSize: '9px', height: 26, color: COLORS.secondary,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <MenuItem value="RIGHT" sx={{ fontSize: '10px' }}>Left to Right</MenuItem>
                      <MenuItem value="DOWN" sx={{ fontSize: '10px' }}>Top to Bottom</MenuItem>
                      <MenuItem value="UP" sx={{ fontSize: '10px' }}>Bottom to Top</MenuItem>
                      <MenuItem value="LEFT" sx={{ fontSize: '10px' }}>Right to Left</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>NODE SPACING: {layoutOptions.elkNodeSpacing}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.elkNodeSpacing} min={20} max={300} step={10}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, elkNodeSpacing: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>LAYER SPACING: {layoutOptions.elkLayerSpacing}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.elkLayerSpacing} min={20} max={400} step={10}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, elkLayerSpacing: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>PLACEMENT STRATEGY</Typography>
                    <Select
                      size="small"
                      value={layoutOptions.elkPlacementStrategy || 'BRANDES_KOEPF'}
                      onChange={(e) => {
                        setLayoutOptions(prev => ({ ...prev, elkPlacementStrategy: e.target.value }));
                        setLayoutTrigger(prev => prev + 1);
                      }}
                      fullWidth
                      sx={{ 
                        fontSize: '9px', height: 26, color: COLORS.secondary,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <MenuItem value="BRANDES_KOEPF" sx={{ fontSize: '10px' }}>Brandes Koepf (Clean)</MenuItem>
                      <MenuItem value="SIMPLE" sx={{ fontSize: '10px' }}>Simple</MenuItem>
                      <MenuItem value="LINEAR_SEGMENTS" sx={{ fontSize: '10px' }}>Linear Segments</MenuItem>
                      <MenuItem value="NETWORK_SIMPLEX" sx={{ fontSize: '10px' }}>Network Simplex</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>CROSSING MINIMIZATION</Typography>
                    <Select
                      size="small"
                      value={layoutOptions.elkCrossingStrategy || 'LAYER_SWEEP'}
                      onChange={(e) => {
                        setLayoutOptions(prev => ({ ...prev, elkCrossingStrategy: e.target.value }));
                        setLayoutTrigger(prev => prev + 1);
                      }}
                      fullWidth
                      sx={{ 
                        fontSize: '9px', height: 26, color: COLORS.secondary,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <MenuItem value="LAYER_SWEEP" sx={{ fontSize: '10px' }}>Layer Sweep</MenuItem>
                      <MenuItem value="CROSS_COUNT" sx={{ fontSize: '10px' }}>Cross Count</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>LAYERING STRATEGY</Typography>
                    <Select
                      size="small"
                      value={layoutOptions.elkLayeringStrategy || 'NETWORK_SIMPLEX'}
                      onChange={(e) => {
                        setLayoutOptions(prev => ({ ...prev, elkLayeringStrategy: e.target.value }));
                        setLayoutTrigger(prev => prev + 1);
                      }}
                      fullWidth
                      sx={{ 
                        fontSize: '9px', height: 26, color: COLORS.secondary,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <MenuItem value="NETWORK_SIMPLEX" sx={{ fontSize: '10px' }}>Network Simplex</MenuItem>
                      <MenuItem value="LONGEST_PATH" sx={{ fontSize: '10px' }}>Longest Path</MenuItem>
                      <MenuItem value="COFFMAN_GRAHAM" sx={{ fontSize: '10px' }}>Coffman Graham</MenuItem>
                    </Select>
                  </Box>
                </Box>
              )}

              {activeLayout === 'arc' && (
                <Box>
                  <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1 }}>
                    <ArcIcon sx={{ fontSize: 14, color: COLORS.secondary }} /> ARC SETUP
                  </Typography>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>SORTING</Typography>
                    <Select
                      size="small"
                      value={layoutOptions.arcSort || 'type'}
                      onChange={(e) => {
                        setLayoutOptions(prev => ({ ...prev, arcSort: e.target.value }));
                        setLayoutTrigger(prev => prev + 1);
                      }}
                      fullWidth
                      sx={{ 
                        fontSize: '9px', height: 26, color: COLORS.secondary,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <MenuItem value="lexical" sx={{ fontSize: '10px' }}>Lexical (A-Z)</MenuItem>
                      <MenuItem value="type" sx={{ fontSize: '10px' }}>By Type / Planet</MenuItem>
                      <MenuItem value="importance" sx={{ fontSize: '10px' }}>By Importance</MenuItem>
                      <MenuItem value="era" sx={{ fontSize: '10px' }}>Chronological (Era)</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>ARC DIRECTION</Typography>
                    <Select
                      size="small"
                      value={layoutOptions.arcDirection || 'both'}
                      onChange={(e) => {
                        setLayoutOptions(prev => ({ ...prev, arcDirection: e.target.value }));
                      }}
                      fullWidth
                      sx={{ 
                        fontSize: '9px', height: 26, color: COLORS.secondary,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <MenuItem value="up" sx={{ fontSize: '10px' }}>Up (Above)</MenuItem>
                      <MenuItem value="down" sx={{ fontSize: '10px' }}>Down (Below)</MenuItem>
                      <MenuItem value="both" sx={{ fontSize: '10px' }}>Both (Smart)</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>IMPORTANCE WEIGHT: {layoutOptions.arcImportanceWeight?.toFixed(1)}x</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.arcImportanceWeight || 2.0} min={0.1} max={5.0} step={0.1}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, arcImportanceWeight: v }));
                        }} color="secondary" />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          size="small" 
                          checked={layoutOptions.arcUseSystemColor || false}
                          onChange={(e) => setLayoutOptions(prev => ({ ...prev, arcUseSystemColor: e.target.checked }))}
                          sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: COLORS.secondary } }}
                        />
                      }
                      label={<Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>USE SYSTEM COLORS (SINGLE)</Typography>}
                    />
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>LINEAR GAP: {layoutOptions.nodeSpacing}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.nodeSpacing} min={50} max={400} step={10}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, nodeSpacing: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                    </Box>
                  </Box>
                </Box>
              )}

              {activeLayout === 'narrative' && (
                <Box>
                  <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1 }}>
                    <HistoryIcon sx={{ fontSize: 14, color: COLORS.secondary }} /> NARRATIVE SETUP
                  </Typography>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>ERA SPACING: {layoutOptions.eraSpacing}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.eraSpacing} min={200} max={1500} step={50}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, eraSpacing: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>LANE SPACING: {layoutOptions.laneSpacing}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.laneSpacing} min={100} max={800} step={25}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, laneSpacing: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                    </Box>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>STACK SPACING: {layoutOptions.nodeSpacingY}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.nodeSpacingY} min={20} max={300} step={10}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, nodeSpacingY: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                    </Box>
                  </Box>
                </Box>
              )}

              {activeLayout === 'biofabric' && (
                <Box>
                  <Typography variant="body2" sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', gap: 1, letterSpacing: 1 }}>
                    <BioFabricIcon sx={{ fontSize: 14, color: COLORS.secondary }} /> BIOFABRIC SETUP
                  </Typography>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>SORTING</Typography>
                    <Select
                      size="small"
                      value={layoutOptions.bioFabricSort || 'importance'}
                      onChange={(e) => {
                        setLayoutOptions(prev => ({ ...prev, bioFabricSort: e.target.value }));
                        setLayoutTrigger(prev => prev + 1);
                      }}
                      fullWidth
                      sx={{ 
                        fontSize: '9px', height: 26, color: COLORS.secondary,
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <MenuItem value="type" sx={{ fontSize: '10px' }}>By Type</MenuItem>
                      <MenuItem value="importance" sx={{ fontSize: '10px' }}>By Importance</MenuItem>
                      <MenuItem value="activity" sx={{ fontSize: '10px' }}>By Activity</MenuItem>
                      <MenuItem value="era" sx={{ fontSize: '10px' }}>By Era</MenuItem>
                    </Select>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          size="small" 
                          checked={layoutOptions.bioFabricUseSystemColor || false}
                          onChange={(e) => setLayoutOptions(prev => ({ ...prev, bioFabricUseSystemColor: e.target.checked }))}
                          sx={{ color: 'rgba(255,255,255,0.2)', '&.Mui-checked': { color: COLORS.secondary } }}
                        />
                      }
                      label={<Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px' }}>USE SYSTEM COLORS (SINGLE)</Typography>}
                    />
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>ROW SPACING: {layoutOptions.bioFabricRowSpacing}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.bioFabricRowSpacing} min={10} max={100} step={5}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, bioFabricRowSpacing: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                    </Box>
                  </Box>
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', display: 'block', mb: 0.5 }}>COL SPACING: {layoutOptions.bioFabricColSpacing}</Typography>
                    <Box sx={{ px: 1 }}>
                      <Slider size="small" value={layoutOptions.bioFabricColSpacing} min={5} max={50} step={1}
                        onChange={(e, v) => {
                          setLayoutOptions(prev => ({ ...prev, bioFabricColSpacing: v }));
                          setLayoutTrigger(prev => prev + 1);
                        }} color="secondary" />
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            <Divider sx={{ mt: 1, borderColor: 'rgba(255,255,255,0.05)' }} />

            {/* Action Area: Export/Import Config */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" size="small" fullWidth
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(layoutOptions, null, 2));
                  setStatusParts([{ trigger: 'INFO', action: 'Config copied' }]);
                  setTimeout(() => setStatusParts([]), 2000);
                }}
                sx={{ fontSize: '0.65rem', textTransform: 'none', borderRadius: 1.5, borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
                startIcon={<Icons.ContentCopy sx={{ fontSize: 12 }} />}
              >
                Copy
              </Button>
              <Button 
                variant="outlined" size="small" fullWidth
                onClick={() => {
                  const json = window.prompt("Paste Layout JSON here:");
                  if (json) {
                    try {
                      const cfg = JSON.parse(json);
                      setLayoutOptions(prev => ({ ...prev, ...cfg }));
                      setStatusParts([{ trigger: 'INFO', action: 'Config applied' }]);
                      setTimeout(() => setStatusParts([]), 2000);
                    } catch(e) { alert("Invalid JSON"); }
                  }
                }}
                sx={{ fontSize: '0.65rem', textTransform: 'none', borderRadius: 1.5, borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}
                startIcon={<Icons.FileUpload sx={{ fontSize: 12 }} />}
              >
                Paste
              </Button>
            </Box>
          </Paper>
        )}
      </Box>

      {/* STATUS BAR (BOTTOM) */}
      <Box sx={{ height: statusBarHeight, width: '100%', bgcolor: 'rgba(20, 20, 20, 0.95)', borderTop: `1px solid ${COLORS.panelBorder}`, display: 'flex', alignItems: 'center', pl: 3, pr: 4, zIndex: 1201, gap: 3, justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          {statusParts.map((part, i) => (
            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: '10px', letterSpacing: 1, textTransform: 'uppercase' }}>{part.trigger}:</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 200, fontSize: '10px', letterSpacing: 0.5 }}>{part.action}</Typography>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', fontWeight: 200, fontSize: '10px', letterSpacing: 1 }}>DATABASE</Typography>
          <Box 
            onMouseEnter={() => setStatusParts([{ trigger: 'STATUS', action: `Database is currently ${dbStatus.toUpperCase()}` }])}
            onMouseLeave={() => setStatusParts([])}
            sx={{ 
              width: 8, height: 8, borderRadius: '50%', 
              bgcolor: dbStatus === 'online' ? '#4caf50' : dbStatus === 'offline' ? '#f44336' : '#ff9800',
              transition: 'all 0.3s ease'
            }} 
          />
        </Box>
      </Box>

                      <Drawer anchor="right" open={(!!selectedNode && isNodeSidebarOpen) || !!selectedEdge || !!previewData || !!pendingConnection} onClose={handleDrawerClose} variant="temporary" sx={{ width: 350, '& .MuiDrawer-paper': { width: 350, borderLeft: `4px solid ${sidebarColor}`, boxShadow: -5, bgcolor: COLORS.paper, overflow: 'hidden' } }}>
                        <Box sx={{ p: 3, pb: 5, height: '100vh', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
                          <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '4px' } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                    <Avatar sx={{ bgcolor: sidebarColor, width: 64, height: 64, boxShadow: '0 0 20px ' + sidebarColor + '44' }}>
                                                      {selectedNode ? React.createElement(Icons[selectedNode.data.icon] || Icons.HelpOutline, { sx: { fontSize: 32, color: '#fff' } }) : (selectedEdge || pendingConnection) ? <Icons.Link sx={{ fontSize: 32, color: '#fff' }} /> : <GroupIcon sx={{ fontSize: 32, color: '#fff' }} />}
                                                    </Avatar>
                                  
                                                                      {(selectedNode || selectedEdge || pendingConnection) && (
                                                                        <Tooltip title={pendingConnection ? "Define Relationship" : (selectedEdge ? (isEditingEdge ? "View Info" : "Edit Relationship") : (isEditingNode ? "View Info" : "Edit Properties"))}>
                                                                          <span>
                                                                            <IconButton 
                                                                              onClick={() => {
                                                                                if (pendingConnection) return;
                                                                                if (selectedEdge) {
                                                                                  if (!isEditingEdge) {
                                                                                    setEdgeEditSnapshot({ ...selectedEdge.data });
                                                                                  } else {
                                                                                    setEdgeEditSnapshot(null);
                                                                                  }
                                                                                  setIsEditingEdge(!isEditingEdge);
                                                                                } else {
                                                                                                                if (!isEditingNode) {
                                                                                                                  setEditSnapshot({ ...selectedNode.data });
                                                                                                                } else {
                                                                                                                  setEditSnapshot(null);
                                                                                                                }
                                                                                  
                                                                                  setIsEditingNode(!isEditingNode);
                                                                                }
                                                                              }} 
                                                                              onMouseEnter={() => setStatusParts([
                                                                                { trigger: 'CLICK', action: (isEditingNode || isEditingEdge) ? 'View Information' : 'Edit Properties' },
                                                                                { trigger: 'ESC', action: 'Cancel / Revert' }
                                                                              ])}
                                                                              onMouseLeave={() => setStatusParts([])}
                                                                              disabled={!!pendingConnection}
                                                                              sx={{ bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: (isEditingNode || isEditingEdge) ? `${COLORS.secondary}22` : `${COLORS.primary}22` } }}
                                                                            >
                                                                              {(isEditingNode || isEditingEdge) ? <Icons.Visibility sx={{ fontSize: 20, color: COLORS.secondary }} /> : <Icons.Edit sx={{ fontSize: 20, color: COLORS.primary }} />}
                                                                            </IconButton>
                                                                          </span>
                                                                        </Tooltip>
                                                                      )}
                                                    
                                                </Box>
              <IconButton onClick={() => closeSidebar()}><CloseIcon /></IconButton>
            </Box>

            {selectedNode && isEditingNode ? (
              <>
                <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 'bold', letterSpacing: 1, display: 'block', mb: 2 }}>EDIT ENTITY</Typography>
                <TextField
                  fullWidth label="Label" variant="outlined" size="small"
                  autoFocus
                  placeholder="Enter name..."
                  value={selectedNode.data.label || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
                  onMouseEnter={() => setStatusParts([
                    { trigger: 'ESC', action: 'Cancel' },
                    { trigger: 'ENTER', action: 'Save & Close' }
                  ])}
                  onMouseLeave={() => setStatusParts([])}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter') closeSidebar(); 
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth label="Description" variant="outlined" size="small" multiline rows={4}
                  placeholder="Enter details..."
                  value={selectedNode.data.description || ''}
                  onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
                  onMouseEnter={() => setStatusParts([
                    { trigger: 'ESC', action: 'Cancel' },
                    { trigger: 'CTRL+ENTER', action: 'Save & Close' }
                  ])}
                  onMouseLeave={() => setStatusParts([])}
                  onKeyDown={(e) => { 
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) closeSidebar(); 
                    if (e.key === 'Escape') cancelEditing();
                  }}
                  sx={{ mb: 3 }}
                  />

                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 1, display: 'block' }}>IMPORTANCE (NODE SIZE)</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, px: 1 }}>
                  <Slider
                    size="small"
                    value={selectedNode.data.importance ?? 0.5}
                    min={0.1}
                    max={1}
                    step={0.05}
                    onChange={(e, val) => updateNodeData(selectedNode.id, { importance: val })}
                    sx={{ color: COLORS.primary }}
                    onMouseEnter={() => setStatusParts([{ trigger: 'SLIDE', action: 'Set Base Importance / Visual Scale' }])}
                    onMouseLeave={() => setStatusParts([])}
                  />
                  <Typography variant="body2" sx={{ minWidth: 32, textAlign: 'right', color: 'rgba(255,255,255,0.7)', fontWeight: 'bold' }}>
                    {Math.round((selectedNode.data.importance ?? 0.5) * 100)}%
                  </Typography>
                  </Box>

                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 1, display: 'block' }}>CHOOSE ICON</Typography>                                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                                    {['Person', 'Android', 'Public', 'Science', 'AutoStories', 'Psychology', 'Hub', 'Star'].map(iconName => (
                                      <IconButton 
                                        key={iconName} size="small" 
                                        onClick={() => updateNodeData(selectedNode.id, { icon: iconName })}
                                        onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: `Set Icon to ${iconName}` }])}
                                        onMouseLeave={() => setStatusParts([])}
                                        sx={{ 
                                          bgcolor: selectedNode.data.icon === iconName ? `${COLORS.primary}22` : 'transparent',
                                          border: `1px solid ${selectedNode.data.icon === iconName ? COLORS.primary : 'rgba(255,255,255,0.1)'}`,
                                          color: selectedNode.data.icon === iconName ? COLORS.primary : 'rgba(255,255,255,0.5)'
                                        }}
                                      >
                                        {React.createElement(Icons[iconName], { sx: { fontSize: 18 } })}
                                      </IconButton>
                                    ))}
                                  </Box>
                
                                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 1, display: 'block' }}>PROPERTIES</Typography>
                                  {Object.entries(selectedNode.data || {})
                                    .filter(([key]) => !['label', 'description', 'icon', 'type', 'donut', 'isNew', 'isDraft', 'score', 'onSegmentClick', 'showDonuts', 'isEdgeCreationMode', 'category'].includes(key))
                                    .map(([key, value]) => (
                                      <TextField
                                        key={key}
                                        fullWidth label={key.charAt(0).toUpperCase() + key.slice(1)}
                                        variant="outlined" size="small"
                                        value={value || ''}
                                        onChange={(e) => updateNodeData(selectedNode.id, { [key]: e.target.value })}
                                        onKeyDown={(e) => { 
                                          if (e.key === 'Enter') closeSidebar(); 
                                          if (e.key === 'Escape') cancelEditing(); 
                                        }}
                                        sx={{ mb: 2 }}
                                      />
                                    ))
                                  }
                
                                  <Button 
                 
                  variant="outlined" 
                  color="error" 
                  fullWidth 
                  startIcon={<Icons.DeleteForever />} 
                  onClick={() => deleteNodePermanently(selectedNode.id)}
                  onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Permanent Database Deletion' }, { trigger: 'ESC', action: 'Cancel' }])}
                  onMouseLeave={() => setStatusParts([])}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', mb: 2, borderColor: 'rgba(211, 47, 47, 0.3)' }}
                >
                  Delete from Database
                </Button>
              </>
                          ) : pendingConnection ? (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>New Connection</Typography>
                  <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}>
                    Define the relationship between <b>{nodes.find(n => n.id === pendingConnection.source)?.data.label || 'Source'}</b> and <b>{nodes.find(n => n.id === pendingConnection.target)?.data.label || 'Target'}</b>:
                  </Typography>
                  <List>
                    {['RELATES_TO', 'RULES', 'CONQUERED', 'PROTECTS', 'GUIDES', 'LIVES_ON', 'CREATED', 'TRAVELS_WITH', 'FOLLOWS'].map(type => (
                      <ListItemButton 
                        key={type} 
                        onClick={() => confirmConnection(type)}
                        onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: `Define Relationship Type: ${type}` }])}
                        onMouseLeave={() => setStatusParts([])}
                        sx={{ 
                          borderRadius: 2, mb: 1, 
                          bgcolor: 'rgba(255,255,255,0.03)', 
                          border: '1px solid rgba(255,255,255,0.05)',
                          '&:hover': { bgcolor: `${COLORS.primary}22`, borderColor: COLORS.primary } 
                        }}
                      >
                        <ListItemIcon><Icons.AddLink sx={{ color: COLORS.primary }} /></ListItemIcon>
                        <ListItemText primary={type.replace("_", " ")} primaryTypographyProps={{ style: { fontWeight: 'bold', fontSize: '0.9rem' } }} />
                      </ListItemButton>
                    ))}
                  </List>
                  <Button 
                    variant="outlined" fullWidth onClick={() => setPendingConnection(null)}
                    onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Discard New Connection' }])}
                    onMouseLeave={() => setStatusParts([])}
                    sx={{ mt: 2, borderRadius: 2, color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.2)', textTransform: 'none' }}
                  >
                    Cancel
                  </Button>
                </>
              ) : selectedEdge && (selectedEdge.data?.type === 'PATH' || selectedEdge.data?.type === 'DIRECT_RELATION') ? (
                <>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>Pfad</Typography>
                  <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Typography variant="body2" sx={{ mb: 3, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                    Dieser Pfad überbrückt {selectedEdge.data.length} Sprünge in der Datenbank.
                  </Typography>

                  <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 'bold', letterSpacing: 1, display: 'block', mb: 1 }}>PFAD-SEQUENZ</Typography>
                  <List sx={{ pt: 0 }}>
                    {(() => {
                      const pathNodes = selectedEdge.data.fullPathNodes || [];
                      const pathRels = selectedEdge.data.fullPathEdges || [];
                      const items = [];

                      pathNodes.forEach((nodeInfo, idx) => {
                        const id = nodeInfo.id;
                        const isOnStage = nodes.some(n => n.id === id);
                        
                        // Knoten-Eintrag
                        items.push(
                          <ListItem key={`node-${id}-${idx}`} sx={{ px: 0, py: 0.5 }}>
                            <ListItemAvatar sx={{ minWidth: 44 }}>
                              <Avatar sx={{ bgcolor: getHexColor(nodeInfo.type), width: 32, height: 32 }}>
                                {React.createElement(Icons[nodeInfo.icon] || Icons.HelpOutline, { sx: { fontSize: 18, color: '#fff' } })}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText 
                              primary={nodeInfo.label} 
                              secondary={nodeInfo.type} 
                              primaryTypographyProps={{ style: { fontSize: '0.85rem', color: isOnStage ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: 600 } }}
                              secondaryTypographyProps={{ style: { fontSize: '0.65rem' } }}
                            />
                            {!isOnStage && (
                              <ListItemSecondaryAction>
                                <IconButton 
                                  size="small" color="primary" 
                                  onClick={async () => {
                                    const res = await fetch(`http://localhost:8000/expand/${id}`);
                                    const data = await res.json();
                                    const fullNode = data.nodes.find(n => n.id === id);
                                    if (fullNode) addSingleNode(selectedEdge.source, fullNode);
                                  }}
                                >
                                  <AddIcon sx={{ fontSize: 18 }} />
                                </IconButton>
                              </ListItemSecondaryAction>
                            )}
                          </ListItem>
                        );

                        // Wenn es einen nächsten Knoten gibt, zeige die Relation dazwischen
                        if (idx < pathNodes.length - 1) {
                          const rel = pathRels[idx];
                          const relLabel = rel ? rel.type.replace(/_/g, " ").toLowerCase() : "verbindung";
                          
                          // Bestimme Richtung des Pfeils basierend auf DB-Relation
                          // Memgraph gibt start_node_id / end_node_id (interne IDs) zurück.
                          // Für die UI nehmen wir einfach einen Abwärtspfeil, da die Liste chronologisch ist.
                          items.push(
                            <ListItem key={`rel-${idx}`} sx={{ px: 0, py: 0, pl: 2, borderLeft: `2px dashed ${COLORS.secondary}44`, ml: 2, my: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                                <ArrowDownwardIcon sx={{ fontSize: 16, color: COLORS.secondary, mr: 1, opacity: 0.7 }} />
                                <Typography variant="caption" sx={{ fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                                  {relLabel}
                                </Typography>
                              </Box>
                            </ListItem>
                          );
                        }
                      });

                      return items;
                    })()}
                  </List>
                </>
              ) : selectedEdge && isEditingEdge ? (
                <>
                  <Typography variant="caption" sx={{ color: COLORS.primary, fontWeight: 'bold', letterSpacing: 1, display: 'block', mb: 2 }}>EDIT RELATIONSHIP</Typography>
                  <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                    <InputLabel id="rel-type-label" sx={{ color: 'rgba(255,255,255,0.5)' }}>Relationship Type</InputLabel>
                    <Select
                      labelId="rel-type-label"
                      value={selectedEdge.data?.type || 'RELATES_TO'}
                      label="Relationship Type"
                      onChange={(e) => updateEdgeData(selectedEdge.id, { type: e.target.value })}
                      sx={{ bgcolor: 'rgba(255,255,255,0.03)', color: '#fff' }}
                    >
                      {['RELATES_TO', 'RULES', 'CONQUERED', 'PROTECTS', 'GUIDES', 'LIVES_ON', 'CREATED', 'TRAVELS_WITH', 'FOLLOWS'].map(t => (
                        <MenuItem key={t} value={t}>{t.replace("_", " ")}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 1, display: 'block' }}>PROPERTIES</Typography>
                  {Object.entries(selectedEdge.data || {})
                    .filter(([key]) => !['type', 'isNew'].includes(key))
                    .map(([key, value]) => (
                      <TextField
                        key={key}
                        fullWidth label={key.charAt(0).toUpperCase() + key.slice(1)}
                        variant="outlined" size="small"
                        value={value || ''}
                        onChange={(e) => updateEdgeData(selectedEdge.id, { [key]: e.target.value })}
                        onKeyDown={(e) => { if (e.key === 'Enter') closeSidebar(); if (e.key === 'Escape') cancelEditing(); }}
                        sx={{ mb: 2 }}
                      />
                    ))
                  }

                  <Box sx={{ mt: 2, mb: 3 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', display: 'block', mb: 1 }}>CONNECTED NODES</Typography>
                    <List dense>
                      {(() => {
                        const s = nodes.find(n => n.id === selectedEdge.source);
                        const t = nodes.find(n => n.id === selectedEdge.target);
                        return (
                          <>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon><Icons.ArrowOutward sx={{ color: s ? getHexColor(s.data.type) : 'gray', fontSize: 18 }} /></ListItemIcon>
                              <ListItemText primary="Source" secondary={s?.data.label || selectedEdge.source} primaryTypographyProps={{ variant: 'body2' }} secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' } }} />
                            </ListItem>
                            <ListItem sx={{ px: 0 }}>
                              <ListItemIcon><Icons.ArrowDownward sx={{ color: t ? getHexColor(t.data.type) : 'gray', fontSize: 18 }} /></ListItemIcon>
                              <ListItemText primary="Target" secondary={t?.data.label || selectedEdge.target} primaryTypographyProps={{ variant: 'body2' }} secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' } }} />
                            </ListItem>
                          </>
                        );
                      })()}
                    </List>
                  </Box>

                  <Box sx={{ flexGrow: 1 }} />
                  <Button 
                    variant="outlined" 
                    color="error" 
                    fullWidth 
                    startIcon={<Icons.DeleteForever />} 
                    onClick={() => deleteEdgePermanently(selectedEdge)}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', mb: 2, borderColor: 'rgba(211, 47, 47, 0.3)' }}
                  >
                    Delete Relationship
                  </Button>
                </>
              ) : selectedEdge ? (
                            <>
                              <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>Relationship</Typography>
                              <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                                                <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic', color: 'rgba(255,255,255,0.7)' }}>
                                                  {selectedEdge.label || selectedEdge.data?.type || 'No description available'}
                                                </Typography>
                                                
                                                <List sx={{ mb: 2 }}>
                                                  {Object.entries(selectedEdge.data || {})
                                                    .filter(([key]) => !['type', 'isNew'].includes(key))
                                                    .map(([key, value]) => (
                                                      <ListItem key={key} sx={{ px: 0 }}>
                                                        <ListItemIcon><Icons.InfoOutlined sx={{ color: sidebarColor, fontSize: 20 }} /></ListItemIcon>
                                                        <ListItemText primary={key.charAt(0).toUpperCase() + key.slice(1)} secondary={String(value)} secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.5)' } }} />
                                                      </ListItem>
                                                    ))
                                                  }
                                                </List>
                                                
                                                <Box sx={{ mt: 3 }}>
                              
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', display: 'block', mb: 1 }}>CONNECTED NODES</Typography>
                                <List>
                                  {(() => {
                                    const s = nodes.find(n => n.id === selectedEdge.source);
                                    const t = nodes.find(n => n.id === selectedEdge.target);
                                    return (
                                      <>
                                        <ListItem sx={{ px: 0 }}>
                                          <ListItemIcon><Icons.ArrowOutward sx={{ color: s ? getHexColor(s.data.type) : 'gray' }} /></ListItemIcon>
                                          <ListItemText primary="Source" secondary={s?.data.label || selectedEdge.source} secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.5)' } }} />
                                        </ListItem>
                                        <ListItem sx={{ px: 0 }}>
                                          <ListItemIcon><Icons.ArrowDownward sx={{ color: t ? getHexColor(t.data.type) : 'gray' }} /></ListItemIcon>
                                          <ListItemText primary="Target" secondary={t?.data.label || selectedEdge.target} secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.5)' } }} />
                                        </ListItem>
                                      </>
                                    );
                                  })()}
                                                    </List>
                                                  </Box>
                                                  <Divider sx={{ my: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
                                                  <Button 
                                                    variant="outlined" 
                                                    color="error" 
                                                    fullWidth 
                                                    startIcon={<Icons.DeleteForever />} 
                                                    onClick={() => deleteEdgePermanently(selectedEdge)}
                                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', borderColor: 'rgba(211, 47, 47, 0.3)' }}
                                                  >
                                                    Delete Relationship
                                                  </Button>
                                                </>
                                              ) : selectedNode ? (
                                              <>
                                  <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#fff' }}>{selectedNode.data.label}</Typography>
                                  <Divider sx={{ my: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                                  <ExpandableText text={selectedNode.data.description} />
                                                    <List>
                                                      <ListItem sx={{ px: 0 }}><ListItemIcon><TypeIcon sx={{ color: sidebarColor }} /></ListItemIcon><ListItemText primary="Type" secondary={selectedNode.data.type} secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.5)' } }} /></ListItem>
                                                      <ListItem sx={{ px: 0 }}><ListItemIcon><InfoIcon sx={{ color: sidebarColor }} /></ListItemIcon><ListItemText primary="Importance" secondary={(selectedNode.data.score * 100).toFixed(1) + "%"} secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.5)' } }} /></ListItem>
                                                      
                                                      {/* Dynamische Zusatz-Properties (z.B. Published bei Büchern) */}
                                                      {Object.entries(selectedNode.data || {})
                                                        .filter(([key, value]) => 
                                                          !['label', 'description', 'icon', 'type', 'donut', 'isNew', 'isDraft', 'score', 'onSegmentClick', 'showDonuts', 'isEdgeCreationMode', 'category'].includes(key) && 
                                                          value && value !== 'None' && value !== 'undefined'
                                                        )
                                                        .map(([key, value]) => (
                                                          <ListItem key={key} sx={{ px: 0 }}>
                                                            <ListItemIcon><Icons.InfoOutlined sx={{ color: sidebarColor, fontSize: 20 }} /></ListItemIcon>
                                                            <ListItemText primary={key.charAt(0).toUpperCase() + key.slice(1)} secondary={String(value)} secondaryTypographyProps={{ style: { color: 'rgba(255,255,255,0.5)' } }} />
                                                          </ListItem>
                                                        ))
                                                      }
                                                    </List>
                                  
              </>
            ) : null}

                          {(selectedNode || previewData) && (
                            <>
                              <Typography variant="caption" color="rgba(255,255,255,0.4)" display="block" sx={{ mt: 2, mb: 1, fontWeight: 'bold', letterSpacing: 1 }}>
                                {previewData ? `${previewData.category.toUpperCase()} GROUP` : "NEIGHBORS"}
                              </Typography>
                              <List>
                                {(previewData ? previewData.nodes : selectedNodeNeighbors)
                                  .sort((a, b) => (a.data.type || '').localeCompare(b.data.type || ''))
                                                      .map(node => {
                                                        const sourceId = selectedNode?.id || previewData?.sourceId;
                                                        const relevantEdges = previewData ? previewData.edges : selectedNodeEdges;
                                                        const dbEdge = relevantEdges?.find(e => 
                                                          (e.source === sourceId && e.target === node.id) || 
                                                          (e.source === node.id && e.target === sourceId)
                                                        );
                                                        
                                                        const edgeOnStage = edges.find(e => 
                                                          (e.source === sourceId && e.target === node.id) || 
                                                          (e.source === node.id && e.target === sourceId)
                                                        );
                                                        
                                                        const edgeToDelete = edgeOnStage || dbEdge;
                                                        const isOutgoing = edgeToDelete?.source === sourceId;
                                                        const relationLabel = edgeToDelete?.data?.type?.replace(/_/g, " ").toLowerCase() || node.data.type;
                                  
                                                        return (
                                                          <ListItem key={node.id} sx={{ px: 0 }}>
                                                            <ListItemAvatar><Avatar sx={{ bgcolor: getHexColor(node.data.type), width: 32, height: 32 }}>{React.createElement(Icons[node.data.icon] || Icons.HelpOutline, { sx: { fontSize: 18, color: '#fff' } })}</Avatar></ListItemAvatar>
                                                            <ListItemText 
                                                              primary={node.data.label} 
                                                              secondary={
                                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                  {isOutgoing ? <Icons.ChevronRight sx={{ fontSize: '0.9rem', color: COLORS.primary }} /> : <Icons.ChevronLeft sx={{ fontSize: '0.9rem', color: COLORS.secondary }} />}
                                                                  <Typography component="span" variant="caption" sx={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize', fontStyle: 'italic' }}>
                                                                    {relationLabel}
                                                                  </Typography>
                                                                </Box>
                                                              } 
                                                              primaryTypographyProps={{ style: { fontSize: '0.9rem' } }} 
                                                              secondaryTypographyProps={{ component: 'span' }}
                                                            />
                                                            <ListItemSecondaryAction sx={{ display: 'flex', gap: 0.5 }}>
                                                              {edgeToDelete && (
                                                                <Tooltip title="Delete Relationship Permanently">
                                                                  <IconButton 
                                                                    size="small" 
                                                                    onClick={() => deleteEdgePermanently(edgeToDelete)} 
                                                                    onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Delete Relationship Permanently From DB' }])}
                                                                    onMouseLeave={() => setStatusParts([])}
                                                                    sx={{ color: 'rgba(211, 47, 47, 0.6)', '&:hover': { color: 'error.main' } }}
                                                                  >
                                                                    <Icons.LinkOff sx={{ fontSize: 20 }} />
                                                                  </IconButton>
                                                                </Tooltip>
                                                              )}
                                                              <IconButton 
                                                                edge="end" color="primary" 
                                                                disabled={nodes.some(n => n.id === node.id)} 
                                                                onClick={() => addSingleNode(sourceId, node, dbEdge)}
                                                                onMouseEnter={() => !nodes.some(n => n.id === node.id) && setStatusParts([{ trigger: 'CLICK', action: 'Add Neighbor To Canvas' }])}
                                                                onMouseLeave={() => setStatusParts([])}
                                                              >
                                                                {nodes.some(n => n.id === node.id) ? <CheckIcon sx={{ color: 'success.main' }} /> : <AddIcon />}
                                                              </IconButton>
                                                            </ListItemSecondaryAction>
                                                          </ListItem>
                                                        );
                                                      })}
                                  
                              </List>
                            </>
                          )}
                        </Box>
                                                {selectedNode && (
                                                  <Box sx={{ pt: 2, flexShrink: 0 }}>
                                                    <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                                                    <Button 
                                                      variant="outlined" 
                                                      color="error" 
                                                      fullWidth 
                                                      startIcon={<DeleteIcon />} 
                                                      onClick={onDeleteNode} 
                                                      onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Remove Node From Current View' }])}
                                                      onMouseLeave={() => setStatusParts([])}
                                                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', mb: 1, borderColor: 'rgba(211, 47, 47, 0.5)' }}
                                                    >
                                                      Remove from Canvas
                                                    </Button>
                                                    <Button 
                                                      variant="outlined" 
                                                      color="primary" 
                                                      fullWidth 
                                                      startIcon={<DrillDownIcon />} 
                                                      onClick={onDrillDownToNode} 
                                                      onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Isolate Node (Clear Rest)' }])}
                                                      onMouseLeave={() => setStatusParts([])}
                                                      sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold', borderColor: 'rgba(0, 191, 255, 0.3)' }}
                                                    >
                                                      Drill Down (Isolate)
                                                    </Button>
                                                  </Box>
                                                )}
                                    
                                          </Box>
                </Drawer>

        <Drawer 
          anchor="left" open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} variant="temporary" 
          sx={{ width: isSettingsOpen ? 280 : 0, flexShrink: 0, '& .MuiDrawer-paper': { width: 280, borderRight: `2px solid ${COLORS.panelBorder}`, bgcolor: COLORS.paper, boxShadow: 5, overflow: 'hidden' } }}
        >
          <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS.secondary, letterSpacing: 1 }}>SETTINGS</Typography>
              <IconButton onClick={() => setIsSettingsOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}><ChevronLeftIcon /></IconButton>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 2, letterSpacing: 1 }}>VISUALIZATION RULES</Typography>
            <FormGroup sx={{ px: 1 }}>
              <FormControlLabel
                control={<Switch checked={enableDonuts} onChange={(e) => setEnableDonuts(e.target.checked)} color="secondary" />}
                label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Show Node Donuts</Typography>}
              />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', ml: 4, mb: 2, display: 'block' }}>Display neighbor distribution rings around nodes</Typography>

              <FormControlLabel
                control={
                  <Switch 
                    checked={layoutOptions.enableEdgeHighlightOnHover || false} 
                    onChange={(e) => setLayoutOptions(prev => ({ ...prev, enableEdgeHighlightOnHover: e.target.checked }))} 
                    color="secondary" 
                  />
                }
                label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>Edge Focus on Hover</Typography>}
              />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', ml: 4, mb: 2, display: 'block' }}>Highlight connected edges and dim others when hovering a node</Typography>
              </FormGroup>            
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 1, letterSpacing: 1 }}>GRAVITY (TENSION)</Typography>
            <Box sx={{ px: 2, mt: 1 }}>
              <Slider
                value={layoutSpacing}
                min={0.5} max={2.5} step={0.1}
                onChange={(e, v) => setLayoutSpacing(v)}
                color="secondary"
                valueLabelDisplay="auto"
              />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block', mt: 1 }}>Adjust the tension and spacing between nodes</Typography>

              </Box>

              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 1, mt: 3, display: 'block', letterSpacing: 1 }}>PATH SEARCH DEPTH (MAX HOPS)</Typography>
              <Box sx={{ px: 2, mt: 1 }}>
              <Slider 
                value={maxPathLength} 
                min={1} max={10} step={1}
                onChange={(e, v) => setMaxPathLength(v)}
                color="secondary"
                valueLabelDisplay="auto"
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' }
                ]}
              />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', display: 'block', mt: 1 }}>
                {maxPathLength === 1 
                  ? "Only direct relationships (Blue) are shown." 
                  : `Show paths up to ${maxPathLength} hops deep (Pink).`}
              </Typography>
              </Box>

              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 2, mt: 3, letterSpacing: 1 }}>EDGE PATH STYLE</Typography>
            <FormControl fullWidth size="small" sx={{ px: 1, mt: 1 }}>
              <InputLabel id="edge-style-label" sx={{ ml: 1, color: 'rgba(255,255,255,0.5)' }}>Path Type</InputLabel>
              <Select
                labelId="edge-style-label"
                value={edgePathType}
                label="Path Type"
                onChange={(e) => setEdgePathType(e.target.value)}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.03)',
                  color: '#fff',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' }
                }}
              >
                <MenuItem value="straight">Straight</MenuItem>
                <MenuItem value="bezier">Bezier (Curved)</MenuItem>
                <MenuItem value="step">Step</MenuItem>
                <MenuItem value="smoothstep">Smooth Step</MenuItem>
                <MenuItem value="simplebezier">Simple Bezier</MenuItem>
              </Select>
            </FormControl>
            <Box sx={{ flexGrow: 1 }} />
          </Box>
        </Drawer>

        <Drawer 
          anchor="left" open={isSnapshotsOpen} onClose={() => setIsSnapshotsOpen(false)} variant="temporary" 
          sx={{ width: isSnapshotsOpen ? 320 : 0, flexShrink: 0, '& .MuiDrawer-paper': { width: 320, borderRight: `2px solid ${COLORS.panelBorder}`, bgcolor: COLORS.paper, boxShadow: 5, overflow: 'hidden' } }}
        >
          <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS.secondary, letterSpacing: 1 }}>SNAPSHOTS</Typography>
              <IconButton onClick={() => setIsSnapshotsOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}><ChevronLeftIcon /></IconButton>
            </Box>

            <Button 
              variant="contained" 
              color="secondary" 
              fullWidth 
              startIcon={<SnapshotIcon />} 
              onClick={onSaveSnapshot}
              onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Capture Current Stage State' }])}
              onMouseLeave={() => setStatusParts([])}
              sx={{ mb: 4, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
            >
              Create Snapshot
            </Button>

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 2, letterSpacing: 1 }}>AVAILABLE HISTORY ({snapshots.length})</Typography>
            
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '4px' } }}>
              {snapshots.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 4, opacity: 0.3 }}>
                  <SnapshotIcon sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="body2">No snapshots yet</Typography>
                </Box>
              ) : (
                <List>
                  {snapshots.map((snap) => (
                    <ListItem 
                      key={snap.id} 
                      disablePadding 
                      sx={{ 
                        mb: 2, 
                        flexDirection: 'column', 
                        alignItems: 'stretch',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <Box 
                        onClick={() => onLoadSnapshot(snap)}
                        sx={{ cursor: 'pointer', position: 'relative', width: '100%', pt: '60%', bgcolor: '#000' }}
                      >
                        <img 
                          src={snap.thumbnail} 
                          alt={formatRelativeTime(snap.rawTimestamp || snap.timestamp)} 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      </Box>
                      <Box sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box onClick={() => onLoadSnapshot(snap)} sx={{ cursor: 'pointer', flexGrow: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                            {formatRelativeTime(snap.rawTimestamp || snap.timestamp)}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
                            {snap.nodes.length} nodes, {snap.edges.length} edges
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton 
                            size="small" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              const { thumbnail, ...cleanData } = snap;
                              navigator.clipboard.writeText(JSON.stringify(cleanData, null, 2));
                              setStatusParts([{ trigger: 'INFO', action: 'Snapshot JSON copied to clipboard' }]);
                              setTimeout(() => setStatusParts([]), 2000);
                            }}
                            onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Copy Snapshot JSON' }])}
                            onMouseLeave={() => setStatusParts([])}
                            sx={{ color: 'rgba(255,255,255,0.2)', '&:hover': { color: COLORS.primary } }}
                          >
                            <Icons.ContentCopy fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); onDeleteSnapshot(snap.id); }}
                            onMouseEnter={() => setStatusParts([{ trigger: 'CLICK', action: 'Delete Snapshot Permanently' }])}
                            onMouseLeave={() => setStatusParts([])}
                            sx={{ color: 'rgba(255,255,255,0.2)', '&:hover': { color: 'error.main' } }}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Box>

                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          </Box>
        </Drawer>

        {/* TRAINING ENVIRONMENT DRAWER (AI TRAINING) */}
        <Drawer 
          anchor="left" open={isTrainingOpen} onClose={() => {
            setIsTrainingOpen(false);
            setTrainingUser(null);
            setAnalysisResult(null);
          }} variant="temporary"
          sx={{ width: isTrainingOpen ? 320 : 0, flexShrink: 0, '& .MuiDrawer-paper': { width: 320, borderRight: `2px solid ${COLORS.panelBorder}`, bgcolor: COLORS.paper, boxShadow: 5, overflow: 'hidden' } }}
        >
          <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS.secondary, letterSpacing: 1 }}>AI TRAINING</Typography>
              <IconButton onClick={() => {
                setIsTrainingOpen(false);
                setTrainingUser(null);
                setAnalysisResult(null);
              }} sx={{ color: 'rgba(255,255,255,0.5)' }}><ChevronLeftIcon /></IconButton>
            </Box>

            <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3, pr: 1, '&::-webkit-scrollbar': { width: '4px' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '4px' } }}>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  startIcon={<ForceIcon />}
                  onClick={onLoadTestGraph}
                  sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
                >
                  Load Random Subgraph
                </Button>

                <Button
                  variant="outlined"
                  color="secondary"
                  fullWidth
                  startIcon={<AddIcon />}
                  onClick={onSpawnRandomNode}
                  sx={{ borderRadius: 2, py: 1.5, fontWeight: 'bold' }}
                >
                  Spawn Random Node
                </Button>
                </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

              {/* AI LAYOUT SLOT */}
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 1, display: 'block', letterSpacing: 1 }}>AUSGANGSMATERIAL (AI)</Typography>
                
                {trainingAI ? (
                  <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: `1px solid ${COLORS.secondary}44`, mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 0.5 }}>
                      {trainingAI.nodes.length} nodes, {trainingAI.edges.length} edges
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                      {formatRelativeTime(trainingAI.rawTimestamp)}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.01)', borderRadius: 2, border: `1px dashed rgba(255,255,255,0.2)`, mb: 1.5, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>No AI layout captured yet</Typography>
                  </Box>
                )}
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" color="secondary" size="small" startIcon={<AddIcon />}
                    sx={{ textTransform: 'none', borderRadius: 2, flexGrow: 1 }}
                    onClick={() => {
                      setTrainingAI({
                        nodes: JSON.parse(JSON.stringify(nodesRef.current)),
                        edges: JSON.parse(JSON.stringify(edgesRef.current)),
                        rawTimestamp: Date.now()
                      });
                    }}
                  >
                    Update Ausgangsmaterial
                  </Button>
                  {trainingAI && (
                    <IconButton 
                      size="small" color="secondary" sx={{ border: `1px solid ${COLORS.secondary}44` }}
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(trainingAI, null, 2));
                        setStatusParts([{ trigger: 'INFO', action: 'AI Layout JSON copied to clipboard' }]);
                        setTimeout(() => setStatusParts([]), 2000);
                      }}
                    >
                      <Icons.ContentCopy fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

              {/* USER LAYOUT SLOT */}
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 1, display: 'block', letterSpacing: 1 }}>VERBESSERTES LAYOUT (USER)</Typography>
                
                {trainingUser ? (
                  <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: `1px solid ${COLORS.primary}44`, mb: 1.5 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', display: 'block', mb: 0.5 }}>
                      {trainingUser.nodes.length} nodes, {trainingUser.edges.length} edges
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block' }}>
                      {formatRelativeTime(trainingUser.rawTimestamp)}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ p: 1.5, bgcolor: 'rgba(255,255,255,0.01)', borderRadius: 2, border: `1px dashed rgba(255,255,255,0.2)`, mb: 1.5, textAlign: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>No user layout captured yet</Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" color="primary" size="small" startIcon={<AddIcon />}
                    sx={{ textTransform: 'none', borderRadius: 2, flexGrow: 1 }}
                    onClick={() => {
                      const newUserData = {
                        nodes: JSON.parse(JSON.stringify(nodesRef.current)),
                        edges: JSON.parse(JSON.stringify(edgesRef.current)),
                        rawTimestamp: Date.now()
                      };
                      setTrainingUser(newUserData);
                      
                      // Auto trigger analysis
                      if (trainingAI) {
                        onAnalyzeComparison(trainingAI, newUserData);
                      }
                    }}
                  >
                    Save Snapshot (Analyse)
                  </Button>
                  {trainingUser && (
                    <IconButton 
                      size="small" color="primary" sx={{ border: `1px solid ${COLORS.primary}44` }}
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(trainingUser, null, 2));
                        setStatusParts([{ trigger: 'INFO', action: 'User Layout JSON copied to clipboard' }]);
                        setTimeout(() => setStatusParts([]), 2000);
                      }}
                    >
                      <Icons.ContentCopy fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

              {/* ACTION: ANALYZE */}
              <Box sx={{ mt: 'auto', pt: 2 }}>
                {analysisResult ? (
                  <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: `1px solid ${COLORS.secondary}44`, boxShadow: `0 0 15px ${COLORS.secondary}22` }}>
                    <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 'bold', mb: 1, display: 'block', letterSpacing: 1 }}>ANALYSIS RESULTS (PENDING)</Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', mb: 1 }}>
                        Review changes in the Tuning Panel (markers) before applying.
                      </Typography>
                      
                      {analysisResult.layoutType === 'hierarchical' ? (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">Node Spacing</Typography>
                            <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 'bold' }}>{analysisResult.suggestedNodeSpacing}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">Rank Spacing</Typography>
                            <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 'bold' }}>{analysisResult.suggestedRankSpacing}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">Node Dimensions</Typography>
                            <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 'bold' }}>{analysisResult.suggestedNodeWidth}x{analysisResult.suggestedNodeHeight}</Typography>
                          </Box>
                        </>
                      ) : (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">Repulsion</Typography>
                            <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 'bold' }}>{analysisResult.suggestedRepulsion}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">Link Distance</Typography>
                            <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 'bold' }}>{analysisResult.suggestedLinkDist}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">Collision Radius</Typography>
                            <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 'bold' }}>{analysisResult.suggestedCollision}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption">Gravity</Typography>
                            <Typography variant="caption" sx={{ color: COLORS.secondary, fontWeight: 'bold' }}>{analysisResult.suggestedGravity}</Typography>
                          </Box>
                        </>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        variant="outlined" color="secondary" fullWidth 
                        onClick={onApplySuggestions}
                        sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none', py: 1 }}
                      >
                        APPLY
                      </Button>
                      <Button 
                        variant="outlined" color="inherit" fullWidth 
                        onClick={() => { setAnalysisResult(null); setTrainingUser(null); }}
                        sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none', py: 1, color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.2)' }}
                      >
                        CANCEL
                      </Button>
                    </Box>
                  </Paper>
                ) : (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', display: 'block', textAlign: 'center' }}>
                    Save a User Snapshot to trigger analysis.
                  </Typography>
                )}
              </Box>

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />

              {/* CURRENT CONFIG EXPORT */}
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', mb: 1.5, display: 'block', letterSpacing: 1 }}>CURRENT LIVE CONFIG</Typography>
                <Button 
                  fullWidth variant="outlined" color="primary" size="small" startIcon={<Icons.Code />}
                  sx={{ textTransform: 'none', borderRadius: 2 }}
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(layoutOptions, null, 2));
                    setStatusParts([{ trigger: 'INFO', action: 'Live Config JSON copied to clipboard' }]);
                    setTimeout(() => setStatusParts([]), 2000);
                  }}
                >
                  Copy Options as Defaults
                </Button>
              </Box>

            </Box>
          </Box>
        </Drawer>
              </Box>
            );
          }
          
