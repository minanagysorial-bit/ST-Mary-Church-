async function testLiveScenario(channelId) {
  console.log(`\n=== Testing Channel: ${channelId} ===`);
  const OFFICIAL_CHURCH_CHANNEL_ID = 'UCLEhdhZFRuxMXHL3pDpg65g';

  if (channelId !== OFFICIAL_CHURCH_CHANNEL_ID) {
    console.log('Result: REJECTED (Not church channel)');
    return { isLive: false, reason: 'Channel mismatch' };
  }

  try {
    const ytRes = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en-US;q=0.9,en;q=0.8'
      }
    });

    const html = await ytRes.text();

    const belongsToOurChannel = html.includes(channelId) || 
                               html.includes(`"channelId":"${channelId}"`) ||
                               html.includes(`"externalChannelId":"${channelId}"`) ||
                               (ytRes.url && ytRes.url.includes(channelId));

    console.log('Belongs to our channel?', belongsToOurChannel);

    const isOffline = html.includes('"status":"LIVE_STREAM_OFFLINE"') ||
                      html.includes('LIVE_STREAM_OFFLINE') ||
                      html.includes('"playabilityStatus":{"status":"LIVE_STREAM_OFFLINE"');

    const isLive = (html.includes('"isLiveBroadcast":true') || 
                   html.includes('"status":"LIVE"') ||
                   html.includes('"isLive":true')) && !isOffline;

    console.log('Is Offline flag present?', isOffline);
    console.log('Is Live flag detected?', isLive);

    let videoId = null;
    if (ytRes.url && ytRes.url.includes('watch?v=')) {
      const vMatch = ytRes.url.match(/watch\?v=([a-zA-Z0-9_-]{11})/);
      if (vMatch) videoId = vMatch[1];
    }
    if (!videoId) {
      const canonicalMatch = html.match(/<link rel="canonical" href="https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})">/);
      if (canonicalMatch) videoId = canonicalMatch[1];
    }

    console.log('Extracted Video ID:', videoId);
    console.log('Final Live Decision:', belongsToOurChannel && isLive && !!videoId);

    return {
      isLive: !!(belongsToOurChannel && isLive && videoId),
      videoId: (belongsToOurChannel && isLive && videoId) ? videoId : null
    };
  } catch (e) {
    console.error('Error:', e);
    return { isLive: false, error: e.message };
  }
}

async function run() {
  // Test 1: Our Church channel
  await testLiveScenario('UCLEhdhZFRuxMXHL3pDpg65g');

  // Test 2: Random other channel (e.g. Al Jazeera / BBC / random)
  await testLiveScenario('UC4R8DWoMoI7CAwX8_BQxIBg');
}

run();
