// In-memory cache to make repeated requests instantaneous across serverless warm instances
let cachedCatalog = null;
let cacheTime = 0;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

function extractItemsFromContents(contents, seen, allVideos) {
  let nextContinuation = null;

  for (const item of contents) {
    if (item.continuationItemRenderer) {
      nextContinuation = item.continuationItemRenderer.continuationEndpoint?.continuationCommand?.token;
    }
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

      let topic = 'تعليم وعظة';
      const cleanTitle = title.trim();
      if (cleanTitle.includes('عشية') || cleanTitle.includes('تسبحة') || cleanTitle.includes('تسابيح')) topic = 'عشيات وتسابيح';
      else if (cleanTitle.includes('قداس') || cleanTitle.includes('ذبيحة')) topic = 'قداسات إلهية';
      else if (cleanTitle.includes('نهضة') || cleanTitle.includes('صوم') || cleanTitle.includes('صعود') || cleanTitle.includes('عيد')) topic = 'نهضات ومناسبات';
      else if (cleanTitle.includes('شبان') || cleanTitle.includes('شباب') || cleanTitle.includes('شابات') || cleanTitle.includes('جامعيين')) topic = 'اجتماعات الشباب';
      else if (cleanTitle.includes('دراسة') || cleanTitle.includes('تفسير') || cleanTitle.includes('إنجيل') || cleanTitle.includes('مزمور') || cleanTitle.includes('رسالة')) topic = 'كتاب مقدس';
      else if (cleanTitle.includes('لحن') || cleanTitle.includes('ألحان') || cleanTitle.includes('طقس')) topic = 'ألحان وطقوس';

      let speaker = 'آباء كنيسة العذراء محرم بك';
      const speakerMatch = cleanTitle.match(/(أبونا\s+[\u0621-\u064A]+|القمص\s+[\u0621-\u064A\s]+|القس\s+[\u0621-\u064A\s]+|الأنبا\s+[\u0621-\u064A]+)/);
      if (speakerMatch) {
        speaker = speakerMatch[1].trim();
      }

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

      allVideos.push({
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

  return nextContinuation;
}

async function fetchFullChannelVideos(channelId) {
  const allVideos = [];
  const seen = new Set();

  async function getInitialHtml(tab) {
    const url = `https://www.youtube.com/channel/${channelId}/${tab}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'ar,en;q=0.9'
      }
    });
    const html = await res.text();
    const match = html.match(/var ytInitialData = (\{.*?\});<\/script>/s) || html.match(/ytInitialData\s*=\s*(\{.*?\});/s);
    const keyMatch = html.match(/"INNERTUBE_API_KEY":"([a-zA-Z0-9_-]+)"/);

    return {
      data: match ? JSON.parse(match[1]) : null,
      apiKey: keyMatch ? keyMatch[1] : null
    };
  }

  for (const tabName of ['streams', 'videos']) {
    try {
      const { data, apiKey } = await getInitialHtml(tabName);
      if (!data) continue;

      const tabs = data.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
      let currentToken = null;
      for (const tab of tabs) {
        const contents = tab.tabRenderer?.content?.richGridRenderer?.contents || [];
        const cont = extractItemsFromContents(contents, seen, allVideos);
        if (cont) currentToken = cont;
      }

      let page = 1;
      // Fetch up to 10 pages per tab (up to 300+ streams and 300+ videos per invocation)
      while (currentToken && page <= 12 && apiKey) {
        page++;
        try {
          const res = await fetch(`https://www.youtube.com/youtubei/v1/browse?key=${apiKey}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept-Language': 'ar,en;q=0.9'
            },
            body: JSON.stringify({
              context: {
                client: {
                  clientName: 'WEB',
                  clientVersion: '2.20240301.00.00',
                  hl: 'ar',
                  gl: 'EG'
                }
              },
              continuation: currentToken
            })
          });

          if (!res.ok) break;

          const json = await res.json();
          const actions = json.onResponseReceivedActions || [];
          let foundCont = null;

          for (const act of actions) {
            const items = act.appendContinuationItemsAction?.continuationItems || [];
            const cont = extractItemsFromContents(items, seen, allVideos);
            if (cont) foundCont = cont;
          }

          currentToken = foundCont;
        } catch (err) {
          break;
        }
      }
    } catch (e) {
      console.warn(`Tab ${tabName} fetch warning:`, e.message);
    }
  }

  return allVideos;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const channelId = req.query.channelId || 'UCLEhdhZFRuxMXHL3pDpg65g';
  const forceRefresh = req.query.refresh === 'true';

  try {
    const now = Date.now();
    if (!cachedCatalog || forceRefresh || now - cacheTime > CACHE_TTL_MS) {
      const videos = await fetchFullChannelVideos(channelId);
      if (videos && videos.length > 0) {
        cachedCatalog = videos;
        cacheTime = now;
      }
    }

    const finalVideos = cachedCatalog || [];

    res.status(200).json({
      success: true,
      channelId,
      channelUrl: `https://www.youtube.com/channel/${channelId}`,
      totalFoundInYouTube: finalVideos.length,
      sermons: finalVideos,
      latestSermon: finalVideos[0] || null
    });
  } catch (err) {
    console.error('Sync Sermons Error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
