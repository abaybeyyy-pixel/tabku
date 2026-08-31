import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'tapku.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'UNACTIVATED' CHECK(status IN ('UNACTIVATED', 'ACTIVE', 'DISABLED')),
        business_name TEXT,
        destination_url TEXT,
        pin_hash TEXT,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        activated_at DATETIME,
        updated_at DATETIME,
        disabled_at DATETIME
      );

      CREATE INDEX IF NOT EXISTS idx_cards_card_id ON cards(card_id);
      CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(status);

      CREATE TABLE IF NOT EXISTS otp_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        card_id TEXT NOT NULL,
        otp_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        used INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (card_id) REFERENCES cards(card_id)
      );
    `);
  }

  return db;
}

export interface Card {
  id: number;
  card_id: string;
  status: 'UNACTIVATED' | 'ACTIVE' | 'DISABLED';
  business_name: string | null;
  destination_url: string | null;
  pin_hash: string | null;
  email: string | null;
  created_at: string;
  activated_at: string | null;
  updated_at: string | null;
  disabled_at: string | null;
}

export interface OtpCode {
  id: number;
  card_id: string;
  otp_hash: string;
  expires_at: string;
  used: number;
  created_at: string;
}
