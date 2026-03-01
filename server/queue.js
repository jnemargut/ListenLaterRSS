import { join } from 'path';
import { statSync, readdirSync } from 'fs';
import { config } from './config.js';
import { getVideoMetadata, extractAudio } from './extractor.js';
import { updateStatus, updateMetadata, updateReady } from './db.js';

const queue = [];
let processing = false;

export function enqueue(episodeId, youtubeUrl) {
  queue.push({ episodeId, youtubeUrl });
  processNext();
}

async function processNext() {
  if (processing || queue.length === 0) return;
  processing = true;

  const { episodeId, youtubeUrl } = queue.shift();

  try {
    updateStatus(episodeId, 'processing');

    // Fetch metadata from YouTube
    const meta = await getVideoMetadata(youtubeUrl);
    updateMetadata(episodeId, meta);

    // Extract audio as MP3
    const outputTemplate = join(config.dataDir, 'audio', `${episodeId}.%(ext)s`);
    await extractAudio(youtubeUrl, outputTemplate);

    // Find the resulting MP3 file
    const audioDir = join(config.dataDir, 'audio');
    const audioFile = readdirSync(audioDir).find((f) => f.startsWith(episodeId) && f.endsWith('.mp3'));

    if (!audioFile) {
      throw new Error('Audio extraction completed but MP3 file not found');
    }

    const filePath = join(audioDir, audioFile);
    const { size } = statSync(filePath);

    updateReady(episodeId, {
      audioFile,
      fileSize: size,
      duration: meta.duration,
    });

    console.log(`Processed: ${meta.title} (${audioFile}, ${(size / 1024 / 1024).toFixed(1)} MB)`);
  } catch (err) {
    console.error(`Error processing ${episodeId}:`, err.message);
    updateStatus(episodeId, 'error', err.message);
  } finally {
    processing = false;
    processNext();
  }
}
