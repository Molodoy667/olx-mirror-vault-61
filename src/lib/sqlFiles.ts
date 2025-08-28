// SQL Files Management Utilities

export interface SQLFile {
  name: string;
  content: string;
  size: number;
  lastModified: string;
  status?: 'idle' | 'running' | 'success' | 'error';
  result?: any;
  error?: string;
  executionTime?: number;
}

// В реальной среде это бы работало с файловой системой
// Пока что возвращаем статические данные
export async function loadSQLFiles(): Promise<SQLFile[]> {
  try {
    // Отримуємо список видалених файлів з localStorage
    const deletedFiles = JSON.parse(localStorage.getItem('deletedSQLFiles') || '[]') as string[];
    
    // В production это бы был API вызов к серверу
    // Для демонстрации возвращаем статические файлы
    const staticFiles: SQLFile[] = [
      {
        name: 'example_analytics.sql',
        content: await getFileContent('example_analytics.sql'),
        size: 2048,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: 'seo_urls_setup.sql',
        content: await getFileContent('seo_urls_setup.sql'), 
        size: 1024,
        lastModified: new Date(Date.now() - 86400000).toISOString(),
        status: 'idle'
      },
      {
        name: 'apply_seo_migration.sql',
        content: await getFileContent('apply_seo_migration.sql'),
        size: 512,
        lastModified: new Date(Date.now() - 172800000).toISOString(), 
        status: 'idle'
      },
      {
        name: 'database_schema_analysis.sql',
        content: await getFileContent('database_schema_analysis.sql'),
        size: 4096,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: 'quick_schema_check.sql',
        content: await getFileContent('quick_schema_check.sql'),
        size: 2048,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: '20250128_create_schema_views.sql',
        content: await getFileContent('20250128_create_schema_views.sql'),
        size: 8192,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: '20250128_improve_performance.sql',
        content: await getFileContent('20250128_improve_performance.sql'),
        size: 6144,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: '20250128_create_db_analysis_functions.sql',
        content: await getFileContent('20250128_create_db_analysis_functions.sql'),
        size: 12288,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: '20250128_create_exec_sql_function.sql',
        content: await getFileContent('20250128_create_exec_sql_function.sql'),
        size: 16384,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: 'database_full_analysis.sql',
        content: await getFileContent('database_full_analysis.sql'),
        size: 8192,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: '20250128_create_full_database_manager.sql',
        content: await getFileContent('20250128_create_full_database_manager.sql'),
        size: 32768,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: 'debug_database_manager.sql',
        content: await getFileContent('debug_database_manager.sql'),
        size: 4096,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: 'simple_database_manager.sql',
        content: await getFileContent('simple_database_manager.sql'),
        size: 8192,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: 'test_exec_sql.sql',
        content: await getFileContent('test_exec_sql.sql'),
        size: 2048,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: 'create_exec_sql_function.sql',
        content: await getFileContent('create_exec_sql_function.sql'),
        size: 4096,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: 'all_in_one_database_setup.sql',
        content: await getFileContent('all_in_one_database_setup.sql'),
        size: 8192,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: '20250828_bulk_create_seo_urls.sql',
        content: await getFileContent('20250828_bulk_create_seo_urls.sql'),
        size: 16384,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: 'create_seo_urls_table.sql',
        content: await getFileContent('create_seo_urls_table.sql'),
        size: 4096,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: '20250130_add_last_seen_to_profiles.sql',
        content: await getFileContent('20250130_add_last_seen_to_profiles.sql'),
        size: 8192,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: '20250130_add_email_to_profiles.sql',
        content: await getFileContent('20250130_add_email_to_profiles.sql'),
        size: 6144,
        lastModified: new Date().toISOString(),
        status: 'idle'
      },
      {
        name: '20250130_create_notifications_system.sql',
        content: await getFileContent('20250130_create_notifications_system.sql'),
        size: 12288,
        lastModified: new Date().toISOString(),
        status: 'idle'
      }
    ];

    // Фільтруємо видалені файли
    const filteredFiles = staticFiles.filter(file => !deletedFiles.includes(file.name));
    
    return filteredFiles;
  } catch (error) {
    console.error('Error loading SQL files:', error);
    return [];
  }
}

