import { NativeBiometric, BiometryType } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

export const isBiometricAvailable = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch (error) {
    console.error('Biometric check failed:', error);
    return false;
  }
};

export const authenticateWithBiometric = async (): Promise<boolean> => {
  try {
    await NativeBiometric.verifyIdentity({
      reason: "Unlock your private confessions",
      title: "ShadowSelf",
      subtitle: "Authenticate to access your confessions",
      description: "Use biometric authentication to unlock",
    });
    return true;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
};

export const isBiometricEnabled = (): boolean => {
  return localStorage.getItem('shadowself-biometric-enabled') === 'true';
};

export const enableBiometric = (): void => {
  localStorage.setItem('shadowself-biometric-enabled', 'true');
};

export const disableBiometric = (): void => {
  localStorage.setItem('shadowself-biometric-enabled', 'false');
};
