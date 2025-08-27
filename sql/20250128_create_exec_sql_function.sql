-- Міграція: Створення функції exec_sql для SQL Manager
-- Дата: 2025-01-28
-- Опис: Створює безпечну функцію для виконання SQL запитів через SQL Manager

-- 1. Функція для виконання довільних SQL запитів
CREATE OR REPLACE FUNCTION public.exec_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_data JSON;
  affected_rows INTEGER := 0;
  execution_start TIMESTAMP;
  execution_end TIMESTAMP;
  execution_time_ms INTEGER;
  query_type TEXT;
  is_select BOOLEAN := FALSE;
BEGIN
  -- Записуємо час початку виконання
  execution_start := clock_timestamp();
  
  -- Визначаємо тип запиту
  query_type := UPPER(TRIM(SPLIT_PART(sql_query, ' ', 1)));
  is_select := query_type = 'SELECT' OR query_type = 'WITH';
  
  -- Обмеження безпеки: заборонені небезпечні операції
  IF query_type IN ('DROP', 'TRUNCATE', 'DELETE') AND sql_query NOT LIKE '%WHERE%' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Небезпечна операція відхилена: ' || query_type || ' без умови WHERE',
      'error', 'SECURITY_VIOLATION',
      'execution_time_ms', 0
    );
  END IF;
  
  -- Заборонені команди
  IF query_type IN ('ALTER', 'CREATE', 'DROP') AND current_user != 'postgres' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'DDL операції дозволені тільки для адміністраторів',
      'error', 'PERMISSION_DENIED',
      'execution_time_ms', 0
    );
  END IF;
  
  BEGIN
    -- Виконуємо запит
    IF is_select THEN
      -- Для SELECT запитів повертаємо дані
      EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || sql_query || ') t' INTO result_data;
      
      -- Підраховуємо кількість рядків
      EXECUTE 'SELECT COUNT(*) FROM (' || sql_query || ') t' INTO affected_rows;
      
    ELSE
      -- Для інших запитів виконуємо та повертаємо статус
      EXECUTE sql_query;
      GET DIAGNOSTICS affected_rows = ROW_COUNT;
      
      result_data := json_build_object(
        'message', 'Запит виконано успішно',
        'affected_rows', affected_rows
      );
    END IF;
    
    -- Обчислюємо час виконання
    execution_end := clock_timestamp();
    execution_time_ms := EXTRACT(MILLISECONDS FROM (execution_end - execution_start))::INTEGER;
    
    -- Формуємо успішну відповідь
    RETURN json_build_object(
      'success', true,
      'data', COALESCE(result_data, '[]'::json),
      'affected_rows', affected_rows,
      'execution_time_ms', execution_time_ms,
      'query_type', query_type,
      'message', CASE 
        WHEN is_select THEN 'SELECT запит виконано успішно' 
        ELSE 'Запит виконано успішно' 
      END
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Обробка помилок
    execution_end := clock_timestamp();
    execution_time_ms := EXTRACT(MILLISECONDS FROM (execution_end - execution_start))::INTEGER;
    
    RETURN json_build_object(
      'success', false,
      'message', 'Помилка виконання запиту: ' || SQLERRM,
      'error', SQLSTATE,
      'execution_time_ms', execution_time_ms,
      'query_type', query_type
    );
  END;
END;
$$;

-- 2. Функція для безпечного виконання SELECT запитів з лімітом
CREATE OR REPLACE FUNCTION public.exec_select(sql_query TEXT, row_limit INTEGER DEFAULT 100)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  limited_query TEXT;
  result_data JSON;
  total_rows INTEGER := 0;
  execution_time_ms INTEGER;
  execution_start TIMESTAMP;
  execution_end TIMESTAMP;
BEGIN
  execution_start := clock_timestamp();
  
  -- Перевіряємо що це SELECT запит
  IF UPPER(TRIM(SPLIT_PART(sql_query, ' ', 1))) != 'SELECT' THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Ця функція підтримує тільки SELECT запити',
      'error', 'INVALID_QUERY_TYPE'
    );
  END IF;
  
  BEGIN
    -- Спочатку підраховуємо загальну кількість без ліміту
    EXECUTE 'SELECT COUNT(*) FROM (' || sql_query || ') t' INTO total_rows;
    
    -- Додаємо ліміт до запиту
    limited_query := sql_query || ' LIMIT ' || row_limit;
    
    -- Виконуємо обмежений запит
    EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || limited_query || ') t' INTO result_data;
    
    execution_end := clock_timestamp();
    execution_time_ms := EXTRACT(MILLISECONDS FROM (execution_end - execution_start))::INTEGER;
    
    RETURN json_build_object(
      'success', true,
      'data', COALESCE(result_data, '[]'::json),
      'total_rows', total_rows,
      'returned_rows', LEAST(total_rows, row_limit),
      'limited', total_rows > row_limit,
      'execution_time_ms', execution_time_ms,
      'message', 'SELECT запит виконано успішно (показано ' || LEAST(total_rows, row_limit) || ' з ' || total_rows || ' рядків)'
    );
    
  EXCEPTION WHEN OTHERS THEN
    execution_end := clock_timestamp();
    execution_time_ms := EXTRACT(MILLISECONDS FROM (execution_end - execution_start))::INTEGER;
    
    RETURN json_build_object(
      'success', false,
      'message', 'Помилка виконання SELECT запиту: ' || SQLERRM,
      'error', SQLSTATE,
      'execution_time_ms', execution_time_ms
    );
  END;
