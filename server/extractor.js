import { spawn } from 'child_process';

export function getVideoMetadata(url) {
  return new Promise((resolve, reject) => {
    const proc = spawn('yt-dlp', ['--dump-json', '--no-download', '--no-playlist', url]);
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
    const proc = spawn('yt-dlp', [
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--no-playlist',
      '--no-warnings',
      '-o', outputPath,
      url,
    ]);
    let stderr = '';
    proc.stderr.on('data', (chunk) => { stderr += chunk; });
    proc.on('close', (code) => {
      if (code !== 0) return reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
      resolve();
    });
    proc.on('error', (err) => reject(new Error(`Failed to spawn yt-dlp: ${err.message}`)));
  });
}
