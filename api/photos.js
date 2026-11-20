import { neon } from '@neondatabase/serverless';
import { put, get, del } from '@vercel/blob';
import { getSessionFromRequest } from './_authUtils.js';

function scopeId(userKey, rawId) {
  const prefix = `${userKey}::`;
  return String(rawId).startsWith(prefix) ? String(rawId) : `${prefix}${rawId}`;
}

async function ensureProofColumns(sql) {
  await sql`
    ALTER TABLE receipt_proofs ADD COLUMN IF NOT EXISTS blob_pathname TEXT
  `;
}

export default async function handler(req, res) {
  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connStr) {
    return res.status(503).json({ ok: false, error: 'Database not configured' });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return res.status(503).json({ ok: false, error: 'Blob storage not configured' });
  }

  const sql = neon(connStr);
  const session = getSessionFromRequest(req);
  const userKey = session?.userId || 'eg-demo-guest';

  try {
    await ensureProofColumns(sql);

    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const { deviceId, proofId, title, docType, sha256, capturedAt, dataUrl } = body;

      if (!deviceId || !proofId || !dataUrl || !String(dataUrl).startsWith('data:image/')) {
        return res.status(400).json({ ok: false, error: 'INVALID_IMAGE_PAYLOAD' });
      }

      const match = String(dataUrl).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        return res.status(400).json({ ok: false, error: 'INVALID_DATA_URL' });
      }

      const contentType = match[1];
      const buffer = Buffer.from(match[2], 'base64');
      if (buffer.length > 4 * 1024 * 1024) {
        return res.status(413).json({ ok: false, error: 'IMAGE_TOO_LARGE' });
      }

      const ext = contentType.includes('png') ? 'png' : 'jpg';
      const pathname = `damanty/${userKey}/${deviceId}/${proofId}.${ext}`;
      const blob = await put(pathname, buffer, {
        access: 'private',
        contentType,
        addRandomSuffix: false,
        allowOverwrite: true,
      });

      const scopedDevId = scopeId(userKey, deviceId);
      const scopedProofId = scopeId(userKey, proofId);

      // Verify device belongs to user before attaching proof
      const devCheck = await sql`
        SELECT id FROM vault_devices WHERE id = ${scopedDevId} AND user_key = ${userKey} LIMIT 1
      `;
      if (devCheck.length === 0) {
        return res.status(404).json({ ok: false, error: 'DEVICE_NOT_FOUND' });
      }

      await sql`
        INSERT INTO receipt_proofs (
          id, device_id, user_key, title, doc_type, sha256, blob_pathname, captured_at
        ) VALUES (
          ${scopedProofId}, ${scopedDevId}, ${userKey}, ${title || 'Receipt Photo'},
          ${docType || 'warranty'}, ${sha256 || 'CLOUD-VERIFIED'}, ${blob.pathname}, ${capturedAt || ''}
        )
        ON CONFLICT (id) DO UPDATE SET
          blob_pathname = EXCLUDED.blob_pathname,
          sha256 = EXCLUDED.sha256
      `;

      return res.status(200).json({
        ok: true,
        proofId,
        pathname: blob.pathname,
      });
    }

    if (req.method === 'GET') {
      const proofId = String(req.query.id || '').trim();
      if (!proofId) {
        return res.status(400).json({ ok: false, error: 'MISSING_ID' });
      }

      const scopedProofId = scopeId(userKey, proofId);
      const rows = await sql`
        SELECT blob_pathname FROM receipt_proofs
        WHERE id = ${scopedProofId} AND user_key = ${userKey}
        LIMIT 1
      `;
      const row = rows[0];
      if (!row?.blob_pathname) {
        return res.status(404).json({ ok: false, error: 'PHOTO_NOT_FOUND' });
      }

      const result = await get(row.blob_pathname, { access: 'private' });
      if (!result?.stream) {
        return res.status(404).json({ ok: false, error: 'BLOB_NOT_FOUND' });
      }

      const arrayBuf = await new Response(result.stream).arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      res.setHeader('Content-Type', result.blob?.contentType || 'image/jpeg');
      res.setHeader('Cache-Control', 'private, no-store');
      return res.status(200).send(buf);
    }

    if (req.method === 'DELETE') {
      const proofId = String(req.query.id || '').trim();
      if (!proofId) {
        return res.status(400).json({ ok: false, error: 'MISSING_ID' });
      }

      const scopedProofId = scopeId(userKey, proofId);
      const rows = await sql`
        SELECT blob_pathname FROM receipt_proofs
        WHERE id = ${scopedProofId} AND user_key = ${userKey}
        LIMIT 1
      `;
      const pathname = rows[0]?.blob_pathname;

      await sql`
        DELETE FROM receipt_proofs WHERE id = ${scopedProofId} AND user_key = ${userKey}
      `;

      if (pathname) {
        await del(pathname).catch(() => {});
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Private blob photo API error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Photo storage error' });
  }
}
