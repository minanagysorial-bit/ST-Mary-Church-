async function searchInHTML() {
  const channelId = 'UCoMdktPbSTixAyNGwb-UYkA'; // Sky News Live
  const res = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': 'SOCS=CAESEwgDEgk1ODE2MDU3NzMaAmVuIAEaBgiA_LyaBg;'
    }
  });
  const html = await res.text();
  
  // Search for JSON objects
  const isLiveMatches = [...html.matchAll(/"isLive":\s*(true|false)/g)];
  console.log('isLive matches:', isLiveMatches.map(m => m[0]));

  const styleLiveMatches = [...html.matchAll(/"style":\s*"LIVE"/g)];
  console.log('style LIVE matches count:', styleLiveMatches.length);

  const videoIdMatches = [...html.matchAll(/"videoId":\s*"([a-zA-Z0-9_-]{11})"/g)];
  console.log('Unique videoIds found:', [...new Set(videoIdMatches.map(m => m[1]))].slice(0, 5));

  // Check ytInitialData
  const initDataMatch = html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/);
  if (initDataMatch) {
    console.log('ytInitialData found!');
  } else {
    console.log('ytInitialData NOT matched by regex');
  }
}
searchInHTML();
