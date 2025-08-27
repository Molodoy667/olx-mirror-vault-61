-- Add index to improve search performance on listings
CREATE INDEX IF NOT EXISTS idx_listings_search ON public.listings USING gin((title || ' ' || COALESCE(description, '')) gin_trgm_ops);

-- Add index for active status filtering
CREATE INDEX IF NOT EXISTS idx_listings_status_active ON public.listings (status) WHERE status = 'active';

-- Add composite index for promoted listings ordering
CREATE INDEX IF NOT EXISTS idx_listings_promoted_created ON public.listings (is_promoted DESC, created_at DESC) WHERE status = 'active';

-- Enable the pg_trgm extension if not already enabled (for better text search)
CREATE EXTENSION IF NOT EXISTS pg_trgm;