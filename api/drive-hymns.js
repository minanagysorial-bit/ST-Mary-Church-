import https from 'https';

const FOLDER_ID = '1rxTUSTGQEoxAwkk-yj_FQV14-1Q3MSKo';
const FOLDER_URL = `https://drive.google.com/drive/folders/${FOLDER_ID}`;

function fetchDriveHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
      }
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchDriveHtml(res.headers.location));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function getCategory(name) {
  if (name.includes('صلاة') || name.includes('الغروب') || name.includes('النوم') || name.includes('التاسعة') || name.includes('باكر')) {
    return 'صلوات الأجبية والعروض';
  }
  if (name.includes('مريم') || name.includes('العذراء') || name.includes('بتخبيني') || name.includes('اكلسيا') || name.includes('كنيستنا')) {
    return 'ترانيم السيدة العذراء والكنيسة';
  }
  if (name.includes('الهنا عظيم') || name.includes('انت قلت تعالوا') || name.includes('تعالوا تعالوا') || name.includes('فرحان بيك') || name.includes('اطفال')) {
    return 'ترانيم مدارس الأحد';
  }
  if (name.includes('طهرنى') || name.includes('ايها الفخارى') || name.includes('ضاقت الدنيا')) {
    return 'ترانيم التوبة والتسليم';
  }
  if (name.includes('الرب قريب') || name.includes('لا تتركنى') || name.includes('لم تر عين')) {
    return 'ترانيم التعزية والرجاء';
  }
  return 'ترانيم شبابية وتأمل';
}

