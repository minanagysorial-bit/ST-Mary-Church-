// API Serverless Function for Coptic Daily Readings & Synaxarium
// Connects to the Official Full Coptic Orthodox Katameros & Synaxarium Engine (api.katameros.app)
// Covers all 365/366 days of the Coptic year with authentic Arabic Van Dyke scriptures

function formatReading(reading, defaultPrefix = '') {
  if (!reading) return { reference: '', text: '' };
  
  const passages = reading.passages || [];
  if (passages.length === 0) {
    const rawHtml = reading.html || '';
    const cleanText = rawHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    return { reference: reading.title || '', text: cleanText ? `«${cleanText}»` : '' };
  }

  const refs = [];
  const allVerses = [];

  for (const p of passages) {
    let book = (p.bookTranslation || '').trim();
    const refStr = (p.ref || '').trim();
    
    if (['متى', 'مرقس', 'لوقا', 'يوحنا'].includes(book) && !book.includes('إنجيل') && !book.includes('رسالة')) {
      if (defaultPrefix.includes('إنجيل')) book = 'إنجيل ' + book;
      else if (defaultPrefix.includes('رسالة')) book = 'رسالة ' + book;
    } else if (book === 'مزامير' || book === 'مزمور') {
      book = 'مزمور';
    } else if (book === 'أعمال' || book === 'أعمال الرسل') {
      book = 'سفر أعمال الرسل';
    } else if (!book.includes('رسالة') && !book.includes('إنجيل') && !book.includes('سفر')) {
      if (defaultPrefix) book = defaultPrefix + ' ' + book;
    }

    refs.push(book + (refStr ? ' (' + refStr + ')' : ''));

    for (const v of (p.verses || [])) {
      if (v.text) allVerses.push(v.text.trim());
    }
  }

  let text = allVerses.join(' ').replace(/\s+/g, ' ').trim();
  if (!text && reading.html) {
    text = reading.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  return {
    reference: refs.join(' ؛ '),
    text: text ? `«${text}»` : ''
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const dateParam = req.query.date || new Date().toISOString().split('T')[0];
  const [year, month, day] = dateParam.split('-');
  const katamerosDate = `${day}-${month}-${year}`;

  try {
    const katamerosUrl = `https://api.katameros.app/readings/gregorian/${katamerosDate}?languageId=3`;
    const katamerosRes = await fetch(katamerosUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    if (!katamerosRes.ok) {
      throw new Error(`Katameros API responded with status ${katamerosRes.status}`);
    }

    const data = await katamerosRes.json();

    const liturgy = data.sections?.find(s => s.title?.includes('قداس'));
    const matins = data.sections?.find(s => s.title?.includes('باكر'));

    // Subsections
    const paulineSub = liturgy?.subSections?.find(s => s.title?.includes('البولس'));
    const catholicSub = liturgy?.subSections?.find(s => s.title?.includes('الكاثوليكون'));
    const actsSub = liturgy?.subSections?.find(s => s.title?.includes('الابركسيس'));
    const synaxSub = liturgy?.subSections?.find(s => s.title?.includes('السنكسار'));
    const gospelSub = liturgy?.subSections?.find(s => s.title?.includes('المزمور والإنجيل'));

    // Readings
    const pauline = formatReading(paulineSub?.readings?.[0], 'رسالة');
    const catholic = formatReading(catholicSub?.readings?.[0], 'رسالة');
    const acts = formatReading(actsSub?.readings?.[0], 'سفر أعمال الرسل');

    const lPsalm = formatReading(gospelSub?.readings?.[0], 'مزمور');
    if (lPsalm.text && !lPsalm.text.includes('هَلِّلُويَا')) {
      lPsalm.text = lPsalm.text.replace(/»$/, ' هَلِّلُويَا.»');
    }
    const lGospel = formatReading(gospelSub?.readings?.[1], 'إنجيل');

    const matinsGospelSub = matins?.subSections?.find(s => s.title?.includes('المزمور والإنجيل'));
    const mPsalm = formatReading(matinsGospelSub?.readings?.[0], 'مزمور');
    if (mPsalm.text && !mPsalm.text.includes('هَلِّلُويَا')) {
      mPsalm.text = mPsalm.text.replace(/»$/, ' هَلِّلُويَا.»');
    }
    const mGospel = formatReading(matinsGospelSub?.readings?.[1], 'إنجيل');

    // Synaxarium
    const synaxReadings = synaxSub?.readings || [];
    const commemorations = synaxReadings.map(r => (r.title || '').trim()).filter(Boolean);
    const mainStory = synaxReadings[0]?.html
      ? synaxReadings[0].html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : 'بركة صلوات وشفاعة قديسي هذا اليوم فلتكن معنا جميعاً، آمين.';
    const mainTitle = synaxReadings[0]?.title || 'تذكار قديسي هذا اليوم المبارك';

    const payload = {
      success: true,
      source: 'Coptic Orthodox Katameros & Synaxarium (Katameros.app)',
      gregorianDate: dateParam,
      copticDateRaw: data.copticDate,
      periodInfo: data.periodInfo,
      synaxarium: {
        title: mainTitle,
        commemorations: commemorations.length > 0 ? commemorations : [mainTitle],
        mainStory: mainStory,
        saintName: mainTitle.replace(/^(تذكار|استشهاد|نياحة)\s+/, '')
      },
      gospel: {
        reference: lGospel.reference || 'إنجيل القداس الإلهي',
        text: lGospel.text || '',
        psalmRef: lPsalm.reference || 'مزمور القداس الإلهي',
        psalmText: lPsalm.text || ''
      },
      epistles: {
        paulineRef: pauline.reference || 'رسالة البولس',
        paulineText: pauline.text || '',
        catholicRef: catholic.reference || 'رسالة الكاثوليكون',
        catholicText: catholic.text || '',
        actsRef: acts.reference || 'سفر الإبركسيس (أعمال الرسل)',
        actsText: acts.text || ''
      },
      matins: {
        gospelRef: mGospel.reference || 'إنجيل باكر',
        gospelText: mGospel.text || '',
        psalmRef: mPsalm.reference || 'مزمور باكر',
        psalmText: mPsalm.text || ''
      },
      reflection: {
        title: `بركة كلمة الرب وإنجيل اليوم (${data.periodInfo?.season || 'القداس الإلهي'})`,
        text: 'دعوة إلهية مباركة للتأمل في رسائل وخلاص مخلصنا الصالح، والتمسك بالوصية المحيية وسير الآباء القديسين والشهداء الأبرار.',
        quote: lGospel.text ? lGospel.text.slice(0, 160) + '...' : '«كَلِمَتُكَ مِصْبَاحٌ لِرِجْلِي وَنُورٌ لِسَبِيلِي»'
      }
    };

    res.status(200).json(payload);
  } catch (err) {
    console.error('Katameros API processing error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
