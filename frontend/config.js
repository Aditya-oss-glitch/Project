// frontend/config.js

// Define all environments
const CONFIG = {
  localhost: "http://localhost:3000",     // Local development
  production: "https://roadrescue360-backend.onrender.com"   // Production server
};

// Choose BASE_URL automatically
let BASE_URL = CONFIG.localhost;  // Default for browser

// Detect environment
const isLocalhost = window.location.hostname === 'localhost' || 
                   window.location.hostname === '127.0.0.1' || 
                   window.location.hostname.includes('localhost');

const isRender = window.location.hostname.includes('onrender.com');

// Set BASE_URL based on environment
if (isRender) {
  // If frontend is hosted on Render, use production backend
  BASE_URL = CONFIG.production;
} else if (!isLocalhost) {
  // If not localhost and not Render, assume production
  BASE_URL = CONFIG.production;
}

// Make BASE_URL globally available
window.BASE_URL = BASE_URL;

// Debug logging
console.log('🌐 Environment Detection:');
console.log('  Hostname:', window.location.hostname);
console.log('  Is Localhost:', isLocalhost);
console.log('  Is Render:', isRender);
console.log('  API Base URL:', BASE_URL);