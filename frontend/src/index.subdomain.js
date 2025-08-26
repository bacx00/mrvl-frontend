import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import StatusPage from './pages/status/StatusPage';

// Detect subdomain
const hostname = window.location.hostname;
const subdomain = hostname.split('.')[0];

// Determine which app to render based on subdomain
let AppComponent = App;

if (hostname === 'status.mrvl.net' || hostname === 'status.localhost' || subdomain === 'status') {
  // Render only the status page for status subdomain
  AppComponent = StatusPage;
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppComponent />
  </React.StrictMode>
);