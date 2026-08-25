// Bible Chapters & Verses Engine with Audio Synchronized Highlighter Timings

export interface BibleVerse {
  verseNumber: number;
  text: string;
  startSec: number;
  endSec: number;
}

export interface BibleChapterData {
  bookId: string;
  bookName: string;
  testament: 'new' | 'old';
  section: string;
  chapterNumber: number;
  audioUrl: string;
  totalDurationEstimate: string;
  verses: BibleVerse[];
}

export interface AgpeyaSection {
  id: string;
  title: string;
  type: 'intro' | 'psalm' | 'gospel' | 'litany' | 'absolution' | 'conclusion';
  text: string;
  startSec: number;
  endSec: number;
}

// ── SAMPLE FULL CHAPTERS WITH SYNCHRONIZED TIMINGS ──

export const SAMPLE_CHAPTERS_DB: Record<string, BibleChapterData> = {
  // === إنجيل متى - أصحاح ٥ (الموعظة على الجبل) ===
  'matthew-5': {
    bookId: 'matthew',
    bookName: 'إنجيل متى',
    testament: 'new',
    section: 'الأناجيل',
    chapterNumber: 5,
    audioUrl: 'https://media.copticorthodox.church/bible/ar/40_matthew_05.mp3',
    totalDurationEstimate: '٧ دقائق',
    verses: [
      { verseNumber: 1, text: 'وَلَمَّا رَأَى الْجُمُوعَ صَعِدَ إِلَى الْجَبَلِ، فَلَمَّا جَلَسَ تَقَدَّمَ إِلَيْهِ تَلاَمِيذُهُ.', startSec: 0, endSec: 8 },
      { verseNumber: 2, text: 'فَفَتَحَ فَاهُ وَعَلَّمَهُمْ قَائِلاً:', startSec: 8, endSec: 13 },
      { verseNumber: 3, text: '«طُوبَى لِلْمَسَاكِينِ بِالرُّوحِ، لأَنَّ لَهُمْ مَلَكُوتَ السَّمَاوَاتِ.', startSec: 13, endSec: 20 },
      { verseNumber: 4, text: 'طُوبَى لِلْحَزَانَى، لأَنَّهُمْ يُعَزَّوْنَ.', startSec: 20, endSec: 26 },
      { verseNumber: 5, text: 'طُوبَى لِلْوُدَعَاءِ، لأَنَّهُمْ يَرِثُونَ الأَرْضَ.', startSec: 26, endSec: 32 },
      { verseNumber: 6, text: 'طُوبَى لِلْجِيَاعِ وَالْعِطَاشِ إِلَى الْبِرِّ، لأَنَّهُمْ يُشْبَعُونَ.', startSec: 32, endSec: 39 },
      { verseNumber: 7, text: 'طُوبَى لِلرُّحَمَاءِ، لأَنَّهُمْ يُرْحَمُونَ.', startSec: 39, endSec: 45 },
      { verseNumber: 8, text: 'طُوبَى لِلأَنْقِيَاءِ الْقَلْبِ، لأَنَّهُمْ يُعَايِنُونَ اللهَ.', startSec: 45, endSec: 52 },
      { verseNumber: 9, text: 'طُوبَى لِصَانِعِي السَّلاَمِ، لأَنَّهُمْ أَبْنَاءَ اللهِ يُدْعَوْنَ.', startSec: 52, endSec: 59 },
      { verseNumber: 10, text: 'طُوبَى لِلْمَطْرُودِينَ مِنْ أَجْلِ الْبِرِّ، لأَنَّ لَهُمْ مَلَكُوتَ السَّمَاوَاتِ.', startSec: 59, endSec: 67 },
      { verseNumber: 11, text: 'طُوبَى لَكُمْ إِذَا عَيَّرُوكُمْ وَطَرَدُوكُمْ وَقَالُوا عَلَيْكُمْ كُلَّ كَلِمَةٍ شِرِّيرَةٍ، مِنْ أَجْلِي، كَاذِبِينَ.', startSec: 67, endSec: 77 },
      { verseNumber: 12, text: 'اِفْرَحُوا وَتَهَلَّلُوا، لأَنَّ أَجْرَكُمْ عَظِيمٌ فِي السَّمَاوَاتِ، فَإِنَّهُمْ هكَذَا طَرَدُوا الأَنْبِيَاءَ الَّذِينَ قَبْلَكُمْ.', startSec: 77, endSec: 88 },
      { verseNumber: 13, text: '«أَنْتُمْ مِلْحُ الأَرْضِ، وَلكِنْ إِنْ فَسَدَ الْمِلْحُ فَبِمَاذَا يُمَلَّحُ؟ لاَ يَصْلُحُ بَعْدُ لِشَيْءٍ، إِلاَّ لأَنْ يُطْرَحَ خَارِجاً وَيُدَاسَ مِنَ النَّاسِ.', startSec: 88, endSec: 102 },
      { verseNumber: 14, text: 'أَنْتُمْ نُورُ الْعَالَمِ. لاَ يُمْكِنُ أَنْ تُخْفَى مَدِينَةٌ مَوْضُوعَةٌ عَلَى جَبَلٍ،', startSec: 102, endSec: 112 },
      { verseNumber: 15, text: 'وَلاَ يُوقِدُونَ سِرَاجاً وَيَضَعُونَهُ تَحْتَ الْمِكْيَالِ، بَلْ عَلَى الْمَنَارَةِ فَيُضِيءُ لِجَمِيعِ الَّذِينَ فِي الْبَيْتِ.', startSec: 112, endSec: 123 },
      { verseNumber: 16, text: 'فَلْيُضِئْ نُورُكُمْ هكَذَا قُدَّامَ النَّاسِ، لِكَيْ يَرَوْا أَعْمَالَكُمُ الْحَسَنَةَ، وَيُمَجِّدُوا أَبَاكُمُ الَّذِي فِي السَّمَاوَاتِ».', startSec: 123, endSec: 138 }
    ]
  },

  // === إنجيل يوحنا - أصحاح ١ ===
  'john-1': {
    bookId: 'john',
    bookName: 'إنجيل يوحنا',
    testament: 'new',
    section: 'الأناجيل',
    chapterNumber: 1,
    audioUrl: 'https://media.copticorthodox.church/bible/ar/43_john_01.mp3',
    totalDurationEstimate: '٦ دقائق',
    verses: [
      { verseNumber: 1, text: 'فِي الْبَدْءِ كَانَ الْكَلِمَةُ، وَالْكَلِمَةُ كَانَ عِنْدَ اللهِ، وَكَانَ الْكَلِمَةُ اللهَ.', startSec: 0, endSec: 10 },
      { verseNumber: 2, text: 'هذَا كَانَ فِي الْبَدْءِ عِنْدَ اللهِ.', startSec: 10, endSec: 16 },
      { verseNumber: 3, text: 'كُلُّ شَيْءٍ بِهِ كَانَ، وَبِغَيْرِهِ لَمْ يَكُنْ شَيْءٌ مِمَّا كَانَ.', startSec: 16, endSec: 24 },
      { verseNumber: 4, text: 'فِيهِ كَانَتِ الْحَيَاةُ، وَالْحَيَاةُ كَانَتْ نُورَ النَّاسِ،', startSec: 24, endSec: 32 },
      { verseNumber: 5, text: 'وَالنُّورُ يُضِيءُ فِي الظُّلْمَةِ، وَالظُّلْمَةُ لَمْ تُدْرِكْهُ.', startSec: 32, endSec: 40 },
      { verseNumber: 6, text: 'كَانَ إِنْسَانٌ مُرْسَلٌ مِنَ اللهِ اسْمُهُ يُوحَنَّا.', startSec: 40, endSec: 47 },
      { verseNumber: 7, text: 'هذَا جَاءَ لِلشَّهَادَةِ لِيَشْهَدَ لِلنُّورِ، لِكَيْ يُؤْمِنَ الْكُلُّ بِوَاسِطَتِهِ.', startSec: 47, endSec: 56 },
      { verseNumber: 8, text: 'لَمْ يَكُنْ هُوَ النُّورَ، بَلْ لِيَشْهَدَ لِلنُّورِ.', startSec: 56, endSec: 64 },
      { verseNumber: 9, text: 'كَانَ النُّورُ الْحَقِيقِيُّ الَّذِي يُنِيرُ كُلَّ إِنْسَانٍ آتِياً إِلَى الْعَالَمِ.', startSec: 64, endSec: 73 },
      { verseNumber: 10, text: 'كَانَ فِي الْعَالَمِ، وَكُوِّنَ الْعَالَمُ بِهِ، وَلَمْ يَعْرِفْهُ الْعَالَمُ.', startSec: 73, endSec: 82 },
      { verseNumber: 11, text: 'إِلَى خَاصَّتِهِ جَاءَ، وَخَاصَّتُهُ لَمْ تَقْبَلْهُ.', startSec: 82, endSec: 90 },
      { verseNumber: 12, text: 'وَأَمَّا كُلُّ الَّذِينَ قَبِلُوهُ فَأَعْطَاهُمْ سُلْطَاناً أَنْ يَصِيرُوا أَوْلاَدَ اللهِ، أَيِ الْمُؤْمِنُونَ بِاسْمِهِ.', startSec: 90, endSec: 102 },
      { verseNumber: 13, text: 'اَلَّذِينَ وُلِدُوا لَيْسَ مِنْ دَمٍ، وَلاَ مِنْ مَشِيئَةِ جَسَدٍ، وَلاَ مِنْ مَشِيئَةِ رَجُلٍ، بَلْ مِنَ اللهِ.', startSec: 102, endSec: 114 },
      { verseNumber: 14, text: 'وَالْكَلِمَةُ صَارَ جَسَداً وَحَلَّ بَيْنَنَا، وَرَأَيْنَا مَجْدَهُ، مَجْداً كَمَا لِوَحِيدٍ مِنَ الآبِ، مَمْلُوءاً نِعْمَةً وَحَقّاً.', startSec: 114, endSec: 130 }
    ]
  },

  // === سفر المزامير - مزمور ٢٣ ===
  'psalms-23': {
    bookId: 'psalms',
    bookName: 'سفر المزامير',
    testament: 'old',
    section: 'المزامير',
    chapterNumber: 23,
    audioUrl: 'https://media.copticorthodox.church/bible/ar/19_psalms_23.mp3',
    totalDurationEstimate: 'دقيقتان',
    verses: [
      { verseNumber: 1, text: 'الرَّبُّ رَاعِيَّ فَلاَ يَعْوُزُنِي شَيْءٌ.', startSec: 0, endSec: 8 },
      { verseNumber: 2, text: 'فِي مَرَاعٍ خُضْرٍ يُرْبِضُنِي. إِلَى مِيَاهِ الرَّاحَةِ يُورِدُنِي.', startSec: 8, endSec: 18 },
      { verseNumber: 3, text: 'يَرُدُّ نَفْسِي. يَهْدِينِي إِلَى سُبُلِ الْبِرِّ مِنْ أَجْلِ اسْمِهِ.', startSec: 18, endSec: 28 },
      { verseNumber: 4, text: 'أَيْضاً إِذَا سِرْتُ فِي وَادِي ظِلِّ الْمَوْتِ لاَ أَخَافُ شَرّاً، لأَنَّكَ أَنْتَ مَعِي. عَصَاكَ وَعُكَّازُكَ هُمَا يُعَزِّيَانِنِي.', startSec: 28, endSec: 42 },
      { verseNumber: 5, text: 'تُرَتِّبُ قُدَّامِي مَائِدَةً تُجَاهَ مُضَايِقِيَّ. مَسَحْتَ بِالدُّهْنِ رَأْسِي. كَأْسِي رَيَّا.', startSec: 42, endSec: 56 },
      { verseNumber: 6, text: 'إِنَّمَا خَيْرٌ وَرَحْمَةٌ يَتْبَعَانِنِي كُلَّ أَيَّامِ حَيَاتِي، وَأَسْكُنُ فِي بَيْتِ الرَّبِّ إِلَى مَدَى الأَيَّامِ. هَلِّلُويَا.', startSec: 56, endSec: 72 }
    ]
  },

  // === رسالة كورنثوس الأولى - أصحاح ١٣ (نشيد المحبة) ===
  '1corinthians-13': {
    bookId: '1corinthians',
    bookName: 'رسالة كورنثوس الأولى',
    testament: 'new',
    section: 'رسائل بولس',
    chapterNumber: 13,
    audioUrl: 'https://media.copticorthodox.church/bible/ar/46_1corinthians_13.mp3',
    totalDurationEstimate: '٤ دقائق',
    verses: [
      { verseNumber: 1, text: 'إِنْ كُنْتُ أَتَكَلَّمُ بِأَلْسِنَةِ النَّاسِ وَالْمَلاَئِكَةِ وَلكِنْ لَيْسَ لِي مَحَبَّةٌ، فَقَدْ صِرْتُ نُحَاساً يَطِنُّ أَوْ صَنْجاً يَرِنُّ.', startSec: 0, endSec: 12 },
      { verseNumber: 2, text: 'وَإِنْ كَانَتْ لِي نُبُوَّةٌ، وَأَعْلَمُ جَمِيعَ الأَسْرَارِ وَكُلَّ عِلْمٍ، وَإِنْ كَانَ لِي كُلُّ الإِيمَانِ حَتَّى أَنْقُلَ الْجِبَالَ، وَلكِنْ لَيْسَ لِي مَحَبَّةٌ، فَلَسْتُ شَيْئاً.', startSec: 12, endSec: 26 },
      { verseNumber: 3, text: 'وَإِنْ أَطْعَمْتُ كُلَّ أَمْوَالِي، وَإِنْ سَلَّمْتُ جَسَدِي حَتَّى أَحْتَرِقَ، وَلكِنْ لَيْسَ لِي مَحَبَّةٌ، فَلاَ أَنْتَفِعُ شَيْئاً.', startSec: 26, endSec: 38 },
      { verseNumber: 4, text: 'الْمَحَبَّةُ تَتَأَنَّى وَتَرْفُقُ. الْمَحَبَّةُ لاَ تَحْسِدُ. الْمَحَبَّةُ لاَ تَتَفَاخَرُ، وَلاَ تَنْتَفِخُ،', startSec: 38, endSec: 50 },
      { verseNumber: 5, text: 'وَلاَ تُقَبِّحُ، وَلاَ تَطْلُبُ مَا لِنَفْسِهَا، وَلاَ تَحْتَدُّ، وَلاَ تَظُنُّ السُّؤَ،', startSec: 50, endSec: 62 },
      { verseNumber: 6, text: 'وَلاَ تَفْرَحُ بِالإِثْمِ بَلْ تَفْرَحُ بِالْحَقِّ،', startSec: 62, endSec: 72 },
      { verseNumber: 7, text: 'وَتَحْتَمِلُ كُلَّ شَيْءٍ، وَتُصَدِّقُ كُلَّ شَيْءٍ، وَتَرْجُو كُلَّ شَيْءٍ، وَتَصْبِرُ عَلَى كُلِّ شَيْءٍ.', startSec: 72, endSec: 84 },
      { verseNumber: 8, text: 'الْمَحَبَّةُ لاَ تَسْقُطُ أَبَداً. وَأَمَّا النُّبُوَّاتُ فَسَتُبْطَلُ، وَالأَلْسِنَةُ فَسَتَنْتَهِي، وَالْعِلْمُ فَسَيُبْطَلُ.', startSec: 84, endSec: 96 },
      { verseNumber: 13, text: 'أَمَّا الآنَ فَيَثْبُتُ: الإِيمَانُ وَالرَّجَاءُ وَالْمَحَبَّةُ، هذِهِ الثَّلاَثَةُ وَلكِنَّ أَعْظَمَهُنَّ الْمَحَبَّةُ.', startSec: 96, endSec: 110 }
    ]
  }
};

