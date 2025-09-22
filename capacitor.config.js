const config = {
  appId: 'com.roadrescue360.app',
  appName: 'RoadRescue360',
  webDir: 'frontend',
  server: {
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