END;
$$;

-- 3. Функція для перевірки синтаксису SQL без виконання
CREATE OR REPLACE FUNCTION public.validate_sql(sql_query TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  BEGIN
    -- Намагаємося підготувати запит (без виконання)
    EXECUTE 'EXPLAIN (FORMAT JSON) ' || sql_query INTO result;
    
    RETURN json_build_object(
      'valid', true,
      'message', 'SQL синтаксис коректний',
      'plan', result
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'valid', false,
      'message', 'Помилка SQL синтаксису: ' || SQLERRM,
      'error', SQLSTATE
    );
  END;
END;
$$;

-- 4. Функція для отримання схеми таблиці
CREATE OR REPLACE FUNCTION public.describe_table_detailed(table_name_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Отримуємо детальну інформацію про таблицю
  SELECT json_build_object(
    'table_name', table_name_param,
    'columns', (
      SELECT json_agg(
        json_build_object(
          'column_name', column_name,
          'data_type', data_type,
          'is_nullable', is_nullable = 'YES',
          'column_default', column_default,
          'character_maximum_length', character_maximum_length,
          'numeric_precision', numeric_precision,
          'numeric_scale', numeric_scale
        ) ORDER BY ordinal_position
      )
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = table_name_param
    ),
    'constraints', (
      SELECT json_agg(
        json_build_object(
          'constraint_name', constraint_name,
          'constraint_type', constraint_type
        )
      )
      FROM information_schema.table_constraints
      WHERE table_schema = 'public' AND table_name = table_name_param
    ),
    'row_count', (
      SELECT COALESCE(n_live_tup, 0)
      FROM pg_stat_user_tables 
      WHERE relname = table_name_param
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 5. Функція для отримання списку всіх доступних таблиць та view
CREATE OR REPLACE FUNCTION public.get_database_objects()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'tables', (
      SELECT json_agg(
        json_build_object(
          'name', tablename,
          'type', 'table',
          'owner', tableowner
        ) ORDER BY tablename
      )
      FROM pg_tables 
      WHERE schemaname = 'public'
    ),
    'views', (
      SELECT json_agg(
        json_build_object(
          'name', viewname,
          'type', 'view',
          'owner', viewowner
        ) ORDER BY viewname
      )
      FROM pg_views 
      WHERE schemaname = 'public'
    ),
    'functions', (
      SELECT json_agg(
        json_build_object(
          'name', proname,
          'type', 'function'
        ) ORDER BY proname
      )
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.prokind = 'f'
    )
  ) INTO result;
  
  RETURN result;
END;
$$;

-- Права доступу
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exec_select(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.describe_table_detailed(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_database_objects() TO authenticated;

-- Коментарі
COMMENT ON FUNCTION public.exec_sql(TEXT) IS 'Виконує довільні SQL запити з обмеженнями безпеки';
COMMENT ON FUNCTION public.exec_select(TEXT, INTEGER) IS 'Безпечне виконання SELECT запитів з лімітом рядків';
COMMENT ON FUNCTION public.validate_sql(TEXT) IS 'Перевіряє синтаксис SQL без виконання';
COMMENT ON FUNCTION public.describe_table_detailed(TEXT) IS 'Отримує детальну схему таблиці у форматі JSON';
COMMENT ON FUNCTION public.get_database_objects() IS 'Отримує список всіх таблиць, view та функцій';

-- Перевірка створення
SELECT 'Функції SQL Manager створено успішно!' as result;

-- Тестування exec_sql
SELECT 'Тестування exec_sql...' as test_status;
SELECT public.exec_sql('SELECT ''Функція exec_sql працює!'' as test_message, now() as current_time') as test_result;