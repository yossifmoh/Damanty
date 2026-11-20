export async function getSessionUser() {
  try {
    const res = await fetch('/api/auth', { credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.ok ? data.user || null : null;
  } catch {
    return null;
  }
}

export async function signUpAccount({ name, phone, email, password }) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      action: 'signup',
      name,
      phone,
      email,
      password,
    }),
  });
  return await res.json();
}

export async function signInAccount({ identifier, password }) {
  const res = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      action: 'signin',
      identifier,
      password,
    }),
  });
  return await res.json();
}

export async function signOutAccount() {
  try {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ action: 'signout' }),
    });
  } catch {
    // Ignore network error on sign out
  }
}

export async function checkNeonHealth() {
  try {
    const res = await fetch('/api/health', { credentials: 'include' });
    if (!res.ok) return { ok: false };
    return await res.json();
  } catch {
    return { ok: false };
  }
}

export async function fetchCloudVault() {
  try {
    const res = await fetch('/api/vault', { credentials: 'include' });
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
      credentials: 'include',
      body: JSON.stringify({
        action: 'sync_all',
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
      credentials: 'include',
      body: JSON.stringify({
        action: 'add_device',
        device,
        proof,
      }),
    });
  } catch {
    // Offline fallback stays intact
  }
}

export async function syncMaintenanceToCloud(deviceId, logEntry, proof) {
  try {
    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'add_maintenance',
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
      credentials: 'include',
      body: JSON.stringify({
        action: 'add_proof',
        deviceId,
        proof,
      }),
    });
  } catch {
    // Ignore offline error
  }
}
