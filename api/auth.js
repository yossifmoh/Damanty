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
}

export default async function handler(req, res) {
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

        const rows = await sql`
          SELECT id, name, phone, email, password_hash
          FROM vault_users
          WHERE LOWER(email) = ${identifier} OR phone = ${identifier}
          LIMIT 1
        `;
        const found = rows[0];
        if (!found || !verifyPassword(password, found.password_hash)) {
          return res.status(401).json({ ok: false, error: 'INVALID_CREDENTIALS' });
        }

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
