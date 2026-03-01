import { config } from './config.js';
import { getReadyEpisodes } from './db.js';

function escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toRfc2822(dateStr) {
  return new Date(dateStr + 'Z').toUTCString();
}

function formatDuration(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function generateFeed() {
  const episodes = getReadyEpisodes();
  const lastBuildDate = episodes.length > 0 ? toRfc2822(episodes[0].created_at) : new Date().toUTCString();

  const items = episodes.map((ep) => `
    <item>
      <title>${escapeXml(ep.title)}</title>
      <description><![CDATA[${ep.description || ''}]]></description>
      <enclosure url="${escapeXml(config.baseUrl)}/audio/${escapeXml(ep.audio_file)}" length="${ep.file_size}" type="audio/mpeg"/>
      <guid isPermaLink="false">${ep.id}</guid>
      <pubDate>${toRfc2822(ep.created_at)}</pubDate>
      <link>${escapeXml(ep.youtube_url)}</link>
      <itunes:duration>${formatDuration(ep.duration)}</itunes:duration>
      <itunes:author>${escapeXml(ep.author)}</itunes:author>
      <itunes:explicit>false</itunes:explicit>
      <itunes:summary><![CDATA[${(ep.description || '').slice(0, 4000)}]]></itunes:summary>${ep.thumbnail_url ? `
      <itunes:image href="${escapeXml(ep.thumbnail_url)}"/>` : ''}
    </item>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:podcast="https://podcastindex.org/namespace/1.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(config.podcastTitle)}</title>
    <description>${escapeXml(config.podcastDescription)}</description>
    <link>${escapeXml(config.baseUrl)}</link>
    <language>en</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
    <atom:link href="${escapeXml(config.baseUrl)}/feed" rel="self" type="application/rss+xml"/>
    <itunes:author>${escapeXml(config.podcastAuthor)}</itunes:author>
    <itunes:summary>${escapeXml(config.podcastDescription)}</itunes:summary>
    <itunes:image href="${escapeXml(config.baseUrl)}/artwork.png"/>
    <itunes:category text="Technology"/>
    <itunes:explicit>false</itunes:explicit>
${items}
  </channel>
</rss>`;
}
