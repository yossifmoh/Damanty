import { TROUBLESHOOTING_GUIDES } from '../data/mockData';

const SYMPTOM_KB = [
  {
    id: 'kb-ac-water',
    category: 'ac',
    keywords: ['مية', 'ماء', 'ينقط', 'تنقيط', 'تسريب', 'water', 'leak', 'drip', 'drain'],
    code: 'DRAIN',
    titleAr: 'تنقيط مياه من الوحدة الداخلية للتكييف',
    titleEn: 'Indoor AC Water Dripping / Drain Blockage',
    savedEgp: 500,
    summaryAr:
      'السبب الشائع هو انسداد خرطوم صرف التكييف بالأتربة أو امتلاء الفلاتر. جرب الخطوات التالية أولاً:',
    summaryEn:
      'Usually caused by a clogged condensate drain pipe or dusty air filters. Try these checks first:',
    steps: [
      {
        id: 'w1',
        ar: 'افصل التكييف واخرج الفلاتر الأمامية واغسلها بماء فاتر ثم جففها تماماً.',
        en: 'Turn off the AC, remove the front dust filters, rinse with lukewarm water, and dry completely.',
      },
      {
        id: 'w2',
        ar: 'تأكد من عدم التواء أو ارتفاع طرف خرطوم الصرف الخارجي في البلكونة.',
        en: 'Inspect the outdoor condensate drain hose for kinks or upward bends trapping water.',
      },
      {
        id: 'w3',
        ar: 'شغّل وضع "المروحة فقط (Fan)" لمدة 20 دقيقة لتجفيف حوض الصرف الداخلي.',
        en: 'Run "Fan Only" mode for 20 minutes to clear moisture from the indoor drain pan.',
      },
    ],
  },
  {
    id: 'kb-washer-spin',
    category: 'washer',
    keywords: ['تعصر', 'مبتعصرش', 'عصر', 'صوت', 'اهتزاز', 'رجه', 'spin', 'vibrat', 'noise', 'ue', 'le'],
    code: 'UE / SPIN',
    titleAr: 'الغسالة لا تعصر أو تهتز بصوت مرتفع',
    titleEn: 'Washer Not Spinning / Heavy Vibration (UE)',
    savedEgp: 450,
    summaryAr:
      'غالباً بسبب عدم توازن الغسيل داخل الحلة أو بقاء مياه غير مصرفة تمنع بدء العصر.',
    summaryEn:
      'Typically triggered by an unbalanced drum load or residual water preventing high-speed spin.',
    steps: [
      {
        id: 'sp1',
        ar: 'افتح الباب وأعد توزيع الملابس بالتساوي داخل الحلة (تجنب غسل بطانية ثقيلة منفردة).',
        en: 'Open the door and redistribute heavy wet items evenly inside the drum.',
      },
      {
        id: 'sp2',
        ar: 'نظّف فلتر الطلمبة أسفل اليمين وتأكد من خلوه من العملات أو الدبابيس.',
        en: 'Clean the lower-right drain pump filter to ensure water drains completely before spin.',
      },
      {
        id: 'sp3',
        ar: 'تأكد من ثبات أرجل الغسالة الأربع على الأرض دون ميل.',
        en: 'Verify all four leveling feet sit firmly on a flat floor without rocking.',
      },
    ],
  },
  {
    id: 'kb-fridge-ice',
    category: 'fridge',
    keywords: ['سقع', 'تبريد', 'بارد', 'مش بتسقع', 'ثلج', 'صقيع', 'cool', 'warm', 'frost', 'ice'],
    code: 'COOL / 22E',
    titleAr: 'ضعف التبريد في الثلاجة أو تراكم الثلج',
    titleEn: 'Weak Refrigerator Cooling or Frost Buildup',
    savedEgp: 600,
    summaryAr:
      'يحدث غالباً عند سد فتحات الهواء الخلفية بالعلب أو عدم إحكام كاوتش الباب في الصيف.',
    summaryEn:
      'Commonly caused by blocked rear air vents or a loose rubber door gasket.',
    steps: [
      {
        id: 'fr1',
        ar: 'اترك مسافة 5 سم أمام فتحات توزيع الهواء الخلفية داخل الكابينة.',
        en: 'Keep 5 cm clearance in front of the rear cold-air vents inside the cabin.',
      },
      {
        id: 'fr2',
        ar: 'افحص كاوتش الباب بورقة؛ لو الورقة بتنزلق بسهولة نظّف الكاوتش بماء دافئ وصابون.',
        en: 'Test the door seal with a sheet of paper and wipe the gasket with warm soapy water.',
      },
      {
        id: 'fr3',
        ar: 'تأكد من ضبط التيرموستات بين 2° و4° مئوية وليس على وضع الإجازة/Eco.',
        en: 'Verify thermostat is set between 2°C and 4°C and not locked on Vacation/Eco mode.',
      },
    ],
  },
  {
    id: 'kb-tv-power',
    category: 'tv',
    keywords: ['تفصل', 'تطفي', 'شاشة سوداء', 'صوت بدون', 'واي فاي', 'إشارة', 'hdmi', 'signal', 'black', 'wifi'],
    code: 'POWER / SIG',
    titleAr: 'الشاشة تفصل فجأة أو لا تعرض إشارة',
    titleEn: 'TV No Signal, Blank Screen, or Auto-Shutoff',
    savedEgp: 400,
    summaryAr:
      'قد يكون بسبب مؤقت النوم، تذبذب الكهرباء في المشترك، أو كابل HDMI مرتخي.',
    summaryEn:
      'Often due to sleep timer, power strip voltage drop, or loose HDMI handshake.',
    steps: [
      {
        id: 'tv1',
        ar: 'وصل الشاشة بمصدر كهرباء مباشر بعيداً عن المشترك متعدد الفيش لمدة 60 ثانية.',
        en: 'Unplug the TV for 60 seconds and plug directly into a wall outlet instead of a power strip.',
      },
      {
        id: 'tv2',
        ar: 'راجع إعدادات مؤقت النوم (Sleep Timer) والوضع الاقتصادي (Eco Power Off).',
        en: 'Check Settings -> System -> Eco / Sleep Timer to disable auto power-off.',
      },
    ],
  },
];

