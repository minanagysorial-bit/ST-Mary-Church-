async function test() {
  const channelId = 'UCLEhdhZFRuxMXHL3pDpg65g';
  const url = `https://www.youtube.com/channel/${channelId}/live`;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
      }
    });

    const finalUrl = res.url;
    const html = await res.text();

    console.log('Final redirected URL:', finalUrl);
    
    // Check if canonical url contains a video id
    const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
    const videoId = canonicalMatch ? canonicalMatch[1] : null;
    console.log('Canonical Video ID:', videoId);

    // Check if video actually belongs to our channel
    const belongsToChannel = html.includes(channelId) || html.includes('UC' + channelId.slice(2));
    console.log('Belongs to our channel?', belongsToChannel);

    // Check if video is ACTUALLY broadcasting live right now
    const isLive = html.includes('"isLiveBroadcast":true') || 
                   html.includes('"status":"LIVE"') ||
                   (html.includes('"isLive":true') && !html.includes('"isLive":false'));

    console.log('Is currently Live?', isLive);

    const titleMatch = html.match(/<meta name="title" content="([^"]+)">/);
    console.log('Title:', titleMatch ? titleMatch[1] : 'N/A');

  } catch (err) {
    console.error('Error:', err);
  }
}

test();
