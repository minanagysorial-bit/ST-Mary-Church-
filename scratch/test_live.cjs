async function checkYouTubeLive(channelId) {
  try {
    const res = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
      }
    });
    const html = await res.text();
    
    // YouTube indicators for an ongoing active live stream
    const isLive = html.includes('"status":"LIVE"') ||
                   html.includes('"isLive":true') ||
                   html.includes('"isLiveBroadcast":true') ||
                   (html.includes('"label":"LIVE"') && !html.includes('LIVE_STREAM_OFFLINE'));

    // Extract videoId if redirected to /watch?v=...
    let videoId = null;
    if (res.url && res.url.includes('watch?v=')) {
      const vMatch = res.url.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (vMatch) videoId = vMatch[1];
    }
    if (!videoId) {
      const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
      if (match) videoId = match[1];
    }

    // Extract title
    let title = '';
    const titleMatch = html.match(/<title>(.*?)<\/title>/);
    if (titleMatch) {
      title = titleMatch[1].replace(' - YouTube', '').trim();
    }

    console.log('Result:', {
      isLive,
      videoId,
      title,
      finalUrl: res.url,
      hasOfflineTag: html.includes('LIVE_STREAM_OFFLINE')
    });
  } catch (err) {
    console.error('Error checking YouTube live:', err);
  }
}

checkYouTubeLive('UCLEhdhZFRuxMXHL3pDpg65g');
