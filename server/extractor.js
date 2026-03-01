import { spawn } from 'child_process';
import { config } from './config.js';

function baseArgs() {
  const args = ['--js-runtimes', 'node', '--remote-components', 'ejs:github'];
  if (config.cookiesFromBrowser) args.push('--cookies-from-browser', config.cookiesFromBrowser);
  if (config.cookiesFile) args.push('--cookies', config.cookiesFile);
  return args;
}

export function getVideoMetadata(url) {
  return new Promise((resolve, reject) => {
    const args = ['--dump-json', '--no-download', '--no-playlist', ...baseArgs(), url];
    const proc = spawn(config.ytdlpPath, args);
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (chunk) => { stdout += chunk; });
    proc.stderr.on('data', (chunk) => { stderr += chunk; });
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
      try {
        const info = JSON.parse(stdout);
        resolve({
          title: info.title || 'Untitled',
          description: (info.description || '').slice(0, 4000),
          duration: info.duration || 0,
          author: info.uploader || info.channel || '',
          thumbnailUrl: info.thumbnail || '',
        });
      } catch (e) {
        reject(new Error('Failed to parse yt-dlp metadata output'));
      }
    });
    proc.on('error', (err) => reject(new Error(`Failed to spawn yt-dlp: ${err.message}`)));
  });
}

export function extractAudio(url, outputPath) {
  return new Promise((resolve, reject) => {
    const args = [
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--no-playlist',
      '--no-warnings',
      ...baseArgs(),
      '-o', outputPath,
      url,
    ];
    const proc = spawn(config.ytdlpPath, args);
    let stderr = '';
    proc.stderr.on('data', (chunk) => { stderr += chunk; });
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
      resolve();
    });
    proc.on('error', (err) => reject(new Error(`Failed to spawn yt-dlp: ${err.message}`)));
  });
}
