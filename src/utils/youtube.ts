/**
 * Utility functions for handling YouTube URLs, video IDs, embed links, and thumbnails.
 */

/**
 * Extracts the 11-character YouTube video ID from various YouTube URL formats or iframe embed code.
 */
export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url) return null;
  const cleanUrl = url.trim();

  // If full <iframe> tag was pasted, extract src attribute first
  const iframeMatch = cleanUrl.match(/src=["']([^"']+)["']/);
  const targetUrl = iframeMatch ? iframeMatch[1] : cleanUrl;

  // Regular expression to match standard watch, short links, embeds, and shorts
  const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = targetUrl.match(regExp);

  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }

  // Fallback check if the input is directly an 11-character video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(targetUrl)) {
    return targetUrl;
  }

  return null;
}

/**
 * Generates a full YouTube embed iframe URL.
 */
export function getYouTubeEmbedUrl(url?: string | null, autoplay: boolean = true): string {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return url || '';
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&rel=0&enablejsapi=1`;
}

/**
 * Generates high quality YouTube thumbnail URL.
 */
export function getYouTubeThumbnailUrl(url?: string | null): string | null {
  const videoId = getYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
