import jsQRImport from 'jsqr';
const jsQR = jsQRImport?.default || jsQRImport;

const BRAND_CATALOG = [
  {
    keys: ['lg', 'إل جي', 'ال جي', 'ال جى', 'lg electronics'],
    brand: 'LG',
    brandAr: 'إل جي',
    hotline: '19960',
    groupEn: 'LG Electronics Egypt',
    groupAr: 'إل جي إلكترونيكس مصر',
  },
  {
    keys: ['tornado', 'تورنيدو'],
    brand: 'Tornado',
    brandAr: 'تورنيدو',
    hotline: '19319',
    groupEn: 'El Araby Group',
    groupAr: 'مجموعة العربي',
  },
  {
    keys: ['sharp', 'شارب'],
    brand: 'Sharp',
    brandAr: 'شارب',
    hotline: '19319',
    groupEn: 'El Araby Group',
    groupAr: 'مجموعة العربي',
  },
  {
    keys: ['toshiba', 'توشيبا'],
    brand: 'Toshiba',
    brandAr: 'توشيبا',
    hotline: '19319',
    groupEn: 'El Araby Group',
    groupAr: 'مجموعة العربي',
  },
  {
    keys: ['el araby', 'elaraby', 'العربي', 'العربى'],
    brand: 'El Araby',
    brandAr: 'العربي',
    hotline: '19319',
    groupEn: 'El Araby Group',
    groupAr: 'مجموعة العربي',
  },
  {
    keys: ['samsung', 'سامسونج'],
    brand: 'Samsung',
    brandAr: 'سامسونج',
    hotline: '16580',
    groupEn: 'Samsung Egypt',
    groupAr: 'سامسونج مصر',
  },
  {
    keys: ['fresh', 'فريش'],
    brand: 'Fresh',
    brandAr: 'فريش',
    hotline: '19059',
    groupEn: 'Fresh Electric Egypt',
    groupAr: 'فريش إلكتريك مصر',
  },
  {
    keys: ['beko', 'بيكو'],
    brand: 'Beko',
    brandAr: 'بيكو',
    hotline: '16165',
    groupEn: 'Beko Egypt',
    groupAr: 'بيكو مصر',
  },
  {
    keys: ['zanussi', 'زانوسي', 'زانوسى'],
    brand: 'Zanussi',
    brandAr: 'زانوسي',
    hotline: '19999',
    groupEn: 'Electrolux / Zanussi Egypt',
    groupAr: 'زانوسي مصر',
  },
  {
    keys: ['carrier', 'كاريير'],
    brand: 'Carrier',
    brandAr: 'كاريير',
    hotline: '19111',
    groupEn: 'Miraco Carrier Egypt',
    groupAr: 'ميراكو كاريير مصر',
  },
];

