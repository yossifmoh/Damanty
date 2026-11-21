import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { del } from '@vercel/blob';
import { getSessionFromRequest } from './_authUtils.js';

function scopeId(userKey, rawId) {
  const prefix = `${userKey}::`;
  return String(rawId).startsWith(prefix) ? String(rawId) : `${prefix}${rawId}`;
}

function unscopeId(userKey, dbId) {
  const prefix = `${userKey}::`;
  return String(dbId).startsWith(prefix) ? String(dbId).slice(prefix.length) : String(dbId);
}

async function ensureSchema(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS vault_devices (
      id TEXT PRIMARY KEY,
      user_key TEXT NOT NULL,
      brand TEXT NOT NULL,
      brand_ar TEXT,
      category TEXT,
      name_en TEXT NOT NULL,
      name_ar TEXT,
      model TEXT,
      serial TEXT NOT NULL,
      purchase_date TEXT,
      expiry_date TEXT,
      remaining_pct INTEGER DEFAULT 100,
      days_left INTEGER DEFAULT 1095,
      warranty_years INTEGER DEFAULT 3,
      hotline TEXT,
      authorized_group_en TEXT,
      authorized_group_ar TEXT,
      retailer_en TEXT,
      retailer_ar TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS maintenance_logs (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL REFERENCES vault_devices(id) ON DELETE CASCADE,
      user_key TEXT NOT NULL,
      log_date TEXT,
      title_en TEXT,
      title_ar TEXT,
      part_en TEXT,
      part_ar TEXT,
      cost_egp INTEGER DEFAULT 0,
      covered_by_warranty BOOLEAN DEFAULT FALSE,
      tech_center_en TEXT,
      tech_center_ar TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS receipt_proofs (
      id TEXT PRIMARY KEY,
      device_id TEXT NOT NULL REFERENCES vault_devices(id) ON DELETE CASCADE,
      user_key TEXT NOT NULL,
      title TEXT,
      doc_type TEXT,
      sha256 TEXT NOT NULL,
      blob_pathname TEXT,
      captured_at TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    ALTER TABLE receipt_proofs ADD COLUMN IF NOT EXISTS blob_pathname TEXT
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS warranty_transfers (
      code TEXT PRIMARY KEY,
      scoped_device_id TEXT NOT NULL,
      from_user_key TEXT NOT NULL,
      claimed_by_user_key TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS service_bookings (
      id TEXT PRIMARY KEY,
      user_key TEXT NOT NULL,
      device_id TEXT,
      device_serial TEXT,
      booking_type TEXT,
      hotline TEXT,
      status TEXT DEFAULT 'confirmed',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS fraud_reports (
      id TEXT PRIMARY KEY,
      user_key TEXT NOT NULL,
      qr_payload TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

function mapDeviceRow(row, userKey, logsByDevice, proofsByDevice) {
  const cleanId = unscopeId(userKey, row.id);
  return {
    id: cleanId,
    brand: row.brand,
    brandAr: row.brand_ar,
    category: row.category,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    model: row.model,
    serial: row.serial,
    purchaseDate: row.purchase_date,
    expiryDate: row.expiry_date,
    remainingPct: row.remaining_pct,
    daysLeft: row.days_left,
    warrantyYears: row.warranty_years,
    hotline: row.hotline,
    authorizedGroupEn: row.authorized_group_en,
    authorizedGroupAr: row.authorized_group_ar,
    retailerEn: row.retailer_en,
    retailerAr: row.retailer_ar,
    accentFrom: row.status === 'expiring_soon' ? '#f59e0b' : '#10b981',
    accentTo: row.status === 'expiring_soon' ? '#d97706' : '#059669',
    status: row.status,
    maintenanceLog: logsByDevice[cleanId] || [],
    cloudProofs: proofsByDevice[cleanId] || [],
  };
}

async function upsertDevice(sql, userKey, d) {
  const scopedDevId = scopeId(userKey, d.id);
  await sql`
    INSERT INTO vault_devices (
      id, user_key, brand, brand_ar, category, name_en, name_ar, model, serial,
      purchase_date, expiry_date, remaining_pct, days_left, warranty_years,
      hotline, authorized_group_en, authorized_group_ar, retailer_en, retailer_ar, status
    ) VALUES (
      ${scopedDevId}, ${userKey}, ${d.brand}, ${d.brandAr || d.brand}, ${d.category || 'washer'},
      ${d.nameEn}, ${d.nameAr || d.nameEn}, ${d.model || ''}, ${d.serial},
      ${d.purchaseDate || ''}, ${d.expiryDate || ''}, ${Number(d.remainingPct ?? 100)},
      ${Number(d.daysLeft ?? 1095)}, ${Number(d.warrantyYears ?? 3)},
      ${d.hotline || '19960'}, ${d.authorizedGroupEn || ''}, ${d.authorizedGroupAr || ''},
      ${d.retailerEn || ''}, ${d.retailerAr || ''}, ${d.status || 'active'}
    )
    ON CONFLICT (id) DO UPDATE SET
      brand = EXCLUDED.brand,
      brand_ar = EXCLUDED.brand_ar,
      name_en = EXCLUDED.name_en,
      name_ar = EXCLUDED.name_ar,
      model = EXCLUDED.model,
      serial = EXCLUDED.serial,
      purchase_date = EXCLUDED.purchase_date,
      expiry_date = EXCLUDED.expiry_date,
      warranty_years = EXCLUDED.warranty_years,
      status = EXCLUDED.status,
      remaining_pct = EXCLUDED.remaining_pct,
      days_left = EXCLUDED.days_left
  `;

  if (Array.isArray(d.maintenanceLog)) {
    for (const log of d.maintenanceLog) {
      await upsertMaintenanceLog(sql, userKey, d.id, log);
    }
  }
}

async function upsertMaintenanceLog(sql, userKey, deviceId, log) {
  const scopedDevId = scopeId(userKey, deviceId);
  const scopedLogId = scopeId(userKey, log.id);
  await sql`
    INSERT INTO maintenance_logs (
      id, device_id, user_key, log_date, title_en, title_ar, part_en, part_ar,
      cost_egp, covered_by_warranty, tech_center_en, tech_center_ar
    ) VALUES (
      ${scopedLogId}, ${scopedDevId}, ${userKey}, ${log.date || ''},
      ${log.titleEn || ''}, ${log.titleAr || ''}, ${log.partEn || ''}, ${log.partAr || ''},
      ${Number(log.costEgp || 0)}, ${Boolean(log.coveredByWarranty)},
      ${log.techCenterEn || ''}, ${log.techCenterAr || ''}
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

async function insertReceiptProof(sql, userKey, deviceId, proof) {
  if (!proof?.id || !proof?.sha256) return;
  const scopedDevId = scopeId(userKey, deviceId);
  const scopedProofId = scopeId(userKey, proof.id);
  await sql`
    INSERT INTO receipt_proofs (id, device_id, user_key, title, doc_type, sha256, captured_at)
    VALUES (
      ${scopedProofId}, ${scopedDevId}, ${userKey}, ${proof.title || 'Receipt'},
      ${proof.docType || 'warranty'}, ${proof.sha256}, ${proof.capturedAt || ''}
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connStr) {
    return res.status(503).json({ ok: false, error: 'Neon DATABASE_URL not configured' });
  }

  const sql = neon(connStr);

  try {
    await ensureSchema(sql);
    const session = getSessionFromRequest(req);
    const userKey = session?.userId || 'eg-demo-guest';

    if (req.method === 'GET') {
      const devicesRows = await sql`
        SELECT * FROM vault_devices WHERE user_key = ${userKey} ORDER BY created_at DESC
      `;
      const logsRows = await sql`
        SELECT * FROM maintenance_logs WHERE user_key = ${userKey} ORDER BY created_at DESC
      `;
      const proofsRows = await sql`
        SELECT * FROM receipt_proofs WHERE user_key = ${userKey} ORDER BY created_at DESC
      `;
      const bookingsRows = await sql`
        SELECT * FROM service_bookings WHERE user_key = ${userKey} ORDER BY created_at DESC LIMIT 20
      `;

      const logsByDevice = {};
      for (const l of logsRows) {
        const cleanDevId = unscopeId(userKey, l.device_id);
        if (!logsByDevice[cleanDevId]) logsByDevice[cleanDevId] = [];
        logsByDevice[cleanDevId].push({
          id: unscopeId(userKey, l.id),
          date: l.log_date,
          titleEn: l.title_en,
          titleAr: l.title_ar,
          partEn: l.part_en,
          partAr: l.part_ar,
          costEgp: l.cost_egp,
          coveredByWarranty: l.covered_by_warranty,
          techCenterEn: l.tech_center_en,
          techCenterAr: l.tech_center_ar,
        });
      }

      const proofsByDevice = {};
      for (const p of proofsRows) {
        const cleanDevId = unscopeId(userKey, p.device_id);
        if (!proofsByDevice[cleanDevId]) proofsByDevice[cleanDevId] = [];
        proofsByDevice[cleanDevId].push({
          id: unscopeId(userKey, p.id),
          title: p.title,
          docType: p.doc_type,
          sha256: p.sha256,
          hasCloudBlob: Boolean(p.blob_pathname),
          capturedAt: p.captured_at,
        });
      }

      const devices = devicesRows.map((row) =>
        mapDeviceRow(row, userKey, logsByDevice, proofsByDevice)
      );

      return res.status(200).json({
        ok: true,
        authenticated: Boolean(session),
        devices,
        proofsCount: proofsRows.length,
        bookings: bookingsRows,
      });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const action = body.action;

      if (action === 'sync_all' && Array.isArray(body.devices)) {
        for (const d of body.devices) {
          await upsertDevice(sql, userKey, d);
        }
        return res.status(200).json({ ok: true, syncedCount: body.devices.length });
      }

      if ((action === 'add_device' || action === 'update_device') && body.device) {
        await upsertDevice(sql, userKey, body.device);
        if (body.proof) {
          await insertReceiptProof(sql, userKey, body.device.id, body.proof);
        }
        return res.status(200).json({ ok: true });
      }

      if (action === 'delete_device' && body.deviceId) {
        const scopedDevId = scopeId(userKey, body.deviceId);
        const proofRows = await sql`
          SELECT blob_pathname FROM receipt_proofs
          WHERE device_id = ${scopedDevId} AND user_key = ${userKey} AND blob_pathname IS NOT NULL
        `;
        await sql`
          DELETE FROM vault_devices WHERE id = ${scopedDevId} AND user_key = ${userKey}
        `;
        for (const p of proofRows) {
          if (p.blob_pathname) {
            await del(p.blob_pathname).catch(() => {});
          }
        }
        return res.status(200).json({ ok: true });
      }

      if (action === 'add_maintenance' && body.deviceId && body.logEntry) {
        await upsertMaintenanceLog(sql, userKey, body.deviceId, body.logEntry);
        if (body.proof) {
          await insertReceiptProof(sql, userKey, body.deviceId, body.proof);
        }
        return res.status(200).json({ ok: true });
      }

      if (action === 'add_proof' && body.deviceId && body.proof) {
        await insertReceiptProof(sql, userKey, body.deviceId, body.proof);
        return res.status(200).json({ ok: true });
      }

      if (action === 'create_transfer' && body.deviceId && body.code) {
        const scopedDevId = scopeId(userKey, body.deviceId);
        const code = String(body.code).trim().toUpperCase();
        await sql`
          INSERT INTO warranty_transfers (code, scoped_device_id, from_user_key, status)
          VALUES (${code}, ${scopedDevId}, ${userKey}, 'pending')
          ON CONFLICT (code) DO NOTHING
        `;
        return res.status(200).json({ ok: true, code });
      }

      if (action === 'claim_transfer' && body.code) {
        if (!session?.userId) {
          return res.status(401).json({ ok: false, error: 'AUTH_REQUIRED' });
        }
        const code = String(body.code).trim().toUpperCase();
        const rows = await sql`
          SELECT * FROM warranty_transfers WHERE code = ${code} LIMIT 1
        `;
        const transfer = rows[0];
        if (!transfer) {
          return res.status(404).json({ ok: false, error: 'TRANSFER_NOT_FOUND' });
        }
        if (transfer.status === 'claimed') {
          return res.status(409).json({ ok: false, error: 'TRANSFER_ALREADY_CLAIMED' });
        }

        const devRows = await sql`
          SELECT * FROM vault_devices WHERE id = ${transfer.scoped_device_id} LIMIT 1
        `;
        const sourceDevice = devRows[0];
        if (!sourceDevice) {
          return res.status(404).json({ ok: false, error: 'DEVICE_NOT_FOUND' });
        }

        const sourceLogs = await sql`
          SELECT * FROM maintenance_logs WHERE device_id = ${transfer.scoped_device_id}
        `;

        const newCleanId = `dev-tr-${Date.now()}`;
        const newDevice = {
          id: newCleanId,
          brand: sourceDevice.brand,
          brandAr: sourceDevice.brand_ar,
          category: sourceDevice.category,
          nameEn: sourceDevice.name_en,
          nameAr: sourceDevice.name_ar,
          model: sourceDevice.model,
          serial: sourceDevice.serial,
          purchaseDate: sourceDevice.purchase_date,
          expiryDate: sourceDevice.expiry_date,
          remainingPct: sourceDevice.remaining_pct,
          daysLeft: sourceDevice.days_left,
          warrantyYears: sourceDevice.warranty_years,
          hotline: sourceDevice.hotline,
          authorizedGroupEn: sourceDevice.authorized_group_en,
          authorizedGroupAr: sourceDevice.authorized_group_ar,
          retailerEn: sourceDevice.retailer_en,
          retailerAr: sourceDevice.retailer_ar,
          accentFrom: sourceDevice.status === 'expiring_soon' ? '#f59e0b' : '#10b981',
          accentTo: sourceDevice.status === 'expiring_soon' ? '#d97706' : '#059669',
          status: sourceDevice.status,
          maintenanceLog: sourceLogs.map((l, idx) => ({
            id: `log-tr-${Date.now()}-${idx}`,
            date: l.log_date,
            titleEn: l.title_en,
            titleAr: l.title_ar,
            partEn: l.part_en,
            partAr: l.part_ar,
            costEgp: l.cost_egp,
            coveredByWarranty: l.covered_by_warranty,
            techCenterEn: l.tech_center_en,
            techCenterAr: l.tech_center_ar,
          })),
        };

        await upsertDevice(sql, userKey, newDevice);

        // Remove from seller if seller is a different user
        if (transfer.from_user_key !== userKey) {
          await sql`
            DELETE FROM vault_devices WHERE id = ${transfer.scoped_device_id} AND user_key = ${transfer.from_user_key}
          `;
        }

        await sql`
          UPDATE warranty_transfers
          SET status = 'claimed', claimed_by_user_key = ${userKey}
          WHERE code = ${code}
        `;

        return res.status(200).json({ ok: true, device: newDevice });
      }

      if (action === 'book_service') {
        const ticketId = `DM-${crypto.randomInt(1000, 9999)}`;
        await sql`
          INSERT INTO service_bookings (id, user_key, device_id, device_serial, booking_type, hotline, status)
          VALUES (
            ${ticketId}, ${userKey}, ${String(body.deviceId || '')},
            ${String(body.deviceSerial || '')}, ${String(body.bookingType || 'technician')},
            ${String(body.hotline || '19960')}, 'confirmed'
          )
        `;
        return res.status(200).json({ ok: true, ticketId });
      }

      if (action === 'report_fraud') {
        const reportId = `FR-${crypto.randomInt(1000, 9999)}`;
        await sql`
          INSERT INTO fraud_reports (id, user_key, qr_payload, notes)
          VALUES (
            ${reportId}, ${userKey}, ${String(body.qrPayload || '')}, ${String(body.notes || '')}
          )
        `;
        return res.status(200).json({ ok: true, reportId });
      }

      return res.status(400).json({ ok: false, error: 'Unsupported action' });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Neon vault API error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Server error' });
  }
}
