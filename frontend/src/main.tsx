import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

// Debug mode: Force clear auth state on app startup
// Comment out the block below to preserve login state after debugging
console.log('%c[Main] Application Starting', 'color: #667eea; font-weight: bold; font-size: 16px');

const localToken = localStorage.getItem('auth_token');
const sessionToken = sessionStorage.getItem('auth_token');

console.log('[Main] Current time:', new Date().toLocaleString());
console.log('[Main] localStorage.auth_token:', localToken ? `exists (${localToken.substring(0, 20)}...)` : 'not found');
console.log('[Main] sessionStorage.auth_token:', sessionToken ? `exists (${sessionToken.substring(0, 20)}...)` : 'not found');

const DEBUG_MODE = true; // Set to false to preserve login state

if (DEBUG_MODE) {
  console.log('%c[Main] DEBUG MODE ENABLED - Clearing all auth state', 'color: orange; font-weight: bold');
  localStorage.clear();
  sessionStorage.clear();
  console.log('%c[Main] All storage cleared', 'color: green; font-weight: bold');
} else {
  if (localToken || sessionToken) {
    console.log('%c[Main] Saved auth state found', 'color: green');
  } else {
    console.log('[Main] No saved auth state');
  }
}

console.log('%c[Main] Rendering React application...', 'color: #667eea');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
