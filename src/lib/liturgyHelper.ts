// ===================================================================
// Liturgy Parsing & Priest Management Shared Helper
// ===================================================================

export const PRIEST_NAMES_LIST = [
  'ابونا مرقس ميلاد',
  'ابونا بيشوي ثابت',
  'ابونا مينا نادر',
  'ابونا ميخائيل ميخائيل',
  'ابونا كيرلس ميلاد',
  'ابونا موسى وجيه'
];

export const OFFICIAL_ALTAR_CHOICES = [
  { label: 'الكنيسة الكبيرة - مذبح العذراء', church: 'الكنيسة الكبيرة', altar: 'مذبح العذراء' },
  { label: 'الكنيسة الكبيرة - مذبح مارمينا', church: 'الكنيسة الكبيرة', altar: 'مذبح مارمينا' },
  { label: 'الكنيسة الكبيرة - مذبح مارمرقس', church: 'الكنيسة الكبيرة', altar: 'مذبح مارمرقس' },
  { label: 'كنيسة الملاك - مذبح الملاك ميخائيل', church: 'كنيسة الملاك', altar: 'مذبح الملاك ميخائيل' },
  { label: 'كنيسة الانبا انطونيوس - مذبح الانبا انطونيوس', church: 'كنيسة الانبا انطونيوس', altar: 'مذبح الانبا انطونيوس' },
];

export const FIXED_WEEKDAY_LITURGIES = [
  {
    day: 'الاثنين',
    title: 'القداس الإلهي',
    startTime: '07:00',
    endTime: '09:00',
    church: 'الكنيسة الكبيرة',
    altar: 'مذبح العذراء',
    priests: ['ابونا ميخائيل ميخائيل']
  },
  {
    day: 'الثلاثاء',
    title: 'القداس الإلهي',
    startTime: '07:00',
    endTime: '09:00',
    church: 'الكنيسة الكبيرة',
    altar: 'مذبح العذراء',
    priests: ['ابونا مرقس ميلاد', 'ابونا موسى وجيه']
  },
  {
    day: 'الأربعاء',
    title: 'القداس الإلهي',
    startTime: '07:00',
    endTime: '09:00',
    church: 'الكنيسة الكبيرة',
    altar: 'مذبح العذراء',
    priests: ['ابونا بيشوي ثابت']
  },
  {
    day: 'الخميس',
    title: 'القداس الإلهي',
    startTime: '07:00',
    endTime: '09:00',
    church: 'الكنيسة الكبيرة',
    altar: 'مذبح العذراء',
    priests: ['ابونا مينا نادر']
  }
];

export interface ParsedLiturgyInfo {
  priests: string[];
  hasSermon: boolean;
  sermonSpeaker: string;
  sermonTopic?: string;
  weekScope: 'all' | 'week_1' | 'week_2' | 'week_3' | 'week_4' | 'week_5' | 'specific_date' | string;
  specificDate?: string;
  isSpecialOccasion: boolean;
  occasionTitle?: string;
  extraNotes: string;
}

/**
 * Parses liturgy notes while strictly preserving the selected order of priests.
 */
