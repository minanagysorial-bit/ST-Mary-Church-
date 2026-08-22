async function inspectYouTube() {
  const channelId = 'UCoMdktPbSTixAyNGwb-UYkA'; // Sky News Live
  const res = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': 'SOCS=CAESEwgDEgk1ODE2MDU3NzMaAmVuIAEaBgiA_LyaBg;' // Bypass Google EU consent wall
    }
  });
  const html = await res.text();
  console.log('HTML length:', html.length);
  
  // Look for ytInitialPlayerResponse or ytInitialData
  const playerMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});<\/script>/);
  if (playerMatch) {
    try {
      const data = JSON.parse(playerMatch[1]);
      console.log('VideoDetails:', {
        videoId: data.videoDetails?.videoId,
        title: data.videoDetails?.title,
        isLive: data.videoDetails?.isLive,
        isLiveContent: data.videoDetails?.isLiveContent,
        isLiveDvrEnabled: data.videoDetails?.isLiveDvrEnabled
      });
    } catch(e) {
      console.log('JSON parse error on playerResponse');
    }
  } else {
    console.log('No ytInitialPlayerResponse found');
  }

  // Check canonical link
  const canonMatch = html.match(/<link rel="canonical" href="([^"]+)">/);
  console.log('Canonical link:', canonMatch ? canonMatch[1] : 'None');
}
inspectYouTube();
