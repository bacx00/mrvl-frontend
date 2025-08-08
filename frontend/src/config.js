// ⚠️ CRITICAL FIX: Use environment variable for backend URL
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net',
  API_URL: (process.env.REACT_APP_BACKEND_URL || 'https://staging.mrvl.net') + '/api',
  ENVIRONMENT: process.env.REACT_APP_ENVIRONMENT || 'production'
};

console.log('🔧 API Configuration Loaded:', API_CONFIG);

export default API_CONFIG;// Cache buster: Mon Jun  2 07:52:49 UTC 2025
