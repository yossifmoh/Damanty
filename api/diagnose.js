import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { getSessionFromRequest } from './_authUtils.js';

const GEMINI_MODELS = [
  {
    name: 'gemini-3.8-flash',
    thinkingConfig: { thinkingLevel: 'LOW', includeThoughts: false },
    maxOutputTokens: 1024,
  },
  {
    name: 'gemini-3.0-flash',
    thinkingConfig: { thinkingLevel: 'LOW', includeThoughts: false },
    maxOutputTokens: 1024,
  },
  {
    name: 'gemini-2.5-flash',
    thinkingConfig: { thinkingBudget: 0 },
    maxOutputTokens: 512,
  },
];

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
      `Be super concise to save tokens: write a short title (<=60 chars), a 1-2 sentence diagnosis summary, ` +
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
      title: String(obj.title).slice(0, 120),
      summary: String(obj.summary).slice(0, 360),
      steps,
      recommendTechnician: Boolean(obj.recommendTechnician),
    };
  } catch {
    return null;
  }
}

async function callGeminiModel(modelSpec, apiKey, systemText, userText) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelSpec.name}:generateContent`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 14000);

  try {
    const apiRes = await fetch(endpoint, {
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
          thinkingConfig: modelSpec.thinkingConfig,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              summary: { type: 'string' },
              steps: {
                type: 'array',
                items: { type: 'string' },
              },
              recommendTechnician: { type: 'boolean' },
            },
            required: ['title', 'summary', 'steps', 'recommendTechnician'],
          },
          temperature: 0.25,
          maxOutputTokens: modelSpec.maxOutputTokens,
        },
      }),
    });

    clearTimeout(timer);

    if (!apiRes.ok) {
      const errText = await apiRes.text().catch(() => '');
      return {
        ok: false,
        status: apiRes.status,
        detail: errText.slice(0, 220),
      };
    }

    const payload = await apiRes.json();
    const parts = payload?.candidates?.[0]?.content?.parts || [];
    const answerPart =
      parts.find((p) => !p.thought && typeof p.text === 'string') ||
      parts[parts.length - 1];
    const parsed = parseGeminiJson(answerPart?.text || '');
    if (!parsed) {
      return { ok: false, status: 502, detail: 'GEMINI_PARSE_ERROR' };
    }
    return {
      ok: true,
      model: modelSpec.name,
      diagnosis: parsed,
    };
  } catch (error) {
    clearTimeout(timer);
    return {
      ok: false,
      status: 502,
      detail: error?.name === 'AbortError' ? 'GEMINI_TIMEOUT' : 'GEMINI_NETWORK_ERROR',
    };
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

  let lastFailure = null;
  for (const modelSpec of GEMINI_MODELS) {
    const attempt = await callGeminiModel(modelSpec, apiKey, systemText, userText);
    if (attempt.ok) {
      return res.status(200).json({
        ok: true,
        configured: true,
        source: 'gemini',
        model: attempt.model,
        diagnosis: attempt.diagnosis,
        remainingQuota: quota.remaining,
      });
    }
    lastFailure = attempt;
    if (attempt.status !== 404 && attempt.status !== 400) {
      break;
    }
  }

  return res.status(502).json({
    ok: false,
    configured: true,
    error: 'GEMINI_UPSTREAM_ERROR',
    statusCode: lastFailure?.status || 502,
    detail: lastFailure?.detail || 'UPSTREAM_FAILED',
  });
}
