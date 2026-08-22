async function testFeed() {
  const channelId = 'UCLEhdhZFRuxMXHL3pDpg65g'; // Church channel
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  const xml = await res.text();
  console.log('XML response (first 500 chars):', xml.substring(0, 500));
}
testFeed();
