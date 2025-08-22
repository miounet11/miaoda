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
    // Create existing tables
    this.createChatTables()
    
    // Create authentication tables
    this.createAuthTables()
  }

  private createChatTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        tags TEXT DEFAULT NULL,
        archived INTEGER DEFAULT 0,
        starred INTEGER DEFAULT 0,
        settings TEXT DEFAULT NULL,
        user_id TEXT DEFAULT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

  private createAuthTables(): void {
    this.db.exec(`
      -- Users table for authentication
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        name TEXT NOT NULL,
        avatar_url TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        last_active_at INTEGER,
        is_active INTEGER DEFAULT 1,
        email_verified INTEGER DEFAULT 0,
        preferences TEXT, -- JSON blob for user preferences
        encryption_key_id TEXT,
        backup_codes TEXT, -- JSON array of encrypted backup codes
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until INTEGER DEFAULT NULL,
        password_changed_at INTEGER NOT NULL
      );

      -- User sessions for session management
      CREATE TABLE IF NOT EXISTS user_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        device_id TEXT NOT NULL,
        device_name TEXT,
        device_type TEXT,
        ip_address TEXT,
        user_agent TEXT,
        access_token_hash TEXT NOT NULL,
        refresh_token_hash TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        last_used_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        is_active INTEGER DEFAULT 1,
        location TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      -- Authentication methods (2FA, biometric, etc.)
      CREATE TABLE IF NOT EXISTS auth_methods (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        method_type TEXT NOT NULL, -- 'password', 'totp', 'backup_code', 'biometric'
        method_data TEXT NOT NULL, -- encrypted method-specific data
        is_enabled INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL,
        last_used_at INTEGER,
        setup_completed INTEGER DEFAULT 0,
        backup_codes_generated INTEGER DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      -- Password reset tokens
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        used_at INTEGER,
        ip_address TEXT,
        user_agent TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      -- Email verification tokens
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL,
        email TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        used_at INTEGER,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      -- User encryption keys for data protection
      CREATE TABLE IF NOT EXISTS user_encryption_keys (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        key_type TEXT NOT NULL, -- 'master', 'data', 'sync'
        encrypted_key TEXT NOT NULL,
        salt TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        is_active INTEGER DEFAULT 1,
        key_version INTEGER DEFAULT 1,
        derivation_params TEXT, -- JSON blob for key derivation parameters
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      -- Authentication audit logs
      CREATE TABLE IF NOT EXISTS auth_audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        session_id TEXT,
        action TEXT NOT NULL, -- 'login', 'logout', 'register', 'password_change', etc.
        details TEXT, -- JSON blob with action-specific details
        ip_address TEXT,
        user_agent TEXT,
        success INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        risk_score INTEGER DEFAULT 0 -- Risk assessment score
      );

      -- Device fingerprints for security
      CREATE TABLE IF NOT EXISTS device_fingerprints (
        id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        user_id TEXT,
        fingerprint_hash TEXT NOT NULL,
        trusted INTEGER DEFAULT 0,
        first_seen_at INTEGER NOT NULL,
        last_seen_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );

      -- Rate limiting for security
      CREATE TABLE IF NOT EXISTS rate_limits (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL, -- IP, user_id, etc.
        action TEXT NOT NULL, -- 'login', 'register', 'password_reset'
        attempts INTEGER DEFAULT 1,
        window_start INTEGER NOT NULL,
        blocked_until INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `)
  }

  private runMigrations(): void {
    try {
      this.migrateChatTable()
      this.migrateMessageTable()
      this.migrateSearchIndex()
      this.migrateAuthTables()
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
      { name: 'settings', sql: 'ALTER TABLE chats ADD COLUMN settings TEXT DEFAULT NULL' },
      { name: 'summary', sql: 'ALTER TABLE chats ADD COLUMN summary TEXT DEFAULT NULL' },
      { name: 'summary_tags', sql: 'ALTER TABLE chats ADD COLUMN summary_tags TEXT DEFAULT NULL' },
      { name: 'summary_updated_at', sql: 'ALTER TABLE chats ADD COLUMN summary_updated_at TEXT DEFAULT NULL' },
      { name: 'summary_tokens', sql: 'ALTER TABLE chats ADD COLUMN summary_tokens INTEGER DEFAULT NULL' },
      { name: 'key_points', sql: 'ALTER TABLE chats ADD COLUMN key_points TEXT DEFAULT NULL' }
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

    // Handle timestamp to created_at migration
    if (columnNames.has('timestamp') && !columnNames.has('created_at')) {
      // Add created_at column first
      this.db.exec('ALTER TABLE messages ADD COLUMN created_at TEXT')
      // Copy timestamp data to created_at
      this.db.exec('UPDATE messages SET created_at = timestamp')
      // Update column names after adding created_at
      const updatedColumns = this.db.prepare("PRAGMA table_info(messages)").all() as Array<{name: string}>
      columnNames.clear()
      updatedColumns.forEach(col => columnNames.add(col.name))
    }

    const requiredColumns = [
      { name: 'attachments', sql: 'ALTER TABLE messages ADD COLUMN attachments TEXT DEFAULT NULL' },
      { name: 'metadata', sql: 'ALTER TABLE messages ADD COLUMN metadata TEXT DEFAULT NULL' },
      { name: 'parent_id', sql: 'ALTER TABLE messages ADD COLUMN parent_id TEXT DEFAULT NULL' },
      { name: 'error', sql: 'ALTER TABLE messages ADD COLUMN error TEXT DEFAULT NULL' },
      { name: 'error_details', sql: 'ALTER TABLE messages ADD COLUMN error_details TEXT DEFAULT NULL' }
    ]

    // Only add created_at if it doesn't exist and timestamp doesn't exist either
    if (!columnNames.has('created_at') && !columnNames.has('timestamp')) {
      requiredColumns.push({ name: 'created_at', sql: 'ALTER TABLE messages ADD COLUMN created_at TEXT' })
    }

    for (const column of requiredColumns) {
      if (!columnNames.has(column.name)) {
        this.db.exec(column.sql)
      }
    }
  }

  /**
   * Migrate search_index table - fix FTS5 virtual table issues
   */
  private migrateSearchIndex(): void {
    try {
      // Check if there are old search_index related triggers
      const oldTriggers = this.db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='trigger' 
        AND name IN ('search_index_delete', 'search_index_insert', 'search_index_update')
      `).all() as Array<{name: string}>

      // Remove old problematic triggers
      for (const trigger of oldTriggers) {
        this.db.exec(`DROP TRIGGER IF EXISTS ${trigger.name}`)
      }

      // Check if search_index exists and what type it is
      const searchIndexInfo = this.db.prepare(`
        SELECT name, sql FROM sqlite_master 
        WHERE type='table' AND name='search_index'
      `).get() as {name: string, sql: string} | undefined

      // If search_index exists and is a virtual table or has wrong structure, drop it
      if (searchIndexInfo && (
        searchIndexInfo.sql.includes('VIRTUAL TABLE') || 
        searchIndexInfo.sql.includes('fts5') ||
        searchIndexInfo.sql.includes('fts4')
      )) {
        this.db.exec('DROP TABLE IF EXISTS search_index')
      }

      // Recreate search_index as regular table if it doesn't exist with correct structure
      const currentSearchIndex = this.db.prepare("PRAGMA table_info(search_index)").all() as Array<{name: string}>
      const hasMessageId = currentSearchIndex.some(col => col.name === 'message_id')
      
      if (!hasMessageId) {
        // Drop and recreate with correct structure
        this.db.exec('DROP TABLE IF EXISTS search_index')
        this.db.exec(`
          CREATE TABLE IF NOT EXISTS search_index (
            message_id TEXT PRIMARY KEY,
            chat_id TEXT NOT NULL,
            content_normalized TEXT NOT NULL,
            tokens TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
            FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
          )
        `)
      }
    } catch (error) {
      // Log error but don't fail initialization
      console.warn('Search index migration warning:', error)
    }
  }

  /**
   * Migrate authentication tables - add new columns as needed
   */
  private migrateAuthTables(): void {
    // Add user_id column to chats if it doesn't exist
    const chatTables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='chats'").all()
    if (chatTables.length > 0) {
      const chatColumns = this.db.prepare("PRAGMA table_info(chats)").all() as Array<{name: string}>
      const chatColumnNames = new Set(chatColumns.map(col => col.name))
      
      if (!chatColumnNames.has('user_id')) {
        this.db.exec('ALTER TABLE chats ADD COLUMN user_id TEXT DEFAULT NULL')
      }
    }

    // Migrate existing auth tables if they need updates
    const authTables = ['users', 'user_sessions', 'auth_methods']
    
    for (const tableName of authTables) {
      const tables = this.db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`).all()
      if (tables.length === 0) continue

      const columns = this.db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{name: string}>
      const columnNames = new Set(columns.map(col => col.name))

      // Add missing columns based on table
      switch (tableName) {
        case 'users':
          const userColumns = [
            { name: 'failed_login_attempts', sql: `ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0` },
            { name: 'locked_until', sql: `ALTER TABLE users ADD COLUMN locked_until INTEGER DEFAULT NULL` },
            { name: 'password_changed_at', sql: `ALTER TABLE users ADD COLUMN password_changed_at INTEGER DEFAULT ${Date.now()}` }
          ]
          for (const column of userColumns) {
            if (!columnNames.has(column.name)) {
              this.db.exec(column.sql)
            }
          }
          break

        case 'auth_methods':
          const authMethodColumns = [
            { name: 'setup_completed', sql: `ALTER TABLE auth_methods ADD COLUMN setup_completed INTEGER DEFAULT 0` },
            { name: 'backup_codes_generated', sql: `ALTER TABLE auth_methods ADD COLUMN backup_codes_generated INTEGER DEFAULT 0` }
          ]
          for (const column of authMethodColumns) {
            if (!columnNames.has(column.name)) {
              this.db.exec(column.sql)
            }
          }
          break
      }
    }
  }

  private createIndexes(): void {
    this.db.exec(`
      -- Chat and message performance indexes
      CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at);
      CREATE INDEX IF NOT EXISTS idx_chats_archived ON chats(archived);
      CREATE INDEX IF NOT EXISTS idx_chats_starred ON chats(starred);
      CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
      
      -- Authentication performance indexes
      CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
      
      -- Session management indexes
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_device_id ON user_sessions(device_id);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_last_used ON user_sessions(last_used_at);
      
      -- Authentication methods indexes
      CREATE INDEX IF NOT EXISTS idx_auth_methods_user_id ON auth_methods(user_id);
      CREATE INDEX IF NOT EXISTS idx_auth_methods_type ON auth_methods(method_type);
      CREATE INDEX IF NOT EXISTS idx_auth_methods_enabled ON auth_methods(is_enabled);
      
      -- Token management indexes
      CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_password_reset_expires ON password_reset_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_email_verification_user_id ON email_verification_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_email_verification_expires ON email_verification_tokens(expires_at);
      
      -- Encryption key indexes
      CREATE INDEX IF NOT EXISTS idx_user_keys_user_id ON user_encryption_keys(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_keys_type ON user_encryption_keys(key_type);
      CREATE INDEX IF NOT EXISTS idx_user_keys_active ON user_encryption_keys(is_active);
      
      -- Audit and security indexes
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON auth_audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON auth_audit_logs(action);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON auth_audit_logs(created_at);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON auth_audit_logs(success);
      
      -- Device fingerprint indexes
      CREATE INDEX IF NOT EXISTS idx_device_fingerprints_device_id ON device_fingerprints(device_id);
      CREATE INDEX IF NOT EXISTS idx_device_fingerprints_user_id ON device_fingerprints(user_id);
      CREATE INDEX IF NOT EXISTS idx_device_fingerprints_trusted ON device_fingerprints(trusted);
      
      -- Rate limiting indexes
      CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier);
      CREATE INDEX IF NOT EXISTS idx_rate_limits_action ON rate_limits(action);
      CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);
      CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked_until ON rate_limits(blocked_until);
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