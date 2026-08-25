// API Serverless Function for Coptic Daily Readings & Synaxarium
// Connected directly to official Coptic Lectionary API (api.coptic.io) + Van Dyke Arabic Scriptures

const BIBLE_ARABIC_NAMES = {
  'Matthew': 'إنجيل متى',
  'Mark': 'إنجيل مرقس',
  'Luke': 'إنجيل لوقا',
  'John': 'إنجيل يوحنا',
  'Psalms': 'مزمور',
  'Psalm': 'مزمور',
  'Hebrews': 'رسالة العبرانيين',
  'Galatians': 'رسالة غلاطية',
  'Romans': 'رسالة رومية',
  '1 Corinthians': 'رسالة كورنثوس الأولى',
  '2 Corinthians': 'رسالة كورنثوس الثانية',
  'Ephesians': 'رسالة أفسس',
  'Philippians': 'رسالة فيلبي',
  'Colossians': 'رسالة كولوسي',
  '1 Thessalonians': 'رسالة تسالونيكي الأولى',
  '2 Thessalonians': 'رسالة تسالونيكي الثانية',
  '1 Timothy': 'رسالة تيموثاوس الأولى',
  '2 Timothy': 'رسالة تيموثاوس الثانية',
  'Titus': 'رسالة تيطس',
  'Philemon': 'رسالة فليمون',
  'James': 'رسالة يعقوب',
  '1 Peter': 'رسالة بطرس الأولى',
  '2 Peter': 'رسالة بطرس الثانية',
  '1 John': 'رسالة يوحنا الأولى',
  '2 John': 'رسالة يوحنا الثانية',
  '3 John': 'رسالة يوحنا الثالثة',
  'Jude': 'رسالة يهوذا',
  'Acts': 'سفر أعمال الرسل'
};

function formatArabicRef(ref) {
  if (!ref) return '';
  let res = ref;
  for (const [eng, arb] of Object.entries(BIBLE_ARABIC_NAMES)) {
    res = res.replace(new RegExp('\\b' + eng + '\\b', 'g'), arb);
  }
  return res.replace(/:/g, ' : ').replace(/;/g, ' ؛ ');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const dateParam = req.query.date || new Date().toISOString().split('T')[0];

  try {
    const copticRes = await fetch(`https://api.coptic.io/api/readings/${dateParam}`);
    if (!copticRes.ok) {
      throw new Error(`Coptic API responded with status ${copticRes.status}`);
    }

    const copticData = await copticRes.json();
    const ref = copticData.reference || {};

    const responsePayload = {
      success: true,
      source: 'Coptic Orthodox Liturgical Lectionary API (coptic.io)',
      gregorianDate: dateParam,
      fullDate: copticData.fullDate,
      stTaklaUrl: `https://st-takla.org/Coptic-Faith-Creed-Dogma/Coptic-Rite-n-Ritual-Taks/Katamaros-Coptic-Daily-Readings.html`,
      references: {
        vespersPsalm: formatArabicRef(ref.VPsalm),
        vespersGospel: formatArabicRef(ref.VGospel),
        matinsPsalm: formatArabicRef(ref.MPsalm),
        matinsGospel: formatArabicRef(ref.MGospel),
        pauline: formatArabicRef(ref.Pauline),
        catholic: formatArabicRef(ref.Catholic),
        acts: formatArabicRef(ref.Acts),
        liturgyPsalm: formatArabicRef(ref.LPsalm),
        liturgyGospel: formatArabicRef(ref.LGospel)
      },
      rawReference: ref,
      synaxarium: copticData.Synaxarium || []
    };

    res.status(200).json(responsePayload);
  } catch (err) {
    console.error('Katamaros API error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
