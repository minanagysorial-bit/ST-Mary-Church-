import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pcyektzremkilvpfqtll.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  // Cache for 60 seconds
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const channelId = req.query.channelId || 'UCLEhdhZFRuxMXHL3pDpg65g';

  try {
    const rssRes = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    });

    const xml = await rssRes.text();
    const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
    let match;
    const entries = [];

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

        // Detect topic / department automatically from title if possible
        let topic = 'تعليم وعظة';
        if (rawTitle.includes('عشية') || rawTitle.includes('تسبحة')) topic = 'عشيات وتسابيح';
        else if (rawTitle.includes('قداس')) topic = 'قداسات إلهية';
        else if (rawTitle.includes('نهضة') || rawTitle.includes('صوم')) topic = 'نهضات ومناسبات';
        else if (rawTitle.includes('شباب')) topic = 'اجتماعات الشباب';
        else if (rawTitle.includes('دراسة') || rawTitle.includes('تفسير')) topic = 'كتاب مقدس';

        entries.push({
          videoId,
          title: rawTitle,
          sermon_date: published,
          description,
          topic,
          youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
          speaker: 'آباء الكنيسة'
        });
      }
    }

    if (entries.length === 0) {
      res.status(200).json({ success: true, count: 0, message: 'No entries found in RSS' });
      return;
    }

    // Check existing sermons in DB to avoid duplicating or overwriting custom speaker/topic edits
    const { data: existingSermons } = await supabase.from('sermons').select('youtube_url, id');
    const existingUrls = new Set((existingSermons || []).map(s => s.youtube_url).filter(Boolean));

    const newSermonsToInsert = [];
    for (const item of entries) {
      if (!existingUrls.has(item.youtube_url)) {
        newSermonsToInsert.push({
          title: item.title,
          speaker: item.speaker,
          topic: item.topic,
          sermon_date: item.sermon_date,
          duration_minutes: 45,
          youtube_url: item.youtube_url,
          audio_url: null,
          description: item.description,
          featured: false,
          play_count: 0,
          created_by: null
        });
      }
    }

    if (newSermonsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('sermons')
        .insert(newSermonsToInsert);

      if (insertError) {
        console.error('Insert error in sync-sermons:', insertError);
      }
    }

    res.status(200).json({
      success: true,
      totalFoundInYouTube: entries.length,
      newlySyncedCount: newSermonsToInsert.length,
      latestSermon: entries[0]
    });
  } catch (err) {
    console.error('Sync Sermons Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
