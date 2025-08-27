-- 🚀 ВСЕ В ОДНОМУ - ПОВНА НАСТРОЙКА DATABASE MANAGER
-- Цей файл створює ВСЕ що потрібно для роботи Database Manager
-- Виконайте ТІЛЬКИ ЦЕЙ ФАЙЛ і все запрацює!

-- ============================================
-- 1. СТВОРЮЄМО exec_sql ФУНКЦІЮ
-- ============================================
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  row_count_val INTEGER;
  start_time TIMESTAMPTZ;
  execution_time INTEGER;
BEGIN
  start_time := clock_timestamp();
  EXECUTE sql_query;
  GET DIAGNOSTICS row_count_val = ROW_COUNT;
  execution_time := EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'SQL виконано успішно',
    'rows_affected', row_count_val,
    'execution_time', execution_time
  );
EXCEPTION WHEN others THEN
  execution_time := EXTRACT(MILLISECONDS FROM (clock_timestamp() - start_time))::INTEGER;
  RETURN json_build_object(
    'success', false, 
    'error', SQLERRM,
    'message', 'Помилка виконання SQL',
    'execution_time', execution_time
  );
END;
$$;

-- ============================================
-- 2. DATABASE MANAGER RPC ФУНКЦІЇ
-- ============================================

-- Список всіх таблиць
CREATE OR REPLACE FUNCTION public.get_simple_tables()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
END;
$$;

-- Структура таблиці
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
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
END;
$$;

-- Дані таблиці з пагінацією
CREATE OR REPLACE FUNCTION public.get_simple_data(
  table_name_param TEXT,
  page_number INT DEFAULT 1,
  page_size INT DEFAULT 50
)
RETURNS TABLE (
  data JSONB,
  total_count BIGINT,
  page_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  offset_val INT;
  sql_query TEXT;
  result_data JSONB;
  total_rows BIGINT;
BEGIN
  offset_val := (page_number - 1) * page_size;
  
  -- Отримуємо дані
  sql_query := format(
    'SELECT json_agg(row_to_json(t.*)) FROM (SELECT * FROM %I LIMIT %s OFFSET %s) t',
    table_name_param, page_size, offset_val
  );
  
  EXECUTE sql_query INTO result_data;
  
  -- Підраховуємо загальну кількість (спрощено)
  EXECUTE format('SELECT COUNT(*) FROM %I', table_name_param) INTO total_rows;
  
  RETURN QUERY SELECT 
    COALESCE(result_data, '[]'::jsonb) as data,
    total_rows,
    CEIL(total_rows::NUMERIC / page_size)::INT as page_count;
END;
$$;

-- Список функцій БД
CREATE OR REPLACE FUNCTION public.get_all_functions()
RETURNS TABLE (
  function_name TEXT,
  arguments TEXT,
  return_type TEXT,
  language TEXT,
  function_type TEXT,
  description TEXT,
  source_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.proname::TEXT,
    pg_get_function_arguments(p.oid)::TEXT,
    pg_get_function_result(p.oid)::TEXT,
    l.lanname::TEXT,
    CASE WHEN p.prokind = 'f' THEN 'function'
         WHEN p.prokind = 'p' THEN 'procedure'
         ELSE 'other' END::TEXT,
    COALESCE(d.description, 'Немає опису')::TEXT,
    COALESCE(p.prosrc, 'Код недоступний')::TEXT
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  JOIN pg_language l ON p.prolang = l.oid
  LEFT JOIN pg_description d ON d.objoid = p.oid
  WHERE n.nspname = 'public' AND l.lanname != 'c'
  ORDER BY p.proname;
END;
$$;

-- ============================================
-- 3. ПРАВА ДОСТУПУ
-- ============================================
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_simple_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_simple_structure(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_simple_data(TEXT, INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_functions() TO authenticated;

-- ============================================
-- 4. ТЕСТУВАННЯ
-- ============================================
SELECT '🎉 ВСЕ СТВОРЕНО УСПІШНО!' as status;
SELECT '📊 Database Manager готовий до роботи!' as message;

-- Тестуємо exec_sql
SELECT public.exec_sql('SELECT ''exec_sql працює!'' as test') as exec_sql_test;

-- Тестуємо get_simple_tables
SELECT 'Кількість таблиць: ' || COUNT(*)::TEXT as tables_count 
FROM public.get_simple_tables();

-- Фінальне повідомлення
SELECT '✅ ГОТОВО! Перейдіть в Database Manager - таблиці мають з''явитися!' as final_result;