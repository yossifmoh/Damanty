import { TROUBLESHOOTING_GUIDES } from '../data/mockData';

const APPLIANCE_PROFILES = [
  {
    key: 'ac',
    keywords: ['تكييف', 'سبليت', 'كاريير', 'تورنيدو', 'مكيف', 'فريون', 'كمبريسور', 'air condition', 'ac', 'split', 'hvac', 'carrier'],
    hotline: '19319',
    brandAr: 'توكيل التكييفات المعتمد',
    brandEn: 'Authorized AC Care',
    labelAr: 'تكييف / سبليت',
    labelEn: 'Air Conditioner',
  },
  {
    key: 'washer',
    keywords: ['غسالة', 'غساله', 'أوتوماتيك', 'اوتوماتيك', 'فوق أوتوماتيك', 'مجفف', 'دراير', 'حلة', 'زانوسي', 'توشيبا', 'washer', 'washing', 'laundry', 'dryer', 'lg', 'zanussi'],
    hotline: '19960',
    brandAr: 'توكيل الغسالات المعتمد',
    brandEn: 'Authorized Washer Care',
    labelAr: 'غسالة ملابس / مجفف',
    labelEn: 'Washing Machine / Dryer',
  },
  {
    key: 'fridge',
    keywords: ['ثلاجة', 'تلاجة', 'فريزر', 'ديب فريزر', 'نوفروست', 'تجميد', 'كريازي', 'وايت ويل', 'فريش', 'fridge', 'refrigerator', 'freezer', 'samsung', 'kiriazi'],
    hotline: '16580',
    brandAr: 'توكيل الثلاجات والفريزرات',
    brandEn: 'Authorized Cooling Care',
    labelAr: 'ثلاجة / ديب فريزر',
    labelEn: 'Refrigerator / Freezer',
  },
  {
    key: 'tv',
    keywords: ['شاشة', 'تليفزيون', 'تلفزيون', 'سمارت', 'رسيفر', 'ريسيفر', 'إشارة', 'hdmi', 'tv', 'oled', 'qled', 'screen', 'monitor'],
    hotline: '19319',
    brandAr: 'توكيل الشاشات المعتمد',
    brandEn: 'Authorized TV Care',
    labelAr: 'شاشة / تليفزيون',
    labelEn: 'Smart TV / Display',
  },
  {
    key: 'heater',
    keywords: ['سخان', 'بويلر', 'مياه ساخنة', 'تسخين مياه', 'أوليمبيك', 'أريستون', 'heater', 'water heater', 'boiler', 'ariston', 'olympic'],
    hotline: '19999',
    brandAr: 'توكيل السخانات المعتمد',
    brandEn: 'Authorized Water Heater Care',
    labelAr: 'سخان مياه (كهرباء / غاز)',
    labelEn: 'Water Heater (Electric / Gas)',
  },
  {
    key: 'microwave',
    keywords: ['ميكروويف', 'مايكرويف', 'فرن كهرباء', 'فرن كهربائي', 'اير فراير', 'قلاية', 'microwave', 'oven', 'air fryer'],
    hotline: '19960',
    brandAr: 'توكيل أجهزة المطبخ الكهربائية',
    brandEn: 'Authorized Kitchen Appliance Care',
    labelAr: 'ميكروويف / فرن كهربائي',
    labelEn: 'Microwave / Electric Oven',
  },
  {
    key: 'dishwasher',
    keywords: ['غسالة أطباق', 'غساله اطباق', 'أطباق', 'مواعين', 'dishwasher', 'bosh', 'bosch', 'beko'],
    hotline: '19960',
    brandAr: 'توكيل غسالات الأطباق',
    brandEn: 'Authorized Dishwasher Care',
    labelAr: 'غسالة أطباق',
    labelEn: 'Dishwasher',
  },
  {
    key: 'stove',
    keywords: ['بوتاجاز', 'بوتجاز', 'شعلة', 'مسطح', 'شفاط', 'يونيفرسال', 'لاجرمانيا', 'stove', 'cooker', 'hob', 'hood'],
    hotline: '19320',
    brandAr: 'توكيل البوتاجازات والأفران',
    brandEn: 'Authorized Cooker Care',
    labelAr: 'بوتاجاز / شفاط مطبخ',
    labelEn: 'Cooker / Kitchen Hood',
  },
  {
    key: 'small_appliance',
    keywords: ['مكنسة', 'مكواة', 'مكواه', 'غلاية', 'كاتل', 'خلاط', 'كبة', 'ماكينة قهوة', 'مبرد', 'كولدير', 'فلتر', 'مروحة', 'موتور', 'دفاية', 'شاحن', 'كابل', 'راوتر', 'vacuum', 'iron', 'kettle', 'blender', 'coffee', 'dispenser', 'fan', 'pump', 'router', 'heater'],
    hotline: '19960',
    brandAr: 'مركز صيانة الأجهزة المنزلية',
    brandEn: 'Home Electrical Service Center',
    labelAr: 'جهاز منزلي كهربائي',
    labelEn: 'Home Electrical Appliance',
  },
];

