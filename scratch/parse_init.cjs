async function parseInitData() {
  const channelId = 'UCoMdktPbSTixAyNGwb-UYkA'; // Sky News Live
  const res = await fetch(`https://www.youtube.com/channel/${channelId}/live`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cookie': 'SOCS=CAESEwgDEgk1ODE2MDU3NzMaAmVuIAEaBgiA_LyaBg;'
    }
  });
  const html = await res.text();
  const initDataMatch = html.match(/var ytInitialData\s*=\s*({.+?});<\/script>/);
  if (initDataMatch) {
    const json = JSON.parse(initDataMatch[1]);
    const str = JSON.stringify(json);
    console.log('Has LIVE badge?:', str.includes('"BADGE_STYLE_TYPE_LIVE_NOW"') || str.includes('"LIVE"'));
    
    // Check for videoId in json
    const matches = str.match(/"videoId":"([a-zA-Z0-9_-]{11})"/g);
    console.log('VideoIds in ytInitialData:', matches ? matches.slice(0, 5) : 'none');

    // Check if there are badges
    const badges = str.match(/"label":"LIVE"/g);
    console.log('Live badges found:', badges ? badges.length : 0);
  }
}
parseInitData();
