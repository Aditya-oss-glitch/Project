// frontend/config.js

// Define all environments
const CONFIG = {
  localhost: "http://localhost:3000",     // Browser testing
  emulator: "http://10.0.2.2:3000",      // Android Emulator
//   device: "http://192.168.1.100:3000"    // Replace with your computer’s local IP for real phone
};

// Choose BASE_URL automatically
let BASE_URL = CONFIG.localhost;  // Default for browser

// If running inside Android (Capacitor / Emulator)
if (window.Capacitor) {
  BASE_URL = CONFIG.emulator;
}

// Optional: If you detect you’re on a physical device, set device IP
// Example: check navigator.platform or manually toggle
// BASE_URL = CONFIG.device;