const GENERAL_APPLIANCE_KB = [
  {
    id: 'kb-ac-water',
    category: 'ac',
    keywords: ['مية', 'ماء', 'ينقط', 'تنقيط', 'خرطوم', 'تكييف', 'water', 'leak', 'drip', 'drain'],
    mustMatchGroup: ['تكييف', 'سبليت', 'مكيف', 'ac', 'split'],
    code: 'AC-DRAIN',
    titleAr: 'تنقيط مياه من الوحدة الداخلية للتكييف',
    titleEn: 'Indoor AC Water Dripping / Drain Blockage',
    savedEgp: 500,
    summaryAr:
      'السبب الأكثر شيوعاً هو انسداد خرطوم صرف التكييف بالأتربة أو اتساخ الفلاتر وتكثف المياه. نفّذ الخطوات الآتية:',
    summaryEn:
      'Most often caused by a clogged drain pipe or dusty filters causing condensation overflow. Try these checks:',
    steps: [
      {
        id: 'w1',
        ar: 'افصل التكييف عن الكهرباء، واخرج الفلاتر الأمامية واغسلها بماء فاتر ثم اتركها تجف تماماً.',
        en: 'Power off the AC, remove front filters, rinse gently with lukewarm water, and dry completely.',
      },
      {
        id: 'w2',
        ar: 'افحص طرف خرطوم الصرف الخارجي وتأكد أنه غير مثني أو مغمور في وعاء ماء يرتد منه الهواء.',
        en: 'Check the outdoor condensate drain hose for kinks, blockages, or submerged tips.',
      },
      {
        id: 'w3',
        ar: 'شغّل وضع «المروحة فقط (Fan)» لمدة 20 دقيقة لتجفيف حوض الصرف الداخلي وتنظيف المسار.',
        en: 'Run "Fan Only" mode for 20 minutes to clear residual moisture from the indoor tray.',
      },
    ],
  },
  {
    id: 'kb-washer-spin',
    category: 'washer',
    keywords: ['تعصر', 'مبتعصرش', 'عصر', 'تهتز', 'رجه', 'طلمبة', 'صرف', 'حلة', 'ملابس', 'spin', 'vibrat', 'drain', 'washer', 'ue', 'oe'],
    mustMatchGroup: ['غسالة', 'غساله', 'أوتوماتيك', 'اوتوماتيك', 'حلة', 'washer', 'laundry', 'dryer'],
    code: 'WASHER-SPIN',
    titleAr: 'الغسالة لا تعصر أو تتوقف بالماء أو تهتز بقوة',
    titleEn: 'Washer Not Spinning / Draining / Heavy Vibration',
    savedEgp: 450,
    summaryAr:
      'تتوقف معظم الغسالات عن العصر كإجراء أمان عند تكتل الغسيل في جانب واحد أو انسداد فلتر الطلمبة.',
    summaryEn:
      'Modern washers pause high-speed spin when laundry is unbalanced or the drain filter is blocked.',
    steps: [
      {
        id: 'sp1',
        ar: 'أعد توزيع الغسيل داخل الحلة بالتساوي (ولا تضع بطانية ثقيلة منفردة دون قطعة موازنة).',
        en: 'Redistribute wet items evenly inside the drum (avoid washing one heavy blanket alone).',
      },
      {
        id: 'sp2',
        ar: 'افتح باب فلتر الطلمبة أسفل الواجهة وأفرغه من المياه العالقة والعملات أو الأوبار.',
        en: 'Open the lower-right drain pump filter (with a towel underneath) and remove lint or coins.',
      },
      {
        id: 'sp3',
        ar: 'تأكد أن أرجل الغسالة الأربعة ثابتة على الأرض تماماً دون اهتزاز قبل إعادة تشغيل برنامج العصر.',
        en: 'Check that all four leveling feet grip the floor evenly without wobbling before re-spinning.',
      },
    ],
  },
  {
    id: 'kb-fridge-cool',
    category: 'fridge',
    keywords: ['سقع', 'تبريد', 'بارد', 'مش بتسقع', 'ثلج', 'صقيع', 'كاوتش', 'موتور', 'cool', 'warm', 'frost', 'ice', '22e'],
    mustMatchGroup: ['ثلاجة', 'تلاجة', 'فريزر', 'ديب فريزر', 'fridge', 'freezer'],
    code: 'COOLING',
    titleAr: 'ضعف تبريد الثلاجة / الفريزر أو تكوّن ثلج زائد',
    titleEn: 'Weak Fridge/Freezer Cooling or Frost Buildup',
    savedEgp: 600,
    summaryAr:
      'ضعف التبريد أو تجمّد الهواء غالباً ينتج عن سد فتحات التهوية أو تسريب في كاوتش الباب أو حاجة السربنتينة للتنظيف.',
    summaryEn:
      'Poor cooling or icing typically results from blocked rear vents, a worn door seal, or dusty condenser coils.',
    steps: [
      {
        id: 'fr1',
        ar: 'اترك مسافة 5 سم أمام فتحات خروج الهواء البارد داخل الرفوف وأزل أي أكياس ملتصقة بها.',
        en: 'Keep at least 5 cm clearance in front of internal cold-air vents and remove pressed bags.',
      },
      {
        id: 'fr2',
        ar: 'اختبر كاوتش الباب بورقة؛ لو انزلقت بسهولة امسح الإطار بماء دافئ وصابون لإعادة إحكامه.',
        en: 'Slide a paper sheet against the closed door seal; if loose, clean the gasket with warm soapy water.',
      },
      {
        id: 'fr3',
        ar: 'نظّف الأتربة من الشبكة الخلفية واترك مسافة 10 سم بين ظهر الثلاجة والحائط للتهوية.',
        en: 'Dust off rear/bottom condenser coils and leave 10 cm ventilation clearance from the wall.',
      },
    ],
  },
  {
    id: 'kb-heater-trip',
    category: 'heater',
    keywords: ['سخان', 'مياه ساخنة', 'لا يسخن', 'تيرموستات', 'غاز', 'إشعال', 'ينقط', 'تنقيط', 'مية', 'بيفصل', 'heater', 'water heater', 'boiler', 'hot water', 'leak'],
    code: 'HEATER',
    titleAr: 'فحص سخان المياه (ضعف التسخين / فصل الأمان)',
    titleEn: 'Water Heater Check (Weak Heat / Safety Cutout)',
    savedEgp: 450,
    summaryAr:
      'سخانات الكهرباء والغاز تحتوي على مفتاح أمان حراري يفصل عند تراكم الأملاح على الهيتر أو ضعف ضغط المياه.',
    summaryEn:
      'Electric and gas water heaters trigger thermal or flow cutoffs when scale builds up or water pressure drops.',
    steps: [
      {
        id: 'ht1',
        ar: 'في السخان الكهربائي: افصل الفيشة فوراً عند وجود لسعة كهرباء أو تنقيط، ولا تشغّله قبل فحص الأرضي والرداخ.',
        en: 'Electric heater: unplug immediately if dripping or tingling voltage is felt; verify grounding and valve.',
      },
      {
        id: 'ht2',
        ar: 'افحص درجة حرارة التيرموستات (المثالي 55°–60°م) لتجنب الغليان الزائد وهدر الكهرباء.',
        en: 'Keep the thermostat dial around 55°C–60°C to avoid overheating trips and wasted power.',
      },
      {
        id: 'ht3',
        ar: 'في سخان الغاز: بدّل البطاريتين (حجر الطرش الكبير) وتأكد أن رداخ المياه يتحرك عند فتح الحنفية.',
        en: 'Gas heater: replace ignition D-cell batteries and verify strong cold-water inlet flow.',
      },
    ],
  },
  {
    id: 'kb-microwave-oven',
    category: 'microwave',
    keywords: ['ميكروويف', 'مايكرويف', 'فرن', 'قلاية', 'اير فراير', 'شرار', 'لا يسخن', 'طبق', 'microwave', 'oven', 'air fryer', 'spark'],
    code: 'HEATING-UNIT',
    titleAr: 'تشخيص الميكروويف أو الفرن الكهربائي / الإير فراير',
    titleEn: 'Microwave / Electric Oven Troubleshooting',
    savedEgp: 500,
    summaryAr:
      'حدوث شرارة أو دوران الطبق بدون تسخين يرتبط غالباً بلوح المايكا الملوث بالدهون أو فيوز الجهد العالي.',
    summaryEn:
      'Arcing sparks or running without heat usually comes from grease on the mica waveguide cover or high-voltage fuse.',
    steps: [
      {
        id: 'mw1',
        ar: 'أخرج أي أطباق بها حواف ذهبية/معدنية أو ورق فويل، ونظف لوح المايكا الجانبي من بقايا الدهون.',
        en: 'Never use foil or metallic-rim plates inside microwaves, and wipe grease off the interior mica cover.',
      },
      {
        id: 'mw2',
        ar: 'تأكد من إحكام قفل الباب وسماع تكة السويتشات الثلاثة؛ وجود اتساخ بالمفصلة يمنع التسخين.',
        en: 'Ensure door latches click cleanly without food debris blocking the safety interlock switches.',
      },
      {
        id: 'mw3',
        ar: 'لو استمرت الشرارة أو صوت الزنة القوية بدون تسخين لا تفتحه ذاتياً — يلزم فحص الماجنترون والمكثف بالتوكيل.',
        en: 'If loud humming continues with zero heating, avoid opening the casing (high-voltage capacitor hazard) and book a pro.',
      },
    ],
  },
  {
    id: 'kb-dishwasher',
    category: 'dishwasher',
    keywords: ['غسالة أطباق', 'أطباق', 'مواعين', 'رواسب', 'قرص', 'رشاشات', 'dishwasher'],
    code: 'DISHWASHER',
    titleAr: 'صيانة غسالة الأطباق (نظافة ضعيفة / عدم تصريف)',
    titleEn: 'Dishwasher Cleaning, Drainage & Wash Performance',
    savedEgp: 400,
    summaryAr:
      '90% من مشاكل غسالات الأطباق سببها انسداد رشاشات المياه أو نقص الملح والفلتر.',
    summaryEn:
      'Most dishwasher issues stem from clogged spray arm nozzles, empty salt reservoir, or dirty sump filters.',
    steps: [
      {
        id: 'dw1',
        ar: 'فك الأذرع الدوارة ونظف فتحاتها بعود خشبي تحت الماء، واغسل مصفاة القاع بالفرشاة.',
        en: 'Detach rotating spray arms, clear clogged holes, and rinse the bottom mesh sump filter.',
      },
      {
        id: 'dw2',
        ar: 'تأكد من تعبئة خزان الملح المخصص ومساعد الشطف لتفادي البقع البيضاء على الكاسات.',
        en: 'Refill dedicated dishwasher salt and rinse aid to eliminate cloudy glassware.',
      },
      {
        id: 'dw3',
        ar: 'شغّل دورة سخنة فارغة بخل أو منظف غسالات أطباق مرة شهرياً لإزالة الدهون المتراكمة.',
        en: 'Run a hot empty cycle monthly with dishwasher cleaner to dissolve hidden grease.',
      },
    ],
  },
  {
    id: 'kb-tv-power',
    category: 'tv',
    keywords: ['تفصل', 'تطفي', 'شاشة سوداء', 'صوت بدون', 'واي فاي', 'إشارة', 'hdmi', 'signal', 'black', 'wifi', 'tv'],
    code: 'TV-DIAG',
    titleAr: 'تشخيص الشاشات الذكية والريسيفر (فصل مفاجئ / لا إشارة)',
    titleEn: 'Smart TV Diagnostics (Auto-Shutoff / Blank / No Signal)',
    savedEgp: 400,
    summaryAr:
      'كثيراً ما يعود الفصل المفاجئ إلى مشترك كهرباء ضعيف أو مؤقت النوم أو خلل كابل HDMI.',
    summaryEn:
      'Sudden shutoffs or signal drops often stem from a loose power strip, eco timer, or HDMI handshake fault.',
    steps: [
      {
        id: 'tv1',
        ar: 'وصل الشاشة بفيشة حائط مباشرة بعيداً عن المشترك متعدد المخارج لمدة دقيقة لإفراغ الشحنة.',
        en: 'Plug the TV directly into a wall socket instead of a shared extension strip for 60 seconds.',
      },
      {
        id: 'tv2',
        ar: 'عطّل «مؤقت النوم (Sleep Timer)» ووضع الإطفاء التلقائي Eco من إعدادات النظام.',
        en: 'Turn off Sleep Timer and Eco Auto Power-Off inside TV System Settings.',
      },
      {
        id: 'tv3',
        ar: 'بدّل مدخل كابل HDMI وجرّب إضاءة كشاف الموبايل قرب الشاشة لو فيها صوت بدون صورة (فحص الليدات).',
        en: 'Test an alternate HDMI port; if sound plays with a black screen, shine a phone flashlight to check backlight LEDs.',
      },
    ],
  },
  {
    id: 'kb-cleaning-care',
    category: 'small_appliance',
    keywords: ['تنظيف', 'نظف', 'غسل', 'خل', 'ملح ليمون', 'ريحة', 'عفن', 'عناية', 'صيانة دورية', 'عمر افتراضي', 'clean', 'smell', 'odor', 'maintenance', 'care', 'vinegar'],
    code: 'CARE-GUIDE',
    titleAr: 'دليل التنظيف والصيانة الدورية للحفاظ على الأجهزة الكهربائية',
    titleEn: 'Preventive Cleaning & Care Guide for Electrical Appliances',
    savedEgp: 700,
    summaryAr:
      'الصيانة الوقائية الدورية تطيل عمر الكمبريسور والسخانات والمواتير وتمنع الروائح الكريهة وتقليل استهلاك الكهرباء.',
    summaryEn:
      'Regular preventive care extends compressor/motor lifespan, stops odors, and reduces monthly power bills.',
    steps: [
      {
        id: 'cl1',
        ar: 'افصل الكهرباء دائماً قبل مسح أي جهاز أو فك الفلاتر، ولا ترش ماء مباشرة على لوحة التحكم الإلكترونية.',
        en: 'Always unplug before cleaning parts and never spray liquid directly onto digital touch/control boards.',
      },
      {
        id: 'cl2',
        ar: 'للغسالات والكاتل ومكاوي البخار: نفّذ دورة إزالة تكلسات وأملاح مرة شهرياً بالمنظف المعتمد أو دورة ساخنة فارغة.',
        en: 'For washers, kettles & steam irons: run a monthly descaling/hot drum clean cycle.',
      },
      {
        id: 'cl3',
        ar: 'للثلاجات والتكييفات والمكانس: نظّف فلاتر الهواء ومخارج التهوية من الأتربة كل أسبوعين إلى شهر لمنع ارتفاع حرارة الموتور.',
        en: 'For fridges, ACs & vacuums: clear dust from air filters and vents monthly to stop motor overheating.',
      },
    ],
  },
  {
    id: 'kb-electrical-safety',
    category: 'small_appliance',
    keywords: ['كهرباء', 'ماس', 'قفلة', 'بيفصل', 'أمان', 'سلك', 'فيشة', 'شياط', 'حرق', 'سخن', 'توفير', 'فاتورة', 'وات', 'استهلاك', 'trip', 'breaker', 'burn', 'shock', 'spark', 'hot', 'power', 'electric', 'consumption'],
    code: 'ELEC-SAFETY',
    titleAr: 'فحص أمان الكهرباء، سخونة الفيشة، أو فصل القاطع (الأوتوماتيك)',
    titleEn: 'Electrical Safety, Breaker Tripping & Power Consumption Guide',
    savedEgp: 650,
    summaryAr:
      'تذبذب الفولت وسخونة المشتركات الرخيصة هما السبب الأول لتلف بوردات الأجهزة الكهربائية في مصر.',
    summaryEn:
      'Voltage fluctuations and overloaded power strips are the #1 cause of control-board failures.',
    steps: [
      {
        id: 'el1',
        ar: 'لو القاطع بيفصل بمجرد توصيل الجهاز أو في ريحة شياط: افصله فوراً ولا تعاود تشغيله قبل فحص الكابل والهيتر.',
        en: 'If a breaker trips immediately or you smell burning plastic, unplug immediately—do not keep resetting.',
      },
      {
        id: 'el2',
        ar: 'الأجهزة عالية السحب (ثلاجة، غسالة، سخان، ميكروويف، مكواة، تكييف) توصل بفيشة حائط مستقلة وليست على مشترك واحد.',
        en: 'High-wattage appliances (fridge, washer, heater, microwave, iron, AC) require a dedicated wall outlet—no shared strips.',
      },
      {
        id: 'el3',
        ar: 'لحماية البوردة من تذبذب الكهرباء، استخدم منظم فولت / جهاز حماية معتمد (Relay Guard) بتأخير زمني 3 دقائق للثلاجة والتكييف.',
        en: 'Use a voltage surge protector with a 3-minute restart delay for compressors (fridges and ACs).',
      },
    ],
  },
  {
    id: 'kb-noise-vibration',
    category: 'small_appliance',
    keywords: ['صوت', 'عالي', 'زنة', 'خبط', 'تكتكة', 'دوشة', 'مروحة', 'موتور', 'مكنسة', 'noise', 'loud', 'buzz', 'rattl', 'sound'],
    code: 'NOISE-CHECK',
    titleAr: 'تشخيص الأصوات المرتفعة والاهتزاز في الأجهزة الكهربائية',
    titleEn: 'Diagnosing Loud Noise, Buzzing & Heavy Vibration',
    savedEgp: 400,
    summaryAr:
      'الأصوات الغريبة غالباً تعود لعدم اتزان القاعدة، تآكل رولمان البلي، أو احتكاك ريشة المروحة بأتربة/عائق.',
    summaryEn:
      'Unusual noises commonly stem from uneven feet, worn bearings, or fan blades hitting debris.',
    steps: [
      {
        id: 'ns1',
        ar: 'تأكد من اتزان الجهاز أفقياً على سطح مستوٍ وعدم ملامسة ظهره لأي أثاث أو مواسير معدنية تهتز معه.',
        en: 'Verify the appliance sits level on the floor and its back/sides do not vibrate against nearby cabinets or pipes.',
      },
      {
        id: 'ns2',
        ar: 'افصل الكهرباء وافحص فتحات المروحة أو الفلتر للتأكد من عدم وجود جسم غريب أو شعيرات ملفوفة على العمود.',
        en: 'Unplug and inspect cooling fans, impellers, or vacuum brushes for hair, lint, or loose objects.',
      },
      {
        id: 'ns3',
        ar: 'لو الصوت «طحن معدني أو زنة حادة ثابتة»، فغالباً يحتاج رولمان بلي أو تزييت محمل ولا يوصى باستمرار التشغيل.',
        en: 'Grinding or harsh metallic screeches typically signal bearing wear—stop running to prevent motor burnout.',
      },
    ],
  },
];

