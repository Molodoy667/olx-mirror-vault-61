-- Update seo_urls table for 8-character listing IDs
-- Migration: 20250130_update_seo_urls_structure.sql

-- 1. Оновлюємо структуру таблиці seo_urls
ALTER TABLE seo_urls ALTER COLUMN seo_id TYPE VARCHAR(8);

-- 2. Оновлюємо колонку full_url для більших URL
ALTER TABLE seo_urls ALTER COLUMN full_url TYPE VARCHAR(300);

-- 3. Очищуємо старі записи щоб перегенерувати з новими ID
DELETE FROM seo_urls WHERE LENGTH(seo_id) = 6;

-- 4. Створюємо функцію для автоматичного створення SEO URL при створенні оголошення
CREATE OR REPLACE FUNCTION create_seo_url_for_listing()
RETURNS TRIGGER AS $$
DECLARE
    listing_slug TEXT;
    listing_seo_id VARCHAR(8);
    full_url_path VARCHAR(300);
BEGIN
    -- Генеруємо slug з назви
    listing_slug := LOWER(TRIM(REGEXP_REPLACE(
        REGEXP_REPLACE(NEW.title, '[^a-zA-Z0-9\s\-а-яА-ЯіІїЇєЄ]', '', 'g'),
        '\s+', '-', 'g'
    )));
    
    -- Обрізаємо slug до 60 символів
    IF LENGTH(listing_slug) > 60 THEN
        listing_slug := SUBSTRING(listing_slug FROM 1 FOR 60);
    END IF;
    
    -- Видаляємо дефіси з кінців
    listing_slug := TRIM(BOTH '-' FROM listing_slug);
    
    -- Генеруємо seo_id з ID оголошення (перші 8 символів без дефісів)
    listing_seo_id := UPPER(SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8));
    
    -- Створюємо повний URL
    full_url_path := '/' || listing_slug || '-' || listing_seo_id;
    
    -- Вставляємо в таблицю seo_urls
    INSERT INTO seo_urls (listing_id, slug, seo_id, full_url)
    VALUES (NEW.id, listing_slug, listing_seo_id, full_url_path)
    ON CONFLICT (listing_id) DO UPDATE SET
        slug = EXCLUDED.slug,
        seo_id = EXCLUDED.seo_id,
        full_url = EXCLUDED.full_url,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Створюємо тригер для автоматичного створення SEO URL
DROP TRIGGER IF EXISTS trigger_create_seo_url ON listings;
CREATE TRIGGER trigger_create_seo_url
    AFTER INSERT OR UPDATE OF title ON listings
    FOR EACH ROW
    EXECUTE FUNCTION create_seo_url_for_listing();

-- 6. Перегенеруємо SEO URL для існуючих оголошень
DO $$
DECLARE
    listing_record RECORD;
BEGIN
    FOR listing_record IN 
        SELECT id, title FROM listings 
        WHERE id NOT IN (SELECT listing_id FROM seo_urls)
        LIMIT 100 -- Обробляємо по частинам щоб не перевантажити
    LOOP
        -- Виклик функції create_seo_url_for_listing для кожного оголошення
        PERFORM create_seo_url_for_listing() FROM (
            SELECT listing_record.id as id, listing_record.title as title
        ) as NEW;
    END LOOP;
END $$;

-- 7. Перевіряємо результат
SELECT 
    'SEO URLs updated successfully! ✅' as status,
    COUNT(*) as total_seo_urls,
    COUNT(CASE WHEN LENGTH(seo_id) = 8 THEN 1 END) as eight_char_ids
FROM seo_urls;

-- 8. Показуємо приклади створених SEO URL
SELECT 
    l.title,
    s.full_url,
    s.seo_id,
    l.id as listing_id
FROM seo_urls s
JOIN listings l ON s.listing_id = l.id
ORDER BY s.created_at DESC
LIMIT 5;

-- ✅ ГОТОВО! SEO URLs оновлені для 8-символьних ID!