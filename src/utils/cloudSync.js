const DEFAULT_USER_KEY = 'eg-201008429910';

export function getVaultUserKey() {
  try {
    return localStorage.getItem('damanty_user_key_v1') || DEFAULT_USER_KEY;
  } catch {
    return DEFAULT_USER_KEY;
  }
}

export async function checkNeonHealth() {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}

export async function fetchCloudVault() {
  try {
    const userKey = encodeURIComponent(getVaultUserKey());
    const res = await fetch(`/api/vault?userKey=${userKey}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ok ? data : null;
  } catch {
    return null;
  }
}

export async function syncAllDevicesToCloud(devices) {
  try {
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sync_all',
        userKey: getVaultUserKey(),
        devices,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function syncNewDeviceToCloud(device, proof) {
  try {
    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_device',
        userKey: getVaultUserKey(),
        device,
        proof,
      }),
    });
  } catch {
    // Offline fallback stays intact in localStorage + IndexedDB
  }
}

export async function syncMaintenanceToCloud(deviceId, logEntry, proof) {
  try {
    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_maintenance',
        userKey: getVaultUserKey(),
        deviceId,
        logEntry,
        proof,
      }),
    });
  } catch {
    // Offline fallback stays intact
  }
}

export async function syncProofToCloud(deviceId, proof) {
  try {
    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_proof',
        userKey: getVaultUserKey(),
        deviceId,
        proof,
      }),
    });
  } catch {
    // Ignore offline error
  }
}
