-- Add simple indexes to improve performance
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_title ON public.listings (title);
CREATE INDEX IF NOT EXISTS idx_listings_promoted_created ON public.listings (is_promoted DESC, created_at DESC) WHERE status = 'active';