// Egyptian appliance model code prefix dictionary (0-token instant lookup)
const MODEL_PREFIX_CATALOG = [
  { prefix: /^F[24]V|^FH|^WM|^RH90/i, brand: 'LG', category: 'washer', labelEn: 'LG AI DD Front-Load Washer', labelAr: 'غسالة إل جي أوتوماتيك AI DD' },
  { prefix: /^GR-|^GN-|^GC-/i, brand: 'LG', category: 'fridge', labelEn: 'LG Inverter Linear Refrigerator', labelAr: 'ثلاجة إل جي إنفرتر' },
  { prefix: /^OLED|^QNED|^UR|^UT/i, brand: 'LG', category: 'tv', labelEn: 'LG 4K Smart TV', labelAr: 'شاشة إل جي 4K سمارت' },
  { prefix: /^TH-C|^TH-H|^TH-V/i, brand: 'Tornado', category: 'ac', labelEn: 'Tornado Inverter Split AC', labelAr: 'تكييف تورنيدو إنفرتر سبليت' },
  { prefix: /^TWV|^TWE|^TW-/i, brand: 'Tornado', category: 'washer', labelEn: 'Tornado Automatic Washer', labelAr: 'غسالة تورنيدو أوتوماتيك' },
  { prefix: /^4T-C|^2T-C/i, brand: 'Sharp', category: 'tv', labelEn: 'Sharp 4K Google TV', labelAr: 'شاشة شارب 4K جوجل تي في' },
  { prefix: /^SJ-/i, brand: 'Sharp', category: 'fridge', labelEn: 'Sharp Digital No-Frost Fridge', labelAr: 'ثلاجة شارب ديجيتال نوفروست' },
  { prefix: /^R-78|^R-34|^R-25/i, brand: 'Sharp', category: 'kitchen', labelEn: 'Sharp Inverter Microwave', labelAr: 'ميكروويف شارب إنفرتر' },
  { prefix: /^RT|^RB|^RS/i, brand: 'Samsung', category: 'fridge', labelEn: 'Samsung Twin Cooling Refrigerator', labelAr: 'ثلاجة سامسونج توين كولينج' },
  { prefix: /^WW|^WD/i, brand: 'Samsung', category: 'washer', labelEn: 'Samsung EcoBubble Washer', labelAr: 'غسالة سامسونج إيكو بابل' },
  { prefix: /^UA|^QA/i, brand: 'Samsung', category: 'tv', labelEn: 'Samsung Crystal / QLED 4K TV', labelAr: 'شاشة سامسونج 4K سمارت' },
];

const RETAILER_CATALOG = [
  { keys: ['b.tech', 'btech', 'بي تك', 'بيتك'], en: 'B.Tech Egypt', ar: 'بي تك مصر' },
  { keys: ['el araby', 'العربي', 'العربى'], en: 'El Araby Official Store', ar: 'معرض العربي الرسمي' },
  { keys: ['carrefour', 'كارفور'], en: 'Carrefour Egypt', ar: 'كارفور مصر' },
  { keys: ['raya', 'راية'], en: 'Raya Shop', ar: 'راية شوب' },
  { keys: ['2b', 'تو بي'], en: '2B Egypt', ar: 'تو بي مصر' },
  { keys: ['amazon', 'أمازون'], en: 'Amazon Egypt', ar: 'أمازون مصر' },
];

export function detectQrFromCanvas(canvas) {
  try {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    });
    return code?.data || null;
  } catch {
    return null;
  }
}

export async function detectQrFromDataUrl(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(detectQrFromCanvas(canvas));
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
}

/**
 * Local 0-token image enhancement: upscales small receipts, converts to grayscale,
 * and boosts contrast to improve local Tesseract accuracy on faded/thermal paper.
 */
