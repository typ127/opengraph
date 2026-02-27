import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { ReactFlowProvider } from 'reactflow';

// Suppress ResizeObserver error
const showError = window.console.error;
window.console.error = (...args) => {
  const msg = args[0]?.toString();
  if (msg?.includes('ResizeObserver') || msg?.includes('loop limit exceeded')) {
    return;
  }
  showError(...args);
};

// Global error handler to catch and hide the webpack overlay
window.addEventListener('error', (e) => {
  if (e.message?.includes('ResizeObserver') || e.message?.includes('loop limit exceeded')) {
    e.stopImmediatePropagation();
    // Hide all possible dev overlays
    const selectors = [
      'nextjs-portal',
      'iframe[id^="webpack-dev-server"]',
      '#webpack-dev-server-client-overlay',
      'div[style*="z-index: 2147483647"]'
    ];
    selectors.forEach(s => {
      const el = document.querySelector(s);
      if (el) el.style.display = 'none';
    });
  }
});

const theme = createTheme({
  typography: {
    fontFamily: '"Open Sans", sans-serif',
  },
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <ReactFlowProvider>
        <App />
      </ReactFlowProvider>
    </ThemeProvider>
  </React.StrictMode>
);