/**
 * Returns chapter verses and timings, or generates rich placeholder verses for any chapter
 */
export function getChapterData(bookId: string, chapterNum: number, bookName: string, section: string, testament: 'new' | 'old'): BibleChapterData {
  const key = `${bookId}-${chapterNum}`;
  if (SAMPLE_CHAPTERS_DB[key]) {
    return SAMPLE_CHAPTERS_DB[key];
  }

  // Generate structured chapter verses with proportional timings
  const sampleVersesCount = Math.min(25, Math.max(10, (chapterNum * 7) % 25 + 10));
  const verses: BibleVerse[] = [];
  let currentSec = 0;

  for (let v = 1; v <= sampleVersesCount; v++) {
    const duration = 6 + (v % 5);
    verses.push({
      verseNumber: v,
      text: `«آية ${v} من ${bookName} الأصحاح ${chapterNum}: نِعْمَةُ رَبِّنَا يَسُوعَ الْمَسِيحِ، وَمَحَبَّةُ اللهِ، وَشَرِكَةُ الرُّوحِ الْقُدُسِ مَعَ جَمِيعِكُمْ. آمِينَ».`,
      startSec: currentSec,
      endSec: currentSec + duration
    });
    currentSec += duration;
  }

  return {
    bookId,
    bookName,
    testament,
    section,
    chapterNumber: chapterNum,
    audioUrl: `https://media.copticorthodox.church/bible/ar/${bookId}_${String(chapterNum).padStart(2, '0')}.mp3`,
    totalDurationEstimate: `${Math.ceil(currentSec / 60)} دقيقة`,
    verses
  };
}

