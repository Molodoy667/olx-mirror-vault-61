-- Bulk create SEO URLs for existing listings that don't have them
-- Масове створення SEO URLs для існуючих оголошень

-- Function to create SEO URLs for all listings without them
CREATE OR REPLACE FUNCTION bulk_create_seo_urls()
RETURNS TABLE(
  listing_id UUID,
  title TEXT,
  seo_url TEXT,
  status TEXT
) AS $$
DECLARE
  listing_record RECORD;
  slug_text TEXT;
  seo_id_text TEXT;
  full_url_text TEXT;
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  i INTEGER;
BEGIN
  -- Loop through all listings without SEO URLs
  FOR listing_record IN 
    SELECT l.id, l.title
    FROM listings l
    LEFT JOIN seo_urls s ON l.id = s.listing_id
    WHERE s.listing_id IS NULL
      AND l.status = 'active'
  LOOP
    -- Generate slug from title (transliteration and cleanup)
    slug_text := lower(trim(listing_record.title));
    
    -- Basic transliteration (Ukrainian to Latin)
    slug_text := replace(slug_text, 'а', 'a');
    slug_text := replace(slug_text, 'б', 'b');
    slug_text := replace(slug_text, 'в', 'v');
    slug_text := replace(slug_text, 'г', 'h');
    slug_text := replace(slug_text, 'ґ', 'g');
    slug_text := replace(slug_text, 'д', 'd');
    slug_text := replace(slug_text, 'е', 'e');
    slug_text := replace(slug_text, 'є', 'ye');
    slug_text := replace(slug_text, 'ж', 'zh');
    slug_text := replace(slug_text, 'з', 'z');
    slug_text := replace(slug_text, 'и', 'y');
    slug_text := replace(slug_text, 'і', 'i');
    slug_text := replace(slug_text, 'ї', 'yi');
    slug_text := replace(slug_text, 'й', 'y');
    slug_text := replace(slug_text, 'к', 'k');
    slug_text := replace(slug_text, 'л', 'l');
    slug_text := replace(slug_text, 'м', 'm');
    slug_text := replace(slug_text, 'н', 'n');
    slug_text := replace(slug_text, 'о', 'o');
    slug_text := replace(slug_text, 'п', 'p');
    slug_text := replace(slug_text, 'р', 'r');
    slug_text := replace(slug_text, 'с', 's');
    slug_text := replace(slug_text, 'т', 't');
    slug_text := replace(slug_text, 'у', 'u');
    slug_text := replace(slug_text, 'ф', 'f');
    slug_text := replace(slug_text, 'х', 'kh');
    slug_text := replace(slug_text, 'ц', 'ts');
    slug_text := replace(slug_text, 'ч', 'ch');
    slug_text := replace(slug_text, 'ш', 'sh');
    slug_text := replace(slug_text, 'щ', 'shch');
    slug_text := replace(slug_text, 'ь', '');
    slug_text := replace(slug_text, 'ю', 'yu');
    slug_text := replace(slug_text, 'я', 'ya');
    
    -- Clean up slug
    slug_text := regexp_replace(slug_text, '[^a-z0-9\s-]', '', 'g');
    slug_text := regexp_replace(slug_text, '\s+', '-', 'g');
    slug_text := regexp_replace(slug_text, '-+', '-', 'g');
    slug_text := trim(both '-' from slug_text);
    slug_text := substring(slug_text from 1 for 60);
    
    -- Generate random 6-character ID
    seo_id_text := '';
    FOR i IN 1..6 LOOP
      seo_id_text := seo_id_text || substring(chars from (floor(random() * length(chars)) + 1) for 1);
    END LOOP;
    
    -- Construct full URL
    full_url_text := '/' || slug_text || '-' || seo_id_text;
    
    -- Insert SEO URL
    BEGIN
      INSERT INTO seo_urls (listing_id, slug, seo_id, full_url)
      VALUES (listing_record.id, slug_text, seo_id_text, full_url_text);
      
      -- Return success record
      listing_id := listing_record.id;
      title := listing_record.title;
      seo_url := full_url_text;
      status := 'created';
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Return error record
      listing_id := listing_record.id;
      title := listing_record.title;
      seo_url := '';
      status := 'error: ' || SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION bulk_create_seo_urls() TO authenticated;

-- Run the function to create SEO URLs for existing listings
-- Uncomment the line below to execute immediately:
-- SELECT * FROM bulk_create_seo_urls();

-- Check results
SELECT 
  'Total listings' as metric,
  COUNT(*) as count
FROM listings 
WHERE status = 'active'
UNION ALL
SELECT 
  'Listings with SEO URLs' as metric,
  COUNT(*) as count
FROM listings l
JOIN seo_urls s ON l.id = s.listing_id
WHERE l.status = 'active'
UNION ALL
SELECT 
  'Listings without SEO URLs' as metric,
  COUNT(*) as count
FROM listings l
LEFT JOIN seo_urls s ON l.id = s.listing_id
WHERE l.status = 'active' AND s.listing_id IS NULL;

-- Sample of created SEO URLs
SELECT 
  l.title,
  s.full_url,
  s.created_at
FROM listings l
JOIN seo_urls s ON l.id = s.listing_id
ORDER BY s.created_at DESC
LIMIT 10;