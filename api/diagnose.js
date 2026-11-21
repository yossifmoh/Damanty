import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { getSessionFromRequest } from './_authUtils.js';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const WINDOW_MINUTES = 15;
const AUTH_LIMIT = 25;
const GUEST_LIMIT = 6;

function hashClientIp(req) {
  const fwd = req.headers?.['x-forwarded-for'];
  const ip =
    (typeof fwd === 'string' ? fwd.split(',')[0].trim() : '') ||
    req.socket?.remoteAddress ||
    'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

async function checkAndConsumeQuota(key, maxRequests) {
  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connStr) return { allowed: true };

  try {
    const sql = neon(connStr);
    await sql`
      CREATE TABLE IF NOT EXISTS ai_rate_limits (
        bucket_key TEXT PRIMARY KEY,
        request_count INTEGER NOT NULL DEFAULT 0,
        window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    const existing = await sql`
      SELECT request_count, window_start
      FROM ai_rate_limits
      WHERE bucket_key = ${key}
      LIMIT 1
    `;

    const row = existing[0];
    const windowCutoff = Date.now() - WINDOW_MINUTES * 60 * 1000;

    if (!row || new Date(row.window_start).getTime() < windowCutoff) {
      await sql`
        INSERT INTO ai_rate_limits (bucket_key, request_count, window_start)
        VALUES (${key}, 1, NOW())
        ON CONFLICT (bucket_key) DO UPDATE SET
          request_count = 1,
          window_start = NOW()
      `;
      return { allowed: true, remaining: maxRequests - 1 };
    }

    if (Number(row.request_count) >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    await sql`
      UPDATE ai_rate_limits
      SET request_count = request_count + 1
      WHERE bucket_key = ${key}
    `;
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - (Number(row.request_count) + 1)),
    };
  } catch {
    // Allow diagnostic request if DB rate-limit check is momentarily unavailable
    return { allowed: true };
  }
}

function buildCompactPrompt({ query, lang, device, devices }) {
  const isAr = lang !== 'en';
  const targetLang = isAr ? 'Egyptian / clear Arabic' : 'concise English';

  const deviceSummary = device
    ? `Target Device: ${device.nameAr || device.nameEn} (${device.brand || ''} ${
        device.model || ''
      }, category: ${device.category || 'appliance'}, warranty status: ${
        device.status || 'active'
      }, hotline: ${device.hotline || 'official brand service'})`
    : `User Vault Appliances: ${(devices || [])
        .slice(0, 6)
        .map((d) => `${d.nameAr || d.nameEn} [${d.brand || ''} ${d.model || ''}]`)
        .join(' | ')}`;

  return {
    systemText:
      `You are Damanty (ضمنتي), an expert home electrical appliance technician assistant in Egypt. ` +
      `Respond strictly in valid JSON in ${targetLang}. ` +
      `Be super concise to save tokens: write a short title (<=55 chars), a 1-2 sentence diagnosis summary, ` +
      `and 3 to 4 safe, practical DIY checks the user can try right now. ` +
      `NEVER instruct users to open live high-voltage panels, touch gas lines, or refill refrigerant. ` +
      `Set recommendTechnician=true if it involves electrical sparks/breaker tripping, burnt smell, gas leak, compressor/PCB failure, water leaking onto wiring, or likely needs an authorized technician.`,
    userText: `${deviceSummary}\nUser Question: "${query}"`,
  };
}

function parseGeminiJson(rawText) {
  if (!rawText) return null;
  const cleaned = String(rawText)
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();
  try {
    const obj = JSON.parse(cleaned);
    if (!obj || typeof obj !== 'object') return null;
    const steps = Array.isArray(obj.steps)
      ? obj.steps
          .map((s) => String(s || '').trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];
    if (!obj.title || !obj.summary || steps.length === 0) return null;
    return {
      title: String(obj.title).slice(0, 110),
      summary: String(obj.summary).slice(0, 320),
      steps,
      recommendTechnician: Boolean(obj.recommendTechnician),
    };
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  res.setHeader('Pragma', 'no-cache');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'METHOD_NOT_ALLOWED' });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    body = {};
  }
  const query = String(body.query || '').trim().slice(0, 350);
  const lang = body.lang === 'en' ? 'en' : 'ar';
  const device = body.device && typeof body.device === 'object' ? body.device : null;
  const devices = Array.isArray(body.devices) ? body.devices : [];

  if (!query) {
    return res.status(400).json({ ok: false, error: 'QUERY_REQUIRED' });
  }
  if (!device && devices.length === 0) {
    return res.status(400).json({ ok: false, error: 'DEVICES_REQUIRED' });
  }

  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(200).json({
      ok: false,
      configured: false,
      reason: 'GEMINI_KEY_MISSING',
    });
  }

  const session = getSessionFromRequest(req);
  const rateKey = session?.userId
    ? `u:${session.userId}`
    : `g:${hashClientIp(req)}`;
  const quota = await checkAndConsumeQuota(
    rateKey,
    session?.userId ? AUTH_LIMIT : GUEST_LIMIT
  );

  if (!quota.allowed) {
    return res.status(429).json({
      ok: false,
      configured: true,
      error: 'AI_RATE_LIMITED',
    });
  }

  const { systemText, userText } = buildCompactPrompt({
    query,
    lang,
    device,
    devices,
  });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 14000);

    const apiRes = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemText }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userText }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              summary: { type: 'STRING' },
              steps: {
                type: 'ARRAY',
                items: { type: 'STRING' },
              },
              recommendTechnician: { type: 'BOOLEAN' },
            },
            required: ['title', 'summary', 'steps', 'recommendTechnician'],
          },
          thinkingConfig: {
            thinkingBudget: 0,
          },
          temperature: 0.25,
          maxOutputTokens: 420,
        },
      }),
    });

    clearTimeout(timer);

    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => '');
      return res.status(502).json({
        ok: false,
        configured: true,
        error: 'GEMINI_UPSTREAM_ERROR',
        statusCode: apiRes.status,
        detail: errText.slice(0, 180),
      });
    }

    const payload = await apiRes.json();
    const rawText = payload?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = parseGeminiJson(rawText);

    if (!parsed) {
      return res.status(502).json({
        ok: false,
        configured: true,
        error: 'GEMINI_PARSE_ERROR',
      });
    }

    return res.status(200).json({
      ok: true,
      configured: true,
      source: 'gemini',
      model: GEMINI_MODEL,
      diagnosis: parsed,
      remainingQuota: quota.remaining,
    });
  } catch (error) {
    return res.status(502).json({
      ok: false,
      configured: true,
      error: error?.name === 'AbortError' ? 'GEMINI_TIMEOUT' : 'GEMINI_NETWORK_ERROR',
    });
  }
}
