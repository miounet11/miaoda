import Database from 'better-sqlite3'

/**
 * Base database service providing common database functionality
 */
export abstract class BaseDatabaseService {
  protected db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
  }

  protected validateId(id: string): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new Error('Invalid ID provided')
    }
  }

  protected validateText(text: string, fieldName: string): void {
    if (text === null || text === undefined || typeof text !== 'string') {
      throw new Error(`Invalid ${fieldName} provided`)
    }
  }

  protected getCurrentTimestamp(): string {
    return new Date().toISOString()
  }
}
