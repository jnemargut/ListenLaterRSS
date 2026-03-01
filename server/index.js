import express from 'express';
import cors from 'cors';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __dirname = dirname(fileURLToPath(import.meta.url));
import { config } from './config.js';
import { requireApiKey } from './auth.js';
import { insertEpisode, findByUrl, getAllEpisodes } from './db.js';
import { enqueue } from './queue.js';
import { generateFeed } from './feed.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
}));
app.use(express.json());

// --- Public routes (podcast apps need unauthenticated access) ---

// RSS feed
app.get('/feed', (_req, res) => {
  const xml = generateFeed();
  res.set('Content-Type', 'application/rss+xml; charset=utf-8');
  res.send(xml);
});

// Podcast artwork
app.get('/artwork.png', (_req, res) => {
  res.sendFile(join(__dirname, 'artwork.png'));
});

// iOS Shortcut download
app.get('/shortcut', (_req, res) => {
  res.set('Content-Type', 'application/octet-stream');
  res.set('Content-Disposition', 'attachment; filename="Listen Later.shortcut"');
  res.sendFile(join(__dirname, 'ListenLater.shortcut'));
});

// Audio files
app.get('/audio/:filename', (req, res) => {
  const filePath = join(config.dataDir, 'audio', req.params.filename);
  res.sendFile(filePath, (err) => {
    if (err && !res.headersSent) {
      res.status(404).json({ error: 'Audio file not found' });
    }
  });
});

// --- Protected routes ---

// Add a YouTube video
app.post('/api/episodes', requireApiKey, (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Missing "url" field' });
  }

  const normalized = normalizeYoutubeUrl(url);
  if (!normalized) {
    return res.status(400).json({ error: 'Invalid YouTube URL' });
  }

  // Check for duplicates
  const existing = findByUrl(normalized.url);
  if (existing) {
    return res.status(200).json({
      id: existing.id,
      status: existing.status,
      message: 'Video already in feed',
    });
  }

  const id = uuidv4();
  insertEpisode({
    id,
    youtubeUrl: normalized.url,
    youtubeId: normalized.videoId,
    title: 'Processing...',
  });

  enqueue(id, normalized.url);

  res.status(202).json({
    id,
    status: 'pending',
    message: 'Video queued for processing',
  });
});

// List all episodes
app.get('/api/episodes', requireApiKey, (_req, res) => {
  const episodes = getAllEpisodes();
  res.json({ episodes });
});

// --- Helpers ---

function normalizeYoutubeUrl(url) {
  try {
    const parsed = new URL(url);
    const validHosts = ['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be'];
    if (!validHosts.includes(parsed.hostname)) return null;

    let videoId;
    if (parsed.hostname === 'youtu.be') {
      videoId = parsed.pathname.slice(1);
    } else {
      videoId = parsed.searchParams.get('v');
    }

    if (!videoId) return null;
    return { url: `https://www.youtube.com/watch?v=${videoId}`, videoId };
  } catch {
    return null;
  }
}

// --- Start ---

app.listen(config.port, () => {
  console.log(`Listen Later RSS server running on port ${config.port}`);
  console.log(`Feed URL: ${config.baseUrl}/feed`);
});
