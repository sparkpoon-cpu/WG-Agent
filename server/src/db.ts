import Database from 'better-sqlite3'
import path from 'path'

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'wg-agent-server.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode=WAL')
    db.pragma('foreign_keys=ON')
    runMigrations(db)
  }
  return db
}

function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  const applied = db.prepare('SELECT id FROM _migrations WHERE name = ?').get('001_initial')
  if (applied) return

  const txn = db.transaction(() => {
    db.exec(`
      -- Team users
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Projects
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        color TEXT DEFAULT '#6366f1',
        sort_order INTEGER DEFAULT 0,
        created_by TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- Conversations
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        user_id TEXT,
        title TEXT NOT NULL DEFAULT 'New Conversation',
        model TEXT NOT NULL DEFAULT 'deepseek-v4-pro',
        system_prompt TEXT DEFAULT '',
        is_pinned INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_conv_updated ON conversations(updated_at DESC);
      CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id);

      -- Messages
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        reasoning_content TEXT,
        prompt_tokens INTEGER DEFAULT 0,
        completion_tokens INTEGER DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id, created_at);

      -- Scripts
      CREATE TABLE IF NOT EXISTS scripts (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        conversation_id TEXT,
        user_id TEXT,
        title TEXT NOT NULL DEFAULT 'Untitled Script',
        fountain_content TEXT DEFAULT '',
        word_count INTEGER DEFAULT 0,
        current_version INTEGER DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_scr_updated ON scripts(updated_at DESC);

      -- Script versions
      CREATE TABLE IF NOT EXISTS script_versions (
        id TEXT PRIMARY KEY,
        script_id TEXT NOT NULL,
        version INTEGER NOT NULL,
        fountain_content TEXT NOT NULL,
        change_summary TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (script_id) REFERENCES scripts(id) ON DELETE CASCADE,
        UNIQUE(script_id, version)
      );

      -- Settings (key-value, server-wide)
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      -- API usage log
      CREATE TABLE IF NOT EXISTS api_usage_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        conversation_id TEXT,
        model TEXT NOT NULL,
        prompt_tokens INTEGER DEFAULT 0,
        completion_tokens INTEGER DEFAULT 0,
        reasoning_tokens INTEGER DEFAULT 0,
        total_tokens INTEGER DEFAULT 0,
        cost_estimate_usd REAL DEFAULT 0.0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `)

    // Default settings
    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)')
    insertSetting.run('api_key', '')
    insertSetting.run('default_model', 'deepseek-v4-pro')
    insertSetting.run('thinking_enabled', 'true')
    insertSetting.run('reasoning_effort', 'high')
    insertSetting.run('admin_password_hash', '') // Set on first run

    db.prepare('INSERT INTO _migrations (name) VALUES (?)').run('001_initial')
  })

  txn()
}