export const parseLiturgyNotes = (notes: string | null | undefined): ParsedLiturgyInfo => {
  if (!notes) {
    return {
      priests: ['آباء الكنيسة'],
      hasSermon: false,
      sermonSpeaker: '',
      sermonTopic: '',
      weekScope: 'all',
      isSpecialOccasion: false,
      occasionTitle: '',
      extraNotes: '',
    };
  }

  let hasSermon = false;
  let sermonSpeaker = '';
  let sermonTopic = '';
  let weekScope: ParsedLiturgyInfo['weekScope'] = 'all';
  let specificDate = '';
  let isSpecialOccasion = false;
  let occasionTitle = '';

  // Week scope parsing
  if (notes.includes('الأسبوع: الأول') || notes.includes('الأسبوع الأول')) weekScope = 'week_1';
  else if (notes.includes('الأسبوع: الثاني') || notes.includes('الأسبوع الثاني')) weekScope = 'week_2';
  else if (notes.includes('الأسبوع: الثالث') || notes.includes('الأسبوع الثالث')) weekScope = 'week_3';
  else if (notes.includes('الأسبوع: الرابع') || notes.includes('الأسبوع الرابع')) weekScope = 'week_4';
  else if (notes.includes('الأسبوع: الخامس') || notes.includes('الأسبوع الخامس')) weekScope = 'week_5';
  
  const dateMatch = notes.match(/تاريخ[:\s]+(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    weekScope = 'specific_date';
    specificDate = dateMatch[1];
  }

  // Special Occasion / Feast Parsing
  const occasionMatch = notes.match(/(?:مناسبة|مناسبة طقسية|عيد)[:\s]+([^|()]+)/);
  if (occasionMatch) {
    isSpecialOccasion = true;
    occasionTitle = occasionMatch[1].trim();
  } else if (notes.includes('نيروز') || notes.includes('النيروز') || notes.includes('صليب') || notes.includes('الصليب') || notes.includes('عيد')) {
    isSpecialOccasion = true;
    if (notes.includes('نيروز') || notes.includes('النيروز')) occasionTitle = 'عيد النيروز المجيد (رأس السنة القبطية)';
    else if (notes.includes('صليب') || notes.includes('الصليب')) occasionTitle = 'عيد الصليب المجيد';
    else occasionTitle = 'مناسبة طقسية خاصة';
  }

  // Sermon parsing
  const sermonMatch = notes.match(/(?:العظة|ملقي العظة|واعظ القداس|واعظ العشية)[:\s]+([^|()]+)(?:\(([^)]+)\))?/);
  if (sermonMatch) {
    hasSermon = true;
    sermonSpeaker = sermonMatch[1].trim();
    if (sermonMatch[2]) {
      sermonTopic = sermonMatch[2].trim();
    }
  }

  // Priests parsing with strict click order preservation
  const priests: string[] = [];
  const priestMatch = notes.match(/(?:الكهنة المصلون|الكاهن المصلي|الكهنة|الكاهن)[:\s]+([^|]+)/);
  
  if (priestMatch) {
    const rawNames = priestMatch[1].split(/[•،,]/).map(s => s.trim()).filter(Boolean);
    for (const name of rawNames) {
      if (name && !priests.includes(name)) {
        priests.push(name);
      }
    }
  } else {
    // Fallback: look for priests by their character index in the notes string
    const foundWithIndex: { name: string; idx: number }[] = [];
    for (const p of PRIEST_NAMES_LIST) {
      const idx = notes.indexOf(p);
      if (idx !== -1) {
        foundWithIndex.push({ name: p, idx });
      }
    }
    foundWithIndex.sort((a, b) => a.idx - b.idx);
    for (const item of foundWithIndex) {
      if (!priests.includes(item.name)) {
        priests.push(item.name);
      }
    }
  }

  if (priests.length === 0) {
    priests.push('آباء الكنيسة');
  }

  let cleanExtra = notes;
  if (sermonMatch) cleanExtra = cleanExtra.replace(sermonMatch[0], '');
  if (dateMatch) cleanExtra = cleanExtra.replace(dateMatch[0], '');
  if (occasionMatch) cleanExtra = cleanExtra.replace(occasionMatch[0], '');
  cleanExtra = cleanExtra.replace(/الأسبوع[:\s]+[^\s|]+/g, '');
  PRIEST_NAMES_LIST.forEach(p => {
    cleanExtra = cleanExtra.replace(new RegExp(`(?:الكهنة|الكاهن(?:\\s*المصلي)?[:\\s]+)?${p}`, 'g'), '');
  });
  cleanExtra = cleanExtra.replace(/\|/g, '').replace(/الكهنة المصلون[:\s]*/g, '').replace(/الكاهن المصلي[:\s]*/g, '').trim();

  return {
    priests,
    hasSermon,
    sermonSpeaker,
    sermonTopic,
    weekScope,
    specificDate,
    isSpecialOccasion,
    occasionTitle,
    extraNotes: cleanExtra,
  };
};
