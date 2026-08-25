import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pcyektzremkilvpfqtll.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBjeWVrdHpyZW1raWx2cGZxdGxsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTIxNDAsImV4cCI6MjEwMjc2ODE0MH0.R0v34tg13PbnBrIw3J8qutlNi6XHI6yLmNyckNprtWU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function parseXmlEntries(xml) {
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
      const rawTitle = titleMatch[1]
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .trim();
      const published = publishedMatch ? publishedMatch[1].split('T')[0] : new Date().toISOString().split('T')[0];
      const description = descMatch ? descMatch[1].trim() : 'عظة وكلمة روحية من كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية.';

      let topic = 'تعليم وعظة';
      if (rawTitle.includes('عشية') || rawTitle.includes('تسبحة')) topic = 'عشيات وتسابيح';
      else if (rawTitle.includes('قداس')) topic = 'قداسات إلهية';
      else if (rawTitle.includes('نهضة') || rawTitle.includes('صوم')) topic = 'نهضات ومناسبات';
      else if (rawTitle.includes('شباب') || rawTitle.includes('شبان')) topic = 'اجتماعات الشباب';
      else if (rawTitle.includes('دراسة') || rawTitle.includes('تفسير')) topic = 'كتاب مقدس';

      let speaker = 'آباء الكنيسة';
      if (rawTitle.includes('أبونا') || rawTitle.includes('القمص') || rawTitle.includes('القس')) {
        const speakerMatch = rawTitle.match(/(أبونا\s+[\u0621-\u064A]+|القمص\s+[\u0621-\u064A]+|القس\s+[\u0621-\u064A]+)/);
        if (speakerMatch) speaker = speakerMatch[1];
      }

      entries.push({
        id: `yt_${videoId}`,
        videoId,
        title: rawTitle,
        sermon_date: published,
        description,
        topic,
        youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
        speaker,
        duration_minutes: 45,
        audio_url: null,
        featured: false,
        play_count: 0
      });
    }
  }
  return entries;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const channelId = req.query.channelId || 'UCLEhdhZFRuxMXHL3pDpg65g';
  const playlistId = req.query.playlistId;

  try {
    const urlsToFetch = [];
    if (playlistId) {
      urlsToFetch.push(`https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`);
    } else {
      urlsToFetch.push(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
      // Also fetch uploads playlist (UU...)
      const uploadsPlaylist = `UU${channelId.replace(/^UC/, '')}`;
      urlsToFetch.push(`https://www.youtube.com/feeds/videos.xml?playlist_id=${uploadsPlaylist}`);
    }

    const fetchPromises = urlsToFetch.map(url =>
      fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
      })
        .then(r => r.text())
        .then(parseXmlEntries)
        .catch(e => {
          console.warn('Fetch XML error for url', url, e.message);
          return [];
        })
    );

    const results = await Promise.all(fetchPromises);
    const combined = results.flat();

    // Deduplicate by videoId
    const seen = new Set();
    const uniqueEntries = [];
    for (const item of combined) {
      if (!seen.has(item.videoId)) {
        seen.add(item.videoId);
        uniqueEntries.push(item);
      }
    }

    // Sort descending by date
    uniqueEntries.sort((a, b) => new Date(b.sermon_date).getTime() - new Date(a.sermon_date).getTime());

    // Try inserting into Supabase
    let newSermonsCount = 0;
    try {
      const { data: existingSermons } = await supabase.from('sermons').select('youtube_url, id');
      const existingUrls = new Set((existingSermons || []).map(s => s.youtube_url).filter(Boolean));

      const toInsert = uniqueEntries
        .filter(item => !existingUrls.has(item.youtube_url))
        .map(item => ({
          title: item.title,
          speaker: item.speaker,
          topic: item.topic,
          sermon_date: item.sermon_date,
          duration_minutes: item.duration_minutes,
          youtube_url: item.youtube_url,
          audio_url: null,
          description: item.description,
          featured: false,
          play_count: 0,
          created_by: null
        }));

      if (toInsert.length > 0) {
        const { error: insertError } = await supabase.from('sermons').insert(toInsert);
        if (!insertError) {
          newSermonsCount = toInsert.length;
        } else {
          console.warn('Supabase sermon insert error (RLS):', insertError.message);
        }
      }
    } catch (dbErr) {
      console.warn('DB Sync warning:', dbErr.message);
    }

    res.status(200).json({
      success: true,
      totalFoundInYouTube: uniqueEntries.length,
      newlySyncedCount: newSermonsCount,
      sermons: uniqueEntries,
      latestSermon: uniqueEntries[0]
    });
  } catch (err) {
    console.error('Sync Sermons Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