/**
 * Split an Agpeya prayer into timed sections for Karaoke-style highlighting
 */
export function getAgpeyaTimedSections(prayerId: string, opening: string, gospel: string, litanies: string[], absolution: string): AgpeyaSection[] {
  const sections: AgpeyaSection[] = [];
  let sec = 0;

  // 1. Opening
  sections.push({
    id: 'intro',
    title: '⛪ مقدمة الصلاة والشكر والمزمور الخمسون',
    type: 'intro',
    text: opening,
    startSec: sec,
    endSec: (sec += 35)
  });

  // 2. Gospel
  sections.push({
    id: 'gospel',
    title: '📜 إنجيل الصلاة المقدس',
    type: 'gospel',
    text: gospel,
    startSec: sec,
    endSec: (sec += 55)
  });

  // 3. Litanies
  litanies.forEach((lit, idx) => {
    sections.push({
      id: `litany-${idx + 1}`,
      title: `✨ القطعة (${idx + 1}) والطلبة`,
      type: 'litany',
      text: lit,
      startSec: sec,
      endSec: (sec += 30)
    });
  });

  // 4. Absolution
  sections.push({
    id: 'absolution',
    title: '🕊️ التحليل الكنسي وبركة الصلاة',
    type: 'absolution',
    text: absolution,
    startSec: sec,
    endSec: (sec += 45)
  });

  return sections;
}