function getSnippet(name) {
  const map = {
    'ترنيمة احلى ما فى حياتى انت': 'أحلى ما في حياتي إنت.. وأغلى ما في عمري إنت.. إنت كل ما لي يسوع حبيبي.',
    'ترنيمة اسمحيلى يا اكلسيا': 'إسمحيلي يا إكليسيا.. أفرح بيكي وأرنم ليكي.. كنيسة آبائي الأطهار.',
    'ترنيمة أسمع صراخى يا سيدى': 'إسمع صراخي يا سيدي.. إلى صلاتي أمل أذنيك.. في ضيقي دعوتك فاستجبت لي.',
    'ترنيمة الرب قريب': 'الرب قريب لكل الذين يدعونه بالحق.. عيني عليه في كل أوان.',
    'ترنيمة الهنا عظيم': 'إلهنا عظيم إلهنا أمين.. يقودنا في موكب النصرة كل حين.',
    'ترنيمة امسك يارب ايدى': 'إمسك يارب إيدي زي بطرس في وسط الرياح.. مد إيدك ونجيني.',
    'ترنيمة انت قلت تعالوا': 'إنت قلت تعالوا إليّ يا جميع المتعبين وأنا أريحكم.. ها نحن نأتي إليك.',
    'ترنيمة ايها الفخارى': 'أيها الفخاري الأعظم شكلني بحسب مشيئتك.. عجينة لينة بين يديك الطاهرتين.',
    'ترنيمة تعالوا تعالوا': 'تعالوا تعالوا يا أطفال نسجد ليسوع البار.. ونرنم بأعلى صوت.',
    'ترنيمة دايما بتخبيني': 'دايماً بتخبيني في سترك يا أمي يا عذراء.. في حضنك بلاقي الأمان.',
    'ترنيمة ضاقت الدنيا قصادى': 'ضاقت الدنيا قصادي وملقتش غيرك سندي.. جيتلك بدموعي فمسحت أحزاني.',
    'ترنيمة طهرنى': 'طهرني يا رب فأطهر.. إغسلني فأبيض أكثر من الثلج.. قلباً نقياً اخلق فيّ.',
    'ترنيمة علمني': 'علمني يارب أصلي.. علمني أسمع صوتك وأمشي وراك في كل طريقي.',
    'ترنيمة فرحان بيك وانا ماشى معاك': 'فرحان بيك وأنا ماشي معاك.. إيدك في إيدي وعيني شايفاك.',
    'ترنيمة كنيستنا دى قصة اجيال': 'كنيستنا دي قصة أجيال.. دم الشهداء فيها حكاية وسير الأبرار.',
    'ترنيمة لا لا تتركنى وحدى': 'لا لا تتركني وحدي في طريق الغربة.. كن عوني ومرشدي وسندي.',
    'ترنيمة لم تر عين': 'لم تر عين ولم تسمع أذن ما أعده الله للذين يحبونه.. أمجاد أبدية.',
    'ترنيمة من بين القديسين': 'من بين القديسين اخترت أصحابي.. شفاعتكم تسندني في كل صلاتي.',
    'صلاة الساعة التاسعة': 'عرض بوربوينت كامل لصلاة الساعة التاسعة من الأجبية المقدسة لتلاوتها جماعياً في الخدمة.',
    'صلاة الغروب': 'عرض بوربوينت كامل لصلاة الغروب من الأجبية المقدسة بمزاميرها وإنجيلها وقطعها.',
    'صلاة النوم': 'عرض بوربوينت كامل لصلاة النوم من الأجبية المقدسة لعرضها في السهرات الروحية والنهضات.'
  };
  return map[name] || 'عرض تقديمي PPTX من Google Drive جاهز للشاشات والبروجكتور في مدارس الأحد والاجتماعات.';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const html = await fetchDriveHtml(FOLDER_URL);

    const items = [];
    const seen = new Set();

    // Strategy 1: Match aria-label="FILENAME" ... ssk='...:FILEID-...'
    const regex1 = /aria-label="([^"]+)\.pptx?[^"]*"\s+[^>]*ssk='[^':]+:[^':]+:([a-zA-Z0-9_-]{25,})-[^']*'/gi;
    let m;
    while ((m = regex1.exec(html)) !== null) {
      const name = m[1].trim();
      const id = m[2].replace(/-0$/, '');
      if (!seen.has(name)) {
        seen.add(name);
        items.push({ name, id });
      }
    }

    // Strategy 2: Match reversed ssk='...:FILEID-...' ... aria-label="FILENAME"
    const regex2 = /ssk='[^':]+:[^':]+:([a-zA-Z0-9_-]{25,})-[^']*'[^>]*aria-label="([^"]+)\.pptx?[^"]*"/gi;
    while ((m = regex2.exec(html)) !== null) {
      const id = m[1].replace(/-0$/, '');
      const name = m[2].trim();
      if (!seen.has(name)) {
        seen.add(name);
        items.push({ name, id });
      }
    }

    // Strategy 3: Search around aria-label for ssk
    const labelRegex = /aria-label="([^"]+\.pptx?)[^"]*"/gi;
    while ((m = labelRegex.exec(html)) !== null) {
      const filename = m[1].trim();
      const cleanName = filename.replace(/\.pptx?/i, '').trim();
      if (!seen.has(cleanName)) {
        const idx = m.index;
        const chunk = html.substring(Math.max(0, idx - 150), Math.min(html.length, idx + 250));
        const sskMatch = chunk.match(/ssk='[^':]+:[^':]+:([a-zA-Z0-9_-]{25,})-[^']*'/);
        if (sskMatch) {
          seen.add(cleanName);
          items.push({ name: cleanName, id: sskMatch[1].replace(/-0$/, '') });
        }
      }
    }

    const hymns = items.map((item, idx) => ({
      id: `live_drive_${item.id}`,
      title: item.name,
      category: getCategory(item.name),
      drive_url: `https://drive.google.com/file/d/${item.id}/view?usp=sharing`,
      lyrics_snippet: getSnippet(item.name),
      created_at: new Date().toISOString().split('T')[0]
    }));

    // Cache on Vercel Edge CDN for 30 minutes
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=86400');
    return res.status(200).json({
      success: true,
      folderId: FOLDER_ID,
      count: hymns.length,
      hymns
    });

  } catch (error) {
    console.error('Error fetching live Google Drive folder:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
