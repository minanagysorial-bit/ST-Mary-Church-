async function testSync() {
  const channelId = 'UCLEhdhZFRuxMXHL3pDpg65g';
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
  const xml = await res.text();
  
  const entries = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entryXml = match[1];
    const videoIdMatch = entryXml.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
    const titleMatch = entryXml.match(/<title>(.*?)<\/title>/);
    const publishedMatch = entryXml.match(/<published>(.*?)<\/published>/);
    
    if (videoIdMatch && titleMatch) {
      entries.push({
        videoId: videoIdMatch[1],
        title: titleMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
        published: publishedMatch ? publishedMatch[1] : new Date().toISOString()
      });
    }
  }
  console.log('Found total entries in YouTube RSS:', entries.length);
  console.log('Sample entries:', entries.slice(0, 5));
}
testSync();
