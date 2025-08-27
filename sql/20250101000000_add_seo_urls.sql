-- Создание таблицы для SEO URL
CREATE TABLE IF NOT EXISTS seo_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  slug VARCHAR(100) NOT NULL,
  seo_id VARCHAR(6) NOT NULL,
  full_url VARCHAR(200) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(listing_id),
  UNIQUE(full_url)
);

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_seo_urls_listing_id ON seo_urls(listing_id);
CREATE INDEX IF NOT EXISTS idx_seo_urls_full_url ON seo_urls(full_url);
CREATE INDEX IF NOT EXISTS idx_seo_urls_slug ON seo_urls(slug);

-- RLS политики
ALTER TABLE seo_urls ENABLE ROW LEVEL SECURITY;

-- Политика для чтения (все могут читать)
CREATE POLICY "Allow public read access to seo_urls" ON seo_urls
  FOR SELECT USING (true);

-- Политика для создания (только владелец объявления)
CREATE POLICY "Allow listing owner to create seo_urls" ON seo_urls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

-- Политика для обновления (только владелец объявления)
CREATE POLICY "Allow listing owner to update seo_urls" ON seo_urls
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

-- Политика для удаления (только владелец объявления)
CREATE POLICY "Allow listing owner to delete seo_urls" ON seo_urls
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE id = listing_id AND user_id = auth.uid()
    )
  );

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_seo_urls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления updated_at
CREATE TRIGGER update_seo_urls_updated_at
  BEFORE UPDATE ON seo_urls
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_urls_updated_at();

-- Функция для генерации уникального SEO ID
CREATE OR REPLACE FUNCTION generate_unique_seo_id()
RETURNS VARCHAR(6) AS $$
DECLARE
  seo_id VARCHAR(6);
  counter INTEGER := 0;
BEGIN
  LOOP
    -- Генерируем случайный ID
    seo_id := array_to_string(
      ARRAY(
        SELECT chr((65 + round(random() * 25))::integer) 
        FROM generate_series(1, 3)
        UNION ALL
        SELECT chr((97 + round(random() * 25))::integer) 
        FROM generate_series(1, 3)
      ), ''
    );
    
    -- Проверяем уникальность
    IF NOT EXISTS (SELECT 1 FROM seo_urls WHERE seo_id = seo_id) THEN
      RETURN seo_id;
    END IF;
    
    -- Защита от бесконечного цикла
    counter := counter + 1;
    IF counter > 100 THEN
      RAISE EXCEPTION 'Could not generate unique SEO ID after 100 attempts';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;