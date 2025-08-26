import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StatusPage from './pages/status/StatusPage';
import './App.css';

function AppStatus() {
  // Detect if we're on status subdomain
  const isStatusSubdomain = window.location.hostname === 'status.mrvl.net' || 
                           window.location.hostname === 'status.localhost';

  useEffect(() => {
    // Set page title for status subdomain
    if (isStatusSubdomain) {
      document.title = 'MRVL API Status';
    }
  }, [isStatusSubdomain]);

  // If on status subdomain, only show status page
  if (isStatusSubdomain) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<StatusPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  // Otherwise, return null or redirect to main domain
  window.location.href = 'https://mrvl.net';
  return null;
}

export default AppStatus;