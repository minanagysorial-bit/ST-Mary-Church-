async function testWithChannels() {
  const channels = [
    { name: 'كنيسة العذراء محرم بك (Offline حالياً)', id: 'UCLEhdhZFRuxMXHL3pDpg65g' },
    { name: 'قناة أغابي Aghapy TV (Live)', id: 'UCzV-G_mHwT_x44Q4Y5aWjAw' },
    { name: 'قناة ME SAT Coptic (Live)', id: 'UCc7N09r1hW2HjDzgq2Jj0rA' }
  ];

  for (const ch of channels) {
    try {
      const res = await fetch(`https://www.youtube.com/channel/${ch.id}/live`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
        }
      });
      const html = await res.text();
      const isLive = html.includes('"status":"LIVE"') ||
                     html.includes('"isLive":true') ||
                     html.includes('"isLiveBroadcast":true') ||
                     (html.includes('"label":"LIVE"') && !html.includes('LIVE_STREAM_OFFLINE'));

      let videoId = null;
      if (res.url && res.url.includes('watch?v=')) {
        const vMatch = res.url.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
        if (vMatch) videoId = vMatch[1];
      }
      if (!videoId) {
        const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
        if (match) videoId = match[1];
      }

      console.log('--------------------------------------------------');
      console.log('Channel:', ch.name);
      console.log('Detected as Live?:', isLive);
      console.log('Video ID Extracted:', videoId);
      console.log('Embed URL:', videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : 'None (Inactive Card shown)');
    } catch (e) {
      console.error('Error with ' + ch.name, e);
    }
  }
}
testWithChannels();
