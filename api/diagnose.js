import {
  checkAndConsumeAiQuota,
  callGeminiStructured,
} from './_geminiUtils.js';

const DIAGNOSE_MODELS = [
  {
    name: 'gemini-3.8-flash',
    thinkingConfig: { thinkingLevel: 'LOW', includeThoughts: false },
    maxOutputTokens: 1024,
  },
  {
    name: 'gemini-3.1-flash-lite',
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

const DIAGNOSE_SCHEMA = {
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
};

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

  const quota = await checkAndConsumeAiQuota(req, {
    scope: 'diag',
    authLimit: 25,
    guestLimit: 6,
  });

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

  const result = await callGeminiStructured({
    models: DIAGNOSE_MODELS,
    apiKey,
    systemText,
    userParts: [{ text: userText }],
    responseSchema: DIAGNOSE_SCHEMA,
    temperature: 0.25,
  });

  if (!result.ok) {
    return res.status(502).json({
      ok: false,
      configured: true,
      error: 'GEMINI_UPSTREAM_ERROR',
      statusCode: result.status,
      detail: result.detail,
    });
  }

  const obj = result.data || {};
  const steps = Array.isArray(obj.steps)
    ? obj.steps.map((s) => String(s || '').trim()).filter(Boolean).slice(0, 5)
    : [];

  if (!obj.title || !obj.summary || steps.length === 0) {
    return res.status(502).json({
      ok: false,
      configured: true,
      error: 'GEMINI_INVALID_DIAGNOSIS_SHAPE',
    });
  }

  return res.status(200).json({
    ok: true,
    configured: true,
    source: 'gemini',
    model: result.model,
    diagnosis: {
      title: String(obj.title).slice(0, 120),
      summary: String(obj.summary).slice(0, 360),
      steps,
      recommendTechnician: Boolean(obj.recommendTechnician),
    },
    remainingQuota: quota.remaining,
  });
}
