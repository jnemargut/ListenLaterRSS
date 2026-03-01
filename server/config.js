import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { join } from 'path';

const DATA_DIR = process.env.DATA_DIR || join(process.cwd(), 'data');
const CONFIG_PATH = join(DATA_DIR, 'config.json');

function ensureDataDirs() {
  mkdirSync(join(DATA_DIR, 'audio'), { recursive: true });
}

function loadOrCreateConfig() {
  ensureDataDirs();

  let stored = {};
  if (existsSync(CONFIG_PATH)) {
    try {
      stored = JSON.parse(readFileSync(CONFIG_PATH, 'utf-8'));
    } catch {
      stored = {};
    }
  }

  const apiKey = process.env.API_KEY || stored.apiKey || randomUUID();
  const isNewKey = !process.env.API_KEY && !stored.apiKey;

  const config = {
    port: parseInt(process.env.PORT, 10) || 3000,
    baseUrl: (process.env.BASE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
    apiKey,
    dataDir: DATA_DIR,
    podcastTitle: process.env.PODCAST_TITLE || 'Listen Later',
    podcastAuthor: process.env.PODCAST_AUTHOR || 'Listen Later RSS',
    podcastDescription: process.env.PODCAST_DESCRIPTION || 'Videos saved for later listening',
    ytdlpPath: process.env.YTDLP_PATH || 'yt-dlp',
    cookiesFromBrowser: process.env.COOKIES_FROM_BROWSER || '',  // e.g. "chrome", "firefox"
    cookiesFile: process.env.COOKIES_FILE || '',                  // path to cookies.txt
  };

  // Persist API key so it survives restarts
  writeFileSync(CONFIG_PATH, JSON.stringify({ apiKey: config.apiKey }, null, 2));

  if (isNewKey) {
    console.log('\n========================================');
    console.log('  New API key generated:');
    console.log(`  ${config.apiKey}`);
    console.log('  Save this! You need it for the Chrome extension.');
    console.log('========================================\n');
  }

  return config;
}

export const config = loadOrCreateConfig();
