const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://pcyektzremkilvpfqtll.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU');

async function runSync() {
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
    const descMatch = entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/);

    if (videoIdMatch && titleMatch) {
      const videoId = videoIdMatch[1];
      const rawTitle = titleMatch[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
      const published = publishedMatch ? publishedMatch[1].split('T')[0] : new Date().toISOString().split('T')[0];
      const description = descMatch ? descMatch[1].trim() : 'عظة وكلمة روحية من كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية.';

      let topic = 'تعليم وعظة';
      if (rawTitle.includes('عشية') || rawTitle.includes('تسبحة')) topic = 'عشيات وتسابيح';
      else if (rawTitle.includes('قداس')) topic = 'قداسات إلهية';
      else if (rawTitle.includes('نهضة') || rawTitle.includes('صوم')) topic = 'نهضات ومناسبات';
      else if (rawTitle.includes('شباب')) topic = 'اجتماعات الشباب';
      else if (rawTitle.includes('دراسة') || rawTitle.includes('تفسير')) topic = 'كتاب مقدس';

      entries.push({
        title: rawTitle,
        speaker: 'آباء الكنيسة',
        topic,
        sermon_date: published,
        duration_minutes: 45,
        youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
        audio_url: null,
        description,
        featured: false,
        play_count: 0
      });
    }
  }

  const { data: existingSermons } = await supabase.from('sermons').select('youtube_url');
  const existingUrls = new Set((existingSermons || []).map(s => s.youtube_url).filter(Boolean));

  const newSermons = entries.filter(item => !existingUrls.has(item.youtube_url));
  console.log('New sermons to insert:', newSermons.length);

  if (newSermons.length > 0) {
    const { data, error } = await supabase.from('sermons').insert(newSermons);
    console.log('Insert result:', { error });
  }

  const { data: allSermons } = await supabase.from('sermons').select('id, title, sermon_date').order('sermon_date', { ascending: false });
  console.log('Total sermons now in DB:', allSermons?.length);
  console.log('Latest 5 sermons:');
  allSermons?.slice(0, 5).forEach((s, idx) => console.log(`${idx + 1}. [${s.sermon_date}] ${s.title}`));
}
runSync();
