import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import { getSessionFromRequest } from './_authUtils.js';

const WINDOW_MINUTES = 15;

export function hashClientIp(req) {
  const fwd = req.headers?.['x-forwarded-for'];
  const ip =
    (typeof fwd === 'string' ? fwd.split(',')[0].trim() : '') ||
    req.socket?.remoteAddress ||
    'unknown';
  return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 24);
}

/**
 * Enforces per-user or per-IP Neon-backed rate limits across AI endpoints.
 */
export async function checkAndConsumeAiQuota(req, { scope = 'ai', authLimit = 25, guestLimit = 6 } = {}) {
  const session = getSessionFromRequest(req);
  const maxRequests = session?.userId ? authLimit : guestLimit;
  const bucketKey = session?.userId
    ? `${scope}:u:${session.userId}`
    : `${scope}:g:${hashClientIp(req)}`;

  const connStr = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!connStr) return { allowed: true, remaining: maxRequests };

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
      WHERE bucket_key = ${bucketKey}
      LIMIT 1
    `;

    const row = existing[0];
    const windowCutoff = Date.now() - WINDOW_MINUTES * 60 * 1000;

    if (!row || new Date(row.window_start).getTime() < windowCutoff) {
      await sql`
        INSERT INTO ai_rate_limits (bucket_key, request_count, window_start)
        VALUES (${bucketKey}, 1, NOW())
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
      WHERE bucket_key = ${bucketKey}
    `;
    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - (Number(row.request_count) + 1)),
    };
  } catch {
    return { allowed: true, remaining: maxRequests };
  }
}

export function cleanAndParseJson(rawText) {
  if (!rawText) return null;
  const cleaned = String(rawText)
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```/, '')
    .replace(/```$/, '')
    .trim();
  try {
    const obj = JSON.parse(cleaned);
    return obj && typeof obj === 'object' ? obj : null;
  } catch {
    return null;
  }
}

/**
 * Calls Google Gemini REST generateContent with automatic model fallback and structured JSON output.
 */
export async function callGeminiStructured({
  models,
  apiKey,
  systemText,
  userParts,
  responseSchema,
  mediaResolution = null,
  temperature = 0.2,
  timeoutMs = 15000,
}) {
  let lastFailure = null;

  for (const modelSpec of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelSpec.name}:generateContent`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const generationConfig = {
      responseMimeType: 'application/json',
      responseSchema,
      temperature,
      maxOutputTokens: modelSpec.maxOutputTokens,
    };
    if (modelSpec.thinkingConfig) {
      generationConfig.thinkingConfig = modelSpec.thinkingConfig;
    }
    if (mediaResolution && modelSpec.supportsMediaResolution) {
      generationConfig.mediaResolution = mediaResolution;
    }

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
              parts: userParts,
            },
          ],
          generationConfig,
        }),
      });

      clearTimeout(timer);

      if (!apiRes.ok) {
        const errText = await apiRes.text().catch(() => '');
        lastFailure = {
          status: apiRes.status,
          detail: errText.slice(0, 220),
        };
        if (apiRes.status === 404 || apiRes.status === 400) {
          continue;
        }
        break;
      }

      const payload = await apiRes.json();
      const parts = payload?.candidates?.[0]?.content?.parts || [];
      const answerPart =
        parts.find((p) => !p.thought && typeof p.text === 'string') ||
        parts[parts.length - 1];
      const parsed = cleanAndParseJson(answerPart?.text || '');

      if (!parsed) {
        lastFailure = { status: 502, detail: 'GEMINI_PARSE_ERROR' };
        continue;
      }

      return {
        ok: true,
        model: modelSpec.name,
        data: parsed,
        usage: payload?.usageMetadata || null,
      };
    } catch (error) {
      clearTimeout(timer);
      lastFailure = {
        status: 502,
        detail: error?.name === 'AbortError' ? 'GEMINI_TIMEOUT' : 'GEMINI_NETWORK_ERROR',
      };
    }
  }

  return {
    ok: false,
    status: lastFailure?.status || 502,
    detail: lastFailure?.detail || 'UPSTREAM_FAILED',
  };
}