/**
 * 0-token local Egyptian Appliance Diagnostics Assistant.
 * Matches error codes, natural Arabic/English symptoms, or appliance category.
 */
export function diagnoseQuery({ query = '', category = 'washer' }) {
  const q = String(query || '').trim().toLowerCase();

  if (q) {
    // 1. Exact or partial error-code match
    const byCode = TROUBLESHOOTING_GUIDES.find(
      (g) => g.code.toLowerCase() === q || q.includes(g.code.toLowerCase())
    );
    if (byCode) {
      return {
        ...byCode,
        replyAr: `تم التعرف على كود العطل (${byCode.code}): ${byCode.summaryAr}`,
        replyEn: `Detected error code (${byCode.code}): ${byCode.summaryEn}`,
      };
    }

    // 2. Symptom keyword match across Egyptian Arabic & English
    const bySymptom = SYMPTOM_KB.find((item) =>
      item.keywords.some((kw) => q.includes(kw))
    );
    if (bySymptom) {
      return {
        ...bySymptom,
        replyAr: bySymptom.summaryAr,
        replyEn: bySymptom.summaryEn,
      };
    }
  }

  // 3. Fallback by selected appliance category
  const byCategory =
    TROUBLESHOOTING_GUIDES.find((g) => g.category === category) ||
    TROUBLESHOOTING_GUIDES[0];

  if (q) {
    return {
      ...byCategory,
      replyAr: `بناءً على وصفك، راجع خطوات الفحص الأساسية دي أولاً — ولو المشكلة مستمرة احجز فني التوكيل المعتمد بضغطة واحدة:`,
      replyEn: `Based on your description, try these essential checks first — or dispatch an official brand technician in one tap:`,
    };
  }

  return {
    ...byCategory,
    replyAr: byCategory.summaryAr,
    replyEn: byCategory.summaryEn,
  };
}
