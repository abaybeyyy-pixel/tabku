-- Migration: 02_add_tap_analytics.sql
-- Description: Add tap_count, qr_count, and last_tapped_at columns for card interaction tracking (both NFC tap and QR scan)

ALTER TABLE cards ADD COLUMN IF NOT EXISTS tap_count BIGINT DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS qr_count BIGINT DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS last_tapped_at TIMESTAMPTZ;

-- Index on tap_count and qr_count for analytics sorting
CREATE INDEX IF NOT EXISTS idx_cards_tap_count ON cards(tap_count);
CREATE INDEX IF NOT EXISTS idx_cards_qr_count ON cards(qr_count);

-- Drop previous function signatures to avoid parameter conflicts
DROP FUNCTION IF EXISTS increment_card_tap(TEXT);
DROP FUNCTION IF EXISTS increment_card_tap(TEXT, BOOLEAN);

-- Atomic increment function with SECURITY DEFINER so anonymous taps/scans can execute
CREATE OR REPLACE FUNCTION increment_card_tap(target_card_id TEXT, is_qr BOOLEAN DEFAULT FALSE)
RETURNS BIGINT AS $$
DECLARE
  updated_count BIGINT;
BEGIN
  UPDATE cards
  SET tap_count = COALESCE(tap_count, 0) + 1,
      qr_count = CASE WHEN is_qr THEN COALESCE(qr_count, 0) + 1 ELSE COALESCE(qr_count, 0) END,
      last_tapped_at = NOW()
  WHERE card_id = target_card_id
  RETURNING tap_count INTO updated_count;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to public / anonymous visitors
GRANT EXECUTE ON FUNCTION increment_card_tap(TEXT, BOOLEAN) TO anon, authenticated, service_role;
