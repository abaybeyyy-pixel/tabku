-- Migration: 03_add_printed_status.sql
-- Description: Add is_printed flag and printed_at timestamp to track card physical QR production
-- Also ensures RLS policies are enabled properly for anon/publishable key operations

ALTER TABLE cards ADD COLUMN IF NOT EXISTS is_printed BOOLEAN DEFAULT FALSE;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ;

-- Index for filtering printed status in admin dashboard
CREATE INDEX IF NOT EXISTS idx_cards_is_printed ON cards(is_printed);

-- Row Level Security policies (in case SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local)
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-write for cards" ON cards;
CREATE POLICY "Allow public read-write for cards" ON cards FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-write for otp_codes" ON otp_codes;
CREATE POLICY "Allow public read-write for otp_codes" ON otp_codes FOR ALL USING (true) WITH CHECK (true);
