import Database from 'better-sqlite3'

/**
 * Handles database initialization and schema management
 */
export class DatabaseInitializer {
  private db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
  }

  /**
   * Initialize database with schema and indexes
   */
  initialize(): void {
    this.enableForeignKeys()
    this.createTables()
    this.runMigrations()
    this.createIndexes()
    this.createFullTextSearchTables()
    this.createTriggers()
  }

  private enableForeignKeys(): void {
    this.db.pragma('foreign_keys = ON')
  }

  private createTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        tags TEXT DEFAULT NULL,
        archived INTEGER DEFAULT 0,
        starred INTEGER DEFAULT 0,
        settings TEXT DEFAULT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        attachments TEXT DEFAULT NULL,
        metadata TEXT DEFAULT NULL,
        parent_id TEXT DEFAULT NULL,
        error TEXT DEFAULT NULL,
        error_details TEXT DEFAULT NULL,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS search_index (
        message_id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        content_normalized TEXT NOT NULL,
        tokens TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS search_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        query TEXT NOT NULL,
        result_count INTEGER NOT NULL,
        search_time_ms INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );
    `)
  }

  private runMigrations(): void {
    try {
      this.migrateChatTable()
      this.migrateMessageTable()
    } catch (error) {
      throw new Error(`Migration failed: ${error}`)
    }
  }

  private migrateChatTable(): void {
    const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chats'").all()
    if (tables.length === 0) return

    const columns = this.db.prepare("PRAGMA table_info(chats)").all() as Array<{name: string}>
    const columnNames = new Set(columns.map(col => col.name))

    const requiredColumns = [
      { name: 'archived', sql: 'ALTER TABLE chats ADD COLUMN archived INTEGER DEFAULT 0' },
      { name: 'starred', sql: 'ALTER TABLE chats ADD COLUMN starred INTEGER DEFAULT 0' },
      { name: 'tags', sql: 'ALTER TABLE chats ADD COLUMN tags TEXT DEFAULT NULL' },
      { name: 'settings', sql: 'ALTER TABLE chats ADD COLUMN settings TEXT DEFAULT NULL' }
    ]

    for (const column of requiredColumns) {
      if (!columnNames.has(column.name)) {
        this.db.exec(column.sql)
      }
    }
  }

  private migrateMessageTable(): void {
    const messagesTables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='messages'").all()
    if (messagesTables.length === 0) return

    const messageColumns = this.db.prepare("PRAGMA table_info(messages)").all() as Array<{name: string}>
    const columnNames = new Set(messageColumns.map(col => col.name))

    const requiredColumns = [
      { name: 'attachments', sql: 'ALTER TABLE messages ADD COLUMN attachments TEXT DEFAULT NULL' },
      { name: 'metadata', sql: 'ALTER TABLE messages ADD COLUMN metadata TEXT DEFAULT NULL' },
      { name: 'parent_id', sql: 'ALTER TABLE messages ADD COLUMN parent_id TEXT DEFAULT NULL' },
      { name: 'error', sql: 'ALTER TABLE messages ADD COLUMN error TEXT DEFAULT NULL' },
      { name: 'error_details', sql: 'ALTER TABLE messages ADD COLUMN error_details TEXT DEFAULT NULL' }
    ]

    for (const column of requiredColumns) {
      if (!columnNames.has(column.name)) {
        this.db.exec(column.sql)
      }
    }
  }

  private createIndexes(): void {
    this.db.exec(`
      -- Performance indexes
      CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at);
      CREATE INDEX IF NOT EXISTS idx_chats_archived ON chats(archived);
      CREATE INDEX IF NOT EXISTS idx_chats_starred ON chats(starred);
    `)
  }

  private createFullTextSearchTables(): void {
    this.db.exec(`
      -- Full-text search virtual table with enhanced tokenization
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        content,
        content_normalized,
        role,
        chat_title,
        created_at UNINDEXED,
        tokenize = 'porter unicode61 remove_diacritics 1'
      );
    `)
  }

  private createTriggers(): void {
    this.db.exec(`
      -- Triggers to keep FTS in sync with enhanced data
      CREATE TRIGGER IF NOT EXISTS messages_ai AFTER INSERT ON messages BEGIN
        INSERT INTO messages_fts(rowid, content, content_normalized, role, chat_title, created_at)
        SELECT new.rowid, new.content, LOWER(new.content), new.role,
               COALESCE(c.title, ''), new.created_at
        FROM chats c WHERE c.id = new.chat_id;
      END;

      CREATE TRIGGER IF NOT EXISTS messages_ad AFTER DELETE ON messages BEGIN
        DELETE FROM messages_fts WHERE rowid = old.rowid;
      END;

      CREATE TRIGGER IF NOT EXISTS messages_au AFTER UPDATE ON messages BEGIN
        UPDATE messages_fts
        SET content = new.content,
            content_normalized = LOWER(new.content),
            role = new.role
        WHERE rowid = new.rowid;
      END;

      -- Trigger to update FTS when chat title changes
      CREATE TRIGGER IF NOT EXISTS chats_au AFTER UPDATE OF title ON chats BEGIN
        UPDATE messages_fts
        SET chat_title = new.title
        WHERE rowid IN (SELECT rowid FROM messages WHERE chat_id = new.id);
      END;
    `)
  }
}