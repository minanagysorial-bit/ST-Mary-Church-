async function testLiveNow() {
  const channelId = 'UCoMdktPbSTixAyNGwb-UYkA'; // Sky News Live
  const res = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });
  const html = await res.text();
  console.log('Final URL:', res.url);
  console.log('Includes status:LIVE?', html.includes('"status":"LIVE"'));
  console.log('Includes isLive:true?', html.includes('"isLive":true'));
  console.log('Includes isLiveBroadcast:true?', html.includes('"isLiveBroadcast":true'));
  console.log('Includes LIVE_STREAM_OFFLINE?', html.includes('LIVE_STREAM_OFFLINE'));
  console.log('Includes liveStreamabilityRenderer?', html.includes('liveStreamabilityRenderer'));
  console.log('Includes playabilityStatus:OK?', html.includes('"playabilityStatus":{"status":"OK"'));
  
  const match = html.match(/"videoId":"([a-zA-Z0-9_-]{11})"/);
  console.log('VideoId match:', match ? match[1] : null);
}
testLiveNow();
