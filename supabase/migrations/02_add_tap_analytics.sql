-- Migration: 02_add_tap_analytics.sql
-- Description: Add tap_count and last_tapped_at columns for card interaction tracking

ALTER TABLE cards ADD COLUMN IF NOT EXISTS tap_count BIGINT DEFAULT 0;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS last_tapped_at TIMESTAMPTZ;

-- Create index on tap_count for analytics sorting if needed
CREATE INDEX IF NOT EXISTS idx_cards_tap_count ON cards(tap_count);

-- Optional atomic increment function
CREATE OR REPLACE FUNCTION increment_card_tap(target_card_id TEXT)
RETURNS BIGINT AS $$
DECLARE
  updated_count BIGINT;
BEGIN
  UPDATE cards
  SET tap_count = COALESCE(tap_count, 0) + 1,
      last_tapped_at = NOW()
  WHERE card_id = target_card_id
  RETURNING tap_count INTO updated_count;
  
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
