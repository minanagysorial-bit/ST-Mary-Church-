async function testAllApproaches() {
  const channelId = 'UCLEhdhZFRuxMXHL3pDpg65g';

  // Approach 1: RSS Feed (Never blocked by YouTube, no consent page, 100% reliable)
  console.log('\n--- Approach 1: RSS Feed ---');
  try {
    const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const rssXml = await rssRes.text();
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    const items = [];
    while ((match = entryRegex.exec(rssXml)) !== null) {
      const vId = match[1].match(/<yt:videoId>(.*?)<\/yt:videoId>/);
      const title = match[1].match(/<title>(.*?)<\/title>/);
      const pub = match[1].match(/<published>(.*?)<\/published>/);
      if (vId && title) {
        items.push({ videoId: vId[1], title: title[1], published: pub ? pub[1] : null });
      }
    }
    console.log(`Found ${items.length} items in RSS.`);
    console.log('Top 3 items:', items.slice(0, 3));

    // For the most recent item, check if it's currently live
    if (items.length > 0) {
      const latest = items[0];
      console.log('Checking latest video if live:', latest.videoId);
      
      // Check oEmbed
      const oEmbedRes = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${latest.videoId}&format=json`);
      console.log('oEmbed status:', oEmbedRes.status);

      // Check watch page
      const watchRes = await fetch(`https://www.youtube.com/watch?v=${latest.videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      const watchHtml = await watchRes.text();
      console.log('Watch HTML has isLive:', watchHtml.includes('"isLive":true') || watchHtml.includes('"isLiveBroadcast":true'));
      console.log('Watch HTML has startDate:', watchHtml.match(/"startDate":"([^"]+)"/)?.[1]);
      console.log('Watch HTML has endDate:', watchHtml.match(/"endDate":"([^"]+)"/)?.[1]);
      console.log('Watch HTML isLiveNow:', watchHtml.includes('"isLiveNow":true') || (watchHtml.includes('"isLive":true') && !watchHtml.includes('"isLive":false')));
    }
  } catch (err) {
    console.error('Approach 1 error:', err);
  }

  // Approach 2: Live Embed Direct Check
  console.log('\n--- Approach 2: Live Stream Direct Embed ---');
  const embedUrl = `https://www.youtube.com/embed/live_stream?channel=${channelId}`;
  console.log('Embed URL:', embedUrl);
}

testAllApproaches();
