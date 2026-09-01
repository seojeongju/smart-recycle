-- smart-recycle D1 초기 스키마
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  nickname TEXT NOT NULL DEFAULT '새싹이',
  total_xp INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_checkin_date TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE waste_categories (
  id TEXT PRIMARY KEY,
  name_ko TEXT NOT NULL,
  bin_type TEXT NOT NULL,
  color TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE waste_items (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES waste_categories(id),
  name_ko TEXT NOT NULL,
  summary_ko TEXT NOT NULL,
  special_bin_type TEXT,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE waste_aliases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL REFERENCES waste_items(id),
  alias TEXT NOT NULL
);
CREATE INDEX idx_aliases_alias ON waste_aliases(alias);

CREATE TABLE guide_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL REFERENCES waste_items(id),
  step_order INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  required INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE upcycle_tips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id TEXT NOT NULL REFERENCES waste_items(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  caution TEXT
);

CREATE TABLE collection_bins (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  phone TEXT,
  hours TEXT,
  source TEXT NOT NULL,
  external_id TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_bins_type ON collection_bins(type);
CREATE INDEX idx_bins_geo ON collection_bins(lat, lng);

CREATE TABLE checkins (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  item_id TEXT REFERENCES waste_items(id),
  checkin_date TEXT NOT NULL,
  points INTEGER NOT NULL,
  image_key TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(user_id, item_id, checkin_date)
);

CREATE TABLE recognition_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  image_key TEXT NOT NULL,
  raw_label TEXT,
  item_id TEXT,
  category_id TEXT,
  confidence REAL,
  latency_ms INTEGER,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE search_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query TEXT NOT NULL,
  result_count INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE sync_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  status TEXT NOT NULL,
  row_count INTEGER,
  error TEXT,
  ran_at TEXT NOT NULL DEFAULT (datetime('now'))
);
