export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  // Cache for 30 seconds
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const channelId = req.query.channelId || 'UCLEhdhZFRuxMXHL3pDpg65g';

  try {
    const ytRes = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
      }
    });

    const html = await ytRes.text();

    // YouTube indicators for an ongoing live broadcast
    const isLive = html.includes('"status":"LIVE"') ||
                   html.includes('"isLive":true') ||
                   html.includes('"isLiveBroadcast":true') ||
                   (html.includes('"label":"LIVE"') && !html.includes('LIVE_STREAM_OFFLINE'));

    let videoId = null;
    if (ytRes.url && ytRes.url.includes('watch?v=')) {
      const vMatch = ytRes.url.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (vMatch) videoId = vMatch[1];
    }
    if (!videoId) {
      const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match) videoId = match[1];
    }

    let title = '';
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleMatch) {
      title = titleMatch[1].replace(' - YouTube', '').trim();
    }

    res.status(200).json({
      isLive: !!isLive,
      videoId: videoId || null,
      title: title || 'البث المباشر - كنيسة العذراء مريم بمحرم بك',
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
