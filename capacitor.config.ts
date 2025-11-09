import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.88b5f103afb64fec92274a9e7f195ba0',
  appName: 'ShadowSelf',
  webDir: 'dist',
  server: {
    url: 'https://88b5f103-afb6-4fec-9227-4a9e7f195ba0.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    NativeBiometric: {
      allowDeviceCredential: true
    },
    SplashScreen: {
      launchShowDuration: 0,
      backgroundColor: "#0a0a0f"
    }
  }
};

export default config;
