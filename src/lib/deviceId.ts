// Device-specific identifier for data isolation
// This ensures each device has its own unique vault

const DEVICE_ID_KEY = 'shadowself-device-id';

export const getDeviceId = (): string => {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId) {
    // Generate a unique device ID using crypto
    deviceId = `device-${crypto.randomUUID()}-${Date.now()}`;
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
};

export const getStoragePrefix = (): string => {
  return `shadowself-${getDeviceId().slice(0, 16)}`;
};

// Get all localStorage keys used by this app
export const getAppStorageKeys = (): string[] => {
  return [
    'shadowself-pin',
    'shadowself-security-question',
    'shadowself-security-answer',
    'shadowself-biometric-enabled',
    DEVICE_ID_KEY,
  ];
};

// Clear all app data for complete reset
export const clearAllAppData = async (): Promise<void> => {
  // Clear localStorage items
  const keysToKeep: string[] = []; // We clear everything for a fresh start
  const allKeys = Object.keys(localStorage);
  
  allKeys.forEach(key => {
    if (key.startsWith('shadowself')) {
      localStorage.removeItem(key);
    }
  });
  
  // Clear IndexedDB
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase('shadowself-db');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to clear database'));
    request.onblocked = () => {
      console.log('Database deletion blocked');
      resolve(); // Continue anyway
    };
  });
};

// Get app stats for transparency
export const getAppStats = async (): Promise<{
  totalConfessions: number;
  storageUsed: string;
  deviceId: string;
  createdAt: string | null;
}> => {
  const deviceId = getDeviceId();
  const createdAt = localStorage.getItem('shadowself-created-at');
  
  // Estimate storage usage
  let storageSize = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key) && key.startsWith('shadowself')) {
      storageSize += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
    }
  }
  
  // Format size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return {
    totalConfessions: 0, // Will be updated by caller
    storageUsed: formatSize(storageSize),
    deviceId: deviceId.slice(-8), // Only show last 8 chars for privacy
    createdAt,
  };
};

// Initialize app creation timestamp
export const initializeAppTimestamp = (): void => {
  if (!localStorage.getItem('shadowself-created-at')) {
    localStorage.setItem('shadowself-created-at', new Date().toISOString());
  }
};