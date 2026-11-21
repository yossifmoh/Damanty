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
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'add_device',
        device,
        proof,
      }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function syncUpdateDeviceToCloud(device) {
  try {
    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'update_device',
        device,
      }),
    });
  } catch {
    // Offline fallback stays intact
  }
}

export async function syncDeleteDeviceToCloud(deviceId) {
  try {
    await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'delete_device',
        deviceId,
      }),
    });
  } catch {
    // Offline fallback stays intact
  }
}

export async function syncMaintenanceToCloud(deviceId, logEntry, proof) {
  try {
    const res = await fetch('/api/vault', {
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
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function uploadPhotoToCloud({
  deviceId,
  proofId,
  title,
  docType,
  sha256,
  capturedAt,
  dataUrl,
}) {
  try {
    const res = await fetch('/api/photos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        deviceId,
        proofId,
        title,
        docType,
        sha256,
        capturedAt,
        dataUrl,
      }),
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

export async function fetchCloudPhotoAsDataUrl(proofId) {
  try {
    const res = await fetch(`/api/photos?id=${encodeURIComponent(proofId)}`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function deleteCloudPhoto(proofId) {
  try {
    await fetch(`/api/photos?id=${encodeURIComponent(proofId)}`, {
      method: 'DELETE',
      credentials: 'include',
    });
  } catch {
    // Ignore offline error
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

export async function createTransferOnCloud(deviceId, code) {
  try {
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'create_transfer',
        deviceId,
        code,
      }),
    });
    return await res.json();
  } catch {
    return { ok: false };
  }
}

export async function claimTransferOnCloud(code) {
  try {
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'claim_transfer',
        code,
      }),
    });
    return await res.json();
  } catch {
    return { ok: false, error: 'NETWORK_ERROR' };
  }
}

export async function bookServiceOnCloud({ deviceId, deviceSerial, bookingType, hotline }) {
  try {
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'book_service',
        deviceId,
        deviceSerial,
        bookingType,
        hotline,
      }),
    });
    return await res.json();
  } catch {
    return { ok: false, ticketId: `DM-${Math.floor(1000 + Math.random() * 9000)}` };
  }
}

export async function reportFraudOnCloud({ qrPayload, notes }) {
  try {
    const res = await fetch('/api/vault', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'report_fraud',
        qrPayload,
        notes,
      }),
    });
    return await res.json();
  } catch {
    return { ok: false };
  }
}

export async function requestAiDiagnosis({ query, lang, device, devices }) {
  try {
    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        query,
        lang,
        device: device
          ? {
              nameAr: device.nameAr,
              nameEn: device.nameEn,
              brand: device.brand,
              model: device.model,
              category: device.category,
              status: device.status,
              hotline: device.hotline,
            }
          : null,
        devices: Array.isArray(devices)
          ? devices.slice(0, 6).map((d) => ({
              nameAr: d.nameAr,
              nameEn: d.nameEn,
              brand: d.brand,
              model: d.model,
              category: d.category,
            }))
          : [],
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        configured: data?.configured ?? true,
        error: data?.error || 'AI_REQUEST_FAILED',
      };
    }
    return data || { ok: false, error: 'INVALID_RESPONSE' };
  } catch {
    return { ok: false, error: 'NETWORK_ERROR' };
  }
}

export async function requestGeminiVisionOcr({ imageBase64, mimeType = 'image/jpeg' }) {
  try {
    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        imageBase64,
        mimeType,
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return {
        ok: false,
        configured: data?.configured ?? true,
        error: data?.error || 'OCR_FAILED',
      };
    }
    return data || { ok: false, error: 'INVALID_RESPONSE' };
  } catch {
    return { ok: false, error: 'NETWORK_ERROR' };
  }
}
