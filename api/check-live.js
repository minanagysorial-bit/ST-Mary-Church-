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
    // 1. Query Church Channel's Streams Tab directly
    const streamsUrl = `https://www.youtube.com/channel/${OFFICIAL_CHURCH_CHANNEL_ID}/streams`;
    const streamsRes = await fetch(streamsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Cookie': 'CONSENT=YES+cb.20210720-07-p0.en+FX+410; SOCS=CAESEwgDEgk2MTQ1NzU4MTQaAmVuIAEaBgiA_LyaBg'
      }
    });

    if (streamsRes.ok) {
      const html = await streamsRes.text();
      const vids = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)].map(m => m[1]);
      const uniqueVids = [...new Set(vids)];

      if (uniqueVids.length > 0) {
        // Inspect the latest stream on the channel (first video)
        const latestVid = uniqueVids[0];
        const wRes = await fetch(`https://www.youtube.com/watch?v=${latestVid}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Cookie': 'CONSENT=YES+cb.20210720-07-p0.en+FX+410; SOCS=CAESEwgDEgk2MTQ1NzU4MTQaAmVuIAEaBgiA_LyaBg'
          }
        });

        if (wRes.ok) {
          const wHtml = await wRes.text();
          const channelMatch = (wHtml.match(/"channelId":"([^"]+)"/) || [])[1];
          const isOurChannel = channelMatch === OFFICIAL_CHURCH_CHANNEL_ID || wHtml.includes('tibarthenos');

          if (isOurChannel) {
            const isOffline = wHtml.includes('"status":"LIVE_STREAM_OFFLINE"') || wHtml.includes('LIVE_STREAM_OFFLINE');
            const liveDetected = (
              wHtml.includes('"isLive":true') || 
              wHtml.includes('"isLiveBroadcast":true') ||
              wHtml.includes('watching now') ||
              wHtml.includes('يشاهد الآن')
            ) && !isOffline;

            const titleMatch = wHtml.match(/<meta property="og:title" content="([^"]+)">/) || wHtml.match(/<meta name="title" content="([^"]+)">/);
            const detectedTitle = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : title;

            if (liveDetected) {
              isLive = true;
              videoId = latestVid;
              title = detectedTitle;
            }
          }
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
