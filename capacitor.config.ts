import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.health.promise',
  appName: '건강약속',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff'
    },
    SafeArea: {
      enabled: true
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
