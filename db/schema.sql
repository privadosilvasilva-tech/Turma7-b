CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner','admin','support','aluno')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_by INTEGER,
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT
);

CREATE TABLE IF NOT EXISTS activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subject TEXT,
  teacher TEXT,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'ATIVIDADE',
  pub_date TEXT NOT NULL DEFAULT (datetime('now')),
  due_date TEXT,
  due_time TEXT,
  file_path TEXT,
  manual_status TEXT,
  author_id INTEGER NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(author_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  deleted INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  target_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
