import { createTheme } from '@mui/material/styles';

// --- CENTRAL THEME COLORS ---
export const COLORS = {
  primary: '#00BFFF',    // DeepSkyBlue
  secondary: '#FF69B4',  // HotPink
  background: '#121212', // Dark Grey
  paper: '#1e1e1e',      // Slightly lighter grey for panels
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.7)',
  divider: 'rgba(255, 255, 255, 0.12)',
  edgeDefault: '#455a64',
  edgeNew: 'rgba(255, 255, 255, 0)',
  nodeLabel: '#eceff1',
  panelBorder: 'rgba(255, 255, 255, 0.1)', // Subtle white opacity instead of blue
};

// --- ORIGINAL SATURATED NODE CATEGORY COLORS ---
export const NODE_CATEGORIES = {
  people: '#1976d2',
  planet: '#4caf50',
  mutant: '#dc143c',
  robot: '#00bfff',
  item: '#ff9800',
  science: '#9c27b0',
  other: '#9e9e9e',
};

// --- ORIGINAL SATURATED EDGE TYPE COLORS ---
export const EDGE_TYPES = {
  rules: '#d32f2f',
  conquered: '#d32f2f',
  protects: '#2e7d32',
  guides: '#2e7d32',
  livesOn: '#0288d1',
  created: '#7b1fa2',
  default: '#455a64',
};

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: COLORS.primary,
    },
    secondary: {
      main: COLORS.secondary,
    },
    background: {
      default: COLORS.background,
      paper: COLORS.paper,
    },
    text: {
      primary: COLORS.text,
      secondary: COLORS.textSecondary,
    },
  },
  typography: {
    fontFamily: '"Open Sans", sans-serif',
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove MUI default overlay
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.08)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.15)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(255, 255, 255, 0.2)',
          },
        },
      },
    },
  },
});
