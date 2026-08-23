export default async function handler(req, res) {
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

  const OFFICIAL_CHURCH_CHANNEL_ID = 'UCLEhdhZFRuxMXHL3pDpg65g';
  const channelId = req.query.channelId || OFFICIAL_CHURCH_CHANNEL_ID;

  if (channelId !== OFFICIAL_CHURCH_CHANNEL_ID) {
    res.status(200).json({
      isLive: false,
      message: 'Channel ID must match official church channel',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    const ytRes = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
      }
    });

    const html = await ytRes.text();

    // 1. Strict Channel Ownership Verification
    const belongsToOurChannel = html.includes(channelId) || 
                               html.includes(`"channelId":"${channelId}"`) ||
                               html.includes(`"externalChannelId":"${channelId}"`) ||
                               (ytRes.url && ytRes.url.includes(channelId));

    if (!belongsToOurChannel) {
      res.status(200).json({
        isLive: false,
        message: 'Stream does not belong to church channel',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 2. Extract Canonical Video ID of OUR channel
    let videoId = null;
    if (ytRes.url && ytRes.url.includes('watch?v=')) {
      const vMatch = ytRes.url.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (vMatch) videoId = vMatch[1];
    }
    if (!videoId) {
      const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
      if (canonicalMatch) videoId = canonicalMatch[1];
    }
    if (!videoId) {
      const ogMatch = html.match(/<meta property="og:url" content="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
      if (ogMatch) videoId = ogMatch[1];
    }

    // 3. Strict Live Broadcast Verification
    // Check if offline
    const isOffline = html.includes('"status":"LIVE_STREAM_OFFLINE"') || 
                      html.includes('LIVE_STREAM_OFFLINE') ||
                      html.includes('"playabilityStatus":{"status":"LIVE_STREAM_OFFLINE"');

    const isLive = (html.includes('"isLive":true') ||
                   html.includes('"isLiveBroadcast":true') || 
                   html.includes('"status":"LIVE"') ||
                   html.includes('BADGE_STYLE_TYPE_LIVE_NOW') ||
                   html.includes('"label":"LIVE"')) && !isOffline;

    let title = 'البث المباشر - كنيسة السيدة العذراء مريم بمحرم بك';
    const titleMatch = html.match(/<meta name="title" content="([^"]+)">/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(' - YouTube', '').trim();
    }

    const finalIsLive = !!(belongsToOurChannel && isLive && videoId);

    res.status(200).json({
      isLive: finalIsLive,
      videoId: finalIsLive ? videoId : null,
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
