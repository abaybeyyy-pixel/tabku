import { getDb, Card } from './db';

export function findCardById(cardId: string): Card | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM cards WHERE card_id = ?').get(cardId) as Card | undefined;
}

export function activateCard(
  cardId: string,
  businessName: string,
  destinationUrl: string,
  pinHash: string,
  email: string
): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE cards 
    SET status = 'ACTIVE', 
        business_name = ?, 
        destination_url = ?, 
        pin_hash = ?, 
        email = ?,
        activated_at = ?,
        updated_at = ?
    WHERE card_id = ? AND status = 'UNACTIVATED'
  `).run(businessName, destinationUrl, pinHash, email, now, now, cardId);
  return result.changes > 0;
}

export function updateDestination(cardId: string, newUrl: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE cards SET destination_url = ?, updated_at = ? WHERE card_id = ? AND status = 'ACTIVE'
  `).run(newUrl, now, cardId);
  return result.changes > 0;
}

export function updatePin(cardId: string, newPinHash: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE cards SET pin_hash = ?, updated_at = ? WHERE card_id = ? AND status = 'ACTIVE'
  `).run(newPinHash, now, cardId);
  return result.changes > 0;
}

export function disableCard(cardId: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE cards SET status = 'DISABLED', disabled_at = ?, updated_at = ? WHERE card_id = ?
  `).run(now, now, cardId);
  return result.changes > 0;
}

export function reactivateCard(cardId: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE cards SET status = 'ACTIVE', disabled_at = NULL, updated_at = ? WHERE card_id = ? AND status = 'DISABLED'
  `).run(now, cardId);
  return result.changes > 0;
}

export function generateCards(prefix: string, count: number): string[] {
  const db = getDb();
  const cardIds: string[] = [];
  
  const insert = db.prepare('INSERT INTO cards (card_id, status) VALUES (?, \'UNACTIVATED\')');
  
  const transaction = db.transaction(() => {
    // Find the highest existing number for this prefix
    const existing = db.prepare(
      "SELECT card_id FROM cards WHERE card_id LIKE ? ORDER BY card_id DESC LIMIT 1"
    ).get(`${prefix}%`) as { card_id: string } | undefined;
    
    let startNum = 1;
    if (existing) {
      const numPart = existing.card_id.replace(prefix, '');
      const parsed = parseInt(numPart, 10);
      if (!isNaN(parsed)) {
        startNum = parsed + 1;
      }
    }
    
    for (let i = 0; i < count; i++) {
      const num = startNum + i;
      const cardId = `${prefix}${num.toString().padStart(4, '0')}`;
      try {
        insert.run(cardId);
        cardIds.push(cardId);
      } catch {
        // Skip duplicates
      }
    }
  });
  
  transaction();
  return cardIds;
}

export function getAllCards(search?: string, status?: string): Card[] {
  const db = getDb();
  let query = 'SELECT * FROM cards';
  const conditions: string[] = [];
  const params: string[] = [];

  if (search) {
    conditions.push('(card_id LIKE ? OR business_name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (status && status !== 'ALL') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  return db.prepare(query).all(...params) as Card[];
}

export function getCardStats() {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) as count FROM cards').get() as { count: number }).count;
  const active = (db.prepare("SELECT COUNT(*) as count FROM cards WHERE status = 'ACTIVE'").get() as { count: number }).count;
  const unactivated = (db.prepare("SELECT COUNT(*) as count FROM cards WHERE status = 'UNACTIVATED'").get() as { count: number }).count;
  const disabled = (db.prepare("SELECT COUNT(*) as count FROM cards WHERE status = 'DISABLED'").get() as { count: number }).count;
  return { total, active, unactivated, disabled };
}

export function storeOtp(cardId: string, otpHash: string, expiresAt: string): void {
  const db = getDb();
  // Invalidate previous OTPs
  db.prepare("UPDATE otp_codes SET used = 1 WHERE card_id = ? AND used = 0").run(cardId);
  // Store new OTP
  db.prepare("INSERT INTO otp_codes (card_id, otp_hash, expires_at) VALUES (?, ?, ?)").run(cardId, otpHash, expiresAt);
}

export function getLatestOtp(cardId: string) {
  const db = getDb();
  return db.prepare(
    "SELECT * FROM otp_codes WHERE card_id = ? AND used = 0 AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1"
  ).get(cardId) as { id: number; otp_hash: string; expires_at: string } | undefined;
}

export function markOtpUsed(otpId: number): void {
  const db = getDb();
  db.prepare("UPDATE otp_codes SET used = 1 WHERE id = ?").run(otpId);
}

export function adminResetPin(cardId: string, newPinHash: string): boolean {
  const db = getDb();
  const now = new Date().toISOString();
  const result = db.prepare(`
    UPDATE cards SET pin_hash = ?, updated_at = ? WHERE card_id = ?
  `).run(newPinHash, now, cardId);
  return result.changes > 0;
}
