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

  // Official Church YouTube Channel ID (tibarthenos Moharam Bek)
  const OFFICIAL_CHURCH_CHANNEL_ID = 'UCLEhdhZFRuxMXHL3pDpg65g';

  let isLive = false;
  let videoId = null;
  let title = 'البث المباشر - كنيسة السيدة العذراء مريم بمحرم بك';

  try {
    const liveUrl = `https://www.youtube.com/channel/${OFFICIAL_CHURCH_CHANNEL_ID}/live`;
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

      // Ensure the content strictly belongs to our official church channel
      const belongsToOurChurch = html.includes(OFFICIAL_CHURCH_CHANNEL_ID) || 
                                 html.includes('tibarthenos') || 
                                 html.includes('محرم بك') ||
                                 html.includes('العذراء');

      if (belongsToOurChurch) {
        const isOffline = html.includes('"status":"LIVE_STREAM_OFFLINE"') || 
                          html.includes('LIVE_STREAM_OFFLINE') ||
                          html.includes('"playabilityStatus":{"status":"LIVE_STREAM_OFFLINE"');

        const liveDetected = (
          html.includes('"isLive":true') ||
          html.includes('"isLiveBroadcast":true') || 
          html.includes('"status":"LIVE"') ||
          html.includes('BADGE_STYLE_TYPE_LIVE_NOW') ||
          html.includes('"label":"LIVE"')
        ) && !isOffline;

        const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
        const detectedId = canonicalMatch ? canonicalMatch[1] : (html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/) || [])[1];

        const titleMatch = html.match(/<meta property="og:title" content="([^"]+)">/) || html.match(/<meta name="title" content="([^"]+)">/);
        const detectedTitle = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : title;

        if (detectedId && liveDetected) {
          isLive = true;
          videoId = detectedId;
          title = detectedTitle;
        }
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
