import { neon } from '@neondatabase/serverless';

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
      captured_at TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

async function upsertDevice(sql, userKey, d) {
  await sql`
    INSERT INTO vault_devices (
      id, user_key, brand, brand_ar, category, name_en, name_ar, model, serial,
      purchase_date, expiry_date, remaining_pct, days_left, warranty_years,
      hotline, authorized_group_en, authorized_group_ar, retailer_en, retailer_ar, status
    ) VALUES (
      ${d.id}, ${userKey}, ${d.brand}, ${d.brandAr || d.brand}, ${d.category || 'washer'},
      ${d.nameEn}, ${d.nameAr || d.nameEn}, ${d.model || ''}, ${d.serial},
      ${d.purchaseDate || ''}, ${d.expiryDate || ''}, ${Number(d.remainingPct ?? 100)},
      ${Number(d.daysLeft ?? 1095)}, ${Number(d.warrantyYears ?? 3)},
      ${d.hotline || '19960'}, ${d.authorizedGroupEn || ''}, ${d.authorizedGroupAr || ''},
      ${d.retailerEn || ''}, ${d.retailerAr || ''}, ${d.status || 'active'}
    )
    ON CONFLICT (id) DO UPDATE SET
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
  await sql`
    INSERT INTO maintenance_logs (
      id, device_id, user_key, log_date, title_en, title_ar, part_en, part_ar,
      cost_egp, covered_by_warranty, tech_center_en, tech_center_ar
    ) VALUES (
      ${log.id}, ${deviceId}, ${userKey}, ${log.date || ''},
      ${log.titleEn || ''}, ${log.titleAr || ''}, ${log.partEn || ''}, ${log.partAr || ''},
      ${Number(log.costEgp || 0)}, ${Boolean(log.coveredByWarranty)},
      ${log.techCenterEn || ''}, ${log.techCenterAr || ''}
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

async function insertReceiptProof(sql, userKey, deviceId, proof) {
  if (!proof?.id || !proof?.sha256) return;
  await sql`
    INSERT INTO receipt_proofs (id, device_id, user_key, title, doc_type, sha256, captured_at)
    VALUES (
      ${proof.id}, ${deviceId}, ${userKey}, ${proof.title || 'Receipt'},
      ${proof.docType || 'warranty'}, ${proof.sha256}, ${proof.capturedAt || ''}
    )
    ON CONFLICT (id) DO NOTHING
  `;
}

export default async function handler(req, res) {
  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connStr) {
    return res.status(503).json({ ok: false, error: 'Neon DATABASE_URL not configured' });
  }

  const sql = neon(connStr);

  try {
    await ensureSchema(sql);

    if (req.method === 'GET') {
      const userKey = String(req.query.userKey || 'eg-default-vault');
      const devicesRows = await sql`
        SELECT * FROM vault_devices WHERE user_key = ${userKey} ORDER BY created_at DESC
      `;
      const logsRows = await sql`
        SELECT * FROM maintenance_logs WHERE user_key = ${userKey} ORDER BY created_at DESC
      `;
      const proofsRows = await sql`
        SELECT * FROM receipt_proofs WHERE user_key = ${userKey} ORDER BY created_at DESC
      `;

      const logsByDevice = {};
      for (const l of logsRows) {
        if (!logsByDevice[l.device_id]) logsByDevice[l.device_id] = [];
        logsByDevice[l.device_id].push({
          id: l.id,
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
        if (!proofsByDevice[p.device_id]) proofsByDevice[p.device_id] = [];
        proofsByDevice[p.device_id].push({
          id: p.id,
          title: p.title,
          docType: p.doc_type,
          sha256: p.sha256,
          capturedAt: p.captured_at,
        });
      }

      const devices = devicesRows.map((row) => ({
        id: row.id,
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
        maintenanceLog: logsByDevice[row.id] || [],
        cloudProofs: proofsByDevice[row.id] || [],
      }));

      return res.status(200).json({ ok: true, devices, proofsCount: proofsRows.length });
    }

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const userKey = String(body.userKey || 'eg-default-vault');
      const action = body.action;

      if (action === 'sync_all' && Array.isArray(body.devices)) {
        for (const d of body.devices) {
          await upsertDevice(sql, userKey, d);
        }
        return res.status(200).json({ ok: true, syncedCount: body.devices.length });
      }

      if (action === 'add_device' && body.device) {
        await upsertDevice(sql, userKey, body.device);
        if (body.proof) {
          await insertReceiptProof(sql, userKey, body.device.id, body.proof);
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

      return res.status(400).json({ ok: false, error: 'Unsupported action' });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Neon vault API error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Server error' });
  }
}
