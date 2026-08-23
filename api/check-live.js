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

  // Official Church YouTube Channel ID
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

  let isLive = false;
  let videoId = null;
  let title = 'البث المباشر - كنيسة السيدة العذراء مريم بمحرم بك';

  try {
    // 1. Fetch official RSS feed to get latest uploaded/live video
    try {
      const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
      if (rssRes.ok) {
        const rssXml = await rssRes.text();
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        const match = entryRegex.exec(rssXml);
        if (match) {
          const vIdMatch = match[1].match(/<yt:videoId>(.*?)<\/yt:videoId>/);
          const titleMatch = match[1].match(/<title>(.*?)<\/title>/);
          if (vIdMatch) videoId = vIdMatch[1];
          if (titleMatch) title = titleMatch[1];
        }
      }
    } catch (rssErr) {
      console.error('RSS Fetch error:', rssErr);
    }

    // 2. Fetch Channel Live endpoint with YouTube Consent Bypass Cookie
    const channelRes = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Cookie': 'CONSENT=YES+cb.20210720-07-p0.en+FX+410; SOCS=CAESEwgDEgk2MTQ1NzU4MTQaAmVuIAEaBgiA_LyaBg'
      }
    });

    const html = await channelRes.text();

    const belongsToOurChannel = html.includes(channelId) || 
                               html.includes(`"channelId":"${channelId}"`) ||
                               html.includes(`"externalChannelId":"${channelId}"`) ||
                               (channelRes.url && channelRes.url.includes(channelId));

    if (belongsToOurChannel) {
      const isOffline = html.includes('"status":"LIVE_STREAM_OFFLINE"') || 
                        html.includes('LIVE_STREAM_OFFLINE') ||
                        html.includes('"playabilityStatus":{"status":"LIVE_STREAM_OFFLINE"');

      const liveDetected = (html.includes('"isLive":true') ||
                            html.includes('"isLiveBroadcast":true') || 
                            html.includes('"status":"LIVE"') ||
                            html.includes('BADGE_STYLE_TYPE_LIVE_NOW') ||
                            html.includes('"label":"LIVE"')) && !isOffline;

      if (liveDetected) {
        isLive = true;
        const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
        if (canonicalMatch) {
          videoId = canonicalMatch[1];
        }
        const titleMatch = html.match(/<meta name="title" content="([^"]+)">/);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].replace(' - YouTube', '').trim();
        }
      }
    }

    // 3. If not detected via channel page but we have latest video ID from RSS, check watch page
    if (!isLive && videoId) {
      try {
        const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Cookie': 'CONSENT=YES+cb.20210720-07-p0.en+FX+410; SOCS=CAESEwgDEgk2MTQ1NzU4MTQaAmVuIAEaBgiA_LyaBg'
          }
        });
        const watchHtml = await watchRes.text();
        const isOffline = watchHtml.includes('"status":"LIVE_STREAM_OFFLINE"') || watchHtml.includes('LIVE_STREAM_OFFLINE');
        if ((watchHtml.includes('"isLive":true') || watchHtml.includes('"isLiveBroadcast":true')) && !isOffline) {
          isLive = true;
        }
      } catch (watchErr) {
        console.error('Watch page error:', watchErr);
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
