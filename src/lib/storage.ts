import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Confession {
  id: string;
  title: string;
  mood: string;
  note: string;
  audioBlob?: Blob;
  textContent?: string;
  type: 'audio' | 'text';
  createdAt: Date;
  burnAt?: Date;
  duration: number;
  isPinned?: boolean;
}

interface ShadowSelfDB extends DBSchema {
  confessions: {
    key: string;
    value: Confession;
    indexes: { 'by-date': Date };
  };
}

let db: IDBPDatabase<ShadowSelfDB>;

export const initDB = async () => {
  db = await openDB<ShadowSelfDB>('shadowself-db', 1, {
    upgrade(db) {
      const store = db.createObjectStore('confessions', { keyPath: 'id' });
      store.createIndex('by-date', 'createdAt');
    },
  });
  return db;
};

export const saveConfession = async (confession: Confession) => {
  if (!db) await initDB();
  await db.put('confessions', confession);
};

export const updateConfession = async (id: string, updates: Partial<Confession>) => {
  if (!db) await initDB();
  const confession = await db.get('confessions', id);
  if (confession) {
    await db.put('confessions', { ...confession, ...updates });
  }
};

export const getConfessions = async (): Promise<Confession[]> => {
  if (!db) await initDB();
  const confessions = await db.getAllFromIndex('confessions', 'by-date');
  return confessions.reverse();
};

export const deleteConfession = async (id: string) => {
  if (!db) await initDB();
  await db.delete('confessions', id);
};

export const checkExpiredConfessions = async () => {
  if (!db) await initDB();
  const confessions = await db.getAll('confessions');
  const now = new Date();
  
  for (const confession of confessions) {
    if (confession.burnAt && confession.burnAt <= now) {
      await deleteConfession(confession.id);
    }
  }
};

// Simple encryption for added privacy (XOR-based)
export const encryptBlob = async (blob: Blob, key: string): Promise<Blob> => {
  const buffer = await blob.arrayBuffer();
  const data = new Uint8Array(buffer);
  const keyData = new TextEncoder().encode(key);
  
  for (let i = 0; i < data.length; i++) {
    data[i] ^= keyData[i % keyData.length];
  }
  
  return new Blob([data], { type: blob.type });
};

export const decryptBlob = async (blob: Blob, key: string): Promise<Blob> => {
  // XOR encryption is symmetric
  return encryptBlob(blob, key);
};