/**
 * Matches user's prompt against their personal Vault devices by name, brand, model, serial, or category.
 */
function findMatchingVaultDevice(queryLower, devices = []) {
  if (!queryLower || !Array.isArray(devices) || devices.length === 0) return null;

  let best = null;
  let bestScore = 0;

  for (const dev of devices) {
    let score = 0;
    const fields = [
      dev.nameAr,
      dev.nameEn,
      dev.brand,
      dev.brandAr,
      dev.model,
      dev.serial,
    ]
      .filter(Boolean)
      .map((f) => String(f).toLowerCase());

    for (const field of fields) {
      if (queryLower.includes(field) && field.length >= 2) {
        score += field.length * 3;
      } else {
        const tokens = field.split(/[\s\-_/()]+/).filter((t) => t.length >= 2);
        for (const tok of tokens) {
          if (queryLower.includes(tok)) score += tok.length;
        }
      }
    }

    const profile = APPLIANCE_PROFILES.find((p) => p.key === dev.category);
    if (profile && profile.keywords.some((kw) => queryLower.includes(kw))) {
      score += 4;
    }

    if (score > bestScore) {
      bestScore = score;
      best = dev;
    }
  }

  return bestScore >= 3 ? best : null;
}

function detectApplianceProfile(queryLower, matchedDevice) {
  if (matchedDevice?.category) {
    const devProfile = APPLIANCE_PROFILES.find((p) => p.key === matchedDevice.category);
    if (devProfile) return devProfile;
  }
  for (const profile of APPLIANCE_PROFILES) {
    if (profile.keywords.some((kw) => queryLower.includes(kw))) {
      return profile;
    }
  }
  return {
    key: 'general',
    hotline: matchedDevice?.hotline || '19960',
    brandAr: matchedDevice?.authorizedGroupAr || 'مركز الصيانة المعتمد',
    brandEn: matchedDevice?.authorizedGroupEn || 'Authorized Service Center',
    labelAr: matchedDevice?.nameAr || 'جهاز كهربائي',
    labelEn: matchedDevice?.nameEn || 'Electrical Appliance',
  };
}