async function getFileContent(fileName: string): Promise<string> {
  // Статическое содержимое файлов для демонстрации
  const contents: { [key: string]: string } = {
    'example_analytics.sql': `-- Example Analytics Query
-- Анализ активности пользователей и объявлений

-- 1. Статистика пользователей по месяцам
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as users_count,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users
FROM auth.users 
WHERE created_at >= NOW() - INTERVAL '6 months'
GROUP BY month 
ORDER BY month DESC;

-- 2. Топ категории по количеству объявлений
SELECT 
  c.name as category_name,
  COUNT(l.*) as listings_count,
  COUNT(l.*) FILTER (WHERE l.status = 'active') as active_listings,
  ROUND(AVG(l.price), 2) as avg_price
FROM categories c
LEFT JOIN listings l ON c.id = l.category_id
GROUP BY c.id, c.name
ORDER BY listings_count DESC
LIMIT 10;`,

    'seo_urls_setup.sql': `-- SEO URLs Setup
-- Настройка SEO-дружественных URL

CREATE OR REPLACE FUNCTION setup_seo_urls() 
RETURNS void AS $$
BEGIN
  -- Создаем функцию для генерации slug
  CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
  RETURNS TEXT AS $func$
  BEGIN
    RETURN lower(
      regexp_replace(
        regexp_replace(input_text, '[^a-zA-Z0-9а-яё\\s-]', '', 'gi'),
        '\\s+', '-', 'g'
      )
    );
  END;
  $func$ LANGUAGE plpgsql;

  -- Добавляем slug колонку к listings если не существует
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'listings' AND column_name = 'slug'
  ) THEN
    ALTER TABLE listings ADD COLUMN slug TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug);
  END IF;

  -- Обновляем существующие записи
  UPDATE listings 
  SET slug = generate_slug(title || '-' || id::text)
  WHERE slug IS NULL;

END;
$$ LANGUAGE plpgsql;`,

    'apply_seo_migration.sql': `-- Apply SEO Migration
-- Применение SEO миграции

-- Запускаем настройку SEO URLs
SELECT setup_seo_urls();

-- Создаем индексы для улучшения производительности
CREATE INDEX IF NOT EXISTS idx_listings_slug_status ON listings(slug, status);
CREATE INDEX IF NOT EXISTS idx_listings_category_slug ON listings(category_id, slug);

-- Добавляем триггер для автоматической генерации slug
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title || '-' || NEW.id::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_slug ON listings;
CREATE TRIGGER trigger_auto_generate_slug 
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION auto_generate_slug();

-- Обновляем статистику таблиц
ANALYZE listings;

SELECT 'SEO migration applied successfully' as result;`,

    'database_schema_analysis.sql': `-- Повний аналіз схеми бази даних
-- Використовуйте цей файл для детального вивчення структури БД

-- 1. ВСІ ТАБЛИЦІ В БД
SELECT tablename as "📁 Таблиці" FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- 2. КОЛОНКИ КОЖНОЇ ТАБЛИЦІ  
SELECT 
  table_name as "🏗️ Таблиця",
  column_name as "📋 Колонка", 
  data_type as "📊 Тип",
  is_nullable as "❓ NULL",
  column_default as "🔧 За замовчуванням"
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- 3. FOREIGN KEY ЗВ'ЯЗКИ
SELECT 
  tc.table_name as "📝 Таблиця",
  kcu.column_name as "🔗 Колонка",
  ccu.table_name as "🎯 Зовнішня таблиця",
  ccu.column_name as "🎯 Зовнішня колонка"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';`,

    'quick_schema_check.sql': `-- Швидка перевірка основних таблиць
-- Запустіть для швидкого огляду БД

-- Список всіх таблиць
SELECT '📋 ТАБЛИЦІ В БД:' as info;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Перевірка основних таблиць OLX
SELECT '🔍 ПЕРЕВІРКА ОСНОВНИХ ТАБЛИЦЬ:' as info;

SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'profiles') 
    THEN '✅ profiles (користувачі)' 
    ELSE '❌ profiles відсутня' END as "Користувачі";

SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'listings') 
    THEN '✅ listings (оголошення)' 
    ELSE '❌ listings відсутня' END as "Оголошення";

SELECT 
  CASE WHEN EXISTS(SELECT 1 FROM pg_tables WHERE tablename = 'categories') 
    THEN '✅ categories (категорії)' 
    ELSE '❌ categories відсутня' END as "Категорії";`,

    '20250128_create_schema_views.sql': `-- МІГРАЦІЯ: Створення view для аналізу схеми
-- Ця міграція створює зручні view та функції для аналізу БД

-- 1. View загального огляду таблиць
CREATE OR REPLACE VIEW v_schema_overview AS
SELECT 
  table_name as таблиця,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as колонок
FROM information_schema.tables t
WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. Функція опису таблиці
CREATE OR REPLACE FUNCTION describe_table(table_name_param TEXT)
RETURNS TABLE (колонка TEXT, тип TEXT, nullable TEXT, за_замовчуванням TEXT)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT c.column_name, c.data_type, c.is_nullable, c.column_default
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = table_name_param
  ORDER BY c.ordinal_position;
END; $$;

SELECT 'Schema views створено успішно!' as result;`,

    '20250128_improve_performance.sql': `-- МІГРАЦІЯ: Покращення продуктивності
-- Додає індекси та оптимізації

-- Індекси для listings (якщо існує)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'listings') THEN
    CREATE INDEX IF NOT EXISTS idx_listings_status_created ON listings (status, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_listings_category ON listings (category_id, status);
    RAISE NOTICE 'Індекси для listings створено';
  END IF;
END $$;

-- Індекси для profiles (якщо існує)  
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'profiles') THEN
    CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles (email);
    RAISE NOTICE 'Індекси для profiles створено';
  END IF;
END $$;

-- Розширення для текстового пошуку
CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT 'Міграція продуктивності завершена!' as result;`,

    '20250128_create_db_analysis_functions.sql': `-- МІГРАЦІЯ: RPC функції для аналізу БД
-- Створює безпечні функції для автоматичного аналізу структури БД

-- 1. Функція списку таблиць
CREATE OR REPLACE FUNCTION public.get_tables_info()
RETURNS TABLE (table_name TEXT, column_count BIGINT, has_primary_key BOOLEAN, estimated_rows BIGINT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT t.tablename::TEXT, 
    (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.tablename)::BIGINT,
    EXISTS(SELECT 1 FROM information_schema.table_constraints tc WHERE tc.table_name = t.tablename AND tc.constraint_type = 'PRIMARY KEY'),
    COALESCE(s.n_live_tup, 0)::BIGINT
  FROM pg_tables t
  LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
  WHERE t.schemaname = 'public' ORDER BY t.tablename;
END; $$;

-- 2. Функція колонок таблиці
CREATE OR REPLACE FUNCTION public.get_table_columns(table_name_param TEXT)
RETURNS TABLE (column_name TEXT, data_type TEXT, is_nullable BOOLEAN, column_default TEXT, is_primary_key BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT c.column_name::TEXT, c.data_type::TEXT,
    CASE WHEN c.is_nullable = 'YES' THEN TRUE ELSE FALSE END,
    c.column_default::TEXT,
    EXISTS(SELECT 1 FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_name = table_name_param AND tc.constraint_type = 'PRIMARY KEY' AND kcu.column_name = c.column_name)
  FROM information_schema.columns c
  WHERE c.table_schema = 'public' AND c.table_name = table_name_param
  ORDER BY c.ordinal_position;
END; $$;

-- 3. Функція повного аналізу
CREATE OR REPLACE FUNCTION public.analyze_database_schema()
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'tables', (SELECT json_agg(row_to_json(t)) FROM public.get_tables_info() t),
    'analyzed_at', now(),
    'total_tables', (SELECT count(*) FROM public.get_tables_info())
  ) INTO result;
  RETURN result;
END; $$;

-- Права доступу
GRANT EXECUTE ON FUNCTION public.get_tables_info() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_columns(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.analyze_database_schema() TO authenticated;

SELECT 'RPC функції створено!' as result;`,

    '20250128_create_exec_sql_function.sql': `-- МІГРАЦІЯ: Функція exec_sql для SQL Manager
-- Вирішує помилку: Could not find the function public.exec_sql(sql_query) in the schema cache

-- Головна функція для виконання SQL запитів
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result_data JSON;
  affected_rows INTEGER := 0;
  execution_time_ms INTEGER;
  execution_start TIMESTAMP;
  query_type TEXT;
BEGIN
  execution_start := clock_timestamp();
  query_type := UPPER(TRIM(SPLIT_PART(sql_query, ' ', 1)));
  
  -- Обмеження безпеки
  IF query_type IN ('DROP', 'TRUNCATE', 'DELETE') AND sql_query NOT LIKE '%WHERE%' THEN
    RETURN json_build_object('success', false, 'message', 'Небезпечна операція без WHERE умови');
  END IF;
  
  BEGIN
    IF query_type = 'SELECT' OR query_type = 'WITH' THEN
      EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || sql_query || ') t' INTO result_data;
      EXECUTE 'SELECT COUNT(*) FROM (' || sql_query || ') t' INTO affected_rows;
    ELSE
      EXECUTE sql_query;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      result_data := json_build_object('message', 'Запит виконано успішно');
    END IF;
    
    execution_time_ms := EXTRACT(MILLISECONDS FROM (clock_timestamp() - execution_start))::INTEGER;
    
    RETURN json_build_object(
      'success', true,
      'data', COALESCE(result_data, '[]'::json),
      'affected_rows', affected_rows,
      'execution_time_ms', execution_time_ms,
      'message', 'Запит виконано успішно'
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Помилка: ' || SQLERRM,
      'error', SQLSTATE
    );
  END;
END; $$;

-- Додаткові функції
CREATE OR REPLACE FUNCTION public.exec_select(sql_query TEXT, row_limit INTEGER DEFAULT 100)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result_data JSON; total_rows INTEGER;
BEGIN
  EXECUTE 'SELECT COUNT(*) FROM (' || sql_query || ') t' INTO total_rows;
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || sql_query || ' LIMIT ' || row_limit || ') t' INTO result_data;
  RETURN json_build_object('success', true, 'data', result_data, 'total_rows', total_rows);
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'message', SQLERRM);
END; $$;

-- Права доступу
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_select(TEXT, INTEGER) TO authenticated;

SELECT 'Функція exec_sql створена успішно!' as result;`,

    'database_full_analysis.sql': `-- ПОВНИЙ АНАЛІЗ СТРУКТУРИ БД
-- Детальний огляд всіх таблиць, колонок, індексів та зв'язків

-- 1. Загальна статистика
SELECT 
  'Таблиці' as тип,
  count(*) as кількість
FROM pg_tables WHERE schemaname = 'public'
UNION ALL
SELECT 'Функції', count(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public';

-- 2. Список таблиць з деталями
SELECT 
  t.tablename as "📁 Таблиця",
  (SELECT count(*) FROM information_schema.columns c WHERE c.table_name = t.tablename) as "📋 Колонок",
  COALESCE(s.n_live_tup, 0) as "📊 Рядків",
  pg_size_pretty(pg_total_relation_size('public.'||t.tablename)) as "💾 Розмір"
FROM pg_tables t
LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
WHERE t.schemaname = 'public'
ORDER BY s.n_live_tup DESC NULLS LAST;

-- 3. Детальна структура колонок
SELECT 
  table_name as "🏗️ Таблиця",
  column_name as "📝 Колонка",
  data_type as "📊 Тип",
  is_nullable as "❓ NULL",
  column_default as "🔧 За замовчуванням"
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 4. Foreign Key зв'язки
SELECT 
  tc.table_name as "📝 Таблиця",
  kcu.column_name as "📋 Колонка", 
  ccu.table_name as "🎯 Зовнішня таблиця",
  ccu.column_name as "🎯 Зовнішня колонка"
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';

-- 5. Індекси
SELECT 
  tablename as "📁 Таблиця",
  indexname as "⚡ Індекс",
  CASE WHEN indexdef LIKE '%UNIQUE%' THEN 'Унікальний' ELSE 'Звичайний' END as "Тип"
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. Підсумок
SELECT 
  (SELECT count(*) FROM pg_tables WHERE schemaname = 'public') as "📁 Всього таблиць",
  (SELECT count(*) FROM information_schema.columns WHERE table_schema = 'public') as "📋 Всього колонок",
  pg_size_pretty(pg_database_size(current_database())) as "💾 Розмір БД";`,

    '20250128_create_full_database_manager.sql': `-- 🗄️ ПОВНОЦІННИЙ DATABASE MANAGER
-- Створює RPC функції для повного управління базою даних
-- 📊 Перегляд таблиць, редагування даних, управління функціями

-- 1. СПИСОК ВСІХ ТАБЛИЦЬ З ДЕТАЛЯМИ
CREATE OR REPLACE FUNCTION public.get_all_tables()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  description TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    COALESCE(s.n_live_tup, 0) as row_count,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.tablename)::regclass))::TEXT,
    COALESCE(d.description, 'Немає опису')::TEXT
  FROM pg_tables t
  LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
  LEFT JOIN pg_description d ON d.objoid = quote_ident(t.tablename)::regclass
  WHERE t.schemaname = 'public'
  ORDER BY COALESCE(s.n_live_tup, 0) DESC;
END; $$;

-- 2. СТРУКТУРА ТАБЛИЦІ З FOREIGN KEYS
CREATE OR REPLACE FUNCTION public.get_table_structure(table_name_param TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT,
  is_primary_key BOOLEAN,
  is_foreign_key BOOLEAN,
  foreign_table TEXT,
  foreign_column TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    COALESCE(c.column_default, '')::TEXT,
    CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END,
    CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END,
    COALESCE(fk.foreign_table_name, '')::TEXT,
    COALESCE(fk.foreign_column_name, '')::TEXT
  FROM information_schema.columns c
  LEFT JOIN (SELECT ku.column_name FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_name = table_name_param) pk 
    ON c.column_name = pk.column_name
  LEFT JOIN (SELECT ku.column_name, ccu.table_name AS foreign_table_name, ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = table_name_param) fk 
    ON c.column_name = fk.column_name
  WHERE c.table_name = table_name_param AND c.table_schema = 'public'
  ORDER BY c.ordinal_position;
END; $$;

-- 3. ОТРИМАННЯ ДАНИХ З ПАГІНАЦІЄЮ
CREATE OR REPLACE FUNCTION public.get_table_data(
  table_name_param TEXT,
  page_number INT DEFAULT 1,
  page_size INT DEFAULT 50,
  search_query TEXT DEFAULT '',
  order_column TEXT DEFAULT '',
  order_direction TEXT DEFAULT 'ASC'
)
RETURNS TABLE (data JSONB, total_count BIGINT, page_count INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  offset_val INT;
  total_rows BIGINT;
  sql_query TEXT;
BEGIN
  offset_val := (page_number - 1) * page_size;
  
  -- Підрахунок загальної кількості
  EXECUTE format('SELECT COUNT(*) FROM %I', table_name_param) INTO total_rows;
  
  -- Основний запит
  sql_query := format('SELECT json_agg(row_to_json(%I.*)) FROM (SELECT * FROM %I LIMIT %s OFFSET %s) %I',
    table_name_param, table_name_param, page_size, offset_val, table_name_param);
  
  RETURN QUERY SELECT 
    COALESCE((SELECT json_agg FROM (EXECUTE sql_query) AS t(json_agg)), '[]'::jsonb),
    total_rows,
    CEIL(total_rows::NUMERIC / page_size)::INT;
END; $$;

-- ПРАВА ДОСТУПУ
GRANT EXECUTE ON FUNCTION public.get_all_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_structure(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_data(TEXT, INT, INT, TEXT, TEXT, TEXT) TO authenticated;

SELECT '✅ Database Manager RPC функції створені успішно!' as result;`,

    'debug_database_manager.sql': `-- 🔍 ДІАГНОСТИКА DATABASE MANAGER
-- Перевіряємо чи створені функції та чи працюють

-- 1. ПЕРЕВІРЯЄМО ЧИ ІСНУЮТЬ ФУНКЦІЇ
SELECT 
  'Перевірка функцій Database Manager:' as step,
  COUNT(*) as created_functions
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('get_all_tables', 'get_table_structure', 'get_table_data', 'get_all_functions');

-- 2. СПИСОК СТВОРЕНИХ ФУНКЦІЙ
SELECT 
  'Створені функції:' as info,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname LIKE '%get_%'
ORDER BY p.proname;

-- 3. ПРОСТИЙ ТЕСТ ТАБЛИЦЬ ЧЕРЕЗ СТАНДАРТНІ ЗАПИТИ
SELECT 
  'Прямий запит таблиць:' as direct_test,
  schemaname,
  tablename,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename
LIMIT 10;

-- 4. ПЕРЕВІРЯЄМО ПРАВА ДОСТУПУ
SELECT 
  'Права доступу на функції:' as permissions,
  p.proname,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname IN ('get_all_tables', 'get_table_structure', 'get_table_data', 'get_all_functions');

-- 5. ТЕСТ ВИКЛИКУ get_all_tables
SELECT * FROM public.get_all_tables() LIMIT 5;`,

    'simple_database_manager.sql': `-- 🔧 СПРОЩЕНА ВЕРСІЯ DATABASE MANAGER
-- Базові функції які точно працюватимуть

-- 1. ПРОСТА ФУНКЦІЯ ДЛЯ ОТРИМАННЯ ТАБЛИЦЬ
CREATE OR REPLACE FUNCTION public.get_simple_tables()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  description TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::TEXT,
    0::BIGINT as row_count,
    'Невідомо'::TEXT as table_size,
    'Базова таблиця'::TEXT as description
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
END; $$;

-- 2. ПРОСТА ФУНКЦІЯ ДЛЯ СТРУКТУРИ ТАБЛИЦІ
CREATE OR REPLACE FUNCTION public.get_simple_structure(table_name_param TEXT)
RETURNS TABLE (
  column_name TEXT,
  data_type TEXT,
  is_nullable TEXT,
  column_default TEXT,
  is_primary_key BOOLEAN,
  is_foreign_key BOOLEAN,
  foreign_table TEXT,
  foreign_column TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::TEXT,
    c.data_type::TEXT,
    c.is_nullable::TEXT,
    COALESCE(c.column_default, '')::TEXT,
    false::BOOLEAN as is_primary_key,
    false::BOOLEAN as is_foreign_key,
    ''::TEXT as foreign_table,
    ''::TEXT as foreign_column
  FROM information_schema.columns c
  WHERE c.table_name = table_name_param
    AND c.table_schema = 'public'
  ORDER BY c.ordinal_position;
END; $$;

-- 3. ПРОСТА ФУНКЦІЯ ДЛЯ ДАНИХ ТАБЛИЦІ
CREATE OR REPLACE FUNCTION public.get_simple_data(
  table_name_param TEXT,
  page_number INT DEFAULT 1,
  page_size INT DEFAULT 50
)
RETURNS TABLE (data JSONB, total_count BIGINT, page_count INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  offset_val INT;
  sql_query TEXT;
  result_data JSONB;
BEGIN
  offset_val := (page_number - 1) * page_size;
  
  sql_query := format(
    'SELECT json_agg(row_to_json(t.*)) FROM (SELECT * FROM %I LIMIT %s OFFSET %s) t',
    table_name_param, page_size, offset_val
  );
  
  EXECUTE sql_query INTO result_data;
  
  RETURN QUERY SELECT 
    COALESCE(result_data, '[]'::jsonb) as data,
    100::BIGINT as total_count,
    1::INT as page_count;
END; $$;

-- ПРАВА ДОСТУПУ
GRANT EXECUTE ON FUNCTION public.get_simple_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_simple_structure(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_simple_data(TEXT, INT, INT) TO authenticated;

-- ТЕСТ
SELECT 'Спрощені функції створені!' as result;
SELECT * FROM public.get_simple_tables() LIMIT 5;`,

    'test_exec_sql.sql': `-- 🧪 ТЕСТ ФУНКЦІЇ exec_sql
-- Перевіряємо чи працює виконання SQL через RPC

-- 1. ПРОСТИЙ ТЕСТ
SELECT 'Тест exec_sql працює!' as test_message, NOW() as current_time;

-- 2. ПЕРЕВІРКА ІСНУВАННЯ exec_sql ФУНКЦІЇ
SELECT 
  'exec_sql function check:' as info,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p 
      JOIN pg_namespace n ON p.pronamespace = n.oid 
      WHERE n.nspname = 'public' AND p.proname = 'exec_sql'
    ) 
    THEN '✅ exec_sql функція існує' 
    ELSE '❌ exec_sql функція НЕ існує' 
  END as status;

-- 3. СПИСОК ВСІХ PUBLIC ФУНКЦІЙ
SELECT 
  'Available functions:' as info,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname NOT LIKE 'pg_%'
ORDER BY p.proname;

-- 4. ТЕСТ СТВОРЕННЯ ПРОСТОЇ ФУНКЦІЇ
CREATE OR REPLACE FUNCTION public.test_function()
RETURNS TEXT LANGUAGE sql AS $$
  SELECT 'Test function created successfully!' as result;
$$;

-- 5. ВИКЛИК ТЕСТОВОЇ ФУНКЦІЇ
SELECT public.test_function() as test_result;`,

    'create_exec_sql_function.sql': `-- 🔧 СТВОРЕННЯ ФУНКЦІЇ exec_sql
-- Основна функція для виконання SQL запитів через RPC
-- ОБОВ'ЯЗКОВО виконайте цей файл ПЕРШИМ!

-- 1. СТВОРЮЄМО exec_sql ФУНКЦІЮ
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result JSON; row_count_val INTEGER; start_time TIMESTAMPTZ; execution_time INTEGER;
BEGIN
  start_time := clock_timestamp();
  EXECUTE sql_query;
  GET DIAGNOSTICS row_count_val = ROW_COUNT;
  execution_time := EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER;
  
  RETURN json_build_object('success', true, 'message', 'SQL виконано успішно', 'rows_affected', row_count_val, 'execution_time', execution_time);
EXCEPTION WHEN others THEN
  execution_time := EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER;
  RETURN json_build_object('success', false, 'error', SQLERRM, 'message', 'Помилка виконання SQL', 'execution_time', execution_time);
END; $$;

-- 2. НАДАЄМО ПРАВА ДОСТУПУ
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;

-- 3. ТЕСТУЄМО ФУНКЦІЮ
SELECT 'exec_sql функція створена успішно!' as status;
SELECT public.exec_sql('SELECT ''Тест успішний!'' as test_message') as test_result;
SELECT '✅ ГОТОВО! Тепер можете виконувати SQL файли через Файл Менеджер!' as final_message;`,

    'all_in_one_database_setup.sql': `-- 🚀 ВСЕ В ОДНОМУ - ПОВНА НАСТРОЙКА DATABASE MANAGER
-- Цей файл створює ВСЕ що потрібно для роботи Database Manager
-- Виконайте ТІЛЬКИ ЦЕЙ ФАЙЛ і все запрацює!

-- 1. СТВОРЮЄМО exec_sql ФУНКЦІЮ
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result JSON; row_count_val INTEGER; start_time TIMESTAMPTZ; execution_time INTEGER;
BEGIN
  start_time := clock_timestamp(); EXECUTE sql_query; GET DIAGNOSTICS row_count_val = ROW_COUNT;
  execution_time := EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER;
  RETURN json_build_object('success', true, 'message', 'SQL виконано успішно', 'rows_affected', row_count_val, 'execution_time', execution_time);
EXCEPTION WHEN others THEN
  execution_time := EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER;
  RETURN json_build_object('success', false, 'error', SQLERRM, 'message', 'Помилка виконання SQL', 'execution_time', execution_time);
END; $$;

-- 2. DATABASE MANAGER RPC ФУНКЦІЇ
CREATE OR REPLACE FUNCTION public.get_simple_tables()
RETURNS TABLE (table_name TEXT, row_count BIGINT, table_size TEXT, description TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT t.table_name::TEXT, 0::BIGINT, 'Невідомо'::TEXT, 'Базова таблиця'::TEXT
  FROM information_schema.tables t WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE' ORDER BY t.table_name;
END; $$;

CREATE OR REPLACE FUNCTION public.get_simple_structure(table_name_param TEXT)
RETURNS TABLE (column_name TEXT, data_type TEXT, is_nullable TEXT, column_default TEXT, is_primary_key BOOLEAN, is_foreign_key BOOLEAN, foreign_table TEXT, foreign_column TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT c.column_name::TEXT, c.data_type::TEXT, c.is_nullable::TEXT, COALESCE(c.column_default, '')::TEXT, false::BOOLEAN, false::BOOLEAN, ''::TEXT, ''::TEXT
  FROM information_schema.columns c WHERE c.table_name = table_name_param AND c.table_schema = 'public' ORDER BY c.ordinal_position;
END; $$;

CREATE OR REPLACE FUNCTION public.get_simple_data(table_name_param TEXT, page_number INT DEFAULT 1, page_size INT DEFAULT 50)
RETURNS TABLE (data JSONB, total_count BIGINT, page_count INT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE offset_val INT; sql_query TEXT; result_data JSONB; total_rows BIGINT;
BEGIN
  offset_val := (page_number - 1) * page_size;
  sql_query := format('SELECT json_agg(row_to_json(t.*)) FROM (SELECT * FROM %I LIMIT %s OFFSET %s) t', table_name_param, page_size, offset_val);
  EXECUTE sql_query INTO result_data;
  EXECUTE format('SELECT COUNT(*) FROM %I', table_name_param) INTO total_rows;
  RETURN QUERY SELECT COALESCE(result_data, '[]'::jsonb), total_rows, CEIL(total_rows::NUMERIC / page_size)::INT;
END; $$;

CREATE OR REPLACE FUNCTION public.get_all_functions()
RETURNS TABLE (function_name TEXT, arguments TEXT, return_type TEXT, language TEXT, function_type TEXT, description TEXT, source_code TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT p.proname::TEXT, pg_get_function_arguments(p.oid)::TEXT, pg_get_function_result(p.oid)::TEXT, l.lanname::TEXT,
    CASE WHEN p.prokind = 'f' THEN 'function' WHEN p.prokind = 'p' THEN 'procedure' ELSE 'other' END::TEXT,
    COALESCE(d.description, 'Немає опису')::TEXT, COALESCE(p.prosrc, 'Код недоступний')::TEXT
  FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid JOIN pg_language l ON p.prolang = l.oid
  LEFT JOIN pg_description d ON d.objoid = p.oid WHERE n.nspname = 'public' AND l.lanname != 'c' ORDER BY p.proname;
END; $$;

-- 3. ПРАВА ДОСТУПУ
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_simple_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_simple_structure(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_simple_data(TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_functions() TO authenticated;

-- 4. ТЕСТУВАННЯ
SELECT '🎉 ВСЕ СТВОРЕНО УСПІШНО!' as status;
SELECT 'Кількість таблиць: ' || COUNT(*)::TEXT as tables_count FROM public.get_simple_tables();
SELECT '✅ ГОТОВО! Перейдіть в Database Manager - таблиці мають з''явитися!' as final_result;`,
    
    '20250828_bulk_create_seo_urls.sql': `-- Bulk create SEO URLs for existing listings that don't have them
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
    slug_text := regexp_replace(slug_text, '[^a-z0-9\\s-]', '', 'g');
    slug_text := regexp_replace(slug_text, '\\s+', '-', 'g');
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
LIMIT 10;`,
    
    'create_seo_urls_table.sql': `-- 🔗 СТВОРЕННЯ ТАБЛИЦІ SEO_URLS
-- Швидке створення таблиці для SEO URLs системи

-- 1. Створення таблиці seo_urls
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

-- 2. Створення індексів для швидкого пошуку
CREATE INDEX IF NOT EXISTS idx_seo_urls_listing_id ON seo_urls(listing_id);
CREATE INDEX IF NOT EXISTS idx_seo_urls_full_url ON seo_urls(full_url);
CREATE INDEX IF NOT EXISTS idx_seo_urls_slug ON seo_urls(slug);

-- 3. Включення Row Level Security (RLS)
ALTER TABLE seo_urls ENABLE ROW LEVEL SECURITY;

-- 4. Створення політик безпеки
CREATE POLICY "Allow public read access to seo_urls" ON seo_urls
  FOR SELECT USING (true);

CREATE POLICY "Allow listing owner to create seo_urls" ON seo_urls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE id = listing_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Allow listing owner to update seo_urls" ON seo_urls
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE id = listing_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Allow listing owner to delete seo_urls" ON seo_urls
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM listings 
      WHERE id = listing_id 
      AND user_id = auth.uid()
    )
  );

-- 5. Тригер для оновлення updated_at
CREATE OR REPLACE FUNCTION update_seo_urls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_seo_urls_updated_at
  BEFORE UPDATE ON seo_urls
  FOR EACH ROW
  EXECUTE FUNCTION update_seo_urls_updated_at();

-- 6. Перевірка створення
SELECT 'Таблиця seo_urls створена успішно! ✅' as status;

-- 7. Інформація про таблицю
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'seo_urls' 
ORDER BY ordinal_position;

-- 8. Перевірка індексів
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'seo_urls';

-- ✅ ГОТОВО! Тепер можна використовувати SEO URLs систему.`,

    '20250130_add_last_seen_to_profiles.sql': `-- Add last_seen field to profiles table for online status tracking
-- Migration: 20250130_add_last_seen_to_profiles.sql
-- Purpose: Add online status tracking for users in chat

-- 1. Add last_seen column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON profiles(last_seen);

-- 3. Create function to update last_seen
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create trigger to automatically update last_seen on any profile update
DROP TRIGGER IF EXISTS trigger_update_last_seen ON profiles;
CREATE TRIGGER trigger_update_last_seen
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

-- 5. Function to manually update last_seen (for client calls)
CREATE OR REPLACE FUNCTION update_user_last_seen(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET last_seen = NOW() 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_last_seen(UUID) TO authenticated;

-- 7. Set initial last_seen for existing users
UPDATE profiles 
SET last_seen = NOW() 
WHERE last_seen IS NULL;

-- 8. Verification
SELECT 'last_seen column added successfully! ✅' as status;

-- 9. Check the results
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'last_seen';

-- 10. Test the function
SELECT update_user_last_seen(auth.uid()) as test_result;

-- 11. Show sample data
SELECT 
  id, 
  full_name, 
  last_seen,
  CASE 
    WHEN last_seen > NOW() - INTERVAL '5 minutes' THEN 'Онлайн'
    WHEN last_seen > NOW() - INTERVAL '1 hour' THEN 'Був нещодавно'
    WHEN last_seen > NOW() - INTERVAL '1 day' THEN 'Був сьогодні'
    ELSE 'Був давно'
  END as status
FROM profiles 
WHERE last_seen IS NOT NULL
ORDER BY last_seen DESC 
LIMIT 5;

-- ✅ ГОТОВО! Тепер користувачі мають статус онлайн/офлайн!`,

    '20250130_add_email_to_profiles.sql': `-- Add email field to profiles table for better login handling
-- Migration: 20250130_add_email_to_profiles.sql
-- Purpose: Add email field to profiles for username login functionality

-- 1. Add email column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Create index for efficient email queries
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- 3. Create index for efficient username queries
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- 4. Update existing profiles with email from auth.users
UPDATE profiles 
SET email = auth.users.email
FROM auth.users 
WHERE profiles.id = auth.users.id 
  AND profiles.email IS NULL;

-- 5. Create trigger to automatically set email when profile is created
CREATE OR REPLACE FUNCTION sync_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Get email from auth.users for the user_id
  SELECT email INTO NEW.email 
  FROM auth.users 
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger
DROP TRIGGER IF EXISTS trigger_sync_profile_email ON profiles;
CREATE TRIGGER trigger_sync_profile_email
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_email();

-- 7. Verification
SELECT 'email column added successfully! ✅' as status;

-- 8. Check the results
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'email';

-- 9. Check indexes
SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'profiles' 
  AND (indexname LIKE '%email%' OR indexname LIKE '%username%');

-- 10. Show sample data
SELECT 
  id, 
  full_name, 
  username,
  email,
  created_at
FROM profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- ✅ ГОТОВО! Тепер можна входити як через email, так і через username!`,

    '20250130_create_notifications_system.sql': `-- Create notifications system
-- Migration: 20250130_create_notifications_system.sql

-- 1. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- 3. Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Create function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_type VARCHAR(50),
  notification_title VARCHAR(255),
  notification_message TEXT DEFAULT NULL,
  notification_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (target_user_id, notification_type, notification_title, notification_message, notification_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Grant execute permission
GRANT EXECUTE ON FUNCTION create_notification(UUID, VARCHAR, VARCHAR, TEXT, JSONB) TO authenticated;

-- 7. Create trigger function for new message notifications
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Don't notify if user sends message to themselves
  IF NEW.sender_id = NEW.receiver_id THEN
    RETURN NEW;
  END IF;

  -- Create notification for receiver
  PERFORM create_notification(
    NEW.receiver_id,
    'new_message',
    'Нове повідомлення',
    'Ви отримали нове повідомлення',
    jsonb_build_object(
      'sender_id', NEW.sender_id,
      'message_id', NEW.id,
      'listing_id', NEW.listing_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger for new messages
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- 9. Create trigger function for favorites
CREATE OR REPLACE FUNCTION notify_new_favorite()
RETURNS TRIGGER AS $$
DECLARE
  listing_owner_id UUID;
  listing_title TEXT;
BEGIN
  -- Get listing owner and title
  SELECT user_id, title INTO listing_owner_id, listing_title
  FROM listings 
  WHERE id = NEW.listing_id;

  -- Don't notify if user favorites their own listing
  IF listing_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- Create notification for listing owner
  PERFORM create_notification(
    listing_owner_id,
    'favorite_added',
    'Додано до обраних',
    'Ваше оголошення "' || listing_title || '" додали до обраних',
    jsonb_build_object(
      'listing_id', NEW.listing_id,
      'user_id', NEW.user_id
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger for favorites
DROP TRIGGER IF EXISTS trigger_notify_new_favorite ON favorites;
CREATE TRIGGER trigger_notify_new_favorite
  AFTER INSERT ON favorites
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_favorite();

-- 11. Create function for listing view notifications (called manually)
CREATE OR REPLACE FUNCTION notify_listing_views(
  listing_id UUID,
  view_count INTEGER
)
RETURNS VOID AS $$
DECLARE
  listing_owner_id UUID;
  listing_title TEXT;
BEGIN
  -- Get listing owner and title
  SELECT user_id, title INTO listing_owner_id, listing_title
  FROM listings 
  WHERE id = listing_id;

  -- Create notification for listing owner
  PERFORM create_notification(
    listing_owner_id,
    'listing_views',
    'Нові перегляди',
    'Ваше оголошення "' || listing_title || '" переглядали ' || view_count || ' разів',
    jsonb_build_object(
      'listing_id', listing_id,
      'view_count', view_count
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Grant execute permission
GRANT EXECUTE ON FUNCTION notify_listing_views(UUID, INTEGER) TO authenticated;

-- 13. Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(notification_ids UUID[])
RETURNS VOID AS $$
BEGIN
  UPDATE notifications 
  SET is_read = TRUE, updated_at = NOW()
  WHERE id = ANY(notification_ids) AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Grant execute permission
GRANT EXECUTE ON FUNCTION mark_notifications_as_read(UUID[]) TO authenticated;

-- 15. Create function to clear old notifications
CREATE OR REPLACE FUNCTION clear_old_notifications(
  user_id_param UUID,
  days_old INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE user_id = user_id_param 
    AND created_at < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 16. Grant execute permission
GRANT EXECUTE ON FUNCTION clear_old_notifications(UUID, INTEGER) TO authenticated;

-- 17. Test notifications
SELECT 'Notification system created successfully! ✅' as status;

-- 18. Check the structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- ✅ ГОТОВО! Система сповіщень створена!`
  };

  return contents[fileName] || `-- SQL file: ${fileName}
-- Content not available in demo mode
-- In production, this would load actual file content

SELECT 'File content would be loaded here' as demo_message;`;
}

