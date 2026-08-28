export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  // Cache for 15 seconds to ensure fast updates
  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Official Church YouTube Channel ID and Handle
  const OFFICIAL_CHURCH_CHANNEL_ID = 'UCLEhdhZFRuxMXHL3pDpg65g';
  const OFFICIAL_HANDLE = '@StMaryMoharambek';
  const channelId = req.query.channelId || OFFICIAL_CHURCH_CHANNEL_ID;

  let isLive = false;
  let videoId = null;
  let title = 'البث المباشر - كنيسة السيدة العذراء مريم بمحرم بك';

  const extractVideoId = (text) => {
    if (!text) return null;
    const patterns = [
      /<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/,
      /<meta property="og:url" content="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})"/,
      /<meta property="og:video:url" content="https:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]{11})"/,
      /<meta name="twitter:player" content="https:\/\/www\.youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
      /"videoId":"([a-zA-Z0-9_-]{11})"/,
      /itemprop="videoId" content="([a-zA-Z0-9_-]{11})"/,
      /\/watch\?v=([a-zA-Z0-9_-]{11})/
    ];
    for (const p of patterns) {
      const m = text.match(p);
      if (m && m[1]) return m[1];
    }
    return null;
  };

  const extractTitle = (text) => {
    if (!text) return 'البث المباشر - كنيسة السيدة العذراء مريم بمحرم بك';
    const titlePatterns = [
      /<meta property="og:title" content="([^"]+)">/,
      /<meta name="title" content="([^"]+)">/,
      /<title>([^<]+)<\/title>/
    ];
    for (const p of titlePatterns) {
      const m = text.match(p);
      if (m && m[1]) {
        return m[1].replace(' - YouTube', '').trim();
      }
    }
    return 'البث المباشر - كنيسة السيدة العذراء مريم بمحرم بك';
  };

  const checkLiveStatus = (text) => {
    if (!text) return false;
    const isOffline = text.includes('"status":"LIVE_STREAM_OFFLINE"') || 
                      text.includes('LIVE_STREAM_OFFLINE') ||
                      text.includes('"playabilityStatus":{"status":"LIVE_STREAM_OFFLINE"');

    const liveDetected = (
      text.includes('"isLive":true') ||
      text.includes('"isLiveBroadcast":true') || 
      text.includes('"status":"LIVE"') ||
      text.includes('BADGE_STYLE_TYPE_LIVE_NOW') ||
      text.includes('"label":"LIVE"') ||
      text.includes('watching now') ||
      text.includes('يشاهد الآن') ||
      text.includes('بث مباشر')
    );

    return liveDetected && !isOffline;
  };

  try {
    // 1. Fetch Official Church Channel Live URL
    const urlsToTry = [
      `https://www.youtube.com/channel/${channelId}/live`,
      `https://www.youtube.com/${OFFICIAL_HANDLE}/live`
    ];

    for (const liveUrl of urlsToTry) {
      try {
        const liveRes = await fetch(liveUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
            'Cookie': 'CONSENT=YES+cb.20210720-07-p0.en+FX+410; SOCS=CAESEwgDEgk2MTQ1NzU4MTQaAmVuIAEaBgiA_LyaBg'
          },
          redirect: 'follow'
        });

        if (liveRes.ok) {
          const html = await liveRes.text();
          const detectedId = extractVideoId(html);
          const detectedTitle = extractTitle(html);
          const isCurrentlyLive = checkLiveStatus(html);

          if (detectedId && (isCurrentlyLive || html.includes('"isLive":true'))) {
            isLive = true;
            videoId = detectedId;
            title = detectedTitle;
            break;
          }
        }
      } catch (err) {
        console.error('Error fetching live url:', liveUrl, err);
      }
    }

    // 2. If videoId was detected but status was uncertain, do a quick check on the watch page
    if (videoId && !isLive) {
      try {
        const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Cookie': 'CONSENT=YES+cb.20210720-07-p0.en+FX+410; SOCS=CAESEwgDEgk2MTQ1NzU4MTQaAmVuIAEaBgiA_LyaBg'
          }
        });
        if (watchRes.ok) {
          const watchHtml = await watchRes.text();
          if (checkLiveStatus(watchHtml)) {
            isLive = true;
            title = extractTitle(watchHtml);
          }
        }
      } catch (wErr) {
        console.error('Watch check error:', wErr);
      }
    }

    res.status(200).json({
      isLive: !!(isLive && videoId),
      videoId: (isLive && videoId) ? videoId : null,
      channelId: OFFICIAL_CHURCH_CHANNEL_ID,
      title: title,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Check Live Error:', error);
    res.status(200).json({
      isLive: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
