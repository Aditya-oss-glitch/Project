const config = {
  appId: 'com.roadrescue360.app',
  appName: 'RoadRescue360',
  webDir: 'frontend', // keep for fallback if you still bundle builds
  server: {
    url: 'https://roadrescue-360-j5sj.onrender.com', // 👈 put your Render frontend link here
    cleartext: false,
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

module.exports = config;