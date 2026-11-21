import {
  checkAndConsumeAiQuota,
  callGeminiStructured,
} from './_geminiUtils.js';

// Prioritize lightest Vision models + LOW mediaResolution to minimize tokens
const OCR_MODELS = [
  {
    name: 'gemini-3.1-flash-lite',
    supportsMediaResolution: true,
    thinkingConfig: { thinkingLevel: 'LOW', includeThoughts: false },
    maxOutputTokens: 700,
  },
  {
    name: 'gemini-3.8-flash',
    supportsMediaResolution: true,
    thinkingConfig: { thinkingLevel: 'LOW', includeThoughts: false },
    maxOutputTokens: 700,
  },
  {
    name: 'gemini-3.0-flash',
    supportsMediaResolution: true,
    maxOutputTokens: 512,
  },
];

const OCR_SCHEMA = {
  type: 'object',
  properties: {
    brand: { type: 'string' },
    category: {
      type: 'string',
      enum: [
        'ac',
        'washer',
        'fridge',
        'tv',
        'microwave',
        'dishwasher',
        'heater',
        'stove',
        'small_appliance',
        'appliance',
      ],
    },
    nameAr: { type: 'string' },
    nameEn: { type: 'string' },
    model: { type: 'string' },
    serial: { type: 'string' },
    purchaseDate: { type: 'string' },
    warrantyYears: { type: 'integer' },
    retailer: { type: 'string' },
    docKind: { type: 'string', enum: ['warranty', 'maintenance'] },
    repairTitleAr: { type: 'string' },
    partAr: { type: 'string' },
    costEgp: { type: 'integer' },
    rawText: { type: 'string' },
  },
  required: ['brand', 'category', 'nameAr', 'nameEn', 'model', 'serial', 'purchaseDate', 'warrantyYears', 'docKind'],
};

const MAX_BASE64_LENGTH = 850_000; // ~600 KB binary image after client downscale

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

  const imageBase64 = String(body.imageBase64 || '').trim();
  const mimeType = /^image\/(jpeg|jpg|png|webp)$/i.test(body.mimeType || '')
    ? body.mimeType
    : 'image/jpeg';

  if (!imageBase64 || imageBase64.length < 32) {
    return res.status(400).json({ ok: false, error: 'IMAGE_REQUIRED' });
  }
  if (imageBase64.length > MAX_BASE64_LENGTH) {
    return res.status(413).json({ ok: false, error: 'IMAGE_TOO_LARGE' });
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
    scope: 'ocr',
    authLimit: 20,
    guestLimit: 4,
  });

  if (!quota.allowed) {
    return res.status(429).json({
      ok: false,
      configured: true,
      error: 'OCR_RATE_LIMITED',
    });
  }

  const systemText =
    `Extract Egyptian electrical appliance receipt/warranty data (handwritten or printed Arabic/English). ` +
    `Return concise JSON only. Dates must be YYYY-MM-DD (if unseen, today or empty string). ` +
    `Set warrantyYears to integer (default 3). Set docKind='maintenance' only if this is clearly a repair/service bill with parts/labor cost, else 'warranty'. ` +
    `Put short transcribed key text in rawText (<=140 chars).`;

  const result = await callGeminiStructured({
    models: OCR_MODELS,
    apiKey,
    systemText,
    userParts: [
      {
        inlineData: {
          mimeType,
          data: imageBase64,
        },
      },
      {
        text: 'Read this invoice/warranty card accurately (including Arabic handwriting) into compact JSON.',
      },
    ],
    responseSchema: OCR_SCHEMA,
    mediaResolution: 'MEDIA_RESOLUTION_LOW',
    temperature: 0.1,
    timeoutMs: 16000,
  });

  if (!result.ok) {
    return res.status(502).json({
      ok: false,
      configured: true,
      error: 'GEMINI_OCR_FAILED',
      statusCode: result.status,
      detail: result.detail,
    });
  }

  return res.status(200).json({
    ok: true,
    configured: true,
    source: 'gemini',
    model: result.model,
    extracted: result.data,
    remainingQuota: quota.remaining,
  });
}
