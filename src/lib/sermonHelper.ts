// ===================================================================
// Sermon Classification & Priest Detection Shared Helper
// ===================================================================

export const SERMON_CATEGORIES = [
  'الكل',
  'ابونا مرقس ميلاد',
  'ابونا بيشوي ثابت',
  'ابونا مينا نادر',
  'ابونا ميخائيل ميخائيل',
  'ابونا كيرلس ميلاد',
  'ابونا موسى وجيه',
  'عشيات',
  'قداسات',
  'أخرى'
] as const;

export type SermonCategoryType = (typeof SERMON_CATEGORIES)[number];

export interface SermonPriestInfo {
  name: string;
  shortName: string;
  role: string;
  pattern: RegExp;
}

export const OFFICIAL_CHURCH_PRIESTS: SermonPriestInfo[] = [
  {
    name: 'ابونا مرقس ميلاد',
    shortName: 'ابونا مرقس',
    role: 'كاهن الكنيسة',
    pattern: /(مرقس\s*ميلاد|ابونا\s*مرقس|أبونا\s*مرقس|القمص\s*مرقس|ابونا\s*مرقص|أبونا\s*مرقص)/
  },
  {
    name: 'ابونا بيشوي ثابت',
    shortName: 'ابونا بيشوي',
    role: 'كاهن الكنيسة',
    pattern: /(بيشوي\s*ثابت|بيشوى\s*ثابت|ابونا\s*بيشوي|أبونا\s*بيشوي|ابونا\s*بيشوى|أبونا\s*بيشوى|القمص\s*بيشوي)/
  },
  {
    name: 'ابونا مينا نادر',
    shortName: 'ابونا مينا',
    role: 'كاهن الكنيسة',
    pattern: /(مينا\s*نادر|ابونا\s*مينا|أبونا\s*مينا|القمص\s*مينا|القس\s*مينا)/
  },
  {
    name: 'ابونا ميخائيل ميخائيل',
    shortName: 'ابونا ميخائيل',
    role: 'كاهن الكنيسة',
    pattern: /(ميخائيل\s*ميخائيل|ابونا\s*ميخائيل|أبونا\s*ميخائيل|القمص\s*ميخائيل|القس\s*ميخائيل)/
  },
  {
    name: 'ابونا كيرلس ميلاد',
    shortName: 'ابونا كيرلس',
    role: 'كاهن الكنيسة',
    pattern: /(كيرلس\s*ميلاد|ابونا\s*كيرلس|أبونا\s*كيرلس|القمص\s*كيرلس|القس\s*كيرلس)/
  },
  {
    name: 'ابونا موسى وجيه',
    shortName: 'ابونا موسى',
    role: 'كاهن الكنيسة',
    pattern: /(موسى\s*وجيه|موسي\s*وجيه|ابونا\s*موسى|أبونا\s*موسى|ابونا\s*موسي|أبونا\s*موسي|القمص\s*موسى|القس\s*موسى)/
  }
];

export interface SermonLike {
  title?: string | null;
  speaker?: string | null;
  topic?: string | null;
  description?: string | null;
}

/**
 * Detects the speaker name from the sermon title, description, or existing speaker field.
 */
export const detectSermonSpeaker = (title?: string | null, currentSpeaker?: string | null): string => {
  const cleanTitle = (title || '').trim();
  const cleanSpeaker = (currentSpeaker || '').trim();

  for (const priest of OFFICIAL_CHURCH_PRIESTS) {
    if (priest.pattern.test(cleanTitle) || (cleanSpeaker && priest.pattern.test(cleanSpeaker))) {
      return priest.name;
    }
  }

  // Check guest priests or bishops (e.g. ابونا ارساني مجدي, نيافة الأنبا ...)
  const customMatch = cleanTitle.match(/(?:أبونا|ابونا|القمص|القس|الأنبا|الانبا)\s+([^\s\d\/\-()]+(?:\s+[^\s\d\/\-()]+)?)/);
  if (customMatch) {
    return customMatch[0].trim();
  }

  if (cleanSpeaker && cleanSpeaker !== 'آباء كنيسة العذراء محرم بك' && cleanSpeaker !== 'آباء الكنيسة') {
    return cleanSpeaker;
  }

  const isLiturgyOrVesper = cleanTitle.includes('قداس') || cleanTitle.includes('عشية') || cleanTitle.includes('تسبحة');
  return isLiturgyOrVesper ? 'آباء كنيسة العذراء محرم بك' : 'آباء الكنيسة';
};

/**
 * Determines which category/tab a sermon belongs to based on the video title, speaker, and topic.
 */
export const detectSermonCategory = (sermon: SermonLike): SermonCategoryType => {
  const title = (sermon.title || '').trim();
  const speaker = (sermon.speaker || '').trim();
  const topic = (sermon.topic || '').trim();
  const desc = (sermon.description || '').trim();

  // 1. Check if it matches any of our church's official fathers
  for (const priest of OFFICIAL_CHURCH_PRIESTS) {
    if (
      priest.pattern.test(title) ||
      priest.pattern.test(speaker) ||
      priest.pattern.test(topic)
    ) {
      return priest.name as SermonCategoryType;
    }
  }

  const normalizedText = `${title} ${speaker} ${topic} ${desc}`
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');

  // 2. Check Liturgical Services (عشيات / قداسات)
  if (
    normalizedText.includes('عشيه') ||
    normalizedText.includes('عشيات') ||
    normalizedText.includes('تسبحه') ||
    normalizedText.includes('تسابيح') ||
    normalizedText.includes('رفع بخور')
  ) {
    return 'عشيات';
  }

  if (
    normalizedText.includes('قداس') ||
    normalizedText.includes('قداسات') ||
    normalizedText.includes('ذبيحه') ||
    normalizedText.includes('تكملة القداس')
  ) {
    return 'قداسات';
  }

  // 3. Everything else belongs to 'أخرى'
  return 'أخرى';
};

/**
 * Returns true if sermon matches the selected filter category ('الكل' or specific category)
 */
export const matchesSermonCategory = (
  sermon: SermonLike,
  selectedCategory: string
): boolean => {
  if (!selectedCategory || selectedCategory === 'الكل') return true;
  const detected = detectSermonCategory(sermon);
  return detected === selectedCategory;
};
