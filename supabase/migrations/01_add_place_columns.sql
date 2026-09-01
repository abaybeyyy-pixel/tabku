-- Add Google Places API columns to cards table
ALTER TABLE cards ADD COLUMN IF NOT EXISTS place_id TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS business_address TEXT;