export async function executeSQLFile(fileName: string, content: string): Promise<any> {
  // РЕАЛЬНЕ ВИКОНАННЯ SQL ЧЕРЕЗ SUPABASE
  const { supabase } = await import('@/integrations/supabase/client');
  
  const startTime = Date.now();
  const warnings: string[] = [];
  
  try {
    // Аналізуємо SQL перед виконанням
    const sqlAnalysis = analyzeSQLContent(content);
    
    // Спробуємо виконати через exec_sql функцію
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: content
    });
    
    const executionTime = Date.now() - startTime;
    
    if (error) {
      console.error('Помилка виконання SQL:', error);
      
      // Детальний аналіз помилки
      const errorAnalysis = analyzeErrorMessage(error.message);
      
      return {
        success: false,
        message: `❌ Помилка виконання SQL`,
        error: error.message,
        executionTime,
        details: errorAnalysis.details,
        suggestion: errorAnalysis.suggestion,
        errorType: errorAnalysis.type
      };
    }
    
    // Аналізуємо результат
    let rowsAffected = 0;
    let resultMessage = '';
    
    if (Array.isArray(data)) {
      rowsAffected = data.length;
      resultMessage = `Отримано ${rowsAffected} рядків`;
    } else if (data && typeof data === 'object') {
      if (data.rowsAffected !== undefined) {
        rowsAffected = data.rowsAffected;
      } else if (data.command) {
        // PostgreSQL command result
        if (data.command === 'CREATE') {
          resultMessage = 'Об\'єкт створено успішно';
        } else if (data.command === 'INSERT') {
          rowsAffected = data.rowCount || 0;
          resultMessage = `Вставлено ${rowsAffected} рядків`;
        } else if (data.command === 'UPDATE') {
          rowsAffected = data.rowCount || 0;
          resultMessage = `Оновлено ${rowsAffected} рядків`;
        } else if (data.command === 'DELETE') {
          rowsAffected = data.rowCount || 0;
          resultMessage = `Видалено ${rowsAffected} рядків`;
        } else {
          resultMessage = `Команда ${data.command} виконана`;
        }
      } else {
        resultMessage = 'SQL виконано успішно';
      }
    } else {
      resultMessage = 'SQL виконано успішно';
    }
    
    // Додаємо попередження залежно від контенту
    if (sqlAnalysis.hasDropStatements && !sqlAnalysis.hasIfExists) {
      warnings.push('Використовується DROP без IF EXISTS - може спричинити помилки');
    }
    
    if (sqlAnalysis.hasAlterStatements) {
      warnings.push('Файл містить ALTER statements - перевірте сумісність зі схемою');
    }
    
    if (executionTime > 5000) {
      warnings.push(`Тривалий час виконання: ${executionTime}мс`);
    }
    
    return {
      success: true,
      message: resultMessage || `✅ SQL файл ${fileName} виконано успішно`,
      data: data,
      executionTime,
      rowsAffected,
      warnings: warnings.length > 0 ? warnings : undefined,
      tablesCreated: sqlAnalysis.tablesCreated,
      functionsCreated: sqlAnalysis.functionsCreated,
      analysisInfo: {
        statements: sqlAnalysis.statementCount,
        complexity: sqlAnalysis.complexity,
        safetyLevel: warnings.length === 0 ? 'safe' : 'warning'
      }
    };
    
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error('Критична помилка виконання SQL:', error);
    
    const errorAnalysis = analyzeErrorMessage(error.message);
    
    return {
      success: false,
      message: `❌ Критична помилка виконання`,
      error: error.message,
      executionTime,
      details: errorAnalysis.details,
      suggestion: errorAnalysis.suggestion,
      errorType: 'critical'
    };
  }
}

