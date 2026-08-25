// Coptic Arabic Audio Bible Data Engine
// Supports Online Streaming & Offline Reading / Listening

export interface BibleBook {
  id: string;
  name: string;
  testament: 'new' | 'old';
  section: 'الأناجيل' | 'أعمال الرسل' | 'رسائل بولس' | 'الرسائل الجامعة' | 'الرؤيا' | 'المزامير' | 'الأسفار الشعرية' | 'الأنبياء';
  chaptersCount: number;
  audioBaseUrl: string;
  description: string;
  sampleVerses: {
    ref: string;
    text: string;
  };
}

export const AUDIO_BIBLE_BOOKS: BibleBook[] = [
  // === العهد الجديد ===
  {
    id: 'matthew',
    name: 'إنجيل متى',
    testament: 'new',
    section: 'الأناجيل',
    chaptersCount: 28,
    audioBaseUrl: 'https://media.copticorthodox.church/bible/ar/40_matthew.mp3',
    description: 'إنجيل الملك المسيا الموعود به في العهد القديم والموعظة على الجبل.',
    sampleVerses: {
      ref: 'متى ٥ : ١٤ - ١٦',
      text: '«أَنْتُمْ نُورُ الْعَالَمِ. لاَ يُمْكِنُ أَنْ تُخْفَى مَدِينَةٌ مَوْضُوعَةٌ عَلَى جَبَلٍ... فَلْيُضِئْ نُورُكُمْ هكَذَا قُدَّامَ النَّاسِ، لِكَيْ يَرَوْا أَعْمَالَكُمُ الْحَسَنَةَ، وَيُمَجِّدُوا أَبَاكُمُ الَّذِي فِي السَّمَاوَاتِ».'
    }
  },
  {
    id: 'mark',
    name: 'إنجيل مرقس',
    testament: 'new',
    section: 'الأناجيل',
    chaptersCount: 16,
    audioBaseUrl: 'https://media.copticorthodox.church/bible/ar/41_mark.mp3',
    description: 'إنجيل الخادم الصالح وصاحب القوة والمعجزات وفادي البشرية.',
    sampleVerses: {
      ref: 'مرقس ١٠ : ٤٥',
      text: '«لأَنَّ ابْنَ الإِنْسَانِ أَيْضاً لَمْ يَأْتِ لِيُخْدَمَ بَلْ لِيَخْدِمَ وَلِيَبْذِلَ نَفْسَهُ فِدْيَةً عَنْ كَثِيرِينَ».'
    }
  },
  {
    id: 'luke',
    name: 'إنجيل لوقا',
    testament: 'new',
    section: 'الأناجيل',
    chaptersCount: 24,
    audioBaseUrl: 'https://media.copticorthodox.church/bible/ar/42_luke.mp3',
    description: 'إنجيل ابن الإنسان صديق الخطاة والفقراء ومصدر الفرح والرجاء.',
    sampleVerses: {
      ref: 'لوقا ١٩ : ١٠',
      text: '«لأَنَّ ابْنَ الإِنْسَانِ قَدْ جَاءَ لِكَيْ يَطْلُبَ وَيُخَلِّصَ مَا قَدْ هَلَكَ».'
    }
  },
  {
    id: 'john',
    name: 'إنجيل يوحنا',
    testament: 'new',
    section: 'الأناجيل',
    chaptersCount: 21,
    audioBaseUrl: 'https://media.copticorthodox.church/bible/ar/43_john.mp3',
    description: 'إنجيل اللاهوت والكلمة المتجسد سر الحياة الأبدية ومحب البشر.',
    sampleVerses: {
      ref: 'يوحنا ٣ : ١٦',
      text: '«لأَنَّهُ هكَذَا أَحَبَّ اللهُ الْعَالَمَ حَتَّى بَذَلَ ابْنَهُ الْوَحِيدَ، لِكَيْ لاَ يَهْلِكَ كُلُّ مَنْ يُؤْمِنُ بِهِ، بَلْ تَكُونُ لَهُ الْحَيَاةُ الأَبَدِيَّةُ».'
    }
  },
  {
    id: 'acts',
    name: 'سفر أعمال الرسل',
    testament: 'new',
    section: 'أعمال الرسل',
    chaptersCount: 28,
    audioBaseUrl: 'https://media.copticorthodox.church/bible/ar/44_acts.mp3',
    description: 'تاريخ انطلاق الكنيسة الأولى بقيادة الروح القدس وجهاد الآباء الرسل.',
    sampleVerses: {
      ref: 'أعمال ١ : ٨',
      text: '«لكِنَّكُمْ سَتَنَالُونَ قُوَّةً مَتَى حَلَّ الرُّوحُ الْقُدُسُ عَلَيْكُمْ، وَتَكُونُونَ لِي شُهُوداً فِي أُورُشَلِيمَ وَفِي كُلِّ الْيَهُودِيَّةِ وَالسَّامِرَةِ وَإِلَى أَقْصَى الأَرْضِ».'
    }
  },
  {
    id: 'romans',
    name: 'رسالة رومية',
    testament: 'new',
    section: 'رسائل بولس',
    chaptersCount: 16,
    audioBaseUrl: 'https://media.copticorthodox.church/bible/ar/45_romans.mp3',
    description: 'دستور الإيمان المسيحي والتبرير بالنعمة والفداء بموت المسيح وقيامته.',
    sampleVerses: {
      ref: 'رومية ٨ : ٣٨ - ٣٩',
      text: '«فَإِنِّي مُتَيَقِّنٌ أَنَّهُ لاَ مَوْتَ وَلاَ حَيَاةَ... تَقْدِرُ أَنْ تَفْصِلَنَا عَنْ مَحَبَّةِ اللهِ الَّتِي فِي الْمَسِيحِ يَسُوعَ رَبِّنَا».'
    }
  },
  {
    id: '1corinthians',
    name: 'رسالة كورنثوس الأولى',
    testament: 'new',
    section: 'رسائل بولس',
    chaptersCount: 16,
    audioBaseUrl: 'https://media.copticorthodox.church/bible/ar/46_1corinthians.mp3',
    description: 'نشيد المحبة الخالدة وسر الإفخارستيا وحقيقة القيامة من بين الأموات.',
    sampleVerses: {
      ref: '١ كورنثوس ١٣ : ٤ - ٨',
      text: '«الْمَحَبَّةُ تَتَأَنَّى وَتَرْفُقُ. الْمَحَبَّةُ لاَ تَحْسِدُ... الْمَحَبَّةُ لاَ تَسْقُطُ أَبَداً».'
    }
  },
  {
    id: 'hebrews',
    name: 'رسالة العبرانيين',
    testament: 'new',
    section: 'رسائل بولس',
    chaptersCount: 13,
    audioBaseUrl: 'https://media.copticorthodox.church/bible/ar/58_hebrews.mp3',
    description: 'رئيس كهنتنا الأعظم يسوع المسيح، وعظمة العهد الجديد وأبطال الإيمان.',
    sampleVerses: {
      ref: 'عبرانيين ١٢ : ١ - ٢',
      text: '«لِنُحَاذِرْ عَنْ كُلِّ ثِقَلٍ، وَالْخَطِيَّةِ الْمُحِيطَةِ بِنَا بِسُهُولَةٍ، وَلْنُحَاكِمْ بِالصَّبْرِ فِي الْجِهَادِ الْمَوْضُوعِ أَمَامَنَا، نَاظِرِينَ إِلَى رَئِيسِ الإِيمَانِ وَمُكَمِّلِهِ يَسُوعَ».'
    }
  },
  {
    id: 'james',
    name: 'رسالة يعقوب',
    testament: 'new',
    section: 'الرسائل الجامعة',
    chaptersCount: 5,
    audioBaseUrl: 'https://media.copticorthodox.church/bible/ar/59_james.mp3',
    description: 'الإيمان الحي العامل بالمحبة، والصبر في التجارب وقوة صلاة الإيمان.',
    sampleVerses: {
      ref: 'يعقوب ٢ : ٢٦',
      text: '«لأَنَّهُ كَمَا أَنَّ الْجَسَدَ بِدُونَ رُوحٍ مَيِّتٌ، هكَذَا الإِيمَانُ أَيْضاً بِدُونِ أَعْمَالٍ مَيِّتٌ».'
    }
  },
  {
    id: '1peter',
    name: 'رسالة بطرس الأولى',
    testament: 'new',
    section: 'الرسائل الجامعة',
    chaptersCount: 5,
    audioBaseUrl: 'https://media.copticorthodox.church/bible/ar/60_1peter.mp3',
    description: 'الرجاء الحي وسط الآلام والاضطهاد والقداسة في كل سيرة.',
    sampleVerses: {
      ref: '١ بطرس ٥ : ٧',
      text: '«مُلْقِينَ كُلَّ هَمِّكُمْ عَلَيْهِ، لأَنَّهُ هُوَ يَعْتَنِي بِكُمْ».'
    }
  },
  {
    id: '1john',
    name: 'رسالة يوحنا الأولى',
    testament: 'new',
    section: 'الرسائل الجامعة',
    chaptersCount: 5,
    audioBaseUrl: 'https://media.copticorthodox.church/bible/ar/62_1john.mp3',
    description: 'الله محبة، والشركة في النور الإلهي والمحبة الأخوية الصادقة.',
    sampleVerses: {
      ref: '١ يوحنا ٤ : ٧ - ٨',
      text: '«أَيُّهَا الأَحِبَّاءُ، لِنُحِبَّ بَعْضُنَا بَعْضاً، لأَنَّ الْمَحَبَّةَ هِيَ مِنَ اللهِ... لأَنَّ اللهَ مَحَبَّةٌ».'
    }
  },
  {
    id: 'revelation',
    name: 'سفر الرؤيا',
    testament: 'new',
    section: 'الرؤيا',
    chaptersCount: 22,
    audioBaseUrl: 'https://media.copticorthodox.church/bible/ar/66_revelation.mp3',
    description: 'رؤيا يوحنا اللاهوتي، ونصرة الحمل المذبوح وأورشليم السمائية الأبدية.',
    sampleVerses: {
      ref: 'رؤيا ٢١ : ٤',
      text: '«وَسَيَمْسَحُ اللهُ كُلَّ دَمْعَةٍ مِنْ عُيُونِهِمْ، وَالْمَوْتُ لاَ يَكُونُ فِي مَا بَعْدُ، وَلاَ يَكُونُ حُزْنٌ وَلاَ صُرَاخٌ وَلاَ وَجَعٌ فِي مَا بَعْدُ، لأَنَّ الأُمُورَ الأُولَى قَدْ مَضَتْ».'
    }
  },

  // === العهد القديم: سفر المزامير ===
  {
    id: 'psalms',
    name: 'سفر المزامير',
    testament: 'old',
    section: 'المزامير',
    chaptersCount: 151,
    audioBaseUrl: 'https://media.copticorthodox.church/bible/ar/19_psalms.mp3',
    description: 'صلوات وترنيمات داود النبي والآباء، نبع الصلاة والتسبيح اليومي للكنيسة.',
    sampleVerses: {
      ref: 'مزمور ٢٣ : ١ - ٣',
      text: '«الرَّبُّ رَاعِيَّ فَلاَ يَعْوُزُنِي شَيْءٌ. فِي مَرَاعٍ خُضْرٍ يُرْبِضُنِي. إِلَى مِيَاهِ الرَّاحَةِ يُورِدُنِي. يَرُدُّ نَفْسِي. يَهْدِينِي إِلَى سُبُلِ الْبِرِّ مِنْ أَجْلِ اسْمِهِ».'
    }
  }
];