export function preprocessImageForOcr(dataUrl) {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const targetMax = 1600;
      const maxDim = Math.max(img.width, img.height);
      const scale = maxDim < 900 ? Math.min(2, targetMax / maxDim) : Math.min(1, targetMax / maxDim);
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);

      try {
        const imageData = ctx.getImageData(0, 0, w, h);
        const data = imageData.data;
        const contrast = 1.38;
        for (let i = 0; i < data.length; i += 4) {
          const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          let enhanced = (lum - 128) * contrast + 128;
          enhanced = enhanced < 0 ? 0 : enhanced > 255 ? 255 : enhanced;
          data[i] = enhanced;
          data[i + 1] = enhanced;
          data[i + 2] = enhanced;
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export async function runTesseractOcr(imageSource, onProgress) {
  const tesseractMod = await import('tesseract.js');
  const createWorker = tesseractMod.createWorker || tesseractMod.default?.createWorker;
  let worker;
  const logger = (m) => {
    if (m.status === 'recognizing text' && typeof m.progress === 'number') {
      onProgress?.(Math.min(95, Math.max(20, Math.round(20 + m.progress * 75))));
    }
  };

  try {
    worker = await createWorker(['eng', 'ara'], 1, { logger });
  } catch {
    worker = await createWorker('eng', 1, { logger });
  }

  try {
    const enhancedSource = await preprocessImageForOcr(imageSource);
    const {
      data: { text },
    } = await worker.recognize(enhancedSource);
    return (text || '').trim();
  } finally {
    await worker.terminate();
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function processPdfFile(file, onProgress) {
  onProgress?.(10);
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const maxPages = Math.min(pdf.numPages, 3);
  let extractedText = '';

  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item) => item.str).join(' ');
    extractedText += `\n${pageText}`;
  }

  const firstPage = await pdf.getPage(1);
  const viewport = firstPage.getViewport({ scale: 1.8 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  await firstPage.render({ canvasContext: ctx, viewport }).promise;

  const previewUrl = canvas.toDataURL('image/png');
  const qrText = detectQrFromCanvas(canvas);
  onProgress?.(35);

  let finalText = extractedText.trim();
  if (finalText.length < 25) {
    const ocrText = await runTesseractOcr(previewUrl, onProgress);
    finalText = [finalText, ocrText].filter(Boolean).join('\n');
  }

  onProgress?.(100);
  return { rawText: finalText, qrText, previewUrl };
}

async function processWordFile(file, onProgress) {
  onProgress?.(15);
  const arrayBuffer = await file.arrayBuffer();
  const ext = file.name.toLowerCase();

  if (ext.endsWith('.doc') && !ext.endsWith('.docx')) {
    const bytes = new Uint8Array(arrayBuffer);
    const decoded = new TextDecoder('latin1').decode(bytes);
    const readable = (decoded.match(/[A-Za-z0-9:/.,\- ]{4,}/g) || []).join(' ');
    onProgress?.(100);
    return {
      rawText: readable.slice(0, 2000),
      qrText: null,
      previewUrl: null,
      warningType: 'legacy_doc',
    };
  }

  const mammothMod = await import('mammoth');
  const mammoth = mammothMod.default || mammothMod;
  const rawResult = await mammoth.extractRawText({ arrayBuffer });
  let text = (rawResult?.value || '').trim();
  let embeddedPreview = null;

  try {
    await mammoth.convertToHtml(
      { arrayBuffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          if (!embeddedPreview) {
            const base64 = await image.read('base64');
            embeddedPreview = `data:${image.contentType};base64,${base64}`;
          }
          return { src: '' };
        }),
      }
    );
  } catch {
    // Continue even if embedded image parsing fails
  }

  let qrText = null;
  if (embeddedPreview) {
    qrText = await detectQrFromDataUrl(embeddedPreview);
    if (text.length < 30) {
      onProgress?.(35);
      const ocrText = await runTesseractOcr(embeddedPreview, onProgress);
      text = [text, ocrText].filter(Boolean).join('\n');
    }
  }

  onProgress?.(100);
  return { rawText: text, qrText, previewUrl: embeddedPreview };
}

export async function extractFromImageSource(dataUrl, onProgress) {
  onProgress?.(10);
  const qrText = await detectQrFromDataUrl(dataUrl);
  const rawText = await runTesseractOcr(dataUrl, onProgress);
  onProgress?.(100);
  return { rawText, qrText, previewUrl: dataUrl };
}

export async function extractFromFile(file, onProgress) {
  const name = (file.name || '').toLowerCase();
  const type = (file.type || '').toLowerCase();

  if (type === 'application/pdf' || name.endsWith('.pdf')) {
    return processPdfFile(file, onProgress);
  }

  if (
    name.endsWith('.docx') ||
    name.endsWith('.doc') ||
    type.includes('wordprocessingml') ||
    type.includes('msword')
  ) {
    return processWordFile(file, onProgress);
  }

  const dataUrl = await readFileAsDataUrl(file);
  return extractFromImageSource(dataUrl, onProgress);
}

function addYearsIso(dateStr, years) {
  const base = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(base.getTime())) {
    const now = new Date();
    now.setFullYear(now.getFullYear() + years);
    return now.toISOString().slice(0, 10);
  }
  base.setFullYear(base.getFullYear() + years);
  return base.toISOString().slice(0, 10);
}

