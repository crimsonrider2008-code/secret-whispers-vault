import { NativeBiometric } from 'capacitor-native-biometric';
import { Capacitor } from '@capacitor/core';

// Check if running on a mobile device (native or mobile browser)
export const isMobileDevice = (): boolean => {
  if (Capacitor.isNativePlatform()) return true;
  
  // Check for mobile browser
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

// Native biometric (Fingerprint/Touch ID) - only on native mobile
export const isNativeBiometricAvailable = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    return false;
  }

  try {
    const result = await NativeBiometric.isAvailable();
    return result.isAvailable;
  } catch (error) {
    console.error('Native biometric check failed:', error);
    return false;
  }
};

// WebAuthn Face Recognition - works on any device with camera
export const isWebAuthnAvailable = async (): Promise<boolean> => {
  if (!window.PublicKeyCredential) {
    return false;
  }
  
  try {
    // Check if platform authenticator is available (Face ID, Windows Hello, etc.)
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch (error) {
    console.error('WebAuthn check failed:', error);
    return false;
  }
};

// Check if device has camera for face authentication simulation
export const isCameraAvailable = async (): Promise<boolean> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.some(device => device.kind === 'videoinput');
  } catch (error) {
    console.error('Camera check failed:', error);
    return false;
  }
};

export const authenticateWithNativeBiometric = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  
  try {
    await NativeBiometric.verifyIdentity({
      reason: "Unlock your private confessions",
      title: "ShadowSelf",
      subtitle: "Authenticate to access your confessions",
      description: "Use fingerprint authentication to unlock",
    });
    return true;
  } catch (error) {
    console.error('Native biometric authentication failed:', error);
    return false;
  }
};

// WebAuthn-based authentication for Face ID on any device
export const authenticateWithWebAuthn = async (): Promise<boolean> => {
  try {
    const storedCredentialId = localStorage.getItem('shadowself-webauthn-credential');
    
    if (storedCredentialId) {
      // Authenticate with existing credential
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          timeout: 60000,
          userVerification: 'required',
          allowCredentials: [{
            id: Uint8Array.from(atob(storedCredentialId), c => c.charCodeAt(0)),
            type: 'public-key',
          }],
        },
      });
      return !!credential;
    } else {
      // Create new credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "ShadowSelf",
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: "shadowself-user",
            displayName: "ShadowSelf User",
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },
            { alg: -257, type: 'public-key' },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
          timeout: 60000,
        },
      }) as PublicKeyCredential;
      
      if (credential) {
        // Store credential ID
        const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
        localStorage.setItem('shadowself-webauthn-credential', credentialId);
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error('WebAuthn authentication failed:', error);
    return false;
  }
};

// Legacy function for backward compatibility
export const isBiometricAvailable = async (): Promise<boolean> => {
  const native = await isNativeBiometricAvailable();
  const webauthn = await isWebAuthnAvailable();
  return native || webauthn;
};

export const authenticateWithBiometric = async (): Promise<boolean> => {
  if (Capacitor.isNativePlatform()) {
    return authenticateWithNativeBiometric();
  }
  return authenticateWithWebAuthn();
};

export const isBiometricEnabled = (): boolean => {
  return localStorage.getItem('shadowself-biometric-enabled') === 'true';
};

export const isFingerprintEnabled = (): boolean => {
  return localStorage.getItem('shadowself-fingerprint-enabled') === 'true';
};

export const isFaceIdEnabled = (): boolean => {
  return localStorage.getItem('shadowself-faceid-enabled') === 'true';
};

export const enableBiometric = (): void => {
  localStorage.setItem('shadowself-biometric-enabled', 'true');
};

export const enableFingerprint = (): void => {
  localStorage.setItem('shadowself-fingerprint-enabled', 'true');
  localStorage.setItem('shadowself-biometric-enabled', 'true');
};

export const enableFaceId = (): void => {
  localStorage.setItem('shadowself-faceid-enabled', 'true');
  localStorage.setItem('shadowself-biometric-enabled', 'true');
};

export const disableBiometric = (): void => {
  localStorage.setItem('shadowself-biometric-enabled', 'false');
  localStorage.setItem('shadowself-fingerprint-enabled', 'false');
  localStorage.setItem('shadowself-faceid-enabled', 'false');
};