// Функція для аналізу SQL контенту
function analyzeSQLContent(sql: string) {
  const lowerSQL = sql.toLowerCase();
  
  // Извлекаем созданные таблицы
  const tableMatches = sql.match(/create\s+table\s+(?:if\s+not\s+exists\s+)?(\w+)/gi) || [];
  const tablesCreated = tableMatches.map(match => {
    const parts = match.split(/\s+/);
    return parts[parts.length - 1];
  });
  
  // Извлекаем созданные функции
  const functionMatches = sql.match(/create\s+(?:or\s+replace\s+)?function\s+(\w+)/gi) || [];
  const functionsCreated = functionMatches.map(match => {
    const parts = match.split(/\s+/);
    return parts[parts.length - 1];
  });
  
  // Подсчитываем statements
  const statements = sql.split(';').filter(s => s.trim().length > 0);
  
  return {
    tablesCreated,
    functionsCreated,
    statementCount: statements.length,
    hasDropStatements: lowerSQL.includes('drop'),
    hasAlterStatements: lowerSQL.includes('alter'),
    hasIfExists: lowerSQL.includes('if exists'),
    complexity: statements.length > 10 ? 'high' : statements.length > 5 ? 'medium' : 'low'
  };
}

// Функція для аналізу повідомлень про помилки
function analyzeErrorMessage(errorMessage: string) {
  const lowerError = errorMessage.toLowerCase();
  
  if (lowerError.includes('relation') && lowerError.includes('does not exist')) {
    return {
      type: 'relation_not_found',
      details: 'Таблиця або представлення не існує в базі даних',
      suggestion: 'Перевірте назву таблиці та виконайте необхідні міграції'
    };
  }
  
  if (lowerError.includes('function') && lowerError.includes('does not exist')) {
    return {
      type: 'function_not_found',
      details: 'Функція не знайдена в базі даних',
      suggestion: 'Перевірте назву функції та її параметри, або створіть функцію'
    };
  }
  
  if (lowerError.includes('syntax error')) {
    return {
      type: 'syntax_error',
      details: 'Синтаксична помилка в SQL коді',
      suggestion: 'Перевірте правильність SQL синтаксису'
    };
  }
  
  if (lowerError.includes('permission denied')) {
    return {
      type: 'permission_denied',
      details: 'Недостатньо прав для виконання операції',
      suggestion: 'Зверніться до адміністратора для надання прав'
    };
  }
  
  if (lowerError.includes('already exists')) {
    return {
      type: 'already_exists',
      details: 'Об\'єкт з такою назвою вже існує',
      suggestion: 'Використайте IF NOT EXISTS або видаліть існуючий об\'єкт'
    };
  }
  
  return {
    type: 'unknown',
    details: 'Невизначена помилка бази даних',
    suggestion: 'Перевірте SQL код та підключення до бази даних'
  };
}

export async function deleteSQLFile(fileName: string): Promise<void> {
  try {
    // Симулюємо затримку видалення
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Рідкісна симуляція помилки (5% випадків)
    if (Math.random() < 0.05) {
      throw new Error('Не вдалося видалити файл: файл використовується іншим процесом');
    }

    // Зберігаємо файл як видалений в localStorage
    const deletedFiles = JSON.parse(localStorage.getItem('deletedSQLFiles') || '[]') as string[];
    
    if (!deletedFiles.includes(fileName)) {
      deletedFiles.push(fileName);
      localStorage.setItem('deletedSQLFiles', JSON.stringify(deletedFiles));
    }

    console.log(`Файл ${fileName} помічено як видалений`);
  } catch (error) {
    console.error('Помилка видалення файлу:', error);
    throw error;
  }
}

// Функція для відновлення всіх видалених файлів (для розробки)
export function restoreAllDeletedFiles(): void {
  localStorage.removeItem('deletedSQLFiles');
  console.log('Всі видалені файли відновлено');
}

// Функція для отримання списку видалених файлів
export function getDeletedFiles(): string[] {
  return JSON.parse(localStorage.getItem('deletedSQLFiles') || '[]');
}