function parseDateFromText(text) {
  const isoMatch = text.match(/\b(202[0-9])[-/](\d{1,2})[-/](\d{1,2})\b/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  const dmyMatch = text.match(/\b(\d{1,2})[-/](\d{1,2})[-/](202[0-9])\b/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return new Date().toISOString().slice(0, 10);
}

export function parseEgyptianReceipt(rawText = '', qrText = '', fileName = '') {
  const combined = `${rawText}\n${qrText || ''}\n${fileName}`;
  const lower = combined.toLowerCase();

  const serialMatch =
    combined.match(/(?:s\/n|serial|sn|سيريال|التسلسلي)[\s:#-]*([A-Z0-9-]{6,20})/i) ||
    combined.match(/\b([A-Z]{2,5}[-]?[0-9]{4,}[-A-Z0-9]{2,})\b/);
  const modelMatch =
    combined.match(/(?:model|mod|موديل)[\s:#-]*([A-Z0-9-]{4,16})/i) ||
    combined.match(/\b([A-Z]{1,4}[-]?[0-9]{2,}[A-Z0-9-]{1,8})\b/);

  const detectedModel = modelMatch?.[1]?.toUpperCase() || '';
  const modelLookup = detectedModel
    ? MODEL_PREFIX_CATALOG.find((m) => m.prefix.test(detectedModel))
    : null;

  const matchedBrand =
    (modelLookup && BRAND_CATALOG.find((b) => b.brand === modelLookup.brand)) ||
    BRAND_CATALOG.find((b) => b.keys.some((k) => lower.includes(k))) || {
      brand: 'LG',
      brandAr: 'إل جي',
      hotline: '19960',
      groupEn: 'Authorized Service Egypt',
      groupAr: 'التوكيل المعتمد مصر',
    };

  const matchedRetailer =
    RETAILER_CATALOG.find((r) => r.keys.some((k) => lower.includes(k))) || {
      en: 'Authorized Egyptian Retailer',
      ar: 'موزع معتمد - مصر',
    };

  let category = modelLookup?.category || 'washer';
  let nameEn = modelLookup?.labelEn || `${matchedBrand.brand} Smart Home Appliance`;
  let nameAr = modelLookup?.labelAr || `جهاز ${matchedBrand.brandAr} منزلي ذكي`;

  if (!modelLookup) {
    if (/(ac|split|air\s?condition|inverter\s?1\.5|2\.25|تكييف|سبليت)/i.test(combined)) {
      category = 'ac';
      nameEn = `${matchedBrand.brand} Inverter Split AC`;
      nameAr = `تكييف ${matchedBrand.brandAr} إنفرتر سبليت`;
    } else if (/(fridge|refrigerator|freezer|ثلاجة|تلاجة|ديب\s?فريزر)/i.test(combined)) {
      category = 'fridge';
      nameEn = `${matchedBrand.brand} Digital Inverter Refrigerator`;
      nameAr = `ثلاجة ${matchedBrand.brandAr} ديجيتال إنفرتر`;
    } else if (/(tv|oled|qled|uhd|4k|شاشة|تلفزيون)/i.test(combined)) {
      category = 'tv';
      nameEn = `${matchedBrand.brand} 4K Smart TV`;
      nameAr = `شاشة ${matchedBrand.brandAr} 4K سمارت`;
    } else if (/(microwave|oven|cooker|ميكروويف|بوتاجاز|فرن)/i.test(combined)) {
      category = 'kitchen';
      nameEn = `${matchedBrand.brand} Kitchen Appliance`;
      nameAr = `جهاز مطبخ ${matchedBrand.brandAr}`;
    } else if (/(wash|dryer|غسالة|مجفف)/i.test(combined)) {
      category = 'washer';
      nameEn = `${matchedBrand.brand} Automatic Washer`;
      nameAr = `غسالة ${matchedBrand.brandAr} أوتوماتيك`;
    }
  }

  const serial =
    serialMatch?.[1]?.toUpperCase() ||
    `${matchedBrand.brand.slice(0, 3).toUpperCase()}-EG-${Date.now().toString().slice(-6)}`;
  const model = detectedModel || `${matchedBrand.brand.slice(0, 2).toUpperCase()}-2026X`;

  const purchaseDate = parseDateFromText(combined);
  let warrantyYears = 3;
  if (/(\b5\s*(?:years?|yrs?|سنوات|سنة|اعوام)\b)/i.test(combined)) warrantyYears = 5;
  else if (/(\b2\s*(?:years?|yrs?|سنتين|سنتان)\b)/i.test(combined)) warrantyYears = 2;
  else if (/(\b1\s*(?:year|yr|سنة)\b)/i.test(combined)) warrantyYears = 1;

  const expiryDate = addYearsIso(purchaseDate, warrantyYears);

  // Detect maintenance receipt clues (cost in EGP, repair keywords)
  const costMatch = combined.match(/(\d{2,6}(?:\.\d{1,2})?)\s*(?:egp|le|l\.e|جنيه|ج\.م)/i);
  const detectedCostEgp = costMatch ? Math.round(Number(costMatch[1])) : 0;
  const isMaintenanceClue =
    /(صيانة|تنظيف|فريون|كارتة|طلمبة|فلتر|تصليح|إصلاح|freon|repair|service|pcb|filter|pump)/i.test(
      combined
    );

  let repairTitleAr = 'صيانة دورية وفحص شامل';
  let repairTitleEn = 'Preventive Maintenance & Inspection';
  let partAr = 'فحص فني معتمد';
  let partEn = 'Authorized Technical Check';

  if (/(فريون|freon|r410)/i.test(combined)) {
    repairTitleAr = 'شحن فريون وفحص ضغط التبريد';
    repairTitleEn = 'Refrigerant Top-up & Pressure Check';
    partAr = 'فريون R410A أصلي';
    partEn = 'Genuine R410A Refrigerant';
  } else if (/(كارتة|pcb|board)/i.test(combined)) {
    repairTitleAr = 'إصلاح أو استبدال الكارتة الإلكترونية';
    repairTitleEn = 'Electronic PCB Board Service';
    partAr = 'كارتة PCB أصلية';
    partEn = 'Genuine PCB Module';
  } else if (/(طلمبة|pump|صرف)/i.test(combined)) {
    repairTitleAr = 'صيانة وتغيير طلمبة الصرف';
    repairTitleEn = 'Drain Pump Replacement';
    partAr = 'طلمبة صرف أصلية';
    partEn = 'Genuine Drain Pump';
  } else if (/(فلتر|filter)/i.test(combined)) {
    repairTitleAr = 'تنظيف واستبدال الفلتر';
    repairTitleEn = 'Filter Cleaning & Replacement';
    partAr = 'فلتر أصلي';
    partEn = 'Genuine Filter';
  }

  return {
    id: `dev-scan-${Date.now()}`,
    brand: matchedBrand.brand,
    brandAr: matchedBrand.brandAr,
    category,
    nameEn,
    nameAr,
    model,
    serial,
    purchaseDate,
    expiryDate,
    remainingPct: 100,
    daysLeft: warrantyYears * 365,
    warrantyYears,
    hotline: matchedBrand.hotline,
    authorizedGroupEn: matchedBrand.groupEn,
    authorizedGroupAr: matchedBrand.groupAr,
    retailerEn: matchedRetailer.en,
    retailerAr: matchedRetailer.ar,
    accentFrom: '#10b981',
    accentTo: '#059669',
    status: 'active',
    maintenanceLog: [],
    qrDetected: qrText || null,
    suggestedDocKind: isMaintenanceClue ? 'maintenance' : 'warranty',
    detectedCostEgp,
    repairTitleAr,
    repairTitleEn,
    partAr,
    partEn,
  };
}
