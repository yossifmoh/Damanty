import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  getSessionFromRequest,
  buildSessionCookie,
  buildClearSessionCookie,
} from './_authUtils.js';

const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 8;

async function ensureUsersTable(sql) {
  await sql`
    CREATE TABLE IF NOT EXISTS vault_users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS auth_rate_limits (
      rate_key TEXT PRIMARY KEY,
      attempts INTEGER DEFAULT 0,
      window_start BIGINT NOT NULL
    )
  `;
}

function getClientIp(req) {
  const fwd = req.headers?.['x-forwarded-for'] || '';
  return String(fwd).split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
}

async function checkRateLimit(sql, rateKey) {
  const now = Date.now();
  const rows = await sql`
    SELECT attempts, window_start FROM auth_rate_limits WHERE rate_key = ${rateKey} LIMIT 1
  `;
  const row = rows[0];
  if (!row) return { blocked: false };
  if (now - Number(row.window_start) > RATE_WINDOW_MS) {
    await sql`DELETE FROM auth_rate_limits WHERE rate_key = ${rateKey}`;
    return { blocked: false };
  }
  return { blocked: Number(row.attempts) >= MAX_FAILED_ATTEMPTS };
}

async function recordFailedAttempt(sql, rateKey) {
  const now = Date.now();
  await sql`
    INSERT INTO auth_rate_limits (rate_key, attempts, window_start)
    VALUES (${rateKey}, 1, ${now})
    ON CONFLICT (rate_key) DO UPDATE SET
      attempts = CASE
        WHEN ${now} - auth_rate_limits.window_start > ${RATE_WINDOW_MS} THEN 1
        ELSE auth_rate_limits.attempts + 1
      END,
      window_start = CASE
        WHEN ${now} - auth_rate_limits.window_start > ${RATE_WINDOW_MS} THEN ${now}
        ELSE auth_rate_limits.window_start
      END
  `;
}

async function clearRateLimit(sql, rateKey) {
  await sql`DELETE FROM auth_rate_limits WHERE rate_key = ${rateKey}`.catch(() => {});
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connStr) {
    return res.status(503).json({ ok: false, error: 'Database not configured' });
  }

  const sql = neon(connStr);

  try {
    if (req.method === 'GET') {
      const session = getSessionFromRequest(req);
      if (!session) {
        return res.status(200).json({ ok: true, user: null });
      }
      return res.status(200).json({
        ok: true,
        user: {
          id: session.userId,
          name: session.name,
          phone: session.phone,
          email: session.email,
        },
      });
    }

    if (req.method === 'POST') {
      await ensureUsersTable(sql);
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
      const action = body.action;

      if (action === 'signout') {
        res.setHeader('Set-Cookie', buildClearSessionCookie());
        return res.status(200).json({ ok: true });
      }

      if (action === 'signup') {
        const name = String(body.name || '').trim();
        const phone = String(body.phone || '').trim();
        const email = String(body.email || '').trim().toLowerCase();
        const password = String(body.password || '');

        if (!name || !email || password.length < 6) {
          return res.status(400).json({
            ok: false,
            error: 'INVALID_INPUT',
          });
        }

        const existing = await sql`
          SELECT id FROM vault_users WHERE email = ${email} LIMIT 1
        `;
        if (existing.length > 0) {
          return res.status(409).json({
            ok: false,
            error: 'EMAIL_EXISTS',
          });
        }

        const userId = `usr-${crypto.randomUUID()}`;
        const pwHash = hashPassword(password);
        await sql`
          INSERT INTO vault_users (id, name, phone, email, password_hash)
          VALUES (${userId}, ${name}, ${phone}, ${email}, ${pwHash})
        `;

        const user = { id: userId, name, phone, email };
        const token = createSessionToken(user);
        res.setHeader('Set-Cookie', buildSessionCookie(token));
        return res.status(201).json({ ok: true, user });
      }

      if (action === 'signin') {
        const identifier = String(body.identifier || '').trim().toLowerCase();
        const password = String(body.password || '');

        if (!identifier || !password) {
          return res.status(400).json({ ok: false, error: 'INVALID_INPUT' });
        }

        const rateKey = `${getClientIp(req)}::${identifier}`;
        const limitState = await checkRateLimit(sql, rateKey);
        if (limitState.blocked) {
          return res.status(429).json({ ok: false, error: 'RATE_LIMITED' });
        }

        const rows = await sql`
          SELECT id, name, phone, email, password_hash
          FROM vault_users
          WHERE LOWER(email) = ${identifier} OR phone = ${identifier}
          LIMIT 1
        `;
        const found = rows[0];
        if (!found || !verifyPassword(password, found.password_hash)) {
          await recordFailedAttempt(sql, rateKey);
          return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
        }

        await clearRateLimit(sql, rateKey);
        const user = {
          id: found.id,
          name: found.name,
          phone: found.phone || '',
          email: found.email,
        };
        const token = createSessionToken(user);
        res.setHeader('Set-Cookie', buildSessionCookie(token));
        return res.status(200).json({ ok: true, user });
      }

      return res.status(400).json({ ok: false, error: 'Unsupported action' });
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Auth API error:', error);
    return res.status(500).json({ ok: false, error: 'AUTH_SERVER_ERROR' });
  }
}
