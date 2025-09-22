import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.roadrescue360.app',
  appName: 'RoadRescue360',
  webDir: 'frontend', // keep this if you still want local build fallback
  server: {
    url: 'https://roadrescue-360.onrender.com', // 👈 replace with your deployed Render URL
    cleartext: false, // ensures HTTPS only
    androidScheme: 'https'
  },
  plugins: {
    Geolocation: {
      permissions: ['location']
    },
    Camera: {
      permissions: ['camera', 'photos']
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;