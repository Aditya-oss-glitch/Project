// frontend/config.js

// Define all environments
const CONFIG = {
  localhost: "http://localhost:3000",     // Browser testing
  production: "https://roadrescue360-backend.onrender.com"   // Production server
};

// Choose BASE_URL automatically
let BASE_URL = CONFIG.localhost;  // Default for browser

// If running in production
if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  BASE_URL = CONFIG.production;
}

window.BASE_URL = BASE_URL;