/**
 * Exclusive AI Maintenance & Troubleshooting Engine for registered electrical appliances
 * saved in the user's My Vault inventory. Locked when 0 devices are registered.
 */
export function diagnoseQuery({ query = '', devices = [] }) {
  const safeDevices = Array.isArray(devices) ? devices : [];
  if (safeDevices.length === 0) {
    return {
      id: 'ai-locked-empty',
      locked: true,
      notInVault: false,
      matchedDevice: null,
      profile: {
        key: 'general',
        hotline: '19960',
        brandAr: '',
        brandEn: '',
        labelAr: '',
        labelEn: '',
      },
      steps: [],
    };
  }

  const rawQuery = String(query || '').trim();
  const q = rawQuery.toLowerCase();

  let matchedDevice = findMatchingVaultDevice(q, safeDevices);
  const profile = detectApplianceProfile(q, matchedDevice);

  if (!q) {
    const sampleDev = safeDevices[0];
    return {
      id: 'ai-welcome-ready',
      locked: false,
      notInVault: false,
      code: 'AI-READY',
      matchedDevice: null,
      profile,
      titleAr: 'مساعد الصيانة الذكي جاهز لأجهزتك المسجلة',
      titleEn: 'AI Assistant Ready for Your Registered Appliances',
      replyAr: `لديك ${safeDevices.length} جهاز مسجل في «أجهزتي» — اكتب اسم أي منها (مثل: «${sampleDev.nameAr}») واسأل عن أي عطل، طريقة تنظيف، أو صيانة.`,
      replyEn: `You have ${safeDevices.length} appliance(s) in My Vault — type any device name (e.g., "${sampleDev.nameEn}") and ask about issues, cleaning, or maintenance.`,
      savedEgp: 500,
      steps: GENERAL_APPLIANCE_KB[7].steps,
    };
  }

  // Gate: do not diagnose a named electrical appliance category absent from the user's Vault
  if (!matchedDevice && profile.key !== 'general') {
    const hasCategoryInVault = safeDevices.some(
      (d) => (d.category || '').toLowerCase() === profile.key
    );
    if (!hasCategoryInVault) {
      return {
        id: 'ai-not-in-vault',
        locked: false,
        notInVault: true,
        matchedDevice: null,
        profile,
        steps: [],
      };
    }
    matchedDevice = safeDevices.find(
      (d) => (d.category || '').toLowerCase() === profile.key
    ) || null;
  } else if (!matchedDevice && safeDevices.length === 1) {
    matchedDevice = safeDevices[0];
  }

  // 1. Check if query contains a known OEM error code (OE, E4, 22E, CH05, etc.)
  const byCode = TROUBLESHOOTING_GUIDES.find((g) => {
    const codeTokens = g.code.toLowerCase().split(/[\/\s]+/);
    return codeTokens.some((tok) => {
      if (tok.length < 2) return false;
      const safeTok = tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`\\b${safeTok}\\b`, 'i').test(q);
    });
  });
  if (byCode) {
    return {
      ...byCode,
      matchedDevice,
      profile,
      replyAr: `تم التعرف على الكود (${byCode.code}): ${byCode.summaryAr}`,
      replyEn: `Detected code (${byCode.code}): ${byCode.summaryEn}`,
    };
  }

  // 2. Score GENERAL_APPLIANCE_KB entries (matching both device keywords & question intent)
  let bestKb = null;
  let bestKbScore = 0;

  for (const item of GENERAL_APPLIANCE_KB) {
    // Avoid crossing appliance-specific KB articles when query names a different appliance
    if (
      profile.key !== 'general' &&
      item.category !== 'small_appliance' &&
      item.category !== profile.key
    ) {
      continue;
    }

    let score = 0;
    for (const kw of item.keywords) {
      if (q.includes(kw)) score += kw.length >= 4 ? 3 : 2;
    }
    if (item.category === profile.key) score += 3;
    if (
      item.mustMatchGroup &&
      !item.mustMatchGroup.some((m) => q.includes(m)) &&
      item.category !== profile.key
    ) {
      score = Math.min(score, 2);
    }
    if (score > bestKbScore) {
      bestKbScore = score;
      bestKb = item;
    }
  }

  if (bestKb && bestKbScore >= 3) {
    const warrantyNoteAr =
      matchedDevice?.status === 'expiring_soon' ? 'ضمان قارب على الانتهاء' : 'مسجل في أجهزتك';
    const contextPrefixAr = matchedDevice
      ? `مرتبط بجهازك «${matchedDevice.nameAr}» (${warrantyNoteAr}): `
      : '';
    const contextPrefixEn = matchedDevice
      ? `Linked to your saved product "${matchedDevice.nameEn}": `
      : '';

    return {
      ...bestKb,
      matchedDevice,
      profile,
      replyAr: `${contextPrefixAr}${bestKb.summaryAr}`,
      replyEn: `${contextPrefixEn}${bestKb.summaryEn}`,
    };
  }

  // 3. Universal Electrical Appliance Fallback — handles ANY product name or general question cleanly!
  const subjectAr = matchedDevice ? matchedDevice.nameAr : rawQuery;
  const subjectEn = matchedDevice ? matchedDevice.nameEn : rawQuery;

  return {
    id: 'ai-universal-electrical',
    code: 'UNIVERSAL-AI',
    matchedDevice,
    profile,
    titleAr: matchedDevice
      ? `خطة الصيانة والفحص الذكي: ${matchedDevice.nameAr}`
      : `توصيات المساعد الذكي بخصوص: «${subjectAr.slice(0, 42)}»`,
    titleEn: matchedDevice
      ? `Smart Care & Checkup: ${matchedDevice.nameEn}`
      : `Smart Assistant Guidance for: "${subjectEn.slice(0, 42)}"`,
    replyAr: matchedDevice
      ? `جهازك «${matchedDevice.nameAr}» متاح في خزنتك (ضمان حتى ${matchedDevice.expiryDate || 'مسجل'}). راجع هذه الإرشادات العامة للأجهزة الكهربائية أو احجز زيارة توكيل ${matchedDevice.authorizedGroupAr || profile.brandAr} مباشرة:`
      : `تم تحليل استفسارك حول الأجهزة الكهربائية («${subjectAr.slice(0, 40)}»). نفّذ فحوصات الأمان والتشغيل الأساسية التالية أولاً، وإذا احتجت تدخل فني يمكنك الحجز المباشر:`,
    replyEn: matchedDevice
      ? `Found "${matchedDevice.nameEn}" in your Vault (warranty until ${matchedDevice.expiryDate || 'registered'}). Follow these smart appliance checks or book ${matchedDevice.authorizedGroupEn || profile.brandEn} directly:`
      : `Analyzed your electrical appliance query ("${subjectEn.slice(0, 40)}"). Follow these essential diagnostic & safety checks first, or book an official technician below:`,
    savedEgp: 500,
    steps: [
      {
        id: 'uni1',
        ar: 'افحص مصدر الكهرباء: وصل الجهاز بفيشة حائط مباشرة بدلاً من المشترك، وتأكد من ثبات الكابل وعدم سخونة الفيشة.',
        en: 'Check power input: test on a direct wall outlet instead of an extension strip and ensure plug/cord stay cool.',
      },
      {
        id: 'uni2',
        ar: 'قم بعمل إعادة تشغيل كهربائية (Power Reset): افصل الجهاز عن الكهرباء 3–5 دقائق ثم أعد التوصيل مع فحص نظافة الفلاتر/فتحات التهوية.',
        en: 'Perform a 3–5 minute Power Reset by unplugging completely, and clear dust from vents, drains, or filters.',
      },
      {
        id: 'uni3',
        ar: 'إذا لاحظت تسريب مياه أو رائحة احتراق أو فصل متكرر لقاطع الكهرباء، أوقف التشغيل واحجز فني التوكيل المعتمد عبر الزر بالأسفل.',
        en: 'If there is leaking water, burnt odor, or repeated breaker trips, stop using the device and dispatch a verified technician below.',
      },
    ],
  };
}
