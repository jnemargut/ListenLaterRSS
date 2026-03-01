import Database from 'better-sqlite3';
import { join } from 'path';
import { config } from './config.js';

const db = new Database(join(config.dataDir, 'episodes.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS episodes (
    id            TEXT PRIMARY KEY,
    youtube_url   TEXT NOT NULL UNIQUE,
    youtube_id    TEXT NOT NULL,
    title         TEXT NOT NULL DEFAULT 'Untitled',
    description   TEXT DEFAULT '',
    author        TEXT DEFAULT '',
    duration      INTEGER DEFAULT 0,
    file_size     INTEGER DEFAULT 0,
    audio_file    TEXT DEFAULT '',
    thumbnail_url TEXT DEFAULT '',
    status        TEXT DEFAULT 'pending',
    error_message TEXT DEFAULT '',
    created_at    TEXT DEFAULT (datetime('now')),
    processed_at  TEXT
  )
`);

const stmts = {
  insert: db.prepare(`
    INSERT INTO episodes (id, youtube_url, youtube_id, title, status)
    VALUES (@id, @youtubeUrl, @youtubeId, @title, 'pending')
  `),
  findByUrl: db.prepare('SELECT * FROM episodes WHERE youtube_url = ?'),
  findById: db.prepare('SELECT * FROM episodes WHERE id = ?'),
  allReady: db.prepare("SELECT * FROM episodes WHERE status = 'ready' ORDER BY created_at DESC"),
  all: db.prepare('SELECT * FROM episodes ORDER BY created_at DESC'),
  updateStatus: db.prepare('UPDATE episodes SET status = @status, error_message = @errorMessage WHERE id = @id'),
  updateMetadata: db.prepare(`
    UPDATE episodes SET title = @title, description = @description, author = @author,
    duration = @duration, thumbnail_url = @thumbnailUrl WHERE id = @id
  `),
  updateReady: db.prepare(`
    UPDATE episodes SET status = 'ready', audio_file = @audioFile, file_size = @fileSize,
    duration = @duration, processed_at = datetime('now') WHERE id = @id
  `),
};

export function insertEpisode({ id, youtubeUrl, youtubeId, title }) {
  return stmts.insert.run({ id, youtubeUrl, youtubeId, title });
}

export function findByUrl(url) {
  return stmts.findByUrl.get(url);
}

export function findById(id) {
  return stmts.findById.get(id);
}

export function getReadyEpisodes() {
  return stmts.allReady.all();
}

export function getAllEpisodes() {
  return stmts.all.all();
}

export function updateStatus(id, status, errorMessage = '') {
  return stmts.updateStatus.run({ id, status, errorMessage });
}

export function updateMetadata(id, { title, description, author, duration, thumbnailUrl }) {
  return stmts.updateMetadata.run({ id, title, description, author, duration, thumbnailUrl });
}

export function updateReady(id, { audioFile, fileSize, duration }) {
  return stmts.updateReady.run({ id, audioFile, fileSize, duration });
}
