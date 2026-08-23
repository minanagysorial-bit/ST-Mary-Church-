async function debugCurrentLive() {
  const channelId = 'UCLEhdhZFRuxMXHL3pDpg65g';
  const url = `https://www.youtube.com/channel/${channelId}/live`;
  
  console.log('Fetching:', url);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
    }
  });

  const text = await res.text();
  console.log('Final URL:', res.url);
  console.log('Text length:', text.length);

  // Check canonical link
  const canonicalMatch = text.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
  console.log('canonical match:', canonicalMatch ? canonicalMatch[1] : null);

  const ogMatch = text.match(/<meta property="og:url" content="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
  console.log('og match:', ogMatch ? ogMatch[1] : null);

  const titleMatch = text.match(/<meta name="title" content="([^"]+)">/);
  console.log('title:', titleMatch ? titleMatch[1] : null);

  // Check playabilityStatus and isLive
  console.log('contains isLiveBroadcast:', text.includes('"isLiveBroadcast":true'));
  console.log('contains status LIVE:', text.includes('"status":"LIVE"'));
  console.log('contains isLive:', text.includes('"isLive":true'));
  console.log('contains LIVE_STREAM_OFFLINE:', text.includes('LIVE_STREAM_OFFLINE'));

  // Also check YouTube API key if available
  const apiKey = 'AIzaSyDLFAXH6olOSVn5itlz3WSaTs6wVdNQuBQ';
  try {
    const apiRes = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${apiKey}`);
    const apiJson = await apiRes.json();
    console.log('YouTube API result:', JSON.stringify(apiJson, null, 2));
  } catch (err) {
    console.log('YouTube API error:', err);
  }

  // Also check RSS feed
  const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  const rssText = await rssRes.text();
  console.log('\n--- RSS LATEST VIDEOS ---');
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(rssText)) !== null) {
    const vId = match[1].match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const title = match[1].match(/<title>(.*?)<\/title>/);
    console.log('RSS Item:', vId ? vId[1] : '', title ? title[1] : '');
  }
}

debugCurrentLive();
