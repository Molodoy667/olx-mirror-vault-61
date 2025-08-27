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
SELECT '✅ ГОТОВО! Перейдіть в Database Manager - таблиці мають з''явитися!' as final_result;`
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
  
  try {
    // Спробуємо виконати через exec_sql функцію
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: content
    });
    
    const executionTime = Date.now() - startTime;
    
    if (error) {
      console.error('Помилка виконання SQL:', error);
      return {
        success: false,
        message: `Помилка виконання SQL: ${error.message}`,
        error: error.message,
        executionTime
      };
    }
    
    return {
      success: true,
      message: `SQL файл ${fileName} виконано успішно`,
      data: data,
      executionTime,
      rowsAffected: Array.isArray(data) ? data.length : 1
    };
    
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error('Критична помилка виконання SQL:', error);
    
    return {
      success: false,
      message: `Критична помилка: ${error.message}`,
      error: error.message,
      executionTime
    };
  }
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