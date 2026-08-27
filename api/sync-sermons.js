function extractVideosFromHtml(html) {
  const videoItems = [];
  const seen = new Set();

  try {
    const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/s) || html.match(/ytInitialData\s*=\s*(\{.*?\});/s);
    if (!match) return videoItems;

    const data = JSON.parse(match[1]);
    const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];

    for (const tab of tabs) {
      const contents = tab.tabRenderer?.content?.richGridRenderer?.contents || [];
      for (const item of contents) {
        const content = item.richItemRenderer?.content;
        if (!content) continue;

        let videoId = null;
        let title = '';
        let timeText = '';

        // Pattern A: Modern lockupViewModel
        if (content.lockupViewModel) {
          const lvm = content.lockupViewModel;
          const meta = lvm.metadata?.lockupMetadataViewModel;
          title = meta?.title?.content || '';

          const tapCommand = lvm.rendererContext?.commandContext?.onTap?.innertubeCommand;
          if (tapCommand?.watchEndpoint?.videoId) {
            videoId = tapCommand.watchEndpoint.videoId;
          } else {
            const thumbUrl = lvm.contentImage?.thumbnailViewModel?.image?.sources?.[0]?.url || '';
            const vidMatch = thumbUrl.match(/\/vi\/([a-zA-Z0-9_-]{11})\//);
            if (vidMatch) videoId = vidMatch[1];
          }

          const metaRows = meta?.metadata?.contentMetadataViewModel?.metadataRows || [];
          for (const row of metaRows) {
            for (const part of row.parts || []) {
              if (part.text?.content) {
                timeText += ' ' + part.text.content;
              }
            }
          }
        }

        // Pattern B: Legacy videoRenderer
        if (content.videoRenderer) {
          const vr = content.videoRenderer;
          videoId = vr.videoId;
          title = vr.title?.runs?.[0]?.text || vr.title?.simpleText || '';
          timeText = vr.publishedTimeText?.simpleText || '';
        }

        if (videoId && title && !seen.has(videoId)) {
          seen.add(videoId);

          // Infer topic
          let topic = 'تعليم وعظة';
          const cleanTitle = title.trim();
          if (cleanTitle.includes('عشية') || cleanTitle.includes('تسبحة') || cleanTitle.includes('تسابيح')) topic = 'عشيات وتسابيح';
          else if (cleanTitle.includes('قداس') || cleanTitle.includes('ذبيحة')) topic = 'قداسات إلهية';
          else if (cleanTitle.includes('نهضة') || cleanTitle.includes('صوم') || cleanTitle.includes('صعود') || cleanTitle.includes('عيد')) topic = 'نهضات ومناسبات';
          else if (cleanTitle.includes('شبان') || cleanTitle.includes('شباب') || cleanTitle.includes('شابات') || cleanTitle.includes('جامعيين')) topic = 'اجتماعات الشباب';
          else if (cleanTitle.includes('دراسة') || cleanTitle.includes('تفسير') || cleanTitle.includes('إنجيل') || cleanTitle.includes('مزمور') || cleanTitle.includes('كورنثوس')) topic = 'كتاب مقدس';
          else if (cleanTitle.includes('لحن') || cleanTitle.includes('ألحان') || cleanTitle.includes('طقس')) topic = 'ألحان وطقوس';

          // Infer speaker
          let speaker = 'آباء كنيسة العذراء محرم بك';
          const speakerMatch = cleanTitle.match(/(أبونا\s+[\u0621-\u064A]+|القمص\s+[\u0621-\u064A\s]+|القس\s+[\u0621-\u064A\s]+|الأنبا\s+[\u0621-\u064A]+)/);
          if (speakerMatch) {
            speaker = speakerMatch[1].trim();
          }

          // Extract date from title if present (e.g. 25/8/2026 or 23/8/2026 or 2015)
          let sermonDate = new Date().toISOString().split('T')[0];
          const dateMatch = cleanTitle.match(/(\d{1,2})[\/\-\s](\d{1,2})[\/\-\s](\d{4})/);
          if (dateMatch) {
            const day = dateMatch[1].padStart(2, '0');
            const month = dateMatch[2].padStart(2, '0');
            const year = dateMatch[3];
            sermonDate = `${year}-${month}-${day}`;
          } else if (cleanTitle.includes('2015')) {
            sermonDate = '2015-12-01';
          }

          videoItems.push({
            id: `yt_${videoId}`,
            videoId,
            title: cleanTitle,
            sermon_date: sermonDate,
            description: `عظة وكلمة روحية مباركة من كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية. ${timeText.trim()}`,
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
    }
  } catch (err) {
    console.warn('Error parsing YouTube HTML:', err.message);
  }

  return videoItems;
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

  try {
    const urls = [
      `https://www.youtube.com/channel/${channelId}/streams`,
      `https://www.youtube.com/channel/${channelId}/videos`
    ];

    const fetchPromises = urls.map(url =>
      fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept-Language': 'ar,en;q=0.9'
        }
      })
        .then(r => r.text())
        .then(extractVideosFromHtml)
        .catch(e => {
          console.warn('Fetch channel error:', url, e.message);
          return [];
        })
    );

    // Also fetch RSS feed as instant fallback
    const rssPromise = fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/xml'
      }
    })
      .then(r => r.text())
      .then(xml => {
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let match;
        const rssVideos = [];
        while ((match = entryRegex.exec(xml)) !== null) {
          const entry = match[1];
          const videoId = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1];
          const title = entry.match(/<title>(.*?)<\/title>/)?.[1];
          const published = entry.match(/<published>(.*?)<\/published>/)?.[1];
          if (videoId && title) {
            const cleanTitle = title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim();
            rssVideos.push({
              id: `yt_${videoId}`,
              videoId,
              title: cleanTitle,
              sermon_date: published ? published.split('T')[0] : new Date().toISOString().split('T')[0],
              description: 'عظة وكلمة روحية من كنيسة السيدة العذراء مريم بمحرم بك بالإسكندرية.',
              topic: cleanTitle.includes('قداس') ? 'قداسات إلهية' : cleanTitle.includes('عشية') ? 'عشيات وتسابيح' : 'تعليم وعظة',
              youtube_url: `https://www.youtube.com/watch?v=${videoId}`,
              speaker: 'آباء الكنيسة',
              duration_minutes: 45,
              audio_url: null,
              featured: false,
              play_count: 0
            });
          }
        }
        return rssVideos;
      })
      .catch(() => []);

    const [streamsVideos, uploadedVideos, rssVideos] = await Promise.all([...fetchPromises, rssPromise]);

    // Merge in priority order: streams first (live streams are newest), then uploads, then rss
    const seen = new Set();
    const combined = [];

    for (const v of [...streamsVideos, ...uploadedVideos, ...rssVideos]) {
      if (v.videoId && !seen.has(v.videoId)) {
        seen.add(v.videoId);
        combined.push(v);
      }
    }

    res.status(200).json({
      success: true,
      channelId,
      channelUrl: `https://www.youtube.com/channel/${channelId}`,
      totalFoundInYouTube: combined.length,
      sermons: combined,
      latestSermon: combined[0] || null
    });
  } catch (err) {
    console.error('Sync Sermons Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
