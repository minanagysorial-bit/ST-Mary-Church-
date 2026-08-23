async function testServerlessCheck() {
  const channelId = 'UCLEhdhZFRuxMXHL3pDpg65g';

  // 1. Fetch RSS feed
  const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  const rssXml = await rssRes.text();
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  const match = entryRegex.exec(rssXml);

  let latestVideoId = null;
  let latestTitle = '';
  let isLive = false;

  if (match) {
    const vIdMatch = match[1].match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const titleMatch = match[1].match(/<title>(.*?)<\/title>/);
    if (vIdMatch) latestVideoId = vIdMatch[1];
    if (titleMatch) latestTitle = titleMatch[1];
  }

  console.log('Latest Video from RSS:', latestVideoId, latestTitle);

  // 2. Check Channel Live URL with YouTube bypass cookies
  try {
    const channelLiveRes = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8',
        'Cookie': 'CONSENT=YES+cb.20210720-07-p0.en+FX+410; SOCS=CAESEwgDEgk2MTQ1NzU4MTQaAmVuIAEaBgiA_LyaBg'
      }
    });
    const channelHtml = await channelLiveRes.text();
    
    console.log('Channel HTML length:', channelHtml.length);
    console.log('Channel HTML contains isLive:', channelHtml.includes('"isLive":true'));
    console.log('Channel HTML contains isLiveBroadcast:', channelHtml.includes('"isLiveBroadcast":true'));

    if (channelHtml.includes('"isLive":true') || channelHtml.includes('"isLiveBroadcast":true') || channelHtml.includes('BADGE_STYLE_TYPE_LIVE_NOW')) {
      isLive = true;
      const canonicalMatch = channelHtml.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
      if (canonicalMatch) latestVideoId = canonicalMatch[1];
    }
  } catch (err) {
    console.error('Channel live check error:', err);
  }

  // 3. If still unsure, check watch page of latest video
  if (!isLive && latestVideoId) {
    try {
      const watchRes = await fetch(`https://www.youtube.com/watch?v=${latestVideoId}`, {
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
    } catch (err) {
      console.error('Watch check error:', err);
    }
  }

  console.log('\n=== FINAL SERVERLESS RESULT ===');
  console.log('isLive:', isLive);
  console.log('videoId:', latestVideoId);
  console.log('title:', latestTitle);
}

testServerlessCheck();
