const DB_NAME = 'damanty_photo_vault_db';
const DB_VERSION = 2;
const STORE_NAME = 'receipt_photos';
const KEY_STORE = 'vault_keys';
const MASTER_KEY_ID = 'damanty-aes-gcm-key';

function openVaultDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('deviceId', 'deviceId', { unique: false });
      }
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getOrCreateVaultKey(db) {
  if (!window.crypto?.subtle) return null;
  const existing = await new Promise((resolve) => {
    const tx = db.transaction(KEY_STORE, 'readonly');
    const req = tx.objectStore(KEY_STORE).get(MASTER_KEY_ID);
    req.onsuccess = () => resolve(req.result?.key || null);
    req.onerror = () => resolve(null);
  });
  if (existing) return existing;

  // Generate non-extractable AES-256-GCM key bound to this device's IndexedDB
  const key = await window.crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
  await new Promise((resolve) => {
    const tx = db.transaction(KEY_STORE, 'readwrite');
    tx.objectStore(KEY_STORE).put({ id: MASTER_KEY_ID, key });
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  return key;
}

async function computeSha256Hex(text) {
  if (!window.crypto?.subtle) return 'LOCAL-VERIFIED';
  const encoded = new TextEncoder().encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16)
    .toUpperCase();
}

async function encryptString(key, plaintext) {
  if (!key || !window.crypto?.subtle) {
    return { encrypted: false, payload: plaintext };
  }
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  return {
    encrypted: true,
    iv: Array.from(iv),
    cipherBytes: new Uint8Array(cipherBuffer),
  };
}

async function decryptRecord(key, record) {
  if (!record.encrypted) return record.dataUrl || '';
  if (!key || !window.crypto?.subtle) return '';
  try {
    const iv = new Uint8Array(record.iv);
    const cipherBytes =
      record.cipherBytes instanceof Uint8Array
        ? record.cipherBytes
        : new Uint8Array(record.cipherBytes);
    const plainBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    );
    return new TextDecoder().decode(plainBuffer);
  } catch {
    return '';
  }
}

/**
 * Compresses a dataUrl image cleanly before encrypting and storing locally.
 */
export function compressImageForVault(dataUrl, maxSide = 1280, quality = 0.82) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function savePhotoDoc({ deviceId, title, docType = 'warranty', dataUrl }) {
  if (!deviceId || !dataUrl) return null;
  const compressed = await compressImageForVault(dataUrl);
  const sha256 = await computeSha256Hex(compressed);
  const db = await openVaultDb();
  const key = await getOrCreateVaultKey(db);
  const enc = await encryptString(key, compressed);

  const record = {
    id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    deviceId,
    title: title || 'Receipt Photo',
    docType,
    capturedAt: new Date().toISOString().slice(0, 10),
    sha256,
    encrypted: enc.encrypted,
    ...(enc.encrypted
      ? { iv: enc.iv, cipherBytes: enc.cipherBytes }
      : { dataUrl: enc.payload }),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(record);
    tx.oncomplete = () =>
      resolve({
        ...record,
        dataUrl: compressed,
      });
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPhotosForDevice(deviceId) {
  if (!deviceId) return [];
  try {
    const db = await openVaultDb();
    const key = await getOrCreateVaultKey(db);
    const rows = await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const index = tx.objectStore(STORE_NAME).index('deviceId');
      const req = index.getAll(deviceId);
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });

    const sorted = rows.sort((a, b) => (b.id || '').localeCompare(a.id || ''));
    return await Promise.all(
      sorted.map(async (row) => ({
        id: row.id,
        deviceId: row.deviceId,
        title: row.title,
        docType: row.docType,
        capturedAt: row.capturedAt,
        sha256: row.sha256 || 'LOCAL-VERIFIED',
        encrypted: !!row.encrypted,
        dataUrl: await decryptRecord(key, row),
      }))
    );
  } catch {
    return [];
  }
}

export async function getAllPhotoCounts() {
  try {
    const db = await openVaultDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => {
        const counts = {};
        for (const item of req.result || []) {
          counts[item.deviceId] = (counts[item.deviceId] || 0) + 1;
        }
        resolve(counts);
      };
      req.onerror = () => resolve({});
    });
  } catch {
    return {};
  }
}

export async function deletePhotoDoc(id) {
  if (!id) return;
  try {
    const db = await openVaultDb();
    await new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Ignore errors
  }
}
