-- Міграція: Покращення продуктивності БД
-- Дата: 2025-01-28
-- Опис: Додає індекси та оптимізації для кращої швидкості

-- ПЕРЕД ЗАСТОСУВАННЯМ: перевірити що таблиці існують!

-- 1. Покращення пошуку в listings (якщо таблиця існує)
DO $$
BEGIN
  -- Перевіряємо чи існує таблиця listings
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'listings' AND table_schema = 'public') THEN
    
    -- Індекс для швидкого пошуку по статусу
    CREATE INDEX IF NOT EXISTS idx_listings_status_created 
    ON public.listings (status, created_at DESC) 
    WHERE status IN ('active', 'pending');
    
    -- Індекс для пошуку по категоріях
    CREATE INDEX IF NOT EXISTS idx_listings_category_status 
    ON public.listings (category_id, status, created_at DESC) 
    WHERE status = 'active';
    
    -- Індекс для пошуку по користувачу
    CREATE INDEX IF NOT EXISTS idx_listings_user_status 
    ON public.listings (user_id, status, created_at DESC);
    
    -- Часткові індекси для різних статусів
    CREATE INDEX IF NOT EXISTS idx_listings_active_promoted 
    ON public.listings (is_promoted DESC, created_at DESC) 
    WHERE status = 'active';
    
    RAISE NOTICE '✅ Індекси для listings створено';
  ELSE
    RAISE NOTICE '⚠️ Таблиця listings не знайдена, пропускаємо';
  END IF;
END $$;

-- 2. Покращення для користувачів (profiles)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
    
    -- Індекс для пошуку по email
    CREATE INDEX IF NOT EXISTS idx_profiles_email 
    ON public.profiles (email) 
    WHERE email IS NOT NULL;
    
    -- Індекс для активних користувачів
    CREATE INDEX IF NOT EXISTS idx_profiles_created 
    ON public.profiles (created_at DESC);
    
    RAISE NOTICE '✅ Індекси для profiles створено';
  ELSE
    RAISE NOTICE '⚠️ Таблиця profiles не знайдена';
  END IF;
END $$;

-- 3. Покращення для категорій
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
    
    -- Індекс для активних категорій
    CREATE INDEX IF NOT EXISTS idx_categories_active 
    ON public.categories (is_active, sort_order) 
    WHERE is_active = true;
    
    RAISE NOTICE '✅ Індекси для categories створено';
  ELSE
    RAISE NOTICE '⚠️ Таблиця categories не знайдена';
  END IF;
END $$;

-- 4. Загальні покращення
-- Увімкнути розширення для кращого текстового пошуку
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 5. Функція для очищення статистики (опційно)
CREATE OR REPLACE FUNCTION public.update_table_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  table_name TEXT;
BEGIN
  -- Оновлюємо статистику для всіх таблиць
  FOR table_name IN 
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE 'ANALYZE public.' || quote_ident(table_name);
    RAISE NOTICE 'Оновлено статистику для таблиці: %', table_name;
  END LOOP;
END;
$$;

-- 6. Створення функції для моніторингу розміру таблиць
CREATE OR REPLACE FUNCTION public.get_table_sizes()
RETURNS TABLE (
  таблиця TEXT,
  розмір TEXT,
  кількість_рядків BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    pg_size_pretty(pg_total_relation_size('public.'||t.tablename))::TEXT,
    COALESCE(s.n_live_tup, 0)::BIGINT
  FROM pg_tables t
  LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
  WHERE t.schemaname = 'public'
  ORDER BY pg_total_relation_size('public.'||t.tablename) DESC;
END;
$$;

-- Коментарі
COMMENT ON FUNCTION public.update_table_stats() IS 'Оновлює статистику для всіх таблиць в public схемі';
COMMENT ON FUNCTION public.get_table_sizes() IS 'Показує розміри всіх таблиць та кількість рядків';

-- Кінцеве повідомлення
DO $$
BEGIN
  RAISE NOTICE '🚀 Міграція покращення продуктивності завершена!';
  RAISE NOTICE '📊 Рекомендуємо запустити: SELECT * FROM public.get_table_sizes();';
END $$;