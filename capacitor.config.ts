import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'healthPromise',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      style: 'default',
      backgroundColor: '#ffffff'
    },
    SafeArea: {
      enabled: true
    }
  }
};

export default config;
