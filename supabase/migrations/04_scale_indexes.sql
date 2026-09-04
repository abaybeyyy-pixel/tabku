-- Migration: 04_scale_indexes.sql
-- Description: Indexes and optimizations for scaling up to 1,000,000 QR cards
-- Optimizes sorting by created_at, status filtering, print filtering, and tap aggregation.

-- 1. Index for pagination sorting (ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS idx_cards_created_at ON cards(created_at DESC);

-- 2. Compound indexes for combined status/printed filtering + pagination sorting
CREATE INDEX IF NOT EXISTS idx_cards_status_created_at ON cards(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_is_printed_created_at ON cards(is_printed, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cards_is_printed_desc_created_at ON cards(is_printed DESC NULLS LAST, created_at DESC);

-- 3. High-performance tap aggregation function (avoids pulling millions of rows over network)
CREATE OR REPLACE FUNCTION get_total_taps()
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(tap_count), 0)::BIGINT FROM cards;
$$ LANGUAGE sql SECURITY DEFINER;

-- Grant execution permission to all client roles
GRANT EXECUTE ON FUNCTION get_total_taps() TO anon, authenticated, service_role;
